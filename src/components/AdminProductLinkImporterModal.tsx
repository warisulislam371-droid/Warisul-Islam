import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Tag,
  Building,
  UploadCloud,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Plus,
  Trash2,
  Layers,
  Percent,
  Sliders
} from 'lucide-react';
import { Product, Vendor } from '../types';
import { dbLocal } from '../db';
import { MEDICAL_HSN_DATABASE } from '../utils/medicalHsnTaxonomy';

interface AdminProductLinkImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  onProductUploaded: (newProduct: Product) => void;
  onMultipleProductsUploaded?: (newProducts: Product[]) => void;
}

export default function AdminProductLinkImporterModal({
  isOpen,
  onClose,
  vendors,
  onProductUploaded,
  onMultipleProductsUploaded
}: AdminProductLinkImporterModalProps) {
  // Mode: Single URL or Batch Multi-Link
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  
  // Single Link Input
  const [productUrl, setProductUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [targetVendorId, setTargetVendorId] = useState<string>('admin_master');
  const [customVendorName, setCustomVendorName] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<'Approved' | 'Pending' | 'Draft'>('Approved');

  // Batch Links Input
  const [batchUrlsText, setBatchUrlsText] = useState('');
  const [batchResults, setBatchResults] = useState<Product[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ total: number; current: number; failed: number }>({ total: 0, current: 0, failed: 0 });

  // Processing States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [extractionMeta, setExtractionMeta] = useState<any>(null);

  // Auto-Generated Product Preview State (Editable before saving)
  const [generatedProduct, setGeneratedProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [newImageInput, setNewImageInput] = useState('');

  if (!isOpen) return null;

  // Find selected vendor across all vendors in system
  const selectedVendor = vendors.find(v => v.id === targetVendorId);
  const vendorDisplayName = targetVendorId === 'admin_master'
    ? 'HealNex Direct (Admin Master)'
    : targetVendorId === 'custom'
      ? (customVendorName.trim() || 'Custom Medical Supplier')
      : (selectedVendor?.companyName || 'HealNex Medical');

  const resolvedVendorId = targetVendorId === 'custom'
    ? `vnd_custom_${Date.now()}`
    : targetVendorId;

  // Sample medical product links for instant 1-click test
  const sampleLinks = [
    { label: 'Mindray DP-50 Ultrasound', url: 'https://www.mindray.com/en/products/ultrasound/general-imaging/dp-50' },
    { label: 'BPL 12-Lead ECG Machine', url: 'https://bplmedicaltechnologies.com/products/cardiology/ecg-machines' },
    { label: 'Philips Patient Monitor', url: 'https://www.usa.philips.com/healthcare/product/HC865240/intellivue-mx450-patient-monitor' },
    { label: 'ICU Motorized Hospital Bed', url: 'https://www.paramount.co.jp/english/products/medical/bed' }
  ];

  // Handler: Single Link Scrape & Generate
  const handleScrapeLink = async (urlToScrape?: string) => {
    const targetUrl = (urlToScrape || productUrl).trim();
    if (!targetUrl) {
      setErrorMsg('Please paste a product URL or link first.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setGeneratedProduct(null);

    try {
      const res = await fetch('/api/gemini/scrape-product-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          customPrompt: customPrompt.trim(),
          vendorId: resolvedVendorId,
          vendorName: vendorDisplayName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.product) {
        throw new Error(data.error || 'Failed to auto-generate product from link.');
      }

      setGeneratedProduct({
        ...data.product,
        vendorId: resolvedVendorId,
        vendorName: vendorDisplayName
      });
      setExtractionMeta(data.rawExtracted || null);
      setActiveImageIdx(0);
      setSuccessMsg('Product details, images, price, HSN, and GST auto-generated successfully!');
    } catch (err: any) {
      console.error('Scrape error:', err);
      setErrorMsg(err?.message || 'Failed to fetch and parse the provided product link. Please check the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Batch Multi-Link Scrape
  const handleBatchScrape = async () => {
    const urls = batchUrlsText
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 5);

    if (urls.length === 0) {
      setErrorMsg('Please enter at least one product URL (one link per line).');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setBatchResults([]);
    setBatchProgress({ total: urls.length, current: 0, failed: 0 });

    const collected: Product[] = [];
    let failedCount = 0;

    for (let i = 0; i < urls.length; i++) {
      const singleUrl = urls[i];
      setBatchProgress({ total: urls.length, current: i + 1, failed: failedCount });

      try {
        const res = await fetch('/api/gemini/scrape-product-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: singleUrl,
            vendorId: resolvedVendorId,
            vendorName: vendorDisplayName
          })
        });

        const data = await res.json();
        if (data.success && data.product) {
          collected.push({
            ...data.product,
            vendorId: resolvedVendorId,
            vendorName: vendorDisplayName
          });
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
      }
    }

    setBatchResults(collected);
    setBatchProgress({ total: urls.length, current: urls.length, failed: failedCount });
    setIsLoading(false);

    if (collected.length > 0) {
      setSuccessMsg(`Successfully extracted and generated ${collected.length} product(s)!`);
    } else {
      setErrorMsg('Could not extract products from the provided URLs.');
    }
  };

  // Handler: Upload and Publish Single Generated Product
  const handleSaveAndUpload = () => {
    if (!generatedProduct) return;

    const isLive = targetStatus === 'Approved';
    const finalProd: Product = {
      ...generatedProduct,
      vendorId: resolvedVendorId,
      vendorName: vendorDisplayName,
      status: targetStatus,
      published: isLive,
      isActive: isLive,
      approvedAt: isLive ? new Date().toISOString() : null,
      publishedAt: isLive ? new Date().toISOString() : null,
      approvedBy: isLive ? 'Admin (Auto Link Importer)' : undefined,
      updatedAt: new Date().toISOString()
    };

    // Save to local database
    const existingProducts = dbLocal.getProducts();
    const updatedCatalog = [finalProd, ...existingProducts];
    dbLocal.saveProducts(updatedCatalog);

    onProductUploaded(finalProd);
    setSuccessMsg(`Product "${finalProd.name}" assigned to ${vendorDisplayName} & published live to marketplace!`);
    
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Handler: Upload All Batch Generated Products
  const handleUploadAllBatch = () => {
    if (batchResults.length === 0) return;

    const isLive = targetStatus === 'Approved';
    const finalBatch: Product[] = batchResults.map(p => ({
      ...p,
      vendorId: resolvedVendorId,
      vendorName: vendorDisplayName,
      status: targetStatus,
      published: isLive,
      isActive: isLive,
      approvedAt: isLive ? new Date().toISOString() : null,
      publishedAt: isLive ? new Date().toISOString() : null,
      approvedBy: isLive ? 'Admin (Batch Link Importer)' : undefined,
      updatedAt: new Date().toISOString()
    }));

    const existing = dbLocal.getProducts();
    const merged = [...finalBatch, ...existing];
    dbLocal.saveProducts(merged);

    if (onMultipleProductsUploaded) {
      onMultipleProductsUploaded(finalBatch);
    } else {
      finalBatch.forEach(p => onProductUploaded(p));
    }

    setSuccessMsg(`Successfully uploaded ${finalBatch.length} product(s) assigned to ${vendorDisplayName}!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Helper to add extra image URL to preview
  const handleAddImage = () => {
    if (!newImageInput.trim() || !generatedProduct) return;
    const currentImgs = generatedProduct.images || [];
    setGeneratedProduct({
      ...generatedProduct,
      images: [...currentImgs, newImageInput.trim()]
    });
    setNewImageInput('');
  };

  // Helper to remove image from preview
  const handleRemoveImage = (indexToRemove: number) => {
    if (!generatedProduct) return;
    const filtered = (generatedProduct.images || []).filter((_, idx) => idx !== indexToRemove);
    setGeneratedProduct({
      ...generatedProduct,
      images: filtered.length > 0 ? filtered : ['https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800']
    });
    if (activeImageIdx >= filtered.length) {
      setActiveImageIdx(Math.max(0, filtered.length - 1));
    }
  };

  // Calculation of GST & Gross Price
  const currentPrice = generatedProduct?.price || 0;
  const currentSalePrice = generatedProduct?.salePrice || currentPrice;
  const currentGstRate = generatedProduct?.gstRate || 12;
  const gstAmount = Math.round((currentSalePrice * currentGstRate) / 100);
  const grossTotalPrice = currentSalePrice + gstAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 p-6 text-white flex justify-between items-center shrink-0 border-b border-teal-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Auto Product Generator from Web Link
                </h2>
                <span className="text-[10px] font-extrabold uppercase bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-400/30">
                  AI Auto-Extractor
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-0.5 font-medium">
                Paste any product URL from medical sites, Indiamart, Amazon, or manufacturer portals to auto-generate Name, High-Res Images, HSN, GST %, and Pricing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Mode Tabs & Target Settings */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMode('single'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                mode === 'single'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Single Product Link</span>
            </button>
            <button
              onClick={() => { setMode('batch'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                mode === 'batch'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Multi-Link Import</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Assign Vendor:</span>
              <select
                value={targetVendorId}
                onChange={(e) => {
                  const newVid = e.target.value;
                  setTargetVendorId(newVid);
                  if (generatedProduct) {
                    const sel = vendors.find(v => v.id === newVid);
                    const vName = newVid === 'admin_master'
                      ? 'HealNex Direct (Admin Master)'
                      : newVid === 'custom'
                        ? (customVendorName.trim() || 'Custom Medical Supplier')
                        : (sel?.companyName || 'HealNex Medical');
                    setGeneratedProduct({
                      ...generatedProduct,
                      vendorId: newVid === 'custom' ? `vnd_custom_${Date.now()}` : newVid,
                      vendorName: vName
                    });
                  }
                }}
                className="px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-xs"
              >
                <option value="admin_master">⭐ HealNex Direct (Admin Master Catalog)</option>
                <optgroup label="Registered Marketplace Vendors">
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.companyName} ({v.ownerName || 'Vendor'}) — [{v.status || 'Active'}]
                    </option>
                  ))}
                </optgroup>
                <option value="custom">➕ Custom / Unregistered Vendor...</option>
              </select>
            </div>

            {targetVendorId === 'custom' && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Enter Vendor Company Name..."
                  value={customVendorName}
                  onChange={(e) => {
                    setCustomVendorName(e.target.value);
                    if (generatedProduct) {
                      setGeneratedProduct({
                        ...generatedProduct,
                        vendorName: e.target.value.trim() || 'Custom Medical Supplier'
                      });
                    }
                  }}
                  className="px-2.5 py-1.5 bg-white border border-teal-400 rounded-lg text-xs font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-xs"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status:</span>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Approved">Approved & Live</option>
                <option value="Pending">Pending Audit</option>
                <option value="Draft">Save as Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Main Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Alerts */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SINGLE LINK MODE */}
          {mode === 'single' && (
            <div className="space-y-6">
              {/* URL Input Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Paste Product Link / Web Page URL <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="url"
                      placeholder="https://example.com/medical-equipment/ultrasound-machine..."
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleScrapeLink(); }}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-inner"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleScrapeLink()}
                    disabled={isLoading || !productUrl.trim()}
                    className="px-6 py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-teal-200" />
                        <span>Extracting & Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-teal-200" />
                        <span>Auto-Generate Product</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sample Link Quick Buttons */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Quick Test Links:</span>
                  {sampleLinks.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProductUrl(item.url);
                        handleScrapeLink(item.url);
                      }}
                      className="text-[10px] font-extrabold bg-white hover:bg-teal-50 text-teal-800 border border-slate-200 hover:border-teal-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extraction Progress Indicator */}
              {isLoading && (
                <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto text-teal-600 animate-spin">
                    <RefreshCw className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-teal-950">
                      Scraping Webpage & Extracting Medical Data...
                    </h4>
                    <p className="text-xs text-teal-800 font-medium max-w-md mx-auto">
                      Downloading page DOM, resolving high-resolution product images, running Indian GST Council HSN classification, and estimating competitive market price.
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 text-[10px] font-bold text-teal-700">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-teal-200">1. Web Fetch</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-teal-200">2. Meta & Schema.org</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-teal-200">3. HSN & GST Matching</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-teal-200">4. Gemini AI Synthesis</span>
                  </div>
                </div>
              )}

              {/* AUTO-GENERATED PRODUCT PREVIEW & EDITING CARD */}
              {generatedProduct && !isLoading && (
                <div className="bg-white rounded-2xl border-2 border-teal-500 shadow-xl overflow-hidden space-y-6">
                  
                  {/* Banner header of extracted product */}
                  <div className="bg-gradient-to-r from-teal-50 to-slate-50 border-b border-teal-100 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>Auto-Generated Product Review & Upload</span>
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                            SKU: {generatedProduct.sku}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Review or adjust any generated field before publishing live to the HealNex marketplace.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveAndUpload}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Publish Live to Platform</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Top Row: Image Carousel & Key Product Attributes */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left: Product Images & Gallery (4 cols) */}
                      <div className="lg:col-span-4 space-y-3">
                        <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50 relative group aspect-square flex items-center justify-center overflow-hidden">
                          {generatedProduct.images && generatedProduct.images.length > 0 ? (
                            <img
                              src={generatedProduct.images[activeImageIdx] || generatedProduct.images[0]}
                              alt={generatedProduct.name}
                              className="max-h-full max-w-full object-contain rounded-xl transition duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800');
                              }}
                            />
                          ) : (
                            <div className="text-slate-400 flex flex-col items-center">
                              <ImageIcon className="w-12 h-12" />
                              <span className="text-xs font-bold mt-1">No Image Found</span>
                            </div>
                          )}

                          <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Image {activeImageIdx + 1} of {(generatedProduct.images || []).length}
                          </span>
                        </div>

                        {/* Thumbnails Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {(generatedProduct.images || []).map((img, idx) => (
                            <div
                              key={idx}
                              className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden cursor-pointer transition ${
                                activeImageIdx === idx ? 'border-teal-600 ring-2 ring-teal-200' : 'border-slate-200 hover:border-slate-300'
                              }`}
                              onClick={() => setActiveImageIdx(idx)}
                            >
                              <img src={img} alt="thumb" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                                title="Remove image"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add custom image URL input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add Image URL..."
                            value={newImageInput}
                            onChange={(e) => setNewImageInput(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddImage}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Right: Core Fields (8 cols) */}
                      <div className="lg:col-span-8 space-y-4">
                        
                        {/* Assigned Vendor Selector Box */}
                        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Building className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase text-teal-800 tracking-wider block">
                                Assigned Vendor / Seller Channel
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {vendorDisplayName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={targetVendorId}
                              onChange={(e) => {
                                const newVid = e.target.value;
                                setTargetVendorId(newVid);
                                const sel = vendors.find(v => v.id === newVid);
                                const vName = newVid === 'admin_master'
                                  ? 'HealNex Direct (Admin Master)'
                                  : newVid === 'custom'
                                    ? (customVendorName.trim() || 'Custom Medical Supplier')
                                    : (sel?.companyName || 'HealNex Medical');
                                setGeneratedProduct({
                                  ...generatedProduct,
                                  vendorId: newVid === 'custom' ? `vnd_custom_${Date.now()}` : newVid,
                                  vendorName: vName
                                });
                              }}
                              className="px-3 py-1.5 bg-white border border-teal-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-xs"
                            >
                              <option value="admin_master">⭐ HealNex Direct (Admin Master)</option>
                              <optgroup label="Registered Marketplace Vendors">
                                {vendors.map(v => (
                                  <option key={v.id} value={v.id}>
                                    {v.companyName} ({v.ownerName || 'Vendor'}) — [{v.status || 'Active'}]
                                  </option>
                                ))}
                              </optgroup>
                              <option value="custom">➕ Custom / Unregistered Vendor...</option>
                            </select>
                          </div>
                        </div>

                        {/* Product Title */}
                        <div>
                          <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                            Product Name / Model <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={generatedProduct.name || ''}
                            onChange={(e) => setGeneratedProduct({ ...generatedProduct, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </div>

                        {/* Category, Subcategory, Brand Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                              Category
                            </label>
                            <input
                              type="text"
                              value={generatedProduct.category || ''}
                              onChange={(e) => setGeneratedProduct({ ...generatedProduct, category: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                              Subcategory
                            </label>
                            <input
                              type="text"
                              value={generatedProduct.subcategory || ''}
                              onChange={(e) => setGeneratedProduct({ ...generatedProduct, subcategory: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                              Brand / Manufacturer
                            </label>
                            <input
                              type="text"
                              value={generatedProduct.brand || ''}
                              onChange={(e) => setGeneratedProduct({ ...generatedProduct, brand: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* HSN CODE & GST RATE SECTION (HIGHLIGHTED) */}
                        <div className="bg-gradient-to-r from-amber-50 to-teal-50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wide">
                              <Tag className="w-4 h-4 text-amber-600" />
                              <span>Medical HSN Code & GST Council Rate (India)</span>
                            </div>
                            <span className="text-[10px] font-extrabold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                              Auto-Matched
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                                HSN Code (6-8 Digits)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={generatedProduct.hsnCode || ''}
                                  onChange={(e) => setGeneratedProduct({ ...generatedProduct, hsnCode: e.target.value })}
                                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-black font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                />
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const found = MEDICAL_HSN_DATABASE.find(r => r.hsnCode === e.target.value);
                                      if (found) {
                                        setGeneratedProduct({
                                          ...generatedProduct,
                                          hsnCode: found.hsnCode,
                                          gstRate: found.gstRate
                                        });
                                      }
                                    }
                                  }}
                                  className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer"
                                  title="Pick standard medical HSN code"
                                >
                                  <option value="">Quick Pick HSN</option>
                                  {MEDICAL_HSN_DATABASE.slice(0, 10).map(r => (
                                    <option key={r.hsnCode} value={r.hsnCode}>{r.hsnCode} - {r.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                                GST Council Rate (%)
                              </label>
                              <div className="flex items-center gap-2">
                                {[5, 12, 18].map((rate) => (
                                  <button
                                    key={rate}
                                    type="button"
                                    onClick={() => setGeneratedProduct({ ...generatedProduct, gstRate: rate })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                                      generatedProduct.gstRate === rate
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50'
                                    }`}
                                  >
                                    {rate}% GST
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Live Tax Calculation Breakdown */}
                          <div className="text-[11px] text-slate-600 bg-white/80 border border-amber-100 rounded-xl p-2.5 flex flex-wrap justify-between items-center font-medium">
                            <span>Base Sale Price: <strong className="text-slate-900">₹{currentSalePrice.toLocaleString()}</strong></span>
                            <span>+ {currentGstRate}% GST: <strong className="text-amber-700">₹{gstAmount.toLocaleString()}</strong></span>
                            <span>= Total Invoice Gross: <strong className="text-emerald-700 font-extrabold">₹{grossTotalPrice.toLocaleString()}</strong></span>
                          </div>
                        </div>

                        {/* Pricing, MOQ, Stock Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1 flex items-center justify-between">
                              <span>MRP (List Price ₹)</span>
                            </label>
                            <input
                              type="number"
                              value={generatedProduct.price || 0}
                              onChange={(e) => setGeneratedProduct({ ...generatedProduct, price: Number(e.target.value), mrp: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase text-emerald-800 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <span>Selling Price (₹)</span>
                              </span>
                              <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black tracking-wide shadow-xs">
                                Pasted Link Offer
                              </span>
                            </label>
                            <input
                              id="platform-link-selling-price-input"
                              type="number"
                              placeholder="Pasted Link Offer Price"
                              value={generatedProduct.salePrice || 0}
                              onChange={(e) => setGeneratedProduct({ ...generatedProduct, salePrice: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-emerald-50/70 border-2 border-emerald-500 rounded-xl text-xs font-black font-mono text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-xs"
                            />
                            <span className="text-[9px] text-emerald-700 font-bold block mt-0.5 truncate">
                              ✓ Same price offered on pasted platform link
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                              Min Order Qty (MOQ)
                            </label>
                            <input
                              type="number"
                              value={generatedProduct.moq || 1}
                              onChange={(e) => setGeneratedProduct({ ...generatedProduct, moq: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                              Stock Qty
                            </label>
                            <input
                              type="number"
                              value={generatedProduct.stockQuantity || 10}
                              onChange={(e) => setGeneratedProduct({ ...generatedProduct, stockQuantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Description & Technical Specifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                          Clinical & Technical Description
                        </label>
                        <textarea
                          rows={4}
                          value={generatedProduct.description || ''}
                          onChange={(e) => setGeneratedProduct({ ...generatedProduct, description: e.target.value })}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-black uppercase text-slate-700">
                            Key Specifications ({generatedProduct.specifications?.length || 0})
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const specs = generatedProduct.specifications || [];
                              setGeneratedProduct({
                                ...generatedProduct,
                                specifications: [...specs, { key: 'Feature', value: 'Value' }]
                              });
                            }}
                            className="text-[11px] font-extrabold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Spec Row
                          </button>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
                          {(generatedProduct.specifications || []).map((spec, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-1.5 bg-white">
                              <input
                                type="text"
                                value={spec.key}
                                onChange={(e) => {
                                  const updated = [...(generatedProduct.specifications || [])];
                                  updated[idx].key = e.target.value;
                                  setGeneratedProduct({ ...generatedProduct, specifications: updated });
                                }}
                                className="w-1/3 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-800"
                              />
                              <input
                                type="text"
                                value={spec.value}
                                onChange={(e) => {
                                  const updated = [...(generatedProduct.specifications || [])];
                                  updated[idx].value = e.target.value;
                                  setGeneratedProduct({ ...generatedProduct, specifications: updated });
                                }}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = (generatedProduct.specifications || []).filter((_, i) => i !== idx);
                                  setGeneratedProduct({ ...generatedProduct, specifications: filtered });
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* BATCH MULTI-LINK MODE */}
          {mode === 'batch' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Paste Multiple Product Links (One URL per line) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="https://example.com/product-1&#10;https://example.com/product-2&#10;https://example.com/product-3"
                  value={batchUrlsText}
                  onChange={(e) => setBatchUrlsText(e.target.value)}
                  className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  disabled={isLoading}
                />

                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">
                    {batchUrlsText.split('\n').filter(u => u.trim().length > 5).length} link(s) detected
                  </span>

                  <button
                    type="button"
                    onClick={handleBatchScrape}
                    disabled={isLoading || !batchUrlsText.trim()}
                    className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing ({batchProgress.current}/{batchProgress.total})...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Auto-Generate All Links</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Batch Results Table */}
              {batchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900">
                      Generated Products Queue ({batchResults.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleUploadAllBatch}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload All {batchResults.length} Products to Live Catalog</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
                    {batchResults.map((p, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200'}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-contain bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 truncate">{p.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <span className="font-bold text-teal-700">{p.brand}</span> • 
                              <span>{p.category}</span> • 
                              <span className="font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">HSN: {p.hsnCode}</span> • 
                              <span className="font-bold text-slate-800">{p.gstRate}% GST</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-emerald-600 font-mono">₹{p.salePrice.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 line-through">MRP: ₹{p.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Compliant with Indian Healthcare GST & HSN Taxonomy.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            {generatedProduct && mode === 'single' && (
              <button
                type="button"
                onClick={handleSaveAndUpload}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Publish to Platform</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
