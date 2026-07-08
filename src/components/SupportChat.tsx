import React, { useState } from 'react';
import { dbLocal } from '../db';
import { SupportTicket, User } from '../types';
import { LifeBuoy, Send, MessageSquare, ShieldAlert, PhoneCall, CheckCircle } from 'lucide-react';

interface SupportChatProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function SupportChat({ currentUser, onNavigate, addToast }: SupportChatProps) {
  const [activeTickets, setActiveTickets] = useState<SupportTicket[]>(() => {
    if (!currentUser) return [];
    return dbLocal.getTickets().filter(t => t.userId === currentUser.id);
  });

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCat, setTicketCat] = useState<'Customer Support' | 'Vendor Support' | 'Technical Support'>('Customer Support');
  const [ticketDesc, setTicketDesc] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMsg, setReplyMsg] = useState('');

  const handleOpenTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      addToast('Please log in or switch sandbox profiles to open a secure ticket.', 'error');
      return;
    }

    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      category: ticketCat,
      subject: ticketSubject,
      description: ticketDesc,
      status: 'Open',
      createdAt: new Date().toISOString(),
      replies: [
        {
          id: `rep-${Date.now()}`,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          message: ticketDesc,
          time: new Date().toISOString(),
          isStaff: false
        }
      ]
    };

    const tickets = dbLocal.getTickets();
    tickets.unshift(newTicket);
    dbLocal.saveTickets(tickets);

    // Alert admin
    dbLocal.addNotification(
      'admin',
      `New Ticket: ${newTicket.subject}`,
      `User ${currentUser.name} opened a ticket under ${newTicket.category}.`,
      'rfq_created' // standard log category
    );

    addToast('Your clinical support request ticket has been opened successfully. Help desk administrators will reply within 4 hours.', 'success');
    setTicketSubject('');
    setTicketDesc('');
    
    // Refresh tickets list
    const updatedTickets = dbLocal.getTickets().filter(t => t.userId === currentUser.id);
    setActiveTickets(updatedTickets);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMsg.trim() || !currentUser) return;

    const updated = dbLocal.getTickets().map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'Open' as const, // re-opens if administrator closed but user replies
          replies: [
            ...t.replies,
            {
              id: `rep-${Date.now()}`,
              senderName: currentUser.name,
              senderRole: currentUser.role,
              message: replyMsg,
              time: new Date().toISOString(),
              isStaff: false
            }
          ]
        };
      }
      return t;
    });

    dbLocal.saveTickets(updated);
    setReplyMsg('');
    const cur = updated.find(t => t.id === selectedTicket.id) || null;
    setSelectedTicket(cur);
    
    // Refresh lists
    setActiveTickets(updated.filter(t => t.userId === currentUser.id));
  };

  // WhatsApp Trigger url builder
  const configuredDigits = dbLocal.getWhatsAppSettings().phoneNumber.replace(/\D/g, '') || '9103500592';
  const waDigits = configuredDigits.length === 10 ? `91${configuredDigits}` : configuredDigits;
  const prefilledMessage = encodeURIComponent('Hello HealNex Medi Bazar Team, I need assistance.');
  const whatsappUrl = `https://wa.me/${waDigits}?text=${prefilledMessage}`;

  return (
    <div className="w-full font-sans">
      
      {/* Floating WhatsApp support launcher */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-28 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl border border-emerald-400/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
        title="Launch Instant WhatsApp Support"
      >
        <PhoneCall className="w-5 h-5 text-white animate-bounce" />
        <span className="text-xs font-bold font-display max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 leading-none">
          Live WhatsApp Support
        </span>
      </a>

      {/* Header details */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 font-display flex items-center gap-2">
          <LifeBuoy className="w-6.5 h-6.5 text-teal-700" />
          HealNex Clinical Helpdesk
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Open a clinical support ticket to query installation services, custom AMC rates, or tracking logistics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs font-semibold">
        
        {/* Ticket Generation Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 h-fit">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-teal-700" />
            File New Issue
          </h3>

          <form onSubmit={handleOpenTicket} className="space-y-4 font-medium">
            <div>
              <label className="text-slate-500 block mb-1">Inquiry Subject *</label>
              <input
                type="text"
                required
                placeholder="e.g. Broken packaging / Installation request"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Inquiry Category</label>
              <select
                value={ticketCat}
                onChange={(e) => setTicketCat(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
              >
                <option>Customer Support</option>
                <option>Vendor Support</option>
                <option>Technical Support</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Details & Problem Description *</label>
              <textarea
                rows={4}
                required
                placeholder="Include serial numbers, order IDs, and precise symptoms for rapid diagnostic triaging..."
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
            >
              Open Ticket
            </button>
          </form>
        </div>

        {/* Existing tickets list & active thread */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          
          {/* List panel */}
          <div className="border-r border-slate-100 pr-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
              Your Issues History
            </h3>

            {activeTickets.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                <LifeBuoy className="w-8 h-8 mx-auto mb-1 opacity-30" />
                <p className="text-[11px]">No active support tickets opened yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {activeTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      selectedTicket?.id === t.id ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-mono text-[10px] text-slate-400">ID: {t.id}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        t.status === 'Closed' ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate mt-1">{t.subject}</h4>
                    <p className="text-[10px] text-slate-400 mt-2">Last Update: {new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active conversation thread panel */}
          <div className="flex flex-col justify-between">
            {selectedTicket ? (
              <>
                <div className="border-b border-slate-100 pb-2.5 mb-3 text-left">
                  <h4 className="text-xs font-bold text-slate-900">{selectedTicket.subject}</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mt-0.5">Category: {selectedTicket.category}</p>
                </div>

                {/* replies log scroll */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[220px]">
                  {selectedTicket.replies.map((rep, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl border ${
                      rep.isStaff ? 'bg-teal-50 border-teal-100 text-left' : 'bg-slate-50 border-slate-100 text-left'
                    }`}>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{rep.senderName} ({rep.senderRole})</p>
                      <p className="text-[11px] text-slate-700 mt-0.5 font-normal leading-relaxed">{rep.message}</p>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== 'Closed' && (
                  <form onSubmit={handleReplySubmit} className="pt-3 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type diagnostic reply..."
                      value={replyMsg}
                      onChange={(e) => setReplyMsg(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:border-teal-700"
                    />
                    <button
                      type="submit"
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold p-2 px-3.5 rounded-lg flex items-center justify-center shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
                <LifeBuoy className="w-10 h-10 text-slate-200 mb-2 animate-spin" style={{ animationDuration: '10s' }} />
                <p className="text-[11px]">Select a support ticket from your logs history to open the conversational clinical audit stream.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
