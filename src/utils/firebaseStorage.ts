import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';

export const storage = getStorage(app);

/**
 * Upload non-product images, documents, receipts, and certificates to Firebase Storage.
 * Falls back safely if browser storage bucket is unreachable.
 */
export async function uploadToFirebaseStorage(
  file: File | Blob | string,
  folder: string = 'firebase_documents',
  customFileName?: string
): Promise<{ url: string; path: string }> {
  if (typeof file === 'string') {
    return { url: file, path: `${folder}/${customFileName || 'string_asset'}` };
  }

  const fileName = customFileName || (file instanceof File ? file.name : `upload_${Date.now()}`);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${sanitizedName}`;

  try {
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { url: downloadUrl, path: filePath };
  } catch (err) {
    console.warn('[Firebase Storage] Direct upload failed, returning embedded data URL for Firestore:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve({ url: e.target.result as string, path: filePath });
        } else {
          reject(new Error('Failed to read file for Firebase storage'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  }
}

export async function uploadVendorKycToFirebase(file: File): Promise<string> {
  const res = await uploadToFirebaseStorage(file, 'firebase_vendor_kyc');
  return res.url;
}

export async function uploadPaymentReceiptToFirebase(file: File): Promise<string> {
  const res = await uploadToFirebaseStorage(file, 'firebase_payment_receipts');
  return res.url;
}

export async function uploadAdminQrToFirebase(file: File): Promise<string> {
  const res = await uploadToFirebaseStorage(file, 'firebase_admin_qrs');
  return res.url;
}
