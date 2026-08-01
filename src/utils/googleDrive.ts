import { GoogleDriveFile, GoogleDriveLog } from '../types';

/**
 * Extracts a Google Drive File ID from any Google Drive URL format or raw ID string.
 */
export function extractDriveFileId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const str = urlOrId.trim();

  // If it's already a clean alphanumeric/hyphen ID without slashes or dots
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
    return str;
  }

  // Standard match patterns
  const matchFileD = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  const matchIdParam = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  const matchUserContent = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchUserContent && matchUserContent[1]) return matchUserContent[1];

  return null;
}

/**
 * Formats a Google Drive File ID into a reliable high-res direct image URL.
 */
export function getDriveDirectUrl(fileIdOrUrl: string): string {
  const fileId = extractDriveFileId(fileIdOrUrl);
  if (!fileId) return fileIdOrUrl;
  
  // Return high quality direct thumbnail link (fallback-resilient across modern browsers & CORS)
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

/**
 * Formats a Google Drive File ID into standard export view link.
 */
export function getDriveExportUrl(fileIdOrUrl: string): string {
  const fileId = extractDriveFileId(fileIdOrUrl);
  if (!fileId) return fileIdOrUrl;
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Generates an automatic standardized file name: Category_ProductName_SKU_Timestamp.webp
 * Strips special characters and replaces spaces with underscores.
 */
export function formatDriveFileName(
  category: string = 'General',
  productName: string = 'Product',
  sku: string = 'SKU',
  timestamp: number = Date.now()
): string {
  const clean = (str: string) => 
    str
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

  const cat = clean(category) || 'Products';
  const prod = clean(productName) || 'Medical_Item';
  const s = clean(sku) || 'HNX';
  const ts = Math.floor(timestamp / 1000);

  return `${cat}_${prod}_${s}_${ts}.webp`;
}

/**
 * Image processing: Convert file or data URL to WebP, resize max dimensions, compress.
 */
export async function processImageForDrive(
  file: File | string,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.85
): Promise<{ dataUrl: string; width: number; height: number; size: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // Draw image to strip metadata & optimize
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/webp', quality);
      // Rough byte calculation from base64
      const base64Len = dataUrl.split(',')[1]?.length || 0;
      const size = Math.round((base64Len * 3) / 4);

      resolve({ dataUrl, width, height, size });
    };

    img.onerror = (err) => reject(new Error('Failed to process image canvas'));

    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Medical categories folder hierarchy map
 */
export const DRIVE_FOLDER_STRUCTURE = {
  root: 'HealNex-Medi-Bazar',
  subfolders: {
    Products: [
      'ECG',
      'Ultrasound',
      'X-Ray',
      'ICU',
      'OT',
      'Dental',
      'Laboratory',
      'Monitors',
      'Ventilators',
      'Patient Monitoring',
      'Surgical',
      'Consumables',
      'Accessories'
    ],
    Brands: [
      'HealNex',
      'GE',
      'Philips',
      'Siemens',
      'Mindray',
      'Contec',
      'BPL'
    ],
    Vendors: [],
    Website: [
      'Homepage',
      'Slider',
      'Categories',
      'Banners'
    ],
    Certificates: [],
    Documents: [],
    Logos: [],
    Blog: [],
    News: []
  }
};
