import React, { useState, useEffect } from 'react';
import { 
  Building2, CreditCard, FileCheck2, Sparkles, CheckCircle2, AlertTriangle, 
  Upload, ShieldCheck, FileText, ArrowRight, ArrowLeft, RefreshCw, Eye, X, Check, Lock
} from 'lucide-react';
import { Vendor, VendorVerificationDocument, DocumentTypeKey, VendorStatus } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';

interface VendorVerificationWizardProps {
  vendor: Vendor;
  onUpdateVendor?: (updated: Vendor) => void;
}

const DOCUMENT_REQUIREMENTS: { key: DocumentTypeKey; label: string; required: boolean; hint: string }[] = [
  { key: 'gstCertificate', label: 'GST Registration Certificate', required: true, hint: 'Form GST REG-06 showing 15-digit GSTIN' },
  { key: 'panCard', label: 'Company / Proprietor PAN Card', required: true, hint: '10-character Permanent Account Number' },
  { key: 'cancelledCheque', label: 'Cancelled Cheque / Bank Passbook', required: true, hint: 'Showing Account Name, Account Number & IFSC Code' },
  { key: 'tradeLicense', label: 'Trade License / Municipal License', required: true, hint: 'Valid business establishment license' },
  { key: 'drugLicense', label: 'Drug License (Form 20B/21B)', required: false, hint: 'Mandatory for Pharmaceutical & Chemical vendors' },
  { key: 'medicalDeviceLicense', label: 'Medical Device Manufacturing / Import License', required: false, hint: 'Mandatory for Class A/B/C/D Device Sellers' },
  { key: 'msmeCertificate', label: 'Udyam / MSME Certificate', required: false, hint: 'Govt MSME Registration for preferential credit' },
  { key: 'addressProof', label: 'Registered Office Address Proof', required: true, hint: 'Electricity bill / Rent agreement / Land Registry' },
];

export const VendorVerificationWizard: React.FC<VendorVerificationWizardProps> = ({
  vendor,
  onUpdateVendor
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [businessData, setBusinessData] = useState({
    companyName: vendor.companyName || vendor.name || '',
    vendorType: vendor.vendorType || 'Manufacturer',
    gstin: vendor.gstin || '',
    pan: vendor.pan || '',
    cin: vendor.cin || '',
    address: vendor.address || '',
    phone: vendor.phone || '',
    email: vendor.email || '',
    yearEstablished: vendor.yearEstablished || 2020,
  });

  const [bankData, setBankData] = useState({
    accountHolderName: vendor.bankDetails?.accountHolderName || vendor.companyName || '',
    bankName: vendor.bankDetails?.bankName || '',
    accountNumber: vendor.bankDetails?.accountNumber || '',
    ifscCode: vendor.bankDetails?.ifscCode || '',
    accountType: vendor.bankDetails?.accountType || 'Current',
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<VendorVerificationDocument[]>([]);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sync Documents from Firestore
  useEffect(() => {
    if (!vendor.id) return;

    try {
      const q = query(
        collection(db, 'vendorDocuments'),
        where('vendorId', '==', vendor.id)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs: VendorVerificationDocument[] = [];
        snapshot.forEach((snap) => {
          docs.push({ id: snap.id, ...snap.data() } as VendorVerificationDocument);
        });
        setUploadedDocuments(docs);
      });

      return () => unsubscribe();
    } catch (err) {
      console.log('Error listening to vendor documents:', err);
    }
  }, [vendor.id]);

  // AI OCR Reader trigger helper
  const handleScanDocumentOCR = async (file: File, targetDocKey: DocumentTypeKey) => {
    try {
      setIsScanningOCR(true);
      setToastMessage({ type: 'info', text: 'AI Optical Scanner analyzing document fields with Gemini...' });

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        const res = await fetch('/api/gemini/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type,
            docCategory: targetDocKey
          })
        });

        const data = await res.json();
        setIsScanningOCR(false);

        if (data.extracted) {
          const { gstin, pan, name, address, accountNumber, ifscCode } = data.extracted;

          if (gstin) setBusinessData(prev => ({ ...prev, gstin }));
          if (pan) setBusinessData(prev => ({ ...prev, pan }));
          if (name) setBusinessData(prev => ({ ...prev, companyName: name }));
          if (address) setBusinessData(prev => ({ ...prev, address }));
          if (accountNumber) setBankData(prev => ({ ...prev, accountNumber }));
          if (ifscCode) setBankData(prev => ({ ...prev, ifscCode }));

          setToastMessage({
            type: 'success',
            text: `Gemini OCR Extracted details successfully! (Confidence: ${data.confidence}%)`
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsScanningOCR(false);
      setToastMessage({ type: 'error', text: 'OCR Scanner failed to parse image.' });
    }
  };

  // Document Upload Handler
  const handleFileUpload = async (file: File, docType: DocumentTypeKey) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setToastMessage({ type: 'error', text: 'Document size exceeds 10MB limit.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setToastMessage({ type: 'info', text: 'Compressing and uploading verification document...' });

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;

        const fileType = file.name.endsWith('.pdf') ? 'pdf' : 'png';

        const newDoc: Omit<VendorVerificationDocument, 'id'> = {
          vendorId: vendor.id,
          documentType: docType,
          documentName: file.name,
          fileUrl: base64Url,
          fileType: fileType as any,
          fileSize: file.size,
          status: 'Pending',
          uploadedAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'vendorDocuments'), newDoc);

        // Auto trigger Gemini OCR scan for GST or Cheque
        if (['gstCertificate', 'panCard', 'cancelledCheque'].includes(docType)) {
          await handleScanDocumentOCR(file, docType);
        } else {
          setToastMessage({ type: 'success', text: `${file.name} uploaded successfully.` });
        }

        setIsSubmitting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsSubmitting(false);
      setToastMessage({ type: 'error', text: 'Failed to upload verification document.' });
    }
  };

  // Final Form Submit Handler
  const handleSubmitVerification = async () => {
    // Validate mandatory documents
    const uploadedTypes = new Set(uploadedDocuments.map(d => d.documentType));
    const missingRequired = DOCUMENT_REQUIREMENTS.filter(req => req.required && !uploadedTypes.has(req.key));

    if (missingRequired.length > 0) {
      setToastMessage({
        type: 'error',
        text: `Missing required verification documents: ${missingRequired.map(m => m.label).join(', ')}`
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const updatedVendor: Partial<Vendor> = {
        companyName: businessData.companyName,
        vendorType: businessData.vendorType as any,
        gstin: businessData.gstin,
        pan: businessData.pan,
        cin: businessData.cin,
        address: businessData.address,
        phone: businessData.phone,
        email: businessData.email,
        bankDetails: bankData,
        status: 'Pending Approval', // Transitions vendor state to Pending Approval
        verificationSubmittedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'vendors', vendor.id), updatedVendor);

      // Log verification timeline event
      await addDoc(collection(db, 'verificationTimeline'), {
        vendorId: vendor.id,
        status: 'Pending Approval',
        title: 'Verification Submitted for Admin Audit',
        description: 'Vendor completed business details, bank records, and uploaded official verification licenses.',
        actorRole: 'vendor',
        actorName: businessData.companyName,
        timestamp: new Date().toISOString()
      });

      if (onUpdateVendor) {
        onUpdateVendor({ ...vendor, ...updatedVendor } as Vendor);
      }

      setToastMessage({
        type: 'success',
        text: 'Vendor verification packet submitted to Admin! Verification review takes 24-48 business hours.'
      });
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      setToastMessage({ type: 'error', text: 'Failed to submit verification application.' });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-8" id="vendor-verification-wizard">
      {/* Verification Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              HealNex Verified Medical Vendor Portal
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-100">Official Vendor Business & Compliance Verification</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Complete your 3-step registration wizard to unlock CDSCO Verified Seller Trust Seals, direct B2B RFQ quoting, and nationwide medical marketplace access.
          </p>

          {/* Current Status Badge */}
          <div className="pt-2 flex items-center gap-3">
            <span className="text-xs text-slate-400">Current Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${
                vendor.status === 'Verified Vendor'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : vendor.status === 'Pending Approval'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {vendor.status || 'Unverified'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Wizard Steps */}
      <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-4">
        <button
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
            currentStep === 1
              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
              : 'border-slate-100 hover:border-slate-200 text-slate-600'
          }`}
        >
          <div className={`p-2 rounded-lg ${currentStep === 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100'}`}>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Step 1</span>
            <span className="text-xs">Business Details</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentStep(2)}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
            currentStep === 2
              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
              : 'border-slate-100 hover:border-slate-200 text-slate-600'
          }`}
        >
          <div className={`p-2 rounded-lg ${currentStep === 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100'}`}>
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Step 2</span>
            <span className="text-xs">Bank Details</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentStep(3)}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
            currentStep === 3
              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
              : 'border-slate-100 hover:border-slate-200 text-slate-600'
          }`}
        >
          <div className={`p-2 rounded-lg ${currentStep === 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100'}`}>
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Step 3</span>
            <span className="text-xs">Documents & OCR</span>
          </div>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-sky-50 text-sky-800 border border-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {toastMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Step 1: Business Details */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Step 1: Business Profile & GSTIN Identification</h3>
            <span className="text-xs text-slate-400">* All fields required for CDSCO compliance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company / Legal Entity Name *</label>
              <input
                type="text"
                value={businessData.companyName}
                onChange={(e) => setBusinessData({ ...businessData, companyName: e.target.value })}
                placeholder="e.g. HealNex Healthcare Pvt Ltd"
                className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vendor Category Type *</label>
              <select
                value={businessData.vendorType}
                onChange={(e) => setBusinessData({ ...businessData, vendorType: e.target.value })}
                className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Manufacturer">Manufacturer (OEM)</option>
                <option value="Authorized Distributor">Authorized Distributor</option>
                <option value="Importer">Importer</option>
                <option value="Dealer / Retailer">Dealer / Retailer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">15-Digit GSTIN Number *</label>
              <input
                type="text"
                value={businessData.gstin}
                onChange={(e) => setBusinessData({ ...businessData, gstin: e.target.value.toUpperCase() })}
                placeholder="e.g. 27AABCU9603R1ZM"
                className="w-full p-3 border rounded-xl text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">10-Character PAN Number *</label>
              <input
                type="text"
                value={businessData.pan}
                onChange={(e) => setBusinessData({ ...businessData, pan: e.target.value.toUpperCase() })}
                placeholder="e.g. AABCU9603R"
                className="w-full p-3 border rounded-xl text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Identification Number (CIN) / LLPIN</label>
              <input
                type="text"
                value={businessData.cin}
                onChange={(e) => setBusinessData({ ...businessData, cin: e.target.value.toUpperCase() })}
                placeholder="e.g. U33110MH2020PTC123456"
                className="w-full p-3 border rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number *</label>
              <input
                type="text"
                value={businessData.phone}
                onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Registered Business Office Address *</label>
              <textarea
                value={businessData.address}
                onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                placeholder="Full address matching GST registration certificate"
                className="w-full h-20 p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
            >
              <span>Next: Bank Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Bank Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Step 2: Bank Account & Payout Clearances</h3>
            <span className="text-xs text-slate-400">Account details must match GST Company Name</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name *</label>
              <input
                type="text"
                value={bankData.accountHolderName}
                onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })}
                placeholder="e.g. HealNex Healthcare Pvt Ltd"
                className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name *</label>
              <input
                type="text"
                value={bankData.bankName}
                onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                placeholder="e.g. HDFC Bank Ltd"
                className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Number *</label>
              <input
                type="text"
                value={bankData.accountNumber}
                onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                placeholder="e.g. 50200012345678"
                className="w-full p-3 border rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code *</label>
              <input
                type="text"
                value={bankData.ifscCode}
                onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value.toUpperCase() })}
                placeholder="e.g. HDFC0000128"
                className="w-full p-3 border rounded-xl text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Type *</label>
              <select
                value={bankData.accountType}
                onChange={(e) => setBankData({ ...bankData, accountType: e.target.value })}
                className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Current">Current Account</option>
                <option value="Savings">Savings Account (Proprietorship)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={() => setCurrentStep(1)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
            >
              <span>Next: Document Uploads</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Document Uploads & Gemini OCR */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Step 3: Required Verification Licenses & AI OCR Scanner</h3>
              <p className="text-xs text-slate-500">
                Upload scans (PDF / PNG / JPG, max 10MB). Gemini AI automatically extracts legal text.
              </p>
            </div>
          </div>

          {/* Document Checklist & Uploader Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOCUMENT_REQUIREMENTS.map((req) => {
              const uploadedDoc = uploadedDocuments.find(d => d.documentType === req.key);

              return (
                <div
                  key={req.key}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    uploadedDoc
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : req.required
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{req.label}</span>
                        {req.required && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-md">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{req.hint}</p>
                    </div>

                    {uploadedDoc ? (
                      <span className="p-1 bg-emerald-500 text-slate-950 rounded-full">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">Not Uploaded</span>
                    )}
                  </div>

                  {uploadedDoc ? (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate">{uploadedDoc.documentName}</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {uploadedDoc.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Uploaded on: {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], req.key);
                        }}
                        className="hidden"
                      />
                      <div className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Upload Scan File</span>
                      </div>
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleSubmitVerification}
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-8 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Verification Packet for Admin Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
