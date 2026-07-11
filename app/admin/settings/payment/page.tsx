'use client';

import React, { useState, useEffect } from 'react';
import { getPaymentSettings, savePaymentSettings, createAuditLog, PaymentSettings } from '../../../../src/lib/firestore';
import { CreditCard, QrCode, Shield, Save, CheckCircle, AlertTriangle, KeyRound, ArrowLeft } from 'lucide-react';

export default function AdminPaymentSettingsPage() {
  const [activeTab, setActiveTab] = useState<'upi' | 'razorpay' | 'bank'>('upi');
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getPaymentSettings();
        setSettings(data);
      } catch (err) {
        setError('Failed to load payment settings.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await savePaymentSettings(settings);
      
      // Log audit
      await createAuditLog({
        action: 'Updated Payment Settings',
        adminId: 'admin',
        adminEmail: 'admin@ecommerce.com',
        orderId: 'N/A',
        reason: `Configured payment settings for gateway: ${activeTab.toUpperCase()}`
      });

      setSuccess('Payment configurations saved successfully to Firestore!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings. Check your write permissions.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (category: 'upi' | 'razorpay' | 'bank', field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 animate-pulse font-sans">
        Loading admin payment ledger configuration...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#1E40AF]" />
            <span>Gateways & Payment settings</span>
          </h2>
          <p className="text-xs text-slate-500">Configure corporate bank transfers, manual UPI payment targets, and Razorpay API keys.</p>
        </div>
      </div>

      {/* Tabs list selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('upi')}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'upi'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Manual UPI Transfer</span>
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'bank'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Manual Bank Wire</span>
        </button>
        <button
          onClick={() => setActiveTab('razorpay')}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'razorpay'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Razorpay Integration</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {settings && activeTab === 'upi' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-50">Manual UPI Target</h4>
                <p className="text-[11px] text-slate-400">Direct wallet QR payments target account holder.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Status</span>
                <input
                  type="checkbox"
                  className="w-8 h-4 rounded-full bg-slate-200 checked:bg-blue-600 transition outline-none cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                  checked={settings.upi.enabled}
                  onChange={(e) => updateField('upi', 'enabled', e.target.checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">UPI ID / Address</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                  value={settings.upi.upiId}
                  onChange={(e) => updateField('upi', 'upiId', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Account Holder Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  value={settings.upi.accountHolder}
                  onChange={(e) => updateField('upi', 'accountHolder', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Static QR Code Data / URL</label>
                <input
                  type="url"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                  value={settings.upi.qrCodeUrl}
                  onChange={(e) => updateField('upi', 'qrCodeUrl', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {settings && activeTab === 'bank' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-50">Manual Bank Account Ledger</h4>
                <p className="text-[11px] text-slate-400">Direct NEFT / IMPS corporate bank clearing details.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Status</span>
                <input
                  type="checkbox"
                  className="w-8 h-4 rounded-full bg-slate-200 checked:bg-blue-600 transition outline-none cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                  checked={settings.bank.enabled}
                  onChange={(e) => updateField('bank', 'enabled', e.target.checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Bank Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  value={settings.bank.bankName}
                  onChange={(e) => updateField('bank', 'bankName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Account Holder Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  value={settings.bank.accountHolder}
                  onChange={(e) => updateField('bank', 'accountHolder', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Account Number</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                  value={settings.bank.accountNumber}
                  onChange={(e) => updateField('bank', 'accountNumber', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">IFSC Code</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                  value={settings.bank.ifsc}
                  onChange={(e) => updateField('bank', 'ifsc', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Branch Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  value={settings.bank.branch}
                  onChange={(e) => updateField('bank', 'branch', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Static Bank Transfer QR Code (URL)</label>
                <input
                  type="url"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                  value={settings.bank.qrCodeUrl}
                  onChange={(e) => updateField('bank', 'qrCodeUrl', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {settings && activeTab === 'razorpay' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-50">Razorpay API Gateway</h4>
                <p className="text-[11px] text-slate-400">Direct credit/debit card and automated UPI payment integration.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Status</span>
                <input
                  type="checkbox"
                  className="w-8 h-4 rounded-full bg-slate-200 checked:bg-blue-600 transition outline-none cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                  checked={settings.razorpay.enabled}
                  onChange={(e) => updateField('razorpay', 'enabled', e.target.checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Razorpay Key ID</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                  value={settings.razorpay.keyId}
                  onChange={(e) => updateField('razorpay', 'keyId', e.target.value)}
                  required={settings.razorpay.enabled}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Razorpay Key Secret</label>
                <input
                  type="password"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                  value={settings.razorpay.keySecret}
                  onChange={(e) => updateField('razorpay', 'keySecret', e.target.value)}
                  required={settings.razorpay.enabled}
                />
              </div>
              <div className="flex items-center gap-3 mt-4 col-span-2 bg-slate-50 dark:bg-slate-950/40 p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  id="test-mode-check"
                  className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  checked={settings.razorpay.testMode}
                  onChange={(e) => updateField('razorpay', 'testMode', e.target.checked)}
                />
                <label htmlFor="test-mode-check" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Enable Test Mode sandbox credentials (allows safe transactions without real capture)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action / Save feedback */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs animate-in fade-in duration-350">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#1E40AF] hover:bg-blue-750 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving to Firestore...' : 'Save Configurations'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
