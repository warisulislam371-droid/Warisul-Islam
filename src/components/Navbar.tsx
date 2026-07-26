import React, { useState, useEffect } from 'react';
import { User, Notification, Category } from '../types';
import { dbLocal } from '../db';
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
  ArrowRight
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    const handleDbUpdate = () => {
      setNotifications(dbLocal.getNotifications());
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
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0077B6] to-[#0F9D8A] text-white flex items-center justify-center shadow-md">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
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
        <div className="flex-1 max-w-2xl relative hidden md:block">
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
              placeholder="Search Medical Equipment, Brands, Categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              className="w-full px-3 py-2 text-xs font-medium text-slate-800 outline-none bg-transparent placeholder-slate-400 font-sans"
            />

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

