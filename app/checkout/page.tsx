'use client';

import React, { useState, useEffect } from 'react';
import { getPaymentSettings, createOrder, getOrder, subscribeNotifications, Notification, PaymentSettings } from '../../src/lib/firestore';
import PaymentUploadForm from '../../src/components/PaymentUploadForm';
import { ShoppingBag, ArrowRight, Clock, ShieldCheck, FileCheck, PhoneCall, AlertCircle, Sparkles } from 'lucide-react';
import { formatCurrency, formatDate } from '../../src/lib/utils';

export default function CheckoutManualPage() {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [currentStep, setCurrentStep] = useState<'checkout' | 'upload' | 'success'>('checkout');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank'>('upi');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default Mock order coordinates to make it fully runnable
  const mockOrder = {
    orderId: 'ORD' + Math.floor(100000 + Math.random() * 900000),
    customerId: 'cust_waris_101',
    customerName: 'Waris Ul Islam',
    customerEmail: 'waris@example.com',
    vendorId: 'vendor-medilink',
    items: [
      { productId: 'p1', productName: 'Premium Cardiology ECG Monitor', price: 14500, quantity: 1 },
      { productId: 'p2', productName: 'Automated Clinical Syringe Pump', price: 8900, quantity: 1 }
    ],
    totalAmount: 23400
  };

  useEffect(() => {
    async function initCheckout() {
      try {
        const settings = await getPaymentSettings();
        setPaymentSettings(settings);
      } catch (err) {
        setError('Could not retrieve merchant gateway configurations.');
      } finally {
        setLoading(false);
      }
    }
    initCheckout();
  }, []);

  // Listen to live alerts/notifications from admin auditing approval!
  useEffect(() => {
    if (currentStep === 'success') {
      const unsubscribe = subscribeNotifications(mockOrder.customerId, (data) => {
        setNotifications(data);
      });
      return () => unsubscribe?.();
    }
  }, [currentStep]);

  const handleUploadSuccess = async (uploadData: {
    screenshotUrl: string;
    driveUrl: string;
    utr: string;
    paymentDateTime: string;
    paymentNote: string;
  }) => {
    setLoading(true);
    try {
      // Create the order in Firestore with pending manual verification status
      await createOrder({
        orderId: mockOrder.orderId,
        customerId: mockOrder.customerId,
        customerName: mockOrder.customerName,
        vendorId: mockOrder.vendorId,
        items: mockOrder.items,
        totalAmount: mockOrder.totalAmount,
        paymentMethod: paymentMethod,
        paymentStatus: 'waiting_verification',
        orderStatus: 'pending_payment',
        screenshotUrl: uploadData.screenshotUrl,
        utr: uploadData.utr,
        paymentDateTime: uploadData.paymentDateTime,
        paymentNote: uploadData.paymentNote
      });

      setCurrentStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to persist order transaction.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && currentStep !== 'success') {
    return (
      <div className="p-8 text-center text-xs text-slate-500 animate-pulse font-sans">
        Initializing medical checkout terminal...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 font-sans">
      
      {currentStep === 'checkout' && (
        <div className="space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#1E40AF]" />
              <span>Checkout Settlement</span>
            </h2>
            <p className="text-xs text-slate-500">Secure manual bank clearing or fast UPI QR payment settlements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Order items listing */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800 pb-2">Order Items</h3>
              
              <div className="space-y-3.5">
                {mockOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">Qty: {item.quantity} • Unit Price: {formatCurrency(item.price)}</p>
                    </div>
                    <span className="font-bold shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between font-bold text-xs">
                <span className="text-slate-500">Total Settlement:</span>
                <span className="text-[#1E40AF] dark:text-blue-400 text-sm font-extrabold">{formatCurrency(mockOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Right Column: Gateway selector */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-50">Select Settlement Method</h3>
                
                <div className="space-y-2 text-xs">
                  {paymentSettings?.upi?.enabled && (
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`w-full p-3 border rounded-xl text-left transition cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'upi'
                          ? 'border-blue-600 bg-blue-50/20 text-blue-600'
                          : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-bold">Manual UPI (QR Code)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Instant</span>
                    </button>
                  )}

                  {paymentSettings?.bank?.enabled && (
                    <button
                      onClick={() => setPaymentMethod('bank')}
                      className={`w-full p-3 border rounded-xl text-left transition cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'bank'
                          ? 'border-blue-600 bg-blue-50/20 text-blue-600'
                          : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-bold">Manual Corporate Bank Wire</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">1-3 Hours</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setCurrentStep('upload')}
                  className="w-full mt-4 bg-[#1E40AF] hover:bg-blue-750 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-md"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {currentStep === 'upload' && (
        <PaymentUploadForm
          orderId={mockOrder.orderId}
          orderAmount={mockOrder.totalAmount}
          paymentMethod={paymentMethod}
          paymentDetails={paymentSettings}
          onSubmitSuccess={handleUploadSuccess}
          onCancel={() => setCurrentStep('checkout')}
        />
      )}

      {currentStep === 'success' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Subtle background sparkles */}
          <div className="absolute top-4 right-4 text-amber-500 opacity-30"><Sparkles className="w-10 h-10" /></div>
          
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-slate-950 dark:text-slate-50">Payment Receipt Submitted Successfully!</h3>
            <p className="text-xs text-slate-500">Order ID: <span className="font-bold">#{mockOrder.orderId}</span> • Total Amount: <span className="font-bold">₹{mockOrder.totalAmount.toLocaleString('en-IN')}</span></p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">Your manual UPI/Bank proof of payment is now queued in our Administrative Auditing Hub. We will verify your transaction reference and release the items for shipment.</p>
          </div>

          {/* Verification Status timeline */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-left space-y-3 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-slate-50">Proof Uploaded (Drive & Storage)</p>
                <p className="text-[10px] text-slate-400">Completed just now.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">2</div>
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-slate-50">Auditing Queue Inspection</p>
                <p className="text-[10px] text-slate-400">Merchant is verifying UTR ledger match...</p>
              </div>
            </div>
          </div>

          {/* Real-time Alerts from the system */}
          <div className="space-y-2.5 max-w-md mx-auto text-left">
            <p className="font-bold text-xs text-slate-500">Live Transaction Notifications:</p>
            {notifications.length === 0 ? (
              <div className="p-3 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl text-center text-[11px] text-slate-400">
                Waiting for administrative audit update...
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl flex items-start gap-2.5 text-[11px]">
                    <FileCheck className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-900 dark:text-blue-300">{notif.title}</p>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{notif.message}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{formatDate(notif.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
