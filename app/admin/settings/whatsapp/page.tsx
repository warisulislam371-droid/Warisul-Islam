'use client';

import React, { useState, useEffect } from 'react';
import { getWhatsAppSettings, saveWhatsAppSettings, createAuditLog, WhatsAppSettings } from '../../../../src/lib/firestore';
import { MessageSquare, Save, CheckCircle, AlertTriangle, Clock, HelpCircle, PhoneCall, ExternalLink } from 'lucide-react';

export default function AdminWhatsAppSettingsPage() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getWhatsAppSettings();
        setSettings(data);
      } catch (err) {
        setError('Failed to load WhatsApp support settings.');
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
      await saveWhatsAppSettings(settings);
      
      // Log audit
      await createAuditLog({
        action: 'Updated WhatsApp Support Config',
        adminId: 'admin',
        adminEmail: 'admin@ecommerce.com',
        orderId: 'N/A',
        reason: 'Modified phone number, pre-filled support message, or active service hours.'
      });

      setSuccess('WhatsApp widget configurations saved successfully to Firestore!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings. Check write permissions.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof WhatsAppSettings, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 animate-pulse font-sans">
        Loading live support parameters...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span>WhatsApp Live Support Settings</span>
          </h2>
          <p className="text-xs text-slate-500">Enable and configure customer-facing support bubbles with dynamic pre-populated queries.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {settings && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-50">Floating Widget Status</h4>
                <p className="text-[11px] text-slate-400">Toggles the display of the bottom-right live chat widget on the marketplace.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Widget Enabled</span>
                <input
                  type="checkbox"
                  className="w-8 h-4 rounded-full bg-slate-200 checked:bg-emerald-600 transition outline-none cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                  checked={settings.buttonEnabled}
                  onChange={(e) => updateField('buttonEnabled', e.target.checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                  <span>WhatsApp Phone Number (with Country Code)</span>
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-mono"
                  placeholder="+919103500592"
                  value={settings.number}
                  onChange={(e) => updateField('number', e.target.value)}
                  required
                />
                <p className="text-[10px] text-slate-400">Do not include symbols, e.g. +919103500592 for India.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Business Working Hours</span>
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  placeholder="9:00 AM - 6:00 PM IST"
                  value={settings.businessHours}
                  onChange={(e) => updateField('businessHours', e.target.value)}
                  required
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Default Custom Support Message (Template)</span>
                </label>
                <textarea
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-emerald-500 outline-none text-xs h-20 resize-none"
                  placeholder="Hello Support! I am {CustomerName}, I am contacting you for help regarding my order..."
                  value={settings.supportMessage}
                  onChange={(e) => updateField('supportMessage', e.target.value)}
                  required
                />
                <p className="text-[10px] text-slate-400">Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">{`{CustomerName}`}</code> inside the template to automatically substitute the logged-in customer's name.</p>
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Custom Avatar Icon URL</label>
                <input
                  type="url"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={settings.iconUrl}
                  onChange={(e) => updateField('iconUrl', e.target.value)}
                />
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
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configurations'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
