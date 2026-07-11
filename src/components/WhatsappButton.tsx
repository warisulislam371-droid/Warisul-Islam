import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, Send } from 'lucide-react';
import { getWhatsAppSettings, WhatsAppSettings } from '../lib/firestore';

interface WhatsappButtonProps {
  customerName?: string;
}

export default function WhatsappButton({ customerName = 'Customer' }: WhatsappButtonProps) {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [userMsg, setUserMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      const data = await getWhatsAppSettings();
      setSettings(data);
    }
    loadSettings();
  }, []);

  if (!settings || !settings.buttonEnabled) return null;

  const handleOpenChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = () => {
    const defaultMsg = settings.supportMessage || 'Hello Support, I need help with my order.';
    const finalMsg = defaultMsg.replace('{CustomerName}', customerName);
    const textToSend = userMsg.trim() ? `${userMsg} (${finalMsg})` : finalMsg;
    
    // Construct WA Link
    let cleanNumber = settings.number.replace(/[^0-9]/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber; // Default to India prefix if 10-digit
    }
    
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(textToSend)}`;
    window.open(waUrl, '_blank');
    setIsOpen(false);
    setUserMsg('');
  };

  return (
    <div id="whatsapp-support-widget" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      {/* Mini Info Popup Panel */}
      {isOpen && (
        <div className="w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-600 p-4 text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {settings.iconUrl ? (
                <img src={settings.iconUrl} alt="WhatsApp" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <MessageCircle className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm">WhatsApp Live Support</h4>
              <p className="text-[10px] opacity-90 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {settings.businessHours || 'Business Hours'}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-3 bg-slate-50 dark:bg-slate-950/40">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm text-xs text-slate-700 dark:text-slate-300">
              <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-1">Support Message Preview:</p>
              <p className="italic">"{settings.supportMessage.replace('{CustomerName}', customerName)}"</p>
            </div>

            <textarea
              className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-20"
              placeholder="Type your message here..."
              value={userMsg}
              onChange={(e) => setUserMsg(e.target.value)}
            />

            <button
              onClick={handleSend}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Start WhatsApp Chat</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Main WhatsApp Button */}
      <button
        id="whatsapp-floating-btn"
        onClick={handleOpenChat}
        className={`w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer ${
          isOpen ? 'ring-4 ring-emerald-600/30 rotate-12' : ''
        }`}
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 fill-white stroke-none" />
      </button>
    </div>
  );
}
