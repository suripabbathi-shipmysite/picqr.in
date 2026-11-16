"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLANS = [
  { id: "per-event", name: "Per Event", price: 399, desc: "1 Event - 36 Hours Live - 3000 Photos" },
  { id: "monthly", name: "Monthly", price: 999, desc: "4 Events - Event Auto Expire in 3 Days - 30 Days - 4000 Photos", popular: true },
  { id: "yearly", name: "Yearly", price: 9999, desc: "50 Events - Event Auto Expire in 3 Days - 365 Days - 10000 Photos" },
];

export default function PhotographerPayment() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [method, setMethod] = useState("UPI");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);

  // FIX: REAL USER - Fake prefill kaadu
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userMobile, setUserMobile] = useState("");
  const [country, setCountry] = useState("");
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [freeUsed, setFreeUsed] = useState(false);

  // FIX: Login + Country Lock + Free Used - DB nundi
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login?next=/photographer/payment"); return; }
      setUserId(session.user.id);
      setUserEmail(session.user.email || "");
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (profile) {
        setUserName(profile.full_name || "");
        setUserMobile(profile.mobile || "");
        setCountry(profile.country || "");
        setCurrentPlan((profile.plan || "FREE").toUpperCase());
        // FIX: Free Used - DB nundi - Refresh chesina malli raadu
        const { data: evs } = await supabase.from("events").select("id").eq("user_id", session.user.id);
        if (evs && evs.length > 0) setFreeUsed(true);
        if (profile.free_event_used) setFreeUsed(true);
      }
      setPageLoading(false);
    };
    load();
  }, [router]);

  const plan = PLANS.find(p => p.id === selectedPlan)!;
  const gatewayFee = method === "UPI" ? 0 : Math.round(plan.price * 0.02);
  const total = plan.price + gatewayFee;

  const showMsg = (m: string, isErr = false) => { setMsg(m); setMsgError(isErr); };

  const handlePay = async () => {
    if (!userEmail) return showMsg("Please login first.", true);
    // FIX: Country Lock - India page lo India user matrame
    if (country && country !== "India") {
      showMsg(`Your account country is ${country}. This page is for India only. You will be redirected to your country's pricing.`, true);
      setTimeout(() => router.push("/pricing"), 1500);
      return;
    }
    setLoading(true); setMsg(""); setMsgError(false);
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan, method, userId, email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order create failed");

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
            body: JSON.stringify({ ...response, planId: selectedPlan, userId }),
          });
          const v = await verifyRes.json();
          if (v.success) {
            // FIX: Payment ayaka Profile lo Plan Update - Dashboard lo PAID kanipinchali
            const expiry = new Date();
            if (selectedPlan === "per-event") expiry.setHours(expiry.getHours() + 36);
            if (selectedPlan === "monthly") expiry.setDate(expiry.getDate() + 30);
            if (selectedPlan === "yearly") expiry.setDate(expiry.getDate() + 365);
            await supabase.from("profiles").update({
              plan: "PAID",
              plan_name: data.planName,
              plan_price: `Rs ${total}`,
              plan_expiry: expiry.toISOString(),
            }).eq("id", userId);
            showMsg(`Payment Success! Plan Activated: ${data.planName}. Payment ID: ${v.paymentId}. Invoice sent to ${userEmail}. Redirecting to Dashboard...`);
            setTimeout(() => router.push("/dashboard"), 2000);
          } else {
            showMsg("Payment Failed - " + (v.error || "Verification failed"), true);
          }
          setLoading(false);
        },
        // FIX: REAL Prefill - Nee peru / email / mobile
        prefill: { name: userName || "Photographer", email: userEmail, contact: userMobile || "" },
        theme: { color: "#5B00B8" },
        method: { upi: method === "UPI", card: method === "CARD", netbanking: method === "NETBANKING" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function () { showMsg("Payment Failed - Money not deducted. Try Again.", true); setLoading(false); });
      rzp.open();
    } catch (e: any) { showMsg("Error: " + e.message, true); setLoading(false); }
  };

  // FIX: Free Event - DB lo mark - Refresh ayina malli raadu
  const useFreeEvent = async () => {
    if (freeUsed) { showMsg("Free Event already used. Please buy a plan.", true); return; }
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ free_event_used: true }).eq("id", userId);
    if (error) { showMsg(error.message, true); setLoading(false); return; }
    setFreeUsed(true);
    showMsg("Free 1 Event Activated - 2000 Photos Limit - Event Auto Expiry in 12 Hours. After this, buy a plan to continue.");
    setLoading(false);
    setTimeout(() => router.push("/dashboard/new-event"), 1000);
  };

  if (pageLoading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading payment...</div>;

  const btn = { background: "#0F0A24", color: "#fff", border: "none", padding: "12px 18px", borderRadius: 12, fontWeight: 800, cursor: "pointer", width: "100%" };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FF", fontFamily: "Arial", padding: 16 }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <a href="/dashboard" style={{ color: '#5B00B8', fontWeight: 800, textDecoration: 'none', fontSize: 13 }}>← Back to Dashboard</a>
        <h1 style={{ fontSize: 24, margin: '12px 0 0' }}>Choose Your Plan - India</h1>
        <p style={{ fontSize: 12, color: "#666" }}>Price by Location: {country || "India"} - Razorpay Secure Payment • Logged in as {userEmail}</p>
        {currentPlan !== "FREE" && (
          <div style={{ background: '#E6FFED', borderRadius: 12, padding: 12, marginTop: 12, fontSize: 13 }}>
            ✅ You already have <b>{currentPlan} Plan</b>. Buying again will extend / replace your plan.
          </div>
        )}
        {country && country !== "India" && (
          <div style={{ background: '#FFF0F0', borderRadius: 12, padding: 12, marginTop: 12, fontSize: 13, color: '#D00' }}>
            ⚠️ Your account country is <b>{country}</b>. This India page is not for you. <a href="/pricing" style={{ color: '#5B00B8', fontWeight: 800 }}>Go to {country} Pricing →</a>
          </div>
        )}

        {!freeUsed ? (
          <div style={{ background: "#fff", border: "1px solid #EDEBFF", borderRadius: 16, padding: 16, marginTop: 16 }}>
            <b>Try Free First - No Payment</b>
            <p style={{ fontSize: 12, color: "#666" }}>Free 1 Event - 2000 Photos - Event Auto Expiry in 12 Hours - No Card Needed.</p>
            <button onClick={useFreeEvent} disabled={loading} style={{ ...btn, background: "#008000" }}>Activate Free 1 Event</button>
          </div>
        ) : (
          <div style={{ background: "#F8F7FF", borderRadius: 12, padding: 12, marginTop: 16, fontSize: 12, color: "#666" }}>Free Event already used ✅ - Please buy a plan to continue.</div>
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
            You Get Full Plan: {plan.name} - No Hidden Charges<br />
            Paying As: {userName || userEmail} • {userEmail}
          </div>
          <button onClick={handlePay} disabled={loading} style={{ ...btn, marginTop: 12, background: "linear-gradient(90deg,#5B00B8,#FF7A2F)" }}>{loading ? "Opening Razorpay..." : `Pay Rs ${total} Securely`}</button>
          {msg && <p style={{ fontSize: 12, color: msgError ? "#D00" : "#5B00B8", background: msgError ? "#FFF0F0" : "#F8F7FF", padding: 10, borderRadius: 10, marginTop: 12 }}>{msg}</p>}
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