import React, { useState, useEffect } from 'react';
import { User, Notification, Category } from '../types';
import { dbLocal } from '../db';
import {
  Activity,
  Search,
  Mic,
  MicOff,
  ShoppingCart,
  Heart,
  Bell,
  User as UserIcon,
  ChevronDown,
  LogOut,
  LifeBuoy,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Store,
  CheckCircle,
  HelpCircle,
  Clock,
  Palette,
  ShieldCheck,
  Star,
  MapPin
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
  const [deliveryLocation, setDeliveryLocation] = useState('Pune 411001');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locations = [
    { city: 'Pune', pin: '411001' },
    { city: 'Mumbai', pin: '400001' },
    { city: 'Delhi', pin: '110001' },
    { city: 'Bangalore', pin: '560001' },
    { city: 'Kolkata', pin: '700001' },
    { city: 'Chennai', pin: '600001' },
    { city: 'Hyderabad', pin: '500001' }
  ];

  useEffect(() => {
    setSearchQuery(externalSearchQuery || '');
  }, [externalSearchQuery]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>(() => dbLocal.getCategories());

  useEffect(() => {
    // Refresh notifications and categories on mount or event update
    setNotifications(dbLocal.getNotifications());
    setCategories(dbLocal.getCategories());

    const handleDbUpdate = () => {
      setNotifications(dbLocal.getNotifications());
      setCategories(dbLocal.getCategories());
    };
    window.addEventListener('healnex_db_update', handleDbUpdate);

    return () => {
      window.removeEventListener('healnex_db_update', handleDbUpdate);
    };
  }, []);

  const displayedNotifications = notifications.filter(n => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') {
      return true;
    }
    return n.userId === currentUser.id;
  });

  const unreadCount = displayedNotifications.filter(n => !n.read).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const triggerVoiceSearch = () => {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      return;
    }
    setIsVoiceListening(true);
    // Simulate speech detection
    setTimeout(() => {
      const voiceSamples = ['ECG Machine', 'Ventilator', 'ICU Beds', 'Nitrile Gloves', 'Centrifuge'];
      const randomQuery = voiceSamples[Math.floor(Math.random() * voiceSamples.length)];
      setSearchQuery(randomQuery);
      onSearch(randomQuery);
      setIsVoiceListening(false);
    }, 2500);
  };

  const handleNotificationClick = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    dbLocal.saveNotifications(updated);
    setNotifications(updated);
  };

  const markAllNotifsRead = () => {
    const displayedIds = displayedNotifications.map(n => n.id);
    const updated = notifications.map(n => displayedIds.includes(n.id) ? { ...n, read: true } : n);
    dbLocal.saveNotifications(updated);
    setNotifications(updated);
  };

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-800 border-b border-slate-200/80 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Logo with text "HealNex Medi Bazar" and "India" */}
          <div 
            onClick={() => { onNavigate('marketplace'); onSearch(''); setSearchQuery(''); }}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 transition-transform hover:scale-[1.01]"
            id="brand-logo-container"
          >
            <div className="bg-slate-50/80 p-1.5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left Segment */}
                <rect x="2" y="9.5" width="7" height="5" rx="1.5" fill="url(#brandBlueGrad)" />
                {/* Right Segment */}
                <rect x="15" y="9.5" width="7" height="5" rx="1.5" fill="url(#brandEmeraldGrad)" />
                {/* Top Segment */}
                <rect x="9.5" y="2" width="5" height="7" rx="1.5" fill="url(#brandTealGrad)" />
                {/* Bottom Segment */}
                <rect x="9.5" y="15" width="5" height="7" rx="1.5" fill="url(#brandDeepBlueGrad)" />
                {/* Center Segment */}
                <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="url(#brandCenterGrad)" />
                <defs>
                  <linearGradient id="brandBlueGrad" x1="2" y1="12" x2="9" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0961E7" />
                    <stop offset="1" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="brandEmeraldGrad" x1="15" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#10b981" />
                    <stop offset="1" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="brandTealGrad" x1="12" y1="2" x2="12" y2="9" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#06b6d4" />
                    <stop offset="1" stopColor="#14b8a6" />
                  </linearGradient>
                  <linearGradient id="brandDeepBlueGrad" x1="12" y1="15" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0052D4" />
                    <stop offset="1" stopColor="#0961E7" />
                  </linearGradient>
                  <linearGradient id="brandCenterGrad" x1="9.5" y1="9.5" x2="14.5" y2="14.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#14b8a6" />
                    <stop offset="1" stopColor="#0961E7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-base sm:text-lg tracking-tighter text-slate-900 leading-none">
                Heal<span className="text-[#0961E7]">Nex</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5 leading-none">
                Medi Bazar
              </span>
            </div>
          </div>

          {/* Center: Precise Location Selector */}
          <div className="relative shrink-0 hidden md:block" id="location-selector-container">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold tracking-wide transition"
            >
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-slate-700">Deliver to: {deliveryLocation}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            {showLocationDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1 text-slate-800 z-50 animate-fade-in">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 border-b border-slate-50">
                  Select Pincode
                </p>
                {locations.map((loc) => (
                  <button
                    key={loc.pin}
                    type="button"
                    onClick={() => {
                      setDeliveryLocation(`${loc.city} ${loc.pin}`);
                      setShowLocationDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-teal-50 hover:text-teal-800 transition block"
                  >
                    {loc.city} ({loc.pin})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center-Right: Standard, clean horizontal search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative hidden sm:block" id="header-search-form">
            <div className="relative flex items-center bg-slate-50 text-slate-800 rounded-full overflow-hidden border border-slate-200 focus-within:border-[#0961E7] transition-colors">
              <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                placeholder="Search medical products, equipment, diagnostics..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  onSearch(val);
                }}
                className="w-full pl-2.5 pr-20 py-2 text-xs text-slate-800 outline-none placeholder-slate-400 bg-slate-50 font-sans"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      onSearch('');
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition font-bold text-xs"
                    title="Clear Search"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-[#0961E7] hover:bg-[#0052D4] text-white px-3 py-1 rounded-full text-[10px] font-bold transition shrink-0 cursor-pointer"
                >
                  Go
                </button>
              </div>
            </div>
          </form>

          {/* Right: Compact, pill-shaped action buttons */}
          <div className="flex items-center gap-2 shrink-0" id="header-action-pills">
            
            {/* "Log In/Account" Pill (with Person icon) */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition shadow-sm"
                id="account-pill-button"
              >
                <UserIcon className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate max-w-[100px]">
                  {currentUser ? currentUser.name.split(' ')[0] : 'Log In/Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2.5 z-50 text-slate-800 overflow-hidden font-sans">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
                      </div>

                      {/* Role Specific Shortcuts */}
                      {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
                        <button
                          onClick={() => { onNavigate('admin-panel'); setShowUserDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                          Launch Admin Desk
                        </button>
                      )}

                      {currentUser.role === 'vendor' && (
                        <button
                          onClick={() => { onNavigate('vendor-panel'); setShowUserDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition"
                        >
                          <Store className="w-4 h-4 text-emerald-600" />
                          Launch Vendor Desk
                        </button>
                      )}

                      <button
                        onClick={() => { onNavigate('marketplace'); setShowUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                      >
                        <Activity className="w-4 h-4 text-slate-400" />
                        Browse Marketplace
                      </button>

                      <button
                        onClick={() => { onNavigate('rfqs'); setShowUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                      >
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        RFQ Tenders Desk
                      </button>

                      <button
                        onClick={() => { onNavigate('tickets'); setShowUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                      >
                        <LifeBuoy className="w-4 h-4 text-slate-400" />
                        Support Tickets
                      </button>

                      <button
                        onClick={() => { onNavigate('blogs'); setShowUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        Clinical Blogs
                      </button>

                      <div className="border-t border-slate-100 my-1.5"></div>
                      <button
                        onClick={() => { onLogout(); setShowUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <div className="p-3.5 space-y-2.5">
                      <p className="text-[11px] text-center leading-relaxed text-slate-500">
                        Sign in to submit RFQs, view pricing, and chat with clinical vendors.
                      </p>
                      <button
                        onClick={() => { onNavigate('login'); setShowUserDropdown(false); }}
                        className="w-full bg-[#0961E7] hover:bg-[#0052D4] text-white text-xs font-bold py-2 rounded-xl text-center transition cursor-pointer shadow-sm"
                      >
                        Access Portal / Sign In
                      </button>
                      
                      <div className="flex items-center py-1 text-slate-300">
                        <div className="flex-grow border-t border-current"></div>
                        <span className="flex-shrink mx-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">or join now</span>
                        <div className="flex-grow border-t border-current"></div>
                      </div>

                      <button
                        onClick={() => { onNavigate('register_customer'); setShowUserDropdown(false); }}
                        className="w-full text-xs font-bold py-2 rounded-xl text-center transition cursor-pointer border border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        Create Purchaser ID
                      </button>

                      <button
                        onClick={() => { onNavigate('register_vendor'); setShowUserDropdown(false); }}
                        className="w-full text-xs font-bold py-2 rounded-xl text-center transition cursor-pointer border border-slate-200 text-teal-700 hover:bg-slate-50"
                      >
                        Supplier Registration
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* "Reviews" Pill (with Star icon) */}
            <button
              onClick={() => onNavigate('reviews')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold transition shadow-sm border ${
                currentView === 'reviews' 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
              id="reviews-pill-button"
              title="Clinical Equipment Reviews"
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
              <span className="hidden sm:inline">Reviews</span>
            </button>

            {/* Mini-cart Pill (with Shopping cart icon) */}
            <button
              onClick={() => onNavigate('cart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-extrabold transition relative border shadow-xs ${
                currentView === 'cart'
                  ? 'bg-rose-100 text-[#FF3366] border-rose-300'
                  : 'bg-rose-50/55 hover:bg-rose-100/60 text-[#FF3366] border-rose-200'
              }`}
              id="mini-cart-pill-button"
              title="Multi-Vendor Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 text-[#FF3366] shrink-0" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#FF3366] text-white font-sans text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs shrink-0">
                  {cartCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
