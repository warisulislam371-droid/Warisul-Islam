import { getCachedWorkspaceToken } from '../utils/googleSheets';

// Configurable Spreadsheet IDs
// Users can configure their specific sheet IDs, or we fallback to local storage / placeholders.
export const getSheetIds = () => {
  const singleSheetId = localStorage.getItem('GOOGLE_SHEET_ID_SINGLE') || localStorage.getItem('GOOGLE_SHEET_ID_ORDERS') || '1PASTE_YOUR_Healnex_Orders_SheetID_HERE';
  return {
    orders: localStorage.getItem('GOOGLE_SHEET_ID_ORDERS') || singleSheetId,
    users: localStorage.getItem('GOOGLE_SHEET_ID_USERS') || singleSheetId,
    products: localStorage.getItem('GOOGLE_SHEET_ID_PRODUCTS') || singleSheetId,
  };
};

export const getApiKey = () => {
  // Try loading from all possible env locations, prioritizing local storage overrides
  const metaEnv = (import.meta as any).env || {};
  return (
    (typeof window !== 'undefined' ? localStorage.getItem('VITE_NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY') : '') ||
    metaEnv.VITE_NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY ||
    metaEnv.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY ||
    metaEnv.VITE_GOOGLE_SHEETS_API_KEY ||
    (window as any).NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY ||
    ''
  );
};

/**
 * Core fetch wrapper that supports both authenticated OAuth tokens or API keys
 */
async function sheetsFetch(spreadsheetId: string, path: string, options: RequestInit = {}): Promise<any> {
  // Detect and skip placeholders
  const isPlaceholderId = (id: string | null | undefined): boolean => {
    if (!id) return true;
    const lower = id.toLowerCase();
    return (
      lower.includes('paste_your') ||
      lower.includes('placeholder') ||
      lower.includes('your_') ||
      id.length < 20
    );
  };

  if (isPlaceholderId(spreadsheetId)) {
    console.warn(`[Sheets Sync] Spreadsheet operation skipped because Spreadsheet ID is still a placeholder or empty ("${spreadsheetId}").`);
    return { skipped: true, values: [] };
  }

  const token = getCachedWorkspaceToken();
  const apiKey = getApiKey();

  // Identify if this is a write operation
  const method = (options.method || 'GET').toUpperCase();
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isWrite && !token) {
    console.warn(`[Sheets Sync] ${method} write operation to sheet "${spreadsheetId}" was skipped because there is no active authenticated Google Workspace OAuth session.`);
    return { skipped: true, values: [] };
  }

  // For reads, if we have neither token nor API key, skip to avoid 401/400 errors
  if (!isWrite && !token && !apiKey) {
    console.warn(`[Sheets Sync] Read operation from sheet "${spreadsheetId}" was skipped because neither a Google Workspace OAuth token nor an API key is available.`);
    return { skipped: true, values: [] };
  }

  let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  } as Record<string, string>;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (apiKey) {
    // Append the API key as query param if no token is cached
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}key=${apiKey}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401) {
      console.warn('[Sheets Sync] Google Workspace Access Token is missing, expired, or invalid. Clearing saved token session.');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('GOOGLE_WORKSPACE_ACCESS_TOKEN');
        localStorage.removeItem('GOOGLE_WORKSPACE_USER');
      }
    }
    throw new Error(`Google Sheets API Error (${response.status}): ${errText || response.statusText}`);
  }

  return response.json();
}

/**
 * Appends a row to a specified sheet.
 */
async function appendRow(spreadsheetId: string, sheetRange: string, rowValues: any[]) {
  const path = `values/${encodeURIComponent(sheetRange)}:append?valueInputOption=RAW`;
  return sheetsFetch(spreadsheetId, path, {
    method: 'POST',
    body: JSON.stringify({
      values: [rowValues],
    }),
  });
}

/**
 * Reads all rows from a specified sheet range.
 */
async function getSheetRows(spreadsheetId: string, sheetRange: string): Promise<any[][]> {
  const path = `values/${encodeURIComponent(sheetRange)}`;
  try {
    const data = await sheetsFetch(spreadsheetId, path, { method: 'GET' });
    return data.values || [];
  } catch (err) {
    console.warn(`Failed to read range "${sheetRange}" from sheet "${spreadsheetId}". Will return empty rows.`, err);
    return [];
  }
}

/**
 * Updates a specific cell or range in a sheet.
 */
async function updateSheetRange(spreadsheetId: string, sheetRange: string, values: any[][]) {
  const path = `values/${encodeURIComponent(sheetRange)}?valueInputOption=RAW`;
  return sheetsFetch(spreadsheetId, path, {
    method: 'PUT',
    body: JSON.stringify({
      values,
    }),
  });
}

// ==========================================
// REQUIREMENT 1: EXPORTED FUNCTIONS
// ==========================================

/**
 * 1. addOrder(orderData) -> Append row to "Healnex_Orders" sheet
 * Columns: OrderID, CustomerEmail, CustomerName, Items, Total, Status, Date, Address
 */
export async function addOrder(orderData: any) {
  const ids = getSheetIds();
  
  // Format items nicely
  const itemsStr = Array.isArray(orderData.items)
    ? JSON.stringify(orderData.items.map((item: any) => ({
        productId: item.productId || item.id,
        productName: item.productName || item.name,
        quantity: item.quantity,
        price: item.price
      })))
    : String(orderData.items || '[]');

  const row = [
    orderData.id || orderData.orderId || '',
    orderData.customerEmail || orderData.email || '',
    orderData.customerName || orderData.name || '',
    itemsStr,
    orderData.finalAmount || orderData.total || orderData.totalAmount || 0,
    orderData.status || orderData.orderStatus || 'Pending Verification',
    orderData.createdAt || new Date().toISOString(),
    orderData.address || orderData.shippingAddress || ''
  ];

  try {
    // Append to sheet named "Healnex_Orders"
    await appendRow(ids.orders, 'Healnex_Orders!A:H', row);
    console.log('Successfully appended order to Healnex_Orders Google Sheet.');
  } catch (err: any) {
    console.error('Failed to append order to Google Sheet:', err);
    throw err;
  }
}

/**
 * 2. getOrders() -> Read all rows from "Healnex_Orders" sheet
 * Parses rows back into standard Order objects
 */
export async function getOrders(): Promise<any[]> {
  const ids = getSheetIds();
  try {
    const rows = await getSheetRows(ids.orders, 'Healnex_Orders!A2:H');
    if (!rows || rows.length === 0) return [];
    
    return rows.map((row, idx) => {
      let items = [];
      try {
        items = row[3] ? JSON.parse(row[3]) : [];
      } catch {
        items = [{ productName: row[3] || 'Medical Equipment', quantity: 1, price: Number(row[4]) }];
      }

      return {
        id: row[0],
        orderId: row[0],
        customerEmail: row[1],
        customerName: row[2],
        items: Array.isArray(items) ? items.map((it: any) => ({
          productId: it.productId || it.id || 'p-unknown',
          productName: it.productName || it.name || 'Equipment',
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
        })) : [],
        totalAmount: Number(row[4]) || 0,
        finalAmount: Number(row[4]) || 0,
        status: row[5] || 'Pending',
        orderStatus: row[5] || 'Pending',
        createdAt: row[6] || new Date().toISOString(),
        shippingAddress: row[7] || '',
        rowIndex: idx + 2 // Keep track of row index for direct cell updates (A2 is index 0 in slice, row index 2)
      };
    });
  } catch (err) {
    console.error('Failed to fetch orders from Google Sheet:', err);
    return [];
  }
}

/**
 * 3. updateOrderStatus(orderId, newStatus) -> Find row by OrderID and update Status column
 * Updates column F (Status)
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const ids = getSheetIds();
  try {
    const ordersList = await getOrders();
    const match = ordersList.find(o => String(o.id) === String(orderId));
    if (!match) {
      throw new Error(`Order with ID ${orderId} not found in Google Sheets.`);
    }

    const rowIndex = match.rowIndex; 
    const range = `Healnex_Orders!F${rowIndex}`; // F is the 6th column (Status)
    await updateSheetRange(ids.orders, range, [[newStatus]]);
    console.log(`Successfully updated order ${orderId} to status ${newStatus} in Google Sheets.`);
  } catch (err) {
    console.error(`Failed to update order status for ${orderId}:`, err);
    throw err;
  }
}

/**
 * 4. addUser(userData) -> Append to "Healnex_Users"
 * Columns: Email, Name, Role, Password, CreatedAt
 */
export async function addUser(userData: any) {
  const ids = getSheetIds();
  const row = [
    userData.email || '',
    userData.name || '',
    userData.role || 'customer',
    userData.password || '',
    userData.createdAt || new Date().toISOString()
  ];

  try {
    await appendRow(ids.users, 'Healnex_Users!A:E', row);
    console.log('Successfully appended user to Healnex_Users Google Sheet.');
  } catch (err) {
    console.error('Failed to append user to Google Sheet:', err);
    throw err;
  }
}

/**
 * 5. getProducts() -> Read from "Healnex_Products"
 * Columns: ID, Name, Price, Stock, ImageURL, Category
 */
export async function getProducts(): Promise<any[]> {
  const ids = getSheetIds();
  try {
    const rows = await getSheetRows(ids.products, 'Healnex_Products!A2:F');
    if (!rows || rows.length === 0) return [];

    return rows.map(row => ({
      id: row[0],
      name: row[1],
      price: Number(row[2]) || 0,
      salePrice: Number(row[2]) || 0,
      stock: Number(row[3]) || 0,
      stockQuantity: Number(row[3]) || 0,
      image: row[4] || '',
      images: [row[4] || ''],
      category: row[5] || 'General',
    }));
  } catch (err) {
    console.error('Failed to fetch products from Google Sheet:', err);
    return [];
  }
}

/**
 * 6. addVendorToSheet(vendorData) -> Append row to "Healnex_Vendors" sheet
 */
export async function addVendorToSheet(vendorData: any) {
  const ids = getSheetIds();
  const row = [
    vendorData.id || '',
    vendorData.companyName || '',
    vendorData.ownerName || '',
    vendorData.email || '',
    vendorData.mobileNumber || '',
    vendorData.gstNumber || '',
    vendorData.panNumber || '',
    vendorData.aadhaarNumber || '',
    vendorData.businessAddress || '',
    vendorData.state || '',
    vendorData.district || '',
    vendorData.pincode || '',
    vendorData.bankDetails?.bankName || '',
    vendorData.bankDetails?.accountNumber || '',
    vendorData.bankDetails?.ifscCode || '',
    vendorData.status || 'Pending',
    vendorData.createdAt || new Date().toISOString()
  ];

  try {
    // Append to sheet named "Healnex_Vendors" using the user/fallback spreadsheet
    await appendRow(ids.users, 'Healnex_Vendors!A:Q', row);
    console.log('Successfully appended vendor to Healnex_Vendors Google Sheet.');
  } catch (err: any) {
    console.error('[Sheets Sync] Direct Google Sheets vendor write failed:', err);
    throw err;
  }
}

