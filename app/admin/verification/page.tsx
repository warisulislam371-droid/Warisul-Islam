'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAllOrders, 
  updateOrder, 
  createAuditLog, 
  createNotification, 
  Order 
} from '../../../src/lib/firestore';
import { saveOrderToSheet } from '../../../src/lib/googleSheets';
import VerificationDialog from '../../../src/components/VerificationDialog';
import { ShieldCheck, RefreshCw, AlertCircle, FileText, Search, CreditCard } from 'lucide-react';
import { formatDate, formatCurrency } from '../../../src/lib/utils';

export default function AdminVerificationDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getAllOrders();
      // Filter for manual waiting verification
      const pending = all.filter(o => o.paymentStatus === 'waiting_verification');
      setOrders(pending);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending verifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const handleApprove = async (orderId: string, vendorId: string, notes: string) => {
    try {
      // 1. Update order in Firestore
      const updateData = {
        paymentStatus: 'confirmed' as const,
        orderStatus: 'processing' as const,
        assignedToVendor: vendorId,
        paymentNote: notes || 'Verified & approved by administrative staff.'
      };
      await updateOrder(orderId, updateData);

      // Fetch full order details for sheets & notifications
      const pendingAll = await getAllOrders();
      const updatedOrder = pendingAll.find(o => o.orderId === orderId);

      if (updatedOrder) {
        // 2. Sync to Google Sheets via backend
        try {
          await saveOrderToSheet({
            orderId: updatedOrder.orderId,
            customerId: updatedOrder.customerId,
            vendorId: updatedOrder.vendorId,
            items: updatedOrder.items,
            totalAmount: updatedOrder.totalAmount,
            paymentMethod: updatedOrder.paymentMethod,
            paymentStatus: 'confirmed',
            orderStatus: 'processing',
            screenshotUrl: updatedOrder.screenshotUrl || '',
            utr: updatedOrder.utr || '',
            paymentDateTime: updatedOrder.paymentDateTime || '',
            paymentNote: updatedOrder.paymentNote || '',
            assignedToVendor: vendorId,
            createdAt: updatedOrder.createdAt ? new Date(updatedOrder.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (sheetErr) {
          console.error('Sheet sync failed but order confirmed:', sheetErr);
        }

        // 3. Notify user
        await createNotification(
          updatedOrder.customerId,
          'Manual Payment Verified!',
          `Your payment proof for Order #${orderId} was approved! We have released the order to fulfillment.`
        );

        // 4. Notify Vendor
        await createNotification(
          vendorId,
          'New Assigned Fulfillable Order',
          `You have been assigned order #${orderId} to package & ship. Check vendor console!`
        );
      }

      // 5. Create Audit Log
      await createAuditLog({
        action: 'Manual Payment Verified',
        adminId: 'admin',
        adminEmail: 'admin@ecommerce.com',
        orderId: orderId,
        reason: `Approved transaction UTR: ${updatedOrder?.utr || 'N/A'}. Assigned to Vendor: ${vendorId}`
      });

      // 6. Refresh lists
      await fetchPendingOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      throw new Error('Approval flow encountered a database error.');
    }
  };

  const handleReject = async (orderId: string, reason: string) => {
    try {
      // 1. Update order in Firestore
      await updateOrder(orderId, {
        paymentStatus: 'screenshot_rejected' as const,
        rejectionReason: reason
      });

      const pendingAll = await getAllOrders();
      const updatedOrder = pendingAll.find(o => o.orderId === orderId);

      // 2. Notify User
      if (updatedOrder) {
        await createNotification(
          updatedOrder.customerId,
          'Payment Proof Rejected',
          `We could not verify your payment proof for order #${orderId}. Reason: ${reason}. Please submit a valid screenshot.`
        );
      }

      // 3. Create Audit Log
      await createAuditLog({
        action: 'Manual Payment Rejected',
        adminId: 'admin',
        adminEmail: 'admin@ecommerce.com',
        orderId: orderId,
        reason: `Rejection reason: ${reason}`
      });

      // 4. Refresh lists
      await fetchPendingOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      throw new Error('Rejection flow encountered a database error.');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.utr && o.utr.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#1E40AF]" />
            <span>Manual Payment Verification Portal</span>
          </h2>
          <p className="text-xs text-slate-500">Audit manual banking transfers, check UTR codes, and approve orders.</p>
        </div>
        <button 
          onClick={fetchPendingOrders}
          className="self-start px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Awaiting Audit</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{orders.length} orders</p>
          </div>
        </div>
      </div>

      {/* Search Input bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl max-w-md shadow-sm">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          className="w-full text-xs outline-none bg-transparent"
          placeholder="Search pending orders by ID, UTR or Customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
          Retrieving waiting manual payment transactions...
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 rounded-2xl text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 text-center rounded-2xl space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-xs">Clear Audit Queue</p>
          <p className="text-[11px] text-slate-400">All submitted payment screenshots have been processed! No transactions waiting.</p>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Customer ID</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 text-right">Total Amount</th>
                <th className="p-3.5">Submitted UTR</th>
                <th className="p-3.5">Submitted On</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                    #{order.orderId}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                    {order.customerId}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                    {order.paymentMethod.toUpperCase()}
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-50">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                      {order.utr || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">
                    {formatDate(order.paymentDateTime)}
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3.5 py-1.5 bg-[#1E40AF] hover:bg-blue-750 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Audit & Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Render the Auditing Dialog */}
      {selectedOrder && (
        <VerificationDialog
          order={selectedOrder}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
