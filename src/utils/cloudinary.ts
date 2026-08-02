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
      uploadedBy: 'Vendor',
      folder
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    url: data.image_url || data.url || data.secure_url,
    secure_url: data.image_url || data.url || data.secure_url,
    public_id: data.public_id || data.storage_path || '',
    storage_path: data.public_id || data.storage_path || '',
    original_filename: file.name,
    format: file.name.split('.').pop() || 'webp',
    thumbnail_url: data.thumbnail_url,
    bytes: data.file_size,
    created_at: data.upload_date,
    provider: 'Cloudinary'
  };
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
