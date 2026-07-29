import React, { useState, useEffect } from 'react';
import { MARKETPLACE_LOGO } from '../assets/logo';
import { 
  Activity, 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle, 
  ShieldCheck, 
  ExternalLink, 
  ChevronRight, 
  Store, 
  FileText, 
  Globe, 
  Award,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter
} from 'lucide-react';
import { PolicyType } from './PolicyModal';
import { dbLocal } from '../db';
import { SocialMediaLinks } from '../types';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenPolicy: (policy: PolicyType) => void;
  onCategorySelect: (categoryName: string) => void;
  isDarkMode?: boolean;
}

export default function Footer({
  onNavigate,
  onOpenPolicy,
  onCategorySelect,
  isDarkMode = false
}: FooterProps) {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLinks>(() => dbLocal.getSocialLinks());

  useEffect(() => {
    const handleStorageChange = () => {
      setSocialLinks(dbLocal.getSocialLinks());
    };
    window.addEventListener('storage', handleStorageChange);
    // Poll briefly to catch same-window updates
    const interval = setInterval(() => {
      setSocialLinks(dbLocal.getSocialLinks());
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  return (
    <footer className={`border-t font-sans transition-colors shrink-0 ${
      isDarkMode 
        ? 'bg-slate-950 text-slate-300 border-slate-800' 
        : 'bg-slate-900 text-slate-200 border-slate-800'
    }`}>
      {/* Top Value Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">GST Verified Suppliers</p>
              <p className="text-[10px] text-slate-400">100% Genuine Medical Equipment</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Quality Checked</p>
              <p className="text-[10px] text-slate-400">ISO & CE Certified Standards</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Pan-India &amp; Export</p>
              <p className="text-[10px] text-slate-400">Fast Dispatch to 19,000+ Pincodes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">24/7 Medical Support</p>
              <p className="text-[10px] text-slate-400">Direct WhatsApp Assistance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand & About Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={MARKETPLACE_LOGO}
                alt="HealNex Medi Bazar Logo"
                referrerPolicy="no-referrer"
                className="w-11 h-11 object-contain rounded-xl shadow-md bg-white p-0.5 shrink-0"
              />
              <div>
                <span className="font-display font-black text-lg tracking-tight text-white block leading-tight">
                  Heal<span className="text-teal-400">Nex</span>
                </span>
                <span className="text-[9px] text-slate-400 font-medium tracking-widest uppercase block -mt-1 font-display">
                  Medi Bazar • medbazarhelnex.shop
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              India's premier B2B medical equipment and healthcare supply marketplace connecting hospitals, clinics, laboratories, doctors, distributors, manufacturers, and suppliers across India.
            </p>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-teal-400">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Operated by Al Salam Medical Equipment Centre</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-6">
                Registered Medical Equipment Supplier &amp; Importer
              </p>
            </div>

            {/* Social Media Links */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Connect With Us</p>
              <div className="flex items-center gap-2">
                {socialLinks.instagram && (
                  <a 
                    href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://${socialLinks.instagram}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition" 
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.facebook && (
                  <a 
                    href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://${socialLinks.facebook}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition" 
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a 
                    href={socialLinks.linkedin.startsWith('http') ? socialLinks.linkedin : `https://${socialLinks.linkedin}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 bg-slate-800 hover:bg-blue-700 text-slate-300 hover:text-white rounded-lg transition" 
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a 
                    href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://${socialLinks.youtube}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white rounded-lg transition" 
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a 
                    href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://${socialLinks.twitter}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 bg-slate-800 hover:bg-sky-500 text-slate-300 hover:text-white rounded-lg transition" 
                    title="Twitter / X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Column 1: ABOUT HEALNEX */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-display border-b border-slate-800 pb-2">
              ABOUT HEALNEX
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onOpenPolicy('about')} className="hover:text-teal-400 transition flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Our Story</span>
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('contact')} className="hover:text-teal-400 transition flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Contact Us</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('register_vendor')} className="hover:text-teal-400 transition flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vendor Registration</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blogs')} className="hover:text-teal-400 transition flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Medical Blogs &amp; News</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('trust-safety')} className="hover:text-teal-400 transition flex items-center gap-1.5 text-amber-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trust &amp; Safety</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('reviews')} className="hover:text-teal-400 transition flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Customer Testimonials</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: SHOP BY CATEGORY */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-display border-b border-slate-800 pb-2">
              SHOP CATEGORIES
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {[
                'Medical Equipment',
                'Diagnostics',
                'Consumables',
                'Dental',
                'Cardiology',
                'Orthopedics',
                'Physiotherapy',
                'Refurbished Equipment'
              ].map((cat) => (
                <li key={cat}>
                  <button 
                    onClick={() => {
                      onCategorySelect(cat);
                      onNavigate('marketplace');
                    }} 
                    className="hover:text-teal-400 transition flex items-center gap-1.5 text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>{cat}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: DIGITAL SERVICES & CONTACT */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-display border-b border-slate-800 pb-2">
              DIGITAL SERVICES &amp; CONTACT
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('vendor')} className="hover:text-teal-400 transition flex items-center gap-1.5 text-teal-400">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>HealNex Vendor Portal</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('rfqs')} className="hover:text-teal-400 transition flex items-center gap-1.5 font-bold text-blue-400">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Hospital Procurement &amp; RFQ</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('rfqs')} className="hover:text-teal-400 transition flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Bulk Ordering</span>
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('contact')} className="hover:text-teal-400 transition flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Export Services</span>
                </button>
              </li>
            </ul>

            {/* Direct Contact Info */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <a 
                href="https://wa.me/919103500592" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold transition"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
                <span>WhatsApp: +91 9103500592</span>
              </a>
              <a 
                href="mailto:support@medbazarhelnex.shop" 
                className="flex items-center gap-2 text-slate-300 hover:text-teal-400 transition"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <span>support@medbazarhelnex.shop</span>
              </a>
            </div>
          </div>

        </div>

        {/* Payment Methods & Accreditations Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold mr-2 text-[11px] uppercase tracking-wider">Accepted Payment Methods:</span>
            {['Visa', 'Mastercard', 'UPI / QR', 'Net Banking', 'Razorpay', 'Cashfree', 'NEFT / RTGS'].map((pay) => (
              <span key={pay} className="px-3 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold">
                {pay}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400 font-medium text-xs">
            <button onClick={() => onOpenPolicy('privacy')} className="hover:text-teal-400 transition">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => onOpenPolicy('terms')} className="hover:text-teal-400 transition">Terms &amp; Conditions</button>
            <span>•</span>
            <button onClick={() => onOpenPolicy('refund')} className="hover:text-teal-400 transition">Refund &amp; Return Policy</button>
            <span>•</span>
            <button onClick={() => onOpenPolicy('shipping')} className="hover:text-teal-400 transition">Shipping &amp; Logistics</button>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-6 pt-4 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2026 HealNex Medi Bazar (medbazarhelnex.shop). All rights reserved.</p>
          <p>India's Most Trusted B2B Medical Equipment Marketplace | Powered by Al Salam Medical Equipment Centre</p>
        </div>
      </div>
    </footer>
  );
}
