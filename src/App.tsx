import React, { useState, useEffect } from 'react';
import { dbLocal } from './db';
import { User, Product } from './types';
import Navbar from './components/Navbar';
import CustomerPanel from './components/CustomerPanel';
import AdminPanel from './components/AdminPanel';
import VendorPanel from './components/VendorPanel';
import SupportChat from './components/SupportChat';
import BlogSection from './components/BlogSection';
import AuthModal from './components/AuthModal';
import WhatsAppWidget from './components/WhatsAppWidget';
import TrustAndSafetyPage from './components/TrustAndSafetyPage';
import ReviewsPage from './components/ReviewsPage';
import PolicyModal, { PolicyType } from './components/PolicyModal';
import { LogIn, User as UserIcon, Store, KeyRound, ArrowRight, Menu, ChevronLeft, ChevronRight, Activity, ShoppingCart, MessageSquare, BookOpen, FileText, ClipboardList, HelpCircle, Palette, Moon, Sun, Heart, Sparkles, SlidersHorizontal, UserPlus, LogOut, ShieldCheck } from 'lucide-react';

import AdminPaymentSettingsPage from '../app/admin/settings/payment/page';
import AdminWhatsAppSettingsPage from '../app/admin/settings/whatsapp/page';
import AdminVerificationDashboard from '../app/admin/verification/page';
import AdminDashboardPage from '../app/admin/page';
import VendorOrdersPage from '../app/vendor/orders/page';
import CheckoutManualPage from '../app/checkout/page';
import WhatsappButton from './components/WhatsappButton';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('marketplace');
  const [showAuth, setShowAuth] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register_customer' | 'register_vendor' | 'forgot' | 'force_reset'>('login');
  const [activePolicyModal, setActivePolicyModal] = useState<PolicyType>(null);

  // Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('healnex_sidebar_collapsed') === 'true');

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('healnex_sidebar_collapsed', next ? 'true' : 'false');
      return next;
    });
  };

  // Dark Mode Preference State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('healnex_theme') === 'dark');

  // Dynamic Design Template State
  const [designTemplate, setDesignTemplate] = useState<string>(() => localStorage.getItem('healnex_design_template') || 'sapphire');

  const changeDesignTemplate = (template: string) => {
    setDesignTemplate(template);
    localStorage.setItem('healnex_design_template', template);
    addToast(`Switched template to ${template.toUpperCase()} layout.`, 'success');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('healnex_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Unified high-density toast state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Search & Navigation States passed down
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  // Cart & Interaction states
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Product[]>([]);

  // System setup trigger inside useEffect
  useEffect(() => {
    // Initialize Local Database Mock with default credentials & categories
    dbLocal.init();

    // Check SEO sitemap URL deep link hydration
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/category/')) {
        const cat = decodeURIComponent(path.replace('/category/', ''));
        if (cat) setSelectedCategoryName(cat);
      }
    }

    // Do not load any active session automatically on startup to start logged out
    setCurrentUser(null);
  }, []);

  const handleLogout = () => {
    dbLocal.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentView('marketplace');
    addToast('Logged out from clinical workspace session.', 'info');
  };

  const handleRoleChange = (selectedRole: 'super_admin' | 'vendor' | 'customer') => {
    const allUsers = dbLocal.getUsers();
    
    let targetUser: User | undefined;
    if (selectedRole === 'super_admin') {
      targetUser = allUsers.find(u => u.role === 'super_admin');
      setCurrentView('admin');
    } else if (selectedRole === 'vendor') {
      targetUser = allUsers.find(u => u.role === 'vendor');
      setCurrentView('vendor');
    } else {
      targetUser = allUsers.find(u => u.role === 'customer');
      setCurrentView('marketplace');
    }

    if (targetUser) {
      dbLocal.setCurrentUser(targetUser);
      setCurrentUser(targetUser);
    }
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategoryName(catName);
    setCurrentView('marketplace');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('marketplace');
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans selection:bg-teal-700 selection:text-white transition-colors duration-300 theme-${designTemplate} ${
      isDarkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* Left Sidebar (Only visible on medium screens and up) */}
      <aside className={`relative flex flex-col bg-[#1E40AF] text-white shrink-0 transition-all duration-300 border-r border-blue-950/20 shadow-xl ${
        isSidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      } hidden md:flex h-full`}>
        
        {/* Brand Header */}
        <div className={`p-4 border-b border-blue-800/40 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-white p-1.5 rounded-xl shadow-sm shrink-0">
              <Activity className="w-5 h-5 text-[#1E40AF] stroke-[2.5]" />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <span className="font-bold text-lg tracking-tight leading-none font-display block text-white">HEALNEX</span>
                <span className="text-[9px] uppercase tracking-widest opacity-70 font-bold font-display block -mt-0.5 text-blue-200">Medi Bazar</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Nav items */}
        <nav className="flex-grow py-4 px-3 space-y-1 overflow-y-auto">
          {/* Control Center Row */}
          <div className={`text-[10px] text-blue-200 font-bold uppercase tracking-wider px-2 mb-2.5 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && <span>Control Center</span>}
            <button 
              onClick={toggleSidebarCollapse}
              className="text-blue-100 bg-blue-800 hover:bg-blue-700 hover:text-white p-1 rounded-lg transition cursor-pointer border border-blue-700/50 shadow-sm"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Theme Toggle & Template Selector */}
          {!isSidebarCollapsed ? (
            <div className="px-2 pb-3 mb-3 border-b border-blue-800/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-blue-200 uppercase tracking-wider font-bold opacity-80">Dark Mode</span>
                <button 
                  onClick={toggleDarkMode}
                  className="text-[9px] bg-blue-800/60 hover:bg-white hover:text-[#1E40AF] px-2 py-0.5 rounded-md text-blue-100 transition font-sans cursor-pointer border border-blue-700/50"
                  title="Toggle Light/Dark Theme"
                >
                  {isDarkMode ? '🌙 Dark' : '☀️ Light'}
                </button>
              </div>
              <div>
                <p className="text-[9px] text-blue-200 uppercase tracking-wider mb-1.5 font-bold opacity-80">Design Template</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'sapphire', label: 'Sapphire', color: 'bg-blue-500' },
                    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
                    { id: 'amethyst', label: 'Biotech', color: 'bg-purple-500' },
                    { id: 'crimson', label: 'Cardio', color: 'bg-rose-500' }
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => changeDesignTemplate(tpl.id)}
                      className={`py-1 px-1.5 text-[8px] rounded-md font-bold uppercase tracking-tight text-left transition-all cursor-pointer flex items-center gap-1 ${
                        designTemplate === tpl.id 
                          ? 'bg-white text-blue-900 scale-[1.02] shadow-sm' 
                          : 'bg-blue-800/40 hover:bg-blue-800/80 text-blue-100 hover:text-white border border-blue-700/30'
                      }`}
                      title={`Switch to ${tpl.label}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${tpl.color} shrink-0 block`} />
                      <span className="truncate">{tpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pb-3 mb-3 border-b border-blue-800/40">
              <button 
                onClick={toggleDarkMode}
                className="p-1.5 bg-blue-800/60 hover:bg-white hover:text-[#1E40AF] rounded-lg text-blue-100 transition cursor-pointer border border-blue-700/50"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => {
                  const templates = ['sapphire', 'emerald', 'amethyst', 'crimson'];
                  const nextIdx = (templates.indexOf(designTemplate) + 1) % templates.length;
                  changeDesignTemplate(templates[nextIdx]);
                }}
                className="p-1.5 bg-blue-800/60 hover:bg-white hover:text-[#1E40AF] rounded-lg text-blue-100 transition cursor-pointer border border-blue-700/50"
                title={`Cycle Design (Current: ${designTemplate.toUpperCase()})`}
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Sign In / Sign Up Gateway (Only show when not logged in) */}
          {!currentUser && (
            !isSidebarCollapsed ? (
              <div className="px-2 pb-3 mb-3 border-b border-blue-800/40">
                <p className="text-[9px] text-blue-200 uppercase tracking-wider mb-1.5 font-bold opacity-80">Gateway</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setShowAuth(true);
                    }}
                    className="py-1 px-1.5 bg-blue-800/60 hover:bg-white hover:text-blue-950 text-blue-100 text-[8.5px] font-bold rounded-lg uppercase tracking-tight transition flex items-center justify-center gap-1 border border-blue-700/50 cursor-pointer shadow-sm"
                    title="Sign In"
                  >
                    <LogIn className="w-3 h-3 shrink-0" />
                    <span>In</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('register_customer');
                      setShowAuth(true);
                    }}
                    className="py-1 px-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[8.5px] font-bold rounded-lg uppercase tracking-tight transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    title="Sign Up"
                  >
                    <UserPlus className="w-3 h-3 shrink-0" />
                    <span>Up</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center pb-3 mb-3 border-b border-blue-800/40">
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setShowAuth(true);
                  }}
                  className="p-1.5 bg-blue-800/60 hover:bg-white hover:text-blue-950 text-blue-100 rounded-lg border border-blue-700/50 cursor-pointer shadow-sm transition"
                  title="Sign In / Register"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              </div>
            )
          )}

          {/* Render Core Nav Links */}
          <div className="space-y-1">
            {[
              {
                id: 'marketplace',
                label: 'Marketplace',
                icon: Store,
                badge: null,
                onClick: () => {
                  setCurrentView('marketplace');
                  setSearchQuery('');
                  setSelectedCategoryName('');
                }
              },
              {
                id: 'checkout',
                label: 'Manual Checkout (UI)',
                icon: ShoppingCart,
                badge: null,
                show: currentUser?.role === 'super_admin' || currentUser?.role === 'admin',
                onClick: () => setCurrentView('checkout')
              },
              {
                id: 'admin-dashboard',
                label: 'Admin Command Center',
                icon: ShieldCheck,
                badge: null,
                show: currentUser?.role === 'super_admin' || currentUser?.role === 'admin',
                onClick: () => setCurrentView('admin-dashboard')
              },
              {
                id: 'admin-payment-settings',
                label: 'Payment Gateway Setup',
                icon: KeyRound,
                badge: null,
                show: currentUser?.role === 'super_admin' || currentUser?.role === 'admin',
                onClick: () => setCurrentView('admin-payment-settings')
              },
              {
                id: 'admin-whatsapp-settings',
                label: 'WhatsApp Setup',
                icon: MessageSquare,
                badge: null,
                show: currentUser?.role === 'super_admin' || currentUser?.role === 'admin',
                onClick: () => setCurrentView('admin-whatsapp-settings')
              },
              {
                id: 'admin-verification',
                label: 'Payment Verification',
                icon: ShieldCheck,
                badge: null,
                show: currentUser?.role === 'super_admin' || currentUser?.role === 'admin',
                onClick: () => setCurrentView('admin-verification')
              },
              {
                id: 'vendor-orders',
                label: 'Vendor Fulfillment',
                icon: ClipboardList,
                badge: null,
                show: currentUser?.role === 'vendor' || currentUser?.role === 'super_admin' || currentUser?.role === 'admin',
                onClick: () => setCurrentView('vendor-orders')
              },
              {
                id: 'admin',
                label: 'Super Admin Desk',
                icon: SlidersHorizontal,
                badge: null,
                show: currentUser?.role === 'super_admin' || currentUser?.role === 'admin',
                onClick: () => setCurrentView('admin')
              },
              {
                id: 'vendor',
                label: 'Vendor Desk',
                icon: Store,
                badge: null,
                show: currentUser?.role === 'vendor' || currentUser?.role === 'super_admin' || currentUser?.role === 'admin',
                onClick: () => setCurrentView('vendor')
              },
              {
                id: 'rfqs',
                label: 'RFQ Procurement',
                icon: FileText,
                badge: null,
                onClick: () => setCurrentView('rfqs')
              },
              {
                id: 'orders',
                label: 'My Orders',
                icon: ClipboardList,
                badge: null,
                show: currentUser && currentUser.role === 'customer',
                onClick: () => setCurrentView('orders')
              },
              {
                id: 'cart',
                label: 'Checkout Cart',
                icon: ShoppingCart,
                badge: cart.length > 0 ? cart.reduce((sum, item) => sum + item.quantity, 0) : null,
                onClick: () => setCurrentView('cart')
              },
              {
                id: 'tickets',
                label: 'Support Tickets',
                icon: MessageSquare,
                badge: null,
                onClick: () => setCurrentView('tickets')
              },
              {
                id: 'blogs',
                label: 'Clinical Blogs',
                icon: BookOpen,
                badge: null,
                onClick: () => setCurrentView('blogs')
              }
            ].filter(item => item.show !== false).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'marketplace' && ['marketplace', 'reviews', 'trust-safety'].includes(currentView));
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5 text-left'
                  } ${
                    isActive 
                      ? 'bg-white text-[#1E40AF] shadow-md scale-[1.02]' 
                      : 'text-blue-100 hover:bg-blue-850 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <div className="relative shrink-0">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#1E40AF]' : 'text-blue-200'}`} />
                    {item.badge !== null && isSidebarCollapsed && (
                      <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!isSidebarCollapsed && item.badge !== null && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-sm`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Profile Session */}
        {currentUser && (
          <div className={`p-4 border-t border-blue-800/40 bg-blue-900/40 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0 border border-orange-400/30">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate leading-tight">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[9px] text-blue-200 opacity-80 uppercase font-mono tracking-wider truncate">
                    {currentUser.role.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Right Column Layout Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Main Header navigation */}
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={(view) => {
            if (view === 'login') {
              setAuthModalMode('login');
              setShowAuth(true);
              return;
            }
            if (view === 'register_customer') {
              setAuthModalMode('register_customer');
              setShowAuth(true);
              return;
            }
            if (view === 'register_vendor') {
              setAuthModalMode('register_vendor');
              setShowAuth(true);
              return;
            }
            if (view === 'admin-panel') {
              setCurrentView('admin');
              return;
            }
            if (view === 'vendor-panel') {
              setCurrentView('vendor');
              return;
            }
            setCurrentView(view);
            if (view === 'marketplace') {
              setSearchQuery('');
              setSelectedCategoryName('');
            }
          }}
          currentView={currentView}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          wishlistCount={wishlist.length}
          compareCount={compareList.length}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onCategorySelect={handleCategorySelect}
          isDarkMode={isDarkMode}
          designTemplate={designTemplate}
          onChangeDesignTemplate={changeDesignTemplate}
        />

        {/* Primary content area */}
        <main className="flex-grow overflow-y-auto flex flex-col bg-slate-50 dark:bg-slate-950/20">
          
          <div className="flex-grow p-4 md:p-6 lg:p-8 w-full max-w-none">
            {/* Marketplace (Customer Dashboard) */}
            {(currentView === 'marketplace' || currentView === 'cart' || currentView === 'rfqs' || currentView === 'orders') && (
              <CustomerPanel
                currentUser={currentUser}
                onNavigate={setCurrentView}
                currentView={currentView}
                cart={cart}
                onUpdateCart={setCart}
                wishlist={wishlist}
                onUpdateWishlist={setWishlist}
                compareList={compareList}
                onUpdateCompare={setCompareList}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                selectedCategoryName={selectedCategoryName}
                onCategorySelect={handleCategorySelect}
                addToast={addToast}
                isDarkMode={isDarkMode}
                onOpenPolicy={(policy) => setActivePolicyModal(policy)}
              />
            )}

            {/* Clinical Equipment Reviews Portal */}
            {currentView === 'reviews' && (
              <ReviewsPage
                onNavigate={setCurrentView}
                onSelectProduct={(prod) => {
                  setCurrentView('marketplace');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('healnex_open_product', { detail: prod }));
                  }, 100);
                }}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Trust & Safety Dedicated Page */}
            {currentView === 'trust-safety' && (
              <TrustAndSafetyPage
                onNavigate={setCurrentView}
                onOpenPolicy={(policy) => setActivePolicyModal(policy)}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Super Admin Console */}
            {currentView === 'admin' && (
              <AdminPanel currentUser={currentUser} addToast={addToast} />
            )}

            {currentView === 'admin-payment-settings' && (
              <AdminPaymentSettingsPage />
            )}

            {currentView === 'admin-whatsapp-settings' && (
              <AdminWhatsAppSettingsPage />
            )}

            {currentView === 'admin-verification' && (
              <AdminVerificationDashboard />
            )}

            {currentView === 'admin-dashboard' && (
              <AdminDashboardPage navigateTo={(view, path) => setCurrentView(view)} />
            )}

            {currentView === 'vendor-orders' && (
              <VendorOrdersPage />
            )}

            {currentView === 'checkout' && (
              <CheckoutManualPage />
            )}

            {/* Supplier Vendor Console */}
            {currentView === 'vendor' && (
              <VendorPanel currentUser={currentUser} addToast={addToast} />
            )}

            {/* Helpdesk tickets conversation */}
            {currentView === 'tickets' && (
              <SupportChat currentUser={currentUser} onNavigate={setCurrentView} addToast={addToast} />
            )}

            {/* Knowledge Blogs */}
            {currentView === 'blogs' && (
              <BlogSection currentUser={currentUser} addToast={addToast} />
            )}
          </div>

          {/* Clinical Footer */}
          <footer className="bg-slate-950 text-slate-400 text-xs py-6 border-t border-slate-800 shrink-0 mt-auto w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left space-y-1">
                  <h4 className="text-sm font-bold text-blue-400 font-display">MedBazar Helnex</h4>
                  <p className="text-[11px] text-slate-400">A secure marketplace connecting customers with trusted medical equipment vendors.</p>
                  <p className="text-[10px] text-slate-500 font-medium">Al Salam Medical Equipment Centre | WhatsApp Support: +91 9103500592</p>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-5 gap-y-2 text-[11px] font-semibold">
                  <button onClick={() => setActivePolicyModal('about')} className="hover:text-blue-400 transition">About Us</button>
                  <button onClick={() => setActivePolicyModal('contact')} className="hover:text-blue-400 transition">Contact</button>
                  <button onClick={() => setActivePolicyModal('privacy')} className="hover:text-blue-400 transition">Privacy Policy</button>
                  <button onClick={() => setActivePolicyModal('terms')} className="hover:text-blue-400 transition">Terms & Conditions</button>
                  <button onClick={() => setActivePolicyModal('refund')} className="hover:text-blue-400 transition">Refund Policy</button>
                  <button onClick={() => setActivePolicyModal('shipping')} className="hover:text-blue-400 transition">Shipping Policy</button>
                  <button onClick={() => setCurrentView('trust-safety')} className="text-blue-400 hover:text-blue-300 font-bold transition">Trust & Safety</button>
                  <button onClick={() => setCurrentView('reviews')} className="text-amber-400 hover:text-amber-300 font-bold transition">Verified Reviews</button>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
                <p>&copy; 2026 MedBazar Helnex | Operated by Al Salam Medical Equipment Centre</p>
                <p>All clinical equipment orders subject to verified B2B procurement standards.</p>
              </div>
            </div>
          </footer>

        </main>

      </div>

      {/* Policy Reader Modal */}
      <PolicyModal
        policy={activePolicyModal}
        onClose={() => setActivePolicyModal(null)}
        isDarkMode={isDarkMode}
      />

      {/* Secure Auth Overlay */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          isDarkMode={isDarkMode}
          initialMode={authModalMode}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            if (user.role === 'super_admin') {
              setCurrentView('admin');
            } else if (user.role === 'vendor') {
              setCurrentView('vendor');
            } else {
              setCurrentView('marketplace');
            }
          }}
          addToast={addToast}
        />
      )}

      {/* High-density Floating Toast Notification Center */}
      <div className="fixed bottom-6 left-6 z-[60] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-2.5 pointer-events-auto transition-all duration-350 animate-slide-in-left ${
              t.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : t.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-teal-50 border-teal-200 text-teal-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              t.type === 'success' ? 'bg-emerald-500 animate-pulse' : t.type === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-teal-500 animate-pulse'
            }`}></span>
            <p className="flex-1">{t.message}</p>
          </div>
        ))}
      </div>

      {/* Global Admin-Managed WhatsApp Support Widget */}
      <WhatsappButton customerName={currentUser?.name || 'Customer'} />

    </div>
  );
}
