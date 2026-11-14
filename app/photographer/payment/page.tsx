"use client";
import { useState } from "react";
import Script from "next/script";

const PLANS = [
  { id: "per-event", name: "Per Event", price: 399, desc: "1 Event - 36 Hours Live - 3000 Photos" },
  { id: "monthly", name: "Monthly", price: 999, desc: "4 Events - Event Auto Expire in 3 Days - 30 Days - 4000 Photos", popular: true },
  { id: "yearly", name: "Yearly", price: 9999, desc: "50 Events - Event Auto Expire in 3 Days - 365 Days - 10000 Photos" },
];

export default function PhotographerPayment() {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [method, setMethod] = useState("UPI");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [freeUsed, setFreeUsed] = useState(false);

  const plan = PLANS.find(p => p.id === selectedPlan)!;
  const gatewayFee = method === "UPI" ? 0 : Math.round(plan.price * 0.02);
  const total = plan.price + gatewayFee;

  const handlePay = async () => {
    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const options: any = {
        key: data.keyId,
        amount: data.amount * 100,
        currency: "INR",
        name: "PicQR",
        description: `${data.planName} Plan - PicQR`,
        order_id: data.orderId,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, planId: selectedPlan }),
          });
          const v = await verifyRes.json();
          if (v.success) {
            setMsg(`Payment Success! Plan Activated: ${data.planName}. Payment ID: ${v.paymentId}. Invoice sent to your mail.`);
          } else {
            setMsg("Payment Failed - " + v.error);
          }
          setLoading(false);
        },
        prefill: { name: "Photographer", email: "photographer@gmail.com", contact: "9000000000" },
        theme: { color: "#5B00B8" },
        method: { upi: method === "UPI", card: method === "CARD", netbanking: method === "NETBANKING" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function () { setMsg("Payment Failed - Money not deducted. Try Again."); setLoading(false); });
      rzp.open();
    } catch (e: any) { setMsg("Error: " + e.message); setLoading(false); }
  };

  const useFreeEvent = () => {
    if (freeUsed) { setMsg("Free Event already used. Please buy a plan."); return; }
    setFreeUsed(true);
    setMsg("Free 1 Event Activated - 2000 Photos Limit - Event Auto Expiry in 12 Hours. After this, buy a plan to continue.");
  };

  const btn = { background: "#0F0A24", color: "#fff", border: "none", padding: "12px 18px", borderRadius: 12, fontWeight: 800, cursor: "pointer", width: "100%" };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FF", fontFamily: "Arial", padding: 16 }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24 }}>Choose Your Plan - India</h1>
        <p style={{ fontSize: 12, color: "#666" }}>Price by Location: India - Razorpay Secure Payment</p>

        {!freeUsed && (
          <div style={{ background: "#fff", border: "1px solid #EDEBFF", borderRadius: 16, padding: 16, marginTop: 16 }}>
            <b>Try Free First - No Payment</b>
            <p style={{ fontSize: 12, color: "#666" }}>Free 1 Event - 2000 Photos - Event Auto Expiry in 12 Hours - No Card Needed.</p>
            <button onClick={useFreeEvent} style={{ ...btn, background: "#008000" }}>Activate Free 1 Event</button>
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {PLANS.map(p => (
            <div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{ background: "#fff", border: selectedPlan === p.id ? "2px solid #5B00B8" : "1px solid #EDEBFF", borderRadius: 16, padding: 16, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <b>{p.name} {p.popular && <span style={{ background: "#FF7A2F", color: "#fff", fontSize: 10, padding: "3px 8px", borderRadius: 20, marginLeft: 6 }}>POPULAR</span>}</b>
                <b>Rs {p.price}</b>
              </div>
              <p style={{ fontSize: 12, color: "#666", margin: "6px 0 0" }}>{p.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #EDEBFF", borderRadius: 16, padding: 16, marginTop: 16 }}>
          <b>Payment Method</b>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {(["UPI", "CARD", "NETBANKING"] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)} style={{ flex: 1, padding: 10, borderRadius: 10, border: method === m ? "2px solid #5B00B8" : "1px solid #EDEBFF", background: method === m ? "#F8F7FF" : "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>{m} {m === "UPI" ? "- No Fee" : "+2%"}</button>
            ))}
          </div>
          <div style={{ fontSize: 13, lineHeight: 2, marginTop: 12, background: "#F8F7FF", padding: 12, borderRadius: 10 }}>
            Plan Price: Rs {plan.price}<br />
            Gateway Fee ({method}): Rs {gatewayFee} {method === "UPI" ? "- No Charges" : "- Paid By Photographer"}<br />
            <b>Total To Pay: Rs {total}</b><br />
            You Get Full Plan: {plan.name} - No Hidden Charges
          </div>
          <button onClick={handlePay} disabled={loading} style={{ ...btn, marginTop: 12, background: "linear-gradient(90deg,#5B00B8,#FF7A2F)" }}>{loading ? "Opening Razorpay..." : `Pay Rs ${total} Securely`}</button>
          {msg && <p style={{ fontSize: 12, color: "#5B00B8", background: "#F8F7FF", padding: 10, borderRadius: 10, marginTop: 12 }}>{msg}</p>}
        </div>

        <div style={{ background: "#fff", border: "1px solid #EDEBFF", borderRadius: 16, padding: 16, marginTop: 16, fontSize: 12, lineHeight: 1.8, color: "#666" }}>
          <b style={{ color: "#000" }}>Refund Policy - Please Read:</b><br />
          1. If payment is deducted twice, second payment will be refunded in 3 working days.<br />
          2. If payment fails but money is deducted, bank will auto refund in 3-5 working days.<br />
          3. If plan is activated, no refund will be given.<br />
          4. For any payment issue, contact support with Payment ID.
        </div>
      </div>
    </div>
  );
}