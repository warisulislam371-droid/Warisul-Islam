import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, X, CheckCircle, AlertTriangle, Image as ImageIcon, Star, Trash2, 
  ArrowUp, ArrowDown, Eye, ShieldCheck, RefreshCw, Layers, Sparkles, FileText, Check, AlertCircle, History
} from 'lucide-react';
import { ProductImageAsset, ProductImageUploadHistory } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

interface ProductImageManagerProps {
  productId: string;
  vendorId: string;
  vendorName?: string;
  isAdminView?: boolean;
  onImagesChange?: (images: ProductImageAsset[]) => void;
}

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  productId,
  vendorId,
  vendorName = 'Vendor',
  isAdminView = false,
  onImagesChange
}) => {
  const [images, setImages] = useState<ProductImageAsset[]>([]);
  const [history, setHistory] = useState<ProductImageUploadHistory[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    file: File;
    previewUrl: string;
    originalSize: number;
    compressedSize: number;
    compressedBase64: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'history'>('gallery');
  const [selectedImageModal, setSelectedImageModal] = useState<ProductImageAsset | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null); // image ID
  const [replacementImage, setReplacementImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync images from Firestore
  useEffect(() => {
    if (!productId) return;

    try {
      const q = query(
        collection(db, 'productImages'),
        where('productId', '==', productId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedImages: ProductImageAsset[] = [];
        snapshot.forEach((docSnap) => {
          fetchedImages.push({ id: docSnap.id, ...docSnap.data() } as ProductImageAsset);
        });

        // Sort by sortOrder
        fetchedImages.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setImages(fetchedImages);
        if (onImagesChange) onImagesChange(fetchedImages);
      }, (err) => {
        console.log('Product images live query listener handled:', err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.log('Error initializing product image query:', err);
    }
  }, [productId]);

  // Automatic browser image compression helper
  const compressImage = (file: File): Promise<{ compressedBase64: string; compressedSize: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimension 1600px for clinical standard clarity
          const MAX_DIM = 1600;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }

          // Convert to WebP / JPEG compressed base64
          const compressedBase64 = canvas.toDataURL('image/webp', 0.82);
          const compressedSize = Math.round((compressedBase64.length * 3) / 4);
          resolve({ compressedBase64, compressedSize });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length >= 10) {
      setStatusMessage({ type: 'error', text: 'Maximum 10 images allowed per product.' });
      return;
    }

    const file = files[0];

    // Validate type: JPG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setStatusMessage({ type: 'error', text: 'Invalid format! Supported formats: JPG, PNG, WEBP.' });
      return;
    }

    // Validate size: 10MB limit
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_BYTES) {
      setStatusMessage({ type: 'error', text: 'File size exceeds 10MB limit. Please select a smaller file.' });
      return;
    }

    try {
      setIsUploading(true);
      const { compressedBase64, compressedSize } = await compressImage(file);
      const previewUrl = URL.createObjectURL(file);

      setPreviewFile({
        file,
        previewUrl,
        originalSize: file.size,
        compressedSize,
        compressedBase64
      });
      setIsUploading(false);
    } catch (err) {
      setIsUploading(false);
      setStatusMessage({ type: 'error', text: 'Failed to compress image preview.' });
    }
  };

  const confirmUpload = async () => {
    if (!previewFile) return;

    try {
      setIsUploading(true);
      setStatusMessage({ type: 'info', text: 'Uploading compressed image to Cloudflare R2 Storage...' });

      // Call Cloudflare R2 API Endpoint
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: previewFile.compressedBase64,
          fileName: previewFile.file.name,
          contentType: 'image/webp',
          category: 'equipment',
          sku: productId || 'SKU001',
          uploadedBy: vendorName,
          productId
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare R2 Upload API returned status ${response.status}`);
      }

      const r2Data = await response.json();

      const newImageDoc: Omit<ProductImageAsset, 'id'> = {
        productId,
        vendorId,
        cloudinaryPublicId: r2Data.storage_path || r2Data.public_id || `healnex/products/${Date.now()}`,
        secureUrl: r2Data.image_url || r2Data.url,
        thumbnailUrl: r2Data.thumbnail_url || r2Data.image_url || r2Data.url,
        fileName: previewFile.file.name,
        fileSize: r2Data.file_size || previewFile.compressedSize,
        originalSize: previewFile.originalSize,
        compressedSize: previewFile.compressedSize,
        format: 'webp',
        isPrimary: images.length === 0, // First image auto-selected as Primary
        sortOrder: images.length + 1,
        status: isAdminView ? 'Approved' : 'Pending',
        uploadedAt: new Date().toISOString(),
        uploadedBy: vendorName
      };

      const docRef = await addDoc(collection(db, 'productImages'), newImageDoc);

      // Log history
      await addDoc(collection(db, 'productImageHistory'), {
        productId,
        vendorId,
        action: 'Uploaded',
        imageUrl: r2Data.image_url || r2Data.url,
        performedByRole: isAdminView ? 'admin' : 'vendor',
        performedByName: vendorName,
        timestamp: new Date().toISOString(),
        note: `Uploaded image to Cloudinary CDN Path: ${r2Data.public_id || r2Data.storage_path}`
      });

      setStatusMessage({ type: 'success', text: 'Image uploaded successfully to Cloudinary Storage CDN!' });
      setPreviewFile(null);
      setIsUploading(false);
    } catch (err: any) {
      console.log('Cloudinary Upload error handled:', err);
      setIsUploading(false);
      setStatusMessage({ type: 'error', text: 'Failed to complete Cloudinary image upload.' });
    }
  };

  const setPrimaryImage = async (imageId: string) => {
    try {
      // Unset current primary, set target as primary
      for (const img of images) {
        if (img.isPrimary && img.id !== imageId) {
          await updateDoc(doc(db, 'productImages', img.id), { isPrimary: false });
        } else if (img.id === imageId) {
          await updateDoc(doc(db, 'productImages', img.id), { isPrimary: true });
        }
      }

      // Log history
      await addDoc(collection(db, 'productImageHistory'), {
        productId,
        vendorId,
        action: 'PrimarySet',
        imageUrl: images.find(i => i.id === imageId)?.secureUrl || '',
        performedByRole: isAdminView ? 'admin' : 'vendor',
        performedByName: vendorName,
        timestamp: new Date().toISOString(),
        note: 'Selected as Primary Display Image'
      });

      setStatusMessage({ type: 'success', text: 'Primary image updated.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to set primary image.' });
    }
  };

  const reorderImage = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    try {
      const currentImg = images[index];
      const targetImg = images[targetIndex];

      await updateDoc(doc(db, 'productImages', currentImg.id), { sortOrder: targetImg.sortOrder });
      await updateDoc(doc(db, 'productImages', targetImg.id), { sortOrder: currentImg.sortOrder });

      setStatusMessage({ type: 'success', text: 'Image sequence updated.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to reorder images.' });
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this product image?')) return;

    try {
      const imgToDelete = images.find(i => i.id === imageId);
      await deleteDoc(doc(db, 'productImages', imageId));

      // Log history
      await addDoc(collection(db, 'productImageHistory'), {
        productId,
        vendorId,
        action: 'Deleted',
        imageUrl: imgToDelete?.secureUrl || '',
        performedByRole: isAdminView ? 'admin' : 'vendor',
        performedByName: vendorName,
        timestamp: new Date().toISOString(),
        note: 'Deleted from product gallery'
      });

      setStatusMessage({ type: 'success', text: 'Product image deleted.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to delete image.' });
    }
  };

  // Admin approval workflows
  const handleAdminApprove = async (imageId: string) => {
    try {
      await updateDoc(doc(db, 'productImages', imageId), { status: 'Approved', rejectionReason: '' });
      setStatusMessage({ type: 'success', text: 'Product image approved by admin!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to approve image.' });
    }
  };

  const handleAdminReject = async (imageId: string) => {
    if (!rejectionReasonInput.trim()) {
      alert('Please provide a reason for rejecting this image.');
      return;
    }

    try {
      await updateDoc(doc(db, 'productImages', imageId), {
        status: 'Rejected',
        rejectionReason: rejectionReasonInput
      });

      setShowRejectModal(null);
      setRejectionReasonInput('');
      setStatusMessage({ type: 'info', text: 'Product image rejected.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to reject image.' });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6" id="product-image-manager">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Product Image Assets & Cloudflare R2 Storage Gallery</h3>
              <p className="text-xs text-slate-500">
                Upload up to 10 clinical-grade images with automatic WebP conversion & Cloudflare R2 CDN hosting
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'gallery' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gallery ({images.length}/10)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Log
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-sky-50 text-sky-800 border border-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileSelect(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Drag & Drop product images here, or <span className="text-emerald-600 underline">browse files</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP (Max 10MB per image). Auto-compressed in browser before upload.
                </p>
              </div>
            </div>
          </div>

          {/* Pre-Upload Compressed Preview Modal / Card */}
          {previewFile && (
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Automatic Canvas Compression Preview
                  </span>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="aspect-square bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
                  <img src={previewFile.previewUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>

                <div className="md:col-span-2 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400">File Name:</span>
                    <p className="font-semibold text-slate-200 truncate">{previewFile.file.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Original Size</span>
                      <span className="text-sm font-bold text-rose-400">
                        {(previewFile.originalSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Compressed WebP Size</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {(previewFile.compressedSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      Optimization Savings: {' '}
                      <strong>
                        {Math.round(((previewFile.originalSize - previewFile.compressedSize) / previewFile.originalSize) * 100)}%
                      </strong>
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={confirmUpload}
                      disabled={isUploading}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Confirm & Save to Cloudinary</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setPreviewFile(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl text-xs transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Product Image Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Uploaded Gallery ({images.length} / 10)
            </h4>

            {images.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No images uploaded for this product yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className={`group relative bg-slate-50 rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
                      img.isPrimary ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Primary Badge */}
                    {img.isPrimary && (
                      <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-slate-950" />
                        <span>Primary</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                          img.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : img.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {img.status}
                      </span>
                    </div>

                    {/* Image Preview Container */}
                    <div className="aspect-square bg-white flex items-center justify-center p-2 relative">
                      <img
                        src={img.secureUrl}
                        alt={img.fileName}
                        className="w-full h-full object-contain transition-transform group-hover:scale-105"
                      />

                      {/* Hover Overlay Controls */}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <button
                          onClick={() => setSelectedImageModal(img)}
                          className="p-1.5 bg-white/90 text-slate-800 rounded-lg text-xs font-semibold hover:bg-white flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>

                        {!img.isPrimary && (
                          <button
                            onClick={() => setPrimaryImage(img.id)}
                            className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg text-xs font-semibold hover:bg-emerald-400 flex items-center gap-1"
                          >
                            <Star className="w-3.5 h-3.5" /> Make Primary
                          </button>
                        )}

                        <div className="flex items-center gap-1">
                          {index > 0 && (
                            <button
                              onClick={() => reorderImage(index, 'up')}
                              className="p-1 bg-slate-800/80 hover:bg-slate-800 text-white rounded-md text-xs"
                              title="Move Left"
                            >
                              <ArrowUp className="w-3 h-3 rotate-270" />
                            </button>
                          )}
                          {index < images.length - 1 && (
                            <button
                              onClick={() => reorderImage(index, 'down')}
                              className="p-1 bg-slate-800/80 hover:bg-slate-800 text-white rounded-md text-xs"
                              title="Move Right"
                            >
                              <ArrowDown className="w-3 h-3 rotate-90" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteImage(img.id)}
                            className="p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-md text-xs"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Info */}
                    <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] space-y-0.5">
                      <p className="font-semibold text-slate-700 truncate" title={img.fileName}>
                        {img.fileName}
                      </p>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>{(img.fileSize / 1024).toFixed(0)} KB</span>
                        <span className="uppercase font-bold">{img.format}</span>
                      </div>
                    </div>

                    {/* Admin Approval Controls Bar if Admin View */}
                    {isAdminView && (
                      <div className="p-1.5 bg-slate-100 border-t border-slate-200 flex gap-1">
                        {img.status !== 'Approved' && (
                          <button
                            onClick={() => handleAdminApprove(img.id)}
                            className="flex-1 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        )}
                        {img.status !== 'Rejected' && (
                          <button
                            onClick={() => setShowRejectModal(img.id)}
                            className="flex-1 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Audit Log Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Product Image Upload & Moderation Trail
            </h4>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100 flex items-center justify-between">
              <span>Event / Action</span>
              <span>Timestamp</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {images.map((img) => (
                <div key={`hist_${img.id}`} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={img.thumbnailUrl || img.secureUrl} alt="" className="w-8 h-8 rounded-lg object-cover border" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        Uploaded by <span className="text-emerald-600">{img.uploadedBy}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">Public ID: {img.cloudinaryPublicId}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(img.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900">Image Inspection & Cloudflare R2 Storage Metadata</h3>

            <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border">
              <img src={selectedImageModal.secureUrl} alt="" className="max-h-full max-w-full object-contain" />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Cloudflare R2 Storage Path</span>
                <span className="font-mono font-bold text-slate-700">{selectedImageModal.cloudinaryPublicId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">File Format</span>
                <span className="font-bold text-slate-700 uppercase">{selectedImageModal.format}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Compressed Size</span>
                <span className="font-bold text-slate-700">{(selectedImageModal.fileSize / 1024).toFixed(1)} KB</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Primary Display</span>
                <span className="font-bold text-emerald-600">{selectedImageModal.isPrimary ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Reject Product Image</h3>
            <p className="text-xs text-slate-500">
              Provide a reason for rejecting this image so the vendor can replace or re-upload.
            </p>

            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Image contains watermarks, incorrect resolution, or inappropriate content."
              className="w-full h-24 p-3 border rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleAdminReject(showRejectModal)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
