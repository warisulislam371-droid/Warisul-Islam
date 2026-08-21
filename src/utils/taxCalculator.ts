import { Product, OrderItem } from '../types';

export interface TaxBreakdownItem {
  hsnCode: string;
  productNames: string[];
  taxableAmount: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalWithTax: number;
}

export interface ComprehensiveTaxSummary {
  taxableSubtotal: number;
  isInterstate: boolean;
  supplyState: string;
  destinationState: string;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalGstAmount: number;
  grandTotal: number;
  discountAmount: number;
  netPayable: number;
  hsnBreakdown: TaxBreakdownItem[];
  itemCount: number;
  totalQuantity: number;
  amountInWords: string;
}

/**
 * Converts a numeric amount to Indian Rupee Words (Lakhs, Crores system)
 */
export function numberToIndianWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return tens[ten] + (unit > 0 ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
      if (remainder > 0) res += ' and ';
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder);
    }
    return res;
  }

  let crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  let rest = remainder % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(convertThreeDigits(crore) + ' Crore');
  }
  if (lakh > 0) {
    parts.push(convertThreeDigits(lakh) + ' Lakh');
  }
  if (thousand > 0) {
    parts.push(convertThreeDigits(thousand) + ' Thousand');
  }
  if (rest > 0) {
    parts.push(convertThreeDigits(rest));
  }

  return 'INR ' + parts.join(' ') + ' Only';
}

/**
 * Calculates comprehensive GST and tax breakdowns for a cart or order items
 */
export function calculateCartTaxSummary(
  cartItems: { product: Product; quantity: number }[] | OrderItem[],
  options: {
    isInterstate?: boolean;
    supplyState?: string;
    destinationState?: string;
    discountAmount?: number;
  } = {}
): ComprehensiveTaxSummary {
  const isInterstate = options.isInterstate ?? true; // B2B medical default across states
  const supplyState = options.supplyState || 'Maharashtra';
  const destinationState = options.destinationState || (isInterstate ? 'Delhi' : 'Maharashtra');
  const discountAmount = options.discountAmount || 0;

  const hsnMap = new Map<string, TaxBreakdownItem>();
  let taxableSubtotal = 0;
  let totalQuantity = 0;

  cartItems.forEach((entry) => {
    let price = 0;
    let quantity = 1;
    let name = '';
    let hsnCode = '90181100';
    let gstRate = 12;

    if ('product' in entry) {
      price = entry.product.salePrice || entry.product.price || 0;
      quantity = entry.quantity || 1;
      name = entry.product.name;
      hsnCode = entry.product.hsnCode || '90181100';
      gstRate = entry.product.gstRate ?? 12;
    } else {
      price = entry.price || 0;
      quantity = entry.quantity || 1;
      name = entry.productName;
      hsnCode = entry.hsnCode || '90181100';
      gstRate = entry.gstRate ?? 12;
    }

    const itemTaxable = price * quantity;
    taxableSubtotal += itemTaxable;
    totalQuantity += quantity;

    const existing = hsnMap.get(hsnCode);
    if (existing) {
      existing.taxableAmount += itemTaxable;
      if (!existing.productNames.includes(name)) {
        existing.productNames.push(name);
      }
    } else {
      hsnMap.set(hsnCode, {
        hsnCode,
        productNames: [name],
        taxableAmount: itemTaxable,
        gstRate,
        cgstRate: isInterstate ? 0 : gstRate / 2,
        cgstAmount: 0,
        sgstRate: isInterstate ? 0 : gstRate / 2,
        sgstAmount: 0,
        igstRate: isInterstate ? gstRate : 0,
        igstAmount: 0,
        totalTax: 0,
        totalWithTax: 0
      });
    }
  });

  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let totalGstAmount = 0;

  const hsnBreakdown: TaxBreakdownItem[] = [];

  hsnMap.forEach((item) => {
    if (isInterstate) {
      item.cgstRate = 0;
      item.cgstAmount = 0;
      item.sgstRate = 0;
      item.sgstAmount = 0;
      item.igstRate = item.gstRate;
      item.igstAmount = Math.round((item.taxableAmount * item.gstRate) / 100);
      item.totalTax = item.igstAmount;
    } else {
      const halfRate = item.gstRate / 2;
      item.cgstRate = halfRate;
      item.cgstAmount = Math.round((item.taxableAmount * halfRate) / 100);
      item.sgstRate = halfRate;
      item.sgstAmount = Math.round((item.taxableAmount * halfRate) / 100);
      item.igstRate = 0;
      item.igstAmount = 0;
      item.totalTax = item.cgstAmount + item.sgstAmount;
    }
    item.totalWithTax = item.taxableAmount + item.totalTax;

    cgstTotal += item.cgstAmount;
    sgstTotal += item.sgstAmount;
    igstTotal += item.igstAmount;
    totalGstAmount += item.totalTax;

    hsnBreakdown.push(item);
  });

  const grandTotal = Math.max(0, taxableSubtotal + totalGstAmount - discountAmount);
  const netPayable = grandTotal;

  return {
    taxableSubtotal,
    isInterstate,
    supplyState,
    destinationState,
    cgstTotal,
    sgstTotal,
    igstTotal,
    totalGstAmount,
    grandTotal,
    discountAmount,
    netPayable,
    hsnBreakdown,
    itemCount: cartItems.length,
    totalQuantity,
    amountInWords: numberToIndianWords(netPayable)
  };
}
