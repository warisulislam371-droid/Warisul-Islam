"use client"
import React, { useState } from "react"
import { load } from "@cashfreepayments/cashfree-js"
import { db } from "@/src/firebase"
import { collection, addDoc, doc, updateDoc } from "firebase/firestore"
import { CheckCircle2, XCircle, ShieldCheck, Zap, Info, CreditCard, Loader2, FileText, ArrowRight } from "lucide-react"

export default function CheckoutPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Simulation Modal states
  const [showMockModal, setShowMockModal] = useState(false)
  const [mockOrderId, setMockOrderId] = useState("")
  const [mockDocId, setMockDocId] = useState("")
  const [isSuccessState, setIsSuccessState] = useState(false)
  const [paymentTxnId, setPaymentTxnId] = useState("")

  // Hardcoded or dynamically read clinical procurement totals
  const orderData = {
    subtotal: 12500,
    gst: 1500,
    total: 14000,
    items: "Clinical Medical Equipment Order (ECG / Defibrillator)"
  }

  const payNow = async () => {
    setError("")
    if (!form.name || !form.phone || !form.email) {
      return setError("Please fill all required Hospital and Contact details")
    }
    setLoading(true)
    
    try {
      const orderId = "ORD" + Date.now()

      // 1. Create order in Firebase Firestore first with status "Pending"
      const docRef = await addDoc(collection(db, "orders"), {
        orderId, 
        ...form, 
        ...orderData,
        paymentMethod: "Cashfree",
        status: "Pending",
        createdAt: new Date().toISOString()
      })

      setMockDocId(docRef.id)
      setMockOrderId(orderId)

      // 2. Create Cashfree Session
      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId, 
          amount: orderData.total, 
          name: form.name, 
          phone: form.phone,
          email: form.email
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Failed to create order")
      if (!data.payment_session_id) throw new Error("No payment session id returned from PG")

      // 3. Check if we should fall back to mock sandbox simulation
      if (data.isMock) {
        setShowMockModal(true)
        setLoading(false)
        return
      }

      // 4. Open real Cashfree checkout popup sandbox
      try {
        const cashfree = await load({ mode: "sandbox" }) // Change to "production" later if live credentials are added
        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          returnUrl: window.location.origin + "/order-success?order_id=" + orderId,
        })
      } catch (cfErr) {
        console.warn("Cashfree SDK failed to initialize. Falling back to sandbox simulation modal.");
        setShowMockModal(true)
        setLoading(false)
      }
    } catch (e: any) {
      setError(e.message || "An error occurred during cashfree checkout initialization.")
      setLoading(false)
    }
  }

  const handleSimulateSuccess = async () => {
    setLoading(true)
    try {
      const txnId = "cf_txn_" + Math.floor(100000 + Math.random() * 900000)
      setPaymentTxnId(txnId)

      // Update order status in Firebase Firestore to Paid
      if (mockDocId) {
        await updateDoc(doc(db, "orders", mockDocId), {
          status: "Paid",
          txnId: txnId
        })
      }

      // Sync with optional Google Sheets API endpoint if configured
      const siteUrl = window.location.origin
      await fetch(`${siteUrl}/api/cashfree/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            order_id: mockOrderId,
            order: {
              order_id: mockOrderId,
              order_status: "PAID"
            },
            payment: {
              cf_payment_id: txnId
            }
          }
        })
      }).catch(err => console.warn("Webhook sync warning:", err))

      setShowMockModal(false)
      setIsSuccessState(true)
    } catch (err: any) {
      setError("Failed to verify simulated payment: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSimulateFailure = () => {
    setShowMockModal(false)
    setError("Online Sandbox Payment cleared with failure. The transaction was declined.")
  }

  if (isSuccessState) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 my-10 font-sans text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-teal-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Securely Cleared!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Your B2B hospital procurement order <strong className="text-slate-800">#{mockOrderId}</strong> has been logged successfully.
          </p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left text-xs space-y-2.5 max-w-md mx-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Consignment Summary</p>
          <div className="flex justify-between">
            <span className="text-slate-500">Authorized Cleared Value:</span>
            <span className="font-bold text-slate-800">₹{orderData.total.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Hospital Institute:</span>
            <span className="font-bold text-slate-800">{form.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cashfree Transaction ID:</span>
            <span className="font-mono font-semibold text-teal-700">{paymentTxnId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Shipment Partner Node:</span>
            <span className="font-semibold text-slate-800">Delhivery Express Courier</span>
          </div>
        </div>

        <div className="pt-2">
          <button 
            onClick={() => {
              setIsSuccessState(false)
              setForm({ name: "", phone: "", email: "", address: "" })
            }}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wide transition cursor-pointer"
          >
            <span>Initiate New Procurement</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100 my-10 font-sans">
      <h2 className="text-2xl font-bold mb-1 text-slate-900 tracking-tight">Instant Automated Online Clearing</h2>
      <p className="text-xs text-slate-500 mb-6">HealNex B2B Hospital Procurements clearing console powered by Cashfree API</p>
      
      <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-1">
          <span>Clinical Subtotal</span>
          <span className="font-semibold text-slate-800">₹{orderData.subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Clinical GST Breakout</span>
          <span className="font-semibold text-slate-800">₹{orderData.gst.toLocaleString('en-IN')}</span>
        </div>
        <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-lg text-slate-900">
          <span>Procurement Grand Total</span>
          <span className="text-teal-600">₹{orderData.total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg mb-4 font-semibold border border-red-100 flex gap-2 items-center">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hospital / Client Name *</label>
          <input 
            placeholder="e.g. City Care Hospital" 
            value={form.name}
            onChange={e=>setForm({...form, name:e.target.value})} 
            className="border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg w-full p-2.5 text-sm outline-none transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Official Billing Email *</label>
          <input 
            placeholder="e.g. billing@hospital.com" 
            type="email"
            value={form.email}
            onChange={e=>setForm({...form, email:e.target.value})} 
            className="border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg w-full p-2.5 text-sm outline-none transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Phone *</label>
          <input 
            placeholder="10-digit mobile number" 
            value={form.phone}
            onChange={e=>setForm({...form, phone:e.target.value})} 
            className="border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg w-full p-2.5 text-sm outline-none transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Clinical Shipping Address</label>
          <textarea 
            placeholder="e.g. Pune 411001, Maharashtra" 
            value={form.address}
            onChange={e=>setForm({...form, address:e.target.value})} 
            className="border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg w-full p-2.5 text-sm outline-none transition min-h-[80px]"
          />
        </div>
      </div>
      
      <button 
        onClick={payNow} 
        disabled={loading} 
        className="bg-teal-600 hover:bg-teal-700 text-white w-full py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-md transition disabled:bg-slate-300 mt-6 cursor-pointer uppercase flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{loading ? "Processing automated settlement..." : "PAY VIA CASHFREE PG"}</span>
      </button>

      {/* Cashfree Sandbox Simulator Modal */}
      {showMockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300">
            
            {/* Header Branded with Cashfree Theme */}
            <div className="bg-indigo-950 text-white p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-400 text-slate-950 p-1.5 rounded-lg font-black text-xs uppercase tracking-tight flex items-center gap-1 shadow-inner">
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>cf</span>
                  </div>
                  <span className="text-sm font-black tracking-widest uppercase">cashfree payments</span>
                </div>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                  Sandbox Active
                </span>
              </div>
              <div className="pt-2">
                <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Hospital Procurement Settlement</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black font-mono">₹{orderData.total.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-indigo-200">INR</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Secured Order ID</span>
                    <strong className="text-slate-800 font-mono text-[11px]">{mockOrderId}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Payment Method</span>
                    <strong className="text-indigo-950 uppercase text-[9px] bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold">Automated PG</strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs space-y-1.5 text-slate-600">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Authorized Payer Details</span>
                  <div className="flex justify-between font-medium">
                    <span>Institute:</span>
                    <span className="text-slate-900 font-bold">{form.name}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Contact Email:</span>
                    <span className="text-slate-900 font-mono text-[10px]">{form.email}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Contact Phone:</span>
                    <span className="text-slate-900">{form.phone}</span>
                  </div>
                </div>
              </div>

              {/* Developer Environment Alert Info */}
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                  <Info className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>Sandbox Simulation Fallback</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  The API credentials are not configured or rejected. You can test both transaction outcomes using this safe sandbox simulator:
                </p>
              </div>

              {/* Simulation Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleSimulateSuccess}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wide transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/15"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Simulate Success</span>
                </button>
                <button
                  onClick={handleSimulateFailure}
                  disabled={loading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wide transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-rose-600/15"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Fail</span>
                </button>
              </div>

              <div className="text-center pt-1.5">
                <button
                  onClick={() => setShowMockModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold uppercase tracking-wider transition"
                >
                  Cancel Payment
                </button>
              </div>

              {/* Security Footer */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <CreditCard className="w-3.5 h-3.5" />
                <span>PCI-DSS Compliant 256-Bit SSL Encryption</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
