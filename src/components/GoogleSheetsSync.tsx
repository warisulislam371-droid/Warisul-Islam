import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Cloud, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  signInWithGoogleForWorkspace, 
  getCachedWorkspaceToken, 
  getCachedWorkspaceUser, 
  clearWorkspaceSession, 
  createGoogleSpreadsheet, 
  appendRowsToSpreadsheet 
} from '../utils/googleSheets';

interface GoogleSheetsSyncProps {
  data: any[];
  dataType: 'orders' | 'products';
  buttonText?: string;
}

export function GoogleSheetsSync({ data, dataType, buttonText }: GoogleSheetsSyncProps) {
  const [token, setToken] = useState<string | null>(getCachedWorkspaceToken());
  const [user, setUser] = useState<any>(getCachedWorkspaceUser());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ url: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync state with global session
  useEffect(() => {
    setToken(getCachedWorkspaceToken());
    setUser(getCachedWorkspaceUser());
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setExportResult(null);
    try {
      const res = await signInWithGoogleForWorkspace();
      setToken(res.accessToken);
      setUser(res.user);
    } catch (err: any) {
      setError(err?.message || 'Google Authentication failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearWorkspaceSession();
    setToken(null);
    setUser(null);
    setExportResult(null);
    setError(null);
  };

  const handleExport = async () => {
    if (!token) {
      setError('Not authenticated. Please connect to Google.');
      return;
    }

    if (data.length === 0) {
      setError(`No ${dataType} data available to export.`);
      return;
    }

    const confirmed = window.confirm(
      `Do you want to export ${data.length} ${dataType} records to a new Google Sheet in your Google Drive?`
    );
    if (!confirmed) return;

    setIsExporting(true);
    setError(null);
    setExportResult(null);

    try {
      // 1. Prepare Spreadsheet metadata
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const title = `Healnex MedBazar - ${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Export (${dateStr})`;

      // 2. Create the spreadsheet
      const sheetInfo = await createGoogleSpreadsheet(token, title);

      // 3. Define structure
      let headers: string[] = [];
      let rows: any[][] = [];

      if (dataType === 'orders') {
        headers = [
          'Order ID',
          'Created Date',
          'Customer Name',
          'Customer Email',
          'Phone',
          'Vendor Name',
          'Items Summary',
          'Total Excl GST (INR)',
          'GST Amount (INR)',
          'Discount (INR)',
          'Final Amount (INR)',
          'Order Status',
          'Payment Status',
          'Payment Method',
          'Payment Transaction/UTR ID'
        ];

        rows = data.map(order => [
          order.id,
          new Date(order.createdAt).toLocaleString(),
          order.customerName,
          order.customerEmail,
          order.phone || 'N/A',
          order.vendorName,
          order.items?.map((item: any) => `${item.name} (x${item.quantity})`).join(', ') || '',
          order.totalAmount,
          order.gstAmount,
          order.discountAmount,
          order.finalAmount,
          order.status,
          order.paymentStatus || 'N/A',
          order.paymentMethod,
          order.paymentTxId || order.paymentId || 'N/A'
        ]);
      } else {
        // products
        headers = [
          'Product ID',
          'Name',
          'SKU',
          'Brand',
          'Category',
          'Subcategory',
          'Price (INR)',
          'Sale Price (INR)',
          'Min Order Qty (MOQ)',
          'Stock Quantity',
          'HSN Code',
          'GST Rate (%)',
          'Warranty',
          'Country of Origin',
          'Status',
          'Vendor Name'
        ];

        rows = data.map(p => [
          p.id,
          p.name,
          p.sku || 'N/A',
          p.brand,
          p.category,
          p.subcategory || 'N/A',
          p.price,
          p.salePrice,
          p.moq,
          p.stockQuantity,
          p.hsnCode || 'N/A',
          p.gstRate,
          p.warranty || 'N/A',
          p.countryOfOrigin || 'N/A',
          p.status,
          p.vendorName
        ]);
      }

      // 4. Append headers first, then values
      const allRows = [headers, ...rows];
      await appendRowsToSpreadsheet(token, sheetInfo.id, 'Sheet1!A1', allRows);

      setExportResult({
        title: title,
        url: sheetInfo.url
      });
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err?.message || 'Failed to export data to Google Sheets.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs max-w-sm space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Google Sheets Export</span>
        </div>
        {user && (
          <button 
            onClick={handleDisconnect}
            className="text-slate-400 hover:text-rose-600 transition p-1 rounded-lg"
            title="Disconnect Google Account"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!user ? (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 leading-normal">
            Connect your Google Workspace account to securely export clinical data models, order logs, or catalogs to a live spreadsheet.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition font-medium text-slate-700 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Connected as <strong className="text-slate-700">{user.email}</strong></span>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{buttonText || `Export to Google Sheets (${data.length})`}</span>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="flex gap-1.5 items-start bg-rose-50 text-rose-700 p-2 rounded-lg text-[10px] leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {exportResult && (
        <div className="flex flex-col gap-1.5 bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-[10px] leading-relaxed border border-emerald-100">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold">Export Complete!</span>
          </div>
          <p className="text-slate-600">{exportResult.title}</p>
          <a
            href={exportResult.url}
            target="_blank"
            referrerPolicy="no-referrer"
            rel="noopener noreferrer"
            className="mt-1 flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 rounded transition text-[10px]"
          >
            <span>Open Google Sheet</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
