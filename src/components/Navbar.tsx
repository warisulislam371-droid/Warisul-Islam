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
  Menu,
  X,
  Truck,
  PhoneCall,
  Gift
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
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>(() => dbLocal.getCategories());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedSearchCat, setSelectedSearchCat] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setSearchQuery(externalSearchQuery || '');
  }, [externalSearchQuery]);

  useEffect(() => {
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
    if (selectedSearchCat) {
      onCategorySelect(selectedSearchCat);
    }
    onSearch(searchQuery);
  };

  const triggerVoiceSearch = () => {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      return;
    }
    setIsVoiceListening(true);
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
    <div className="w-full flex flex-col font-sans shrink-0 border-b border-slate-100 z-50">
      
      {/* 1. TOP HEADER: Blue Announcement Bar */}
      <div className="w-full bg-[#1E40AF] text-white text-[11px] font-medium py-2 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-y-1.5 shadow-inner">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
          <span>Welcome to HealNex Medi Bazar • Premium Healthcare Marketplace</span>
        </div>
        
        <div className="flex items-center gap-5">
          {/* Delivery Location */}
          <div className="flex items-center gap-1 opacity-95">
            <MapPin className="w-3.5 h-3.5 text-blue-200" />
            <span>Deliver to: <strong className="text-white">Delhi NCR, India</strong></span>
          </div>

          <span className="text-blue-300">|</span>

          {/* Quick Navigation Links */}
          <button 
            onClick={() => {
              if (currentUser) {
                onNavigate('orders');
              } else {
                onNavigate('login');
              }
            }} 
            className="hover:text-blue-200 hover:underline transition cursor-pointer"
          >
            Track Order
          </button>
          <button 
            onClick={() => onNavigate('tickets')} 
            className="hover:text-blue-200 hover:underline transition cursor-pointer"
          >
            Help & Support
          </button>
          <button 
            onClick={() => onNavigate('register_vendor')} 
            className="hover:text-blue-200 hover:underline text-orange-300 font-bold transition cursor-pointer"
          >
            Become a Seller
          </button>
        </div>
      </div>

      {/* 2. MAIN HEADER: Brand logo, category drop, large search with selectors & actions */}
      <header className={`sticky top-0 z-40 bg-white dark:bg-slate-900 border-b ${
        isDarkMode ? 'border-slate-800' : 'border-slate-100'
      } py-3 px-4 sm:px-6 lg:px-8 shadow-xs`}>
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Categories Toggle Button */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Mobile burger toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 md:hidden transition cursor-pointer"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Premium Logo */}
            <div 
              onClick={() => { onNavigate('marketplace'); onSearch(''); setSearchQuery(''); onCategorySelect(''); }}
              className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
            >
              <div className="bg-[#1E40AF] text-white p-2 rounded-xl shadow-md">
                <Activity className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div className="leading-tight">
                <span className={`font-display font-black text-lg tracking-tight block leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Heal<span className="text-[#2563EB]">Nex</span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase block font-display">
                  Medi Bazar
                </span>
              </div>
            </div>

            {/* Categories Dropdown Sits Next to Logo on Large Screens */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowCatMenu(!showCatMenu)}
                className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Categories</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showCatMenu ? 'rotate-180' : ''}`} />
              </button>

              {showCatMenu && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-fade-in">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 pb-1.5 border-b border-slate-50 mb-1">
                    Clinical Specialities
                  </p>
                  <div className="max-h-[300px] overflow-y-auto">
                    {categories.filter(c => c.isActive !== false).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onCategorySelect(cat.name);
                          setShowCatMenu(false);
                          onNavigate('marketplace');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#1E40AF] flex items-center justify-between group transition"
                      >
                        <span>{cat.name}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Large Search Bar with Category Selector & Blue Search Button */}
          <div className="flex-1 max-w-2xl mx-2 relative min-w-0">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-[#1E40AF] dark:focus-within:border-blue-500 transition-all overflow-hidden">
                
                {/* Embedded Category Selector */}
                <select 
                  value={selectedSearchCat}
                  onChange={(e) => setSelectedSearchCat(e.target.value)}
                  className="bg-transparent text-xs text-slate-600 dark:text-slate-300 font-semibold border-r border-slate-200 dark:border-slate-700 px-3 outline-none cursor-pointer h-full py-2.5 max-w-[150px] hidden sm:block bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search clinical monitors, syringe pumps, ventilators..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onSearch(e.target.value);
                  }}
                  className="w-full pl-2.5 pr-20 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none placeholder-slate-400 bg-transparent font-sans"
                />

                <div className="absolute right-1.5 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); onSearch(''); }}
                      className="p-1 text-slate-400 hover:text-rose-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={triggerVoiceSearch}
                    className={`p-1.5 rounded-lg transition shrink-0 ${
                      isVoiceListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-[#1E40AF]'
                    }`}
                    title="Voice Search"
                  >
                    {isVoiceListening ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <MicOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="submit"
                    className="bg-[#1E40AF] hover:bg-blue-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0"
                  >
                    Search
                  </button>
                </div>
              </div>

              {isVoiceListening && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-rose-600 text-white rounded-xl shadow-lg px-4 py-2 text-[11px] flex items-center justify-between z-50 animate-bounce">
                  <span>Listening... Try saying "ECG Machine"</span>
                  <span className="text-[9px] opacity-75 font-mono">SIMULATED</span>
                </div>
              )}
            </form>
          </div>

          {/* Wishlist, Cart & Profile Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Wishlist Icon Button */}
            <button
              onClick={() => onNavigate('marketplace')}
              className="p-2 relative hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-500 hover:text-rose-600 transition cursor-pointer"
              title="Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon Button */}
            <button
              onClick={() => onNavigate('cart')}
              className={`p-2 rounded-xl relative transition cursor-pointer ${
                currentView === 'cart' ? 'bg-blue-50 text-[#1E40AF] font-bold' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Procurement Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white font-mono text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Notifications Alert Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-500 hover:text-blue-600 transition cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 text-slate-800 dark:text-slate-100 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                      Alerts
                    </span>
                    {unreadCount > 0 && (
                      <button onClick={markAllNotifsRead} className="text-[10px] font-bold text-[#1E40AF] uppercase hover:underline">
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {displayedNotifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No alerts logged.
                      </div>
                    ) : (
                      displayedNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n.id)}
                          className={`p-3 text-left cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-blue-50/20' : ''}`}
                        >
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</h5>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-slate-400 mt-1.5 block">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* My Account Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center gap-1.5 border p-1 pr-2 rounded-xl transition cursor-pointer ${
                  isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-slate-800 text-[#1E40AF] flex items-center justify-center font-bold text-xs border border-blue-200/40">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="hidden xs:block text-left text-[11px] font-bold text-slate-800 dark:text-slate-200 max-w-[85px] truncate">
                  {currentUser ? currentUser.name : 'My Account'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2.5 w-60 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 overflow-hidden">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 dark:bg-slate-900">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <div className="py-1">
                        {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
                          <button
                            onClick={() => { onNavigate('admin-panel'); setShowUserDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Admin Console
                          </button>
                        )}
                        {currentUser.role === 'vendor' && (
                          <button
                            onClick={() => { onNavigate('vendor-panel'); setShowUserDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                          >
                            <Store className="w-3.5 h-3.5" />
                            Vendor Panel
                          </button>
                        )}
                        <button
                          onClick={() => { onNavigate('marketplace'); setShowUserDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          Browse Catalog
                        </button>
                        <button
                          onClick={() => { onNavigate('orders'); setShowUserDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          My Orders
                        </button>
                        <button
                          onClick={() => { onNavigate('tickets'); setShowUserDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                        >
                          <LifeBuoy className="w-3.5 h-3.5" />
                          Support Tickets
                        </button>
                      </div>
                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={() => { onLogout(); setShowUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <div className="p-3.5 space-y-2">
                      <p className="text-[11px] text-center text-slate-400">Sign in to track orders, manage RFQs and purchase devices.</p>
                      <button
                        onClick={() => { onNavigate('login'); setShowUserDropdown(false); }}
                        className="w-full bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-bold py-2 rounded-xl text-center shadow-sm cursor-pointer"
                      >
                        Sign In / Join
                      </button>
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                        <button
                          onClick={() => { onNavigate('register_customer'); setShowUserDropdown(false); }}
                          className="py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                        >
                          Customer
                        </button>
                        <button
                          onClick={() => { onNavigate('register_vendor'); setShowUserDropdown(false); }}
                          className="py-1.5 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 rounded-lg text-slate-600"
                        >
                          Vendor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. NAVIGATION HEADER BAR: Quick categories, offers, diagnostics, dental, pharma, more */}
      <div className={`w-full py-2.5 px-4 sm:px-6 lg:px-8 border-b hidden md:block ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-150 text-slate-800 shadow-xs'
      }`}>
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-[12px] font-bold tracking-wide uppercase">
            <button 
              onClick={() => { onNavigate('marketplace'); onSearch(''); onCategorySelect(''); }} 
              className="hover:text-[#1E40AF] transition text-[#1E40AF] flex items-center gap-1 cursor-pointer"
            >
              <span>Home</span>
            </button>
            <button 
              onClick={() => setShowCatMenu(!showCatMenu)} 
              className="hover:text-[#1E40AF] transition flex items-center gap-1 cursor-pointer"
            >
              <span>Shop by Category</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <button 
              onClick={() => {
                onNavigate('marketplace');
                const brandSection = document.getElementById('brands-section-anchor');
                brandSection?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="hover:text-[#1E40AF] transition cursor-pointer"
            >
              Top Brands
            </button>
            <button 
              onClick={() => {
                onNavigate('marketplace');
                onSearch('');
                // Trigger filters by scrolling to product anchor
                const el = document.getElementById('marketplace-anchor');
                el?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="hover:text-amber-600 text-amber-500 font-extrabold transition flex items-center gap-1 cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
              Offers
            </button>

            <span className="text-slate-300">|</span>

            {/* Specific Categories Requested by User */}
            <button 
              onClick={() => { onNavigate('marketplace'); onCategorySelect('Medical Equipment'); }} 
              className="hover:text-[#1E40AF] transition text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Diagnostics
            </button>
            <button 
              onClick={() => { onNavigate('marketplace'); onCategorySelect('Consumables'); }} 
              className="hover:text-[#1E40AF] transition text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Lab & Consumables
            </button>
            <button 
              onClick={() => { onNavigate('marketplace'); onCategorySelect('Medical Equipment'); }} 
              className="hover:text-[#1E40AF] transition text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Equipment
            </button>
            <button 
              onClick={() => { onNavigate('marketplace'); onCategorySelect('Dental Equipment'); }} 
              className="hover:text-[#1E40AF] transition text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Dental
            </button>
            <button 
              onClick={() => { onNavigate('marketplace'); onCategorySelect('Hospital Furniture'); }} 
              className="hover:text-[#1E40AF] transition text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Orthopedics
            </button>
            <button 
              onClick={() => { onNavigate('marketplace'); onCategorySelect('Homecare Devices'); }} 
              className="hover:text-[#1E40AF] transition text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Pharma
            </button>

            <div className="relative group">
              <button className="hover:text-[#1E40AF] transition text-slate-500 flex items-center gap-1 cursor-pointer">
                <span>More</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute top-full left-0 mt-2.5 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1.5 hidden group-hover:block z-50">
                <button onClick={() => onNavigate('blogs')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-150 text-slate-700 dark:text-slate-300">Clinical Blogs</button>
                <button onClick={() => onNavigate('reviews')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-150 text-slate-700 dark:text-slate-300">Verified Reviews</button>
                <button onClick={() => onNavigate('trust-safety')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-150 text-slate-700 dark:text-slate-300">Trust & Safety</button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            <PhoneCall className="w-3.5 h-3.5 text-[#1E40AF]" />
            <span>Support Hotline: <a href="tel:+919103500592" className="hover:underline text-slate-800 dark:text-slate-200 font-mono">+91 9103500592</a></span>
          </div>
        </div>
      </div>

      {/* MOBILE NAV SIDEBAR DRAWER */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 flex md:hidden font-sans animate-fade-in">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={() => setShowMobileMenu(false)} />
          <div className="relative w-4/5 max-w-xs h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl flex flex-col z-10 transition-transform overflow-y-auto">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <span className="font-bold text-sm tracking-tight text-[#1E40AF] uppercase">Navigation</span>
              <button onClick={() => setShowMobileMenu(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 p-4 space-y-4 text-xs font-bold">
              <button 
                onClick={() => { onNavigate('marketplace'); onSearch(''); onCategorySelect(''); setShowMobileMenu(false); }}
                className="w-full text-left py-2 border-b border-slate-100 flex items-center gap-2"
              >
                <span>Home</span>
              </button>
              
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Categories</p>
                <div className="space-y-1.5 pl-2 max-h-[160px] overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onCategorySelect(cat.name);
                        setShowMobileMenu(false);
                        onNavigate('marketplace');
                      }}
                      className="w-full text-left py-1 text-slate-600 hover:text-[#1E40AF] block"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">B2B Portals</p>
                <div className="space-y-2 pl-2">
                  <button onClick={() => { onNavigate('rfqs'); setShowMobileMenu(false); }} className="w-full text-left py-1 text-slate-600 hover:text-teal-600 block">RFQ Platform</button>
                  <button onClick={() => { onNavigate('trust-safety'); setShowMobileMenu(false); }} className="w-full text-left py-1 text-slate-600 hover:text-emerald-600 block">Trust & Safety</button>
                  <button onClick={() => { onNavigate('reviews'); setShowMobileMenu(false); }} className="w-full text-left py-1 text-slate-600 hover:text-amber-500 block">Clinical Reviews</button>
                  <button onClick={() => { onNavigate('blogs'); setShowMobileMenu(false); }} className="w-full text-left py-1 text-slate-600 hover:text-blue-500 block">Clinical Blogs</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
