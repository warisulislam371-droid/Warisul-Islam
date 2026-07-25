/**
 * Comprehensive utility for uploading images, PDFs, documents, certificates, and media to Cloudinary.
 * Uses full-stack server API proxy (/api/cloudinary/upload) with client-side direct REST API fallback.
 */

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  original_filename: string;
  format?: string;
  resource_type?: string;
  bytes?: number;
}

/**
 * Convert a File object to base64 Data URL string
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file contents'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a File, Blob, or base64 Data URL to Cloudinary via server proxy or client fallback.
 */
export async function uploadToCloudinary(
  fileInput: File | Blob | string,
  folder: string = 'healnex_uploads',
  customFileName?: string
): Promise<CloudinaryUploadResult> {
  let fileDataUrl: string = '';
  let fileName = customFileName || 'file';

  if (typeof fileInput === 'string') {
    fileDataUrl = fileInput;
  } else {
    fileName = customFileName || (fileInput as File).name || 'uploaded_document';
    fileDataUrl = await fileToDataUrl(fileInput);
  }

  // 1. First attempt: Server API proxy (/api/cloudinary/upload)
  try {
    const serverRes = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: fileDataUrl,
        folder,
        fileName,
        resourceType: 'auto',
      }),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data.url) {
        return {
          url: data.url,
          public_id: data.public_id || '',
          original_filename: data.original_filename || fileName,
          format: data.format,
          resource_type: data.resource_type,
          bytes: data.bytes,
        };
      }
    } else {
      console.warn('[Cloudinary Utility] Server proxy response not OK, attempting direct client fallback...');
    }
  } catch (err) {
    console.warn('[Cloudinary Utility] Server route request failed, falling back to client REST API:', err);
  }

  // 2. Fallback: Direct REST API upload to Cloudinary
  const cloudName =
    (import.meta as any).env?.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME ||
    'kpb5rcow';
  const uploadPreset =
    (import.meta as any).env?.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET ||
    'healnex_products';
  const apiKey =
    (import.meta as any).env?.VITE_CLOUDINARY_API_KEY ||
    '149468495256154';

  const formData = new FormData();
  if (typeof fileInput === 'string') {
    formData.append('file', fileInput);
  } else {
    formData.append('file', fileInput);
  }
  formData.append('upload_preset', uploadPreset);
  formData.append('api_key', apiKey);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Cloudinary Direct Upload Error]:', errorText);
    throw new Error(`Cloudinary upload failed: ${response.statusText || errorText}`);
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    public_id: data.public_id || '',
    original_filename: data.original_filename || fileName,
    format: data.format,
    resource_type: data.resource_type,
    bytes: data.bytes,
  };
}

export async function uploadVendorDocumentToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'vendor_documents');
}

export async function uploadProductImageToCloudinary(file: File | string): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'product_images');
}

export async function uploadPrescriptionToCloudinary(file: File | string): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'prescriptions');
}

export async function uploadReceiptToCloudinary(file: File | string): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'payment_receipts');
}

export async function uploadSiteBannerToCloudinary(file: File | string): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'site_banners');
}

