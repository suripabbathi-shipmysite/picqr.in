import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// ---------- CONFIG - SERVER ONLY - Frontend ki kanipinchadhu Bro ----------
const PRICES: Record<string, Record<string, number>> = {
  tier1: { "per-event": 9, monthly: 29, yearly: 299 },
  tier2: { "per-event": 399, monthly: 999, yearly: 9999 },
  tier3: { "per-event": 35, monthly: 119, yearly: 999 },
  tier4: { "per-event": 29, monthly: 99, yearly: 899 },
};
const FEE_PERCENT: Record<string, number> = { tier1: 3.54, tier2: 2.36, tier3: 3.54, tier4: 3.54 };
const CURRENCY: Record<string, string> = { tier1: "USD", tier2: "INR", tier3: "USD", tier4: "USD" };

const COUNTRY_TO_TIER: Record<string, string> = {
  pakistan: "tier1", bangladesh: "tier1", "sri lanka": "tier1", bhutan: "tier1", nepal: "tier1", other: "tier1",
  india: "tier2",
  uae: "tier3", "united arab emirates": "tier3", qatar: "tier3", "saudi arabia": "tier3", saudi: "tier3", singapore: "tier3", malaysia: "tier3",
  usa: "tier4", us: "tier4", "united states": "tier4", uk: "tier4", "united kingdom": "tier4", canada: "tier4", australia: "tier4", europe: "tier4", germany: "tier4", france: "tier4", italy: "tier4", spain: "tier4", netherlands: "tier4",
};

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys missing in .env.local");
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
}

export async function POST(req: Request) {
  try {
    // 1. LOGIN CHECK - Login lekunda order raadu Bro
    const cookieStore = await cookies();
    const session = cookieStore.get("picqr_session")?.value;
    if (session !== "1" && session !== "logged_in") {
      return NextResponse.json({ error: "Login required. Please login again." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planId, tierId, country, email } = body;

    // 2. INPUT CHECK
    if (!planId || !tierId || !country || !email) {
      return NextResponse.json({ error: "planId, tierId, country, email required" }, { status: 400 });
    }
    if (!["per-event", "monthly", "yearly"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // 3. TIER TAMPER CHECK - India user - USA tier tho order cheyaleru Bro
    // Production lo - Country ni frontend nunchi teeskovadhu - DB nunchi teeskovali
    // Ikkada - Frontend country + DB country - Rendu match avvali Bro
    const supabase = getSupabase();
    const { data: dbUser } = await supabase.from("users").select("country").eq("email", String(email).toLowerCase()).single();
    const realCountry = (dbUser?.country || country).toString().toLowerCase().trim();
    const realTier = COUNTRY_TO_TIER[realCountry];
    if (!realTier) return NextResponse.json({ error: "Invalid country" }, { status: 400 });
    if (realTier !== tierId) {
      return NextResponse.json({ error: "Tier mismatch - Your country price is different" }, { status: 403 });
    }

    // 4. PRICE - Server nunchi matrame Bro - Frontend price ignore Bro
    const base = PRICES[tierId]?.[planId];
    if (!base) return NextResponse.json({ error: "Invalid plan for tier" }, { status: 400 });
    const fee = Math.ceil(base * (FEE_PERCENT[tierId] || 3.54) / 100);
    const total = base + fee;
    const amount = Math.round(total * 100); // Paise / Cents

    // 5. ALREADY ACTIVE CHECK - User ki already same plan active unte - Double payment vaddu Bro
    // User ki loss ravaddu - Double pay cheyakunda apali Bro
    if (dbUser) {
      const { data: activeOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("user_email", String(email).toLowerCase())
        .eq("plan_id", planId)
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(1)
        .single();
      if (activeOrder) {
        return NextResponse.json({ error: "You already have this plan active. No need to pay again." }, { status: 409 });
      }
    }

    // 6. RAZORPAY ORDER CREATE
    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount,
      currency: CURRENCY[tierId],
      receipt: `picqr_${tierId}_${planId}_${Date.now()}`,
      notes: { planId, tierId, country: realCountry, email: String(email).toLowerCase(), base_price: String(base), fee: String(fee), total_price: String(total) },
    });

    // 7. DB LO SAVE - Status = created - Payment ayaka paid ki maruthundi Bro
    // Idi lekunte - Payment vachina kuda - Plan miss avuthundi Bro
    const { error: dbError } = await supabase.from("orders").insert({
      order_id: order.id,
      user_email: String(email).toLowerCase(),
      plan_id: planId,
      tier_id: tierId,
      country: realCountry,
      base_price: base,
      fee,
      total_price: total,
      currency: CURRENCY[tierId],
      status: "created",
    });
    if (dbError) {
      console.error("ORDER DB SAVE FAILED:", dbError);
      // DB fail ayina kuda - Order create ayindi - Kani log cheyi Bro - Manual ga check cheyali Bro
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      basePrice: base,
      fee,
      totalPrice: total,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e: any) {
    console.error("ORDER ERROR:", e);
    return NextResponse.json({ error: e.message || "Order creation failed" }, { status: 500 });
  }
}