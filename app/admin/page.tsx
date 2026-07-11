'use client';

import React, { useState, useEffect } from 'react';
import { getAuditLogs, getAllOrders, AuditLog, Order } from '../../src/lib/firestore';
import { Shield, CreditCard, MessageSquare, ShieldCheck, ClipboardList, TrendingUp, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDate, formatCurrency } from '../../src/lib/utils';

export default function AdminDashboardPage({ navigateTo }: { navigateTo?: (view: string, path: string) => void }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedLogs = await getAuditLogs();
      const fetchedOrders = await getAllOrders();
      setLogs(fetchedLogs);
      setOrders(fetchedOrders);
    } catch (err) {
      setError('Failed to fetch administrator console metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSales = orders
    .filter(o => o.paymentStatus === 'confirmed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingVerificationCount = orders.filter(o => o.paymentStatus === 'waiting_verification').length;

  const localNavigate = (view: string, path: string) => {
    if (navigateTo) {
      navigateTo(view, path);
    } else {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 animate-pulse font-sans">
        Loading admin auditing dashboards...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#1E40AF]" />
            <span>Administrative Command Center</span>
          </h2>
          <p className="text-xs text-slate-500">Global ledger audits, security logging, payment gateway configuration, and manual clearing queues.</p>
        </div>
        <button 
          onClick={loadData}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Live</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Confirmed Sales</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(totalSales)}</p>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Awaiting Manual Verification</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{pendingVerificationCount} orders</p>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Volume Processed</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{orders.length} orders</p>
          </div>
        </div>
      </div>

      {/* Control center shortcuts */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Operation Shortcuts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => localNavigate('admin-payment-settings', '/admin/settings/payment')}
            className="p-5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition shadow-sm cursor-pointer group space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5 group-hover:scale-110 transition" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-50">Payment Settings</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage bank transfer details, UPI IDs and QR images.</p>
            </div>
          </button>

          <button
            onClick={() => localNavigate('admin-whatsapp-settings', '/admin/settings/whatsapp')}
            className="p-5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition shadow-sm cursor-pointer group space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 group-hover:scale-110 transition" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-50">WhatsApp Configuration</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Adjust business support hour limits and greetings.</p>
            </div>
          </button>

          <button
            onClick={() => localNavigate('admin-verification', '/admin/verification')}
            className="p-5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition shadow-sm cursor-pointer group space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center relative">
              <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition" />
              {pendingVerificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center">
                  {pendingVerificationCount}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-50">Payment Verification</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Audit transaction UTRs and release orders.</p>
            </div>
          </button>
        </div>
      </div>

      {/* Audit Logs streams */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-slate-400" />
            <span>Live Security Audit Trail</span>
          </h3>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono px-2 py-0.5 rounded">
            Admin writes strictly logged
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            No administrative security records registered.
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-[300px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-3 text-[11px] hover:bg-slate-50/50 dark:hover:bg-slate-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {log.action}
                    </p>
                    <p className="text-slate-500">
                      By: {log.adminEmail} • Order: {log.orderId !== 'N/A' ? `#${log.orderId}` : 'None'}
                    </p>
                    {log.reason && (
                      <p className="text-slate-400 italic text-[10px]">
                        Reason/Notes: {log.reason}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
