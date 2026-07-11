import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Check, AlertOctagon, User, Mail, Phone, Calendar, Info, ShieldAlert } from 'lucide-react';
import { formatDate, formatCurrency } from '../lib/utils';

interface VerificationDialogProps {
  order: any;
  onApprove: (orderId: string, vendorId: string, notes: string) => Promise<void>;
  onReject: (orderId: string, reason: string) => Promise<void>;
  onClose: () => void;
}

export default function VerificationDialog({
  order,
  onApprove,
  onReject,
  onClose
}: VerificationDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState(order?.vendorId || '');
  const [approveNote, setApproveNote] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleApproveSubmit = async () => {
    if (!selectedVendorId) {
      setError('Please assign a vendor to fulfill this order.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onApprove(order.orderId || order.id, selectedVendorId, approveNote);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Approval operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejecting the payment screenshot.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onReject(order.orderId || order.id, rejectionReason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Rejection operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-bold text-base text-slate-950 dark:text-slate-50 flex items-center gap-2">
              <span>Auditing Order: #{order?.orderId || order?.id}</span>
              <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-semibold">
                Waiting Verification
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">Manual payment details submitted by customer.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Content - Split Screen Grid */}
        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          
          {/* Left Side: Screenshot Viewer with Controls */}
          <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-950 overflow-hidden relative group h-[450px]">
            {/* Viewer Controls bar */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between bg-black/50 text-white p-2 rounded-lg opacity-90 transition duration-150 backdrop-blur-sm">
              <span className="text-[10px] tracking-wide font-medium">Receipt Zoom Panel</span>
              <div className="flex items-center gap-1.5">
                <button onClick={handleZoomIn} className="p-1 hover:bg-white/20 rounded transition" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={handleZoomOut} className="p-1 hover:bg-white/20 rounded transition" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={handleRotate} className="p-1 hover:bg-white/20 rounded transition" title="Rotate"><RotateCcw className="w-4 h-4" /></button>
                <button onClick={handleReset} className="p-1 hover:bg-white/20 rounded transition" title="Reset"><X className="w-4 h-4" /></button>
                <a 
                  href={order?.screenshotUrl} 
                  download={`Payment_${order?.orderId}.png`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-white/20 rounded transition flex items-center gap-1 text-[10px]" 
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Render Image with dynamic styles */}
            <div className="flex-grow flex items-center justify-center overflow-hidden p-6">
              {order?.screenshotUrl ? (
                <img
                  src={order.screenshotUrl}
                  alt="Payment Screenshot"
                  className="max-h-full max-w-full object-contain transition-all duration-150 origin-center select-none"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`
                  }}
                />
              ) : (
                <div className="text-slate-400 text-xs flex flex-col items-center gap-2">
                  <X className="w-8 h-8" />
                  <span>No payment screenshot provided</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Order details & Action form */}
          <div className="flex flex-col gap-5 text-xs overflow-y-auto">
            {/* Customer Details Box */}
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850 space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Customer Profile</span>
              </h4>
              <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                <p><span className="font-semibold text-slate-400">Name:</span> {order?.customerName || 'Anonymous'}</p>
                <p className="truncate"><span className="font-semibold text-slate-400">Email:</span> {order?.customerEmail || 'No Email'}</p>
                <p><span className="font-semibold text-slate-400">CustomerId:</span> {order?.customerId}</p>
                <p><span className="font-semibold text-slate-400">Payment:</span> {order?.paymentMethod?.toUpperCase()}</p>
              </div>
            </div>

            {/* Payment Proof details */}
            <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-xl p-4 border border-amber-100/70 dark:border-amber-950/30 space-y-2.5">
              <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Submitted Payment Verification Proof</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                <p><span className="font-semibold text-amber-800/80 dark:text-amber-300/80">Submitted UTR:</span> <code className="bg-amber-100/50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded font-mono text-amber-900 dark:text-amber-200 font-bold">{order?.utr || 'N/A'}</code></p>
                <p><span className="font-semibold text-amber-800/80 dark:text-amber-300/80">Payment Date:</span> {formatDate(order?.paymentDateTime)}</p>
                <p className="col-span-2"><span className="font-semibold text-amber-800/80 dark:text-amber-300/80">Customer Notes:</span> {order?.paymentNote || 'No notes left by customer.'}</p>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Order Items</h4>
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-bold">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {order?.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="text-slate-700 dark:text-slate-300">
                        <td className="p-2.5 font-medium truncate max-w-[150px]">{item.productName}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.price)}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-900 dark:text-slate-50">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/50 dark:bg-slate-950/10 font-bold">
                      <td colSpan={3} className="p-2.5 text-right text-slate-500">Total Order Amount:</td>
                      <td className="p-2.5 text-right text-[#1E40AF] dark:text-blue-400 text-xs font-bold">{formatCurrency(order?.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action forms: Approve vs Reject Toggle */}
            <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex items-start gap-2 text-[11px]">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!rejectMode ? (
                /* APPROVE BLOCK */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">Fulfilling Vendor Assignment</label>
                      <select 
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                        value={selectedVendorId}
                        onChange={(e) => {
                          setSelectedVendorId(e.target.value);
                          setError(null);
                        }}
                        disabled={loading}
                      >
                        <option value="">-- Choose Vendor --</option>
                        <option value="vendor-medilink">MediLink Systems Private Limited</option>
                        <option value="vendor-hightech">HighTech Diagnostics Ltd</option>
                        <option value="vendor-1">Healnex Supplier Ltd</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">Approval Audit Note</label>
                      <input 
                        type="text" 
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                        placeholder="Internal notes..."
                        value={approveNote}
                        onChange={(e) => setApproveNote(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectMode(true);
                        setError(null);
                      }}
                      className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                      disabled={loading}
                    >
                      <AlertOctagon className="w-4 h-4" />
                      <span>Reject Receipt</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveSubmit}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
                        disabled={loading}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{loading ? 'Processing...' : 'Approve & Release Order'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* REJECT BLOCK */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-rose-700 dark:text-rose-400">Rejection Reason (Required)</label>
                    <textarea 
                      className="w-full p-2.5 border border-rose-200 dark:border-rose-800 focus:ring-2 focus:ring-rose-500 rounded-xl bg-white dark:bg-slate-900 outline-none text-xs h-16 resize-none"
                      placeholder="Screenshot fuzzy, UTR doesn't match bank ledger, etc..."
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="flex justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectMode(false);
                        setError(null);
                      }}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                      disabled={loading}
                    >
                      Back to Approval
                    </button>

                    <button
                      type="button"
                      onClick={handleRejectSubmit}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
                      disabled={loading}
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                      <span>{loading ? 'Rejecting...' : 'Reject Payment screenshot'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
