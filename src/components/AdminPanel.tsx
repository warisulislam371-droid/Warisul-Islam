import React, { useState, useEffect } from 'react';
import { dbLocal } from '../db';
import { getSliceUpiQrDataUrl, SLICE_UPI_ID, SLICE_HOLDER_NAME } from '../utils/sliceQrSvg';
import { Vendor, Product, SupportTicket, Order, User, Notification, PaymentSettings, WhatsAppSettings, WhatsAppClickLog, RFQ, PaymentClearanceRequest, PromoBanner } from '../types';
import AdminCategoriesManager from './AdminCategoriesManager';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { storage } from '../firebase';
import {
  TrendingUp,
  Users,
  Briefcase,
  AlertCircle,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Search,
  MessageSquare,
  MessageCircle,
  Activity,
  Award,
  BookOpen,
  DollarSign,
  Terminal,
  Trash2,
  Server,
  Bell,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Download,
  RefreshCw,
  FileText,
  CreditCard,
  Calendar,
  MapPin,
  ExternalLink,
  Mail,
  QrCode,
  Building,
  Copy,
  ClipboardList,
  Printer,
  FileSpreadsheet,
  Truck,
  Package,
  Building2,
  Wallet,
  Percent,
  Filter,
  IndianRupee,
  Edit,
  Eye,
  Tag,
  Box,
  Image as ImageIcon,
  Plus,
  Layers,
  ToggleLeft,
  ToggleRight,
  Link as LinkIcon,
  Upload
} from 'lucide-react';

// Global helper for generating a beautiful high-fidelity scanned document preview
const generateAdminDocumentCanvas = (docTitle: string, fileName: string, companyName: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;
  
  // Extract dynamic theme color from document element
  const brandColor = typeof window !== 'undefined' ? (getComputedStyle(document.documentElement).getPropertyValue('--theme-brand-hex').trim() || '#0f766e') : '#0f766e';
  
  // Background
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, 600, 800);
  
  // Document border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 586, 786);
  
  // Header banner
  ctx.fillStyle = brandColor;
  ctx.fillRect(14, 14, 572, 115);
  
  // Header Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('HEALNEX SECURE MEDICAL PORTAL', 40, 58);
  ctx.font = '12px monospace';
  ctx.fillStyle = '#e0f2fe';
  ctx.fillText('CLINICAL AUDITING HUB • RECONCILIATION GATEWAY • FIREBASE SECURE STORAGE', 40, 88);
  
  // Watermark
  ctx.save();
  ctx.translate(300, 450);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = brandColor + '0c'; // ~5% opacity hex alpha
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HEALNEX CLINICAL', 0, -25);
  ctx.fillText('OFFICIAL AUDIT COPY', 0, 35);
  ctx.restore();
  
  // Document Details Box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(40, 165, 520, 260);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 165, 520, 260);
  
  ctx.fillStyle = brandColor;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('DOCUMENT CLASSIFICATION & INTEGRITY', 60, 205);
  
  // Divider
  ctx.beginPath();
  ctx.moveTo(60, 220);
  ctx.lineTo(540, 220);
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();
  
  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Owner Institution:', 60, 255);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(companyName, 220, 255);
 
  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Credential Key:', 60, 290);
  ctx.fillStyle = brandColor;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(docTitle, 220, 290);
  
  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('File Identifier:', 60, 325);
  ctx.fillStyle = '#1e293b';
  ctx.font = '12px monospace';
  ctx.fillText(fileName, 220, 325);
  
  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Database Backend:', 60, 360);
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Firebase Cloud Storage (Secured-Signed)', 220, 360);
  
  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Onboarding Time:', 60, 395);
  ctx.fillStyle = '#64748b';
  ctx.fillText(new Date().toLocaleDateString() + ' • ' + new Date().toLocaleTimeString(), 220, 395);
  
  // Simulated Content lines representing text paragraphs or table grid
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(40, 460, 520, 14);
  ctx.fillRect(40, 490, 480, 10);
  ctx.fillRect(40, 515, 510, 10);
  ctx.fillRect(40, 540, 320, 10);
  
  // Verified stamp box
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 3;
  ctx.strokeRect(380, 600, 180, 75);
  
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('SECURITY SEALED', 400, 630);
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('HEALNEX PORTAL CDN', 412, 655);
 
  // Sign stamp box
  ctx.strokeStyle = brandColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 600, 180, 75);
  ctx.fillStyle = '#475569';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('AUTHORIZED AUDITOR SIGNATURE', 50, 618);
  ctx.font = 'italic 18px cursive, system-ui';
  ctx.fillStyle = brandColor;
  ctx.fillText('Waris Ul Islam', 60, 648);
  
  // Footer notice
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText('CONFIDENTIAL MEDICAL RECORD INDEXED TO FIREBASE. DISCLOSURE PROHIBITED BY DATA LAW.', 40, 750);
  
  return canvas.toDataURL('image/jpeg', 0.7);
};

interface AdminPanelProps {
  currentUser: User | null;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminPanel({ currentUser, addToast }: AdminPanelProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Custom push trigger form state
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushTarget, setPushTarget] = useState('admin');
  const [pushType, setPushType] = useState('clinical_broadcast');
  
  const [activeTab, setActiveTab] = useState<'kpis' | 'orders' | 'vendors' | 'products' | 'categories' | 'tickets' | 'audit' | 'payment-settings' | 'verify-payments' | 'vendor-payouts' | 'whatsapp-support' | 'banners' | 'commission-settings'>('kpis');

  // Commission Settings State
  const [commEnabled, setCommEnabled] = useState<boolean>(true);
  const [commGlobal, setCommGlobal] = useState<number>(7);
  const [commCategories, setCommCategories] = useState<Record<string, number>>({});
  const [commBrands, setCommBrands] = useState<Record<string, number>>({});
  const [commVendors, setCommVendors] = useState<Record<string, number>>({});

  // Form helpers
  const [newCatKey, setNewCatKey] = useState('');
  const [newCatVal, setNewCatVal] = useState<number>(7);
  const [newBrandKey, setNewBrandKey] = useState('');
  const [newBrandVal, setNewBrandVal] = useState<number>(7);
  const [newVendorKey, setNewVendorKey] = useState('');
  const [newVendorVal, setNewVendorVal] = useState<number>(7);

  // Promo Banners State
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(dbLocal.getPromoBanners());
  const [editingBannerModal, setEditingBannerModal] = useState<PromoBanner | null>(null);
  const [isCreatingBanner, setIsCreatingBanner] = useState<boolean>(false);
  const [bannerForm, setBannerForm] = useState<Omit<PromoBanner, 'id' | 'createdAt'>>({
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '#catalog',
    buttonText: 'Explore Catalog',
    badgeText: 'CLINICAL QUALITY ASSURED • WHOLESALE PRICING',
    positionOrder: 1,
    isActive: true
  });

  const handleSaveNewBanner = () => {
    if (!bannerForm.title.trim() || !bannerForm.imageUrl.trim()) {
      addToast('Banner Title and Image URL are required!', 'error');
      return;
    }
    const newBanner: PromoBanner = {
      ...bannerForm,
      id: `banner-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const list = [newBanner, ...promoBanners];
    dbLocal.savePromoBanners(list);
    setPromoBanners(list);
    setIsCreatingBanner(false);
    setBannerForm({
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '#catalog',
      buttonText: 'Explore Catalog',
      badgeText: 'CLINICAL QUALITY ASSURED • WHOLESALE PRICING',
      positionOrder: list.length + 1,
      isActive: true
    });
    addToast('Promotional banner published successfully!', 'success');
  };

  const handleUpdateBanner = () => {
    if (!editingBannerModal) return;
    const list = promoBanners.map(b => b.id === editingBannerModal.id ? editingBannerModal : b);
    dbLocal.savePromoBanners(list);
    setPromoBanners(list);
    setEditingBannerModal(null);
    addToast('Promotional banner updated successfully!', 'success');
  };

  const handleDeleteBanner = (id: string, title: string) => {
    if (!confirm(`Permanently remove banner "${title}"?`)) return;
    const list = promoBanners.filter(b => b.id !== id);
    dbLocal.savePromoBanners(list);
    setPromoBanners(list);
    addToast('Promotional banner deleted.', 'info');
  };

  const handleToggleBannerActive = (id: string) => {
    const list = promoBanners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b);
    dbLocal.savePromoBanners(list);
    setPromoBanners(list);
    addToast('Banner display status toggled.', 'success');
  };

  // Vendor Trust Seal Modal State
  const [managingSealVendor, setManagingSealVendor] = useState<Vendor | null>(null);
  const [sealForm, setSealForm] = useState<{ trustSeal: boolean; trustSealLevel: string }>({
    trustSeal: false,
    trustSealLevel: 'Verified Clinical Supplier'
  });

  const handleSaveTrustSeal = () => {
    if (!managingSealVendor) return;
    const updated = vendors.map(v => {
      if (v.id === managingSealVendor.id) {
        return {
          ...v,
          trustSeal: sealForm.trustSeal,
          trustSealLevel: sealForm.trustSeal ? sealForm.trustSealLevel : undefined
        };
      }
      return v;
    });
    dbLocal.saveVendors(updated);
    setVendors(updated);
    if (sealForm.trustSeal) {
      dbLocal.addNotification(
        managingSealVendor.id,
        '🛡️ Official Trust Seal Awarded!',
        `Congratulations! Admin has verified and awarded your company with the "${sealForm.trustSealLevel}" Trust Seal badge. Customers will now see this badge on all your product listings!`,
        'vendor_approved'
      );
      addToast(`Trust Seal awarded to ${managingSealVendor.companyName}!`, 'success');
    } else {
      addToast(`Trust Seal removed for ${managingSealVendor.companyName}.`, 'info');
    }
    setManagingSealVendor(null);
  };

  // Vendor Payout Clearance Requests State
  const [clearanceRequests, setClearanceRequests] = useState<PaymentClearanceRequest[]>(dbLocal.getClearanceRequests());
  const [rejectingClearanceId, setRejectingClearanceId] = useState<string | null>(null);
  const [approvingClearanceId, setApprovingClearanceId] = useState<string | null>(null);
  const [clearanceAdminNote, setClearanceAdminNote] = useState<string>('');
  const [clearanceUtr, setClearanceUtr] = useState<string>('');
  const [clearancePaymentMode, setClearancePaymentMode] = useState<'NEFT' | 'RTGS' | 'IMPS' | 'UPI' | 'Razorpay'>('NEFT');
  const [clearanceVendorFilter, setClearanceVendorFilter] = useState<string>('All');
  const [clearanceStatusFilter, setClearanceStatusFilter] = useState<string>('All');
  const [clearanceSearchQuery, setClearanceSearchQuery] = useState<string>('');
  const [adminInvoiceModal, setAdminInvoiceModal] = useState<PaymentClearanceRequest | null>(null);
  const [globalCommRate, setGlobalCommRate] = useState<number>(dbLocal.getPaymentSettings().platformCommissionRate || 10);
  const [minWithdrawalLimit, setMinWithdrawalLimit] = useState<number>(dbLocal.getPaymentSettings().minimumPayoutLimit || 500);
  
  // Payment Verification admin states
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(dbLocal.getPaymentSettings());
  const [upiQrCode, setUpiQrCode] = useState<string>('');
  const [bankQrCode, setBankQrCode] = useState<string>('');
  const [netBankingQrCode, setNetBankingQrCode] = useState<string>('');
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');
  
  // Audit Reports State
  const [selectedReportType, setSelectedReportType] = useState<'sales' | 'payments' | 'vendors' | 'customers' | 'rfqs'>('sales');
  const [reportStatusFilter, setReportStatusFilter] = useState('All');
  const [reportSearchText, setReportSearchText] = useState('');
  
  // WhatsApp Support admin states
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings>(dbLocal.getWhatsAppSettings());
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppClickLog[]>(dbLocal.getWhatsAppClickLogs());
  
  // States for document modal reviews
  const [selectedVendorDoc, setSelectedVendorDoc] = useState<Vendor | null>(null);
  const [activeReviewDocKey, setActiveReviewDocKey] = useState<string>('gstCertificate');
  const [docZoom, setDocZoom] = useState<number>(100);
  const [docRotation, setDocRotation] = useState<number>(0);
  const [statusReasonText, setStatusReasonText] = useState<string>('');
  const [reasonRequiredAction, setReasonRequiredAction] = useState<'Rejected' | 'MoreInfoRequired' | 'Suspended' | null>(null);
  
  // Ticket reply state
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Orders Dispatch desk state
  const [adminDispatchInputs, setAdminDispatchInputs] = useState<{ [orderId: string]: { courierName: string; trackingNumber: string } }>({});

  // Admin Products Management states
  const [productSearchText, setProductSearchText] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('All');
  const [productVendorFilter, setProductVendorFilter] = useState<string>('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');
  const [editingProductModal, setEditingProductModal] = useState<Product | null>(null);
  const [productBrandFilter, setProductBrandFilter] = useState<string>('All');
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [productRejectReasonText, setProductRejectReasonText] = useState('');
  const [isRequestChangesAction, setIsRequestChangesAction] = useState<boolean>(false);
  const [previewingProduct, setPreviewingProduct] = useState<Product | null>(null);

  // Admin Vendor Directory Management states
  const [vendorSearchText, setVendorSearchText] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState<string>('All');
  const [showAddVendorModal, setShowAddVendorModal] = useState<boolean>(false);
  const [editingVendorModal, setEditingVendorModal] = useState<Vendor | null>(null);
  const [viewingVendorCatalogModal, setViewingVendorCatalogModal] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState<{
    companyName: string;
    ownerName: string;
    email: string;
    mobileNumber: string;
    gstNumber: string;
    panNumber: string;
    state: string;
    district: string;
    pincode: string;
    customCommissionRate: number;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    status: 'Approved' | 'Pending' | 'Suspended' | 'Rejected';
  }>({
    companyName: '',
    ownerName: '',
    email: '',
    mobileNumber: '',
    gstNumber: '',
    panNumber: '',
    state: 'Maharashtra',
    district: 'Mumbai',
    pincode: '400001',
    customCommissionRate: 5.0,
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifscCode: 'HDFC0000123',
    status: 'Approved'
  });

  const loadData = () => {
    setVendors(dbLocal.getVendors());
    setProducts(dbLocal.getProducts());
    setTickets(dbLocal.getTickets());
    setOrders(dbLocal.getOrders());
    setNotifs(dbLocal.getNotifications());
    setUsers(dbLocal.getUsers());
    setPaymentSettings(dbLocal.getPaymentSettings());
    setWhatsappSettings(dbLocal.getWhatsAppSettings());
    setWhatsappLogs(dbLocal.getWhatsAppClickLogs());
    setClearanceRequests(dbLocal.getClearanceRequests());
    setPromoBanners(dbLocal.getPromoBanners());

    const comm = dbLocal.getCommissionSettings();
    setCommEnabled(comm.enabled !== false);
    setCommGlobal(comm.globalPercent ?? 7);
    setCommCategories(comm.categoryPercents || {});
    setCommBrands(comm.brandPercents || {});
    setCommVendors(comm.vendorPercents || {});
  };

  const handleApproveClearance = (reqId: string) => {
    const list = dbLocal.getClearanceRequests();
    const updated = list.map(c => {
      if (c.id === reqId) {
        return {
          ...c,
          status: 'Approved' as const,
          processedAt: new Date().toISOString(),
          paymentMode: clearancePaymentMode,
          paymentReference: clearanceUtr.trim() || `${clearancePaymentMode}-${Date.now().toString().slice(-8)}`,
          adminNote: clearanceAdminNote.trim() || `Payment settlement funds transferred via ${clearancePaymentMode}.`
        };
      }
      return c;
    });
    dbLocal.saveClearanceRequests(updated);
    setClearanceRequests(updated);
    
    const req = list.find(c => c.id === reqId);
    if (req) {
      dbLocal.addNotification(
        req.vendorId,
        'Payment Clearance Approved! 🎉',
        `Your settlement request #${req.id} for ₹${req.amount.toLocaleString()} has been processed and transferred via ${clearancePaymentMode}. Ref: ${clearanceUtr.trim() || 'Cleared'}`,
        'payout_approved'
      );
    }
    
    addToast(`Vendor payment clearance approved & recorded via ${clearancePaymentMode}!`, 'success');
    setApprovingClearanceId(null);
    setClearanceAdminNote('');
    setClearanceUtr('');
  };

  const handleRejectClearance = (reqId: string) => {
    if (!clearanceAdminNote.trim()) {
      addToast('Please provide a reason or note for rejecting this request.', 'error');
      return;
    }
    const list = dbLocal.getClearanceRequests();
    const updated = list.map(c => {
      if (c.id === reqId) {
        return {
          ...c,
          status: 'Rejected' as const,
          processedAt: new Date().toISOString(),
          adminNote: clearanceAdminNote.trim()
        };
      }
      return c;
    });
    dbLocal.saveClearanceRequests(updated);
    setClearanceRequests(updated);

    const req = list.find(c => c.id === reqId);
    if (req) {
      dbLocal.addNotification(
        req.vendorId,
        'Payment Clearance Rejected ❌',
        `Your settlement request #${req.id} for ₹${req.amount.toLocaleString()} could not be approved. Reason: ${clearanceAdminNote.trim()}`,
        'payout_rejected'
      );
    }

    addToast('Vendor payment clearance request declined.', 'info');
    setRejectingClearanceId(null);
    setClearanceAdminNote('');
  };

  const handleSaveCommissionConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const curr = dbLocal.getPaymentSettings();
    const updated = {
      ...curr,
      platformCommissionRate: globalCommRate,
      minimumPayoutLimit: minWithdrawalLimit
    };
    dbLocal.savePaymentSettings(updated);
    setPaymentSettings(updated);
    addToast(`Platform commission rate updated to ${globalCommRate}% & minimum payout limit set to ₹${minWithdrawalLimit}!`, 'success');
  };

  const handleExportSettlementReport = (format: 'excel' | 'pdf') => {
    const lines = [
      ['Request ID', 'Vendor ID', 'Vendor Name', 'Gross Sales', 'Commission Deducted', 'Net Payout Amount', 'Method', 'Mode', 'Reference UTR', 'Status', 'Date'],
      ...clearanceRequests.map(c => [
        c.id,
        c.vendorId,
        c.vendorName,
        `INR ${(c.grossSales ?? c.amount).toString()}`,
        `INR ${(c.commissionDeducted ?? 0).toString()}`,
        `INR ${c.amount.toString()}`,
        c.payoutMethod || 'bank',
        c.paymentMode || 'NEFT',
        c.paymentReference || 'N/A',
        c.status,
        new Date(c.requestedAt).toLocaleDateString()
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + lines.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HealNex_Vendor_Settlements_Report_${Date.now()}.${format === 'excel' ? 'csv' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Settlement audit report exported successfully as ${format.toUpperCase()}!`, 'success');
  };

  useEffect(() => {
    loadData();
    const handleDbUpdate = () => loadData();
    window.addEventListener('healnex_db_update', handleDbUpdate);
    return () => window.removeEventListener('healnex_db_update', handleDbUpdate);
  }, []);

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = {
      ...paymentSettings,
      upiQrCodeUrl: upiQrCode || paymentSettings.upiQrCodeUrl,
      bankQrCodeUrl: bankQrCode || paymentSettings.bankQrCodeUrl,
      netBankingQrCodeUrl: netBankingQrCode || paymentSettings.netBankingQrCodeUrl
    };
    dbLocal.savePaymentSettings(updatedSettings);
    setPaymentSettings(updatedSettings);
    addToast('Global Payment Settings synchronized successfully!', 'success');
  };

  const handleUpiQrUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUpiQrCode(e.target.result as string);
        addToast('UPI QR Code uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBankQrUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBankQrCode(e.target.result as string);
        addToast('Bank Transfer QR Code uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNetBankingQrUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setNetBankingQrCode(e.target.result as string);
        addToast('Net Banking QR Code uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const safeDeleteStorageFile = async (url?: string) => {
    if (!url || !url.startsWith('http') || !url.includes('firebasestorage')) {
      return;
    }
    try {
      const fileRef = storageRef(storage, url);
      await deleteObject(fileRef);
      console.log('Firebase Storage payment receipt deleted successfully:', url);
    } catch (err) {
      console.warn('Failed to delete payment receipt from Firebase Storage:', err);
    }
  };

  const handleVerifyPayment = (orderId: string) => {
    const currentOrders = dbLocal.getOrders();
    const idx = currentOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      const originalOrder = currentOrders[idx];

      const updatedOrder: Order = {
        ...originalOrder,
        status: 'Confirmed', // Requirement 8
        timeline: [
          ...(originalOrder.timeline || []),
          {
            status: 'Confirmed',
            time: new Date().toISOString(),
            note: `Payment UTR verified by administrator ${currentUser?.name || 'Admin'}. Order status changed to Confirmed & sent to vendor dashboard.`
          }
        ],
        paymentVerificationLogs: [
          ...(originalOrder.paymentVerificationLogs || []),
          {
            action: 'approve',
            performedBy: currentUser?.name || 'Administrator',
            performedByRole: 'admin',
            timestamp: new Date().toISOString(),
            note: `Validated manual transaction UTR successfully.`
          }
        ]
      };
      currentOrders[idx] = updatedOrder;
      dbLocal.saveOrders(currentOrders);
      
      // Notify Customer & Vendor
      dbLocal.addNotification(
        originalOrder.customerId,
        `Payment Verified`,
        `Your manual payment UTR for Order #${orderId} was successfully validated. Procurement sent to supplier for delivery.`,
        'payment_approved'
      );
      dbLocal.addNotification(
        originalOrder.vendorId,
        `New Order Assigned`,
        `New verified procurement Order #${orderId} (₹${originalOrder.finalAmount.toLocaleString('en-IN')}) received from administrative desk.`,
        'order_assigned'
      );
      
      addToast(`Cleared and routed Order #${orderId} to the supplier dashboard!`, 'success');
      loadData();
    }
  };

  const handleRejectPayment = (orderId: string) => {
    if (!rejectionReasonText.trim()) {
      addToast('Please enter a specific rejection reason.', 'error');
      return;
    }
    
    const currentOrders = dbLocal.getOrders();
    const idx = currentOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      const originalOrder = currentOrders[idx];

      const updatedOrder: Order = {
        ...originalOrder,
        status: 'Payment Rejected', // Requirement 7
        paymentRejectionReason: rejectionReasonText.trim(),
        timeline: [
          ...(originalOrder.timeline || []),
          {
            status: 'Payment Rejected',
            time: new Date().toISOString(),
            note: `Payment reference rejected by administrator: ${rejectionReasonText.trim()}`
          }
        ],
        paymentVerificationLogs: [
          ...(originalOrder.paymentVerificationLogs || []),
          {
            action: 'reject',
            performedBy: currentUser?.name || 'Administrator',
            performedByRole: 'admin',
            timestamp: new Date().toISOString(),
            note: `Rejected payment UTR. Reason: ${rejectionReasonText.trim()}`
          }
        ]
      };
      currentOrders[idx] = updatedOrder;
      dbLocal.saveOrders(currentOrders);
      
      // Notify Customer
      dbLocal.addNotification(
        originalOrder.customerId,
        `Payment UTR Rejected`,
        `Verification failed for Order #${orderId} payment reference. Reason: "${rejectionReasonText.trim()}"`,
        'payment_rejected'
      );
      
      addToast(`Rejected payment UTR reference for Order #${orderId}. Notification dispatched.`, 'info');
      setRejectingOrderId(null);
      setRejectionReasonText('');
      loadData();
    }
  };

  const handleAdminUpdateDispatch = (orderId: string, courierName: string, trackingNumber: string, nextStatus?: Order['status']) => {
    const currentOrders = dbLocal.getOrders();
    const idx = currentOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      const originalOrder = currentOrders[idx];
      const updatedStatus = nextStatus || (originalOrder.status === 'Packed' ? 'Shipped' : originalOrder.status);
      const updatedOrder: Order = {
        ...originalOrder,
        status: updatedStatus,
        courierName: courierName.trim() || originalOrder.courierName,
        shippingProvider: courierName.trim() || originalOrder.shippingProvider || 'Standard Courier',
        trackingNumber: trackingNumber.trim() || originalOrder.trackingNumber,
        timeline: [
          ...(originalOrder.timeline || []),
          {
            status: updatedStatus,
            time: new Date().toISOString(),
            note: `Administrative dispatch update: Courier set to ${courierName.trim() || 'Standard Courier'} with Tracking/AWB No: ${trackingNumber.trim() || 'N/A'}`
          }
        ]
      };
      currentOrders[idx] = updatedOrder;
      dbLocal.saveOrders(currentOrders);

      // Notify customer
      dbLocal.addNotification(
        originalOrder.customerId,
        `Consignment Dispatch Updated`,
        `Your hospital equipment Order #${orderId} dispatch coordinates updated. Courier Partner: ${courierName || 'Courier'}, Consignment / Tracking No: ${trackingNumber || 'N/A'}.`,
        'order_shipped'
      );

      addToast(`Successfully updated courier & consignment tracking details for Order #${orderId}!`, 'success');
      loadData();
    }
  };

  const handleAdminForceStatus = (orderId: string, nextStatus: Order['status']) => {
    const currentOrders = dbLocal.getOrders();
    const idx = currentOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      const originalOrder = currentOrders[idx];
      const updatedOrder: Order = {
        ...originalOrder,
        status: nextStatus,
        timeline: [
          ...(originalOrder.timeline || []),
          {
            status: nextStatus,
            time: new Date().toISOString(),
            note: `Status updated to ${nextStatus} by Administrative Desk.`
          }
        ]
      };
      currentOrders[idx] = updatedOrder;
      dbLocal.saveOrders(currentOrders);

      dbLocal.addNotification(
        originalOrder.customerId,
        `Order Status Updated: ${nextStatus}`,
        `Your hospital equipment order #${orderId} status has changed to ${nextStatus}.`,
        nextStatus === 'Delivered' ? 'order_delivered' : 'system'
      );

      addToast(`Updated Order #${orderId} status to ${nextStatus}.`, 'success');
      loadData();
    }
  };

  // Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
  const pendingVendorsCount = vendors.filter(v => v.status === 'Pending').length;
  const pendingProductsCount = products.filter(p => p.status === 'Pending').length;
  const activeRfqsCount = dbLocal.getRfqs().filter(r => r.status === 'Open').length;
  const openTicketsCount = tickets.filter(t => t.status !== 'Closed').length;
  const pendingPaymentsCount = orders.filter(o => o.status === 'Awaiting Payment Verification').length;

  // Actions
  const handleVendorStatus = (
    vendorId: string,
    newStatus: 'Approved' | 'Rejected' | 'MoreInfoRequired' | 'Suspended',
    reasonText: string = ''
  ) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        const finalReason = ['Rejected', 'Suspended', 'MoreInfoRequired'].includes(newStatus) ? reasonText : '';
        
        // Formulate a beautiful status name for printing
        const statusLabelMap: Record<string, string> = {
          Approved: 'APPROVED & LIVE',
          Rejected: 'REJECTED',
          MoreInfoRequired: 'MORE INFORMATION REQUIRED',
          Suspended: 'TEMPORARILY SUSPENDED'
        };
        const statusLabel = statusLabelMap[newStatus] || newStatus;

        // Send simulated notification
        dbLocal.addNotification(
          vendorId,
          `Vendor Portal Status: ${statusLabel}`,
          `Your corporate account verification audit result is: ${statusLabel}.${
            finalReason ? ` Administrative Audit Notes: "${finalReason}"` : ' Your account is fully active and you may now list medical products and respond to RFQs.'
          }`,
          newStatus === 'Approved' ? 'vendor_approved' : 'vendor_registered'
        );

        // Append to push log telemetries
        const pushLogMsg = `[FCM CLOUD PUSH] Target: ${v.companyName} (${v.email}) | Title: Account ${statusLabel} | Msg: ${
          finalReason ? `Notes: ${finalReason}` : 'Validation cleared.'
        }`;
        console.log(pushLogMsg);

        // Store SMTP alert logs
        dbLocal.addNotification(
          'admin',
          'Vendor Outbound SMTP Logged',
          `Dispatched email notification alert to ${v.email} regarding verification status: ${newStatus}`,
          'vendor_registered'
        );

        return {
          ...v,
          status: newStatus,
          statusReason: finalReason,
          updatedAt: new Date().toISOString()
        };
      }
      return v;
    });

    dbLocal.saveVendors(updated);
    setVendors(updated);
    setSelectedVendorDoc(null);
    setStatusReasonText('');
    setReasonRequiredAction(null);
    addToast(`Vendor partner profile status updated to: ${newStatus}`, 'success');
  };

  const handleOpenAddVendor = () => {
    setVendorForm({
      companyName: '',
      ownerName: '',
      email: '',
      mobileNumber: '',
      gstNumber: '',
      panNumber: '',
      state: 'Maharashtra',
      district: 'Mumbai',
      pincode: '400001',
      customCommissionRate: 5.0,
      bankName: 'HDFC Bank',
      accountNumber: '',
      ifscCode: 'HDFC0000123',
      status: 'Approved'
    });
    setEditingVendorModal(null);
    setShowAddVendorModal(true);
  };

  const handleOpenEditVendor = (v: Vendor) => {
    setVendorForm({
      companyName: v.companyName || '',
      ownerName: v.ownerName || '',
      email: v.email || '',
      mobileNumber: v.mobileNumber || '',
      gstNumber: v.gstNumber || '',
      panNumber: v.panNumber || '',
      state: v.state || 'Maharashtra',
      district: v.district || 'Mumbai',
      pincode: v.pincode || '400001',
      customCommissionRate: v.customCommissionRate !== undefined ? v.customCommissionRate : 5.0,
      bankName: v.bankDetails?.bankName || 'HDFC Bank',
      accountNumber: v.bankDetails?.accountNumber || '',
      ifscCode: v.bankDetails?.ifscCode || 'HDFC0000123',
      status: (v.status as any) || 'Approved'
    });
    setEditingVendorModal(v);
    setShowAddVendorModal(true);
  };

  const handleSaveVendorForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.companyName.trim() || !vendorForm.ownerName.trim() || !vendorForm.email.trim()) {
      addToast('Please fill out all required vendor fields.', 'error');
      return;
    }

    if (editingVendorModal) {
      const updated = vendors.map(v => {
        if (v.id === editingVendorModal.id) {
          return {
            ...v,
            companyName: vendorForm.companyName,
            ownerName: vendorForm.ownerName,
            email: vendorForm.email,
            mobileNumber: vendorForm.mobileNumber,
            gstNumber: vendorForm.gstNumber,
            panNumber: vendorForm.panNumber,
            state: vendorForm.state,
            district: vendorForm.district,
            pincode: vendorForm.pincode,
            customCommissionRate: Number(vendorForm.customCommissionRate),
            status: vendorForm.status,
            bankDetails: {
              bankName: vendorForm.bankName,
              accountNumber: vendorForm.accountNumber,
              ifscCode: vendorForm.ifscCode
            },
            updatedAt: new Date().toISOString()
          };
        }
        return v;
      });
      dbLocal.saveVendors(updated);
      setVendors(updated);

      // Also sync user role if applicable
      const allUsers = dbLocal.getUsers();
      const updatedUsers = allUsers.map(u => {
        if (u.id === editingVendorModal.id || u.email === editingVendorModal.email) {
          return { ...u, name: vendorForm.ownerName, email: vendorForm.email, mobileNumber: vendorForm.mobileNumber, companyName: vendorForm.companyName };
        }
        return u;
      });
      dbLocal.saveUsers(updatedUsers);

      addToast(`Vendor "${vendorForm.companyName}" updated successfully.`, 'success');
    } else {
      const newVendorId = `vnd-${Date.now()}`;
      const newVendor: Vendor = {
        id: newVendorId,
        companyName: vendorForm.companyName,
        ownerName: vendorForm.ownerName,
        email: vendorForm.email,
        mobileNumber: vendorForm.mobileNumber,
        gstNumber: vendorForm.gstNumber || '27XXXXX0000X1Z5',
        panNumber: vendorForm.panNumber || 'ABCDE1234F',
        aadhaarNumber: 'XXXX-XXXX-XXXX',
        businessAddress: 'Verified Clinical District',
        state: vendorForm.state || 'Maharashtra',
        district: vendorForm.district || 'Mumbai',
        pincode: vendorForm.pincode || '400001',
        customCommissionRate: Number(vendorForm.customCommissionRate),
        status: vendorForm.status,
        trustSeal: true,
        trustSealLevel: 'Verified Clinical Supplier',
        createdAt: new Date().toISOString(),
        bankDetails: {
          bankName: vendorForm.bankName || 'HDFC Bank',
          accountNumber: vendorForm.accountNumber || 'XXXX-XXXX-1234',
          ifscCode: vendorForm.ifscCode || 'HDFC0000123'
        },
        documents: {
          gstCertificateName: 'GST_Cert_Verified.pdf',
          panCardName: 'PAN_Card_Verified.pdf',
          tradeLicenseName: 'Trade_License.pdf'
        }
      };

      const updatedVendors = [newVendor, ...vendors];
      dbLocal.saveVendors(updatedVendors);
      setVendors(updatedVendors);

      // Create corresponding user account so the vendor can log in
      const allUsers = dbLocal.getUsers();
      const newVendorUser: User = {
        id: newVendorId,
        name: vendorForm.ownerName,
        email: vendorForm.email,
        mobileNumber: vendorForm.mobileNumber,
        role: 'vendor',
        companyName: vendorForm.companyName
      };
      dbLocal.saveUsers([newVendorUser, ...allUsers]);

      addToast(`New vendor partner "${vendorForm.companyName}" registered and approved!`, 'success');
    }

    setShowAddVendorModal(false);
    setEditingVendorModal(null);
  };

  const handleDeleteVendor = (vendorId: string, companyName: string) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${companyName}"? Their records will be removed from the directory.`)) {
      return;
    }
    const updated = vendors.filter(v => v.id !== vendorId);
    dbLocal.saveVendors(updated);
    setVendors(updated);
    addToast(`Vendor "${companyName}" removed from directory.`, 'success');
  };

  const handleApproveProduct = (productId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        dbLocal.addNotification(
          p.vendorId,
          `Product Approved: ${p.name}`,
          `Your product "${p.name}" (SKU: ${p.sku}) has been approved by the Admin! It is now ready to be published.`,
          'product_approved'
        );
        return {
          ...p,
          status: 'Approved' as any,
          published: false,
          isActive: false,
          approvedBy: currentUser?.id || 'admin',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    dbLocal.saveProducts(updated);
    setProducts(updated);
    addToast('Product approved successfully! (Awaiting publication)', 'success');
  };

  const handlePublishProduct = (productId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        dbLocal.addNotification(
          p.vendorId,
          `Product Published Live: ${p.name}`,
          `Your product "${p.name}" (SKU: ${p.sku}) is now published and live on the marketplace! Customers can now view and purchase it.`,
          'info'
        );
        return {
          ...p,
          published: true,
          isActive: true,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    dbLocal.saveProducts(updated);
    setProducts(updated);
    addToast('Product published live!', 'success');
  };

  const handleUnpublishProduct = (productId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        dbLocal.addNotification(
          p.vendorId,
          `Product Unpublished: ${p.name}`,
          `Your product "${p.name}" (SKU: ${p.sku}) has been temporarily unpublished from the marketplace by the Admin.`,
          'alert'
        );
        return {
          ...p,
          published: false,
          isActive: false,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    dbLocal.saveProducts(updated);
    setProducts(updated);
    addToast('Product unpublished successfully.', 'info');
  };

  const handleRejectProduct = (productId: string, reason: string) => {
    if (!reason.trim()) {
      addToast('Please enter a rejection reason.', 'error');
      return;
    }
    const updated = products.map(p => {
      if (p.id === productId) {
        dbLocal.addNotification(
          p.vendorId,
          `Product Rejected: ${p.name}`,
          `Your product "${p.name}" (SKU: ${p.sku}) was rejected by the admin. Reason: "${reason}"`,
          'alert'
        );
        return {
          ...p,
          status: 'Rejected' as any,
          published: false,
          isActive: false,
          rejectedAt: new Date().toISOString(),
          rejectReason: reason,
          rejectionReason: reason,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    dbLocal.saveProducts(updated);
    setProducts(updated);
    addToast('Product rejected. Vendor notified.', 'info');
    setRejectingProduct(null);
    setRejectionReasonText('');
  };

  const handleRequestChanges = (productId: string, reason: string) => {
    if (!reason.trim()) {
      addToast('Please enter requested changes description.', 'error');
      return;
    }
    const updated = products.map(p => {
      if (p.id === productId) {
        dbLocal.addNotification(
          p.vendorId,
          `Changes Requested: ${p.name}`,
          `The admin requested changes on your product "${p.name}" (SKU: ${p.sku}). Details: "${reason}"`,
          'alert'
        );
        return {
          ...p,
          status: 'ChangesRequested' as any,
          published: false,
          isActive: false,
          rejectedAt: new Date().toISOString(),
          rejectReason: reason,
          rejectionReason: reason,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    dbLocal.saveProducts(updated);
    setProducts(updated);
    addToast('Changes requested. Vendor notified.', 'info');
    setRejectingProduct(null);
    setRejectionReasonText('');
  };

  const handleAdminDeleteProduct = (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to permanently delete product "${productName}"? This action cannot be undone.`)) return;
    const updated = products.filter(p => p.id !== productId);
    dbLocal.saveProducts(updated);
    setProducts(updated);
    addToast(`Product "${productName}" deleted successfully.`, 'info');
  };

  const handleAdminSaveEditedProduct = () => {
    if (!editingProductModal) return;
    const updated = products.map(p => p.id === editingProductModal.id ? editingProductModal : p);
    dbLocal.saveProducts(updated);
    setProducts(updated);
    addToast(`Product "${editingProductModal.name}" updated successfully!`, 'success');
    setEditingProductModal(null);
  };

  const handleTicketReply = (ticketId: string) => {
    if (!ticketReplyText.trim()) return;
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'In Progress' as const,
          replies: [
            ...t.replies,
            {
              id: `rep-${Date.now()}`,
              senderName: currentUser?.name || 'HealNex Support Desk',
              senderRole: 'super_admin',
              message: ticketReplyText,
              time: new Date().toISOString(),
              isStaff: true
            }
          ]
        };
      }
      return t;
    });
    dbLocal.saveTickets(updated);
    setTickets(updated);
    setTicketReplyText('');
    // Update active ticket display
    const currentT = updated.find(t => t.id === ticketId);
    if (currentT) setActiveTicket(currentT);
  };

  const closeTicket = (ticketId: string) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'Closed' as const };
      }
      return t;
    });
    dbLocal.saveTickets(updated);
    setTickets(updated);
    const currentT = updated.find(t => t.id === ticketId);
    if (currentT) setActiveTicket(currentT);
  };

  return (
    <>
      <div className="w-full font-sans print:hidden">
      
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-rose-700">
            <Shield className="w-6 h-6 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Administrative Operations Desk</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise-grade Multi-Vendor management, B2B clinical validations, and transaction clearing logs.
          </p>
        </div>

        {/* Action Tabs selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'kpis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Orders &amp; Dispatch
            {orders.filter(o => ['Packed', 'Shipped', 'Order Sent to Vendor'].includes(o.status)).length > 0 && (
              <span className="bg-sky-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{orders.filter(o => ['Packed', 'Shipped', 'Order Sent to Vendor'].includes(o.status)).length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'vendors' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Vendors Verification
            {pendingVendorsCount > 0 && (
              <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingVendorsCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Products Management
            {pendingProductsCount > 0 && (
              <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingProductsCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            🏷️ Categories & Brands
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'tickets' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Help Desk
            {openTicketsCount > 0 && (
              <span className="bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{openTicketsCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('verify-payments')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'verify-payments' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Verify Payments
            {pendingPaymentsCount > 0 && (
              <span className="bg-teal-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingPaymentsCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('vendor-payouts')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'vendor-payouts' ? 'bg-white text-slate-900 shadow-sm font-bold text-teal-800' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            💸 Vendor Payouts
            {clearanceRequests.filter(c => c.status === 'Pending').length > 0 && (
              <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{clearanceRequests.filter(c => c.status === 'Pending').length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('payment-settings')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'payment-settings' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Payment Settings
          </button>
          <button
            onClick={() => setActiveTab('whatsapp-support')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'whatsapp-support' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            WhatsApp Settings
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'banners' ? 'bg-white text-teal-900 shadow-sm font-bold border border-teal-200' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ImageIcon className="w-4 h-4 text-teal-600" />
            Promo Banners
            {promoBanners.filter(b => b.isActive).length > 0 && (
              <span className="bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{promoBanners.filter(b => b.isActive).length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('commission-settings')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'commission-settings' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            🏷️ Commission Settings
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Audit &amp; Reports
          </button>
        </div>
      </div>

      {/* tab view layouts */}
      {activeTab === 'kpis' && (
        <div className="space-y-8 animate-fade-in">
          {/* Platform Status & Active Infrastructure Nodes section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-[#1E40AF] rounded-xl">
                  <Activity className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Platform Status</p>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    LIVE &amp; STABLE
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-200">
                99.98% Uptime
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-[#1E40AF] rounded-xl">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Infrastructure Nodes</p>
                  <p className="text-sm font-bold text-slate-900">128 / 150 Operational</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-[#1E40AF] px-2.5 py-1 rounded-lg border border-blue-200">
                FCM Active
              </span>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Gross Revenue</p>
                <p className="text-xl font-bold font-mono text-slate-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Sales</p>
                <p className="text-xl font-bold font-mono text-slate-900">{orders.length} Orders</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pending Vendors</p>
                <p className="text-xl font-bold font-mono text-orange-700">{pendingVendorsCount} Pending</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Approval Items</p>
                <p className="text-xl font-bold font-mono text-rose-700">{pendingProductsCount} Products</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active RFQs</p>
                <p className="text-xl font-bold font-mono text-sky-700">{activeRfqsCount} Open</p>
              </div>
            </div>
          </div>

          {/* Graphical Analytics and performance maps */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Custom SVG Sales Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Analytics (INR)</h3>
                  <p className="text-[11px] text-slate-400">Trendline representing daily corporate transactions</p>
                </div>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  +14.2% Growth
                </span>
              </div>

              {/* Simulated Chart Container */}
              <div className="h-60 relative w-full flex items-end">
                {/* Background grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-40 text-[9px] font-mono text-slate-300 pointer-events-none">
                  <div className="border-b border-dashed border-slate-200 pb-1 w-full">₹1,00,000</div>
                  <div className="border-b border-dashed border-slate-200 pb-1 w-full">₹75,000</div>
                  <div className="border-b border-dashed border-slate-200 pb-1 w-full">₹50,000</div>
                  <div className="border-b border-dashed border-slate-200 pb-1 w-full">₹25,000</div>
                  <div className="w-full">₹0</div>
                </div>

                {/* SVG Line representation */}
                <svg className="w-full h-full absolute inset-0 pt-6 pr-4" viewBox="0 0 500 200" preserveAspectRatio="none">
                  <path
                    d="M 0 180 Q 80 140 160 150 T 320 90 T 480 50"
                    fill="none"
                    stroke="var(--theme-brand-hex, #0f766e)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 0 180 Q 80 140 160 150 T 320 90 T 480 50 L 500 200 L 0 200 Z"
                    fill="url(#gradient)"
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--theme-brand-hex, #0f766e)" />
                      <stop offset="100%" stopColor="#fff" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Grid labels */}
                <div className="w-full flex justify-between text-[10px] text-slate-400 font-mono pt-2 mt-4 relative z-10 border-t border-slate-100 px-1">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* Vendor distribution map */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Vendor Performance</h3>
              <p className="text-[11px] text-slate-400 mb-6">Distribution and approval ratings</p>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <div className="flex justify-between text-slate-700 mb-1.5">
                    <span>Approved & Active</span>
                    <span className="font-mono text-emerald-600">
                      {vendors.filter(v => v.status === 'Approved').length} Vendors
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1.5">
                    <span>Pending Administrative Audit</span>
                    <span className="font-mono text-orange-600">
                      {vendors.filter(v => v.status === 'Pending').length} Vendors
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1.5">
                    <span>Suspended or Rejected</span>
                    <span className="font-mono text-rose-600">
                      {vendors.filter(v => v.status === 'Rejected' || v.status === 'Suspended').length} Vendors
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders & Dispatch Management Desk */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-in pb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-700" />
                Hospital Consignment &amp; Vendor Dispatch Desk
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Monitor vendor order acceptances, packaging status, courier dispatch partners, and tracking coordinates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
                Total Orders: <strong className="font-mono">{orders.length}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {orders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">No Orders Logged</h4>
                <p className="text-xs text-slate-400">Hospital purchase orders will appear here once placed and verified.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                  <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-teal-800 text-sm bg-teal-50 px-2.5 py-1 rounded border border-teal-200">#{order.id}</span>
                      <div>
                        <p className="font-bold text-slate-800">{order.customerName}</p>
                        <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'Completed' || order.status === 'Delivered'
                          ? 'bg-emerald-100 border border-emerald-200 text-emerald-800'
                          : order.status === 'Shipped'
                            ? 'bg-blue-100 border border-blue-300 text-blue-900'
                            : order.status === 'Packed'
                              ? 'bg-purple-100 border border-purple-200 text-purple-800'
                              : order.status === 'Vendor Accepted'
                                ? 'bg-indigo-100 border border-indigo-200 text-indigo-800'
                                : order.status === 'Vendor Rejected'
                                  ? 'bg-rose-100 border border-rose-200 text-rose-800'
                                  : 'bg-slate-100 border border-slate-200 text-slate-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Buyer & Consignment Info */}
                    <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Procurement Hospital Target</p>
                      <p className="font-bold text-slate-800 text-sm">{order.shippingAddress.address || 'Hospital Center'}</p>
                      <p className="text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">Email: {order.customerEmail}</p>
                    </div>

                    {/* Assigned Vendor Partner */}
                    <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assigned Vendor Supplier</p>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-teal-700" />
                        {order.vendorName}
                      </p>
                      <p className="text-slate-500 text-[11px] font-medium">Items Count: {order.items.length} product(s)</p>
                      <p className="text-teal-800 font-bold text-sm mt-2 font-mono">Total Value: ₹{order.finalAmount.toLocaleString('en-IN')}</p>
                    </div>

                    {/* Courier Dispatch Coordinates */}
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Courier Dispatch Coordinates & Admin Override</p>
                      {order.trackingNumber || order.courierName ? (
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 space-y-1.5 font-mono mb-2">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-sans text-slate-500">Courier Partner:</span>
                            <strong className="font-sans font-bold text-slate-900">{order.courierName || order.shippingProvider || 'Standard Courier'}</strong>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-sans text-slate-500">Tracking No:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="bg-white px-2 py-0.5 rounded border border-sky-200 font-bold text-slate-900">{order.trackingNumber || 'N/A'}</span>
                              {order.trackingNumber && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(order.trackingNumber || '');
                                    addToast('Tracking number copied!', 'success');
                                  }}
                                  className="text-[10px] bg-sky-600 text-white px-1.5 py-0.5 rounded font-sans font-bold hover:bg-sky-700 transition"
                                >
                                  Copy
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl p-2.5 text-[11px] mb-2 font-medium">
                          Awaiting consignment number from supplier. Admin can assign courier below:
                        </div>
                      )}

                      {/* Administrative Quick Assign / Override Form */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 font-sans">
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            placeholder="Courier Partner (e.g. BlueDart)"
                            value={adminDispatchInputs[order.id]?.courierName !== undefined ? adminDispatchInputs[order.id].courierName : (order.courierName || order.shippingProvider || '')}
                            onChange={(e) => setAdminDispatchInputs({
                              ...adminDispatchInputs,
                              [order.id]: {
                                courierName: e.target.value,
                                trackingNumber: adminDispatchInputs[order.id]?.trackingNumber !== undefined ? adminDispatchInputs[order.id].trackingNumber : (order.trackingNumber || '')
                              }
                            })}
                            className="bg-white border border-slate-300 rounded p-1.5 text-[11px] outline-none focus:border-teal-600"
                          />
                          <input
                            type="text"
                            placeholder="Tracking / AWB No"
                            value={adminDispatchInputs[order.id]?.trackingNumber !== undefined ? adminDispatchInputs[order.id].trackingNumber : (order.trackingNumber || '')}
                            onChange={(e) => setAdminDispatchInputs({
                              ...adminDispatchInputs,
                              [order.id]: {
                                courierName: adminDispatchInputs[order.id]?.courierName !== undefined ? adminDispatchInputs[order.id].courierName : (order.courierName || order.shippingProvider || ''),
                                trackingNumber: e.target.value
                              }
                            })}
                            className="bg-white border border-slate-300 rounded p-1.5 text-[11px] font-mono outline-none focus:border-teal-600"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const input = adminDispatchInputs[order.id] || { courierName: order.courierName || order.shippingProvider || 'Standard Express', trackingNumber: order.trackingNumber || '' };
                              if (!input.trackingNumber?.trim()) {
                                addToast('Please enter a valid Tracking/AWB Number.', 'error');
                                return;
                              }
                              handleAdminUpdateDispatch(order.id, input.courierName, input.trackingNumber, 'Shipped');
                            }}
                            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-1 px-2 rounded text-[10px] transition shadow-sm"
                          >
                            Assign Dispatch &amp; Mark Shipped
                          </button>
                          {order.status !== 'Delivered' && (
                            <button
                              type="button"
                              onClick={() => handleAdminForceStatus(order.id, 'Delivered')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded text-[10px] transition shadow-sm"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Vendors Approval section */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in space-y-4 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-display">
                <Building2 className="w-5 h-5 text-teal-600" />
                Vendor Registration Directory ({vendors.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage medical equipment suppliers, register new B2B partners, edit commission rates, and review regulatory documents.
              </p>
            </div>
            <button
              onClick={handleOpenAddVendor}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition self-start md:self-center shrink-0"
            >
              <Plus className="w-4 h-4" />
              + Add New Vendor Partner
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor partners by company, owner name, email, or GSTIN..."
                value={vendorSearchText}
                onChange={(e) => setVendorSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={vendorStatusFilter}
                onChange={(e) => setVendorStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="All">All Vendor Statuses</option>
                <option value="Approved">🟢 Approved</option>
                <option value="Pending">🟠 Pending Review</option>
                <option value="Suspended">🟡 Suspended</option>
                <option value="Rejected">🔴 Rejected</option>
              </select>
            </div>
          </div>

          {(() => {
            const filteredVendors = vendors.filter(v => {
              const matchesSearch = vendorSearchText === '' ||
                v.companyName.toLowerCase().includes(vendorSearchText.toLowerCase()) ||
                v.ownerName.toLowerCase().includes(vendorSearchText.toLowerCase()) ||
                v.email.toLowerCase().includes(vendorSearchText.toLowerCase()) ||
                v.mobileNumber.includes(vendorSearchText) ||
                v.gstNumber.toLowerCase().includes(vendorSearchText.toLowerCase()) ||
                (v.state && v.state.toLowerCase().includes(vendorSearchText.toLowerCase()));
              const matchesStatus = vendorStatusFilter === 'All' || v.status === vendorStatusFilter;
              return matchesSearch && matchesStatus;
            });

            if (filteredVendors.length === 0) {
              return (
                <div className="p-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600">No vendor partners match your search criteria.</p>
                  <button
                    onClick={() => { setVendorSearchText(''); setVendorStatusFilter('All'); }}
                    className="mt-3 text-xs text-teal-600 font-bold hover:underline"
                  >
                    Reset Filters
                  </button>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Company Details</th>
                      <th className="py-3 px-4">Contact & Payouts</th>
                      <th className="py-3 px-4">State & GSTIN</th>
                      <th className="py-3 px-4">Catalog & Docs</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVendors.map((v) => {
                      const vendorProductsCount = products.filter(p => p.vendorId === v.id || p.vendorName === v.companyName).length;
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm">{v.companyName}</p>
                              {v.trustSeal && (
                                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1" title={v.trustSealLevel || 'Verified Clinical Supplier'}>
                                  🛡️ {v.trustSealLevel || 'Verified Seal'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500 font-medium">Owner: {v.ownerName}</span>
                              <span className="bg-teal-50 text-teal-800 border border-teal-200/80 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                {v.customCommissionRate !== undefined ? `${v.customCommissionRate}% Comm.` : '5% Comm.'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-slate-800 font-semibold">{v.email}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{v.mobileNumber}</p>
                            {v.bankDetails && (
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">Bank: {v.bankDetails.bankName}</p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-slate-800 font-medium">{v.state}</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">GST: {v.gstNumber}</p>
                          </td>
                          <td className="py-4 px-4 space-y-1">
                            {(() => {
                              const uploadedDocsCount = v.documents ? Object.keys(v.documents).filter(k => k.endsWith('Url') && (v.documents as any)[k]).length : 0;
                              return (
                                <button
                                  onClick={() => setSelectedVendorDoc(v)}
                                  className="text-xs text-teal-700 hover:text-teal-900 font-bold underline flex items-center gap-1 cursor-pointer"
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                  Review docs ({uploadedDocsCount || 8})
                                </button>
                              );
                            })()}
                            <button
                              onClick={() => setViewingVendorCatalogModal(v)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1 transition cursor-pointer"
                            >
                              <Package className="w-3 h-3 text-teal-600" />
                              View Catalog ({vendorProductsCount})
                            </button>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              v.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : v.status === 'Pending'
                                ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right space-x-1.5 flex items-center justify-end gap-1 flex-wrap">
                            <button
                              onClick={() => handleOpenEditVendor(v)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                              title="Edit Vendor Details"
                            >
                              <Edit className="w-3 h-3 text-slate-600" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setManagingSealVendor(v);
                                setSealForm({
                                  trustSeal: !!v.trustSeal,
                                  trustSealLevel: v.trustSealLevel || 'Verified Clinical Supplier'
                                });
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition ${
                                v.trustSeal
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <Shield className="w-3 h-3 text-amber-600" />
                              {v.trustSeal ? 'Seal' : 'Grant Seal'}
                            </button>
                            {v.status !== 'Approved' && (
                              <button
                                onClick={() => handleVendorStatus(v.id, 'Approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition"
                              >
                                Approve
                              </button>
                            )}
                            {v.status === 'Pending' && (
                              <button
                                onClick={() => handleVendorStatus(v.id, 'Rejected')}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition"
                              >
                                Reject
                              </button>
                            )}
                            {v.status === 'Approved' && (
                              <button
                                onClick={() => handleVendorStatus(v.id, 'Suspended')}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition"
                              >
                                Suspend
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteVendor(v.id, v.companyName)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Vendor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Add / Edit Vendor Modal */}
          {showAddVendorModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-scale-up font-sans">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {editingVendorModal ? `Edit Vendor: ${editingVendorModal.companyName}` : 'Register New Vendor Partner'}
                      </h3>
                      <p className="text-xs text-slate-500">Configure corporate identity, commission rates, and banking credentials.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowAddVendorModal(false); setEditingVendorModal(null); }}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveVendorForm} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company / Hospital Partner Name *</label>
                      <input
                        type="text"
                        required
                        value={vendorForm.companyName}
                        onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                        placeholder="e.g. Al Salam Medical Systems Pvt Ltd"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Owner / Authorized Representative *</label>
                      <input
                        type="text"
                        required
                        value={vendorForm.ownerName}
                        onChange={(e) => setVendorForm({ ...vendorForm, ownerName: e.target.value })}
                        placeholder="e.g. Tariq Al Salam"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address *</label>
                      <input
                        type="email"
                        required
                        value={vendorForm.email}
                        onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                        placeholder="vendor@alsalammed.com"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp Number *</label>
                      <input
                        type="text"
                        required
                        value={vendorForm.mobileNumber}
                        onChange={(e) => setVendorForm({ ...vendorForm, mobileNumber: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                      <input
                        type="text"
                        value={vendorForm.gstNumber}
                        onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                        placeholder="27ABCDE1234F1Z5"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                      <input
                        type="text"
                        value={vendorForm.panNumber}
                        onChange={(e) => setVendorForm({ ...vendorForm, panNumber: e.target.value })}
                        placeholder="ABCDE1234F"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Platform Commission Rate (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        value={vendorForm.customCommissionRate}
                        onChange={(e) => setVendorForm({ ...vendorForm, customCommissionRate: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-teal-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={vendorForm.state}
                        onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        value={vendorForm.district}
                        onChange={(e) => setVendorForm({ ...vendorForm, district: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                      <select
                        value={vendorForm.status}
                        onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value as any })}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Approved">🟢 Approved & Live</option>
                        <option value="Pending">🟠 Pending Review</option>
                        <option value="Suspended">🟡 Suspended</option>
                        <option value="Rejected">🔴 Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Bank Disbursement Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={vendorForm.bankName}
                          onChange={(e) => setVendorForm({ ...vendorForm, bankName: e.target.value })}
                          placeholder="HDFC Bank"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Number</label>
                        <input
                          type="text"
                          value={vendorForm.accountNumber}
                          onChange={(e) => setVendorForm({ ...vendorForm, accountNumber: e.target.value })}
                          placeholder="502000XXXXXX"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">IFSC Code</label>
                        <input
                          type="text"
                          value={vendorForm.ifscCode}
                          onChange={(e) => setVendorForm({ ...vendorForm, ifscCode: e.target.value })}
                          placeholder="HDFC0000123"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setShowAddVendorModal(false); setEditingVendorModal(null); }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2 rounded-xl text-xs transition shadow-sm"
                    >
                      {editingVendorModal ? 'Save Vendor Changes' : 'Register Vendor Partner'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Vendor Catalog Modal */}
          {viewingVendorCatalogModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
              <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 max-h-[85vh] overflow-y-auto animate-scale-up font-sans">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                      <Package className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Catalog Directory: {viewingVendorCatalogModal.companyName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Listed equipment & consumables associated with this vendor profile.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingVendorCatalogModal(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const vendorProds = products.filter(p => p.vendorId === viewingVendorCatalogModal.id || p.vendorName === viewingVendorCatalogModal.companyName);
                  if (vendorProds.length === 0) {
                    return (
                      <div className="p-10 text-center text-slate-400">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-bold text-slate-600">No products currently listed by this vendor.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {vendorProds.map(prod => (
                        <div key={prod.id} className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 hover:bg-white transition">
                          <div className="flex items-center gap-3.5">
                            <img src={prod.images[0]} alt={prod.name} className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs text-slate-900">{prod.name}</h4>
                                <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">SKU: {prod.sku}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{prod.category} • ₹{prod.salePrice.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              prod.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                              {prod.status}
                            </span>
                            <button
                              onClick={() => {
                                setViewingVendorCatalogModal(null);
                                setActiveTab('products');
                                setProductSearchText(prod.name);
                              }}
                              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition"
                            >
                              Manage Product
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const v = viewingVendorCatalogModal;
                      setViewingVendorCatalogModal(null);
                      setActiveTab('products');
                      setProductVendorFilter(v.companyName);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition"
                  >
                    Open in Full Products Manager &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Trust Seal Modal */}
          {managingSealVendor && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-scale-up font-sans">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Vendor Trust Seal Award</h3>
                      <p className="text-xs text-slate-500">{managingSealVendor.companyName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setManagingSealVendor(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    Granting a Trust Seal displays an official gold verification badge on the vendor's catalog items in the marketplace, assuring hospitals and buyers of biomedical calibration and supplier credibility.
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">Enable Official Trust Seal</span>
                      <span className="text-[11px] text-slate-500">Show verification badge to customers</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSealForm({ ...sealForm, trustSeal: !sealForm.trustSeal })}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                        sealForm.trustSeal ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        sealForm.trustSeal ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {sealForm.trustSeal && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">Select Seal Level / Badge Title</label>
                      <select
                        value={sealForm.trustSealLevel}
                        onChange={(e) => setSealForm({ ...sealForm, trustSealLevel: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Verified Clinical Supplier">🛡️ Verified Clinical Supplier</option>
                        <option value="Authorized Direct OEM">🏆 Authorized Direct OEM</option>
                        <option value="ISO 13485 Certified Partner">🏅 ISO 13485 Certified Partner</option>
                        <option value="Government Tender Eligible">🏛️ Government Tender Eligible</option>
                        <option value="Gold Supplier Partner">💎 Gold Supplier Partner</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setManagingSealVendor(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTrustSeal}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save Trust Seal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories & Brands Global Governance tab */}
      {activeTab === 'categories' && (
        <AdminCategoriesManager onRefresh={loadData} />
      )}

      {/* Vendor Products Management tab */}
      {activeTab === 'products' && (() => {
        const uniqueVendors = Array.from(new Set(products.map(p => p.vendorName || 'Unknown Vendor'))).filter(Boolean);
        const uniqueCategories = Array.from(new Set(products.map(p => p.category || 'General'))).filter(Boolean);
        const uniqueBrands = Array.from(new Set(products.map(p => p.brand || 'General'))).filter(Boolean);

        const todayStr = new Date().toISOString().split('T')[0];

        // Statistics computations
        const totalCount = products.length;
        const pendingCount = products.filter(p => p.status?.toLowerCase() === 'pending').length;
        const approvedCount = products.filter(p => p.status?.toLowerCase() === 'approved').length;
        const publishedCount = products.filter(p => p.published === true).length;
        const rejectedCount = products.filter(p => p.status?.toLowerCase() === 'rejected').length;
        const unpublishedCount = products.filter(p => p.status?.toLowerCase() === 'approved' && !p.published).length;
        const addedTodayCount = products.filter(p => p.createdAt && p.createdAt.startsWith(todayStr)).length;

        const filteredProducts = products.filter(p => {
          const matchesSearch = !productSearchText.trim() ||
            p.name.toLowerCase().includes(productSearchText.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearchText.toLowerCase()) ||
            (p.brand || '').toLowerCase().includes(productSearchText.toLowerCase()) ||
            (p.vendorName || '').toLowerCase().includes(productSearchText.toLowerCase());

          let matchesStatus = true;
          if (productStatusFilter !== 'All') {
            const statLower = p.status?.toLowerCase() || '';
            if (productStatusFilter === 'Pending') {
              matchesStatus = statLower === 'pending';
            } else if (productStatusFilter === 'Approved') {
              matchesStatus = statLower === 'approved';
            } else if (productStatusFilter === 'Published') {
              matchesStatus = p.published === true;
            } else if (productStatusFilter === 'Rejected') {
              matchesStatus = statLower === 'rejected';
            } else if (productStatusFilter === 'Unpublished') {
              matchesStatus = statLower === 'approved' && !p.published;
            } else if (productStatusFilter === 'OutOfStock') {
              matchesStatus = (p.stockQuantity !== undefined && p.stockQuantity <= 0) || p.outOfStock === true;
            } else if (productStatusFilter === 'ChangesRequested') {
              matchesStatus = statLower === 'changesrequested' || statLower === 'needs_changes';
            } else if (productStatusFilter === 'Draft') {
              matchesStatus = statLower === 'draft';
            } else if (productStatusFilter === 'AddedToday') {
              matchesStatus = p.createdAt && p.createdAt.startsWith(todayStr);
            }
          }

          const matchesVendor = productVendorFilter === 'All' || p.vendorName === productVendorFilter;
          const matchesCategory = productCategoryFilter === 'All' || p.category === productCategoryFilter;
          const matchesBrand = productBrandFilter === 'All' || p.brand === productBrandFilter;

          return matchesSearch && matchesStatus && matchesVendor && matchesCategory && matchesBrand;
        });

        return (
          <div className="space-y-6 animate-fade-in font-sans">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Box className="w-5 h-5 text-teal-600" /> Vendor Products & Quality Control Audit
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Full administrative control over marketplace inventory: audit listings, approve & publish to live customer portal, or reject listings with notes.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold bg-teal-50 text-teal-800 px-4 py-2.5 rounded-xl border border-teal-200">
                <Shield className="w-4 h-4 text-teal-600" /> Catalog Audit Mode Active
              </div>
            </div>

            {/* Quick KPI & Status Filters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <button
                onClick={() => setProductStatusFilter('All')}
                className={`p-3 rounded-xl border text-left transition ${productStatusFilter === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Total Catalog</p>
                <p className="text-xl font-black font-mono mt-0.5">{totalCount}</p>
              </button>

              <button
                onClick={() => setProductStatusFilter('Pending')}
                className={`p-3 rounded-xl border text-left transition ${productStatusFilter === 'Pending' ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold' : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800'}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Pending Audit</p>
                <p className="text-xl font-black font-mono mt-0.5 text-amber-600 group-hover:text-slate-950">{pendingCount}</p>
              </button>

              <button
                onClick={() => setProductStatusFilter('Approved')}
                className={`p-3 rounded-xl border text-left transition ${productStatusFilter === 'Approved' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800'}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Approved</p>
                <p className="text-xl font-black font-mono mt-0.5 text-emerald-500 group-hover:text-white">{approvedCount}</p>
              </button>

              <button
                onClick={() => setProductStatusFilter('Published')}
                className={`p-3 rounded-xl border text-left transition ${productStatusFilter === 'Published' ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white border-slate-200 hover:border-teal-300 text-slate-800'}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Published (Live)</p>
                <p className="text-xl font-black font-mono mt-0.5 text-teal-600 group-hover:text-white">{publishedCount}</p>
              </button>

              <button
                onClick={() => setProductStatusFilter('Rejected')}
                className={`p-3 rounded-xl border text-left transition ${productStatusFilter === 'Rejected' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white border-slate-200 hover:border-rose-300 text-slate-800'}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Rejected</p>
                <p className="text-xl font-black font-mono mt-0.5 text-rose-500 group-hover:text-white">{rejectedCount}</p>
              </button>

              <button
                onClick={() => setProductStatusFilter('Unpublished')}
                className={`p-3 rounded-xl border text-left transition ${productStatusFilter === 'Unpublished' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Unpublished</p>
                <p className="text-xl font-black font-mono mt-0.5 text-indigo-500 group-hover:text-white">{unpublishedCount}</p>
              </button>

              <button
                onClick={() => setProductStatusFilter('AddedToday')}
                className={`p-3 rounded-xl border text-left transition ${productStatusFilter === 'AddedToday' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white border-slate-200 hover:border-purple-300 text-slate-800'}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Added Today</p>
                <p className="text-xl font-black font-mono mt-0.5 text-purple-500 group-hover:text-white">{addedTodayCount}</p>
              </button>
            </div>

            {/* Filter Controls Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search name, SKU, vendor or brand..."
                  value={productSearchText}
                  onChange={(e) => setProductSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                <select
                  value={productVendorFilter}
                  onChange={(e) => setProductVendorFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="All">All Vendors</option>
                  {uniqueVendors.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="All">All Categories</option>
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={productBrandFilter}
                  onChange={(e) => setProductBrandFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="All">All Brands</option>
                  {uniqueBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="All">All Statuses/States</option>
                  <option value="Pending">Pending Audit</option>
                  <option value="Approved">Approved</option>
                  <option value="Published">Published Live</option>
                  <option value="Unpublished">Unpublished</option>
                  <option value="Rejected">Rejected</option>
                  <option value="ChangesRequested">Changes Requested</option>
                  <option value="OutOfStock">Out of Stock</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Products Catalog Table / List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Showing {filteredProducts.length} Product(s)</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">No matching vendor products found.</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or filter selection.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const uploadDate = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'Unknown Date';

                    const isApproved = p.status?.toLowerCase() === 'approved';
                    const isPending = p.status?.toLowerCase() === 'pending';
                    const isRejected = p.status?.toLowerCase() === 'rejected';
                    const isChangesRequested = p.status?.toLowerCase() === 'changesrequested' || p.status?.toLowerCase() === 'needs_changes';
                    const isDraft = p.status?.toLowerCase() === 'draft';

                    return (
                      <div key={p.id} className="p-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 hover:bg-slate-50/50 transition">
                        {/* Product Thumbnail & Details */}
                        <div className="flex gap-4 flex-1">
                          <div className="relative">
                            <img
                              src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1516549655169-df83a0774514'}
                              alt={p.name}
                              className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm bg-white"
                            />
                            {p.published ? (
                              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                Live
                              </span>
                            ) : (
                              <span className="absolute -top-1.5 -right-1.5 bg-slate-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                Hidden
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                                {p.category}
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold font-mono">
                                SKU: {p.sku}
                              </span>
                              <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded font-bold">
                                Brand: {p.brand || 'No Brand'}
                              </span>
                              
                              {/* Workflow Status Badge */}
                              <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                                isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                isPending ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
                                isChangesRequested ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                isDraft ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                Status: {p.status || 'Draft'}
                              </span>

                              {/* Publication State Badge */}
                              {p.published ? (
                                <span className="text-[9px] bg-teal-500 text-white px-2 py-0.5 rounded font-bold">
                                  LIVE & PUBLISHED
                                </span>
                              ) : (
                                <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">
                                  {isApproved ? 'APPROVED (UNPUBLISHED)' : 'NOT PUBLISHED'}
                                </span>
                              )}
                            </div>

                            <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{p.name}</h4>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium pt-1">
                              <span>Vendor: <strong className="text-teal-700 font-bold">{p.vendorName || 'Unknown Vendor'}</strong></span>
                              <span>Price: <strong className="text-emerald-700 font-mono font-bold">₹{p.price.toLocaleString('en-IN')}</strong> {p.mrp ? <span className="line-through text-slate-400 text-[11px]">₹{p.mrp.toLocaleString('en-IN')}</span> : null}</span>
                              <span>Stock: <strong className="text-slate-800 font-mono font-bold">{p.stockQuantity} {p.unit || 'Piece(s)'}</strong></span>
                              <span>MOQ: <strong className="text-slate-700">{p.moq}</strong></span>
                              <span>Upload Date: <strong className="text-indigo-700">{uploadDate}</strong></span>
                            </div>

                            {/* Commission & Pricing details */}
                            <div className="mt-3 bg-slate-50/80 rounded-xl p-3 text-xs max-w-xl border border-slate-200">
                              <span className="font-extrabold block text-slate-800 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200 mb-2">
                                Commercial Pricing & Commission Split:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase">Vendor Net</span>
                                  <span className="font-bold text-slate-700">₹{(p.vendorPrice ?? p.price).toLocaleString('en-IN')}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase">Comm. Rate</span>
                                  <span className="font-bold text-indigo-700 font-mono">{p.commissionPercent ?? 7}%</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase">Comm. Amt</span>
                                  <span className="font-bold text-slate-700">₹{(p.commissionAmount ?? Math.round((p.vendorPrice ?? p.price) * 0.07)).toLocaleString('en-IN')}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase">Cust. Price</span>
                                  <span className="font-extrabold text-teal-700">₹{(p.customerPrice ?? p.price).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>

                            {/* Show rejection or changes requested reason if present */}
                            {(isRejected || isChangesRequested) && p.rejectReason && (
                              <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-2.5 mt-2 max-w-2xl text-[11px] text-rose-800">
                                <span className="font-extrabold block uppercase tracking-wider text-[10px]">Audit Note:</span>
                                {p.rejectReason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Admin Actions Toolbar */}
                        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end border-t xl:border-t-0 pt-3 xl:pt-0">
                          
                          {/* 1. APPROVE BUTTON - Show for Pending, Rejected, or ChangesRequested */}
                          {(isPending || isRejected || isChangesRequested) && (
                            <button
                              onClick={() => handleApproveProduct(p.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                              title="Approve product listing"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}

                          {/* 2. REJECT BUTTON - Show for Pending */}
                          {isPending && (
                            <button
                              onClick={() => {
                                setRejectingProduct(p);
                                setIsRequestChangesAction(false);
                                setRejectionReasonText('');
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                              title="Reject product listing"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}

                          {/* 3. REQUEST CHANGES BUTTON - Show for Pending */}
                          {isPending && (
                            <button
                              onClick={() => {
                                setRejectingProduct(p);
                                setIsRequestChangesAction(true);
                                setRejectionReasonText('');
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                              title="Request specifications updates from vendor"
                            >
                              <Edit className="w-3.5 h-3.5" /> Req Changes
                            </button>
                          )}

                          {/* 4. PUBLISH BUTTON - Show if Approved but not published */}
                          {isApproved && !p.published && (
                            <button
                              onClick={() => handlePublishProduct(p.id)}
                              className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                              title="Publish listing to customer-facing catalog"
                            >
                              <Upload className="w-3.5 h-3.5" /> Publish Live
                            </button>
                          )}

                          {/* 5. UNPUBLISH BUTTON - Show if currently published */}
                          {p.published && (
                            <button
                              onClick={() => handleUnpublishProduct(p.id)}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                              title="Hide from customer catalog"
                            >
                              <Eye className="w-3.5 h-3.5" /> Unpublish
                            </button>
                          )}

                          {/* 6. EYE PREVIEW BUTTON - Available for all */}
                          <button
                            onClick={() => setPreviewingProduct(p)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                            title="Preview customer product page"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" /> Preview
                          </button>

                          {/* 7. EDIT BUTTON - Admin edit */}
                          <button
                            onClick={() => setEditingProductModal({ ...p })}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                            title="Edit vendor listing details directly"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600" /> Edit
                          </button>

                          {/* 8. DELETE BUTTON - Admin delete */}
                          <button
                            onClick={() => handleAdminDeleteProduct(p.id, p.name)}
                            className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 border border-rose-200 hover:border-rose-600"
                            title="Permanently remove from catalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* A. Rejection or Request Changes Input Dialog Modal */}
            {rejectingProduct && (
              <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-scale-up font-sans">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      {isRequestChangesAction ? (
                        <span className="text-amber-600">📝 Request Product Changes</span>
                      ) : (
                        <span className="text-rose-600">❌ Reject Product Listing</span>
                      )}
                    </h3>
                    <button
                      onClick={() => { setRejectingProduct(null); setRejectionReasonText(''); }}
                      className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500">Product to audit:</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">{rejectingProduct.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {rejectingProduct.sku} | Vendor: {rejectingProduct.vendorName}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        {isRequestChangesAction ? 'Specify details for updates requested from vendor:' : 'Enter audit rejection reason details:'}
                      </label>
                      <textarea
                        value={productRejectReasonText}
                        onChange={(e) => setProductRejectReasonText(e.target.value)}
                        rows={4}
                        placeholder={isRequestChangesAction 
                          ? "e.g., Please clarify the specific warranty terms in the specifications table." 
                          : "e.g., Missing essential medical certification files or invalid specifications parameters."
                        }
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => { setRejectingProduct(null); setProductRejectReasonText(''); }}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (isRequestChangesAction) {
                          handleRequestChanges(rejectingProduct.id, productRejectReasonText);
                        } else {
                          handleRejectProduct(rejectingProduct.id, productRejectReasonText);
                        }
                      }}
                      className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition ${
                        isRequestChangesAction ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {isRequestChangesAction ? 'Submit Change Request' : 'Reject & Notify'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* B. Customer-Facing High-Fidelity Product Page Preview Overlay Modal */}
            {previewingProduct && (
              <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scale-up font-sans relative">
                  
                  {/* Top Banner indicating preview */}
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-teal-600 shrink-0" />
                      <span className="text-xs font-extrabold text-teal-900">
                        ADMIN CUSTOMER PORTAL PREVIEW — Exact client layout presentation
                      </span>
                    </div>
                    <button
                      onClick={() => setPreviewingProduct(null)}
                      className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800"
                    >
                      Close Preview
                    </button>
                  </div>

                  {/* Close Button top-right */}
                  <button
                    onClick={() => setPreviewingProduct(null)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
                  >
                    ✕
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Product Images */}
                    <div className="space-y-4">
                      <div className="aspect-square rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
                        <img
                          src={previewingProduct.images && previewingProduct.images[0] ? previewingProduct.images[0] : 'https://images.unsplash.com/photo-1516549655169-df83a0774514'}
                          alt={previewingProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {previewingProduct.images && previewingProduct.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {previewingProduct.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt="thumbnail"
                              className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-white"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Product Meta, Price, and Actions */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">
                            {previewingProduct.category}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                            SKU: {previewingProduct.sku}
                          </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900">{previewingProduct.name}</h2>
                        <p className="text-xs text-slate-500 leading-relaxed">{previewingProduct.shortDescription || previewingProduct.description}</p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-emerald-700 font-mono">₹{previewingProduct.salePrice || previewingProduct.price}</span>
                          {previewingProduct.mrp && (
                            <span className="text-xs line-through text-slate-400 font-mono">MRP: ₹{previewingProduct.mrp}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium space-y-1">
                          <div className="flex justify-between">
                            <span>Minimum Order Quantity (MOQ):</span>
                            <span className="font-extrabold text-slate-800">{previewingProduct.moq} Piece(s)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>GST Rate / HSN Code:</span>
                            <span className="font-mono text-slate-800">{previewingProduct.gstRate}% / {previewingProduct.hsnCode || '9018'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Availability / Stock:</span>
                            <span className="font-mono font-extrabold text-emerald-600">{previewingProduct.stockQuantity} in stock</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Warranty:</span>
                            <span className="font-extrabold text-teal-800">{previewingProduct.warranty || '1 Year'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-700">Vendor Supplier Info:</p>
                        <div className="p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs bg-slate-50/50">
                          <div>
                            <p className="font-extrabold text-slate-800">{previewingProduct.vendorName}</p>
                            <p className="text-[10px] text-slate-400">Origin: {previewingProduct.countryOfOrigin || 'India'}</p>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-lg">
                            Verified Supplier
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specifications Block */}
                  {previewingProduct.specifications && previewingProduct.specifications.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Technical Specifications</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {previewingProduct.specifications.map((spec, i) => (
                          <div key={i} className="flex justify-between text-xs border-b border-slate-100 pb-2">
                            <span className="text-slate-500 font-medium">{spec.key}</span>
                            <span className="text-slate-900 font-bold">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Support Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Tickets List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-1">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Assigned Tickets</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setActiveTicket(t)}
                  className={`p-4 transition text-left cursor-pointer ${
                    activeTicket?.id === t.id ? 'bg-teal-50/50 border-r-4 border-teal-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                      {t.category}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      t.status === 'Open'
                        ? 'bg-rose-50 text-rose-700'
                        : t.status === 'In Progress'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{t.subject}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{t.description}</p>
                  <p className="text-[10px] text-slate-400 mt-2">Opened by {t.userName}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Ticket Details Chat thread */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col min-h-[500px]">
            {activeTicket ? (
              <>
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-slate-400">ID: {activeTicket.id}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{activeTicket.subject}</h3>
                    <p className="text-[11px] text-slate-500">Contact: {activeTicket.userName} ({activeTicket.userEmail})</p>
                  </div>
                  {activeTicket.status !== 'Closed' && (
                    <button
                      onClick={() => closeTicket(activeTicket.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Close Ticket
                    </button>
                  )}
                </div>

                {/* Messages Panel */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[300px]">
                  {activeTicket.replies.map((rep) => (
                    <div key={rep.id} className={`flex flex-col ${rep.isStaff ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                        rep.isStaff
                          ? 'bg-teal-700 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none'
                      }`}>
                        <p className="font-semibold text-[10px] opacity-75 mb-1">{rep.senderName}</p>
                        <p>{rep.message}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1">
                        {new Date(rep.time).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {activeTicket.status !== 'Closed' ? (
                  <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                    <div className="flex gap-3">
                      <textarea
                        rows={2}
                        placeholder="Type clinical solution or reply to vendor..."
                        value={ticketReplyText}
                        onChange={(e) => setTicketReplyText(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-teal-700 transition resize-none"
                      />
                      <button
                        onClick={() => handleTicketReply(activeTicket.id)}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 rounded-xl transition flex items-center justify-center shrink-0"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t border-slate-100 bg-slate-50 text-center shrink-0">
                    <p className="text-xs text-slate-400 font-semibold">This support ticket has been marked Closed.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-200 mb-2" />
                <p className="text-xs">Select a support ticket from the checklist to open details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin B2B Payment Clearance Verification Panel */}
      {activeTab === 'verify-payments' && (
        <div className="space-y-6 animate-fade-in pb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-700" />
              Manual Payment Clearance Audit Desk
            </h2>
            <p className="text-xs text-slate-500 mt-1">Audit offline UPI and Bank transfer UTR numbers manually against your bank statements before confirming orders.</p>
          </div>

          {orders.filter(o => o.status === 'Awaiting Payment Verification' || o.status === 'Payment Pending Verification').length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4 max-w-xl mx-auto">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">All Payments Audited</h4>
                <p className="text-xs text-slate-400 mt-1">There are no pending manual payment references awaiting administrative clearance.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {orders
                .filter(o => o.status === 'Awaiting Payment Verification' || o.status === 'Payment Pending Verification')
                .map((order) => {
                  const isRejecting = rejectingOrderId === order.id;

                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                      
                      {/* Left Column: Order details */}
                      <div className="p-6 lg:col-span-2 space-y-4 border-r border-slate-100">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 font-mono font-bold px-2 py-0.5 rounded">
                              Order #{order.id}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-2 font-medium">
                              Logged: {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            {order.status}
                          </span>
                        </div>

                        {/* Customer detail */}
                        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold">Procurement Customer</p>
                            <p className="text-slate-800 font-bold mt-0.5">{order.shippingAddress.address || 'Hospital Authority'}</p>
                            <p className="text-slate-500 text-[10px]">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold">Payment Method</p>
                            <p className="text-slate-800 font-bold mt-0.5">{order.paymentMethod}</p>
                            <p className="text-teal-700 font-mono font-bold">Amount: ₹{order.finalAmount.toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Line items details */}
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Procured Line Items</p>
                          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl px-3 py-1 bg-white">
                            {order.items.map((item, index) => (
                              <div key={index} className="py-2 flex justify-between text-xs">
                                <span className="text-slate-700 font-bold max-w-[70%] truncate">{item.productName} (x{item.quantity})</span>
                                <span className="text-slate-500 font-mono">₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Transaction Receipt coordinates reported */}
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Transaction receipt metadata</p>
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1.5 font-medium text-slate-600">
                            <p className="font-mono">UTR / Transaction ID: <strong className="text-slate-900 font-bold select-all bg-white border px-1.5 py-0.5 rounded">{order.paymentTxId || 'NOT REPORTED'}</strong></p>
                            {order.paymentNote && <p>Customer Reference Note: <span className="italic text-slate-800">"{order.paymentNote}"</span></p>}
                          </div>
                        </div>

                        {/* Audit Actions */}
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                          {!isRejecting ? (
                            <>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Clear payment verification for Order #${order.id} and route to vendor?`)) {
                                    handleVerifyPayment(order.id);
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve & Confirm Order
                              </button>
                              <button
                                onClick={() => setRejectingOrderId(order.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject Payment / UTR
                              </button>
                            </>
                          ) : (
                            <div className="w-full bg-rose-50/50 p-4 rounded-xl border border-rose-200 space-y-3">
                              <h5 className="text-rose-900 font-bold text-[11px] uppercase tracking-wider">Reject Payment Clearance</h5>
                              <div>
                                <label className="text-slate-500 block mb-1 text-[10px] font-bold">Specify Rejection Reason (sent to customer) *</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Transaction ID does not match, amount mismatch..."
                                  value={rejectionReasonText}
                                  onChange={(e) => setRejectionReasonText(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-rose-600 transition font-medium text-slate-800"
                                />
                              </div>
                              
                              {/* Quick Rejection Templates */}
                              <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Quick Reason Templates:</span>
                                <div className="flex flex-wrap gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setRejectionReasonText("Reported Transaction Reference (UTR) is invalid or could not be verified in our bank statement. Please verify and re-submit.")}
                                    className="px-2 py-1 bg-white border border-rose-100 hover:bg-rose-100 hover:border-rose-200 text-rose-700 text-[9px] font-bold rounded transition text-left"
                                  >
                                    🔑 Invalid Transaction ID
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectionReasonText("The transferred amount does not match the procurement order total. Please check and re-submit with correct reference details.")}
                                    className="px-2 py-1 bg-white border border-rose-100 hover:bg-rose-100 hover:border-rose-200 text-rose-700 text-[9px] font-bold rounded transition text-left"
                                  >
                                    💰 Amount Mismatch
                                  </button>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handleRejectPayment(order.id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg uppercase transition"
                                >
                                  Confirm Rejection
                                </button>
                                <button
                                  onClick={() => { setRejectingOrderId(null); setRejectionReasonText(''); }}
                                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Statement Checklist Visual */}
                      <div className="p-6 bg-slate-50/80 flex flex-col justify-between items-stretch text-left">
                        <div className="w-full space-y-4">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Manual Statement Checklist</p>
                          
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs text-slate-600 font-medium">
                            <p className="font-bold text-teal-800 uppercase text-[9px] tracking-wider">Audit Checklist Steps:</p>
                            <div className="flex gap-2 items-start">
                              <span className="text-teal-600 font-bold">✔</span>
                              <p>Open your bank account statement or business payment gateway app.</p>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="text-teal-600 font-bold">✔</span>
                              <p>Look for the transaction with UTR Reference ID: <strong className="text-slate-950 font-mono select-all bg-slate-50 border px-1.5 py-0.5 rounded text-[11px] font-bold">{order.paymentTxId || 'N/A'}</strong></p>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="text-teal-600 font-bold">✔</span>
                              <p>Match the transferred amount: <strong className="text-slate-950 font-extrabold text-sm">₹{order.finalAmount.toLocaleString('en-IN')}</strong></p>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="text-teal-600 font-bold">✔</span>
                              <p>Confirm the payment status, then Approve or Reject on the left panel.</p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full border-t border-slate-200/60 pt-4 mt-6 text-[10px] text-slate-400 font-medium">
                          Audit logs logged under administrator key.
                        </div>
                      </div>

                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Admin Vendor Settlement & Payout Center */}
      {activeTab === 'vendor-payouts' && (() => {
        const totalNetworkSales = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
        const totalPaidOut = clearanceRequests.filter(c => c.status === 'Approved').reduce((sum, c) => sum + c.amount, 0);
        const totalPendingRequests = clearanceRequests.filter(c => c.status === 'Pending').reduce((sum, c) => sum + c.amount, 0);
        const totalCommissionEarned = clearanceRequests.reduce((sum, c) => sum + (c.commissionDeducted ?? Math.round(c.amount * 0.1)), 0);

        const filteredClearances = clearanceRequests.filter(req => {
          if (clearanceStatusFilter !== 'All' && req.status !== clearanceStatusFilter) return false;
          if (clearanceVendorFilter !== 'All' && req.vendorId !== clearanceVendorFilter) return false;
          if (clearanceSearchQuery.trim()) {
            const q = clearanceSearchQuery.toLowerCase();
            return req.vendorName.toLowerCase().includes(q) || req.id.toLowerCase().includes(q) || (req.paymentReference && req.paymentReference.toLowerCase().includes(q));
          }
          return true;
        });

        return (
          <div className="space-y-6 animate-fade-in pb-12">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-teal-700" />
                  Admin Panel – Vendor Settlement & Payouts
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Comprehensive vendor wallet dashboard, platform commission deductions, automated settlement ledger, and clearance processing.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <button
                  onClick={() => handleExportSettlementReport('excel')}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
                <button
                  onClick={() => handleExportSettlementReport('pdf')}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

            {/* Vendor Wallet & Platform Financial Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Network Sales</span>
                <div className="text-lg font-black text-slate-900 font-display">₹{totalNetworkSales.toLocaleString()}</div>
                <span className="text-[9px] text-emerald-600 font-semibold">Gross order value</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Platform Commission</span>
                <div className="text-lg font-black text-teal-700 font-display">₹{totalCommissionEarned.toLocaleString()}</div>
                <span className="text-[9px] text-slate-500 font-semibold">{paymentSettings.platformCommissionRate || 10}% platform cut</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST on Commission</span>
                <div className="text-lg font-black text-indigo-700 font-display">₹{Math.round(totalCommissionEarned * 0.18).toLocaleString()}</div>
                <span className="text-[9px] text-slate-500 font-semibold">18% standard GST</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Payable Pool</span>
                <div className="text-lg font-black text-slate-900 font-display">₹{Math.max(0, totalNetworkSales - totalCommissionEarned).toLocaleString()}</div>
                <span className="text-[9px] text-slate-500 font-semibold">Vendor earnings</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Disbursed</span>
                <div className="text-lg font-black text-emerald-700 font-display">₹{totalPaidOut.toLocaleString()}</div>
                <span className="text-[9px] text-emerald-600 font-semibold">Cleared settlements</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
                <div className="text-lg font-black text-amber-600 font-display">₹{totalPendingRequests.toLocaleString()}</div>
                <span className="text-[9px] text-amber-600 font-semibold">Awaiting clearance</span>
              </div>
            </div>

            {/* Global Commission & Settlement Settings Configuration Box */}
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2 text-teal-300">
                    <Percent className="w-4 h-4" /> Global Commission & Payout Configuration
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Configure standard platform commission deduction percentage and minimum payout thresholds applied to all vendor wallets.
                  </p>
                </div>
                <form onSubmit={handleSaveCommissionConfig} className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-teal-200 uppercase mb-1">Platform Cut (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={globalCommRate}
                      onChange={(e) => setGlobalCommRate(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-teal-200 uppercase mb-1">Min Payout Limit (₹)</label>
                    <input
                      type="number"
                      step="50"
                      min="100"
                      value={minWithdrawalLimit}
                      onChange={(e) => setMinWithdrawalLimit(parseInt(e.target.value) || 0)}
                      className="w-32 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition shadow-sm"
                  >
                    Update Config
                  </button>
                </form>
              </div>
            </div>

            {/* Per-Vendor Wallet Ledger Breakdown Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  Vendor Wallet Ledger & Earnings Breakdown
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">{vendors.length} active vendor accounts</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3.5">Vendor Name</th>
                      <th className="p-3.5">Assigned Rate</th>
                      <th className="p-3.5">Gross Sales</th>
                      <th className="p-3.5">Commission Deducted</th>
                      <th className="p-3.5">Cleared Payouts</th>
                      <th className="p-3.5 text-right">Available Wallet Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {vendors.map(v => {
                      const vOrders = orders.filter(o => o.vendorId === v.id && o.status !== 'Cancelled');
                      const vGross = vOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                      const rate = v.customCommissionRate ?? paymentSettings.platformCommissionRate ?? 10;
                      const vComm = Math.round(vGross * (rate / 100));
                      const vNet = Math.max(0, vGross - vComm);
                      const vPaid = clearanceRequests.filter(c => c.vendorId === v.id && c.status === 'Approved').reduce((sum, c) => sum + c.amount, 0);
                      const vPending = clearanceRequests.filter(c => c.vendorId === v.id && c.status === 'Pending').reduce((sum, c) => sum + c.amount, 0);
                      const vAvailable = Math.max(0, vNet - vPaid - vPending);

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3.5 font-bold text-slate-900">{v.businessName}</td>
                          <td className="p-3.5 font-mono text-teal-700 font-bold">{rate}%</td>
                          <td className="p-3.5 font-bold">₹{vGross.toLocaleString()}</td>
                          <td className="p-3.5 text-slate-600">₹{vComm.toLocaleString()}</td>
                          <td className="p-3.5 text-emerald-700 font-bold">₹{vPaid.toLocaleString()}</td>
                          <td className="p-3.5 text-right font-black text-slate-900">₹{vAvailable.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Filter Bar for Payout Requests */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-teal-600" /> Filters:
                </span>
                <select
                  value={clearanceStatusFilter}
                  onChange={(e) => setClearanceStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Clearance</option>
                  <option value="Approved">Approved & Paid</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <select
                  value={clearanceVendorFilter}
                  onChange={(e) => setClearanceVendorFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Vendors</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.businessName}</option>
                  ))}
                </select>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vendor, ID, or UTR..."
                  value={clearanceSearchQuery}
                  onChange={(e) => setClearanceSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Payout Clearance Requests List */}
            {filteredClearances.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">No Matching Payout Requests</h4>
                <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {filteredClearances.map((req) => {
                  const isApproving = approvingClearanceId === req.id;
                  const isRejecting = rejectingClearanceId === req.id;

                  return (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Column: Request Summary */}
                      <div className="lg:col-span-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">#{req.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800 animate-pulse'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{req.vendorName}</h4>
                          <p className="text-[11px] text-slate-400">Requested: {new Date(req.requestedAt).toLocaleString()}</p>
                        </div>
                        <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                            <span>Net Payable Withdrawal</span>
                            <span className="bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded uppercase font-mono">{req.payoutMethod || 'Bank'}</span>
                          </div>
                          <div className="text-2xl font-black text-teal-950 font-display">₹{req.amount.toLocaleString()}</div>
                          {req.grossSales && (
                            <p className="text-[10px] text-slate-600 border-t border-teal-200/50 pt-1 mt-1 flex justify-between">
                              <span>Gross Sales: ₹{req.grossSales.toLocaleString()}</span>
                              <span>Comm: -₹{(req.commissionDeducted ?? 0).toLocaleString()}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Middle Column: Bank / UPI & Notes */}
                      <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-teal-700" />
                          Destination Account Info
                        </h5>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                          {req.payoutMethod === 'upi' ? (
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block font-bold">UPI VPA ID</span>
                              <span className="font-mono font-extrabold text-indigo-700 text-sm">{req.upiId || 'N/A'}</span>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase block font-bold">Bank Name</span>
                                <span className="font-bold text-slate-800">{req.bankDetails?.bankName || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase block font-bold">Account Number</span>
                                <span className="font-mono font-extrabold text-slate-900">{req.bankDetails?.accountNumber || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase block font-bold">IFSC Code</span>
                                <span className="font-mono text-slate-700">{req.bankDetails?.ifscCode || 'N/A'}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {req.vendorNote && (
                          <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg text-[11px] text-amber-900 italic">
                            Vendor Note: "{req.vendorNote}"
                          </div>
                        )}
                        <button
                          onClick={() => setAdminInvoiceModal(req)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" /> View Settlement Invoice
                        </button>
                      </div>

                      {/* Right Column: Processing & Action */}
                      <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between h-full">
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Settlement Processing Desk</h5>
                          {req.status === 'Approved' && (
                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1.5 text-xs">
                              <div className="text-emerald-800 font-bold flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" /> Cleared & Transferred
                              </div>
                              <p className="text-slate-700 text-[11px]">Mode: <span className="font-bold uppercase">{req.paymentMode || 'NEFT'}</span></p>
                              <p className="text-slate-600 text-[11px] font-mono">Reference/UTR: {req.paymentReference || 'Cleared'}</p>
                              {req.adminNote && <p className="text-slate-500 text-[11px]">Remarks: {req.adminNote}</p>}
                            </div>
                          )}

                          {req.status === 'Rejected' && (
                            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-1 text-xs">
                              <div className="text-rose-800 font-bold flex items-center gap-1.5">
                                <XCircle className="w-4 h-4" /> Request Declined
                              </div>
                              <p className="text-slate-600 text-[11px]">Reason: {req.adminNote}</p>
                            </div>
                          )}

                          {req.status === 'Pending' && !isApproving && !isRejecting && (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-500 leading-relaxed">Ensure bank/UPI transfer is completed before approving settlement.</p>
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    setApprovingClearanceId(req.id);
                                    setRejectingClearanceId(null);
                                    setClearanceUtr(`${clearancePaymentMode}-${Date.now().toString().slice(-8)}`);
                                    setClearanceAdminNote(`Payment settlement funds transferred via ${clearancePaymentMode}.`);
                                  }}
                                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <CheckCircle className="w-4 h-4" /> Approve & Pay
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingClearanceId(req.id);
                                    setApprovingClearanceId(null);
                                    setClearanceAdminNote('');
                                  }}
                                  className="w-1/2 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 rounded-xl font-bold text-xs transition border border-rose-200 flex items-center justify-center gap-1.5"
                                >
                                  <XCircle className="w-4 h-4" /> Decline
                                </button>
                              </div>
                            </div>
                          )}

                          {isApproving && (
                            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl space-y-3 text-xs animate-fade-in">
                              <h6 className="font-bold text-emerald-900 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Disburse & Record Settlement
                              </h6>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Payment Method / Mode</label>
                                <select
                                  value={clearancePaymentMode}
                                  onChange={(e) => setClearancePaymentMode(e.target.value as any)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                                >
                                  <option value="NEFT">Bank NEFT Transfer</option>
                                  <option value="RTGS">Bank RTGS Transfer</option>
                                  <option value="IMPS">Bank IMPS Instant</option>
                                  <option value="UPI">UPI Instant Pay</option>
                                  <option value="Razorpay">Razorpay Gateway Payout</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Transaction Ref / UTR ID *</label>
                                <input
                                  type="text"
                                  value={clearanceUtr}
                                  onChange={(e) => setClearanceUtr(e.target.value)}
                                  placeholder="e.g. UTR84920109"
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-mono uppercase text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Remarks</label>
                                <input
                                  type="text"
                                  value={clearanceAdminNote}
                                  onChange={(e) => setClearanceAdminNote(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => setApprovingClearanceId(null)}
                                  className="w-1/3 bg-white hover:bg-slate-100 text-slate-700 py-1.5 rounded-lg border border-slate-200 text-center font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleApproveClearance(req.id)}
                                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-center font-bold shadow-sm"
                                >
                                  Confirm Payout
                                </button>
                              </div>
                            </div>
                          )}

                          {isRejecting && (
                            <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-xl space-y-3 text-xs animate-fade-in">
                              <h6 className="font-bold text-rose-900">Decline Settlement Request</h6>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Reason for Rejection *</label>
                                <textarea
                                  rows={2}
                                  value={clearanceAdminNote}
                                  onChange={(e) => setClearanceAdminNote(e.target.value)}
                                  placeholder="e.g. Bank IFSC code incorrect or pending order dispute."
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setRejectingClearanceId(null)}
                                  className="w-1/3 bg-white hover:bg-slate-100 text-slate-700 py-1.5 rounded-lg border border-slate-200 text-center font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleRejectClearance(req.id)}
                                  className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg text-center font-bold shadow-sm"
                                >
                                  Confirm Decline
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Admin Invoice Modal */}
            {adminInvoiceModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 animate-fade-in relative max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-teal-700 uppercase bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                        Official Settlement Voucher
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-2 font-display">HealNex Platform Settlement Invoice</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Voucher ID: #SETTLE-{adminInvoiceModal.id}</p>
                    </div>
                    <button
                      onClick={() => setAdminInvoiceModal(null)}
                      className="text-slate-400 hover:text-slate-600 p-2 rounded-lg bg-slate-100 font-bold text-xs"
                    >
                      Close
                    </button>
                  </div>

                  <div className="py-6 space-y-6 text-xs">
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Payee Vendor</span>
                        <span className="font-bold text-slate-900 text-sm block">{adminInvoiceModal.vendorName}</span>
                        <span className="text-slate-500 font-mono text-[11px]">ID: {adminInvoiceModal.vendorId}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Settlement Status</span>
                        <span className={`inline-block font-extrabold px-2.5 py-0.5 rounded text-xs uppercase ${
                          adminInvoiceModal.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          adminInvoiceModal.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {adminInvoiceModal.status}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-1">Date: {new Date(adminInvoiceModal.requestedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                          <tr>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Amount (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          <tr>
                            <td className="p-3">Gross Order Revenue Pool ({adminInvoiceModal.ordersCount} Completed Orders)</td>
                            <td className="p-3 text-right font-bold">₹{(adminInvoiceModal.grossSales ?? adminInvoiceModal.amount).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-600">Platform Marketplace Commission ({adminInvoiceModal.commissionRate ?? 10}%)</td>
                            <td className="p-3 text-right text-rose-600">-₹{(adminInvoiceModal.commissionDeducted ?? 0).toLocaleString()}</td>
                          </tr>
                          <tr className="bg-teal-50/40 font-black text-sm">
                            <td className="p-3 text-teal-900">Net Payable Disbursed Amount</td>
                            <td className="p-3 text-right text-teal-800">₹{adminInvoiceModal.amount.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Disbursement Mode</span>
                        <span className="font-bold text-slate-800 uppercase">{adminInvoiceModal.paymentMode || adminInvoiceModal.payoutMethod || 'NEFT Bank Transfer'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Reference / UTR ID</span>
                        <span className="font-mono font-bold text-slate-900">{adminInvoiceModal.paymentReference || 'Pending Settlement'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6 flex justify-end gap-3">
                    <button
                      onClick={() => window.print()}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
                    >
                      <Printer className="w-4 h-4" /> Print / Download Voucher
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Admin Payment Settings Tab */}
      {activeTab === 'payment-settings' && (
        <div className="space-y-6 animate-fade-in pb-12">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-700" />
              Global Procurement Payment Settings Manager
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure enabled online payment gateways and manual B2B clearing coordinates for clinical hospital buyers.</p>
          </div>

          <form onSubmit={handleSavePaymentSettings} className="space-y-6 max-w-4xl">
            
            {/* Razorpay Setup card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  Razorpay API Gateway Credentials
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">Enabled</span>
                  <input
                    type="checkbox"
                    checked={paymentSettings.razorpayEnabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpayEnabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="p-6 space-y-4 font-medium text-slate-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">Razorpay Key ID *</label>
                    <input
                      type="text"
                      placeholder="rzp_test_..."
                      value={paymentSettings.razorpayKeyId}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpayKeyId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">Razorpay Secret Key *</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••••••"
                      value={paymentSettings.razorpaySecret}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpaySecret: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1.5 font-bold">Operation Mode</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="razorpayMode"
                        checked={paymentSettings.razorpayMode === 'test'}
                        onChange={() => setPaymentSettings({ ...paymentSettings, razorpayMode: 'test' })}
                        className="accent-teal-600"
                      />
                      <span>Test / Sandbox Mode</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="razorpayMode"
                        checked={paymentSettings.razorpayMode === 'live'}
                        onChange={() => setPaymentSettings({ ...paymentSettings, razorpayMode: 'live' })}
                        className="accent-teal-600"
                      />
                      <span>Live Production Mode</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* UPI Settings Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-teal-700" />
                  UPI Payment Channel Settings
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">Enable UPI</span>
                  <input
                    type="checkbox"
                    checked={paymentSettings.upiEnabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, upiEnabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-medium text-slate-600">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">UPI ID (VPA Address) *</label>
                    <input
                      type="text"
                      placeholder="e.g. healnex@upi"
                      value={paymentSettings.upiId}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">UPI Account Holder Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Healnex Medibazar"
                      value={paymentSettings.upiHolderName}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, upiHolderName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">Payment Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Pay the exact amount and upload the payment receipt."
                      value={paymentSettings.upiInstructions || ''}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, upiInstructions: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition text-xs"
                    />
                  </div>
                </div>
                <div className="md:col-span-1 space-y-2">
                  <label className="text-slate-500 block font-bold">UPI QR Code Image</label>
                  <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center space-y-3 flex flex-col items-center justify-center">
                    {(upiQrCode || paymentSettings.upiQrCodeUrl) ? (
                      <div className="space-y-2">
                        <img
                          src={upiQrCode || paymentSettings.upiQrCodeUrl}
                          alt="UPI QR Code"
                          className="w-36 h-auto max-h-44 object-contain mx-auto rounded-lg border bg-white p-1.5 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => { setUpiQrCode(''); setPaymentSettings({ ...paymentSettings, upiQrCodeUrl: '' }); }}
                            className="text-[10px] text-red-600 hover:underline font-semibold"
                          >
                            Clear Image
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const sliceUrl = getSliceUpiQrDataUrl();
                              setUpiQrCode(sliceUrl);
                              setPaymentSettings({ ...paymentSettings, upiQrCodeUrl: sliceUrl, upiId: SLICE_UPI_ID, upiHolderName: SLICE_HOLDER_NAME });
                            }}
                            className="text-[10px] text-purple-700 hover:underline font-bold"
                          >
                            Reset to Slice QR
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <QrCode className="w-8 h-8 text-slate-300 mx-auto" />
                        <input
                          type="file"
                          accept="image/*"
                          id="upi-qr-input"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUpiQrUpload(e.target.files[0])}
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => document.getElementById('upi-qr-input')?.click()}
                            className="text-xs text-teal-700 hover:underline font-bold"
                          >
                            Upload Custom QR
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const sliceUrl = getSliceUpiQrDataUrl();
                              setUpiQrCode(sliceUrl);
                              setPaymentSettings({ ...paymentSettings, upiQrCodeUrl: sliceUrl, upiId: SLICE_UPI_ID, upiHolderName: SLICE_HOLDER_NAME });
                            }}
                            className="text-[11px] bg-purple-100 text-purple-800 px-2 py-1 rounded-md font-bold hover:bg-purple-200 transition"
                          >
                            Use Slice UPI QR Code
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Card Settings Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  Credit Card Channel Settings
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">Enable Credit Card</span>
                  <input
                    type="checkbox"
                    checked={paymentSettings.creditCardEnabled !== false}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, creditCardEnabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 font-medium text-slate-600">
                <div>
                  <label className="text-slate-500 block mb-1 font-bold">Card Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Healnex Medibazar Pvt Ltd"
                    value={paymentSettings.creditCardHolderName || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, creditCardHolderName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-bold">Bank / Gateway Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Corporate Card Portal"
                    value={paymentSettings.creditCardBankName || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, creditCardBankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-bold">Card Number (or Virtual POS Reference)</label>
                  <input
                    type="text"
                    placeholder="e.g. 4532 •••• •••• 8890"
                    value={paymentSettings.creditCardNumber || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, creditCardNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={paymentSettings.creditCardExpiry || ''}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, creditCardExpiry: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">CVV (Optional)</label>
                    <input
                      type="text"
                      placeholder="***"
                      value={paymentSettings.creditCardCvv || ''}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, creditCardCvv: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-500 block mb-1 font-bold">Payment Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Enter instructions for customer credit card payment clearing..."
                    value={paymentSettings.creditCardInstructions || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, creditCardInstructions: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Debit Card Settings Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  Debit Card Channel Settings
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">Enable Debit Card</span>
                  <input
                    type="checkbox"
                    checked={paymentSettings.debitCardEnabled !== false}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, debitCardEnabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 font-medium text-slate-600">
                <div>
                  <label className="text-slate-500 block mb-1 font-bold">Card Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Healnex Medibazar Pvt Ltd"
                    value={paymentSettings.debitCardHolderName || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, debitCardHolderName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-bold">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. ICICI Bank"
                    value={paymentSettings.debitCardBankName || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, debitCardBankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-bold">Card Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 5591 •••• •••• 4421"
                    value={paymentSettings.debitCardNumber || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, debitCardNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-bold">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={paymentSettings.debitCardExpiry || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, debitCardExpiry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-500 block mb-1 font-bold">Payment Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Enter instructions for debit card transfer and receipt upload..."
                    value={paymentSettings.debitCardInstructions || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, debitCardInstructions: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Net Banking & Bank Wire Settings Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-teal-700" />
                  Net Banking &amp; Bank Wire Clearing
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">Enable Net Banking</span>
                  <input
                    type="checkbox"
                    checked={paymentSettings.bankEnabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, bankEnabled: e.target.checked, netBankingEnabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-medium text-slate-600">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-500 block mb-1 font-bold">Account Holder Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Healnex Medibazar"
                        value={paymentSettings.bankHolderName}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bankHolderName: e.target.value, netBankingHolderName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1 font-bold">Bank Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank Ltd"
                        value={paymentSettings.bankName}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value, netBankingBankName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-slate-500 block mb-1 font-bold">Account Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. 50200098765432"
                        value={paymentSettings.bankAccountNumber}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bankAccountNumber: e.target.value, netBankingAccountNumber: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-slate-500 block mb-1 font-bold">IFSC Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC0001234"
                        value={paymentSettings.bankIfsc}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bankIfsc: e.target.value, netBankingIfsc: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">Branch Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Senapati Bapat Road, Pune"
                      value={paymentSettings.bankBranch}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bankBranch: e.target.value, netBankingBranch: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">Payment Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Transfer via NEFT/RTGS/IMPS and upload screenshot of payment advice."
                      value={paymentSettings.bankInstructions || paymentSettings.netBankingInstructions || ''}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bankInstructions: e.target.value, netBankingInstructions: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition text-xs"
                    />
                  </div>
                </div>

                <div className="md:col-span-1 space-y-2">
                  <label className="text-slate-500 block font-bold">Optional Banking QR Code</label>
                  <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center space-y-2 flex flex-col items-center justify-center">
                    {(bankQrCode || paymentSettings.bankQrCodeUrl) ? (
                      <div className="space-y-1.5">
                        <img
                          src={bankQrCode || paymentSettings.bankQrCodeUrl}
                          alt="Bank QR Code"
                          className="w-24 h-24 object-contain mx-auto rounded border bg-white"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => { setBankQrCode(''); setPaymentSettings({ ...paymentSettings, bankQrCodeUrl: '' }); }}
                          className="text-[10px] text-red-500 hover:underline"
                        >
                          Clear Image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <QrCode className="w-8 h-8 text-slate-300 mx-auto" />
                        <input
                          type="file"
                          accept="image/*"
                          id="bank-qr-input"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleBankQrUpload(e.target.files[0])}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('bank-qr-input')?.click()}
                          className="text-[10px] text-teal-700 hover:underline font-bold"
                        >
                          Upload Bank QR
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-8 rounded-xl uppercase tracking-wider text-[11px] shadow-lg cursor-pointer transition flex items-center gap-2"
              >
                <CheckCircle className="w-4.5 h-4.5" />
                Synchronize Payment Rules
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Admin Commission Settings Tab */}
      {activeTab === 'commission-settings' && (
        <div className="space-y-6 animate-fade-in pb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              🏷️ Marketplace Commission Settings
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure global and fine-grained commission rules for clinical equipment sales. Automatic commission is split from vendor prices during checkout.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* General Config Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                  Global Configuration
                </h3>
                
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="comm-enabled-toggle"
                    checked={commEnabled}
                    onChange={(e) => setCommEnabled(e.target.checked)}
                    className="w-4.5 h-4.5 text-teal-700 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <div>
                    <label htmlFor="comm-enabled-toggle" className="block text-xs font-bold text-slate-800 cursor-pointer">
                      Enable Marketplace Commissions
                    </label>
                    <p className="text-[10px] text-slate-500">If disabled, all commissions will be computed as 0% across all products.</p>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-800">Global Default Commission (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={commGlobal}
                    onChange={(e) => setCommGlobal(Number(e.target.value))}
                    disabled={!commEnabled}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Fallback commission rate applied to products if no category, brand, or vendor overrides match (Default: 7%).</p>
                </div>
              </div>

              {/* Category Overrides */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                  Category-Wise Commission Overrides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-[10px] font-bold text-slate-600">Select Category</label>
                    <select
                      value={newCatKey}
                      onChange={(e) => setNewCatKey(e.target.value)}
                      disabled={!commEnabled}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 text-xs text-slate-800"
                    >
                      <option value="">-- Select Category --</option>
                      {dbLocal.getCategories().map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-bold text-slate-600">Commission %</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newCatVal}
                        onChange={(e) => setNewCatVal(Number(e.target.value))}
                        disabled={!commEnabled}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none font-mono text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCatKey) return;
                          setCommCategories({ ...commCategories, [newCatKey]: newCatVal });
                          setNewCatKey('');
                        }}
                        disabled={!commEnabled || !newCatKey}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 rounded-lg disabled:bg-slate-300 shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-extrabold text-slate-500 uppercase">Active Category Overrides</h4>
                  {Object.keys(commCategories).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No category overrides configured.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                      {Object.entries(commCategories).map(([key, val]) => (
                        <div key={key} className="p-3 flex justify-between items-center text-xs hover:bg-slate-50">
                          <span className="font-bold text-slate-700">{key}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg">{val}%</span>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = { ...commCategories };
                                delete copy[key];
                                setCommCategories(copy);
                              }}
                              className="text-rose-600 hover:text-rose-800 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Brand Overrides */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                  Brand-Wise Commission Overrides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-[10px] font-bold text-slate-600">Select Brand</label>
                    <select
                      value={newBrandKey}
                      onChange={(e) => setNewBrandKey(e.target.value)}
                      disabled={!commEnabled}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 text-xs text-slate-800"
                    >
                      <option value="">-- Select Brand --</option>
                      {dbLocal.getBrands().map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-bold text-slate-600">Commission %</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newBrandVal}
                        onChange={(e) => setNewBrandVal(Number(e.target.value))}
                        disabled={!commEnabled}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none font-mono text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newBrandKey) return;
                          setCommBrands({ ...commBrands, [newBrandKey]: newBrandVal });
                          setNewBrandKey('');
                        }}
                        disabled={!commEnabled || !newBrandKey}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 rounded-lg disabled:bg-slate-300 shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-extrabold text-slate-500 uppercase">Active Brand Overrides</h4>
                  {Object.keys(commBrands).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No brand overrides configured.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                      {Object.entries(commBrands).map(([key, val]) => (
                        <div key={key} className="p-3 flex justify-between items-center text-xs hover:bg-slate-50">
                          <span className="font-bold text-slate-700">{key}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg">{val}%</span>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = { ...commBrands };
                                delete copy[key];
                                setCommBrands(copy);
                              }}
                              className="text-rose-600 hover:text-rose-800 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Overrides */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                  Vendor-Wise Commission Overrides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-[10px] font-bold text-slate-600">Select Vendor</label>
                    <select
                      value={newVendorKey}
                      onChange={(e) => setNewVendorKey(e.target.value)}
                      disabled={!commEnabled}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 text-xs text-slate-800"
                    >
                      <option value="">-- Select Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.companyName} ({v.id})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-bold text-slate-600">Commission %</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newVendorVal}
                        onChange={(e) => setNewVendorVal(Number(e.target.value))}
                        disabled={!commEnabled}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none font-mono text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newVendorKey) return;
                          setCommVendors({ ...commVendors, [newVendorKey]: newVendorVal });
                          setNewVendorKey('');
                        }}
                        disabled={!commEnabled || !newVendorKey}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 rounded-lg disabled:bg-slate-300 shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-extrabold text-slate-500 uppercase">Active Vendor Overrides</h4>
                  {Object.keys(commVendors).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No vendor overrides configured.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                      {Object.entries(commVendors).map(([key, val]) => {
                        const vObj = vendors.find(v => v.id === key);
                        const label = vObj ? vObj.companyName : key;
                        return (
                          <div key={key} className="p-3 flex justify-between items-center text-xs hover:bg-slate-50">
                            <span className="font-bold text-slate-700">{label}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg">{val}%</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = { ...commVendors };
                                  delete copy[key];
                                  setCommVendors(copy);
                                }}
                                className="text-rose-600 hover:text-rose-800 font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Info panel */}
              <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Commission Splitting Rules</h3>
                <p className="text-[11px] leading-relaxed text-teal-50">
                  Commissions are computed hierarchically in real-time when vendors edit or submit products:
                </p>
                <ol className="list-decimal list-inside text-[11px] space-y-2 mt-3 text-teal-100">
                  <li><strong>Vendor-specific</strong> overrides are matched first.</li>
                  <li><strong>Category-specific</strong> overrides are checked second.</li>
                  <li><strong>Brand-specific</strong> overrides are checked third.</li>
                  <li><strong>Global commission</strong> serves as the default fallback.</li>
                </ol>
                <div className="mt-5 pt-4 border-t border-teal-600/50 text-[10px] text-teal-200">
                  * Note: Turning off commissions forces a 0% rate regardless of overrides.
                </div>
              </div>

              {/* Action Sidebar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-4">
                <p className="text-xs text-slate-600 leading-normal">
                  All updates will propagate globally in real-time to the B2B store. Newly submitted or updated product prices will compute using these configurations.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    dbLocal.saveCommissionSettings({
                      id: 'commission_settings_config',
                      enabled: commEnabled,
                      globalPercent: commGlobal,
                      categoryPercents: commCategories,
                      brandPercents: commBrands,
                      vendorPercents: commVendors
                    });
                    addToast('Commission settings saved and synchronized globally! 🏷️', 'success');
                  }}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl uppercase text-[11px] tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Save settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin WhatsApp Support Settings Tab */}
      {activeTab === 'whatsapp-support' && (
        <div className="space-y-8 animate-fade-in pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Configurations Form */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-500" />
                  WhatsApp support settings
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">Configure instantly updated live support channels for clinical customers.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                dbLocal.saveWhatsAppSettings(whatsappSettings);
                addToast('WhatsApp support configurations synchronized successfully!', 'success');
              }} className="space-y-6">
                
                {/* Enable / Disable Section */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Enable WhatsApp Support Feature</span>
                    <span className="text-[10px] text-slate-400">Instantly toggle the floating WhatsApp support button for all customers.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={whatsappSettings.enabled}
                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, enabled: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">WhatsApp Support Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. +919103500592 (with country code)"
                      value={whatsappSettings.phoneNumber}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, phoneNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 transition font-mono"
                      required
                    />
                    <p className="text-[9px] text-slate-400 mt-1">Include country code without special characters or spaces.</p>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">Button CTA Text *</label>
                    <input
                      type="text"
                      placeholder="e.g. Chat on WhatsApp"
                      value={whatsappSettings.buttonText}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, buttonText: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 transition font-bold"
                      required
                    />
                    <p className="text-[9px] text-slate-400 mt-1">Aesthetic button caption displayed to visitors.</p>
                  </div>
                </div>

                <div className="text-xs font-medium text-slate-600">
                  <label className="text-slate-500 block mb-1 font-bold">WhatsApp Business Custom Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="e.g. https://wa.me/message/YOUR_BUSINESS_ID"
                    value={whatsappSettings.businessLink || ''}
                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, businessLink: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 transition font-mono"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Overrides default phone link. Leave blank to auto-generate using standard universal URL.</p>
                </div>

                {/* Default Welcome Message Template */}
                <div className="text-xs font-medium text-slate-600 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-500 block font-bold">Default Welcome Message Template *</label>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded font-mono">Dynamic Placeholders Active</span>
                  </div>
                  <textarea
                    rows={4}
                    value={whatsappSettings.defaultMessage}
                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, defaultMessage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 transition font-sans leading-relaxed text-slate-700"
                    placeholder="Hello support, I need assistance..."
                    required
                  />
                  
                  {/* Placeholders Legend */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 grid grid-cols-3 gap-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setWhatsappSettings({ ...whatsappSettings, defaultMessage: whatsappSettings.defaultMessage + ' {CustomerName}' })}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition font-bold"
                      title="Click to insert placeholder"
                    >
                      &#123;CustomerName&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhatsappSettings({ ...whatsappSettings, defaultMessage: whatsappSettings.defaultMessage + ' {OrderNumber}' })}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition font-bold"
                      title="Click to insert placeholder"
                    >
                      &#123;OrderNumber&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhatsappSettings({ ...whatsappSettings, defaultMessage: whatsappSettings.defaultMessage + ' {ProductName}' })}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition font-bold"
                      title="Click to insert placeholder"
                    >
                      &#123;ProductName&#125;
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400">Placeholders will be automatically resolved to real contextual parameters depending on what page the customer initiates the chat from.</p>
                </div>

                {/* Display Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">Button Visual Layout Position</label>
                    <select
                      value={whatsappSettings.position}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, position: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 transition font-bold text-slate-700"
                    >
                      <option value="floating">Floating Support Button (Bottom Right)</option>
                      <option value="contact_page">Contact Page Cards Only (Non-Floating)</option>
                    </select>
                    <p className="text-[9px] text-slate-400 mt-1">Floating mode displays on the outer workspace; Contact mode disables outer overlay.</p>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1 font-bold">Placement Rules</label>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500">Show on All Main Screens</span>
                      <input
                        type="checkbox"
                        checked={whatsappSettings.showOnAllScreens}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, showOnAllScreens: e.target.checked })}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Screen Selection Grid (Conditional) */}
                {!whatsappSettings.showOnAllScreens && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-medium text-slate-600 animate-slide-down">
                    <label className="text-slate-500 block font-bold mb-1">Target Screens Placement Selection *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'Home', label: 'Home Page' },
                        { id: 'ProductDetails', label: 'Product Details' },
                        { id: 'Cart', label: 'Cart Checkout' },
                        { id: 'Checkout', label: 'Secure Checkout' },
                        { id: 'Orders', label: 'My Orders' },
                        { id: 'Profile', label: 'Profile Desk' },
                        { id: 'HelpSupport', label: 'Help & Support' }
                      ].map((screen) => {
                        const isSelected = whatsappSettings.selectedScreens.includes(screen.id);
                        return (
                          <label key={screen.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/20 select-none">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                let list = [...whatsappSettings.selectedScreens];
                                if (isSelected) {
                                  list = list.filter(s => s !== screen.id);
                                } else {
                                  list.push(screen.id);
                                }
                                setWhatsappSettings({ ...whatsappSettings, selectedScreens: list });
                              }}
                              className="w-4 h-4 accent-emerald-500 rounded"
                            />
                            <span className="text-[10px] font-semibold text-slate-700">{screen.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sync Action */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl uppercase tracking-wider text-[11px] shadow-md cursor-pointer transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-4.5 h-4.5" />
                    Synchronize Support Rules
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Analytics Dashboard */}
            <div className="space-y-6">
              
              {/* Performance Indicator Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
                  <MessageCircle className="w-44 h-44" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">WhatsApp Channels Integration</p>
                <p className="text-3xl font-extrabold font-mono mt-1">{whatsappLogs.length}</p>
                <h3 className="text-xs font-semibold mt-1 opacity-90">Total Support Requests Initiated</h3>
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-[10px] font-medium opacity-85">
                  <span>Feature Status:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${whatsappSettings.enabled ? 'bg-emerald-400 text-slate-900' : 'bg-red-400 text-slate-900'}`}>
                    {whatsappSettings.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              </div>

              {/* Dynamic Context breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inquiries by Page</h3>
                <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                  {['Home', 'ProductDetails', 'Cart', 'Checkout', 'Orders', 'HelpSupport'].map((p) => {
                    const count = whatsappLogs.filter(l => l.contextPage === p).length;
                    const percent = whatsappLogs.length > 0 ? (count / whatsappLogs.length) * 100 : 0;
                    return (
                      <div key={p} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-700">{p === 'HelpSupport' ? 'Help & Support' : p === 'ProductDetails' ? 'Product Details' : p}</span>
                          <span className="font-mono text-slate-900">{count} clicks ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Click logs Audit trail */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4.5 h-4.5 text-emerald-500" />
                  Support click-through analytics logs
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Audit log of customer WhatsApp contact requests with context pages and timestamps.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to flush WhatsApp click analytics logs?')) {
                    dbLocal.set('healnex_whatsapp_click_logs', []);
                    setWhatsappLogs([]);
                    addToast('Analytics logs successfully cleared.', 'info');
                  }
                }}
                className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Flush Logs
              </button>
            </div>

            {whatsappLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                No WhatsApp clicks logged in this session yet.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs font-medium text-slate-600 text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2.5 px-4 font-bold">timestamp</th>
                      <th className="py-2.5 px-4 font-bold">customer name</th>
                      <th className="py-2.5 px-4 font-bold">context page</th>
                      <th className="py-2.5 px-4 font-bold">related product</th>
                      <th className="py-2.5 px-4 font-bold">related order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whatsappLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 font-medium">
                        <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-4 text-slate-950 font-bold">
                          {log.customerName}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase">
                            {log.contextPage === 'HelpSupport' ? 'Help & Support' : log.contextPage}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-900 font-semibold truncate max-w-xs" title={log.productName}>
                          {log.productName || <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-teal-800">
                          {log.orderNumber ? `#${log.orderNumber}` : <span className="text-slate-300">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Promotional Banners Management Tab */}
      {activeTab === 'banners' && (
        <div className="space-y-8 animate-fade-in pb-12">
          {/* Header Banner Control Bar */}
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 p-6 sm:p-8 rounded-3xl border border-teal-800/60 shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="inline-block bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                MARKETPLACE HERO & PROMOTIONS MANAGEMENT
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Manage Homepage Banners
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Upload and control the promotional banners displayed directly on the customer marketplace landing page. Active banners will appear instantly to buyers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-800/80 backdrop-blur border border-slate-700 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Live Banners</p>
                  <p className="text-lg font-mono font-extrabold text-teal-400">{promoBanners.filter(b => b.isActive).length} / {promoBanners.length}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <button
                onClick={() => setIsCreatingBanner(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Upload New Banner
              </button>
            </div>
          </div>

          {/* New Banner Upload Card Form */}
          {isCreatingBanner && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-teal-500 shadow-xl animate-scale-up space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Create New Promotional Banner</h3>
                    <p className="text-xs text-slate-500">Configure visual imagery, headlines, and call-to-action buttons</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreatingBanner(false)}
                  className="text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-xl hover:bg-slate-100 text-xs font-bold transition"
                >
                  ✕ Close Form
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Title *</label>
                    <input
                      type="text"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="e.g. India's Premium Medical Equipment Procurement Hub"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Description</label>
                    <textarea
                      rows={3}
                      value={bannerForm.subtitle || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      placeholder="e.g. Source directly from certified medical equipment manufacturers with instant tax invoicing."
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Banner Image URL *</label>
                    <input
                      type="text"
                      value={bannerForm.imageUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Top Badge Text</label>
                      <input
                        type="text"
                        value={bannerForm.badgeText || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, badgeText: e.target.value })}
                        placeholder="CLINICAL QUALITY ASSURED"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-teal-700 uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={bannerForm.positionOrder}
                        onChange={(e) => setBannerForm({ ...bannerForm, positionOrder: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        value={bannerForm.buttonText || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                        placeholder="Explore Catalog"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Button Link URL</label>
                      <input
                        type="text"
                        value={bannerForm.linkUrl || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                        placeholder="#catalog or #rfq"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden text-white min-h-[260px]">
                  {bannerForm.imageUrl && (
                    <img
                      src={bannerForm.imageUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                    />
                  )}
                  <div className="relative z-10 space-y-3 max-w-md">
                    <span className="inline-block bg-teal-500/20 text-teal-300 border border-teal-500/50 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {bannerForm.badgeText || 'FEATURED DEAL'}
                    </span>
                    <h4 className="text-xl font-extrabold tracking-tight leading-snug">
                      {bannerForm.title || 'Your Banner Title Here'}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {bannerForm.subtitle || 'Your subtitle description will appear here inside the customer landing area.'}
                    </p>
                  </div>
                  <div className="relative z-10 pt-4">
                    <span className="inline-flex items-center gap-1.5 bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                      {bannerForm.buttonText || 'Explore Catalog'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsCreatingBanner(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewBanner}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Publish Banner To Marketplace
                </button>
              </div>
            </div>
          )}

          {/* Existing Banners Grid / List */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" /> Current Published Banners ({promoBanners.length})
            </h3>

            {promoBanners.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No promotional banners added yet</p>
                <p className="text-xs text-slate-400">Click "Upload New Banner" above to display offers on the home page.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {promoBanners
                  .slice()
                  .sort((a, b) => (a.positionOrder || 0) - (b.positionOrder || 0))
                  .map((banner) => (
                    <div
                      key={banner.id}
                      className={`bg-white rounded-2xl border ${banner.isActive ? 'border-slate-200 shadow-sm' : 'border-slate-200/60 opacity-60 bg-slate-50'} p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition hover:shadow-md`}
                    >
                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className="w-32 h-20 rounded-xl bg-slate-900 overflow-hidden shrink-0 relative border border-slate-200 shadow-inner">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded">
                              Order #{banner.positionOrder}
                            </span>
                            {banner.badgeText && (
                              <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {banner.badgeText}
                              </span>
                            )}
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${banner.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                              {banner.isActive ? '● LIVE ON HOME PAGE' : '○ HIDDEN'}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 truncate">
                            {banner.title}
                          </h4>
                          {banner.subtitle && (
                            <p className="text-xs text-slate-500 line-clamp-1">{banner.subtitle}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleToggleBannerActive(banner.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${banner.isActive ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                        >
                          {banner.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {banner.isActive ? 'Hide' : 'Show Live'}
                        </button>
                        <button
                          onClick={() => setEditingBannerModal({ ...banner })}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Edit Banner"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id, banner.title)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Edit Banner Modal */}
          {editingBannerModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-scale-up font-sans">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Edit className="w-4 h-4 text-teal-600" /> Edit Promotional Banner
                  </h3>
                  <button
                    onClick={() => setEditingBannerModal(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Title *</label>
                    <input
                      type="text"
                      value={editingBannerModal.title}
                      onChange={(e) => setEditingBannerModal({ ...editingBannerModal, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Description</label>
                    <textarea
                      rows={2}
                      value={editingBannerModal.subtitle || ''}
                      onChange={(e) => setEditingBannerModal({ ...editingBannerModal, subtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Banner Image URL *</label>
                    <input
                      type="text"
                      value={editingBannerModal.imageUrl}
                      onChange={(e) => setEditingBannerModal({ ...editingBannerModal, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Top Badge Text</label>
                      <input
                        type="text"
                        value={editingBannerModal.badgeText || ''}
                        onChange={(e) => setEditingBannerModal({ ...editingBannerModal, badgeText: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={editingBannerModal.positionOrder}
                        onChange={(e) => setEditingBannerModal({ ...editingBannerModal, positionOrder: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        value={editingBannerModal.buttonText || ''}
                        onChange={(e) => setEditingBannerModal({ ...editingBannerModal, buttonText: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Link URL</label>
                      <input
                        type="text"
                        value={editingBannerModal.linkUrl || ''}
                        onChange={(e) => setEditingBannerModal({ ...editingBannerModal, linkUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingBannerModal(null)}
                    className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateBanner}
                    className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin B2B Ledger Audit & Reports Desk */}
      {activeTab === 'audit' && (() => {
        // Compute report data on the fly based on selected report type and filters
        const q = reportSearchText.toLowerCase().trim();
        
        let salesReportData: Order[] = [];
        let paymentsReportData: Order[] = [];
        let vendorsReportData: Vendor[] = [];
        let customersReportData: User[] = [];
        let rfqsReportData: RFQ[] = [];

        if (selectedReportType === 'sales') {
          salesReportData = orders.filter(o => {
            const matchesSearch = o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.vendorName.toLowerCase().includes(q);
            const matchesStatus = reportStatusFilter === 'All' || o.status === reportStatusFilter;
            return matchesSearch && matchesStatus;
          });
        } else if (selectedReportType === 'payments') {
          // Manual payment clearance report (UPI & Bank transfers)
          paymentsReportData = orders.filter(o => {
            const isManual = o.paymentMethod !== 'Razorpay';
            const matchesSearch = o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || (o.paymentTxId || '').toLowerCase().includes(q);
            const matchesStatus = reportStatusFilter === 'All' || o.status === reportStatusFilter;
            return isManual && matchesSearch && matchesStatus;
          });
        } else if (selectedReportType === 'vendors') {
          vendorsReportData = vendors.filter(v => {
            const matchesSearch = v.companyName.toLowerCase().includes(q) || v.ownerName.toLowerCase().includes(q) || v.state.toLowerCase().includes(q) || v.gstNumber.toLowerCase().includes(q);
            const matchesStatus = reportStatusFilter === 'All' || v.status === reportStatusFilter;
            return matchesSearch && matchesStatus;
          });
        } else if (selectedReportType === 'customers') {
          customersReportData = users.filter(u => {
            if (u.role !== 'customer') return false;
            const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q);
            const matchesStatus = reportStatusFilter === 'All' || (reportStatusFilter === 'Verified' ? u.isVerified : !u.isVerified);
            return matchesSearch && matchesStatus;
          });
        } else if (selectedReportType === 'rfqs') {
          rfqsReportData = dbLocal.getRfqs().filter(r => {
            const matchesSearch = r.productName.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q) || r.deliveryLocation.toLowerCase().includes(q);
            const matchesStatus = reportStatusFilter === 'All' || r.status === reportStatusFilter;
            return matchesSearch && matchesStatus;
          });
        }

        // Trigger safe browser CSV download via Blob
        const handleCsvExport = () => {
          let headers: string[] = [];
          let rows: string[][] = [];
          const timestamp = new Date().toISOString().slice(0, 10);
          const filename = `healnex_audit_${selectedReportType}_${timestamp}.csv`;

          if (selectedReportType === 'sales') {
            headers = ['Order ID', 'Customer Name', 'Customer Email', 'Vendor Name', 'Date', 'Method', 'Status', 'Courier Partner', 'Tracking Number', 'Excl GST (INR)', 'GST (INR)', 'Final Amount (INR)'];
            rows = salesReportData.map(o => [
              o.id, o.customerName, o.customerEmail, o.vendorName,
              new Date(o.createdAt).toLocaleString(), o.paymentMethod, o.status,
              o.courierName || o.shippingProvider || 'N/A', o.trackingNumber || 'N/A',
              o.totalAmount.toString(), o.gstAmount.toString(), o.finalAmount.toString()
            ]);
          } else if (selectedReportType === 'payments') {
            headers = ['Order ID', 'UTR / Transaction ID', 'Customer Name', 'Method', 'Amount (INR)', 'Status', 'Date Reported', 'Rejection Reason'];
            rows = paymentsReportData.map(o => [
              o.id, o.paymentTxId || 'N/A', o.customerName, o.paymentMethod,
              o.finalAmount.toString(), o.status, new Date(o.createdAt).toLocaleString(),
              o.paymentRejectionReason || ''
            ]);
          } else if (selectedReportType === 'vendors') {
            headers = ['Vendor ID', 'Company Name', 'Owner Name', 'Email', 'Mobile', 'GSTIN', 'State', 'District', 'Status', 'Onboarding Date'];
            rows = vendorsReportData.map(v => [
              v.id, v.companyName, v.ownerName, v.email, v.mobileNumber, v.gstNumber,
              v.state, v.district, v.status, new Date(v.createdAt).toLocaleString()
            ]);
          } else if (selectedReportType === 'customers') {
            headers = ['Customer ID', 'Customer Name', 'Email', 'Phone', 'Onboarded Date', 'Status'];
            rows = customersReportData.map(u => [
              u.id, u.name, u.email, u.phone || 'N/A',
              u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
              u.isVerified ? 'Verified' : 'Pending'
            ]);
          } else if (selectedReportType === 'rfqs') {
            headers = ['RFQ ID', 'Customer Name', 'Product Name', 'Quantity', 'Budget (INR)', 'Delivery Location', 'Status', 'Created At'];
            rows = rfqsReportData.map(r => [
              r.id, r.customerName, r.productName, r.quantity.toString(),
              r.budget.toString(), r.deliveryLocation, r.status,
              new Date(r.createdAt || '').toLocaleString()
            ]);
          }

          const csvData = [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
          const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          addToast(`Report downloaded successfully: ${filename}`, 'success');
        };

        const handlePdfPrint = () => {
          window.print();
        };

        return (
          <div className="space-y-6 animate-fade-in pb-12">
            
            {/* Header section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-700" />
                  B2B Corporate Audit &amp; Report Desk
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Export transactional records, manual payment clearance trails, active vendor directory, or medical RFQ tenders.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleCsvExport}
                  className="bg-slate-800 hover:bg-slate-950 text-white text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Export CSV
                </button>
                <button
                  onClick={handlePdfPrint}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <Printer className="w-4 h-4 text-white" />
                  Print Corporate PDF
                </button>
              </div>
            </div>

            {/* Split controls layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Left Column Controls */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5 lg:col-span-1 text-xs">
                
                {/* 1. Report Template Selection */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">1. Select Report Template</label>
                  <div className="space-y-1">
                    {[
                      { id: 'sales', label: '📊 B2B Sales Report' },
                      { id: 'payments', label: '🧾 Manual Payment Clearance' },
                      { id: 'vendors', label: '🏢 Verified Vendors Directory' },
                      { id: 'customers', label: '🩺 Clinical Customers List' },
                      { id: 'rfqs', label: '📝 RFQ Tenders Registry' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedReportType(item.id as any);
                          setReportStatusFilter('All');
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs font-bold transition flex items-center justify-between ${
                          selectedReportType === item.id
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Filter status options */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">2. Status Filter</label>
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-semibold text-slate-700"
                  >
                    <option value="All">All Statuses</option>
                    {selectedReportType === 'sales' && (
                      <>
                        <option value="Awaiting Payment Verification">Awaiting Payment Verification</option>
                        <option value="Order Sent to Vendor">Order Sent to Vendor</option>
                        <option value="Vendor Accepted">Vendor Accepted</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </>
                    )}
                    {selectedReportType === 'payments' && (
                      <>
                        <option value="Awaiting Payment Verification">Awaiting Verification</option>
                        <option value="Pending Payment">Rejected / Pending Payment</option>
                        <option value="Order Sent to Vendor">Cleared &amp; Sent to Vendor</option>
                      </>
                    )}
                    {selectedReportType === 'vendors' && (
                      <>
                        <option value="Approved">Approved / Live</option>
                        <option value="Pending">Pending Audit</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Suspended">Suspended</option>
                      </>
                    )}
                    {selectedReportType === 'customers' && (
                      <>
                        <option value="Verified">Verified Buyers</option>
                        <option value="Pending">Unverified / Pending</option>
                      </>
                    )}
                    {selectedReportType === 'rfqs' && (
                      <>
                        <option value="Open">Open for Bidding</option>
                        <option value="Closed">Closed Tenders</option>
                      </>
                    )}
                  </select>
                </div>

                {/* 3. Text Search */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">3. Search Ledger</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type keywords..."
                      value={reportSearchText}
                      onChange={(e) => setReportSearchText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-8 outline-none focus:border-teal-700 transition"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                {/* Audit Seal */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-center text-[10px] text-slate-500">
                  <Shield className="w-8 h-8 text-teal-600 mx-auto" />
                  <p className="font-bold uppercase tracking-widest text-slate-700">Official Ledger Desk</p>
                  <p className="leading-relaxed">All generated logs are cryptographically tagged to the super-administrator authority key.</p>
                </div>

              </div>

              {/* Right Column Interactive Preview */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Metrics ribbon */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedReportType === 'sales' && (() => {
                    const totalSalesAmount = salesReportData.reduce((s, o) => s + o.finalAmount, 0);
                    const avgTicket = salesReportData.length > 0 ? (totalSalesAmount / salesReportData.length) : 0;
                    return (
                      <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Orders</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{salesReportData.length}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Gross Revenue</span>
                          <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">₹{totalSalesAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Average Order</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">₹{avgTicket.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Filters Active</span>
                          <span className="text-xs font-bold text-teal-700 mt-1 block truncate">{reportStatusFilter} • q="{reportSearchText || '*'}"</span>
                        </div>
                      </>
                    );
                  })()}

                  {selectedReportType === 'payments' && (() => {
                    const totalManualAmount = paymentsReportData.reduce((s, o) => s + o.finalAmount, 0);
                    const pendingVerifCount = paymentsReportData.filter(o => o.status === 'Awaiting Payment Verification').length;
                    return (
                      <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Manual Payments</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{paymentsReportData.length}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Offline Volume</span>
                          <span className="text-xl font-bold font-mono text-teal-700 mt-1 block">₹{totalManualAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Awaiting Verification</span>
                          <span className="text-xl font-bold font-mono text-amber-600 mt-1 block animate-pulse">{pendingVerifCount}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Cleared Rate</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                            {paymentsReportData.length > 0 ? `${((paymentsReportData.filter(o => o.status !== 'Awaiting Payment Verification' && o.status !== 'Pending Payment').length / paymentsReportData.length) * 100).toFixed(0)}%` : '100%'}
                          </span>
                        </div>
                      </>
                    );
                  })()}

                  {selectedReportType === 'vendors' && (() => {
                    const approvedVendors = vendorsReportData.filter(v => v.status === 'Approved').length;
                    return (
                      <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Suppliers Total</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{vendorsReportData.length}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Approved &amp; Active</span>
                          <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">{approvedVendors}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Pending Audit</span>
                          <span className="text-xl font-bold font-mono text-orange-600 mt-1 block">
                            {vendorsReportData.filter(v => v.status === 'Pending').length}
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">States Covered</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                            {new Set(vendorsReportData.map(v => v.state)).size}
                          </span>
                        </div>
                      </>
                    );
                  })()}

                  {selectedReportType === 'customers' && (() => {
                    const verifiedCusts = customersReportData.filter(c => c.isVerified).length;
                    return (
                      <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Clinicians Onboarded</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{customersReportData.length}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Verified Accounts</span>
                          <span className="text-xl font-bold font-mono text-teal-600 mt-1 block">{verifiedCusts}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Pending Approvals</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                            {customersReportData.filter(c => !c.isVerified).length}
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Database Segment</span>
                          <span className="text-xs font-bold text-slate-600 mt-2 block font-mono">B2B CLIENTS</span>
                        </div>
                      </>
                    );
                  })()}

                  {selectedReportType === 'rfqs' && (() => {
                    const openRfqs = rfqsReportData.filter(r => r.status === 'Open').length;
                    return (
                      <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">RFQ Tenders Total</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{rfqsReportData.length}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Open for Bids</span>
                          <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">{openRfqs}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Bid Volume</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                            ₹{rfqsReportData.reduce((sum, r) => sum + r.budget, 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Locations Served</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                            {new Set(rfqsReportData.map(r => r.deliveryLocation)).size}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* High-Fidelity Ledger Preview paper wrapper */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden font-mono text-[10px] leading-relaxed text-slate-800">
                  
                  {/* Paper header */}
                  <div className="p-6 border-b-2 border-dashed border-slate-200 bg-slate-50 text-slate-600 text-center space-y-1">
                    <p className="font-extrabold uppercase tracking-widest text-[11px] text-slate-900">HealNex Medi Bazar Ltd. • B2B Procurement Desk</p>
                    <p className="text-[10px]">Administrative Audit Ledger Record • Bangalore Corporate Head Office</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">REPORT PREVIEW: {selectedReportType.toUpperCase()} LEDGER</p>
                    <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase pt-4">
                      <span>AUDITOR: SUPER ADMIN</span>
                      <span>HASH: MD5_LEDGER_LNEX_2026</span>
                      <span>TIMESTAMP: {new Date().toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Table area */}
                  <div className="p-6 overflow-x-auto">
                    {selectedReportType === 'sales' && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[9px] uppercase">
                            <th className="py-2 pr-2">Order ID</th>
                            <th className="py-2">Hospital Client</th>
                            <th className="py-2">Vendor Partner</th>
                            <th className="py-2">Date</th>
                            <th className="py-2">Method</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Courier / Tracking</th>
                            <th className="py-2 text-right">Amount (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {salesReportData.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400">No records matching active filter query.</td>
                            </tr>
                          ) : (
                            salesReportData.map((o) => (
                              <tr key={o.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 font-bold text-teal-800 pr-2">#{o.id}</td>
                                <td className="py-2.5 max-w-[120px] truncate">{o.customerName}</td>
                                <td className="py-2.5 max-w-[120px] truncate">{o.vendorName}</td>
                                <td className="py-2.5">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                                <td className="py-2.5 uppercase font-semibold">{o.paymentMethod}</td>
                                <td className="py-2.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    o.status === 'Completed' || o.status === 'Delivered'
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : o.status === 'Shipped'
                                        ? 'bg-blue-50 text-blue-900'
                                        : o.status === 'Packed'
                                          ? 'bg-purple-50 text-purple-800'
                                          : 'bg-amber-50 text-amber-800'
                                  }`}>
                                    {o.status}
                                  </span>
                                </td>
                                <td className="py-2.5">
                                  {o.trackingNumber ? (
                                    <div className="text-[10px] leading-tight">
                                      <p className="font-bold text-slate-800 truncate max-w-[100px]">{o.courierName || o.shippingProvider || 'Courier'}</p>
                                      <p className="font-mono text-[9px] text-sky-700 bg-sky-50 px-1 py-0.5 rounded border border-sky-200 mt-0.5 max-w-[110px] truncate">{o.trackingNumber}</p>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">Pending Dispatch</span>
                                  )}
                                </td>
                                <td className="py-2.5 text-right font-bold text-slate-950">₹{o.finalAmount.toLocaleString('en-IN')}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {selectedReportType === 'payments' && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[9px] uppercase">
                            <th className="py-2 pr-2">Order ID</th>
                            <th className="py-2">UTR / Transaction ID</th>
                            <th className="py-2">Hospital Buyer</th>
                            <th className="py-2">Method</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Reported Date</th>
                            <th className="py-2 text-right">Amount (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {paymentsReportData.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400">No manual payments logged in system ledger.</td>
                            </tr>
                          ) : (
                            paymentsReportData.map((o) => (
                              <tr key={o.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 font-bold text-teal-800 pr-2">#{o.id}</td>
                                <td className="py-2.5 font-mono text-slate-900 select-all bg-slate-50 border px-1 rounded">{o.paymentTxId || 'NOT REPORTED'}</td>
                                <td className="py-2.5 max-w-[120px] truncate">{o.customerName}</td>
                                <td className="py-2.5 uppercase font-bold">{o.paymentMethod}</td>
                                <td className="py-2.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    o.status === 'Order Sent to Vendor'
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : o.status === 'Pending Payment'
                                        ? 'bg-rose-50 text-rose-800'
                                        : 'bg-amber-50 text-amber-800'
                                  }`}>
                                    {o.status === 'Order Sent to Vendor' ? 'CLEARED' : o.status}
                                  </span>
                                </td>
                                <td className="py-2.5">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                                <td className="py-2.5 text-right font-bold text-slate-950">₹{o.finalAmount.toLocaleString('en-IN')}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {selectedReportType === 'vendors' && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[9px] uppercase">
                            <th className="py-2 pr-2">Vendor ID</th>
                            <th className="py-2">Company Name</th>
                            <th className="py-2">Owner Name</th>
                            <th className="py-2">Corporate State</th>
                            <th className="py-2">GSTIN Registry</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {vendorsReportData.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400">No corporate vendors matching query.</td>
                            </tr>
                          ) : (
                            vendorsReportData.map((v) => (
                              <tr key={v.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 font-bold text-slate-700 pr-2">{v.id}</td>
                                <td className="py-2.5 font-bold text-slate-900">{v.companyName}</td>
                                <td className="py-2.5">{v.ownerName}</td>
                                <td className="py-2.5">{v.state}</td>
                                <td className="py-2.5 font-mono font-semibold">{v.gstNumber}</td>
                                <td className="py-2.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${v.status === 'Approved' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                                    {v.status}
                                  </span>
                                </td>
                                <td className="py-2.5">{new Date(v.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {selectedReportType === 'customers' && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[9px] uppercase">
                            <th className="py-2 pr-2">Customer ID</th>
                            <th className="py-2">Clinician / Hospital</th>
                            <th className="py-2">Corporate Email</th>
                            <th className="py-2">Mobile Contact</th>
                            <th className="py-2">Onboarded</th>
                            <th className="py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {customersReportData.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400">No clinical buyers found in registries.</td>
                            </tr>
                          ) : (
                            customersReportData.map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 font-bold text-slate-700 pr-2">{u.id}</td>
                                <td className="py-2.5 font-bold text-slate-900">{u.name}</td>
                                <td className="py-2.5">{u.email}</td>
                                <td className="py-2.5 font-mono">{u.phone || 'N/A'}</td>
                                <td className="py-2.5">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'}</td>
                                <td className="py-2.5 text-right font-bold">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] ${u.isVerified ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                                    {u.isVerified ? 'VERIFIED' : 'PENDING'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {selectedReportType === 'rfqs' && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[9px] uppercase">
                            <th className="py-2 pr-2">RFQ ID</th>
                            <th className="py-2">Clinical Purchaser</th>
                            <th className="py-2">Required Equipment Name</th>
                            <th className="py-2">Quantity</th>
                            <th className="py-2">Delivery Target</th>
                            <th className="py-2">Status</th>
                            <th className="py-2 text-right">Budget (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {rfqsReportData.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400">No RFQ tenders logged in system logs.</td>
                            </tr>
                          ) : (
                            rfqsReportData.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 font-bold text-teal-800 pr-2">#{r.id}</td>
                                <td className="py-2.5 max-w-[120px] truncate font-bold">{r.customerName}</td>
                                <td className="py-2.5 text-slate-900 font-bold truncate max-w-[150px]">{r.productName}</td>
                                <td className="py-2.5">{r.quantity} unit(s)</td>
                                <td className="py-2.5 truncate max-w-[120px]">{r.deliveryLocation}</td>
                                <td className="py-2.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${r.status === 'Open' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                    {r.status === 'Open' ? 'OPEN TENDER' : 'CLOSED'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-bold text-slate-950">₹{r.budget.toLocaleString('en-IN')}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Stamp & seal placeholder in preview */}
                  <div className="p-6 bg-slate-50 border-t-2 border-dashed border-slate-200 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase">
                    <div>
                      <p>HEALNEX ADMINISTRATIVE AUDIT DEPT.</p>
                      <p className="mt-0.5 text-slate-300">CERTIFICATION ID: HNX-LEDGER-AUTH-99A</p>
                    </div>
                    <div className="border border-slate-300 px-3 py-1.5 rounded bg-white text-center text-slate-500 font-mono font-extrabold border-dashed">
                      LEDGER TRUSTED SEAL
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        );
      })()}

      {/* Admin actions implementation helper functions */}
      {(() => {
        // Quick inline helper function attachment
        (window as any).handleSavePaymentSettings = handleSavePaymentSettings;
        return null;
      })()}

      {/* Admin Edit Product Modal */}
      {editingProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 animate-scale-up flex flex-col font-sans">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-teal-900 text-teal-300 p-2 rounded-xl border border-teal-500/30">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Edit Vendor Product Catalog Item
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Product ID: <span className="font-mono text-teal-400">{editingProductModal.id}</span> • Vendor: <strong className="text-white">{editingProductModal.vendorName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProductModal(null)}
                className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Section 1: Core Specifications */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <Tag className="w-4 h-4 text-teal-600" /> Basic Information & Catalog Classification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Title / Name *</label>
                    <input
                      type="text"
                      value={editingProductModal.name || ''}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Model Code *</label>
                    <input
                      type="text"
                      value={editingProductModal.sku || ''}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={editingProductModal.brand || ''}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, brand: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={editingProductModal.category || ''}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory</label>
                    <input
                      type="text"
                      value={editingProductModal.subcategory || ''}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, subcategory: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Inventory */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" /> Financials, Tax & Stock Levels
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (INR) *</label>
                    <input
                      type="number"
                      value={editingProductModal.price || 0}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, price: Number(e.target.value), salePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">MRP (INR)</label>
                    <input
                      type="number"
                      value={editingProductModal.mrp || 0}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, mrp: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Wholesale / B2B Price</label>
                    <input
                      type="number"
                      value={editingProductModal.wholesalePrice || 0}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, wholesalePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      value={editingProductModal.stockQuantity || 0}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, stockQuantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Min Order Qty (MOQ)</label>
                    <input
                      type="number"
                      value={editingProductModal.moq || 1}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, moq: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit Type</label>
                    <input
                      type="text"
                      value={editingProductModal.unit || 'Piece'}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HSN Code</label>
                    <input
                      type="text"
                      value={editingProductModal.hsnCode || ''}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, hsnCode: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GST Rate (%)</label>
                    <input
                      type="number"
                      value={editingProductModal.gstRate || 12}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, gstRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Descriptions, Media & Status */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <CheckCircle className="w-4 h-4 text-sky-600" /> Catalog Description, Images & Governance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Image URL</label>
                    <input
                      type="text"
                      value={(editingProductModal.images && editingProductModal.images[0]) || ''}
                      onChange={(e) => {
                        const newImages = [...(editingProductModal.images || [])];
                        newImages[0] = e.target.value;
                        setEditingProductModal({ ...editingProductModal, images: newImages });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Status *</label>
                    <select
                      value={editingProductModal.status}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Approved">Approved (Live)</option>
                      <option value="Pending">Pending Audit</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Draft">Draft</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Country Of Origin</label>
                    <input
                      type="text"
                      value={editingProductModal.countryOfOrigin || 'India'}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, countryOfOrigin: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Information</label>
                    <input
                      type="text"
                      value={editingProductModal.warranty || ''}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, warranty: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Clinical Description</label>
                    <textarea
                      rows={3}
                      value={editingProductModal.description || ''}
                      onChange={(e) => setEditingProductModal({ ...editingProductModal, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setEditingProductModal(null)}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminSaveEditedProduct}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Save Product Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents review modal popup */}
      {selectedVendorDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-6xl w-full h-[90vh] overflow-hidden shadow-2xl border border-slate-100 animate-scale-up flex flex-col font-sans">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-teal-900 text-teal-300 p-1.5 rounded-lg border border-teal-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300">
                    Clinical Vendor Auditing & Verification
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ID: <span className="font-mono">{selectedVendorDoc.id}</span> • Registered: {new Date(selectedVendorDoc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedVendorDoc(null);
                  setReasonRequiredAction(null);
                  setStatusReasonText('');
                }}
                className="text-slate-400 hover:text-white font-bold text-2xl transition cursor-pointer p-1"
              >
                &times;
              </button>
            </div>
            
            {/* Split Screen Workspace */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Column: Profile & Document Selection (4/12 cols) */}
              <div className="md:w-1/3 border-r border-slate-100 bg-slate-50/50 flex flex-col overflow-y-auto">
                
                {/* Profile Overview */}
                <div className="p-5 border-b border-slate-100 bg-white space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {selectedVendorDoc.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-xs truncate">
                        {selectedVendorDoc.companyName}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Owner: {selectedVendorDoc.ownerName}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-medium">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                      <span className="text-[8px] text-slate-400 block uppercase font-bold">GSTIN Number</span>
                      <span className="font-mono text-slate-800">{selectedVendorDoc.gstNumber}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                      <span className="text-[8px] text-slate-400 block uppercase font-bold">PAN Number</span>
                      <span className="font-mono text-slate-800">{selectedVendorDoc.panNumber || 'N/A'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                      <span className="text-[8px] text-slate-400 block uppercase font-bold">Aadhaar Card</span>
                      <span className="font-mono text-slate-800">{selectedVendorDoc.aadhaarNumber || 'N/A'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                      <span className="text-[8px] text-slate-400 block uppercase font-bold">Contact Phone</span>
                      <span className="text-slate-800">{selectedVendorDoc.mobileNumber}</span>
                    </div>
                  </div>

                  <div className="text-[10px] space-y-1 text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedVendorDoc.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedVendorDoc.businessAddress}, {selectedVendorDoc.district}, {selectedVendorDoc.state} - {selectedVendorDoc.pincode}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono">{selectedVendorDoc.bankDetails.bankName} - A/C {selectedVendorDoc.bankDetails.accountNumber} (IFSC: {selectedVendorDoc.bankDetails.ifscCode})</span>
                    </div>
                  </div>
                </div>

                {/* Document Selector Checklist */}
                <div className="p-5 space-y-3 flex-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Submitted Security Attachments:
                  </h4>
                  <div className="space-y-2">
                    {[
                      { key: 'gstCertificate', label: 'GST Certificate (REG-06)', required: true },
                      { key: 'tradeLicense', label: 'Active Trade License', required: true },
                      { key: 'companyRegCertificate', label: 'Company Registration (CoI)', required: true },
                      { key: 'cancelledCheque', label: 'Cancelled Cheque leaf', required: true },
                      { key: 'panCard', label: 'Corporate PAN Card', required: false },
                      { key: 'aadhaarCard', label: 'Promoter Aadhaar Card', required: false },
                      { key: 'drugLicense', label: 'State Drug Control License', required: false },
                      { key: 'fssaiLicense', label: 'FSSAI Food Safety License', required: false },
                    ].map((item) => {
                      // Retrieve file values from vendor documents
                      const docs = selectedVendorDoc.documents || {};
                      const urlField = (docs as any)[`${item.key}Url`] || '';
                      const nameField = (docs as any)[`${item.key}Name`] || '';
                      const hasDoc = !!urlField;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            if (hasDoc) {
                              setActiveReviewDocKey(item.key);
                              setDocZoom(100);
                              setDocRotation(0);
                            } else {
                              addToast(`${item.label} was not uploaded by this vendor.`, 'info');
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                            !hasDoc
                              ? 'bg-slate-100/50 border-slate-200/60 opacity-60 cursor-not-allowed'
                              : activeReviewDocKey === item.key
                              ? 'bg-teal-50 border-teal-500/40 text-teal-900 shadow-sm font-bold'
                              : 'bg-white border-slate-200 hover:border-teal-500/30'
                          }`}
                          disabled={!hasDoc}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              !hasDoc ? 'bg-slate-200 text-slate-400' : 'bg-teal-100/60 text-teal-700'
                            }`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold leading-tight truncate">
                                {item.label}
                              </p>
                              <p className="text-[8px] text-slate-400 truncate mt-0.5">
                                {hasDoc ? (nameField || 'uploaded_document.pdf') : 'Not Provided'}
                              </p>
                            </div>
                          </div>
                          
                          {item.required ? (
                            <span className="shrink-0 text-[7px] bg-rose-50 text-rose-600 px-1 py-0.5 rounded font-bold font-mono">
                              REQ
                            </span>
                          ) : (
                            <span className="shrink-0 text-[7px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono">
                              OPT
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: High-Fidelity Viewer stage (8/12 cols) */}
              <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
                
                {/* Document configuration lookup */}
                {(() => {
                  const docs = selectedVendorDoc.documents || {};
                  const activeUrl = (docs as any)[`${activeReviewDocKey}Url`];
                  const activeName = (docs as any)[`${activeReviewDocKey}Name` ] || `${activeReviewDocKey}_document.pdf`;
                  const activeLabelMap: Record<string, string> = {
                    gstCertificate: 'GST Certificate (REG-06)',
                    tradeLicense: 'Municipal Trade License',
                    companyRegCertificate: 'Company Registration (CoI)',
                    cancelledCheque: 'Cancelled Clearing Cheque Leaf',
                    panCard: 'Corporate PAN Card',
                    aadhaarCard: 'Promoter Aadhaar Card',
                    drugLicense: 'State Drug Control License',
                    fssaiLicense: 'FSSAI Food Safety License',
                  };
                  const activeLabel = activeLabelMap[activeReviewDocKey] || 'Corporate Document';

                  // If they didn't upload or it's empty, find the first available uploaded doc as default fallback
                  let finalKey = activeReviewDocKey;
                  let finalUrl = activeUrl;
                  let finalName = activeName;
                  let finalLabel = activeLabel;

                  if (!finalUrl) {
                    const firstUploaded = Object.keys(docs).find(k => k.endsWith('Url') && (docs as any)[k]);
                    if (firstUploaded) {
                      finalKey = firstUploaded.replace('Url', '');
                      finalUrl = (docs as any)[firstUploaded];
                      finalName = (docs as any)[`${finalKey}Name`] || `${finalKey}_document.pdf`;
                      finalLabel = activeLabelMap[finalKey] || 'Corporate Document';
                    }
                  }

                  // Generate beautiful preview image
                  const previewBase64 = generateAdminDocumentCanvas(finalLabel, finalName, selectedVendorDoc.companyName);
                  const isRealUpload = finalUrl && (finalUrl.startsWith('data:') || (finalUrl.startsWith('http') && !finalUrl.includes('firebasestorage.app')));
                  const displayUrl = isRealUpload ? finalUrl : previewBase64;
                  const isPdfFile = displayUrl.startsWith('data:application/pdf') || displayUrl.toLowerCase().endsWith('.pdf');

                  return (
                    <>
                      {/* Document Toolbar */}
                      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 text-white select-none">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] bg-teal-900/60 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono font-bold shrink-0 uppercase">
                            {finalName.split('.').pop() || 'PDF'}
                          </span>
                          <span className="text-xs font-bold text-slate-350 truncate" title={finalName}>
                            {finalName}
                          </span>
                        </div>

                        {/* Control buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDocZoom(prev => Math.max(50, prev - 15))}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition cursor-pointer"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono text-slate-400 w-12 text-center shrink-0">
                            {docZoom}%
                          </span>
                          <button
                            type="button"
                            onClick={() => setDocZoom(prev => Math.min(250, prev + 15))}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-px h-4 bg-slate-800 mx-1" />
                          <button
                            type="button"
                            onClick={() => setDocRotation(prev => prev - 90)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition cursor-pointer"
                            title="Rotate Left"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocRotation(prev => prev + 90)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition cursor-pointer"
                            title="Rotate Right"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDocZoom(100);
                              setDocRotation(0);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] font-bold text-slate-300 transition cursor-pointer"
                          >
                            Reset
                          </button>
                          <div className="w-px h-4 bg-slate-800 mx-1" />

                          {/* Upload Original File */}
                          <label className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer" title="Upload original vendor document image or PDF">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Original</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && selectedVendorDoc) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    if (ev.target?.result) {
                                      const dataUrl = ev.target.result as string;
                                      const updatedVendors = vendors.map(v => {
                                        if (v.id === selectedVendorDoc.id) {
                                          const existingDocs = v.documents || {};
                                          return {
                                            ...v,
                                            documents: {
                                              ...existingDocs,
                                              [`${finalKey}Url`]: dataUrl,
                                              [`${finalKey}Name`]: file.name
                                            }
                                          };
                                        }
                                        return v;
                                      });
                                      dbLocal.saveVendors(updatedVendors);
                                      loadData();
                                      const updatedCurrent = updatedVendors.find(v => v.id === selectedVendorDoc.id);
                                      if (updatedCurrent) setSelectedVendorDoc(updatedCurrent);
                                      addToast('Vendor original document updated successfully!', 'success');
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          {/* Real Downloader */}
                          <a
                            href={displayUrl}
                            download={`healnex_audit_${selectedVendorDoc.companyName.toLowerCase().replace(/\s+/g, '_')}_${finalName}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="Download verified document to device"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>

                      {/* Display Stage */}
                      <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-slate-950/80">
                        <div
                          className="shadow-2xl border border-slate-800 bg-white rounded-lg overflow-hidden cursor-grab active:cursor-grabbing origin-center"
                          style={{
                            transform: `scale(${docZoom / 100}) rotate(${docRotation}deg)`,
                            transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        >
                          {isPdfFile ? (
                            <iframe
                              src={displayUrl}
                              title={finalName}
                              className="w-[520px] h-[680px] border-0 bg-white select-none"
                            />
                          ) : (
                            <img
                              src={displayUrl}
                              alt="Digitized audit document preview"
                              referrerPolicy="no-referrer"
                              className="w-[480px] h-[640px] object-contain select-none"
                              draggable={false}
                            />
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

              </div>
            </div>

            {/* Modal Action Reason overlay (slide-up) */}
            {reasonRequiredAction && (
              <div className="absolute inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-md p-6 border-t border-slate-800 text-white animate-slide-up shrink-0 z-10">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      <h4 className="font-bold text-sm uppercase tracking-wider text-orange-300">
                        Provide Action Reason Note
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReasonRequiredAction(null)}
                      className="text-slate-400 hover:text-white font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-350">
                    You have selected <span className="text-orange-400 font-bold">{reasonRequiredAction.toUpperCase()}</span>. This audit reason will be saved in the database under <span className="font-mono text-white">statusReason</span> and pushed via in-app alerts and secure mail logs directly to the clinical vendor partner.
                  </p>
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Reason Message Details:
                    </label>
                    <textarea
                      rows={3}
                      value={statusReasonText}
                      onChange={(e) => setStatusReasonText(e.target.value)}
                      placeholder={`e.g., GST Certificate uploaded is blurred. Please capture a clear camera scan or upload the direct REG-06 PDF copy. Thank you.`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-teal-500/50 text-white font-medium"
                    />
                  </div>
                  <div className="flex justify-end gap-3.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setReasonRequiredAction(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                    >
                      Cancel Action
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!statusReasonText.trim()) {
                          addToast('Audit reason details cannot be blank.', 'error');
                          return;
                        }
                        handleVendorStatus(selectedVendorDoc.id, reasonRequiredAction, statusReasonText);
                      }}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition"
                    >
                      Confirm and Submit Audit Status
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Panel Footer */}
            {!reasonRequiredAction && (
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    Current Partner Status:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                    selectedVendorDoc.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : selectedVendorDoc.status === 'Pending'
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : selectedVendorDoc.status === 'MoreInfoRequired'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {selectedVendorDoc.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Approve Action */}
                  <button
                    type="button"
                    onClick={() => handleVendorStatus(selectedVendorDoc.id, 'Approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Vendor</span>
                  </button>

                  {/* Request More Documents */}
                  <button
                    type="button"
                    onClick={() => setReasonRequiredAction('MoreInfoRequired')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Request More Info</span>
                  </button>

                  {/* Reject Action */}
                  <button
                    type="button"
                    onClick={() => setReasonRequiredAction('Rejected')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Onboarding</span>
                  </button>

                  {/* Suspend Action (only if approved) */}
                  {selectedVendorDoc.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => setReasonRequiredAction('Suspended')}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Suspend Vendor</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* ----------------- FCM Cloud Push Logs Footer Component ----------------- */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-800 font-sans">
          
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-teal-950 text-teal-400 p-2 rounded-xl border border-teal-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  FCM Cloud Push Logs &amp; Alert Telemetry
                </h3>
                <p className="text-[10px] text-slate-400">
                  Real-time server push gateway for hospital purchasers and vendor partners
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                ACTIVE (HTTP/2 Multiplex)
              </span>
              <button
                onClick={() => {
                  dbLocal.saveNotifications([]);
                  setNotifs([]);
                  addToast('FCM Cloud Push log buffer purged.', 'info');
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-400 rounded-lg transition"
                title="Purge logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Layout: Logs feed + Trigger diagnostic box */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Logs List feed */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-teal-500" />
                  Live Multiplex stream ({notifs.length} logged)
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  Buffer: LocalStorage DB API
                </span>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 max-h-72 overflow-y-auto divide-y divide-slate-900/60 font-mono text-[11px] leading-relaxed">
                {notifs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <p className="text-xs font-semibold">Gateway buffer is clean.</p>
                    <p className="text-[10px] text-slate-600">Push-trigger commands are online. Issue a diagnostic payload.</p>
                  </div>
                ) : (
                  notifs.map((log) => (
                    <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 hover:bg-slate-900/40 px-2 rounded-lg transition">
                      <div className="shrink-0 mt-1">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${log.read ? 'bg-slate-600' : 'bg-teal-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${log.read ? 'bg-slate-500' : 'bg-teal-500'}`}></span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-teal-400 font-bold text-[10px]">
                            {log.title}
                          </span>
                          <span className="bg-slate-800 text-slate-300 text-[8px] px-1.5 py-0.5 rounded border border-slate-700 font-bold uppercase tracking-wider">
                            {log.type}
                          </span>
                          <span className="text-slate-500 text-[9px]">
                            Target: {log.userId}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[10px] mt-1 break-words">
                          {log.message}
                        </p>
                        <p className="text-slate-600 text-[9px] mt-1.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Diagnostics triggers Box */}
            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-orange-400 animate-bounce" />
                  Trigger Diagnostic Broadcast
                </h4>
                <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                  Generate immediate mock cloud pushes to specific segments to audit response times.
                </p>

                <div className="space-y-3 text-[10px] font-semibold text-slate-300">
                  <div>
                    <label className="block mb-1 text-slate-400">Target Segment ID</label>
                    <select
                      value={pushTarget}
                      onChange={(e) => setPushTarget(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-teal-700 text-white"
                    >
                      <option value="admin">Administrators ('admin')</option>
                      <option value="customer-sharma">Dr. Ramesh Sharma ('customer-sharma')</option>
                      <option value="vendor-medilink">MediLink Systems ('vendor-medilink')</option>
                      <option value="all">Global Broadcast ('all')</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400">Push Category/Topic</label>
                    <select
                      value={pushType}
                      onChange={(e) => setPushType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-teal-700 text-white"
                    >
                      <option value="clinical_broadcast">Clinical Announcement</option>
                      <option value="critical_alert">Critical Hardware Shortage</option>
                      <option value="rfq_created">New RFQ Opened</option>
                      <option value="vendor_approved">Vendor Approval Status</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400">Custom Alert Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Critical Supply Warning"
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-teal-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400">Alert Body Content</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Nationwide ICU ventilator inventory critical. Immediate review recommended."
                      value={pushMessage}
                      onChange={(e) => setPushMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-teal-700 text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!pushTitle.trim() || !pushMessage.trim()) {
                    addToast('Please enter both custom push title and message.', 'error');
                    return;
                  }
                  dbLocal.addNotification(pushTarget, pushTitle.trim(), pushMessage.trim(), pushType);
                  setNotifs(dbLocal.getNotifications());
                  addToast('FCM Cloud Push Payload successfully dispatched to target multiplex!', 'success');
                  setPushTitle('');
                  setPushMessage('');
                }}
                className="w-full mt-4 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold py-2.5 rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                style={{ animationDuration: '3s' }}
              >
                Send Cloud Push
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>

    {/* Print-only high-fidelity corporate ledger */}
    {activeTab === 'audit' && (() => {
      const q = reportSearchText.toLowerCase().trim();
      let printSalesData = orders.filter(o => {
        const matchesSearch = o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.vendorName.toLowerCase().includes(q);
        const matchesStatus = reportStatusFilter === 'All' || o.status === reportStatusFilter;
        return matchesSearch && matchesStatus;
      });
      let printPaymentsData = orders.filter(o => {
        const isManual = o.paymentMethod !== 'Razorpay';
        const matchesSearch = o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || (o.paymentTxId || '').toLowerCase().includes(q);
        const matchesStatus = reportStatusFilter === 'All' || o.status === reportStatusFilter;
        return isManual && matchesSearch && matchesStatus;
      });
      let printVendorsData = vendors.filter(v => {
        const matchesSearch = v.companyName.toLowerCase().includes(q) || v.ownerName.toLowerCase().includes(q) || v.state.toLowerCase().includes(q) || v.gstNumber.toLowerCase().includes(q);
        const matchesStatus = reportStatusFilter === 'All' || v.status === reportStatusFilter;
        return matchesSearch && matchesStatus;
      });
      let printCustomersData = users.filter(u => {
        if (u.role !== 'customer') return false;
        const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q);
        const matchesStatus = reportStatusFilter === 'All' || (reportStatusFilter === 'Verified' ? u.isVerified : !u.isVerified);
        return matchesSearch && matchesStatus;
      });
      let printRfqsData = dbLocal.getRfqs().filter(r => {
        const matchesSearch = r.productName.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q) || r.deliveryLocation.toLowerCase().includes(q);
        const matchesStatus = reportStatusFilter === 'All' || r.status === reportStatusFilter;
        return matchesSearch && matchesStatus;
      });

      return (
        <div className="hidden print:block p-8 font-mono text-xs leading-relaxed text-slate-800 bg-white">
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-6 mb-6">
            <h1 className="text-lg font-extrabold uppercase tracking-widest text-slate-900">
              HealNex Medi Bazar Ltd.
            </h1>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mt-1">
              B2B Procurement Desk • Official Audit Ledger Record
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Bangalore Corporate Head Office • Certified System Export
            </p>
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase mt-6">
              <span>Auditor: Super Admin</span>
              <span>Hash Key: MD5_LEDGER_LNEX_2026</span>
              <span>Generated: {new Date().toLocaleString()}</span>
            </div>
          </div>

          <h2 className="text-sm font-extrabold uppercase tracking-widest text-center text-slate-800 bg-slate-100 py-2 mb-6 border">
            Report Type: {selectedReportType.toUpperCase()} LEDGER
          </h2>

          <div className="overflow-x-auto">
            {selectedReportType === 'sales' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[10px] uppercase">
                    <th className="py-2 pr-2">Order ID</th>
                    <th className="py-2">Hospital Client</th>
                    <th className="py-2">Vendor Partner</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {printSalesData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No records matching active filter query.</td>
                    </tr>
                  ) : (
                    printSalesData.map((o) => (
                      <tr key={o.id} className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-teal-800 pr-2">#{o.id}</td>
                        <td className="py-2.5">{o.customerName}</td>
                        <td className="py-2.5">{o.vendorName}</td>
                        <td className="py-2.5">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="py-2.5 uppercase font-semibold">{o.paymentMethod}</td>
                        <td className="py-2.5 font-bold">{o.status}</td>
                        <td className="py-2.5 text-right font-bold text-slate-950">₹{o.finalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {selectedReportType === 'payments' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[10px] uppercase">
                    <th className="py-2 pr-2">Order ID</th>
                    <th className="py-2">UTR / Transaction ID</th>
                    <th className="py-2">Hospital Buyer</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Reported Date</th>
                    <th className="py-2 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {printPaymentsData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No manual payments logged in system ledger.</td>
                    </tr>
                  ) : (
                    printPaymentsData.map((o) => (
                      <tr key={o.id} className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-teal-800 pr-2">#{o.id}</td>
                        <td className="py-2.5 font-mono text-slate-900 border px-1 rounded">{o.paymentTxId || 'NOT REPORTED'}</td>
                        <td className="py-2.5">{o.customerName}</td>
                        <td className="py-2.5 uppercase font-bold">{o.paymentMethod}</td>
                        <td className="py-2.5 font-bold">{o.status === 'Order Sent to Vendor' ? 'CLEARED' : o.status}</td>
                        <td className="py-2.5">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="py-2.5 text-right font-bold text-slate-950">₹{o.finalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {selectedReportType === 'vendors' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[10px] uppercase">
                    <th className="py-2 pr-2">Vendor ID</th>
                    <th className="py-2">Company Name</th>
                    <th className="py-2">Owner Name</th>
                    <th className="py-2">Corporate State</th>
                    <th className="py-2">GSTIN Registry</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {printVendorsData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No corporate vendors matching query.</td>
                    </tr>
                  ) : (
                    printVendorsData.map((v) => (
                      <tr key={v.id} className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-slate-700 pr-2">{v.id}</td>
                        <td className="py-2.5 font-bold text-slate-900">{v.companyName}</td>
                        <td className="py-2.5">{v.ownerName}</td>
                        <td className="py-2.5">{v.state}</td>
                        <td className="py-2.5 font-mono font-semibold">{v.gstNumber}</td>
                        <td className="py-2.5 font-bold">{v.status}</td>
                        <td className="py-2.5">{new Date(v.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {selectedReportType === 'customers' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[10px] uppercase">
                    <th className="py-2 pr-2">Customer ID</th>
                    <th className="py-2">Clinician / Hospital</th>
                    <th className="py-2">Corporate Email</th>
                    <th className="py-2">Mobile Contact</th>
                    <th className="py-2">Onboarded</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {printCustomersData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No clinical buyers found in registries.</td>
                    </tr>
                  ) : (
                    printCustomersData.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-slate-700 pr-2">{u.id}</td>
                        <td className="py-2.5 font-bold text-slate-900">{u.name}</td>
                        <td className="py-2.5">{u.email}</td>
                        <td className="py-2.5 font-mono">{u.phone || 'N/A'}</td>
                        <td className="py-2.5">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'}</td>
                        <td className="py-2.5 text-right font-bold">{u.isVerified ? 'VERIFIED' : 'PENDING'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {selectedReportType === 'rfqs' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-900 font-bold text-[10px] uppercase">
                    <th className="py-2 pr-2">RFQ ID</th>
                    <th className="py-2">Clinical Purchaser</th>
                    <th className="py-2">Required Equipment Name</th>
                    <th className="py-2">Quantity</th>
                    <th className="py-2">Delivery Target</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Budget (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {printRfqsData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No RFQ tenders logged in system logs.</td>
                    </tr>
                  ) : (
                    printRfqsData.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-teal-800 pr-2">#{r.id}</td>
                        <td className="py-2.5 font-bold">{r.customerName}</td>
                        <td className="py-2.5 text-slate-900 font-bold">{r.productName}</td>
                        <td className="py-2.5">{r.quantity} unit(s)</td>
                        <td className="py-2.5">{r.deliveryLocation}</td>
                        <td className="py-2.5 font-bold">{r.status === 'Open' ? 'OPEN TENDER' : 'CLOSED'}</td>
                        <td className="py-2.5 text-right font-bold text-slate-950">₹{r.budget.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-12 pt-6 border-t-2 border-dashed border-slate-300 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
            <div>
              <p>HEALNEX ADMINISTRATIVE AUDIT DEPT.</p>
              <p className="mt-0.5 text-slate-300">CERTIFICATION ID: HNX-LEDGER-AUTH-99A</p>
            </div>
            <div className="border border-slate-300 px-4 py-2 rounded bg-white text-center text-slate-500 font-mono font-extrabold border-dashed">
              LEDGER TRUSTED SEAL
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}
