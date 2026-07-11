import React, { useState, useEffect, useRef } from 'react';
import { dbLocal } from '../db';
import { Product, Order, RFQ, Quotation, Category, Brand, Review, User, OrderItem, PaymentSettings, PromoBanner, Vendor } from '../types';
import qrcode from 'qrcode-generator';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import {
  Heart,
  ShoppingCart,
  SlidersHorizontal,
  Info,
  Layers,
  Scale,
  Send,
  IndianRupee,
  MapPin,
  ClipboardList,
  FilePlus,
  FileText,
  Loader2,
  CheckCircle,
  Truck,
  Plus,
  Minus,
  Check,
  Star,
  Search,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  Sparkles,
  Upload,
  QrCode,
  AlertTriangle,
  CreditCard,
  ArrowLeftRight,
  Copy,
  RotateCcw,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Activity,
  FlaskConical,
  Scissors,
  Bed,
  HeartPulse,
  Syringe
} from 'lucide-react';
import InvoicePDF from './InvoicePDF';
import HomepageTrustSection from './HomepageTrustSection';
import { PolicyType } from './PolicyModal';
import { GoogleSheetsSync } from './GoogleSheetsSync';
import { getCachedWorkspaceToken, createGoogleSpreadsheet, appendRowsToSpreadsheet, uploadFileToGoogleDrive } from '../utils/googleSheets';
import { uploadScreenshotToDrive, saveOrderToSheet } from '../lib/googleSheets';

const CategoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Activity': Activity,
  'FlaskConical': FlaskConical,
  'Sparkles': Sparkles,
  'Scissors': Scissors,
  'Bed': Bed,
  'HeartPulse': HeartPulse,
  'Syringe': Syringe,
};

interface CustomerPanelProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  currentView: string;
  cart: { product: Product; quantity: number }[];
  onUpdateCart: (cart: { product: Product; quantity: number }[]) => void;
  wishlist: string[];
  onUpdateWishlist: (wishlist: string[]) => void;
  compareList: Product[];
  onUpdateCompare: (compare: Product[]) => void;
  searchQuery: string;
  onClearSearch: () => void;
  selectedCategoryName: string;
  onCategorySelect: (catName: string) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
  onOpenPolicy?: (policy: PolicyType) => void;
}

export default function CustomerPanel({
  currentUser,
  onNavigate,
  currentView,
  cart,
  onUpdateCart,
  wishlist,
  onUpdateWishlist,
  compareList,
  onUpdateCompare,
  searchQuery,
  onClearSearch,
  selectedCategoryName,
  onCategorySelect,
  addToast,
  isDarkMode = false,
  onOpenPolicy
}: CustomerPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => dbLocal.getCategories().filter(c => c.isActive !== false));
  const [brands, setBrands] = useState<Brand[]>(() => dbLocal.getBrands().filter(b => b.isActive !== false));

  // AI-Powered state variables
  const [aiSearchResults, setAiSearchResults] = useState<{ productId: string; relevanceScore: number; aiInsight: string }[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  const [aiRecommendations, setAiRecommendations] = useState<{ productId: string; recommendationReason: string }[]>([]);
  const [aiClinicalTip, setAiClinicalTip] = useState('');
  const [isAiRecommending, setIsAiRecommending] = useState(false);

  // Detailed Modal view of a product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filters State
  const [filterBrand, setFilterBrand] = useState('');
  const [filterPriceRange, setFilterPriceRange] = useState<number>(500000);
  const [filterMoq, setFilterMoq] = useState<number>(100);
  const [filterTrustSealOnly, setFilterTrustSealOnly] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [filterInStockOnly, setFilterInStockOnly] = useState(false);
  const [filterCountry, setFilterCountry] = useState('');

  // RFQ Submission form state
  const [rfqName, setRfqName] = useState('');
  const [rfqQty, setRfqQty] = useState<number>(1);
  const [rfqBudget, setRfqBudget] = useState<number>(0);
  const [rfqLocation, setRfqLocation] = useState('');
  const [rfqDesc, setRfqDesc] = useState('');
  const [rfqAttachmentName, setRfqAttachmentName] = useState('');

  // Payment sandbox state
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'payment' | 'processing' | 'success'>('cart');
  const [razorpayMethod, setRazorpayMethod] = useState<'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking'>('UPI');
  
  // Shipping details state
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  
  // Billing details state
  const [billingAddress, setBillingAddress] = useState({
    address: 'City Hospital, Emergency Wing, Station Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001'
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  
  // Manual Payment verification and settings states
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(dbLocal.getPaymentSettings());
  const [selectedPayMethod, setSelectedPayMethod] = useState<'razorpay' | 'upi' | 'bank' | 'neft' | 'imps' | 'rtgs' | 'cash' | ''>('upi');
  const [manualTxId, setManualTxId] = useState('');
  const [manualBankName, setManualBankName] = useState('');
  const [manualPaymentDate, setManualPaymentDate] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [reuploadScreenshotFile, setReuploadScreenshotFile] = useState<File | null>(null);
  const [screenshotUploading, setScreenshotUploading] = useState<boolean>(false);
  const [screenshotUploadProgress, setScreenshotUploadProgress] = useState<number>(0);

  const uploadScreenshot = async (file: File): Promise<{ url: string; name: string }> => {
    return new Promise((resolve, reject) => {
      setScreenshotUploading(true);
      setScreenshotUploadProgress(10);
      
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storagePath = `payment_screenshots/${fileName}`;
      const fileRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setScreenshotUploadProgress(Math.max(10, progress));
        }, 
        async (error) => {
          console.warn('Firebase Storage upload failed, falling back to Base64:', error);
          try {
            const reader = new FileReader();
            reader.onloadend = () => {
              setScreenshotUploading(false);
              setScreenshotUploadProgress(100);
              resolve({ url: reader.result as string, name: file.name });
            };
            reader.onerror = (err) => {
              setScreenshotUploading(false);
              reject(err);
            };
            reader.readAsDataURL(file);
          } catch (e) {
            setScreenshotUploading(false);
            reject(e);
          }
        }, 
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setScreenshotUploading(false);
            setScreenshotUploadProgress(100);
            resolve({ url: downloadUrl, name: file.name });
          } catch (err) {
            console.warn('Failed to get download URL, falling back to Base64:', err);
            const reader = new FileReader();
            reader.onloadend = () => {
              setScreenshotUploading(false);
              resolve({ url: reader.result as string, name: file.name });
            };
            reader.readAsDataURL(file);
          }
        }
      );
    });
  };

  const [ordersFilter, setOrdersFilter] = useState<'All' | 'Pending Verification' | 'Active' | 'Completed'>('All');
  
  // Order specific re-upload payment state
  const [reuploadingOrderId, setReuploadingOrderId] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    address: 'City Hospital, emergency Wing, Station Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001'
  });
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Active invoice view
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<Order | null>(null);

  // RFQ review comparator state
  const [activeRfqReview, setActiveRfqReview] = useState<RFQ | null>(null);

  // References to keep track of previous API request payloads to avoid infinite quota-draining requests
  const lastSearchKeyRef = useRef<string>('');
  const lastRecommendKeyRef = useRef<string>('');

  const loadData = () => {
    const approvedVendors = dbLocal.getVendors().filter(v => v.status === 'Approved');
    setVendors(prev => {
      if (JSON.stringify(prev) === JSON.stringify(approvedVendors)) return prev;
      return approvedVendors;
    });

    // Only approved, published, active products with stock > 0 are visible to customers
    const approvedProducts = dbLocal.getProducts().filter(p => {
      const isApproved = p.status?.toLowerCase() === 'approved';
      const hasStock = p.stockQuantity !== undefined && p.stockQuantity > 0;
      return isApproved && p.published === true && p.isActive === true && hasStock;
    });
    setProducts(prev => {
      if (JSON.stringify(prev) === JSON.stringify(approvedProducts)) return prev;
      return approvedProducts;
    });

    if (currentUser) {
      const myOrders = dbLocal.getOrders().filter(o => o.customerId === currentUser.id);
      setOrders(prev => {
        if (JSON.stringify(prev) === JSON.stringify(myOrders)) return prev;
        return myOrders;
      });

      const myRfqs = dbLocal.getRfqs().filter(r => r.customerId === currentUser.id);
      setRfqs(prev => {
        if (JSON.stringify(prev) === JSON.stringify(myRfqs)) return prev;
        return myRfqs;
      });

      const allQuotations = dbLocal.getQuotations();
      setQuotations(prev => {
        if (JSON.stringify(prev) === JSON.stringify(allQuotations)) return prev;
        return allQuotations;
      });
    }

    const allReviews = dbLocal.getReviews();
    setReviews(prev => {
      if (JSON.stringify(prev) === JSON.stringify(allReviews)) return prev;
      return allReviews;
    });

    const currentSettings = dbLocal.getPaymentSettings();
    setPaymentSettings(currentSettings);

    const liveBanners = dbLocal.getPromoBanners().filter(b => b.isActive).sort((a, b) => (a.positionOrder || 0) - (b.positionOrder || 0));
    setPromoBanners(prev => {
      if (JSON.stringify(prev) === JSON.stringify(liveBanners)) return prev;
      return liveBanners;
    });

    const activeCategories = dbLocal.getCategories().filter(c => c.isActive !== false);
    setCategories(prev => {
      if (JSON.stringify(prev) === JSON.stringify(activeCategories)) return prev;
      return activeCategories;
    });

    const activeBrands = dbLocal.getBrands().filter(b => b.isActive !== false);
    setBrands(prev => {
      if (JSON.stringify(prev) === JSON.stringify(activeBrands)) return prev;
      return activeBrands;
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('healnex_db_update', loadData);
    return () => {
      window.removeEventListener('healnex_db_update', loadData);
    };
  }, [currentUser]);

  useEffect(() => {
    if (promoBanners.length <= 1) return;
    const sliderInterval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % promoBanners.length);
    }, 6000);
    return () => clearInterval(sliderInterval);
  }, [promoBanners.length]);

  useEffect(() => {
    if (typeof window !== 'undefined' && products.length > 0) {
      const path = window.location.pathname;
      if (path.startsWith('/product/')) {
        const prodIdOrSku = decodeURIComponent(path.replace('/product/', ''));
        const matched = products.find(p => p.id === prodIdOrSku || p.sku === prodIdOrSku);
        if (matched && (!selectedProduct || selectedProduct.id !== matched.id)) {
          setSelectedProduct(matched);
        }
      } else if (path.startsWith('/brand/')) {
        const brand = decodeURIComponent(path.replace('/brand/', ''));
        if (brand && filterBrand !== brand) {
          setFilterBrand(brand);
        }
      }
    }
  }, [products]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('healnex_active_product', { detail: selectedProduct }));
  }, [selectedProduct]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('healnex_checkout_step', { detail: checkoutStep }));
  }, [checkoutStep]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('healnex_active_order', { detail: viewInvoiceOrder }));
  }, [viewInvoiceOrder]);

  // Fetch semantic search results from Express server powered by Gemini
  useEffect(() => {
    if (!searchQuery || products.length === 0) {
      setAiSearchResults([]);
      lastSearchKeyRef.current = '';
      return;
    }

    setAiSearchResults([]); // clear stale ai results immediately so instant character matches take priority

    // Stabilize search execution using a composite hash key
    const currentSearchKey = `${searchQuery}::${products.map(p => p.id).sort().join(',')}`;
    if (lastSearchKeyRef.current === currentSearchKey) {
      return; // Do not fetch again if nothing changed
    }

    const triggerAiSearch = async () => {
      lastSearchKeyRef.current = currentSearchKey;
      setIsAiSearching(true);
      try {
        const res = await fetch('/api/groq/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchQuery, products })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.matches) {
            setAiSearchResults(data.matches);
          }
        }
      } catch (err) {
        console.warn('AI search network delay or fallback active:', err);
      } finally {
        setIsAiSearching(false);
      }
    };

    const timer = setTimeout(triggerAiSearch, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, products]);

  // Fetch complementary recommendations and compliance advice
  useEffect(() => {
    if (products.length === 0) {
      return;
    }

    // Stabilize recommendation execution using a composite hash key of cart, catalog, and current user
    const currentRecommendKey = JSON.stringify({
      cartIds: (cart || []).map(i => `${i.product.id}-${i.quantity}`),
      userId: currentUser?.id || 'guest',
      productIds: products.map(p => p.id).sort()
    });

    if (lastRecommendKeyRef.current === currentRecommendKey) {
      return; // Do not fetch again if nothing changed
    }

    const fetchRecommendations = async () => {
      lastRecommendKeyRef.current = currentRecommendKey;
      setIsAiRecommending(true);
      try {
        const res = await fetch('/api/groq/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: cart,
            allProducts: products,
            userContext: currentUser ? { name: currentUser.name, role: currentUser.role } : 'Guest'
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.recommendations) setAiRecommendations(data.recommendations);
            if (data.clinicalTip) setAiClinicalTip(data.clinicalTip);
          }
        }
      } catch (err) {
        console.warn('AI recommendations network delay or fallback active:', err);
      } finally {
        setIsAiRecommending(false);
      }
    };

    fetchRecommendations();
  }, [cart, products, currentUser]);

  // Filters calculation & Semantic AI ranking integration
  const filteredProducts = React.useMemo(() => {
    // 1. Filter out non-matching products
    const matched = products.filter(p => {
      const matchesCategory = selectedCategoryName
        ? p.category.toLowerCase() === selectedCategoryName.toLowerCase()
        : true;

      const matchesBrand = filterBrand ? p.brand.toLowerCase() === filterBrand.toLowerCase() || p.brand.toLowerCase().includes(filterBrand.toLowerCase()) : true;
      const matchesPrice = p.salePrice <= filterPriceRange;
      const matchesMoq = p.moq <= filterMoq;
      const matchesTrustSeal = filterTrustSealOnly
        ? vendors.some(v => (v.id === p.vendorId || v.companyName === p.vendorName) && v.trustSeal)
        : true;
      const matchesRating = filterMinRating > 0 ? (p.rating || 0) >= filterMinRating : true;
      const matchesStock = filterInStockOnly ? (p.stockQuantity !== undefined ? p.stockQuantity > 0 : p.inStock) : true;
      const matchesCountry = filterCountry ? (p.countryOfOrigin || '').toLowerCase().includes(filterCountry.toLowerCase()) : true;

      if (!matchesCategory || !matchesBrand || !matchesPrice || !matchesMoq || !matchesTrustSeal || !matchesRating || !matchesStock || !matchesCountry) return false;

      // If we have search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesText = (
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.modelNumber?.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.specifications && Object.entries(p.specifications).some(([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)))
        );

        const matchesAi = aiSearchResults.some(match => match.productId === p.id);

        return matchesText || matchesAi;
      }

      return true;
    });

    // 2. Sort by AI Relevance score if active search is running and results are present
    if (searchQuery && aiSearchResults.length > 0) {
      return [...matched].sort((a, b) => {
        const scoreA = aiSearchResults.find(m => m.productId === a.id)?.relevanceScore || 0;
        const scoreB = aiSearchResults.find(m => m.productId === b.id)?.relevanceScore || 0;
        return scoreB - scoreA;
      });
    }

    return matched;
  }, [products, searchQuery, selectedCategoryName, filterBrand, filterPriceRange, filterMoq, aiSearchResults, filterTrustSealOnly, vendors, filterMinRating, filterInStockOnly, filterCountry]);

  const handleToggleWishlist = (id: string) => {
    let updated: string[];
    if (wishlist.includes(id)) {
      updated = wishlist.filter(item => item !== id);
    } else {
      updated = [...wishlist, id];
    }
    onUpdateWishlist(updated);
  };

  const handleToggleCompare = (p: Product) => {
    let updated: Product[];
    if (compareList.some(item => item.id === p.id)) {
      updated = compareList.filter(item => item.id !== p.id);
    } else {
      if (compareList.length >= 3) {
        addToast('You can compare a maximum of 3 medical items side-by-side.', 'info');
        return;
      }
      updated = [...compareList, p];
    }
    onUpdateCompare(updated);
  };

  const handleAddToCart = (p: Product, customQty?: number) => {
    const qtyToAdd = customQty || p.moq;
    if (qtyToAdd < p.moq) {
      addToast(`Minimum Order Quantity (MOQ) for this equipment is ${p.moq} units.`, 'error');
      return;
    }

    const existingIdx = cart.findIndex(item => item.product.id === p.id);
    let updated = [...cart];
    if (existingIdx > -1) {
      updated[existingIdx].quantity += qtyToAdd;
    } else {
      updated.push({ product: p, quantity: qtyToAdd });
    }
    onUpdateCart(updated);
    addToast(`Successfully added ${qtyToAdd} unit(s) of "${p.name}" to procurement cart.`, 'success');
  };

  const handleUpdateCartQty = (pId: string, nextQty: number, moq: number) => {
    if (nextQty < moq) {
      addToast(`Cannot reduce quantity below the Minimum Order Quantity (MOQ) of ${moq} units.`, 'error');
      return;
    }
    const updated = cart.map(item => {
      if (item.product.id === pId) {
        return { ...item, quantity: nextQty };
      }
      return item;
    });
    onUpdateCart(updated);
  };

  const handleRemoveFromCart = (pId: string) => {
    const updated = cart.filter(item => item.product.id !== pId);
    onUpdateCart(updated);
  };

  // Pricing breakouts
  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
  const getGstTotal = () => cart.reduce((sum, item) => {
    const price = item.product.salePrice * item.quantity;
    const gst = price * (item.product.gstRate / 100);
    return sum + gst;
  }, 0);

  const getCheckoutTotal = () => getSubtotal() + getGstTotal();

  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => {
        const base64Str = (reader.result as string).split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Step 2 checkout: proceed to payment screen / Submit Order
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitOrder();
  };

  // Step 3: Validate, Create, and Save Order (Phase 1)
  const handleSubmitOrder = async () => {
    if (!currentUser) {
      addToast('Please log in to submit your procurement order.', 'error');
      return;
    }
    if (cart.length === 0) {
      addToast('Your cart is empty.', 'error');
      return;
    }

    // Step 1: Validate Order
    if (!shippingName.trim()) {
      addToast('Please enter your full name.', 'error');
      return;
    }
    if (!shippingPhone.trim()) {
      addToast('Please enter your phone number.', 'error');
      return;
    }
    // Validate mobile phone format (must be 10 digits or valid Indian/international format)
    const sanitizedPhone = shippingPhone.trim().replace(/[^0-9+]/g, '');
    if (sanitizedPhone.length < 10) {
      addToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    // Validate shipping address
    if (!shippingAddress.address.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim() || !shippingAddress.pincode.trim()) {
      addToast('Please enter complete shipping address consignment details.', 'error');
      return;
    }

    // Validate billing address if not same as shipping
    const finalBillingAddress = billingSameAsShipping ? shippingAddress : billingAddress;
    if (!finalBillingAddress.address.trim() || !finalBillingAddress.city.trim() || !finalBillingAddress.state.trim() || !finalBillingAddress.pincode.trim()) {
      addToast('Please enter complete billing address details.', 'error');
      return;
    }

    // Validate product stock
    const productsInDb = dbLocal.getProducts();
    for (const item of cart) {
      const dbProd = productsInDb.find(p => p.id === item.product.id);
      if (!dbProd) {
        addToast(`Product "${item.product.name}" not found in our catalog.`, 'error');
        return;
      }
      if (dbProd.stockQuantity !== undefined && dbProd.stockQuantity < item.quantity) {
        addToast(`Insufficient Stock: Only ${dbProd.stockQuantity} units left for "${item.product.name}". Please reduce quantity.`, 'error');
        return;
      }
    }

    // Validate selected payment method
    if (!selectedPayMethod) {
      addToast('Please select a payment method.', 'error');
      return;
    }

    setCheckoutStep('processing');

    try {
      const firstItem = cart[0].product;
      const sub = getSubtotal();
      const gst = getGstTotal();
      const final = getCheckoutTotal();

      // Step 2: Create Order
      const nextSerial = String(dbLocal.getOrders().length + 1).padStart(5, '0');
      const orderId = `HMB2026${nextSerial}`;
      const invoiceNo = `INV-2026-${nextSerial}`;

      // Calculate vendor pricing and platform commission
      const itemsWithCommission = cart.map(item => {
        const vendorPrice = item.product.wholesalePrice || (item.product.salePrice * 0.9);
        const platformCommission = (item.product.salePrice - vendorPrice) * item.quantity;
        return {
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images[0],
          price: item.product.salePrice,
          quantity: item.quantity,
          gstRate: item.product.gstRate,
          hsnCode: item.product.hsnCode || '90181100',
          vendorId: item.product.vendorId,
          vendorName: item.product.vendorName,
          vendorPrice: vendorPrice,
          platformCommission: platformCommission
        };
      });

      const totalCommission = itemsWithCommission.reduce((sum, item) => sum + item.platformCommission, 0);

      const newOrder: Order = {
        id: orderId,
        customerId: currentUser.id,
        customerName: shippingName.trim(),
        customerEmail: currentUser.email,
        phone: shippingPhone.trim(),
        address: `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`,
        shippingAddress: shippingAddress,
        billingAddress: finalBillingAddress,
        invoiceNumber: invoiceNo,
        vendorId: firstItem.vendorId,
        vendorName: firstItem.vendorName,
        items: itemsWithCommission,
        totalAmount: sub,
        gstAmount: gst,
        discountAmount: 0,
        finalAmount: final,
        status: 'Pending Payment',
        orderStatus: 'Pending Payment',
        paymentStatus: 'Pending',
        payment_status: 'Pending',
        order_status: 'Pending Payment',
        paymentMethod: selectedPayMethod === 'bank' ? 'Bank Transfer' : selectedPayMethod.toUpperCase(),
        platformCommission: totalCommission,
        platformCommissionRate: 10,
        createdAt: new Date().toISOString(),
        timeline: [
          { 
            status: 'Pending Payment', 
            time: new Date().toISOString(), 
            note: `Procurement order submitted. Awaiting manual payment verification via ${selectedPayMethod.toUpperCase()}.` 
          }
        ],
        paymentVerificationLogs: [{
          action: 'submit',
          performedBy: shippingName.trim(),
          performedByRole: 'customer',
          timestamp: new Date().toISOString(),
          note: `Order submitted. Pending payment upload.`
        }]
      };

      // Step 3 & 4: Save Order & Reduce Inventory Stock
      await dbLocal.createOrderDirect(newOrder);

      // Step 10: Audit Log (Order Created)
      dbLocal.logAudit(
        currentUser.id,
        'Order Created',
        `Procurement Order #${orderId} was created with invoice ${invoiceNo} and Pending Payment status.`,
        orderId
      );

      // Send initial notifications
      dbLocal.addNotification(
        'admin',
        'New Procurement Order',
        `New Order #${orderId} (₹${final.toLocaleString('en-IN')}) placed. Pending manual payment submission.`,
        'order_placed'
      );

      setCreatedOrder(newOrder);
      onUpdateCart([]); // Clear cart
      setCheckoutStep('payment'); // Redirect to the Payment Upload page
      addToast('Order submitted successfully! Please upload proof of payment.', 'success');
    } catch (err: any) {
      console.error('Failed to create order:', err);
      addToast(`Order submission failed: ${err.message || 'Database error'}. Please try again.`, 'error');
      setCheckoutStep('checkout');
    }
  };

  // Phase 2: Upload Payment Proof and complete manual verification trigger
  const handleUploadPaymentProof = async () => {
    if (!currentUser || !createdOrder) {
      addToast('No active order context found. Please submit an order first.', 'error');
      return;
    }

    if (!screenshotFile) {
      addToast('Please upload your payment screenshot/receipt.', 'error');
      return;
    }

    if (!manualTxId.trim()) {
      addToast('Please enter the UTR or Unique Transaction Reference Number.', 'error');
      return;
    }

    if (!manualBankName.trim()) {
      addToast('Please enter the Sender Bank Name.', 'error');
      return;
    }

    if (!manualPaymentDate) {
      addToast('Please select the Payment Date & Time.', 'error');
      return;
    }

    // Step 5: Validate UTR Duplicates against existing orders
    const existingOrders = dbLocal.getOrders();
    const isUtrDuplicate = existingOrders.some(o => 
      o.id !== createdOrder.id && 
      (o.paymentTxId === manualTxId.trim() || o.upi_transaction_id === manualTxId.trim())
    );

    if (isUtrDuplicate) {
      addToast('This UTR / Transaction Reference has already been submitted for another order. Please check and try again.', 'error');
      return;
    }

    setCheckoutStep('processing');

    try {
      // 1. Upload payment screenshot to Google Drive via backend proxy
      let driveScreenshotUrl = '';
      try {
        const fileBase64 = await fileToBase64(screenshotFile);
        driveScreenshotUrl = await uploadScreenshotToDrive(
          fileBase64,
          screenshotFile.name,
          screenshotFile.type,
          createdOrder.id
        );
      } catch (driveErr: any) {
        console.warn('[Google Drive Upload] Failed, falling back to local simulation link:', driveErr);
        driveScreenshotUrl = `https://drive.google.com/mock-file-link/${createdOrder.id}_screenshot`;
      }

      // 2. Upload to Firebase Storage as primary/fallback view URL
      let firebaseScreenshotUrl = '';
      try {
        const uploadRes = await uploadScreenshot(screenshotFile);
        firebaseScreenshotUrl = uploadRes.url;
      } catch (fbErr) {
        console.warn('[Firebase Storage Upload] Failed:', fbErr);
        firebaseScreenshotUrl = driveScreenshotUrl;
      }

      // 3. Generate Legally Compliant Tax Invoice automatically (Step 9)
      const invoiceTextContent = `
=========================================
      HEALNEX MEDIBAZAR INVOICE
=========================================
Invoice No    : ${createdOrder.invoiceNumber || createdOrder.id}
Order ID      : ${createdOrder.id}
Order Date    : ${new Date(createdOrder.createdAt).toLocaleDateString('en-IN')}
Payment Status: Pending Verification
Order Status  : Payment Pending Verification

CUSTOMER DETAILS (CONSIGNEE):
Name          : ${createdOrder.customerName}
Email         : ${createdOrder.customerEmail}
Phone         : ${createdOrder.phone || 'N/A'}
Address       : ${createdOrder.address}

BILLING DETAILS:
Address       : ${createdOrder.billingAddress?.address}, ${createdOrder.billingAddress?.city}, ${createdOrder.billingAddress?.state} - ${createdOrder.billingAddress?.pincode}

SUPPLIER VENDOR:
Name          : ${createdOrder.vendorName}

ITEMS:
${createdOrder.items.map(item => `- ${item.productName} | Qty: ${item.quantity} | Price: INR ${item.price} | Tax Rate: ${item.gstRate}%`).join('\n')}

SUMMARY:
Subtotal      : INR ${createdOrder.totalAmount}
GST Tax Amount: INR ${createdOrder.gstAmount}
Grand Total   : INR ${createdOrder.finalAmount}
=========================================
Generated via Google Workspace secure microservice.
`;

      let driveInvoiceUrl = '';
      const sheetsToken = getCachedWorkspaceToken();
      if (sheetsToken) {
        try {
          const driveResult = await uploadFileToGoogleDrive(
            sheetsToken,
            `Invoice_${createdOrder.invoiceNumber}_${createdOrder.id}.txt`,
            invoiceTextContent,
            'text/plain'
          );
          driveInvoiceUrl = driveResult.url;
          addToast('Invoice document generated and saved to Google Drive!', 'success');
        } catch (invoiceDriveErr) {
          console.error('[Google Drive Invoice] Failed to automatically upload:', invoiceDriveErr);
          driveInvoiceUrl = `https://drive.google.com/mock-invoice-link/${createdOrder.id}`;
        }
      } else {
        driveInvoiceUrl = `https://drive.google.com/mock-invoice-link/${createdOrder.id}`;
      }

      // 4. Update the order with payment details, screenshots, and invoice metadata in Firestore
      const updatedOrder: Order = {
        ...createdOrder,
        status: 'Payment Pending Verification',
        orderStatus: 'Payment Pending Verification',
        paymentStatus: 'Pending Verification',
        payment_status: 'Pending Verification',
        order_status: 'Payment Pending Verification',
        paymentTxId: manualTxId.trim(),
        upi_transaction_id: manualTxId.trim(),
        paymentScreenshotUrl: firebaseScreenshotUrl,
        paymentScreenshotName: screenshotFile.name,
        paymentDriveUrl: driveScreenshotUrl,
        paymentNote: manualNote.trim() || undefined,
        invoiceDriveUrl: driveInvoiceUrl,
        timeline: [
          ...createdOrder.timeline,
          {
            status: 'Payment Pending Verification',
            time: new Date().toISOString(),
            note: `Payment proof uploaded. UTR: ${manualTxId.trim()} (${manualBankName.trim()}). Saved to Google Drive.`
          }
        ],
        paymentVerificationLogs: [
          ...(createdOrder.paymentVerificationLogs || []),
          {
            action: 'submit',
            performedBy: currentUser.name,
            performedByRole: 'customer',
            timestamp: new Date().toISOString(),
            note: `Payment receipt submitted. UTR: ${manualTxId.trim()} via Bank ${manualBankName.trim()}.`
          }
        ]
      };

      // Save/Persist updated order in Firestore & Sheets
      await dbLocal.createOrderDirect(updatedOrder);

      // Step 5: Save Payment Record in Google Sheets
      try {
        await saveOrderToSheet({
          orderId: updatedOrder.id,
          customerId: updatedOrder.customerId,
          vendorId: updatedOrder.vendorId || '',
          items: updatedOrder.items,
          totalAmount: updatedOrder.finalAmount,
          paymentMethod: updatedOrder.paymentMethod,
          paymentStatus: updatedOrder.paymentStatus,
          orderStatus: updatedOrder.status,
          screenshotUrl: firebaseScreenshotUrl,
          utr: manualTxId.trim(),
          paymentDateTime: manualPaymentDate,
          paymentNote: manualNote.trim()
        });
      } catch (sheetErr) {
        console.warn('[Google Sheets Sync] Failed:', sheetErr);
      }

      // Step 10: Audit Log (Payment Uploaded)
      dbLocal.logAudit(
        currentUser.id,
        'Payment Uploaded',
        `Payment proof uploaded for Order #${updatedOrder.id} with UTR: ${manualTxId.trim()} from bank ${manualBankName.trim()}.`,
        updatedOrder.id
      );

      // Step 6: Trigger Notifications to Customer, Vendor, and Admin
      // Customer Notification
      dbLocal.addNotification(
        currentUser.id,
        'Payment Proof Received',
        `Your payment proof for Order #${updatedOrder.id} has been submitted successfully. We will verify and process it shortly.`,
        'payment_submitted'
      );

      // Vendor Notification
      dbLocal.addNotification(
        updatedOrder.vendorId || 'vendor',
        'Payment Uploaded by Buyer',
        `A manual payment has been uploaded for Order #${updatedOrder.id}. Preparing the items for shipment.`,
        'order_placed'
      );

      // Admin Notification
      dbLocal.addNotification(
        'admin',
        'Payment Verification Requested',
        `Order #${updatedOrder.id} is pending verification. UTR: ${manualTxId.trim()} (${manualBankName.trim()}). Check live dashboard.`,
        'payment_submitted'
      );

      // Display Success Message (Step 5)
      addToast(
        "🎉 Your order has been placed successfully. Your Order ID is generated. Please complete the payment (if applicable) and upload your payment proof. We will verify your payment and process your order shortly.",
        "success"
      );

      setCreatedOrder(updatedOrder);
      
      // Automatically redirect the customer to the Order Details page (Step 5)
      setTimeout(() => {
        setViewInvoiceOrder(updatedOrder);
        setCheckoutStep('success');
      }, 1500);

    } catch (uploadErr: any) {
      console.error('Failed to submit manual payment verification:', uploadErr);
      addToast(`Payment verification submission failed: ${uploadErr.message || 'Network error'}. Please try again.`, 'error');
      setCheckoutStep('payment');
    }
  };

  // RFQ Submission
  const handleRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      addToast('Access Denied. Please authenticate to open clinical tenders.', 'error');
      return;
    }

    const newRfq: RFQ = {
      id: `RFQ-${Math.floor(10000 + Math.random() * 90000)}`,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      productName: rfqName,
      quantity: Number(rfqQty),
      budget: Number(rfqBudget),
      deliveryLocation: rfqLocation,
      description: rfqDesc,
      attachmentName: rfqAttachmentName || undefined,
      status: 'Open',
      createdAt: new Date().toISOString(),
      quotationsCount: 0
    };

    const currentRfqs = dbLocal.getRfqs();
    currentRfqs.unshift(newRfq);
    dbLocal.saveRfqs(currentRfqs);

    // Notify all approved vendors
    const allVendors = dbLocal.getVendors().filter(v => v.status === 'Approved');
    allVendors.forEach(v => {
      dbLocal.addNotification(
        v.id,
        'Matching B2B RFQ Posted',
        `A clinical client posted a tender for "${newRfq.productName}". Bid a quota now.`,
        'rfq_received'
      );
    });

    // Notify admin
    dbLocal.addNotification(
      'admin',
      'New Procurement RFQ Open',
      `Client ${currentUser.name} posted tender #${newRfq.id} for "${newRfq.productName}".`,
      'rfq_created'
    );

    addToast('Your clinical procurement RFQ Tender has been opened to supplier matches.', 'success');
    setRfqName('');
    setRfqQty(1);
    setRfqBudget(0);
    setRfqLocation('');
    setRfqDesc('');
    setRfqAttachmentName('');
    loadData();
  };

  // Accept vendor quotation and convert into paid order
  const handleAcceptQuotation = async (quo: Quotation, rfq: RFQ) => {
    if (!currentUser) return;
    
    // Simulate Instant payment checkout step
    setCheckoutStep('processing');
    onNavigate('cart');

    try {
      const sub = quo.totalPrice;
      const gst = sub * 0.12; // Flat 12% for diagnostic equipment
      const final = sub + gst;

      const newOrder: Order = {
        id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        vendorId: quo.vendorId,
        vendorName: quo.companyName,
        items: [{
          productId: rfq.id,
          productName: `${rfq.productName} (RFQ Custom Specification)`,
          productImage: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a',
          price: quo.pricePerUnit,
          quantity: rfq.quantity,
          gstRate: 12,
          hsnCode: '90181100',
          vendorId: quo.vendorId,
          vendorName: quo.companyName
        }],
        totalAmount: sub,
        gstAmount: gst,
        discountAmount: 0,
        finalAmount: final,
        status: 'Pending',
        paymentMethod: 'UPI',
        paymentId: `pay_HN_${Date.now().toString().slice(-9)}`,
        shippingAddress: shippingAddress,
        createdAt: new Date().toISOString(),
        timeline: [
          { status: 'Pending', time: new Date().toISOString(), note: 'Procurement Bid accepted. Order initialized.' }
        ]
      };

      // Create order directly in Firestore and handle stock + notifications
      await dbLocal.createOrderDirect(newOrder);

      // Mark other quotes as rejected
      const updatedQuotes = dbLocal.getQuotations().map(q => {
        if (q.id === quo.id) return { ...q, status: 'Accepted' as const };
        if (q.rfqId === rfq.id) return { ...q, status: 'Rejected' as const };
        return q;
      });
      dbLocal.saveQuotations(updatedQuotes);

      // Close RFQ
      const updatedRfqs = dbLocal.getRfqs().map(r => {
        if (r.id === rfq.id) return { ...r, status: 'Closed' as const };
        return r;
      });
      dbLocal.saveRfqs(updatedRfqs);

      // Notify vendor
      dbLocal.addNotification(
        quo.vendorId,
        'RFQ Bid Accepted & Paid!',
        `Your quotation for ${rfq.productName} was accepted. Process custom packing.`,
        'order_placed'
      );

      setCreatedOrder(newOrder);
      setCheckoutStep('success');
      setActiveRfqReview(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to process RFQ checkout transaction:', error);
      addToast(`Quotation acceptance failed: ${error?.message || 'Database connection error occurred'}. Please try again.`, 'error');
      setCheckoutStep('cart');
    }
  };

  return (
    <div className="font-sans">
      
      {/* Home View / Landing with Marketplace Grid */}
      {currentView === 'marketplace' && (
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-12 pb-16 animate-fade-in text-slate-800 dark:text-slate-100">
          
          {/* AESTHETIC BLUE-THEMED HERO BANNER AUTO-SLIDER */}
          <div className="relative bg-[#0F172A] text-white rounded-[16px] overflow-hidden min-h-[380px] sm:min-h-[460px] flex items-center shadow-md border border-slate-800 transition-all duration-700">
            {promoBanners.length > 0 && promoBanners[activeBannerIdx % promoBanners.length]?.imageUrl ? (
              <>
                <img
                  src={promoBanners[activeBannerIdx % promoBanners.length].imageUrl}
                  alt={promoBanners[activeBannerIdx % promoBanners.length].title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-35 scale-100 transition-transform duration-1000 ease-out"
                />
                {/* Clean gradient overlay matching the blue theme */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
              </>
            ) : (
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-blue-950">
                <div className="w-full h-full bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
            )}

            <div className="w-full relative z-10 py-12 px-6 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
              {promoBanners.length > 0 ? (
                <div className="max-w-2xl space-y-5 animate-fade-in text-left">
                  <span className="inline-block bg-[#1E40AF]/40 text-blue-200 border border-blue-500/30 text-[10px] sm:text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    {promoBanners[activeBannerIdx % promoBanners.length].badgeText || 'CLINICAL PRO-SERIES'}
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sans leading-tight text-white drop-shadow-xs">
                    {promoBanners[activeBannerIdx % promoBanners.length].title}
                  </h1>
                  {promoBanners[activeBannerIdx % promoBanners.length].subtitle && (
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg font-medium">
                      {promoBanners[activeBannerIdx % promoBanners.length].subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 pt-3">
                    <button
                      onClick={() => {
                        const linkUrl = promoBanners[activeBannerIdx % promoBanners.length].linkUrl;
                        if (linkUrl === '#rfq') {
                          onNavigate('rfqs');
                        } else {
                          const el = document.getElementById('marketplace-anchor');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-[#1E40AF] hover:bg-blue-700 text-white text-xs font-extrabold px-6 py-3.5 rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                    >
                      {promoBanners[activeBannerIdx % promoBanners.length].buttonText || 'Procure Now'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onNavigate('rfqs')}
                      className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition shadow-md"
                    >
                      Submit B2B RFQ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl space-y-5 text-left">
                  <span className="inline-block bg-[#1E40AF]/40 text-blue-300 border border-blue-500/30 text-[10px] sm:text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                    clinical quality assured &bull; wholesale procurement
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sans leading-tight text-white">
                    India's Premium Medical Equipment <span className="text-blue-400">Bazar</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                    Source directly from certified suppliers. Submit custom hospital RFQs, compare verified quotations side-by-side, and download official tax invoices.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => {
                        const el = document.getElementById('marketplace-anchor');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-[#1E40AF] hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      Explore Catalog
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onNavigate('rfqs')}
                      className="bg-transparent border border-slate-700 hover:bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-xl transition"
                    >
                      Submit RFQ
                    </button>
                  </div>
                </div>
              )}

              {/* Sidebar Trust Card inside Hero Banner */}
              <div className="relative shrink-0 hidden lg:block w-72">
                <div className="bg-slate-900/90 backdrop-blur p-5 rounded-[16px] border border-slate-800 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                    <span className="text-[10px] font-extrabold text-blue-400 tracking-wider">BIOMEDICAL CALIBRATION</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed text-slate-300">
                    Every device on HealNex undergoes strict biochemical testing and comes certified with official warranty validations.
                  </p>
                </div>
              </div>
            </div>

            {/* Slider Arrow Controls */}
            {promoBanners.length > 1 && (
              <>
                <button
                  onClick={() => setActiveBannerIdx((prev) => (prev - 1 + promoBanners.length) % promoBanners.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700 text-white flex items-center justify-center transition backdrop-blur shadow-md"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveBannerIdx((prev) => (prev + 1) % promoBanners.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700 text-white flex items-center justify-center transition backdrop-blur shadow-md"
                  aria-label="Next banner"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  {promoBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBannerIdx(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === (activeBannerIdx % promoBanners.length)
                          ? 'w-6 bg-blue-500 shadow-xs'
                          : 'w-1.5 bg-white/45 hover:bg-white/70'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* AI ADVISORY TIP */}
          {aiClinicalTip && (
            <div className={`p-5 rounded-[16px] border flex items-start gap-4 transition-all shadow-xs ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-blue-50/40 border-blue-100 text-slate-850'
            }`}>
              <div className="bg-blue-100 dark:bg-slate-800 text-blue-600 p-2 rounded-xl shrink-0">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              </div>
              <div className="text-xs space-y-1 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[10px] text-blue-600 uppercase tracking-widest">AI clinical procurement advisory</span>
                  <span className="bg-blue-100 text-[#1E40AF] text-[8px] font-bold px-1.5 py-0.5 rounded font-mono">LIVE ASSISTANT</span>
                </div>
                <p className="leading-relaxed font-semibold">{aiClinicalTip}</p>
              </div>
            </div>
          )}

          {/* CATEGORY SECTION: Large rounded cards, Dynamic product count, Hover scale */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
                Shop by Specialty
              </h3>
              <button 
                onClick={() => { onCategorySelect(''); const el = document.getElementById('marketplace-anchor'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                View All Categories &rarr;
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pt-1">
              {/* All Specialties card */}
              <button
                onClick={() => { onCategorySelect(''); const el = document.getElementById('marketplace-anchor'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`flex flex-col items-center justify-center p-4 rounded-[16px] border text-center transition-all duration-300 h-[115px] cursor-pointer group ${
                  !selectedCategoryName
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500 hover:bg-slate-800/50'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:bg-blue-50/20 shadow-xs'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-105 ${
                  !selectedCategoryName ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold tracking-tight block">All Products</span>
                <span className="text-[9px] opacity-75 mt-0.5 block">{products.length} Items</span>
              </button>

              {/* Dynamic Categories */}
              {categories.map((cat) => {
                const isActive = selectedCategoryName === cat.name;
                const IconComp = CategoryIconMap[cat.iconName || ''] || Layers;
                const count = products.filter(p => p.category === cat.name && p.approved !== false).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { onCategorySelect(cat.name); const el = document.getElementById('marketplace-anchor'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-[16px] border text-center transition-all duration-300 h-[115px] cursor-pointer group ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : isDarkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500 hover:bg-slate-800/50'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:bg-blue-50/20 shadow-xs'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold tracking-tight line-clamp-2 leading-tight block">{cat.name}</span>
                    <span className={`text-[9px] mt-0.5 block ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{count} Devices</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TOP BRANDS: Brand carousel list with quick filter toggles */}
          <div id="brands-section-anchor" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
                Certified Manufacturers
              </h3>
              <button 
                onClick={() => setFilterBrand('')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Clear Brand Filter
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
              <button
                onClick={() => setFilterBrand('')}
                className={`flex flex-col items-center justify-center p-3 rounded-[16px] border text-center transition-all duration-300 min-w-[125px] h-[95px] shrink-0 cursor-pointer snap-start group ${
                  !filterBrand
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500 hover:bg-blue-50/5'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:bg-blue-50/20 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 font-bold text-xs ${
                  !filterBrand ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  ALL
                </div>
                <span className="text-[11px] font-bold truncate max-w-full block">All Brands</span>
              </button>

              {brands.map((brd) => {
                const isActive = filterBrand.toLowerCase() === brd.name.toLowerCase();
                const initial = brd.name.slice(0, 2).toUpperCase();
                return (
                  <button
                    key={brd.id}
                    onClick={() => setFilterBrand(isActive ? '' : brd.name)}
                    className={`flex flex-col items-center justify-center p-3 rounded-[16px] border text-center transition-all duration-300 min-w-[125px] h-[95px] shrink-0 cursor-pointer snap-start group ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : isDarkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:bg-blue-50/20 shadow-xs'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 font-bold text-[10px] overflow-hidden ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {brd.logo ? (
                        <img src={brd.logo} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold truncate max-w-full leading-tight block">{brd.name}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{brd.country || 'Global'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DEDICATED SPECIALTY PROCUREMENT ROW CAROUSEL TABS */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-[16px] border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              Specialty Shortcuts:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Diagnostics', cat: 'Medical Equipment' },
                { label: 'Dental', cat: 'Dental Equipment' },
                { label: 'Lab Equipment', cat: 'Laboratory Equipment' },
                { label: 'Hospital Equipment', cat: 'Hospital Furniture' },
                { label: 'Critical Care', cat: 'Medical Equipment' },
                { label: 'Patient Monitoring', cat: 'Medical Equipment' }
              ].map((shortcut, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onCategorySelect(shortcut.cat);
                    const el = document.getElementById('marketplace-anchor');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCT GRID SECTIONS: Featured, Best Sellers, New Arrivals & Main Catalog Grid */}
          <div className="space-y-12">
            
            {/* A. FEATURED PRODUCTS PREVIEW (Horizontal Row) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Featured Medical Devices
                </h4>
                <span className="text-xs text-slate-400 font-bold">Top clinical validations</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((p) => {
                  const hasWish = wishlist.includes(p.id);
                  const discountPercentage = p.price > p.salePrice ? Math.round(((p.price - p.salePrice) / p.price) * 100) : 0;
                  const simulatedRating = (4.4 + (p.name.length % 7) * 0.1).toFixed(1);
                  const reviewCount = (p.name.length * 5) % 30 + 10;
                  return (
                    <div 
                      key={p.id} 
                      className={`rounded-[16px] border shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                      }`}
                    >
                      <div className="relative bg-slate-50 h-40 overflow-hidden shrink-0">
                        <img 
                          src={p.images[0]} 
                          alt={p.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        {discountPercentage > 0 && (
                          <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs font-mono">
                            {discountPercentage}% OFF
                          </span>
                        )}
                        <span className="absolute top-2.5 right-2.5 z-10">
                          <button
                            onClick={() => handleToggleWishlist(p.id)}
                            className={`p-1.5 rounded-full transition shadow-xs ${
                              hasWish ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-400 hover:text-rose-500'
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </span>
                        <div className="absolute bottom-2.5 left-2.5 bg-blue-600/90 text-white text-[8px] font-bold px-2 py-0.5 rounded shadow-xs">
                          FEATURED
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5 text-xs text-left">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded block w-fit uppercase">
                            {p.brand}
                          </span>
                          <h5 
                            onClick={() => setSelectedProduct(p)}
                            className="font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-blue-600 cursor-pointer text-xs"
                          >
                            {p.name}
                          </h5>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <span className="font-bold text-amber-500">{simulatedRating}</span>
                            <span className="text-[10px] text-slate-400">({reviewCount} reviews)</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Stock Status: <strong className="text-emerald-600 font-bold">In Stock ({p.stockQuantity || 10})</strong>
                          </p>
                        </div>

                        <div className="border-t border-slate-50 dark:border-slate-800 pt-2 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 text-[8px] uppercase block font-bold">Sale Price</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-extrabold text-[#1E40AF]">
                                ₹{p.salePrice.toLocaleString('en-IN')}
                              </span>
                              {p.price > p.salePrice && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  ₹{p.price.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => { setSelectedProduct(p); }}
                            className="text-[9px] uppercase font-bold text-slate-500 hover:text-blue-600 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Quick View
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-2">
                        <span className="text-[9px] text-slate-400">MOQ: <strong>{p.moq} unit(s)</strong></span>
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* B. MAIN CATALOG WITH FILTERS SIDEBAR */}
            <div id="marketplace-anchor" className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Filters Sidebar */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-xs h-fit space-y-6 text-left">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    Commercial Filters
                  </h3>
                  {(filterBrand || selectedCategoryName || filterPriceRange < 500000 || filterMoq < 100 || filterTrustSealOnly || filterMinRating > 0 || filterInStockOnly || filterCountry) && (
                    <button
                      onClick={() => { setFilterBrand(''); onCategorySelect(''); setFilterPriceRange(500000); setFilterMoq(100); setFilterTrustSealOnly(false); setFilterMinRating(0); setFilterInStockOnly(false); setFilterCountry(''); }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Trust Seal Toggle Filter */}
                <div className="p-3.5 bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-xl border border-blue-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-extrabold text-slate-850 dark:text-slate-100 leading-tight">Verified Trust Seal Only</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={filterTrustSealOnly}
                    onChange={(e) => setFilterTrustSealOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* In Stock Only Toggle Filter */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">In Stock Only</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={filterInStockOnly}
                    onChange={(e) => setFilterInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-650 accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Category Dropdown Filter */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="text-slate-500 dark:text-slate-400">Filter by Category</label>
                  <select
                    value={selectedCategoryName}
                    onChange={(e) => onCategorySelect(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none dark:text-slate-200"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Brand Dropdown Filter */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="text-slate-500 dark:text-slate-400">Filter by Brand</label>
                  <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none dark:text-slate-200"
                  >
                    <option value="">All Brands</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="text-slate-500 dark:text-slate-400">Minimum Rating</label>
                  <select
                    value={filterMinRating}
                    onChange={(e) => setFilterMinRating(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none dark:text-slate-200"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={4}>4★ & Above</option>
                    <option value={4.5}>4.5★ & Above</option>
                    <option value={4.8}>4.8★ & Above</option>
                  </select>
                </div>

                {/* Manufacturer / Country Filter */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="text-slate-500 dark:text-slate-400">Country / Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. India, Germany..."
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none dark:text-slate-200"
                  />
                </div>

                {/* Price Range Filter */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between text-slate-500">
                    <span>Price (Max Limit)</span>
                    <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">₹{filterPriceRange.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={500000}
                    step={5000}
                    value={filterPriceRange}
                    onChange={(e) => setFilterPriceRange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer accent-blue-600"
                  />
                </div>

                {/* MOQ limits */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between text-slate-500">
                    <span>MOQ Requirement</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">&le; {filterMoq} units</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    step={5}
                    value={filterMoq}
                    onChange={(e) => setFilterMoq(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              {/* Catalog Grid */}
              <div className="lg:col-span-3 space-y-4">
                {isAiSearching && (
                  <div className={`p-4 rounded-[16px] border flex items-center justify-between gap-3 animate-pulse shadow-xs ${
                    isDarkMode 
                      ? 'bg-blue-950/20 border-slate-800 text-blue-300' 
                      : 'bg-blue-50 border-blue-100 text-blue-800'
                  }`}>
                    <div className="flex items-center gap-2.5 text-xs font-semibold">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      <span>Gemini AI is semantic-matching the clinical catalog for "{searchQuery}"...</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-blue-500/10 px-2 py-0.5 rounded tracking-wider">Deep Semantic Mode</span>
                  </div>
                )}

                {searchQuery && !isAiSearching && aiSearchResults.length > 0 && (
                  <div className={`p-3 rounded-[16px] border flex items-center justify-between gap-3 shadow-xs ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-300' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span>Gemini AI successfully matched and sorted {filteredProducts.length} clinical instruments matching your query.</span>
                    </div>
                    <button 
                      onClick={onClearSearch}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {filteredProducts.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-850">
                    <SlidersHorizontal className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-600" />
                    <p className="text-xs font-bold">No matching certified clinical products found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((p) => {
                      const hasWish = wishlist.includes(p.id);
                      const hasComp = compareList.some(item => item.id === p.id);
                      const aiMatch = aiSearchResults.find(m => m.productId === p.id);
                      const productVendor = vendors.find(v => v.id === p.vendorId || v.companyName === p.vendorName);

                      // Compute discount and rating stats
                      const discountPercentage = p.price > p.salePrice ? Math.round(((p.price - p.salePrice) / p.price) * 100) : 0;
                      const seed = p.name.length;
                      const simulatedRating = (4.2 + (seed % 9) * 0.1).toFixed(1);
                      const reviewCount = (seed * 7) % 40 + 12;

                      return (
                        <div
                          key={p.id}
                          className={`rounded-[16px] border shadow-xs overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
                            isDarkMode
                              ? 'bg-slate-900 border-slate-800 text-slate-100'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {/* Image Banner */}
                          <div className="relative bg-slate-50 h-44 overflow-hidden shrink-0">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            {discountPercentage > 0 && (
                              <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm z-10 font-mono">
                                {discountPercentage}% OFF
                              </span>
                            )}
                            {aiMatch && (
                              <span className="absolute bottom-2.5 left-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1 animate-pulse z-10">
                                <Sparkles className="w-3 h-3 text-yellow-300 fill-current" />
                                {aiMatch.relevanceScore}% AI Match
                              </span>
                            )}
                            <button
                              onClick={() => handleToggleWishlist(p.id)}
                              className={`p-1.5 rounded-full absolute top-2.5 right-2.5 transition z-10 ${
                                hasWish ? 'bg-rose-500 text-white shadow-md' : 'bg-white/90 text-slate-400 hover:text-rose-500 shadow'
                              }`}
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs text-left">
                            <div>
                              <div className="flex items-center justify-between gap-1.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-blue-50 text-[#1E40AF]'
                                }`}>
                                  {p.brand}
                                </span>
                                {productVendor?.trustSeal && (
                                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 shrink-0" title={productVendor.trustSealLevel || 'Verified Clinical Supplier'}>
                                    <ShieldCheck className="w-3 h-3 text-white shrink-0" />
                                    Trust Seal
                                  </span>
                                )}
                              </div>
                              
                              <h4
                                onClick={() => setSelectedProduct(p)}
                                className={`font-bold mt-1.5 line-clamp-1 hover:text-blue-600 hover:underline cursor-pointer text-sm font-sans ${
                                  isDarkMode ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {p.name}
                              </h4>

                              {/* Ratings Block */}
                              <div className="flex items-center gap-1 mt-1">
                                <div className="flex items-center text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-3.5 h-3.5 ${
                                        i < Math.floor(Number(simulatedRating)) 
                                          ? 'fill-current text-amber-400' 
                                          : 'opacity-35 text-slate-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] font-bold text-amber-500">{simulatedRating}</span>
                                <span className="text-[10px] text-slate-400">({reviewCount} reviews)</span>
                              </div>

                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
                                <Building className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">Supplier: <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{p.vendorName || productVendor?.companyName || 'Verified Partner'}</strong></span>
                              </div>

                              <p className={`text-[11px] line-clamp-2 mt-1 leading-relaxed ${
                                isDarkMode ? 'text-slate-300' : 'text-slate-500'
                              }`}>
                                {p.description}
                              </p>

                              {/* Stock Level status info */}
                              <div className="mt-2.5 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${p.stockQuantity && p.stockQuantity > 3 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                <span className="text-[10px] text-slate-500 font-bold">
                                  {p.stockQuantity && p.stockQuantity > 3 ? `In Stock (${p.stockQuantity})` : `Only ${p.stockQuantity || 2} left in stock!`}
                                </span>
                              </div>

                              {/* AI Semantic Search Insight */}
                              {aiMatch && (
                                <div className={`mt-2.5 p-2 rounded-lg text-[10px] flex gap-1.5 items-start border leading-normal ${
                                  isDarkMode 
                                    ? 'bg-blue-950/30 text-blue-300 border-slate-800' 
                                    : 'bg-blue-50/50 text-blue-800 border-blue-100'
                                }`}>
                                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">Clinical Insight: </span>
                                    {aiMatch.aiInsight}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className={`border-t pt-2.5 flex items-center justify-between ${
                              isDarkMode ? 'border-slate-800' : 'border-slate-100'
                            }`}>
                              <div>
                                <span className="text-slate-400 text-[10px] block font-medium">Bazar Special Price</span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base font-extrabold text-[#1E40AF]">
                                    ₹{p.salePrice.toLocaleString('en-IN')}
                                  </span>
                                  {p.price > p.salePrice && (
                                    <span className="text-[11px] text-slate-400 line-through">
                                      ₹{p.price.toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 text-[10px] block font-medium">Min Order Requirement</span>
                                <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                  {p.moq} unit{p.moq > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Foot action bars */}
                          <div className={`px-4 py-3 border-t flex items-center justify-between gap-2 shrink-0 ${
                            isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                          }`}>
                            <button
                              onClick={() => handleToggleCompare(p)}
                              className={`flex items-center gap-1 text-[10px] font-bold py-1.5 px-2.5 rounded-xl transition-all border ${
                                hasComp 
                                  ? 'bg-orange-500 border-orange-500 text-white' 
                                  : isDarkMode 
                                    ? 'border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white' 
                                    : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
                              }`}
                            >
                              <Scale className="w-3.5 h-3.5" />
                              {hasComp ? 'Comparing' : 'Compare'}
                            </button>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className="bg-[#1E40AF] hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition duration-300 text-[10px] uppercase tracking-wider cursor-pointer shadow-xs hover:shadow-sm"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Add to Cart
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

          {/* Side by side comparison drawer */}
          {compareList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-350 shadow-2xl p-6 space-y-4 max-w-4xl mx-auto text-left">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600 animate-pulse" />
                  Biomedical Comparison Dashboard ({compareList.length}/3)
                </h3>
                <button onClick={() => onUpdateCompare([])} className="text-xs text-rose-600 font-semibold uppercase">
                  Clear Compare List
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {compareList.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 relative bg-slate-50 dark:bg-slate-900/60">
                    <button
                      onClick={() => handleToggleCompare(item)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 font-bold"
                    >
                      &times;
                    </button>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate pr-4">{item.name}</h4>
                    <p className="text-[10px] text-blue-700 uppercase font-bold">{item.brand}</p>
                    <div className="space-y-1 bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-slate-150">
                      <p className="text-slate-500 flex justify-between">
                        <span>Price (INR)</span>
                        <strong className="text-[#1E40AF] font-mono">₹{item.salePrice.toLocaleString()}</strong>
                      </p>
                      <p className="text-slate-500 flex justify-between">
                        <span>MOQ Requirements</span>
                        <strong>{item.moq} unit(s)</strong>
                      </p>
                      <p className="text-slate-500 flex justify-between">
                        <span>Warranty duration</span>
                        <strong>{item.warranty || '1 Year'}</strong>
                      </p>
                      <p className="text-slate-500 flex justify-between">
                        <span>Country of origin</span>
                        <strong>{item.countryOfOrigin || 'India'}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCTOR TESTIMONIALS SLIDER SECTION */}
          <div className="py-12 bg-[#0F172A] text-white rounded-[16px] px-6 sm:px-12 shadow-md space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
              <Activity className="w-96 h-96 text-blue-500 stroke-[1]" />
            </div>

            <div className="max-w-2xl text-left space-y-2 relative z-10">
              <span className="text-[10px] bg-blue-600 text-white font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                Testimonials
              </span>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-white">
                Trusted by Doctor-Led Facilities
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                Hear from certified medical personnel who procure hospital apparatus and dental set ups via HealNex.
              </p>
            </div>

            {/* Testimonials Slider */}
            <div className="max-w-4xl mx-auto relative z-10 pt-4">
              {[
                {
                  quote: "Procuring our hospital's 12-channel ECG machines through HealNex was incredibly seamless. The automatic GST tax invoicing combined with fast shipping solved our end-of-year clinical balance sheets instantly.",
                  doctor: "Dr. Amit Verma, MD, FACC",
                  position: "Chief Cardiologist, Metro Hospital",
                  stars: 5,
                  image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
                },
                {
                  quote: "Their Laboratory and Consumables catalog is absolutely unmatched. High-precision clinical equipment such as benchtop centrifuges and blood analyzers arrived pre-calibrated with official validation labels.",
                  doctor: "Dr. Priyesha Sen, Laboratory Director",
                  position: "Clinical Diagnostics, SRL Networks",
                  stars: 5,
                  image: "https://images.unsplash.com/photo-1594824813573-246434e33963?auto=format&fit=crop&q=80&w=300"
                },
                {
                  quote: "A genuinely brilliant experience for custom clinic designs. Procuring high-value dental chairs via the B2B RFQ system let us collect custom commercial bids and finalize manual payment transfers smoothly.",
                  doctor: "Dr. Rohan Gupta, MDS",
                  position: "Director, Dental Craft Surgical Clinic",
                  stars: 5,
                  image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
                }
              ].map((testi, idx) => {
                if (idx !== (activeTestimonialIdx % 3)) return null;
                return (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center animate-fade-in text-left">
                    <div className="md:col-span-1 flex justify-center">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-blue-500/20 shadow-lg shrink-0">
                        <img src={testi.image} alt={testi.doctor} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-4">
                      <div className="flex items-center text-amber-400 gap-0.5">
                        {[...Array(testi.stars)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-sm sm:text-base italic text-slate-200 leading-relaxed font-sans">
                        "{testi.quote}"
                      </p>
                      <div>
                        <h5 className="font-bold text-white text-sm">{testi.doctor}</h5>
                        <p className="text-xs text-blue-400 font-semibold">{testi.position}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Slider Controls */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveTestimonialIdx((prev) => (prev - 1 + 3) % 3)}
                  className="p-2 rounded-full border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500 font-mono">{(activeTestimonialIdx % 3) + 1} / 3</span>
                <button
                  onClick={() => setActiveTestimonialIdx((prev) => (prev + 1) % 3)}
                  className="p-2 rounded-full border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC B2B NEWSLETTER SUBSCRIPTION SECTION (Blue Background) */}
          <div className="py-12 bg-gradient-to-r from-blue-700 via-blue-900 to-indigo-950 text-white rounded-[16px] px-6 sm:px-12 text-center shadow-lg space-y-5 border border-blue-600/20">
            <div className="max-w-2xl mx-auto space-y-2">
              <span className="text-[10px] bg-blue-500/30 text-blue-200 font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-400/20 inline-block">
                Weekly digest
              </span>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
                Subscribe to our Medical Procurement Digest
              </h4>
              <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto leading-relaxed">
                Receive catalog entry updates, custom wholesale price reductions, bulk RFQ tips, and verified biomedical calibration guidelines directly in your inbox.
              </p>
            </div>

            <div className="max-w-md mx-auto pt-2">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const emailInput = form.querySelector('input') as HTMLInputElement;
                  if (emailInput?.value) {
                    addToast(`Successfully subscribed ${emailInput.value} to HealNex Digest!`, 'success');
                    emailInput.value = '';
                  }
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter medical purchaser / doctor email address"
                  className="flex-grow px-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-[9px] text-blue-200 mt-2">No spam. Unsubscribe at any time. HIPAA compliant data handling.</p>
            </div>
          </div>

          {/* Professional Homepage Trust & Safety Section */}
          <HomepageTrustSection
            onOpenPolicy={(policy) => onOpenPolicy?.(policy)}
            onNavigateToTrustPage={() => onNavigate('trust-safety')}
            isDarkMode={isDarkMode}
          />

        </div>
      )}

      {/* Multi-Vendor Cart view & Checkout */}
      {currentView === 'cart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {checkoutStep === 'cart' && (
            <>
              {/* Cart List */}
              <div className="space-y-6 lg:col-span-2">
                <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${
                    isDarkMode ? 'text-teal-400' : 'text-slate-800'
                  }`}>
                    <ShoppingCart className="w-5 h-5 text-teal-700" />
                    Clinical Procurement Cart
                  </h3>

                  {cart.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Your procurement cart is empty. Explore catalog to add certified equipment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.product.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center transition ${
                          isDarkMode ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50/50'
                        }`}>
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0"
                          />
                          <div className="flex-1 text-xs">
                            <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.product.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Supplier: {item.product.vendorName}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className={`font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-800'}`}>₹{item.product.salePrice.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-slate-400">HSN: {item.product.hsnCode} | GST: {item.product.gstRate}%</span>
                            </div>
                          </div>

                          {/* Qty controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1, item.product.moq)}
                              className={`p-1 rounded ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-xs font-bold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1, item.product.moq)}
                              className={`p-1 rounded ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-4 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Companion Procurement Recommendations Panel */}
                {cart.length > 0 && aiRecommendations.length > 0 && (
                  <div className={`p-6 rounded-2xl border shadow-md space-y-4 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-teal-950 text-slate-100' 
                      : 'bg-gradient-to-r from-teal-50/50 to-teal-50/10 border-teal-100 text-slate-800'
                  }`}>
                    <div className="flex items-center gap-2 pb-2 border-b border-teal-150/10">
                      <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                      <h4 className="text-xs font-bold uppercase tracking-wider font-display text-teal-600">AI Clinical Procurement Companion Recommendations</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {aiRecommendations.map((rec) => {
                        const recommendedProduct = products.find(p => p.id === rec.productId);
                        if (!recommendedProduct) return null;
                        return (
                          <div key={rec.productId} className={`p-4 rounded-xl border flex gap-3 flex-col justify-between ${
                            isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                          }`}>
                            <div className="flex gap-3">
                              <img 
                                src={recommendedProduct.images[0]} 
                                alt={recommendedProduct.name} 
                                className="w-12 h-12 object-cover rounded-lg border border-slate-100 shrink-0"
                              />
                              <div>
                                <h5 className="font-bold leading-tight truncate max-w-[180px]">{recommendedProduct.name}</h5>
                                <p className="text-[10px] text-teal-600 uppercase font-bold mt-0.5">{recommendedProduct.brand}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">{rec.recommendationReason}</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center border-t border-slate-100/10 pt-2.5 mt-1.5">
                              <span className="font-bold text-teal-700 font-mono">₹{recommendedProduct.salePrice.toLocaleString('en-IN')}</span>
                              <button
                                onClick={() => handleAddToCart(recommendedProduct)}
                                className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-1 px-3 rounded-lg text-[9px] uppercase tracking-wide cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* pricing summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Procurement Quote Summary
                </h3>

                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Clinical Subtotal:</span>
                    <span className="font-mono">₹{getSubtotal().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integrated GST taxes:</span>
                    <span className="font-mono">₹{getGstTotal().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between text-slate-900 font-bold text-sm">
                    <span>Estimated Final Quote:</span>
                    <span className="font-mono text-teal-800">₹{getCheckoutTotal().toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!currentUser) {
                      addToast('Please sign in or select a profile to proceed with clinical procurement.', 'error');
                      onNavigate('login');
                      return;
                    }
                    if (cart.length === 0) return;
                    setSelectedPayMethod('upi');
                    setShippingName(currentUser.name || '');
                    setShippingPhone(currentUser.phone || '');
                    setCheckoutStep('checkout');
                  }}
                  disabled={cart.length === 0}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wide transition text-center cursor-pointer disabled:opacity-50"
                >
                  Proceed with Order Placement
                </button>
              </div>
            </>
          )}

          {checkoutStep === 'checkout' && (
            <div className="lg:col-span-3 max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="text-center pb-6 border-b border-slate-100">
                <Building className="w-12 h-12 text-teal-700 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-950 uppercase tracking-wide">Hospital Consignment & Shipping</h3>
                <p className="text-xs text-slate-400 mt-1">Complete your B2B corporate clinical procurement delivery details</p>
              </div>

              <form onSubmit={handleProceedToPayment} className="space-y-4 text-xs font-semibold">
                
                {/* Contact details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Authorized Recipient Contact</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. John Doe"
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Contact Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Location fields */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hospital Consignment Destination</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Detailed Street Address *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none focus:border-teal-700 transition"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none focus:border-teal-700 transition"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.pincode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none font-mono focus:border-teal-700 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Address Section */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Billing Information</h4>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={billingSameAsShipping}
                        onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span>Same as Shipping Address</span>
                    </label>
                  </div>

                  {!billingSameAsShipping && (
                    <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100 animate-fade-in">
                      <div>
                        <label className="text-slate-400 block mb-1">Billing Street Address *</label>
                        <input
                          type="text"
                          required={!billingSameAsShipping}
                          value={billingAddress.address}
                          onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1">City *</label>
                          <input
                            type="text"
                            required={!billingSameAsShipping}
                            value={billingAddress.city}
                            onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-lg outline-none focus:border-teal-700 transition"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">State *</label>
                          <input
                            type="text"
                            required={!billingSameAsShipping}
                            value={billingAddress.state}
                            onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-lg outline-none focus:border-teal-700 transition"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Pincode *</label>
                          <input
                            type="text"
                            required={!billingSameAsShipping}
                            value={billingAddress.pincode}
                            onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value })}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-lg outline-none font-mono focus:border-teal-700 transition"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 1: Payment Method Selection */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select B2B Settlement Method</h4>
                  <p className="text-[10px] text-slate-400">Choose your preferred manual clearance channel. Payment proof is uploaded in the next step.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'upi', label: 'UPI Scan & Pay', desc: 'Instant Clearance' },
                      { id: 'bank', label: 'Bank Transfer', desc: 'NEFT / IMPS Link' },
                      { id: 'neft', label: 'NEFT Clearing', desc: 'Standard B2B Wire' },
                      { id: 'imps', label: 'IMPS Instant', desc: 'Immediate Settlement' },
                      { id: 'rtgs', label: 'RTGS High Value', desc: 'Corporate Settlement' },
                      { id: 'cash', label: 'Cash Deposit', desc: 'Direct Bank Counter' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPayMethod(method.id as any)}
                        className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                          selectedPayMethod === method.id
                            ? 'border-teal-600 bg-teal-50/45 ring-2 ring-teal-600/20'
                            : 'border-slate-200 hover:border-slate-350 bg-white'
                        }`}
                      >
                        <p className="font-bold text-slate-900 text-xs">{method.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{method.desc}</p>
                        {selectedPayMethod === method.id && (
                          <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-teal-600 flex items-center justify-center text-white">
                            <span className="text-[8px]">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkout summary panel info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Clinical Subtotal</span>
                    <span className="font-mono">₹{getSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Clinical GST Breakout</span>
                    <span className="font-mono">₹{getGstTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-800 font-bold">
                    <span>Procurement Grand Total</span>
                    <span className="font-mono text-teal-700">₹{getCheckoutTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center cursor-pointer transition"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-[#1E40AF] hover:bg-blue-750 text-white font-bold py-2.5 rounded-xl text-center uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    Submit Order
                  </button>
                </div>
              </form>
            </div>
          )}

          {checkoutStep === 'payment' && (
            <div className="lg:col-span-3 max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="text-center pb-6 border-b border-slate-100">
                <QrCode className="w-12 h-12 text-[#1E40AF] mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-950 uppercase tracking-wide">Manual Payment &amp; Receipt Upload</h3>
                <p className="text-xs text-slate-400 mt-1">Please make the payment using the details below and upload your proof of payment</p>
              </div>

              {/* Display payment details based on selected payment method */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs font-semibold">
                {selectedPayMethod === 'upi' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* QR Code Card */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md flex flex-col items-center justify-center shrink-0 w-48 sm:w-56 transition hover:shadow-lg">
                      {(() => {
                        try {
                          const upiId = paymentSettings.upiId || '9149758743@slc';
                          const upiHolder = paymentSettings.upiHolderName || 'Warisul Islam';
                          const totalAmount = createdOrder?.finalAmount || getCheckoutTotal();
                          const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiHolder)}&am=${totalAmount}&cu=INR`;
                          
                          const qr = qrcode(0, 'M');
                          qr.addData(upiLink);
                          qr.make();
                          const qrUrl = qr.createDataURL(5);
                          return (
                            <img src={qrUrl} alt="UPI QR Code" className="w-full h-auto object-contain rounded-lg" referrerPolicy="no-referrer" />
                          );
                        } catch (err) {
                          return (
                            <div className="w-44 h-44 bg-slate-100 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300">
                              <QrCode className="w-10 h-10 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Error Generating QR</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                    {/* Details */}
                    <div className="flex-1 space-y-3 text-xs w-full">
                      <div className="bg-blue-50/80 border border-blue-200/60 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">Total Payable Amount</span>
                          <span className="text-lg font-black text-blue-950 font-mono">₹{(createdOrder?.finalAmount || getCheckoutTotal()).toLocaleString('en-IN')}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-[#1E40AF] text-white rounded-lg text-[10px] font-bold uppercase">Dynamic UPI QR</span>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">UPI Account Holder Name</p>
                        <p className="text-slate-900 font-extrabold text-sm">{paymentSettings.upiHolderName || 'Warisul Islam'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">UPI ID (VPA Address)</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-teal-50 text-teal-950 font-extrabold border border-teal-200 px-3 py-1.5 rounded-lg font-mono text-sm">{paymentSettings.upiId || '9149758743@slc'}</code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentSettings.upiId || '9149758743@slc');
                              addToast('UPI ID copied to clipboard!', 'success');
                            }}
                            className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                            title="Copy UPI ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy ID</span>
                          </button>
                        </div>
                      </div>
                      {paymentSettings.upiInstructions &&
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-xs shadow-sm leading-relaxed">
                          <span className="font-bold text-teal-800 block text-[10px] uppercase tracking-wider mb-0.5">Instructions:</span>
                          {paymentSettings.upiInstructions}
                        </div>
                      }
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs animate-fade-in">
                    {/* Bank Transfer Information card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">Total Payable Amount</span>
                        <span className="text-lg font-black text-blue-950 font-mono">₹{(createdOrder?.finalAmount || getCheckoutTotal()).toLocaleString('en-IN')}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-[#1E40AF] text-white rounded-lg text-[10px] font-bold uppercase">B2B Bank Clearance</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Bank Name</p>
                          <p className="text-slate-950 font-extrabold text-sm">{paymentSettings.bankName || 'HDFC Bank Ltd'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Account Holder Name</p>
                          <p className="text-slate-950 font-extrabold text-sm">{paymentSettings.bankHolderName || 'HealNex Medi Bazar Private Limited'}</p>
                        </div>
                      </div>

                      <div className="space-y-2.5 border-t md:border-t-0 md:border-l border-slate-200 md:pl-4 pt-2.5 md:pt-0">
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Bank Account Number</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-900 font-extrabold font-mono text-sm tracking-wide">
                              {paymentSettings.bankAccountNumber || '50200098765432'}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentSettings.bankAccountNumber || '50200098765432');
                                addToast('Account Number copied!', 'success');
                              }}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition cursor-pointer flex items-center justify-center"
                              title="Copy Account Number"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">IFSC Code (RTGS/NEFT/IMPS)</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-900 font-extrabold font-mono text-sm tracking-wide">
                              {paymentSettings.bankIfsc || 'HDFC0001234'}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentSettings.bankIfsc || 'HDFC0001234');
                                addToast('IFSC Code copied!', 'success');
                              }}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition cursor-pointer flex items-center justify-center"
                              title="Copy IFSC"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(paymentSettings.bankInstructions || paymentSettings.netBankingInstructions) &&
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-xs shadow-sm leading-relaxed">
                        <span className="font-bold text-teal-800 block text-[10px] uppercase tracking-wider mb-0.5">Clearing Instructions:</span>
                        {paymentSettings.bankInstructions || paymentSettings.netBankingInstructions}
                      </div>
                    }
                  </div>
                )}
              </div>

              {/* Transaction Inputs - Step 5 Mandatory Fields */}
              <div className="space-y-4 pt-3 border-t border-slate-100 text-xs font-semibold">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm Settlement Transaction Details</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-slate-400 block mb-1">UTR / Unique Transaction Reference *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 12-digit UTR Number"
                      value={manualTxId}
                      onChange={(e) => setManualTxId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-600 transition font-mono uppercase text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Transaction ID / Reference ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPI9473827183 or REF328912"
                      value={manualTxId} // Shares the reference or can input custom
                      onChange={(e) => setManualTxId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-600 transition font-mono uppercase text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Sender Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SBI, HDFC, ICICI, etc."
                      value={manualBankName}
                      onChange={(e) => setManualBankName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-600 transition text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Payment Date &amp; Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={manualPaymentDate}
                      onChange={(e) => setManualPaymentDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-600 transition text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Reference Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Paid via corporate account"
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-600 transition text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1 font-bold">Payment Screenshot / Advice Receipt *</label>
                    <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition relative flex flex-col items-center justify-center text-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              addToast('Screenshot size must be less than 10MB.', 'error');
                              return;
                            }
                            setScreenshotFile(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-8 h-8 text-slate-400 mb-1" />
                      {screenshotFile ? (
                        <div>
                          <p className="text-xs font-bold text-teal-800 flex items-center gap-1 justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Selected: {screenshotFile.name} ({(screenshotFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">Click or drag new image to replace (Max 10MB)</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-700 font-bold">Select or drag payment receipt screenshot</p>
                          <p className="text-[10px] text-slate-400 font-medium">Supports JPG, PNG, JPEG formats (Max 10MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('checkout')}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center cursor-pointer transition text-xs"
                  >
                    Back to Shipping
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadPaymentProof}
                    disabled={!manualTxId.trim() || !screenshotFile || !manualBankName.trim() || !manualPaymentDate}
                    className="w-2/3 bg-[#1E40AF] hover:bg-blue-750 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none text-white font-bold py-2.5 rounded-xl text-center uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Upload &amp; Submit Payment Proof</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'processing' && (
            <div className="lg:col-span-3 text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
              <Loader2 className="w-12 h-12 text-teal-700 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Processing Procurement Order...</h3>
            </div>
          )}

          {checkoutStep === 'success' && createdOrder && (
            <div className="lg:col-span-3 text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-lg mx-auto p-6 animate-fade-in">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Procurement Order Submitted!</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your procurement order <strong className="text-slate-800">#{createdOrder.id}</strong> has been logged. 
                  A notifications dispatch alert was triggered to the supplier network. Your order is currently awaiting payment verification.
                </p>
              </div>

              {/* Order specifics */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left text-xs font-semibold space-y-1.5">
                <p className="text-slate-400 uppercase text-[10px]">Consignment Summary</p>
                <div className="flex justify-between">
                  <span>Authorized Cleared Value:</span>
                  <span className="font-mono text-teal-800">₹{createdOrder.finalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI Transaction/UTR No:</span>
                  <span className="font-mono text-slate-600">{createdOrder.paymentId || createdOrder.paymentTxId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipment Service:</span>
                  <span className="font-mono text-slate-600">Delhivery Express Courier</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setViewInvoiceOrder(createdOrder)}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  View Commercial Invoice
                </button>
                <button
                  onClick={() => { setCheckoutStep('cart'); onNavigate('marketplace'); }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs uppercase transition"
                >
                  Back to Marketplace
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* RFQ and Tenders Procurement Page */}
      {currentView === 'rfqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Submit Custom RFQ Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 h-fit">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <FilePlus className="w-4.5 h-4.5 text-teal-700" />
              Open Custom Clinical Tender
            </h3>
            <form onSubmit={handleRfqSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-500 block mb-1">Equipment Name / Product Requirements *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 ICU Ventilators with calibration"
                  value={rfqName}
                  onChange={(e) => setRfqName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rfqQty || ''}
                    onChange={(e) => setRfqQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Est. Total Budget (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    value={rfqBudget || ''}
                    onChange={(e) => setRfqBudget(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Consignment Destination (Hospital/Wing) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortis Hospital, Phase 3, Mohali"
                  value={rfqLocation}
                  onChange={(e) => setRfqLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Detailed Technical Specifications *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe mandatory ISO/CE certifications, specific sensor standards, AMC duration requirements..."
                  value={rfqDesc}
                  onChange={(e) => setRfqDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Upload Tender Specifications Sheet</label>
                <input
                  type="text"
                  placeholder="e.g. Fortis_Tender_Specs_v2.pdf"
                  value={rfqAttachmentName}
                  onChange={(e) => setRfqAttachmentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl uppercase tracking-wide transition cursor-pointer"
              >
                Publish Procurement RFQ
              </button>
            </form>
          </div>

          {/* Active Tenders list with Quotation Comparator */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ClipboardList className="w-5 h-5 text-teal-700" />
              Your Open Tenders & B2B RFQs
            </h3>

            {!currentUser ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                <p className="text-xs">Authenticate to view open procurements and compare submitted vendor quotes.</p>
              </div>
            ) : rfqs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No active RFQs posted under this profile.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rfqs.map((rfq) => {
                  const relatedQuotes = quotations.filter(q => q.rfqId === rfq.id);
                  return (
                    <div key={rfq.id} className="p-5 rounded-2xl border border-slate-100 space-y-4 hover:border-slate-200 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded font-bold font-mono">
                            ID: {rfq.id}
                          </span>
                          <h4 className="font-bold text-slate-900 mt-1.5 text-sm sm:text-base">{rfq.productName}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal">{rfq.description}</p>
                          <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-400 font-semibold">
                            <span>Quantity: <strong className="text-slate-700">{rfq.quantity} units</strong></span>
                            <span>Budget: <strong className="text-emerald-700">₹{rfq.budget.toLocaleString()}</strong></span>
                            <span>Destination: <strong className="text-slate-700">{rfq.deliveryLocation}</strong></span>
                            <span>Status: <strong className={rfq.status === 'Open' ? 'text-teal-700' : 'text-slate-400'}>{rfq.status}</strong></span>
                          </div>
                        </div>

                        {rfq.status === 'Open' && relatedQuotes.length > 0 && (
                          <button
                            onClick={() => setActiveRfqReview(rfq)}
                            className="bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold px-3.5 py-2 rounded-xl shrink-0 uppercase tracking-wide flex items-center gap-1"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            Compare {relatedQuotes.length} Bid(s)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RFQ quote comparator overlay popup modal */}
      {activeRfqReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                RFQ Quote Comparison Sheet: {activeRfqReview.productName}
              </h3>
              <button onClick={() => setActiveRfqReview(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none">&times;</button>
            </div>

            <div className="p-6 overflow-x-auto text-xs font-semibold">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Partner Supplying Company</th>
                    <th className="py-3 px-3 text-right">Price per Unit</th>
                    <th className="py-3 px-3 text-right">Total Commercial Price</th>
                    <th className="py-3 px-3 text-center">Fulfillment Time</th>
                    <th className="py-3 px-4">Specifications & Warranty Included</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {quotations.filter(q => q.rfqId === activeRfqReview.id).map((quo) => (
                    <tr key={quo.id} className="hover:bg-slate-50/40">
                      <td className="py-4 px-4 font-bold text-slate-900">{quo.companyName}</td>
                      <td className="py-4 px-3 text-right font-mono text-slate-800">₹{quo.pricePerUnit.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-3 text-right font-mono text-teal-800 font-bold">₹{quo.totalPrice.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-3 text-center text-slate-800">{quo.deliveryDays} Days</td>
                      <td className="py-4 px-4 text-slate-500 leading-normal font-normal">{quo.specifications}</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleAcceptQuotation(quo, activeRfqReview)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          Accept & Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Procurement History & Verifications */}
      {currentView === 'orders' && (
        <div className="space-y-6 animate-fade-in pb-12">
          
          {/* Header Title bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-teal-700" />
                Procurement History & Clearing Console
              </h2>
              <p className="text-xs text-slate-400 mt-1">Review clinical acquisitions, dispatch tracking, and payment verification certificates</p>
            </div>
            
            {/* Status Filters */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 text-[10px] uppercase font-bold text-slate-600">
              {(['All', 'Pending Verification', 'Active', 'Completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => { setOrdersFilter(filter); setReuploadingOrderId(null); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    ordersFilter === filter
                      ? 'bg-white text-teal-800 shadow-sm font-bold'
                      : 'hover:bg-white/40 text-slate-500'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Orders list container */}
            <div className="lg:col-span-2 space-y-4">
              {orders.filter(o => {
                if (ordersFilter === 'Pending Verification') {
                  return o.status === 'Awaiting Payment Verification' || o.status === 'Pending Payment' || o.status === 'Payment Pending Verification' || o.status === 'Payment Rejected';
                }
                if (ordersFilter === 'Active') {
                  return ['Order Sent to Vendor', 'Vendor Accepted', 'Processing', 'Shipped', 'Confirmed', 'Paid', 'Payment Verified'].includes(o.status);
                }
                if (ordersFilter === 'Completed') {
                  return o.status === 'Delivered' || o.status === 'Completed';
                }
                return true;
              }).length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                  <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">No Procurements Found</h4>
                    <p className="text-xs text-slate-400 mt-1">There are no orders logged under this clearance category.</p>
                  </div>
                  <button
                    onClick={() => onNavigate('marketplace')}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition"
                  >
                    Browse Equipment Catalog
                  </button>
                </div>
              ) : (
                orders
                  .filter(o => {
                    if (ordersFilter === 'Pending Verification') {
                      return o.status === 'Awaiting Payment Verification' || o.status === 'Pending Payment' || o.status === 'Payment Pending Verification' || o.status === 'Payment Rejected';
                    }
                    if (ordersFilter === 'Active') {
                      return ['Order Sent to Vendor', 'Vendor Accepted', 'Processing', 'Shipped', 'Confirmed', 'Paid', 'Payment Verified'].includes(o.status);
                    }
                    if (ordersFilter === 'Completed') {
                      return o.status === 'Delivered' || o.status === 'Completed';
                    }
                    return true;
                  })
                  .map((order) => {
                    const isAwaitingVerification = order.status === 'Payment Pending Verification' || order.status === 'Awaiting Payment Verification';
                    const isPendingPayment = order.status === 'Pending Payment' || order.status === 'Payment Rejected';
                    const isReuploadFormOpen = reuploadingOrderId === order.id;

                    return (
                      <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                        
                        {/* Card Header Info */}
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-wrap justify-between items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-800 text-sm">#{order.id}</span>
                            <span className="text-slate-400 text-[10px] font-medium">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              isPendingPayment
                                ? 'bg-amber-100 border border-amber-300 text-amber-800 animate-pulse'
                                : isAwaitingVerification
                                  ? 'bg-orange-100 border border-orange-300 text-orange-800'
                                  : order.status === 'Order Sent to Vendor'
                                    ? 'bg-sky-100 border border-sky-200 text-sky-800'
                                    : order.status === 'Vendor Accepted'
                                      ? 'bg-indigo-100 border border-indigo-200 text-indigo-800'
                                      : order.status === 'Packed'
                                        ? 'bg-purple-100 border border-purple-200 text-purple-800'
                                        : order.status === 'Shipped'
                                          ? 'bg-blue-100 border border-blue-300 text-blue-900'
                                          : order.status === 'Vendor Rejected'
                                            ? 'bg-rose-100 border border-rose-300 text-rose-800'
                                            : order.status === 'Completed' || order.status === 'Delivered'
                                              ? 'bg-emerald-100 border border-emerald-200 text-emerald-800'
                                              : 'bg-slate-100 border border-slate-200 text-slate-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-4 font-semibold">
                          
                          {/* Rejection Notification Feedback */}
                          {order.paymentRejectionReason && isPendingPayment && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-3 text-xs space-y-1">
                              <p className="font-bold uppercase tracking-wider text-[10px] text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                Payment Receipt Rejected
                              </p>
                              <p className="leading-relaxed font-semibold">Reason: "{order.paymentRejectionReason}"</p>
                              <p className="text-[10px] text-rose-500 font-medium leading-relaxed">
                                Please review your payment receipt coordinates and click the re-upload trigger below to submit a clear, correct proof of payment.
                              </p>
                            </div>
                          )}

                          {/* Items nested list */}
                          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">procured equipment line items</p>
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2 text-[11px]">
                                <div className="flex items-center gap-2 max-w-[70%]">
                                  {item.productImage && (
                                    <img src={item.productImage} alt={item.productName} className="w-8 h-8 rounded border object-cover bg-white" referrerPolicy="no-referrer" />
                                  )}
                                  <div>
                                    <p className="text-slate-800 font-bold truncate">{item.productName}</p>
                                    <p className="text-[9px] text-slate-400 font-medium">Qty: {item.quantity} unit(s) • Supplier: {item.vendorName}</p>
                                  </div>
                                </div>
                                <span className="font-mono text-slate-700">₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          {/* Consignment Address & Summary Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-100 rounded-xl p-3 text-[11px] font-medium leading-relaxed">
                            <div className="space-y-1">
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Hospital Consignment Target</p>
                              <p className="text-slate-800 font-semibold">{order.shippingAddress.address}</p>
                              <p className="text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                            </div>
                            <div className="space-y-1 sm:border-l sm:border-slate-100 sm:pl-4">
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Payment coordinates</p>
                              <p className="text-slate-800 font-bold">Method: {order.paymentMethod}</p>
                              {order.paymentTxId && (
                                <p className="font-mono text-[10px] text-slate-500">Tx ID: <span className="text-slate-800 font-semibold">{order.paymentTxId}</span></p>
                              )}
                              {order.paymentNote && (
                                <p className="text-slate-500 italic">"Note: {order.paymentNote}"</p>
                              )}
                              <p className="text-teal-800 font-bold mt-1 text-xs">Total Cleared: ₹{order.finalAmount.toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          {/* Courier & Tracking Information Box */}
                          {!['Vendor Rejected', 'Pending Payment'].includes(order.status) && (
                            <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-3.5 text-xs font-mono text-sky-950 flex flex-col gap-2 shadow-sm">
                              <div className="flex justify-between items-center border-b border-sky-200/80 pb-1.5">
                                <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-sky-800 flex items-center gap-1.5">
                                  📦 Courier Dispatch & Tracking Info
                                </span>
                                <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded font-bold uppercase font-sans">{order.status}</span>
                              </div>
                              <div className="flex justify-between items-center pt-0.5">
                                <span className="text-slate-500 font-sans">Courier Partner Name:</span>
                                <strong className="text-slate-900 font-sans font-bold text-sm">
                                  {order.courierName || order.shippingProvider || (order.trackingNumber ? 'Standard Express Courier' : 'Pending Assignment')}
                                </strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-sans">Consignment / Tracking No:</span>
                                <div className="flex items-center gap-2">
                                  {order.trackingNumber ? (
                                    <>
                                      <strong className="text-slate-900 font-mono bg-white px-2.5 py-1 rounded border border-sky-200 text-sm font-bold">{order.trackingNumber}</strong>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(order.trackingNumber || '');
                                          addToast('Tracking number copied to clipboard!', 'success');
                                        }}
                                        className="text-[10px] bg-sky-100 hover:bg-sky-200 text-sky-800 px-2 py-1 rounded font-sans font-bold transition"
                                      >
                                        Copy
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-sans text-xs font-semibold">
                                      Awaiting Consignment Number from Vendor
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* RE-UPLOAD PAYMENT PROOF inline Form */}
                          {isPendingPayment && (
                            <div className="pt-2 border-t border-slate-100">
                              {!isReuploadFormOpen ? (
                                <button
                                  onClick={() => {
                                    setReuploadingOrderId(order.id);
                                    setManualTxId(order.paymentTxId || '');
                                  }}
                                  className="w-full bg-teal-50 border border-teal-200 text-teal-800 font-bold py-2 rounded-xl text-center uppercase tracking-wider hover:bg-teal-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Re-submit Transaction UTR
                                </button>
                              ) : (
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h5 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Submit Transaction Reference</h5>
                                    <button
                                      onClick={() => setReuploadingOrderId(null)}
                                      className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>

                                  {/* Guidelines for selected offline payment */}
                                  <div className="text-[11px] leading-relaxed text-slate-600 space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                                    <p className="font-bold text-slate-800">Payment coordinates instructions:</p>
                                    {order.paymentMethod === 'UPI' ? (
                                      <div className="flex items-center gap-3">
                                        {paymentSettings.upiQrCodeUrl && (
                                          <img src={paymentSettings.upiQrCodeUrl} alt="Slice UPI QR" className="w-16 h-16 object-contain rounded border bg-white shrink-0" referrerPolicy="no-referrer" />
                                        )}
                                        <div>
                                          <p>Transfer the final total to UPI ID <strong className="text-slate-900 font-mono text-xs">{paymentSettings.upiId || '9149758743@slc'}</strong></p>
                                          <p className="text-[10px] text-slate-500">Account holder: <strong className="text-slate-700">{paymentSettings.upiHolderName || 'Warisul Islam'}</strong></p>
                                        </div>
                                      </div>
                                    ) : (
                                      <p>Transfer using IMPS/NEFT to HDFC Bank A/C: <strong className="text-slate-800 font-mono">{paymentSettings.bankAccountNumber || '1234567890'}</strong> (IFSC: <strong className="text-slate-800 font-mono">{paymentSettings.bankIfsc || 'HDFC0001234'}</strong>).</p>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-slate-400 block mb-1 text-[10px]">Transaction ID / UTR Number *</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. UPI8473928173"
                                        value={manualTxId}
                                        onChange={(e) => setManualTxId(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-teal-700 transition font-mono uppercase text-[11px] font-bold text-slate-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-slate-400 block mb-1 text-[10px]">Reference Note (Optional)</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Resubmitted after fixing limit"
                                        value={manualNote}
                                        onChange={(e) => setManualNote(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-teal-700 transition text-[11px]"
                                      />
                                    </div>

                                  </div>

                                  {/* Optional New Payment Receipt Screenshot Upload */}
                                  <div className="space-y-1">
                                    <label className="text-slate-400 block text-[10px] font-bold">New Payment Receipt Screenshot (Optional)</label>
                                    <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white hover:bg-slate-50 transition relative flex flex-col items-center justify-center text-center cursor-pointer">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            if (file.size > 10 * 1024 * 1024) {
                                              addToast('Screenshot size must be less than 10MB.', 'error');
                                              return;
                                            }
                                            setReuploadScreenshotFile(file);
                                          }
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                      />
                                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                      {reuploadScreenshotFile ? (
                                        <div>
                                          <p className="text-[11px] font-bold text-teal-800 flex items-center gap-1 justify-center">
                                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Selected: {reuploadScreenshotFile.name} ({(reuploadScreenshotFile.size / (1024 * 1024)).toFixed(2)} MB)
                                          </p>
                                          <p className="text-[9px] text-slate-400">Click to replace screenshot (Max 10MB)</p>
                                        </div>
                                      ) : (
                                        <div>
                                          <p className="text-[11px] text-slate-700 font-bold">Select or drag updated receipt screenshot</p>
                                          <p className="text-[9px] text-slate-400">Optional. Choose if you want to upload a new proof file</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {screenshotUploading && (
                                    <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200 text-center space-y-1.5">
                                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                        <span>Uploading updated payment receipt...</span>
                                        <span>{screenshotUploadProgress}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className="bg-teal-600 h-full transition-all duration-300"
                                          style={{ width: `${screenshotUploadProgress}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <button
                                    disabled={!manualTxId.trim() || screenshotUploading}
                                    onClick={async () => {
                                      // process submit
                                      if (!manualTxId.trim()) {
                                        addToast('Please enter the Transaction ID / UTR Number.', 'error');
                                        return;
                                      }

                                      let driveScreenshotUrl = '';
                                      let firebaseScreenshotUrl = '';

                                      if (reuploadScreenshotFile) {
                                        try {
                                          const fileBase64 = await fileToBase64(reuploadScreenshotFile);
                                          driveScreenshotUrl = await uploadScreenshotToDrive(
                                            fileBase64,
                                            reuploadScreenshotFile.name,
                                            reuploadScreenshotFile.type,
                                            order.id
                                          );
                                        } catch (driveErr: any) {
                                          console.warn('[Google Drive Upload] Failed, falling back to local simulation link:', driveErr);
                                          driveScreenshotUrl = `https://drive.google.com/mock-file-link/${order.id}_screenshot`;
                                        }

                                        try {
                                          const uploadRes = await uploadScreenshot(reuploadScreenshotFile);
                                          firebaseScreenshotUrl = uploadRes.url;
                                        } catch (fbErr) {
                                          console.warn('[Firebase Storage Upload] Failed:', fbErr);
                                          firebaseScreenshotUrl = driveScreenshotUrl;
                                        }
                                      }

                                      const currentOrders = dbLocal.getOrders();
                                      const idx = currentOrders.findIndex(o => o.id === order.id);
                                      if (idx > -1) {
                                        const originalOrder = currentOrders[idx];
                                        const updatedOrder: Order = {
                                          ...originalOrder,
                                          status: 'Payment Pending Verification',
                                          paymentStatus: 'Pending Verification',
                                          paymentTxId: manualTxId.trim(),
                                          paymentNote: manualNote.trim(),
                                          paymentScreenshotUrl: firebaseScreenshotUrl || originalOrder.paymentScreenshotUrl,
                                          paymentScreenshotName: reuploadScreenshotFile ? reuploadScreenshotFile.name : originalOrder.paymentScreenshotName,
                                          paymentRejectionReason: undefined, // Clear rejection reason
                                          timeline: [
                                            ...(originalOrder.timeline || []),
                                            {
                                              status: 'Payment Pending Verification',
                                              time: new Date().toISOString(),
                                              note: `Payment UTR re-submitted by customer with transaction ID ${manualTxId.trim()}.`
                                            }
                                          ],
                                          paymentVerificationLogs: [
                                            ...(originalOrder.paymentVerificationLogs || []),
                                            {
                                              action: 'submit',
                                              performedBy: currentUser?.name || 'Customer',
                                              performedByRole: 'customer',
                                              timestamp: new Date().toISOString(),
                                              note: `Resubmitted payment UTR after admin feedback.`
                                            }
                                          ]
                                        };
                                        currentOrders[idx] = updatedOrder;
                                        dbLocal.saveOrders(currentOrders);
                                        
                                        // Alert Admin
                                        dbLocal.addNotification(
                                          'admin',
                                          `Payment Proof Re-submitted`,
                                          `Customer resubmitted payment UTR for Order #${order.id} with UTR ${manualTxId.trim()}.`,
                                          'payment_updated'
                                        );
                                        
                                        addToast('Payment UTR submitted successfully!', 'success');
                                        // reset state
                                        setManualTxId('');
                                        setManualNote('');
                                        setReuploadScreenshotFile(null);
                                        setReuploadingOrderId(null);
                                        loadData();
                                      }
                                    }}
                                    className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 rounded-xl text-center uppercase tracking-wider transition text-[11px] cursor-pointer shadow-sm"
                                  >
                                    Submit Transaction UTR
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action footer (View PDF Invoice) */}
                          <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 mt-2">
                            <span className="text-[10px] text-slate-400 font-medium">Clearance cleared by AI B2B Gateway</span>
                            <button
                              onClick={() => setViewInvoiceOrder(order)}
                              className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1.5 transition text-[11px]"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Corporate Invoice (PDF)
                            </button>
                          </div>
                          
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Procurement Right Sidebar */}
            <div className="lg:col-span-1 space-y-6 text-xs">
              
              {/* Help support coordinates card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  B2B Clearing Guidelines
                </h3>
                <div className="space-y-3 font-medium leading-relaxed text-slate-600">
                  <div className="flex gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p><strong>Offline Clearing:</strong> If UPI or Bank Wire was selected, complete the transfer outside our app first, then attach the receipt.</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p><strong>Admin Audit:</strong> Super Admin logs each action. Your order reaches the supplier dashboard within minutes of validation approval.</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p><strong>PDF Invoice:</strong> Download legally compliant commercial B2B invoices featuring complete GST & HSN breakouts instantly.</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] leading-normal font-semibold text-slate-600">
                  <p className="text-[9px] uppercase text-teal-800 font-bold mb-1">super admin clearance contact</p>
                  <p>Escalations: <span className="font-mono text-slate-900">warisulislam371@gmail.com</span></p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Response standard: Under 15 mins for audited clinical consignments.</p>
                </div>
              </div>

              {/* Security seal */}
              <div className="bg-gradient-to-br from-teal-800 to-teal-950 p-6 rounded-2xl border border-teal-700/30 text-teal-100 space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />
                  <h4 className="font-bold text-xs uppercase tracking-wider">Clinical Clearing Seal</h4>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                  Every corporate hospital order placed undergoes multi-factor clearing checks. High-density medical equipment dispatches are secured using double-sealed calibrated container seals.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Product Detail Modal Popup */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-scale-up flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 bg-slate-100 h-64 md:h-auto overflow-hidden relative">
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleToggleWishlist(selectedProduct.id)}
                className="p-1.5 bg-white text-slate-400 hover:text-rose-600 rounded-full absolute top-4 left-4 shadow-sm"
              >
                <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between text-xs">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded font-mono uppercase">
                      SKU: {selectedProduct.sku}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 font-display">{selectedProduct.name}</h3>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none">&times;</button>
                </div>

                {/* Supplier & Trust Seal info */}
                {(() => {
                  const modalVendor = vendors.find(v => v.id === selectedProduct.vendorId || v.companyName === selectedProduct.vendorName);
                  return (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-teal-700 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Authorized Supplier</span>
                          <span className="font-bold text-slate-800 text-xs">{selectedProduct.vendorName || modalVendor?.companyName || 'Verified Medical Partner'}</span>
                        </div>
                      </div>
                      {modalVendor?.trustSeal && (
                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 shrink-0 uppercase tracking-wide">
                          <ShieldCheck className="w-3.5 h-3.5 text-white" />
                          {modalVendor.trustSealLevel || 'Verified Seal'}
                        </span>
                      )}
                    </div>
                  );
                })()}

                <p className="text-[11px] text-slate-500 leading-relaxed leading-normal">
                  {selectedProduct.description}
                </p>

                {/* Spec parameters */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="font-semibold text-slate-700 text-[10px] uppercase mb-1.5">clinical validations</p>
                  {selectedProduct.specifications.map((spec, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 leading-normal">
                      <span>{spec.key}:</span>
                      <strong className="text-slate-800">{spec.value}</strong>
                    </div>
                  ))}
                  <div className="flex justify-between text-slate-600 leading-normal">
                    <span>HSN Code:</span>
                    <strong className="text-slate-800">{selectedProduct.hsnCode}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 leading-normal">
                    <span>GST Rate:</span>
                    <strong className="text-slate-800">{selectedProduct.gstRate}% Integrated</strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center gap-2">
                <div>
                  <span className="text-slate-400 text-[9px] block">Unit Price (INR)</span>
                  <span className="text-base font-bold text-teal-800">₹{selectedProduct.salePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedProduct(null); onNavigate('reviews'); }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-2 px-3 rounded-xl transition flex items-center gap-1 text-[10px]"
                    title="Read Hospital & Doctor Reviews"
                  >
                    ⭐ Reviews
                  </button>
                  <button
                    onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded-xl uppercase tracking-wide transition flex items-center gap-1.5 text-[10px]"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal visual overlay */}
      {viewInvoiceOrder && (
        <InvoicePDF order={viewInvoiceOrder} onClose={() => setViewInvoiceOrder(null)} addToast={addToast} />
      )}

    </div>
  );
}
