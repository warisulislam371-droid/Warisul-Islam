import React, { useState, useEffect } from 'react';
import { Product, Category, Brand, Review, Vendor } from '../types';
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
  Percent,
  Check
} from 'lucide-react';

interface EnterpriseHomepageProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  vendors: Vendor[];
  reviews: Review[];
  selectedCategoryName: string;
  onCategorySelect: (catName: string) => void;
  onNavigate: (view: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onAddToWishlist: (productId: string) => void;
  onAddToCompare: (product: Product) => void;
  onQuickView: (product: Product) => void;
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
  onCategorySelect,
  onNavigate,
  onAddToCart,
  onAddToWishlist,
  onAddToCompare,
  onQuickView,
  onBecomeSeller,
  addToast
}: EnterpriseHomepageProps) {
  const [heroSlide, setHeroSlide] = useState(0);
  const [sidebarExpandedCategory, setSidebarExpandedCategory] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [countdown, setCountdown] = useState({ hours: 14, mins: 32, secs: 45 });

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
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, []);

  const heroSlides = [
    {
      headline: "India's Trusted Medical Equipment Marketplace",
      subtitle: "Buy directly from verified manufacturers and distributors with GST invoices and PAN India installation support.",
      bgImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200",
      featuredItems: ["ECG Machine", "Patient Monitor", "Ultrasound", "Ventilator", "Defibrillator"]
    },
    {
      headline: "Enterprise Hospital Procurement & RFQ Tenders",
      subtitle: "Streamline bulk ICU setups, OT equipment, and laboratory supplies with direct factory wholesale prices.",
      bgImage: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1200",
      featuredItems: ["ICU Beds", "Anaesthesia Workstation", "C-Arm Image Intensifier", "Multipara Monitor"]
    },
    {
      headline: "Certified Refurbished & Warranted Medical Equipment",
      subtitle: "Save up to 50% on premium MRI, CT Scans, and Ultrasound systems backed by 1-Year Pan-India Warranty.",
      bgImage: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1200",
      featuredItems: ["1.5T MRI Machine", "64-Slice CT Scanner", "3D/4D Ultrasound", "High-Flow Oxygen Concentrator"]
    }
  ];

  const sidebarCategories = [
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

  const featuredCategoryCards = [
    { name: "Diagnostic Equipment", displayName: "Diagnostic Equipment", count: "150+ Products", image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400", icon: "🔬" },
    { name: "ECG Machines", displayName: "ECG Machines", count: "45+ Products", image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400", icon: "📈" },
    { name: "Ultrasound", displayName: "Ultrasound", count: "60+ Products", image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400", icon: "🖥️" },
    { name: "Patient Monitoring", displayName: "Patient Monitoring", count: "85+ Products", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400", icon: "📊" },
    { name: "Laboratory Equipment", displayName: "Lab Equipment", count: "120+ Products", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400", icon: "🧪" },
    { name: "Hospital Furniture", displayName: "Hospital Furniture", count: "90+ Products", image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=400", icon: "🛏️" },
    { name: "Surgical Instruments", displayName: "Surgical", count: "250+ Products", image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=400", icon: "✂️" },
    { name: "Medical Consumables", displayName: "Consumables", count: "500+ Products", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400", icon: "📦" },
    { name: "Dental Equipment", displayName: "Dental", count: "40+ Products", image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=400", icon: "🦷" },
    { name: "Home Healthcare", displayName: "Home Care", count: "110+ Products", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400", icon: "🏠" }
  ];

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

  const renderProductCard = (product: Product) => {
    const discount = Math.round(((product.price - product.salePrice) / product.price) * 100);
    return (
      <div 
        key={product.id}
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative min-w-[260px] max-w-[280px] shrink-0"
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
            onClick={() => onAddToWishlist(product.id)}
            className="p-1.5 bg-white/90 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-full shadow-md transition"
            title="Wishlist"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onAddToCompare(product)}
            className="p-1.5 bg-white/90 hover:bg-[#0077B6]/10 text-slate-600 hover:text-[#0077B6] rounded-full shadow-md transition"
            title="Compare"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onQuickView(product)}
            className="p-1.5 bg-white/90 hover:bg-[#0F9D8A]/10 text-slate-600 hover:text-[#0F9D8A] rounded-full shadow-md transition"
            title="Quick View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Image Container */}
        <div className="h-44 w-full rounded-xl overflow-hidden bg-[#F5F7FA] p-2 relative mb-3 flex items-center justify-center">
          <img
            src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400'}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
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

          {/* Verification & EMI Badges */}
          <div className="flex flex-wrap items-center gap-1 pt-1 text-[9px] font-semibold text-slate-500">
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
              ✓ Verified Vendor
            </span>
            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
              No-Cost EMI
            </span>
          </div>
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
              onAddToCart(product, product.moq || 1);
              onNavigate('cart');
            }}
            className="bg-[#0F9D8A] hover:bg-[#0c8272] text-white text-[11px] font-bold py-2 rounded-xl transition shadow-sm"
          >
            Buy Now
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 font-sans bg-white text-[#1F2937] pb-12">
      
      {/* 1. HERO SECTION: Left Sidebar + 550px Hero Slider */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 pt-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Vertical Category Sidebar */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hidden lg:block h-[550px] overflow-y-auto scrollbar-thin">
          <h3 className="text-xs font-black text-[#1F2937] uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Medical Categories</span>
            <span className="text-[10px] text-[#0077B6]">20+ Divisions</span>
          </h3>
          <ul className="space-y-1 mt-2">
            {sidebarCategories.map((cat) => (
              <li key={cat.name}>
                <button
                  onClick={() => onCategorySelect(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between hover:bg-[#F5F7FA] ${
                    selectedCategoryName === cat.name ? 'bg-[#0F9D8A]/10 text-[#0F9D8A] font-bold' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="truncate max-w-[150px]">{cat.name}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Large Hero Banner Slider (550px) */}
        <div className="lg:col-span-3 h-[550px] rounded-2xl overflow-hidden relative shadow-lg border border-slate-200 group">
          <img
            src={heroSlides[heroSlide].bgImage}
            alt="Hero Banner"
            className="w-full h-full object-cover transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1F2937]/90 via-[#1F2937]/75 to-transparent flex items-center px-8 sm:px-14">
            <div className="max-w-xl text-white space-y-6">
              <span className="inline-block bg-[#0F9D8A] text-white text-[11px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                ⚡ INDIA'S #1 B2B MEDICAL MARKETPLACE
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                {heroSlides[heroSlide].headline}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                {heroSlides[heroSlide].subtitle}
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('catalog-anchor');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#0F9D8A] hover:bg-[#0c8272] text-white font-bold text-xs sm:text-sm px-8 py-3.5 rounded-xl transition shadow-xl flex items-center gap-2 cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (onBecomeSeller) onBecomeSeller();
                    else onNavigate('register_vendor');
                  }}
                  className="bg-white text-[#1F2937] hover:bg-slate-100 font-bold text-xs sm:text-sm px-8 py-3.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-[#0077B6]" />
                  <span>Become Vendor</span>
                </button>
              </div>

              {/* Featured Equipment List */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10 text-[11px] text-slate-300">
                <span className="font-bold text-white">Popular:</span>
                {heroSlides[heroSlide].featuredItems.map(item => (
                  <span key={item} className="bg-white/10 px-2.5 py-0.5 rounded-md backdrop-blur-sm border border-white/10 font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <button
            onClick={() => setHeroSlide((prev) => (prev - 1 + 3) % 3)}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setHeroSlide((prev) => (prev + 1) % 3)}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setHeroSlide(idx)}
                className={`h-2.5 rounded-full transition-all ${idx === heroSlide ? 'w-8 bg-[#0F9D8A]' : 'w-2.5 bg-white/50'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. TRUST BADGES STRIP */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-[#F5F7FA] p-6 rounded-2xl border border-slate-200 text-center">
          <div className="space-y-1.5 p-2">
            <div className="w-10 h-10 rounded-2xl bg-[#0077B6]/10 text-[#0077B6] mx-auto flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#1F2937]">Genuine Products</h4>
            <p className="text-[10px] text-slate-500">100% Factory Certified</p>
          </div>
          <div className="space-y-1.5 p-2 border-l border-slate-200/60">
            <div className="w-10 h-10 rounded-2xl bg-[#0F9D8A]/10 text-[#0F9D8A] mx-auto flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#1F2937]">Verified Vendors</h4>
            <p className="text-[10px] text-slate-500">GST &amp; ISO Compliant</p>
          </div>
          <div className="space-y-1.5 p-2 border-l border-slate-200/60">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#1F2937]">PAN India Delivery</h4>
            <p className="text-[10px] text-slate-500">19,000+ Pincodes</p>
          </div>
          <div className="space-y-1.5 p-2 border-l border-slate-200/60">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 mx-auto flex items-center justify-center font-bold">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#1F2937]">Secure Payments</h4>
            <p className="text-[10px] text-slate-500">Escrow Protected</p>
          </div>
          <div className="space-y-1.5 p-2 border-l border-slate-200/60">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#1F2937]">Installation Support</h4>
            <p className="text-[10px] text-slate-500">Biomedical Engineers</p>
          </div>
          <div className="space-y-1.5 p-2 border-l border-slate-200/60">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 mx-auto flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#1F2937]">Service Warranty</h4>
            <p className="text-[10px] text-slate-500">Pan-India Support</p>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY: 10 Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-black text-[#1F2937]">Shop by Category</h2>
            <p className="text-xs text-slate-500 mt-1">Explore medical equipment by specialised healthcare departments</p>
          </div>
          <button 
            onClick={() => onCategorySelect('')}
            className="text-xs font-bold text-[#0F9D8A] hover:underline"
          >
            View All Categories
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {featuredCategoryCards.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onCategorySelect(cat.name)}
              className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:shadow-xl hover:border-[#0F9D8A] transition duration-300 group cursor-pointer flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F5F7FA] p-2 mb-3 relative group-hover:scale-105 transition-transform">
                <img src={cat.image} alt={cat.displayName} className="w-full h-full object-cover rounded-xl" />
                <span className="absolute bottom-1 right-1 text-sm bg-white/80 p-1 rounded-full shadow-sm">
                  {cat.icon}
                </span>
              </div>
              <h4 className="text-xs font-bold text-[#1F2937] group-hover:text-[#0F9D8A] transition leading-tight">
                {cat.displayName}
              </h4>
              <p className="text-[10px] text-slate-400 font-medium mt-1">{cat.count}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 4. FEATURED BRANDS MARQUEE */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Top Medical Equipment Brands</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {brandLogos.map((brd) => (
            <div 
              key={brd.name}
              className="bg-[#F5F7FA] hover:bg-white border border-slate-200 hover:border-[#0077B6] rounded-2xl p-3 px-5 shrink-0 flex items-center gap-3 transition cursor-pointer shadow-sm min-w-[200px]"
            >
              <img src={brd.logo} alt={brd.name} className="w-8 h-8 rounded-lg object-cover" />
              <div>
                <h4 className="text-xs font-bold text-[#1F2937]">{brd.name}</h4>
                <p className="text-[9px] text-slate-500 font-medium truncate max-w-[120px]">{brd.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. DEAL OF THE DAY / FLASH SALE BANNER */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-gradient-to-r from-[#0077B6] via-[#0F9D8A] to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl z-10">
            <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              ⚡ DEAL OF THE DAY • LIMITED STOCK
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Hospital Grade ICU Monitor &amp; ECG Flash Sale
            </h2>
            <p className="text-xs sm:text-sm text-slate-200">
              Get 40% OFF on 12-Lead ECG Machines &amp; 12.1" Patient Monitors with Direct Factory Warranty.
            </p>

            {/* Countdown Timer */}
            <div className="flex items-center gap-3 text-center pt-2">
              <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl font-mono border border-white/20">
                <span className="text-lg font-bold block">{String(countdown.hours).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase font-sans text-slate-200">Hours</span>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl font-mono border border-white/20">
                <span className="text-lg font-bold block">{String(countdown.mins).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase font-sans text-slate-200">Mins</span>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl font-mono border border-white/20">
                <span className="text-lg font-bold block">{String(countdown.secs).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase font-sans text-slate-200">Secs</span>
              </div>
            </div>

            {/* Stock Progress Bar */}
            <div className="space-y-1.5 pt-2 max-w-xs">
              <div className="flex justify-between text-[10px] font-bold">
                <span>Claimed: 78%</span>
                <span>12 Units Left</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full w-[78%] rounded-full" />
              </div>
            </div>
          </div>

          <div className="z-10 shrink-0 text-center">
            <button
              onClick={() => {
                const el = document.getElementById('catalog-anchor');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-[#1F2937] hover:bg-slate-100 font-extrabold text-sm px-8 py-4 rounded-2xl transition shadow-2xl transform hover:scale-105"
            >
              Claim Flash Offer Now
            </button>
          </div>
        </div>
      </section>

      {/* 6. CURATED CATEGORY PRODUCT SLIDERS */}
      <div id="catalog-anchor" className="space-y-10">
        
        {/* Continue Browsing / Featured Catalog */}
        <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-lg font-black text-[#1F2937]">Featured Medical Equipment</h3>
              <p className="text-xs text-slate-500">Handpicked high-demand hospital and diagnostic machinery</p>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {products.slice(0, 8).map(renderProductCard)}
          </div>
        </section>

        {/* Diagnostic Equipment Slider */}
        <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-4">
          <div className="flex justify-between items-end border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-lg font-black text-[#1F2937]">Diagnostic Equipment</h3>
              <p className="text-xs text-slate-500">ECG, Patient Monitors, Ultrasound &amp; Vital Signs Analyzers</p>
            </div>
            <button onClick={() => onCategorySelect('Diagnostic Equipment')} className="text-xs font-bold text-[#0077B6] hover:underline">
              View All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {products.filter(p => p.category.includes('Diagnostic') || p.category.includes('Homecare') || p.category.includes('Medical')).slice(0, 8).map(renderProductCard)}
          </div>
        </section>

        {/* Patient Monitoring Slider */}
        <section className="max-w-7xl mx-auto px-4 lg:px-6 space-y-4">
          <div className="flex justify-between items-end border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-lg font-black text-[#1F2937]">Patient Monitoring Systems</h3>
              <p className="text-xs text-slate-500">ICU Multipara Monitors, Capnography, Pulse Oximeters</p>
            </div>
            <button onClick={() => onCategorySelect('Patient Monitoring')} className="text-xs font-bold text-[#0077B6] hover:underline">
              View All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {products.slice(2, 10).map(renderProductCard)}
          </div>
        </section>

      </div>

      {/* 7. REFURBISHED MEDICAL EQUIPMENT */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-[#F5F7FA] rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#0077B6] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  Certified Refurbished
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  1-Year Pan-India Service Warranty
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1F2937] mt-1">Refurbished Imaging &amp; ICU Equipment</h2>
            </div>
            <button onClick={() => onCategorySelect('Refurbished Equipment')} className="text-xs font-bold text-[#0F9D8A] hover:underline">
              Explore Refurbished Catalog
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["1.5T MRI Machine", "64-Slice CT Scanner", "3D Color Doppler Ultrasound", "Digital X-Ray System"].map((title, i) => (
              <div key={title} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2 text-center shadow-sm hover:shadow-md transition">
                <div className="h-28 rounded-xl bg-slate-100 flex items-center justify-center p-2">
                  <Activity className="w-8 h-8 text-[#0077B6]" />
                </div>
                <h4 className="text-xs font-bold text-[#1F2937]">{title}</h4>
                <p className="text-[10px] text-slate-500">Fully Calibrated &amp; Tested</p>
                <p className="text-xs font-black text-[#0F9D8A] font-mono">Up to 50% OFF</p>
                <button 
                  onClick={() => onNavigate('rfqs')}
                  className="w-full bg-[#0077B6] hover:bg-[#005f92] text-white font-bold text-[11px] py-1.5 rounded-xl transition mt-1"
                >
                  Request Quote
                </button>
              </div>
            ))}
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
              <button onClick={() => addToast("App download link sent to phone", "info")} className="bg-[#1F2937] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition">
                📱 Google Play
              </button>
              <button onClick={() => addToast("App download link sent to phone", "info")} className="bg-[#1F2937] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition">
                🍎 App Store
              </button>
            </div>
          </div>
          <div className="w-32 h-32 bg-white p-3 rounded-2xl border border-slate-200 shadow-md text-center flex flex-col items-center justify-center">
            <Smartphone className="w-10 h-10 text-[#0F9D8A] mb-1" />
            <span className="text-[10px] font-bold text-[#1F2937]">Scan QR to App</span>
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

    </div>
  );
}
