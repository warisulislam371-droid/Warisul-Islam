import { Router, Request, Response } from 'express';
import { GoogleDriveService } from '../utils/googleDriveService';
import { extractDriveFileId, getDriveDirectUrl, getDriveExportUrl, formatDriveFileName, DRIVE_FOLDER_STRUCTURE } from '../utils/googleDrive';
import JSZip from 'jszip';

export const googleDriveRouter = Router();

// In-memory persistent fallback store if DB sync is pending
const driveFilesStore: any[] = [];
const driveLogsStore: any[] = [];

// 1. Single / Multi Image Upload Endpoint
googleDriveRouter.post('/upload', async (req: Request, res: Response) => {
  try {
    const {
      images, // string[] or string
      category,
      productName,
      sku,
      brand,
      vendorId,
      vendorName,
      uploadedBy,
      uploadedByRole,
      productId,
      folderPath
    } = req.body;

    const imageList: string[] = Array.isArray(images) ? images : (images ? [images] : []);
    if (imageList.length === 0) {
      return res.status(400).json({ error: 'No image data provided in upload request.' });
    }

    const uploadedFiles: any[] = [];
    const createdLogs: any[] = [];

    for (let i = 0; i < imageList.length; i++) {
      const fileData = imageList[i];
      const result = await GoogleDriveService.uploadImage({
        fileData,
        category: category || 'General',
        productName: productName || 'Medical Equipment',
        sku: sku || 'HNX',
        brand: brand || 'HealNex',
        vendorId: vendorId || 'vendor-default',
        vendorName: vendorName || 'Vendor Partner',
        uploadedBy: uploadedBy || 'Admin User',
        uploadedByRole: uploadedByRole || 'admin',
        productId: productId || '',
        folderPath: folderPath || 'Products'
      });

      uploadedFiles.push(result.file);
      createdLogs.push(result.log);
      driveFilesStore.unshift(result.file);
      driveLogsStore.unshift(result.log);
    }

    return res.json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
      logs: createdLogs,
      message: `Successfully uploaded ${uploadedFiles.length} file(s) to Google Drive.`
    });
  } catch (err: any) {
    console.error('[Drive API Error /upload]:', err);
    res.status(500).json({ error: err.message || 'Drive upload failed' });
  }
});

// 2. ZIP Batch Upload Endpoint
googleDriveRouter.post('/zip-upload', async (req: Request, res: Response) => {
  try {
    const { zipBase64, category, vendorId, vendorName, uploadedBy, uploadedByRole, folderPath } = req.body;
    if (!zipBase64) {
      return res.status(400).json({ error: 'zipBase64 payload parameter required.' });
    }

    const cleanBase64 = zipBase64.replace(/^data:[^;]+;base64,/, '');
    const zipBuffer = Buffer.from(cleanBase64, 'base64');

    const zip = await JSZip.loadAsync(zipBuffer);
    const uploadedFiles: any[] = [];
    const createdLogs: any[] = [];

    for (const filename of Object.keys(zip.files)) {
      const fileObj = zip.files[filename];
      if (fileObj.dir) continue;

      const ext = filename.toLowerCase();
      if (!ext.endsWith('.jpg') && !ext.endsWith('.jpeg') && !ext.endsWith('.png') && !ext.endsWith('.webp')) {
        continue;
      }

      const fileBase64 = await fileObj.async('base64');
      const mimeType = ext.endsWith('.png') ? 'image/png' : ext.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${fileBase64}`;

      const baseName = filename.split('/').pop()?.split('.')[0] || 'ZipProduct';
      const result = await GoogleDriveService.uploadImage({
        fileData: dataUrl,
        category: category || 'Batch',
        productName: baseName,
        sku: `ZIP-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorId: vendorId || 'vendor-default',
        vendorName: vendorName || 'Vendor Partner',
        uploadedBy: uploadedBy || 'Admin User',
        uploadedByRole: uploadedByRole || 'admin',
        folderPath: folderPath || 'Products'
      });

      uploadedFiles.push(result.file);
      createdLogs.push(result.log);
      driveFilesStore.unshift(result.file);
      driveLogsStore.unshift(result.log);
    }

    return res.json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
      logs: createdLogs,
      message: `Unzipped & uploaded ${uploadedFiles.length} images to Google Drive.`
    });
  } catch (err: any) {
    console.error('[Drive API Error /zip-upload]:', err);
    res.status(500).json({ error: err.message || 'ZIP upload failed' });
  }
});

// 3. Delete File (Soft or Hard)
googleDriveRouter.post('/delete', async (req: Request, res: Response) => {
  try {
    const { fileId, hardDelete, userId, userName, userRole } = req.body;
    if (!fileId) return res.status(400).json({ error: 'fileId required' });

    if (hardDelete) {
      await GoogleDriveService.deleteFile(fileId);
      const idx = driveFilesStore.findIndex(f => f.fileId === fileId || f.id === fileId);
      if (idx >= 0) driveFilesStore.splice(idx, 1);
    } else {
      const target = driveFilesStore.find(f => f.fileId === fileId || f.id === fileId);
      if (target) {
        target.isDeleted = true;
        target.deletedAt = new Date().toISOString();
      }
    }

    const logRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: 'DELETE',
      fileId,
      fileName: fileId,
      userId: userId || 'User',
      userName: userName || 'User',
      userRole: userRole || 'admin',
      timestamp: new Date().toISOString(),
      details: `${hardDelete ? 'Permanently deleted' : 'Moved to trash'} file ${fileId}`
    };
    driveLogsStore.unshift(logRecord);

    return res.json({ success: true, fileId, log: logRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Delete failed' });
  }
});

// 4. Restore File
googleDriveRouter.post('/restore', async (req: Request, res: Response) => {
  try {
    const { fileId, userId, userName, userRole } = req.body;
    const target = driveFilesStore.find(f => f.fileId === fileId || f.id === fileId);
    if (target) {
      target.isDeleted = false;
      target.deletedAt = undefined;
    }

    const logRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: 'RESTORE',
      fileId,
      fileName: target?.fileName || fileId,
      userId: userId || 'User',
      userName: userName || 'User',
      userRole: userRole || 'admin',
      timestamp: new Date().toISOString(),
      details: `Restored file ${fileId} from trash.`
    };
    driveLogsStore.unshift(logRecord);

    return res.json({ success: true, fileId, log: logRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Restore failed' });
  }
});

// 5. Replace Image
googleDriveRouter.post('/replace', async (req: Request, res: Response) => {
  try {
    const { fileId, newFileData, userId, userName, userRole } = req.body;
    if (!fileId || !newFileData) {
      return res.status(400).json({ error: 'fileId and newFileData are required' });
    }

    const target = driveFilesStore.find(f => f.fileId === fileId || f.id === fileId);
    let updatedFile = target;

    if (newFileData.startsWith('data:image')) {
      if (target) {
        target.directUrl = newFileData;
        target.thumbnailUrl = newFileData;
        target.updatedAt = new Date().toISOString();
      }
    }

    const logRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: 'REPLACE',
      fileId,
      fileName: target?.fileName || fileId,
      userId: userId || 'User',
      userName: userName || 'User',
      userRole: userRole || 'admin',
      timestamp: new Date().toISOString(),
      details: `Replaced image contents for ${fileId}`
    };
    driveLogsStore.unshift(logRecord);

    return res.json({ success: true, file: updatedFile || { fileId }, log: logRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Replace failed' });
  }
});

// 6. List Drive Files
googleDriveRouter.get('/list', (req: Request, res: Response) => {
  try {
    const { category, vendorId, productId, isDeleted, search } = req.query;

    let results = [...driveFilesStore];

    if (isDeleted === 'true') {
      results = results.filter(f => f.isDeleted);
    } else {
      results = results.filter(f => !f.isDeleted);
    }

    if (category) {
      results = results.filter(f => (f.category || '').toLowerCase() === String(category).toLowerCase());
    }

    if (vendorId) {
      results = results.filter(f => f.vendorId === vendorId);
    }

    if (productId) {
      results = results.filter(f => f.productId === productId);
    }

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(f =>
        (f.fileName || '').toLowerCase().includes(q) ||
        (f.productName || '').toLowerCase().includes(q) ||
        (f.sku || '').toLowerCase().includes(q) ||
        (f.brand || '').toLowerCase().includes(q) ||
        (f.category || '').toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, count: results.length, files: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'List files failed' });
  }
});

// 7. Get Product Images by Product ID
googleDriveRouter.get('/product-images/:productId', (req: Request, res: Response) => {
  const { productId } = req.params;
  const files = driveFilesStore.filter(f => f.productId === productId && !f.isDeleted);
  return res.json({ success: true, productId, files });
});

// 8. Search Endpoint
googleDriveRouter.post('/search', (req: Request, res: Response) => {
  const { query, vendorId, category } = req.body;
  const q = String(query || '').toLowerCase();

  let results = driveFilesStore.filter(f => !f.isDeleted);
  if (vendorId) results = results.filter(f => f.vendorId === vendorId);
  if (category) results = results.filter(f => f.category === category);

  if (q) {
    results = results.filter(f =>
      (f.fileName || '').toLowerCase().includes(q) ||
      (f.productName || '').toLowerCase().includes(q) ||
      (f.sku || '').toLowerCase().includes(q) ||
      (f.brand || '').toLowerCase().includes(q) ||
      (f.category || '').toLowerCase().includes(q)
    );
  }

  return res.json({ success: true, count: results.length, files: results });
});

// 9. Move File to New Folder Path
googleDriveRouter.post('/move', (req: Request, res: Response) => {
  const { fileId, newFolderPath, userId, userName } = req.body;
  const target = driveFilesStore.find(f => f.fileId === fileId || f.id === fileId);

  if (target) {
    target.folderPath = `${DRIVE_FOLDER_STRUCTURE.root}/${newFolderPath}`;
    target.updatedAt = new Date().toISOString();
  }

  const logRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action: 'MOVE',
    fileId,
    fileName: target?.fileName || fileId,
    userId: userId || 'User',
    userName: userName || 'User',
    userRole: 'admin',
    timestamp: new Date().toISOString(),
    details: `Moved file ${fileId} to ${newFolderPath}`
  };
  driveLogsStore.unshift(logRecord);

  return res.json({ success: true, file: target, log: logRecord });
});

// 10. Rename File
googleDriveRouter.post('/rename', (req: Request, res: Response) => {
  const { fileId, newName, userId, userName } = req.body;
  const target = driveFilesStore.find(f => f.fileId === fileId || f.id === fileId);

  if (target) {
    target.fileName = newName.endsWith('.webp') ? newName : `${newName}.webp`;
    target.updatedAt = new Date().toISOString();
  }

  const logRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action: 'RENAME',
    fileId,
    fileName: target?.fileName || fileId,
    userId: userId || 'User',
    userName: userName || 'User',
    userRole: 'admin',
    timestamp: new Date().toISOString(),
    details: `Renamed file ${fileId} to ${target?.fileName}`
  };
  driveLogsStore.unshift(logRecord);

  return res.json({ success: true, file: target, log: logRecord });
});

// 11. Direct URL Converter & Metadata resolver
googleDriveRouter.post('/direct-url', (req: Request, res: Response) => {
  const { driveUrlOrId } = req.body;
  const fileId = extractDriveFileId(driveUrlOrId);
  if (!fileId) {
    return res.status(400).json({ error: 'Invalid Google Drive URL or File ID.' });
  }

  const directUrl = getDriveDirectUrl(fileId);
  const exportUrl = getDriveExportUrl(fileId);

  return res.json({
    success: true,
    fileId,
    directUrl,
    exportUrl,
    thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`,
    mediumUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
  });
});

// 12. Storage Statistics
googleDriveRouter.get('/stats', (req: Request, res: Response) => {
  const { vendorId } = req.query;

  let files = driveFilesStore.filter(f => !f.isDeleted);
  if (vendorId) {
    files = files.filter(f => f.vendorId === vendorId);
  }

  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  const categoryBreakdown: Record<string, number> = {};
  files.forEach(f => {
    const cat = f.category || 'Uncategorized';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  });

  return res.json({
    success: true,
    totalFiles,
    totalSizeBytes,
    totalSizeMb: `${totalSizeMb} MB`,
    categoryBreakdown,
    folderStructure: DRIVE_FOLDER_STRUCTURE
  });
});

// 13. Audit Logs
googleDriveRouter.get('/logs', (req: Request, res: Response) => {
  const { vendorId } = req.query;
  let logs = [...driveLogsStore];
  if (vendorId) {
    logs = logs.filter(l => l.vendorId === vendorId);
  }
  return res.json({ success: true, logs });
});
