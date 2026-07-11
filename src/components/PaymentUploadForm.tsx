import React, { useState, useEffect } from 'react';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { checkDuplicateUtr } from '../lib/firestore';
import { uploadScreenshotToDrive } from '../lib/googleSheets';
import { Upload, CheckCircle, AlertTriangle, FileImage, ShieldAlert, Clock, Info } from 'lucide-react';

interface PaymentUploadFormProps {
  orderId: string;
  orderAmount: number;
  paymentMethod: 'upi' | 'bank';
  paymentDetails: any; // QR code & bank info
  onSubmitSuccess: (data: {
    screenshotUrl: string;
    driveUrl: string;
    utr: string;
    paymentDateTime: string;
    paymentNote: string;
  }) => void;
  onCancel: () => void;
}

export default function PaymentUploadForm({
  orderId,
  orderAmount,
  paymentMethod,
  paymentDetails,
  onSubmitSuccess,
  onCancel
}: PaymentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [utr, setUtr] = useState('');
  const [paymentDateTime, setPaymentDateTime] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Set default payment datetime to current local time
  useEffect(() => {
    const now = new Date();
    const formatted = now.toISOString().slice(0, 16); // yyyy-MM-ddThh:mm
    setPaymentDateTime(formatted);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate type (JPG, PNG only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only JPG, JPEG, and PNG files are allowed.');
      setFile(null);
      return;
    }

    // Validate size (Max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError('File size too large. Maximum allowed size is 10MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => {
        const base64Str = (reader.result as string).split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!file) {
      setError('Please upload your payment confirmation screenshot.');
      return;
    }

    if (!utr.trim()) {
      setError('UTR / Transaction Reference Number is required.');
      return;
    }

    if (!paymentDateTime) {
      setError('Payment Date & Time is required.');
      return;
    }

    setLoading(true);

    try {
      // 1. Prevent duplicate UTR
      const isDuplicate = await checkDuplicateUtr(utr, orderId);
      if (isDuplicate) {
        throw new Error('This UTR / Transaction Reference has already been submitted for another order. Please check and try again.');
      }

      // 2. Upload to Firebase Storage
      const storagePath = `payments/${orderId}/${file.name}`;
      const imageRef = sRef(storage, storagePath);
      
      setSuccessMsg('Uploading receipt to Firebase Storage...');
      const snapshot = await uploadBytes(imageRef, file);
      const firebaseStorageUrl = await getDownloadURL(snapshot.ref);

      // 3. Convert to base64 and upload to Google Drive
      setSuccessMsg('Syncing receipt with Google Drive secure storage...');
      const base64Content = await fileToBase64(file);
      const googleDriveUrl = await uploadScreenshotToDrive(
        base64Content,
        file.name,
        file.type,
        orderId
      );

      setSuccessMsg('Payment proof uploaded successfully!');
      setTimeout(() => {
        onSubmitSuccess({
          screenshotUrl: firebaseStorageUrl,
          driveUrl: googleDriveUrl,
          utr: utr.trim(),
          paymentDateTime,
          paymentNote: paymentNote.trim()
        });
      }, 1000);

    } catch (err: any) {
      console.error('Upload flow failure:', err);
      setError(err.message || 'Failed to submit payment verification. Please try again.');
      setSuccessMsg(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-slate-950 dark:text-slate-50">Upload Payment Confirmation</h3>
          <p className="text-xs text-slate-500">Order ID: #{orderId} • Amount: ₹{orderAmount.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Show Payment Details for scanning */}
      <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-5">
        {paymentMethod === 'upi' ? (
          <>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm shrink-0">
              <img src={paymentDetails?.upi?.qrCodeUrl} alt="UPI QR Code" className="w-32 h-32 object-contain" />
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">Scan to Pay via UPI</p>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">UPI ID:</span> <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">{paymentDetails?.upi?.upiId}</code></p>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">Account Holder:</span> {paymentDetails?.upi?.accountHolder}</p>
              <p className="text-[10px] text-slate-400">Scan this QR code using Google Pay, PhonePe, Paytm or any other UPI app to make the manual transfer.</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm shrink-0">
              <img src={paymentDetails?.bank?.qrCodeUrl} alt="Bank QR" className="w-32 h-32 object-contain" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">Bank Wire Details</p>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">Bank Name:</span> {paymentDetails?.bank?.bankName}</p>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">Account Name:</span> {paymentDetails?.bank?.accountHolder}</p>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">Account Number:</span> <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">{paymentDetails?.bank?.accountNumber}</code></p>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">IFSC Code:</span> <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">{paymentDetails?.bank?.ifsc}</code></p>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">Branch:</span> {paymentDetails?.bank?.branch}</p>
            </div>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {/* Screenshot Upload Dropzone */}
        <div className="space-y-2">
          <label className="block text-slate-700 dark:text-slate-300 font-bold">Upload Payment Screenshot / Advice Receipt</label>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-5 text-center transition cursor-pointer relative bg-slate-50/50 dark:bg-slate-950/10">
            <input
              type="file"
              accept=".png, .jpg, .jpeg"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={loading}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-slate-400" />
              {file ? (
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              ) : (
                <>
                  <p className="text-slate-700 dark:text-slate-300 font-semibold">Drag & drop or click to upload</p>
                  <p className="text-[10px] text-slate-400">Only JPG, JPEG, and PNG files under 10MB are allowed.</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* UTR Form Field */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-slate-700 dark:text-slate-300 font-bold">UTR / Unique Transaction Reference</label>
            <input
              type="text"
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              placeholder="Enter 12-digit UTR, IMPS Ref, or Tx ID"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-[10px] text-slate-400">Must be unique. Double submission of the same reference is blocked.</p>
          </div>

          {/* Payment Date Time Field */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 dark:text-slate-300 font-bold">Payment Date & Time</label>
            <input
              type="datetime-local"
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              value={paymentDateTime}
              onChange={(e) => setPaymentDateTime(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Note Field */}
        <div className="space-y-1.5">
          <label className="block text-slate-700 dark:text-slate-300 font-bold">Optional Notes</label>
          <textarea
            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs h-16 resize-none"
            placeholder="Provide any additional details or remarks..."
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Info alerts */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex items-start gap-2 text-[11px]">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl text-blue-700 dark:text-blue-300 flex items-center gap-2 text-[11px] animate-pulse">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Actions buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-750 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing Upload...' : 'Submit Proof of Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
