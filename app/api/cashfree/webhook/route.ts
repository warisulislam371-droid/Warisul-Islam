import { NextResponse } from "next/server"
import { db } from "@/src/firebase"
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore"

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body?.data?.order?.order_status === "PAID") {
      const orderId = body.data.order.order_id || body.data.order_id;
      const txnId = body.data.payment ? body.data.payment.cf_payment_id : '';
      
      // Find order in Firebase and update status
      const q = query(collection(db, "orders"), where("orderId", "==", orderId));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, { status: "Paid", txnId: txnId });
      });

      // Also update Google Sheet if site URL is configured
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL;
      if (siteUrl) {
        await fetch(`${siteUrl}/api/update-sheet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: "Paid" })
        }).catch(err => console.warn('Google Sheet sync webhook warning:', err.message));
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
