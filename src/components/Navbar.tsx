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
  MapPin,
  ClipboardList,
  Compass
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
    <header className={`sticky top-0 z-40 shadow-sm font-sans transition-colors ${
      isDarkMode 
        ? 'bg-slate-900 text-slate-100 border-b border-slate-800' 
        : 'bg-white text-slate-800 border-b border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-12 gap-2.5 sm:gap-3">
          
          {/* Logo Brand (Visible on all devices for a premium, unified experience) */}
          <div 
            onClick={() => { onNavigate('marketplace'); onSearch(''); setSearchQuery(''); }}
            className="flex items-center gap-2 cursor-pointer shrink-0 transition-transform hover:scale-[1.01]"
          >
            <div className="relative bg-gradient-to-r from-blue-600 to-teal-500 text-white p-1.5 rounded-lg shadow-sm">
              <Activity className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-tight block leading-tight text-slate-900">
                Heal<span className="text-teal-600">Nex</span>
              </span>
              <span className="text-[8px] text-slate-400 font-medium tracking-widest uppercase block -mt-1 font-display">
                Medi Bazar
              </span>
            </div>
          </div>

          {/* Delivery Location Selector and Categories Button removed per user request */}

          {/* Search Box Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <div className="relative flex items-center bg-slate-50 text-slate-800 rounded-xl overflow-hidden group border border-slate-200 focus-within:border-teal-600 transition-colors">
              <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                placeholder="Search medical products, equipment, diagnostics…"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  onSearch(val);
                }}
                className="w-full pl-2.5 pr-24 py-1.5 text-xs text-slate-800 outline-none placeholder-slate-400 bg-slate-50 font-sans"
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
                  type="button"
                  onClick={triggerVoiceSearch}
                  className={`p-1 rounded-lg transition shrink-0 ${
                    isVoiceListening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'text-slate-400 hover:text-teal-700 hover:bg-slate-100'
                  }`}
                  title="Voice Search Simulator"
                >
                  {isVoiceListening ? <Mic className="w-3.5 h-3.5 text-white" /> : <MicOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0"
                >
                  Go
                </button>
              </div>
            </div>

            {/* Listening Banner Overlay */}
            {isVoiceListening && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-rose-600 text-white rounded-xl shadow-xl px-4 py-2 text-xs flex items-center justify-between z-50 animate-bounce">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                  Listening for clinical term... Try saying "ECG Machine"
                </span>
                <span className="text-[10px] opacity-75 font-mono">SIMULATED</span>
              </div>
            )}
          </form>

          {/* Toolbar Utilities */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            
            {/* Live Node Statistics */}
            <div className="hidden lg:flex gap-4 border-r border-slate-200 pr-4">
              <div className="text-right leading-none">
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Platform Status</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs font-semibold text-slate-800">LIVE</span>
                </div>
              </div>
              <div className="text-right leading-none">
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Active Nodes</p>
                <span className="text-xs font-bold text-teal-700">128 / 150</span>
              </div>
            </div>

            {/* Compare Badge */}
            <button
              onClick={() => onNavigate('marketplace')}
              className="p-2 relative hover:bg-slate-100 rounded-xl text-slate-500 hover:text-teal-700 transition group"
              title="Product Comparison"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {compareCount > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {compareCount}
                </span>
              )}
            </button>

            {/* Clinical Reviews Portal Trigger */}
            <button
              onClick={() => onNavigate('reviews')}
              className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                currentView === 'reviews' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-amber-600'
              }`}
              title="Clinical Equipment Reviews"
            >
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="hidden lg:inline">Reviews</span>
            </button>

            {/* Trust & Safety Portal Trigger */}
            <button
              onClick={() => onNavigate('trust-safety')}
              className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                currentView === 'trust-safety' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-teal-700'
              }`}
              title="Trust & Safety Portal"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="hidden lg:inline">Trust & Safety</span>
            </button>

            {/* Sitemap Trigger */}
            <button
              onClick={() => onNavigate('sitemap')}
              className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                currentView === 'sitemap' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-teal-700'
              }`}
              title="Platform Sitemap & Architecture Index"
            >
              <Compass className="w-5 h-5 text-teal-600" />
              <span className="hidden xl:inline">Sitemap</span>
            </button>

            {/* Support Tickets Trigger */}
            <button
              onClick={() => onNavigate('tickets')}
              className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                currentView === 'tickets' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-100 hover:text-teal-700'
              }`}
              title="Support Tickets"
            >
              <LifeBuoy className="w-5 h-5" />
              <span className="hidden lg:inline">Tickets</span>
            </button>

            {/* RFQs Page Trigger */}
            <button
              onClick={() => onNavigate('rfqs')}
              className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                currentView === 'rfqs' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-100 hover:text-teal-700'
              }`}
              title="B2B RFQ Bidding Platform"
            >
              <Sparkles className="w-5 h-5 text-teal-600 shrink-0" />
              <span className="hidden lg:inline">RFQs</span>
            </button>

            {/* My Orders Page Trigger */}
            <button
              onClick={() => onNavigate('orders')}
              className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                currentView === 'orders' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-teal-700'
              }`}
              title="My Orders"
            >
              <ClipboardList className="w-5 h-5 text-teal-600 shrink-0" />
              <span className="hidden lg:inline">My Orders</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => onNavigate('cart')}
              className={`p-2 rounded-xl relative transition ${
                currentView === 'cart' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-teal-700'
              }`}
              title="Multi-Vendor Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white font-mono text-[9px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center border border-white shadow-md">
                  {cartCount}
                </span>
              )}
            </button>



            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-teal-700 transition relative"
                title={currentUser?.role === 'admin' ? "FCM Cloud Alerts" : "Notifications"}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-rose-500 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 text-slate-800 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 tracking-wide flex items-center gap-1.5 uppercase">
                      <span className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></span>
                      {currentUser?.role === 'admin' ? "FCM Cloud Push Logs" : "My Notifications"}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotifsRead}
                        className="text-[10px] font-bold text-teal-700 hover:text-teal-900 uppercase"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {displayedNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No notifications logged.</p>
                      </div>
                    ) : (
                      displayedNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`p-3.5 transition text-left cursor-pointer ${
                            !notif.read ? 'bg-teal-50/40 hover:bg-teal-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="text-xs font-bold text-slate-900 leading-tight">
                              {notif.title}
                            </h5>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-teal-600 rounded-full shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span>{new Date(notif.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Header Direct Sign Up button for guests */}
            {!currentUser && (
              <button
                onClick={() => onNavigate('register_customer')}
                className="flex items-center gap-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
                title="Create Purchaser ID or Register as Supplier"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            )}

            {/* Profile Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center gap-1 border p-1 px-2.5 rounded-xl transition ${
                  isDarkMode 
                    ? 'border-slate-800 hover:bg-slate-850 text-slate-200' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-1 rounded-lg border ${
                  isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left max-w-[90px] truncate leading-none">
                  <p className={`text-[11px] font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {currentUser ? currentUser.name : 'Sign In'}
                  </p>
                  <p className="text-[9px] text-slate-400 capitalize font-medium">
                    {currentUser ? currentUser.role.replace('_', ' ') : 'Guest'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className={`absolute right-0 mt-2.5 w-60 rounded-2xl shadow-2xl border py-2.5 z-50 overflow-hidden font-sans transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-900 text-slate-100 border-slate-800' 
                    : 'bg-white text-slate-800 border-slate-100'
                }`}>
                  {currentUser ? (
                    <>
                      <div className={`px-4 py-2.5 border-b ${
                        isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50'
                      }`}>
                        <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
                      </div>

                      {/* Role Specific Shortcuts */}
                      {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
                        <button
                          onClick={() => { onNavigate('admin-panel'); setShowUserDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                          Launch Admin Desk
                        </button>
                      )}

                      {currentUser.role === 'vendor' && (
                        <button
                          onClick={() => { onNavigate('vendor-panel'); setShowUserDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition"
                        >
                          <Store className="w-4 h-4 text-emerald-600" />
                          Launch Vendor Desk
                        </button>
                      )}

                      <button
                        onClick={() => { onNavigate('marketplace'); setShowUserDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition ${
                          isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Activity className="w-4 h-4 text-slate-400" />
                        Browse Marketplace
                      </button>

                      <button
                        onClick={() => { onNavigate('reviews'); setShowUserDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition ${
                          isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        Clinical Reviews Feed
                      </button>

                      <div className={`border-t my-1.5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}></div>
                      <button
                        onClick={() => { onLogout(); setShowUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <div className="p-3.5 space-y-2.5">
                      <p className={`text-[11px] text-center leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Sign in to submit RFQs, view pricing, and chat with clinical vendors.
                      </p>
                      <button
                        onClick={() => { onNavigate('login'); setShowUserDropdown(false); }}
                        className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold py-2 rounded-xl text-center transition cursor-pointer shadow-sm"
                      >
                        Access Portal / Sign In
                      </button>
                      
                      <div className={`flex items-center py-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                        <div className="flex-grow border-t border-current"></div>
                        <span className="flex-shrink mx-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">or join now</span>
                        <div className="flex-grow border-t border-current"></div>
                      </div>

                      <button
                        onClick={() => { onNavigate('register_customer'); setShowUserDropdown(false); }}
                        className={`w-full text-xs font-bold py-2 rounded-xl text-center transition cursor-pointer border ${
                          isDarkMode 
                            ? 'border-slate-800 text-slate-200 hover:bg-slate-800' 
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Create Purchaser ID
                      </button>

                      <button
                        onClick={() => { onNavigate('register_vendor'); setShowUserDropdown(false); }}
                        className={`w-full text-xs font-bold py-2 rounded-xl text-center transition cursor-pointer border ${
                          isDarkMode 
                            ? 'border-slate-800 text-teal-400 hover:bg-slate-800' 
                            : 'border-slate-200 text-teal-700 hover:bg-teal-50/50'
                        }`}
                      >
                        Supplier Registration
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
