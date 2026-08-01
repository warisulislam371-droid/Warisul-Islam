import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FileImage, Upload, Trash2, RefreshCw, Move, Edit2, Copy, Check, 
  Search, HardDrive, ShieldCheck, Download, Archive, Filter, Eye, Plus, 
  RotateCcw, Info, Link2, ExternalLink, Grid, List as ListIcon, CheckSquare, 
  Square, AlertCircle, FileArchive, ArrowRight, Layers
} from 'lucide-react';
import { GoogleDriveFile, GoogleDriveLog, Product } from '../types';
import { dbLocal } from '../db';
import DriveImage from './DriveImage';
import { 
  formatDriveFileName, 
  extractDriveFileId, 
  getDriveDirectUrl, 
  getDriveExportUrl, 
  processImageForDrive, 
  DRIVE_FOLDER_STRUCTURE 
} from '../utils/googleDrive';

interface GoogleDriveManagerProps {
  mode?: 'admin' | 'vendor';
  vendorId?: string;
  vendorName?: string;
  onAssignToProduct?: (file: GoogleDriveFile, productId: string) => void;
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  mode = 'admin',
  vendorId,
  vendorName = 'Vendor Partner',
  onAssignToProduct
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'trash' | 'logs'>('gallery');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Storage state
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [logs, setLogs] = useState<GoogleDriveLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>('All');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('All');

  // Multi-selection
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Modals state
  const [previewFile, setPreviewFile] = useState<GoogleDriveFile | null>(null);
  const [assignModalFile, setAssignModalFile] = useState<GoogleDriveFile | null>(null);
  const [selectedTargetProductId, setSelectedTargetProductId] = useState<string>('');
  
  const [renameModalFile, setRenameModalFile] = useState<GoogleDriveFile | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');
  
  const [moveModalFile, setMoveModalFile] = useState<GoogleDriveFile | null>(null);
  const [newFolderPath, setNewFolderPath] = useState<string>('Products/General');

  const [replaceModalFile, setReplaceModalFile] = useState<GoogleDriveFile | null>(null);

  // Upload Form State
  const [uploadCategory, setUploadCategory] = useState<string>('ECG');
  const [uploadSubfolder, setUploadSubfolder] = useState<string>('Products');
  const [uploadProductName, setUploadProductName] = useState<string>('Clinical Medical Device');
  const [uploadSku, setUploadSku] = useState<string>('HNX-DEV-101');
  const [uploadBrand, setUploadBrand] = useState<string>('HealNex');
  const [uploadFilesList, setUploadFilesList] = useState<{ file: File; preview: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [zipFile, setZipFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  // Load files, logs, and products from db and API
  const refreshData = () => {
    setLoading(true);
    try {
      let allFiles = dbLocal.getDriveFiles();
      let allLogs = dbLocal.getDriveLogs();
      const allProds = dbLocal.getProducts();

      // Filter by vendor if mode is 'vendor'
      if (mode === 'vendor' && vendorId) {
        allFiles = allFiles.filter(f => f.vendorId === vendorId);
        allLogs = allLogs.filter(l => l.vendorId === vendorId);
      }

      setFiles(allFiles);
      setLogs(allLogs);
      setProducts(allProds);
    } catch (err) {
      console.error('Error loading Google Drive manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const handleDbUpdate = () => refreshData();
    window.addEventListener('healnex_db_update', handleDbUpdate);
    return () => window.removeEventListener('healnex_db_update', handleDbUpdate);
  }, [mode, vendorId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered files logic
  const activeFiles = files.filter(f => {
    if (activeTab === 'trash') {
      return f.isDeleted === true;
    }
    return !f.isDeleted;
  });

  const filteredFiles = activeFiles.filter(f => {
    // Vendor isolation
    if (mode === 'vendor' && vendorId && f.vendorId !== vendorId) return false;
    if (mode === 'admin' && selectedVendorFilter !== 'All' && f.vendorId !== selectedVendorFilter) return false;

    // Subfolder filter
    if (selectedSubfolder !== 'All') {
      if (!(f.folderPath || '').includes(selectedSubfolder)) return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && f.category !== selectedCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (f.fileName || '').toLowerCase().includes(q);
      const matchProd = (f.productName || '').toLowerCase().includes(q);
      const matchSku = (f.sku || '').toLowerCase().includes(q);
      const matchBrand = (f.brand || '').toLowerCase().includes(q);
      const matchCat = (f.category || '').toLowerCase().includes(q);
      const matchVendor = (f.vendorName || '').toLowerCase().includes(q);
      const matchId = (f.fileId || '').toLowerCase().includes(q);
      if (!matchName && !matchProd && !matchSku && !matchBrand && !matchCat && !matchVendor && !matchId) {
        return false;
      }
    }

    return true;
  });

  // Unique vendors for admin filter
  const uniqueVendors = Array.from(new Set(files.map(f => f.vendorName).filter(Boolean)));

  // Calculate storage stats
  const totalFilesCount = activeFiles.length;
  const totalSizeBytes = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  // Single File Upload Handler
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected: File[] = Array.from(e.target.files);
    
    // Validate file type
    const validFiles = selected.filter((f: File) => {
      const isImg = f.type.startsWith('image/');
      if (!isImg) {
        showToast(`Skipped invalid file: ${f.name} (Image files only)`);
      }
      return isImg;
    });

    const newEntries = validFiles.map((f: File) => ({
      file: f,
      preview: URL.createObjectURL(f),
      name: f.name
    }));

    setUploadFilesList(prev => [...prev, ...newEntries]);
  };

  // Remove pending file from upload list
  const removeUploadFile = (index: number) => {
    setUploadFilesList(prev => prev.filter((_, i) => i !== index));
  };

  // Process & Submit Uploads to Drive
  const handleStartUpload = async () => {
    if (uploadFilesList.length === 0) {
      showToast('Please select at least one image file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const total = uploadFilesList.length;
      let completed = 0;

      for (const item of uploadFilesList) {
        // Process & compress canvas WebP
        const processed = await processImageForDrive(item.file);
        
        // Auto-generate standardized filename
        const finalName = formatDriveFileName(uploadCategory, uploadProductName, uploadSku, Date.now() + completed);

        const currentVendorId = vendorId || 'vendor-admin';
        const currentVendorName = vendorName || 'HealNex Platform';

        // Call backend Drive API
        const res = await fetch('/api/drive/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: [processed.dataUrl],
            fileName: finalName,
            category: uploadCategory,
            productName: uploadProductName,
            sku: uploadSku,
            brand: uploadBrand,
            vendorId: currentVendorId,
            vendorName: currentVendorName,
            uploadedBy: mode === 'vendor' ? currentVendorName : 'Admin Operator',
            uploadedByRole: mode,
            folderPath: `${uploadSubfolder}/${uploadCategory}`
          })
        });

        const data = await res.json();
        if (data.success && data.files && data.files.length > 0) {
          data.files.forEach((f: GoogleDriveFile) => dbLocal.addDriveFile(f));
          data.logs.forEach((l: GoogleDriveLog) => dbLocal.addDriveLog(l));
        }

        completed++;
        setUploadProgress(Math.round((completed / total) * 100));
      }

      showToast(`Successfully uploaded ${total} image(s) to Google Drive!`);
      setUploadFilesList([]);
      refreshData();
      setActiveTab('gallery');
    } catch (err: any) {
      console.error('Upload failed:', err);
      showToast('Error uploading images to Google Drive. Check connection.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Process ZIP File Upload
  const handleZipUpload = async () => {
    if (!zipFile) {
      showToast('Please select a ZIP file to extract & upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(30);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        const res = await fetch('/api/drive/zip-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipBase64: base64,
            category: uploadCategory,
            vendorId: vendorId || 'vendor-admin',
            vendorName: vendorName || 'HealNex Platform',
            uploadedBy: mode === 'vendor' ? vendorName : 'Admin Operator',
            uploadedByRole: mode,
            folderPath: `${uploadSubfolder}/${uploadCategory}`
          })
        });

        const data = await res.json();
        if (data.success && data.files) {
          data.files.forEach((f: GoogleDriveFile) => dbLocal.addDriveFile(f));
          data.logs.forEach((l: GoogleDriveLog) => dbLocal.addDriveLog(l));
          showToast(`Successfully processed ZIP: ${data.count} image(s) uploaded to Google Drive!`);
          setZipFile(null);
          refreshData();
          setActiveTab('gallery');
        } else {
          showToast(data.error || 'ZIP extraction failed.');
        }
        setIsUploading(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(zipFile);
    } catch (err: any) {
      showToast('ZIP Upload error: ' + err.message);
      setIsUploading(false);
    }
  };

  // Copy Direct Link to Clipboard
  const handleCopyLink = (file: GoogleDriveFile) => {
    const directUrl = getDriveDirectUrl(file.fileId);
    navigator.clipboard.writeText(directUrl);
    showToast('Direct Google Drive Image URL copied to clipboard!');
  };

  // Delete file (Soft / Hard)
  const handleDeleteFile = async (file: GoogleDriveFile, hardDelete = false) => {
    if (hardDelete && !confirm(`Are you sure you want to permanently purge "${file.fileName}" from Google Drive?`)) {
      return;
    }

    try {
      await fetch('/api/drive/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.fileId,
          hardDelete,
          userId: vendorId || 'admin',
          userName: vendorName || 'Admin',
          userRole: mode
        })
      });

      dbLocal.deleteDriveFile(file.id, !hardDelete);
      
      const newLog: GoogleDriveLog = {
        id: `log-${Date.now()}`,
        action: 'DELETE',
        fileId: file.fileId,
        fileName: file.fileName,
        productId: file.productId,
        vendorId: file.vendorId,
        userId: vendorName,
        userName: vendorName,
        userRole: mode,
        timestamp: new Date().toISOString(),
        details: `${hardDelete ? 'Permanently deleted' : 'Soft deleted'} ${file.fileName} from Google Drive.`
      };
      dbLocal.addDriveLog(newLog);

      showToast(`${hardDelete ? 'Permanently deleted' : 'Moved'} "${file.fileName}" ${hardDelete ? '' : 'to trash'}.`);
      setPreviewFile(null);
      refreshData();
    } catch (err) {
      showToast('Failed to delete file from Google Drive.');
    }
  };

  // Restore File
  const handleRestoreFile = async (file: GoogleDriveFile) => {
    try {
      await fetch('/api/drive/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.fileId,
          userId: vendorName,
          userName: vendorName,
          userRole: mode
        })
      });

      dbLocal.updateDriveFile(file.id, { isDeleted: false, deletedAt: undefined });
      showToast(`Restored file "${file.fileName}" from Trash.`);
      refreshData();
    } catch (err) {
      showToast('Failed to restore file.');
    }
  };

  // Bulk Delete Selected Files
  const handleBulkDelete = () => {
    if (selectedFileIds.length === 0) return;
    if (!confirm(`Move ${selectedFileIds.length} selected files to trash?`)) return;

    selectedFileIds.forEach(id => {
      const target = files.find(f => f.id === id);
      if (target) {
        dbLocal.deleteDriveFile(target.id, true);
      }
    });

    showToast(`Moved ${selectedFileIds.length} files to Trash.`);
    setSelectedFileIds([]);
    refreshData();
  };

  // Assign Image to Product
  const handleAssignToProductSubmit = () => {
    if (!assignModalFile || !selectedTargetProductId) {
      showToast('Please select a target product.');
      return;
    }

    const targetProduct = products.find(p => p.id === selectedTargetProductId);
    if (!targetProduct) return;

    const directUrl = getDriveDirectUrl(assignModalFile.fileId);
    
    // Add image to product's image lists
    const updatedImages = Array.from(new Set([directUrl, ...(targetProduct.images || [])]));
    const updatedDriveIds = Array.from(new Set([assignModalFile.fileId, ...(targetProduct.googleDriveFileIds || [])]));

    const updatedProduct: Product = {
      ...targetProduct,
      images: updatedImages,
      googleDriveFileIds: updatedDriveIds,
      mainImage: targetProduct.mainImage || directUrl,
      updatedAt: new Date().toISOString()
    };

    dbLocal.saveProducts(products.map(p => p.id === targetProduct.id ? updatedProduct : p));
    
    // Update drive file record
    dbLocal.updateDriveFile(assignModalFile.id, {
      productId: targetProduct.id,
      productName: targetProduct.name,
      sku: targetProduct.sku
    });

    if (onAssignToProduct) {
      onAssignToProduct(assignModalFile, targetProduct.id);
    }

    showToast(`Assigned Google Drive image to product "${targetProduct.name}"!`);
    setAssignModalFile(null);
    setSelectedTargetProductId('');
    refreshData();
  };

  // Submit Rename
  const handleRenameSubmit = async () => {
    if (!renameModalFile || !newFileName.trim()) return;
    const cleanName = newFileName.trim().endsWith('.webp') ? newFileName.trim() : `${newFileName.trim()}.webp`;

    await fetch('/api/drive/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId: renameModalFile.fileId,
        newName: cleanName,
        userId: vendorName,
        userName: vendorName
      })
    });

    dbLocal.updateDriveFile(renameModalFile.id, { fileName: cleanName });
    showToast(`Renamed file to "${cleanName}"`);
    setRenameModalFile(null);
    refreshData();
  };

  // Submit Move Folder
  const handleMoveSubmit = async () => {
    if (!moveModalFile) return;

    await fetch('/api/drive/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId: moveModalFile.fileId,
        newFolderPath,
        userId: vendorName,
        userName: vendorName
      })
    });

    dbLocal.updateDriveFile(moveModalFile.id, { folderPath: `HealNex-Medi-Bazar/${newFolderPath}` });
    showToast(`Moved file to folder "${newFolderPath}"`);
    setMoveModalFile(null);
    refreshData();
  };

  // Select/Deselect All
  const handleSelectAllToggle = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map(f => f.id));
    }
  };

  return (
    <div className="bg-slate-50 min-h-[700px] rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 text-sm animate-bounce border border-slate-700">
          <Info className="w-5 h-5 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-800">Google Drive Asset Storage</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 mr-1" /> Google Service Account Connected
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {mode === 'admin' ? 'Master Multivendor Storage Engine' : `${vendorName} Isolated Drive Workspace`} • Folder ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">1_HealNex_Root_Folder</code>
            </p>
          </div>
        </div>

        {/* Quick Storage Meter */}
        <div className="flex items-center space-x-6 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs text-slate-600">
          <div>
            <span className="block text-slate-400 font-medium uppercase tracking-wider text-[10px]">Total Files</span>
            <span className="font-bold text-slate-800 text-sm">{totalFilesCount}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="block text-slate-400 font-medium uppercase tracking-wider text-[10px]">Storage Used</span>
            <span className="font-bold text-teal-700 text-sm">{totalSizeMB} MB</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <button 
            onClick={refreshData}
            title="Refresh Drive Index"
            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-white rounded transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-slate-100/80 border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'gallery'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileImage className="w-4 h-4" />
            <span>Drive Gallery ({activeFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload & Batch ZIP</span>
          </button>

          <button
            onClick={() => setActiveTab('trash')}
            className={`px-4 py-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'trash'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Trash ({files.filter(f => f.isDeleted).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Audit Logs ({logs.length})</span>
          </button>
        </div>

        {/* View Switcher */}
        {activeTab === 'gallery' && (
          <div className="flex items-center space-x-1 bg-slate-200 p-1 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs ${viewMode === 'grid' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs ${viewMode === 'table' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'}`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content View */}
      <div className="p-6 flex-1 overflow-y-auto">
        {/* TAB 1: GALLERY & BROWSER */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Product, SKU, Category, Brand, File Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>

                {/* Subfolder Category Filter */}
                <select
                  value={selectedSubfolder}
                  onChange={(e) => setSelectedSubfolder(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-600"
                >
                  <option value="All">📁 All Drive Folders</option>
                  <option value="Products">📁 Products/</option>
                  <option value="Brands">📁 Brands/</option>
                  <option value="Vendors">📁 Vendors/</option>
                  <option value="Website">📁 Website/</option>
                  <option value="Certificates">📁 Certificates/</option>
                  <option value="Documents">📁 Documents/</option>
                  <option value="Logos">📁 Logos/</option>
                  <option value="Blog">📁 Blog/</option>
                </select>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-600"
                >
                  <option value="All">🏷️ All Categories</option>
                  {DRIVE_FOLDER_STRUCTURE.subfolders.Products.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Vendor Filter (Admin Mode) */}
                {mode === 'admin' && uniqueVendors.length > 0 && (
                  <select
                    value={selectedVendorFilter}
                    onChange={(e) => setSelectedVendorFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-600"
                  >
                    <option value="All">🏪 All Vendors</option>
                    {uniqueVendors.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {selectedFileIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete ({selectedFileIds.length})</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 hover:bg-teal-700 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Images</span>
                </button>
              </div>
            </div>

            {/* Selection Bar info */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAllToggle}
                  className="flex items-center space-x-1.5 text-slate-700 hover:text-teal-700 font-medium"
                >
                  {selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Select All ({filteredFiles.length})</span>
                </button>
                {selectedFileIds.length > 0 && (
                  <span className="text-teal-700 font-semibold">• {selectedFileIds.length} selected</span>
                )}
              </div>
              <span>Showing {filteredFiles.length} Google Drive image(s)</span>
            </div>

            {/* Empty state */}
            {filteredFiles.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center my-6">
                <FileImage className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Google Drive Images Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'All' 
                    ? 'No files match your current filter query.' 
                    : 'Start by uploading images or a ZIP package to your Google Drive repository.'}
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition"
                >
                  Upload Images Now
                </button>
              </div>
            )}

            {/* GRID VIEW */}
            {viewMode === 'grid' && filteredFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      className={`group relative bg-white border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md ${
                        isSelected ? 'border-teal-600 ring-2 ring-teal-600/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Selection checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFileIds(prev => 
                            isSelected ? prev.filter(id => id !== file.id) : [...prev, file.id]
                          );
                        }}
                        className="absolute top-2 left-2 z-10 p-1 bg-white/90 rounded-md backdrop-blur-xs shadow-xs text-slate-600 hover:text-teal-700"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-teal-600" /> : <Square className="w-4 h-4" />}
                      </button>

                      {/* Drive File ID Badge */}
                      <div className="absolute top-2 right-2 z-10 bg-slate-900/80 text-white px-1.5 py-0.5 rounded text-[10px] font-mono backdrop-blur-xs flex items-center space-x-1">
                        <HardDrive className="w-2.5 h-2.5 text-teal-400" />
                        <span>{file.fileId.substring(0, 8)}...</span>
                      </div>

                      {/* Thumbnail Container */}
                      <div 
                        onClick={() => setPreviewFile(file)}
                        className="w-full h-36 bg-slate-100 relative cursor-pointer overflow-hidden flex items-center justify-center group-hover:bg-slate-200 transition"
                      >
                        <DriveImage
                          src={file.directUrl}
                          alt={file.fileName}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2 backdrop-blur-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                            className="p-2 bg-white rounded-full text-slate-800 hover:bg-teal-600 hover:text-white transition shadow-md"
                            title="Preview Image"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(file);
                            }}
                            className="p-2 bg-white rounded-full text-slate-800 hover:bg-teal-600 hover:text-white transition shadow-md"
                            title="Copy Direct URL"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignModalFile(file);
                            }}
                            className="p-2 bg-white rounded-full text-slate-800 hover:bg-teal-600 hover:text-white transition shadow-md"
                            title="Assign to Product"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Info Metadata Footer */}
                      <div className="p-3 bg-white border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-800 truncate" title={file.fileName}>
                          {file.fileName}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-600">
                            {file.category || 'General'}
                          </span>
                          <span className="font-mono text-[10px]">{(file.size / 1024).toFixed(0)} KB</span>
                        </div>

                        {file.productName && (
                          <p className="text-[10px] text-teal-700 font-semibold truncate mt-1.5 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1" />
                            Linked: {file.productName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && filteredFiles.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0}
                          onChange={handleSelectAllToggle}
                          className="rounded text-teal-600"
                        />
                      </th>
                      <th className="p-3">Preview & File Name</th>
                      <th className="p-3">Google Drive File ID</th>
                      <th className="p-3">Category & Path</th>
                      <th className="p-3">Product / SKU</th>
                      <th className="p-3">Vendor</th>
                      <th className="p-3">Size</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFiles.map((file) => {
                      const isSelected = selectedFileIds.includes(file.id);
                      return (
                        <tr key={file.id} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-teal-50/40' : ''}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedFileIds(prev =>
                                  isSelected ? prev.filter(id => id !== file.id) : [...prev, file.id]
                                );
                              }}
                              className="rounded text-teal-600"
                            />
                          </td>
                          <td className="p-3 flex items-center space-x-3">
                            <DriveImage
                              src={file.directUrl}
                              alt={file.fileName}
                              className="w-10 h-10 rounded-md object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-800 text-xs truncate max-w-[200px]" title={file.fileName}>
                                {file.fileName}
                              </p>
                              <span className="text-[10px] text-slate-400">{new Date(file.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 text-[11px]">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {file.fileId}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                              {file.category || 'General'}
                            </span>
                          </td>
                          <td className="p-3">
                            {file.productName ? (
                              <div>
                                <p className="font-semibold text-teal-700 truncate max-w-[150px]">{file.productName}</p>
                                <span className="font-mono text-[10px] text-slate-400">{file.sku}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-700 font-medium">{file.vendorName || 'Platform'}</td>
                          <td className="p-3 font-mono text-slate-600 text-[11px]">{(file.size / 1024).toFixed(0)} KB</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded"
                                title="Preview Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCopyLink(file)}
                                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded"
                                title="Copy Direct URL"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setAssignModalFile(file)}
                                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded"
                                title="Assign Product"
                              >
                                <Link2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Trash"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPLOAD & BATCH ZIP */}
        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-teal-600" />
                <span>Upload Product Images to Google Drive Repository</span>
              </h3>

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Subfolder</label>
                  <select
                    value={uploadSubfolder}
                    onChange={(e) => setUploadSubfolder(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 outline-none focus:border-teal-600"
                  >
                    <option value="Products">Products/</option>
                    <option value="Brands">Brands/</option>
                    <option value="Website">Website/</option>
                    <option value="Certificates">Certificates/</option>
                    <option value="Documents">Documents/</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 outline-none focus:border-teal-600"
                  >
                    {DRIVE_FOLDER_STRUCTURE.subfolders.Products.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={uploadBrand}
                    onChange={(e) => setUploadBrand(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product Name</label>
                  <input
                    type="text"
                    value={uploadProductName}
                    onChange={(e) => setUploadProductName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product SKU</label>
                  <input
                    type="text"
                    value={uploadSku}
                    onChange={(e) => setUploadSku(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 outline-none focus:border-teal-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Auto Naming Format</label>
                  <div className="bg-slate-200/70 p-2 rounded text-[11px] font-mono text-slate-700 truncate">
                    {formatDriveFileName(uploadCategory, uploadProductName, uploadSku, 1722509901)}
                  </div>
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-600/30 hover:border-teal-600 bg-teal-50/20 hover:bg-teal-50/50 rounded-xl p-8 text-center cursor-pointer transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
                <FileImage className="w-12 h-12 text-teal-600 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-slate-800">Drag & Drop Image Files Here</h4>
                <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WebP up to 10MB each. Auto-converted to WebP format.</p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:border-teal-600 hover:text-teal-700 shadow-xs transition"
                >
                  Browse Computer Files
                </button>
              </div>

              {/* Pending Upload Files List */}
              {uploadFilesList.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Selected Files ({uploadFilesList.length})</span>
                    <button
                      onClick={() => setUploadFilesList([])}
                      className="text-rose-600 hover:underline text-[11px]"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {uploadFilesList.map((item, index) => (
                      <div key={index} className="relative bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center space-x-2">
                        <img src={item.preview} alt="" className="w-10 h-10 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800 truncate">{item.name}</p>
                          <span className="text-[10px] text-teal-600 font-mono">WebP Ready</span>
                        </div>
                        <button
                          onClick={() => removeUploadFile(index)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleStartUpload}
                    disabled={isUploading}
                    className="w-full py-3 bg-teal-600 text-white rounded-lg font-bold text-xs hover:bg-teal-700 shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Uploading to Google Drive ({uploadProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload {uploadFilesList.length} Image(s) to Google Drive</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* ZIP Archive Batch Uploader Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileArchive className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-800">ZIP Archive Batch Uploader</h3>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                  Bulk Extraction
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Upload a `.zip` archive containing multiple product images. HealNex will automatically unzip, rename, compress to WebP, and upload all contained images to your Google Drive repository.
              </p>

              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={zipInputRef}
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  onClick={() => zipInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 transition flex items-center space-x-2"
                >
                  <Archive className="w-4 h-4 text-slate-500" />
                  <span>{zipFile ? zipFile.name : 'Select ZIP Archive File'}</span>
                </button>

                {zipFile && (
                  <button
                    onClick={handleZipUpload}
                    disabled={isUploading}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition disabled:opacity-50"
                  >
                    Unzip & Upload to Drive
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRASH & RECOVERY */}
        {activeTab === 'trash' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Files in trash remain recoverable until permanently purged by an administrator.</span>
              </div>
            </div>

            {activeFiles.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center my-6">
                <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Trash is Empty</h3>
                <p className="text-xs text-slate-500 mt-1">No deleted Google Drive files.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {activeFiles.map(file => (
                  <div key={file.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 opacity-80 hover:opacity-100 transition">
                    <DriveImage src={file.directUrl} alt={file.fileName} className="w-full h-28 object-cover rounded-lg" />
                    <p className="text-xs font-bold text-slate-800 truncate">{file.fileName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Deleted: {file.deletedAt ? new Date(file.deletedAt).toLocaleDateString() : 'Recently'}</p>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => handleRestoreFile(file)}
                        className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-bold hover:bg-emerald-100 transition flex items-center justify-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file, true)}
                        className="py-1.5 px-2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-bold hover:bg-rose-100 transition"
                        title="Permanently Purge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">Google Drive Audit & Operation Logs</h3>
              <span className="text-[11px] text-slate-500">Showing last {logs.length} activity records</span>
            </div>
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No logs recorded yet.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Google Drive File ID</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          log.action === 'UPLOAD' ? 'bg-emerald-100 text-emerald-800' :
                          log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                          log.action === 'REPLACE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{log.fileId}</td>
                      <td className="p-3 text-slate-800 font-sans font-semibold">{log.userName || log.userId}</td>
                      <td className="p-3 font-sans text-slate-600">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* PREVIEW & DETAILS MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800 truncate">{previewFile.fileName}</h3>
              <button onClick={() => setPreviewFile(null)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">×</button>
            </div>

            <div className="w-full h-64 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
              <DriveImage src={previewFile.directUrl} alt={previewFile.fileName} className="max-h-full object-contain" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block">Google Drive File ID</span>
                <span className="font-mono text-slate-800 font-bold">{previewFile.fileId}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Folder Path</span>
                <span className="text-slate-800 font-medium">{previewFile.folderPath || 'Products/'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Category</span>
                <span className="text-slate-800 font-medium">{previewFile.category || 'General'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Uploaded By</span>
                <span className="text-slate-800 font-medium">{previewFile.uploadedBy} ({previewFile.uploadedByRole})</span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 font-semibold block">Direct Image URL</span>
                <code className="text-[10px] bg-slate-200/80 p-1.5 rounded block text-slate-800 font-mono break-all mt-1">
                  {getDriveDirectUrl(previewFile.fileId)}
                </code>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyLink(previewFile)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Direct URL</span>
                </button>
                <a
                  href={getDriveExportUrl(previewFile.fileId)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Drive</span>
                </a>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setRenameModalFile(previewFile);
                    setNewFileName(previewFile.fileName);
                    setPreviewFile(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    setMoveModalFile(previewFile);
                    setPreviewFile(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
                >
                  Move
                </button>
                <button
                  onClick={() => handleDeleteFile(previewFile)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TO PRODUCT MODAL */}
      {assignModalFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Link2 className="w-4 h-4 text-teal-600" />
              <span>Link Google Drive Image to Catalog Product</span>
            </h3>

            <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-lg border">
              <DriveImage src={assignModalFile.directUrl} alt="" className="w-12 h-12 rounded object-cover" />
              <div className="text-xs">
                <p className="font-bold text-slate-800">{assignModalFile.fileName}</p>
                <p className="text-slate-500 font-mono text-[10px]">ID: {assignModalFile.fileId}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Target Product</label>
              <select
                value={selectedTargetProductId}
                onChange={(e) => setSelectedTargetProductId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-teal-600"
              >
                <option value="">-- Choose Catalog Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - {p.brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setAssignModalFile(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignToProductSubmit}
                className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700"
              >
                Confirm Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renameModalFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-800">Rename Google Drive File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-teal-600"
            />
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setRenameModalFile(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500">Cancel</button>
              <button onClick={handleRenameSubmit} className="px-4 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700">Save Name</button>
            </div>
          </div>
        </div>
      )}

      {/* MOVE FOLDER MODAL */}
      {moveModalFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-800">Move File to Folder</h3>
            <select
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-teal-600"
            >
              <option value="Products/ECG">Products/ECG</option>
              <option value="Products/Ultrasound">Products/Ultrasound</option>
              <option value="Products/X-Ray">Products/X-Ray</option>
              <option value="Products/ICU">Products/ICU</option>
              <option value="Brands/HealNex">Brands/HealNex</option>
              <option value="Website/Slider">Website/Slider</option>
              <option value="Website/Banners">Website/Banners</option>
              <option value="Certificates">Certificates/</option>
            </select>
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setMoveModalFile(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500">Cancel</button>
              <button onClick={handleMoveSubmit} className="px-4 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700">Confirm Move</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveManager;
