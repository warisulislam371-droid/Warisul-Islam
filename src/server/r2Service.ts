import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command,
  GetObjectCommand 
} from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 Storage Service for HealNex Medi Bazar
 * S3-Compatible Object Storage for Medical Marketplace Images & Assets
 */

export interface R2UploadParams {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  category?: string;
  sku?: string;
  uploadedBy?: string;
  folder?: string;
}

export interface R2UploadResult {
  imageUrl: string;
  thumbnailUrl: string;
  storagePath: string;
  fileSize: number;
  category: string;
  sku: string;
  uploadedBy: string;
  uploadedAt: string;
  contentType: string;
}

export interface R2StorageStats {
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMB: string;
  bucketName: string;
  r2Configured: boolean;
  publicCdnUrl: string;
}

// Helper to sanitize path strings for Cloudflare R2 object keys
function sanitizePathComponent(val: string, fallback: string = 'general'): string {
  if (!val || typeof val !== 'string') return fallback;
  const cleaned = val
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || fallback;
}

function sanitizeSku(val: string, fallback: string = 'SKU000'): string {
  if (!val || typeof val !== 'string') return fallback;
  const cleaned = val
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
  return cleaned || fallback;
}

function sanitizeFileName(val: string, fallback: string = 'image.webp'): string {
  if (!val || typeof val !== 'string') return fallback;
  const parts = val.trim().split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || 'webp' : 'webp';
  const name = parts.join('-').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  return `${name || 'file'}.${ext}`;
}

// Get initialized AWS S3 client instance configured for Cloudflare R2
export function getR2S3Client(): { s3: S3Client | null; bucketName: string; publicCdnUrl: string; isConfigured: boolean } {
  const accountId = process.env.R2_ACCOUNT_ID || '';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
  const bucketName = process.env.R2_BUCKET_NAME || 'healnex-medi-bazar-storage';
  const endpointUrl = process.env.R2_ENDPOINT_URL || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  const publicCdnUrl = (process.env.R2_PUBLIC_URL || `https://cdn.healnex.com`).replace(/\/+$/, '');

  const isConfigured = Boolean(accessKeyId && secretAccessKey && (endpointUrl || accountId));

  if (!isConfigured) {
    return { s3: null, bucketName, publicCdnUrl, isConfigured: false };
  }

  try {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: endpointUrl || `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return { s3, bucketName, publicCdnUrl, isConfigured: true };
  } catch (err) {
    console.warn('[Cloudflare R2] Failed to initialize S3 client:', err);
    return { s3: null, bucketName, publicCdnUrl, isConfigured: false };
  }
}

/**
 * Upload an image or file buffer to Cloudflare R2 bucket.
 * Follows storage path format: healnex/products/{category}/{SKU}/{timestamp}-{filename}
 */
export async function uploadToR2(params: R2UploadParams): Promise<R2UploadResult> {
  const { buffer, fileName, contentType, category = 'general', sku = 'SKU000', uploadedBy = 'System', folder } = params;

  const cleanCategory = sanitizePathComponent(category, 'general');
  const cleanSku = sanitizeSku(sku, 'SKU000');
  const cleanName = sanitizeFileName(fileName, 'image.webp');
  const timestamp = Math.floor(Date.now() / 1000);

  // Storage path format: healnex/products/{category}/{SKU}/{timestamp}-{filename}
  const storagePath = folder 
    ? `healnex/${folder}/${timestamp}-${cleanName}`
    : `healnex/products/${cleanCategory}/${cleanSku}/${timestamp}-${cleanName}`;

  const thumbStoragePath = folder 
    ? `healnex/${folder}/thumb_${timestamp}-${cleanName}`
    : `healnex/products/${cleanCategory}/${cleanSku}/thumb_${timestamp}-${cleanName}`;

  const { s3, bucketName, publicCdnUrl, isConfigured } = getR2S3Client();

  const imageUrl = `${publicCdnUrl}/${storagePath}`;
  const thumbnailUrl = `${publicCdnUrl}/${thumbStoragePath}`;
  const uploadedAt = new Date().toISOString();

  if (s3 && isConfigured) {
    try {
      // Put main object in R2
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: storagePath,
        Body: buffer,
        ContentType: contentType || 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: {
          category: cleanCategory,
          sku: cleanSku,
          uploadedBy,
          uploadedAt,
        },
      });

      await s3.send(command);

      // Put thumbnail copy in R2
      const thumbCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: thumbStoragePath,
        Body: buffer,
        ContentType: contentType || 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      });

      await s3.send(thumbCommand);

      console.log(`[Cloudflare R2] Successfully uploaded object to R2 bucket: ${storagePath}`);
    } catch (err: any) {
      console.error(`[Cloudflare R2 Upload Error]: ${err?.message || err}`);
      // Fallback response with notice if R2 credentials or bucket permission fails
    }
  } else {
    console.log(`[Cloudflare R2 Notice] R2 credentials not fully set in environment. Generated CDN path: ${storagePath}`);
  }

  return {
    imageUrl,
    thumbnailUrl,
    storagePath,
    fileSize: buffer.length,
    category: cleanCategory,
    sku: cleanSku,
    uploadedBy,
    uploadedAt,
    contentType: contentType || 'image/webp',
  };
}

/**
 * Delete an object from Cloudflare R2 bucket by storage path or URL
 */
export async function deleteFromR2(storagePathOrUrl: string): Promise<{ success: boolean; storagePath: string }> {
  if (!storagePathOrUrl) {
    return { success: false, storagePath: '' };
  }

  // Extract relative storage path if full CDN URL was passed
  let storagePath = storagePathOrUrl;
  if (storagePath.includes('http://') || storagePath.includes('https://')) {
    try {
      const urlObj = new URL(storagePath);
      storagePath = urlObj.pathname.replace(/^\/+/, '');
    } catch (e) {
      // Ignore URL parse error
    }
  }

  const { s3, bucketName, isConfigured } = getR2S3Client();

  if (s3 && isConfigured) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: storagePath,
      });

      await s3.send(command);

      // Try deleting thumbnail as well
      const thumbPath = storagePath.replace(/\/([^/]+)$/, '/thumb_$1');
      const thumbCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: thumbPath,
      });
      await s3.send(thumbCommand).catch(() => {});

      console.log(`[Cloudflare R2] Deleted object from R2: ${storagePath}`);
    } catch (err: any) {
      console.error(`[Cloudflare R2 Delete Error]: ${err?.message || err}`);
    }
  }

  return { success: true, storagePath };
}

/**
 * List images in Cloudflare R2 storage bucket with statistics
 */
export async function listR2Images(prefix: string = 'healnex/'): Promise<{
  files: Array<{
    key: string;
    size: number;
    lastModified: string;
    url: string;
  }>;
  stats: R2StorageStats;
}> {
  const { s3, bucketName, publicCdnUrl, isConfigured } = getR2S3Client();

  const files: Array<{
    key: string;
    size: number;
    lastModified: string;
    url: string;
  }> = [];

  let totalSizeBytes = 0;

  if (s3 && isConfigured) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
      });

      const response = await s3.send(command);
      const items = response.Contents || [];

      items.forEach((item) => {
        if (item.Key && !item.Key.includes('thumb_')) {
          const size = item.Size || 0;
          totalSizeBytes += size;
          files.push({
            key: item.Key,
            size,
            lastModified: item.LastModified ? item.LastModified.toISOString() : new Date().toISOString(),
            url: `${publicCdnUrl}/${item.Key}`,
          });
        }
      });
    } catch (err: any) {
      console.error(`[Cloudflare R2 List Error]: ${err?.message || err}`);
    }
  }

  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  return {
    files,
    stats: {
      totalFiles: files.length,
      totalSizeBytes,
      totalSizeMB: `${totalSizeMB} MB`,
      bucketName,
      r2Configured: isConfigured,
      publicCdnUrl,
    },
  };
}
