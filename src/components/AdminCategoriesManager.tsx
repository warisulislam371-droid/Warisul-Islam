import React, { useState, useEffect } from 'react';
import { Category, Brand, CategoryRequest, BrandRequest } from '../types';
import { dbLocal } from '../db';
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
  AlertCircle
} from 'lucide-react';

interface AdminCategoriesManagerProps {
  onRefresh?: () => void;
}

export default function AdminCategoriesManager({ onRefresh }: AdminCategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [catRequests, setCatRequests] = useState<CategoryRequest[]>([]);
  const [brandRequests, setBrandRequests] = useState<BrandRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'categories' | 'brands'>('requests');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Category / Brand direct creation states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('India');

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
      isActive: true,
      createdAt: new Date().toISOString()
    };
    dbLocal.saveCategories([...existing, newCat]);
    setNewCatName('');
    setNewCatDesc('');
    showToast(`Category "${newCat.name}" created and synced globally.`);
    loadData();
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
      isActive: true,
      createdAt: new Date().toISOString()
    };
    dbLocal.saveBrands([...existing, newBrand]);
    setNewBrandName('');
    setNewBrandCountry('India');
    showToast(`Brand "${newBrand.name}" created and synced globally.`);
    loadData();
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`Remove category "${name}"?`)) {
      dbLocal.saveCategories(categories.filter(c => c.id !== id));
      showToast(`Removed category "${name}".`);
      loadData();
    }
  };

  const handleDeleteBrand = (id: string, name: string) => {
    if (confirm(`Remove brand "${name}"?`)) {
      dbLocal.saveBrands(brands.filter(b => b.id !== id));
      showToast(`Removed brand "${name}".`);
      loadData();
    }
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
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Active Categories ({categories.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {categories.map(c => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{c.name}</h4>
                    {c.description && <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{b.name}</h4>
                    {b.country && <p className="text-[11px] text-slate-500 mt-0.5">Country: <strong className="text-slate-700">{b.country}</strong></p>}
                  </div>
                  <button
                    onClick={() => handleDeleteBrand(b.id, b.name)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
