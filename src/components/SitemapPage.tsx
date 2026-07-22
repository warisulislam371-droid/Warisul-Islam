import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  Network,
  FileCode,
  ExternalLink,
  ShieldCheck,
  Layers,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Globe,
  Download,
  FileText,
  BookOpen,
  MessageSquare,
  ShoppingCart,
  FilePlus,
  ClipboardList,
  Store,
  UserCheck,
  Star,
  Activity,
  ChevronRight,
  Tag,
  Copy,
  Check
} from 'lucide-react';
import { dbLocal } from '../db';

interface SitemapPageProps {
  onNavigate: (view: string) => void;
  onSelectCategory?: (categoryName: string) => void;
  onOpenPolicy?: (policy: string) => void;
  isDarkMode?: boolean;
}

export default function SitemapPage({
  onNavigate,
  onSelectCategory,
  onOpenPolicy,
  isDarkMode = false,
}: SitemapPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'portals' | 'categories' | 'brands' | 'policies' | 'seo'>('all');
  const [copiedXml, setCopiedXml] = useState(false);
  const [showXmlModal, setShowXmlModal] = useState(false);

  const categories = useMemo(() => dbLocal.getCategories() || [], []);
  const brands = useMemo(() => dbLocal.getBrands() || [], []);
  const products = useMemo(() => dbLocal.getProducts() || [], []);
  const vendors = useMemo(() => dbLocal.getVendors() || [], []);

  // Main Portals & Views
  const portals = [
    {
      id: 'marketplace',
      name: 'B2B Marketplace Catalog',
      desc: 'Browse certified clinical medical equipment, ICU monitors, surgical tools & consumables.',
      icon: Store,
      badge: 'Main Catalog',
      color: 'from-teal-500 to-emerald-600',
    },
    {
      id: 'rfqs',
      name: 'B2B Tenders & RFQs Engine',
      desc: 'Submit hospital bulk procurement tenders and receive competitive multi-vendor bids.',
      icon: FilePlus,
      badge: 'Procurement Tenders',
      color: 'from-sky-500 to-blue-600',
    },
    {
      id: 'orders',
      name: 'Order Clearing & Escrow Settlements',
      desc: 'Track live B2B consignments, invoice generation, and milestone payments.',
      icon: ClipboardList,
      badge: 'Settlements',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'vendor',
      name: 'Verified Vendor Portal',
      desc: 'Supplier dashboard for catalog inventory management and order dispatching.',
      icon: Building,
      badge: 'Supplier Hub',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'admin',
      name: 'Super Admin Oversight Panel',
      desc: 'Platform governance, vendor verification audits, and catalog moderation.',
      icon: UserCheck,
      badge: 'Platform Control',
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'reviews',
      name: 'Verified Customer Reviews & Ratings',
      desc: 'Authentic hospital and clinic equipment performance audits and ratings.',
      icon: Star,
      badge: 'Audit Ratings',
      color: 'from-amber-400 to-yellow-500',
    },
    {
      id: 'blogs',
      name: 'B2B Clinical Knowledge Blog',
      desc: 'Industry articles, CDSCO regulatory guidelines, and equipment maintenance guides.',
      icon: BookOpen,
      badge: 'Knowledge Base',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'tickets',
      name: 'Helpdesk & Procurement Support',
      desc: 'Direct customer support chat with B2B medical procurement specialists.',
      icon: MessageSquare,
      badge: '24/7 Support',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'trust-safety',
      name: 'Trust, Compliance & Safety Center',
      desc: 'Verification standards, escrow payment protection, and vendor vetting policy.',
      icon: ShieldCheck,
      badge: 'Compliance',
      color: 'from-teal-600 to-cyan-700',
    },
  ];

  // Policies
  const policies = [
    { id: 'about', name: 'About MedBazar Helnex', desc: 'Our mission in revolutionizing B2B medical equipment procurement.' },
    { id: 'contact', name: 'Contact & Institutional Support', desc: 'Al Salam Medical Centre helpline and corporate office coordinates.' },
    { id: 'privacy', name: 'Privacy Policy', desc: 'Data privacy standards, HIPAA & B2B confidentiality protocols.' },
    { id: 'terms', name: 'Terms & Conditions', desc: 'B2B marketplace buyer-seller agreements and order terms.' },
    { id: 'refund', name: 'Refund & Cancellation Policy', desc: 'Escrow return terms and defective equipment replacement policy.' },
    { id: 'shipping', name: 'Shipping & Cold-Chain Logistics', desc: 'Biomedical transport guidelines, delivery SLAs, and tracking.' },
  ];

  // Search filtering
  const filteredPortals = portals.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subcategories?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPolicies = policies.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyXmlUrl = () => {
    const sitemapUrl = `${window.location.origin}/sitemap.xml`;
    navigator.clipboard.writeText(sitemapUrl);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2500);
  };

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Hero Section */}
        <div className={`p-8 sm:p-10 rounded-3xl border relative overflow-hidden shadow-xl ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 border border-teal-500/20">
              <Network className="w-4 h-4 text-teal-500" />
              <span>MedBazar B2B Architectural Index</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
              Platform Sitemap & System Index
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Explore the structured architecture of MedBazar Helnex. Access all core procurement portals, clinical categories, manufacturer brand indexes, compliance policies, and automated SEO XML feeds.
            </p>

            {/* Quick Metrics & Search Bar */}
            <div className="pt-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter sitemap links, categories, brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-2xl border outline-none transition focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow-sm text-xs cursor-pointer"
                >
                  <FileCode className="w-4 h-4" />
                  <span>View Raw XML Sitemap</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                <button
                  onClick={handleCopyXmlUrl}
                  className={`py-2.5 px-3.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs border cursor-pointer ${
                    copiedXml
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {copiedXml ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedXml ? 'XML Link Copied!' : 'Copy XML URL'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80 scrollbar-none">
          {[
            { id: 'all', label: 'Complete Index' },
            { id: 'portals', label: `Core Portals (${portals.length})` },
            { id: 'categories', label: `Equipment Categories (${categories.length})` },
            { id: 'brands', label: `Partner Brands (${brands.length})` },
            { id: 'policies', label: `Legal Policies (${policies.length})` },
            { id: 'seo', label: 'SEO & Search Crawlers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-teal-700 text-white shadow-md'
                  : isDarkMode
                    ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION 1: CORE PORTALS & CONSOLES */}
        {(activeTab === 'all' || activeTab === 'portals') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 text-teal-800 font-display">
                <Compass className="w-5 h-5 text-teal-600" />
                <span>Primary B2B Platform Portals & Services</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">{filteredPortals.length} Portals Available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPortals.map((portal) => {
                const IconComponent = portal.icon;
                return (
                  <div
                    key={portal.id}
                    onClick={() => onNavigate(portal.id)}
                    className={`p-5 rounded-2xl border transition duration-300 hover:shadow-lg group cursor-pointer flex flex-col justify-between space-y-4 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-800 hover:border-teal-500/50' 
                        : 'bg-white border-slate-200/80 hover:border-teal-400'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl text-white bg-gradient-to-r ${portal.color} shadow-sm`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                          {portal.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-600 transition flex items-center justify-between">
                        <span>{portal.name}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition transform" />
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {portal.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-teal-700">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: MEDICAL EQUIPMENT CATEGORIES */}
        {(activeTab === 'all' || activeTab === 'categories') && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 text-teal-800 font-display">
                <Layers className="w-5 h-5 text-teal-600" />
                <span>Clinical Medical Equipment Categories</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">{filteredCategories.length} Categories</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id || cat.name}
                  className={`p-5 rounded-2xl border transition duration-300 space-y-3 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory(cat.name);
                        else onNavigate('marketplace');
                      }}
                      className="font-bold text-sm text-slate-900 hover:text-teal-600 cursor-pointer flex items-center gap-1.5"
                    >
                      <Activity className="w-4 h-4 text-teal-600" />
                      <span>{cat.name}</span>
                    </h3>
                    <button
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory(cat.name);
                        else onNavigate('marketplace');
                      }}
                      className="text-[10px] font-bold text-teal-600 hover:underline uppercase"
                    >
                      View All →
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {cat.description || 'Certified medical devices and equipment.'}
                  </p>

                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {cat.subcategories.map((sub, i) => (
                        <span
                          key={i}
                          onClick={() => {
                            if (onSelectCategory) onSelectCategory(cat.name);
                            else onNavigate('marketplace');
                          }}
                          className="text-[10px] bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-800 px-2 py-0.5 rounded-md font-medium cursor-pointer transition"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: BRANDS INDEX */}
        {(activeTab === 'all' || activeTab === 'brands') && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 text-teal-800 font-display">
                <Building className="w-5 h-5 text-teal-600" />
                <span>Certified OEM & Medical Manufacturer Brands</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">{filteredBrands.length} Brands</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredBrands.map((brand) => (
                <div
                  key={brand.id || brand.name}
                  onClick={() => onNavigate('marketplace')}
                  className={`p-3.5 rounded-2xl border text-center transition duration-200 hover:shadow-md hover:border-teal-400 cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <Tag className="w-4 h-4 text-teal-500 mb-1" />
                  <span className="text-xs font-extrabold text-slate-900 truncate w-full">{brand.name}</span>
                  <span className="text-[9px] text-slate-400 font-medium uppercase">Verified OEM</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: LEGAL POLICIES & GOVERNANCE */}
        {(activeTab === 'all' || activeTab === 'policies') && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 text-teal-800 font-display">
                <FileText className="w-5 h-5 text-teal-600" />
                <span>Legal Policies & Institutional Compliance</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">{filteredPolicies.length} Documents</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPolicies.map((pol) => (
                <div
                  key={pol.id}
                  onClick={() => {
                    if (pol.id === 'trust') onNavigate('trust-safety');
                    else if (onOpenPolicy) onOpenPolicy(pol.id);
                  }}
                  className={`p-4 rounded-2xl border transition duration-200 hover:border-teal-500 cursor-pointer space-y-2 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-900 hover:text-teal-600 transition">
                      {pol.name}
                    </h3>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {pol.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: SEO & SEARCH ENGINE INDEXING */}
        {(activeTab === 'all' || activeTab === 'seo') && (
          <div className={`p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Globe className="w-4 h-4 text-teal-600" />
                  <span>Search Engine Crawling & XML Indexing</span>
                </h3>
                <p className="text-xs text-slate-500">Automated daily XML sitemap feed for Googlebot, Bingbot, and healthcare web directories.</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 text-white text-xs font-bold py-2 px-3.5 rounded-xl hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5 text-teal-400" />
                  <span>/sitemap.xml</span>
                </a>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl hover:bg-slate-200 transition flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>/robots.txt</span>
                </a>
              </div>
            </div>

            <div className="bg-slate-950 text-slate-300 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto space-y-1 border border-slate-800">
              <p className="text-slate-500">// Live XML Sitemap Structure Example</p>
              <p><span className="text-teal-400">&lt;urlset</span> <span className="text-sky-400">xmlns</span>=<span className="text-emerald-300">"http://www.sitemaps.org/schemas/sitemap/0.9"</span>&gt;</p>
              <p className="pl-4">&lt;url&gt;</p>
              <p className="pl-8">&lt;loc&gt;https://medbazarhelnex.shop/&lt;/loc&gt;</p>
              <p className="pl-8">&lt;changefreq&gt;daily&lt;/changefreq&gt;</p>
              <p className="pl-8">&lt;priority&gt;1.0&lt;/priority&gt;</p>
              <p className="pl-4">&lt;/url&gt;</p>
              <p className="pl-4 text-slate-500">... ({products.length} dynamic product URLs + {categories.length} categories) ...</p>
              <p><span className="text-teal-400">&lt;/urlset&gt;</span></p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
