import React, { useState, useEffect, useRef } from 'react';
import { User, Notification, Category, PriceAlert, Product } from '../types';
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
  Award,
  Flame,
  Package
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real-time Predictive Search States & Refs
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Database-backed predictive indexes
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbBrands, setDbBrands] = useState<{ name: string; salesCount: number; productCount: number; logo?: string }[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadSearchIndexes = () => {
      const categoriesList = dbLocal.getCategories().filter(c => c.isActive !== false);
      const productsList = dbLocal.getProducts().filter(p => p.status === 'Approved' || !p.status);
      const ordersList = dbLocal.getOrders();
      const brandsList = dbLocal.getBrands().filter(b => b.isActive !== false);

      // Map to accumulate sales and catalog numbers per brand
      const brandSalesMap: Record<string, { salesCount: number; productCount: number; logo?: string }> = {};

      brandsList.forEach(b => {
        brandSalesMap[b.name.trim()] = { salesCount: 0, productCount: 0, logo: b.logo };
      });

      productsList.forEach(p => {
        const bName = p.brand ? p.brand.trim() : 'HealNex';
        if (!brandSalesMap[bName]) {
          brandSalesMap[bName] = { salesCount: 0, productCount: 0 };
        }
        brandSalesMap[bName].productCount += 1;
      });

      ordersList.forEach(order => {
        order.items?.forEach(item => {
          const prod = productsList.find(p => p.id === item.productId);
          const bName = (prod?.brand || 'HealNex').trim();
          if (!brandSalesMap[bName]) {
            brandSalesMap[bName] = { salesCount: 0, productCount: 0 };
          }
          brandSalesMap[bName].salesCount += item.quantity || 1;
        });
      });

      const compiledBrands = Object.entries(brandSalesMap).map(([name, data]) => ({
        name,
        salesCount: data.salesCount,
        productCount: data.productCount,
        logo: data.logo
      })).sort((a, b) => (b.salesCount * 10 + b.productCount) - (a.salesCount * 10 + a.productCount));

      setDbCategories(categoriesList);
      setDbBrands(compiledBrands);
      setDbProducts(productsList);
    };

    loadSearchIndexes();
    window.addEventListener('healnex_db_update', loadSearchIndexes);
    return () => window.removeEventListener('healnex_db_update', loadSearchIndexes);
  }, []);

  // Click outside & key listener for closing suggestions overlay
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter real-time predictive suggestions based on user input
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredCategories = trimmedQuery
    ? dbCategories.filter(cat =>
        cat.name.toLowerCase().includes(trimmedQuery) ||
        cat.subcategories?.some(sub => sub.toLowerCase().includes(trimmedQuery))
      ).slice(0, 4)
    : dbCategories.slice(0, 4);

  const filteredBrands = trimmedQuery
    ? dbBrands.filter(b => b.name.toLowerCase().includes(trimmedQuery)).slice(0, 4)
    : dbBrands.slice(0, 4);

  const filteredProducts = trimmedQuery
    ? dbProducts.filter(p =>
        p.name.toLowerCase().includes(trimmedQuery) ||
        p.brand?.toLowerCase().includes(trimmedQuery) ||
        p.category.toLowerCase().includes(trimmedQuery) ||
        p.sku?.toLowerCase().includes(trimmedQuery)
      ).slice(0, 4)
    : [];

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
    setNotifications(dbLocal.getNotifications());
    setPriceAlerts(dbLocal.getPriceAlerts());
    const handleDbUpdate = () => {
      setNotifications(dbLocal.getNotifications());
      setPriceAlerts(dbLocal.getPriceAlerts());
    };
    window.addEventListener('healnex_db_update', handleDbUpdate);
    return () => window.removeEventListener('healnex_db_update', handleDbUpdate);
  }, []);

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

        {/* Search Bar - Center with Real-Time Predictive Suggestions */}
        <div ref={searchContainerRef} className="flex-1 max-w-2xl relative hidden md:block">
          <form onSubmit={(e) => { handleSearchSubmit(e); setShowSuggestions(false); }} className="flex items-center bg-[#F5F7FA] rounded-2xl border border-slate-300 focus-within:border-[#0F9D8A] focus-within:bg-white transition-all shadow-sm overflow-hidden h-12">
            
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

            <div className="flex-1 flex items-center relative">
              <input
                type="text"
                placeholder="Search Medical Equipment, Brands, Categories..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-800 outline-none bg-transparent placeholder-slate-400 font-sans"
              />

              {/* Clear search text button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    onSearch('');
                  }}
                  className="p-1 mr-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

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
                className="bg-[#0F9D8A] hover:bg-[#0c8272] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Real-time Predictive Search Suggestions Overlay */}
          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden font-sans text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
              
              {/* Header Label */}
              <div className="bg-slate-50/90 px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1 text-teal-700">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  {trimmedQuery ? `Predictive Suggestions for "${searchQuery}"` : 'Popular Categories & Top-Selling Brands'}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Esc to close</span>
              </div>

              <div className="p-3 max-h-[460px] overflow-y-auto space-y-4">
                
                {/* 1. PRODUCT CATEGORIES SECTION */}
                {filteredCategories.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                      <Layers className="w-3.5 h-3.5 text-teal-600" />
                      <span>Product Categories</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {filteredCategories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            onCategorySelect(cat.name);
                            onSearch('');
                            setSearchQuery('');
                            setShowSuggestions(false);
                            onNavigate('marketplace');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50/70 border border-transparent hover:border-teal-200 transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-7 h-7 rounded-lg bg-teal-100/60 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                              <Layers className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900 truncate">
                              {cat.name}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. TOP-SELLING BRANDS SECTION */}
                {filteredBrands.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 py-1 mb-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Top-Selling Brand Names</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                        Verified OEM
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {filteredBrands.map(brand => (
                        <button
                          key={brand.name}
                          type="button"
                          onClick={() => {
                            setSearchQuery(brand.name);
                            onSearch(brand.name);
                            setShowSuggestions(false);
                            onNavigate('marketplace');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50/80 border border-transparent hover:border-amber-200 transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center shrink-0 font-black text-xs group-hover:bg-amber-500 group-hover:text-white transition">
                              {brand.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900 truncate">
                                {brand.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {brand.salesCount > 0 
                                  ? `${brand.salesCount} Verified Orders • ${brand.productCount} Items`
                                  : `${brand.productCount} Equipment Catalog Models`
                                }
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md group-hover:bg-amber-200 group-hover:text-amber-900 transition shrink-0">
                            Brand
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. MATCHING EQUIPMENT PRODUCTS */}
                {trimmedQuery && filteredProducts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      <span>Matching Medical Equipment ({filteredProducts.length})</span>
                    </div>
                    <div className="space-y-1">
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSearchQuery(p.name);
                            onSearch(p.name);
                            setShowSuggestions(false);
                            onNavigate('marketplace');
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-sky-50/80 border border-transparent hover:border-sky-200 transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1516549655169-df83a0774514'}
                              alt={p.name}
                              className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-sky-900 truncate">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-2">
                                <span className="font-semibold text-teal-700">{p.category}</span>
                                <span>•</span>
                                <span>By {p.brand || 'HealNex Verified'}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <p className="text-xs font-black text-slate-900">
                              ₹{p.price?.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[9px] text-emerald-600 font-bold">In Stock</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* NO MATCH FALLBACK */}
                {trimmedQuery && filteredCategories.length === 0 && filteredBrands.length === 0 && filteredProducts.length === 0 && (
                  <div className="p-6 text-center text-slate-500">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No exact matches found for "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Press Enter to search the entire medical equipment marketplace catalog</p>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              {trimmedQuery && (
                <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Search for <strong className="text-slate-900">"{searchQuery}"</strong></span>
                  <button
                    type="button"
                    onClick={(e) => {
                      handleSearchSubmit(e as any);
                      setShowSuggestions(false);
                    }}
                    className="text-teal-700 hover:text-teal-900 font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Marketplace Results</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
                      onClick={() => { onNavigate('orders'); setShowUserDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                    >
                      <ClipboardList className="w-4 h-4" /> My Orders &amp; RFQs
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
            {megaCategories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onCategorySelect(cat);
                  onNavigate('marketplace');
                }}
                className="hover:text-[#0F9D8A] transition whitespace-nowrap"
              >
                {cat}
              </button>
            ))}
            <button 
              onClick={() => onNavigate('rfqs')} 
              className="text-amber-300 hover:text-amber-200 transition font-extrabold whitespace-nowrap flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hospital B2B Tenders</span>
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
          <form onSubmit={(e) => { handleSearchSubmit(e); setMobileMenuOpen(false); }} className="flex items-center bg-slate-100 rounded-xl p-1.5 border border-slate-200">
            <input
              type="text"
              placeholder="Search medical equipment..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              className="w-full bg-transparent px-2 text-xs outline-none text-slate-800"
            />
            <button type="submit" className="bg-[#0F9D8A] text-white p-2 rounded-lg text-xs">
              <Search className="w-4 h-4" />
            </button>
          </form>

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
              className="p-2.5 rounded-xl bg-amber-50 text-amber-900 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>B2B Tenders</span>
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

