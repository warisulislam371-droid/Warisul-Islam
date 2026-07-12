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
import { LogIn, User as UserIcon, Store, KeyRound, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('marketplace');
  const [showAuth, setShowAuth] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register_customer' | 'register_vendor' | 'forgot' | 'force_reset'>('login');
  const [activePolicyModal, setActivePolicyModal] = useState<PolicyType>(null);

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
      <aside className="w-56 bg-teal-700 flex flex-col text-white shrink-0 hidden md:flex border-r border-teal-900/40 shadow-xl">
        {/* Brand Header */}
        <div className="p-4 border-b border-teal-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-white p-1 rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight leading-none font-display">HEALNEX</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold font-display">Medi Bazar India</p>
        </div>

        {/* Sidebar Nav items */}
        <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
          <div className="text-[9px] text-teal-300 font-bold uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
            <span>Control Center</span>
            <button 
              onClick={toggleDarkMode}
              className="text-[9px] bg-teal-800/65 hover:bg-teal-800 px-1.5 py-0.5 rounded text-teal-200 transition font-sans cursor-pointer"
              title="Toggle Clinical Theme"
            >
              {isDarkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>

          {/* Quick Sign In / Sign Up Auth Buttons */}
          <div className="px-2 pb-2.5 mb-2.5 border-b border-teal-800/60">
            <p className="text-[8px] text-teal-200 uppercase tracking-wider mb-1.5 font-bold opacity-80">Account Gateway</p>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setShowAuth(true);
                }}
                className="py-1 px-1.5 bg-teal-800/60 hover:bg-white hover:text-teal-950 text-teal-100 text-[8px] font-bold rounded-md uppercase tracking-tight transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                title="Sign In to account"
              >
                <span>🔑 Sign In</span>
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('register_customer');
                  setShowAuth(true);
                }}
                className="py-1 px-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[8px] font-bold rounded-md uppercase tracking-tight transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                title="Create a new account"
              >
                <span>✨ Sign Up</span>
              </button>
            </div>
          </div>

          {/* Dynamic Design Templates Grid Switcher */}
          <div className="px-2 pb-2.5 mb-2.5 border-b border-teal-800/60">
            <p className="text-[8px] text-teal-200 uppercase tracking-wider mb-1.5 font-bold opacity-80">Design Template</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'sapphire', label: 'Sapphire Blue', color: 'bg-blue-500' },
                { id: 'emerald', label: 'Emerald Mint', color: 'bg-emerald-500' },
                { id: 'amethyst', label: 'Amethyst Biotech', color: 'bg-purple-500' },
                { id: 'crimson', label: 'Crimson Cardio', color: 'bg-rose-500' }
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => changeDesignTemplate(tpl.id)}
                  className={`py-1 px-1.5 text-[7.5px] rounded-md font-bold uppercase tracking-tight text-left transition-all cursor-pointer flex items-center gap-1 ${
                    designTemplate === tpl.id 
                      ? 'bg-white text-teal-950 scale-[1.02] shadow-sm' 
                      : 'bg-teal-800/40 hover:bg-teal-800/80 text-teal-100 hover:text-white'
                  }`}
                  title={`Switch to ${tpl.label}`}
                >
                  <span className={`w-1 h-1 rounded-full ${tpl.color} shrink-0 block`} />
                  <span className="truncate">{tpl.id === 'sapphire' ? 'Sapphire' : tpl.id === 'emerald' ? 'Emerald' : tpl.id === 'amethyst' ? 'Biotech' : 'Cardio'}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Marketplace */}
          <button 
            onClick={() => {
              setCurrentView('marketplace');
              setSearchQuery('');
              setSelectedCategoryName('');
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
              currentView === 'marketplace' ? 'bg-teal-800 text-white shadow-sm' : 'hover:bg-teal-800/55 text-teal-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'marketplace' ? 'bg-orange-400 animate-ping' : 'bg-transparent'}`}></span>
            Marketplace
          </button>

          {/* Super Admin Desk (Conditional) */}
          {currentUser?.role === 'super_admin' && (
            <button 
              onClick={() => setCurrentView('admin')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
                currentView === 'admin' ? 'bg-teal-800 text-white shadow-sm' : 'hover:bg-teal-800/55 text-teal-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'admin' ? 'bg-orange-400 animate-pulse' : 'bg-transparent'}`}></span>
              Super Admin Desk
            </button>
          )}

          {/* Supplier Vendor Desk (Conditional) */}
          {currentUser?.role === 'vendor' && (
            <button 
              onClick={() => setCurrentView('vendor')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
                currentView === 'vendor' ? 'bg-teal-800 text-white shadow-sm' : 'hover:bg-teal-800/55 text-teal-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'vendor' ? 'bg-orange-400 animate-pulse' : 'bg-transparent'}`}></span>
              Vendor Desk
            </button>
          )}

          {/* RFQ Procurement */}
          <button 
            onClick={() => setCurrentView('rfqs')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
              currentView === 'rfqs' ? 'bg-teal-800 text-white shadow-sm' : 'hover:bg-teal-800/55 text-teal-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'rfqs' ? 'bg-orange-400 animate-ping' : 'bg-transparent'}`}></span>
            RFQ Procurement
          </button>

          {/* My Orders for Customer */}
          {currentUser && currentUser.role === 'customer' && (
            <button 
              onClick={() => setCurrentView('orders')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
                currentView === 'orders' ? 'bg-teal-800 text-white shadow-sm' : 'hover:bg-teal-800/55 text-teal-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'orders' ? 'bg-orange-400 animate-pulse' : 'bg-transparent'}`}></span>
              My Orders
            </button>
          )}

          <div className="text-[9px] text-teal-300 font-bold uppercase tracking-wider px-2 mt-4 mb-1.5">Operations</div>

          {/* Shopping Cart */}
          <button 
            onClick={() => setCurrentView('cart')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
              currentView === 'cart' ? 'bg-teal-800 text-white shadow-sm' : 'hover:bg-teal-800/55 text-teal-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'cart' ? 'bg-orange-400' : 'bg-transparent'}`}></span>
              <span>Checkout Cart</span>
            </div>
            {cart.length > 0 && (
              <span className="bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>

          {/* Support Tickets */}
          <button 
            onClick={() => setCurrentView('tickets')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
              currentView === 'tickets' ? 'bg-teal-800 text-white shadow-sm' : 'hover:bg-teal-800/55 text-teal-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'tickets' ? 'bg-orange-400' : 'bg-transparent'}`}></span>
            Support Tickets
          </button>

          {/* Clinical Blogs */}
          <button 
            onClick={() => setCurrentView('blogs')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
              currentView === 'blogs' ? 'bg-teal-800 text-white shadow-sm' : 'hover:bg-teal-800/55 text-teal-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'blogs' ? 'bg-orange-400' : 'bg-transparent'}`}></span>
            Clinical Blogs
          </button>
        </nav>

        {/* Sidebar Profile Session / Login Panel on Left Corner */}
        {currentUser && (
          <div className="p-4 bg-teal-950/60 mt-auto border-t border-teal-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate leading-tight">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[9px] opacity-65 uppercase font-mono tracking-wider truncate">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
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
        <main className="flex-grow overflow-y-auto">
          
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

        </main>

        {/* Clinical Footer */}
        <footer className="bg-slate-950 text-slate-400 text-xs py-6 border-t border-slate-800 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left space-y-1">
                <h4 className="text-sm font-bold text-teal-400 font-display">MedBazar Helnex</h4>
                <p className="text-[11px] text-slate-400">A secure marketplace connecting customers with trusted medical equipment vendors.</p>
                <p className="text-[10px] text-slate-500 font-medium">Al Salam Medical Equipment Centre | WhatsApp Support: +91 9103500592</p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-5 gap-y-2 text-[11px] font-semibold">
                <button onClick={() => setActivePolicyModal('about')} className="hover:text-teal-400 transition">About Us</button>
                <button onClick={() => setActivePolicyModal('contact')} className="hover:text-teal-400 transition">Contact</button>
                <button onClick={() => setActivePolicyModal('privacy')} className="hover:text-teal-400 transition">Privacy Policy</button>
                <button onClick={() => setActivePolicyModal('terms')} className="hover:text-teal-400 transition">Terms & Conditions</button>
                <button onClick={() => setActivePolicyModal('refund')} className="hover:text-teal-400 transition">Refund Policy</button>
                <button onClick={() => setActivePolicyModal('shipping')} className="hover:text-teal-400 transition">Shipping Policy</button>
                <button onClick={() => setCurrentView('trust-safety')} className="text-teal-400 hover:text-teal-300 font-bold transition">Trust & Safety</button>
                <button onClick={() => setCurrentView('reviews')} className="text-amber-400 hover:text-amber-300 font-bold transition">Verified Reviews</button>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
              <p>&copy; 2026 MedBazar Helnex | Operated by Al Salam Medical Equipment Centre</p>
              <p>All clinical equipment orders subject to verified B2B procurement standards.</p>
            </div>
          </div>
        </footer>

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
      <WhatsAppWidget currentUser={currentUser} currentView={currentView} />

    </div>
  );
}
