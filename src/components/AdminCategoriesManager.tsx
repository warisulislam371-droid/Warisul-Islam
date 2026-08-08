import React, { useState, useEffect } from 'react';
import { Category, Brand, CategoryRequest, BrandRequest } from '../types';
import { dbLocal } from '../db';
import { autoSortAndClassifyProducts, sortCategoriesTaxonomy } from '../utils/categorySorter';
import { GeminiCategoryAuditModal } from './GeminiCategoryAuditModal';
import { AICategoryManager } from './AICategoryManager';
import {
  Tag,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  Sparkles,
  Layers,
  Globe,
  Check,
  Search,
  Box,
  AlertCircle,
  FolderTree,
  Wand2,
  ArrowUpDown,
  Upload
} from 'lucide-react';

interface AdminCategoriesManagerProps {
  onRefresh?: () => void;
}

export default function AdminCategoriesManager({ onRefresh }: AdminCategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [catRequests, setCatRequests] = useState<CategoryRequest[]>([]);
  const [brandRequests, setBrandRequests] = useState<BrandRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'categories' | 'brands' | 'ai_subcategories'>('requests');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Category / Brand direct creation states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatImage, setEditingCatImage] = useState('');

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('India');
  const [newBrandLogo, setNewBrandLogo] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');

  // Modals for editing category / brand
  const [editingCatModal, setEditingCatModal] = useState<Category | null>(null);
  const [editingBrandModal, setEditingBrandModal] = useState<Brand | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const loadData = () => {
    setCategories(dbLocal.getCategories());
    setBrands(dbLocal.getBrands());
    setCatRequests(dbLocal.getCategoryRequests());
    setBrandRequests(dbLocal.getBrandRequests());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('healnex_db_update', loadData);
    return () => window.removeEventListener('healnex_db_update', loadData);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Approve Category Request
  const handleApproveCatReq = (req: CategoryRequest) => {
    // 1. Update request status
    const allReqs = dbLocal.getCategoryRequests().map(r => r.id === req.id ? { ...r, status: 'Approved' as const } : r);
    dbLocal.saveCategoryRequests(allReqs);

    // 2. Check if category already exists
    const existingCats = dbLocal.getCategories();
    const exists = existingCats.some(c => c.name.toLowerCase().trim() === req.categoryName.toLowerCase().trim());
    if (!exists) {
      const newCat: Category = {
        id: `cat_${Date.now()}`,
        name: req.categoryName.trim(),
        description: req.description || 'Verified Medical Equipment Category',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      dbLocal.saveCategories([...existingCats, newCat]);
    }

    showToast(`Approved Category "${req.categoryName}". It is now live in all vendor dropdowns!`);
    loadData();
    if (onRefresh) onRefresh();
  };

  // Reject Category Request
  const handleRejectCatReq = (req: CategoryRequest) => {
    const allReqs = dbLocal.getCategoryRequests().map(r => r.id === req.id ? { ...r, status: 'Rejected' as const } : r);
    dbLocal.saveCategoryRequests(allReqs);
    showToast(`Rejected category request "${req.categoryName}".`);
    loadData();
  };

  // Approve Brand Request
  const handleApproveBrandReq = (req: BrandRequest) => {
    const allReqs = dbLocal.getBrandRequests().map(r => r.id === req.id ? { ...r, status: 'Approved' as const } : r);
    dbLocal.saveBrandRequests(allReqs);

    const existingBrands = dbLocal.getBrands();
    const exists = existingBrands.some(b => b.name.toLowerCase().trim() === req.brandName.toLowerCase().trim());
    if (!exists) {
      const newBrand: Brand = {
        id: `brand_${Date.now()}`,
        name: req.brandName.trim(),
        country: req.country || 'India',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      dbLocal.saveBrands([...existingBrands, newBrand]);
    }

    showToast(`Approved Brand "${req.brandName}". It is now immediately available to all vendors!`);
    loadData();
    if (onRefresh) onRefresh();
  };

  // Reject Brand Request
  const handleRejectBrandReq = (req: BrandRequest) => {
    const allReqs = dbLocal.getBrandRequests().map(r => r.id === req.id ? { ...r, status: 'Rejected' as const } : r);
    dbLocal.saveBrandRequests(allReqs);
    showToast(`Rejected brand request "${req.brandName}".`);
    loadData();
  };

  // Direct Create Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const existing = dbLocal.getCategories();
    if (existing.some(c => c.name.toLowerCase() === newCatName.toLowerCase())) {
      showToast('Category already exists!');
      return;
    }
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      description: newCatDesc.trim(),
      image: newCatImage.trim() || undefined,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    dbLocal.saveCategories([...existing, newCat]);
    setNewCatName('');
    setNewCatDesc('');
    setNewCatImage('');
    showToast(`Category "${newCat.name}" created and synced globally.`);
    loadData();
  };

  const handleSaveCatImage = (catId: string) => {
    const existing = dbLocal.getCategories();
    const updated = existing.map(c => c.id === catId ? { ...c, image: editingCatImage.trim() } : c);
    dbLocal.saveCategories(updated);
    showToast('Category image updated successfully!');
    setEditingCatId(null);
    setEditingCatImage('');
    loadData();
  };

  const handleSaveCategoryModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatModal) return;
    const existing = dbLocal.getCategories();
    const updated = existing.map(c => c.id === editingCatModal.id ? editingCatModal : c);
    dbLocal.saveCategories(updated);
    showToast(`Category "${editingCatModal.name}" updated successfully.`);
    setEditingCatModal(null);
    loadData();
  };

  const handleMergeDuplicates = () => {
    const res = dbLocal.autoAuditAndRepairCategories();
    let msg = `Category Audit Complete: ${res.totalCategories} active clean categories.`;
    if (res.mergedDuplicates > 0) msg += ` Merged ${res.mergedDuplicates} duplicates.`;
    if (res.fixedProductsCount > 0) msg += ` Auto-categorized ${res.fixedProductsCount} products.`;
    if (res.subcategoriesAdded > 0) msg += ` Synced ${res.subcategoriesAdded} subcategories.`;
    showToast(msg);
    loadData();
    if (onRefresh) onRefresh();
  };

  // Direct Create Brand
  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const existing = dbLocal.getBrands();
    if (existing.some(b => b.name.toLowerCase() === newBrandName.toLowerCase())) {
      showToast('Brand already exists!');
      return;
    }
    const newBrand: Brand = {
      id: `brand_${Date.now()}`,
      name: newBrandName.trim(),
      country: newBrandCountry.trim() || 'India',
      logo: newBrandLogo.trim() || undefined,
      description: newBrandDesc.trim() || undefined,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    dbLocal.saveBrands([...existing, newBrand]);
    setNewBrandName('');
    setNewBrandCountry('India');
    setNewBrandLogo('');
    setNewBrandDesc('');
    showToast(`Brand "${newBrand.name}" created and synced globally.`);
    loadData();
  };

  const handleSaveBrandModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrandModal) return;
    const existing = dbLocal.getBrands();
    const updated = existing.map(b => b.id === editingBrandModal.id ? editingBrandModal : b);
    dbLocal.saveBrands(updated);
    showToast(`Brand "${editingBrandModal.name}" updated successfully.`);
    setEditingBrandModal(null);
    loadData();
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`Remove category "${name}"?`)) {
      dbLocal.removeCategory(id);
      dbLocal.removeCategory(name);
      showToast(`Removed category "${name}".`);
      loadData();
      if (onRefresh) onRefresh();
    }
  };

  const handleDeleteBrand = (id: string, name: string) => {
    if (confirm(`Remove brand "${name}"?`)) {
      dbLocal.saveBrands(brands.filter(b => b.id !== id));
      showToast(`Removed brand "${name}".`);
      loadData();
    }
  };

  const handleAutoSortProducts = () => {
    const currentProds = dbLocal.getProducts();
    const currentCats = dbLocal.getCategories();
    const { updatedProducts, autoFixedCount } = autoSortAndClassifyProducts(currentProds, currentCats);
    dbLocal.saveProducts(updatedProducts);
    showToast(`⚡ Auto-sorted catalog! ${autoFixedCount} products auto-assigned to matching category & subcategory.`);
    loadData();
    if (onRefresh) onRefresh();
  };

  const handleAutoSortCategories = () => {
    const sorted = sortCategoriesTaxonomy(categories);
    dbLocal.saveCategories(sorted);
    showToast('✨ Categories and subcategories taxonomy sorted alphabetically!');
    loadData();
  };

  const pendingCatCount = catRequests.filter(r => r.status === 'Pending').length;
  const pendingBrandCount = brandRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-up">
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-2xl shadow-md shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">Categories & Brands Global Governance</h2>
              <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                Live Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Review vendor requests for new medical classifications & brands. Approved items populate instantly in vendor dropdowns without code changes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === 'requests' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Vendor Requests</span>
            {(pendingCatCount + pendingBrandCount) > 0 && (
              <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[10px] animate-pulse">
                {pendingCatCount + pendingBrandCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'categories' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'brands' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Brands ({brands.length})
          </button>
          <button
            onClick={() => setActiveTab('ai_subcategories')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'ai_subcategories' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Subcategories Engine
          </button>
        </div>
      </div>

      {/* Auto-Sort Quick Action Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-4 px-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-teal-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-400 text-slate-900 rounded-xl font-bold">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">Intelligent Catalog Taxonomy Engine</h3>
            <p className="text-[11px] text-teal-100 font-medium mt-0.5">
              Auto-classify uncategorized products and sort categories &amp; subcategories into clean medical hierarchies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer tracking-wider animate-pulse border border-amber-300"
          >
            <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>Gemini AI Category Audit</span>
          </button>
          <button
            type="button"
            onClick={handleAutoSortCategories}
            className="px-3.5 py-2 bg-teal-800/80 hover:bg-teal-700 text-white font-bold text-xs rounded-xl border border-teal-600/50 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-amber-300" />
            Sort Categories
          </button>
          <button
            type="button"
            onClick={handleAutoSortProducts}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-100 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider border border-slate-700"
          >
            <Wand2 className="w-4 h-4 text-amber-300" />
            Auto-Sort All Products
          </button>
        </div>
      </div>

      {/* Tab 1: Requests */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Category Requests Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-extrabold text-slate-900">Pending Category Requests</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
                {catRequests.length} Total
              </span>
            </div>

            {catRequests.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No pending category requests.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {catRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1 ${
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">{req.categoryName}</h4>
                        {req.description && <p className="text-xs text-slate-600 mt-0.5">{req.description}</p>}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-200/60 pt-2">
                      <span>Requested by: <strong className="text-slate-700">{req.vendorName}</strong></span>
                      <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleApproveCatReq(req)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve & Live Sync
                        </button>
                        <button
                          onClick={() => handleRejectCatReq(req)}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs px-3.5 py-2 rounded-xl transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Brand Requests Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-extrabold text-slate-900">Pending Brand Requests</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
                {brandRequests.length} Total
              </span>
            </div>

            {brandRequests.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No pending brand requests.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {brandRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1 ${
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">{req.brandName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Country: <strong className="text-slate-700">{req.country || 'India'}</strong></p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-200/60 pt-2">
                      <span>Requested by: <strong className="text-slate-700">{req.vendorName}</strong></span>
                      <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleApproveBrandReq(req)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve & Live Sync
                        </button>
                        <button
                          onClick={() => handleRejectBrandReq(req)}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs px-3.5 py-2 rounded-xl transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: All Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create New Category Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Add Global Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICU Ventilation Equipment"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Clinical classification scope..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Category Image URL or Upload</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-700 font-mono"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (reader.result) setNewCatImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {newCatImage && (
                  <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                    <img src={newCatImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl shadow-md transition"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-900">Active Categories ({categories.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMergeDuplicates}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-emerald-200/80 shadow-2xs"
                  title="Find and merge duplicate categories with identical names"
                >
                  <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
                  Merge Duplicate Categories
                </button>

                {categories.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to remove ALL categories from the marketplace? This action cannot be undone.')) {
                        dbLocal.clearAllCategories();
                        showToast('Successfully removed all categories from marketplace.');
                        loadData();
                        if (onRefresh) onRefresh();
                      }
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-800 font-extrabold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-rose-200/80 shadow-2xs cursor-pointer"
                    title="Remove all categories from marketplace"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Wipe All Categories ({categories.length})
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {categories.map(c => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">{c.name}</h4>
                        {c.description && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{c.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingCatModal(c)}
                        className="text-slate-500 hover:text-teal-700 p-1.5 rounded-lg hover:bg-teal-50 transition shrink-0"
                        title="Edit Category Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition shrink-0"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Image Edit Section */}
                  {editingCatId === c.id ? (
                    <div className="mt-2 p-2 bg-white rounded-xl border border-teal-300 space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Update Category Image</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Image URL or Base64"
                          value={editingCatImage}
                          onChange={(e) => setEditingCatImage(e.target.value)}
                          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono outline-none focus:border-teal-600"
                        />
                        <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0">
                          File
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (reader.result) setEditingCatImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => { setEditingCatId(null); setEditingCatImage(''); }}
                          className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveCatImage(c.id)}
                          className="px-3 py-1 text-xs font-bold bg-teal-700 text-white rounded-lg hover:bg-teal-800"
                        >
                          Save Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-1 border-t border-slate-200/60">
                      <button
                        onClick={() => {
                          setEditingCatId(c.id);
                          setEditingCatImage(c.image || '');
                        }}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        {c.image ? 'Change Category Image' : '+ Add Category Image'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: All Brands */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create New Brand Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Add Global Brand</h3>
            <form onSubmit={handleCreateBrand} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Philips Healthcare"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Country of Origin</label>
                <input
                  type="text"
                  placeholder="e.g. Netherlands / India"
                  value={newBrandCountry}
                  onChange={(e) => setNewBrandCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Clinical imaging & diagnostic tools..."
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Brand Logo (File Upload or URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... or upload logo"
                    value={newBrandLogo}
                    onChange={(e) => setNewBrandLogo(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-700 font-mono"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (reader.result) setNewBrandLogo(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {newBrandLogo && (
                  <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white p-1">
                    <img src={newBrandLogo} alt="Logo Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl shadow-md transition"
              >
                Create Brand
              </button>
            </form>
          </div>

          {/* Brands List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Active Brands ({brands.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {brands.map(b => (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {b.logo ? (
                        <img src={b.logo} alt={b.name} className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {b.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">{b.name}</h4>
                        {b.country && <p className="text-[11px] text-slate-500 mt-0.5">Country: <strong className="text-slate-700">{b.country}</strong></p>}
                        {b.description && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{b.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingBrandModal(b)}
                        className="text-slate-500 hover:text-teal-700 p-1.5 rounded-lg hover:bg-teal-50 transition shrink-0"
                        title="Edit Brand"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(b.id, b.name)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition shrink-0"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => setEditingBrandModal(b)}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit Brand &amp; Logo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI Subcategories Engine */}
      {activeTab === 'ai_subcategories' && (
        <AICategoryManager onRefresh={onRefresh} />
      )}

      {/* Modal: Edit Category */}
      {editingCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 font-sans animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-teal-600" />
                Edit Category: {editingCatModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCatModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategoryModal} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCatModal.name}
                  onChange={(e) => setEditingCatModal({ ...editingCatModal, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingCatModal.description || ''}
                  onChange={(e) => setEditingCatModal({ ...editingCatModal, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Category Image (Upload or URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingCatModal.image || ''}
                    onChange={(e) => setEditingCatModal({ ...editingCatModal, image: e.target.value })}
                    placeholder="https://... or upload file"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-700 font-mono"
                  />
                  <label className="bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0 shadow-sm">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (reader.result) {
                              setEditingCatModal({ ...editingCatModal, image: reader.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {editingCatModal.image && (
                  <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={editingCatModal.image} alt="Category Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCatModal(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-xl shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Brand */}
      {editingBrandModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 font-sans animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-teal-600" />
                Edit Brand: {editingBrandModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBrandModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBrandModal} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={editingBrandModal.name}
                  onChange={(e) => setEditingBrandModal({ ...editingBrandModal, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Country of Origin</label>
                <input
                  type="text"
                  value={editingBrandModal.country || ''}
                  onChange={(e) => setEditingBrandModal({ ...editingBrandModal, country: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingBrandModal.description || ''}
                  onChange={(e) => setEditingBrandModal({ ...editingBrandModal, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Brand Logo (Upload or URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingBrandModal.logo || ''}
                    onChange={(e) => setEditingBrandModal({ ...editingBrandModal, logo: e.target.value })}
                    placeholder="https://... or upload logo image"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-700 font-mono"
                  />
                  <label className="bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0 shadow-sm">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (reader.result) {
                              setEditingBrandModal({ ...editingBrandModal, logo: reader.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {editingBrandModal.logo && (
                  <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white p-1">
                    <img src={editingBrandModal.logo} alt="Brand Logo Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBrandModal(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-xl shadow-md"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gemini Category Audit Modal */}
      <GeminiCategoryAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        onAuditCompleted={loadData}
      />

    </div>
  );
}
