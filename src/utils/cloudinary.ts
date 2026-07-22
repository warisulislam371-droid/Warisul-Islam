/**
 * Utility for uploading vendor documents and files to Cloudinary.
 */

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  original_filename: string;
  format?: string;
  resource_type?: string;
}

export async function uploadVendorDocumentToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const cloudName =
    (import.meta as any).env?.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME ||
    'kpb5rcow';
  const uploadPreset =
    (import.meta as any).env?.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET ||
    'healnex_products';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'vendor_documents');

  // Use 'auto/upload' so Cloudinary accepts images, PDFs, raw docs
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cloudinary Document Upload Error Response:', errorText);
    throw new Error(`Cloudinary document upload failed with status ${response.status}`);
  }

  const data = await response.json();

  return {
    url: data.secure_url || data.url,
    public_id: data.public_id || '',
    original_filename: data.original_filename || file.name,
    format: data.format,
    resource_type: data.resource_type,
  };
}
