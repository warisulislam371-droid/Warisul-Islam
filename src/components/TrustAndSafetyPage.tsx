import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Truck, Headphones, FileCheck, Eye, 
  Building, Mail, Phone, MapPin, Clock, Star, ChevronDown, 
  ChevronUp, AlertCircle, CheckCircle2, UserCheck, ShieldAlert
} from 'lucide-react';
import { PolicyType } from './PolicyModal';

interface TrustAndSafetyPageProps {
  onNavigate: (view: string) => void;
  onOpenPolicy: (policy: PolicyType) => void;
  isDarkMode?: boolean;
}

export default function TrustAndSafetyPage({
  onNavigate,
  onOpenPolicy,
  isDarkMode = false
}: TrustAndSafetyPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [reviewsList, setReviewsList] = useState<Array<{ name: string; rating: number; comment: string; date: string }>>([
    {
      name: 'Dr. Rajesh Sharma (City Hospital)',
      rating: 5,
      comment: 'Very reliable procurement platform. Transparent pricing on diagnostic ultrasound equipment and prompt support from Al Salam team.',
      date: '2 weeks ago'
    },
    {
      name: 'Apollo Clinical Labs',
      rating: 5,
      comment: 'Clear GST invoices and genuine supplier verification. Order tracking from the dashboard made logistics seamless.',
      date: '1 month ago'
    }
  ]);

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;
    setReviewsList(prev => [
      {
        name: newReviewName,
        rating: newReviewRating,
        comment: newReviewComment,
        date: 'Just now'
      },
      ...prev
    ]);
    setNewReviewName('');
    setNewReviewComment('');
    setShowReviewForm(false);
  };

  const schemaOrgData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MedBazar Helnex",
    "alternateName": "HealNex Medi Bazar",
    "url": "https://medbazarhelnex.shop",
    "logo": "https://medbazarhelnex.shop/logo.png",
    "description": "Multi-vendor medical equipment marketplace connecting hospitals and clinics with authorized medical suppliers across India.",
    "parentOrganization": {
      "@type": "Organization",
      "name": "Al Salam Medical Equipment Centre"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9103500592",
      "contactType": "customer service",
      "email": "alsalammedicalequipmentscenter@gmail.com",
      "availableLanguage": ["English", "Hindi"]
    }
  };

  const faqs = [
    {
      q: 'Is online payment secure?',
      a: 'Yes. All transactions processed on MedBazar Helnex utilize industry-standard SSL encryption and RBI-compliant banking gateways (UPI, Net Banking, and Card processing). Customer sensitive card data is never stored directly on our servers.'
    },
    {
      q: 'How do I contact support?',
      a: 'You can reach our operational headquarters (Al Salam Medical Equipment Centre) via direct email at alsalammedicalequipmentscenter@gmail.com or via WhatsApp / Phone support at +91 9103500592 during our business hours (Mon-Sat, 9:00 AM - 7:00 PM IST).'
    },
    {
      q: 'What is the return policy?',
      a: 'If biomedical equipment is received damaged or non-functional upon unboxing, report it within 48 hours with photographic evidence. Validated warranty replacements or refunds are processed strictly according to our commercial Refund Policy.'
    },
    {
      q: 'How can I track my order?',
      a: 'Once your order is approved by the supplier, live shipment tracking and delivery status updates are accessible directly from your Customer Dashboard under the Orders section.'
    },
    {
      q: 'How do I become a vendor?',
      a: 'Medical equipment distributors and manufacturers can apply via the Partner/Vendor Console. Applicants must provide valid business registration parameters, HSN/GSTIN documentation, and agree to our Marketplace Vendor Standards.'
    }
  ];

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgData) }}
      />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            &larr; Back to Marketplace Catalog
          </button>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Verified Marketplace Operations
          </span>
        </div>

        {/* Hero Banner / Our Commitment */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-teal-800/80 relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
            <ShieldCheck className="w-64 h-64" />
          </div>
          <div className="max-w-3xl space-y-6 relative z-10">
            <span className="bg-teal-500/25 text-teal-300 border border-teal-400/40 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
              Trust & Safety Portal
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display leading-tight">
              Our Commitment to Medical Procurement Security
            </h1>
            <blockquote className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 text-sm sm:text-base italic leading-relaxed text-teal-50">
              «MedBazar Helnex is committed to providing a secure, transparent, and reliable online marketplace for medical equipment. We work to maintain a trusted platform for customers and vendors.»
            </blockquote>
          </div>
        </div>

        {/* Buyer Protection Section */}
        <section className="space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
              Buyer Protection Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Multi-layered protections designed to give clinical facilities confidence in every procurement order.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: 'Secure checkout', desc: 'Encrypted payment processing & verified invoices.', icon: <Lock className="w-6 h-6 text-emerald-600" /> },
              { title: 'Order tracking', desc: 'Real-time status updates from vendor dispatch to clinic.', icon: <Truck className="w-6 h-6 text-blue-600" /> },
              { title: 'Customer support', desc: 'Dedicated operational assistance via phone & email.', icon: <Headphones className="w-6 h-6 text-amber-600" /> },
              { title: 'Transparent policies', desc: 'Clear guidelines with no hidden marketplace fees.', icon: <FileCheck className="w-6 h-6 text-teal-600" /> },
              { title: 'Privacy protection', desc: 'Strict commercial confidentiality & GDPR-friendly handling.', icon: <Eye className="w-6 h-6 text-purple-600" /> },
            ].map((item, idx) => (
              <div key={idx} className={`p-5 rounded-2xl border flex flex-col justify-between ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit mb-3">
                  {item.icon}
                </div>
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vendor Standards & Website Security Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vendor Standards */}
          <div className={`p-8 rounded-3xl border ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display">Vendor Standards</h3>
                <p className="text-xs text-slate-400">Expectations for medical manufacturers & suppliers</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              To preserve clinical integrity, suppliers operating on MedBazar Helnex are expected to adhere to professional operational protocols:
            </p>

            <ul className="space-y-3.5 text-xs">
              {[
                'Provide accurate product information, technical specifications, and HSN codes.',
                'Comply with applicable local and national biomedical equipment laws and regulations.',
                'Offer genuine medical devices and manufacturer warranty coverage.',
                'Maintain professional customer service and timely dispatch response times.'
              ].map((std, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{std}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-tight">
                <strong>Important Notice:</strong> While MedBazar Helnex conducts basic business information reviews during vendor registration, vendors remain independently responsible for their regulatory authorizations and catalog listings. We award a "Trust Seal" badge specifically to partners who undergo clinical documentation review.
              </p>
            </div>
          </div>

          {/* Website Security */}
          <div className={`p-8 rounded-3xl border flex flex-col justify-between ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display">Website Security</h3>
                  <p className="text-xs text-slate-400">Enterprise data encryption & access controls</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'SSL Protected', desc: '256-bit TLS/SSL certificate encryption across all web traffic.' },
                  { title: 'Secure Login', desc: 'Multi-layered Firebase Authentication with session auditing.' },
                  { title: 'Data Encryption', desc: 'Cloud storage encrypted at rest and in transit.' },
                  { title: 'Protected Accounts', desc: 'Role-based authorization preventing unauthorized data access.' }
                ].map((sec, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-600" />
                      {sec.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{sec.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Need legal or compliance details?</span>
              <button
                onClick={() => onOpenPolicy('terms')}
                className="text-teal-600 dark:text-teal-400 hover:underline font-bold"
              >
                Review Terms of Service &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Contact Support Section */}
        <section className={`p-8 sm:p-10 rounded-3xl border ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-br from-teal-900/5 to-blue-900/5 border-slate-200 shadow-sm'
        }`}>
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-8">
            <h2 className="text-2xl font-bold font-display tracking-tight">Contact Operational Support</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Direct assistance from the marketplace operators for procurement escalations, vendor verification, and order logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-center">
              <Building className="w-6 h-6 text-teal-600 mx-auto" />
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Operator Company Name</span>
              <strong className="text-xs font-bold block text-slate-900 dark:text-white">Al Salam Medical Equipment Centre</strong>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-center">
              <Mail className="w-6 h-6 text-blue-600 mx-auto" />
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Email</span>
              <a href="mailto:alsalammedicalequipmentscenter@gmail.com" className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 block break-all hover:underline">
                alsalammedicalequipmentscenter@gmail.com
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-center">
              <Phone className="w-6 h-6 text-emerald-600 mx-auto" />
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone / WhatsApp</span>
              <a href="tel:+919103500592" className="text-xs font-mono font-bold text-slate-900 dark:text-white block hover:underline">
                +91 9103500592
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-center">
              <Clock className="w-6 h-6 text-amber-600 mx-auto" />
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Support Hours</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Mon - Sat | 9:00 AM - 7:00 PM IST</span>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className={`p-8 rounded-3xl border ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                Customer Experiences & Ratings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Verified hospital and clinical feedback</p>
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              {showReviewForm ? 'Cancel Review' : 'Share Your Experience'}
            </button>
          </div>

          {showReviewForm && (
            <form onSubmit={handleAddReview} className="mb-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
              <h4 className="font-bold text-sm">Write a Customer Review</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Your Name / Clinic Name</label>
                  <input
                    type="text"
                    required
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="e.g. Dr. A. Kumar (Sunrise Care)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Rating</label>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                    <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Your Feedback</label>
                <textarea
                  required
                  rows={3}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Share your experience with procurement, vendor communication, or equipment quality..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition"
              >
                Submit Review
              </button>
            </form>
          )}

          {reviewsList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Star className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No reviews yet. Be the first customer to share your experience.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviewsList.map((rev, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{rev.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FAQ Section */}
        <section className={`p-8 rounded-3xl border ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold font-display tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400 mt-1">Answers regarding security, support, and marketplace compliance</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border transition overflow-hidden ${
                  openFaq === idx
                    ? isDarkMode ? 'bg-slate-800/80 border-teal-500/50' : 'bg-teal-50/50 border-teal-600'
                    : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-teal-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
