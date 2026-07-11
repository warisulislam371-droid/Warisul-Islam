import React from 'react';
import { ShieldCheck, Store, BadgeDollarSign, HeadphonesIcon, Truck, ExternalLink } from 'lucide-react';
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
      title: 'Secure Shopping',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      items: [
        'SSL encrypted website.',
        'Secure checkout.',
        'Customer data protection.'
      ]
    },
    {
      title: 'Trusted Vendors',
      icon: <Store className="w-6 h-6 text-teal-600" />,
      items: [
        'Vendor verification process.',
        'Business information review.',
        'Marketplace quality standards.'
      ]
    },
    {
      title: 'Transparent Pricing',
      icon: <BadgeDollarSign className="w-6 h-6 text-blue-600" />,
      items: [
        'Clear product pricing.',
        'No hidden marketplace charges.',
        'Product information provided by vendors.'
      ]
    },
    {
      title: 'Customer Support',
      icon: <HeadphonesIcon className="w-6 h-6 text-amber-600" />,
      items: [
        'Email support.',
        'Phone support.',
        'Fast response to customer queries.'
      ]
    },
    {
      title: 'Easy Order Tracking',
      icon: <Truck className="w-6 h-6 text-purple-600" />,
      items: [
        'Track orders from your dashboard.',
        'Delivery status updates.',
        'Order history.'
      ]
    }
  ];

  return (
    <section className={`py-12 px-6 sm:px-10 rounded-3xl border transition-colors mt-12 ${
      isDarkMode 
        ? 'bg-slate-900/90 border-slate-800 text-slate-100' 
        : 'bg-gradient-to-b from-slate-50/80 to-white border-slate-200 text-slate-800 shadow-sm'
    }`}>
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Marketplace Trust Shield
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
          Why Shop with MedBazar Helnex?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          A secure marketplace connecting customers with trusted medical equipment vendors.
        </p>
      </div>

      {/* Trust Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border transition hover:-translate-y-0.5 flex flex-col justify-between ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700/80 hover:border-teal-500/50'
                : 'bg-white border-slate-200 hover:border-teal-600 hover:shadow-md'
            }`}
          >
            <div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit mb-4">
                {card.icon}
              </div>
              <h3 className="font-bold text-base mb-3 text-slate-900 dark:text-white">
                {card.title}
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {card.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* 6th Card / CTA to dedicated Trust & Safety Page */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between bg-gradient-to-br from-teal-800 to-teal-950 text-white border-teal-700 shadow-md`}>
          <div>
            <div className="p-3 rounded-xl bg-teal-700/50 w-fit mb-4">
              <ShieldCheck className="w-6 h-6 text-teal-300" />
            </div>
            <h3 className="font-bold text-base mb-2">Our Full Security Framework</h3>
            <p className="text-xs text-teal-100/90 leading-relaxed mb-4">
              Explore our comprehensive Trust & Safety portal, including clinical standards, encryption details, and verified reviews.
            </p>
          </div>
          <button
            onClick={onNavigateToTrustPage}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-teal-900 font-bold text-xs hover:bg-teal-50 transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            View Trust & Safety Page
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Policies Footer Bar */}
      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
        <span className="text-slate-400">Policies:</span>
        <button
          onClick={() => onOpenPolicy('privacy')}
          className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 underline transition"
        >
          Privacy Policy
        </button>
        <button
          onClick={() => onOpenPolicy('terms')}
          className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 underline transition"
        >
          Terms & Conditions
        </button>
        <button
          onClick={() => onOpenPolicy('refund')}
          className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 underline transition"
        >
          Refund Policy
        </button>
        <button
          onClick={() => onOpenPolicy('shipping')}
          className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 underline transition"
        >
          Shipping Policy
        </button>
      </div>
    </section>
  );
}
