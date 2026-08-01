import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, XCircle, 
  Image as ImageIcon, Link as LinkIcon, Sparkles, Download, RefreshCw, 
  Eye, Edit3, Trash2, Layers, Store, ExternalLink, Filter, Search, 
  ArrowRight, ShieldCheck, Check, Package, DollarSign, Info, FileCode
} from 'lucide-react';
import { Product, Vendor, Category, Brand } from '../types';
import { dbLocal } from '../db';
import { uploadProductImageToCloudinary } from '../utils/cloudinary';

interface ProcessedImageUrl {
  original: string;
  directUrl: string;
  status: 'valid_direct' | 'converted_drive' | 'cloudinary' | 'jsdelivr' | 'converted_github_jsdelivr' | 'fallback' | 'invalid';
  statusLabel: string;
  driveFileId?: string;
}

export interface ParsedImportProduct {
  rowNumber: number;
  id: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  selected: boolean;
  name: string;
  sku: string;
  modelNumber: string;
  brand: string;
  category: string;
  subcategory: string;
  vendorPrice: number;
  mrp: number;
  wholesalePrice: number;
  finalPrice: number;
  commissionRate: number;
  commissionAmount: number;
  stockQuantity: number;
  minOrderQty: number;
  hsnCode: string;
  gstRate: number;
  warranty: string;
  countryOfOrigin: string;
  unit: string;
  shortDescription: string;
  fullDescription: string;
  rawImageUrls: string[];
  processedImages: ProcessedImageUrl[];
  directImageUrls: string[];
  pricingTiers: { minQty: number; price: number; }[];
}

interface AdminBulkProductImportProps {
  onRefreshCatalog?: () => void;
  onNavigateToProducts?: () => void;
}

export const convertToDirectImageUrl = (url: string): ProcessedImageUrl => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      original: '',
      directUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800',
      status: 'fallback',
      statusLabel: 'Missing (Auto Fallback Applied)'
    };
  }

  const cleanUrl = url.trim().replace(/^["']|["']$/g, '');

  // jsDelivr CDN Direct Link
  if (cleanUrl.includes('cdn.jsdelivr.net')) {
    return {
      original: cleanUrl,
      directUrl: cleanUrl,
      status: 'jsdelivr',
      statusLabel: 'jsDelivr CDN Direct Link'
    };
  }

  // GitHub to jsDelivr CDN Conversion
  const rawGithubMatch = cleanUrl.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
  if (rawGithubMatch) {
    const [, user, repo, branch, path] = rawGithubMatch;
    const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
    return {
      original: cleanUrl,
      directUrl: jsdelivrUrl,
      status: 'converted_github_jsdelivr',
      statusLabel: 'GitHub Converted to jsDelivr CDN'
    };
  }

  const githubBlobMatch = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/(?:blob|raw)\/([^\/]+)\/(.+)/);
  if (githubBlobMatch) {
    const [, user, repo, branch, path] = githubBlobMatch;
    const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
    return {
      original: cleanUrl,
      directUrl: jsdelivrUrl,
      status: 'converted_github_jsdelivr',
      statusLabel: 'GitHub Converted to jsDelivr CDN'
    };
  }

  // Google Drive conversion
  const driveFileIdMatch = 
    cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    cleanUrl.match(/id=([a-zA-Z0-9_-]+)/) ||
    cleanUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);

  if (driveFileIdMatch && driveFileIdMatch[1]) {
    const fileId = driveFileIdMatch[1];
    return {
      original: cleanUrl,
      directUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      status: 'converted_drive',
      statusLabel: 'Google Drive Direct Link Generated',
      driveFileId: fileId
    };
  }

  // Cloudinary
  if (cleanUrl.includes('cloudinary.com')) {
    return {
      original: cleanUrl,
      directUrl: cleanUrl,
      status: 'cloudinary',
      statusLabel: 'Cloudinary Direct Link Verified'
    };
  }

  // Standard Web direct URL
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:image/')) {
    return {
      original: cleanUrl,
      directUrl: cleanUrl,
      status: 'valid_direct',
      statusLabel: 'Valid Direct Image Link'
    };
  }

  return {
    original: cleanUrl,
    directUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800',
    status: 'invalid',
    statusLabel: 'Invalid Format (Fallback Applied)'
  };
};

export function AdminBulkProductImport({ onRefreshCatalog, onNavigateToProducts }: AdminBulkProductImportProps) {
  // Database context
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Selection & Configuration State
  const [selectedVendorId, setSelectedVendorId] = useState<string>('admin_default');
  const [importStatus, setImportStatus] = useState<'Approved' | 'Pending'>('Approved');
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(10);

  // File & Parsing State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [parsedProducts, setParsedProducts] = useState<ParsedImportProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Filter & Search State
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'valid' | 'drive_converted' | 'has_warnings'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing & Inspection State
  const [inspectingProduct, setInspectingProduct] = useState<ParsedImportProduct | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editProductForm, setEditProductForm] = useState<Partial<ParsedImportProduct> | null>(null);

  // Import Execution & Success State
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importSummary, setImportSummary] = useState<{
    totalImported: number;
    directLinksGenerated: number;
    categoriesCreated: number;
    brandsCreated: number;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = () => {
    const vList = dbLocal.getVendors();
    const cList = dbLocal.getCategories();
    const bList = dbLocal.getBrands();
    const pSettings = dbLocal.getPaymentSettings();

    setVendors(vList);
    setCategories(cList);
    setBrands(bList);
    if (pSettings?.platformCommissionRate) {
      setDefaultCommissionRate(pSettings.platformCommissionRate);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper column search algorithm
  const findColIndex = (headers: string[], candidates: string[]): number => {
    for (const cand of candidates) {
      const candNorm = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
      const idx = headers.findIndex(h => {
        const hNorm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return hNorm === candNorm || (candNorm.length >= 3 && hNorm.includes(candNorm));
      });
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const cleanNum = (val: any, fallback = 0): number => {
    if (val === undefined || val === null) return fallback;
    const cleaned = String(val).replace(/[^0-9.]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? fallback : num;
  };

  // Sample CSV Generation
  const handleDownloadCsvTemplate = () => {
    const headers = [
      'Product Name', 'SKU', 'Model Number', 'Brand', 'Category', 'Subcategory', 
      'Vendor Price', 'MRP', 'Wholesale Price', 'Stock Quantity', 'Min Order Qty', 
      'HSN Code', 'GST Rate (%)', 'Warranty', 'Country of Origin', 'Unit', 
      'Short Description', 'Full Description', 'Image URLs', 'Pricing Tiers'
    ];

    const sampleRows = [
      [
        'Digital ECG Machine 12-Channel High Resolution',
        'HNX-ECG-12CH',
        'ECG-PRO-2000',
        'HealNex Clinical',
        'Cardiology Equipment',
        'ECG Machines',
        '38500',
        '48000',
        '36000',
        '25',
        '1',
        '9018',
        '12',
        '2 Years Warranty',
        'India',
        'Piece',
        '12-Channel Resting ECG Machine with 7-inch color display and auto-interpretation.',
        'Professional 12-channel electrocardiograph featuring high-resolution thermal printer, built-in rechargeable battery, internal memory for 1000 ECG records, and USB export.',
        'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800 ; https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800',
        '5:37000;10:35000'
      ],
      [
        'ICU Multi-Para Patient Monitor 12.1 inch',
        'HNX-MON-121',
        'MON-ICU-121',
        'Philips Healthcare',
        'Diagnostic & Critical Care',
        'Patient Monitors',
        '62000',
        '78000',
        '59000',
        '15',
        '1',
        '9018',
        '12',
        '3 Years Warranty',
        'India',
        'Piece',
        '12.1-inch TFT color screen monitoring ECG, SpO2, NIBP, Respiration, Temp.',
        'Advanced ICU bedside patient monitor with arrhythmia detection, ST segment analysis, audio-visual alarms, and wireless central monitoring compatibility.',
        'https://drive.google.com/file/d/1vA5W024L8XzQ9Y1_SampleDriveFileID/view?usp=sharing ; https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=400',
        '2:60000;5:58000'
      ],
      [
        'Portable Pulse Oximeter OLED Display',
        'HNX-OXI-005',
        'OXI-LITE-5',
        'BPL Medical',
        'Diagnostic & Critical Care',
        'Pulse Oximeters',
        '1200',
        '1800',
        '1050',
        '150',
        '5',
        '9018',
        '12',
        '1 Year Warranty',
        'India',
        'Piece',
        'Fingertip pulse oximeter with dual color OLED display.',
        'Accurately measures SpO2 pulse rate and pulse bar in seconds. Auto power off after 8 seconds of inactivity.',
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800',
        '10:1100;50:980'
      ]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...sampleRows.map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'healnex_bulk_product_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sample Excel Generation using XLSX
  const handleDownloadExcelTemplate = () => {
    const data = [
      {
        'Product Name': 'Digital ECG Machine 12-Channel High Resolution',
        'SKU': 'HNX-ECG-12CH',
        'Model Number': 'ECG-PRO-2000',
        'Brand': 'HealNex Clinical',
        'Category': 'Cardiology Equipment',
        'Subcategory': 'ECG Machines',
        'Vendor Price': 38500,
        'MRP': 48000,
        'Wholesale Price': 36000,
        'Stock Quantity': 25,
        'Min Order Qty': 1,
        'HSN Code': '9018',
        'GST Rate (%)': 12,
        'Warranty': '2 Years Warranty',
        'Country of Origin': 'India',
        'Unit': 'Piece',
        'Short Description': '12-Channel Resting ECG Machine with 7-inch color display.',
        'Full Description': 'Professional 12-channel electrocardiograph featuring high-resolution thermal printer.',
        'Image URLs': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800 ; https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800',
        'Pricing Tiers': '5:37000;10:35000'
      },
      {
        'Product Name': 'ICU Multi-Para Patient Monitor 12.1 inch',
        'SKU': 'HNX-MON-121',
        'Model Number': 'MON-ICU-121',
        'Brand': 'Philips Healthcare',
        'Category': 'Diagnostic & Critical Care',
        'Subcategory': 'Patient Monitors',
        'Vendor Price': 62000,
        'MRP': 78000,
        'Wholesale Price': 59000,
        'Stock Quantity': 15,
        'Min Order Qty': 1,
        'HSN Code': '9018',
        'GST Rate (%)': 12,
        'Warranty': '3 Years Warranty',
        'Country of Origin': 'India',
        'Unit': 'Piece',
        'Short Description': '12.1-inch TFT color screen monitoring ECG, SpO2, NIBP.',
        'Full Description': 'Advanced ICU bedside patient monitor with arrhythmia detection and audio-visual alarms.',
        'Image URLs': 'https://drive.google.com/file/d/1vA5W024L8XzQ9Y1_SampleDriveFileID/view?usp=sharing ; https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=400',
        'Pricing Tiers': '2:60000;5:58000'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Import');
    XLSX.writeFile(workbook, 'healnex_bulk_product_import_template.xlsx');
  };

  // Process File Upload (CSV / XLSX / XLS)
  const handleFileChange = (file: File) => {
    if (!file) return;

    setParseError(null);
    setIsProcessing(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          setParseError('The file appears to be empty.');
          setIsProcessing(false);
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawRows || rawRows.length < 2) {
          setParseError('The uploaded file must contain a header row and at least one product row.');
          setIsProcessing(false);
          return;
        }

        const headers: string[] = rawRows[0].map(h => String(h || '').trim().replace(/^["']|["']$/g, ''));

        // Smart Column Mapping
        const colMap: Record<string, number> = {
          name: findColIndex(headers, ['name', 'productname', 'title', 'itemname', 'product', 'item']),
          sku: findColIndex(headers, ['sku', 'skucode', 'productcode', 'itemsku', 'code', 'modelnumber']),
          modelnumber: findColIndex(headers, ['modelnumber', 'modelno', 'model', 'partnumber']),
          brand: findColIndex(headers, ['brand', 'brandname', 'manufacturer', 'make']),
          category: findColIndex(headers, ['category', 'cat', 'categoryname', 'department']),
          subcategory: findColIndex(headers, ['subcategory', 'subcat', 'subcategoryname']),
          vendorprice: findColIndex(headers, ['vendorprice', 'saleprice', 'price', 'unitprice', 'cost', 'rate', 'ourprice', 'vendorcost']),
          mrp: findColIndex(headers, ['mrp', 'msrp', 'listprice', 'originalprice', 'regularprice']),
          wholesaleprice: findColIndex(headers, ['wholesaleprice', 'b2bprice', 'tradeprice', 'bulkprice']),
          stockquantity: findColIndex(headers, ['stockquantity', 'stock', 'quantity', 'qty', 'inventory', 'count']),
          minorderqty: findColIndex(headers, ['minorderqty', 'moq', 'minimumorder', 'minqty']),
          hsncode: findColIndex(headers, ['hsncode', 'hsn', 'saccode', 'sac']),
          gstrate: findColIndex(headers, ['gstrate', 'gst', 'tax', 'taxrate']),
          warranty: findColIndex(headers, ['warranty', 'guarantee']),
          countryoforigin: findColIndex(headers, ['countryoforigin', 'origin', 'country', 'madein']),
          unit: findColIndex(headers, ['unit', 'uom', 'unitofmeasure', 'packunit']),
          shortdescription: findColIndex(headers, ['shortdescription', 'description', 'summary', 'overview']),
          fulldescription: findColIndex(headers, ['fulldescription', 'details', 'longdescription', 'specification', 'specs']),
          imageurls: findColIndex(headers, ['imageurls', 'primaryimageurl', 'imageurl', 'images', 'image', 'photourl', 'photos', 'picture', 'pictureurl', 'image1']),
          pricingtiers: findColIndex(headers, ['pricingtiers', 'tiers', 'tierpricing', 'bulkdiscount'])
        };

        if (colMap.name === -1) colMap.name = 0;

        const dbProducts = dbLocal.getProducts();
        const parsed: ParsedImportProduct[] = [];
        const seenSkus = new Set<string>();

        // Selected vendor commission info
        let commissionRate = defaultCommissionRate;
        if (selectedVendorId !== 'admin_default') {
          const matchedVendor = vendors.find(v => v.id === selectedVendorId);
          if (matchedVendor && matchedVendor.customCommissionRate !== undefined) {
            commissionRate = matchedVendor.customCommissionRate;
          }
        }

        for (let rIdx = 1; rIdx < rawRows.length; rIdx++) {
          const row = rawRows[rIdx];
          if (!row || row.length === 0 || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) {
            continue;
          }

          const getVal = (colKey: string, defaultValue = ''): string => {
            const idx = colMap[colKey];
            return idx !== undefined && idx !== -1 && row[idx] !== undefined && row[idx] !== null 
              ? String(row[idx]).trim() 
              : defaultValue;
          };

          let rawName = getVal('name');
          if (!rawName) {
            rawName = row[0] ? String(row[0]).trim() : `Medical Equipment #${rIdx}`;
          }

          let rawSku = getVal('sku');
          if (!rawSku) {
            const slug = rawName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) || 'PROD';
            rawSku = `HN-${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
          }

          let skuLower = rawSku.toLowerCase();
          if (seenSkus.has(skuLower) || dbProducts.some(p => p.sku?.toLowerCase() === skuLower)) {
            rawSku = `${rawSku}-${Math.floor(10 + Math.random() * 90)}`;
            skuLower = rawSku.toLowerCase();
          }
          seenSkus.add(skuLower);

          const errors: string[] = [];
          const warnings: string[] = [];

          // Financial fields
          let vPrice = cleanNum(getVal('vendorprice'), 0);
          let mrp = cleanNum(getVal('mrp'), 0);
          let wPrice = cleanNum(getVal('wholesaleprice'), 0);

          if (vPrice <= 0 && mrp > 0) vPrice = Math.round(mrp * 0.8);
          else if (vPrice <= 0) vPrice = 1000;

          if (mrp <= 0) mrp = Math.round(vPrice * 1.25);
          if (wPrice <= 0) wPrice = Math.round(vPrice * 0.9);

          const commAmount = Math.round(vPrice * (commissionRate / 100));
          const fPrice = vPrice + commAmount;

          const stockQty = Math.max(1, cleanNum(getVal('stockquantity'), 10));
          const moq = Math.max(1, cleanNum(getVal('minorderqty'), 1));
          const gstRate = cleanNum(getVal('gstrate'), 12);

          // Extract Image URLs
          const rawUrls: string[] = [];

          // 1. From imageurls column
          const mainUrlsStr = getVal('imageurls');
          if (mainUrlsStr) {
            mainUrlsStr.split(/[,;\n|]/).forEach(u => {
              const clean = u.trim().replace(/^["']|["']$/g, '');
              if (clean && !rawUrls.includes(clean)) rawUrls.push(clean);
            });
          }

          // 2. Scan row cells for Image headers
          headers.forEach((h, hIdx) => {
            const hNorm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            if ((hNorm.includes('image') || hNorm.includes('photo') || hNorm.includes('picture') || hNorm.includes('drive') || hNorm.includes('img')) && row[hIdx]) {
              const cellStr = String(row[hIdx]).trim();
              cellStr.split(/[,;\n|]/).forEach(u => {
                const clean = u.trim().replace(/^["']|["']$/g, '');
                if (clean && !rawUrls.includes(clean)) rawUrls.push(clean);
              });
            }
          });

          // Convert & validate Image URLs
          const processedImages: ProcessedImageUrl[] = rawUrls.map(u => convertToDirectImageUrl(u));
          
          if (processedImages.length === 0) {
            const fallbackObj = convertToDirectImageUrl('');
            processedImages.push(fallbackObj);
            warnings.push('No Image URL provided. Default medical image assigned.');
          } else {
            const driveConvertedCount = processedImages.filter(p => p.status === 'converted_drive').length;
            if (driveConvertedCount > 0) {
              warnings.push(`Converted ${driveConvertedCount} Google Drive link(s) to direct image view URLs.`);
            }
          }

          const directImageUrls = processedImages.map(p => p.directUrl);

          // Pricing Tiers
          const pricingTiersStr = getVal('pricingtiers');
          const parsedTiers: { minQty: number; price: number }[] = [];
          if (pricingTiersStr) {
            pricingTiersStr.split(';').forEach(item => {
              const [q, p] = item.split(':');
              const qNum = cleanNum(q, 0);
              const pNum = cleanNum(p, 0);
              if (qNum > 0 && pNum > 0) parsedTiers.push({ minQty: qNum, price: pNum });
            });
          }

          const category = getVal('category', categories[0]?.name || 'Diagnostic & Critical Care') || 'Medical Equipment';
          const brand = getVal('brand', brands[0]?.name || 'HealNex Official') || 'Generic Medical';

          parsed.push({
            rowNumber: rIdx + 1,
            id: `import_${rIdx}_${Date.now()}`,
            isValid: errors.length === 0,
            errors,
            warnings,
            selected: errors.length === 0,
            name: rawName,
            sku: rawSku,
            modelNumber: getVal('modelnumber', `MOD-${Math.floor(1000 + Math.random() * 9000)}`),
            brand,
            category,
            subcategory: getVal('subcategory', category),
            vendorPrice: vPrice,
            mrp,
            wholesalePrice: wPrice,
            finalPrice: fPrice,
            commissionRate,
            commissionAmount: commAmount,
            stockQuantity: stockQty,
            minOrderQty: moq,
            hsnCode: getVal('hsncode', '9018'),
            gstRate,
            warranty: getVal('warranty', '1 Year Warranty'),
            countryOfOrigin: getVal('countryoforigin', 'India'),
            unit: getVal('unit', 'Piece'),
            shortDescription: getVal('shortdescription', rawName),
            fullDescription: getVal('fulldescription', rawName),
            rawImageUrls: rawUrls,
            processedImages,
            directImageUrls,
            pricingTiers: parsedTiers
          });
        }

        setParsedProducts(parsed);
        setIsProcessing(false);
        showToast(`Parsed ${parsed.length} products successfully with direct image link mapping!`, 'success');
      } catch (err: any) {
        console.error('Import parse error:', err);
        setParseError(`Failed to process file: ${err?.message || 'Invalid format'}`);
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Toggle selection
  const handleToggleSelectAll = (checked: boolean) => {
    setParsedProducts(prev => prev.map(p => ({
      ...p,
      selected: checked && p.isValid
    })));
  };

  const handleToggleRowSelect = (id: string) => {
    setParsedProducts(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  // Execute Bulk Import into Database
  const handleExecuteImport = async () => {
    const selectedRows = parsedProducts.filter(p => p.selected && p.isValid);
    if (selectedRows.length === 0) {
      showToast('Please select at least one valid product record to import.', 'error');
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    // Identify vendor details
    let vendorId = 'admin';
    let vendorName = 'HealNex Official Marketplace';
    if (selectedVendorId !== 'admin_default') {
      const v = vendors.find(item => item.id === selectedVendorId);
      if (v) {
        vendorId = v.id;
        vendorName = v.companyName || v.ownerName;
      }
    }

    const now = new Date().toISOString();
    let categoriesCreatedCount = 0;
    let brandsCreatedCount = 0;
    let directLinksGeneratedCount = 0;

    const existingCats = dbLocal.getCategories();
    const existingBrands = dbLocal.getBrands();

    const catMap = new Map(existingCats.map(c => [c.name.toLowerCase(), c]));
    const brandMap = new Map(existingBrands.map(b => [b.name.toLowerCase(), b]));

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i];

      // Auto-create category if missing
      const catKey = row.category.toLowerCase();
      if (!catMap.has(catKey)) {
        const newCatObj: Category = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: row.category,
          subcategories: row.subcategory ? [row.subcategory] : [],
          isActive: true,
          createdAt: now
        };
        const currentCats = dbLocal.getCategories();
        dbLocal.saveCategories([...currentCats, newCatObj]);
        catMap.set(catKey, newCatObj);
        categoriesCreatedCount++;
      }

      // Auto-create brand if missing
      const brandKey = row.brand.toLowerCase();
      if (!brandMap.has(brandKey)) {
        const newBrandObj: Brand = {
          id: `brand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: row.brand,
          isActive: true,
          createdAt: now
        };
        const currentBrands = dbLocal.getBrands();
        dbLocal.saveBrands([...currentBrands, newBrandObj]);
        brandMap.set(brandKey, newBrandObj);
        brandsCreatedCount++;
      }

      directLinksGeneratedCount += row.directImageUrls.length;

      const newProd: Product = {
        id: `prod_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        vendorId,
        vendorName,
        name: row.name,
        sku: row.sku,
        brand: row.brand,
        category: row.category,
        subcategory: row.subcategory,
        description: row.shortDescription,
        shortDescription: row.shortDescription,
        fullDescription: row.fullDescription,
        specifications: [
          { key: 'Model Number', value: row.modelNumber },
          { key: 'Warranty', value: row.warranty },
          { key: 'Country of Origin', value: row.countryOfOrigin },
          { key: 'HSN Code', value: row.hsnCode },
          { key: 'Packaging Unit', value: row.unit }
        ],
        price: row.finalPrice,
        salePrice: row.finalPrice,
        vendorPrice: row.vendorPrice,
        commissionRate: row.commissionRate,
        commissionAmount: row.commissionAmount,
        finalPrice: row.finalPrice,
        vendorPayout: row.vendorPrice,
        mrp: row.mrp,
        wholesalePrice: row.wholesalePrice,
        moq: row.minOrderQty,
        stockQuantity: row.stockQuantity,
        hsnCode: row.hsnCode,
        gstRate: row.gstRate,
        warranty: row.warranty,
        countryOfOrigin: row.countryOfOrigin,
        unit: row.unit,
        images: row.directImageUrls,
        mainImage: row.directImageUrls[0],
        galleryImages: row.directImageUrls.slice(1),
        thumbnail: row.directImageUrls[0],
        imageUrls: row.directImageUrls,
        imageMetadata: row.processedImages.map(p => ({
          url: p.directUrl,
          alt: `${row.name} Direct Image`,
          description: p.statusLabel
        })),
        pricingTiers: row.pricingTiers,
        status: importStatus,
        published: importStatus === 'Approved',
        publishedAt: importStatus === 'Approved' ? now : null,
        approvedAt: importStatus === 'Approved' ? now : null,
        approvedBy: importStatus === 'Approved' ? 'Admin Import System' : undefined,
        createdAt: now
      };

      dbLocal.addProduct(newProd);

      const progress = Math.round(((i + 1) / selectedRows.length) * 90) + 10;
      setImportProgress(progress);
    }

    setIsImporting(false);
    setImportSummary({
      totalImported: selectedRows.length,
      directLinksGenerated: directLinksGeneratedCount,
      categoriesCreated: categoriesCreatedCount,
      brandsCreated: brandsCreatedCount
    });

    if (onRefreshCatalog) onRefreshCatalog();
  };

  // Clear current dataset
  const handleResetImport = () => {
    setParsedProducts([]);
    setUploadedFileName('');
    setParseError(null);
    setImportSummary(null);
  };

  // Filtered dataset
  const filteredProducts = parsedProducts.filter(p => {
    if (activeTabFilter === 'valid' && !p.isValid) return false;
    if (activeTabFilter === 'drive_converted' && !p.processedImages.some(img => img.status === 'converted_drive')) return false;
    if (activeTabFilter === 'has_warnings' && p.warnings.length === 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);
    }
    return true;
  });

  const totalValidCount = parsedProducts.filter(p => p.isValid).length;
  const totalSelectedCount = parsedProducts.filter(p => p.selected && p.isValid).length;
  const totalDriveConvertedCount = parsedProducts.reduce((acc, p) => acc + p.processedImages.filter(img => img.status === 'converted_drive').length, 0);
  const totalDirectUrlsCount = parsedProducts.reduce((acc, p) => acc + p.directImageUrls.length, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-sky-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <FileSpreadsheet className="w-64 h-64 text-teal-300" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Admin Enterprise Bulk Import Engine</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Bulk Product Import &amp; Image Link Converter
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Upload product catalogs via CSV or Excel (.xlsx). The engine automatically validates image URLs, converts Google Drive share links, GitHub repositories via jsDelivr CDN, and Cloudinary URLs into direct rendering links, calculates pricing &amp; commissions, and imports inventory seamlessly.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleDownloadCsvTemplate}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/15"
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              Download CSV Template
            </button>
            <button
              onClick={handleDownloadExcelTemplate}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Excel (.xlsx) Template
            </button>
          </div>
        </div>
      </div>

      {/* Configuration & Vendor Selector Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-teal-600" />
            Assign Products to Vendor / Supplier
          </label>
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="admin_default">🏢 HealNex Official Marketplace (Admin Default)</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>
                🏬 {v.companyName || v.ownerName} ({v.mobileNumber || v.email})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Selected vendor will be set as the owner of imported items.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Default Approval Status
          </label>
          <select
            value={importStatus}
            onChange={(e) => setImportStatus(e.target.value as 'Approved' | 'Pending')}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="Approved">✅ Approved &amp; Instantly Published to Catalog</option>
            <option value="Pending">⏳ Pending Approval (Requires Admin Review)</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Admin imports can bypass review or stay pending.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-teal-600" />
            Platform Commission Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={defaultCommissionRate}
            onChange={(e) => setDefaultCommissionRate(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Calculates final price = Vendor Price + ({defaultCommissionRate}% Commission).
          </p>
        </div>
      </div>

      {/* File Upload Dropzone */}
      {parsedProducts.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
          className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging ? 'border-teal-500 bg-teal-50/50 scale-[1.005]' : 'border-slate-300 hover:border-teal-400 bg-slate-50/50'
          }`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800">
                Drag &amp; Drop CSV or Excel (.xlsx) file here
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports .csv, .xlsx, .xls catalogs with Google Drive, Cloudinary &amp; Web image URLs
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-teal-700/20">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Browse Catalog File</span>
              <input
                type="file"
                accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
            </label>

            {isProcessing && (
              <div className="pt-2 flex items-center justify-center gap-2 text-teal-700 text-xs font-bold animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading sheet &amp; converting image URLs...</span>
              </div>
            )}

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{parseError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results & Inspection View */}
      {parsedProducts.length > 0 && (
        <div className="space-y-6">
          {/* Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Total Rows Parsed</span>
                <Package className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">{parsedProducts.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">From file: {uploadedFileName}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
                <span>Valid Products</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 mt-1">{totalValidCount}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Ready for instant import</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-sky-700 text-xs font-bold">
                <span>Direct Links Mapped</span>
                <LinkIcon className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-black text-sky-700 mt-1">{totalDirectUrlsCount}</div>
              <div className="text-[10px] text-sky-600 mt-0.5">
                {totalDriveConvertedCount} converted Google Drive link(s)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-teal-800 text-xs font-bold">
                <span>Selected to Import</span>
                <Check className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl font-black text-teal-800 mt-1">{totalSelectedCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Target: {vendors.find(v => v.id === selectedVendorId)?.companyName || 'HealNex Official'}</div>
            </div>
          </div>

          {/* Action Header & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveTabFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTabFilter === 'all' ? 'bg-teal-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Records ({parsedProducts.length})
              </button>
              <button
                onClick={() => setActiveTabFilter('valid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTabFilter === 'valid' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Valid Records ({totalValidCount})
              </button>
              <button
                onClick={() => setActiveTabFilter('drive_converted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTabFilter === 'drive_converted' ? 'bg-sky-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ⚡ Drive Direct Converted ({parsedProducts.filter(p => p.processedImages.some(i => i.status === 'converted_drive')).length})
              </button>
              <button
                onClick={() => setActiveTabFilter('has_warnings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTabFilter === 'has_warnings' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Warnings ({parsedProducts.filter(p => p.warnings.length > 0).length})
              </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search parsed records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                onClick={handleResetImport}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Different File</span>
              </button>

              <button
                onClick={handleExecuteImport}
                disabled={isImporting || totalSelectedCount === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import {totalSelectedCount} Selected Product(s)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table of Parsed Records */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={totalSelectedCount > 0 && totalSelectedCount === totalValidCount}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </th>
                    <th className="p-3">Row</th>
                    <th className="p-3">Product Name &amp; SKU</th>
                    <th className="p-3">Direct Image Link Status</th>
                    <th className="p-3">Category &amp; Brand</th>
                    <th className="p-3 text-right">Vendor Price</th>
                    <th className="p-3 text-right">Final Price</th>
                    <th className="p-3 text-center">Stock</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProducts.map((p) => {
                    const firstImg = p.processedImages[0];
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50/80 transition ${!p.selected ? 'opacity-60 bg-slate-50/30' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={p.selected}
                            disabled={!p.isValid}
                            onChange={() => handleToggleRowSelect(p.id)}
                            className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500 font-bold">
                          #{p.rowNumber}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span>Model: {p.modelNumber}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {/* Image Thumbnail Box */}
                            <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 p-0.5 overflow-hidden shrink-0 relative group">
                              <img
                                src={p.directImageUrls[0]}
                                alt={p.name}
                                className="w-full h-full object-cover rounded-md"
                                onError={(e) => {
                                  // Fallback image if link breaks
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800';
                                }}
                              />
                            </div>

                            <div className="space-y-0.5">
                              {firstImg?.status === 'converted_drive' && (
                                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <Sparkles className="w-3 h-3 text-sky-600" />
                                  Google Drive Direct ({p.processedImages.length} img)
                                </span>
                              )}
                              {firstImg?.status === 'jsdelivr' && (
                                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <LinkIcon className="w-3 h-3 text-indigo-600" />
                                  jsDelivr CDN Direct ({p.processedImages.length} img)
                                </span>
                              )}
                              {firstImg?.status === 'converted_github_jsdelivr' && (
                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <Sparkles className="w-3 h-3 text-purple-600" />
                                  GitHub → jsDelivr CDN ({p.processedImages.length} img)
                                </span>
                              )}
                              {firstImg?.status === 'cloudinary' && (
                                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <ImageIcon className="w-3 h-3 text-teal-600" />
                                  Cloudinary Direct ({p.processedImages.length} img)
                                </span>
                              )}
                              {firstImg?.status === 'valid_direct' && (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Valid Direct Web URL ({p.processedImages.length} img)
                                </span>
                              )}
                              {(firstImg?.status === 'fallback' || firstImg?.status === 'invalid') && (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Auto Fallback Image Applied
                                </span>
                              )}
                              
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={p.directImageUrls[0]}>
                                {p.directImageUrls[0]}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{p.category}</div>
                          <div className="text-[10px] text-slate-500">{p.brand}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-700">
                          ₹{p.vendorPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-teal-900">
                          ₹{p.finalPrice.toLocaleString('en-IN')}
                          <div className="text-[9px] text-slate-500 font-sans font-normal">
                            incl. {p.commissionRate}% comm.
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {p.stockQuantity} {p.unit}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setInspectingProduct(p)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                            title="Inspect Image URLs & Product Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail & Direct Link Inspector Modal */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Product Link Inspector</span>
                <h3 className="text-lg font-bold text-slate-900">{inspectingProduct.name}</h3>
              </div>
              <button
                onClick={() => setInspectingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Mapped Direct Image URLs</h4>
                <div className="space-y-3">
                  {inspectingProduct.processedImages.map((img, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">Image #{i + 1} ({img.statusLabel})</span>
                        <a
                          href={img.directUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Open Direct Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex items-start gap-3">
                        <img
                          src={img.directUrl}
                          alt={`Preview ${i}`}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-300 shrink-0"
                        />
                        <div className="space-y-1 text-[11px] font-mono break-all text-slate-600">
                          <div><strong className="text-slate-800">Generated Direct URL:</strong> {img.directUrl}</div>
                          {img.original && <div><strong className="text-slate-500">Original Uploaded URL:</strong> {img.original}</div>}
                          {img.driveFileId && <div className="text-sky-700 font-bold">Extracted Google Drive File ID: {img.driveFileId}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div><strong>SKU:</strong> {inspectingProduct.sku}</div>
                <div><strong>Brand:</strong> {inspectingProduct.brand}</div>
                <div><strong>Category:</strong> {inspectingProduct.category}</div>
                <div><strong>Subcategory:</strong> {inspectingProduct.subcategory}</div>
                <div><strong>Vendor Price:</strong> ₹{inspectingProduct.vendorPrice}</div>
                <div><strong>Final Price:</strong> ₹{inspectingProduct.finalPrice}</div>
                <div><strong>Stock Quantity:</strong> {inspectingProduct.stockQuantity}</div>
                <div><strong>GST Rate:</strong> {inspectingProduct.gstRate}%</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {importSummary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Bulk Import Complete!</h3>
              <p className="text-xs text-slate-500">
                Products have been added to inventory with validated direct image URLs.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Total Imported Products:</span>
                <strong className="text-emerald-700 font-bold">{importSummary.totalImported}</strong>
              </div>
              <div className="flex justify-between">
                <span>Direct Image Links Generated:</span>
                <strong className="text-sky-700 font-bold">{importSummary.directLinksGenerated}</strong>
              </div>
              <div className="flex justify-between">
                <span>Categories Auto-Created:</span>
                <strong className="text-slate-900 font-bold">{importSummary.categoriesCreated}</strong>
              </div>
              <div className="flex justify-between">
                <span>Brands Auto-Created:</span>
                <strong className="text-slate-900 font-bold">{importSummary.brandsCreated}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetImport}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Import Another File
              </button>
              <button
                onClick={() => {
                  setImportSummary(null);
                  if (onNavigateToProducts) onNavigateToProducts();
                }}
                className="flex-1 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition shadow-md shadow-teal-700/20"
              >
                View Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CloudinaryIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
    </svg>
  );
}
