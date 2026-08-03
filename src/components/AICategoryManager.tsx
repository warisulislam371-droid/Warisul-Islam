import React, { useState, useEffect } from 'react';
import { Category, Subcategory, Product } from '../types';
import { dbLocal } from '../db';
import {
  getAllSubcategories,
  saveSubcategories,
  mergeSubcategories,
  deleteEmptySubcategories,
  recalculateProductCounts,
  getCategorizationLogs,
  CategorizationLogEntry,
  generateSubcategorySeoMetadata
} from '../utils/aiCategorizerEngine';
import { getSubcategorySeoUrl, getCategorySeoUrl } from '../utils/seoUrls';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  Search,
  Filter,
  Combine,
  RefreshCw,
  Tag,
  Plus,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';

export const AICategoryManager: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<CategorizationLogEntry[]>([]);

  // UI state
  const [activeView, setActiveView] = useState<'taxonomy' | 'merge' | 'logs'>('taxonomy');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Pending Approval' | 'AiGenerated'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Modals & Action States
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editKeywordsStr, setEditKeywordsStr] = useState('');
  const [editSynonymsStr, setEditSynonymsStr] = useState('');

  // Rename Category Modal
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // Merge State
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [mergeResultMsg, setMergeResultMsg] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    window.addEventListener('healnex_db_update', loadData);
    return () => window.removeEventListener('healnex_db_update', loadData);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    const cats = dbLocal.getCategories();
    const subs = getAllSubcategories();
    const prods = dbLocal.getProducts();
    const cLogs = getCategorizationLogs();

    setCategories(cats);
    setSubcategories(subs);
    setProducts(prods);
    setLogs(cLogs);

    // Expand all categories by default
    const initExp: Record<string, boolean> = {};
    cats.forEach(c => { initExp[c.id] = true; });
    setExpandedCats(prev => ({ ...initExp, ...prev }));
  };

  const toggleCatExpand = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Recalculate Live Counts
  const handleRecalculateCounts = () => {
    const res = recalculateProductCounts();
    setCategories(res.categories);
    setSubcategories(res.subcategories);
    showToast('Recalculated live product counts across all categories and subcategories!');
    if (onRefresh) onRefresh();
  };

  // Delete Empty Subcategories
  const handleDeleteEmpty = () => {
    const res = deleteEmptySubcategories();
    if (res.deletedCount > 0) {
      showToast(`Cleaned up ${res.deletedCount} empty AI subcategories: ${res.deletedNames.join(', ')}`);
      loadData();
      if (onRefresh) onRefresh();
    } else {
      showToast('No empty AI-created subcategories found to clean.');
    }
  };

  // Merge Category Duplicates
  const handleMergeCategoryDuplicates = () => {
    const res = dbLocal.mergeDuplicateCategories();
    if (res.mergedCount > 0) {
      showToast(`Successfully merged ${res.mergedCount} duplicate category entries! Total clean unique categories: ${res.totalUniqueRemaining}.`);
    } else {
      showToast(`All ${res.totalUniqueRemaining} categories are clean and unique. No duplicate categories found!`);
    }
    loadData();
    if (onRefresh) onRefresh();
  };

  // Approve Subcategory
  const handleApproveSub = (subId: string) => {
    const subs = getAllSubcategories();
    const updated = subs.map(s => {
      if (s.id === subId) {
        return { ...s, status: 'Active' as const, approved: true, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSubcategories(updated);
    showToast('Subcategory approved and activated globally.');
    loadData();
  };

  // Reject Subcategory
  const handleRejectSub = (subId: string) => {
    const subs = getAllSubcategories();
    const updated = subs.map(s => {
      if (s.id === subId) {
        return { ...s, status: 'Rejected' as const, approved: false, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSubcategories(updated);
    showToast('Subcategory rejected.');
    loadData();
  };

  // Open Subcategory Edit
  const openEditSub = (sub: Subcategory) => {
    setEditingSub(sub);
    setEditName(sub.name);
    setEditKeywordsStr((sub.keywords || []).join(', '));
    setEditSynonymsStr((sub.synonyms || []).join(', '));
  };

  // Save Subcategory Edit
  const handleSaveSubEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    const oldName = editingSub.name;
    const newName = editName.trim();
    const keywords = editKeywordsStr.split(',').map(s => s.trim()).filter(Boolean);
    const synonyms = editSynonymsStr.split(',').map(s => s.trim()).filter(Boolean);

    const subs = getAllSubcategories();
    const updated = subs.map(s => {
      if (s.id === editingSub.id) {
        const seo = generateSubcategorySeoMetadata(s.categoryName, newName, s.description);
        return {
          ...s,
          name: newName,
          keywords,
          synonyms,
          updatedAt: new Date().toISOString(),
          ...seo
        };
      }
      return s;
    });
    saveSubcategories(updated);

    // If name changed, update all products matching old subcategory name
    if (oldName !== newName) {
      const prods = dbLocal.getProducts();
      const updatedProds = prods.map(p => {
        if (p.subcategory?.toLowerCase() === oldName.toLowerCase()) {
          return { ...p, subcategory: newName, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      dbLocal.saveProducts(updatedProds);
    }

    showToast(`Updated subcategory "${newName}" and trained AI keywords.`);
    setEditingSub(null);
    loadData();
  };

  // Rename Category
  const handleSaveRenameCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;

    const oldName = editingCat.name;
    const newName = editCatName.trim();

    // 1. Update Category record
    const cats = dbLocal.getCategories();
    const updatedCats = cats.map(c => c.id === editingCat.id ? { ...c, name: newName, updatedAt: new Date().toISOString() } : c);
    dbLocal.saveCategories(updatedCats);

    // 2. Update all subcategories under this category
    const subs = getAllSubcategories();
    const updatedSubs = subs.map(s => {
      if (s.categoryName.toLowerCase() === oldName.toLowerCase() || s.categoryId === editingCat.id) {
        return { ...s, categoryName: newName, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSubcategories(updatedSubs);

    // 3. Update all products under this category
    const prods = dbLocal.getProducts();
    const updatedProds = prods.map(p => {
      if (p.category?.toLowerCase() === oldName.toLowerCase()) {
        return { ...p, category: newName, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    dbLocal.saveProducts(updatedProds);

    showToast(`Renamed Category from "${oldName}" to "${newName}". Updated all subcategories and products.`);
    setEditingCat(null);
    loadData();
  };

  // Perform Merge
  const handleExecuteMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSourceId || !mergeTargetId) return;
    if (mergeSourceId === mergeTargetId) {
      setMergeResultMsg('Source and Target subcategories must be different.');
      return;
    }

    const res = mergeSubcategories(mergeSourceId, mergeTargetId);
    setMergeResultMsg(res.message);
    if (res.success) {
      showToast(res.message);
      setMergeSourceId('');
      setMergeTargetId('');
      loadData();
    }
  };

  // Filter Subcategories
  const getSubcategoriesForCategory = (categoryName: string) => {
    return subcategories.filter(sub => {
      if (sub.categoryName.toLowerCase() !== categoryName.toLowerCase()) return false;

      // Status Filter
      if (filterStatus === 'Active' && sub.status !== 'Active') return false;
      if (filterStatus === 'Pending Approval' && sub.status !== 'Pending Approval') return false;
      if (filterStatus === 'AiGenerated' && !sub.createdByAi) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sub.name.toLowerCase().includes(q);
        const matchKws = (sub.keywords || []).some(k => k.toLowerCase().includes(q));
        const matchSyns = (sub.synonyms || []).some(s => s.toLowerCase().includes(q));
        if (!matchName && !matchKws && !matchSyns) return false;
      }

      return true;
    });
  };

  const totalSubCount = subcategories.length;
  const pendingCount = subcategories.filter(s => s.status === 'Pending Approval').length;
  const aiCreatedCount = subcategories.filter(s => s.createdByAi).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-up">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl shadow-xl border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-extrabold tracking-tight">AI Category & Subcategory Management Center</h2>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Auto-Classification Engine
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Full control over the HealNex Medical Taxonomy. Automatically classifies products, generates intelligent subcategories, prevents duplicate entries, and trains search keyword logic.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleMergeCategoryDuplicates}
            className="px-3.5 py-2.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-700/60 flex items-center gap-1.5 transition cursor-pointer"
            title="Automatically detect and merge categories sharing the same name"
          >
            <Combine className="w-4 h-4 text-emerald-300" />
            Merge Duplicate Categories
          </button>
          <button
            onClick={handleRecalculateCounts}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            Recalculate Counts
          </button>
          <button
            onClick={handleDeleteEmpty}
            className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-bold text-xs rounded-xl border border-rose-800/50 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            Clean Empty AI Subs
          </button>
        </div>
      </div>

      {/* View Switcher & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveView('taxonomy')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-2 ${
              activeView === 'taxonomy' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Taxonomy Hierarchy ({totalSubCount})
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                {pendingCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('merge')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-2 ${
              activeView === 'merge' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Combine className="w-4 h-4 text-emerald-400" />
            Merge Duplicates
          </button>

          <button
            onClick={() => setActiveView('logs')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-2 ${
              activeView === 'logs' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            AI Audit Logs ({logs.length})
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <strong>{aiCreatedCount}</strong> AI Subcategories
          </span>
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <strong>{pendingCount}</strong> Need Review
          </span>
        </div>
      </div>

      {/* VIEW 1: TAXONOMY HIERARCHY */}
      {activeView === 'taxonomy' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search categories, subcategories, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['All', 'Active', 'Pending Approval', 'AiGenerated'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    filterStatus === st
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'Pending Approval' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {st === 'AiGenerated' && <Sparkles className="w-3.5 h-3.5" />}
                  <span>{st === 'AiGenerated' ? 'AI Created' : st}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories & Subcategories List */}
          <div className="space-y-4">
            {categories.map(cat => {
              const catSubs = getSubcategoriesForCategory(cat.name);
              const isExpanded = expandedCats[cat.id] !== false;

              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Category Header Bar */}
                  <div className="bg-slate-50/90 p-4 border-b border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCatExpand(cat.id)}
                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 transition"
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                      <Layers className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900">{cat.name}</h3>
                          <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                            {cat.product_count || 0} Products
                          </span>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {catSubs.length} Subcategories
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {getCategorySeoUrl(cat.name)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCat(cat);
                          setEditCatName(cat.name);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Rename Category
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Table */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Subcategory Name</th>
                            <th className="py-3 px-4">Origin / AI Status</th>
                            <th className="py-3 px-4">Products</th>
                            <th className="py-3 px-4">Keywords & Synonyms</th>
                            <th className="py-3 px-4">SEO Route</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {catSubs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                                No subcategories matching filter under this category.
                              </td>
                            </tr>
                          ) : (
                            catSubs.map(sub => (
                              <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <span>{sub.name}</span>
                                    {sub.status === 'Pending Approval' && (
                                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                        Pending Review
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    {sub.createdByAi ? (
                                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px] flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                        AI Created
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                                        Default System
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    {sub.productCount} Items
                                  </span>
                                </td>

                                <td className="py-3 px-4 max-w-xs">
                                  <div className="flex flex-wrap gap-1">
                                    {(sub.keywords || []).slice(0, 4).map((kw, idx) => (
                                      <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-mono">
                                        {kw}
                                      </span>
                                    ))}
                                    {(sub.keywords || []).length > 4 && (
                                      <span className="text-[10px] text-slate-400 font-bold">
                                        +{sub.keywords.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <span className="font-mono text-[10px] text-slate-500 truncate block max-w-[150px]">
                                    {getSubcategorySeoUrl(cat.name, sub.name)}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {sub.status === 'Pending Approval' && (
                                      <>
                                        <button
                                          onClick={() => handleApproveSub(sub.id)}
                                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                                          title="Approve Subcategory"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleRejectSub(sub.id)}
                                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition"
                                          title="Reject Subcategory"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}

                                    <button
                                      onClick={() => openEditSub(sub)}
                                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                                      title="Edit Keywords & Name"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: MERGE DUPLICATES TOOL */}
      {activeView === 'merge' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Combine className="w-5 h-5 text-emerald-600" />
              Merge Duplicate Subcategories
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Consolidate similar or duplicate subcategories (e.g. "Vein Finders" into "Vein Finder"). All products from the source subcategory will be automatically reassigned to the target subcategory, and search keywords will be merged.
            </p>
          </div>

          {mergeResultMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{mergeResultMsg}</span>
            </div>
          )}

          <form onSubmit={handleExecuteMerge} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">1. Select Source Subcategory (To be merged & removed)</label>
              <select
                required
                value={mergeSourceId}
                onChange={(e) => setMergeSourceId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-600 font-bold"
              >
                <option value="">-- Choose Source Subcategory --</option>
                {subcategories.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.categoryName}] {s.name} ({s.productCount} products)
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center py-2 text-slate-400 font-extrabold uppercase text-[10px]">
              ⬇ Reassign Products & Merge Keywords Into ⬇
            </div>

            <div>
              <label className="block text-slate-700 mb-1">2. Select Target Subcategory (To keep & retain products)</label>
              <select
                required
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-600 font-bold"
              >
                <option value="">-- Choose Target Subcategory --</option>
                {subcategories.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.categoryName}] {s.name} ({s.productCount} products)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
            >
              <Combine className="w-4 h-4" />
              Execute Subcategory Merge
            </button>
          </form>
        </div>
      )}

      {/* VIEW 3: AI AUDIT LOGS */}
      {activeView === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">AI Automatic Categorization Log History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time log of product classification events performed by Gemini Medical AI.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
              {logs.length} Logged Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Assigned Category / Subcategory</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">AI Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No AI categorization logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {log.productName}
                        {log.brand && <span className="text-slate-400 font-normal block text-[10px]">Brand: {log.brand}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{log.category}</span>
                        <span className="text-slate-400 mx-1">➔</span>
                        <span className="text-emerald-700 font-bold">{log.subcategory}</span>
                        {log.isNewSubcategoryCreated && (
                          <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded ml-2">
                            New Sub Created
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          log.confidence >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {log.confidence}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md line-clamp-2">
                        {log.reasoning}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUBCATEGORY & KEYWORDS */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-600" />
                Edit Subcategory &amp; Train Keywords
              </h3>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubEdit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Search Keywords (Comma-separated)</label>
                <textarea
                  rows={3}
                  value={editKeywordsStr}
                  onChange={(e) => setEditKeywordsStr(e.target.value)}
                  placeholder="e.g. vein finder, vein locator, vein scanner, infrared vein finder"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-600 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Products matching any of these keywords will be automatically classified into this subcategory.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Medical Synonyms (Comma-separated)</label>
                <textarea
                  rows={2}
                  value={editSynonymsStr}
                  onChange={(e) => setEditSynonymsStr(e.target.value)}
                  placeholder="e.g. vascular viewer, venipuncture aid"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-600 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md"
                >
                  Save &amp; Train AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENAME CATEGORY */}
      {editingCat && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Rename Category</h3>
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRenameCat} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">New Category Name *</label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow"
                >
                  Rename Global Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
