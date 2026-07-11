import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

// Interfaces based on user's specified schema

export interface PaymentSettings {
  upi: {
    upiId: string;
    qrCodeUrl: string;
    accountHolder: string;
    enabled: boolean;
  };
  razorpay: {
    keyId: string;
    keySecret: string;
    testMode: boolean;
    enabled: boolean;
  };
  bank: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
    qrCodeUrl: string;
    enabled: boolean;
  };
}

export interface WhatsAppSettings {
  number: string;
  supportLink: string;
  supportMessage: string;
  buttonEnabled: boolean;
  businessHours: string;
  iconUrl: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id?: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  vendorId: string;
  vendorName?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'upi' | 'bank' | 'razorpay';
  paymentStatus: 'pending' | 'screenshot_uploaded' | 'waiting_verification' | 'screenshot_rejected' | 'confirmed' | 'failed';
  orderStatus: 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  screenshotUrl?: string;
  utr?: string;
  paymentDateTime?: string;
  paymentNote?: string;
  rejectionReason?: string;
  assignedToVendor?: string;
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'vendor';
  phone?: string;
}

export interface AuditLog {
  id?: string;
  action: string;
  adminId: string;
  adminEmail?: string;
  orderId: string;
  reason?: string;
  timestamp: any;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

// Default initializers for Payment and WhatsApp Settings

const defaultPaymentSettings: PaymentSettings = {
  upi: {
    upiId: 'payment@upi',
    qrCodeUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff270190?auto=format&fit=crop&w=400&q=80',
    accountHolder: 'Ecommerce Admin',
    enabled: true
  },
  razorpay: {
    keyId: 'rzp_test_keysid123456',
    keySecret: 'rzp_test_secret123456',
    testMode: true,
    enabled: false
  },
  bank: {
    bankName: 'HDFC Bank',
    accountHolder: 'Ecommerce Platform Ltd',
    accountNumber: '50200012345678',
    ifsc: 'HDFC0000123',
    branch: 'Main City Branch',
    qrCodeUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff270190?auto=format&fit=crop&w=400&q=80',
    enabled: true
  }
};

const defaultWhatsAppSettings: WhatsAppSettings = {
  number: '+919103500592',
  supportLink: 'https://wa.me/919103500592',
  supportMessage: 'Hello Support, I need help with my order.',
  buttonEnabled: true,
  businessHours: '9:00 AM - 6:00 PM IST',
  iconUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=100&q=80'
};

// ========================================================
// Settings Management (Payment & WhatsApp)
// ========================================================

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const docRef = doc(db, 'settings', 'payment');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultPaymentSettings, ...docSnap.data() } as PaymentSettings;
    } else {
      await setDoc(docRef, defaultPaymentSettings);
      return defaultPaymentSettings;
    }
  } catch (error) {
    console.error('Error fetching payment settings from Firestore:', error);
    return defaultPaymentSettings;
  }
}

export async function savePaymentSettings(settings: PaymentSettings): Promise<void> {
  const docRef = doc(db, 'settings', 'payment');
  await setDoc(docRef, settings);
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  try {
    const docRef = doc(db, 'settings', 'whatsapp');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultWhatsAppSettings, ...docSnap.data() } as WhatsAppSettings;
    } else {
      await setDoc(docRef, defaultWhatsAppSettings);
      return defaultWhatsAppSettings;
    }
  } catch (error) {
    console.error('Error fetching WhatsApp settings from Firestore:', error);
    return defaultWhatsAppSettings;
  }
}

export async function saveWhatsAppSettings(settings: WhatsAppSettings): Promise<void> {
  const docRef = doc(db, 'settings', 'whatsapp');
  await setDoc(docRef, settings);
}

// ========================================================
// User Management
// ========================================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const docRef = doc(db, 'users', profile.uid);
  await setDoc(docRef, profile, { merge: true });
}

// ========================================================
// Order Operations & UTR Deduplication
// ========================================================

export async function checkDuplicateUtr(utr: string, currentOrderId?: string): Promise<boolean> {
  if (!utr || utr.trim() === '') return false;
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('utr', '==', utr.trim()));
    const querySnapshot = await getDocs(q);
    
    let isDup = false;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Order;
      if (currentOrderId) {
        if (data.orderId !== currentOrderId) {
          isDup = true;
        }
      } else {
        isDup = true;
      }
    });
    return isDup;
  } catch (error) {
    console.error('Error checking duplicate UTR:', error);
    return false;
  }
}

export async function createOrder(order: Omit<Order, 'createdAt' | 'updatedAt'>): Promise<string> {
  const ordersRef = collection(db, 'orders');
  const newDocRef = doc(ordersRef, order.orderId);
  const fullOrder = {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(newDocRef, fullOrder);
  return order.orderId;
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Order;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    return orders;
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
}

export async function getOrdersByVendor(vendorId: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    // Gating check: Vendors can only read orders where paymentStatus == 'confirmed'
    const q = query(
      ordersRef, 
      where('vendorId', '==', vendorId), 
      where('paymentStatus', '==', 'confirmed'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    return orders;
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    return [];
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    return orders;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
}

// ========================================================
// Audit Logs
// ========================================================

export async function createAuditLog(log: Omit<AuditLog, 'timestamp'>): Promise<void> {
  try {
    const logsRef = collection(db, 'audit_logs');
    await addDoc(logsRef, {
      ...log,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const logsRef = collection(db, 'audit_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    const logs: AuditLog[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
    });
    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

// ========================================================
// Notifications System
// ========================================================

export async function createNotification(userId: string, title: string, message: string): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      title,
      message,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export function subscribeNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef, 
    where('userId', '==', userId), 
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifs: Notification[] = [];
    snapshot.forEach((docSnap) => {
      notifs.push({ id: docSnap.id, ...docSnap.data() } as Notification);
    });
    callback(notifs);
  }, (err) => {
    console.warn('Notification subscription silent failure (falling back):', err);
  });
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  try {
    const docRef = doc(db, 'notifications', notifId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}
