/**
 * Cloudinary CDN Storage Service (Replaces Cloudflare R2)
 * Provides backward-compatible signatures delegating to Cloudinary CDN Engine
 */

import { 
  uploadToCloudinary, 
  deleteFromCloudinary, 
  listCloudinaryImages, 
  CloudinaryUploadParams, 
  CloudinaryUploadResult, 
  CloudinaryStorageStats 
} from './cloudinaryService';

export type R2UploadParams = CloudinaryUploadParams;
export type R2UploadResult = CloudinaryUploadResult;
export type R2StorageStats = CloudinaryStorageStats;

export function getR2S3Client() {
  return { s3: null, bucketName: 'healnex-medibazar', publicCdnUrl: 'https://res.cloudinary.com', isConfigured: true };
}

export async function uploadToR2(params: R2UploadParams): Promise<R2UploadResult> {
  return uploadToCloudinary(params);
}

export async function deleteFromR2(storagePathOrUrl: string): Promise<{ success: boolean; storagePath: string }> {
  const result = await deleteFromCloudinary(storagePathOrUrl);
  return { success: result.success, storagePath: result.publicId };
}

export async function listR2Images(prefix: string = 'healnex/'): Promise<{
  files: Array<{
    key: string;
    size: number;
    lastModified: string;
    url: string;
  }>;
  stats: R2StorageStats;
}> {
  return listCloudinaryImages(prefix);
}
