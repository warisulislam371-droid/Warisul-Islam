import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Notification, Category, PriceAlert, RFQ, Product } from '../types';
import { dbLocal } from '../db';
import { MARKETPLACE_LOGO } from '../assets/logo';
import {
  Activity,
  Search,
  Mic,
  MicOff,
  Camera,
  ShoppingCart,
  Heart,
  Bell,
  User as UserIcon,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Store,
  HelpCircle,
  MapPin,
  ClipboardList,
  MessageCircle,
  Scale,
  Globe,
  Truck,
  CheckCircle,
  PhoneCall,
  Menu,
  X,
  Layers,
  ArrowRight,
  TrendingDown,
  Tag,
  FilePlus,
  PackageCheck
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
  cartCount: number;
  wishlistCount: number;
  compareCount: number;
  searchQuery?: string;
  selectedCategoryName?: string;
  onSearch: (query: string) => void;
  onCategorySelect: (catName: string) => void;
  isDarkMode?: boolean;
  designTemplate?: string;
  onChangeDesignTemplate?: (template: string) => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  onNavigate,
  currentView,
  cartCount,
  wishlistCount,
  compareCount,
  searchQuery: externalSearchQuery = '',
  selectedCategoryName = '',
  onSearch,
  onCategorySelect,
  isDarkMode = false,
  designTemplate = 'sapphire',
  onChangeDesignTemplate
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [selectedSearchCategory, setSelectedSearchCategory] = useState('All Categories');
  const [deliveryLocation, setDeliveryLocation] = useState('Pune 411001');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [country, setCountry] = useState('India (₹)');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCategoryMegaMenu, setShowCategoryMegaMenu] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live search popover states
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  const locations = [
    { city: 'Pune', pin: '411001' },
    { city: 'Mumbai', pin: '400001' },
    { city: 'Delhi', pin: '110001' },
    { city: 'Bangalore', pin: '560001' },
    { city: 'Kolkata', pin: '700001' },
    { city: 'Chennai', pin: '600001' },
    { city: 'Hyderabad', pin: '500001' }
  ];

  const megaCategories = [
    'Diagnostic Equipment', 'Patient Monitoring', 'ECG Machines', 'Ultrasound',
    'X-Ray', 'CT Scan', 'MRI', 'Laboratory Equipment', 'Hospital Furniture',
    'ICU Equipment', 'OT Equipment', 'Surgical Instruments', 'Dental Equipment',
    'Medical Consumables', 'Respiratory Equipment', 'Home Healthcare',
    'Rehabilitation', 'Physiotherapy', 'Medical IT', 'Veterinary',
    'Refurbished Equipment', 'Spare Parts', 'Accessories'
  ];

  useEffect(() => {
    setSearchQuery(externalSearchQuery || '');
  }, [externalSearchQuery]);

  useEffect(() => {
    const refreshData = () => {
      setNotifications(dbLocal.getNotifications());
      setPriceAlerts(dbLocal.getPriceAlerts());
      setRfqs(dbLocal.getRfqs());
      setAllProducts(dbLocal.getProducts().filter(p => p.status !== 'Draft' && p.status !== 'Rejected' && p.published !== false && p.isActive !== false));
      setAllCategories(dbLocal.getCategories().filter(c => c.isActive !== false));
    };
    refreshData();
    window.addEventListener('healnex_db_update', refreshData);
    return () => window.removeEventListener('healnex_db_update', refreshData);
  }, []);

  // Handle outside clicks to close search auto-suggest dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(e.target as Node)) {
        setIsMobileSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract all distinct subcategories with parent category and product counts
  const distinctSubcategories = useMemo(() => {
    const subcatMap = new Map<string, { name: string; categoryName: string; count: number }>();
    
    // First collect from registered Categories
    allCategories.forEach(cat => {
      if (Array.isArray(cat.subcategories)) {
        cat.subcategories.forEach(sub => {
          const trimmed = sub.trim();
          if (trimmed && !subcatMap.has(trimmed.toLowerCase())) {
            subcatMap.set(trimmed.toLowerCase(), {
              name: trimmed,
              categoryName: cat.name,
              count: 0
            });
          }
        });
      }
    });

    // Also scan all products for any explicit subcategories
    allProducts.forEach(prod => {
      const sub = (prod.subcategory || '').trim();
      if (sub) {
        const key = sub.toLowerCase();
        if (subcatMap.has(key)) {
          subcatMap.get(key)!.count += 1;
        } else {
          subcatMap.set(key, {
            name: sub,
            categoryName: prod.category || 'Medical Equipment',
            count: 1
          });
        }
      }
    });

    return Array.from(subcatMap.values());
  }, [allCategories, allProducts]);

  // Word-matching search suggestions calculation
  const searchSuggestions = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return { subcategories: [], products: [], categories: [], totalCount: 0 };

    const queryLower = rawQuery.toLowerCase();
    const words = queryLower.split(/\s+/).filter(w => w.length > 0);

    // 1. Match Subcategories if ANY word matches
    const matchedSubcategories = distinctSubcategories.map(sub => {
      const subLower = sub.name.toLowerCase();
      const catLower = sub.categoryName.toLowerCase();
      let score = 0;

      if (subLower === queryLower) score += 100;
      else if (subLower.startsWith(queryLower)) score += 80;
      else if (subLower.includes(queryLower)) score += 60;

      // Check each word
      let wordMatches = 0;
      words.forEach(w => {
        if (subLower.includes(w)) {
          score += 30;
          wordMatches++;
        } else if (catLower.includes(w)) {
          score += 15;
        }
      });

      return {
        ...sub,
        score,
        matched: score > 0 || (words.length === 1 && subLower.includes(words[0]))
      };
    })
    .filter(s => s.matched && s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

    // 2. Match Products if ANY word matches
    const matchedProducts = allProducts.map(p => {
      const nameLower = (p.name || '').toLowerCase();
      const brandLower = (p.brand || '').toLowerCase();
      const skuLower = (p.sku || '').toLowerCase();
      const modelLower = (p.modelNumber || '').toLowerCase();
      const subLower = (p.subcategory || '').toLowerCase();
      const catLower = (p.category || '').toLowerCase();

      let score = 0;
      if (nameLower === queryLower) score += 120;
      else if (nameLower.startsWith(queryLower)) score += 90;
      else if (nameLower.includes(queryLower)) score += 70;

      let matchedWordCount = 0;
      words.forEach(w => {
        if (nameLower.includes(w)) {
          score += 35;
          matchedWordCount++;
        } else if (modelLower.includes(w) || skuLower.includes(w)) {
          score += 30;
          matchedWordCount++;
        } else if (brandLower.includes(w)) {
          score += 25;
          matchedWordCount++;
        } else if (subLower.includes(w)) {
          score += 20;
          matchedWordCount++;
        } else if (catLower.includes(w)) {
          score += 15;
          matchedWordCount++;
        }
      });

      return {
        product: p,
        score,
        matched: score > 0 && (matchedWordCount > 0 || nameLower.includes(queryLower))
      };
    })
    .filter(item => item.matched && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

    // 3. Match Parent Categories if ANY word matches
    const matchedCategories = allCategories.map(cat => {
      const catLower = cat.name.toLowerCase();
      let score = 0;
      if (catLower === queryLower) score += 100;
      else if (catLower.startsWith(queryLower)) score += 70;
      else if (catLower.includes(queryLower)) score += 50;

      words.forEach(w => {
        if (catLower.includes(w)) score += 25;
      });

      return {
        category: cat,
        score,
        matched: score > 0
      };
    })
    .filter(c => c.matched && c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

    return {
      subcategories: matchedSubcategories,
      products: matchedProducts.map(m => m.product),
      categories: matchedCategories.map(c => c.category),
      totalCount: matchedSubcategories.length + matchedProducts.length + matchedCategories.length
    };
  }, [searchQuery, distinctSubcategories, allProducts, allCategories]);

  // Highlight matched search terms
  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return text;

    const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          words.includes(part.toLowerCase()) ? (
            <mark key={i} className="bg-teal-100 text-teal-900 font-extrabold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const activeRfqsCount = rfqs.length;

  const displayedNotifications = notifications.filter(n => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return n.userId === currentUser.id;
  });

  const unreadCount = displayedNotifications.filter(n => !n.read).length;
  const triggeredAlertsCount = priceAlerts.filter(a => a.status === 'triggered').length;
  const priceDropNotifs = displayedNotifications.filter(n =>
    n.title.toLowerCase().includes('price') || n.message.toLowerCase().includes('price') || n.message.toLowerCase().includes('drop')
  );
  const unreadPriceDropNotifsCount = priceDropNotifs.filter(n => !n.read).length;
  const priceDropBadgeCount = triggeredAlertsCount || unreadPriceDropNotifsCount || (priceAlerts.length > 0 ? priceAlerts.length : 0);
  const hasActivePriceDropTrigger = triggeredAlertsCount > 0 || unreadPriceDropNotifsCount > 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);
    onSearch(searchQuery);
    onNavigate('marketplace');
  };

  const triggerVoiceSearch = () => {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      return;
    }
    setIsVoiceListening(true);
    setTimeout(() => {
      const voiceSamples = ['ECG Machine', 'Ventilator', 'Patient Monitor', 'Nitrile Gloves', 'Ultrasound System'];
      const randomQuery = voiceSamples[Math.floor(Math.random() * voiceSamples.length)];
      setSearchQuery(randomQuery);
      onSearch(randomQuery);
      setIsVoiceListening(false);
      setIsSearchFocused(false);
      onNavigate('marketplace');
    }, 2000);
  };

  return (
    <header className="sticky top-0 z-50 bg-white font-sans text-[#1F2937] shadow-sm border-b border-slate-200">
      
      {/* Top Value / Utilities Bar (Hidden per user focus request) */}
      <div className="hidden bg-[#0077B6] text-white py-1 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-0.5">
            <span className="bg-[#0F9D8A] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              PAN India Delivery
            </span>
            <span className="hidden sm:inline">100% Verified Manufacturers &amp; B2B Distributors</span>
            <span className="hidden md:inline">•</span>
            
            {/* Delivery Location Picker */}
            <div className="relative">
              <button 
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="hover:text-amber-200 transition flex items-center gap-1 font-semibold text-xs cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>Deliver: <strong className="underline decoration-dashed">{deliveryLocation}</strong></span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showLocationDropdown && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                  <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Select Delivery Pincode</p>
                  {locations.map(loc => (
                    <button
                      key={loc.pin}
                      onClick={() => {
                        setDeliveryLocation(`${loc.city} ${loc.pin}`);
                        setShowLocationDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer"
                    >
                      <span>{loc.city}</span>
                      <span className="text-teal-600 font-mono text-[10px] font-bold">{loc.pin}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-xs">
            <button 
              onClick={() => onNavigate('orders')} 
              className="hover:text-teal-200 transition flex items-center gap-1 font-semibold"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </button>
            <button 
              onClick={() => onNavigate('register_vendor')} 
              className="hover:text-emerald-200 transition flex items-center gap-1 font-bold text-emerald-300"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vendor Login / Join</span>
            </button>
            
            {/* Language & Country Selector */}
            <div className="relative hidden lg:block">
              <button 
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1 hover:text-teal-200 transition font-medium"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{language} | {country}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                  <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Currency & Region</p>
                  <button 
                    onClick={() => { setCountry('India (₹)'); setShowLangDropdown(false); }}
                    className="w-full text-left px-2 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg flex items-center justify-between"
                  >
                    <span>India (INR)</span>
                    <span className="text-teal-600 font-bold">₹</span>
                  </button>
                  <button 
                    onClick={() => { setCountry('Global ($)'); setShowLangDropdown(false); }}
                    className="w-full text-left px-2 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg flex items-center justify-between"
                  >
                    <span>Export (USD)</span>
                    <span className="text-blue-600 font-bold">$</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Bar - 80px Height */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-[80px] flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => { onNavigate('marketplace'); onSearch(''); setSearchQuery(''); }}
          className="flex items-center gap-3 cursor-pointer shrink-0 transition-transform hover:scale-[1.01]"
        >
          <img
            src={MARKETPLACE_LOGO}
            alt="HealNex Medi Bazar Logo"
            referrerPolicy="no-referrer"
            className="w-12 h-12 object-contain rounded-xl shadow-sm bg-white p-0.5 border border-slate-200 shrink-0"
          />
          <div>
            <span className="font-display font-black text-xl tracking-tight block leading-none text-[#1F2937]">
              Heal<span className="text-[#0F9D8A]">Nex</span>
            </span>
            <span className="text-[10px] text-[#0077B6] font-bold tracking-widest uppercase block mt-1 font-sans">
              Medi Bazar
            </span>
          </div>
        </div>

        {/* Search Bar - Center */}
        <div ref={searchContainerRef} className="flex-1 max-w-2xl relative hidden md:block">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#F5F7FA] rounded-2xl border border-slate-300 focus-within:border-[#0F9D8A] focus-within:bg-white transition-all shadow-sm overflow-hidden h-12">
            
            {/* Category Dropdown inside Search */}
            <select
              value={selectedSearchCategory}
              onChange={(e) => {
                setSelectedSearchCategory(e.target.value);
                if (e.target.value !== 'All Categories') {
                  onCategorySelect(e.target.value);
                } else {
                  onCategorySelect('');
                }
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 px-3 py-2 border-r border-slate-300 outline-none cursor-pointer hidden lg:block hover:bg-slate-200/50 transition"
            >
              <option value="All Categories">All Categories</option>
              {megaCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search Medical Equipment, Subcategories, Brands..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                }
              }}
              className="w-full px-3 py-2 text-xs font-medium text-slate-800 outline-none bg-transparent placeholder-slate-400 font-sans"
            />

            {/* Clear button when text exists */}
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onSearch('');
                  setIsSearchFocused(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Voice & Image Search Controls */}
            <div className="flex items-center gap-1.5 px-2">
              <button
                type="button"
                onClick={triggerVoiceSearch}
                className={`p-1.5 rounded-xl transition ${
                  isVoiceListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-[#0077B6] hover:bg-slate-200/60'
                }`}
                title="Voice Search"
              >
                {isVoiceListening ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowImageSearchModal(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-[#0077B6] hover:bg-slate-200/60 transition"
                title="Search by Medical Device Image"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                type="submit"
                className="bg-[#0F9D8A] hover:bg-[#0c8272] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Auto-suggest Popover for Subcategories and Products */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in max-h-[75vh] flex flex-col font-sans">
              
              {/* Header Info */}
              <div className="bg-gradient-to-r from-slate-50 to-teal-50/40 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                  <span className="font-bold text-slate-800">
                    Live Matches for &ldquo;<span className="text-teal-700 font-black">{searchQuery}</span>&rdquo;
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {searchSuggestions.totalCount} matches
                </span>
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
                
                {/* 1. MATCHING SUBCATEGORIES SECTION */}
                {searchSuggestions.subcategories.length > 0 && (
                  <div className="space-y-1.5 p-1">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50/80 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-teal-600" />
                        <span>Matching Subcategories</span>
                      </div>
                      <span className="text-[10px] font-bold text-teal-800">{searchSuggestions.subcategories.length} found</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {searchSuggestions.subcategories.map((sub, idx) => (
                        <button
                          key={`${sub.name}-${idx}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSearchQuery(sub.name);
                            onCategorySelect('');
                            onSearch(sub.name);
                            onNavigate('marketplace');
                            setIsSearchFocused(false);
                            window.dispatchEvent(new CustomEvent('healnex_filter_subcategory', { detail: sub.name }));
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-teal-50 border border-slate-100 hover:border-teal-300 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-teal-900 truncate">
                                {highlightMatch(sub.name, searchQuery)}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                Category: <span className="font-semibold text-slate-600">{sub.categoryName}</span>
                              </p>
                            </div>
                          </div>
                          {sub.count > 0 && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full shrink-0 group-hover:bg-teal-200 group-hover:text-teal-900 ml-1">
                              {sub.count} {sub.count === 1 ? 'item' : 'items'}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. MATCHING PRODUCT NAMES SECTION */}
                {searchSuggestions.products.length > 0 && (
                  <div className="space-y-1.5 p-1 pt-2">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-teal-600" />
                        <span>Matching Products</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{searchSuggestions.products.length} found</span>
                    </div>

                    <div className="space-y-1">
                      {searchSuggestions.products.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSearchQuery(prod.name);
                            onSearch(prod.name);
                            onNavigate('marketplace');
                            setIsSearchFocused(false);
                            window.dispatchEvent(new CustomEvent('healnex_open_product', { detail: prod }));
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition text-left group cursor-pointer"
                        >
                          <img
                            src={prod.images?.[0] || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800'}
                            alt={prod.name}
                            className="w-11 h-11 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 truncate leading-snug">
                                {highlightMatch(prod.name, searchQuery)}
                              </p>
                              {prod.brand && (
                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 shrink-0">
                                  {prod.brand}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              {prod.subcategory ? (
                                <span className="text-teal-700 font-medium truncate flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5" />
                                  <span>{highlightMatch(prod.subcategory, searchQuery)}</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 font-medium truncate">
                                  {prod.category}
                                </span>
                              )}
                              {prod.modelNumber && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    Model: {highlightMatch(prod.modelNumber, searchQuery)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-xs text-slate-900 font-mono block">
                              ₹{prod.salePrice.toLocaleString('en-IN')}
                            </span>
                            {prod.stockQuantity !== undefined && prod.stockQuantity <= 0 ? (
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">Out of Stock</span>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">In Stock</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. MATCHING CATEGORIES */}
                {searchSuggestions.categories.length > 0 && (
                  <div className="space-y-1.5 p-1 pt-2">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3 h-3 text-teal-600" />
                        <span>Matching Department Categories</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{searchSuggestions.categories.length} found</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-1">
                      {searchSuggestions.categories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedSearchCategory(cat.name);
                            onCategorySelect(cat.name);
                            onSearch('');
                            setSearchQuery('');
                            onNavigate('marketplace');
                            setIsSearchFocused(false);
                          }}
                          className="bg-slate-100 hover:bg-teal-100 text-slate-800 hover:text-teal-900 text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-slate-200 hover:border-teal-300 cursor-pointer"
                        >
                          <Tag className="w-3 h-3 text-teal-600" />
                          <span>{highlightMatch(cat.name, searchQuery)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* NO RESULTS STATE */}
                {searchSuggestions.totalCount === 0 && (
                  <div className="p-6 text-center text-slate-500">
                    <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">No instant subcategory or product matches found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Press Enter or click Search to search across the entire clinical marketplace catalog.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer link to execute search */}
              <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSearch(searchQuery);
                    onNavigate('marketplace');
                    setIsSearchFocused(false);
                  }}
                  className="text-teal-700 hover:text-teal-900 font-extrabold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>View all search results for &ldquo;{searchQuery}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Press Enter ↵</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Navigation & Utility Badges */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          
          {/* Compare Badge */}
          <button
            onClick={() => onNavigate('marketplace')}
            className="p-2 rounded-2xl text-slate-600 hover:text-[#0077B6] hover:bg-slate-100 transition relative flex flex-col items-center justify-center text-[10px] font-bold"
            title="Product Comparison"
          >
            <Scale className="w-5 h-5 text-slate-700" />
            <span className="hidden lg:block text-[9px] mt-0.5">Compare</span>
            {compareCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#0077B6] text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {compareCount}
              </span>
            )}
          </button>

          {/* Wishlist Badge */}
          <button
            onClick={() => onNavigate('marketplace')}
            className="p-2 rounded-2xl text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition relative flex flex-col items-center justify-center text-[10px] font-bold"
            title="Saved Medical Items"
          >
            <Heart className="w-5 h-5 text-slate-700" />
            <span className="hidden lg:block text-[9px] mt-0.5">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Price Drops Badge */}
          <button
            onClick={() => onNavigate('price-alerts')}
            className="p-2 rounded-2xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition relative flex flex-col items-center justify-center text-[10px] font-bold"
            title="Price Drop Alerts & Saved Interests"
          >
            <TrendingDown className={`w-5 h-5 ${hasActivePriceDropTrigger ? 'text-amber-500 animate-pulse' : 'text-slate-700'}`} />
            <span className="hidden lg:block text-[9px] mt-0.5">Price Drops</span>
            {hasActivePriceDropTrigger ? (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full shadow-md animate-bounce flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                {triggeredAlertsCount || unreadPriceDropNotifsCount}
              </span>
            ) : priceAlerts.length > 0 ? (
              <span className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {priceAlerts.length}
              </span>
            ) : null}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-2xl text-slate-600 hover:text-[#0077B6] hover:bg-slate-100 transition relative flex flex-col items-center justify-center text-[10px] font-bold"
              title="Procurement Notifications"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              <span className="hidden lg:block text-[9px] mt-0.5">Notifs</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#0077B6] text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-slate-800">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                  <h4 className="font-bold text-xs">Notifications</h4>
                  <span className="text-[10px] text-teal-600 font-semibold">{unreadCount} New</span>
                </div>
                {hasActivePriceDropTrigger && (
                  <div className="p-2.5 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-xl mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{priceDropBadgeCount} Price Drop{priceDropBadgeCount > 1 ? 's' : ''} Alert Triggered!</span>
                    </div>
                    <button
                      onClick={() => { setShowNotifications(false); onNavigate('price-alerts'); }}
                      className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-lg transition"
                    >
                      View
                    </button>
                  </div>
                )}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {displayedNotifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No recent updates</p>
                  ) : (
                    displayedNotifications.map(n => (
                      <div key={n.id} className="p-2 rounded-xl bg-slate-50 text-xs border border-slate-100">
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        <p className="text-[11px] text-slate-500">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RFQ Tender System Badge */}
          <button
            onClick={() => onNavigate('rfqs')}
            className={`p-2 rounded-2xl transition relative flex flex-col items-center justify-center text-[10px] font-bold ${
              currentView === 'rfqs'
                ? 'text-[#0F9D8A] bg-teal-50 border border-teal-200'
                : 'text-slate-600 hover:text-[#0F9D8A] hover:bg-slate-100'
            }`}
            title="RFQ System: Request for Quotations & Hospital B2B Tenders"
          >
            <FilePlus className="w-5 h-5 text-teal-700" />
            <span className="hidden lg:block text-[9px] mt-0.5">RFQ System</span>
            {activeRfqsCount > 0 && (
              <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 font-mono font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-2xs">
                {activeRfqsCount}
              </span>
            )}
          </button>

          {/* My Orders Badge */}
          <button
            onClick={() => onNavigate('orders')}
            className={`p-2 rounded-2xl transition relative flex flex-col items-center justify-center text-[10px] font-bold ${
              currentView === 'orders'
                ? 'text-[#0077B6] bg-sky-50'
                : 'text-slate-600 hover:text-[#0077B6] hover:bg-slate-100'
            }`}
            title="My Equipment Orders & Tracking"
          >
            <ClipboardList className="w-5 h-5 text-slate-700" />
            <span className="hidden lg:block text-[9px] mt-0.5">My Orders</span>
          </button>

          {/* Cart Badge */}
          <button
            onClick={() => onNavigate('cart')}
            className="p-2 rounded-2xl text-slate-600 hover:text-[#0F9D8A] hover:bg-slate-100 transition relative flex flex-col items-center justify-center text-[10px] font-bold"
            title="Cart"
          >
            <ShoppingCart className="w-5 h-5 text-slate-700" />
            <span className="hidden lg:block text-[9px] mt-0.5">Cart</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#0F9D8A] text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account / Login */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl border border-slate-200 hover:border-[#0F9D8A] bg-slate-50 hover:bg-slate-100 transition text-slate-800"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0F9D8A]/10 text-[#0F9D8A] flex items-center justify-center font-bold">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left text-xs font-bold leading-tight">
                <p className="text-slate-800 truncate max-w-[90px]">
                  {currentUser ? currentUser.name : 'Login / Sign Up'}
                </p>
                <p className="text-[9px] text-[#0077B6] font-semibold uppercase">
                  {currentUser ? currentUser.role.replace('_', ' ') : 'Account'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl bg-white border border-slate-200 py-3 z-50">
                {currentUser ? (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{currentUser.email}</p>
                    </div>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => { onNavigate('admin-panel'); setShowUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                      >
                        <SlidersHorizontal className="w-4 h-4" /> Admin Dashboard
                      </button>
                    )}
                    {currentUser.role === 'vendor' && (
                      <button
                        onClick={() => { onNavigate('vendor-panel'); setShowUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-[#0F9D8A]"
                      >
                        <Store className="w-4 h-4" /> Vendor Portal
                      </button>
                    )}
                    <button
                      onClick={() => { onNavigate('rfqs'); setShowUserDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-teal-700 font-semibold"
                    >
                      <FilePlus className="w-4 h-4 text-teal-600" /> RFQ System &amp; Tenders
                    </button>
                    <button
                      onClick={() => { onNavigate('orders'); setShowUserDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                    >
                      <ClipboardList className="w-4 h-4" /> My Orders &amp; Track
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => { onLogout(); setShowUserDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-semibold"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </>
                ) : (
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-600 font-medium text-center">
                      Welcome to HealNex Medi Bazar
                    </p>
                    <button
                      onClick={() => { onNavigate('login'); setShowUserDropdown(false); }}
                      className="w-full bg-[#0077B6] hover:bg-[#005f92] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-md"
                    >
                      Login / Sign Up
                    </button>
                    <button
                      onClick={() => { onNavigate('register_vendor'); setShowUserDropdown(false); }}
                      className="w-full bg-[#0F9D8A] hover:bg-[#0c8272] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-md"
                    >
                      Vendor Registration
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation Mega Menu Bar */}
      <nav className="bg-[#1F2937] text-white border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-between">
          
          {/* Mega Menu Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryMegaMenu(!showCategoryMegaMenu)}
              className="bg-[#0F9D8A] hover:bg-[#0c8272] text-white font-bold text-xs py-3.5 px-5 flex items-center gap-2 transition cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>All Categories Mega Menu</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Expanded Mega Menu Panel */}
            {showCategoryMegaMenu && (
              <div className="absolute left-0 top-full w-[850px] max-w-[90vw] bg-white text-slate-800 rounded-b-2xl shadow-2xl border border-slate-200 p-6 z-50 grid grid-cols-3 gap-4">
                {megaCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onCategorySelect(cat);
                      onNavigate('marketplace');
                      setShowCategoryMegaMenu(false);
                    }}
                    className="text-left p-2.5 rounded-xl hover:bg-[#F5F7FA] transition flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-[#0F9D8A]"
                  >
                    <span>{cat}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Horizontal Scrollable Categories Links */}
          <div className="hidden md:flex items-center gap-6 overflow-x-auto scrollbar-none py-3 text-xs font-bold text-slate-200">
            {megaCategories.slice(0, 8).map((cat) => {
              const isSelected = selectedCategoryName.trim().toLowerCase() === cat.trim().toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => {
                    onCategorySelect(isSelected ? '' : cat);
                    onNavigate('marketplace');
                  }}
                  className={`transition whitespace-nowrap px-2.5 py-1 rounded-lg ${
                    isSelected
                      ? 'bg-[#0F9D8A] text-white font-black shadow-sm'
                      : 'hover:text-[#0F9D8A]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
            <button 
              onClick={() => onNavigate('rfqs')} 
              className={`transition font-extrabold whitespace-nowrap flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs ${
                currentView === 'rfqs'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-400/30'
              }`}
            >
              <FilePlus className="w-3.5 h-3.5 text-amber-300" />
              <span>RFQ System (Tenders)</span>
              {activeRfqsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full">
                  {activeRfqsCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => onNavigate('orders')} 
              className="text-teal-300 hover:text-teal-100 transition font-extrabold whitespace-nowrap flex items-center gap-1"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>My Orders</span>
            </button>
          </div>

          {/* Help Center */}
          <button 
            onClick={() => onNavigate('tickets')}
            className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-teal-200 py-3"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help Center</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-xl p-4 space-y-4 animate-fade-in text-slate-800">
          {/* Mobile Search Bar */}
          <div ref={mobileSearchContainerRef} className="relative">
            <form onSubmit={(e) => { handleSearchSubmit(e); setMobileMenuOpen(false); }} className="flex items-center bg-slate-100 rounded-xl p-1.5 border border-slate-200">
              <input
                type="text"
                placeholder="Search medical equipment, subcategories..."
                value={searchQuery}
                onFocus={() => setIsMobileSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                  setIsMobileSearchFocused(true);
                }}
                className="w-full bg-transparent px-2 text-xs outline-none text-slate-800"
              />
              {searchQuery.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    onSearch('');
                    setIsMobileSearchFocused(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 mr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button type="submit" className="bg-[#0F9D8A] text-white p-2 rounded-lg text-xs cursor-pointer">
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Mobile Auto-suggest Popover */}
            {isMobileSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-80 overflow-y-auto p-2 space-y-3">
                {searchSuggestions.subcategories.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-teal-700 px-2 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Subcategories
                    </p>
                    {searchSuggestions.subcategories.map((sub, idx) => (
                      <button
                        key={`${sub.name}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSearchQuery(sub.name);
                          onSearch(sub.name);
                          onNavigate('marketplace');
                          setMobileMenuOpen(false);
                          setIsMobileSearchFocused(false);
                          window.dispatchEvent(new CustomEvent('healnex_filter_subcategory', { detail: sub.name }));
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-teal-50 text-xs font-bold text-slate-800 flex items-center justify-between"
                      >
                        <span>{sub.name}</span>
                        <span className="text-[10px] text-slate-400">{sub.categoryName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchSuggestions.products.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-600 px-2 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-teal-600" /> Products
                    </p>
                    {searchSuggestions.products.map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery(prod.name);
                          onSearch(prod.name);
                          onNavigate('marketplace');
                          setMobileMenuOpen(false);
                          setIsMobileSearchFocused(false);
                          window.dispatchEvent(new CustomEvent('healnex_open_product', { detail: prod }));
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                      >
                        <img src={prod.images?.[0]} alt={prod.name} className="w-8 h-8 object-contain rounded border border-slate-200" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                          <p className="text-[10px] text-teal-700 font-mono">₹{prod.salePrice.toLocaleString('en-IN')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Navigation Links */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => { onNavigate('marketplace'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-teal-600" />
              <span>Marketplace</span>
            </button>

            <button
              onClick={() => { onNavigate('rfqs'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-amber-600" />
                <span>RFQ System</span>
              </div>
              {activeRfqsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {activeRfqsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { onNavigate('orders'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>My Orders</span>
            </button>

            <button
              onClick={() => { onNavigate('cart'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 text-teal-600" />
              <span>Cart ({cartCount})</span>
            </button>

            <button
              onClick={() => { onNavigate('reviews'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Reviews</span>
            </button>

            <button
              onClick={() => { onNavigate('tickets'); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Helpdesk</span>
            </button>
          </div>

          {/* Account / Login Mobile section */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-slate-900">{currentUser.name} ({currentUser.role})</span>
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="text-rose-600 font-bold hover:underline"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }}
                  className="flex-1 bg-[#0077B6] text-white py-2 rounded-xl font-bold text-center"
                >
                  Login
                </button>
                <button
                  onClick={() => { onNavigate('register_vendor'); setMobileMenuOpen(false); }}
                  className="flex-1 bg-[#0F9D8A] text-white py-2 rounded-xl font-bold text-center"
                >
                  Vendor Join
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Search Modal */}
      {showImageSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#0077B6]" />
                Image Search Medical Device
              </h3>
              <button onClick={() => setShowImageSearchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Upload an image of an ECG machine, patient monitor, ultrasound probe, or surgical tool to find matching equipment instantly.
            </p>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-[#0F9D8A] transition cursor-pointer bg-[#F5F7FA]">
              <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Drag &amp; Drop or Browse Medical Image</p>
              <p className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG up to 10MB</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('ECG Machine');
                onSearch('ECG Machine');
                setShowImageSearchModal(false);
                onNavigate('marketplace');
              }}
              className="w-full bg-[#0F9D8A] hover:bg-[#0c8272] text-white font-bold py-3 rounded-2xl transition text-xs shadow-md"
            >
              Analyze &amp; Match Products
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

