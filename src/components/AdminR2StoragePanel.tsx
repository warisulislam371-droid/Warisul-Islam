import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Upload, 
  Trash2, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  Image as ImageIcon, 
  Server, 
  Layers, 
  Search,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  getMarketplaceImagesFromCloudinary, 
  uploadProductImageToCloudinary, 
  deleteImageFromCloudinary 
} from '../utils/cloudinary';

export const AdminCloudinaryStoragePanel: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>({
    totalFiles: 0,
    totalSizeBytes: 0,
    totalSizeMB: '0.00 MB',
    bucketName: 'healnex-medibazar',
    cloudName: 'healnex-medibazar',
    r2Configured: true,
    publicCdnUrl: 'https://res.cloudinary.com'
  });
  const [files, setFiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('ultrasound');
  const [uploadSku, setUploadSku] = useState<string>('USG001');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadCloudinaryData = async () => {
    setLoading(true);
    try {
      const data = await getMarketplaceImagesFromCloudinary();
      if (data.stats) setStats(data.stats);
      if (data.files) setFiles(data.files);
    } catch (err) {
      console.error('Failed to load Cloudinary data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCloudinaryData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('Copied Cloudinary Public CDN URL to clipboard!');
  };

  const handleDeleteImage = async (key: string) => {
    if (!window.confirm(`Are you sure you want to delete this file from Cloudinary CDN?\n\nPath: ${key}`)) {
      return;
    }
    try {
      await deleteImageFromCloudinary(key);
      showToast('Deleted file from Cloudinary CDN storage.');
      loadCloudinaryData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message || err}`);
    }
  };

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        await uploadProductImageToCloudinary(file, uploadCategory, uploadSku, 'Admin');
      }
      showToast(`Successfully uploaded ${fileList.length} image(s) to Cloudinary CDN!`);
      loadCloudinaryData();
    } catch (err: any) {
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const filteredFiles = files.filter(f => 
    !searchTerm || f.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-extrabold">{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-200">
                Primary Product Storage Engine
              </span>
              <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Cloudinary CDN Active
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Cloudinary Media & Asset Storage System</h2>
            <p className="text-blue-100 text-xs mt-1 max-w-2xl leading-relaxed">
              Centralized Cloudinary CDN media infrastructure for HealNex Medi Bazar product catalog images, vendor compliance documents, and customer payment receipts.
            </p>
          </div>
          <button 
            onClick={loadCloudinaryData}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Storage
          </button>
        </div>
      </div>

      {/* Cloudinary Storage Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hosted Media</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalFiles} Assets</div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">100% Stored in Cloudinary</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage Consumed</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalSizeMB}</div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Auto Format & WebP Optimization</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cloud Name</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="text-sm font-black text-slate-900 truncate font-mono">{stats.cloudName || stats.bucketName || 'healnex-medibazar'}</div>
          <span className="text-[11px] font-semibold text-purple-600 mt-1 block">Cloudinary Infrastructure</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Public CDN Base</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs font-black text-slate-900 truncate font-mono">{stats.publicCdnUrl || 'https://res.cloudinary.com'}</div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Global Cloudinary CDN</span>
        </div>
      </div>

      {/* Cloudinary Storage Path Specification Info */}
      <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Cloudinary Storage Path & Public ID Format</h4>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 break-all">
          healnex/products/<span className="text-amber-400">{'{category}'}</span>/<span className="text-amber-400">{'{SKU}'}</span>/<span className="text-amber-400">{'{timestamp}'}</span>_<span className="text-amber-400">{'{filename}'}</span>
        </div>
        <div className="text-[11px] text-slate-400 flex flex-col md:flex-row gap-2 md:gap-6">
          <span><strong>Example Public ID:</strong> <code className="text-slate-300">healnex/products/ultrasound/USG001/1722512345_machine</code></span>
          <span><strong>Cloudinary CDN URL:</strong> <code className="text-emerald-400">https://res.cloudinary.com/healnex-medibazar/image/upload/f_auto,q_auto/v1/healnex/...</code></span>
        </div>
      </div>

      {/* Admin Upload Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" />
          Direct Cloudinary Marketplace Product Asset Uploader
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Category</label>
            <input 
              type="text" 
              value={uploadCategory} 
              onChange={e => setUploadCategory(e.target.value)} 
              placeholder="e.g. ultrasound"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Product SKU</label>
            <input 
              type="text" 
              value={uploadSku} 
              onChange={e => setUploadSku(e.target.value)} 
              placeholder="e.g. USG001"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <label className={`w-full text-center px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
              isUploading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading to Cloudinary...' : 'Select Product File(s) to Upload'}
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                disabled={isUploading} 
                onChange={handleAdminFileUpload} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Media Gallery Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Cloudinary Media Gallery & Assets ({filteredFiles.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Direct access to all product images hosted on Cloudinary CDN.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Search by SKU, filename or path..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            Scanning Cloudinary Storage Engine...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed">
            No product assets found in Cloudinary matching search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFiles.map((file, idx) => (
              <div key={file.key || idx} className="group relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition">
                <div className="aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img 
                    src={file.url} 
                    alt="" 
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=300&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
                
                <div className="p-2 text-[10px] space-y-1">
                  <p className="font-mono font-extrabold text-slate-800 truncate" title={file.key}>
                    {file.key.split('/').pop()}
                  </p>
                  <p className="text-slate-400 font-mono text-[9px]">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                {/* Overlay Action Buttons */}
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button 
                    onClick={() => handleCopyUrl(file.url)}
                    title="Copy Cloudinary CDN URL"
                    className="p-2 bg-white text-slate-900 rounded-lg hover:bg-blue-500 hover:text-white transition shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noreferrer"
                    title="Open Cloudinary Asset"
                    className="p-2 bg-white text-slate-900 rounded-lg hover:bg-blue-500 hover:text-white transition shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button 
                    onClick={() => handleDeleteImage(file.key)}
                    title="Delete from Cloudinary"
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminR2StoragePanel = AdminCloudinaryStoragePanel;
export default AdminCloudinaryStoragePanel;
