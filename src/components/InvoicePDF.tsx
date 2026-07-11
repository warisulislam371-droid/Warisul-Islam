import React from 'react';
import { Order } from '../types';
import { Printer, Download, X, CheckCircle } from 'lucide-react';

interface InvoicePDFProps {
  order: Order;
  onClose: () => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function InvoicePDF({ order, onClose, addToast }: InvoicePDFProps) {
  const handlePrint = () => {
    window.print();
  };

  const getSubtotal = () => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto p-4 sm:p-6 md:p-10 font-sans animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-100 overflow-hidden my-4">
        {/* Toolbar */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-800">B2B Commercial Tax Invoice</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice
            </button>
            <button
              onClick={() => {
                if (addToast) {
                  addToast('Invoice PDF generated and downloaded to device cache.', 'success');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Page Body */}
        <div className="p-8 sm:p-12 md:p-16 bg-white" id="invoice-printable">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-teal-800 mb-1">
                <span className="font-display font-bold text-2xl tracking-tight">HealNex</span>
                <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-semibold tracking-wider uppercase">Medi Bazar</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                India's Trusted Medical Equipment Procurement Platform<br />
                support@healnexmedibazar.com | www.healnexmedibazar.com
              </p>
            </div>
            <div className="text-left md:text-right">
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Commercial Tax Invoice</h2>
              <p className="text-xs text-slate-600 mt-1">
                Invoice No: <strong className="text-slate-900">{order.id}</strong><br />
                Date: <span className="text-slate-900">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
              </p>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-xs">
            {/* Seller */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-semibold text-slate-800 uppercase tracking-wider mb-2.5">Seller (Vendor Details)</h4>
              <p className="font-bold text-slate-900 mb-1">{order.vendorName}</p>
              <p className="text-slate-600 leading-relaxed mb-3">
                Authorized Supplier of Certified Clinical Equipment<br />
                HealNex Verified Partner Network
              </p>
              <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-200/60 pt-2.5">
                <p>GSTIN: <span className="font-mono text-slate-800 font-medium">27AAAAA1111A1Z1</span></p>
                <p>PAN: <span className="font-mono text-slate-800 font-medium">AAAAA1111A</span></p>
              </div>
            </div>

            {/* Buyer */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-semibold text-slate-800 uppercase tracking-wider mb-2.5">Buyer (Consignee Details)</h4>
              <p className="font-bold text-slate-900 mb-1">{order.customerName}</p>
              <p className="text-slate-600 leading-relaxed mb-3">
                {order.shippingAddress.address},<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
              <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-200/60 pt-2.5">
                <p>Email: <span className="text-slate-800 font-medium">{order.customerEmail}</span></p>
                <p>Payment Mode: <span className="text-slate-800 font-medium">{order.paymentMethod} (Razorpay Online)</span></p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Medical Item & SKU</th>
                  <th className="py-3 px-3">HSN Code</th>
                  <th className="py-3 px-3 text-right">Price (Excl. GST)</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">GST Rate</th>
                  <th className="py-3 px-4 text-right">Subtotal (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{item.productName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {item.productId}</p>
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-500">{item.hsnCode || '90181100'}</td>
                    <td className="py-4 px-3 text-right font-mono">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-3 text-center font-mono font-medium">{item.quantity}</td>
                    <td className="py-4 px-3 text-center font-mono text-slate-500">{item.gstRate}%</td>
                    <td className="py-4 px-4 text-right font-semibold font-mono text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Breakup */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t border-slate-100 pt-6">
            <div className="text-[11px] text-slate-500 space-y-1 max-w-sm">
              <p className="font-semibold text-slate-700 mb-1">Declaration & Terms</p>
              <p>1. Interest @ 18% p.a. will be charged if this invoice is not settled upon delivery.</p>
              <p>2. Goods once sold cannot be returned unless verified clinical damage is reported within 48 hours.</p>
              <p>3. All disputes are subject to the jurisdiction of the registered corporate office.</p>
              <p className="mt-4 pt-4 border-t border-slate-200">
                Payment Status: <strong className="text-emerald-700">PAID via Razorpay Gate ({order.paymentId || 'Simulated'})</strong>
              </p>
            </div>

            <div className="w-full md:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. Tax):</span>
                <span className="font-mono">₹{getSubtotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Integrated GST (IGST):</span>
                <span className="font-mono">₹{order.gstAmount.toLocaleString('en-IN')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Special B2B Discount:</span>
                  <span className="font-mono">-₹{order.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
                <span>Total Invoice Value:</span>
                <span className="font-mono text-teal-800 text-lg">₹{order.finalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Signature and Seal */}
          <div className="flex justify-between items-end mt-16 pt-8 border-t border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400">Scan code to verify authenticity</p>
              <div className="w-16 h-16 bg-slate-100 border border-slate-200 mt-1 flex items-center justify-center text-[8px] text-slate-400 font-mono text-center px-1">
                [HEALNEX QR CO]
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block border border-teal-200 bg-teal-50/20 text-teal-800 text-[10px] font-semibold px-4 py-1.5 rounded-lg mb-2 uppercase tracking-wider font-mono">
                HealNex Verified Gateway
              </div>
              <p className="text-[11px] font-bold text-slate-800">{order.vendorName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Authorized Signatory (Corporate Seal)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
