import React, { useState, useEffect } from 'react';
import { dbLocal } from '../db';
import { Vendor, Product, Order, RFQ, Quotation, User, PaymentClearanceRequest } from '../types';
import VendorProductManager from './VendorProductManager';
import {
  Store,
  Upload,
  Layers,
  FileSpreadsheet,
  Plus,
  Send,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardList,
  IndianRupee,
  Package,
  Calendar,
  FileText,
  Edit,
  Copy,
  Trash2,
  Eye,
  HelpCircle,
  TrendingUp,
  Archive,
  Video,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Search,
  Activity,
  Info,
  Printer,
  Download,
  CreditCard,
  Wallet,
  Percent,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export interface BulkProductRow {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  salePrice: number;
  mrp: number;
  moq: number;
  stockQuantity: number;
  hsnCode: string;
  gstRate: number;
  description: string;
  imageUrl: string;
}

interface VendorPanelProps {
  currentUser: User | null;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function VendorPanel({ currentUser, addToast }: VendorPanelProps) {
  const [vendorProfile, setVendorProfile] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clearanceRequests, setClearanceRequests] = useState<PaymentClearanceRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'products' | 'bulk' | 'orders' | 'rfqs' | 'payouts'>('products');

  // Payout Clearance Request State
  const [reqAmount, setReqAmount] = useState<number>(0);
  const [reqMethod, setReqMethod] = useState<'bank' | 'upi'>('bank');
  const [reqUpiId, setReqUpiId] = useState<string>('');
  const [reqNote, setReqNote] = useState<string>('');
  const [viewInvoiceModal, setViewInvoiceModal] = useState<PaymentClearanceRequest | null>(null);

  // Add Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCat, setNewProdCat] = useState('Medical Equipment');
  const [newProdSubcat, setNewProdSubcat] = useState('ECG Machine');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdSalePrice, setNewProdSalePrice] = useState(0);
  const [newProdMoq, setNewProdMoq] = useState(1);
  const [newProdQty, setNewProdQty] = useState(10);
  const [newProdHsn, setNewProdHsn] = useState('90181100');
  const [newProdGst, setNewProdGst] = useState(12);
  const [newProdWarranty, setNewProdWarranty] = useState('1 Year Standard');
  const [newProdOrigin, setNewProdOrigin] = useState('India');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1516549655169-df83a0774514');

  // Quotation/Bidding Form State
  const [activeRfqBid, setActiveRfqBid] = useState<RFQ | null>(null);
  const [bidPrice, setBidPrice] = useState<number>(0);
  const [bidDeliveryDays, setBidDeliveryDays] = useState<number>(5);
  const [bidValidDate, setBidValidDate] = useState('2026-07-30');
  const [bidSpecs, setBidSpecs] = useState('');

  // Bulk Upload state
  const [bulkMode, setBulkMode] = useState<'csv' | 'manual'>('csv');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkStatus, setBulkStatus] = useState('');
  const [parsedRows, setParsedRows] = useState<BulkProductRow[]>([]);
  const [manualRows, setManualRows] = useState<BulkProductRow[]>([
    {
      id: 'row-1',
      name: '',
      sku: '',
      brand: '',
      category: 'Medical Equipment',
      subcategory: 'General',
      price: 0,
      salePrice: 0,
      mrp: 0,
      moq: 1,
      stockQuantity: 10,
      hsnCode: '90189019',
      gstRate: 12,
      description: '',
      imageUrl: ''
    }
  ]);

  // Order tracking update states
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [shippingDetails, setShippingDetails] = useState<{ [orderId: string]: { courierName: string; trackingNumber: string } }>({});

  // Advanced Product Editor Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorStep, setEditorStep] = useState(1);
  const [editingProductId, setEditingProductId] = useState<string | null>(null); // null means creating
  const [editorData, setEditorData] = useState<Partial<Product>>({
    name: '', brand: '', sku: '', category: 'Medical Equipment', subcategory: '',
    description: '', price: 0, salePrice: 0, mrp: 0, wholesalePrice: 0,
    discountPercentage: 0, moq: 1, stockQuantity: 10, unit: 'Piece',
    hsnCode: '', gstRate: 12, warranty: '1 Year Warranty', countryOfOrigin: 'India',
    images: [], videoUrl: '', manufacturer: '', modelNumber: '',
    certifications: [], packageContents: '', lowStockAlert: 3, outOfStock: false,
    weight: 0, dimensions: { length: 0, width: 0, height: 0 },
    shippingCharges: 0, estimatedDeliveryTime: '3-5 Days', status: 'Draft',
    specifications: []
  });
  
  // Custom specification state inside form
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  
  // Search / filter in vendor dashboard
  const [prodSearch, setProdSearch] = useState('');
  const [prodFilterStatus, setProdFilterStatus] = useState<string>('All');
  const [prodFilterCat, setProdFilterCat] = useState<string>('All');

  const loadData = () => {
    if (!currentUser) return;
    const vendorsList = dbLocal.getVendors();
    const profile = vendorsList.find(v => v.id === currentUser.id) || null;
    setVendorProfile(profile);

    const prods = dbLocal.getProducts().filter(p => p.vendorId === currentUser.id);
    setProducts(prods);

    const ords = dbLocal.getOrders().filter(o => 
      o.vendorId === currentUser.id && 
      !['Pending Payment', 'Payment Submitted', 'Awaiting Payment Verification'].includes(o.status)
    );
    setOrders(ords);

    // RFQs are public if approved or already quoted
    const openRfqs = dbLocal.getRfqs().filter(r => r.status === 'OPEN_TO_VENDORS' || r.status === 'QUOTED');
    setRfqs(openRfqs);

    const quotes = dbLocal.getQuotations().filter(q => q.vendorId === currentUser.id);
    setQuotations(quotes);

    const clrs = dbLocal.getClearanceRequests().filter(c => c.vendorId === currentUser.id);
    setClearanceRequests(clrs);
  };

  const handleRequestClearance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !vendorProfile) return;
    
    const paymentSettings = dbLocal.getPaymentSettings();
    const minLimit = paymentSettings.minimumPayoutLimit || 500;
    const commRate = vendorProfile.customCommissionRate !== undefined ? vendorProfile.customCommissionRate : (paymentSettings.platformCommissionRate || 10);
    
    const completedOrders = orders.filter(o => ['Completed', 'Delivered', 'Payment Verified', 'Paid'].includes(o.status));
    const totalSales = completedOrders.reduce((acc, o) => acc + o.finalAmount, 0);
    const totalComm = Math.round((totalSales * commRate) / 100);
    const netEarned = Math.max(0, totalSales - totalComm);
    const pendingAmount = clearanceRequests.filter(c => c.status === 'Pending').reduce((acc, c) => acc + c.amount, 0);
    const withdrawnAmount = clearanceRequests.filter(c => c.status === 'Approved').reduce((acc, c) => acc + c.amount, 0);
    const availableBalance = Math.max(0, netEarned - pendingAmount - withdrawnAmount);

    if (reqAmount <= 0) {
      addToast('Please enter a valid withdrawal request amount greater than ₹0.', 'error');
      return;
    }
    if (reqAmount < minLimit) {
      addToast(`Minimum payout withdrawal limit is ₹${minLimit.toLocaleString()}. Please enter ₹${minLimit} or above.`, 'error');
      return;
    }
    if (reqAmount > availableBalance) {
      addToast(`Requested payout ₹${reqAmount.toLocaleString()} exceeds your available net balance (₹${availableBalance.toLocaleString()})!`, 'error');
      return;
    }
    if (reqMethod === 'upi' && !reqUpiId.trim()) {
      addToast('Please enter a valid UPI ID for payout settlement.', 'error');
      return;
    }

    const newReq: PaymentClearanceRequest = {
      id: `CLR-${Math.floor(10000 + Math.random() * 90000)}`,
      vendorId: currentUser.id,
      vendorName: vendorProfile.companyName || currentUser.name,
      amount: reqAmount,
      ordersCount: completedOrders.length,
      orderIds: completedOrders.map(o => o.id),
      status: 'Pending',
      requestedAt: new Date().toISOString(),
      payoutMethod: reqMethod,
      upiId: reqMethod === 'upi' ? reqUpiId.trim() : undefined,
      bankDetails: vendorProfile.bankDetails || {
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50200098765432',
        ifscCode: 'HDFC0001234'
      },
      grossSales: totalSales,
      commissionRate: commRate,
      commissionDeducted: Math.round((reqAmount * commRate) / (100 - commRate || 1)),
      netPayable: reqAmount,
      vendorNote: reqNote.trim() || `Requesting ${reqMethod.toUpperCase()} settlement payout.`
    };

    dbLocal.addClearanceRequest(newReq);
    dbLocal.addNotification(
      'admin',
      `New Payout Request: ₹${reqAmount.toLocaleString()}`,
      `Vendor ${vendorProfile.companyName} requested ${reqMethod.toUpperCase()} payout clearance of ₹${reqAmount.toLocaleString()}`,
      'payout_request'
    );
    addToast('Payout clearance request submitted successfully! Awaiting Admin approval.', 'success');
    setReqAmount(0);
    setReqNote('');
    loadData();
  };

  useEffect(() => {
    loadData();
    const handleDbUpdate = () => loadData();
    window.addEventListener('healnex_db_update', handleDbUpdate);
    return () => window.removeEventListener('healnex_db_update', handleDbUpdate);
  }, [currentUser]);

  const openAddProductModal = () => {
    setEditingProductId(null);
    setEditorStep(1);
    setEditorData({
      name: '', brand: '', sku: `SKU-${Date.now().toString().slice(-6)}`, category: 'Medical Equipment', subcategory: '',
      description: '', price: 0, salePrice: 0, mrp: 0, wholesalePrice: 0,
      discountPercentage: 0, moq: 1, stockQuantity: 10, unit: 'Piece',
      hsnCode: '', gstRate: 12, warranty: '1 Year Warranty', countryOfOrigin: 'India',
      images: [], videoUrl: '', manufacturer: '', modelNumber: '',
      certifications: [], packageContents: '', lowStockAlert: 3, outOfStock: false,
      weight: 0, dimensions: { length: 0, width: 0, height: 0 },
      shippingCharges: 0, estimatedDeliveryTime: '3-5 Days', status: 'Draft',
      specifications: []
    });
    setIsEditorOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProductId(product.id);
    setEditorStep(1);
    setEditorData({ ...product });
    setIsEditorOpen(true);
  };

  const handleDuplicateProduct = (product: Product) => {
    if (!currentUser || !vendorProfile) return;
    const duplicated: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      name: `Copy of ${product.name}`,
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      performance: { views: 0, inquiries: 0, sales: 0 }
    };
    const all = dbLocal.getProducts();
    all.unshift(duplicated);
    dbLocal.saveProducts(all);
    addToast('Product duplicated successfully as Draft!', 'success');
    loadData();
  };

  const handleDeleteProduct = (prodId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action is irreversible.')) return;
    const all = dbLocal.getProducts().filter(p => p.id !== prodId);
    dbLocal.saveProducts(all);
    addToast('Product deleted from database successfully.', 'info');
    loadData();
  };

  const handleToggleProductStatus = (product: Product) => {
    const updatedStatus = product.status === 'Inactive' ? 'Draft' : 'Inactive';
    const all = dbLocal.getProducts().map(p => {
      if (p.id === product.id) {
        return { ...p, status: updatedStatus as any };
      }
      return p;
    });
    dbLocal.saveProducts(all);
    addToast(`Product set to ${updatedStatus} successfully!`, 'success');
    loadData();
  };

  const handleSaveProduct = (asDraft: boolean = false) => {
    if (!currentUser || !vendorProfile) return;
    
    let finalDiscount = editorData.discountPercentage || 0;
    if (editorData.mrp && editorData.price) {
      finalDiscount = Math.round(((editorData.mrp - editorData.price) / editorData.mrp) * 100);
    }

    const finalProduct: Product = {
      id: editingProductId || `prod-${Date.now()}`,
      vendorId: currentUser.id,
      vendorName: vendorProfile.companyName,
      name: editorData.name || 'Unnamed Product',
      sku: editorData.sku || `SKU-${Date.now().toString().slice(-6)}`,
      brand: editorData.brand || 'Generic',
      category: editorData.category || 'Medical Equipment',
      subcategory: editorData.subcategory || '',
      description: editorData.description || '',
      specifications: editorData.specifications || [],
      price: Number(editorData.price) || 0,
      salePrice: Number(editorData.salePrice) || Number(editorData.price) || 0,
      mrp: Number(editorData.mrp) || 0,
      wholesalePrice: Number(editorData.wholesalePrice) || 0,
      discountPercentage: finalDiscount,
      moq: Number(editorData.moq) || 1,
      stockQuantity: Number(editorData.stockQuantity) || 0,
      unit: editorData.unit || 'Piece',
      hsnCode: editorData.hsnCode || '',
      gstRate: Number(editorData.gstRate) || 12,
      warranty: editorData.warranty || '',
      countryOfOrigin: editorData.countryOfOrigin || 'India',
      images: editorData.images && editorData.images.length > 0 ? editorData.images : ['https://images.unsplash.com/photo-1516549655169-df83a0774514'],
      videoUrl: editorData.videoUrl || '',
      manufacturer: editorData.manufacturer || '',
      modelNumber: editorData.modelNumber || '',
      certifications: editorData.certifications || [],
      packageContents: editorData.packageContents || '',
      lowStockAlert: Number(editorData.lowStockAlert) || 3,
      outOfStock: Number(editorData.stockQuantity) <= 0,
      weight: Number(editorData.weight) || 0,
      dimensions: editorData.dimensions || { length: 0, width: 0, height: 0 },
      shippingCharges: Number(editorData.shippingCharges) || 0,
      estimatedDeliveryTime: editorData.estimatedDeliveryTime || '3-5 Days',
      status: asDraft ? 'Draft' : 'Pending',
      createdAt: editorData.createdAt || new Date().toISOString(),
      performance: editorData.performance || { views: Math.floor(Math.random() * 30), inquiries: Math.floor(Math.random() * 5), sales: 0 }
    };

    const all = dbLocal.getProducts();
    if (editingProductId) {
      const index = all.findIndex(p => p.id === editingProductId);
      if (index !== -1) {
        all[index] = finalProduct;
      }
    } else {
      all.unshift(finalProduct);
    }

    dbLocal.saveProducts(all);
    
    if (!asDraft) {
      dbLocal.addNotification(
        'admin',
        `New Product Submission: ${finalProduct.name}`,
        `Vendor ${vendorProfile.companyName} has submitted a product in ${finalProduct.category} for verification.`,
        'product_submitted'
      );
      addToast('Product submitted successfully for administration audit!', 'success');
    } else {
      addToast('Product saved successfully as Draft!', 'success');
    }

    setIsEditorOpen(false);
    loadData();
  };

  const handleDownloadTemplate = () => {
    const headers = ['Name', 'SKU', 'Brand', 'Category', 'Subcategory', 'Price', 'SalePrice', 'MRP', 'MOQ', 'StockQuantity', 'HSNCode', 'GSTRate', 'Description', 'ImageURL'];
    const sample1 = [
      'Digital ECG Monitor 3-Channel',
      'SKU-ECG-003',
      'HealNex Cardiology',
      'Medical Equipment',
      'ECG Machine',
      '35000',
      '32000',
      '40000',
      '1',
      '15',
      '90181100',
      '12',
      'Advanced 3-channel digital electrocardiograph with interpretation analysis and high resolution thermal printer.',
      'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400'
    ];
    const sample2 = [
      'Hospital ICU Motorized Bed 5-Function',
      'SKU-BED-ICU5',
      'HealNex Furniture',
      'Hospital Furniture',
      'Hospital Beds',
      '85000',
      '78000',
      '95000',
      '1',
      '8',
      '94029010',
      '18',
      'Electric ICU bed with remote control backrest, leg rest, height adjustment, Trendelenburg and reverse Trendelenburg.',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400'
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), sample1.map(c => `"${c}"`).join(','), sample2.map(c => `"${c}"`).join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'HealNex_Bulk_Products_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setBulkFile(file);
    if (!file) return;

    setBulkStatus('Parsing spreadsheet rows...');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setBulkStatus('Failed to read file content.');
        return;
      }
      const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== '');
      if (lines.length <= 1) {
        addToast('Spreadsheet appears to have only headers or is empty.', 'info');
        setBulkStatus('File empty or header-only.');
        return;
      }
      const parsed: BulkProductRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 1 && cols[0]) {
          parsed.push({
            id: `parsed-${i}-${Date.now()}`,
            name: cols[0] || 'Untitled Medical Product',
            sku: cols[1] || `SKU-BLK-${Math.floor(Math.random() * 90000 + 10000)}`,
            brand: cols[2] || vendorProfile?.companyName || 'Generic Medical',
            category: cols[3] || 'Medical Equipment',
            subcategory: cols[4] || 'General Equipment',
            price: Number(cols[5]) || 1000,
            salePrice: Number(cols[6]) || Number(cols[5]) || 900,
            mrp: Number(cols[7]) || Math.round((Number(cols[5]) || 1000) * 1.25),
            moq: Number(cols[8]) || 1,
            stockQuantity: Number(cols[9]) || 10,
            hsnCode: cols[10] || '90189019',
            gstRate: Number(cols[11]) || 12,
            description: cols[12] || 'High quality clinical hospital grade medical product.',
            imageUrl: cols[13] || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400'
          });
        }
      }
      if (parsed.length > 0) {
        setParsedRows(parsed);
        setBulkStatus(`Loaded ${parsed.length} catalog items ready for verification & upload!`);
        addToast(`Successfully extracted ${parsed.length} items from CSV. Review & submit below.`, 'success');
      } else {
        setBulkStatus('No valid data rows found.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveBulkProducts = (rows: BulkProductRow[], asDraft: boolean = false) => {
    if (!vendorProfile || !currentUser) {
      addToast('Vendor profile missing. Please sign in.', 'error');
      return;
    }
    const validRows = rows.filter(r => r.name.trim() !== '');
    if (validRows.length === 0) {
      addToast('Please provide at least one product row with a Product Name.', 'error');
      return;
    }

    setBulkStatus('Saving products to catalog catalog...');
    const newProducts: Product[] = validRows.map((r, i) => ({
      id: `prod-blk-${Date.now()}-${i}`,
      vendorId: currentUser.id,
      vendorName: vendorProfile.companyName || 'Vendor Partner',
      name: r.name.trim(),
      sku: r.sku.trim() || `SKU-BLK-${Math.floor(Math.random() * 90000 + 10000)}`,
      brand: r.brand.trim() || vendorProfile.companyName || 'HealNex Partner',
      category: r.category || 'Medical Equipment',
      subcategory: r.subcategory || 'General',
      description: r.description.trim() || `${r.name} - Professional medical & hospital grade equipment.`,
      specifications: [{ key: 'Quality Standard', value: 'Hospital Grade Certified' }],
      price: Number(r.price) || 1000,
      salePrice: Number(r.salePrice) || Number(r.price) || 900,
      mrp: Number(r.mrp) || Math.round((Number(r.price) || 1000) * 1.25),
      wholesalePrice: Number(r.salePrice) || Number(r.price) || 900,
      moq: Number(r.moq) || 1,
      stockQuantity: Number(r.stockQuantity) || 10,
      unit: 'Piece',
      hsnCode: r.hsnCode || '90189019',
      gstRate: Number(r.gstRate) || 12,
      warranty: '1 Year Standard Warranty',
      countryOfOrigin: 'India',
      images: [r.imageUrl || 'https://images.unsplash.com/photo-1516549655169-df83a0774514'],
      status: asDraft ? 'Draft' : 'Pending',
      createdAt: new Date().toISOString(),
      performance: { views: 0, inquiries: 0, sales: 0 }
    }));

    const all = dbLocal.getProducts();
    dbLocal.saveProducts([...newProducts, ...all]);

    if (!asDraft) {
      dbLocal.addNotification(
        'admin',
        `Bulk Catalog Upload: ${vendorProfile.companyName}`,
        `Vendor ${vendorProfile.companyName} uploaded ${newProducts.length} new products in bulk for verification.`,
        'product_submitted'
      );
      addToast(`Successfully submitted ${newProducts.length} bulk products for admin audit!`, 'success');
    } else {
      addToast(`Saved ${newProducts.length} products as Drafts!`, 'success');
    }

    setBulkStatus('');
    setBulkFile(null);
    setParsedRows([]);
    setManualRows([{
      id: `row-${Date.now()}`,
      name: '',
      sku: '',
      brand: '',
      category: 'Medical Equipment',
      subcategory: 'General',
      price: 0,
      salePrice: 0,
      mrp: 0,
      moq: 1,
      stockQuantity: 10,
      hsnCode: '90189019',
      gstRate: 12,
      description: '',
      imageUrl: ''
    }]);
    setActiveTab('products');
    loadData();
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !vendorProfile || !activeRfqBid) return;

    // Get commission rate applied for this vendor
    const commRate = vendorProfile.customCommissionRate !== undefined 
      ? vendorProfile.customCommissionRate 
      : (dbLocal.getPaymentSettings().platformCommissionRate || 10);

    const basePrice = Number(bidPrice);
    const platformFee = basePrice * (commRate / 100);
    const finalCustomerPrice = basePrice + platformFee;
    const finalTotalPrice = finalCustomerPrice * activeRfqBid.quantity;

    const newQuotation: Quotation = {
      id: `QUO-${Date.now()}`,
      rfqId: activeRfqBid.id,
      vendorId: currentUser.id,
      vendorName: vendorProfile.ownerName,
      companyName: vendorProfile.companyName,
      pricePerUnit: finalCustomerPrice, // sets final_customer_price as per-unit price for legacy compatibility
      totalPrice: finalTotalPrice,
      validUntil: bidValidDate,
      deliveryDays: Number(bidDeliveryDays),
      specifications: bidSpecs,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      vendor_base_price: basePrice,
      final_customer_price: finalCustomerPrice,
      platform_fee: platformFee,
      commissionRateApplied: commRate,
    };

    const quotes = dbLocal.getQuotations();
    quotes.push(newQuotation);
    dbLocal.saveQuotations(quotes);

    // Update quote count and status on RFQ to QUOTED
    const allRfqs = dbLocal.getRfqs().map(r => {
      if (r.id === activeRfqBid.id) {
        return { 
          ...r, 
          status: 'QUOTED' as const,
          quotationsCount: (r.quotationsCount || 0) + 1 
        };
      }
      return r;
    });
    dbLocal.saveRfqs(allRfqs);

    // Alert Customer
    dbLocal.addNotification(
      activeRfqBid.customerId,
      `New Quotation Received: ${vendorProfile.companyName}`,
      `Vendor ${vendorProfile.companyName} submitted a bid with certified unit price of ₹${finalCustomerPrice.toLocaleString('en-IN')} (total ₹${finalTotalPrice.toLocaleString('en-IN')}) for your RFQ "${activeRfqBid.productName}".`,
      'quote_received'
    );

    addToast(`Your bid proposal has been submitted with commission injection (${commRate}% platform fee included).`, 'success');
    setActiveRfqBid(null);
    setBidPrice(0);
    setBidSpecs('');
    loadData();
  };

  const handleOrderStatusUpdate = (orderId: string, nextStatus: Order['status'], customCourier?: string, customTracking?: string) => {
    const allOrders = dbLocal.getOrders().map(o => {
      if (o.id === orderId) {
        let noteText = `Order status updated to ${nextStatus} by vendor partner.`;
        let trackNo = o.trackingNumber;
        let courier = o.courierName || o.shippingProvider;

        if (nextStatus === 'Shipped') {
          if (customTracking || trackingNumber) trackNo = customTracking || trackingNumber;
          if (customCourier) courier = customCourier;
          noteText = `Order shipped via ${courier || 'Courier'}. Consignment / Tracking No: ${trackNo || 'N/A'}`;
        }

        const updatedTimeline = [
          ...o.timeline,
          {
            status: nextStatus,
            time: new Date().toISOString(),
            note: noteText
          }
        ];

        // Notify customer
        dbLocal.addNotification(
          o.customerId,
          `Order Status: ${nextStatus}`,
          nextStatus === 'Shipped'
            ? `Your equipment order #${o.id} has been dispatched via ${courier || 'Courier Partner'}. Tracking Number: ${trackNo}`
            : `Your equipment order #${o.id} status has changed to ${nextStatus}.`,
          nextStatus === 'Shipped' ? 'order_shipped' : 'order_delivered'
        );

        return {
          ...o,
          status: nextStatus,
          trackingNumber: trackNo,
          courierName: courier,
          shippingProvider: courier || o.shippingProvider || 'Standard Courier',
          timeline: updatedTimeline
        };
      }
      return o;
    });
    dbLocal.saveOrders(allOrders);
    setTrackingNumber('');
    setSelectedTrackingOrder(null);
    addToast(`Order status synced as ${nextStatus}!`, 'success');
    loadData();
  };

  const isApproved = vendorProfile?.status === 'Approved';

  if (vendorProfile && !isApproved) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans text-left">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 to-cyan-900 p-8 text-white relative">
            <div className="absolute top-6 right-6 opacity-10">
              <Store className="w-24 h-24" />
            </div>
            <span className={`px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
              vendorProfile.status === 'Pending' ? 'bg-amber-500 text-slate-950' :
              vendorProfile.status === 'MoreInfoRequired' ? 'bg-orange-500 text-white' :
              vendorProfile.status === 'Suspended' ? 'bg-red-600 text-white' :
              'bg-rose-500 text-white'
            }`}>
              Account Status: {vendorProfile.status}
            </span>
            <h1 className="text-2xl font-black mt-4 font-display">{vendorProfile.companyName}</h1>
            <p className="text-xs text-slate-200 mt-1 opacity-90">
              HealNex Clinical B2B Supplier Workspace Activation
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Warning Info */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <div className="space-y-1.5 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm">Administrative Onboarding Audit in Progress</h3>
                <p className="text-slate-600 leading-relaxed">
                  Before accessing the B2B catalog, receiving clinical orders, or bidding on hospital RFQs, your business credentials (GST, drug licenses, and bank info) must be fully authorized by our compliance administrators.
                </p>
                {vendorProfile.statusReason && (
                  <div className="bg-rose-50/70 border border-rose-200 text-rose-950 rounded-xl p-4 mt-3 space-y-1">
                    <span className="font-black text-[10px] uppercase tracking-wider text-rose-800 block">Message from Compliance Audit Team:</span>
                    <p className="font-medium text-xs italic">{vendorProfile.statusReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stepper progress */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Onboarding Journey Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 flex items-center gap-3">
                  <div className="bg-emerald-500 text-white rounded-full p-1.5 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">1. KYC Submission</p>
                    <p className="text-[10px] text-slate-500 font-medium">8 Security Documents Loaded</p>
                  </div>
                </div>

                <div className={`border rounded-xl p-4 flex items-center gap-3 ${
                  vendorProfile.status === 'Pending' ? 'border-amber-200 bg-amber-50/40 animate-pulse' :
                  vendorProfile.status === 'MoreInfoRequired' ? 'border-orange-200 bg-orange-50/30' :
                  'border-rose-200 bg-rose-50/30'
                }`}>
                  <div className={`rounded-full p-1.5 shrink-0 ${
                    vendorProfile.status === 'Pending' ? 'bg-amber-500 text-slate-950' :
                    'bg-orange-500 text-white'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">2. Document Auditing</p>
                    <p className="text-[10px] text-slate-500 font-medium">Under active review</p>
                  </div>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex items-center gap-3 opacity-60">
                  <div className="bg-slate-200 text-slate-500 rounded-full p-1.5 shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">3. Workspace Active</p>
                    <p className="text-[10px] text-slate-500 font-medium">Awaiting live approval</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Read-Only KYC Document Status Panel */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4.5 h-4.5 text-teal-700" />
                Submitted Regulatory Vault Status
              </h3>
              <p className="text-[11px] text-slate-500">
                All uploaded documents are locked securely and visible only to authorized admin auditors.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: 'gstCertificate', label: 'GST Certificate (REG-06)' },
                  { key: 'tradeLicense', label: 'Municipal Trade License' },
                  { key: 'companyRegCertificate', label: 'Company Registration (CoI)' },
                  { key: 'cancelledCheque', label: 'Cancelled Clearing Cheque' },
                  { key: 'panCard', label: 'Corporate PAN Card' },
                  { key: 'aadhaarCard', label: 'Promoter Aadhaar Card' },
                  { key: 'drugLicense', label: 'State Drug Control License' },
                  { key: 'fssaiLicense', label: 'FSSAI Food Safety License' },
                ].map(docItem => {
                  const docs = vendorProfile.documents || {};
                  const docUrl = (docs as any)[`${docItem.key}Url`];
                  const docName = (docs as any)[`${docItem.key}Name`] || `${docItem.key}.pdf`;

                  return (
                    <div key={docItem.key} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50 flex items-center justify-between gap-4">
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-extrabold text-slate-800 truncate" title={docItem.label}>{docItem.label}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5" title={docName}>{docName}</p>
                      </div>
                      <span className="bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-teal-600" /> Loaded
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact / Help Footer */}
            <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <span className="text-slate-500 font-medium">Need express activation support or uploaded wrong files?</span>
              <button
                onClick={() => addToast('Verification support alert sent to administrators.', 'info')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl transition cursor-pointer"
              >
                Contact Super Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Pending status banner block */}
      {vendorProfile && !isApproved && (
        <div className="bg-amber-50 border-l-4 border-amber-600 rounded-xl p-4 mb-8 flex items-start gap-3 text-xs leading-relaxed text-amber-900 shadow-sm animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Clinical Vendor Account Pending Verification</h4>
            <p className="mt-1">
              Your business credentials, GST Identification, and Trade certificates are undergoing active administrative validation.
              You will be notified once HealNex administrators approve your profile. 
              <strong> You cannot list catalog equipment, respond to hospital RFQs, or collect orders in the pending stage.</strong>
            </p>
          </div>
        </div>
      )}

      {/* Panel header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap text-teal-700">
            <Store className="w-6 h-6" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              {vendorProfile ? vendorProfile.companyName : 'Partner Console'}
            </h1>
            {vendorProfile?.trustSeal && (
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-white" />
                {vendorProfile.trustSealLevel || 'Verified Clinical Supplier'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supplier Workspace: Catalog synchronization, stock replenishment, RFQ bids, and clinical logistics tracking.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'profile' ? 'bg-white text-slate-950 shadow-sm font-bold text-teal-800' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            KYC Docs & Profile
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'products' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Clinical Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'bulk' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            disabled={!isApproved}
            style={{ opacity: isApproved ? 1 : 0.5 }}
          >
            Bulk Sync (CSV)
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'orders' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Fulfillment Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('rfqs')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'rfqs' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            disabled={!isApproved}
            style={{ opacity: isApproved ? 1 : 0.5 }}
          >
            B2B Tenders/RFQs ({rfqs.length})
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'payouts' ? 'bg-white text-slate-950 shadow-sm font-bold text-teal-800' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            💸 Payouts & Clearance ({clearanceRequests.filter(c => c.status === 'Pending').length})
          </button>
        </div>
      </div>

      {/* profile tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                Corporate KYC & Regulatory Documents
              </h3>
              <p className="text-xs text-slate-500">
                Upload and manage your original corporate certificates. Uploaded images or PDFs will be verified by HealNex Admin.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              vendorProfile?.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              Status: {vendorProfile?.status || 'Pending Audit'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'gstCertificate', label: 'GST Certificate (REG-06)' },
              { key: 'tradeLicense', label: 'Municipal Trade License' },
              { key: 'companyRegCertificate', label: 'Company Registration (CoI)' },
              { key: 'cancelledCheque', label: 'Cancelled Clearing Cheque' },
              { key: 'panCard', label: 'Corporate PAN Card' },
              { key: 'aadhaarCard', label: 'Promoter Aadhaar Card' },
              { key: 'drugLicense', label: 'State Drug Control License' },
              { key: 'fssaiLicense', label: 'FSSAI Food Safety License' },
            ].map(docItem => {
              const docs = vendorProfile?.documents || {};
              const docUrl = (docs as any)[`${docItem.key}Url`];
              const docName = (docs as any)[`${docItem.key}Name`] || `${docItem.key}.pdf`;
              const isUploaded = Boolean(docUrl);

              return (
                <div key={docItem.key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">{docItem.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isUploaded ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {isUploaded ? 'Uploaded' : 'Missing'}
                      </span>
                    </div>
                    {isUploaded && (
                      <p className="text-[10px] text-slate-500 font-mono truncate" title={docName}>
                        {docName}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 gap-2">
                    <label className="flex-1 text-center bg-teal-600 hover:bg-teal-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploaded ? 'Replace File' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                const dataUrl = ev.target.result as string;
                                const currentVendors = dbLocal.getVendors();
                                const updatedVendors = currentVendors.map(v => {
                                  if (v.id === (vendorProfile?.id || currentUser.id)) {
                                    const existingDocs = v.documents || {};
                                    return {
                                      ...v,
                                      documents: {
                                        ...existingDocs,
                                        [`${docItem.key}Url`]: dataUrl,
                                        [`${docItem.key}Name`]: file.name
                                      }
                                    };
                                  }
                                  return v;
                                });
                                dbLocal.saveVendors(updatedVendors);
                                addToast(`${docItem.label} original file uploaded successfully!`, 'success');
                                window.dispatchEvent(new Event('healnex_db_update'));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* products tab */}
      {activeTab === 'products' && (
        <VendorProductManager
          currentUser={currentUser}
          vendor={vendorProfile || {
            id: currentUser.id,
            companyName: currentUser.companyName || currentUser.name,
            ownerName: currentUser.name,
            email: currentUser.email,
            mobileNumber: currentUser.mobileNumber || '',
            gstNumber: '',
            panNumber: '',
            aadhaarNumber: '',
            businessAddress: '',
            state: '',
            district: '',
            pincode: '',
            bankDetails: { bankName: '', accountNumber: '', ifscCode: '' },
            documents: {},
            status: 'Approved',
            createdAt: new Date().toISOString()
          }}
          products={products}
          onRefresh={loadData}
        />
      )}

      {/* Bulk Catalog Upload Tab */}
      {activeTab === 'bulk' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-6xl mx-auto animate-fade-in space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Vendor Bulk Catalog Synchronizer</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload bulk medical products exclusively within the Vendor Portal via CSV spreadsheet or multi-row spreadsheet editor.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4 text-teal-700" />
                Download Sample CSV Template
              </button>
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                <button
                  type="button"
                  onClick={() => setBulkMode('csv')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${bulkMode === 'csv' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  📁 Upload CSV Spreadsheet
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${bulkMode === 'manual' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  📝 Manual Multi-Row Grid
                </button>
              </div>
            </div>
          </div>

          {bulkStatus && (
            <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl text-xs text-center text-teal-900 font-semibold font-mono">
              {bulkStatus}
            </div>
          )}

          {/* Mode 1: CSV Upload */}
          {bulkMode === 'csv' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-2xl p-8 text-center transition bg-slate-50/60">
                <Upload className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".csv, .txt, .xlsx"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="bulk-csv-picker"
                />
                <label htmlFor="bulk-csv-picker" className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-sm transition">
                  {bulkFile ? `Selected: ${bulkFile.name}` : 'Select Clinical Catalog Spreadsheet (.csv)'}
                </label>
                <p className="text-[11px] text-slate-500 mt-2">
                  Standard format headers: Name, SKU, Brand, Category, Subcategory, Price, SalePrice, MRP, MOQ, StockQuantity, HSNCode, GSTRate, Description, ImageURL
                </p>
              </div>

              {parsedRows.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-800">
                      Extracted Products Ready for Upload: <span className="text-teal-700">{parsedRows.length} items</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedRows([])}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Clear Parsed List
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                          <th className="p-2.5 border-b">#</th>
                          <th className="p-2.5 border-b">Product Name</th>
                          <th className="p-2.5 border-b">SKU</th>
                          <th className="p-2.5 border-b">Category / Subcat</th>
                          <th className="p-2.5 border-b">Price (₹)</th>
                          <th className="p-2.5 border-b">MRP (₹)</th>
                          <th className="p-2.5 border-b">Stock Qty</th>
                          <th className="p-2.5 border-b">HSN / GST</th>
                          <th className="p-2.5 border-b text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => {
                                  const list = [...parsedRows];
                                  list[idx].name = e.target.value;
                                  setParsedRows(list);
                                }}
                                className="w-full bg-transparent border-b border-transparent focus:border-teal-600 outline-none font-bold"
                              />
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">
                              <input
                                type="text"
                                value={row.sku}
                                onChange={(e) => {
                                  const list = [...parsedRows];
                                  list[idx].sku = e.target.value;
                                  setParsedRows(list);
                                }}
                                className="w-24 bg-transparent border-b border-transparent focus:border-teal-600 outline-none font-mono"
                              />
                            </td>
                            <td className="p-2.5">
                              <span className="block font-semibold text-slate-800">{row.category}</span>
                              <span className="text-[10px] text-slate-400">{row.subcategory}</span>
                            </td>
                            <td className="p-2.5 font-mono font-bold text-teal-700">₹{row.salePrice || row.price}</td>
                            <td className="p-2.5 font-mono line-through text-slate-400">₹{row.mrp}</td>
                            <td className="p-2.5 font-mono text-slate-800">{row.stockQuantity} pcs</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
                              HSN: {row.hsnCode}<br/>GST: {row.gstRate}%
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => setParsedRows(parsedRows.filter(r => r.id !== row.id))}
                                className="text-slate-400 hover:text-rose-600 transition"
                                title="Remove row"
                              >
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveBulkProducts(parsedRows, false)}
                      className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wide transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Submit {parsedRows.length} Products for Verification
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveBulkProducts(parsedRows, true)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Save All as Drafts
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Manual Multi-Row Grid Editor */}
          {bulkMode === 'manual' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-600 font-medium">
                  Enter multiple hospital equipment catalog items directly inside the editable table below:
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setManualRows([
                      ...manualRows,
                      {
                        id: `row-${Date.now()}`,
                        name: '',
                        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
                        brand: vendorProfile?.companyName || '',
                        category: 'Medical Equipment',
                        subcategory: 'General Equipment',
                        price: 15000,
                        salePrice: 14000,
                        mrp: 18000,
                        moq: 1,
                        stockQuantity: 20,
                        hsnCode: '90189019',
                        gstRate: 12,
                        description: 'Medical grade clinical equipment.',
                        imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400'
                      }
                    ])}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product Row
                  </button>
                  {manualRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setManualRows(manualRows.slice(0, 1))}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition"
                    >
                      Reset Rows
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                      <th className="p-2.5 border-b w-8">#</th>
                      <th className="p-2.5 border-b w-48">Product Name *</th>
                      <th className="p-2.5 border-b w-28">SKU</th>
                      <th className="p-2.5 border-b w-36">Category</th>
                      <th className="p-2.5 border-b w-24">Price (₹) *</th>
                      <th className="p-2.5 border-b w-24">MRP (₹)</th>
                      <th className="p-2.5 border-b w-20">Stock</th>
                      <th className="p-2.5 border-b w-24">HSN Code</th>
                      <th className="p-2.5 border-b w-16">GST %</th>
                      <th className="p-2.5 border-b w-12 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {manualRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. ICU Ventilator Machine"
                            value={row.name}
                            onChange={(e) => {
                              const list = [...manualRows];
                              list[idx].name = e.target.value;
                              setManualRows(list);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-teal-600 font-semibold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="SKU-101"
                            value={row.sku}
                            onChange={(e) => {
                              const list = [...manualRows];
                              list[idx].sku = e.target.value;
                              setManualRows(list);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-teal-600 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.category}
                            onChange={(e) => {
                              const list = [...manualRows];
                              list[idx].category = e.target.value;
                              setManualRows(list);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-teal-600 text-xs"
                          >
                            <option value="Medical Equipment">Medical Equipment</option>
                            <option value="Surgical Instruments">Surgical Instruments</option>
                            <option value="Hospital Furniture">Hospital Furniture</option>
                            <option value="Hospital Consumables">Hospital Consumables</option>
                            <option value="Diagnostic Kits">Diagnostic Kits</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            placeholder="Price"
                            value={row.price || ''}
                            onChange={(e) => {
                              const list = [...manualRows];
                              list[idx].price = Number(e.target.value);
                              list[idx].salePrice = Number(e.target.value);
                              setManualRows(list);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-teal-600 font-mono font-bold text-teal-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            placeholder="MRP"
                            value={row.mrp || ''}
                            onChange={(e) => {
                              const list = [...manualRows];
                              list[idx].mrp = Number(e.target.value);
                              setManualRows(list);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-teal-600 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={row.stockQuantity || ''}
                            onChange={(e) => {
                              const list = [...manualRows];
                              list[idx].stockQuantity = Number(e.target.value);
                              setManualRows(list);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-teal-600 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="90189019"
                            value={row.hsnCode}
                            onChange={(e) => {
                              const list = [...manualRows];
                              list[idx].hsnCode = e.target.value;
                              setManualRows(list);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-teal-600 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            placeholder="12"
                            value={row.gstRate || ''}
                            onChange={(e) => {
                              const list = [...manualRows];
                              list[idx].gstRate = Number(e.target.value);
                              setManualRows(list);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-teal-600 font-mono"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {manualRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setManualRows(manualRows.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleSaveBulkProducts(manualRows, false)}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wide transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Submit {manualRows.filter(r => r.name.trim()).length} Products for Admin Verification
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBulkProducts(manualRows, true)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Save as Drafts
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders log tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Customer Equipment Sales</h3>
            <button
              onClick={() => setActiveTab('payouts')}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              Request Payment Clearance
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No orders received yet. Catalog must be approved to receive sales.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((o) => (
                <div key={o.id} className="p-6 flex flex-col md:flex-row justify-between gap-6 hover:bg-slate-50/30 transition">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900">Order ID: #{o.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        o.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : o.status === 'Shipped'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : o.status === 'Packed'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : o.status === 'Vendor Accepted'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : o.status === 'Vendor Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                      Purchaser: <strong className="text-slate-800">{o.customerName}</strong> | Email: <span className="font-mono">{o.customerEmail}</span>
                    </p>
                    
                    <div className="mt-3 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80 max-w-md">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-700">
                          <span>{item.productName} <strong className="text-slate-900">(x{item.quantity})</strong></span>
                          <span className="font-mono font-semibold">₹{item.price.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-900">
                        <span>Total Order Amount:</span>
                        <span className="font-mono">₹{o.finalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {(o.trackingNumber || o.courierName || o.shippingProvider) && ['Shipped', 'Delivered'].includes(o.status) && (
                      <div className="mt-3 bg-sky-50/80 border border-sky-200 p-3.5 rounded-xl text-xs font-mono text-sky-950 flex flex-col gap-1.5 max-w-md shadow-sm">
                        <div className="flex justify-between items-center border-b border-sky-200/70 pb-1.5">
                          <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-sky-800">Courier Dispatch Details</span>
                          <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded font-bold uppercase">{o.status}</span>
                        </div>
                        <div className="flex justify-between pt-0.5">
                          <span className="text-slate-500 font-sans">Courier Partner Name:</span>
                          <strong className="text-slate-900 font-sans">{o.courierName || o.shippingProvider || 'Standard Courier'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Tracking / Consignment No:</span>
                          <strong className="text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-sky-200">{o.trackingNumber || 'N/A'}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-start items-end gap-2.5 shrink-0 w-full sm:w-64">
                    {['Pending', 'Confirmed', 'Order Sent to Vendor', 'Payment Verified', 'Paid'].includes(o.status) && (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => handleOrderStatusUpdate(o.id, 'Vendor Accepted')}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition shadow-sm"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={() => handleOrderStatusUpdate(o.id, 'Vendor Rejected')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2 px-3 rounded-xl transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {o.status === 'Vendor Accepted' && (
                      <div className="w-full space-y-2">
                        <button
                          onClick={() => handleOrderStatusUpdate(o.id, 'Packed')}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-sm"
                        >
                          Mark as Packed
                        </button>
                      </div>
                    )}

                    {['Packed', 'Vendor Accepted', 'Processing'].includes(o.status) && (
                      <div className="space-y-2 w-full bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-sm mt-1">
                        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Courier Dispatch Info</p>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Courier Partner Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. BlueDart, Delhivery, DTDC"
                            value={shippingDetails[o.id]?.courierName || ''}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, [o.id]: { ...shippingDetails[o.id], courierName: e.target.value } })}
                            className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-sans focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Tracking / AWB Number *</label>
                          <input
                            type="text"
                            placeholder="e.g. AWB98432890"
                            value={shippingDetails[o.id]?.trackingNumber || ''}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, [o.id]: { ...shippingDetails[o.id], trackingNumber: e.target.value } })}
                            className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-mono focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const details = shippingDetails[o.id] || { courierName: '', trackingNumber: '' };
                            handleOrderStatusUpdate(o.id, 'Shipped', details.courierName, details.trackingNumber);
                          }}
                          disabled={!(shippingDetails[o.id]?.courierName?.trim()) || !(shippingDetails[o.id]?.trackingNumber?.trim())}
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 px-3 rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-sm mt-2"
                        >
                          Dispatch / Mark Shipped
                        </button>
                      </div>
                    )}

                    {o.status === 'Shipped' && (
                      <button
                        onClick={() => handleOrderStatusUpdate(o.id, 'Delivered')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition w-full text-center shadow-sm"
                      >
                        Mark as Delivered
                      </button>
                    )}

                    {o.status === 'Delivered' && (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold py-2 px-3 rounded-xl w-full text-center">
                        ✓ Successfully Delivered
                      </div>
                    )}

                    {o.status === 'Vendor Rejected' && (
                      <div className="bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold py-2 px-3 rounded-xl w-full text-center">
                        ✕ Rejected by Vendor
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RFQ bidding section */}
      {activeTab === 'rfqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Active Tenders list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ClipboardList className="w-5 h-5 text-teal-700" />
              Active Hospital Procurement Tenders (RFQs)
            </h3>

            {rfqs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No active RFQs matching catalog channels.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rfqs.map((r) => {
                  const myBid = quotations.find(q => q.rfqId === r.id);
                  return (
                    <div key={r.id} className="p-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md font-bold">
                            Tender ID: {r.id}
                          </span>
                          <h4 className="font-bold text-slate-900 mt-2 text-sm sm:text-base">{r.productName}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{r.description}</p>
                          <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-400 font-semibold">
                            <span>Quantity: <strong className="text-slate-700">{r.quantity} units</strong></span>
                            <span>Est. Budget: <strong className="text-emerald-700">₹{r.budget.toLocaleString('en-IN')}</strong></span>
                            <span>Destination: <strong className="text-slate-700">{['PAYMENT_VERIFIED_ORDER_PLACED', 'Closed'].includes(r.status) ? r.deliveryLocation : '🔒 Locked (Revealed upon escrow payment verification)'}</strong></span>
                          </div>
                        </div>

                        {!myBid ? (
                          <button
                            onClick={() => {
                              setActiveRfqBid(r);
                              setBidPrice(Math.round(r.budget / r.quantity));
                            }}
                            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 transition"
                          >
                            Send Quote
                          </button>
                        ) : (
                          <div className="text-right shrink-0">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              myBid.status === 'Accepted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                              Bid: {myBid.status}
                            </span>
                            <p className="text-xs font-bold text-slate-900 font-mono mt-1">₹{myBid.totalPrice.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active quote placement board */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 h-fit">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-teal-700" />
              RFQ Bid Sheet
            </h3>

            {activeRfqBid ? (
              <form onSubmit={handleBidSubmit} className="space-y-4 text-xs font-medium">
                <div className="bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                  <p className="text-[10px] text-teal-800 uppercase font-bold tracking-wide">Target Hospital Project</p>
                  <p className="font-bold text-slate-800 mt-1">{activeRfqBid.productName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Need: {activeRfqBid.quantity} units | Budget limit: ₹{activeRfqBid.budget.toLocaleString()}</p>
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Commercial Price (Per Unit) *</label>
                  <input
                    type="number"
                    required
                    value={bidPrice || ''}
                    onChange={(e) => setBidPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-mono text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Total Bid Value: <strong className="text-emerald-700 font-mono">₹{(bidPrice * activeRfqBid.quantity).toLocaleString()}</strong></p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Lead Time (Days)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={bidDeliveryDays}
                      onChange={(e) => setBidDeliveryDays(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Offer Valid Until</label>
                    <input
                      type="date"
                      required
                      value={bidValidDate}
                      onChange={(e) => setBidValidDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Specifications & Warranty Inclusion</label>
                  <textarea
                    rows={3}
                    placeholder="Describe specific ISO/CE standards, installation services included..."
                    value={bidSpecs}
                    onChange={(e) => setBidSpecs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveRfqBid(null)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl text-center"
                  >
                    Submit Quotation
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center text-slate-400 p-8">
                <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Select "Send Quote" on an active tender to construct your bid sheet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payouts & Clearance tab */}
      {activeTab === 'payouts' && (() => {
        const paymentSettings = dbLocal.getPaymentSettings();
        const commRate = vendorProfile?.customCommissionRate !== undefined ? vendorProfile.customCommissionRate : (paymentSettings.platformCommissionRate || 10);
        const completedOrders = orders.filter(o => ['Completed', 'Delivered', 'Payment Verified', 'Paid'].includes(o.status));
        const totalSales = completedOrders.reduce((acc, o) => acc + o.finalAmount, 0);
        const totalComm = Math.round((totalSales * commRate) / 100);
        const netEarnings = Math.max(0, totalSales - totalComm);
        const pendingPayouts = clearanceRequests.filter(c => c.status === 'Pending').reduce((acc, c) => acc + c.amount, 0);
        const totalWithdrawn = clearanceRequests.filter(c => c.status === 'Approved').reduce((acc, c) => acc + c.amount, 0);
        const availableBalance = Math.max(0, netEarnings - pendingPayouts - totalWithdrawn);
        const minLimit = paymentSettings.minimumPayoutLimit || 500;

        return (
          <div className="space-y-6 animate-fade-in pb-12">
            {/* Wallet Dashboard Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-teal-700" />
                  Vendor Earnings & Settlement Wallet
                </h3>
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full border border-slate-200">
                  Platform Commission: <strong className="text-teal-800">{commRate}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Sales</span>
                  <p className="text-xl font-black text-slate-900 mt-1 font-display">₹{totalSales.toLocaleString()}</p>
                  <span className="text-[9px] text-slate-500 font-medium">{completedOrders.length} completed orders</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">Commission ({commRate}%)</span>
                  <p className="text-xl font-black text-rose-600 mt-1 font-display">-₹{totalComm.toLocaleString()}</p>
                  <span className="text-[9px] text-slate-500 font-medium">Platform fee deducted</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Net Earnings</span>
                  <p className="text-xl font-black text-slate-800 mt-1 font-display">₹{netEarnings.toLocaleString()}</p>
                  <span className="text-[9px] text-slate-500 font-medium">Gross payable balance</span>
                </div>

                <div className="bg-teal-700 p-4 rounded-2xl border border-teal-600 shadow-md text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200 block">Available Balance</span>
                  <p className="text-2xl font-black text-white mt-1 font-display">₹{availableBalance.toLocaleString()}</p>
                  <span className="text-[9px] text-teal-100 font-medium">Ready for withdrawal</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Pending Payouts</span>
                  <p className="text-xl font-black text-amber-700 mt-1 font-display">₹{pendingPayouts.toLocaleString()}</p>
                  <span className="text-[9px] text-slate-500 font-medium">Awaiting admin review</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Total Withdrawn</span>
                  <p className="text-xl font-black text-emerald-700 mt-1 font-display">₹{totalWithdrawn.toLocaleString()}</p>
                  <span className="text-[9px] text-slate-500 font-medium">Paid into bank/UPI</span>
                </div>
              </div>
            </div>

            {/* Automatic Calculation Example Box */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-5 rounded-2xl shadow-sm border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-teal-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300">Automatic Settlement Calculation Rule</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  For every completed order, HealNex automatically calculates earnings: <strong className="text-white">Order Amount - Platform Commission ({commRate}%) = Vendor Net Earnings</strong>. Upon payout approval, your Available Balance drops to ₹0 while Total Withdrawn reflects the cleared transfer.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 px-4 py-3 rounded-xl text-xs font-mono shrink-0 space-y-1">
                <div className="flex justify-between gap-4"><span className="text-slate-300">Ex. Order:</span> <strong className="text-white">₹10,000</strong></div>
                <div className="flex justify-between gap-4"><span className="text-rose-300">Commission ({commRate}%):</span> <strong className="text-rose-300">-₹1,000</strong></div>
                <div className="border-t border-white/20 pt-1 flex justify-between gap-4"><span className="text-emerald-300 font-bold">Net Wallet:</span> <strong className="text-emerald-300 font-bold">₹9,000</strong></div>
              </div>
            </div>

            {/* Request Form and Complete History Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Request Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Send className="w-4 h-4 text-teal-700" />
                  Request Payout Withdrawal
                </h3>
                <form onSubmit={handleRequestClearance} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-700">Withdrawal Amount (₹) *</label>
                      <button
                        type="button"
                        onClick={() => setReqAmount(availableBalance)}
                        className="text-[10px] text-teal-700 hover:underline font-bold"
                      >
                        Max: ₹{availableBalance.toLocaleString()}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        min={minLimit}
                        max={availableBalance > 0 ? availableBalance : undefined}
                        value={reqAmount || ''}
                        onChange={(e) => setReqAmount(Number(e.target.value))}
                        placeholder={`Min limit: ₹${minLimit}`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-sm font-bold outline-none focus:border-teal-700 focus:bg-white transition"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Minimum payout limit: ₹{minLimit.toLocaleString()}</p>
                  </div>

                  {/* Choose Payout Method */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Choose Payout Method *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReqMethod('bank')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                          reqMethod === 'bank' ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Bank Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setReqMethod('upi')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                          reqMethod === 'upi' ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" /> UPI Instant
                      </button>
                    </div>
                  </div>

                  {reqMethod === 'bank' ? (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlement Bank Account</span>
                      <p className="font-bold text-slate-800">{vendorProfile?.bankDetails?.bankName || 'HDFC Bank Ltd'}</p>
                      <p className="font-mono text-slate-600">A/C: {vendorProfile?.bankDetails?.accountNumber || '50200098765432'}</p>
                      <p className="font-mono text-slate-500 text-[10px]">IFSC: {vendorProfile?.bankDetails?.ifscCode || 'HDFC0001234'}</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Enter UPI ID (VPA) *</label>
                      <input
                        type="text"
                        required={reqMethod === 'upi'}
                        value={reqUpiId}
                        onChange={(e) => setReqUpiId(e.target.value)}
                        placeholder="e.g. vendorname@okaxis or 9876543210@paytm"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono outline-none focus:border-teal-700 focus:bg-white transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reference Note / Comment</label>
                    <textarea
                      rows={2}
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      placeholder="e.g. Requesting withdrawal of net earnings for May."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-700 focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={availableBalance < minLimit}
                    className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Payout Request
                  </button>
                  {availableBalance < minLimit && (
                    <p className="text-[10px] text-rose-500 text-center font-bold">You need at least ₹{minLimit} in available balance to request withdrawal.</p>
                  )}
                </form>
              </div>

              {/* Complete Payout History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Complete Payout History</h3>
                    <p className="text-[10px] text-slate-400">All submitted withdrawal logs and status updates</p>
                  </div>
                  <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-700">{clearanceRequests.length} transactions</span>
                </div>

                {clearanceRequests.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 my-auto">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No payout withdrawal requests recorded yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="p-4">Payout Ref</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Method</th>
                          <th className="p-4">Requested Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Payment Ref / Remarks</th>
                          <th className="p-4 text-right">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clearanceRequests.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-4 font-mono font-bold text-slate-900">#{c.id}</td>
                            <td className="p-4 font-black text-slate-900 text-sm">₹{c.amount.toLocaleString()}</td>
                            <td className="p-4 uppercase font-bold text-slate-600 text-[11px]">
                              {c.payoutMethod || 'BANK'}
                            </td>
                            <td className="p-4 text-slate-500">{new Date(c.requestedAt).toLocaleDateString()}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                                c.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                c.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {c.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                                {c.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                                {c.status === 'Approved' ? 'PAID' : c.status}
                              </span>
                            </td>
                            <td className="p-4 max-w-xs">
                              {c.paymentReference && (
                                <div className="text-emerald-700 font-mono text-[11px] font-bold">UTR/Txn: {c.paymentReference}</div>
                              )}
                              <div className="text-slate-500 text-[11px] truncate" title={c.adminNote || c.vendorNote}>
                                {c.adminNote || c.vendorNote || 'No notes'}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setViewInvoiceModal(c)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5 text-teal-700" /> Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-generated Settlement Invoice Modal */}
            {viewInvoiceModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
                <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
                  <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Settlement Invoice & Receipt</span>
                      <h3 className="text-lg font-black mt-0.5 font-display">HealNex Medi Bazar B2B Settlement</h3>
                    </div>
                    <button
                      onClick={() => setViewInvoiceModal(null)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 text-slate-800 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[10px]">Vendor Recipient</p>
                        <h4 className="text-base font-black text-slate-900 mt-1">{viewInvoiceModal.vendorName}</h4>
                        <p className="text-slate-500">ID: {viewInvoiceModal.vendorId}</p>
                        {viewInvoiceModal.payoutMethod === 'upi' ? (
                          <p className="font-mono text-slate-600 mt-1">UPI ID: {viewInvoiceModal.upiId || 'N/A'}</p>
                        ) : (
                          <p className="font-mono text-slate-600 mt-1">Bank A/C: {viewInvoiceModal.bankDetails?.accountNumber || 'HDFC502000...'}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-400 uppercase text-[10px]">Settlement Reference</p>
                        <h4 className="font-mono text-sm font-black text-teal-800 mt-1">#{viewInvoiceModal.id}</h4>
                        <p className="text-slate-500">Date: {new Date(viewInvoiceModal.requestedAt).toLocaleDateString()}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase mt-2 ${
                          viewInvoiceModal.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          viewInvoiceModal.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Status: {viewInvoiceModal.status === 'Approved' ? 'PAID / CLEARED' : viewInvoiceModal.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gross Sales Revenue Covered:</span>
                        <span className="font-bold">₹{(viewInvoiceModal.grossSales ?? viewInvoiceModal.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Platform Commission Rate:</span>
                        <span className="font-bold text-rose-600">{viewInvoiceModal.commissionRate ?? commRate}%</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                        <span>Net Payout Settlement Amount:</span>
                        <span className="text-teal-800 font-display">₹{viewInvoiceModal.amount.toLocaleString()}</span>
                      </div>
                    </div>

                    {viewInvoiceModal.paymentReference && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex justify-between items-center">
                        <div>
                          <span className="font-bold block text-[10px] uppercase">Transaction UTR / Reference ID</span>
                          <span className="font-mono font-black text-sm">{viewInvoiceModal.paymentReference}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-200/60 px-2.5 py-1 rounded-lg">VERIFIED PAYMENT</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                      This is an electronically generated settlement statement from HealNex Medi Bazar Platform Administration. All platform commission fees are calculated strictly as per vendor marketplace agreement.
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button
                      onClick={() => setViewInvoiceModal(null)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" /> Print Invoice / Save PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}
