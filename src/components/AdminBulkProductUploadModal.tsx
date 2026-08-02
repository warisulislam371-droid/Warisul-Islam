import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Trash2, 
  Plus, 
  Building2, 
  Sparkles, 
  Layers, 
  ShieldCheck,
  FileText,
  HelpCircle,
  RefreshCw,
  Check
} from 'lucide-react';
import { Vendor, Product, ProductStatus } from '../types';
import { dbLocal } from '../db';

interface AdminBulkProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  preSelectedVendorId?: string;
  onSuccess: (importedCount: number, targetVendorName: string) => void;
}

interface RawImportRow {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  mrp: number;
  price: number;
  salePrice: number;
  stockQuantity: number;
  description: string;
  unit: string;
  hsnCode: string;
  gstRate: number;
  warranty: string;
  countryOfOrigin: string;
  imageUrl: string;
  isValid: boolean;
  validationError?: string;
}

export default function AdminBulkProductUploadModal({
  isOpen,
  onClose,
  vendors,
  preSelectedVendorId,
  onSuccess
}: AdminBulkProductUploadModalProps) {
  // Vendor Target Selection States
  const [selectedVendorMode, setSelectedVendorMode] = useState<'registered' | 'custom'>('registered');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [customVendorName, setCustomVendorName] = useState<string>('');
  
  // Settings States
  const [targetStatus, setTargetStatus] = useState<ProductStatus>('Approved');
  const [publishImmediately, setPublishImmediately] = useState<boolean>(true);
  const [defaultCategory, setDefaultCategory] = useState<string>('Ultrasound Machines');
  const [commissionRate, setCommissionRate] = useState<number>(5.0);

  // Import Input States
  const [activeInputTab, setActiveInputTab] = useState<'csv_file' | 'csv_text' | 'manual'>('csv_file');
  const [csvText, setCsvText] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  // Parsed Items
  const [parsedRows, setParsedRows] = useState<RawImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Initialize selected vendor when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setParsedRows([]);
      setFileName('');
      setCsvText('');

      const approvedVendors = vendors.filter(v => v.status === 'Approved');
      const vendorListToUse = approvedVendors.length > 0 ? approvedVendors : vendors;

      if (preSelectedVendorId) {
        const found = vendors.find(v => v.id === preSelectedVendorId);
        if (found) {
          setSelectedVendorMode('registered');
          setSelectedVendorId(found.id);
          if (found.customCommissionRate !== undefined) {
            setCommissionRate(found.customCommissionRate);
          }
          return;
        }
      }

      if (vendorListToUse.length > 0) {
        setSelectedVendorMode('registered');
        setSelectedVendorId(vendorListToUse[0].id);
        if (vendorListToUse[0].customCommissionRate !== undefined) {
          setCommissionRate(vendorListToUse[0].customCommissionRate);
        }
      } else {
        setSelectedVendorMode('custom');
        setCustomVendorName('General Medical Supplier');
      }
    }
  }, [isOpen, preSelectedVendorId, vendors]);

  if (!isOpen) return null;

  // Resolve target vendor details
  const currentVendorObj = vendors.find(v => v.id === selectedVendorId);
  const resolvedVendorName = selectedVendorMode === 'registered' 
    ? (currentVendorObj?.companyName || 'Select Vendor') 
    : (customVendorName.trim() || 'Custom Vendor');

  const resolvedVendorId = selectedVendorMode === 'registered'
    ? (selectedVendorId || 'admin_assigned_vendor')
    : `v_custom_${customVendorName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'vendor'}`;

  // Download Sample CSV Template
  const handleDownloadSampleCSV = () => {
    const csvContent = 
`SKU,Name,Category,Subcategory,Brand,MRP,Price,SalePrice,Stock,Description,Unit,HSN,GST,Warranty,CountryOfOrigin,ImageURL
USG-3D-PRO,Color Doppler 3D Ultrasound Scanner,Ultrasound Machines,Color Doppler,Mindray,1850000,1450000,1380000,12,High definition 3D/4D obstetrics diagnostic ultrasound system with dual probes.,Unit,90181200,12,2 Years,Japan,https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80
ICU-MON-12,Multi-Para ICU Patient Monitor 12 Inch,ICU Equipment,Patient Monitors,BPL Medical,85000,68000,62000,25,12.1 inch TFT screen modular patient monitor with ECG NIBP SpO2 Temp features.,Piece,90181990,12,1 Year,India,https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80
SYR-PUMP-500,Micro Syringe Infusion Pump Touch,ICU Equipment,Infusion Pumps,Fresenius,45000,34000,31500,40,High precision micro infusion syringe pump with occlusion detection and battery backup.,Piece,90189099,12,1 Year,Germany,https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80
ECG-12CH-PRO,12 Channel Digital ECG Machine with Interpretation,Cardiology,ECG Machines,Schiller,115000,89000,84000,15,Compact 12-channel electrocardiograph with touchscreen display and thermal printer.,Unit,90181100,12,2 Years,Switzerland,https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HealNex_Bulk_Product_Upload_Template_${resolvedVendorName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Robust CSV parser
  const parseCSVText = (text: string): RawImportRow[] => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    const skuIdx = headers.findIndex(h => h.includes('sku'));
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('title') || h.includes('product'));
    const catIdx = headers.findIndex(h => h.includes('cat'));
    const subcatIdx = headers.findIndex(h => h.includes('subcat'));
    const brandIdx = headers.findIndex(h => h.includes('brand') || h.includes('mfr') || h.includes('make'));
    const mrpIdx = headers.findIndex(h => h.includes('mrp'));
    const priceIdx = headers.findIndex(h => h === 'price' || h.includes('vendorprice') || h.includes('cost'));
    const salePriceIdx = headers.findIndex(h => h.includes('sale') || h.includes('final') || h.includes('offer'));
    const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('qty') || h.includes('quantity'));
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('detail') || h.includes('spec'));
    const unitIdx = headers.findIndex(h => h.includes('unit') || h.includes('pack'));
    const hsnIdx = headers.findIndex(h => h.includes('hsn'));
    const gstIdx = headers.findIndex(h => h.includes('gst') || h.includes('tax'));
    const warrantyIdx = headers.findIndex(h => h.includes('warr'));
    const countryIdx = headers.findIndex(h => h.includes('country') || h.includes('origin'));
    const imgIdx = headers.findIndex(h => h.includes('img') || h.includes('image') || h.includes('photo') || h.includes('pic'));

    const rows: RawImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const cols = parseCSVLine(line);
      const getVal = (idx: number, fallback: string = '') => (idx >= 0 && cols[idx] !== undefined) ? cols[idx].trim() : fallback;

      const rawName = getVal(nameIdx, `Medical Equipment Product ${i}`);
      const rawSku = getVal(skuIdx, `SKU-${Date.now().toString(36).toUpperCase()}-${i}`);
      const rawCat = getVal(catIdx, defaultCategory);
      const rawSubcat = getVal(subcatIdx, 'General Equipment');
      const rawBrand = getVal(brandIdx, resolvedVendorName || 'HealNex Partner');
      
      const numMrp = parseFloat(getVal(mrpIdx, '0').replace(/[^0-9.]/g, '')) || 0;
      const numPrice = parseFloat(getVal(priceIdx, '0').replace(/[^0-9.]/g, '')) || 0;
      const numSale = parseFloat(getVal(salePriceIdx, '0').replace(/[^0-9.]/g, '')) || numPrice || numMrp;
      const basePrice = numPrice > 0 ? numPrice : (numSale > 0 ? numSale : 5000);
      const finalSalePrice = numSale > 0 ? numSale : basePrice;
      const finalMrp = numMrp > 0 ? numMrp : Math.round(finalSalePrice * 1.2);

      const stock = parseInt(getVal(stockIdx, '10').replace(/[^0-9]/g, '')) || 10;
      const desc = getVal(descIdx, `${rawName} - Certified medical grade equipment sourced via ${resolvedVendorName}.`);
      const unit = getVal(unitIdx, 'Unit');
      const hsn = getVal(hsnIdx, '90181200');
      const gst = parseFloat(getVal(gstIdx, '12').replace(/[^0-9.]/g, '')) || 12;
      const warranty = getVal(warrantyIdx, '1 Year Manufacturer Warranty');
      const country = getVal(countryIdx, 'India');
      const img = getVal(imgIdx, 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80');

      let isValid = true;
      let validationError = '';

      if (!rawName || rawName.length < 2) {
        isValid = false;
        validationError = 'Product name is required';
      } else if (basePrice <= 0) {
        isValid = false;
        validationError = 'Price must be greater than 0';
      }

      rows.push({
        sku: rawSku,
        name: rawName,
        category: rawCat,
        subcategory: rawSubcat,
        brand: rawBrand,
        mrp: finalMrp,
        price: basePrice,
        salePrice: finalSalePrice,
        stockQuantity: stock,
        description: desc,
        unit,
        hsnCode: hsn,
        gstRate: gst,
        warranty,
        countryOfOrigin: country,
        imageUrl: img,
        isValid,
        validationError
      });
    }

    return rows;
  };

  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  };

  // Process File Upload
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setErrorMsg('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSVText(text);
        if (parsed.length === 0) {
          setErrorMsg('No valid rows found in CSV file. Please check format.');
        } else {
          setParsedRows(parsed);
        }
      } catch (err: any) {
        setErrorMsg(`Failed to parse CSV file: ${err?.message || err}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  // Process Pasted Text
  const handleParsePastedCSV = () => {
    if (!csvText.trim()) {
      setErrorMsg('Please paste CSV content into the box.');
      return;
    }
    setErrorMsg('');
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const parsed = parseCSVText(csvText);
        if (parsed.length === 0) {
          setErrorMsg('No valid product rows parsed from pasted text.');
        } else {
          setParsedRows(parsed);
        }
      } catch (err: any) {
        setErrorMsg(`CSV parsing error: ${err?.message || err}`);
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  // Add Quick Sample Rows
  const handleGenerateSampleRows = () => {
    const sampleText = 
`SKU,Name,Category,Subcategory,Brand,MRP,Price,SalePrice,Stock,Description,Unit,HSN,GST,Warranty,CountryOfOrigin,ImageURL
USG-${Date.now().toString().slice(-4)}-A,Portable Ultrasound Scanner Probe,Ultrasound Machines,Color Doppler,Mindray,450000,320000,310000,10,Handheld wireless ultrasound diagnostic probe.,Unit,90181200,12,2 Years,Japan,https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80
VENT-ICU-800,Digital ICU Turbine Ventilator,ICU Equipment,Ventilators,Draeger,980000,750000,710000,8,High performance turbine powered intensive care ventilator.,Unit,90192000,12,2 Years,Germany,https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80
DEFIB-BIPHASIC,Biphasic Defibrillator Monitor with AED,Cardiology,Defibrillators,BPL Medical,165000,125000,118000,15,Biphasic cardiac defibrillator with external pacing and AED.,Unit,90189099,12,1 Year,India,https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80`;

    setCsvText(sampleText);
    const parsed = parseCSVText(sampleText);
    setParsedRows(parsed);
  };

  // Handle Drag & Drop
  const handleDragEvents = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Remove single row
  const handleRemoveRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  // Commit Import to Database
  const handleCommitBulkImport = () => {
    if (parsedRows.length === 0) {
      setErrorMsg('No products to import. Please upload or paste CSV data first.');
      return;
    }

    if (!resolvedVendorName) {
      setErrorMsg('Please select or specify a valid Vendor Name.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const now = new Date().toISOString();
      let importedCount = 0;

      parsedRows.forEach((row, idx) => {
        if (!row.name) return;

        const vendorPrice = row.price > 0 ? row.price : row.salePrice;
        const commRate = commissionRate;
        const commAmount = Math.round(vendorPrice * (commRate / 100));
        const finalPrice = Math.round(row.salePrice || (vendorPrice + commAmount));
        const vendorPayout = vendorPrice;

        const uniqueSku = row.sku || `SKU-${Date.now().toString(36).toUpperCase()}-${idx + 1}`;

        const newProd: Product = {
          id: `prod_bulk_admin_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          vendorId: resolvedVendorId,
          vendorName: resolvedVendorName,
          name: row.name,
          sku: uniqueSku,
          brand: row.brand || resolvedVendorName,
          category: row.category || defaultCategory,
          subcategory: row.subcategory || 'General Medical Equipment',
          description: row.description || `${row.name} supplied by ${resolvedVendorName}.`,
          shortDescription: `${row.name} - ${row.category}`,
          fullDescription: row.description,
          price: row.mrp || Math.round(finalPrice * 1.15),
          salePrice: finalPrice,
          mrp: row.mrp || Math.round(finalPrice * 1.15),
          vendorPrice,
          commissionRate: commRate,
          commissionAmount: commAmount,
          finalPrice,
          vendorPayout,
          moq: 1,
          stockQuantity: row.stockQuantity > 0 ? row.stockQuantity : 10,
          hsnCode: row.hsnCode || '90181200',
          gstRate: row.gstRate || 12,
          warranty: row.warranty || '1 Year Warranty',
          countryOfOrigin: row.countryOfOrigin || 'India',
          unit: row.unit || 'Unit',
          images: row.imageUrl ? [row.imageUrl] : ['https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'],
          specifications: [
            { key: 'Supplier / Vendor', value: resolvedVendorName },
            { key: 'Import Channel', value: 'Admin Direct Bulk Onboarding' }
          ],
          status: targetStatus,
          published: publishImmediately && (targetStatus === 'Approved'),
          isActive: true,
          approvedBy: 'Admin Super User',
          approvedAt: targetStatus === 'Approved' ? now : null,
          publishedAt: publishImmediately && (targetStatus === 'Approved') ? now : null,
          createdAt: now,
          updatedAt: now,
          performance: { views: 0, inquiries: 0, sales: 0 }
        };

        dbLocal.addProduct(newProd);
        importedCount++;
      });

      // Add Admin Notification
      dbLocal.addNotification(
        'admin',
        `Admin Bulk Product Upload Success`,
        `Successfully uploaded ${importedCount} products assigned to Vendor "${resolvedVendorName}". Status: ${targetStatus}.`,
        'success'
      );

      // Add Vendor Notification
      if (selectedVendorMode === 'registered' && selectedVendorId) {
        dbLocal.addNotification(
          selectedVendorId,
          `New Bulk Catalog Inventory Added`,
          `Admin uploaded ${importedCount} new items to your catalog. They are now live on HealNex Medi Bazar marketplace!`,
          'success'
        );
      }

      onSuccess(importedCount, resolvedVendorName);
      onClose();
    } catch (err: any) {
      console.error('[AdminBulkUpload Error]:', err);
      setErrorMsg(`Failed to complete bulk upload: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-800 via-slate-900 to-teal-900 text-white p-6 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-teal-400/20 text-teal-200 border border-teal-400/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Admin Master Control
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Bulk CSV Import
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-1">
                Admin Bulk Upload Products to Any Vendor
              </h2>
              <p className="text-xs text-teal-100/80 mt-0.5">
                Upload catalog CSV/Excel items directly and assign them to any vendor name with custom pricing & live marketplace publication.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Target Vendor Selection Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  1. Select Target Vendor
                </h3>
              </div>
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedVendorMode('registered')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedVendorMode === 'registered'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Registered Vendors ({vendors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVendorMode('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedVendorMode === 'custom'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Enter Custom Vendor
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedVendorMode === 'registered' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Vendor Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => {
                      setSelectedVendorId(e.target.value);
                      const v = vendors.find(x => x.id === e.target.value);
                      if (v && v.customCommissionRate !== undefined) {
                        setCommissionRate(v.customCommissionRate);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  >
                    {vendors.length === 0 ? (
                      <option value="">No registered vendors found</option>
                    ) : (
                      vendors.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.companyName} — {v.ownerName || v.email} ({v.status})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Products will be assigned to this vendor's catalog and dashboard.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Custom Vendor / Manufacturer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customVendorName}
                    onChange={(e) => setCustomVendorName(e.target.value)}
                    placeholder="e.g. BioMed Innovations India Pvt Ltd"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter any supplier, brand, or vendor name to tag these products.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Publication Status
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as ProductStatus)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  >
                    <option value="Approved">Approved (Live)</option>
                    <option value="Pending">Pending Review</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Platform Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-teal-900 font-medium">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                Targeting Vendor: <strong className="font-extrabold text-teal-950">{resolvedVendorName}</strong>
              </span>
              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
                />
                Publish live on marketplace immediately
              </label>
            </div>
          </div>

          {/* Upload Method Tabs & Sample Download */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  2. Choose Upload Method
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-3.5 py-2 rounded-xl transition border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  Download Sample CSV
                </button>
                <button
                  type="button"
                  onClick={handleGenerateSampleRows}
                  className="bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-extrabold px-3.5 py-2 rounded-xl transition border border-teal-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Load Sample Data
                </button>
              </div>
            </div>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveInputTab('csv_file')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeInputTab === 'csv_file'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                Upload .CSV / Excel File
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('csv_text')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeInputTab === 'csv_text'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-teal-600" />
                Paste CSV Text Data
              </button>
            </div>

            {/* CSV File Drag & Drop Zone */}
            {activeInputTab === 'csv_file' && (
              <div
                onDragEnter={handleDragEvents}
                onDragOver={handleDragEvents}
                onDragLeave={handleDragEvents}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition flex flex-col items-center justify-center ${
                  dragActive 
                    ? 'border-teal-500 bg-teal-50/50 scale-[1.005]' 
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 border border-teal-200 shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Drag & Drop CSV File for <span className="text-teal-700">{resolvedVendorName}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Supports comma-separated .csv files formatted with standard product columns (SKU, Name, Category, Price, Stock, ImageURL).
                </p>

                {fileName && (
                  <div className="mt-3 bg-white px-4 py-2 rounded-xl border border-teal-300 text-xs font-bold text-teal-800 flex items-center gap-2 shadow-2xs">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                    Loaded: {fileName}
                  </div>
                )}

                <label className="mt-4 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  Browse Computer Files
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Paste CSV Text Box */}
            {activeInputTab === 'csv_text' && (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="SKU,Name,Category,Subcategory,Brand,MRP,Price,SalePrice,Stock,Description,Unit,HSN,GST,Warranty,CountryOfOrigin,ImageURL&#10;USG-100,Ultrasound Machine,Ultrasound,Color Doppler,Mindray,1200000,950000,900000,5,High resolution diagnostic ultrasound machine.,Unit,90181200,12,2 Years,Japan,https://images.unsplash.com/photo-1516549655169-df83a0774514"
                  className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl p-4 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleParsePastedCSV}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Parse CSV Text ({csvText.split('\n').filter(Boolean).length} lines)
                </button>
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs font-bold shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Parsed Products Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  3. Preview Parsed Products ({parsedRows.length} items ready)
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                    Target: {resolvedVendorName}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setParsedRows([])}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Clear All Rows
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Vendor Price</th>
                        <th className="p-3">Selling Price</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-800 text-[11px]">{row.sku}</td>
                          <td className="p-3 font-bold text-slate-900 max-w-xs truncate">
                            <div className="flex items-center gap-2">
                              {row.imageUrl && (
                                <img src={row.imageUrl} alt="" className="w-6 h-6 rounded-md object-cover shrink-0 border border-slate-200" />
                              )}
                              <span className="truncate">{row.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">{row.category}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            ₹{row.price.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 font-mono font-extrabold text-teal-700">
                            ₹{row.salePrice.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">{row.stockQuantity}</td>
                          <td className="p-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              {targetStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {parsedRows.length > 0 ? (
              <span className="text-slate-900 font-bold">
                Ready to create {parsedRows.length} product(s) for vendor <span className="text-teal-700 font-black">{resolvedVendorName}</span>.
              </span>
            ) : (
              <span>Upload CSV file or load sample data to begin.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-extrabold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={parsedRows.length === 0 || isProcessing}
              onClick={handleCommitBulkImport}
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black text-white transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                parsedRows.length > 0 && !isProcessing
                  ? 'bg-teal-700 hover:bg-teal-800 shadow-teal-700/20'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing Products...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Upload & Assign {parsedRows.length} Products to {resolvedVendorName}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
