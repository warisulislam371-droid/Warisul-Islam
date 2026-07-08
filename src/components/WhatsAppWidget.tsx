import React, { useState, useEffect } from 'react';
import { dbLocal } from '../db';
import { User, Product, Order, WhatsAppSettings } from '../types';
import { MessageCircle, HelpCircle } from 'lucide-react';

interface WhatsAppWidgetProps {
  currentUser: User | null;
  currentView: string;
}

export default function WhatsAppWidget({ currentUser, currentView }: WhatsAppWidgetProps) {
  const [settings, setSettings] = useState<WhatsAppSettings>(dbLocal.getWhatsAppSettings());
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<string>('cart');

  // Load settings and listen to updates
  useEffect(() => {
    const handleDbUpdate = () => {
      setSettings(dbLocal.getWhatsAppSettings());
    };

    window.addEventListener('healnex_db_update', handleDbUpdate);
    return () => window.removeEventListener('healnex_db_update', handleDbUpdate);
  }, []);

  // Listen to CustomerPanel contexts
  useEffect(() => {
    const handleActiveProduct = (e: any) => setActiveProduct(e.detail);
    const handleCheckoutStep = (e: any) => setCheckoutStep(e.detail);
    const handleActiveOrder = (e: any) => setActiveOrder(e.detail);

    window.addEventListener('healnex_active_product', handleActiveProduct);
    window.addEventListener('healnex_checkout_step', handleCheckoutStep);
    window.addEventListener('healnex_active_order', handleActiveOrder);

    return () => {
      window.removeEventListener('healnex_active_product', handleActiveProduct);
      window.removeEventListener('healnex_checkout_step', handleCheckoutStep);
      window.removeEventListener('healnex_active_order', handleActiveOrder);
    };
  }, []);

  if (!settings.enabled) return null;

  // Identify current screen context
  let currentScreen: string = 'Home';
  if (currentView === 'marketplace') {
    currentScreen = activeProduct ? 'ProductDetails' : 'Home';
  } else if (currentView === 'cart') {
    currentScreen = checkoutStep === 'checkout' ? 'Checkout' : 'Cart';
  } else if (currentView === 'orders') {
    currentScreen = 'Orders';
  } else if (currentView === 'tickets') {
    currentScreen = 'HelpSupport';
  } else if (currentView === 'blogs') {
    currentScreen = 'HelpSupport'; // Match Help Support screen configuration
  } else if (currentView === 'profile') {
    currentScreen = 'Profile';
  }

  // Check if button should be shown on this screen
  const shouldShowOnScreen = settings.showOnAllScreens || settings.selectedScreens.includes(currentScreen);
  if (!shouldShowOnScreen) return null;

  // If set to contact page only, don't show floating button
  if (settings.position === 'contact_page') {
    // Only float if specified as floating
    return null;
  }

  // Generate pre-filled link
  const getUrl = () => {
    let msg = settings.defaultMessage;
    msg = msg.replace(/{CustomerName}/g, currentUser?.name || 'Customer');
    msg = msg.replace(/{OrderNumber}/g, activeOrder?.id || 'N/A');
    msg = msg.replace(/{ProductName}/g, activeProduct?.name || 'N/A');

    const phoneDigits = settings.phoneNumber.replace(/\D/g, '');
    const waDigits = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
    const baseUrl = settings.businessLink && !settings.businessLink.endsWith('/9103500592') ? settings.businessLink : `https://wa.me/${waDigits}`;
    const url = new URL(baseUrl);
    url.searchParams.set('text', msg);
    return url.toString();
  };

  const handleChatClick = () => {
    // Log click event for Admin Analytics
    dbLocal.logWhatsAppClick({
      customerId: currentUser?.id || 'guest',
      customerName: currentUser?.name || 'Anonymous Guest',
      contextPage: currentScreen,
      productName: activeProduct?.name || 'General Inquiry',
      orderNumber: activeOrder?.id || 'None'
    });

    // Open WhatsApp
    window.open(getUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[45] group animate-bounce-slow">
      {/* Tooltip text */}
      <div className="absolute right-0 bottom-16 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none whitespace-nowrap flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        {settings.buttonText}
      </div>

      <button
        onClick={handleChatClick}
        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer relative"
        title={settings.buttonText}
      >
        <MessageCircle className="w-7 h-7 stroke-[2.2]" />
        
        {/* Subtle Pulse Rings */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-20 animate-ping pointer-events-none"></span>
      </button>
    </div>
  );
}
