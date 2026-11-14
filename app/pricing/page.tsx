"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = {
  id: string;
  name: string;
  basePrice: number; // Price you receive - Example: 399
  fee: number; // Razorpay fee - Auto calculated
  totalPrice: number; // Customer has to pay - base + fee
  events: number;
  expiry: string;
  storage: string;
  desc: string;
};

type Tier = {
  id: string;
  label: string;
  symbol: string;
  currency: string;
  perEvent: number;
  monthly: number;
  yearly: number;
  feePercent: number; // India 2.36% - International 3.54%
  isIndia: boolean;
};

// 4 Tiers - Final Lock + Fee
const TIERS: Tier[] = [
  { id: "tier1", label: "Tier 1 - LOW", symbol: "$", currency: "USD", perEvent: 9, monthly: 29, yearly: 299, feePercent: 3.54, isIndia: false },
  { id: "tier2", label: "Tier 2 - INDIA", symbol: "Rs", currency: "INR", perEvent: 399, monthly: 999, yearly: 9999, feePercent: 2.36, isIndia: true },
  { id: "tier3", label: "Tier 3 - GULF", symbol: "$", currency: "USD", perEvent: 35, monthly: 119, yearly: 999, feePercent: 3.54, isIndia: false },
  { id: "tier4", label: "Tier 4 - PREMIUM", symbol: "$", currency: "USD", perEvent: 29, monthly: 99, yearly: 899, feePercent: 3.54, isIndia: false },
];

const COUNTRY_TO_TIER: Record<string, string> = {
  "pakistan": "tier1", "bangladesh": "tier1", "sri lanka": "tier1", "bhutan": "tier1", "nepal": "tier1", "other": "tier1",
  "india": "tier2",
  "uae": "tier3", "united arab emirates": "tier3", "qatar": "tier3", "saudi arabia": "tier3", "saudi": "tier3", "singapore": "tier3", "malaysia": "tier3",
  "usa": "tier4", "us": "tier4", "united states": "tier4", "uk": "tier4", "united kingdom": "tier4", "canada": "tier4", "australia": "tier4", "europe": "tier4", "germany": "tier4", "france": "tier4", "italy": "tier4", "spain": "tier4", "netherlands": "tier4",
};

// Razorpay Payment Links - If you want without code, paste your links here
// To use Link method - Set USE_PAYMENT_LINKS = true
// To use Checkout API method - Set false
const USE_PAYMENT_LINKS = false;
const PAYMENT_LINKS: Record<string, string> = {
  "tier2-per-event": "https://rzp.io/l/YOUR-INDIA-409-LINK",
  "tier2-monthly": "https://rzp.io/l/YOUR-INDIA-1023-LINK",
  "tier2-yearly": "https://rzp.io/l/YOUR-INDIA-10235-LINK",
  "tier1-per-event": "https://rzp.io/l/YOUR-TIER1-932-LINK",
  "tier1-monthly": "https://rzp.io/l/YOUR-TIER1-3003-LINK",
  "tier1-yearly": "https://rzp.io/l/YOUR-TIER1-30959-LINK",
  "tier3-per-event": "https://rzp.io/l/YOUR-TIER3-3624-LINK",
  "tier3-monthly": "https://rzp.io/l/YOUR-TIER3-12321-LINK",
  "tier3-yearly": "https://rzp.io/l/YOUR-TIER3-103436-LINK",
  "tier4-per-event": "https://rzp.io/l/YOUR-TIER4-3003-LINK",
  "tier4-monthly": "https://rzp.io/l/YOUR-TIER4-10250-LINK",
  "tier4-yearly": "https://rzp.io/l/YOUR-TIER4-93083-LINK",
};

function getTierByCountry(country: string): Tier | null {
  const key = (country || "").toLowerCase().trim();
  const tierId = COUNTRY_TO_TIER[key];
  if (!tierId) return null;
  return TIERS.find((t) => t.id === tierId) || null;
}

// Fee calc - Base + Fee = Total - Rounded up
function withFee(base: number, feePercent: number) {
  const fee = Math.ceil(base * feePercent / 100);
  return { fee, total: base + fee };
}

export default function Pricing() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [symbol, setSymbol] = useState("");
  const [tierLabel, setTierLabel] = useState("");
  const [tierId, setTierId] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [isIndia, setIsIndia] = useState(false);
  const [country, setCountry] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selected, setSelected] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [paying, setPaying] = useState("");

  useEffect(() => {
    const loggedIn = document.cookie.includes("picqr_session") || localStorage.getItem("picqr_logged_in") === "1";
    if (!loggedIn) { router.replace("/login?next=/pricing"); return; }

    const savedCountry = localStorage.getItem("picqr_country") || localStorage.getItem("picqr_user_country") || "";
    const tier = getTierByCountry(savedCountry);
    if (!savedCountry || !tier) { setBlocked(true); setLoading(false); return; }

    setCountry(savedCountry);
    setUserName(localStorage.getItem("picqr_user_name") || localStorage.getItem("picqr_name") || "");
    setUserEmail(localStorage.getItem("picqr_user_email") || localStorage.getItem("picqr_email") || "");
    setSymbol(tier.symbol);
    setTierLabel(tier.label);
    setTierId(tier.id);
    setCurrency(tier.currency);
    setIsIndia(tier.isIndia);

    const build = (id: string, name: string, base: number, events: number, expiry: string, storage: string, desc: string): Plan => {
      const { fee, total } = withFee(base, tier.feePercent);
      return { id, name, basePrice: base, fee, totalPrice: total, events, expiry, storage, desc };
    };

    setPlans([
      { id: "free", name: "Free Trial", basePrice: 0, fee: 0, totalPrice: 0, events: 1, expiry: "12 Hours", storage: "2 GB", desc: "Try PicQR with 1 free event" },
      build("per-event", "Per Event", tier.perEvent, 1, "3 Days", "10 GB", "Perfect for 1 wedding"),
      build("monthly", "Monthly", tier.monthly, 4, "3 Days Per Event", "30 GB", "For regular photographers"),
      build("yearly", "Yearly", tier.yearly, 50, "3 Days Per Event", "200 GB", "Best value for full year"),
    ]);
    setLoading(false);
  }, [router]);

  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  const onChoose = async (planId: string) => {
    if (planId === "free") { router.push("/dashboard"); return; }

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    localStorage.setItem("picqr_selected_plan", planId);
    localStorage.setItem("picqr_selected_tier", tierId);
    localStorage.setItem("picqr_selected_country", country);

    // OPTION A - Payment Links - Link will open without code
    if (USE_PAYMENT_LINKS) {
      const link = PAYMENT_LINKS[`${tierId}-${planId}`];
      if (link && !link.includes("YOUR-")) { window.location.href = link; return; }
      alert("Payment link not configured yet. Please contact support.");
      return;
    }

    // OPTION B - Razorpay Checkout - Full Automatic - UPI + QR + Card
    setPaying(planId);
    try {
      // Order is created on server - Price is not sent from frontend - Server uses DB only
      const res = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, tierId, country }),
      });
      const data = await res.json();
      if (!res.ok || !data.orderId) throw new Error(data.error || "Order failed");

      const ok = await loadRazorpay();
      if (!ok) throw new Error("Razorpay failed to load");

      const options: any = {
        key: data.keyId,
        amount: data.amount, // In paise - From server - Including fee
        currency: data.currency,
        name: "PicQR.in",
        description: `${plan.name} - ${tierLabel}`,
        order_id: data.orderId,
        prefill: { name: userName, email: userEmail },
        // In Razorpay Checkout - These will come automatically:
        // India - UPI + UPI QR Scan + Credit Card + Debit Card + Net Banking + Wallet
        // Other Countries - International Credit / Debit Card
        theme: { color: "#5B00B8" },
        handler: async (response: any) => {
          // Payment success - Verify on server
          const v = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId, tierId,
            }),
          });
          if (v.ok) {
            localStorage.setItem("picqr_plan_active", planId);
            router.push("/dashboard?payment=success&plan=" + planId);
          } else {
            alert("Payment verification failed. Contact support with payment id: " + response.razorpay_payment_id);
          }
        },
        modal: { ondismiss: () => setPaying("") },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Payment failed. Try again.");
    } finally {
      setPaying("");
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Arial", fontSize: 15, color: "#666" }}>Loading pricing...</div>;
  if (blocked) return (
    <div style={{ fontFamily: "Arial", background: "linear-gradient(180deg,#FFF0FF,#FFFBF8)", minHeight: "100vh", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", background: "#fff", borderRadius: 20, padding: 32, border: "1px solid #EDEBFF" }}>
        <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>Country Required</h2>
        <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>Pricing is shown for your registered country only. Please update your country in your profile or sign up again to continue.</p>
        <button onClick={() => router.push("/signup")} style={{ marginTop: 18, background: "linear-gradient(90deg,#5B00B8,#FF7A2F)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>Update Country</button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "Arial", background: "linear-gradient(180deg,#FFF0FF,#FFFBF8)", minHeight: "100vh", padding: "24px 18px 50px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-start", marginBottom: 16 }}>
          <button onClick={() => router.push("/")} style={{ background: "#fff", border: "1px solid #EDEBFF", padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>← Home</button>
          <button onClick={() => router.back()} style={{ background: "#fff", border: "1px solid #EDEBFF", padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>← Back</button>
        </div>
        <span style={{ background: "#fff", border: "1px solid #EDEBFF", padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 800, color: "#5B00B8" }}>PRICING</span>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "16px 0 8px", color: "#0F0A24" }}>Simple Pricing. No Hidden Charges.</h1>
        <p style={{ color: "#666", fontSize: 15, margin: "0 0 8px" }}>Start free. Upgrade when you need more events.</p>
        <p style={{ fontSize: 12, color: "#5B00B8", fontWeight: 800, margin: "0 0 8px", background: "#F0E8FF", display: "inline-block", padding: "6px 14px", borderRadius: 20 }}>
          {tierLabel} • Showing prices for {country} {userName ? `• Hello, ${userName}` : ""}
        </p>
        {/* Payment methods - Changes based on country */}
        <div style={{ margin: "0 0 28px" }}>
          {isIndia ? (
            <p style={{ fontSize: 12, color: "#333", background: "#fff", display: "inline-block", padding: "8px 16px", borderRadius: 20, border: "1px solid #EDEBFF", margin: 0 }}>
              💳 Pay via <b>UPI • UPI QR Scan • Credit Card • Debit Card • Net Banking</b> - Secured by Razorpay
            </p>
          ) : (
            <p style={{ fontSize: 12, color: "#333", background: "#fff", display: "inline-block", padding: "8px 16px", borderRadius: 20, border: "1px solid #EDEBFF", margin: 0 }}>
              💳 Pay via <b>International Credit Card • Debit Card</b> - Secured by Razorpay
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 16, textAlign: "left", alignItems: "stretch", overflowX: "auto", padding: "14px 4px 10px" }}>
          {plans.map((p) => {
            const isActive = selected === p.id;
            const isPopular = p.id === "monthly";
            const isBest = p.id === "yearly";
            return (
              <div key={p.id} onClick={() => setSelected(p.id)} style={{ flex: "1 1 0", minWidth: 240, background: isActive ? "#0F0A24" : "#fff", color: isActive ? "#fff" : "#111", border: isActive ? "2px solid #5B00B8" : "1px solid #EDEBFF", borderRadius: 22, padding: "24px 20px", cursor: "pointer", boxShadow: isActive ? "0 20px 50px rgba(91,0,184,0.25)" : "0 10px 30px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", position: "relative" as const }}>
                {isPopular && <span style={{ position: "absolute", top: -12, left: 20, background: "linear-gradient(90deg,#5B00B8,#FF7A2F)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap" as const }}>MOST POPULAR</span>}
                {isBest && <span style={{ position: "absolute", top: -12, left: 20, background: "#FF7A2F", color: "#fff", fontSize: 11, fontWeight: 800, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap" as const }}>BEST VALUE</span>}
                <h3 style={{ fontSize: 17, margin: "8px 0 4px" }}>{p.name}</h3>
                <p style={{ fontSize: 12.5, color: isActive ? "#ccc" : "#666", margin: "0 0 14px", lineHeight: 1.5, minHeight: 38 }}>{p.desc}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{symbol} {p.totalPrice}</span>
                  {p.totalPrice === 0 && <span style={{ fontSize: 11, fontWeight: 700, background: "#E6FFED", color: "#008000", padding: "4px 8px", borderRadius: 20 }}>FREE</span>}
                </div>
                {p.totalPrice > 0 && (
                  <p style={{ fontSize: 11, color: isActive ? "#aaa" : "#888", margin: "6px 0 0" }}>
                    {symbol} {p.basePrice} + {symbol} {p.fee} transaction fee
                  </p>
                )}
                <p style={{ fontSize: 11.5, color: isActive ? "#aaa" : "#888", margin: "6px 0 16px" }}>{p.id === "free" ? "One time" : p.id === "per-event" ? "Per event" : p.id === "monthly" ? "Per month" : "Per year"}</p>
                <div style={{ borderTop: `1px solid ${isActive ? "rgba(255,255,255,0.15)" : "#F0F0F0"}`, paddingTop: 14, fontSize: 13.5, lineHeight: 2, flex: 1 }}>
                  <div>✓ {p.events} {p.events === 1 ? "Event" : "Events"}</div>
                  <div>✓ Auto Delete: {p.expiry}</div>
                  <div>✓ Storage: {p.storage}</div>
                  <div>✓ Permanent QR Code</div>
                  <div>✓ Studio Logo & Watermark</div>
                  <div>✓ Selfie Search</div>
                  <div>✓ Original Quality Download</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onChoose(p.id); }} disabled={paying === p.id} style={{ width: "100%", background: isActive ? "linear-gradient(90deg,#5B00B8,#FF7A2F)" : "#0F0A24", color: "#fff", border: "none", padding: "13px", borderRadius: 12, fontWeight: 800, fontSize: 13.5, marginTop: 18, cursor: paying === p.id ? "not-allowed" : "pointer", opacity: paying === p.id ? 0.6 : 1 }}>
                  {paying === p.id ? "Opening Payment..." : p.id === "free" ? "Start Free" : `Pay ${symbol} ${p.totalPrice}`}
                </button>
                {p.totalPrice > 0 && <p style={{ fontSize: 10.5, color: isActive ? "#999" : "#aaa", textAlign: "center", margin: "8px 0 0" }}>{isIndia ? "UPI • QR Scan • Card • Net Banking" : "International Card via Razorpay"}</p>}
              </div>
            );
          })}
        </div>

        <div style={{ background: "#fff", border: "1px solid #EDEBFF", borderRadius: 18, padding: "18px 24px", marginTop: 18, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", textAlign: "left", alignItems: "center" }}>
          <div><b style={{ fontSize: 14 }}>All plans include</b><p style={{ fontSize: 12.5, color: "#666", margin: "4px 0 0" }}>No app needed for guests. Scan QR, selfie, download.</p></div>
          <div style={{ display: "flex", gap: 20, fontSize: 12.5, fontWeight: 700, alignItems: "center" }}><span>✓ Secure</span><span>✓ Razorpay Protected</span><span>✓ Cancel Anytime</span></div>
        </div>
      </div>
    </div>
  );
}