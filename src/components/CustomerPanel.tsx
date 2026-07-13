import React, { useState, useEffect, useRef } from 'react';
import { dbLocal } from '../db';
import { Product, Order, RFQ, Quotation, Category, Brand, Review, User, OrderItem, PaymentSettings, PromoBanner, Vendor } from '../types';
import {
  Heart,
  ShoppingCart,
  Store,
  Activity,
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
  Headphones,
  BadgeDollarSign
} from 'lucide-react';
import InvoicePDF from './InvoicePDF';
import HomepageTrustSection from './HomepageTrustSection';
import { PolicyType } from './PolicyModal';
import { getSliceUpiQrDataUrl } from '../utils/sliceQrSvg';

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
  onBecomeSeller?: () => void;
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
  onOpenPolicy,
  onBecomeSeller
}: CustomerPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
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
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'processing' | 'success'>('cart');
  const [razorpayMethod, setRazorpayMethod] = useState<'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking'>('UPI');
  
  // Manual Payment verification and settings states
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(dbLocal.getPaymentSettings());
  const [selectedPayMethod, setSelectedPayMethod] = useState<'razorpay' | 'upi' | 'bank' | ''>('');
  const [manualTxId, setManualTxId] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualProofUrl, setManualProofUrl] = useState('');
  const [manualProofFileName, setManualProofFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
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
  const [escrowPaymentSession, setEscrowPaymentSession] = useState<{ quo: Quotation; rfq: RFQ } | null>(null);

  // References to keep track of previous API request payloads to avoid infinite quota-draining requests
  const lastSearchKeyRef = useRef<string>('');
  const lastRecommendKeyRef = useRef<string>('');

  const loadData = () => {
    const approvedVendors = dbLocal.getVendors().filter(v => v.status === 'Approved');
    setVendors(prev => {
      if (JSON.stringify(prev) === JSON.stringify(approvedVendors)) return prev;
      return approvedVendors;
    });

    // Only approved, published, and active products are visible to customers
    const approvedProducts = dbLocal.getProducts().filter(p => {
      const isApproved = p.status === 'Approved';
      return isApproved && p.published === true && p.isActive === true;
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
        const res = await fetch('/api/gemini/search', {
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
        const res = await fetch('/api/gemini/recommend', {
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

  // Drag and Drop & File upload handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds the 10MB limit.', 'error');
      return;
    }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      addToast('Unsupported file format. Please upload JPG, PNG, or PDF.', 'error');
      return;
    }
    setManualProofFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setManualProofUrl(reader.result as string);
        addToast('Payment proof uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle Checkout submission with multi-payment modes
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      addToast('Please log in or switch profiles to complete checkout.', 'error');
      onNavigate('login');
      return;
    }
    if (cart.length === 0) return;

    if (!selectedPayMethod) {
      addToast('Please select a B2B clearing payment method before submitting.', 'error');
      return;
    }

    if (!manualProofUrl) {
      addToast('Payment receipt screenshot image is strictly required! Please upload your payment screenshot.', 'error');
      return;
    }

    if (selectedPayMethod !== 'razorpay' && !manualTxId.trim()) {
      addToast('Please enter the Transaction ID / UTR Number.', 'error');
      return;
    }

    setCheckoutStep('processing');

    setTimeout(() => {
      const firstItem = cart[0].product;
      const sub = getSubtotal();
      const gst = getGstTotal();
      const final = getCheckoutTotal();

      const payId = selectedPayMethod === 'razorpay' 
        ? (manualTxId.trim() || `pay_HN_${Date.now().toString().slice(-9)}`) 
        : manualTxId.trim();

      const initialStatus = selectedPayMethod === 'razorpay' ? 'Order Sent to Vendor' : 'Awaiting Payment Verification';
      const initialTimelineNote = selectedPayMethod === 'razorpay' 
        ? 'Procurement order placed via Razorpay Gateway. Payment proof screenshot submitted.' 
        : `Order placed via ${selectedPayMethod.toUpperCase()}. Payment proof submitted with transaction ID ${manualTxId}. Awaiting Admin Verification.`;

      const newOrder: Order = {
        id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        vendorId: firstItem.vendorId,
        vendorName: firstItem.vendorName,
        items: cart.map(item => {
          const vPrice = item.product.vendorPrice !== undefined ? item.product.vendorPrice : item.product.salePrice;
          const commRate = item.product.commissionRate !== undefined ? item.product.commissionRate : 0;
          const commAmt = item.product.commissionAmount !== undefined ? item.product.commissionAmount : 0;
          const fPrice = item.product.salePrice;
          const vPayout = item.product.vendorPayout !== undefined ? item.product.vendorPayout : vPrice;
          
          return {
            productId: item.product.id,
            productName: item.product.name,
            productImage: item.product.images[0],
            price: fPrice,
            quantity: item.quantity,
            gstRate: item.product.gstRate,
            hsnCode: item.product.hsnCode,
            vendorId: item.product.vendorId,
            vendorName: item.product.vendorName,
            
            // Commission system snapshots
            vendorPrice: vPrice,
            commissionRate: commRate,
            commissionAmount: commAmt,
            finalPrice: fPrice,
            vendorPayout: vPayout
          };
        }),
        totalAmount: sub,
        gstAmount: gst,
        discountAmount: 0,
        finalAmount: final,
        status: initialStatus as any,
        paymentMethod: selectedPayMethod === 'razorpay' ? 'Razorpay' : selectedPayMethod === 'upi' ? 'UPI' : 'Bank Transfer',
        paymentId: payId,
        shippingAddress: shippingAddress,
        createdAt: new Date().toISOString(),
        timeline: [
          { status: initialStatus as any, time: new Date().toISOString(), note: initialTimelineNote }
        ],
        paymentProofUrl: manualProofUrl || undefined,
        paymentTxId: manualTxId.trim() || payId,
        paymentNote: manualNote.trim() || undefined,
        paymentVerificationLogs: [{
          action: 'submit',
          performedBy: currentUser.name,
          performedByRole: 'customer',
          timestamp: new Date().toISOString(),
          note: 'Initial payment proof submission at checkout.'
        }]
      };

      const currentOrders = dbLocal.getOrders();
      currentOrders.unshift(newOrder);
      dbLocal.saveOrders(currentOrders);

      // Alert Vendor ONLY IF payment is verified/Razorpay
      if (initialStatus === 'Order Sent to Vendor') {
        dbLocal.addNotification(
          newOrder.vendorId,
          'New Equipment Order Placed',
          `Order #${newOrder.id} has been received for ₹${newOrder.finalAmount.toLocaleString('en-IN')}. Verify calibrated packing.`,
          'order_placed'
        );
      }

      // Alert Admin
      dbLocal.addNotification(
        'admin',
        `New Marketplace Transaction`,
        `Order #${newOrder.id} placed via ${newOrder.paymentMethod}. Final: ₹${newOrder.finalAmount.toLocaleString('en-IN')}.`,
        'order_placed'
      );

      setCreatedOrder(newOrder);
      setCheckoutStep('success');
      onUpdateCart([]); // clear cart
      
      // Clear manual payment states
      setManualTxId('');
      setManualNote('');
      setManualProofUrl('');
      setManualProofFileName('');
    }, 2500);
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
      status: 'PENDING_ADMIN_REVIEW',
      createdAt: new Date().toISOString(),
      quotationsCount: 0
    };

    const currentRfqs = dbLocal.getRfqs();
    currentRfqs.unshift(newRfq);
    dbLocal.saveRfqs(currentRfqs);

    // Notify admin for vetting triage
    dbLocal.addNotification(
      'admin',
      'New Procurement RFQ Submitted (Awaiting Vetting)',
      `Client ${currentUser.name} posted tender #${newRfq.id} for "${newRfq.productName}". Please review and vet it in the Admin Console.`,
      'rfq_created'
    );

    addToast('Your clinical procurement RFQ Tender has been submitted and is pending administrative vetting.', 'success');
    setRfqName('');
    setRfqQty(1);
    setRfqBudget(0);
    setRfqLocation('');
    setRfqDesc('');
    setRfqAttachmentName('');
    loadData();
  };

  // Accept vendor quotation and open payment gateway session
  const handleAcceptQuotation = (quo: Quotation, rfq: RFQ) => {
    if (!currentUser) {
      addToast('Please authenticate to accept quotations and proceed to checkout.', 'error');
      return;
    }
    setEscrowPaymentSession({ quo, rfq });
  };

  const handleConfirmEscrowPayment = (method: string) => {
    if (!escrowPaymentSession || !currentUser) return;
    const { quo, rfq } = escrowPaymentSession;

    if (method === 'Admin Direct Clearance (Sandbox Bypass)') {
      // 1. Direct verified order transition
      const updatedRfqs = dbLocal.getRfqs().map(r => {
        if (r.id === rfq.id) {
          return { 
            ...r, 
            status: 'PAYMENT_VERIFIED_ORDER_PLACED' as const,
            winningQuotationId: quo.id
          };
        }
        return r;
      });
      dbLocal.saveRfqs(updatedRfqs);

      // 2. Accept and reject bids
      const updatedQuotes = dbLocal.getQuotations().map(q => {
        if (q.id === quo.id) return { ...q, status: 'Accepted' as const };
        if (q.rfqId === rfq.id) return { ...q, status: 'Rejected' as const };
        return q;
      });
      dbLocal.saveQuotations(updatedQuotes);

      // 3. Create active Order
      const sub = quo.totalPrice;
      const qGstRate = quo.gstRate !== undefined ? quo.gstRate : 12;
      const gst = sub * (qGstRate / 100);
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
          gstRate: qGstRate,
          hsnCode: '90181100',
          vendorId: quo.vendorId,
          vendorName: quo.companyName,
          vendorPrice: quo.pricePerUnit,
          commissionRate: quo.commissionRateApplied || 10,
          commissionAmount: quo.platform_fee || 0,
          finalPrice: quo.pricePerUnit,
          vendorPayout: (quo.vendor_base_price || (quo.pricePerUnit * 0.9)) * rfq.quantity
        }],
        totalAmount: sub,
        gstAmount: gst,
        discountAmount: 0,
        finalAmount: final,
        status: 'Processing',
        paymentMethod: 'UPI',
        paymentId: `pay_HN_${Date.now().toString().slice(-9)}`,
        shippingAddress: {
          address: rfq.deliveryLocation,
          city: 'Clinical Hub',
          state: 'Delhi',
          pincode: '110001'
        },
        createdAt: new Date().toISOString(),
        timeline: [
          { status: 'Pending', time: new Date().toISOString(), note: 'Escrow payment bypass verified. Order automatically placed & routed.' },
          { status: 'Confirmed', time: new Date().toISOString(), note: 'Vendor routed with secured clearance guarantee.' }
        ]
      };

      const allOrders = dbLocal.getOrders();
      allOrders.unshift(newOrder);
      dbLocal.saveOrders(allOrders);

      // Notify Vendor about secured funds
      dbLocal.addNotification(
        quo.vendorId,
        'B2B Escrow Funds Secured - START DISPATCH!',
        `Payment for RFQ #${rfq.id} has been pre-cleared via Admin Sandbox Bypass. Delivery address: ${rfq.deliveryLocation}. Please dispatch immediately.`,
        'order_placed'
      );

      // Notify Admin
      dbLocal.addNotification(
        'admin',
        'B2B Escrow Pre-Cleared Order Placed',
        `Client ${currentUser.name} accepted Quote #${quo.id} via Direct Pre-Cleared Sandbox Bypass. Order #${newOrder.id} has been automatically routed to supplier ${quo.companyName}.`,
        'payment_received'
      );

      addToast(`Direct Sandbox Bypass Approved! Order #${newOrder.id} has been successfully created and routed.`, 'success');
    } else {
      // Transition the RFQ status to PENDING_PAYMENT_VERIFICATION
      const updatedRfqs = dbLocal.getRfqs().map(r => {
        if (r.id === rfq.id) {
          return { 
            ...r, 
            status: 'PENDING_PAYMENT_VERIFICATION' as const,
            winningQuotationId: quo.id
          };
        }
        return r;
      });
      dbLocal.saveRfqs(updatedRfqs);

      // Update Quotations
      const updatedQuotes = dbLocal.getQuotations().map(q => {
        if (q.id === quo.id) return { ...q, status: 'Accepted' as const };
        if (q.rfqId === rfq.id) return { ...q, status: 'Rejected' as const };
        return q;
      });
      dbLocal.saveQuotations(updatedQuotes);

      // Notify Admin about the escrow deposit matching
      const qGstRate = quo.gstRate !== undefined ? quo.gstRate : 12;
      const totalPlusGst = (quo.totalPrice || 0) * (1 + qGstRate / 100);

      dbLocal.addNotification(
        'admin',
        'B2B Escrow Deposit Pending Verification',
        `Client ${currentUser.name} has accepted Quote #${quo.id} for RFQ #${rfq.id}. A escrow deposit of ₹${totalPlusGst.toLocaleString()} (including ${qGstRate}% GST) via ${method} is awaiting your manual ledger/webhook verification.`,
        'payment_received'
      );

      addToast(`Escrow payment gateway session authorized via ${method}. Status is now PENDING_PAYMENT_VERIFICATION.`, 'success');
    }

    setEscrowPaymentSession(null);
    setActiveRfqReview(null);
    loadData();
  };

  return (
    <div className="font-sans">
      
      {/* Home View / Landing with Marketplace Grid */}
      {currentView === 'marketplace' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Dynamic Promo Banner Carousel */}
          {promoBanners && promoBanners.length > 0 ? (
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 min-h-[400px] sm:min-h-[460px] flex items-center transition-all duration-700 group/carousel">
              {/* Active Banner Background Image */}
              <div className="absolute inset-0 z-0">
                <img
                  src={promoBanners[activeBannerIdx].imageUrl}
                  alt={promoBanners[activeBannerIdx].title}
                  className="w-full h-full object-cover transition-all duration-1000 ease-in-out transform scale-100"
                  referrerPolicy="no-referrer"
                />
                {/* Modern Dark/Teal Gradient Overlay to guarantee high contrast */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
              </div>

              {/* Banner Content */}
              <div className="w-full relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 py-14 sm:py-24 px-6 sm:px-12 text-white">
                <div className="max-w-2xl space-y-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {promoBanners[activeBannerIdx].badgeText && (
                      <span className="inline-block bg-teal-500/20 text-teal-300 backdrop-blur-md border border-teal-500/40 text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                        ⚡ {promoBanners[activeBannerIdx].badgeText}
                      </span>
                    )}
                    <span className="inline-block bg-emerald-500 text-slate-950 text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                      Verified Supplier
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-[38px] font-bold text-white tracking-tight leading-tight font-sans drop-shadow-sm">
                    {promoBanners[activeBannerIdx].title}
                  </h1>
                  {promoBanners[activeBannerIdx].subtitle && (
                    <p className="text-sm sm:text-lg text-slate-200 leading-relaxed max-w-lg font-medium drop-shadow-sm">
                      {promoBanners[activeBannerIdx].subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3.5 pt-3">
                    <button
                      onClick={() => {
                        const link = promoBanners[activeBannerIdx].linkUrl;
                        if (link && link.startsWith('#')) {
                          const el = document.getElementById(link.substring(1));
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            document.getElementById('marketplace-anchor')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        } else if (link) {
                          if (link.includes('rfq')) {
                            onNavigate('rfqs');
                          } else {
                            document.getElementById('marketplace-anchor')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        } else {
                          document.getElementById('marketplace-anchor')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-extrabold px-7 py-4 rounded-xl transition duration-300 shadow-xl flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 border border-teal-500/30"
                    >
                      <span>{promoBanners[activeBannerIdx].buttonText || 'Explore Catalog'}</span>
                      <ArrowRight className="w-4.5 h-4.5 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('rfqs');
                      }}
                      className="bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-xl transition duration-300 shadow-md cursor-pointer backdrop-blur-sm"
                    >
                      B2B Tenders
                    </button>
                  </div>

                  {/* Integrated Trust Badges inside Carousel */}
                  <div className="flex flex-wrap gap-5 pt-6 border-t border-white/10 text-white/90 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-white/10 border border-white/20">
                        <Check className="w-3.5 h-3.5 text-teal-300" />
                      </div>
                      <span>100% Secure Procurement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-white/10 border border-white/20">
                        <Truck className="w-3.5 h-3.5 text-teal-300" />
                      </div>
                      <span>Escrow Safeguard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-white/10 border border-white/20">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                      </div>
                      <span>ISO Certified Supplies</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Immersive Card */}
                <div className="relative shrink-0 hidden lg:block w-80">
                  <div className="bg-slate-950/40 backdrop-blur-xl p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4 transform hover:scale-[1.02] transition-transform duration-500">
                    <div className="h-44 rounded-2xl overflow-hidden relative border border-white/10 shadow-inner">
                      <img
                        src={promoBanners[activeBannerIdx].imageUrl}
                        alt="Current Offer"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2.5 right-2.5 bg-teal-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                        Active Promo
                      </span>
                    </div>
                    <div className="space-y-1 text-white">
                      <h4 className="font-bold text-sm tracking-tight truncate">{promoBanners[activeBannerIdx].title}</h4>
                      <p className="text-[11px] text-teal-300 font-bold uppercase tracking-wider">{promoBanners[activeBannerIdx].badgeText || 'Exclusive Deal'}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase leading-none">B2B Platform</span>
                          <span className="font-extrabold text-xs text-white">Al Salam Escrow Verified</span>
                        </div>
                        <span className="text-[9px] bg-teal-400/25 text-teal-200 font-bold px-2 py-1 rounded border border-teal-400/30">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider Manual Navigation Chevrons */}
              {promoBanners.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIdx((prev) => (prev - 1 + promoBanners.length) % promoBanners.length);
                    }}
                    className="absolute left-4 z-20 p-2.5 bg-slate-950/50 hover:bg-slate-950/80 border border-white/10 text-white rounded-full transition opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden sm:block"
                    title="Previous Slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIdx((prev) => (prev + 1) % promoBanners.length);
                    }}
                    className="absolute right-4 z-20 p-2.5 bg-slate-950/50 hover:bg-slate-950/80 border border-white/10 text-white rounded-full transition opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden sm:block"
                    title="Next Slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Bottom Dot Indicators */}
              {promoBanners.length > 1 && (
                <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
                  {promoBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBannerIdx(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeBannerIdx 
                          ? 'bg-teal-400 w-6 shadow-md shadow-teal-400/40' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative bg-gradient-to-r from-medical-blue to-cyan-blue text-white rounded-3xl overflow-hidden py-14 sm:py-24 px-6 sm:px-12 shadow-2xl border border-white/10 min-h-[400px] sm:min-h-[460px] flex items-center transition-all duration-700">
              {/* Ambient background decoration */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-300 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400 rounded-full blur-[120px] opacity-25 pointer-events-none" />
              <div className="absolute bottom-0 left-10 w-60 h-60 bg-blue-400 rounded-full blur-[100px] opacity-20 pointer-events-none" />
              
              <div className="w-full relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="max-w-2xl space-y-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-block bg-white/20 text-white backdrop-blur-md border border-white/30 text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                      ⚡ MEGA BAZAR IS LIVE • DISCOUNTS APPLIED
                    </span>
                    <span className="inline-block bg-highlight-green text-slate-950 text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                      🆕 Newly Launched
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-[38px] font-bold text-white tracking-tight leading-tight font-sans drop-shadow-sm">
                    Premium Healthcare Supplies, <br className="hidden sm:inline" />
                    Better Prices!
                  </h1>
                  <p className="text-sm sm:text-lg text-white/90 leading-relaxed max-w-lg font-medium drop-shadow-sm">
                    Up to <span className="font-extrabold text-teal-200 text-lg sm:text-xl underline decoration-teal-300">40% OFF</span> on 10,000+ certified medical products.
                  </p>
                  <div className="flex flex-wrap gap-3.5 pt-3">
                    <button
                      onClick={() => {
                        const el = document.getElementById('marketplace-anchor');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-extrabold px-7 py-4 rounded-xl transition duration-300 shadow-xl flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>Shop Now</span>
                      <ArrowRight className="w-4.5 h-4.5 text-slate-800" />
                    </button>
                    <button
                      onClick={() => {
                        if (onBecomeSeller) {
                          onBecomeSeller();
                        } else {
                          const el = document.getElementById('marketplace-anchor');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-transparent border-2 border-white/65 hover:border-white hover:bg-white/10 text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-xl transition duration-300 shadow-md cursor-pointer"
                    >
                      Become a Seller
                    </button>
                  </div>

                  {/* Integrated Trust Badges */}
                  <div className="flex flex-wrap gap-5 pt-6 border-t border-white/10 text-white/90 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-white/10 border border-white/20">
                        <Check className="w-3.5 h-3.5 text-teal-200" />
                      </div>
                      <span>100% Genuine</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-white/10 border border-white/20">
                        <Truck className="w-3.5 h-3.5 text-teal-200" />
                      </div>
                      <span>Fast Delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-white/10 border border-white/20">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-200" />
                      </div>
                      <span>Trusted Vendors</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Immersive Card */}
                <div className="relative shrink-0 hidden lg:block w-80">
                  <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl space-y-4 transform hover:scale-[1.02] transition-transform duration-500">
                    <div className="h-44 rounded-2xl overflow-hidden relative border border-white/10 shadow-inner">
                      <img
                        src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400"
                        alt="Premium Medical Equipment"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 right-2.5 bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                        Featured Offer
                      </span>
                    </div>
                    <div className="space-y-1 text-white">
                      <h4 className="font-bold text-sm tracking-tight truncate">Enterprise High-Flow ICU Ventilator</h4>
                      <p className="text-[11px] text-white/70">Certified RespiCare ICU system</p>
                      <div className="flex items-center justify-between pt-1 border-t border-white/10 mt-2">
                        <div>
                          <span className="text-[9px] text-white/60 block uppercase leading-none">Starting at</span>
                          <span className="font-extrabold text-sm text-teal-200 font-mono">₹3,10,000</span>
                        </div>
                        <span className="text-[10px] bg-teal-400 text-teal-950 font-bold px-2 py-0.5 rounded font-mono">
                          Save 11%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trust & Service Section - Horizontal Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3 border-r border-slate-100/80 last:border-0 pr-2">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Secure Payments</h4>
                <p className="text-[10px] text-slate-400 font-medium">100% Encrypted B2B Gateway</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-r border-slate-100/80 last:border-0 pr-2">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <RotateCcw className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Easy Returns</h4>
                <p className="text-[10px] text-slate-400 font-medium">Hassle-free Refund Policies</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-r border-slate-100/80 last:border-0 pr-2">
              <div className="p-3 bg-pink-50 text-pink-600 rounded-xl shrink-0">
                <Headphones className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">24/7 Support</h4>
                <p className="text-[10px] text-slate-400 font-medium">Direct Clinical Help Desk</p>
              </div>
            </div>
            <div className="flex items-center gap-3 last:border-0 pr-2">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
                <BadgeDollarSign className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Best Price Guarantee</h4>
                <p className="text-[10px] text-slate-400 font-medium">Direct Factory Wholesale</p>
              </div>
            </div>
          </div>

          {/* AI Clinical Compliance Tip Panel */}
          {aiClinicalTip && (
            <div className={`p-5 rounded-3xl border flex items-start gap-4 transition-all shadow-md ${
              isDarkMode 
                ? 'bg-slate-900 border-teal-950 text-slate-100' 
                : 'bg-gradient-to-r from-teal-50/50 to-teal-50/10 border-teal-100 text-slate-800'
            }`}>
              <div className="bg-teal-500/10 text-teal-500 p-2.5 rounded-2xl shrink-0">
                <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[10px] text-teal-600 uppercase tracking-widest font-display">AI clinical procurement advisory</span>
                  <span className="bg-teal-500/15 text-teal-600 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono">LIVE CO-PILOT</span>
                </div>
                <p className="leading-relaxed font-semibold">{aiClinicalTip}</p>
              </div>
            </div>
          )}

          {/* Shop by Category - Redesigned Grid of Pastel Rounded Cards */}
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-display">
                  Shop by Category
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Explore medical grade equipment, validated devices, and hospital supplies</p>
              </div>
              <button
                onClick={() => {
                  onCategorySelect('');
                  const el = document.getElementById('marketplace-anchor');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-bold text-teal-600 hover:text-teal-800 transition"
              >
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { name: 'Homecare Devices', displayName: 'Diagnostics', count: '150+ Products', icon: <Activity className="w-5 h-5 text-brand-blue" /> },
                { name: 'Dental Equipment', displayName: 'Dental', count: '40+ Products', icon: <Sparkles className="w-5 h-5 text-brand-orange" /> },
                { name: 'Consumables', displayName: 'Consumables', count: '500+ Products', icon: <ShoppingCart className="w-5 h-5 text-offer-red" /> },
                { name: 'Medical Equipment', displayName: 'Equipment', count: '120+ Products', icon: <Layers className="w-5 h-5 text-medical-blue" /> },
                { name: 'Hospital Furniture', displayName: 'Furniture', count: '80+ Products', icon: <Info className="w-5 h-5 text-brand-orange" /> },
                { name: 'Laboratory Equipment', displayName: 'Laboratory', count: '95+ Products', icon: <CheckCircle className="w-5 h-5 text-highlight-green" /> },
                { name: 'Surgical Instruments', displayName: 'Surgical', count: '250+ Products', icon: <Scale className="w-5 h-5 text-[#be123c]" /> },
              ].map((item) => {
                const isActive = selectedCategoryName === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      onCategorySelect(item.name);
                      const el = document.getElementById('marketplace-anchor');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`p-4 rounded-[8px] border text-left transition-all duration-300 flex flex-col justify-between min-h-[135px] group relative overflow-hidden cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 border-slate-900 scale-[1.02] shadow-md' 
                        : 'bg-white border-card-border hover:border-slate-400 hover:-translate-y-[3px] hover:shadow-md'
                    }`}
                  >
                    <div className="absolute top-[-20px] right-[-20px] w-16 h-16 rounded-full bg-slate-500/5 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                    <div className={`p-2 rounded-xl w-fit ${isActive ? 'bg-white/10 text-white' : 'bg-slate-50'}`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className={`text-[15px] font-semibold tracking-tight leading-snug ${isActive ? 'text-white' : 'text-medical-blue'}`}>
                        {item.displayName}
                      </h4>
                      <p className={`text-[12px] mt-1 leading-none ${isActive ? 'text-white/70' : 'text-[#777777]'}`}>
                        {item.count}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shop by Brand (Horizontal Directory) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Shop by Brand</span>
              <span className="text-[10px] text-teal-600 font-normal">Click brand to filter approved products</span>
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
              <button
                onClick={() => setFilterBrand('')}
                className={`px-5 py-3 rounded-2xl border text-xs font-semibold shrink-0 transition flex items-center gap-2 ${
                  !filterBrand
                    ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                All Brands
              </button>
              {brands.map((brd) => {
                const isActive = filterBrand.toLowerCase() === brd.name.toLowerCase();
                return (
                  <button
                    key={brd.id}
                    onClick={() => setFilterBrand(isActive ? '' : brd.name)}
                    className={`px-5 py-3 rounded-2xl border text-xs font-semibold shrink-0 transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {brd.logo && <img src={brd.logo} alt="" className="w-4 h-4 rounded object-contain" />}
                    <span>{brd.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Marketplace catalog anchor */}
          <div id="marketplace-anchor" className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Filters Sidebar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-teal-700" />
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
              <div className="p-3.5 bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-xl border border-amber-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-800 leading-tight">Verified Trust Seal Only</span>
                </div>
                <input
                  type="checkbox"
                  checked={filterTrustSealOnly}
                  onChange={(e) => setFilterTrustSealOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* In Stock Only Toggle Filter */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 leading-tight">In Stock Only</span>
                </div>
                <input
                  type="checkbox"
                  checked={filterInStockOnly}
                  onChange={(e) => setFilterInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Category Dropdown Filter */}
              <div className="space-y-1.5 text-xs font-semibold">
                <label className="text-slate-500">Filter by Category</label>
                <select
                  value={selectedCategoryName}
                  onChange={(e) => onCategorySelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand Dropdown Filter */}
              <div className="space-y-1.5 text-xs font-semibold">
                <label className="text-slate-500">Filter by Brand</label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
                >
                  <option value="">All Brands</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div className="space-y-1.5 text-xs font-semibold">
                <label className="text-slate-500">Minimum Rating</label>
                <select
                  value={filterMinRating}
                  onChange={(e) => setFilterMinRating(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4★ & Above</option>
                  <option value={4.5}>4.5★ & Above</option>
                  <option value={4.8}>4.8★ & Above</option>
                </select>
              </div>

              {/* Manufacturer / Country Filter */}
              <div className="space-y-1.5 text-xs font-semibold">
                <label className="text-slate-500">Country / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. India, Germany..."
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
                />
              </div>

              {/* Price Range Filter */}
              <div className="space-y-1.5 text-xs font-semibold">
                <div className="flex justify-between text-slate-500">
                  <span>Price (Max Limit)</span>
                  <span className="font-mono text-teal-800">₹{filterPriceRange.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={500000}
                  step={5000}
                  value={filterPriceRange}
                  onChange={(e) => setFilterPriceRange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg cursor-pointer accent-teal-700"
                />
              </div>

              {/* MOQ limits */}
              <div className="space-y-1.5 text-xs font-semibold">
                <div className="flex justify-between text-slate-500">
                  <span>MOQ Requirement</span>
                  <span className="font-mono text-slate-700">&le; {filterMoq} units</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={5}
                  value={filterMoq}
                  onChange={(e) => setFilterMoq(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg cursor-pointer accent-teal-700"
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="lg:col-span-3 space-y-4">
              {isAiSearching && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-pulse shadow-sm ${
                  isDarkMode 
                    ? 'bg-teal-950/20 border-teal-850/50 text-teal-300' 
                    : 'bg-teal-50 border-teal-100 text-teal-800'
                }`}>
                  <div className="flex items-center gap-2.5 text-xs font-semibold">
                    <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                    <span>Gemini AI is semantic-matching the clinical catalog for "{searchQuery}"...</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-teal-500/10 px-2 py-0.5 rounded tracking-wider">Deep Semantic Mode</span>
                </div>
              )}

              {searchQuery && !isAiSearching && aiSearchResults.length > 0 && (
                <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-sm ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-300' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    <span>Gemini AI successfully matched and sorted {filteredProducts.length} clinical instruments matching your query.</span>
                  </div>
                  <button 
                    onClick={onClearSearch}
                    className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <SlidersHorizontal className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No matching certified clinical products found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((p) => {
                    const hasWish = wishlist.includes(p.id);
                    const hasComp = compareList.some(item => item.id === p.id);
                    const aiMatch = aiSearchResults.find(m => m.productId === p.id);
                    const productVendor = vendors.find(v => v.id === p.vendorId || v.companyName === p.vendorName);
                    return (
                      <div
                        key={p.id}
                        className={`rounded-[8px] border overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:-translate-y-[3px] hover:shadow-md ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-100'
                            : 'bg-white border-card-border text-slate-800'
                        }`}
                      >
                        {/* Image banner */}
                        <div className="relative bg-slate-100 h-44 overflow-hidden shrink-0">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {aiMatch && (
                            <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse z-10">
                              <Sparkles className="w-3 h-3 text-yellow-300 fill-current" />
                              {aiMatch.relevanceScore}% Clinical Match
                            </span>
                          )}
                          <span className="absolute bottom-2.5 left-2.5 bg-offer-red text-white text-[10px] font-black px-2.5 py-1 rounded-[4px] shadow-md z-10 uppercase tracking-wider">
                            EXTRA {p.discountPercentage || 5}% OFF
                          </span>
                          <button
                            onClick={() => handleToggleWishlist(p.id)}
                            className={`p-1.5 rounded-full absolute top-2.5 right-2.5 transition ${
                              hasWish ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 hover:text-rose-500 shadow'
                            }`}
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
                          <div>
                            <div className="flex items-center justify-between gap-1.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
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
                              className={`font-bold mt-1 line-clamp-1 hover:text-teal-400 hover:underline cursor-pointer ${
                                isDarkMode ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {p.name}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                              <Building className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">Supplier: <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{p.vendorName || productVendor?.companyName || 'Verified Partner'}</strong></span>
                            </div>
                            <p className={`text-[11px] line-clamp-2 mt-1 leading-relaxed ${
                              isDarkMode ? 'text-slate-300' : 'text-slate-500'
                            }`}>
                              {p.description}
                            </p>

                            {/* AI Semantic Search Insight */}
                            {aiMatch && (
                              <div className={`mt-2.5 p-2 rounded-lg text-[10px] flex gap-1.5 items-start border leading-normal ${
                                isDarkMode 
                                  ? 'bg-teal-950/30 text-teal-300 border-teal-850/50' 
                                  : 'bg-teal-50 text-teal-800 border-teal-100'
                              }`}>
                                <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Clinical Insight: </span>
                                  {aiMatch.aiInsight}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className={`border-t pt-2 flex items-center justify-between ${
                            isDarkMode ? 'border-slate-800' : 'border-slate-50'
                          }`}>
                            <div>
                              <span className="text-slate-400 text-[10px] block">Price (Excl Tax)</span>
                              <span className={`text-sm font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-800'}`}>
                                ₹{p.salePrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 text-[10px] block">MOQ Requirement</span>
                              <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                {p.moq} unit(s)
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
                            className={`flex items-center gap-1 text-[10px] font-bold py-1 px-2.5 rounded transition-colors ${
                              hasComp 
                                ? 'bg-orange-500 text-white' 
                                : isDarkMode 
                                  ? 'text-slate-400 hover:bg-slate-800' 
                                  : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <Scale className="w-3.5 h-3.5" />
                            {hasComp ? 'Comparing' : 'Compare'}
                          </button>
                          <button
                            onClick={() => handleAddToCart(p)}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1 transition text-[10px] uppercase tracking-wide cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Procure
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Side by side comparison drawer */}
          {compareList.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl p-6 space-y-4 max-w-4xl mx-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-5 h-5 text-teal-700 animate-pulse" />
                  Biomedical Comparison Dashboard ({compareList.length}/3)
                </h3>
                <button onClick={() => onUpdateCompare([])} className="text-xs text-rose-600 font-semibold uppercase">
                  Clear Compare List
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {compareList.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-100 space-y-3 relative">
                    <button
                      onClick={() => handleToggleCompare(item)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 font-bold"
                    >
                      &times;
                    </button>
                    <h4 className="font-bold text-slate-900 truncate pr-4">{item.name}</h4>
                    <p className="text-[10px] text-teal-700 uppercase font-bold">{item.brand}</p>
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <p className="text-slate-500 flex justify-between">
                        <span>Price (INR)</span>
                        <strong className="text-emerald-700 font-mono">₹{item.salePrice.toLocaleString()}</strong>
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
                    setSelectedPayMethod('');
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
                <h3 className="text-base font-bold text-slate-950 uppercase tracking-wide">Procurement Clearing & Checkout</h3>
                <p className="text-xs text-slate-400 mt-1">Complete your B2B corporate clinical procurement clearing</p>
              </div>

              <form onSubmit={handleProceedToPayment} className="space-y-4 text-xs font-semibold">
                
                {/* Shipping Location fields */}
                <div className="space-y-3">
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
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.pincode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Payment Mode Selection */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select B2B Clearing Method *</h4>
                    {!selectedPayMethod && (
                      <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        Selection Required *
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {paymentSettings.razorpayEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedPayMethod('razorpay')}
                        className={`p-3 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          selectedPayMethod === 'razorpay'
                            ? 'bg-teal-50 border-teal-600 text-teal-800 font-bold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-teal-700" />
                        <span className="text-[10px] uppercase tracking-wider">Razorpay</span>
                      </button>
                    )}
                    {paymentSettings.upiEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedPayMethod('upi')}
                        className={`p-3 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          selectedPayMethod === 'upi'
                            ? 'bg-teal-50 border-teal-600 text-teal-800 font-bold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="w-5 h-5 text-teal-700" />
                        <span className="text-[10px] uppercase tracking-wider">UPI</span>
                      </button>
                    )}
                    {paymentSettings.creditCardEnabled !== false && (
                      <button
                        type="button"
                        onClick={() => setSelectedPayMethod('creditCard')}
                        className={`p-3 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          selectedPayMethod === 'creditCard'
                            ? 'bg-teal-50 border-teal-600 text-teal-800 font-bold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-teal-700" />
                        <span className="text-[10px] uppercase tracking-wider">Credit Card</span>
                      </button>
                    )}
                    {paymentSettings.debitCardEnabled !== false && (
                      <button
                        type="button"
                        onClick={() => setSelectedPayMethod('debitCard')}
                        className={`p-3 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          selectedPayMethod === 'debitCard'
                            ? 'bg-teal-50 border-teal-600 text-teal-800 font-bold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-teal-700" />
                        <span className="text-[10px] uppercase tracking-wider">Debit Card</span>
                      </button>
                    )}
                    {(paymentSettings.netBankingEnabled !== false || paymentSettings.bankEnabled) && (
                      <button
                        type="button"
                        onClick={() => setSelectedPayMethod('netBanking')}
                        className={`p-3 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          selectedPayMethod === 'netBanking' || selectedPayMethod === 'bank'
                            ? 'bg-teal-50 border-teal-600 text-teal-800 font-bold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Building className="w-5 h-5 text-teal-700" />
                        <span className="text-[10px] uppercase tracking-wider">Net Banking</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Payment Forms and Details */}
                {selectedPayMethod === 'razorpay' && (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h5 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Razorpay Secured Instrument</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['UPI', 'Credit Card', 'Debit Card', 'Net Banking'] as const).map((method) => {
                        const isActive = razorpayMethod === method;
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setRazorpayMethod(method)}
                            className={`py-2 px-2.5 rounded-lg border text-center text-[10px] transition ${
                              isActive
                                ? 'bg-teal-700 border-teal-700 text-white font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {method}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedPayMethod === 'upi' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* QR Code Card */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md flex flex-col items-center justify-center shrink-0 w-48 sm:w-56 transition hover:shadow-lg">
                        {paymentSettings.upiQrCodeUrl ? (
                          <img src={paymentSettings.upiQrCodeUrl} alt="Slice UPI QR Code" className="w-full h-auto object-contain rounded-lg" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-44 h-44 bg-slate-100 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300">
                            <QrCode className="w-10 h-10 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Scan to Pay</span>
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 space-y-3 text-xs w-full">
                        <div className="bg-purple-50/80 border border-purple-200/60 rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">UPI Payment App</span>
                            <span className="text-sm font-black text-purple-950">Slice / Any UPI App</span>
                          </div>
                          <span className="px-2.5 py-1 bg-purple-700 text-white rounded-lg text-[10px] font-bold">INSTANT PAY</span>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Account Holder Name</p>
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
                        {paymentSettings.upiInstructions && (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-xs shadow-sm leading-relaxed">
                            <span className="font-bold text-teal-800 block text-[10px] uppercase tracking-wider mb-0.5">Instructions:</span>
                            {paymentSettings.upiInstructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedPayMethod === 'creditCard' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Card Holder Name</p>
                        <p className="text-slate-800 font-bold">{paymentSettings.creditCardHolderName || 'HealNex Medi Bazar Pvt Ltd'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Bank / Gateway</p>
                        <p className="text-slate-800 font-bold">{paymentSettings.creditCardBankName || 'HDFC Corporate Card Clearing'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Card Number / Link Reference</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="bg-teal-50 text-teal-900 border border-teal-100 px-2 py-1 rounded font-mono text-xs">{paymentSettings.creditCardNumber || '4532 •••• •••• 8890'}</code>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Expiry</p>
                        <p className="text-slate-800 font-bold font-mono">{paymentSettings.creditCardExpiry || '12/28'}</p>
                      </div>
                    </div>
                    {paymentSettings.creditCardInstructions && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs">
                        <span className="font-bold text-teal-800 block text-[10px] uppercase">Instructions:</span>
                        {paymentSettings.creditCardInstructions}
                      </div>
                    )}
                  </div>
                )}

                {selectedPayMethod === 'debitCard' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Card Holder Name</p>
                        <p className="text-slate-800 font-bold">{paymentSettings.debitCardHolderName || 'HealNex Medi Bazar Pvt Ltd'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Bank Name</p>
                        <p className="text-slate-800 font-bold">{paymentSettings.debitCardBankName || 'ICICI Bank B2B Merchant Clearing'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Card Number</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="bg-teal-50 text-teal-900 border border-teal-100 px-2 py-1 rounded font-mono text-xs">{paymentSettings.debitCardNumber || '5591 •••• •••• 4421'}</code>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Expiry</p>
                        <p className="text-slate-800 font-bold font-mono">{paymentSettings.debitCardExpiry || '10/27'}</p>
                      </div>
                    </div>
                    {paymentSettings.debitCardInstructions && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs">
                        <span className="font-bold text-teal-800 block text-[10px] uppercase">Instructions:</span>
                        {paymentSettings.debitCardInstructions}
                      </div>
                    )}
                  </div>
                )}

                {(selectedPayMethod === 'bank' || selectedPayMethod === 'netBanking') && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Account Holder Name</p>
                          <p className="text-slate-800 font-bold">{paymentSettings.netBankingHolderName || paymentSettings.bankHolderName || 'HealNex Medi Bazar Private Limited'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Bank Name</p>
                          <p className="text-slate-800 font-bold">{paymentSettings.netBankingBankName || paymentSettings.bankName || 'HDFC Bank Ltd'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Branch Name</p>
                          <p className="text-slate-800 font-bold">{paymentSettings.netBankingBranch || paymentSettings.bankBranch || 'Senapati Bapat Road, Pune'}</p>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Account Number</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <code className="bg-teal-50 text-teal-900 border border-teal-100 px-2 py-1 rounded font-mono text-xs">{paymentSettings.netBankingAccountNumber || paymentSettings.bankAccountNumber || '50200098765432'}</code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentSettings.netBankingAccountNumber || paymentSettings.bankAccountNumber || '50200098765432');
                                addToast('Account Number copied!', 'success');
                              }}
                              className="p-1 text-teal-700 hover:bg-teal-100 rounded transition"
                              title="Copy Account Number"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">IFSC Code</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <code className="bg-teal-50 text-teal-900 border border-teal-100 px-2 py-1 rounded font-mono text-xs">{paymentSettings.netBankingIfsc || paymentSettings.bankIfsc || 'HDFC0001234'}</code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentSettings.netBankingIfsc || paymentSettings.bankIfsc || 'HDFC0001234');
                                addToast('IFSC Code copied!', 'success');
                              }}
                              className="p-1 text-teal-700 hover:bg-teal-100 rounded transition"
                              title="Copy IFSC Code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {(paymentSettings.netBankingInstructions || paymentSettings.bankInstructions) && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs">
                        <span className="font-bold text-teal-800 block text-[10px] uppercase">Instructions:</span>
                        {paymentSettings.netBankingInstructions || paymentSettings.bankInstructions}
                      </div>
                    )}
                    {(paymentSettings.netBankingQrCodeUrl || paymentSettings.bankQrCodeUrl) && (
                      <div className="border-t border-slate-200 pt-3 flex items-center gap-4">
                        <img src={paymentSettings.netBankingQrCodeUrl || paymentSettings.bankQrCodeUrl} alt="Bank QR" className="w-20 h-20 object-contain border border-slate-200 rounded p-1 bg-white" referrerPolicy="no-referrer" />
                        <div className="text-[10px] text-slate-500">
                          <p className="font-bold text-slate-700 uppercase text-[9px]">Banking QR Code</p>
                          <p className="mt-0.5">Scan to make instant transfer directly to the bank account.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Payment Proof Submission Fields (Required for all B2B orders) */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-teal-700" />
                      Submit Payment Receipt Screenshot
                    </h4>
                    <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      Mandatory Required *
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Customer payment screenshot upload is strictly required for all orders. Complete your transfer or gateway clearing first, then capture and attach your receipt screenshot below.
                  </p>
                    
                    {/* File Dropzone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                        dragActive 
                          ? 'border-teal-600 bg-teal-50/50' 
                          : manualProofUrl 
                            ? 'border-emerald-500 bg-emerald-50/20' 
                            : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
                      }`}
                      onClick={() => document.getElementById('manual-receipt-input')?.click()}
                    >
                      <input
                        id="manual-receipt-input"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      
                      {manualProofUrl ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm animate-bounce">
                            <Check className="w-6 h-6 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Receipt Screen Attached</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">{manualProofFileName || 'payment_proof_receipt.png'}</p>
                          </div>
                          {manualProofUrl && (
                            <img src={manualProofUrl} alt="Receipt Thumb" className="w-16 h-16 object-cover mx-auto rounded border border-slate-200 mt-2 shadow-sm" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setManualProofUrl('');
                              setManualProofFileName('');
                            }}
                            className="text-[10px] text-red-500 hover:underline mt-1"
                          >
                            Remove and Re-upload
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-xs font-semibold text-slate-700">Drag & drop receipt screenshot or <span className="text-teal-700 hover:underline">browse files</span></p>
                          <p className="text-[9px] text-slate-400 uppercase">JPG, PNG, or PDF (Limit 10MB)</p>
                        </div>
                      )}
                    </div>

                    {/* Transaction Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="text-slate-400 block mb-1">Transaction ID / UTR Number {selectedPayMethod !== 'razorpay' ? '*' : '(Optional)'}</label>
                        <input
                          type="text"
                          required={selectedPayMethod !== 'razorpay'}
                          placeholder="e.g. UPI9473827183 or UTR84739281"
                          value={manualTxId}
                          onChange={(e) => setManualTxId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition font-mono uppercase text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Reference Note (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Paid via mobile App"
                          value={manualNote}
                          onChange={(e) => setManualNote(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition text-xs"
                        />
                      </div>
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

                <div className="space-y-2 pt-2">
                  {!manualProofUrl && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5 animate-pulse">
                      <span>⚠️ Please attach your payment receipt screenshot above to unlock order submission.</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('cart')}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center cursor-pointer transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!manualProofUrl || !selectedPayMethod || (selectedPayMethod !== 'razorpay' && !manualTxId.trim())}
                      className="w-2/3 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none text-white font-bold py-2.5 rounded-xl text-center uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <IndianRupee className="w-4 h-4" />
                      {selectedPayMethod === 'razorpay' ? 'Submit Secure Payment' : 'Submit Proof & Place Order'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {checkoutStep === 'processing' && (
            <div className="lg:col-span-3 text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
              <Loader2 className="w-12 h-12 text-teal-700 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Contacting Razorpay Secure Gateway...</h3>
              <p className="text-xs text-slate-400">Verifying commercial accounts and clearing clinical consignment authorization</p>
            </div>
          )}

          {checkoutStep === 'success' && createdOrder && (
            <div className="lg:col-span-3 text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-lg mx-auto p-6 animate-fade-in">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Payment Securely Cleared!</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your procurement order <strong className="text-slate-800">#{createdOrder.id}</strong> has been logged. 
                  A notifications dispatch alert was triggered to the supplier network.
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
                  <span>Razorpay Reference No:</span>
                  <span className="font-mono text-slate-600">{createdOrder.paymentId}</span>
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded font-bold font-mono">
                              ID: {rfq.id}
                            </span>
                            {(() => {
                              switch (rfq.status) {
                                case 'PENDING_ADMIN_REVIEW':
                                  return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">Pending Administrative Vetting</span>;
                                case 'OPEN_TO_VENDORS':
                                  return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">Open to Qualified Suppliers</span>;
                                case 'QUOTED':
                                  return <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[10px] font-bold">Bids Received ({relatedQuotes.length})</span>;
                                case 'PENDING_PAYMENT_VERIFICATION':
                                  return <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">Awaiting Escrow Payment Verification</span>;
                                case 'PAYMENT_VERIFIED_ORDER_PLACED':
                                  return <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold">✓ Payment Verified & Order Dispatched</span>;
                                case 'Closed':
                                  return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">Closed</span>;
                                default:
                                  return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">{rfq.status || 'Open'}</span>;
                              }
                            })()}
                          </div>
                          <h4 className="font-bold text-slate-900 mt-2.5 text-sm sm:text-base">{rfq.productName}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal">{rfq.description}</p>
                          <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-400 font-semibold">
                            <span>Quantity: <strong className="text-slate-700">{rfq.quantity} units</strong></span>
                            <span>Budget: <strong className="text-emerald-700">₹{rfq.budget.toLocaleString()}</strong></span>
                            <span>Destination: <strong className="text-slate-700">{rfq.deliveryLocation}</strong></span>
                          </div>
                        </div>

                        {(rfq.status === 'Open' || rfq.status === 'OPEN_TO_VENDORS' || rfq.status === 'QUOTED') && relatedQuotes.length > 0 && (
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
                      <td className="py-4 px-3 text-right font-mono text-teal-800 font-bold">
                        ₹{quo.totalPrice.toLocaleString('en-IN')}
                        <span className="block text-[9px] text-slate-400 font-normal">+{quo.gstRate !== undefined ? quo.gstRate : 12}% GST</span>
                      </td>
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

      {/* Secure B2B Escrow Payment Gateway Session Modal */}
      {escrowPaymentSession && (() => {
        const { quo, rfq } = escrowPaymentSession;
        const subtotal = quo.totalPrice;
        const commissionRate = quo.commissionRateApplied || 10;
        const basePrice = quo.vendor_base_price || Math.round(quo.pricePerUnit / (1 + commissionRate / 100));
        const commissionFee = quo.platform_fee || Math.round(quo.pricePerUnit - basePrice);
        const qGstRate = quo.gstRate !== undefined ? quo.gstRate : 12;
        const gstAmount = subtotal * (qGstRate / 100);
        const totalPayable = subtotal + gstAmount;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
              
              {/* Header */}
              <div className="bg-slate-900 text-white px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">HealNex Escrow</h3>
                    <h2 className="text-sm font-bold text-white">Secure B2B Payment Gateway</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setEscrowPaymentSession(null)}
                  className="text-slate-400 hover:text-white font-bold text-xl leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Progress Tracker */}
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between text-[9px] uppercase font-black text-slate-400 tracking-wider">
                <span className="text-emerald-600 flex items-center gap-1">● 1. Accept Bid</span>
                <span className="text-blue-600 flex items-center gap-1">● 2. Escrow Deposit</span>
                <span className="flex items-center gap-1">○ 3. Admin Release</span>
                <span className="flex items-center gap-1">○ 4. Dispatch</span>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                
                {/* Product Summary */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Procurement</p>
                  <h4 className="font-bold text-slate-900 text-sm">{rfq.productName}</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">{rfq.description.slice(0, 120)}...</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-200">
                    <span>Quantity: <strong className="text-slate-800">{rfq.quantity} units</strong></span>
                    <span>Supplier: <strong className="text-teal-700">{quo.companyName}</strong></span>
                  </div>
                </div>

                {/* Ledger Financial breakdown */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inter-Ledger Commercial Breakdown</p>
                  
                  <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-normal text-slate-500">Negotiated Vendor Base Price (per unit)</span>
                      <span className="font-mono text-slate-700">₹{basePrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-normal text-slate-500">Platform Escrow Commission ({commissionRate}%)</span>
                      <span className="font-mono text-teal-700">+₹{commissionFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="font-bold text-slate-900">Final Certified Price (per unit)</span>
                      <span className="font-mono font-bold text-slate-900">₹{quo.pricePerUnit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="font-normal text-slate-500">Subtotal ({rfq.quantity} units)</span>
                      <span className="font-mono text-slate-700">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-normal text-slate-500">Vendor Specified GST ({qGstRate}%)</span>
                      <span className="font-mono text-slate-700">₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    
                    {/* Grand Total */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50">
                      <div>
                        <span className="font-black text-[10px] text-emerald-800 uppercase tracking-wider block">Escrow Amount Due</span>
                        <span className="text-[9px] text-slate-400 font-normal">Held securely until verification</span>
                      </div>
                      <span className="font-mono font-black text-base text-emerald-700">₹{totalPayable.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Secure Notice */}
                <div className="flex gap-2 p-3 bg-blue-50/80 text-blue-800 rounded-xl text-[10px] font-semibold leading-normal border border-blue-100">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                  <p>Escrow Guarantee: Funds are deposited into a secure non-custodial clearing account. The payment is verified by Healnex Admin, and released to the supplier only upon order generation &amp; shipment tracking initiation.</p>
                </div>

                {/* Secure UPI QR Payment Box */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 text-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escrow Payment Gateway</p>
                    <h4 className="text-xs font-bold text-slate-800">Scan QR Code via any UPI App to Pay</h4>
                    <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM, or slice app supported</p>
                  </div>

                  {/* QR Image */}
                  <div className="relative inline-block bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm mx-auto">
                    <img 
                      src={paymentSettings.upiQrCodeUrl || getSliceUpiQrDataUrl(paymentSettings.upiId || '9149758743@slc', paymentSettings.upiHolderName || 'Warisul Islam')} 
                      alt="UPI QR Code" 
                      className="w-44 h-44 mx-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                      slice
                    </div>
                  </div>

                  {/* UPI Details Card */}
                  <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 max-w-sm mx-auto flex items-center justify-between gap-3 text-left">
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Official UPI Escrow Handle</span>
                      <span className="font-mono text-xs font-black text-slate-900">{paymentSettings.upiId || '9149758743@slc'}</span>
                      <span className="text-[9px] text-slate-500 block">Holder: {paymentSettings.upiHolderName || 'Warisul Islam'}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const vpa = paymentSettings.upiId || '9149758743@slc';
                        navigator.clipboard.writeText(vpa);
                        addToast('UPI ID copied to clipboard!', 'info');
                      }}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>

                  {/* Action Triggers */}
                  <div className="pt-2 space-y-2">
                    <button 
                      onClick={() => handleConfirmEscrowPayment('UPI QR Instant')}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>I Have Transferred ₹{totalPayable.toLocaleString('en-IN')} (Submit for Verification)</span>
                    </button>

                    <div className="flex items-center justify-center gap-2 py-1">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Demo / Sandbox Sandbox Tool</span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <button 
                      onClick={() => handleConfirmEscrowPayment('Admin Direct Clearance (Sandbox Bypass)')}
                      className="w-full py-2.5 px-4 border border-dashed border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100/80 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer animate-pulse"
                    >
                      <span>⚡ Admin Direct Bypass (Instant Order Clearance)</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

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
                  return o.status === 'Awaiting Payment Verification' || o.status === 'Pending Payment';
                }
                if (ordersFilter === 'Active') {
                  return ['Order Sent to Vendor', 'Vendor Accepted', 'Processing', 'Shipped'].includes(o.status);
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
                      return o.status === 'Awaiting Payment Verification' || o.status === 'Pending Payment';
                    }
                    if (ordersFilter === 'Active') {
                      return ['Order Sent to Vendor', 'Vendor Accepted', 'Processing', 'Shipped'].includes(o.status);
                    }
                    if (ordersFilter === 'Completed') {
                      return o.status === 'Delivered' || o.status === 'Completed';
                    }
                    return true;
                  })
                  .map((order) => {
                    const isAwaitingVerification = order.status === 'Awaiting Payment Verification';
                    const isPendingPayment = order.status === 'Pending Payment';
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
                                    setManualProofUrl(order.paymentProofUrl || '');
                                    setManualProofFileName('previous_payment_receipt.png');
                                  }}
                                  className="w-full bg-teal-50 border border-teal-200 text-teal-800 font-bold py-2 rounded-xl text-center uppercase tracking-wider hover:bg-teal-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Upload / Re-submit Payment Proof
                                </button>
                              ) : (
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h5 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Submit Payment Certificate</h5>
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

                                  {/* Re-upload uploader zone */}
                                  <div
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-xl p-5 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                                      dragActive 
                                        ? 'border-teal-600 bg-teal-50/50' 
                                        : manualProofUrl 
                                          ? 'border-emerald-500 bg-emerald-50/20' 
                                          : 'border-slate-300 bg-white hover:bg-slate-100/50'
                                    }`}
                                    onClick={() => document.getElementById(`manual-reupload-input-${order.id}`)?.click()}
                                  >
                                    <input
                                      id={`manual-reupload-input-${order.id}`}
                                      type="file"
                                      accept=".jpg,.jpeg,.png,.pdf"
                                      className="hidden"
                                      onChange={handleFileChange}
                                    />
                                    
                                    {manualProofUrl ? (
                                      <div className="space-y-1.5">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                                          <Check className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <p className="text-[11px] font-bold text-slate-800">Screenshot Attached</p>
                                          <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">{manualProofFileName || 'payment_receipt.png'}</p>
                                        </div>
                                        {manualProofUrl && (
                                          <img src={manualProofUrl} alt="Receipt Preview" className="w-14 h-14 object-cover mx-auto rounded border border-slate-200 mt-1 shadow-sm" />
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                                        <p className="text-[11px] font-semibold text-slate-700">Drag receipt screenshot or browse files <span className="text-rose-600 font-bold">*</span></p>
                                        <p className="text-[8px] text-rose-600 font-bold uppercase tracking-wider">Screenshot Required (Max 10MB)</p>
                                      </div>
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

                                  <button
                                    onClick={() => {
                                      // process submit
                                      if (!manualTxId.trim()) {
                                        addToast('Please enter the Transaction ID / UTR Number.', 'error');
                                        return;
                                      }
                                      if (!manualProofUrl) {
                                        addToast('Payment receipt screenshot is strictly required! Please attach a valid screenshot.', 'error');
                                        return;
                                      }
                                      
                                      const currentOrders = dbLocal.getOrders();
                                      const idx = currentOrders.findIndex(o => o.id === order.id);
                                      if (idx > -1) {
                                        const originalOrder = currentOrders[idx];
                                        const updatedOrder: Order = {
                                          ...originalOrder,
                                          status: 'Awaiting Payment Verification',
                                          paymentTxId: manualTxId.trim(),
                                          paymentProofUrl: manualProofUrl,
                                          paymentNote: manualNote.trim(),
                                          paymentRejectionReason: undefined, // Clear rejection reason
                                          timeline: [
                                            ...(originalOrder.timeline || []),
                                            {
                                              status: 'Awaiting Payment Verification',
                                              time: new Date().toISOString(),
                                              note: `Payment proof re-submitted by customer with transaction ID ${manualTxId.trim()}.`
                                            }
                                          ],
                                          paymentVerificationLogs: [
                                            ...(originalOrder.paymentVerificationLogs || []),
                                            {
                                              action: 'submit',
                                              performedBy: currentUser?.name || 'Customer',
                                              performedByRole: 'customer',
                                              timestamp: new Date().toISOString(),
                                              note: `Resubmitted payment proof after admin feedback.`
                                            }
                                          ]
                                        };
                                        currentOrders[idx] = updatedOrder;
                                        dbLocal.saveOrders(currentOrders);
                                        
                                        // Alert Admin
                                        dbLocal.addNotification(
                                          'admin',
                                          `Payment Proof Re-submitted`,
                                          `Customer resubmitted payment proof for Order #${order.id} with UTR ${manualTxId.trim()}.`,
                                          'payment_updated'
                                        );
                                        
                                        addToast('Payment proof submitted successfully!', 'success');
                                        // reset state
                                        setManualTxId('');
                                        setManualNote('');
                                        setManualProofUrl('');
                                        setManualProofFileName('');
                                        setReuploadingOrderId(null);
                                        loadData();
                                      }
                                    }}
                                    className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 rounded-xl text-center uppercase tracking-wider transition text-[11px] cursor-pointer shadow-sm"
                                  >
                                    Submit Clearance Receipt
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

      {/* Floating Cart Bar */}
      {cart.length > 0 && currentView !== 'cart' && currentView !== 'checkout' && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl bg-slate-900/95 backdrop-blur-md text-white rounded-2xl sm:rounded-3xl p-4 shadow-2xl border border-slate-800 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-400 text-teal-950 rounded-xl relative shrink-0">
              <ShoppingCart className="w-5 h-5 text-slate-950" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 font-mono">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-teal-300 uppercase tracking-widest font-bold">HealNex Cart</p>
              <p className="text-sm font-black text-white font-mono">
                ₹{cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('cart')}
            className="bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-teal-950 text-xs font-black px-5 py-3 rounded-xl transition shadow-lg flex items-center gap-1.5 uppercase tracking-wider transform active:scale-95 cursor-pointer"
          >
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      )}

      {/* Mobile-Optimized Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-4 py-2 flex justify-around items-center text-slate-600">
        {[
          { id: 'marketplace', label: 'Bazar', icon: <Store className="w-5 h-5" /> },
          { id: 'rfqs', label: 'Tenders', icon: <FilePlus className="w-5 h-5" /> },
          { id: 'orders', label: 'Clearing', icon: <ClipboardList className="w-5 h-5" /> },
          { id: 'cart', label: 'Cart', icon: (
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </div>
          ) },
        ].map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id as any)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition duration-200 cursor-pointer ${
                isActive 
                  ? 'text-teal-700 font-bold scale-105' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-400'}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
