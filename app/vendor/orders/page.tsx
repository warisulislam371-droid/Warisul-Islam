'use client';

import React, { useState, useEffect } from 'react';
import { getOrdersByVendor, updateOrder, createNotification, Order } from '../../../src/lib/firestore';
import { Package, Truck, CheckCircle, AlertCircle, ShoppingBag, RefreshCw } from 'lucide-react';
import { formatDate, formatCurrency } from '../../../src/lib/utils';

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('vendor-medilink');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVendorOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrdersByVendor(selectedVendor);
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned vendor orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorOrders();
  }, [selectedVendor]);

  const handleStatusChange = async (orderId: string, newStatus: Order['orderStatus']) => {
    setUpdatingId(orderId);
    try {
      await updateOrder(orderId, { orderStatus: newStatus });
      
      // Update local state list
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, orderStatus: newStatus } : o));

      // Fetch customer details from current order
      const ordObj = orders.find(o => o.orderId === orderId);
      if (ordObj) {
        // Trigger customer notification
        let title = 'Order Status Updated!';
        let message = `Your order #${orderId} has been updated to: ${newStatus.toUpperCase().replace('_', ' ')}.`;
        
        if (newStatus === 'shipped') {
          title = 'Order Dispatched!';
          message = `Great news! Your order #${orderId} was shipped by the supplier. Expect arrival soon.`;
        } else if (newStatus === 'delivered') {
          title = 'Order Delivered!';
          message = `Congratulations! Your order #${orderId} has been marked as Delivered. Thank you for shopping!`;
        }

        await createNotification(ordObj.customerId, title, message);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status in database.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Vendor Fulfillment Console</span>
          </h2>
          <p className="text-xs text-slate-500">
            Suppliers manage assigned orders. Orders are gated strictly: only visible after payment is verified by administrative audit.
          </p>
        </div>
        
        {/* Mock Vendor Selector for testing preview */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">Active Vendor:</span>
          <select 
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
          >
            <option value="vendor-medilink">MediLink Systems Private Ltd</option>
            <option value="vendor-hightech">HighTech Diagnostics Ltd</option>
            <option value="vendor-1">Healnex Supplier Ltd</option>
          </select>
        </div>
      </div>

      {/* Main vendor orders listing */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading vendor dispatch manifest...
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 rounded-2xl text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 text-center rounded-2xl space-y-2">
          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-xs">No Fulfillable Orders</p>
          <p className="text-[11px] text-slate-400">There are no confirmed paid orders assigned to you currently.</p>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Fulfillment Items</th>
                <th className="p-3.5 text-right">Total Amount</th>
                <th className="p-3.5">Verification UTR</th>
                <th className="p-3.5">Ordered On</th>
                <th className="p-3.5 text-center">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {orders.map((order) => (
                <tr key={order.orderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                    #{order.orderId}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    {order.customerName || 'Customer'}
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                    {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-50">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-400 font-bold">
                      {order.utr || 'VERIFIED'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <select
                        className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900"
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value as Order['orderStatus'])}
                        disabled={updatingId === order.orderId}
                      >
                        <option value="pending_payment">Pending Payment</option>
                        <option value="processing">Processing (Pack)</option>
                        <option value="shipped">Shipped (Transit)</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {updatingId === order.orderId && (
                        <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
