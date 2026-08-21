import React, { useState, useRef } from 'react';
import { Order, Product } from '../types';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle, 
  FileText, 
  Receipt, 
  Building, 
  Calculator, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  FileDown, 
  ArrowRight,
  Info,
  Loader2,
  Eye,
  Settings
} from 'lucide-react';
import { 
  ProFormaInvoiceData, 
  downloadBillAsHTML, 
  printBillInWindow, 
  downloadInvoiceAsPDF 
} from '../utils/billPrinter';
import { calculateCartTaxSummary, ComprehensiveTaxSummary } from '../utils/taxCalculator';
import { MARKETPLACE_LOGO } from '../assets/logo';

interface InvoicePDFProps {
  order?: Order | null;
  proFormaData?: ProFormaInvoiceData | null;
  cartItems?: { product: Product; quantity: number }[];
  onClose: () => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function InvoicePDF({ 
  order, 
  proFormaData, 
  cartItems, 
  onClose, 
  addToast 
}: InvoicePDFProps) {
  const [billFormat, setBillFormat] = useState<'a4' | 'pos' | 'hsn'>('a4');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isInterstate, setIsInterstate] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoice' | 'tax_audit' | 'custom_buyer'>('invoice');

  // Custom simulation buyer details
  const [buyerHospital, setBuyerHospital] = useState(proFormaData?.customerCompany || 'Apollo Hospitals / Fortis Healthcare');
  const [buyerName, setBuyerName] = useState(order?.customerName || proFormaData?.customerName || 'Authorized Medical Officer');
  const [buyerGst, setBuyerGst] = useState(proFormaData?.customerGstNumber || '27AABCA1234F1Z5');
  const [buyerCity, setBuyerCity] = useState(order?.shippingAddress.city || proFormaData?.shippingAddress.city || 'Mumbai');
  const [buyerState, setBuyerState] = useState(order?.shippingAddress.state || proFormaData?.shippingAddress.state || 'Maharashtra');

  const printCanvasRef = useRef<HTMLDivElement>(null);

  // Normalize data to render
  const isProForma = !order || !!proFormaData;
  const docId = order?.id || proFormaData?.proFormaNumber || `PRO-HN-${Date.now().toString().slice(-6)}`;
  const formattedDate = order 
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })
    : (proFormaData?.date || new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }));

  const rawItems = order?.items || proFormaData?.items || (cartItems || []).map(c => ({
    productId: c.product.id,
    productName: c.product.name,
    hsnCode: c.product.hsnCode || '90181100',
    price: c.product.salePrice,
    quantity: c.quantity,
    gstRate: c.product.gstRate ?? 12,
    vendorName: c.product.vendorName
  }));

  const vendorName = order?.vendorName || proFormaData?.vendorName || 'HealNex Certified Clinical Suppliers';

  // Real-time tax summary
  const taxSummary: ComprehensiveTaxSummary = calculateCartTaxSummary(rawItems as any, {
    isInterstate,
    supplyState: 'Maharashtra (27)',
    destinationState: buyerState,
    discountAmount: order?.discountAmount || 0
  });

  const grandTotal = order?.finalAmount || taxSummary.grandTotal;

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      if (order) {
        printBillInWindow(order, billFormat === 'pos' ? 'pos' : 'a4');
      } else if (proFormaData) {
        printBillInWindow(proFormaData, billFormat === 'pos' ? 'pos' : 'a4');
      }
    }
    if (addToast) {
      addToast(`Print dialog triggered for ${isProForma ? 'Pro-Forma' : 'Tax Invoice'} #${docId}`, 'info');
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    if (addToast) {
      addToast('Rendering high-resolution vector PDF invoice...', 'info');
    }

    try {
      if (printCanvasRef.current) {
        const success = await downloadInvoiceAsPDF(
          printCanvasRef.current,
          `HealNex_${isProForma ? 'ProForma_Invoice' : 'Tax_Invoice'}_${docId}.pdf`
        );
        if (success && addToast) {
          addToast(`Downloaded PDF Invoice #${docId} successfully!`, 'success');
        }
      } else if (order) {
        await downloadInvoiceAsPDF(order, `HealNex_Tax_Invoice_${docId}.pdf`);
        if (addToast) addToast(`Downloaded PDF Invoice #${docId}`, 'success');
      } else if (proFormaData) {
        await downloadInvoiceAsPDF(proFormaData, `HealNex_ProForma_${docId}.pdf`);
        if (addToast) addToast(`Downloaded Pro-Forma PDF #${docId}`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (addToast) addToast('Falling back to HTML invoice download...', 'info');
      handleDownloadHTML();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadHTML = () => {
    if (order) {
      downloadBillAsHTML(order, billFormat === 'pos' ? 'pos' : 'a4');
    } else if (proFormaData) {
      downloadBillAsHTML(proFormaData, billFormat === 'pos' ? 'pos' : 'a4');
    } else {
      const simData: ProFormaInvoiceData = {
        isProForma: true,
        proFormaNumber: docId,
        date: formattedDate,
        validUntil: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        customerName: buyerName,
        customerCompany: buyerHospital,
        customerGstNumber: buyerGst,
        shippingAddress: {
          address: 'Procurement Wing, Central Medical Store',
          city: buyerCity,
          state: buyerState,
          pincode: '400001'
        },
        vendorName,
        items: rawItems as any,
        taxSummary
      };
      downloadBillAsHTML(simData, billFormat === 'pos' ? 'pos' : 'a4');
    }
    if (addToast) {
      addToast(`Downloaded HTML Invoice File #${docId}`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-center items-start overflow-y-auto p-2 sm:p-4 md:p-6 font-sans animate-fade-in print-modal-backdrop">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-2 sm:my-4 print-modal-content flex flex-col">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex items-center justify-center ${isProForma ? 'bg-teal-500/20 text-teal-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {isProForma ? <Calculator className="w-5 h-5 text-teal-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white leading-tight tracking-wide uppercase">
                  {isProForma ? 'Real-Time Pro-Forma Invoice Simulation' : 'Official Commercial Tax Invoice'}
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isProForma ? 'bg-teal-900/80 text-teal-200 border border-teal-700' : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                }`}>
                  {isProForma ? 'Live Cart Simulation' : 'Verified Order'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Ref No: <span className="text-white font-bold">{docId}</span> • Issue Date: {formattedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View / Template Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setBillFormat('a4')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  billFormat === 'a4' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="A4 Standard Corporate Layout"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">A4 Tax Invoice</span>
                <span className="sm:hidden">A4</span>
              </button>

              <button
                type="button"
                onClick={() => setBillFormat('hsn')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  billFormat === 'hsn' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Detailed GST & HSN Tax Audit Breakdown"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GST Audit</span>
                <span className="sm:hidden">GST</span>
              </button>

              <button
                type="button"
                onClick={() => setBillFormat('pos')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  billFormat === 'pos' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="80mm Thermal Receipt Format"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">POS Slip</span>
                <span className="sm:hidden">POS</span>
              </button>
            </div>

            {/* Tax Mode Toggle (IGST vs CGST+SGST) */}
            <button
              type="button"
              onClick={() => setIsInterstate(prev => !prev)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white hover:border-slate-600 transition flex items-center gap-1 cursor-pointer"
              title="Toggle Interstate (IGST) vs Intrastate (CGST + SGST)"
            >
              <span className="text-teal-400">●</span>
              <span>{isInterstate ? 'Inter-state (IGST)' : 'Intra-state (CGST+SGST)'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition shadow-md cursor-pointer active:scale-95"
              title="Download Genuine Vector PDF"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition shadow cursor-pointer active:scale-95"
              title="System Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-800" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close Invoice Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pro-Forma Interactive Customizer Ribbon (Only in Pro-Forma simulation mode) */}
        {isProForma && (
          <div className="bg-teal-50 border-b border-teal-100 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex items-center gap-2 text-teal-900 font-semibold">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Real-Time Pro-Forma Simulation: Customize Institution details for instant quotation preview:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={buyerHospital}
                onChange={(e) => setBuyerHospital(e.target.value)}
                placeholder="Hospital / Institution Name"
                className="bg-white border border-teal-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold outline-none focus:border-teal-700 w-44 sm:w-52"
                title="Buyer Institution / Hospital"
              />
              <input
                type="text"
                value={buyerGst}
                onChange={(e) => setBuyerGst(e.target.value)}
                placeholder="Buyer GSTIN"
                className="bg-white border border-teal-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono font-bold outline-none focus:border-teal-700 w-36 uppercase"
                title="Buyer GSTIN (Optional)"
              />
            </div>
          </div>
        )}

        {/* Printable Canvas Section */}
        <div className="p-4 sm:p-8 md:p-10 bg-white overflow-y-auto max-h-[75vh]" id="invoice-printable" ref={printCanvasRef}>
          
          {billFormat === 'pos' ? (
            /* 80mm POS Slip View */
            <div className="max-w-xs mx-auto border border-dashed border-slate-300 p-5 rounded-xl font-mono text-[11px] text-slate-900 bg-white shadow-xs">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3 mb-3">
                <p className="font-black text-sm uppercase">HEALNEX MEDI BAZAR</p>
                <p className="text-[10px] text-slate-600">B2B Medical Consignments</p>
                <p className="text-[10px] text-slate-500 font-bold">GSTIN: 27AAAAA1111A1Z1</p>
                <div className="pt-2 font-bold text-xs uppercase border-t border-slate-200 mt-2 text-teal-800">
                  {isProForma ? 'PRO-FORMA INVOICE SLIP' : 'TAX INVOICE SLIP'}
                </div>
                <p className="text-[10px] font-bold">Ref No: {docId}</p>
                <p className="text-[10px]">{formattedDate}</p>
              </div>

              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-3 mb-3">
                <p><strong>Hospital/Buyer:</strong> {buyerHospital}</p>
                <p><strong>Contact:</strong> {buyerName}</p>
                <p><strong>City:</strong> {buyerCity}, {buyerState}</p>
                <p><strong>Buyer GST:</strong> {buyerGst}</p>
                <p><strong>Supplier:</strong> {vendorName}</p>
                <p><strong>Tax Type:</strong> {isInterstate ? 'Inter-state IGST' : 'Intra-state CGST+SGST'}</p>
              </div>

              <table className="w-full text-left border-collapse text-[10px] mb-3">
                <thead>
                  <tr className="border-b border-slate-200 font-bold">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Amt (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1 pr-1 font-bold">
                        {item.productName.slice(0, 24)}
                        <span className="block text-[9px] font-normal text-slate-500">HSN: {item.hsnCode || '9018'} ({item.gstRate}%)</span>
                      </td>
                      <td className="py-1 text-center font-bold">x{item.quantity}</td>
                      <td className="py-1 text-right font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono">₹{taxSummary.taxableSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {taxSummary.cgstTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono">₹{taxSummary.cgstTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {taxSummary.sgstTotal > 0 && (
                  <div className="flex justify-between">
                    <span>State GST (SGST):</span>
                    <span className="font-mono">₹{taxSummary.sgstTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {taxSummary.igstTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Integrated GST (IGST):</span>
                    <span className="font-mono">₹{taxSummary.igstTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-teal-900">
                  <span>Total Tax Breakout:</span>
                  <span className="font-mono">₹{taxSummary.totalGstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-black text-xs border-t border-slate-900 pt-1 mt-1 text-slate-900">
                  <span>Grand Total (INR):</span>
                  <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-500 mt-4 border-t border-slate-200 pt-2">
                {isProForma ? 'Real-time Cart Simulated Quotation.' : 'Official computer generated tax invoice.'}<br />
                Certified Medical Consignments • CDSCO Compliant
              </div>
            </div>
          ) : billFormat === 'hsn' ? (
            /* Detailed HSN / GST Tax Audit View */
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-teal-400 font-extrabold block">Indian GST Compliance Audit</span>
                    <h3 className="text-xl font-black text-white mt-0.5">HSN / SAC Wise GST Breakdown</h3>
                    <p className="text-xs text-slate-400 mt-1">Tax Calculation Audit for Document #{docId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Tax Amount</span>
                    <p className="text-2xl font-black font-mono text-teal-400">₹{taxSummary.totalGstAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Taxable Subtotal</span>
                    <span className="font-mono font-bold text-white text-sm">₹{taxSummary.taxableSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">CGST Amount</span>
                    <span className="font-mono font-bold text-white text-sm">₹{taxSummary.cgstTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">SGST Amount</span>
                    <span className="font-mono font-bold text-white text-sm">₹{taxSummary.sgstTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">IGST Amount</span>
                    <span className="font-mono font-bold text-white text-sm">₹{taxSummary.igstTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* HSN Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-3 px-4">HSN / SAC</th>
                      <th className="py-3 px-4">Applicable Products</th>
                      <th className="py-3 px-3 text-right">Taxable Value (₹)</th>
                      <th className="py-3 px-3 text-center">GST Rate</th>
                      {isInterstate ? (
                        <>
                          <th className="py-3 px-3 text-center">IGST Rate</th>
                          <th className="py-3 px-3 text-right">IGST Amt (₹)</th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 px-3 text-center">CGST</th>
                          <th className="py-3 px-3 text-right">CGST Amt (₹)</th>
                          <th className="py-3 px-3 text-center">SGST</th>
                          <th className="py-3 px-3 text-right">SGST Amt (₹)</th>
                        </>
                      )}
                      <th className="py-3 px-4 text-right">Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {taxSummary.hsnBreakdown.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition font-medium">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-800">{h.hsnCode}</td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-[11px]">
                          {h.productNames.join(', ')}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold">₹{h.taxableAmount.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-3 text-center font-mono">{h.gstRate}%</td>
                        {isInterstate ? (
                          <>
                            <td className="py-3.5 px-3 text-center font-mono">{h.igstRate}%</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">₹{h.igstAmount.toLocaleString('en-IN')}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-3.5 px-3 text-center font-mono">{h.cgstRate}%</td>
                            <td className="py-3.5 px-3 text-right font-mono">₹{h.cgstAmount.toLocaleString('en-IN')}</td>
                            <td className="py-3.5 px-3 text-center font-mono">{h.sgstRate}%</td>
                            <td className="py-3.5 px-3 text-right font-mono">₹{h.sgstAmount.toLocaleString('en-IN')}</td>
                          </>
                        )}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-teal-800">₹{h.totalTax.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">GST Input Tax Credit (ITC) Advisory</p>
                  <p className="leading-relaxed">
                    Under Indian GST law (Section 16 of CGST Act), Registered Hospitals, Clinical Labs, and Healthcare Providers can claim 100% Input Tax Credit on certified medical equipment invoices with valid GSTIN and HSN classifications.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Standard A4 Corporate Tax Invoice View */
            <div className="text-slate-800" id="pdf-capture-root">
              
              {/* Header Badge */}
              <div className="bg-teal-800 text-white px-4 py-1.5 rounded-lg mb-6 flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider">
                <span>{isProForma ? 'Pro-Forma B2B Tax Invoice & Procurement Simulation' : 'Tax Invoice (Section 31 of CGST Act 2017)'}</span>
                <span>{isProForma ? 'Real-Time Cart Estimate' : 'Original for Consignee'}</span>
              </div>

              {/* Company & Invoice Header */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b-2 border-slate-200 pb-6 mb-6">
                <div className="flex items-center gap-3.5">
                  <img
                    src={MARKETPLACE_LOGO}
                    alt="HealNex Logo"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1 shadow-sm bg-white shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-teal-800 mb-0.5">
                      <span className="font-display font-black text-2xl tracking-tight">HealNex</span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-extrabold tracking-wider uppercase">Medi Bazar</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      <strong>HealNex Medi Bazar Pvt Ltd</strong><br />
                      India's Certified B2B Clinical Procurement Network<br />
                      GSTIN: <span className="font-mono font-bold text-slate-700">27AAAAA1111A1Z1</span> | PAN: <span className="font-mono font-bold text-slate-700">AAAAA1111A</span>
                    </p>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">
                    {isProForma ? 'Pro-Forma Tax Invoice' : 'Commercial Tax Invoice'}
                  </h2>
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5 leading-snug">
                    <p>Doc No: <strong className="text-slate-900 font-mono">{docId}</strong></p>
                    <p>Date of Issue: <span className="text-slate-900 font-medium">{formattedDate}</span></p>
                    {isProForma && <p>Valid Until: <span className="text-teal-800 font-medium">{proFormaData?.validUntil || '15 Days from generation'}</span></p>}
                    <p>State of Supply: <span className="text-slate-900 font-medium">Maharashtra (27)</span></p>
                    <p>Place of Supply: <span className="text-slate-900 font-medium">{buyerState}</span></p>
                  </div>
                </div>
              </div>

              {/* Seller and Buyer Party Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
                {/* Seller Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-teal-800 uppercase tracking-wider text-[10px] mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>Details of Seller (Authorized Supplier)</span>
                    <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-extrabold">Verified</span>
                  </h4>
                  <p className="font-bold text-slate-900 text-sm mb-1">{vendorName}</p>
                  <p className="text-slate-600 leading-relaxed">
                    Certified Clinical & Diagnostic Equipment Supplier<br />
                    HealNex Partner Network Logistics Hub, Mumbai
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] space-y-0.5">
                    <p>GSTIN: <span className="font-mono font-bold text-slate-800">27AAAAA1111A1Z1</span></p>
                    <p>State: <span className="font-medium text-slate-800">Maharashtra (State Code: 27)</span></p>
                  </div>
                </div>

                {/* Buyer Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-teal-800 uppercase tracking-wider text-[10px] mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>Details of Buyer / Consignee (Bill To)</span>
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">Consignee</span>
                  </h4>
                  <p className="font-bold text-slate-900 text-sm mb-1">{buyerHospital}</p>
                  <p className="text-slate-600 leading-relaxed">
                    Attn: {buyerName}<br />
                    {order?.shippingAddress.address || proFormaData?.shippingAddress.address || 'Central Procurement Dock'}, {buyerCity}, {buyerState}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] space-y-0.5">
                    <p>Buyer GSTIN: <span className="font-mono font-bold text-slate-800">{buyerGst}</span></p>
                    <p>Place of Delivery: <span className="font-medium text-slate-800">{buyerCity}, {buyerState}</span></p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Description of Clinical Equipment</th>
                      <th className="py-2.5 px-3 text-center">HSN Code</th>
                      <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-center">GST %</th>
                      <th className="py-2.5 px-3 text-right">Taxable Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {rawItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 font-medium">
                        <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {item.productId} • Vendor: {item.vendorName || vendorName}</p>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{item.hsnCode || '90181100'}</td>
                        <td className="py-3 px-3 text-right font-mono">₹{item.price.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{item.gstRate}%</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* HSN Tax Summary Compact Table */}
              <div className="mb-6">
                <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-teal-700" />
                  <span>GST Breakdown Summary (HSN-Wise)</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200 text-[9.5px] uppercase">
                        <th className="py-1.5 px-3">HSN Code</th>
                        <th className="py-1.5 px-3 text-right">Taxable Value</th>
                        <th className="py-1.5 px-3 text-center">CGST Rate</th>
                        <th className="py-1.5 px-3 text-right">CGST Amt</th>
                        <th className="py-1.5 px-3 text-center">SGST Rate</th>
                        <th className="py-1.5 px-3 text-right">SGST Amt</th>
                        <th className="py-1.5 px-3 text-center">IGST Rate</th>
                        <th className="py-1.5 px-3 text-right">IGST Amt</th>
                        <th className="py-1.5 px-3 text-right">Total GST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                      {taxSummary.hsnBreakdown.map((h, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-3 font-bold text-slate-800">{h.hsnCode}</td>
                          <td className="py-1.5 px-3 text-right">₹{h.taxableAmount.toLocaleString('en-IN')}</td>
                          <td className="py-1.5 px-3 text-center">{h.cgstRate}%</td>
                          <td className="py-1.5 px-3 text-right">₹{h.cgstAmount.toLocaleString('en-IN')}</td>
                          <td className="py-1.5 px-3 text-center">{h.sgstRate}%</td>
                          <td className="py-1.5 px-3 text-right">₹{h.sgstAmount.toLocaleString('en-IN')}</td>
                          <td className="py-1.5 px-3 text-center">{h.igstRate}%</td>
                          <td className="py-1.5 px-3 text-right">₹{h.igstAmount.toLocaleString('en-IN')}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-teal-800">₹{h.totalTax.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Summary & Total Calculation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-slate-200 pt-5">
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Invoice Value in Words</p>
                    <p className="font-bold text-slate-800 italic">{taxSummary.amountInWords}</p>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700">Commercial Terms & Warranty Notes:</p>
                    <p>1. {isProForma ? 'This pro-forma quotation is generated live for procurement budgeting & purchase order approval.' : 'Commercial Tax Invoice issued under Indian GST & MDR 2017 guidelines.'}</p>
                    <p>2. CDSCO certified medical devices with manufacturer batch inspection reports.</p>
                    <p>3. Input Tax Credit (ITC) available for eligible healthcare facilities.</p>
                  </div>
                </div>

                {/* Right Totals Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal (Excl. GST):</span>
                    <span className="font-mono font-bold">₹{taxSummary.taxableSubtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {taxSummary.cgstTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Central GST (CGST):</span>
                      <span className="font-mono">₹{taxSummary.cgstTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {taxSummary.sgstTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>State GST (SGST):</span>
                      <span className="font-mono">₹{taxSummary.sgstTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {taxSummary.igstTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Integrated GST (IGST):</span>
                      <span className="font-mono">₹{taxSummary.igstTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-teal-800 font-bold border-t border-slate-200 pt-1.5">
                    <span>Total Tax Breakdown (GST):</span>
                    <span className="font-mono">₹{taxSummary.totalGstAmount.toLocaleString('en-IN')}</span>
                  </div>

                  {taxSummary.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Special Institutional Discount:</span>
                      <span className="font-mono">-₹{taxSummary.discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline border-t-2 border-teal-700 pt-2.5 text-slate-900 font-black text-sm">
                    <span className="text-teal-900">{isProForma ? 'Estimated Quotation Total:' : 'Total Invoice Value:'}</span>
                    <span className="font-mono text-xl text-teal-800">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-8 pt-6 border-t border-slate-200 text-xs">
                <div>
                  <div className="inline-flex items-center gap-1.5 border border-teal-300 bg-teal-50 px-3 py-1.5 rounded-lg text-teal-900 font-mono text-[10px] font-bold uppercase">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span>HealNex Certified B2B Consignment</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Generated electronically • No physical signature required</p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-bold text-slate-900 text-xs">For {vendorName}</p>
                  <div className="w-32 h-10 border-b border-dashed border-slate-300 my-1"></div>
                  <p className="text-[10px] text-slate-400">Authorized Signatory & Corporate Stamp</p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Bottom Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              {isProForma 
                ? 'This simulated pro-forma invoice can be downloaded as an official PDF quotation for internal departmental approvals before final checkout.'
                : 'Official commercial invoice for tax deduction and input tax credit claims.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadHTML}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
            >
              Export HTML
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>{isGeneratingPdf ? 'Rendering PDF...' : 'Download Invoice PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
