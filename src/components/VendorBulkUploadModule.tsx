import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  Upload,
  FileSpreadsheet,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Package,
  Clock,
  FileText,
  HelpCircle,
  Eye,
  Layers,
  Edit2,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  ListFilter
} from 'lucide-react';
import { Product, Vendor, User, Category } from '../types';
import { dbLocal } from '../db';
import { categorizeProductLocally } from '../utils/medicalCategorizer';
import { uploadProductImageToR2 } from '../utils/r2Storage';

export interface RawProductRow {
  rowNum: number;
  name: string;
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  salePrice: number;
  mrp: number;
  moq: number;
  stockQuantity: number;
  hsnCode: string;
  gstRate: number;
  description: string;
  specification: string;
  imageUrl: string;
  image2?: string;
  image3?: string;
  weight?: number;
  dimensions?: string;
  warranty?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  modelNumber?: string;
  tags?: string;
  pricingTiers?: string;
  certificates?: string;
  packSize?: string;
  color?: string;
  size?: string;
  
  // Validation state
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  autoMappedCategory?: {
    mainCategory: string;
    subcategory: string;
  };
  matchedZipImage?: string;
}

export interface DuplicateHandlingOption {
  mode: 'skip' | 'update' | 'copy';
}

interface VendorBulkUploadModuleProps {
  currentUser: User | null;
  vendor: Vendor | null;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSuccess?: () => void;
  onOpenVerification?: () => void;
}

export const VendorBulkUploadModule: React.FC<VendorBulkUploadModuleProps> = ({
  currentUser,
  vendor,
  addToast,
  onSuccess,
  onOpenVerification
}) => {
  // Wizard Step: 1 = File Upload, 2 = Image ZIP (Optional), 3 = Validation & Audit, 4 = Preview Table, 5 = Import Engine
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Verification guard check
  const isVendorApproved = vendor?.status === 'Approved' || vendor?.isVerifiedSeller === true;

  // File States
  const [dataFileName, setDataFileName] = useState<string>('');
  const [zipFileName, setZipFileName] = useState<string>('');
  const [rawRows, setRawRows] = useState<RawProductRow[]>([]);
  const [zipImagesMap, setZipImagesMap] = useState<Map<string, { url: string; file: File }>>(new Map());
  const [isProcessingZip, setIsProcessingZip] = useState<boolean>(false);

  // Duplicate Handling Mode
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update' | 'copy'>('update');

  // Preview Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'errors'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Real-Time Progress & Batch Import States
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [importStats, setImportStats] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    elapsedSec: number;
  }>({
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    elapsedSec: 0
  });

  const [errorReportData, setErrorReportData] = useState<Array<{
    rowNumber: number;
    sku: string;
    productName: string;
    error: string;
    suggestion: string;
  }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Categories list from DB
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  useEffect(() => {
    setDbCategories(dbLocal.getCategories());
  }, []);

  // CSV Injection Sanitization Helper
  const sanitizeCsvValue = (str: any): string => {
    if (!str) return '';
    let val = String(str).trim();
    if (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@')) {
      val = val.substring(1);
    }
    return val;
  };

  // 1. Download Sample Templates (CSV & XLSX)
  const handleDownloadCsvTemplate = () => {
    const headers = [
      'Name', 'SKU', 'Brand', 'Category', 'Subcategory', 'Price', 'SalePrice', 'MRP', 'MOQ',
      'StockQuantity', 'HSNCode', 'GSTRate', 'Description', 'Specification', 'ImageURL',
      'Image2', 'Image3', 'Weight', 'Dimensions', 'Warranty', 'CountryOfOrigin', 'Manufacturer',
      'ModelNumber', 'Tags', 'PricingTiers', 'Certificates', 'PackSize', 'Color', 'Size'
    ];

    const sample1 = [
      'Digital ECG Machine 12-Channel with Interpretation',
      'SKU-ECG-12CH',
      'HealNex Cardiology',
      'Medical Equipment',
      'ECG Machine',
      '45000',
      '42000',
      '50000',
      '1',
      '20',
      '90181100',
      '12',
      'High-precision 12-channel electrocardiograph featuring 7-inch color display, thermal printer, and arrhythmia detection.',
      'Lead Wire: 10-Lead; Display: 7 Inch TFT; Battery: Rechargeable Li-ion 4 Hours; Memory: 500 Records',
      'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400',
      '',
      '3.5',
      '310x230x70 mm',
      '2 Years Manufacturer Warranty',
      'India',
      'HealNex Medical Systems',
      'HNX-ECG-120',
      'ECG, Cardiology, Diagnostic, Hospital',
      '1-5:42000, 6-10:39500, 11+:37000',
      'ISO 13485, CE, CDSCO Approved',
      '1 Unit Box',
      'White / Teal',
      'Standard'
    ];

    const sample2 = [
      '5-Function Electric Motorized ICU Bed',
      'SKU-BED-ICU5F',
      'HealNex Furniture',
      'Hospital Furniture',
      'ICU Beds',
      '88000',
      '82000',
      '98000',
      '1',
      '10',
      '94029010',
      '18',
      'Electric ICU hospital bed with linak actuators, nurse control panel, CPR quick release, and central locking castors.',
      'Frame: Mild Steel Epoxy Coated; Load Capacity: 250kg; Functions: Backrest, Knee Rest, Height, Trendelenburg, Reverse Trendelenburg',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400',
      '',
      '',
      '120',
      '2150x1050x500 mm',
      '3 Years Warranty',
      'India',
      'HealNex Med Tech',
      'HNX-BED-500',
      'Hospital Bed, ICU, Motorized, Furniture',
      '1-3:82000, 4-10:78000',
      'ISO 9001, CE',
      '1 Bed Unit',
      'Blue / White',
      'Full Size'
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      sample1.map(c => `"${c}"`).join(','),
      sample2.map(c => `"${c}"`).join(',')
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'HealNex_Vendor_Bulk_Products_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded B2B CSV Template with sample medical data!', 'success');
  };

  const handleDownloadXlsxTemplate = () => {
    const wsData = [
      [
        'Name', 'SKU', 'Brand', 'Category', 'Subcategory', 'Price', 'SalePrice', 'MRP', 'MOQ',
        'StockQuantity', 'HSNCode', 'GSTRate', 'Description', 'Specification', 'ImageURL',
        'Image2', 'Image3', 'Weight', 'Dimensions', 'Warranty', 'CountryOfOrigin', 'Manufacturer',
        'ModelNumber', 'Tags', 'PricingTiers', 'Certificates', 'PackSize', 'Color', 'Size'
      ],
      [
        'Digital ECG Machine 12-Channel with Interpretation',
        'SKU-ECG-12CH',
        'HealNex Cardiology',
        'Medical Equipment',
        'ECG Machine',
        45000,
        42000,
        50000,
        1,
        20,
        '90181100',
        12,
        'High-precision 12-channel electrocardiograph featuring 7-inch color display, thermal printer, and arrhythmia detection.',
        'Lead Wire: 10-Lead; Display: 7 Inch TFT; Battery: Rechargeable Li-ion',
        'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400',
        '', '', 3.5, '310x230x70 mm', '2 Years Warranty', 'India', 'HealNex Medical Systems', 'HNX-ECG-120',
        'ECG, Cardiology, Diagnostic', '1-5:42000, 6-10:39500', 'ISO 13485, CE, CDSCO', '1 Unit Box', 'White', 'Standard'
      ]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'HealNex_Vendor_Bulk_Products_Template.xlsx');
    addToast('Downloaded B2B Excel (.xlsx) Template!', 'success');
  };

  // 2. Parse File (CSV / XLSX)
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
      addToast('Invalid file format! Please upload a valid .csv or .xlsx file.', 'error');
      return;
    }

    setDataFileName(file.name);

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedRows(results.data as any[]);
        },
        error: (err) => {
          addToast(`Error parsing CSV file: ${err.message}`, 'error');
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const wb = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const worksheet = wb.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet);
          processParsedRows(jsonRows);
        } catch (err: any) {
          addToast(`Failed to parse Excel file: ${err.message}`, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Process and sanitize raw row objects
  const processParsedRows = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      addToast('Uploaded catalog file contains no data rows!', 'error');
      return;
    }

    const parsed: RawProductRow[] = rows.map((r, index) => {
      const name = sanitizeCsvValue(r.Name || r.name || r['Product Name'] || '');
      const sku = sanitizeCsvValue(r.SKU || r.sku || r['Product SKU'] || `SKU-AUTO-${index + 101}`);
      const brand = sanitizeCsvValue(r.Brand || r.brand || 'HealNex Verified');
      const category = sanitizeCsvValue(r.Category || r.category || '');
      const subcategory = sanitizeCsvValue(r.Subcategory || r.subcategory || '');
      const price = Number(sanitizeCsvValue(r.Price || r.price || 0)) || 0;
      const salePrice = Number(sanitizeCsvValue(r.SalePrice || r.salePrice || price)) || price;
      const mrp = Number(sanitizeCsvValue(r.MRP || r.mrp || price * 1.15)) || price;
      const moq = Number(sanitizeCsvValue(r.MOQ || r.moq || 1)) || 1;
      const stockQuantity = Number(sanitizeCsvValue(r.StockQuantity || r.stockQuantity || r.Stock || 0)) || 0;
      const hsnCode = sanitizeCsvValue(r.HSNCode || r.hsnCode || r.HSN || '9018');
      const gstRate = Number(sanitizeCsvValue(r.GSTRate || r.gstRate || r.GST || 12)) || 12;
      const description = sanitizeCsvValue(r.Description || r.description || '');
      const specification = sanitizeCsvValue(r.Specification || r.specification || r.Specs || '');
      const imageUrl = sanitizeCsvValue(r.ImageURL || r.imageUrl || r.Image || '');
      const image2 = sanitizeCsvValue(r.Image2 || r.image2 || '');
      const image3 = sanitizeCsvValue(r.Image3 || r.image3 || '');
      const weight = Number(sanitizeCsvValue(r.Weight || r.weight || 0)) || 0;
      const dimensions = sanitizeCsvValue(r.Dimensions || r.dimensions || '');
      const warranty = sanitizeCsvValue(r.Warranty || r.warranty || '1 Year Manufacturer Warranty');
      const countryOfOrigin = sanitizeCsvValue(r.CountryOfOrigin || r.countryOfOrigin || 'India');
      const manufacturer = sanitizeCsvValue(r.Manufacturer || r.manufacturer || vendor?.companyName || 'HealNex Vendor');
      const modelNumber = sanitizeCsvValue(r.ModelNumber || r.modelNumber || '');
      const tags = sanitizeCsvValue(r.Tags || r.tags || '');
      const pricingTiers = sanitizeCsvValue(r.PricingTiers || r.pricingTiers || '');
      const certificates = sanitizeCsvValue(r.Certificates || r.certificates || '');
      const packSize = sanitizeCsvValue(r.PackSize || r.packSize || '');
      const color = sanitizeCsvValue(r.Color || r.color || '');
      const size = sanitizeCsvValue(r.Size || r.size || '');

      return {
        rowNum: index + 1,
        name,
        sku,
        brand,
        category,
        subcategory,
        price,
        salePrice,
        mrp,
        moq,
        stockQuantity,
        hsnCode,
        gstRate,
        description,
        specification,
        imageUrl,
        image2,
        image3,
        weight,
        dimensions,
        warranty,
        countryOfOrigin,
        manufacturer,
        modelNumber,
        tags,
        pricingTiers,
        certificates,
        packSize,
        color,
        size,
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
    });

    setRawRows(parsed);
    addToast(`Successfully parsed ${parsed.length} products from ${dataFileName || 'uploaded file'}!`, 'success');
    setCurrentStep(2); // Move to Step 2 (ZIP Images)
  };

  // 3. Process Image ZIP File
  const handleZipUpload = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      addToast('Please select a valid .zip file containing images!', 'error');
      return;
    }

    setZipFileName(file.name);
    setIsProcessingZip(true);

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const imgMap = new Map<string, { url: string; file: File }>();

      const fileEntries = Object.keys(loadedZip.files);
      let matchedCount = 0;

      for (const fileName of fileEntries) {
        const zipObj = loadedZip.files[fileName];
        if (zipObj.dir) continue;

        const cleanName = fileName.split('/').pop() || fileName;
        const ext = cleanName.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
          const blob = await zipObj.async('blob');
          const objectUrl = URL.createObjectURL(blob);
          const imageFile = new File([blob], cleanName, { type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
          
          imgMap.set(cleanName.toLowerCase(), { url: objectUrl, file: imageFile });
          
          // Also set without extension
          const nameWithoutExt = cleanName.substring(0, cleanName.lastIndexOf('.')).toLowerCase();
          imgMap.set(nameWithoutExt, { url: objectUrl, file: imageFile });
        }
      }

      setZipImagesMap(imgMap);

      // Match images with product SKUs
      const updatedRows = rawRows.map(row => {
        const rowSkuClean = (row.sku || '').trim().toLowerCase();
        let matchedUrl = row.imageUrl;

        // Try exact SKU filename match e.g. SKU123.jpg or SKU123
        for (const [key, val] of imgMap.entries()) {
          if (key === rowSkuClean || key.startsWith(`${rowSkuClean}_`) || key.startsWith(`${rowSkuClean}-`)) {
            matchedUrl = val.url;
            matchedCount++;
            break;
          }
        }

        return {
          ...row,
          imageUrl: matchedUrl || row.imageUrl,
          matchedZipImage: matchedUrl !== row.imageUrl ? matchedUrl : undefined
        };
      });

      setRawRows(updatedRows);
      addToast(`Extracted image ZIP! Matched ${matchedCount} images directly with SKUs.`, 'success');
    } catch (err: any) {
      addToast(`Failed to extract ZIP archive: ${err.message}`, 'error');
    } finally {
      setIsProcessingZip(false);
      runValidationAudit();
      setCurrentStep(3); // Proceed to Step 3 Validation Audit
    }
  };

  // 4. Data Validation Audit Engine
  const runValidationAudit = () => {
    const existingProducts = dbLocal.getProducts();
    const vendorProducts = vendor ? existingProducts.filter(p => p.vendorId === vendor.id) : existingProducts;
    const existingSkus = new Set(vendorProducts.map(p => p.sku.toLowerCase()));

    const batchSkuCounts = new Map<string, number>();
    rawRows.forEach(r => {
      const skuClean = (r.sku || '').trim().toLowerCase();
      batchSkuCounts.set(skuClean, (batchSkuCounts.get(skuClean) || 0) + 1);
    });

    const validGstRates = [0, 5, 12, 18, 28];

    const validated = rawRows.map(row => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // SKU validation
      if (!row.sku || !row.sku.trim()) {
        errors.push('Missing SKU: SKU is strictly required.');
      } else {
        const skuClean = row.sku.trim().toLowerCase();
        if ((batchSkuCounts.get(skuClean) || 0) > 1) {
          errors.push(`Duplicate SKU in Upload Batch (${row.sku}). SKUs must be unique.`);
        }
        if (existingSkus.has(skuClean)) {
          warnings.push(`SKU (${row.sku}) already exists in catalog. Action: ${duplicateMode}.`);
        }
      }

      // Name validation
      if (!row.name || !row.name.trim()) {
        errors.push('Missing Name: Product Title is required.');
      }

      // Price validation
      if (row.price === undefined || row.price <= 0) {
        errors.push('Invalid Price: Price must be greater than ₹0.');
      }

      // Stock validation
      if (row.stockQuantity === undefined || row.stockQuantity < 0) {
        errors.push('Missing/Invalid Stock: Quantity must be ≥ 0.');
      }

      // GST validation
      if (!validGstRates.includes(row.gstRate)) {
        errors.push(`Invalid GST Rate (${row.gstRate}%). Allowed rates: 0%, 5%, 12%, 18%, 28%.`);
      }

      // Category validation & Auto-Mapping
      let autoMapped: { mainCategory: string; subcategory: string } | undefined = undefined;
      const catTrim = (row.category || '').trim();
      
      const categoryExists = dbCategories.some(c => c.name.toLowerCase() === catTrim.toLowerCase());

      if (!catTrim || !categoryExists) {
        // Run AI / local fuzzy category mapping algorithm
        const aiMatch = categorizeProductLocally({
          name: row.name,
          brand: row.brand,
          description: row.description,
          sku: row.sku
        });

        if (aiMatch.mainCategory) {
          autoMapped = {
            mainCategory: aiMatch.mainCategory,
            subcategory: aiMatch.subcategory
          };
          suggestions.push(`Auto-Mapped Category: "${aiMatch.mainCategory} -> ${aiMatch.subcategory}" (Confidence ${aiMatch.confidenceScore}%).`);
        } else {
          errors.push(`Missing / Unrecognized Category ("${row.category}"). Please select a valid marketplace category.`);
        }
      }

      // Image URL validation
      if (!row.imageUrl || !row.imageUrl.trim()) {
        warnings.push('Broken/Missing Primary Image URL. A default medical placeholder will be assigned.');
      }

      const isValid = errors.length === 0;

      return {
        ...row,
        category: autoMapped ? autoMapped.mainCategory : (row.category || 'Medical Equipment'),
        subcategory: autoMapped ? autoMapped.subcategory : (row.subcategory || 'General'),
        isValid,
        errors,
        warnings,
        suggestions,
        autoMappedCategory: autoMapped
      };
    });

    setRawRows(validated);
  };

  // Run validation on step change to 3
  useEffect(() => {
    if (currentStep === 3 && rawRows.length > 0) {
      runValidationAudit();
    }
  }, [currentStep, duplicateMode]);

  // 5. Filtered Preview Rows
  const getFilteredRows = () => {
    return rawRows.filter(r => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.brand.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === 'valid') return r.isValid;
      if (filterTab === 'errors') return !r.isValid;
      return true;
    });
  };

  const filteredRows = getFilteredRows();
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // 6. Execute Bulk Import Loop
  const handleExecuteImport = async () => {
    const targetVendor = vendor || dbLocal.getVendors()[0];
    if (!targetVendor) {
      addToast('Vendor profile not found! Cannot complete import.', 'error');
      return;
    }

    const validRows = rawRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      addToast('No valid products to import! Please fix validation errors first.', 'error');
      return;
    }

    setIsImporting(true);
    setCurrentStep(5); // Step 5 Progress Screen

    const existingProducts = dbLocal.getProducts();
    const vendorSkuMap = new Map<string, Product>();
    existingProducts.forEach(p => {
      if (p.vendorId === targetVendor.id) {
        vendorSkuMap.set(p.sku.toLowerCase(), p);
      }
    });

    const errorReports: Array<{
      rowNumber: number;
      sku: string;
      productName: string;
      error: string;
      suggestion: string;
    }> = [];

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const chunkSize = 25; // Chunk size for non-blocking UI
    const totalItems = validRows.length;
    const startTime = Date.now();

    const paymentSettings = dbLocal.getPaymentSettings();
    const platformCommission = targetVendor.customCommissionRate !== undefined
      ? targetVendor.customCommissionRate
      : (paymentSettings.platformCommissionRate || 10);

    const updatedProductList = [...existingProducts];

    // Notify Vendor: Import Started
    dbLocal.addNotification(
      targetVendor.id,
      '⚡ Bulk Catalog Import Started',
      `Bulk synchronization started for ${totalItems} product records.`,
      'import_started'
    );

    for (let i = 0; i < totalItems; i += chunkSize) {
      const chunk = validRows.slice(i, i + chunkSize);

      for (const row of chunk) {
        try {
          const skuClean = row.sku.toLowerCase();
          const existingProd = vendorSkuMap.get(skuClean);

          if (existingProd && duplicateMode === 'skip') {
            skippedCount++;
            continue;
          }

          let finalSku = row.sku;
          if (existingProd && duplicateMode === 'copy') {
            finalSku = `${row.sku}-COPY-${Math.floor(Math.random() * 1000)}`;
          }

          // Calculate vendor payout & final price
          const vendorPrice = row.price;
          const commissionAmount = Math.round(vendorPrice * (platformCommission / 100));
          const finalPrice = vendorPrice + commissionAmount;

          const imageList: string[] = [];
          if (row.imageUrl) imageList.push(row.imageUrl);
          if (row.image2) imageList.push(row.image2);
          if (row.image3) imageList.push(row.image3);
          if (imageList.length === 0) {
            imageList.push('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400');
          }

          // Format specifications
          const specsArray: { key: string; value: string }[] = [];
          if (row.specification) {
            row.specification.split(';').forEach(s => {
              const parts = s.split(':');
              if (parts.length === 2) {
                specsArray.push({ key: parts[0].trim(), value: parts[1].trim() });
              } else if (s.trim()) {
                specsArray.push({ key: 'Feature', value: s.trim() });
              }
            });
          }

          // Format pricing tiers
          let parsedTiers: { minQty: number; price: number }[] | undefined = undefined;
          if (row.pricingTiers) {
            try {
              parsedTiers = row.pricingTiers.split(',').map(t => {
                const [range, p] = t.split(':');
                const minQty = parseInt(range.split('-')[0]) || 1;
                const priceVal = parseFloat(p) || row.price;
                return { minQty, price: priceVal };
              });
            } catch (err) {}
          }

          const productObj: Product = {
            id: (existingProd && duplicateMode === 'update') ? existingProd.id : `prod_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            vendorId: targetVendor.id,
            vendorName: targetVendor.companyName,
            name: row.name,
            sku: finalSku,
            brand: row.brand || 'HealNex Verified',
            category: row.category,
            subcategory: row.subcategory || 'General',
            description: row.description || `${row.name} supplied by ${targetVendor.companyName}.`,
            specifications: specsArray,
            price: row.price,
            salePrice: row.salePrice || row.price,
            vendorPrice,
            commissionRate: platformCommission,
            commissionAmount,
            finalPrice,
            vendorPayout: vendorPrice,
            mrp: row.mrp || row.price * 1.15,
            moq: row.moq || 1,
            stockQuantity: row.stockQuantity,
            hsnCode: row.hsnCode || '9018',
            gstRate: row.gstRate || 12,
            warranty: row.warranty || '1 Year Warranty',
            countryOfOrigin: row.countryOfOrigin || 'India',
            manufacturer: row.manufacturer || targetVendor.companyName,
            modelNumber: row.modelNumber || '',
            tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [row.category, row.brand],
            images: imageList,
            pricingTiers: parsedTiers,
            certifications: row.certificates ? row.certificates.split(',').map(c => c.trim()) : ['ISO 13485', 'CE Approved'],
            weight: row.weight || 0,
            dimensions: row.dimensions ? { length: 0, width: 0, height: 0 } : undefined,
            status: 'Pending', // Strictly set to Pending Approval for Admin Audit
            published: false,
            createdAt: (existingProd && duplicateMode === 'update') ? existingProd.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (existingProd && duplicateMode === 'update') {
            const idx = updatedProductList.findIndex(p => p.id === existingProd.id);
            if (idx !== -1) {
              updatedProductList[idx] = productObj;
              updatedCount++;
            }
          } else {
            updatedProductList.unshift(productObj);
            createdCount++;
          }
        } catch (err: any) {
          failedCount++;
          errorReports.push({
            rowNumber: row.rowNum,
            sku: row.sku,
            productName: row.name,
            error: err.message || 'Error creating product record.',
            suggestion: 'Verify row format and field constraints.'
          });
        }
      }

      // Update state per chunk
      const currentProcessed = Math.min(i + chunkSize, totalItems);
      setProcessedCount(currentProcessed);
      setImportProgress(Math.round((currentProcessed / totalItems) * 100));

      // Yield event loop to keep UI smooth
      await new Promise(r => setTimeout(r, 40));
    }

    // Save batch to database
    dbLocal.saveProducts(updatedProductList);

    // Record Bulk Import Audit Log
    const importLog = {
      id: `bulk_log_${Date.now()}`,
      vendorId: targetVendor.id,
      vendorName: targetVendor.companyName,
      fileName: dataFileName || 'Bulk_Import.csv',
      fileType: (dataFileName.split('.').pop() || 'csv') as 'csv' | 'xlsx' | 'zip',
      totalRecords: totalItems,
      successfulRecords: createdCount + updatedCount,
      failedRecords: failedCount,
      skippedRecords: skippedCount,
      updatedRecords: updatedCount,
      duplicateHandling: duplicateMode === 'skip' ? 'Skip Existing' : duplicateMode === 'update' ? 'Update Existing' : 'Create New Copy',
      status: failedCount === 0 ? 'Completed' : 'Completed with Errors',
      errorReport: errorReports,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const existingLogs = dbLocal.getBulkImportLogs();
    existingLogs.unshift(importLog);
    dbLocal.saveBulkImportLogs(existingLogs);

    // Notify Admin of Pending Approval
    dbLocal.addNotification(
      'admin',
      `📦 Bulk Import Submitted: ${targetVendor.companyName}`,
      `Vendor uploaded ${createdCount + updatedCount} products via Bulk Upload Module requiring compliance audit.`,
      'product_submitted'
    );

    // Notify Vendor of Completion
    dbLocal.addNotification(
      targetVendor.id,
      '✅ Bulk Catalog Synchronization Completed',
      `Import Finished: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${failedCount} failed. Products submitted to Admin for approval.`,
      'import_completed'
    );

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    setImportStats({
      total: totalItems,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      failed: failedCount,
      elapsedSec: elapsed
    });

    setErrorReportData(errorReports);
    setIsImporting(false);
    addToast(`Bulk Import Finished! ${createdCount + updatedCount} products submitted to Admin.`, 'success');
  };

  // Download Error CSV Report
  const handleDownloadErrorReport = () => {
    if (errorReportData.length === 0) {
      addToast('No errors to export!', 'info');
      return;
    }

    const headers = ['Row Number', 'SKU', 'Product Name', 'Error Reason', 'Suggested Fix'];
    const rows = errorReportData.map(e => [
      e.rowNumber,
      `"${e.sku}"`,
      `"${e.productName}"`,
      `"${e.error}"`,
      `"${e.suggestion}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HealNex_Bulk_Import_Error_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-[11px] font-bold tracking-wide uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Vendor Catalog Engine
            </span>
            {isVendorApproved ? (
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Vendor Access
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Verification Required
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-teal-400" />
            Vendor Bulk Product Upload Module
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Synchronize thousands of medical equipment SKUs, B2B price tiers, GST/HSN codes, and image ZIP archives with Cloudflare R2 & AI Auto-Category Mapping.
          </p>
        </div>

        {/* Quick Sample Template Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCsvTemplate}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV Template
          </button>
          <button
            type="button"
            onClick={handleDownloadXlsxTemplate}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Download Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Role-Based Verification Banner */}
      {!isVendorApproved && (
        <div className="bg-amber-50 border-b border-amber-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Verified Vendor Role Access Required
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Bulk catalog import permissions are granted strictly to verified corporate vendors on HealNex Medi Bazar to maintain medical compliance and B2B quality standards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenVerification}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-sm"
          >
            Complete KYC Verification
          </button>
        </div>
      )}

      {/* 5-Step Import Wizard Stepper Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto text-xs font-bold">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-teal-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${currentStep >= 1 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
              1
            </span>
            <span>Upload Catalog File</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200 hidden sm:block" />

          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-teal-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${currentStep >= 2 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
              2
            </span>
            <span>Images ZIP (Optional)</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200 hidden sm:block" />

          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-teal-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${currentStep >= 3 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
              3
            </span>
            <span>Data Validation Audit</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200 hidden sm:block" />

          <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-teal-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${currentStep >= 4 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
              4
            </span>
            <span>Preview & Rules</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200 hidden sm:block" />

          <div className={`flex items-center gap-2 ${currentStep >= 5 ? 'text-teal-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${currentStep >= 5 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
              5
            </span>
            <span>Import & Report</span>
          </div>
        </div>
      </div>

      {/* Main Step Content Panels */}
      <div className="p-6 sm:p-8">
        {/* STEP 1: UPLOAD CSV / XLSX FILE */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Step 1: Upload Product Catalog File</h3>
              <p className="text-xs text-slate-500">
                Select or drag & drop your product catalog file (.CSV or .XLSX format). Supports up to 50,000+ products.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50 rounded-2xl p-8 sm:p-12 text-center transition cursor-pointer group"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv, .xlsx, .xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-16 h-16 bg-white rounded-2xl border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-105 transition">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Click to browse or Drag & Drop Catalog File
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: <strong className="text-teal-800 font-mono">.CSV</strong>, <strong className="text-teal-800 font-mono">.XLSX</strong>, <strong className="text-teal-800 font-mono">.XLS</strong>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Need sample B2B column mapping?</span>
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="text-teal-700 font-bold hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample CSV
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD IMAGE ZIP (OPTIONAL) */}
        {currentStep === 2 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Step 2: Upload Images ZIP Archive (Optional)</h3>
              <p className="text-xs text-slate-500">
                Upload a ZIP file containing product photos (PNG, JPG, WEBP). Images will be automatically matched to product SKUs (e.g., <span className="font-mono text-teal-700 font-bold">SKU-ECG-12CH.jpg</span>).
              </p>
            </div>

            <div
              onClick={() => zipInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/40 rounded-2xl p-8 sm:p-12 text-center transition cursor-pointer group"
            >
              <input
                type="file"
                ref={zipInputRef}
                accept=".zip"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleZipUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 text-teal-700 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-105 transition">
                <FileArchive className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {isProcessingZip ? 'Unzipping & Auto-Matching SKUs...' : 'Click to Upload Product Image ZIP'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Formats: <strong className="text-slate-700 font-mono">.ZIP</strong> (containing .jpg, .png, .webp)
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  runValidationAudit();
                  setCurrentStep(3);
                }}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-extrabold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                Skip / Proceed to Validation Audit
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DATA VALIDATION AUDIT SUMMARY */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  Step 3: Automated Data & Compliance Audit
                </h3>
                <p className="text-xs text-slate-500">
                  Validation rules verified: SKU uniqueness, required fields, price constraints, GST rates, and AI auto-category mapping.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runValidationAudit}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-Run Audit
                </button>
              </div>
            </div>

            {/* Audit Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Records</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{rawRows.length}</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">✓ Valid Products</span>
                <p className="text-2xl font-black text-emerald-800 mt-1">{rawRows.filter(r => r.isValid).length}</p>
              </div>

              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">❌ Validation Errors</span>
                <p className="text-2xl font-black text-rose-800 mt-1">{rawRows.filter(r => !r.isValid).length}</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">✨ AI Auto-Mapped</span>
                <p className="text-2xl font-black text-amber-800 mt-1">{rawRows.filter(r => r.autoMappedCategory).length}</p>
              </div>
            </div>

            {/* Validation Checklist Overview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider">Compliance Rules Checked:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> SKU Required & Unique
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Product Name & Brand Present
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> B2B Price & MRP Constraints (&gt; ₹0)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Valid GST Rate (0%, 5%, 12%, 18%, 28%)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Marketplace Category Taxonomy Match
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Image URL & ZIP SKU Auto-Match
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-extrabold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                Proceed to Preview & Rules Selection
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PREVIEW TABLE & DUPLICATE HANDLING SELECTION */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 4: Product Preview & Synchronization Settings</h3>
                <p className="text-xs text-slate-500">
                  Review row details, auto-mapped categories, and configure how existing SKUs should be handled during import.
                </p>
              </div>

              {/* Duplicate Handling Selector */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 shrink-0">
                <span className="text-[11px] font-bold text-slate-600 px-2">Duplicate SKUs:</span>
                <button
                  type="button"
                  onClick={() => setDuplicateMode('update')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${duplicateMode === 'update' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Update Existing
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateMode('skip')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${duplicateMode === 'skip' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Skip Existing
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateMode('copy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${duplicateMode === 'copy' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Create Copy
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setFilterTab('all'); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                >
                  All ({rawRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterTab('valid'); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterTab === 'valid' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
                >
                  Valid ({rawRows.filter(r => r.isValid).length})
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterTab('errors'); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterTab === 'errors' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600'}`}
                >
                  Errors ({rawRows.filter(r => !r.isValid).length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search SKU or Name..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:border-teal-600"
                />
              </div>
            </div>

            {/* Interactive Preview Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">Row</th>
                    <th className="p-3 w-16">Image</th>
                    <th className="p-3">Product Name & SKU</th>
                    <th className="p-3">Category & Brand</th>
                    <th className="p-3 text-right">Price (₹)</th>
                    <th className="p-3 text-right">Stock</th>
                    <th className="p-3 text-center">GST %</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No rows found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr key={row.rowNum} className={`hover:bg-slate-50/80 transition ${!row.isValid ? 'bg-rose-50/40' : ''}`}>
                        <td className="p-3 text-center font-mono font-bold text-slate-500">{row.rowNum}</td>
                        <td className="p-3">
                          <img
                            src={row.imageUrl || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400'}
                            alt={row.name}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                          />
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 line-clamp-1">{row.name || '—'}</p>
                          <span className="font-mono text-[11px] text-teal-700 font-bold">SKU: {row.sku || 'N/A'}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800">{row.category}</span>
                            {row.autoMappedCategory && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                                ✨ Auto-Mapped
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{row.brand}</span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-teal-800">
                          ₹{row.price.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-800">
                          {row.stockQuantity}
                        </td>
                        <td className="p-3 text-center font-mono font-medium text-slate-600">
                          {row.gstRate}%
                        </td>
                        <td className="p-3 text-center">
                          {row.isValid ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              ✓ Valid
                            </span>
                          ) : (
                            <div className="group relative inline-block">
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1 cursor-help">
                                ❌ {row.errors.length} Error(s)
                              </span>
                              <div className="hidden group-hover:block absolute right-0 z-20 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-[11px] space-y-1">
                                {row.errors.map((e, idx) => (
                                  <p key={idx} className="text-rose-300">• {e}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Showing Page {currentPage} of {totalPages} ({filteredRows.length} total rows)</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-slate-50 font-bold"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-slate-50 font-bold"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Step Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                disabled={rawRows.filter(r => r.isValid).length === 0}
                onClick={handleExecuteImport}
                className="px-8 py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Execute Bulk Import ({rawRows.filter(r => r.isValid).length} Products)
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: REAL-TIME PROGRESS & IMPORT REPORT */}
        {currentStep === 5 && (
          <div className="max-w-2xl mx-auto space-y-6">
            {isImporting ? (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 bg-teal-50 border-2 border-teal-500/30 text-teal-700 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <RefreshCw className="w-10 h-10 animate-spin" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">Synchronizing Catalog to Marketplace...</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Chunk-based non-blocking import processing with B2B margin recalculation and Admin audit logging.
                  </p>
                </div>

                {/* Animated Real-Time Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Import Progress</span>
                    <span className="text-teal-800 font-mono text-sm">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-0.5 border border-slate-300">
                    <div
                      className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Products Processed: {processedCount} / {rawRows.filter(r => r.isValid).length}</span>
                    <span>Status: Chunk Processing</span>
                  </div>
                </div>
              </div>
            ) : (
              /* IMPORT SUMMARY REPORT SCREEN */
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Bulk Product Synchronization Complete</h3>
                  <p className="text-xs text-slate-500">
                    All valid product rows processed and submitted for Admin Compliance Audit.
                  </p>
                </div>

                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-slate-50 rounded-xl border text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Records</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{importStats.total}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Created</span>
                    <p className="text-xl font-black text-emerald-800 mt-0.5">{importStats.created}</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center">
                    <span className="text-[10px] font-bold text-teal-700 uppercase">Updated</span>
                    <p className="text-xl font-black text-teal-800 mt-0.5">{importStats.updated}</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Failed</span>
                    <p className="text-xl font-black text-rose-800 mt-0.5">{importStats.failed}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  {errorReportData.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download Error Report CSV ({errorReportData.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setRawRows([]);
                      if (onSuccess) onSuccess();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-extrabold uppercase transition shadow-sm ml-auto cursor-pointer"
                  >
                    Start New Bulk Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorBulkUploadModule;
