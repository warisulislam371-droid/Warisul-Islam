/**
 * Cloudflare R2 Storage Client Utility for HealNex Medi Bazar
 * Replaces Cloudinary & Google Drive with high-performance Cloudflare R2 CDN Storage
 */

export interface R2UploadResponse {
  success: boolean;
  product_id?: string;
  product_name?: string;
  SKU: string;
  category: string;
  image_url: string;
  thumbnail_url: string;
  storage_path: string;
  file_size: number;
  uploaded_by: string;
  upload_date: string;
  url: string; // Alias for image_url
  public_id: string; // Storage path alias
  original_filename: string;
  format: string;
}

/**
 * Upload product image to Cloudflare R2 bucket via server API
 */
export async function uploadProductImageToR2(
  file: File,
  category: string = 'general',
  sku: string = 'SKU000',
  uploadedBy: string = 'Vendor',
  productId?: string
): Promise<R2UploadResponse> {
  const base64Data = await fileToBase64(file);

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64Data,
      fileName: file.name,
      contentType: file.type || 'image/webp',
      category,
      sku,
      uploadedBy,
      productId,
      convertToWebP: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`R2 Upload failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    ...data,
    url: data.image_url || data.url,
    public_id: data.storage_path || data.public_id || '',
    original_filename: file.name,
    format: 'webp',
  };
}

/**
 * Upload vendor verification documents (GST, PAN, Cheque) to Cloudflare R2 bucket
 */
export async function uploadVendorDocumentToR2(file: File): Promise<R2UploadResponse> {
  const base64Data = await fileToBase64(file);

  const response = await fetch('/api/r2/upload-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileData: base64Data,
      fileName: file.name,
      contentType: file.type,
      folder: 'vendor_documents',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Document upload to R2 failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    ...data,
    url: data.image_url || data.url,
    public_id: data.storage_path || '',
    original_filename: file.name,
    format: file.name.split('.').pop() || 'file',
  };
}

/**
 * Upload order invoices, payment proofs, and receipts to Cloudflare R2 bucket
 */
export async function uploadOrderDocumentToR2(file: File, subFolder: string = 'payment_proofs'): Promise<R2UploadResponse> {
  const base64Data = await fileToBase64(file);

  const response = await fetch('/api/r2/upload-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileData: base64Data,
      fileName: file.name,
      contentType: file.type,
      folder: `orders/${subFolder}`,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Order document upload to R2 failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    ...data,
    url: data.image_url || data.url,
    public_id: data.storage_path || '',
    original_filename: file.name,
    format: file.name.split('.').pop() || 'file',
  };
}

/**
 * Delete image from Cloudflare R2 bucket
 */
export async function deleteImageFromR2(storagePath: string, productId?: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/delete-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storage_path: storagePath,
      product_id: productId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete image from R2 (${response.status})`);
  }

  return await response.json();
}

/**
 * Replace existing image in Cloudflare R2
 */
export async function updateImageInR2(
  oldStoragePath: string,
  newFile: File,
  category: string = 'general',
  sku: string = 'SKU000',
  productId?: string
): Promise<R2UploadResponse> {
  const base64Data = await fileToBase64(newFile);

  const response = await fetch('/api/update-image', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      old_storage_path: oldStoragePath,
      newImageBase64: base64Data,
      fileName: newFile.name,
      contentType: newFile.type,
      category,
      sku,
      product_id: productId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update image in R2 (${response.status})`);
  }

  return await response.json();
}

/**
 * Fetch marketplace R2 storage gallery & usage stats
 */
export async function getMarketplaceImagesFromR2(): Promise<{
  files: any[];
  stats: {
    totalFiles: number;
    totalSizeBytes: number;
    totalSizeMB: string;
    bucketName: string;
    r2Configured: boolean;
    publicCdnUrl: string;
  };
}> {
  const response = await fetch('/api/images');
  if (!response.ok) {
    throw new Error(`Failed to fetch R2 images (${response.status})`);
  }
  return await response.json();
}

/**
 * Helper to convert browser File object to Base64 String
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Backward Compatibility Aliases for smooth migration from Cloudinary to R2
export const uploadVendorDocumentToCloudinary = uploadVendorDocumentToR2;
export const uploadOrderDocumentToCloudinary = uploadOrderDocumentToR2;
