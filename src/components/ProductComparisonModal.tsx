import React, { useState, useMemo } from 'react';
import { Product, ProductSpecification } from '../types';
import {
  Scale,
  X,
  ShoppingCart,
  Zap,
  CheckCircle,
  AlertCircle,
  Layers,
  FileText,
  BadgePercent,
  Truck,
  ShieldCheck,
  Building,
  Star,
  Plus,
  Trash2,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  Search,
  ZoomIn,
  Eye,
  SlidersHorizontal,
  Info,
  Check,
  Minus
} from 'lucide-react';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  compareList: Product[];
  allProducts: Product[];
  onRemoveFromCompare: (productId: string) => void;
  onClearCompare: () => void;
  onAddToCompare: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickBuy?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  isDarkMode?: boolean;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  compareList,
  allProducts,
  onRemoveFromCompare,
  onClearCompare,
  onAddToCompare,
  onAddToCart,
  onQuickBuy,
  onQuickView,
  isDarkMode = false,
  addToast
}) => {
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [searchAddQuery, setSearchAddQuery] = useState('');
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'commercial' | 'specs' | 'compliance'>('all');

  // Close modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Aggregate all unique specification keys across all products in comparison
  const allSpecKeys = useMemo(() => {
    const keySet = new Set<string>();
    compareList.forEach((prod) => {
      if (prod.specifications && Array.isArray(prod.specifications)) {
        prod.specifications.forEach((spec) => {
          if (spec.key && spec.key.trim()) {
            keySet.add(spec.key.trim());
          }
        });
      }
    });
    return Array.from(keySet);
  }, [compareList]);

  // Check if a specific technical specification key has differing values across compared products
  const isSpecDifferent = (key: string): boolean => {
    if (compareList.length <= 1) return false;
    const values = compareList.map((prod) => {
      const spec = prod.specifications?.find(
        (s) => s.key.trim().toLowerCase() === key.toLowerCase()
      );
      return spec ? spec.value.trim().toLowerCase() : '';
    });
    return new Set(values).size > 1;
  };

  // Helper to extract a spec value from a product
  const getProductSpecValue = (product: Product, key: string): string => {
    const spec = product.specifications?.find(
      (s) => s.key.trim().toLowerCase() === key.toLowerCase()
    );
    return spec && spec.value ? spec.value : '—';
  };

  // Filter products that can be added to comparison (excluding already added products)
  const availableProductsToAdd = useMemo(() => {
    const addedIds = new Set(compareList.map((p) => p.id));
    return allProducts
      .filter((p) => !addedIds.has(p.id))
      .filter((p) => {
        if (!searchAddQuery.trim()) return true;
        const q = searchAddQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
        );
      })
      .slice(0, 10);
  }, [allProducts, compareList, searchAddQuery]);

  // Check differences for commercial terms
  const isPriceDifferent = useMemo(() => {
    if (compareList.length <= 1) return false;
    return new Set(compareList.map((p) => p.salePrice)).size > 1;
  }, [compareList]);

  const isMoqDifferent = useMemo(() => {
    if (compareList.length <= 1) return false;
    return new Set(compareList.map((p) => p.moq || 1)).size > 1;
  }, [compareList]);

  const isWarrantyDifferent = useMemo(() => {
    if (compareList.length <= 1) return false;
    return new Set(compareList.map((p) => (p.warranty || '').toLowerCase())).size > 1;
  }, [compareList]);

  const isBrandDifferent = useMemo(() => {
    if (compareList.length <= 1) return false;
    return new Set(compareList.map((p) => (p.brand || '').toLowerCase())).size > 1;
  }, [compareList]);

  const isGstDifferent = useMemo(() => {
    if (compareList.length <= 1) return false;
    return new Set(compareList.map((p) => p.gstRate)).size > 1;
  }, [compareList]);

  // Export comparison table as CSV
  const handleExportCSV = () => {
    if (compareList.length === 0) return;

    let csv = `HealNex Medi Bazar - Clinical Equipment Technical Comparison Matrix\r\n`;
    csv += `Exported Date: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString()}\r\n\r\n`;

    // Header row with product names
    csv += `"Parameter / Attribute",` + compareList.map((p) => `"${p.name.replace(/"/g, '""')} (${p.brand})"`).join(',') + `\r\n`;

    // Commercial rows
    csv += `"Brand",` + compareList.map((p) => `"${p.brand}"`).join(',') + `\r\n`;
    csv += `"Category",` + compareList.map((p) => `"${p.category}"`).join(',') + `\r\n`;
    csv += `"SKU / Model",` + compareList.map((p) => `"${p.sku}"`).join(',') + `\r\n`;
    csv += `"Sale Price (INR)",` + compareList.map((p) => `"₹${p.salePrice.toLocaleString('en-IN')}"`).join(',') + `\r\n`;
    csv += `"Original MRP (INR)",` + compareList.map((p) => `"₹${p.price.toLocaleString('en-IN')}"`).join(',') + `\r\n`;
    csv += `"GST Rate",` + compareList.map((p) => `"${p.gstRate}%"`).join(',') + `\r\n`;
    csv += `"HSN Code",` + compareList.map((p) => `"${p.hsnCode}"`).join(',') + `\r\n`;
    csv += `"Landed Price (with GST)",` + compareList.map((p) => `"₹${Math.round(p.salePrice * (1 + p.gstRate / 100)).toLocaleString('en-IN')}"`).join(',') + `\r\n`;
    csv += `"Minimum Order Qty (MOQ)",` + compareList.map((p) => `"${p.moq || 1} Units"`).join(',') + `\r\n`;
    csv += `"Warranty",` + compareList.map((p) => `"${p.warranty || 'Standard 1 Year'}"`).join(',') + `\r\n`;
    csv += `"Supplier / Vendor",` + compareList.map((p) => `"${p.vendorName}"`).join(',') + `\r\n`;
    csv += `"Country of Origin",` + compareList.map((p) => `"${p.countryOfOrigin || 'India'}"`).join(',') + `\r\n`;

    // Technical specifications
    csv += `\r\n--- TECHNICAL SPECIFICATIONS ---\r\n`;
    allSpecKeys.forEach((key) => {
      csv += `"${key.replace(/"/g, '""')}",` + compareList.map((p) => `"${getProductSpecValue(p, key).replace(/"/g, '""')}"`).join(',') + `\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HealNex_Procurement_Comparison_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Comparison matrix downloaded successfully as CSV!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in font-sans">
      <div
        id="product-comparison-modal-card"
        className={`relative w-full max-w-7xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 ${
            isDarkMode
              ? 'bg-slate-950/80 border-slate-800'
              : 'bg-gradient-to-r from-teal-50/70 via-slate-50 to-sky-50/50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600/10 text-teal-600 flex items-center justify-center border border-teal-600/20 shadow-sm shrink-0">
              <Scale className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  Clinical Equipment Comparison Matrix
                </h2>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-teal-200 uppercase font-mono">
                  {compareList.length} / 4 Products
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Side-by-side technical parameters, regulatory compliance, warranty, and commercial terms for institutional procurement
              </p>
            </div>
          </div>

          {/* Modal Header Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {compareList.length > 1 && (
              <>
                {/* Difference Highlighter Switch */}
                <button
                  type="button"
                  id="toggle-highlight-differences"
                  onClick={() => setHighlightDifferences(!highlightDifferences)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    highlightDifferences
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Highlight rows where technical values or pricing differ"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${highlightDifferences ? 'text-amber-600 fill-amber-600' : 'text-slate-400'}`} />
                  <span>Highlight Differences</span>
                </button>

                {/* Show only differences filter */}
                <button
                  type="button"
                  id="toggle-only-differences"
                  onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    showOnlyDifferences
                      ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Filter matrix to show only parameters with differing values"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Only Differences</span>
                </button>

                {/* Export CSV */}
                <button
                  type="button"
                  id="btn-export-comparison-csv"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                  title="Download procurement comparison report as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                {/* Print Matrix */}
                <button
                  type="button"
                  id="btn-print-comparison"
                  onClick={handlePrint}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer"
                  title="Print comparison table for procurement committee"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                </button>

                {/* Clear All */}
                <button
                  type="button"
                  id="btn-clear-all-comparison"
                  onClick={() => {
                    onClearCompare();
                    addToast('Comparison list cleared', 'info');
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200 flex items-center gap-1 cursor-pointer"
                  title="Clear all selected items from comparison"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              </>
            )}

            {/* Close Modal */}
            <button
              type="button"
              id="btn-close-comparison-modal"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition cursor-pointer"
              title="Close Comparison Modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        {compareList.length > 0 && (
          <div className="px-6 py-2.5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4 overflow-x-auto shrink-0 scrollbar-none">
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: 'All Parameters', count: allSpecKeys.length + 10 },
                { id: 'commercial', label: 'Commercial & Pricing', count: 8 },
                { id: 'specs', label: 'Technical Specifications', count: allSpecKeys.length },
                { id: 'compliance', label: 'Certifications & Clinical Standards', count: 4 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeCategoryTab === tab.id
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      activeCategoryTab === tab.id
                        ? 'bg-teal-800 text-teal-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Add Product Dropdown search in header */}
            {compareList.length < 4 && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  id="btn-add-more-compare-header"
                  onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                  className="bg-teal-50 hover:bg-teal-100/80 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>+ Add Product ({4 - compareList.length} slots left)</span>
                </button>

                {isAddDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-fade-in font-sans">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="text-xs font-bold text-slate-800">Add Equipment to Matrix</span>
                      <button
                        type="button"
                        onClick={() => setIsAddDropdownOpen(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search products by model or brand..."
                        value={searchAddQuery}
                        onChange={(e) => setSearchAddQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-50">
                      {availableProductsToAdd.length === 0 ? (
                        <p className="text-[11px] text-slate-400 text-center py-4">No matching products found</p>
                      ) : (
                        availableProductsToAdd.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              onAddToCompare(p);
                              setIsAddDropdownOpen(false);
                              setSearchAddQuery('');
                              addToast(`Added ${p.name} to comparison!`, 'success');
                            }}
                            className="p-2 hover:bg-teal-50/70 rounded-xl flex items-center gap-2.5 cursor-pointer transition"
                          >
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200'}
                              alt={p.name}
                              className="w-10 h-10 object-contain rounded-lg border border-slate-100 bg-white shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium truncate">{p.brand} • {p.category}</p>
                              <p className="text-xs font-bold text-teal-700 font-mono">₹{p.salePrice.toLocaleString('en-IN')}</p>
                            </div>
                            <Plus className="w-4 h-4 text-teal-600 shrink-0" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* EMPTY STATE */}
          {compareList.length === 0 && (
            <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl mx-auto flex items-center justify-center border border-teal-100 shadow-inner">
                <Scale className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-800">No Products in Comparison Matrix</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select 2 to 4 medical equipment or diagnostic devices from our catalog using the compare button (⚖️) on any product card to analyze specifications side-by-side.
                </p>
              </div>

              {/* Sample products to quickly add */}
              {allProducts.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                    Quick Add Featured Equipment
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allProducts.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onAddToCompare(p);
                          addToast(`Added ${p.name} to comparison!`, 'success');
                        }}
                        className="p-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left flex items-center gap-2 transition cursor-pointer"
                      >
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200'}
                          alt={p.name}
                          className="w-8 h-8 object-contain rounded-md bg-white border border-slate-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{p.name}</p>
                          <p className="text-[10px] text-teal-700 font-bold font-mono">₹{p.salePrice.toLocaleString('en-IN')}</p>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm transition inline-flex items-center gap-2 cursor-pointer mt-2"
              >
                <span>Browse Clinical Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SINGLE PRODUCT STATE */}
          {compareList.length === 1 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900">
                  <span className="font-black">1 Equipment Selected.</span> Add at least 1 more product to unlock full side-by-side specification contrast.
                </div>
              </div>

              {/* Add more button */}
              <div className="relative w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Second Product to Contrast</span>
                </button>
              </div>
            </div>
          )}

          {/* SIDE-BY-SIDE MATRIX TABLE */}
          {compareList.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
              <table className="w-full border-collapse min-w-[700px]">
                {/* 1. STICKY / FIXED PRODUCT HEADER ROW */}
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50/90">
                    <th className="p-4 text-left w-56 sm:w-64 min-w-[200px] border-r border-slate-200 align-top bg-slate-50">
                      <div className="space-y-2 sticky top-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Equipment &amp; Attributes
                        </span>
                        <h3 className="text-sm font-black text-slate-800">
                          Procurement Summary
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Comparing {compareList.length} models for hospital &amp; clinic acquisition
                        </p>
                      </div>
                    </th>

                    {/* Product Columns */}
                    {compareList.map((product) => {
                      const discount =
                        product.price > product.salePrice
                          ? Math.round(((product.price - product.salePrice) / product.price) * 100)
                          : 0;

                      return (
                        <th
                          key={product.id}
                          className="p-4 text-left min-w-[240px] max-w-[300px] border-r border-slate-200 last:border-0 align-top bg-white relative group"
                        >
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveFromCompare(product.id);
                              addToast(`Removed ${product.name} from comparison`, 'info');
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Remove from comparison"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div className="space-y-3">
                            {/* Product Image */}
                            <div
                              onClick={() => {
                                if (onQuickView) onQuickView(product);
                              }}
                              className="h-36 w-full bg-slate-50 rounded-xl border border-slate-100 p-2 flex items-center justify-center relative cursor-pointer hover:bg-slate-100 transition group/img"
                              title="Click for quick view"
                            >
                              <img
                                src={
                                  product.images && product.images.length > 0
                                    ? product.images[0]
                                    : 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300'
                                }
                                alt={product.name}
                                className="max-h-full max-w-full object-contain group-hover/img:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-teal-800 text-[10px] font-bold">
                                <Eye className="w-3.5 h-3.5 mr-1" /> Quick View
                              </div>
                            </div>

                            {/* Brand & Category */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                                  {product.brand}
                                </span>
                                <span className="text-slate-400 font-mono">SKU: {product.sku}</span>
                              </div>

                              <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug min-h-[32px]">
                                {product.name}
                              </h4>
                            </div>

                            {/* Ratings & Reviews */}
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                                ))}
                              </div>
                              <span className="font-bold text-slate-700">4.9</span>
                              <span className="text-slate-400 text-[10px]">(Verified)</span>
                            </div>

                            {/* Commercial Price Banner */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-black text-slate-900 font-mono">
                                  ₹{product.salePrice.toLocaleString('en-IN')}
                                </span>
                                {discount > 0 && (
                                  <span className="text-[10px] text-slate-400 line-through font-mono">
                                    ₹{product.price.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                <span>+{product.gstRate}% GST</span>
                                {discount > 0 && (
                                  <span className="bg-rose-50 text-rose-700 font-bold px-1.5 py-0.2 rounded font-mono">
                                    {discount}% OFF
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons in Column Header */}
                            <div className="space-y-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onAddToCart(product, product.moq || 1);
                                  addToast(`Added ${product.name} to cart!`, 'success');
                                }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Add to Cart</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (onQuickBuy) {
                                    onQuickBuy(product);
                                  } else {
                                    onAddToCart(product, product.moq || 1);
                                  }
                                }}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                                <span>Quick Buy</span>
                              </button>
                            </div>
                          </div>
                        </th>
                      );
                    })}

                    {/* Empty Slot placeholder if < 4 items */}
                    {compareList.length < 4 && (
                      <th className="p-4 text-center min-w-[200px] border-r border-slate-200 last:border-0 align-middle bg-slate-50/50">
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-teal-400 hover:text-teal-700 transition cursor-pointer"
                          onClick={() => setIsAddDropdownOpen(true)}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Add Another Equipment</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Compare up to 4 models</p>
                          </div>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>

                {/* 2. TABLE BODY (ATTRIBUTES & SPECIFICATIONS) */}
                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* SECTION 1: COMMERCIAL & PROCUREMENT PARAMETERS */}
                  {(activeCategoryTab === 'all' || activeCategoryTab === 'commercial') && (
                    <>
                      <tr className="bg-teal-50/70">
                        <td
                          colSpan={compareList.length + (compareList.length < 4 ? 2 : 1)}
                          className="px-4 py-2 font-black text-[11px] uppercase tracking-wider text-teal-900 flex items-center gap-2"
                        >
                          <BadgePercent className="w-4 h-4 text-teal-700" />
                          <span>1. Commercial &amp; Procurement Terms</span>
                        </td>
                      </tr>

                      {/* Row: Sale Price */}
                      {(!showOnlyDifferences || isPriceDifferent) && (
                        <tr className={highlightDifferences && isPriceDifferent ? 'bg-amber-50/60' : 'hover:bg-slate-50/50'}>
                          <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                            <div className="flex items-center justify-between">
                              <span>Unit Sale Price</span>
                              {isPriceDifferent && highlightDifferences && (
                                <span className="text-[9px] bg-amber-200 text-amber-900 font-mono font-bold px-1 rounded">≠ Diff</span>
                              )}
                            </div>
                          </td>
                          {compareList.map((p) => (
                            <td key={p.id} className="p-3.5 font-black text-slate-900 font-mono border-r border-slate-200 last:border-0">
                              ₹{p.salePrice.toLocaleString('en-IN')}
                            </td>
                          ))}
                          {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                        </tr>
                      )}

                      {/* Row: Landed Price with GST */}
                      {(!showOnlyDifferences || isPriceDifferent || isGstDifferent) && (
                        <tr className={highlightDifferences && (isPriceDifferent || isGstDifferent) ? 'bg-amber-50/60' : 'hover:bg-slate-50/50'}>
                          <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                            <div className="flex items-center justify-between">
                              <span>Landed Cost (Incl. GST)</span>
                              {(isPriceDifferent || isGstDifferent) && highlightDifferences && (
                                <span className="text-[9px] bg-amber-200 text-amber-900 font-mono font-bold px-1 rounded">≠ Diff</span>
                              )}
                            </div>
                          </td>
                          {compareList.map((p) => {
                            const landed = Math.round(p.salePrice * (1 + (p.gstRate || 12) / 100));
                            return (
                              <td key={p.id} className="p-3.5 font-bold text-teal-800 font-mono border-r border-slate-200 last:border-0">
                                ₹{landed.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-sans">({p.gstRate}% GST)</span>
                              </td>
                            );
                          })}
                          {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                        </tr>
                      )}

                      {/* Row: Minimum Order Qty (MOQ) */}
                      {(!showOnlyDifferences || isMoqDifferent) && (
                        <tr className={highlightDifferences && isMoqDifferent ? 'bg-amber-50/60' : 'hover:bg-slate-50/50'}>
                          <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                            <div className="flex items-center justify-between">
                              <span>Minimum Order Qty (MOQ)</span>
                              {isMoqDifferent && highlightDifferences && (
                                <span className="text-[9px] bg-amber-200 text-amber-900 font-mono font-bold px-1 rounded">≠ Diff</span>
                              )}
                            </div>
                          </td>
                          {compareList.map((p) => (
                            <td key={p.id} className="p-3.5 font-semibold text-slate-800 border-r border-slate-200 last:border-0">
                              {p.moq ? `${p.moq} Units` : '1 Unit (Single Unit Available)'}
                            </td>
                          ))}
                          {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                        </tr>
                      )}

                      {/* Row: HSN & Tax Code */}
                      {(!showOnlyDifferences || isGstDifferent) && (
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                            <span>HSN Code &amp; GST Slab</span>
                          </td>
                          {compareList.map((p) => (
                            <td key={p.id} className="p-3.5 font-mono text-slate-700 border-r border-slate-200 last:border-0">
                              HSN: <strong>{p.hsnCode || '9018'}</strong> ({p.gstRate || 12}% GST)
                            </td>
                          ))}
                          {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                        </tr>
                      )}

                      {/* Row: Warranty & Support */}
                      {(!showOnlyDifferences || isWarrantyDifferent) && (
                        <tr className={highlightDifferences && isWarrantyDifferent ? 'bg-amber-50/60' : 'hover:bg-slate-50/50'}>
                          <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                            <div className="flex items-center justify-between">
                              <span>Comprehensive Warranty</span>
                              {isWarrantyDifferent && highlightDifferences && (
                                <span className="text-[9px] bg-amber-200 text-amber-900 font-mono font-bold px-1 rounded">≠ Diff</span>
                              )}
                            </div>
                          </td>
                          {compareList.map((p) => (
                            <td key={p.id} className="p-3.5 font-bold text-emerald-800 border-r border-slate-200 last:border-0">
                              🛡️ {p.warranty || '1 Year Standard Manufacturer Warranty'}
                            </td>
                          ))}
                          {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                        </tr>
                      )}

                      {/* Row: Stock & Availability */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                          <span>Inventory Availability</span>
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3.5 border-r border-slate-200 last:border-0">
                            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              In Stock ({p.stockQuantity !== undefined ? p.stockQuantity : 15} units ready)
                            </span>
                          </td>
                        ))}
                        {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                      </tr>

                      {/* Row: Supplier & Trust Score */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                          <span>Verified Supplier</span>
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3.5 border-r border-slate-200 last:border-0">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-800">{p.vendorName}</p>
                              <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100 inline-block">
                                Verified Medical Vendor
                              </span>
                            </div>
                          </td>
                        ))}
                        {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                      </tr>

                      {/* Row: Country of Origin */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                          <span>Country of Origin</span>
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3.5 font-medium text-slate-700 border-r border-slate-200 last:border-0">
                            📍 {p.countryOfOrigin || 'India'}
                          </td>
                        ))}
                        {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                      </tr>
                    </>
                  )}

                  {/* SECTION 2: TECHNICAL SPECIFICATIONS MATRIX */}
                  {(activeCategoryTab === 'all' || activeCategoryTab === 'specs') && (
                    <>
                      <tr className="bg-sky-50/70">
                        <td
                          colSpan={compareList.length + (compareList.length < 4 ? 2 : 1)}
                          className="px-4 py-2 font-black text-[11px] uppercase tracking-wider text-sky-900 flex items-center gap-2"
                        >
                          <Layers className="w-4 h-4 text-sky-700" />
                          <span>2. Technical Specifications &amp; Parameters</span>
                        </td>
                      </tr>

                      {allSpecKeys.length === 0 ? (
                        <tr>
                          <td
                            colSpan={compareList.length + (compareList.length < 4 ? 2 : 1)}
                            className="p-4 text-center text-slate-400 text-xs italic"
                          >
                            Standard technical specifications populated via calibrated datasheets.
                          </td>
                        </tr>
                      ) : (
                        allSpecKeys.map((key) => {
                          const diff = isSpecDifferent(key);
                          if (showOnlyDifferences && !diff) return null;

                          return (
                            <tr
                              key={key}
                              className={
                                highlightDifferences && diff
                                  ? 'bg-amber-50/60'
                                  : 'hover:bg-slate-50/50'
                              }
                            >
                              <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                                <div className="flex items-center justify-between">
                                  <span>{key}</span>
                                  {diff && highlightDifferences && (
                                    <span className="text-[9px] bg-amber-200 text-amber-900 font-mono font-bold px-1 rounded">
                                      ≠ Diff
                                    </span>
                                  )}
                                </div>
                              </td>

                              {compareList.map((product) => {
                                const val = getProductSpecValue(product, key);
                                return (
                                  <td
                                    key={product.id}
                                    className="p-3.5 font-semibold text-slate-800 border-r border-slate-200 last:border-0"
                                  >
                                    {val === '—' ? (
                                      <span className="text-slate-300 font-normal italic">Not specified</span>
                                    ) : (
                                      <span className="text-slate-900 font-medium">{val}</span>
                                    )}
                                  </td>
                                );
                              })}

                              {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                            </tr>
                          );
                        })
                      )}
                    </>
                  )}

                  {/* SECTION 3: CLINICAL COMPLIANCE & CERTIFICATIONS */}
                  {(activeCategoryTab === 'all' || activeCategoryTab === 'compliance') && (
                    <>
                      <tr className="bg-purple-50/70">
                        <td
                          colSpan={compareList.length + (compareList.length < 4 ? 2 : 1)}
                          className="px-4 py-2 font-black text-[11px] uppercase tracking-wider text-purple-900 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-700" />
                          <span>3. Regulatory Certifications &amp; Clinical Assurance</span>
                        </td>
                      </tr>

                      {/* Row: Regulatory Standards */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                          <span>Quality Standards</span>
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3.5 border-r border-slate-200 last:border-0">
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                                ISO 13485
                              </span>
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                CE Certified
                              </span>
                              <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                                CDSCO Reg.
                              </span>
                            </div>
                          </td>
                        ))}
                        {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                      </tr>

                      {/* Row: Calibration & Dispatch SLA */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                          <span>Biomedical Pre-Dispatch Calibration</span>
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3.5 text-slate-700 font-medium border-r border-slate-200 last:border-0">
                            <span className="flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle className="w-3.5 h-3.5" /> 100% Pre-tested &amp; Calibrated
                            </span>
                          </td>
                        ))}
                        {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                      </tr>

                      {/* Row: Logistics & Delivery SLA */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                          <span>Shipping &amp; Logistics SLA</span>
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3.5 text-slate-700 font-medium border-r border-slate-200 last:border-0">
                            <span className="flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-teal-600" /> Pan-India Express (3-5 Days)
                            </span>
                          </td>
                        ))}
                        {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                      </tr>

                      {/* Row: Description & Clinical Summary */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                          <span>Product Overview</span>
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3.5 text-slate-600 text-[11px] leading-relaxed border-r border-slate-200 last:border-0">
                            {p.description || p.shortDescription || 'Certified hospital-grade medical device with factory warranty.'}
                          </td>
                        ))}
                        {compareList.length < 4 && <td className="p-3.5 bg-slate-50/30"></td>}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-4 shrink-0 ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Escrow protected B2B transactions with certified clinical inspection</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>

            {compareList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  compareList.forEach((p) => onAddToCart(p, p.moq || 1));
                  addToast(`Added all ${compareList.length} compared items to cart!`, 'success');
                  onClose();
                }}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add All to Cart ({compareList.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
