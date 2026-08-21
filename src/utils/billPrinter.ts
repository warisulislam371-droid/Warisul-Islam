import { Order, Product, OrderItem } from '../types';
import { calculateCartTaxSummary, ComprehensiveTaxSummary } from './taxCalculator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Interface for Pro-Forma Invoice Simulation (Pre-checkout)
 */
export interface ProFormaInvoiceData {
  isProForma: boolean;
  proFormaNumber: string;
  date: string;
  validUntil: string;
  customerName: string;
  customerCompany?: string;
  customerGstNumber?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  vendorName: string;
  vendorGstNumber?: string;
  items: Array<{
    productId: string;
    productName: string;
    hsnCode: string;
    price: number;
    quantity: number;
    gstRate: number;
    vendorName?: string;
  }>;
  taxSummary: ComprehensiveTaxSummary;
  paymentTerms?: string;
  poReference?: string;
}

/**
 * Converts cart items & customer data into a simulated ProForma Invoice object
 */
export function createProFormaInvoiceFromCart(
  cart: { product: Product; quantity: number }[],
  customerInfo?: {
    name?: string;
    company?: string;
    gstNumber?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    poReference?: string;
    isInterstate?: boolean;
  }
): ProFormaInvoiceData {
  const isInterstate = customerInfo?.isInterstate ?? true;
  const destinationState = customerInfo?.state || (isInterstate ? 'Delhi NCR' : 'Maharashtra');
  
  const taxSummary = calculateCartTaxSummary(cart, {
    isInterstate,
    supplyState: 'Maharashtra (27)',
    destinationState
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const validUntilDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days validity
  const validUntilStr = validUntilDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  
  // Random clean deterministic simulation ID
  const hash = Math.abs(cart.reduce((sum, item) => sum + item.product.id.charCodeAt(0) * item.quantity, 4242));
  const proFormaNumber = `PF-HN-${now.getFullYear()}-${(hash % 90000 + 10000)}`;

  const vendorNames = Array.from(new Set(cart.map(c => c.product.vendorName).filter(Boolean)));
  const primaryVendor = vendorNames.length > 0 ? vendorNames.join(', ') : 'HealNex Certified Suppliers';

  return {
    isProForma: true,
    proFormaNumber,
    date: dateStr,
    validUntil: validUntilStr,
    customerName: customerInfo?.name || 'Authorized Hospital / Clinical Buyer',
    customerCompany: customerInfo?.company || 'Healthcare Procurement Dept',
    customerGstNumber: customerInfo?.gstNumber || 'URP (Unregistered / Direct Consignment)',
    customerEmail: customerInfo?.email || 'procurement@hospital.org',
    customerPhone: customerInfo?.phone || '+91 98765 43210',
    shippingAddress: {
      address: customerInfo?.address || 'Consignment Delivery Dock, Medical Wing',
      city: customerInfo?.city || (isInterstate ? 'New Delhi' : 'Mumbai'),
      state: customerInfo?.state || (isInterstate ? 'Delhi' : 'Maharashtra'),
      pincode: customerInfo?.pincode || '110001'
    },
    vendorName: primaryVendor,
    vendorGstNumber: '27AAAAA1111A1Z1',
    items: cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      hsnCode: item.product.hsnCode || '90181100',
      price: item.product.salePrice,
      quantity: item.quantity,
      gstRate: item.product.gstRate ?? 12,
      vendorName: item.product.vendorName
    })),
    taxSummary,
    paymentTerms: '100% Advance B2B Direct Bank Clearing / Escrow Verified',
    poReference: customerInfo?.poReference || `PO-EST-${Date.now().toString().slice(-6)}`
  };
}

/**
 * Generates rich HTML for either a confirmed Order or a simulated ProForma Invoice
 */
export function generateBillHTML(
  data: Order | ProFormaInvoiceData,
  format: 'a4' | 'pos' = 'a4'
): string {
  const isProForma = 'isProForma' in data;
  const orderId = isProForma ? data.proFormaNumber : data.id;
  const dateStr = isProForma ? data.date : (new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
  const customerName = data.customerName || 'Valued Clinical Buyer';
  const vendorName = data.vendorName || 'HealNex Certified Supplier';
  
  const items = isProForma 
    ? data.items 
    : (data.items || []).map(i => ({
        productId: i.productId,
        productName: i.productName,
        hsnCode: i.hsnCode || '90181100',
        price: i.price,
        quantity: i.quantity,
        gstRate: i.gstRate || 12,
        vendorName: i.vendorName
      }));

  const taxSummary: ComprehensiveTaxSummary = isProForma 
    ? data.taxSummary 
    : calculateCartTaxSummary(data.items, {
        isInterstate: true,
        discountAmount: data.discountAmount || 0
      });

  const grandTotal = isProForma ? taxSummary.grandTotal : data.finalAmount;

  if (format === 'pos') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isProForma ? 'PRO-FORMA INVOICE SLIP' : 'POS RECEIPT'} - ${orderId}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 78mm;
      margin: 0 auto;
      padding: 8px;
      font-size: 11px;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .dashed-line { border-bottom: 1px dashed #000; margin: 6px 0; }
    .flex-between { display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0; }
    th, td { text-align: left; padding: 2px 0; font-size: 10px; }
    .btn-container { text-align: center; margin-bottom: 10px; }
    @media print { .btn-container { display: none; } }
  </style>
</head>
<body>
  <div class="btn-container">
    <button onclick="window.print()" style="padding:6px 12px; background:#000; color:#fff; border:none; border-radius:4px; cursor:pointer;">Print Receipt</button>
  </div>
  <div class="text-center">
    <div class="bold" style="font-size: 14px;">HEALNEX MEDI BAZAR</div>
    <div>B2B Medical Equipment Consignments</div>
    <div>GSTIN: 27AAAAA1111A1Z1 | PAN: AAAAA1111A</div>
    <div class="dashed-line"></div>
    <div class="bold">${isProForma ? 'PRO-FORMA TAX ESTIMATE' : 'TAX INVOICE SLIP'}</div>
    <div>Doc No: ${orderId}</div>
    <div>Date: ${dateStr}</div>
    ${isProForma ? `<div>Valid Until: ${(data as ProFormaInvoiceData).validUntil}</div>` : ''}
  </div>

  <div class="dashed-line"></div>
  <div><strong>Buyer:</strong> ${customerName}</div>
  <div><strong>City:</strong> ${data.shippingAddress?.city || 'India'}, ${data.shippingAddress?.state || ''}</div>
  <div><strong>Vendor:</strong> ${vendorName}</div>
  ${isProForma && (data as ProFormaInvoiceData).customerGstNumber ? `<div><strong>Buyer GST:</strong> ${(data as ProFormaInvoiceData).customerGstNumber}</div>` : ''}

  <div class="dashed-line"></div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Amt</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td colspan="3" class="bold">${(item.productName || 'Medical Item').slice(0, 32)}</td>
        </tr>
        <tr>
          <td>HSN: ${item.hsnCode || '9018'} (${item.gstRate}%)</td>
          <td class="text-center">${item.quantity} x ₹${item.price.toLocaleString('en-IN')}</td>
          <td class="text-right">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="dashed-line"></div>
  <div class="flex-between"><span>Taxable Subtotal:</span><span>₹${taxSummary.taxableSubtotal.toLocaleString('en-IN')}</span></div>
  ${taxSummary.cgstTotal > 0 ? `<div class="flex-between"><span>CGST:</span><span>₹${taxSummary.cgstTotal.toLocaleString('en-IN')}</span></div>` : ''}
  ${taxSummary.sgstTotal > 0 ? `<div class="flex-between"><span>SGST:</span><span>₹${taxSummary.sgstTotal.toLocaleString('en-IN')}</span></div>` : ''}
  ${taxSummary.igstTotal > 0 ? `<div class="flex-between"><span>IGST:</span><span>₹${taxSummary.igstTotal.toLocaleString('en-IN')}</span></div>` : ''}
  <div class="flex-between"><span>Total GST Tax:</span><span>₹${taxSummary.totalGstAmount.toLocaleString('en-IN')}</span></div>
  ${taxSummary.discountAmount > 0 ? `<div class="flex-between"><span>Discount:</span><span>-₹${taxSummary.discountAmount.toLocaleString('en-IN')}</span></div>` : ''}
  
  <div class="dashed-line"></div>
  <div class="flex-between bold" style="font-size:12px;"><span>TOTAL ESTIMATE:</span><span>₹${grandTotal.toLocaleString('en-IN')}</span></div>
  <div class="dashed-line"></div>

  <div class="text-center" style="margin-top:10px;">
    <div>${isProForma ? 'Status: PRE-CHECKOUT SIMULATION' : 'Status: PAID / CLEARED'}</div>
    <br/>
    <div>Thank you for choosing HealNex!</div>
    <div style="font-size:9px; color:#555;">Certified Medical Consignments Marketplace</div>
  </div>
</body>
</html>`;
  }

  // A4 Standard Corporate Invoice Layout
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isProForma ? 'PRO-FORMA INVOICE' : 'TAX INVOICE'} - ${orderId}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .badge-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f766e;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand-title { font-size: 24px; font-weight: 900; color: #0f766e; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4; }
    .doc-title { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; text-align: right; letter-spacing: 0.5px; }
    .doc-meta { font-size: 11px; color: #334155; text-align: right; margin-top: 6px; line-height: 1.5; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .box { background: #f8fafc; padding: 14px 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11.5px; line-height: 1.5; }
    .box-heading { font-weight: 800; color: #0f766e; text-transform: uppercase; font-size: 10px; letter-spacing: 0.8px; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
    th { background: #0f766e; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr:nth-child(even) td { background: #f8fafc; }

    .hsn-table { margin-top: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
    .hsn-table th { background: #334155; font-size: 9.5px; padding: 6px 8px; }
    .hsn-table td { font-size: 10.5px; padding: 6px 8px; font-family: monospace; }

    .bottom-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    .words-box { background: #f1f5f9; padding: 10px 12px; border-radius: 6px; font-size: 11px; margin-bottom: 12px; }
    
    .totals-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 11.5px; }
    .totals-row { display: flex; justify-content: space-between; padding: 3px 0; color: #334155; }
    .totals-row.grand { border-top: 2px solid #0f766e; margin-top: 6px; padding-top: 8px; font-weight: 900; font-size: 14px; color: #0f766e; }

    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10.5px; color: #64748b; }
    .stamp { border: 1.5px dashed #0f766e; color: #0f766e; padding: 4px 10px; border-radius: 4px; font-weight: 800; text-transform: uppercase; font-size: 9.5px; display: inline-block; }

    .action-bar { text-align: right; margin-bottom: 14px; max-width: 820px; margin-left: auto; margin-right: auto; }
    .btn { padding: 8px 16px; background: #0f766e; color: #fff; border: none; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; margin-left: 8px; }
    .btn-secondary { background: #475569; }

    @media print {
      body { background: #fff; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; width: 100%; max-width: 100%; }
      .action-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
    <button class="btn" onclick="window.print()">Print / Save PDF</button>
  </div>

  <div class="container" id="pdf-capture-root">
    <div class="badge-bar">
      <span>${isProForma ? 'Official B2B Pro-Forma Tax Invoice Preview' : 'Tax Invoice (Sec 31 CGST Act 2017)'}</span>
      <span>${isProForma ? 'Simulation Only • Pre-Checkout Quotation' : 'Original for Recipient'}</span>
    </div>

    <div class="header">
      <div>
        <div class="brand-title">HealNex <span style="font-size:16px; color:#0284c7;">Medi Bazar</span></div>
        <div class="brand-sub">
          <strong>HealNex Medi Bazar Pvt Ltd</strong><br/>
          India's Premier B2B Medical & Clinical Procurement Network<br/>
          GSTIN: <strong>27AAAAA1111A1Z1</strong> | PAN: <strong>AAAAA1111A</strong><br/>
          Corporate Desk: support@medbazarhealnex.shop | +91 800-HEALNEX
        </div>
      </div>
      <div>
        <div class="doc-title">${isProForma ? 'Pro-Forma Invoice' : 'Tax Invoice'}</div>
        <div class="doc-meta">
          <strong>Doc Ref No:</strong> ${orderId}<br/>
          <strong>Date of Issue:</strong> ${dateStr}<br/>
          ${isProForma ? `<strong>Valid Until:</strong> ${(data as ProFormaInvoiceData).validUntil}<br/>` : ''}
          ${isProForma && (data as ProFormaInvoiceData).poReference ? `<strong>PO Reference:</strong> ${(data as ProFormaInvoiceData).poReference}<br/>` : ''}
          <strong>State of Supply:</strong> Maharashtra (Code: 27)<br/>
          <strong>Place of Supply:</strong> ${data.shippingAddress?.state || 'Delhi NCR'}
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="box">
        <div class="box-heading">Details of Seller (Authorized Supplier)</div>
        <strong>${vendorName}</strong><br/>
        HealNex Verified Partner Network<br/>
        GSTIN: <strong>27AAAAA1111A1Z1</strong><br/>
        State: Maharashtra (27)<br/>
        Dispatch Center: HealNex Certified Logistics Hub, Mumbai
      </div>

      <div class="box">
        <div class="box-heading">Details of Buyer / Consignee (Bill To / Ship To)</div>
        <strong>${customerName}</strong><br/>
        ${isProForma && (data as ProFormaInvoiceData).customerCompany ? `${(data as ProFormaInvoiceData).customerCompany}<br/>` : ''}
        ${data.shippingAddress?.address || 'Clinical Facility'}, ${data.shippingAddress?.city || ''}<br/>
        ${data.shippingAddress?.state || ''} - ${data.shippingAddress?.pincode || ''}<br/>
        ${isProForma ? `GSTIN / UIN: <strong>${(data as ProFormaInvoiceData).customerGstNumber}</strong>` : `Email: ${data.customerEmail || 'N/A'}`}
      </div>
    </div>

    {/* Items Grid */}
    <table>
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th>Description of Medical Goods</th>
          <th style="width: 75px;">HSN / SAC</th>
          <th style="width: 45px; text-align: center;">Qty</th>
          <th style="width: 80px; text-align: right;">Unit Price (₹)</th>
          <th style="width: 55px; text-align: center;">GST %</th>
          <th style="width: 90px; text-align: right;">Taxable Value (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong>${item.productName || 'Medical Equipment'}</strong><br/>
              <span style="font-size: 9.5px; color: #64748b;">SKU: ${item.productId} | Supplier: ${item.vendorName || vendorName}</span>
            </td>
            <td style="font-family: monospace;">${item.hsnCode || '90181100'}</td>
            <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
            <td style="text-align: right; font-family: monospace;">₹${item.price.toLocaleString('en-IN')}</td>
            <td style="text-align: center; font-family: monospace;">${item.gstRate}%</td>
            <td style="text-align: right; font-weight: bold; font-family: monospace;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    {/* HSN Tax Summary Table */}
    <div style="font-size: 10px; font-weight: 800; color: #0f766e; text-transform: uppercase; margin-top: 10px; letter-spacing: 0.5px;">
      Tax & GST Calculation Breakdown (HSN / SAC Wise)
    </div>
    <table class="hsn-table">
      <thead>
        <tr>
          <th>HSN/SAC</th>
          <th style="text-align: right;">Taxable Amt (₹)</th>
          <th style="text-align: center;">CGST Rate</th>
          <th style="text-align: right;">CGST (₹)</th>
          <th style="text-align: center;">SGST Rate</th>
          <th style="text-align: right;">SGST (₹)</th>
          <th style="text-align: center;">IGST Rate</th>
          <th style="text-align: right;">IGST (₹)</th>
          <th style="text-align: right;">Total Tax (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${taxSummary.hsnBreakdown.map(h => `
          <tr>
            <td>${h.hsnCode}</td>
            <td style="text-align: right;">₹${h.taxableAmount.toLocaleString('en-IN')}</td>
            <td style="text-align: center;">${h.cgstRate}%</td>
            <td style="text-align: right;">₹${h.cgstAmount.toLocaleString('en-IN')}</td>
            <td style="text-align: center;">${h.sgstRate}%</td>
            <td style="text-align: right;">₹${h.sgstAmount.toLocaleString('en-IN')}</td>
            <td style="text-align: center;">${h.igstRate}%</td>
            <td style="text-align: right;">₹${h.igstAmount.toLocaleString('en-IN')}</td>
            <td style="text-align: right; font-weight: bold;">₹${h.totalTax.toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="bottom-layout">
      <div>
        <div class="words-box">
          <strong style="color:#0f766e;">Amount in Words:</strong><br/>
          <em>${taxSummary.amountInWords}</em>
        </div>

        <div style="font-size: 10.5px; color: #475569; line-height: 1.4;">
          <strong>Commercial Terms & Notes:</strong><br/>
          1. ${isProForma ? 'This is a preliminary estimation pro-forma invoice generated dynamically from active cart items.' : 'Supply is made under formal B2B clinical trade governance.'}<br/>
          2. Certified medical items comply with Indian MDR 2017 & CDSCO regulatory standards.<br/>
          3. Payment: ${isProForma ? 'Escrow / Bank Clearing' : 'Online / Verified'}.
        </div>
      </div>

      <div class="totals-card">
        <div class="totals-row">
          <span>Taxable Subtotal:</span>
          <span style="font-family:monospace;">₹${taxSummary.taxableSubtotal.toLocaleString('en-IN')}</span>
        </div>
        ${taxSummary.cgstTotal > 0 ? `
          <div class="totals-row">
            <span>Central GST (CGST):</span>
            <span style="font-family:monospace;">₹${taxSummary.cgstTotal.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        ${taxSummary.sgstTotal > 0 ? `
          <div class="totals-row">
            <span>State GST (SGST):</span>
            <span style="font-family:monospace;">₹${taxSummary.sgstTotal.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        ${taxSummary.igstTotal > 0 ? `
          <div class="totals-row">
            <span>Integrated GST (IGST):</span>
            <span style="font-family:monospace;">₹${taxSummary.igstTotal.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        <div class="totals-row" style="font-weight:700; color:#0f172a;">
          <span>Total GST Value:</span>
          <span style="font-family:monospace;">₹${taxSummary.totalGstAmount.toLocaleString('en-IN')}</span>
        </div>
        ${taxSummary.discountAmount > 0 ? `
          <div class="totals-row" style="color:#e11d48;">
            <span>B2B Discount:</span>
            <span style="font-family:monospace;">-₹${taxSummary.discountAmount.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        <div class="totals-row grand">
          <span>${isProForma ? 'Estimated Total:' : 'Total Invoice Value:'}</span>
          <span style="font-family:monospace;">₹${grandTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>
        <div class="stamp">HealNex Verification Seal</div>
        <p style="margin-top: 4px;">Digitally simulated on HealNex Secure Procurement Gateway.</p>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 800; color: #0f172a;">For ${vendorName}</div>
        <div style="margin-top: 18px; font-size: 10px; border-top: 1px solid #94a3b8; padding-top: 2px;">
          Authorized Signatory / E-Verification
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Downloads HTML invoice representation
 */
export function downloadBillAsHTML(
  data: Order | ProFormaInvoiceData,
  format: 'a4' | 'pos' = 'a4'
) {
  const isProForma = 'isProForma' in data;
  const id = isProForma ? data.proFormaNumber : data.id;
  const htmlContent = generateBillHTML(data, format);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `HealNex_${isProForma ? 'ProForma_Preview' : 'Tax_Invoice'}_${id}_${format.toUpperCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens print preview window
 */
export function printBillInWindow(
  data: Order | ProFormaInvoiceData,
  format: 'a4' | 'pos' = 'a4'
) {
  const htmlContent = generateBillHTML(data, format);
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  }
}

/**
 * Exports a DOM Element or Order/ProForma directly as a downloadable .pdf file using jsPDF & html2canvas
 */
export async function downloadInvoiceAsPDF(
  elementOrData: HTMLElement | Order | ProFormaInvoiceData,
  customFilename?: string
): Promise<boolean> {
  try {
    let targetElement: HTMLElement;
    let cleanup = false;

    if (elementOrData instanceof HTMLElement) {
      targetElement = elementOrData;
    } else {
      // Create offscreen container
      const htmlContent = generateBillHTML(elementOrData, 'a4');
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.background = '#ffffff';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);
      
      const captureElem = container.querySelector('#pdf-capture-root') as HTMLElement || container;
      targetElement = captureElem;
      cleanup = true;
    }

    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    if (cleanup && targetElement.parentElement) {
      document.body.removeChild(targetElement.parentElement);
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const filename = customFilename || `HealNex_Tax_Invoice_${Date.now()}.pdf`;
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    // Fallback to HTML download
    if (!(elementOrData instanceof HTMLElement)) {
      downloadBillAsHTML(elementOrData, 'a4');
    }
    return false;
  }
}
