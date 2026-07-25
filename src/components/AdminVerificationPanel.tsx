import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, CheckCircle2, XCircle, AlertTriangle, 
  FileText, Eye, Download, MessageSquare, Clock, Check, X, RefreshCw, Layers, Printer
} from 'lucide-react';
import { Vendor, VendorVerificationDocument, DocumentStatus, VendorStatus } from '../types';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, addDoc, onSnapshot } from 'firebase/firestore';

export const AdminVerificationPanel: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [documentsMap, setDocumentsMap] = useState<Record<string, VendorVerificationDocument[]>>({});
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activeDocPreview, setActiveDocPreview] = useState<VendorVerificationDocument | null>(null);
  const [adminRemarkInput, setAdminRemarkInput] = useState('');
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sync Vendors from Firestore
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'vendors'), (snapshot) => {
        const fetchedVendors: Vendor[] = [];
        snapshot.forEach((snapDoc) => {
          fetchedVendors.push({ id: snapDoc.id, ...snapDoc.data() } as Vendor);
        });
        setVendors(fetchedVendors);
      });

      return () => unsubscribe();
    } catch (err) {
      console.log('Error fetching vendors for admin verification:', err);
    }
  }, []);

  // Fetch documents for selected vendor
  useEffect(() => {
    if (!selectedVendor) return;

    const fetchDocs = async () => {
      try {
        const snap = await getDocs(collection(db, 'vendorDocuments'));
        const vendorDocs: VendorVerificationDocument[] = [];
        snap.forEach((dSnap) => {
          const data = dSnap.data();
          if (data.vendorId === selectedVendor.id) {
            vendorDocs.push({ id: dSnap.id, ...data } as VendorVerificationDocument);
          }
        });
        setDocumentsMap(prev => ({ ...prev, [selectedVendor.id]: vendorDocs }));
      } catch (err) {
        console.log('Error fetching vendor documents:', err);
      }
    };

    fetchDocs();
  }, [selectedVendor]);

  // Admin Actions: Approve Vendor
  const handleApproveVendor = async (vendorId: string) => {
    try {
      setIsProcessing(true);

      await updateDoc(doc(db, 'vendors', vendorId), {
        status: 'Verified Vendor',
        isVerifiedSeller: true,
        trustSeal: 'CDSCO Verified Medical Vendor',
        verifiedAt: new Date().toISOString()
      });

      // Add timeline event
      await addDoc(collection(db, 'verificationTimeline'), {
        vendorId,
        status: 'Verified Vendor',
        title: 'Vendor Verification Approved',
        description: adminRemarkInput || 'Official verification approved by HealNex Compliance Officer.',
        actorRole: 'admin',
        actorName: 'HealNex Compliance Admin',
        timestamp: new Date().toISOString()
      });

      setStatusMessage({ type: 'success', text: 'Vendor successfully approved and granted Verified Trust Seal!' });
      setIsProcessing(false);
      if (selectedVendor?.id === vendorId) {
        setSelectedVendor(prev => prev ? { ...prev, status: 'Verified Vendor', isVerifiedSeller: true } : null);
      }
    } catch (err) {
      setIsProcessing(false);
      setStatusMessage({ type: 'error', text: 'Failed to approve vendor verification.' });
    }
  };

  // Admin Actions: Reject Vendor
  const handleRejectVendor = async (vendorId: string) => {
    if (!adminRemarkInput.trim()) {
      alert('Please specify the rejection remarks/reasons.');
      return;
    }

    try {
      setIsProcessing(true);

      await updateDoc(doc(db, 'vendors', vendorId), {
        status: 'Rejected',
        isVerifiedSeller: false,
        rejectionReason: adminRemarkInput
      });

      // Add timeline event
      await addDoc(collection(db, 'verificationTimeline'), {
        vendorId,
        status: 'Rejected',
        title: 'Vendor Verification Rejected',
        description: adminRemarkInput,
        actorRole: 'admin',
        actorName: 'HealNex Compliance Admin',
        timestamp: new Date().toISOString()
      });

      setStatusMessage({ type: 'info', text: 'Vendor verification rejected.' });
      setIsProcessing(false);
      if (selectedVendor?.id === vendorId) {
        setSelectedVendor(prev => prev ? { ...prev, status: 'Rejected', isVerifiedSeller: false } : null);
      }
    } catch (err) {
      setIsProcessing(false);
      setStatusMessage({ type: 'error', text: 'Failed to reject vendor verification.' });
    }
  };

  // Admin Document Status Update (Approve or Request Reupload)
  const handleUpdateDocumentStatus = async (docId: string, status: DocumentStatus) => {
    try {
      await updateDoc(doc(db, 'vendorDocuments', docId), {
        status,
        remarks: adminRemarkInput,
        reviewedAt: new Date().toISOString()
      });

      setStatusMessage({ type: 'success', text: `Document status set to ${status}` });

      // Refresh documents
      if (selectedVendor) {
        const snap = await getDocs(collection(db, 'vendorDocuments'));
        const vendorDocs: VendorVerificationDocument[] = [];
        snap.forEach((dSnap) => {
          const data = dSnap.data();
          if (data.vendorId === selectedVendor.id) {
            vendorDocs.push({ id: dSnap.id, ...data } as VendorVerificationDocument);
          }
        });
        setDocumentsMap(prev => ({ ...prev, [selectedVendor.id]: vendorDocs }));
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update document status.' });
    }
  };

  // CSV Export for Vendor Audits
  const exportVendorsCSV = () => {
    const headers = ['Vendor ID', 'Company Name', 'GSTIN', 'PAN', 'Status', 'Phone', 'Email', 'Verified Date'];
    const rows = filteredVendors.map(v => [
      v.id,
      `"${v.companyName || v.name || ''}"`,
      v.gstin || '',
      v.pan || '',
      v.status || 'Unverified',
      v.phone || '',
      v.email || '',
      v.verifiedAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `healnex_vendor_verification_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Vendors
  const filteredVendors = vendors.filter(v => {
    const matchesStatus = selectedStatusFilter === 'All' || v.status === selectedStatusFilter;
    const matchesQuery = 
      (v.companyName || v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.gstin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.pan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.phone || '').includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6" id="admin-verification-panel">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Admin Vendor Verification & Compliance Control</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit B2B vendor licenses, GSTIN compliance, bank accounts, and grant verified seller trust badges
          </p>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportVendorsCSV}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Company Name, GSTIN, PAN, or Mobile..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', 'Pending Approval', 'Verified Vendor', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatusFilter(status)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatusFilter === status
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Vendor List & Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Directory Column */}
        <div className="lg:col-span-1 border border-slate-200 rounded-2xl overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 flex justify-between">
            <span>Vendor Directory ({filteredVendors.length})</span>
            <span>Status</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredVendors.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No vendors found matching criteria.
              </div>
            ) : (
              filteredVendors.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVendor(v)}
                  className={`p-3.5 cursor-pointer transition-all hover:bg-slate-50 flex items-start justify-between gap-2 ${
                    selectedVendor?.id === v.id ? 'bg-emerald-50/60 border-l-4 border-emerald-500' : ''
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <p className="font-bold text-slate-800 text-xs truncate">{v.companyName || v.name || 'Vendor'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">GST: {v.gstin || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400">{v.phone || v.email}</p>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      v.status === 'Verified Vendor'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : v.status === 'Pending Approval'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {v.status || 'Unverified'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detailed Inspection Column */}
        <div className="lg:col-span-2 border border-slate-200 rounded-2xl p-6 space-y-6">
          {selectedVendor ? (
            <div className="space-y-6">
              {/* Inspection Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedVendor.companyName || selectedVendor.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Vendor ID: {selectedVendor.id} | Type: {selectedVendor.vendorType || 'Manufacturer'}
                  </p>
                </div>

                {/* Approve / Reject Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveVendor(selectedVendor.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Verified</span>
                  </button>

                  <button
                    onClick={() => handleRejectVendor(selectedVendor.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Remarks Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Verification Notes & Remarks
                </label>
                <input
                  type="text"
                  value={adminRemarkInput}
                  onChange={(e) => setAdminRemarkInput(e.target.value)}
                  placeholder="e.g. GSTIN verified on GST portal. Bank account matched. CDSCO drug license active."
                  className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Data Review Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">GSTIN</span>
                  <span className="font-mono font-bold text-slate-800">{selectedVendor.gstin || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PAN</span>
                  <span className="font-mono font-bold text-slate-800">{selectedVendor.pan || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CIN</span>
                  <span className="font-mono font-bold text-slate-800">{selectedVendor.cin || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Bank Name</span>
                  <span className="font-semibold text-slate-800">{selectedVendor.bankDetails?.bankName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Account No</span>
                  <span className="font-mono font-bold text-slate-800">{selectedVendor.bankDetails?.accountNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">IFSC Code</span>
                  <span className="font-mono font-bold text-slate-800">{selectedVendor.bankDetails?.ifscCode || 'N/A'}</span>
                </div>
              </div>

              {/* Verification Licenses List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Uploaded Verification Licenses & Scans
                </h4>

                <div className="space-y-2">
                  {(documentsMap[selectedVendor.id] || []).length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center border border-dashed rounded-xl">
                      No verification documents uploaded yet.
                    </p>
                  ) : (
                    (documentsMap[selectedVendor.id] || []).map((docItem) => (
                      <div
                        key={docItem.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate">{docItem.documentName}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{docItem.documentType}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveDocPreview(docItem)}
                            className="p-1.5 bg-white border hover:bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>

                          <button
                            onClick={() => handleUpdateDocumentStatus(docItem.id, 'Approved')}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => handleUpdateDocumentStatus(docItem.id, 'ReuploadRequested')}
                            className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700"
                          >
                            Request Reupload
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-2 text-slate-400">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs">Select a vendor from the directory to inspect verification packet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setActiveDocPreview(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900">{activeDocPreview.documentName}</h3>

            <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border">
              {activeDocPreview.fileUrl.startsWith('data:application/pdf') ? (
                <iframe src={activeDocPreview.fileUrl} className="w-full h-full" title="PDF Preview" />
              ) : (
                <img src={activeDocPreview.fileUrl} alt="Document Scan" className="max-h-full max-w-full object-contain" />
              )}
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <span className="text-slate-400">Status: <strong>{activeDocPreview.status}</strong></span>
              <a
                href={activeDocPreview.fileUrl}
                download={activeDocPreview.documentName}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
