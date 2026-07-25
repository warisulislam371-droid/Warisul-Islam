import React, { useState, useEffect } from 'react';
import { Product, User, PriceAlert, PriceAlertType, NotificationChannel } from '../types';
import { dbLocal } from '../db';
import {
  Bell,
  TrendingDown,
  Mail,
  Smartphone,
  CheckCircle,
  X,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Trash2,
  BellOff,
  PackageCheck
} from 'lucide-react';

interface PriceAlertModalProps {
  product: Product;
  currentUser: User | null;
  onClose: () => void;
  onAlertSaved?: (alert: PriceAlert) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
}

export default function PriceAlertModal({
  product,
  currentUser,
  onClose,
  onAlertSaved,
  addToast,
  isDarkMode = false
}: PriceAlertModalProps) {
  const currentPrice = product.salePrice || product.price;
  const isOutOfStock = (product.stockQuantity ?? 0) <= 0;

  // Search existing active alert
  const [existingAlert, setExistingAlert] = useState<PriceAlert | null>(null);

  // Form State
  const [alertType, setAlertType] = useState<PriceAlertType>(isOutOfStock ? 'both' : 'price_drop');
  const [targetPrice, setTargetPrice] = useState<number>(Math.round(currentPrice * 0.9)); // default 10% discount
  const [userEmail, setUserEmail] = useState<string>(currentUser?.email || 'hospital.procurement@healnex.com');
  const [enableEmail, setEnableEmail] = useState<boolean>(true);
  const [enablePush, setEnablePush] = useState<boolean>(true);

  useEffect(() => {
    const alerts = dbLocal.getPriceAlerts();
    const found = alerts.find(
      a => a.productId === product.id && (a.userEmail === (currentUser?.email || userEmail) || (currentUser?.id && a.userId === currentUser.id))
    );
    if (found) {
      setExistingAlert(found);
      setTargetPrice(found.targetPrice);
      setAlertType(found.alertType);
      setUserEmail(found.userEmail);
      setEnableEmail(found.enableEmail);
      setEnablePush(found.enablePush);
    }
  }, [product.id, currentUser]);

  const handleApplyPreset = (percentDiscount: number) => {
    const discounted = Math.round(currentPrice * (1 - percentDiscount / 100));
    setTargetPrice(discounted);
  };

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail || !userEmail.includes('@')) {
      addToast('Please enter a valid email address for notifications.', 'error');
      return;
    }

    if (!enableEmail && !enablePush) {
      addToast('Please enable at least one notification channel (Email or Push).', 'error');
      return;
    }

    if (alertType !== 'back_in_stock' && targetPrice >= currentPrice) {
      addToast(`Target price (₹${targetPrice}) must be lower than current price (₹${currentPrice}).`, 'error');
      return;
    }

    let channel: NotificationChannel = 'both';
    if (enableEmail && !enablePush) channel = 'email';
    if (!enableEmail && enablePush) channel = 'push';

    const newAlert: PriceAlert = {
      id: existingAlert?.id || `alert-${Date.now()}`,
      userId: currentUser?.id,
      userEmail: userEmail.trim(),
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0],
      vendorName: product.vendorName,
      currentPrice: currentPrice,
      targetPrice: alertType === 'back_in_stock' ? currentPrice : Number(targetPrice),
      alertType,
      channel,
      enableEmail,
      enablePush,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    dbLocal.addPriceAlert(newAlert);
    
    // Add a confirmation notification
    dbLocal.addNotification(
      'customer',
      `Price Alert Set for ${product.name}`,
      `Subscribed to ${alertType === 'back_in_stock' ? 'Back in Stock' : `Target Price ₹${targetPrice.toLocaleString('en-IN')}`} alert via ${channel.toUpperCase()}.`,
      'system'
    );

    addToast(`Price alert activated! We'll notify ${userEmail} when conditions are met.`, 'success');
    onAlertSaved?.(newAlert);
    onClose();
  };

  const handleDeleteAlert = () => {
    if (!existingAlert) return;
    dbLocal.removePriceAlert(existingAlert.id);
    addToast('Price alert removed.', 'info');
    onClose();
  };

  const handleSimulateTrigger = () => {
    // Instantly simulate a price drop / restock event
    const simulatedPrice = Math.max(100, targetPrice - 500);
    const updatedProd: Product = {
      ...product,
      salePrice: simulatedPrice,
      stockQuantity: Math.max(15, (product.stockQuantity || 0) + 10)
    };

    dbLocal.checkAndTriggerPriceAlerts(updatedProd, currentPrice, product.stockQuantity || 0);
    addToast(`⚡ Price alert test triggered! Simulated price drop to ₹${simulatedPrice.toLocaleString('en-IN')}. Check notifications.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in">
      <div className={`rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border transition-colors animate-scale-up ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 rounded-2xl text-teal-300 border border-teal-400/20">
              <Bell className="w-6 h-6 text-amber-300 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300">
                Procurement Intelligence
              </span>
              <h3 className="text-base font-bold text-white font-display">
                Set Price &amp; Stock Alert
              </h3>
            </div>
          </div>
        </div>

        {/* Product Brief Banner */}
        <div className={`p-4 border-b flex items-center gap-3.5 ${
          isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
            />
          )}
          <div className="min-w-0 flex-1 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white truncate">{product.name}</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Supplier: {product.vendorName}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="font-bold text-teal-700 dark:text-teal-400 font-mono text-sm">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {isOutOfStock ? (
                <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Out of Stock
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  In Stock ({product.stockQuantity} units)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alert Configuration Form */}
        <form onSubmit={handleSaveAlert} className="p-6 space-y-5 text-xs font-semibold">
          
          {/* Subscription Type Selector */}
          <div className="space-y-2">
            <label className="text-slate-500 text-[11px] uppercase tracking-wider block font-bold">
              1. Alert Subscription Trigger
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAlertType('price_drop')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  alertType === 'price_drop'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-teal-600" />
                <span className="text-[10px] leading-tight">Price Drop</span>
              </button>

              <button
                type="button"
                onClick={() => setAlertType('back_in_stock')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  alertType === 'back_in_stock'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] leading-tight">Back in Stock</span>
              </button>

              <button
                type="button"
                onClick={() => setAlertType('both')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  alertType === 'both'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] leading-tight">Both Alerts</span>
              </button>
            </div>
          </div>

          {/* Target Price Section */}
          {alertType !== 'back_in_stock' && (
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider font-bold">
                  2. Target Threshold Price (₹)
                </label>
                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono font-bold">
                  Current: ₹{currentPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min={1}
                  max={currentPrice - 1}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none focus:border-teal-600 transition"
                  placeholder="Enter target price"
                />
              </div>

              {/* Discount presets */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-medium">Quick discount targets:</span>
                {[5, 10, 15, 20].map((pct) => {
                  const presetVal = Math.round(currentPrice * (1 - pct / 100));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyPreset(pct)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        targetPrice === presetVal
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      -{pct}% (₹{presetVal.toLocaleString('en-IN')})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Email & Push Channel Settings */}
          <div className="space-y-3">
            <label className="text-slate-500 text-[11px] uppercase tracking-wider block font-bold">
              3. Delivery Contact &amp; Notification Channels
            </label>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-[10px] font-medium block">Subscription Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-teal-600 transition"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                enableEmail ? 'bg-teal-50/70 border-teal-300 dark:bg-teal-950/40 dark:border-teal-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-bold">Email Alerts</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableEmail}
                  onChange={(e) => setEnableEmail(e.target.checked)}
                  className="w-4 h-4 text-teal-700 accent-teal-600 cursor-pointer"
                />
              </label>

              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                enablePush ? 'bg-teal-50/70 border-teal-300 dark:bg-teal-950/40 dark:border-teal-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-bold">Push Alerts</span>
                </div>
                <input
                  type="checkbox"
                  checked={enablePush}
                  onChange={(e) => setEnablePush(e.target.checked)}
                  className="w-4 h-4 text-teal-700 accent-teal-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Existing Alert Status Banner if active */}
          {existingAlert && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You already have an active price alert for this item. Saving will update your target settings.</span>
              </div>
              <button
                type="button"
                onClick={handleDeleteAlert}
                className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer shrink-0"
                title="Remove alert"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>{existingAlert ? 'Update Price Alert' : 'Activate Price Alert'}</span>
            </button>

            {/* Instant Demo Simulator */}
            <button
              type="button"
              onClick={handleSimulateTrigger}
              className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>⚡ Test Notification (Simulate Price Drop Event)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
