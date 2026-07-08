import React from 'react';
import { X, Shield, FileText, RefreshCw, Truck, Info, PhoneCall } from 'lucide-react';

export type PolicyType = 'privacy' | 'terms' | 'refund' | 'shipping' | 'about' | 'contact' | null;

interface PolicyModalProps {
  policy: PolicyType;
  onClose: () => void;
  isDarkMode?: boolean;
}

export default function PolicyModal({ policy, onClose, isDarkMode = false }: PolicyModalProps) {
  if (!policy) return null;

  const contentMap = {
    privacy: {
      title: 'Privacy Policy',
      icon: <Shield className="w-6 h-6 text-teal-600" />,
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            At MedBazar Helnex (operated by Al Salam Medical Equipment Centre), safeguarding customer and vendor data is paramount to our operational ethics.
          </p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">1. Information Collection</h4>
          <p>We collect essential commercial data required for processing hospital consignments, B2B procurement quotations, and clinical equipment delivery logistics, including corporate email addresses, GSTINs, delivery addresses, and authorized contact numbers.</p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">2. Data Encryption & Storage</h4>
          <p>All sensitive information transmitted across MedBazar Helnex is secured using standard SSL encryption protocols. Customer accounts and credentials are encrypted and strictly protected against unauthorized access.</p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">3. Third-Party Sharing</h4>
          <p>We do not sell personal data. Authorized order shipping parameters are shared strictly with verified medical vendors and clinical logistics carriers solely for order fulfillment purposes.</p>
        </div>
      )
    },
    terms: {
      title: 'Terms & Conditions',
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Welcome to MedBazar Helnex. By browsing or purchasing medical equipment through our marketplace, you agree to comply with the commercial standards outlined below.
          </p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">1. Marketplace Structure</h4>
          <p>MedBazar Helnex operates as a specialized multi-vendor medical equipment marketplace connecting clinical procurement teams with independent medical suppliers and manufacturers.</p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">2. Vendor Responsibilities</h4>
          <p>Vendors listing products on our marketplace undergo business information review and are required to provide accurate technical parameters, comply with applicable medical device guidelines, and maintain transparent pricing.</p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">3. Commercial Operations</h4>
          <p>All pricing displayed on MedBazar Helnex is transparent with clear HSN codes and GST rates indicated during checkout. No hidden marketplace fees are added to customer invoices.</p>
        </div>
      )
    },
    refund: {
      title: 'Refund & Return Policy',
      icon: <RefreshCw className="w-6 h-6 text-emerald-600" />,
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Due to the sensitive and sterilized nature of biomedical and diagnostic equipment, our refund and return framework is structured around strict clinical quality assurance.
          </p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">1. Damage or Defect Reporting</h4>
          <p>Consignments damaged in transit or defective upon delivery must be reported to support within 48 hours of receipt along with unboxing photographic or video documentation.</p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">2. Vendor Inspection Resolution</h4>
          <p>Verified returns undergo technical assessment by the respective vendor manufacturer. Approved warranty replacements or verified refunds are initiated within 7 to 10 business days.</p>
        </div>
      )
    },
    shipping: {
      title: 'Shipping & Delivery Policy',
      icon: <Truck className="w-6 h-6 text-amber-600" />,
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            MedBazar Helnex coordinates reliable nationwide dispatch across hospitals, clinics, and diagnostic labs.
          </p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">1. Dispatch Timelines</h4>
          <p>Standard medical equipment stock items are typically dispatched by vendors within 24 to 72 hours of payment clearance or purchase order approval.</p>
          <h4 className="font-bold text-slate-800 dark:text-white mt-4">2. Live Order Tracking</h4>
          <p>Customers can track shipment status, courier docket numbers, and delivery milestone updates directly from their customer account dashboard under the Orders section.</p>
        </div>
      )
    },
    about: {
      title: 'About MedBazar Helnex',
      icon: <Info className="w-6 h-6 text-teal-600" />,
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            MedBazar Helnex is a premier multi-vendor medical equipment marketplace operated by Al Salam Medical Equipment Centre.
          </p>
          <p>
            Our objective is to streamline B2B healthcare procurement by connecting hospitals, clinics, and medical institutions directly with authorized manufacturers and distributors across India.
          </p>
          <div className="bg-teal-50 dark:bg-teal-950/50 p-4 rounded-xl border border-teal-200 dark:border-teal-800/80 mt-4">
            <h5 className="font-bold text-teal-800 dark:text-teal-200 text-xs uppercase tracking-wider mb-1">Operator Details</h5>
            <p className="text-xs text-slate-600 dark:text-slate-300"><strong>Operating Entity:</strong> Al Salam Medical Equipment Centre</p>
            <p className="text-xs text-slate-600 dark:text-slate-300"><strong>Headquarters:</strong> Srinagar / New Delhi, India</p>
          </div>
        </div>
      )
    },
    contact: {
      title: 'Contact Support',
      icon: <PhoneCall className="w-6 h-6 text-green-600" />,
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Our clinical support desk is available to assist with inquiries, RFQ negotiations, and consignment tracking.
          </p>
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">Company Name</span>
              <span className="font-bold text-slate-800 dark:text-white">Al Salam Medical Equipment Centre</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">Email Support</span>
              <span className="font-mono text-teal-600 dark:text-teal-400">alsalammedicalequipmentscenter@gmail.com</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">Phone / WhatsApp</span>
              <span className="font-mono text-slate-800 dark:text-white">+91 9103500592</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">Support Hours</span>
              <span className="text-slate-700 dark:text-slate-300">Monday - Saturday | 9:00 AM - 7:00 PM IST</span>
            </div>
          </div>
        </div>
      )
    }
  };

  const current = contentMap[policy];
  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDarkMode ? 'bg-slate-800/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            {current.icon}
            <h3 className="font-bold text-lg">{current.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {current.content}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex justify-end ${
          isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <button
            onClick={onClose}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
