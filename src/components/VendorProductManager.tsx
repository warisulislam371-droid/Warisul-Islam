import React, { useState, useEffect } from 'react';
import { Product, Vendor, Category, Brand, CategoryRequest, BrandRequest, ProductSpecification, User } from '../types';
import { dbLocal } from '../db';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit,
  Trash2,
  Copy,
  BarChart2,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Upload,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  Download,
  AlertTriangle,
  ChevronRight,
  Eye,
  ShoppingBag,
  TrendingUp,
  Tag,
  Box,
  Globe
} from 'lucide-react';

interface VendorProductManagerProps {
  currentUser: User;
  vendor: Vendor;
  products: Product[];
  onRefresh: () => void;
}

export default function VendorProductManager({
  currentUser,
  vendor,
  products,
  onRefresh
}: VendorProductManagerProps) {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  
  // Filtering & Search
  const [activeTab, setActiveTab] = useState<'All' | 'Approved' | 'Pending' | 'Draft' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryRequestModal, setShowCategoryRequestModal] = useState(false);
  const [showBrandRequestModal, setShowBrandRequestModal] = useState(false);
  const [analyticsModalProduct, setAnalyticsModalProduct] = useState<Product | null>(null);

  // New Category / Brand Request Form State
  const [reqCatName, setReqCatName] = useState('');
  const [reqCatDesc, setReqCatDesc] = useState('');
  const [reqBrandName, setReqBrandName] = useState('');
  const [reqBrandCountry, setReqBrandCountry] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Product Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formFullDesc, setFormFullDesc] = useState('');
  const [formMrp, setFormMrp] = useState<number>(0);
  const [formSalePrice, setFormSalePrice] = useState<number>(0);
  const [formWholesalePrice, setFormWholesalePrice] = useState<number>(0);
  const [formVendorPrice, setFormVendorPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(10);
  const [formMoq, setFormMoq] = useState<number>(1);
  const [formHsn, setFormHsn] = useState('9018');
  const [formGst, setFormGst] = useState<number>(12);
  const [formWarranty, setFormWarranty] = useState('1 Year Manufacturer Warranty');
  const [formCountry, setFormCountry] = useState('India');
  const [formUnit, setFormUnit] = useState('Piece');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formNewImageUrl, setFormNewImageUrl] = useState('');
  const [formBrochure, setFormBrochure] = useState('');
  const [formVideo, setFormVideo] = useState('');
  const [formCertifications, setFormCertifications] = useState<string[]>([]);
  const [formSpecs, setFormSpecs] = useState<ProductSpecification[]>([
    { key: 'Operating Power', value: '220V AC / 50Hz' },
    { key: 'Classification', value: 'Class IIa Medical Device' }
  ]);
  const [formError, setFormError] = useState('');

  const certOptions = ['CE Certified', 'FDA Approved', 'ISO 13485:2016', 'CDSCO Approved', 'BIS Certified', 'RoHS Compliant'];

  const loadDynamicData = () => {
    const cats = dbLocal.getCategories().filter(c => c.isActive !== false);
    const brds = dbLocal.getBrands().filter(b => b.isActive !== false);
    setCategories(cats);
    setBrands(brds);
  };

  useEffect(() => {
    loadDynamicData();
    window.addEventListener('healnex_db_update', loadDynamicData);
    return () => window.removeEventListener('healnex_db_update', loadDynamicData);
  }, []);

  const currentCommRate = dbLocal.getProductCommissionRate(vendor.id, formCategory, formBrand);
  const calculatedCommAmt = Math.round((formVendorPrice * currentCommRate) / 100);
  const calculatedCustPrice = formVendorPrice + calculatedCommAmt;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    if (activeTab !== 'All' && p.status !== activeTab) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterBrand && p.brand !== filterBrand) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.modelNumber && p.modelNumber.toLowerCase().includes(q))
      );
      if (!match) return false;
    }
    return true;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormModel(`MOD-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormBrand(brands[0]?.name || '');
    setFormCategory(categories[0]?.name || '');
    setFormSubcategory('Diagnostic & Critical Care');
    setFormShortDesc('');
    setFormFullDesc('');
    setFormMrp(15000);
    setFormSalePrice(12500);
    setFormWholesalePrice(11000);
    setFormVendorPrice(10000);
    setFormStock(25);
    setFormMoq(1);
    setFormHsn('9018');
    setFormGst(12);
    setFormWarranty('1 Year Comprehensive Warranty');
    setFormCountry('India');
    setFormUnit('Piece');
    setFormImages(['https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800']);
    setFormBrochure('');
    setFormVideo('');
    setFormCertifications(['ISO 13485:2016', 'CE Certified']);
    setFormSpecs([
      { key: 'Power Supply', value: '220V - 240V AC' },
      { key: 'Safety Standard', value: 'IEC 60601-1 Compliant' }
    ]);
    setFormError('');
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name || '');
    setFormSku(p.sku || '');
    setFormModel(p.modelNumber || '');
    setFormBrand(p.brand || '');
    setFormCategory(p.category || '');
    setFormSubcategory(p.subcategory || '');
    setFormShortDesc(p.shortDescription || p.description || '');
    setFormFullDesc(p.fullDescription || p.description || '');
    setFormMrp(p.mrp || p.price * 1.2 || 0);
    setFormSalePrice(p.salePrice || p.price || 0);
    setFormWholesalePrice(p.wholesalePrice || p.salePrice * 0.9 || 0);
    setFormVendorPrice(p.vendorPrice || p.price || 0);
    setFormStock(p.stockQuantity !== undefined ? p.stockQuantity : 10);
    setFormMoq(p.moq || 1);
    setFormHsn(p.hsnCode || '9018');
    setFormGst(p.gstRate || 12);
    setFormWarranty(p.warranty || '1 Year');
    setFormCountry(p.countryOfOrigin || 'India');
    setFormUnit(p.unit || 'Piece');
    setFormImages(p.images?.length ? p.images : ['https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800']);
    setFormBrochure(p.brochureUrl || '');
    setFormVideo(p.videoUrl || '');
    setFormCertifications(p.certifications || []);
    setFormSpecs(p.specifications && p.specifications.length > 0 ? p.specifications : [{ key: 'Specification', value: 'Standard Medical Specification' }]);
    setFormError('');
    setShowProductModal(true);
  };

  const handleSaveProduct = (targetStatus: 'Draft' | 'Pending') => {
    setFormError('');
    if (!formName.trim() || !formSku.trim() || !formCategory || !formBrand) {
      setFormError('Please fill out Product Name, SKU, Category, and Brand.');
      return;
    }

    if (formSalePrice <= 0) {
      setFormError('Sale price must be greater than zero.');
      return;
    }

    // SKU uniqueness check
    const allExisting = dbLocal.getProducts();
    const duplicateSku = allExisting.find(p => 
      p.sku.toLowerCase().trim() === formSku.toLowerCase().trim() &&
      (!editingProduct || p.id !== editingProduct.id)
    );
    if (duplicateSku) {
      setFormError(`Error: SKU "${formSku}" is already used by another product (${duplicateSku.name}). SKUs must be unique across the catalog.`);
      return;
    }

    // Model number uniqueness check
    if (formModel.trim()) {
      const duplicateModel = allExisting.find(p => 
        p.modelNumber && p.modelNumber.toLowerCase().trim() === formModel.toLowerCase().trim() &&
        p.vendorId === vendor.id &&
        (!editingProduct || p.id !== editingProduct.id)
      );
      if (duplicateModel) {
        setFormError(`Notice: Model Number "${formModel}" already exists in your inventory under "${duplicateModel.name}". Please ensure Model Numbers are distinct.`);
        return;
      }
    }

    const now = new Date().toISOString();
    const commissionPercent = dbLocal.getProductCommissionRate(vendor.id, formCategory, formBrand);
    const commissionAmount = Math.round((formVendorPrice * commissionPercent) / 100);
    const customerPrice = formVendorPrice + commissionAmount;

    const updatedProd: Product = {
      id: editingProduct ? editingProduct.id : `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      vendorId: vendor.id,
      vendorName: vendor.companyName,
      name: formName.trim(),
      sku: formSku.trim(),
      modelNumber: formModel.trim(),
      brand: formBrand,
      category: formCategory,
      subcategory: formSubcategory || formCategory,
      description: formShortDesc.trim() || formName.trim(),
      shortDescription: formShortDesc.trim(),
      fullDescription: formFullDesc.trim() || formShortDesc.trim(),
      vendorPrice: formVendorPrice,
      commissionPercent: commissionPercent,
      commissionAmount: commissionAmount,
      customerPrice: customerPrice,
      price: customerPrice,
      mrp: Math.round(customerPrice * 1.2),
      salePrice: customerPrice,
      wholesalePrice: customerPrice,
      moq: formMoq || 1,
      stockQuantity: formStock,
      hsnCode: formHsn.trim(),
      gstRate: formGst,
      warranty: formWarranty.trim(),
      countryOfOrigin: formCountry.trim(),
      unit: formUnit,
      images: formImages.length > 0 ? formImages : ['https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800'],
      brochureUrl: formBrochure.trim(),
      videoUrl: formVideo.trim(),
      certifications: formCertifications,
      specifications: formSpecs.filter(s => s.key.trim() && s.value.trim()),
      
      // Default / secure workflow values
      status: targetStatus === 'Draft' ? 'Draft' : 'Pending',
      published: false,
      isActive: false,
      approvedBy: '',
      approvedAt: null,
      publishedAt: null,
      rejectedAt: null,
      rejectReason: '',
      rejectionReason: '',

      createdAt: editingProduct ? editingProduct.createdAt : now,
      updatedAt: now,
      performance: editingProduct?.performance || { views: Math.floor(Math.random() * 40), inquiries: Math.floor(Math.random() * 5), sales: 0 }
    };

    if (editingProduct) {
      dbLocal.updateProduct(updatedProd.id, updatedProd);
      if (updatedProd.status === 'Pending') {
        dbLocal.addNotification(
          'admin',
          `Product Resubmitted: ${updatedProd.name}`,
          `Vendor "${vendor.companyName}" has resubmitted their product "${updatedProd.name}" (SKU: ${updatedProd.sku}) with requested updates for audit.`,
          'info'
        );
        dbLocal.addNotification(
          vendor.id,
          `Product Resubmitted: ${updatedProd.name}`,
          `Your product "${updatedProd.name}" has been resubmitted for Admin review.`,
          'info'
        );
      }
      showToast(targetStatus === 'Draft' ? 'Product saved as Draft.' : 'Product resubmitted for Admin quality audit!');
    } else {
      dbLocal.addProduct(updatedProd);
      if (updatedProd.status === 'Pending') {
        dbLocal.addNotification(
          'admin',
          `New Product Uploaded: ${updatedProd.name}`,
          `Vendor "${vendor.companyName}" uploaded a new product "${updatedProd.name}" (SKU: ${updatedProd.sku}) for approval.`,
          'info'
        );
        dbLocal.addNotification(
          vendor.id,
          `Product Submitted: ${updatedProd.name}`,
          `Your product "${updatedProd.name}" has been successfully uploaded and is awaiting Admin review.`,
          'info'
        );
      }
      showToast(targetStatus === 'Draft' ? 'New draft product created.' : 'New product submitted for Admin approval!');
    }

    setShowProductModal(false);
    onRefresh();
  };

  const handleDuplicateProduct = (p: Product) => {
    const duplicated: Product = {
      ...p,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${p.name} (Copy)`,
      sku: `${p.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      performance: { views: 0, inquiries: 0, sales: 0 }
    };
    dbLocal.addProduct(duplicated);
    showToast(`Duplicated "${p.name}" as Draft.`);
    onRefresh();
  };

  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Are you sure you want to remove "${p.name}" (${p.sku})?`)) {
      dbLocal.deleteProduct(p.id);
      showToast(`Deleted product: ${p.name}`);
      onRefresh();
    }
  };

  const handleAddImage = () => {
    if (formNewImageUrl.trim() && !formImages.includes(formNewImageUrl.trim())) {
      setFormImages([...formImages, formNewImageUrl.trim()]);
      setFormNewImageUrl('');
    }
  };


  const handleSubmitCategoryRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqCatName.trim()) return;
    const newReq: CategoryRequest = {
      id: `catreq_${Date.now()}`,
      categoryName: reqCatName.trim(),
      description: reqCatDesc.trim(),
      vendorId: vendor.id,
      vendorName: vendor.companyName,
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };
    dbLocal.addCategoryRequest(newReq);
    showToast(`Category request "${reqCatName}" submitted! Admin will audit & approve soon.`);
    setReqCatName('');
    setReqCatDesc('');
    setShowCategoryRequestModal(false);
  };

  const handleSubmitBrandRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqBrandName.trim()) return;
    const newReq: BrandRequest = {
      id: `brandreq_${Date.now()}`,
      brandName: reqBrandName.trim(),
      country: reqBrandCountry.trim() || 'India',
      vendorId: vendor.id,
      vendorName: vendor.companyName,
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };
    dbLocal.addBrandRequest(newReq);
    showToast(`Brand request "${reqBrandName}" submitted to Admin for approval.`);
    setReqBrandName('');
    setReqBrandCountry('');
    setShowBrandRequestModal(false);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Name', 'SKU', 'Model Number', 'Category', 'Brand', 'MSRP', 'Sale Price', 'Stock Quantity', 'MOQ', 'Status', 'Views', 'Inquiries'];
    const rows = filteredProducts.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.modelNumber || '',
      p.category,
      p.brand,
      p.mrp || p.price,
      p.salePrice,
      p.stockQuantity,
      p.moq,
      p.status,
      p.performance?.views || 0,
      p.performance?.inquiries || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `healnex_vendor_products_${vendor.companyName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported product catalog to CSV.');
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-up">
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl shadow-md shrink-0">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">Dynamic Vendor Product Management</h2>
              <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Manage clinical equipment, audit statuses, prices, bulk MOQ tiers, and request new medical categories & brands.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowCategoryRequestModal(true)}
            className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs px-3.5 py-2.5 rounded-xl transition border border-teal-200 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Request Category
          </button>
          <button
            onClick={() => setShowBrandRequestModal(true)}
            className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs px-3.5 py-2.5 rounded-xl transition border border-teal-200 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Request Brand
          </button>
          <button
            onClick={openAddModal}
            className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Tabs & Search / Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
            {(['All', 'Approved', 'Pending', 'Draft', 'Rejected'] as const).map(tab => {
              const count = tab === 'All' 
                ? products.length 
                : products.filter(p => p.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeTab === tab
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab === 'Pending' ? 'Pending Approval' : tab}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    activeTab === tab ? 'bg-slate-800 text-teal-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Name, SKU, Model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl pl-9 pr-4 py-2 outline-none focus:border-teal-700 w-52 sm:w-64 transition"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none text-slate-700 focus:border-teal-700"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none text-slate-700 focus:border-teal-700"
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>

            {(filterCategory || filterBrand || searchQuery) && (
              <button
                onClick={() => { setFilterCategory(''); setFilterBrand(''); setSearchQuery(''); }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Product Catalog Cards / Table */}
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Box className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">No products match your active search or filters.</p>
            <p className="text-[11px] text-slate-400 mt-1">Try resetting filters or click "Add New Product" to register medical equipment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map(p => {
              const isApproved = p.status === 'Approved';
              const isPending = p.status === 'Pending';
              const isDraft = p.status === 'Draft';
              const isRejected = p.status === 'Rejected';
              const isChangesRequested = p.status === 'ChangesRequested';
              const isInactive = p.status === 'Inactive';

              let badgeBg = 'bg-slate-100 border-slate-200 text-slate-700';
              let badgeLabel: string = p.status || 'Draft';
              let BadgeIcon = Clock;

              if (isApproved) {
                badgeBg = p.published ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700';
                badgeLabel = p.published ? 'Approved & Live' : 'Approved (Awaiting Publish)';
                BadgeIcon = CheckCircle;
              } else if (isPending) {
                badgeBg = 'bg-amber-50 border-amber-200 text-amber-700';
                badgeLabel = 'Pending Audit';
                BadgeIcon = Clock;
              } else if (isChangesRequested) {
                badgeBg = 'bg-amber-50 border-amber-200 text-amber-700';
                badgeLabel = 'Changes Requested';
                BadgeIcon = AlertTriangle;
              } else if (isRejected) {
                badgeBg = 'bg-rose-50 border-rose-200 text-rose-700';
                badgeLabel = 'Rejected';
                BadgeIcon = AlertTriangle;
              } else if (isDraft) {
                badgeBg = 'bg-slate-100 border-slate-200 text-slate-700';
                badgeLabel = 'Draft Mode';
                BadgeIcon = FileText;
              } else if (isInactive) {
                badgeBg = 'bg-gray-100 border-gray-200 text-gray-600';
                badgeLabel = 'Inactive';
                BadgeIcon = X;
              }

              return (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden">
                  
                  {/* Rejection Alert Banner */}
                  {isRejected && (
                    <div className="bg-rose-50 border-b border-rose-100 p-3 flex items-start justify-between gap-2 text-rose-800 text-xs">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold block">Quality Audit Rejection:</span>
                          <span className="text-[11px] leading-tight">{p.rejectionReason || p.rejectReason || 'Specifications or regulatory certifications incomplete.'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openEditModal(p)}
                        className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shrink-0 hover:bg-rose-700"
                      >
                        Resubmit
                      </button>
                    </div>
                  )}

                  {/* Changes Requested Banner */}
                  {isChangesRequested && (
                    <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-start justify-between gap-2 text-amber-800 text-xs">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold block">Admin requested changes:</span>
                          <span className="text-[11px] leading-tight">{p.rejectReason || p.rejectionReason || 'Please review item specifications, category mapping, or pricing details.'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openEditModal(p)}
                        className="bg-amber-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shrink-0 hover:bg-amber-700"
                      >
                        Edit & Fix
                      </button>
                    </div>
                  )}

                  <div className="p-4 flex gap-3.5 items-start flex-1 border-b border-slate-100">
                    <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center relative">
                      <img
                        src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1516549655169-df83a0774514'}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-mono px-1 rounded">
                        ₹{(p.salePrice / 1000).toFixed(0)}k
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badgeLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">{p.sku}</span>
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900 mt-1.5 truncate group-hover:text-teal-700">{p.name}</h4>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">{p.category}</span>
                        <span>•</span>
                        <span className="font-semibold text-teal-800">{p.brand}</span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs border-b border-dashed border-slate-100 pb-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Stock Level</span>
                          <span className="font-bold text-slate-700">{p.stockQuantity !== undefined ? p.stockQuantity : 10} units</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Min Order (MOQ)</span>
                          <span className="font-bold text-slate-700">{p.moq || 1} qty</span>
                        </div>
                      </div>

                      {/* Commission & Earning breakdown */}
                      <div className="mt-3 bg-slate-50/80 rounded-xl p-2.5 text-[11px] grid grid-cols-2 gap-x-3 gap-y-1.5 border border-slate-200/50">
                        <div>
                          <span className="text-slate-400 block text-[9px] font-medium uppercase tracking-wider">Your Price (Earnings)</span>
                          <span className="font-extrabold text-teal-700 text-xs">₹{(p.vendorPrice ?? p.salePrice).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[9px] font-medium uppercase tracking-wider">Customer Price</span>
                          <span className="font-extrabold text-blue-700 text-xs">₹{(p.customerPrice ?? p.salePrice).toLocaleString()}</span>
                        </div>
                        <div className="col-span-2 border-t border-slate-200/50 pt-1.5 flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-medium">Commission ({p.commissionPercent ?? 7}%)</span>
                          <span className="font-bold text-slate-700">₹{(p.commissionAmount ?? Math.round((p.vendorPrice ?? p.salePrice) * 0.07)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Controls & Analytics */}
                  <div className="bg-slate-50/70 p-3 px-4 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => setAnalyticsModalProduct(p)}
                      className="text-slate-600 hover:text-teal-700 font-bold flex items-center gap-1.5"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{p.performance?.views || 14} Views</span>
                      <span>•</span>
                      <span>{p.performance?.inquiries || 2} RFQs</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDuplicateProduct(p)}
                        title="Duplicate Product"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        title="Edit Product"
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        title="Remove Product"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {analyticsModalProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{analyticsModalProduct.name}</h3>
                  <p className="text-xs font-mono text-slate-500">SKU: {analyticsModalProduct.sku}</p>
                </div>
              </div>
              <button onClick={() => setAnalyticsModalProduct(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center">
                <Eye className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                <span className="text-xl font-extrabold text-slate-900 block">{analyticsModalProduct.performance?.views || 24}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Catalog Views</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center">
                <FileText className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
                <span className="text-xl font-extrabold text-slate-900 block">{analyticsModalProduct.performance?.inquiries || 4}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Hospital RFQs</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center">
                <ShoppingBag className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                <span className="text-xl font-extrabold text-slate-900 block">{analyticsModalProduct.performance?.sales || 1}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Orders Executed</span>
              </div>
            </div>

            <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-100 text-xs text-teal-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-700" />
                <span>AI Marketplace Conversion Insight</span>
              </div>
              <p className="leading-relaxed">
                Hospital procurement managers frequently inspect verified ISO 13485 & CE credentials before initiating RFQs. Ensure your datasheet is updated to improve conversion by up to 32%.
              </p>
            </div>

            <button
              onClick={() => setAnalyticsModalProduct(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition"
            >
              Close Analytics Panel
            </button>
          </div>
        </div>
      )}

      {/* Request New Category Modal */}
      {showCategoryRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleSubmitCategoryRequest} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Request New Medical Category</h3>
              <button type="button" onClick={() => setShowCategoryRequestModal(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Can't find an exact category for your device? Submit a request. Once Admin approves, it will automatically populate across all vendor dropdowns.
            </p>
            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1">Proposed Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neonatal Incubators & Care"
                  value={reqCatName}
                  onChange={(e) => setReqCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1">Clinical Scope / Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe what equipment falls under this category..."
                  value={reqCatDesc}
                  onChange={(e) => setReqCatDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCategoryRequestModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl text-xs shadow-md">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request New Brand Modal */}
      {showBrandRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleSubmitBrandRequest} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Request New Medical Brand</h3>
              <button type="button" onClick={() => setShowBrandRequestModal(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Need to add a manufacturer brand not yet listed in HealNex? Request it below for instant Admin verification.
            </p>
            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1">Brand / Manufacturer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Olympus Medical Systems"
                  value={reqBrandName}
                  onChange={(e) => setReqBrandName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1">Country of Origin</label>
                <input
                  type="text"
                  placeholder="e.g. Japan, Germany, India"
                  value={reqBrandCountry}
                  onChange={(e) => setReqBrandCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowBrandRequestModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl text-xs shadow-md">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Product Comprehensive Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">{editingProduct ? 'Edit Clinical Equipment' : 'Register New Clinical Equipment'}</h3>
                  <p className="text-[11px] text-slate-400">All submissions undergo strict regulatory & quality verification before publishing.</p>
                </div>
              </div>
              <button onClick={() => setShowProductModal(false)} className="p-2 text-slate-400 hover:text-white rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs font-semibold text-slate-700 flex-1">
              
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-bold">{formError}</p>
                </div>
              )}

              {/* Basic Info & Classification */}
              <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60">
                <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">1. Core Identification & Category</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block mb-1.5 text-slate-800 font-bold">Equipment / Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ICU Multipara Monitor 12-inch Touchscreen"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-800 font-bold">Category (Dynamic from Firestore) *</label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryRequestModal(true)}
                        className="text-[10px] text-teal-700 hover:underline font-extrabold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Request New
                      </button>
                    </div>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-bold text-slate-800"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-800 font-bold">Brand / Manufacturer *</label>
                      <button
                        type="button"
                        onClick={() => setShowBrandRequestModal(true)}
                        className="text-[10px] text-teal-700 hover:underline font-extrabold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Request New
                      </button>
                    </div>
                    <select
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-bold text-slate-800"
                    >
                      <option value="">Select Brand</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">Unique SKU Code *</label>
                    <input
                      type="text"
                      required
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">Model Number / Part No.</label>
                    <input
                      type="text"
                      placeholder="e.g. HNX-MPM-12T"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing, MOQ & Taxation */}
              <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60">
                <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">2. Commercial Pricing & Inventory Constraints</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block mb-1.5 text-teal-800 font-extrabold">Vendor Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formVendorPrice}
                      onChange={(e) => setFormVendorPrice(Number(e.target.value))}
                      className="w-full bg-white border-2 border-teal-600 rounded-xl p-3 outline-none font-mono font-extrabold text-teal-900 focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Net amount you will receive per sale.</p>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-500 font-bold">Commission Rate</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 font-mono font-bold text-slate-500 select-none">
                      {currentCommRate}%
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Based on category & brand rules.</p>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-500 font-bold">Commission Amount</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 font-mono font-bold text-slate-500 select-none">
                      ₹{calculatedCommAmt.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Vendor Price × Commission %</p>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-blue-800 font-bold">Customer Price (₹)</label>
                    <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl p-3 font-mono font-extrabold text-blue-900 select-none">
                      ₹{calculatedCustPrice.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-blue-500/80 font-medium mt-1">Final price displayed on store.</p>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">Stock Quantity</label>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">Min Order Qty (MOQ)</label>
                    <input
                      type="number"
                      min={1}
                      value={formMoq}
                      onChange={(e) => setFormMoq(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">HSN Tariff Code</label>
                    <input
                      type="text"
                      value={formHsn}
                      onChange={(e) => setFormHsn(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">GST Slab Rate (%)</label>
                    <select
                      value={formGst}
                      onChange={(e) => setFormGst(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-bold text-slate-900"
                    >
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">Packaging Unit</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-bold text-slate-900"
                    >
                      <option value="Piece">Piece / Device</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack of 10</option>
                      <option value="Set">Complete Set</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Regulatory Certifications & Warranty */}
              <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60">
                <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">3. Regulatory Compliance & Warranty</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">Manufacturer Warranty Scope</label>
                    <input
                      type="text"
                      value={formWarranty}
                      onChange={(e) => setFormWarranty(e.target.value)}
                      placeholder="e.g. 2 Years Onsite Replacement"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">Country of Origin</label>
                    <input
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="e.g. India, Germany, USA"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-slate-800 font-bold">Select Verified Certifications</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {certOptions.map(cert => {
                      const isChecked = formCertifications.includes(cert);
                      return (
                        <label
                          key={cert}
                          onClick={() => {
                            if (isChecked) setFormCertifications(formCertifications.filter(c => c !== cert));
                            else setFormCertifications([...formCertifications, cert]);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                            isChecked ? 'bg-teal-700 text-white border-teal-700 font-bold' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cert}</span>
                          <input type="checkbox" checked={isChecked} readOnly className="sr-only" />
                          {isChecked && <Check className="w-4 h-4 stroke-[2.5]" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Descriptions & Dynamic Specs Table */}
              <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60">
                <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">4. Clinical Scope & Technical Datasheet</h4>
                
                <div>
                  <label className="block mb-1.5 text-slate-800 font-bold">Short Clinical Overview *</label>
                  <textarea
                    rows={2}
                    placeholder="Brief 2-line summary visible in product search cards..."
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-slate-800 font-bold">Full Detailed Specifications & Scope</label>
                  <textarea
                    rows={4}
                    placeholder="Detailed clinical parameters, usage scenarios, sterilization requirements..."
                    value={formFullDesc}
                    onChange={(e) => setFormFullDesc(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-medium text-slate-800"
                  />
                </div>

                {/* Dynamic Specifications Key-Value Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-extrabold">Technical Specifications Table</label>
                    <button
                      type="button"
                      onClick={() => setFormSpecs([...formSpecs, { key: '', value: '' }])}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formSpecs.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Parameter (e.g. Display Resolution)"
                          value={s.key}
                          onChange={(e) => {
                            const copy = [...formSpecs];
                            copy[idx].key = e.target.value;
                            setFormSpecs(copy);
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-700 font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 1920x1080 Full HD)"
                          value={s.value}
                          onChange={(e) => {
                            const copy = [...formSpecs];
                            copy[idx].value = e.target.value;
                            setFormSpecs(copy);
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-700 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setFormSpecs(formSpecs.filter((_, i) => i !== idx))}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Media & Attachments */}
              <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60">
                <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">5. Product Photos & Datasheets</h4>
                
                <div className="space-y-2">
                  <label className="block text-slate-800 font-bold">Image URLs / Uploads</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste high-res image URL (e.g. https://images.unsplash.com/...)"
                      value={formNewImageUrl}
                      onChange={(e) => setFormNewImageUrl(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 rounded-xl shrink-0"
                    >
                      Add URL
                    </button>
                    <label className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl shrink-0 flex items-center gap-2 cursor-pointer transition">
                      <Upload className="w-4 h-4" /> Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setFormImages(prev => [...prev, ev.target!.result as string]);
                                showToast('Image uploaded successfully!');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {formImages.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-300 bg-white group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-teal-700 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded">Primary</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormImages(formImages.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">Brochure / Technical Datasheet PDF URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://healnex.com/datasheets/spec-sheet.pdf"
                      value={formBrochure}
                      onChange={(e) => setFormBrochure(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-800 font-bold">Video Demo Link (YouTube / MP4)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://youtube.com/watch?v=..."
                      value={formVideo}
                      onChange={(e) => setFormVideo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-teal-700 font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500">
                Submissions automatically trigger AI & Admin quality review.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveProduct('Draft')}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold px-5 py-3 rounded-xl text-xs transition"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveProduct('Pending')}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-lg transition flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Submit for Approval
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
