/**
 * Cloudinary CDN Storage Client Bridge
 * Redirects all product image, document, and asset uploads to Cloudinary CDN Storage
 */

import {
  uploadProductImageToCloudinary,
  uploadVendorDocumentToCloudinary as uploadVendorDocumentToCloudinaryImpl,
  uploadOrderDocumentToCloudinary as uploadOrderDocumentToCloudinaryImpl,
  deleteImageFromCloudinary,
  updateImageInCloudinary,
  getMarketplaceImagesFromCloudinary,
  CloudinaryUploadResult
} from './cloudinary';

export type R2UploadResponse = CloudinaryUploadResult;

/**
 * Upload product image to Cloudinary CDN bucket via server API
 */
export async function uploadProductImageToR2(
  file: File,
  category: string = 'general',
  sku: string = 'SKU000',
  uploadedBy: string = 'Vendor',
  productId?: string
): Promise<R2UploadResponse> {
  return uploadProductImageToCloudinary(file, category, sku, uploadedBy, productId);
}

/**
 * Upload vendor verification documents (GST, PAN, Cheque) to Cloudinary CDN
 */
export async function uploadVendorDocumentToR2(file: File): Promise<R2UploadResponse> {
  return uploadVendorDocumentToCloudinaryImpl(file);
}

/**
 * Upload order invoices, payment proofs, and receipts to Cloudinary CDN
 */
export async function uploadOrderDocumentToR2(file: File, subFolder: string = 'payment_proofs'): Promise<R2UploadResponse> {
  return uploadOrderDocumentToCloudinaryImpl(file, subFolder);
}

/**
 * Delete image from Cloudinary storage
 */
export async function deleteImageFromR2(storagePath: string, productId?: string): Promise<{ success: boolean }> {
  return deleteImageFromCloudinary(storagePath, productId);
}

/**
 * Replace existing image in Cloudinary storage
 */
export async function updateImageInR2(
  oldStoragePath: string,
  newFile: File,
  category: string = 'general',
  sku: string = 'SKU000',
  productId?: string
): Promise<R2UploadResponse> {
  return updateImageInCloudinary(oldStoragePath, newFile, category, sku, productId);
}

/**
 * Fetch marketplace Cloudinary storage gallery & usage stats
 */
export async function getMarketplaceImagesFromR2(): Promise<{
  files: any[];
  stats: {
    totalFiles: number;
    totalSizeBytes: number;
    totalSizeMB: string;
    bucketName: string;
    r2Configured: boolean;
    cloudName?: string;
    publicCdnUrl: string;
  };
}> {
  return getMarketplaceImagesFromCloudinary();
}

// Backward Compatibility Aliases for Cloudinary
export const uploadVendorDocumentToCloudinary = uploadVendorDocumentToR2;
export const uploadOrderDocumentToCloudinary = uploadOrderDocumentToR2;
