import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { dbLocal } from '../db';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Edit3, Save, RefreshCw, Layers, Tag, Search, Filter } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../data';
import { getCategorySeoUrl, getSubcategorySeoUrl, getProductSeoUrl } from '../utils/seoUrls';
import { GeminiCategoryAuditModal } from './GeminiCategoryAuditModal';

export const AdminCategorizationPanel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterStatus, setFilterStatus] = useState<'All' | 'NeedsAdminReview' | 'Suggested' | 'AutoSelected'>('NeedsAdminReview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing Product state
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editSubcategory, setEditSubcategory] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Feedback memory logs
  const [feedbackLogs, setFeedbackLogs] = useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allProds = dbLocal.getProducts();
    setProducts(allProds);

    const cats = dbLocal.getCategories();
    setCategories(cats.length > 0 ? cats : INITIAL_CATEGORIES);

    // Fetch Firestore categorization feedback
    try {
      const snap = await getDocs(query(collection(db, 'categorization_feedback'), orderBy('timestamp', 'desc'), limit(10)));
      const logs: any[] = [];
      snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
      setFeedbackLogs(logs);
    } catch (err) {
      console.log('Error loading feedback logs from Firestore:', err);
    }
  };

  const handleStartEdit = (prod: Product) => {
    setEditingProdId(prod.id);
    setEditCategory(prod.category || 'Medical Equipment');
    setEditSubcategory(prod.subcategory || 'General Equipment');
  };

  const handleSaveAndTrainAI = async (product: Product) => {
    try {
      setIsSaving(true);

      const oldCategory = product.category;
      const oldSubcategory = product.subcategory;

      const updatedProduct: Product = {
        ...product,
        category: editCategory,
        subcategory: editSubcategory,
        status: 'Approved',
        updatedAt: new Date().toISOString()
      };

      // Save to Local DB
      dbLocal.updateProduct(product.id, updatedProduct);

      // Record feedback into Firestore to train future AI prompts
      try {
        await addDoc(collection(db, 'categorization_feedback'), {
          productId: product.id,
          productName: product.name,
          brand: product.brand || '',
          description: product.description || '',
          originalCategory: oldCategory,
          originalSubcategory: oldSubcategory,
          adminCategory: editCategory,
          adminSubcategory: editSubcategory,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.log('Firestore feedback save error:', err);
      }

      setEditingProdId(null);
      setIsSaving(false);
      setSuccessToast(`Product "${product.name}" categorized as "${editCategory} -> ${editSubcategory}" and trained in AI memory!`);
      setTimeout(() => setSuccessToast(null), 4000);
      loadData();
    } catch (err) {
      setIsSaving(false);
      console.error('Error saving category override:', err);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Simulate classification status based on presence or confidence
    const isNeedsReview = p.rejectionReason?.includes('Low categorization confidence') || p.category === 'General' || !p.subcategory;
    
    if (filterStatus === 'NeedsAdminReview' && !isNeedsReview) return false;
    if (filterStatus === 'AutoSelected' && isNeedsReview) return false;

    return matchesSearch;
  });

  const selectedCategoryObj = categories.find(c => c.name === editCategory);
  const subcategoriesList = selectedCategoryObj?.subcategories || ['General'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl shadow-xl border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-black tracking-tight text-white">AI Categorization & Compliance Review</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Monitor AI automatic product classifications. Admin overrides automatically train the HealNex Gemini AI Engine for future vendor product uploads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuditModal(true)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider animate-pulse"
          >
            <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>Gemini AI Category Audit</span>
          </button>

          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-emerald-500/30 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Learned Corrections</span>
            <span className="text-lg font-black text-emerald-400">{feedbackLogs.length} Records</span>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search products, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['NeedsAdminReview', 'AutoSelected', 'All'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                filterStatus === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'NeedsAdminReview' && <AlertTriangle className="w-3.5 h-3.5" />}
              {st === 'AutoSelected' && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{st === 'NeedsAdminReview' ? 'Needs Review' : st === 'AutoSelected' ? 'Auto Classified' : 'All Products'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Product Info</th>
                <th className="py-3.5 px-4">Assigned Category</th>
                <th className="py-3.5 px-4">Assigned Subcategory</th>
                <th className="py-3.5 px-4">SEO Route</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No products matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isEditing = editingProdId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition">
                      {/* Product Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{product.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Brand: {product.brand || 'Generic'}</span>
                          <span>•</span>
                          <span>SKU: {product.sku || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Main Category */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editCategory}
                            onChange={(e) => {
                              setEditCategory(e.target.value);
                              const found = categories.find(c => c.name === e.target.value);
                              if (found && found.subcategories?.[0]) {
                                setEditSubcategory(found.subcategories[0]);
                              }
                            }}
                            className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold">
                            {product.category || 'Uncategorized'}
                          </span>
                        )}
                      </td>

                      {/* Subcategory */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editSubcategory}
                            onChange={(e) => setEditSubcategory(e.target.value)}
                            className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {subcategoriesList.map((sub, i) => (
                              <option key={i} value={sub}>{sub}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold">
                            {product.subcategory || 'General'}
                          </span>
                        )}
                      </td>

                      {/* SEO Route */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px] block">
                          {getProductSeoUrl(product.category, product.subcategory, product.name)}
                        </span>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveAndTrainAI(product)}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save & Train AI</span>
                            </button>
                            <button
                              onClick={() => setEditingProdId(null)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(product)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition ml-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Override Category</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Gemini Category Audit Modal */}
      <GeminiCategoryAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        onAuditCompleted={loadData}
      />
    </div>
  );
};
