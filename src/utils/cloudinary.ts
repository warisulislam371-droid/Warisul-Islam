/**
 * Cloudflare R2 Storage Adapter (Replaces legacy Cloudinary)
 */
import { uploadVendorDocumentToR2, uploadOrderDocumentToR2, R2UploadResponse } from './r2Storage';

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  original_filename: string;
  format?: string;
  resource_type?: string;
}

export async function uploadVendorDocumentToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const res: R2UploadResponse = await uploadVendorDocumentToR2(file);
  return {
    url: res.image_url || res.url,
    public_id: res.storage_path || res.public_id,
    original_filename: res.original_filename || file.name,
    format: res.format,
  };
}

export async function uploadOrderDocumentToCloudinary(file: File, subFolder = 'order_payments'): Promise<CloudinaryUploadResult> {
  const res: R2UploadResponse = await uploadOrderDocumentToR2(file, subFolder);
  return {
    url: res.image_url || res.url,
    public_id: res.storage_path || res.public_id,
    original_filename: res.original_filename || file.name,
    format: res.format,
  };
}

