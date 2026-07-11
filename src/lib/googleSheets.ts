import axios from 'axios';

/**
 * Client-side integration utility to proxy Google Workspace operations
 * through our secure Node.js backend.
 */

export interface OrderRowData {
  orderId: string;
  customerId: string;
  vendorId: string;
  items: any[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  screenshotUrl?: string;
  utr?: string;
  paymentDateTime?: string;
  paymentNote?: string;
  rejectionReason?: string;
  assignedToVendor?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Saves order data to Google Sheets via secure backend service account proxy.
 */
export async function saveOrderToSheet(order: OrderRowData): Promise<void> {
  try {
    const formattedOrder = {
      orderId: order.orderId,
      customerId: order.customerId,
      vendorId: order.vendorId,
      items: Array.isArray(order.items) ? JSON.stringify(order.items) : String(order.items),
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      screenshotUrl: order.screenshotUrl || '',
      utr: order.utr || '',
      paymentDateTime: order.paymentDateTime || '',
      paymentNote: order.paymentNote || '',
      rejectionReason: order.rejectionReason || '',
      assignedToVendor: order.assignedToVendor || '',
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || new Date().toISOString()
    };

    const response = await axios.post('/api/sheets/save-order', formattedOrder);
    if (response.data.success) {
      console.log('[Google Sheets Integration] Order row synced successfully.');
    } else {
      console.warn('[Google Sheets Integration] Sync failed:', response.data.error);
    }
  } catch (error: any) {
    console.warn('[Google Sheets Integration] Info/warning during Sheet save (usually credential configuration in preview):', error.message || error);
    throw error;
  }
}

/**
 * Uploads a file (base64) to Google Drive via secure backend service account proxy.
 * Returns the public webViewLink.
 */
export async function uploadScreenshotToDrive(
  fileBase64: string,
  fileName: string,
  mimeType: string,
  orderId: string
): Promise<string> {
  try {
    const response = await axios.post('/api/drive/upload-screenshot', {
      fileBase64,
      fileName,
      mimeType,
      orderId
    });

    if (response.data.success && response.data.webViewLink) {
      console.log('[Google Drive Integration] Screenshot uploaded successfully. URL:', response.data.webViewLink);
      return response.data.webViewLink;
    } else {
      throw new Error(response.data.error || 'Unknown upload error occurred.');
    }
  } catch (error: any) {
    console.warn('[Google Drive Integration] Info/warning during Drive upload (usually credential configuration in preview):', error.message || error);
    throw error;
  }
}
