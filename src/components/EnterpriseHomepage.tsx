import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Product, Category, Brand, Review, Vendor, DealOfDay, PromoBanner } from '../types';
import { dbLocal } from '../db';
import { isCategoryMatch, calculateCategoryRelevanceScore } from '../utils/categoryMatcher';
import {
  Activity,
  ShieldCheck,
  Truck,
  Award,
  Headphones,
  RotateCcw,
  BadgeDollarSign,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Scale,
  Eye,
  ShoppingCart,
  Sparkles,
  Store,
  CheckCircle,
  Building,
  UserCheck,
  Smartphone,
  Mail,
  Send,
  Zap,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  FileText,
  MessageCircle,
  Percent,
  Check,
  Download,
  QrCode,
  ZoomIn,
  Flame,
  Bell,
  TrendingDown,
  Trash2,
  SlidersHorizontal,
  Filter,
  X,
  Search,
  RefreshCw,
  CheckSquare,
  Square,
  ArrowUpDown,
  Lock,
  Package,
  Phone
} from 'lucide-react';
import { ImageLightboxModal } from './ImageLightboxModal';
import { motion, AnimatePresence } from 'motion/react';

interface EnterpriseHomepageProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  vendors: Vendor[];
  reviews: Review[];
  selectedCategoryName: string;
  compareList?: Product[];
  onOpenCompareModal?: () => void;
  onCategorySelect: (catName: string) => void;
  onNavigate: (view: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickBuy?: (product: Product) => void;
  onAddToWishlist: (productId: string) => void;
  onAddToCompare: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onPriceAlert?: (product: Product) => void;
  onBecomeSeller?: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function EnterpriseHomepage({
  products,
  categories,
  brands,
  vendors,
  reviews,
  selectedCategoryName,
  compareList = [],
  onOpenCompareModal,
  onCategorySelect,
  onNavigate,
  onAddToCart,
  onQuickBuy,
  onAddToWishlist,
  onAddToCompare,
  onQuickView,
  onPriceAlert,
  onBecomeSeller,
  addToast
}: EnterpriseHomepageProps) {
  const [heroSlide, setHeroSlide] = useState(0);
  const [sidebarExpandedCategory, setSidebarExpandedCategory] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);
  const [savedPriceAlerts, setSavedPriceAlerts] = useState(dbLocal.getPriceAlerts());
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleDbUpdate = () => {
      setSavedPriceAlerts(dbLocal.getPriceAlerts());
    };
    window.addEventListener('healnex_db_update', handleDbUpdate);
    return () => window.removeEventListener('healnex_db_update', handleDbUpdate);
  }, []);
  const [dealOfDay, setDealOfDay] = useState<DealOfDay>(() => dbLocal.getDealOfDay());
  const [countdown, setCountdown] = useState({
    hours: dbLocal.getDealOfDay().hours || 14,
    mins: dbLocal.getDealOfDay().mins || 32,
    secs: dbLocal.getDealOfDay().secs || 45
  });

  const [socialLinks, setSocialLinks] = useState(() => dbLocal.getSocialLinks());
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(() => dbLocal.getPromoBanners());

  useEffect(() => {
    const handleSync = () => {
      const d = dbLocal.getDealOfDay();
      setDealOfDay(d);
      setCountdown({
        hours: d.hours ?? 14,
        mins: d.mins ?? 32,
        secs: d.secs ?? 45
      });
      setSocialLinks(dbLocal.getSocialLinks());
      setPromoBanners(dbLocal.getPromoBanners());
    };
    handleSync();
    window.addEventListener('healnex_db_update', handleSync);
    return () => window.removeEventListener('healnex_db_update', handleSync);
  }, []);

  // Marketplace Catalog Filter & Sorter State
  const [filterPriceMin, setFilterPriceMin] = useState<number>(0);
  const [filterPriceMax, setFilterPriceMax] = useState<number>(1000000000);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedWarranty, setSelectedWarranty] = useState<string>('all');
  const [filterVerifiedVendorsOnly, setFilterVerifiedVendorsOnly] = useState<boolean>(false);
  const [filterInStockOnly, setFilterInStockOnly] = useState<boolean>(false);
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [catalogSortBy, setCatalogSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating_desc' | 'warranty_desc' | 'moq_asc' | 'brand_asc' | 'newest'>('relevance');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>('');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState<string>('');
  // Catalog View Mode: 'category_wise' (Category-Wise Products Grid) vs 'grid' (Unified Single Grid)
  const [catalogViewMode, setCatalogViewMode] = useState<'category_wise' | 'grid'>('category_wise');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [categorySubFilter, setCategorySubFilter] = useState<Record<string, string>>({});

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleSetCategorySubFilter = (catName: string, subName: string) => {
    setCategorySubFilter(prev => ({
      ...prev,
      [catName]: prev[catName] === subName ? '' : subName
    }));
  };

  // Reset active subcategory sub-filter whenever the parent selectedCategoryName changes
  useEffect(() => {
    setSelectedSubcategoryFilter('');
  }, [selectedCategoryName]);

  // Extract dynamic list of brands present in products
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, number>();
    products.forEach(p => {
      if (p.brand && p.brand.trim()) {
        const b = p.brand.trim();
        brandMap.set(b, (brandMap.get(b) || 0) + 1);
      }
    });
    return Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [products]);

  const filteredAvailableBrands = useMemo(() => {
    if (!brandSearchQuery.trim()) return availableBrands;
    const q = brandSearchQuery.toLowerCase();
    return availableBrands.filter(b => b.name.toLowerCase().includes(q));
  }, [availableBrands, brandSearchQuery]);

  // Warranty parsing helper (extract numeric years for sorting & filtering)
  const parseWarrantyYears = (w?: string): number => {
    if (!w) return 1;
    const lower = w.toLowerCase();
    if (lower.includes('5') || lower.includes('five')) return 5;
    if (lower.includes('3') || lower.includes('three')) return 3;
    if (lower.includes('2') || lower.includes('two')) return 2;
    if (lower.includes('1') || lower.includes('one') || lower.includes('year') || lower.includes('standard')) return 1;
    if (lower.includes('6 month') || lower.includes('six month')) return 0.5;
    return 1;
  };

  // Verified vendor inspector
  const checkIsVerifiedVendor = (p: Product): boolean => {
    const v = vendors.find(item => item.id === p.vendorId || item.companyName?.toLowerCase() === p.vendorName?.toLowerCase());
    return Boolean(
      v?.trustSeal || 
      v?.isVerifiedSeller ||
      v?.status === 'Approved' || 
      (p as any).isVerifiedVendor || 
      p.vendorName?.toLowerCase().includes('certified') || 
      p.vendorName?.toLowerCase().includes('healnex') ||
      p.vendorName?.toLowerCase().includes('enterprise')
    );
  };

  // Active filter count for badges
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterPriceMin > 0 || filterPriceMax < 1000000000) count++;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedWarranty !== 'all') count++;
    if (filterVerifiedVendorsOnly) count++;
    if (filterInStockOnly) count++;
    if (filterMinRating > 0) count++;
    if (selectedCategoryName) count++;
    if (selectedSubcategoryFilter) count++;
    return count;
  }, [filterPriceMin, filterPriceMax, selectedBrands, selectedWarranty, filterVerifiedVendorsOnly, filterInStockOnly, filterMinRating, selectedCategoryName, selectedSubcategoryFilter]);

  const handleResetFilters = () => {
    setFilterPriceMin(0);
    setFilterPriceMax(1000000000);
    setSelectedBrands([]);
    setSelectedWarranty('all');
    setFilterVerifiedVendorsOnly(false);
    setFilterInStockOnly(false);
    setFilterMinRating(0);
    setCatalogSortBy('relevance');
    setSelectedSubcategoryFilter('');
    onCategorySelect('');
  };

  const toggleBrandFilter = (brandName: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandName) ? prev.filter(b => b !== brandName) : [...prev, brandName]
    );
  };

  // Computed catalog products reflecting all active filters, category & subcategory hoisting
  const filteredMarketplaceProducts = useMemo(() => {
    let list = products.filter(p => {
      // Category & Subcategory filter
      if (selectedCategoryName) {
        if (selectedSubcategoryFilter) {
          const subTarget = selectedSubcategoryFilter.trim().toLowerCase();
          const pSub = (p.subcategory || '').trim().toLowerCase();
          const pName = (p.name || '').trim().toLowerCase();
          const isSubMatch = pSub === subTarget || pName.includes(subTarget);
          if (!isSubMatch && !isCategoryMatch(p, selectedSubcategoryFilter, categories)) {
            return false;
          }
        } else if (!isCategoryMatch(p, selectedCategoryName, categories)) {
          return false;
        }
      }

      // Price filter
      const price = p.salePrice !== undefined ? p.salePrice : p.price || 0;
      if (price < filterPriceMin || price > filterPriceMax) {
        return false;
      }

      // Brand filter
      if (selectedBrands.length > 0) {
        const brandMatch = selectedBrands.some(b => b.toLowerCase() === (p.brand || '').trim().toLowerCase());
        if (!brandMatch) return false;
      }

      // Warranty filter
      if (selectedWarranty !== 'all') {
        const years = parseWarrantyYears(p.warranty);
        if (selectedWarranty === '1_year' && years < 1) return false;
        if (selectedWarranty === '2_years' && years < 2) return false;
        if (selectedWarranty === '3_years_plus' && years < 3) return false;
        if (selectedWarranty === '5_years_plus' && years < 5) return false;
      }

      // Verified vendor filter
      if (filterVerifiedVendorsOnly && !checkIsVerifiedVendor(p)) {
        return false;
      }

      // In stock only filter
      if (filterInStockOnly && (p.outOfStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0))) {
        return false;
      }

      // Rating filter
      if (filterMinRating > 0 && (p.rating || 4.8) < filterMinRating) {
        return false;
      }

      return true;
    });

    // Sorting
    const sorted = [...list];
    switch (catalogSortBy) {
      case 'price_asc':
        sorted.sort((a, b) => (a.salePrice || a.price || 0) - (b.salePrice || b.price || 0));
        break;
      case 'price_desc':
        sorted.sort((a, b) => (b.salePrice || b.price || 0) - (a.salePrice || a.price || 0));
        break;
      case 'rating_desc':
        sorted.sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
        break;
      case 'warranty_desc':
        sorted.sort((a, b) => parseWarrantyYears(b.warranty) - parseWarrantyYears(a.warranty));
        break;
      case 'moq_asc':
        sorted.sort((a, b) => (a.moq || 1) - (b.moq || 1));
        break;
      case 'brand_asc':
        sorted.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default:
        // When a category or subcategory is selected, sort highest matching items to the top
        if (selectedCategoryName || selectedSubcategoryFilter) {
          const effectiveTarget = selectedSubcategoryFilter || selectedCategoryName;
          sorted.sort((a, b) => {
            const scoreB = calculateCategoryRelevanceScore(b, effectiveTarget, categories);
            const scoreA = calculateCategoryRelevanceScore(a, effectiveTarget, categories);
            return scoreB - scoreA;
          });
        }
        break;
    }

    return sorted;
  }, [products, categories, selectedCategoryName, selectedSubcategoryFilter, filterPriceMin, filterPriceMax, selectedBrands, selectedWarranty, filterVerifiedVendorsOnly, filterInStockOnly, filterMinRating, catalogSortBy, vendors]);

  const handleCategoryClick = (catName: string) => {
    onCategorySelect(catName);
    setTimeout(() => {
      const el = document.getElementById('catalog-anchor');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // 500ms Hover Timer for Category Sidebar Auto-Expand
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSidebarCategoryMouseEnter = (catName: string) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      setSidebarExpandedCategory(catName);
    }, 500);
  };

  const handleSidebarCategoryMouseLeave = (catName: string) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setSidebarExpandedCategory(prev => (prev?.trim().toLowerCase() === catName.trim().toLowerCase() ? null : prev));
  };

  const handleSidebarCategoryClick = (e: React.MouseEvent, catName: string) => {
    e.stopPropagation();
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    const isExpanded = sidebarExpandedCategory?.trim().toLowerCase() === catName.trim().toLowerCase();
    setSidebarExpandedCategory(isExpanded ? null : catName);
    const isSelected = selectedCategoryName.trim().toLowerCase() === catName.trim().toLowerCase();
    handleCategoryClick(isSelected ? '' : catName);
  };

  const handleSubcategoryClick = (e: React.MouseEvent, subName: string) => {
    e.stopPropagation();
    handleCategoryClick(subName);
  };

  const PRESET_SUBCATEGORIES_MAP: Record<string, string[]> = useMemo(() => ({
    'diagnostic equipment': ['ECG Machine', 'Ultrasound Scanner', 'Patient Monitor', 'Defibrillator', 'X-Ray System', 'CT Scanner'],
    'patient monitoring': ['Multipara Monitor', 'Pulse Oximeter', 'Capnograph', 'Fetal Doppler', 'Temperature System'],
    'ecg machines': ['3-Channel ECG', '6-Channel ECG', '12-Channel ECG', 'Stress Test ECG', 'Holter Monitor'],
    'ultrasound': ['Color Doppler Ultrasound', 'Portable Ultrasound', '3D/4D Ultrasound', 'Echocardiography Machine'],
    'x-ray & imaging': ['Digital Radiography (DR)', 'C-Arm System', 'Mammography Machine', 'Dental X-Ray Unit'],
    'ct scan': ['16-Slice CT', '32-Slice CT', '64-Slice CT', '128-Slice Cardiac CT'],
    'mri systems': ['1.5T MRI Scanner', '3.0T High Field MRI', 'Open MRI System'],
    'laboratory equipment': ['Hematology Analyzer', 'Biochemistry Analyzer', 'Clinical Centrifuge', 'Laboratory Microscope'],
    'hospital furniture': ['5-Function ICU Bed', 'Motorized Patient Bed', 'Examination Couch', 'Hydraulic Stretcher'],
    'icu equipment': ['ICU Ventilator', 'Syringe Infusion Pump', 'Volumetric Infusion Pump', 'Bedside Monitor'],
    'ot equipment': ['Surgical OT Light', 'Hydraulic OT Table', 'Anaesthesia Workstation', 'Electrosurgical Cautery'],
    'surgical instruments': ['Surgical Forceps', 'Operating Scissors', 'Needle Holders', 'Tissue Retractors'],
    'dental equipment': ['Integrated Dental Chair', 'Dental X-Ray', 'Ultrasonic Scaler', 'Dental Autoclave'],
    'medical consumables': ['Nitrile Examination Gloves', '3-Ply Surgical Masks', 'IV Cannula & Sets', 'Disposable Syringes'],
    'respiratory equipment': ['10L Oxygen Concentrator', 'BiPAP & CPAP Machine', 'Compressor Nebulizer', 'High Flow Oxygen'],
    'home healthcare': ['Digital BP Monitor', 'Glucometer Kit', 'Non-Contact Thermometer', 'Pulse Oximeter'],
    'rehabilitation': ['Walking Frames & Canes', 'Manual & Power Wheelchair', 'Orthotic Braces'],
    'physiotherapy': ['TENS Unit', 'Therapeutic Ultrasound', 'Shortwave Diathermy', 'IFT Machine'],
    'refurbished equipment': ['Refurbished ICU Ventilators', 'Refurbished Ultrasound', 'Refurbished C-Arm'],
    'spare parts & accessories': ['ECG Cables & Leadwires', 'SpO2 Sensors', 'Ultrasound Probes', 'Rechargeable Batteries']
  }), []);

  const getSidebarSubcategories = useCallback((catName: string): string[] => {
    const normKey = catName.trim().toLowerCase();
    const subSet = new Set<string>();

    const dbCat = categories?.find(c => (c.name || '').trim().toLowerCase() === normKey);
    if (dbCat && Array.isArray(dbCat.subcategories) && dbCat.subcategories.length > 0) {
      dbCat.subcategories.forEach(s => {
        if (s && s.trim()) subSet.add(s.trim());
      });
    }

    products.forEach(p => {
      if (isCategoryMatch(p, catName, categories)) {
        if (p.subcategory && p.subcategory.trim()) {
          subSet.add(p.subcategory.trim());
        }
      }
    });

    const presets = PRESET_SUBCATEGORIES_MAP[normKey];
    if (presets) {
      presets.forEach(p => subSet.add(p));
    }

    return Array.from(subSet);
  }, [categories, products, PRESET_SUBCATEGORIES_MAP]);

  const getSubcategoryCount = useCallback((subName: string, parentCatName: string) => {
    const subNorm = subName.trim().toLowerCase();
    return products.filter(p => {
      const pSub = (p.subcategory || '').trim().toLowerCase();
      const pCat = (p.category || '').trim().toLowerCase();
      const pName = (p.name || '').trim().toLowerCase();
      return pSub === subNorm || (pCat === parentCatName.trim().toLowerCase() && pName.includes(subNorm));
    }).length;
  }, [products]);

  // Derived list of all subcategories under currently active category with counts
  const activeCategorySubcategories = useMemo(() => {
    if (!selectedCategoryName) return [];
    const subs = getSidebarSubcategories(selectedCategoryName);
    return subs.map(sub => {
      const count = getSubcategoryCount(sub, selectedCategoryName);
      return { name: sub, count };
    }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [selectedCategoryName, getSidebarSubcategories, getSubcategoryCount]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: 59, secs: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, mins: 59, secs: 59 };
        return { hours: 23, mins: 59, secs: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-play hero slider
  const activeBanners = useMemo(() => {
    return promoBanners
      .filter(b => b.isActive)
      .sort((a, b) => (a.positionOrder || 0) - (b.positionOrder || 0));
  }, [promoBanners]);

  const defaultHeroSlides = [
    {
      id: 'default-1',
      headline: "Everything Healthcare. One Marketplace.",
      subtitle: "Medical equipment, devices and healthcare products from verified sellers.",
      bgImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200",
      badgeText: "⚡ INDIA'S TRUSTED MEDICAL MARKETPLACE",
      buttonText: "Shop Now",
      linkUrl: "#catalog-anchor",
      promoOfferName: undefined,
      promoOfferValue: "GST Verified",
      purchaseProductId: undefined,
      purchaseButtonText: undefined,
      purchaseButtonPrice: undefined,
      featuredItems: ["ECG Machines", "Patient Monitors", "Ultrasound", "Ventilators", "Defibrillators"]
    },
    {
      id: 'default-2',
      headline: "Enterprise Hospital Procurement & RFQ Tenders",
      subtitle: "Streamline bulk ICU setups, OT equipment, and laboratory supplies with direct factory wholesale prices.",
      bgImage: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1200",
      badgeText: "FACTORY DIRECT DISPATCH",
      buttonText: "Request Quote",
      linkUrl: "#catalog-anchor",
      promoOfferName: undefined,
      promoOfferValue: "Bulk Pricing",
      purchaseProductId: undefined,
      purchaseButtonText: undefined,
      purchaseButtonPrice: undefined,
      featuredItems: ["ICU Beds", "Anaesthesia Workstations", "C-Arm Image Intensifier", "Multipara Monitors"]
    },
    {
      id: 'default-3',
      headline: "Certified Refurbished & Warranted Medical Equipment",
      subtitle: "Save up to 50% on premium MRI, CT Scans, and Ultrasound systems backed by 1-Year Pan-India Warranty.",
      bgImage: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1200",
      badgeText: "REFURBISHED CLINICAL GRADE",
      buttonText: "View Systems",
      linkUrl: "#catalog-anchor",
      promoOfferName: undefined,
      promoOfferValue: "Up to 50% OFF",
      purchaseProductId: undefined,
      purchaseButtonText: undefined,
      purchaseButtonPrice: undefined,
      featuredItems: ["1.5T MRI Machines", "64-Slice CT Scanners", "3D/4D Ultrasound", "High-Flow Oxygen Concentrators"]
    }
  ];

  const slidesToDisplay = useMemo(() => {
    if (activeBanners.length > 0) {
      return activeBanners.map(b => ({
        id: b.id,
        headline: b.title,
        subtitle: b.subtitle || "Direct factory medical equipment marketplace with instant clinical warranty.",
        bgImage: b.imageUrl,
        badgeText: b.badgeText || "PROMOTIONAL OFFER",
        buttonText: b.buttonText || "Shop Catalog",
        linkUrl: b.linkUrl || "#catalog-anchor",
        promoOfferName: b.promoOfferName,
        promoOfferValue: b.promoOfferValue,
        purchaseProductId: b.purchaseProductId,
        purchaseButtonText: b.purchaseButtonText,
        purchaseButtonPrice: b.purchaseButtonPrice,
        featuredItems: ["ECG Machine", "ICU Monitor", "Ultrasound", "Ventilator", "Syringe Pump"]
      }));
    }
    return defaultHeroSlides;
  }, [activeBanners]);

  const currentSlideIdx = heroSlide % (slidesToDisplay.length || 1);
  const currentSlide = slidesToDisplay[currentSlideIdx] || slidesToDisplay[0];

  useEffect(() => {
    const total = slidesToDisplay.length || 1;
    const slideTimer = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [slidesToDisplay.length]);

  const removedCategories = useMemo(() => {
    return new Set((dbLocal.getRemovedCategories() || []).map(s => s.toLowerCase()));
  }, [categories]);

  const rawSidebarCategories = [
    { name: "Diagnostic Equipment", icon: "🔬" },
    { name: "Patient Monitoring", icon: "📊" },
    { name: "ECG Machines", icon: "📈" },
    { name: "Ultrasound", icon: "🖥️" },
    { name: "X-Ray & Imaging", icon: "🦴" },
    { name: "CT Scan", icon: "🌀" },
    { name: "MRI Systems", icon: "🧲" },
    { name: "Laboratory Equipment", icon: "🧪" },
    { name: "Hospital Furniture", icon: "🛏️" },
    { name: "ICU Equipment", icon: "🫁" },
    { name: "OT Equipment", icon: "🩺" },
    { name: "Surgical Instruments", icon: "✂️" },
    { name: "Dental Equipment", icon: "🦷" },
    { name: "Medical Consumables", icon: "📦" },
    { name: "Respiratory Equipment", icon: "🌬️" },
    { name: "Home Healthcare", icon: "🏠" },
    { name: "Rehabilitation", icon: "♿" },
    { name: "Physiotherapy", icon: "⚡" },
    { name: "Refurbished Equipment", icon: "🔄" },
    { name: "Spare Parts & Accessories", icon: "⚙️" }
  ];

  const getCategoryCount = useCallback((catName: string, subcategories?: string[]) => {
    if (!catName || !products) return 0;
    const catLower = catName.trim().toLowerCase();
    const subSet = new Set((subcategories || []).map(s => s.trim().toLowerCase()));

    return products.filter(p => {
      if (isCategoryMatch(p, catName, categories)) return true;
      const pCat = (p.category || '').trim().toLowerCase();
      const pSub = (p.subcategory || '').trim().toLowerCase();

      if (pCat === catLower || pSub === catLower) return true;
      if (subSet.has(pSub) || subSet.has(pCat)) return true;
      if (pCat && (pCat.includes(catLower) || catLower.includes(pCat))) return true;
      if (pSub && (pSub.includes(catLower) || catLower.includes(pSub))) return true;

      return false;
    }).length;
  }, [products, categories]);

  const sidebarCategories = useMemo(() => {
    return rawSidebarCategories
      .filter(sc => !removedCategories.has(sc.name.trim().toLowerCase()))
      .map(sc => {
        const catObj = categories?.find(c => c.name.trim().toLowerCase() === sc.name.trim().toLowerCase());
        const count = getCategoryCount(sc.name, catObj?.subcategories);
        return {
          ...sc,
          count
        };
      });
  }, [removedCategories, rawSidebarCategories, categories, getCategoryCount]);

  const allCategoryCards = useMemo(() => {
    const list: { name: string; displayName: string; count: string; rawCount: number; image: string; icon: string }[] = [];
    const seen = new Set<string>();

    const defaultPresetMap: Record<string, { image: string; icon: string }> = {
      'diagnostic equipment': { image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400", icon: "🔬" },
      'ecg machines': { image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400", icon: "📈" },
      'ultrasound': { image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400", icon: "🖥️" },
      'patient monitoring': { image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400", icon: "📊" },
      'laboratory equipment': { image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400", icon: "🧪" },
      'hospital furniture': { image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=400", icon: "🛏️" },
      'surgical instruments': { image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=400", icon: "✂️" },
      'medical consumables': { image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400", icon: "📦" },
      'dental equipment': { image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=400", icon: "🦷" },
      'home healthcare': { image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400", icon: "🏠" }
    };

    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        if (!cat.name || cat.isActive === false) return;
        const key = cat.name.trim().toLowerCase();
        if (seen.has(key) || removedCategories.has(key)) return;
        seen.add(key);

        const count = getCategoryCount(cat.name, cat.subcategories);

        const preset = defaultPresetMap[key];
        list.push({
          name: cat.name.trim(),
          displayName: cat.name.trim(),
          count: `${count} ${count === 1 ? 'Product' : 'Products'}`,
          rawCount: count,
          image: cat.image || preset?.image || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400',
          icon: cat.icon || preset?.icon || '🩺'
        });
      });
    }

    products.forEach(p => {
      if (!p.category) return;
      const key = p.category.trim().toLowerCase();
      if (!seen.has(key) && !removedCategories.has(key)) {
        seen.add(key);
        const count = getCategoryCount(p.category);
        const preset = defaultPresetMap[key];
        list.push({
          name: p.category.trim(),
          displayName: p.category.trim(),
          count: `${count} ${count === 1 ? 'Product' : 'Products'}`,
          rawCount: count,
          image: preset?.image || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400',
          icon: preset?.icon || '🔬'
        });
      }
    });

    // Add remaining default preset categories if not yet present and not removed
    rawSidebarCategories.forEach(sc => {
      const key = sc.name.trim().toLowerCase();
      if (!seen.has(key) && !removedCategories.has(key)) {
        seen.add(key);
        const catObj = categories?.find(c => c.name.trim().toLowerCase() === key);
        const count = getCategoryCount(sc.name, catObj?.subcategories);
        const preset = defaultPresetMap[key];
        list.push({
          name: sc.name.trim(),
          displayName: sc.name.trim(),
          count: `${count} ${count === 1 ? 'Product' : 'Products'}`,
          rawCount: count,
          image: preset?.image || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400',
          icon: sc.icon || '🩺'
        });
      }
    });

    return list;
  }, [categories, products, removedCategories, getCategoryCount]);

  // Static Category Sliders for all core medical domains
  const staticCategorySections = useMemo(() => {
    const staticDefs = [
      {
        name: "Diagnostic Equipment",
        description: "ECG, Patient Monitors, Ultrasound & Vital Signs Analyzers",
        icon: "🔬",
        keywords: ['diagnostic', 'ultrasound', 'ecg', 'x-ray', 'scanner', 'analyzer', 'vital']
      },
      {
        name: "ECG Machines & Cardiology",
        description: "12-Lead ECG, Holter Monitors, Cardiac Analyzers & Defibrillators",
        icon: "📈",
        keywords: ['ecg', 'cardio', 'defibrillator', 'holter', 'cardiac', 'heart']
      },
      {
        name: "Patient Monitoring Systems",
        description: "ICU Multipara Monitors, Capnographs, NIBP & Pulse Oximeters",
        icon: "📊",
        keywords: ['monitor', 'patient', 'multipara', 'oximeter', 'capnography', 'icu']
      },
      {
        name: "Laboratory Equipment",
        description: "Centrifuges, Hematology Analyzers, Microscopes & Reagents",
        icon: "🧪",
        keywords: ['lab', 'laboratory', 'centrifuge', 'microscope', 'analyzer', 'hematology', 'biochemistry']
      },
      {
        name: "Hospital Furniture & ICU Beds",
        description: "Motorized Electric Beds, OT Tables, Wheelchairs & Trolleys",
        icon: "🛏️",
        keywords: ['furniture', 'bed', 'table', 'trolley', 'wheelchair', 'chair', 'stretcher']
      },
      {
        name: "Surgical Instruments & OT Gear",
        description: "Electrosurgical Units, OT Lights, Autoclaves & Scissors",
        icon: "✂️",
        keywords: ['surgical', 'surgery', 'ot', 'autoclave', 'scissors', 'forceps', 'cautery', 'light']
      },
      {
        name: "Medical Consumables & Supplies",
        description: "Syringes, Catheters, Gloves, PPE Kits & Disposables",
        icon: "📦",
        keywords: ['consumable', 'glove', 'syringe', 'catheter', 'mask', 'ppe', 'bandage', 'cotton', 'disposable']
      },
      {
        name: "Home Healthcare & Respiratory",
        description: "Oxygen Concentrators, CPAP/BiPAP, Nebulizers & BP Monitors",
        icon: "🏠",
        keywords: ['home', 'oxygen', 'cpap', 'bipap', 'nebulizer', 'respiratory', 'suction', 'ventilator']
      }
    ];

    return staticDefs.map(def => {
      // Find matching products strictly by category or subcategory
      const matched = products.filter(p => {
        const catLower = (p.category || '').trim().toLowerCase();
        const subcatLower = (p.subcategory || '').trim().toLowerCase();

        return def.keywords.some(kw => 
          catLower.includes(kw) || 
          subcatLower.includes(kw)
        );
      });

      return {
        ...def,
        products: matched
      };
    });
  }, [products]);

  // Real-time Refurbished Products matcher
  const refurbishedEquipmentProducts = useMemo(() => {
    return (products || []).filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const pSub = (p.subcategory || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      const pTags = Array.isArray((p as any).tags) 
        ? ((p as any).tags as string[]).map(t => String(t).toLowerCase()).join(' ')
        : String((p as any).tags || '').toLowerCase();
      const isRefurb = Boolean((p as any).isRefurbished) || (p as any).condition === 'refurbished' || (p as any).condition === 'used';

      return (
        pCat.includes('refurbished') ||
        pSub.includes('refurbished') ||
        pName.includes('refurbished') ||
        pTags.includes('refurbished') ||
        isRefurb ||
        isCategoryMatch(p, 'Refurbished Equipment', categories) ||
        isCategoryMatch(p, 'Refurbished', categories) ||
        isCategoryMatch(p, 'Refurbished Imaging & ICU Equipment', categories)
      );
    });
  }, [products, categories]);

  // Fallback featured products in case catalog is loading or has 0 products
  const fallbackFeaturedProducts: Product[] = useMemo(() => [
    {
      id: 'mindray-dc70-exp',
      sku: 'MED-ULTRA-DC70',
      name: 'Mindray DC-70 Exp Diagnostic Ultrasound System',
      brand: 'Mindray',
      price: 1450000,
      salePrice: 1245000,
      stock: 5,
      category: 'Diagnostic Equipment',
      subcategory: 'Ultrasound',
      rating: 4.8,
      reviewsCount: 128,
      images: ['https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=500'],
      vendorId: 'vendor-1',
      description: 'High-performance X-Insight radiology & cardiology color Doppler ultrasound.',
      specifications: { 'Channels': '128-Channel', 'Screen': '21.5-inch LED HD', 'Probes': 'Convex + Linear Included' },
      moq: 1,
      warranty: '2 Years Comprehensive',
      condition: 'new',
      isRefurbished: false,
      auditStatus: 'approved'
    },
    {
      id: 'bpl-cardiocare-ecg',
      sku: 'MED-ECG-BPL-12',
      name: 'BPL Cardiart 12-Channel Clinical ECG Machine',
      brand: 'BPL Medical',
      price: 34000,
      salePrice: 28999,
      stock: 12,
      category: 'Medical Equipment',
      subcategory: 'ECG Machines',
      rating: 4.7,
      reviewsCount: 96,
      images: ['https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=500'],
      vendorId: 'vendor-2',
      description: 'High-resolution simultaneous 12-lead acquisition with built-in thermal printer.',
      specifications: { 'Leads': '12 Lead Simultaneous', 'Display': '7-inch Touchscreen', 'Battery': 'Li-ion Rechargeable' },
      moq: 1,
      warranty: '1 Year Onsite',
      condition: 'new',
      isRefurbished: false,
      auditStatus: 'approved'
    },
    {
      id: 'mindray-benevision-n1',
      sku: 'MED-MON-BENE-N1',
      name: 'Mindray BeneVision N1 Multi-Para Patient Monitor',
      brand: 'Mindray',
      price: 52000,
      salePrice: 45000,
      stock: 8,
      category: 'Medical Equipment',
      subcategory: 'Patient Monitoring',
      rating: 4.9,
      reviewsCount: 74,
      images: ['https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=500'],
      vendorId: 'vendor-1',
      description: 'Compact transportable vital signs patient monitor with ECG, SpO2, NIBP, Temp.',
      specifications: { 'Parameters': 'ECG/SpO2/NIBP/Resp/Temp', 'Screen': '5.5-inch Capacitive Touch', 'Weight': '0.95 kg' },
      moq: 1,
      warranty: '2 Years Warranty',
      condition: 'new',
      isRefurbished: false,
      auditStatus: 'approved'
    },
    {
      id: 'drager-savina-300',
      sku: 'MED-VENT-SAVINA-300',
      name: 'Dräger Savina 300 Intensive Care Ventilator',
      brand: 'Dräger',
      price: 380000,
      salePrice: 325000,
      stock: 4,
      category: 'Medical Equipment',
      subcategory: 'ICU Ventilators',
      rating: 4.8,
      reviewsCount: 65,
      images: ['https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=500'],
      vendorId: 'vendor-3',
      description: 'High-end turbine-driven invasive and non-invasive ICU critical care ventilator.',
      specifications: { 'Drive': 'Integrated Turbine', 'Patient Type': 'Adult & Pediatric', 'Modes': 'VCV, PCV, PSV, CPAP' },
      moq: 1,
      warranty: '3 Years Comprehensive',
      condition: 'new',
      isRefurbished: false,
      auditStatus: 'approved'
    }
  ], []);

  // 10-Minute Auto-Updating Random 4 Featured Products
  const [featuredRotationTick, setFeaturedRotationTick] = useState<number>(0);
  const [featuredRandomProducts, setFeaturedRandomProducts] = useState<Product[]>([]);

  // Function to pick 4 random products
  const pickRandomFeaturedProducts = useCallback((allProducts: Product[]): Product[] => {
    const pool = (allProducts && allProducts.length > 0) ? allProducts : fallbackFeaturedProducts;
    if (!pool || pool.length === 0) return [];
    if (pool.length <= 4) return [...pool];
    
    // Fisher-Yates shuffle
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 4);
  }, [fallbackFeaturedProducts]);

  // Update random 4 products on mount, when products change, and on every 10-minute rotation tick
  useEffect(() => {
    setFeaturedRandomProducts(pickRandomFeaturedProducts(products));
  }, [products, pickRandomFeaturedProducts, featuredRotationTick]);

  // 10-minute timer (600,000 ms) to automatically change the 4 random featured products
  useEffect(() => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const interval = setInterval(() => {
      setFeaturedRotationTick(prev => prev + 1);
    }, TEN_MINUTES_MS);

    return () => clearInterval(interval);
  }, []);

  const handleManualFeaturedShuffle = () => {
    setFeaturedRandomProducts(pickRandomFeaturedProducts(products));
    setFeaturedRotationTick(prev => prev + 1);
    if (addToast) {
      addToast('Featured spotlight rotated with 4 fresh equipment items!', 'info');
    }
  };

  // Group filtered products dynamically into Category-Wise product collections
  const categoryWiseProductGroups = useMemo(() => {
    const groups: {
      id: string;
      name: string;
      displayName: string;
      icon: string;
      image: string;
      rawCount: number;
      products: Product[];
      subcategories: { name: string; count: number }[];
    }[] = [];

    // Target categories pool
    const targetCategories = selectedCategoryName
      ? allCategoryCards.filter(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase())
      : allCategoryCards;

    targetCategories.forEach(catCard => {
      // Find all products matching this category among the filtered catalog
      let matchingProds = filteredMarketplaceProducts.filter(p => isCategoryMatch(p, catCard.name, categories));

      // Check if there is an in-category subcategory filter active
      const inCatSub = categorySubFilter[catCard.name];
      if (inCatSub) {
        const subLower = inCatSub.toLowerCase();
        matchingProds = matchingProds.filter(p => 
          (p.subcategory || '').toLowerCase() === subLower || 
          (p.name || '').toLowerCase().includes(subLower) ||
          isCategoryMatch(p, inCatSub, categories)
        );
      }

      if (matchingProds.length > 0 || (selectedCategoryName && catCard.name.toLowerCase() === selectedCategoryName.toLowerCase())) {
        // Collect subcategories from products in this department
        const allCategoryProdsForSubs = filteredMarketplaceProducts.filter(p => isCategoryMatch(p, catCard.name, categories));
        const subcatMap = new Map<string, number>();
        allCategoryProdsForSubs.forEach(p => {
          if (p.subcategory && p.subcategory.trim()) {
            const sub = p.subcategory.trim();
            subcatMap.set(sub, (subcatMap.get(sub) || 0) + 1);
          }
        });

        // Also add defined subcategories from category metadata
        const catObj = categories?.find(c => c.name.toLowerCase() === catCard.name.toLowerCase());
        (catObj?.subcategories || []).forEach(sub => {
          if (!subcatMap.has(sub)) {
            const subCount = allCategoryProdsForSubs.filter(p => 
              (p.subcategory || '').toLowerCase() === sub.toLowerCase() || 
              (p.name || '').toLowerCase().includes(sub.toLowerCase())
            ).length;
            if (subCount > 0) {
              subcatMap.set(sub, subCount);
            }
          }
        });

        const subcategoryList = Array.from(subcatMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        groups.push({
          id: catCard.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
          name: catCard.name,
          displayName: catCard.displayName,
          icon: catCard.icon,
          image: catCard.image,
          rawCount: matchingProds.length,
          products: matchingProds,
          subcategories: subcategoryList
        });
      }
    });

    // Unassigned products fallback
    const categorizedProductIds = new Set<string>();
    groups.forEach(g => g.products.forEach(p => categorizedProductIds.add(p.id)));
    const unassignedProds = filteredMarketplaceProducts.filter(p => !categorizedProductIds.has(p.id));

    if (unassignedProds.length > 0 && !selectedCategoryName) {
      groups.push({
        id: 'general-specialty-equipment',
        name: "General Hospital & Clinical Supplies",
        displayName: "General Hospital & Clinical Supplies",
        icon: "🏥",
        image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400",
        rawCount: unassignedProds.length,
        products: unassignedProds,
        subcategories: []
      });
    }

    return groups;
  }, [allCategoryCards, filteredMarketplaceProducts, selectedCategoryName, categories, categorySubFilter]);

  const brandLogos = [
    { name: "Mindray", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200", desc: "Leading Patient Monitors & Ultrasound" },
    { name: "Philips", logo: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200", desc: "Global Healthcare Solutions" },
    { name: "GE Healthcare", logo: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=200", desc: "Precision Medical Imaging" },
    { name: "Siemens Healthineers", logo: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=200", desc: "Advanced CT & MRI Systems" },
    { name: "BPL Medical", logo: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200", desc: "Trusted Indian Medical Devices" },
    { name: "Contec", logo: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=200", desc: "ECG & Vital Signs Monitors" },
    { name: "Omron", logo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=200", desc: "Home Diagnostic Devices" },
    { name: "Drager", logo: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=200", desc: "Ventilators & Anaesthesia Workstations" }
  ];

  const renderProductCard = (product: Product, isGrid: boolean = false) => {
    const discount = Math.round(((product.price - product.salePrice) / product.price) * 100);
    const userAlert = savedPriceAlerts.find(a => a.productId === product.id);
    const hasActiveAlert = userAlert && userAlert.status === 'active';
    const isTriggeredAlert = userAlert && userAlert.status === 'triggered';
    const isVerified = checkIsVerifiedVendor(product);

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        key={product.id}
        className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between group relative ${
          isGrid ? 'w-full h-full' : 'min-w-[260px] max-w-[280px] shrink-0'
        }`}
      >
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              {discount}% OFF
            </span>
          )}
          {product.moq > 1 && (
            <span className="bg-[#0077B6] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              MOQ: {product.moq} Units
            </span>
          )}
        </div>

        {/* Quick Utilities Icons */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product.id);
            }}
            className="p-1.5 bg-white/90 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-full shadow-md transition cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
          {(() => {
            const isInCompare = compareList?.some(item => item.id === product.id);
            return (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCompare(product);
                }}
                className={`p-1.5 rounded-full shadow-md transition cursor-pointer ${
                  isInCompare
                    ? 'bg-[#0077B6] text-white ring-2 ring-sky-300 shadow-lg scale-110'
                    : 'bg-white/90 hover:bg-[#0077B6]/10 text-slate-600 hover:text-[#0077B6]'
                }`}
                title={isInCompare ? 'In Comparison Matrix (Click to toggle)' : 'Add to side-by-side comparison'}
              >
                <Scale className="w-3.5 h-3.5" />
              </button>
            );
          })()}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-1.5 bg-white/90 hover:bg-[#0F9D8A]/10 text-slate-600 hover:text-[#0F9D8A] rounded-full shadow-md transition cursor-pointer"
            title="Quick View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button 
            type="button"
            id={`quick-price-alert-btn-${product.id}`}
            aria-label="Notify me of price drops"
            onClick={(e) => {
              e.stopPropagation();
              if (onPriceAlert) {
                onPriceAlert(product);
              } else {
                const newAlert = {
                  id: userAlert?.id || `alert-${Date.now()}`,
                  userEmail: 'procurement@healnex.com',
                  productName: product.name,
                  productId: product.id,
                  productImage: product.images?.[0],
                  vendorName: product.vendorName,
                  currentPrice: product.salePrice || product.price,
                  targetPrice: Math.round((product.salePrice || product.price) * 0.95),
                  alertType: 'price_drop' as const,
                  channel: 'both' as const,
                  enableEmail: true,
                  enablePush: true,
                  createdAt: new Date().toISOString(),
                  status: 'active' as const
                };
                dbLocal.addPriceAlert(newAlert);
                if (addToast) {
                  addToast(`🔔 Price drop alert active for ${product.name}!`, 'success');
                }
              }
            }}
            className={`p-1.5 rounded-full shadow-md transition cursor-pointer transform hover:scale-110 active:scale-95 ${
              isTriggeredAlert
                ? 'bg-rose-500 text-white ring-2 ring-rose-300 shadow-lg animate-pulse'
                : hasActiveAlert
                ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-lg'
                : 'bg-white/90 hover:bg-amber-50 text-slate-600 hover:text-amber-600'
            }`}
            title={
              isTriggeredAlert
                ? '⚡ Price reduced! Click to view alert details'
                : hasActiveAlert
                ? '🔔 Price alert is active (Click to manage)'
                : 'Notify me when this product price drops'
            }
          >
            <Bell className={`w-3.5 h-3.5 ${hasActiveAlert || isTriggeredAlert ? 'fill-current text-white' : ''}`} />
          </button>
        </div>

        {/* Image Container with Lightbox Zoom Trigger */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setLightboxProduct(product);
          }}
          className="h-44 w-full rounded-xl overflow-hidden bg-[#F5F7FA] p-2 relative mb-3 flex items-center justify-center cursor-pointer group/img transition-all hover:bg-slate-200/50"
          title="Click thumbnail to inspect & zoom medical image in lightbox modal"
        >
          <img
            src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400'}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 group-hover/img:scale-105 transition-transform duration-500 ease-out transform-gpu"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-extrabold text-[11px] backdrop-blur-[1px]">
            <ZoomIn className="w-4 h-4 text-emerald-400" />
            <span>Inspect &amp; Zoom</span>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-1.5 flex-1">
          <p className="text-[10px] font-bold text-[#0077B6] uppercase tracking-wider">{product.brand}</p>
          <h4 className="text-xs font-bold text-[#1F2937] line-clamp-2 leading-tight group-hover:text-[#0F9D8A] transition">
            {product.name}
          </h4>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
            <span className="font-bold text-slate-700">4.9</span>
            <span className="text-slate-400 text-[10px]">(18 reviews)</span>
          </div>

          {/* Price Section */}
          <div className="pt-2 border-t border-slate-100 flex items-baseline gap-2">
            <span className="text-sm font-black text-[#1F2937] font-mono">
              ₹{product.salePrice.toLocaleString()}
            </span>
            {product.price > product.salePrice && (
              <span className="text-[11px] text-slate-400 line-through font-mono">
                ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Notify me of price drops button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onPriceAlert) {
                onPriceAlert(product);
              } else {
                const newAlert = {
                  id: userAlert?.id || `alert-${Date.now()}`,
                  userEmail: 'procurement@healnex.com',
                  productName: product.name,
                  productId: product.id,
                  productImage: product.images?.[0],
                  vendorName: product.vendorName,
                  currentPrice: product.salePrice || product.price,
                  targetPrice: Math.round((product.salePrice || product.price) * 0.95),
                  alertType: 'price_drop' as const,
                  channel: 'both' as const,
                  enableEmail: true,
                  enablePush: true,
                  createdAt: new Date().toISOString(),
                  status: 'active' as const
                };
                dbLocal.addPriceAlert(newAlert);
                addToast(`🔔 Price drop alert active for ${product.name}!`, 'success');
              }
            }}
            className={`w-full py-1.5 px-2.5 rounded-xl text-[10px] font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer my-1.5 ${
              isTriggeredAlert
                ? 'bg-rose-500 text-white border-rose-600 shadow-xs animate-pulse'
                : hasActiveAlert
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                : 'bg-amber-50 hover:bg-amber-100/90 text-amber-800 border-amber-200/90 hover:border-amber-300'
            }`}
            title={
              isTriggeredAlert
                ? '⚡ Price reduced! Click to configure or view'
                : hasActiveAlert
                ? 'Price alert is active for this product'
                : 'Notify me when this product price drops'
            }
          >
            <Bell className={`w-3.5 h-3.5 ${hasActiveAlert || isTriggeredAlert ? 'fill-current text-current' : 'text-amber-600'}`} />
            <span>
              {isTriggeredAlert ? '⚡ Price Reduced!' : hasActiveAlert ? 'Price Alert Set' : 'Notify me of price drops'}
            </span>
          </button>

          {/* Urgency Progress Bar for Low Stock (< 20 units) */}
          {((product.stockQuantity !== undefined ? product.stockQuantity : 15) < 20) && (
            <div className="pt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-amber-700 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
                  Only {product.stockQuantity !== undefined ? product.stockQuantity : 15} left in stock!
                </span>
                <span className="text-slate-400 font-mono text-[9px]">
                  {product.stockQuantity !== undefined ? product.stockQuantity : 15}/20
                </span>
              </div>
              <div className="w-full bg-amber-100/80 rounded-full h-1.5 overflow-hidden border border-amber-200/50">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    (product.stockQuantity !== undefined ? product.stockQuantity : 15) <= 5
                      ? 'bg-rose-500'
                      : (product.stockQuantity !== undefined ? product.stockQuantity : 15) <= 10
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(8, Math.min(100, ((product.stockQuantity !== undefined ? product.stockQuantity : 15) / 20) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Verification & Warranty Badges */}
          <div className="flex flex-wrap items-center gap-1 pt-1 text-[9px] font-semibold text-slate-500">
            {isVerified ? (
              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                Verified Vendor
              </span>
            ) : (
              <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200">
                Direct Supplier
              </span>
            )}
            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-200">
              🛡️ {product.warranty || '1 Year Warranty'}
            </span>
            <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-md border border-purple-200">
              No-Cost EMI
            </span>
          </div>

          {/* Expand Details Toggle Button */}
          {(() => {
            const isExpanded = !!expandedCardIds[product.id];
            return (
              <div className="pt-2">
                <button
                  type="button"
                  id={`expand-details-btn-${product.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardIds(prev => ({
                      ...prev,
                      [product.id]: !prev[product.id]
                    }));
                  }}
                  className={`w-full py-1.5 px-2.5 rounded-xl text-[10px] font-extrabold border transition flex items-center justify-between cursor-pointer ${
                    isExpanded
                      ? 'bg-teal-50 hover:bg-teal-100/80 border-teal-300 text-teal-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-700'
                  }`}
                  title={isExpanded ? 'Collapse specifications and description' : 'Expand technical specifications and short product description'}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className={`w-3.5 h-3.5 ${isExpanded ? 'text-teal-600' : 'text-slate-500'}`} />
                    <span>{isExpanded ? 'Hide Details' : 'Expand Details'}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Direct In-Card Expanded Technical Specifications & Description */}
                {isExpanded && (
                  <div
                    id={`expanded-details-panel-${product.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700 text-[10px] animate-fade-in"
                  >
                    {/* Short Description */}
                    {product.description && (
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <Info className="w-3 h-3 text-teal-600" /> Short Overview
                        </span>
                        <p className="text-slate-600 line-clamp-3 leading-relaxed bg-white p-1.5 rounded-lg border border-slate-200/70">
                          {product.description}
                        </p>
                      </div>
                    )}

                    {/* Technical Specifications */}
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-teal-600" /> Technical Specifications
                      </span>
                      {product.specifications && product.specifications.length > 0 ? (
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/70 space-y-1">
                          {product.specifications.slice(0, 4).map((spec, i) => (
                            <div key={i} className="flex justify-between items-start text-[10px] py-0.5 border-b border-slate-100 last:border-0">
                              <span className="font-semibold text-slate-500 pr-1.5 truncate max-w-[100px]">{spec.key}:</span>
                              <span className="font-bold text-slate-800 text-right truncate max-w-[120px]">{spec.value}</span>
                            </div>
                          ))}
                          {product.specifications.length > 4 && (
                            <button
                              type="button"
                              onClick={() => onQuickView(product)}
                              className="text-[9px] font-bold text-teal-700 hover:text-teal-900 w-full text-center pt-0.5 cursor-pointer block hover:underline"
                            >
                              +{product.specifications.length - 4} more specs (Click Quick View)
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/70 space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-semibold text-slate-500">Category:</span>
                            <span className="font-bold text-slate-800">{product.category || 'Medical Equipment'}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-semibold text-slate-500">Brand:</span>
                            <span className="font-bold text-slate-800">{product.brand || 'HealNex Medical'}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-semibold text-slate-500">Warranty:</span>
                            <span className="font-bold text-slate-800">{product.warranty || '1 Year Standard'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tax & Origin Snapshot */}
                    <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>HSN: <strong className="text-slate-800 font-bold">{product.hsnCode || '9018'}</strong></span>
                      <span className="bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded font-sans">
                        {product.gstRate || 12}% GST
                      </span>
                      {product.countryOfOrigin && (
                        <span className="font-sans text-slate-600 font-medium">📍 {product.countryOfOrigin}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-slate-100">
          <button
            onClick={() => onAddToCart(product, product.moq || 1)}
            className="bg-[#F5F7FA] hover:bg-slate-200 text-[#1F2937] text-[11px] font-bold py-2 rounded-xl transition flex items-center justify-center gap-1"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Cart
          </button>
          <button
            onClick={() => {
              if (onQuickBuy) {
                onQuickBuy(product);
              } else {
                onAddToCart(product, product.moq || 1);
                onNavigate('cart');
              }
            }}
            className="bg-[#0F9D8A] hover:bg-[#0c8272] text-white text-[11px] font-bold py-2 rounded-xl transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            title="Quick Buy: Instantly proceed to checkout for this product"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>Quick Buy</span>
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-12 font-sans bg-white text-[#1F2937] pb-12">
      
      {/* 1. HERO SECTION - Clean Light Sky-Blue Healthcare Canvas with Live Admin Banners */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EBF5FB] via-[#F4F9FD] to-white border-b border-slate-200/80 py-8 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Promotional Badge & Banner Position Counter */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {currentSlide.badgeText ? (
                  <span className="bg-[#0066CC] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    {currentSlide.badgeText}
                  </span>
                ) : (
                  <span className="bg-[#0066CC] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    ⚡ INDIA'S TRUSTED MEDICAL MARKETPLACE
                  </span>
                )}
                {currentSlide.promoOfferValue && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    {currentSlide.promoOfferValue}
                  </span>
                )}
                {slidesToDisplay.length > 1 && (
                  <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-mono">
                    Banner {currentSlideIdx + 1} / {slidesToDisplay.length}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-black tracking-tight leading-[1.12] text-slate-900">
                  {currentSlide.headline || "Everything Healthcare. One Marketplace."}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl leading-relaxed">
                  {currentSlide.subtitle || "Medical equipment, devices and healthcare products from verified sellers."}
                </p>
              </div>

              {/* Action Buttons & Slide Controls */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  onClick={() => {
                    if (currentSlide.linkUrl?.startsWith('#')) {
                      const el = document.getElementById(currentSlide.linkUrl.replace('#', ''));
                      el?.scrollIntoView({ behavior: 'smooth' });
                    } else if (currentSlide.linkUrl) {
                      window.location.hash = currentSlide.linkUrl;
                    } else {
                      const el = document.getElementById('catalog-anchor');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-[#0066CC] hover:bg-[#0055aa] text-white font-bold text-sm px-8 py-3.5 rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{currentSlide.buttonText || "Shop Now"}</span>
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('categories-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white hover:bg-slate-50 text-[#0066CC] border border-[#0066CC] font-bold text-sm px-7 py-3.5 rounded-lg transition shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Categories</span>
                </button>

                {/* Banner Carousel Controls if multiple banners exist */}
                {slidesToDisplay.length > 1 && (
                  <div className="flex items-center gap-1.5 ml-auto sm:ml-2 bg-white/80 backdrop-blur-xs border border-slate-200 rounded-xl p-1 shadow-2xs">
                    <button
                      onClick={() => setHeroSlide((prev) => (prev - 1 + slidesToDisplay.length) % slidesToDisplay.length)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
                      title="Previous Banner"
                      aria-label="Previous Banner"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1 px-1">
                      {slidesToDisplay.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHeroSlide(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === currentSlideIdx ? 'w-5 bg-[#0066CC]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                          }`}
                          title={`Go to Banner ${idx + 1}`}
                          aria-label={`Go to Banner ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setHeroSlide((prev) => (prev + 1) % slidesToDisplay.length)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
                      title="Next Banner"
                      aria-label="Next Banner"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 4 Trust Badges Strip */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-base text-[#0066CC]">🛡️</span>
                  <span>Verified Sellers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-[#0066CC]">🚚</span>
                  <span>Pan-India Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-[#0066CC]">✨</span>
                  <span>Genuine Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-[#0066CC]">🔒</span>
                  <span>Secure &amp; Reliable</span>
                </div>
              </div>
            </div>

            {/* Right Visual Column: Admin Uploaded Banner Visual & Slide Indicator */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Soft glowing backdrop platform */}
              <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-sky-200/50 via-blue-100/40 to-teal-100/30 blur-2xl pointer-events-none -z-0"></div>
              
              <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-white/95 to-sky-50/90 rounded-3xl p-4 border border-sky-100 shadow-xl backdrop-blur-xs group">
                <div className="relative overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    key={currentSlide.id || currentSlideIdx}
                    src={currentSlide.bgImage || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=700'}
                    alt={currentSlide.headline || "HealNex Medical Equipment Banner"}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if image link is invalid
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=700';
                    }}
                    className="w-full h-72 sm:h-80 object-cover rounded-2xl shadow-inner border border-white transition-transform duration-500 hover:scale-102"
                  />

                  {/* Banner Overlay Controls on Hover */}
                  {slidesToDisplay.length > 1 && (
                    <div className="absolute inset-x-0 bottom-2 px-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroSlide((prev) => (prev - 1 + slidesToDisplay.length) % slidesToDisplay.length);
                        }}
                        className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
                        aria-label="Previous Slide"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroSlide((prev) => (prev + 1) % slidesToDisplay.length);
                        }}
                        className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
                        aria-label="Next Slide"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Floating Live Tag */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-sky-200 shadow-md flex items-center gap-2 text-xs font-bold text-slate-800 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{currentSlide.promoOfferName || "5,000+ Verified Hospital Systems Live"}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY (10 Cards Grid) */}
      <section id="categories-section" className="max-w-7xl mx-auto px-4 lg:px-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">Shop by Category</h2>
          <button
            onClick={() => {
              const el = document.getElementById('catalog-anchor');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-bold text-[#0066CC] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
          {[
            { name: 'Medical Equipment', category: 'Medical Equipment', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200' },
            { name: 'Diagnostic Equipment', category: 'Diagnostic Equipment', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=200' },
            { name: 'Laboratory', category: 'Laboratory Equipment', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=200' },
            { name: 'Dental', category: 'Dental Equipment', image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=200' },
            { name: 'Surgical', category: 'Surgical Instruments', image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=200' },
            { name: 'Consumables', category: 'Medical Consumables', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200' },
            { name: 'Hospital Furniture', category: 'Hospital Furniture', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200' },
            { name: 'Patient Care', category: 'Patient Care Devices', image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=200' },
            { name: 'Imaging', category: 'Diagnostic Imaging', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200' },
            { name: 'Physiotherapy', category: 'Physiotherapy & Rehab', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=200' }
          ].map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.category)}
              className="bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-[#0066CC] rounded-2xl p-3 text-center transition-all duration-200 shadow-2xs hover:shadow-sm flex flex-col items-center justify-between h-36 group cursor-pointer"
            >
              <div className="w-full h-18 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden p-1">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-300"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-[#0066CC] leading-tight mt-2 line-clamp-2">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. FEATURED MEDICAL EQUIPMENT (Auto-Updating 4 Random Products every 10 min) */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-sky-100 text-[#0066CC] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#0066CC]" />
                Spotlight Selection
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Auto-rotates every 10 min
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Featured Medical Equipment</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualFeaturedShuffle}
              className="text-xs font-bold text-slate-600 hover:text-[#0066CC] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Shuffle 4 Random Products Now"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Shuffle Selection</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('catalog-anchor');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-bold text-[#0066CC] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {featuredRandomProducts.map((product) => renderProductCard(product, true))}
          </AnimatePresence>
        </div>
      </section>

      {/* 4. PROMOTIONAL BANNER: UPGRADE YOUR HEALTHCARE FACILITY */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-gradient-to-r from-[#0a192f] via-[#0d2847] to-[#103a63] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left Content */}
          <div className="space-y-4 max-w-xl z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Upgrade Your Healthcare Facility
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              Discover quality medical equipment at competitive prices.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById('catalog-anchor');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white hover:bg-slate-100 text-[#0a192f] font-bold text-xs sm:text-sm px-7 py-3.5 rounded-lg transition shadow-lg cursor-pointer inline-flex items-center gap-2"
              >
                <span>Explore Equipment</span>
                <ArrowRight className="w-4 h-4 text-[#0066CC]" />
              </button>
            </div>
          </div>

          {/* Right Image: Modern Surgical Operating Room */}
          <div className="z-10 shrink-0 w-full md:w-80 lg:w-96 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=600"
              alt="Healthcare Facility Modern Equipment Setup"
              referrerPolicy="no-referrer"
              className="w-full h-48 sm:h-56 object-cover"
            />
          </div>

        </div>
      </section>

      {/* 5. POPULAR CATEGORIES (8 Cards Grid) */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-5">
        <h2 className="text-2xl font-black text-slate-900">Popular Categories</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {[
            { name: 'Ultrasound', category: 'Diagnostic Equipment', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=200' },
            { name: 'ECG', category: 'Medical Equipment', image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=200' },
            { name: 'Patient Monitor', category: 'Medical Equipment', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200' },
            { name: 'Ventilator', category: 'Medical Equipment', image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=200' },
            { name: 'Defibrillator', category: 'Medical Equipment', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200' },
            { name: 'X-Ray', category: 'Diagnostic Imaging', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200' },
            { name: 'Autoclave', category: 'Laboratory Equipment', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=200' },
            { name: 'Dental Chair', category: 'Dental Equipment', image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=200' }
          ].map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.category)}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0066CC] rounded-2xl p-3 text-center transition-all duration-200 shadow-2xs hover:shadow-sm flex flex-col items-center justify-between h-32 group cursor-pointer"
            >
              <div className="w-full h-16 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden p-1">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-300"
                />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#0066CC] leading-tight mt-1 truncate w-full">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 6. BRANDS CAROUSEL */}
      <section id="brands-section" className="max-w-7xl mx-auto px-4 lg:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Top Medical Equipment Brands</h3>
          <span className="text-xs font-bold text-[#0066CC]">Official OEM &amp; Distributor Network</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {brandLogos.map((brd) => (
            <button 
              key={brd.name}
              onClick={() => handleCategoryClick(brd.name)}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0066CC] rounded-2xl p-3 px-5 shrink-0 flex items-center gap-3 transition cursor-pointer shadow-2xs min-w-[200px] text-left"
            >
              <img src={brd.logo} alt={brd.name} className="w-8 h-8 rounded-lg object-cover" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">{brd.name}</h4>
                <p className="text-[9px] text-slate-500 font-medium truncate max-w-[120px]">{brd.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 7. DUAL PROMOTIONAL CARDS (CERTIFIED REFURBISHED & BULK PROCUREMENT) */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Card: Certified Refurbished Equipment */}
          <div className="bg-gradient-to-r from-[#0a192f] to-[#122e4c] rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-3 z-10 max-w-sm">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                Certified Refurbished Equipment
              </h3>
              <div className="flex items-center gap-3 text-xs font-semibold text-teal-300 flex-wrap">
                <span>🛡️ Certified</span>
                <span>📋 Tested</span>
                <span>🛡️ Warranty Available</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleCategoryClick('Refurbished Equipment')}
                  className="bg-white hover:bg-slate-100 text-[#0a192f] font-bold text-xs px-5 py-2.5 rounded-lg transition shadow-md cursor-pointer"
                >
                  Explore Refurbished
                </button>
              </div>
            </div>
            <div className="absolute right-4 bottom-4 w-32 h-32 rounded-2xl overflow-hidden opacity-80 group-hover:opacity-100 transition hidden sm:block border border-white/20 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=250"
                alt="Refurbished Medical Device"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Card: Need Equipment in Bulk? */}
          <div className="bg-[#EAF4FB] border border-blue-100 rounded-3xl p-6 sm:p-8 text-slate-900 shadow-md flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-3 z-10 max-w-sm">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug text-slate-900">
                Need Equipment in Bulk?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Get competitive quotations from verified medical suppliers.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('rfqs')}
                  className="bg-[#0066CC] hover:bg-[#0055aa] text-white font-bold text-xs px-5 py-2.5 rounded-lg transition shadow-md cursor-pointer"
                >
                  Request Bulk Quote
                </button>
              </div>
            </div>
            <div className="absolute right-4 bottom-4 w-32 h-32 rounded-2xl overflow-hidden opacity-80 group-hover:opacity-100 transition hidden sm:block border border-blue-200 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250"
                alt="Bulk Medical Procurement Cartons"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* 8. TRUST BADGES (6 VALUE PROPOSITIONS) */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs text-center">
          <div className="space-y-1.5 p-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066CC] mx-auto flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Verified Sellers</h4>
            <p className="text-[10px] text-slate-500">Only verified and trusted sellers</p>
          </div>

          <div className="space-y-1.5 p-2 border-l border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066CC] mx-auto flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Genuine Products</h4>
            <p className="text-[10px] text-slate-500">100% authentic products</p>
          </div>

          <div className="space-y-1.5 p-2 border-l border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066CC] mx-auto flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Pan-India Delivery</h4>
            <p className="text-[10px] text-slate-500">Fast and reliable delivery</p>
          </div>

          <div className="space-y-1.5 p-2 border-l border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066CC] mx-auto flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Secure Ordering</h4>
            <p className="text-[10px] text-slate-500">Safe and secure transactions</p>
          </div>

          <div className="space-y-1.5 p-2 border-l border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066CC] mx-auto flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Bulk Procurement</h4>
            <p className="text-[10px] text-slate-500">Best deals for bulk requirements</p>
          </div>

          <div className="space-y-1.5 p-2 border-l border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066CC] mx-auto flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Customer Support</h4>
            <p className="text-[10px] text-slate-500">Dedicated support whenever you need</p>
          </div>
        </div>
      </section>

      {/* 6. CURATED CATEGORY PRODUCT CATALOG WITH FILTER SIDEBAR */}
      <div id="catalog-anchor" className="space-y-8 max-w-7xl mx-auto px-4 lg:px-6">
        
        {/* Interactive Category Selector Bar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-sm font-black text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
                <span className="text-[#0F9D8A]">🏷️</span> Category Quick Selector
              </h3>
              <p className="text-xs text-slate-500 font-medium">Browse verified equipment by specialized clinical department</p>
            </div>
            {selectedCategoryName && (
              <button
                onClick={() => handleCategoryClick('')}
                className="text-xs font-bold text-[#0F9D8A] hover:underline cursor-pointer flex items-center gap-1"
              >
                Clear Selection ({products.length} total)
              </button>
            )}
          </div>

          {/* Scrollable Pills Row for Category Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            <button
              onClick={() => handleCategoryClick('')}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                !selectedCategoryName
                  ? 'bg-[#0F9D8A] text-white ring-2 ring-[#0F9D8A]/40 shadow-md scale-105'
                  : 'bg-[#F5F7FA] text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>🏥 All Categories</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                !selectedCategoryName ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {products.length}
              </span>
            </button>

            {allCategoryCards.map((cat) => {
              const isSelected = selectedCategoryName.trim().toLowerCase() === cat.name.trim().toLowerCase();
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(isSelected ? '' : cat.name)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                    isSelected
                      ? 'bg-[#0F9D8A] text-white font-black ring-2 ring-[#0F9D8A]/40 shadow-md scale-105'
                      : 'bg-[#F5F7FA] text-slate-700 hover:bg-slate-200 font-bold border border-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.displayName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white font-black' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isSelected ? '✓' : cat.rawCount}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Department Category Active Banner with All Subcategories Displayed at Top */}
        <div id="catalog-anchor" className="scroll-mt-24"></div>
        {selectedCategoryName && (
          <div className="bg-gradient-to-br from-[#0F9D8A] via-[#0077B6] to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-teal-400/30 space-y-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30 shrink-0">
                  {allCategoryCards.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase())?.icon || '🏥'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-200 bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-400/40">
                      Active Department Category
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                      {products.filter(p => isCategoryMatch(p, selectedCategoryName, categories)).length} Total Equipment Items
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                    {selectedCategoryName}
                  </h2>
                  <p className="text-xs text-slate-200 font-medium mt-0.5">
                    Showing all medical equipment and systems from all subcategories under <strong>{selectedCategoryName}</strong> displayed at the top.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCategoryClick('')}
                  className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition border border-white/25 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Show All Categories</span>
                </button>
              </div>
            </div>

            {/* Subcategories Row with 'All Subcategories' Pill */}
            {activeCategorySubcategories.length > 0 && (
              <div className="pt-3.5 border-t border-white/20 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-black uppercase tracking-wider text-teal-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    All Subcategories Under {selectedCategoryName} ({activeCategorySubcategories.length} subcategories):
                  </span>
                  {selectedSubcategoryFilter && (
                    <button
                      onClick={() => setSelectedSubcategoryFilter('')}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                    >
                      Show All Subcategories
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* All Subcategories Master Pill */}
                  <button
                    onClick={() => setSelectedSubcategoryFilter('')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                      !selectedSubcategoryFilter
                        ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-md scale-105'
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                    }`}
                  >
                    <span>⚡ All Subcategories</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      !selectedSubcategoryFilter ? 'bg-slate-950 text-amber-400' : 'bg-white/20 text-white'
                    }`}>
                      {products.filter(p => isCategoryMatch(p, selectedCategoryName, categories)).length}
                    </span>
                  </button>

                  {/* Individual Subcategory Filter Pills */}
                  {activeCategorySubcategories.map(sub => {
                    const isSubActive = selectedSubcategoryFilter.trim().toLowerCase() === sub.name.trim().toLowerCase();
                    return (
                      <button
                        key={sub.name}
                        onClick={() => setSelectedSubcategoryFilter(isSubActive ? '' : sub.name)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                          isSubActive
                            ? 'bg-[#0F9D8A] text-white font-black ring-2 ring-teal-300 shadow-md scale-105'
                            : 'bg-white/10 hover:bg-white/20 text-slate-100 border border-white/15'
                        }`}
                      >
                        <span>{sub.name}</span>
                        {sub.count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                            isSubActive ? 'bg-white text-teal-900 font-black' : 'bg-white/20 text-slate-200'
                          }`}>
                            {sub.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marketplace Catalog: 2-Column Responsive Layout (Filter Sidebar + Products Grid) */}
        <section className="space-y-4">
          
          {/* Top Control Bar: Total Count, Active Filter Chips, Sort Dropdown & Mobile Filter Button */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(prev => !prev)}
                  className="lg:hidden bg-[#0077B6] hover:bg-[#005f92] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters &amp; Sort</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>Medical Equipment Marketplace Catalog</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({filteredMarketplaceProducts.length} of {products.length} products)
                    </span>
                  </h3>
                  {selectedCategoryName && (
                    <p className="text-xs text-[#0F9D8A] font-semibold">
                      Filtered by department: <strong>{selectedCategoryName}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* View Mode Toggle & Sort By Dropdown */}
              <div className="flex flex-wrap items-center gap-3 ml-auto">
                {/* View Mode Switcher */}
                <div className="flex items-center bg-[#F5F7FA] p-1 rounded-xl border border-slate-200 gap-1 shadow-2xs">
                  <button
                    onClick={() => setCatalogViewMode('category_wise')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      catalogViewMode === 'category_wise'
                        ? 'bg-white text-teal-800 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Display equipment grouped into category-wise department grids"
                  >
                    <span>📑 Category-Wise Grid</span>
                    <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.2 rounded-md font-mono">
                      {categoryWiseProductGroups.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setCatalogViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      catalogViewMode === 'grid'
                        ? 'bg-white text-[#0077B6] shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Display all equipment in a single flat grid"
                  >
                    <span>🔲 All Products Grid</span>
                    <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-md font-mono">
                      {filteredMarketplaceProducts.length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1 hidden sm:inline-flex">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    Sort By:
                  </span>
                  <select
                    value={catalogSortBy}
                    onChange={(e) => setCatalogSortBy(e.target.value as any)}
                    className="bg-[#F5F7FA] border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
                  >
                    <option value="relevance">⚡ Featured &amp; Relevance</option>
                    <option value="price_asc">💰 Price: Low to High</option>
                    <option value="price_desc">💎 Price: High to Low</option>
                    <option value="rating_desc">⭐ Highest Clinical Rating</option>
                    <option value="warranty_desc">🛡️ Longest Warranty Period</option>
                    <option value="moq_asc">📦 MOQ: Low to High</option>
                    <option value="brand_asc">🏷️ Brand: A to Z</option>
                    <option value="newest">✨ Newest Arrivals</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters Pill Bar */}
            {activeFiltersCount > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Active Filters:</span>
                
                {selectedCategoryName && (
                  <span className="inline-flex items-center gap-1 bg-[#0F9D8A]/10 text-[#0F9D8A] border border-[#0F9D8A]/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                    Category: {selectedCategoryName}
                    <button onClick={() => onCategorySelect('')} className="hover:text-rose-600 cursor-pointer ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {(filterPriceMin > 0 || filterPriceMax < 1000000000) && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                    Price: ₹{filterPriceMin.toLocaleString()} - ₹{filterPriceMax.toLocaleString()}
                    <button onClick={() => { setFilterPriceMin(0); setFilterPriceMax(1000000000); }} className="hover:text-rose-600 cursor-pointer ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedBrands.map(b => (
                  <span key={b} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                    Brand: {b}
                    <button onClick={() => toggleBrandFilter(b)} className="hover:text-rose-600 cursor-pointer ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {selectedWarranty !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                    Warranty: {
                      selectedWarranty === '1_year' ? '1+ Year' :
                      selectedWarranty === '2_years' ? '2+ Years' :
                      selectedWarranty === '3_years_plus' ? '3+ Years AMC' : '5+ Years'
                    }
                    <button onClick={() => setSelectedWarranty('all')} className="hover:text-rose-600 cursor-pointer ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filterVerifiedVendorsOnly && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                    ✓ Verified Vendors Only
                    <button onClick={() => setFilterVerifiedVendorsOnly(false)} className="hover:text-rose-600 cursor-pointer ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filterInStockOnly && (
                  <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                    ⚡ In Stock Only
                    <button onClick={() => setFilterInStockOnly(false)} className="hover:text-rose-600 cursor-pointer ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filterMinRating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                    ⭐ {filterMinRating}+ Rating
                    <button onClick={() => setFilterMinRating(0)} className="hover:text-rose-600 cursor-pointer ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 ml-auto cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* Main 2-Column Catalog Container */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Filter Sidebar (Sticky on Desktop, slide-over/collapsible on mobile) */}
            <aside 
              className={`w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-6 ${
                isMobileFilterOpen ? 'block' : 'hidden lg:block'
              } lg:sticky lg:top-24`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#0077B6]" />
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Catalog Filters</h4>
                  {activeFiltersCount > 0 && (
                    <span className="bg-[#0F9D8A] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* 1. Verified Vendor & Quality Trust Filters */}
              <div className="space-y-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Trust &amp; Verification
                </span>
                
                {/* Verified Vendors Only Toggle */}
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={filterVerifiedVendorsOnly}
                    onChange={(e) => setFilterVerifiedVendorsOnly(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-black text-emerald-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Vendors Only
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium leading-tight mt-0.5">
                      TrustSeal verified, ISO 13485 compliant &amp; audited suppliers
                    </p>
                  </div>
                </label>

                {/* In Stock Only Toggle */}
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={filterInStockOnly}
                    onChange={(e) => setFilterInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0077B6] focus:ring-[#0077B6] border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#0077B6]" />
                      Ready to Dispatch (In Stock)
                    </span>
                  </div>
                </label>
              </div>

              {/* 2. Price Range Filter */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Price Range (₹)
                  </span>
                  <span className="text-xs font-mono font-black text-[#0077B6]">
                    ₹{filterPriceMax.toLocaleString()}
                  </span>
                </div>

                {/* Range Slider for Max Price */}
                <input
                  type="range"
                  min="0"
                  max="1000000000"
                  step="50000"
                  value={filterPriceMax}
                  onChange={(e) => setFilterPriceMax(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0077B6]"
                />

                {/* Dual Min / Max Inputs */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Min Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={filterPriceMax}
                      value={filterPriceMin}
                      onChange={(e) => setFilterPriceMin(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-[#F5F7FA] border border-slate-300 rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0077B6]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Max Price (₹)</label>
                    <input
                      type="number"
                      min={filterPriceMin}
                      max="1000000000"
                      value={filterPriceMax}
                      onChange={(e) => setFilterPriceMax(Number(e.target.value))}
                      className="w-full bg-[#F5F7FA] border border-slate-300 rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0077B6]"
                    />
                  </div>
                </div>

                {/* Quick Price Preset Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'Under ₹25k', max: 25000 },
                    { label: '₹25k - ₹1L', min: 25000, max: 100000 },
                    { label: '₹1L - ₹5L', min: 100000, max: 500000 },
                    { label: '₹5L - ₹25L', min: 500000, max: 2500000 },
                    { label: '₹25L - ₹1Cr', min: 2500000, max: 10000000 },
                    { label: 'All (≤ ₹100Cr)', min: 0, max: 1000000000 }
                  ].map(preset => {
                    const isActive = (preset.min !== undefined ? filterPriceMin === preset.min : filterPriceMin === 0) && filterPriceMax === preset.max;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setFilterPriceMin(preset.min || 0);
                          setFilterPriceMax(preset.max);
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                          isActive
                            ? 'bg-[#0077B6] text-white border-[#0077B6] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Brand Filter */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Medical Brand
                  </span>
                  {selectedBrands.length > 0 && (
                    <button
                      onClick={() => setSelectedBrands([])}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Search within brands */}
                {availableBrands.length > 5 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search brands..."
                      value={brandSearchQuery}
                      onChange={(e) => setBrandSearchQuery(e.target.value)}
                      className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#0077B6]"
                    />
                  </div>
                )}

                {/* Brands Checklist */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {filteredAvailableBrands.map(b => {
                    const isChecked = selectedBrands.includes(b.name);
                    return (
                      <label
                        key={b.name}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition ${
                          isChecked ? 'bg-purple-50 font-bold text-purple-900' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBrandFilter(b.name)}
                            className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                          />
                          <span className="truncate">{b.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.2 rounded-md shrink-0">
                          {b.count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 4. Warranty Period Filter */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Warranty &amp; AMC Coverage
                </span>

                <div className="space-y-1 text-xs">
                  {[
                    { id: 'all', label: 'All Warranties', icon: '🛡️' },
                    { id: '1_year', label: '1+ Year Standard Warranty', icon: '⭐' },
                    { id: '2_years', label: '2+ Years Extended Warranty', icon: '✨' },
                    { id: '3_years_plus', label: '3+ Years Comprehensive AMC', icon: '🏆' },
                    { id: '5_years_plus', label: '5+ Years Hospital Grade', icon: '🎖️' }
                  ].map(w => {
                    const isSelected = selectedWarranty === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWarranty(w.id)}
                        className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-black shadow-2xs'
                            : 'bg-[#F5F7FA] border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{w.icon}</span>
                          <span>{w.label}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 font-bold" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Clinical Rating Filter */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Minimum Rating
                </span>
                
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { stars: 0, label: 'All Ratings' },
                    { stars: 3.5, label: '3.5+ ★' },
                    { stars: 4.0, label: '4.0+ ★' },
                    { stars: 4.5, label: '4.5+ ★' }
                  ].map(r => (
                    <button
                      key={r.stars}
                      onClick={() => setFilterMinRating(r.stars)}
                      className={`p-1.5 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                        filterMinRating === r.stars
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-[#F5F7FA] text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Close Drawer Button on Mobile */}
              <div className="lg:hidden pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-[#0077B6] hover:bg-[#005f92] text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  Apply &amp; View {filteredMarketplaceProducts.length} Products
                </button>
              </div>

            </aside>

            {/* Right Product Grid Area */}
            <div className="flex-1 w-full space-y-4">
              
              {/* Product Grid */}
              {filteredMarketplaceProducts.length > 0 ? (
                catalogViewMode === 'category_wise' ? (
                  <div className="space-y-6">
                    {/* Category Quick Jump Sticky Bar */}
                    {categoryWiseProductGroups.length > 1 && (
                      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2 sticky top-3 z-20">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <span className="text-[#0F9D8A]">⚡ Quick Jump:</span>
                            <span className="text-teal-700 font-bold">({categoryWiseProductGroups.length} Specialty Departments)</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Click department to scroll directly</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                          {categoryWiseProductGroups.map(group => (
                            <button
                              key={group.id}
                              onClick={() => {
                                const el = document.getElementById(`cat-grid-${group.id}`);
                                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className="shrink-0 bg-[#F5F7FA] hover:bg-teal-50 border border-slate-200 hover:border-teal-400 text-slate-700 hover:text-teal-900 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer group"
                            >
                              <span>{group.icon}</span>
                              <span>{group.displayName}</span>
                              <span className="bg-slate-200 group-hover:bg-teal-100 text-slate-700 group-hover:text-teal-800 text-[10px] px-1.5 py-0.2 rounded-md font-mono">
                                {group.products.length}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Department-wise Product Sections with motion animations */}
                    <div className="space-y-6">
                      <AnimatePresence>
                        {categoryWiseProductGroups.map((group) => {
                          const isCollapsed = collapsedCategories[group.name];
                          const activeSub = categorySubFilter[group.name];

                          return (
                            <motion.section
                              key={group.id}
                              id={`cat-grid-${group.id}`}
                              layout
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -15 }}
                              transition={{ duration: 0.25 }}
                              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-300 overflow-hidden scroll-mt-28"
                            >
                              {/* Department Header */}
                              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-teal-50/20 to-white border-b border-slate-200/80 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center text-xl shadow-inner border border-teal-500/20 shrink-0">
                                      {group.icon}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                                          {group.displayName}
                                        </h4>
                                        <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono shadow-2xs">
                                          {group.products.length} {group.products.length === 1 ? 'Product' : 'Products'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Verified clinical systems &amp; healthcare supplies
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 ml-auto">
                                    <button
                                      onClick={() => handleCategoryClick(group.name)}
                                      className="bg-white hover:bg-slate-50 text-[#0077B6] hover:text-[#005f92] border border-slate-200 hover:border-[#0077B6] text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                      title={`Filter catalog strictly to ${group.displayName}`}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Focus Department</span>
                                    </button>
                                    <button
                                      onClick={() => toggleCategoryCollapse(group.name)}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold p-2 rounded-xl transition cursor-pointer"
                                      title={isCollapsed ? "Expand section" : "Collapse section"}
                                    >
                                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>

                                {/* Subcategory In-Group Filter Pills */}
                                {group.subcategories.length > 0 && (
                                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                                      <Layers className="w-3 h-3" /> Subcategories:
                                    </span>
                                    <button
                                      onClick={() => handleSetCategorySubFilter(group.name, '')}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                        !activeSub
                                          ? 'bg-teal-700 text-white font-black shadow-2xs'
                                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                      }`}
                                    >
                                      <span>All</span>
                                      <span className="text-[9px] opacity-80 font-mono">({group.rawCount})</span>
                                    </button>
                                    {group.subcategories.map(sub => {
                                      const isSubActive = activeSub?.toLowerCase() === sub.name.toLowerCase();
                                      return (
                                        <button
                                          key={sub.name}
                                          onClick={() => handleSetCategorySubFilter(group.name, sub.name)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                            isSubActive
                                              ? 'bg-teal-700 text-white font-black shadow-2xs'
                                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                          }`}
                                        >
                                          <span>{sub.name}</span>
                                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                            isSubActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-500'
                                          }`}>
                                            {sub.count}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Responsive Category Product Grid with layout transition */}
                              {!isCollapsed ? (
                                <div className="p-4 sm:p-5 bg-slate-50/30 space-y-4">
                                  <motion.div 
                                    layout
                                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                                  >
                                    <AnimatePresence>
                                      {group.products.map(p => renderProductCard(p, true))}
                                    </AnimatePresence>
                                  </motion.div>

                                  <div className="pt-2 flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-medium">
                                      Showing {group.products.length} {group.products.length === 1 ? 'equipment' : 'equipment items'} in {group.displayName}
                                    </span>
                                    <button
                                      onClick={() => handleCategoryClick(group.name)}
                                      className="text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                      <span>Browse Full {group.displayName} Catalog ({group.rawCount})</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50/50">
                                  <button
                                    onClick={() => toggleCategoryCollapse(group.name)}
                                    className="text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-1 mx-auto"
                                  >
                                    <span>{group.products.length} products hidden. Click to expand {group.displayName} grid</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </motion.section>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  /* Unified Single Grid with layout transitions */
                  <motion.div 
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    <AnimatePresence>
                      {filteredMarketplaceProducts.map(p => renderProductCard(p, true))}
                    </AnimatePresence>
                  </motion.div>
                )
              ) : (
                /* Empty Search/Filter State */
                <div className="w-full py-16 px-6 text-center bg-white border border-slate-200 rounded-3xl space-y-4 shadow-xs">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                    🔍
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h4 className="text-base font-black text-slate-900">No medical equipment matches your filters</h4>
                    <p className="text-xs text-slate-500">
                      Try expanding your price range, clearing brand selections, or selecting "All Warranties" to see more equipment.
                    </p>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="bg-[#0077B6] hover:bg-[#005f92] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                </div>
              )}

            </div>

          </div>

        </section>

        {/* Static Category Sliders for Core Medical Domains */}
        <div className="space-y-8 pt-6 border-t border-slate-200">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-lg font-black text-[#1F2937]">Curated Hospital Department Showcases</h3>
            <p className="text-xs text-slate-500 font-medium">Explore turnkey setup packages and machines grouped by specialty</p>
          </div>

          {staticCategorySections.map((section) => (
            <section key={section.name} className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{section.icon}</span>
                  <div>
                    <h4 className="text-base font-black text-[#1F2937]">{section.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{section.description} ({section.products.length} items)</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleCategoryClick(section.name)} 
                  className="text-xs font-bold text-[#0077B6] hover:underline cursor-pointer flex items-center gap-1"
                >
                  View All {section.name} ({section.products.length}) &rarr;
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {section.products.map(p => renderProductCard(p, false))}
              </div>
            </section>
          ))}
        </div>

      </div>

      {/* PROMOTIONAL BANNER 1: Upgrade Your Healthcare Facility */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-gradient-to-r from-[#1F2937] via-[#0f2e46] to-[#0077B6] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#0F9D8A] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                HEALTHCARE EXPANSION PROGRAM
              </span>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase font-mono shadow-sm">
                0% EMI Available
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Upgrade Your Healthcare Facility
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              Equip your hospital, ICU, OT, Diagnostic Lab, or Specialty Clinic with flexible institutional financing, certified biomedical installation &amp; calibration, and Pan-India logistics.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-bold text-teal-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#0F9D8A] shrink-0" />
                <span>0% EMI Schemes</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#0F9D8A] shrink-0" />
                <span>Biomedical Demo</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#0F9D8A] shrink-0" />
                <span>GST Tax Invoice</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#0F9D8A] shrink-0" />
                <span>PAN-India Logistics</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-3 pt-3">
              <button
                onClick={() => onNavigate('rfqs')}
                className="bg-[#0F9D8A] hover:bg-[#0c8272] text-white font-black text-xs sm:text-sm px-7 py-3.5 rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Book Procurement Consultation</span>
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('catalog-anchor');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition backdrop-blur-sm border border-white/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Turnkey Packages</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="z-10 shrink-0 hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center space-y-3 w-72 shadow-2xl">
              <div className="w-16 h-16 bg-[#0077B6] text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-lg">
                🏥
              </div>
              <h4 className="text-sm font-black text-white">Institutional Procurement Desk</h4>
              <p className="text-[11px] text-slate-200">Instant quotation within 2 hours for verified medical directors</p>
              <div className="pt-2 border-t border-white/20">
                <span className="text-[11px] font-mono font-bold text-teal-300">Helpline: +91 9103500592</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. REFURBISHED MEDICAL EQUIPMENT */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-[#F5F7FA] rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#0077B6] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Certified Refurbished
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  1-Year Pan-India Service Warranty
                </span>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {refurbishedEquipmentProducts.length} {refurbishedEquipmentProducts.length === 1 ? 'Product' : 'Products'} Available
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1F2937] mt-1">Refurbished Imaging &amp; ICU Equipment</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                OEM-calibrated clinical diagnostic imaging systems &amp; critical care ventilators tested to original factory specifications
              </p>
            </div>
            <button 
              onClick={() => handleCategoryClick('Refurbished Equipment')} 
              className="text-xs font-bold text-[#0F9D8A] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>Explore Refurbished Catalog ({refurbishedEquipmentProducts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {refurbishedEquipmentProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {refurbishedEquipmentProducts.map(p => renderProductCard(p, true))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "1.5T MRI Machine", spec: "Superconducting Magnet • 16-Ch RF Coils", sub: "Diagnostic Imaging" },
                { title: "64-Slice CT Scanner", spec: "0.33s Rotation • Ultra Low-Dose ASiR", sub: "Radiology Systems" },
                { title: "3D Color Doppler Ultrasound", spec: "Convex + Linear + Cardiac Probes", sub: "Ultrasound & Sonography" },
                { title: "Digital X-Ray System", spec: "High-Frequency 50kW Generator • Wireless FPD", sub: "Digital Radiography" }
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2 text-center shadow-xs hover:shadow-md transition">
                  <div className="h-28 rounded-xl bg-slate-100 flex flex-col items-center justify-center p-2 text-center">
                    <Activity className="w-8 h-8 text-[#0077B6] mb-1" />
                    <span className="text-[10px] text-teal-700 font-bold">{item.sub}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1F2937] leading-tight">{item.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{item.spec}</p>
                  <p className="text-xs font-black text-[#0F9D8A] font-mono">Up to 50% OFF OEM Price</p>
                  <button 
                    onClick={() => onNavigate('rfqs')}
                    className="w-full bg-[#0077B6] hover:bg-[#005f92] text-white font-bold text-[11px] py-1.5 rounded-xl transition mt-1 cursor-pointer"
                  >
                    Request Quote / RFQ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROMOTIONAL BANNER 2: Bulk Purchase / Hospital Procurement Banner */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-gradient-to-r from-[#0077B6] via-[#0F9D8A] to-emerald-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              BULK PURCHASE &amp; RFQ TENDERS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Procuring for Hospitals &amp; Clinics? Get Custom Institutional Pricing &amp; RFQ Support
            </h2>
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
              Dedicated biomedical account managers, consolidated GST tax invoicing, and direct factory volume discounts for multi-bed hospitals, nursing homes, and diagnostic centers.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-bold pt-1">
              <span>✓ Verified OEM Pricing</span>
              <span>✓ Escrow Payment Safety</span>
              <span>✓ Turnkey Setup &amp; Training</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => onNavigate('rfqs')}
              className="bg-white text-[#1F2937] hover:bg-slate-100 font-extrabold text-xs sm:text-sm px-7 py-4 rounded-2xl transition shadow-xl cursor-pointer"
            >
              Submit RFQ Tender
            </button>
            <a
              href="https://wa.me/919103500592"
              target="_blank"
              rel="noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm px-6 py-4 rounded-2xl transition shadow-xl text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Talk to Specialist</span>
            </a>
          </div>
        </div>
      </section>

      {/* 8. WHY HEALNEX: 6 Premium Cards */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-[#1F2937]">Why Choose HealNex Medi Bazar?</h2>
          <p className="text-xs text-slate-500">Built specifically for hospitals, diagnostic centers, and healthcare providers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-[#0F9D8A] transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0077B6]/10 text-[#0077B6] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">100% Genuine Products</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Direct manufacturer dispatch guarantees original products with valid serial numbers and certificates.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-[#0F9D8A] transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F9D8A]/10 text-[#0F9D8A] flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Verified B2B Vendors</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Every vendor undergoes rigorous GST, drug license, and ISO audit before listing products.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-[#0F9D8A] transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <BadgeDollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Secure Escrow Payments</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Payments remain safely held until equipment is delivered and verified by your clinical team.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-[#0F9D8A] transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Hassle-Free Returns</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Transparent 7-day return and replacement policy for any transit damage or spec mismatch.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-[#0F9D8A] transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Expert Installation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Certified biomedical engineers handle demo, installation, and user training across India.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-[#0F9D8A] transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">24x7 Clinical Support</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Dedicated medical product specialists assist with spec comparison and order processing.</p>
          </div>
        </div>
      </section>

      {/* 9. CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-[#1F2937]">Trusted by Doctors &amp; Hospital Directors</h2>
          <p className="text-xs text-slate-500">Real feedback from healthcare professionals procurement managers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { doctor: "Dr. Rajesh Sharma", hospital: "Apollo Multispecialty, Delhi", review: "Procured 5 ECG machines and 2 patient monitors via HealNex. Fast dispatch, GST invoice delivered seamlessly, and engineer completed installation next day.", rating: 5 },
            { doctor: "Dr. Ananya Roy", hospital: "Kolkata Heart Institute", review: "The RFQ bidding feature saved our hospital almost 15% on bulk ICU bed procurement. Verified vendors and smooth escrow payment experience.", rating: 5 },
            { doctor: "Dr. Vikram Patel", hospital: "Surat Diagnostics Center", review: "Bought a certified refurbished color doppler ultrasound. Pristine condition with 1-year warranty. Excellent technical support!", rating: 5 }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#F5F7FA] rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">"{item.review}"</p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1F2937]">{item.doctor}</h4>
                  <p className="text-[10px] text-slate-500">{item.hospital}</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Verified Purchase
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. HEALTHCARE CLIENTS LOGO WALL */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-4 text-center">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Serving Leading Healthcare Organizations</h3>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition duration-500 py-2">
          {["Multispecialty Hospitals", "Diagnostic Centers", "Medical Colleges", "OT & ICU Centers", "NGO Clinics", "Government Procurement"].map((client) => (
            <span key={client} className="text-xs font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-xl">
              🏢 {client}
            </span>
          ))}
        </div>
      </section>

      {/* 11. TRUSTED STATISTICS */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-[#0077B6] text-white rounded-3xl p-8 sm:p-12 text-center grid grid-cols-2 md:grid-cols-6 gap-6 shadow-xl">
          <div>
            <span className="text-2xl sm:text-3xl font-black block font-mono">10,000+</span>
            <span className="text-[11px] text-slate-200 font-medium">Products</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black block font-mono">500+</span>
            <span className="text-[11px] text-slate-200 font-medium">Brands</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black block font-mono">2,000+</span>
            <span className="text-[11px] text-slate-200 font-medium">Verified Vendors</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black block font-mono">100,000+</span>
            <span className="text-[11px] text-slate-200 font-medium">Customers</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black block font-mono">50+</span>
            <span className="text-[11px] text-slate-200 font-medium">Categories</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black block font-mono">99%</span>
            <span className="text-[11px] text-slate-200 font-medium">Positive Rating</span>
          </div>
        </div>
      </section>

      {/* 12. BECOME A VENDOR BANNER */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-gradient-to-r from-[#0F9D8A] to-[#0077B6] rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl">
            <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              VENDOR PARTNERSHIP PROGRAM
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Sell Medical Equipment Across India</h2>
            <p className="text-xs sm:text-sm text-slate-100">
              Grow your medical equipment business. Reach 100,000+ verified hospitals, clinics, and doctors with zero setup fees.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-bold pt-2">
              <span>✓ Zero Setup Fee</span>
              <span>✓ Verified Hospital Leads</span>
              <span>✓ Escrow Guaranteed Payments</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (onBecomeSeller) onBecomeSeller();
              else onNavigate('register_vendor');
            }}
            className="bg-white text-[#1F2937] hover:bg-slate-100 font-extrabold text-sm px-8 py-4 rounded-2xl transition shadow-xl shrink-0"
          >
            Register as Vendor
          </button>
        </div>
      </section>

      {/* 13. MOBILE APP SECTION */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-[#F5F7FA] rounded-3xl p-8 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-lg">
            <span className="bg-[#0077B6] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
              HEALNEX MOBILE APP
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1F2937]">Procure Hospital Supplies On The Go</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download the HealNex Medi Bazar app on Android and iOS to track orders, submit RFQs, and get instant price drop alerts directly on your phone.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a 
                href={socialLinks.playStoreUrl || socialLinks.appDownloadLink || '#'} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-[#1F2937] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>📱 Google Play</span>
              </a>
              <a 
                href={socialLinks.appStoreUrl || socialLinks.appDownloadLink || '#'} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-[#1F2937] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>🍎 App Store</span>
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-36 h-36 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-md text-center flex flex-col items-center justify-center relative group">
              {socialLinks.appQrCodeUrl ? (
                <img src={socialLinks.appQrCodeUrl} alt="App QR Code" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(socialLinks.appDownloadLink || socialLinks.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.healnex.medibazar')}`} 
                  alt="Download HealNex App QR Code" 
                  className="w-full h-full object-contain rounded-xl"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-[#1F2937] uppercase flex items-center gap-1">
                <QrCode className="w-3 h-3 text-teal-600" />
                Scan QR to Download App
              </span>
              {socialLinks.appQrCodeUrl && (
                <a
                  href={socialLinks.appQrCodeUrl}
                  download="HealNex-App-QR.png"
                  title="Download QR Code Image"
                  className="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-md transition"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 14. NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-[#1F2937] text-white rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <h2 className="text-xl font-black">Stay Updated on Medical Procurement News</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Subscribe for weekly price index updates, new product launches, and hospital equipment tenders.</p>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (emailInput) {
                addToast("Subscribed successfully to HealNex updates!", "success");
                setEmailInput('');
              }
            }}
            className="flex max-w-md mx-auto gap-2"
          >
            <input
              type="email"
              placeholder="Enter hospital email address..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#0F9D8A]"
              required
            />
            <button type="submit" className="bg-[#0F9D8A] hover:bg-[#0c8272] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shrink-0">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Image Lightbox / Modal Zoom Feature */}
      <ImageLightboxModal
        isOpen={!!lightboxProduct}
        onClose={() => setLightboxProduct(null)}
        product={lightboxProduct}
        onAddToCart={onAddToCart}
      />

    </div>
  );
}
