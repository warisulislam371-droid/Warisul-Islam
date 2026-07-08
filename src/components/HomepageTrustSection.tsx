import React from 'react';
import { ShieldCheck, Store, Lock, Truck, FileText, Headphones, ShieldAlert, ExternalLink } from 'lucide-react';
import { PolicyType } from './PolicyModal';

interface HomepageTrustSectionProps {
  onOpenPolicy: (policy: PolicyType) => void;
  onNavigateToTrustPage: () => void;
  isDarkMode?: boolean;
}

export default function HomepageTrustSection({
  onOpenPolicy,
  onNavigateToTrustPage,
  isDarkMode = false
}: HomepageTrustSectionProps) {
  const cards = [
    {
      title: 'Verified Vendors',
      icon: <Store className="w-6 h-6 text-blue-600" />,
      items: [
        'Rigorous vendor vetting.',
        'Licensed pharmacy reviews.',
        'Manufacturer certification checks.'
      ]
    },
    {
      title: 'Secure Payments',
      icon: <Lock className="w-6 h-6 text-emerald-600" />,
      items: [
        'End-to-end payment encryption.',
        'Verified manual bank transfers.',
        'Safe multi-channel processing.'
      ]
    },
    {
      title: 'Express Delivery',
      icon: <Truck className="w-6 h-6 text-indigo-600" />,
      items: [
        'Expedited shipping routes.',
        'Real-time transit updates.',
        'Cold-chain transport available.'
      ]
    },
    {
      title: 'GST Invoice',
      icon: <FileText className="w-6 h-6 text-purple-600" />,
      items: [
        'Full input tax credit support.',
        'Compliant tax billing summaries.',
        'Instant digital invoice generation.'
      ]
    },
    {
      title: 'Dedicated Support',
      icon: <Headphones className="w-6 h-6 text-amber-500" />,
      items: [
        '24/7 technical hotline.',
        'Clinically certified advisors.',
        'Fast dispute resolution desk.'
      ]
    },
    {
      title: 'Buyer Protection',
      icon: <ShieldAlert className="w-6 h-6 text-rose-500" />,
      items: [
        'Escrowed payment holds.',
        'Verified return & refund policy.',
        'Calibration quality guarantees.'
      ]
    }
  ];

  return (
    <section className={`py-12 px-6 sm:px-10 rounded-[16px] border transition-all duration-300 mt-12 ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-150 text-slate-850 shadow-xs hover:shadow-md'
    }`}>
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          HealNex Premium Trust Shield
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white">
          Why Shop with HealNex Medi Bazar?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          A secure B2B & B2C clinical marketplace connecting doctors and purchasers with verified healthcare manufacturers.
        </p>
      </div>

      {/* Trust Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-[16px] border transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${
              isDarkMode
                ? 'bg-slate-850 border-slate-800 hover:border-blue-500'
                : 'bg-white border-slate-150 hover:border-blue-200 hover:shadow-lg'
            }`}
          >
            <div>
              <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-slate-800 w-fit mb-4 border border-slate-100 dark:border-slate-750">
                {card.icon}
              </div>
              <h3 className="font-bold text-base mb-3 text-slate-900 dark:text-white font-sans">
                {card.title}
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                {card.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA to Dedicated Trust and Safety Page */}
      <div className="mt-10 max-w-xl mx-auto text-center">
        <button
          onClick={onNavigateToTrustPage}
          className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          View Trust & Safety Portal
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Policies Footer Bar */}
      <div className="mt-10 pt-6 border-t border-slate-150 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
        <span>Framework Policies:</span>
        <button
          onClick={() => onOpenPolicy('privacy')}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline transition cursor-pointer"
        >
          Privacy Policy
        </button>
        <button
          onClick={() => onOpenPolicy('terms')}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline transition cursor-pointer"
        >
          Terms & Conditions
        </button>
        <button
          onClick={() => onOpenPolicy('shipping')}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline transition cursor-pointer"
        >
          Shipping Policy
        </button>
        <button
          onClick={() => onOpenPolicy('refund')}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline transition cursor-pointer"
        >
          Refund & Return Policy
        </button>
      </div>
    </section>
  );
}
