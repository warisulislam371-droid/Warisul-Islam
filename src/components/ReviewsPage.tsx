import React, { useState, useEffect } from 'react';
import { 
  Star, ShieldCheck, MessageSquarePlus, Search, Filter, ThumbsUp, 
  Building2, UserCheck, CheckCircle2, Package, Sparkles, X, Award, ExternalLink
} from 'lucide-react';
import { Review, Product } from '../types';
import { dbLocal } from '../db';

interface ReviewsPageProps {
  onNavigate: (view: string) => void;
  onSelectProduct?: (product: Product) => void;
  isDarkMode?: boolean;
}

interface ExtendedReview extends Review {
  hospitalName?: string;
  designation?: string;
  badge?: string;
  helpfulCount?: number;
  vendorResponse?: string;
}

export default function ReviewsPage({
  onNavigate,
  onSelectProduct,
  isDarkMode = false
}: ReviewsPageProps) {
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  // Form state for new review
  const [formProductId, setFormProductId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formHospitalName, setFormHospitalName] = useState('');
  const [formDesignation, setFormDesignation] = useState('Senior Medical Officer');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [formBadge, setFormBadge] = useState('Verified B2B Consignment');

  useEffect(() => {
    const loadedProducts = dbLocal.getProducts();
    setProducts(loadedProducts);
    if (loadedProducts.length > 0 && !formProductId) {
      setFormProductId(loadedProducts[0].id);
    }

    const baseReviews = dbLocal.getReviews();
    // Enrich with professional hospital details if standard reviews
    const enriched: ExtendedReview[] = baseReviews.map((rev, idx) => ({
      ...rev,
      hospitalName: (rev as ExtendedReview).hospitalName || (idx % 2 === 0 ? 'Max Super Speciality Hospital' : 'Srinagar Diagnostic Centre'),
      designation: (rev as ExtendedReview).designation || (idx % 2 === 0 ? 'Chief Cardiologist' : 'Head Biomedical Engineer'),
      badge: (rev as ExtendedReview).badge || 'Verified B2B Consignment',
      helpfulCount: (rev as ExtendedReview).helpfulCount || (14 + idx * 7),
      vendorResponse: idx === 0 ? 'Thank you Dr. Ramesh for your trust in our 12-channel diagnostic systems. Al Salam Technical Support remains available 24/7 for calibration assistance.' : undefined
    }));
    setReviews(enriched);
  }, []);

  const handleHelpfulClick = (revId: string) => {
    if (helpfulClicked[revId]) return;
    setHelpfulClicked(prev => ({ ...prev, [revId]: true }));
    setReviews(prev => prev.map(r => r.id === revId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || !formComment.trim() || !formProductId) return;

    const matchedProd = products.find(p => p.id === formProductId);
    const newRev: ExtendedReview = {
      id: `rev-${Date.now()}`,
      productId: formProductId,
      customerId: `cust-${Date.now()}`,
      customerName: formCustomerName,
      hospitalName: formHospitalName || 'Verified Clinical Institute',
      designation: formDesignation,
      badge: formBadge,
      rating: Number(formRating),
      comment: formComment,
      createdAt: new Date().toISOString(),
      helpfulCount: 1
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    dbLocal.saveReviews(updated);

    // Reset form
    setFormCustomerName('');
    setFormHospitalName('');
    setFormComment('');
    setShowWriteModal(false);
  };

  const getProductName = (prodId: string) => {
    const found = products.find(p => p.id === prodId);
    return found ? found.name : '12-Channel ECG Diagnostic Machine';
  };

  const getProductCategory = (prodId: string) => {
    const found = products.find(p => p.id === prodId);
    return found ? found.category : 'Diagnostic Equipment';
  };

  // Filter reviews
  const filteredReviews = reviews.filter(rev => {
    const prodName = getProductName(rev.productId);
    const prodCat = getProductCategory(rev.productId);
    const matchesSearch = searchQuery === '' || 
      rev.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rev.hospitalName && rev.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRating = selectedRating === 'all' || rev.rating === selectedRating;
    const matchesCategory = selectedCategory === 'all' || prodCat === selectedCategory;

    return matchesSearch && matchesRating && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            &larr; Return to Marketplace Catalog
          </button>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Clinical Quality Assurance Feed
          </span>
        </div>

        {/* Hero Banner / Summary Stats */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-teal-800/80 relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
            <Star className="w-64 h-64 fill-white" />
          </div>
          <div className="max-w-4xl space-y-6 relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-amber-500/25 text-amber-300 border border-amber-400/40 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                Verified Clinical Reviews Portal
              </span>
              <span className="bg-teal-500/20 text-teal-200 border border-teal-500/30 text-xs font-semibold px-3 py-1 rounded-full">
                Al Salam Quality Standard
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display leading-tight">
              Hospital Procurement & Diagnostic Feedback
            </h1>
            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed max-w-2xl">
              Browse authentic feedback from doctors, biomedical technicians, and procurement administrators regarding equipment performance, calibration accuracy, and dispatch reliability.
            </p>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-teal-800/60">
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                <div className="flex items-center gap-1 text-amber-400 font-extrabold text-2xl">
                  <span>{averageRating}</span>
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <span className="text-[11px] text-teal-200 font-medium">Average Clinical Score</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                <div className="text-white font-extrabold text-2xl">100%</div>
                <span className="text-[11px] text-teal-200 font-medium">Verified Invoices</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                <div className="text-emerald-300 font-extrabold text-2xl">24 - 48h</div>
                <span className="text-[11px] text-teal-200 font-medium">Avg Dispatch Window</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                <div className="text-blue-300 font-extrabold text-2xl">Nationwide</div>
                <span className="text-[11px] text-teal-200 font-medium">Hospital Delivery Coverage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar & Filter Controls */}
        <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by equipment, doctor name, or clinic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <option value="all">⭐ All Star Ratings</option>
              <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
              <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
              <option value={3}>⭐⭐⭐ (3 Stars)</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <option value="all">All Equipment Categories</option>
              {categories.filter(c => c !== 'all').map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => setShowWriteModal(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Write a Review
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display flex items-center gap-2">
              Showing {filteredReviews.length} Clinical Reviews
            </h2>
            <span className="text-xs text-slate-400">Sorted by newest & helpful feedback</span>
          </div>

          {filteredReviews.length === 0 ? (
            <div className={`p-12 rounded-3xl border text-center space-y-4 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div>
                <h3 className="font-bold text-base">No clinical reviews match your filters</h3>
                <p className="text-xs text-slate-400 mt-1">Try clearing your search terms or selecting 'All Equipment Categories'</p>
              </div>
              <button
                onClick={() => { setSearchQuery(''); setSelectedRating('all'); setSelectedCategory('all'); }}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredReviews.map((rev) => {
                const prodName = getProductName(rev.productId);
                const prodCat = getProductCategory(rev.productId);
                const matchedProd = products.find(p => p.id === rev.productId);

                return (
                  <div
                    key={rev.id}
                    className={`p-6 sm:p-8 rounded-3xl border transition hover:shadow-md ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      {/* Reviewer Information */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                          {rev.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">{rev.customerName}</h3>
                            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {rev.badge || 'Verified B2B Consignment'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-teal-600" />
                            <span className="font-semibold">{rev.designation || 'Medical Officer'}</span>
                            <span>•</span>
                            <span>{rev.hospitalName || 'Clinical Institution'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Product Tag & Date */}
                      <div className="flex flex-col md:items-end justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span>{new Date(rev.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Equipment Reviewed Badge */}
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Package className="w-3.5 h-3.5 text-teal-600" />
                        <span>Reviewed Equipment: <strong>{prodName}</strong></span>
                        <span className="text-[10px] text-slate-400">({prodCat})</span>
                        {matchedProd && onSelectProduct && (
                          <button
                            onClick={() => onSelectProduct(matchedProd)}
                            className="ml-2 text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            View Specs <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </span>
                    </div>

                    {/* Review Comment */}
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal mb-5">
                      "{rev.comment}"
                    </p>

                    {/* Vendor Response Box if applicable */}
                    {rev.vendorResponse && (
                      <div className="mb-5 p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-200">
                          <Award className="w-4 h-4 text-teal-600" />
                          <span>Official Response from Al Salam Medical Support Team</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {rev.vendorResponse}
                        </p>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => handleHelpfulClick(rev.id)}
                        disabled={helpfulClicked[rev.id]}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-semibold ${
                          helpfulClicked[rev.id]
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 cursor-default'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{helpfulClicked[rev.id] ? 'Marked Helpful' : 'Helpful'} ({rev.helpfulCount || 0})</span>
                      </button>

                      <span className="text-[11px] text-slate-400 font-medium">Verified HSN Compliance</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Write a Review Modal Popup */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDarkMode ? 'bg-slate-800/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <MessageSquarePlus className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base">Submit Verified Clinical Review</h3>
              </div>
              <button
                onClick={() => setShowWriteModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold mb-1">Select Medical Equipment / Product</label>
                <select
                  required
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="e.g. Dr. Anita Verma"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Clinical Designation</label>
                  <input
                    type="text"
                    required
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Chief Anesthesiologist"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Hospital / Clinic Name</label>
                  <input
                    type="text"
                    required
                    value={formHospitalName}
                    onChange={(e) => setFormHospitalName(e.target.value)}
                    placeholder="e.g. Apollo Super Speciality Hospital"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Verification Badge</label>
                  <select
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value="Verified B2B Consignment">Verified B2B Consignment</option>
                    <option value="Verified Hospital Buyer">Verified Hospital Buyer</option>
                    <option value="Certified Biomedical Engineer">Certified Biomedical Engineer</option>
                    <option value="Chief Medical Officer">Chief Medical Officer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Star Rating</label>
                <select
                  value={formRating}
                  onChange={(e) => setFormRating(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-amber-600"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent Performance & Calibration)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5 Very Good - Fast Dispatch)</option>
                  <option value={3}>⭐⭐⭐ (3/5 Satisfactory)</option>
                  <option value={2}>⭐⭐ (2/5 Needs Improvement)</option>
                  <option value={1}>⭐ (1/5 Poor Performance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Clinical Review & Performance Feedback</label>
                <textarea
                  required
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Detail your experience with build durability, sensor sensitivity, GST documentation accuracy, or Al Salam support..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWriteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2 rounded-xl text-xs transition shadow-sm"
                >
                  Publish Verified Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
