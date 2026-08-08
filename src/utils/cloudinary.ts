/**
 * Cloudinary CDN Storage Utility for HealNex Medi Bazar
 * Primary Cloud Infrastructure for storing and serving medical equipment images, vendor documents & payment receipts
 */

export interface CloudinaryUploadResult {
  url: string;
  secure_url?: string;
  public_id: string;
  storage_path?: string;
  original_filename: string;
  format?: string;
  resource_type?: string;
  thumbnail_url?: string;
  bytes?: number;
  created_at?: string;
  provider?: string;
  SKU?: string;
  category?: string;
  uploaded_by?: string;
  image_url?: string;
  file_size?: number;
}

/**
 * Upload product image to Cloudinary CDN storage via server API
 */
export async function uploadProductImageToCloudinary(
  file: File,
  category: string = 'general',
  sku: string = 'SKU000',
  uploadedBy: string = 'Vendor',
  productId?: string
): Promise<CloudinaryUploadResult> {
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
    throw new Error(`Cloudinary Upload failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    ...data,
    url: data.image_url || data.url || data.secure_url,
    secure_url: data.image_url || data.url || data.secure_url,
    public_id: data.public_id || data.storage_path || '',
    storage_path: data.public_id || data.storage_path || '',
    original_filename: file.name,
    format: 'webp',
    provider: 'Cloudinary'
  };
}

/**
 * Upload any medical product, vendor document, or payment proof file to Cloudinary CDN
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = 'products',
  category: string = 'general',
  sku: string = 'SKU000'
): Promise<CloudinaryUploadResult> {
  return uploadProductImageToCloudinary(file, category, sku, 'Vendor');
}

/**
 * Upload vendor verification document (GST, PAN, Medical License) to Cloudinary CDN
 */
export async function uploadVendorDocumentToCloudinary(file: File): Promise<CloudinaryUploadResult> {
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
    throw new Error(`Document upload to Cloudinary failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    url: data.image_url || data.url,
    secure_url: data.image_url || data.url,
    public_id: data.public_id || data.storage_path || '',
    storage_path: data.public_id || data.storage_path || '',
    original_filename: file.name,
    format: file.name.split('.').pop() || 'file',
    created_at: data.uploaded_at,
    provider: 'Cloudinary'
  };
}

/**
 * Upload order payment proofs and bank transfer receipts to Cloudinary CDN
 */
export async function uploadOrderDocumentToCloudinary(file: File, subFolder = 'order_payments'): Promise<CloudinaryUploadResult> {
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
    throw new Error(`Order payment proof upload to Cloudinary failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    url: data.image_url || data.url,
    secure_url: data.image_url || data.url,
    public_id: data.public_id || data.storage_path || '',
    storage_path: data.public_id || data.storage_path || '',
    original_filename: file.name,
    format: file.name.split('.').pop() || 'file',
    created_at: data.uploaded_at,
    provider: 'Cloudinary'
  };
}

/**
 * Delete image from Cloudinary storage
 */
export async function deleteImageFromCloudinary(storagePath: string, productId?: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/delete-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storage_path: storagePath,
      public_id: storagePath,
      product_id: productId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete image from Cloudinary (${response.status})`);
  }

  return await response.json();
}

/**
 * Replace existing image in Cloudinary
 */
export async function updateImageInCloudinary(
  oldStoragePath: string,
  newFile: File,
  category: string = 'general',
  sku: string = 'SKU000',
  productId?: string
): Promise<CloudinaryUploadResult> {
  const base64Data = await fileToBase64(newFile);

  const response = await fetch('/api/update-image', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      old_storage_path: oldStoragePath,
      old_public_id: oldStoragePath,
      newImageBase64: base64Data,
      fileName: newFile.name,
      contentType: newFile.type,
      category,
      sku,
      product_id: productId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update image in Cloudinary (${response.status})`);
  }

  return await response.json();
}

/**
 * Fetch marketplace Cloudinary storage gallery & usage stats
 */
export async function getMarketplaceImagesFromCloudinary(): Promise<{
  files: any[];
  stats: {
    totalFiles: number;
    totalSizeBytes: number;
    totalSizeMB: string;
    bucketName: string;
    r2Configured: boolean;
    cloudName: string;
    publicCdnUrl: string;
  };
}> {
  const response = await fetch('/api/images');
  if (!response.ok) {
    throw new Error(`Failed to fetch Cloudinary images (${response.status})`);
  }
  return await response.json();
}

/**
 * Helper to convert browser File to Base64 String
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
