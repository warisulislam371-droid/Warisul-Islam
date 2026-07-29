import { Order } from '../types';

/**
 * Utility functions for generating, printing, and downloading B2B Tax Invoices & POS Receipts.
 */

export function generateBillHTML(order: Order, format: 'a4' | 'pos' = 'a4'): string {
  const rawDate = order?.createdAt ? new Date(order.createdAt) : new Date();
  const validDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;
  const dateStr = validDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const items = Array.isArray(order?.items) ? order.items : [];
  const subtotal = items.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 1)), 0);
  const gstTotal = order?.gstAmount ?? Math.round(subtotal * 0.12);
  const discount = order?.discountAmount || 0;
  const grandTotal = order?.finalAmount || Math.max(0, subtotal + gstTotal - discount);
  const customerName = order?.customerName || 'Valued Buyer';
  const vendorName = order?.vendorName || 'HealNex Certified Supplier';
  const orderId = order?.id || 'ORD-HEALNEX';

  if (format === 'pos') {
    // 80mm POS Slip Format
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>POS Receipt - ${orderId}</title>
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
    <div>B2B Medical Consignments</div>
    <div>GSTIN: 27AAAAA1111A1Z1</div>
    <div class="dashed-line"></div>
    <div class="bold">TAX INVOICE SLIP</div>
    <div>Bill No: ${orderId}</div>
    <div>Date: ${dateStr}</div>
  </div>

  <div class="dashed-line"></div>
  <div><strong>Customer:</strong> ${customerName}</div>
  <div><strong>City:</strong> ${order?.shippingAddress?.city || 'India'}</div>
  <div><strong>Vendor:</strong> ${vendorName}</div>

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
          <td colspan="3" class="bold">${(item?.productName || 'Medical Item').slice(0, 32)}</td>
        </tr>
        <tr>
          <td>HSN: ${item?.hsnCode || '9018'}</td>
          <td class="text-center">${item?.quantity || 1} x ₹${item?.price || 0}</td>
          <td class="text-right">₹${(item?.price || 0) * (item?.quantity || 1)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="dashed-line"></div>
  <div class="flex-between"><span>Subtotal:</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
  <div class="flex-between"><span>GST Tax (12-18%):</span><span>₹${gstTotal.toLocaleString('en-IN')}</span></div>
  ${discount > 0 ? `<div class="flex-between"><span>Discount:</span><span>-₹${discount.toLocaleString('en-IN')}</span></div>` : ''}
  <div class="dashed-line"></div>
  <div class="flex-between bold" style="font-size:12px;"><span>TOTAL PAID:</span><span>₹${grandTotal.toLocaleString('en-IN')}</span></div>
  <div class="dashed-line"></div>

  <div class="text-center" style="margin-top:10px;">
    <div>Payment: ${order?.paymentMethod || 'Online Prepaid'}</div>
    <div>Status: PAID / VERIFIED</div>
    <br/>
    <div>Thank you for choosing HealNex!</div>
    <div style="font-size:9px; color:#555;">Verified B2B Medical Equipment</div>
  </div>
</body>
</html>`;
  }

  // A4 Standard Corporate Invoice Format
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${orderId}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand { font-size: 26px; font-weight: 800; color: #0f766e; }
    .brand-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; text-align: right; }
    .meta { font-size: 12px; color: #475569; text-align: right; margin-top: 6px; }
    
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .card { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 12px; }
    .card-title { font-weight: 700; color: #0f766e; text-transform: uppercase; font-size: 10px; tracking: 1px; margin-bottom: 8px; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { background: #0f766e; color: #ffffff; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }

    .totals { width: 280px; margin-left: auto; font-size: 12px; }
    .row { display: flex; justify-content: space-between; padding: 4px 0; }
    .row.grand { border-top: 2px solid #0f766e; padding-top: 8px; font-weight: 800; font-size: 15px; color: #0f766e; }

    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; }
    .seal { border: 1px solid #0f766e; color: #0f766e; padding: 4px 12px; border-radius: 4px; font-weight: 700; text-transform: uppercase; display: inline-block; font-size: 10px; }

    .no-print-bar {
      text-align: right;
      margin-bottom: 15px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .btn {
      padding: 8px 16px;
      background: #0f766e;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      margin-left: 8px;
    }
    .btn-secondary { background: #475569; }

    @media print {
      body { background: #fff; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; width: 100%; max-width: 100%; }
      .no-print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="btn btn-secondary" onclick="window.close()">Close Window</button>
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="container">
    <div class="header">
      <div>
        <div class="brand">HealNex <span style="font-size:14px; color:#0284c7;">Medi Bazar</span></div>
        <div class="brand-sub">Certified B2B Medical Equipment Marketplace<br/>GSTIN: 27AAAAA1111A1Z1 | Support: support@medbazarhealnex.shop</div>
      </div>
      <div>
        <div class="title">Tax Invoice</div>
        <div class="meta">
          <strong>Invoice No:</strong> ${orderId}<br/>
          <strong>Date:</strong> ${dateStr}<br/>
          <strong>Status:</strong> <span style="color:#16a34a; font-weight:bold;">PAID / CONFIRMED</span>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Seller / Authorized Supplier</div>
        <strong>${vendorName}</strong><br/>
        HealNex Certified Medical Equipment Supplier<br/>
        GSTIN: 27AAAAA1111A1Z1 | PAN: AAAAA1111A
      </div>
      <div class="card">
        <div class="card-title">Buyer / Consignee</div>
        <strong>${customerName}</strong><br/>
        ${order?.shippingAddress?.address || ''}, ${order?.shippingAddress?.city || ''}<br/>
        ${order?.shippingAddress?.state || ''} - ${order?.shippingAddress?.pincode || ''}<br/>
        Email: ${order?.customerEmail || 'N/A'}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Medical Item Name</th>
          <th>HSN Code</th>
          <th style="text-align:right;">Price</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">GST Rate</th>
          <th style="text-align:right;">Subtotal (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${item?.productName || 'Medical Equipment'}</strong><br/><span style="font-size:10px; color:#64748b;">SKU: ${item?.productId || 'N/A'}</span></td>
            <td>${item?.hsnCode || '9018'}</td>
            <td style="text-align:right;">₹${(item?.price || 0).toLocaleString('en-IN')}</td>
            <td style="text-align:center;">${item?.quantity || 1}</td>
            <td style="text-align:right;">${item?.gstRate || 12}%</td>
            <td style="text-align:right; font-weight:bold;">₹${((item?.price || 0) * (item?.quantity || 1)).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal (Excl. Tax):</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
      <div class="row"><span>GST Amount:</span><span>₹${gstTotal.toLocaleString('en-IN')}</span></div>
      ${discount > 0 ? `<div class="row" style="color:#e11d48;"><span>Discount:</span><span>-₹${discount.toLocaleString('en-IN')}</span></div>` : ''}
      <div class="row grand"><span>Total Invoice Value:</span><span>₹${grandTotal.toLocaleString('en-IN')}</span></div>
    </div>

    <div class="footer">
      <div>
        <strong>Declaration:</strong><br/>
        This is a computer-generated tax invoice issued by HealNex Medi Bazar.<br/>
        All clinical items comply with CDSCO / ISO B2B quality standards.
      </div>
      <div style="text-align:right;">
        <div class="seal">HealNex Verified Gateway</div>
        <div style="margin-top:6px; font-weight:bold;">${vendorName}</div>
        <div style="font-size:10px;">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadBillAsHTML(order: Order, format: 'a4' | 'pos' = 'a4') {
  const htmlContent = generateBillHTML(order, format);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `HealNex_Tax_Invoice_${order.id}_${format.toUpperCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printBillInWindow(order: Order, format: 'a4' | 'pos' = 'a4') {
  const htmlContent = generateBillHTML(order, format);
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Delay slightly to let styles load before invoking print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  }
}
