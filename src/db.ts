import { User, Vendor, Product, Order, RFQ, Quotation, SupportTicket, Blog, Notification, Review, WhatsAppSettings, WhatsAppClickLog, Category, Brand, CategoryRequest, BrandRequest, AuditLog } from './types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_BLOGS, DEFAULT_SUPER_ADMIN, INITIAL_BRANDS } from './data';
import { getSliceUpiQrDataUrl, SLICE_UPI_ID, SLICE_HOLDER_NAME } from './utils/sliceQrSvg';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db, isQuotaExceeded, auth } from './firebase';
import { 
  addOrder as addOrderToSheets, 
  getOrders as getOrdersFromSheets, 
  updateOrderStatus as updateOrderStatusInSheets, 
  addUser as addUserToSheets, 
  getProducts as getProductsFromSheets,
} from './lib/sheets';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to recursively strip undefined properties from objects before sending to Firestore
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned as T;
}

// Track quota status so we gracefully fall back to local storage without spamming errors
let isFirestoreQuotaExceeded = true; // Permanently disabled Firebase Firestore integration as requested
const syncedHashes = new Map<string, string>();
const activeUnsubscribes: Array<() => void> = [];

function checkQuotaError(e: any): boolean {
  if (isQuotaExceeded || (e && (e.code === 'resource-exhausted' || e.message?.includes('resource-exhausted') || e.message?.includes('Quota limit exceeded')))) {
    if (!isFirestoreQuotaExceeded) {
      isFirestoreQuotaExceeded = true;
      console.warn('Firestore daily write quota exceeded or rate limit reached. Application has switched cleanly to local storage persistence.');
      // Immediately terminate all active Firestore snapshot subscriptions to stop background retry spam
      while (activeUnsubscribes.length > 0) {
        const unsub = activeUnsubscribes.pop();
        try { unsub?.(); } catch (err) {}
      }
    }
    return true;
  }
  return false;
}

// Helper to seed a collection if empty in Firestore
async function seedCollectionIfEmpty<T extends { id: string }>(collName: string, defaultData: T[]) {
  if (isQuotaExceeded || isFirestoreQuotaExceeded) return;
  try {
    const collRef = collection(db, collName);
    const snap = await getDocs(collRef);
    if (snap.empty) {
      console.log(`Seeding Firestore collection '${collName}' with ${defaultData.length} records...`);
      for (const item of defaultData) {
        if (!item.id || isQuotaExceeded || isFirestoreQuotaExceeded) continue;
        try {
          const sanitized = sanitizeForFirestore(item);
          await setDoc(doc(db, collName, item.id), sanitized);
          syncedHashes.set(`${collName}/${item.id}`, JSON.stringify(sanitized));
        } catch (err: any) {
          if (err?.code === 'permission-denied' || err?.message?.includes('permission-denied')) {
            handleFirestoreError(err, OperationType.WRITE, `${collName}/${item.id}`);
          }
          if (checkQuotaError(err)) break;
        }
      }
    } else {
      snap.forEach(docSnap => {
        syncedHashes.set(`${collName}/${docSnap.id}`, JSON.stringify(docSnap.data()));
      });
    }
  } catch (e: any) {
    if (e?.code === 'permission-denied' || e?.message?.includes('permission-denied')) {
      handleFirestoreError(e, OperationType.GET, collName);
    }
    if (!checkQuotaError(e)) {
      console.warn(`Note: Could not check or seed collection '${collName}' (using local storage):`, e.message || e);
    }
  }
}

// Helper to sync modified list to Firestore without redundant writes
async function syncListToFirestoreWithDeletions<T extends { id: string }>(collName: string, items: T[], existingLocalItems: T[]) {
  if (isQuotaExceeded || isFirestoreQuotaExceeded) return;
  try {
    const existingMap = new Map<string, string>();
    if (existingLocalItems && Array.isArray(existingLocalItems)) {
      for (const old of existingLocalItems) {
        if (old?.id) {
          existingMap.set(old.id, JSON.stringify(sanitizeForFirestore(old)));
        }
      }
    }

    // Write only genuinely added or updated items
    for (const item of items) {
      if (!item.id || isQuotaExceeded || isFirestoreQuotaExceeded) continue;
      const sanitized = sanitizeForFirestore(item);
      const serialized = JSON.stringify(sanitized);
      const hashKey = `${collName}/${item.id}`;

      // Skip write if doc matches what we last synced or matches previous local state exactly
      if (syncedHashes.get(hashKey) === serialized) continue;
      if (existingMap.get(item.id) === serialized && syncedHashes.has(hashKey)) continue;

      try {
        await setDoc(doc(db, collName, item.id), sanitized);
        syncedHashes.set(hashKey, serialized);
      } catch (err: any) {
        if (err?.code === 'permission-denied' || err?.message?.includes('permission-denied')) {
          handleFirestoreError(err, OperationType.WRITE, hashKey);
        }
        if (checkQuotaError(err)) break;
      }
    }

    // Delete items that are no longer in the list
    if (!isQuotaExceeded && !isFirestoreQuotaExceeded && existingLocalItems && Array.isArray(existingLocalItems)) {
      const incomingIds = new Set(items.map(item => item.id));
      for (const oldItem of existingLocalItems) {
        if (oldItem?.id && !incomingIds.has(oldItem.id)) {
          try {
            await deleteDoc(doc(db, collName, oldItem.id));
            syncedHashes.delete(`${collName}/${oldItem.id}`);
          } catch (err: any) {
            if (err?.code === 'permission-denied' || err?.message?.includes('permission-denied')) {
              handleFirestoreError(err, OperationType.DELETE, `${collName}/${oldItem.id}`);
            }
            if (checkQuotaError(err)) break;
          }
        }
      }
    }
  } catch (e: any) {
    if (e?.code === 'permission-denied' || e?.message?.includes('permission-denied')) {
      handleFirestoreError(e, OperationType.WRITE, collName);
    }
    if (!checkQuotaError(e)) {
      console.warn(`Error syncing list to Firestore collection '${collName}':`, e.message || e);
    }
  }
}

// Global active real-time listeners tracker to avoid multiple listener attachments
const activeListeners = new Set<string>();

// Real-time collection synchronization
function listenToCollection<T extends { id: string }>(collName: string, storageKey: string, defaultValue: T[]) {
  if (isQuotaExceeded || isFirestoreQuotaExceeded || activeListeners.has(collName)) return;
  activeListeners.add(collName);

  const collRef = collection(db, collName);
  const unsub = onSnapshot(collRef, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as T;
      items.push(data);
      if (data && data.id) {
        syncedHashes.set(`${collName}/${data.id}`, JSON.stringify(sanitizeForFirestore(data)));
      }
    });
    if (items.length > 0) {
      const serialized = JSON.stringify(items);
      const currentStored = localStorage.getItem(storageKey);
      if (currentStored !== serialized) {
        localStorage.setItem(storageKey, serialized);
        window.dispatchEvent(new Event('healnex_db_update'));
      }
    }
  }, (error: any) => {
    if (error?.code === 'permission-denied' || error?.message?.includes('permission-denied')) {
      handleFirestoreError(error, OperationType.GET, collName);
    }
    if (checkQuotaError(error)) {
      activeListeners.delete(collName);
    } else {
      console.warn(`Firestore subscription error on '${collName}':`, error);
    }
  });
  activeUnsubscribes.push(unsub);
}


const STORAGE_KEYS = {
  USERS: 'healnex_users',
  VENDORS: 'healnex_vendors',
  PRODUCTS: 'healnex_products',
  ORDERS: 'healnex_orders',
  RFQS: 'healnex_rfqs',
  QUOTATIONS: 'healnex_quotations',
  TICKETS: 'healnex_tickets',
  BLOGS: 'healnex_blogs',
  NOTIFICATIONS: 'healnex_notifications',
  REVIEWS: 'healnex_reviews',
  CURRENT_USER: 'healnex_current_user',
  PAYMENT_SETTINGS: 'healnex_payment_settings',
  WHATSAPP_SETTINGS: 'healnex_whatsapp_settings',
  WHATSAPP_CLICK_LOGS: 'healnex_whatsapp_click_logs',
  CLEARANCE_REQUESTS: 'healnex_clearance_requests',
  PROMO_BANNERS: 'healnex_promo_banners',
  CATEGORIES: 'healnex_categories',
  BRANDS: 'healnex_brands',
  CATEGORY_REQUESTS: 'healnex_category_requests',
  BRAND_REQUESTS: 'healnex_brand_requests',
  COMMISSION_SETTINGS: 'healnex_commission_settings'
};

import { PaymentSettings, PaymentClearanceRequest, PromoBanner, CommissionSettings } from './types';

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
  id: 'global_commission_settings',
  enabled: true,
  globalPercent: 7,
  categoryPercents: {},
  brandPercents: {},
  vendorPercents: {}
};

export const DEFAULT_PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'banner-1',
    title: 'Advanced ICU Ventilators & Critical Care Suite',
    subtitle: 'German-calibrated precision medical systems with 3-year on-site clinical warranty & instant dispatch.',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1600',
    badgeText: 'ICU EXCLUSIVES',
    buttonText: 'Explore ICU Catalog',
    linkUrl: '#products',
    positionOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'banner-2',
    title: 'Precision Patient Monitors & Telemetry Hubs',
    subtitle: 'Real-time multi-parameter vital tracking for modern hospital networks and surgical wards.',
    imageUrl: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&q=80&w=1600',
    badgeText: 'CLINICAL GRADE',
    buttonText: 'View Monitors',
    linkUrl: '#products',
    positionOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  id: 'global_payment_settings',
  razorpayEnabled: false,
  razorpayKeyId: 'rzp_test_Hnx19283746',
  razorpaySecret: 'shh_secret_91823746',
  razorpayMode: 'test',
  
  upiEnabled: true,
  upiId: SLICE_UPI_ID,
  upiHolderName: SLICE_HOLDER_NAME,
  upiQrCodeUrl: getSliceUpiQrDataUrl(),
  upiInstructions: 'Scan the Slice UPI QR code using any UPI app (GPay, PhonePe, Paytm, Slice) to pay directly to Warisul Islam.',

  creditCardEnabled: true,
  creditCardHolderName: 'HealNex Medi Bazar Pvt Ltd',
  creditCardNumber: '4532 •••• •••• 8890',
  creditCardExpiry: '12/28',
  creditCardCvv: '***',
  creditCardBankName: 'HDFC Corporate Card Clearing',
  creditCardInstructions: 'Transfer via B2B corporate card payment link or POS. Capture and upload your transaction receipt.',

  debitCardEnabled: true,
  debitCardHolderName: 'HealNex Medi Bazar Pvt Ltd',
  debitCardNumber: '5591 •••• •••• 4421',
  debitCardExpiry: '10/27',
  debitCardBankName: 'ICICI Bank B2B Merchant Clearing',
  debitCardInstructions: 'Transfer via merchant debit card gateway or POS. Upload transaction confirmation slip.',

  netBankingEnabled: true,
  netBankingHolderName: 'HealNex Medi Bazar Private Limited',
  netBankingAccountNumber: '50200098765432',
  netBankingIfsc: 'HDFC0001234',
  netBankingBankName: 'HDFC Bank Ltd',
  netBankingBranch: 'Senapati Bapat Road, Pune',
  netBankingQrCodeUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff270190',
  netBankingInstructions: 'Add beneficiary or transfer NEFT/RTGS/IMPS directly to account number. Upload payment advice screenshot.',

  bankEnabled: true,
  bankHolderName: 'HealNex Medi Bazar Private Limited',
  bankName: 'HDFC Bank Ltd',
  bankAccountNumber: '50200098765432',
  bankIfsc: 'HDFC0001234',
  bankBranch: 'Senapati Bapat Road, Pune',
  bankQrCodeUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff270190',
  bankInstructions: 'Transfer via NEFT/RTGS/IMPS to corporate account. Upload payment screenshot.',

  platformCommissionRate: 10,
  minimumPayoutLimit: 500,
  gstRateOnCommission: 18
};

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
  id: 'global_whatsapp_settings',
  enabled: true,
  phoneNumber: '+919103500592',
  businessLink: 'https://wa.me/919103500592',
  defaultMessage: 'Hello Healnex Medi Bazar Support. My name is {CustomerName}. I need help with Order #{OrderNumber} regarding {ProductName}.',
  position: 'floating',
  buttonText: 'Chat on WhatsApp (9103500592)',
  showOnAllScreens: true,
  selectedScreens: ['Home', 'ProductDetails', 'Cart', 'Checkout', 'Orders', 'Profile', 'HelpSupport']
};


// Seed initial users if empty
const DEFAULT_USERS: User[] = [
  { ...DEFAULT_SUPER_ADMIN, password: 'Waris@123' },
  {
    id: 'customer-sharma',
    name: 'Dr. Ramesh Sharma',
    email: 'doctor.sharma@hospital.com',
    role: 'customer',
    phone: '+91 94432 10987',
    password: 'password',
    isVerified: true,
    createdAt: '2026-06-10T12:00:00Z'
  },
  {
    id: 'vendor-medilink',
    name: 'MediLink Systems',
    email: 'vendor.medilink@healnex.com',
    role: 'vendor',
    phone: '+91 88877 66554',
    password: 'password',
    isVerified: true,
    createdAt: '2026-06-12T09:00:00Z'
  },
  {
    id: 'vendor-hightech',
    name: 'HighTech Diagnostics',
    email: 'vendor.hightech@healnex.com',
    role: 'vendor',
    phone: '+91 77766 55443',
    password: 'password',
    isVerified: true,
    createdAt: '2026-06-25T14:00:00Z'
  }
];

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'vendor-medilink',
    companyName: 'MediLink Systems Private Limited',
    ownerName: 'Waqas Ahmad',
    email: 'vendor.medilink@healnex.com',
    mobileNumber: '+91 88877 66554',
    gstNumber: '27AAAAA1111A1Z1',
    panNumber: 'AAAAA1111A',
    aadhaarNumber: '123456789012',
    businessAddress: '402, Elite Business Hub, S.G. Highway',
    state: 'Gujarat',
    district: 'Ahmedabad',
    pincode: '380054',
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0000123'
    },
    documents: {
      gstCertificateUrl: 'gst_certificate.pdf',
      panCardUrl: 'pan_card.jpg',
      aadhaarCardUrl: 'aadhaar_card.jpg'
    },
    status: 'Approved',
    trustSeal: true,
    trustSealLevel: 'Verified Clinical Supplier',
    createdAt: '2026-06-12T09:15:00Z'
  },
  {
    id: 'vendor-hightech',
    companyName: 'HighTech Diagnostics Ltd',
    ownerName: 'John Doe',
    email: 'vendor.hightech@healnex.com',
    mobileNumber: '+91 77766 55443',
    gstNumber: '27BBBBB2222B2Z2',
    panNumber: 'BBBBB2222B',
    aadhaarNumber: '987654321098',
    businessAddress: '99 Tech Galleria, Electronic City Phase 1',
    state: 'Karnataka',
    district: 'Bengaluru',
    pincode: '560100',
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumber: '30211122233',
      ifscCode: 'SBIN0001234'
    },
    documents: {
      gstCertificateUrl: 'hightech_gst.pdf',
      panCardUrl: 'hightech_pan.jpg',
      aadhaarCardUrl: 'hightech_aadhaar.jpg'
    },
    status: 'Pending',
    createdAt: '2026-06-25T14:10:00Z'
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ORD-89324',
    customerId: 'customer-sharma',
    customerName: 'Dr. Ramesh Sharma',
    customerEmail: 'doctor.sharma@hospital.com',
    vendorId: 'vendor-medilink',
    vendorName: 'MediLink Systems Private Limited',
    items: [
      {
        productId: 'prod-ecg-12',
        productName: '12-Channel Electrocardiograph (ECG Machine)',
        productImage: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=400',
        price: 58000,
        quantity: 1,
        gstRate: 12,
        hsnCode: '90181100',
        vendorId: 'vendor-medilink',
        vendorName: 'MediLink Systems Private Limited'
      }
    ],
    totalAmount: 58000,
    gstAmount: 6960,
    discountAmount: 0,
    finalAmount: 64960,
    status: 'Delivered',
    paymentMethod: 'UPI',
    paymentId: 'pay_HN_982472912',
    shippingAddress: {
      address: 'City Hospital, Emergency Wing, Station Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001'
    },
    shippingProvider: 'Delhivery',
    trackingNumber: 'DEL123456789',
    timeline: [
      { status: 'Pending', time: '2026-06-20T10:00:00Z', note: 'Order placed successfully by Dr. Ramesh Sharma.' },
      { status: 'Confirmed', time: '2026-06-20T10:30:00Z', note: 'Order confirmed by MediLink Systems.' },
      { status: 'Processing', time: '2026-06-21T09:00:00Z', note: 'Product sanitization and clinical calibration complete.' },
      { status: 'Shipped', time: '2026-06-21T14:00:00Z', note: 'Dispatched via Delhivery Express.' },
      { status: 'Delivered', time: '2026-06-23T16:30:00Z', note: 'Received & signature verified.' }
    ],
    createdAt: '2026-06-20T10:00:00Z'
  }
];

const DEFAULT_RFQS: RFQ[] = [
  {
    id: 'RFQ-77123',
    customerId: 'customer-sharma',
    customerName: 'Dr. Ramesh Sharma',
    customerEmail: 'doctor.sharma@hospital.com',
    productName: 'High-Flow Oxygen Concentrators 10L',
    quantity: 10,
    budget: 450000,
    deliveryLocation: 'Fortis Clinic Network, Phase 3, Mohali',
    description: 'Require 10 units of CE certified Oxygen Concentrators with 10 LPM capacity. Continuous flow rate, low decibel operability, and integrated nebulizer function are critical parameters.',
    status: 'Open',
    createdAt: '2026-06-26T10:00:00Z',
    quotationsCount: 1
  }
];

const DEFAULT_QUOTATIONS: Quotation[] = [
  {
    id: 'QUO-103',
    rfqId: 'RFQ-77123',
    vendorId: 'vendor-medilink',
    vendorName: 'Waqas Ahmad',
    companyName: 'MediLink Systems Private Limited',
    pricePerUnit: 44000,
    totalPrice: 440000,
    validUntil: '2026-07-15',
    deliveryDays: 5,
    specifications: 'Offering the OxyFlow 10L model as requested. Includes dual nasal cannulas, integrated humidifier bottles, and 12 months full replacement warranty.',
    status: 'Pending',
    createdAt: '2026-06-27T11:30:00Z'
  }
];

const DEFAULT_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-29402',
    userId: 'customer-sharma',
    userName: 'Dr. Ramesh Sharma',
    userEmail: 'doctor.sharma@hospital.com',
    userRole: 'customer',
    category: 'Customer Support',
    subject: 'Delayed Shipping on Order #89324',
    description: 'Hi, I received my ECG machine, but the user manual booklet and calibration certificate are missing from the packaging box. Please dispatch them immediately.',
    status: 'In Progress',
    replies: [
      {
        id: 'rep-1',
        senderName: 'Dr. Ramesh Sharma',
        senderRole: 'customer',
        message: 'Hi, I received my ECG machine, but the user manual booklet and calibration certificate are missing from the packaging box. Please dispatch them immediately.',
        time: '2026-06-24T10:00:00Z',
        isStaff: false
      },
      {
        id: 'rep-2',
        senderName: 'Super Admin',
        senderRole: 'super_admin',
        message: 'Hello Dr. Sharma, we sincerely apologize for this oversight. I have contacted the vendor, MediLink Systems, to courier a printed copy of the calibration report. In the meantime, I have emailed a PDF copy of both documents to your inbox.',
        time: '2026-06-24T14:30:00Z',
        isStaff: true
      }
    ],
    createdAt: '2026-06-24T10:00:00Z'
  }
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'admin',
    title: 'New Vendor Registered',
    message: 'HighTech Diagnostics Ltd has applied for vendor status. Review their documents in the approval panel.',
    read: false,
    type: 'vendor_registered',
    createdAt: '2026-06-25T14:10:00Z'
  },
  {
    id: 'notif-2',
    userId: 'vendor-medilink',
    title: 'New RFQ Received',
    message: 'A new RFQ for "High-Flow Oxygen Concentrators 10L" matches your categories. Submit a quote now.',
    read: false,
    type: 'rfq_received',
    createdAt: '2026-06-26T10:05:00Z'
  }
];

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-ecg-12',
    customerId: 'customer-sharma',
    customerName: 'Dr. Ramesh Sharma',
    rating: 5,
    comment: 'Exceptional build quality. The 12-channel output is crisp, and the built-in automatic interpretation software has saved our diagnostic team precious time. Highly recommended.',
    createdAt: '2026-06-24T08:00:00Z'
  }
];

const DEFAULT_CLEARANCE_REQUESTS: PaymentClearanceRequest[] = [
  {
    id: 'CLR-10041',
    vendorId: 'vendor-medilink',
    vendorName: 'MediLink Healthcare Pvt Ltd',
    amount: 145000,
    ordersCount: 2,
    orderIds: ['ORD-84920', 'ORD-74839'],
    status: 'Pending',
    requestedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    payoutMethod: 'bank',
    grossSales: 161111,
    commissionRate: 10,
    commissionDeducted: 16111,
    netPayable: 145000,
    bankDetails: {
      bankName: 'ICICI Bank',
      accountNumber: '109201500392',
      ifscCode: 'ICIC0001092'
    },
    vendorNote: 'Requesting settlement clearance for completed hospital procurement orders.'
  }
];

// Database Helpers
export const dbLocal = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to LocalStorage: ', e);
    }
  },

  async init() {
    // Synchronous local state initialization for immediate rendering
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) this.set(STORAGE_KEYS.USERS, DEFAULT_USERS);
    if (!localStorage.getItem(STORAGE_KEYS.VENDORS)) this.set(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS);
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) this.set(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) this.set(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    if (!localStorage.getItem(STORAGE_KEYS.RFQS)) this.set(STORAGE_KEYS.RFQS, DEFAULT_RFQS);
    if (!localStorage.getItem(STORAGE_KEYS.QUOTATIONS)) this.set(STORAGE_KEYS.QUOTATIONS, DEFAULT_QUOTATIONS);
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) this.set(STORAGE_KEYS.TICKETS, DEFAULT_TICKETS);
    if (!localStorage.getItem(STORAGE_KEYS.BLOGS)) this.set(STORAGE_KEYS.BLOGS, INITIAL_BLOGS);
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) this.set(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) this.set(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS)) this.set(STORAGE_KEYS.PAYMENT_SETTINGS, [DEFAULT_PAYMENT_SETTINGS]);
    if (!localStorage.getItem(STORAGE_KEYS.WHATSAPP_SETTINGS)) this.set(STORAGE_KEYS.WHATSAPP_SETTINGS, [DEFAULT_WHATSAPP_SETTINGS]);
    if (!localStorage.getItem(STORAGE_KEYS.WHATSAPP_CLICK_LOGS)) this.set(STORAGE_KEYS.WHATSAPP_CLICK_LOGS, []);
    if (!localStorage.getItem(STORAGE_KEYS.CLEARANCE_REQUESTS)) this.set(STORAGE_KEYS.CLEARANCE_REQUESTS, DEFAULT_CLEARANCE_REQUESTS);
    if (!localStorage.getItem(STORAGE_KEYS.PROMO_BANNERS)) this.set(STORAGE_KEYS.PROMO_BANNERS, DEFAULT_PROMO_BANNERS);
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) this.set(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    if (!localStorage.getItem(STORAGE_KEYS.BRANDS)) this.set(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORY_REQUESTS)) this.set(STORAGE_KEYS.CATEGORY_REQUESTS, []);
    if (!localStorage.getItem(STORAGE_KEYS.BRAND_REQUESTS)) this.set(STORAGE_KEYS.BRAND_REQUESTS, []);
    if (!localStorage.getItem(STORAGE_KEYS.COMMISSION_SETTINGS)) this.set(STORAGE_KEYS.COMMISSION_SETTINGS, [DEFAULT_COMMISSION_SETTINGS]);
    
    // Do not auto-login by default to allow showing login screen on startup
    this.set(STORAGE_KEYS.CURRENT_USER, null);

    // Boot Google Sheets background sync
    this.syncDataFromSheets().catch(err => {
      console.warn('Initial Google Sheets synchronization failed:', err);
    });
  },

  async syncDataFromSheets() {
    try {
      console.log('[Sheets Sync] Starting sync of users, products, and orders from Google Sheets...');

      // 1. Sync products
      try {
        const sheetsProducts = await getProductsFromSheets();
        if (sheetsProducts && sheetsProducts.length > 0) {
          console.log(`[Sheets Sync] Synced ${sheetsProducts.length} products from Google Sheets.`);
          const localProds = this.getProducts();
          const mergedProds = [...localProds];
          for (const sp of sheetsProducts) {
            const idx = mergedProds.findIndex(p => p.id === sp.id);
            if (idx > -1) {
              mergedProds[idx] = { ...mergedProds[idx], ...sp, stockQuantity: sp.stock ?? mergedProds[idx].stockQuantity };
            } else {
              mergedProds.push({
                ...sp,
                sku: `SKU-${sp.id}`,
                description: `${sp.name} is a high-grade professional medical supply.`,
                brand: 'Healnex',
                subcategory: 'Clinical Supplies',
                images: [sp.image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80'],
                gstRate: 18,
                hsnCode: '9018',
                isVerified: true,
                vendorId: 'vendor-1',
                vendorName: 'Healnex Supplier Ltd',
                status: 'Approved',
                specifications: {},
                moq: 1,
                stockQuantity: sp.stock ?? 50,
              } as any);
            }
          }
          this.set(STORAGE_KEYS.PRODUCTS, mergedProds);
        }
      } catch (e) {
        console.warn('[Sheets Sync] Product sync failed:', e);
      }

      // 2. Sync orders
      try {
        const sheetsOrders = await getOrdersFromSheets();
        if (sheetsOrders && sheetsOrders.length > 0) {
          console.log(`[Sheets Sync] Synced ${sheetsOrders.length} orders from Google Sheets.`);
          const localOrders = this.getOrders();
          const mergedOrders = [...localOrders];
          for (const so of sheetsOrders) {
            const idx = mergedOrders.findIndex(o => o.id === so.id);
            if (idx > -1) {
              mergedOrders[idx] = { ...mergedOrders[idx], ...so };
            } else {
              mergedOrders.push({
                ...so,
                vendorId: so.vendorId || 'vendor-1',
                vendorName: so.vendorName || 'Healnex Supplier Ltd',
                paymentMethod: 'UPI',
                paymentTxId: so.paymentTxId || '',
                payment_method: 'UPI',
                orderStatus: so.status,
                paymentStatus: so.status === 'Confirmed' ? 'Verified' : 'Pending Verification',
                timeline: so.timeline || [
                  { status: so.status, time: so.createdAt, note: 'Synchronized order from Google Sheets.' }
                ],
              } as any);
            }
          }
          this.set(STORAGE_KEYS.ORDERS, mergedOrders);
        }
      } catch (e) {
        console.warn('[Sheets Sync] Order sync failed:', e);
      }

      console.log('[Sheets Sync] Google Sheets data sync completed successfully!');
      window.dispatchEvent(new Event('healnex_db_update'));
    } catch (err) {
      console.warn('[Sheets Sync] General error during Sheets sync:', err);
    }
  },

  // Users
  getUsers(): User[] {
    const users = this.get(STORAGE_KEYS.USERS, DEFAULT_USERS);
    try {
      const adminIdx = users.findIndex(u => u.role === 'super_admin' || u.id === 'user-superadmin');
      if (adminIdx !== -1) {
        const admin = users[adminIdx];
        if (admin.email !== 'warisulislam371@gmail.com') {
          users[adminIdx] = {
            ...admin,
            email: 'warisulislam371@gmail.com'
          };
          this.set(STORAGE_KEYS.USERS, users);
        }
      } else {
        const newAdmin: User = {
          id: 'user-superadmin',
          name: 'Super Admin',
          email: 'warisulislam371@gmail.com',
          role: 'super_admin',
          phone: '+91 98765 43210',
          isVerified: true,
          forcePasswordChange: false,
          createdAt: '2026-01-01T00:00:00Z',
          password: 'Waris@123'
        };
        users.push(newAdmin);
        this.set(STORAGE_KEYS.USERS, users);
      }
    } catch (e) {
      console.error('Error migrating super admin in getUsers():', e);
    }
    return users;
  },
  saveUsers(users: User[]) {
    const old = this.get(STORAGE_KEYS.USERS, DEFAULT_USERS) as User[];
    this.set(STORAGE_KEYS.USERS, users);
    
    // Detect new users and append them to Google Sheets
    const oldEmails = new Set(old.map(u => u.email.toLowerCase()));
    for (const u of users) {
      if (u && u.email && !oldEmails.has(u.email.toLowerCase())) {
        console.log(`[Sheets Sync] Detecting new user ${u.name} (${u.email}). Appending to Google Sheets...`);
        addUserToSheets(u).catch(err => {
          console.error('[Sheets Sync] Failed to append user to Google Sheets:', err);
        });
      }
    }
  },

  // Current logged in User
  getCurrentUser(): User | null { return this.get(STORAGE_KEYS.CURRENT_USER, null); },
  setCurrentUser(user: User | null) { this.set(STORAGE_KEYS.CURRENT_USER, user); },

  // Vendors
  getVendors(): Vendor[] { return this.get(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS); },
  saveVendors(vendors: Vendor[]) {
    const old = this.getVendors();
    this.set(STORAGE_KEYS.VENDORS, vendors);
    syncListToFirestoreWithDeletions('vendors', vendors, old);
    window.dispatchEvent(new Event('healnex_db_update'));
  },

  // Products
  getProducts(): Product[] {
    const list = this.get(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS) as Product[];
    let needsSave = false;
    const settings = this.getCommissionSettings();
    const mapped = list.map(p => {
      if (p.vendor_price === undefined || p.final_price === undefined || p.commission_rate === undefined) {
        needsSave = true;
        const vendorPrice = p.vendor_price ?? p.vendorPrice ?? p.price ?? p.salePrice ?? 0;
        
        // Calculate commission rate based on current settings
        let commissionRate = 0;
        if (settings.enabled) {
          if (settings.vendorPercents && settings.vendorPercents[p.vendorId] !== undefined) {
            commissionRate = settings.vendorPercents[p.vendorId];
          } else if (p.category) {
            const catKey = Object.keys(settings.categoryPercents).find(
              k => k.toLowerCase() === p.category.toLowerCase()
            );
            if (catKey !== undefined && settings.categoryPercents[catKey] !== undefined) {
              commissionRate = settings.categoryPercents[catKey];
            } else if (p.brand) {
              const brandKey = Object.keys(settings.brandPercents).find(
                k => k.toLowerCase() === p.brand.toLowerCase()
              );
              if (brandKey !== undefined && settings.brandPercents[brandKey] !== undefined) {
                commissionRate = settings.brandPercents[brandKey];
              } else {
                commissionRate = settings.globalPercent !== undefined ? settings.globalPercent : 7;
              }
            } else {
              commissionRate = settings.globalPercent !== undefined ? settings.globalPercent : 7;
            }
          } else {
            commissionRate = settings.globalPercent !== undefined ? settings.globalPercent : 7;
          }
        }
        
        const commissionAmount = Math.round((vendorPrice * commissionRate) / 100);
        const customerPrice = vendorPrice + commissionAmount;
        
        return {
          ...p,
          vendor_price: vendorPrice,
          vendorPrice: vendorPrice,
          commission_rate: commissionRate,
          commissionPercent: commissionRate,
          commissionAmount: commissionAmount,
          final_price: customerPrice,
          customerPrice: customerPrice,
          price: customerPrice,
          salePrice: customerPrice,
          wholesalePrice: customerPrice,
          mrp: Math.round(customerPrice * 1.2),
          vendor_payout: vendorPrice,
        };
      }
      return p;
    });
    if (needsSave) {
      setTimeout(() => {
        try { this.saveProducts(mapped); } catch (e) {}
      }, 0);
    }
    return mapped;
  },
  saveProducts(products: Product[]) {
    const old = this.getProducts();
    this.set(STORAGE_KEYS.PRODUCTS, products);
    syncListToFirestoreWithDeletions('products', products, old);
    window.dispatchEvent(new Event('healnex_db_update'));
  },
  addProduct(prod: Product) {
    const list = this.getProducts();
    list.unshift(prod);
    this.saveProducts(list);
  },
  updateProduct(id: string, updated: Product) {
    const list = this.getProducts().map(p => p.id === id ? updated : p);
    this.saveProducts(list);
  },
  deleteProduct(id: string) {
    const list = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(list);
  },

  // Orders
  getOrders(): Order[] { return this.get(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS); },
  saveOrders(orders: Order[]) {
    const old = this.getOrders();
    this.set(STORAGE_KEYS.ORDERS, orders);
    
    // Sync order status changes to Google Sheets!
    for (const ord of orders) {
      if (!ord || !ord.id) continue;
      const prev = old.find(o => o.id === ord.id);
      if (prev && prev.status !== ord.status) {
        console.log(`[Sheets Sync] Detected status change for order ${ord.id} from "${prev.status}" to "${ord.status}". Syncing to Google Sheets...`);
        updateOrderStatusInSheets(ord.id, ord.status).catch(err => {
          console.error(`[Sheets Sync] Failed to update status for order ${ord.id} in Google Sheets:`, err);
        });
      }
    }
  },
  async createOrderDirect(newOrder: Order) {
    console.log(`Starting createOrderDirect for Order ID: ${newOrder.id}`);
    
    // Build the full mapped order document
    const orderDoc = {
      // Original fields for app compatibility
      id: newOrder.id,
      customerId: newOrder.customerId,
      customerName: newOrder.customerName,
      customerEmail: newOrder.customerEmail,
      vendorId: newOrder.vendorId,
      vendorName: newOrder.vendorName,
      items: newOrder.items,
      totalAmount: newOrder.totalAmount,
      gstAmount: newOrder.gstAmount,
      discountAmount: newOrder.discountAmount,
      finalAmount: newOrder.finalAmount,
      status: newOrder.status,
      paymentMethod: newOrder.paymentMethod,
      paymentId: newOrder.paymentId || '',
      shippingAddress: newOrder.shippingAddress,
      createdAt: newOrder.createdAt,
      timeline: newOrder.timeline,
      paymentTxId: newOrder.paymentTxId || '',
      paymentNote: newOrder.paymentNote || '',
      paymentScreenshotUrl: newOrder.paymentScreenshotUrl || '',
      paymentScreenshotName: newOrder.paymentScreenshotName || '',
      paymentVerificationLogs: newOrder.paymentVerificationLogs || [],

      // Requirement 3 fields (explicitly requested)
      orderId: newOrder.id,
      products: newOrder.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        vendorId: item.vendorId,
      })),
      quantity: newOrder.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: newOrder.totalAmount,
      tax: newOrder.gstAmount,
      shipping: 0,
      total: newOrder.finalAmount,
      paymentStatus: (newOrder.status === 'Order Sent to Vendor' || newOrder.status === 'Completed' || newOrder.status === 'Paid' || newOrder.status === 'Payment Verified' || newOrder.status === 'Confirmed' || newOrder.status === 'Processing' || newOrder.status === 'Shipped' || newOrder.status === 'Delivered') ? 'Paid' : 'Pending',
      orderStatus: newOrder.status,
    };

    // Perform direct Google Sheets write immediately
    try {
      console.log(`[Sheets Sync] Attempting direct Google Sheets write for Order ID: ${newOrder.id}`);
      await addOrderToSheets(newOrder);
      console.log(`[Sheets Sync] Direct Google Sheets write successful for Order ID: ${newOrder.id}`);
    } catch (err: any) {
      console.error(`[Sheets Sync] Direct Google Sheets write failed for Order ID: ${newOrder.id}`, err);
      // Fallback: we still save it to local storage below so the customer is never stuck!
    }

    // Update local storage to keep client in sync
    const currentOrders = this.getOrders();
    const existingIdx = currentOrders.findIndex(o => o.id === newOrder.id);
    if (existingIdx > -1) {
      currentOrders[existingIdx] = newOrder;
    } else {
      currentOrders.unshift(newOrder);
    }
    this.set(STORAGE_KEYS.ORDERS, currentOrders);

    // Update stock for each product in the order (Requirement 7)
    console.log(`Updating stock quantities for products in Order ID: ${newOrder.id}`);
    for (const item of newOrder.items) {
      this.decreaseProductStock(item.productId, item.quantity);
    }

    // Send notifications to customer, vendor, and admin (Requirement 8)
    console.log(`Sending order notifications for Order ID: ${newOrder.id}`);
    
    // Customer
    this.addNotification(
      newOrder.customerId,
      'Order Placed Successfully',
      `Your medical equipment order #${newOrder.id} for ₹${newOrder.finalAmount.toLocaleString('en-IN')} has been placed via ${newOrder.paymentMethod}.`,
      'order_placed'
    );

    // Vendor
    this.addNotification(
      newOrder.vendorId,
      'New Equipment Order Received',
      `Procurement order #${newOrder.id} (₹${newOrder.finalAmount.toLocaleString('en-IN')}) has been routed to your dashboard.`,
      'order_placed'
    );

    // Admin
    this.addNotification(
      'admin',
      'New Marketplace Transaction',
      `Order #${newOrder.id} placed by ${newOrder.customerName} via ${newOrder.paymentMethod}. Total: ₹${newOrder.finalAmount.toLocaleString('en-IN')}.`,
      'order_placed'
    );

    // Dispatch database update event to refresh UI components
    window.dispatchEvent(new Event('healnex_db_update'));
    console.log(`createOrderDirect completed successfully for Order ID: ${newOrder.id}`);
  },

  decreaseProductStock(productId: string, quantity: number) {
    const products = this.getProducts();
    const productIdx = products.findIndex(p => p.id === productId);
    if (productIdx > -1) {
      const product = products[productIdx];
      const newStock = Math.max(0, (product.stockQuantity || 0) - quantity);
      const updatedProduct = {
        ...product,
        stockQuantity: newStock,
        outOfStock: newStock === 0,
      };
      products[productIdx] = updatedProduct;
      this.saveProducts(products);
      console.log(`Deducted stock for product ${productId}: was ${product.stockQuantity}, now ${newStock}`);
    }
  },

  // RFQs
  getRfqs(): RFQ[] { return this.get(STORAGE_KEYS.RFQS, DEFAULT_RFQS); },
  saveRfqs(rfqs: RFQ[]) {
    const old = this.getRfqs();
    this.set(STORAGE_KEYS.RFQS, rfqs);
    syncListToFirestoreWithDeletions('rfqs', rfqs, old);
  },

  // Quotations
  getQuotations(): Quotation[] { return this.get(STORAGE_KEYS.QUOTATIONS, DEFAULT_QUOTATIONS); },
  saveQuotations(quotations: Quotation[]) {
    const old = this.getQuotations();
    this.set(STORAGE_KEYS.QUOTATIONS, quotations);
    syncListToFirestoreWithDeletions('quotations', quotations, old);
  },

  // Tickets
  getTickets(): SupportTicket[] { return this.get(STORAGE_KEYS.TICKETS, DEFAULT_TICKETS); },
  saveTickets(tickets: SupportTicket[]) {
    const old = this.getTickets();
    this.set(STORAGE_KEYS.TICKETS, tickets);
    syncListToFirestoreWithDeletions('tickets', tickets, old);
  },

  // Blogs
  getBlogs(): Blog[] { return this.get(STORAGE_KEYS.BLOGS, INITIAL_BLOGS); },
  saveBlogs(blogs: Blog[]) {
    const old = this.getBlogs();
    this.set(STORAGE_KEYS.BLOGS, blogs);
    syncListToFirestoreWithDeletions('blogs', blogs, old);
  },

  // Notifications
  getNotifications(): Notification[] { return this.get(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS); },
  saveNotifications(notifs: Notification[]) {
    const old = this.getNotifications();
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    syncListToFirestoreWithDeletions('notifications', notifs, old);
  },

  // Reviews
  getReviews(): Review[] { return this.get(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS); },
  saveReviews(reviews: Review[]) {
    const old = this.getReviews();
    this.set(STORAGE_KEYS.REVIEWS, reviews);
    syncListToFirestoreWithDeletions('reviews', reviews, old);
  },

  // Payment Settings
  getPaymentSettings(): PaymentSettings {
    const settings = this.get(STORAGE_KEYS.PAYMENT_SETTINGS, [DEFAULT_PAYMENT_SETTINGS]) as PaymentSettings[];
    let current = settings[0] || DEFAULT_PAYMENT_SETTINGS;
    current = { ...DEFAULT_PAYMENT_SETTINGS, ...current };
    
    // If QR code is missing but custom UPI details exist, auto-generate a matching QR code data URL
    if (!current.upiQrCodeUrl && current.upiId) {
      current.upiQrCodeUrl = getSliceUpiQrDataUrl(current.upiId, current.upiHolderName);
      this.set(STORAGE_KEYS.PAYMENT_SETTINGS, [current]);
    }
    
    const latestSliceQr = getSliceUpiQrDataUrl();
    if (
      current.upiId === 'payments@hdfcbank' ||
      current.upiQrCodeUrl?.includes('unsplash') ||
      ((current.upiHolderName?.toLowerCase().includes('warisul') || current.upiId === SLICE_UPI_ID) && current.upiQrCodeUrl !== latestSliceQr && current.upiId === SLICE_UPI_ID)
    ) {
      current.upiId = SLICE_UPI_ID;
      current.upiHolderName = SLICE_HOLDER_NAME;
      current.upiQrCodeUrl = latestSliceQr;
      current.upiInstructions = 'Scan the Slice UPI QR code using any UPI app (GPay, PhonePe, Paytm, Slice) to pay directly to Warisul Islam.';
      this.set(STORAGE_KEYS.PAYMENT_SETTINGS, [current]);
    }
    return current;
  },
  savePaymentSettings(settings: PaymentSettings) {
    const old = this.get(STORAGE_KEYS.PAYMENT_SETTINGS, [DEFAULT_PAYMENT_SETTINGS]) as PaymentSettings[];
    this.set(STORAGE_KEYS.PAYMENT_SETTINGS, [settings]);
    syncListToFirestoreWithDeletions('payment_settings', [settings], old);
  },

  // WhatsApp Settings
  getWhatsAppSettings(): WhatsAppSettings {
    const settings = this.get(STORAGE_KEYS.WHATSAPP_SETTINGS, [DEFAULT_WHATSAPP_SETTINGS]) as WhatsAppSettings[];
    const current = settings[0] || DEFAULT_WHATSAPP_SETTINGS;
    if (
      current.phoneNumber !== '+919103500592' ||
      current.businessLink !== 'https://wa.me/919103500592'
    ) {
      current.phoneNumber = '+919103500592';
      current.businessLink = 'https://wa.me/919103500592';
      if (current.buttonText === 'Chat on WhatsApp') {
        current.buttonText = 'Chat on WhatsApp (9103500592)';
      }
      this.set(STORAGE_KEYS.WHATSAPP_SETTINGS, [current]);
    }
    return current;
  },
  saveWhatsAppSettings(settings: WhatsAppSettings) {
    const old = this.get(STORAGE_KEYS.WHATSAPP_SETTINGS, [DEFAULT_WHATSAPP_SETTINGS]) as WhatsAppSettings[];
    this.set(STORAGE_KEYS.WHATSAPP_SETTINGS, [settings]);
    syncListToFirestoreWithDeletions('whatsapp_settings', [settings], old);
  },

  // Commission Settings
  getCommissionSettings(): CommissionSettings {
    const settings = this.get(STORAGE_KEYS.COMMISSION_SETTINGS, [DEFAULT_COMMISSION_SETTINGS]) as CommissionSettings[];
    const current = settings[0] || DEFAULT_COMMISSION_SETTINGS;
    return { ...DEFAULT_COMMISSION_SETTINGS, ...current };
  },
  saveCommissionSettings(settings: CommissionSettings) {
    const old = this.get(STORAGE_KEYS.COMMISSION_SETTINGS, [DEFAULT_COMMISSION_SETTINGS]) as CommissionSettings[];
    this.set(STORAGE_KEYS.COMMISSION_SETTINGS, [settings]);
    syncListToFirestoreWithDeletions('commission_settings', [settings], old);

    // Automatically recalculate final customer price for all affected products
    try {
      const products = this.get(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS) as Product[];
      const updatedProducts = products.map(p => {
        const vendorPrice = p.vendor_price ?? p.vendorPrice ?? p.price ?? p.salePrice ?? 0;
        
        // Calculate the commission rate using the new settings
        let commissionRate = 0;
        if (settings.enabled) {
          if (settings.vendorPercents && settings.vendorPercents[p.vendorId] !== undefined) {
            commissionRate = settings.vendorPercents[p.vendorId];
          } else if (p.category) {
            const catKey = Object.keys(settings.categoryPercents).find(
              k => k.toLowerCase() === p.category.toLowerCase()
            );
            if (catKey !== undefined && settings.categoryPercents[catKey] !== undefined) {
              commissionRate = settings.categoryPercents[catKey];
            } else if (p.brand) {
              const brandKey = Object.keys(settings.brandPercents).find(
                k => k.toLowerCase() === p.brand.toLowerCase()
              );
              if (brandKey !== undefined && settings.brandPercents[brandKey] !== undefined) {
                commissionRate = settings.brandPercents[brandKey];
              } else {
                commissionRate = settings.globalPercent !== undefined ? settings.globalPercent : 7;
              }
            } else {
              commissionRate = settings.globalPercent !== undefined ? settings.globalPercent : 7;
            }
          } else {
            commissionRate = settings.globalPercent !== undefined ? settings.globalPercent : 7;
          }
        }
        
        const commissionAmount = Math.round((vendorPrice * commissionRate) / 100);
        const customerPrice = vendorPrice + commissionAmount;
        
        return {
          ...p,
          vendor_price: vendorPrice,
          vendorPrice: vendorPrice,
          commission_rate: commissionRate,
          commissionPercent: commissionRate,
          commissionAmount: commissionAmount,
          final_price: customerPrice,
          customerPrice: customerPrice,
          price: customerPrice,
          salePrice: customerPrice,
          wholesalePrice: customerPrice,
          mrp: Math.round(customerPrice * 1.2),
          vendor_payout: vendorPrice,
        };
      });
      
      const oldProds = this.get(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS) as Product[];
      this.set(STORAGE_KEYS.PRODUCTS, updatedProducts);
      syncListToFirestoreWithDeletions('products', updatedProducts, oldProds);
      window.dispatchEvent(new Event('healnex_db_update'));
    } catch (err) {
      console.error('Failed to recalculate product prices upon commission change:', err);
    }
  },

  // WhatsApp Click Logs
  getWhatsAppClickLogs(): WhatsAppClickLog[] {
    return this.get(STORAGE_KEYS.WHATSAPP_CLICK_LOGS, []);
  },
  logWhatsAppClick(logData: Omit<WhatsAppClickLog, 'id' | 'timestamp'>) {
    const logs = this.getWhatsAppClickLogs();
    const newLog: WhatsAppClickLog = sanitizeForFirestore({
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    });
    logs.unshift(newLog);
    this.set(STORAGE_KEYS.WHATSAPP_CLICK_LOGS, logs);
    syncListToFirestoreWithDeletions('whatsapp_click_logs', logs, []);
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.get('healnex_audit_logs', []) as AuditLog[];
  },
  logAudit(userId: string, action: string, details: string, orderId?: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = sanitizeForFirestore({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      orderId,
      userId,
      action,
      dateTime: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      details,
    });
    logs.unshift(newLog);
    this.set('healnex_audit_logs', logs);
    syncListToFirestoreWithDeletions('audit_logs', logs, []);
  },

  // Utility to push notifications
  addNotification(userId: string, title: string, message: string, type: Notification['type']) {
    const notifs = this.getNotifications();
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      message,
      read: false,
      type,
      createdAt: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    this.saveNotifications(notifs);
  },

  // Clearance Requests
  getClearanceRequests(): PaymentClearanceRequest[] {
    return this.get(STORAGE_KEYS.CLEARANCE_REQUESTS, DEFAULT_CLEARANCE_REQUESTS);
  },
  saveClearanceRequests(requests: PaymentClearanceRequest[]) {
    const old = this.getClearanceRequests();
    this.set(STORAGE_KEYS.CLEARANCE_REQUESTS, requests);
    syncListToFirestoreWithDeletions('clearance_requests', requests, old);
  },
  addClearanceRequest(request: PaymentClearanceRequest) {
    const list = this.getClearanceRequests();
    list.unshift(request);
    this.saveClearanceRequests(list);
  },

  // Promo Banners
  getPromoBanners(): PromoBanner[] {
    const list = this.get(STORAGE_KEYS.PROMO_BANNERS, DEFAULT_PROMO_BANNERS);
    return Array.isArray(list) ? list : DEFAULT_PROMO_BANNERS;
  },
  savePromoBanners(banners: PromoBanner[]) {
    const old = this.getPromoBanners();
    this.set(STORAGE_KEYS.PROMO_BANNERS, banners);
    syncListToFirestoreWithDeletions('promo_banners', banners, old);
  },

  // Dynamic Categories
  getCategories(): Category[] {
    const list = this.get(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_CATEGORIES;
  },
  saveCategories(categories: Category[]) {
    const old = this.getCategories();
    this.set(STORAGE_KEYS.CATEGORIES, categories);
    syncListToFirestoreWithDeletions('categories', categories, old);
    window.dispatchEvent(new Event('healnex_db_update'));
  },

  // Dynamic Brands
  getBrands(): Brand[] {
    const list = this.get(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_BRANDS;
  },
  saveBrands(brands: Brand[]) {
    const old = this.getBrands();
    this.set(STORAGE_KEYS.BRANDS, brands);
    syncListToFirestoreWithDeletions('brands', brands, old);
    window.dispatchEvent(new Event('healnex_db_update'));
  },

  // Vendor Category Requests
  getCategoryRequests(): CategoryRequest[] {
    const list = this.get(STORAGE_KEYS.CATEGORY_REQUESTS, []);
    return Array.isArray(list) ? list : [];
  },
  saveCategoryRequests(requests: CategoryRequest[]) {
    const old = this.getCategoryRequests();
    this.set(STORAGE_KEYS.CATEGORY_REQUESTS, requests);
    syncListToFirestoreWithDeletions('categoryRequests', requests, old);
    window.dispatchEvent(new Event('healnex_db_update'));
  },
  addCategoryRequest(req: CategoryRequest) {
    const list = this.getCategoryRequests();
    list.unshift(req);
    this.saveCategoryRequests(list);
  },

  // Vendor Brand Requests
  getBrandRequests(): BrandRequest[] {
    const list = this.get(STORAGE_KEYS.BRAND_REQUESTS, []);
    return Array.isArray(list) ? list : [];
  },
  saveBrandRequests(requests: BrandRequest[]) {
    const old = this.getBrandRequests();
    this.set(STORAGE_KEYS.BRAND_REQUESTS, requests);
    syncListToFirestoreWithDeletions('brandRequests', requests, old);
    window.dispatchEvent(new Event('healnex_db_update'));
  },
  addBrandRequest(req: BrandRequest) {
    const list = this.getBrandRequests();
    list.unshift(req);
    this.saveBrandRequests(list);
  },

  // Commission Calculations
  getProductCommissionRate(vendorId: string, category: string, brand: string): number {
    const settings = this.getCommissionSettings();
    if (!settings.enabled) {
      return 0;
    }
    
    // Check if there is a vendor-specific commission
    if (settings.vendorPercents && settings.vendorPercents[vendorId] !== undefined) {
      return settings.vendorPercents[vendorId];
    }
    
    // Check if there is a category-specific commission
    if (category) {
      const catKey = Object.keys(settings.categoryPercents).find(
        k => k.toLowerCase() === category.toLowerCase()
      );
      if (catKey !== undefined && settings.categoryPercents[catKey] !== undefined) {
        return settings.categoryPercents[catKey];
      }
    }
    
    // Check if there is a brand-specific commission
    if (brand) {
      const brandKey = Object.keys(settings.brandPercents).find(
        k => k.toLowerCase() === brand.toLowerCase()
      );
      if (brandKey !== undefined && settings.brandPercents[brandKey] !== undefined) {
        return settings.brandPercents[brandKey];
      }
    }
    
    // Fallback to global commission %
    return settings.globalPercent !== undefined ? settings.globalPercent : 7;
  }
};
