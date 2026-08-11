import React, { useState } from 'react';
import { Order } from '../types';
import { Printer, Download, X, CheckCircle, FileText, Receipt } from 'lucide-react';
import { downloadBillAsHTML, printBillInWindow } from '../utils/billPrinter';
import { MARKETPLACE_LOGO } from '../assets/logo';

interface InvoicePDFProps {
  order: Order;
  onClose: () => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function InvoicePDF({ order, onClose, addToast }: InvoicePDFProps) {
  const [billFormat, setBillFormat] = useState<'a4' | 'pos'>('a4');

  const handlePrint = () => {
    // Direct window.print for print-friendly view on screen, or fallback to popup
    try {
      window.print();
    } catch (e) {
      printBillInWindow(order, billFormat);
    }
    if (addToast) {
      addToast(`Print dialog triggered for ${billFormat.toUpperCase()} Invoice #${order.id}`, 'info');
    }
  };

  const handleDownload = () => {
    downloadBillAsHTML(order, billFormat);
    if (addToast) {
      addToast(`Downloaded B2B Tax Invoice #${order.id} (${billFormat.toUpperCase()} Format)`, 'success');
    }
  };

  const getSubtotal = () => {
    return (order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center items-start overflow-y-auto p-3 sm:p-6 font-sans animate-fade-in print-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-100 overflow-hidden my-2 sm:my-4 print-modal-content">
        {/* Toolbar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Tax Invoice & Order Receipt</h3>
              <p className="text-[10px] text-slate-400 font-mono">Order ID: #{order.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Format Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 text-xs">
              <button
                onClick={() => setBillFormat('a4')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  billFormat === 'a4' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Corporate</span>
              </button>
              <button
                onClick={() => setBillFormat('pos')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  billFormat === 'pos' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm POS Slip</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-800" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition ml-1 cursor-pointer"
              title="Close Print View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body Printable Canvas */}
        <div className="p-4 sm:p-8 md:p-12 bg-white" id="invoice-printable">
          {billFormat === 'pos' ? (
            /* 80mm POS Receipt Slip View */
            <div className="max-w-xs mx-auto border border-dashed border-slate-300 p-4 rounded-lg font-mono text-[11px] text-slate-900 bg-white shadow-xs">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3 mb-3">
                <p className="font-black text-sm uppercase">HEALNEX MEDI BAZAR</p>
                <p className="text-[10px] text-slate-600">B2B Medical Consignments</p>
                <p className="text-[10px] text-slate-500">GSTIN: 27AAAAA1111A1Z1</p>
                <div className="pt-2 font-bold text-xs uppercase border-t border-slate-200 mt-2">
                  TAX INVOICE SLIP
                </div>
                <p className="text-[10px] font-bold">Bill No: {order.id}</p>
                <p className="text-[10px]">{formattedDate}</p>
              </div>

              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-3 mb-3">
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>City:</strong> {order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p><strong>Vendor:</strong> {order.vendorName}</p>
                <p><strong>Pay Mode:</strong> {order.paymentMethod}</p>
              </div>

              <table className="w-full text-left border-collapse text-[10px] mb-3">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1 pr-1 font-bold">
                        {item.productName.slice(0, 24)}
                        <span className="block text-[9px] font-normal text-slate-500">HSN: {item.hsnCode || '9018'}</span>
                      </td>
                      <td className="py-1 text-center font-bold">x{item.quantity}</td>
                      <td className="py-1 text-right font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{getSubtotal().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax (12-18%):</span>
                  <span>₹{order.gstAmount.toLocaleString('en-IN')}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-₹{order.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs border-t border-slate-900 pt-1 mt-1">
                  <span>Grand Total:</span>
                  <span>₹{order.finalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-500 mt-4 border-t border-slate-200 pt-2">
                Thank you for procuring with HealNex Medi Bazar.<br />
                Computer generated tax invoice slip.
              </div>
            </div>
          ) : (
            /* Standard A4 Corporate B2B Tax Invoice View */
            <div>
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8 mb-8">
                <div className="flex items-center gap-3">
                  <img
                    src={MARKETPLACE_LOGO}
                    alt="HealNex Medi Bazar Logo"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-0.5 shadow-sm bg-white shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-teal-800 mb-0.5">
                      <span className="font-display font-black text-2xl tracking-tight">HealNex</span>
                      <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-bold tracking-wider uppercase">Medi Bazar</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      India's Trusted Medical Equipment Procurement Platform<br />
                      support@medbazarhealnex.shop | www.medbazarhealnex.shop
                    </p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Commercial Tax Invoice</h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Invoice No: <strong className="text-slate-900">{order.id}</strong><br />
                    Date: <span className="text-slate-900">{formattedDate}</span>
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
                    <p>Payment Mode: <span className="text-slate-800 font-medium">{order.paymentMethod}</span></p>
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
                    Payment Status: <strong className="text-emerald-700">VERIFIED ({order.paymentId || 'Online Payment'})</strong>
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
                    [HEALNEX QR]
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
          )}
        </div>
      </div>
    </div>
  );
}

