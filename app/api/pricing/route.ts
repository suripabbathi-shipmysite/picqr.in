import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIERS: any = {
  tier1: { id: "tier1", label: "Tier 1 - LOW", symbol: "$", currency: "USD", perEvent: 9, monthly: 29, yearly: 299, feePercent: 3.54, isIndia: false },
  tier2: { id: "tier2", label: "Tier 2 - INDIA", symbol: "Rs", currency: "INR", perEvent: 399, monthly: 999, yearly: 9999, feePercent: 2.36, isIndia: true },
  tier3: { id: "tier3", label: "Tier 3 - GULF", symbol: "$", currency: "USD", perEvent: 35, monthly: 119, yearly: 999, feePercent: 3.54, isIndia: false },
  tier4: { id: "tier4", label: "Tier 4 - PREMIUM", symbol: "$", currency: "USD", perEvent: 29, monthly: 99, yearly: 899, feePercent: 3.54, isIndia: false },
};

const COUNTRY_TO_TIER: Record<string, string> = {
  "pakistan": "tier1", "bangladesh": "tier1", "sri lanka": "tier1", "bhutan": "tier1", "nepal": "tier1", "other": "tier1",
  "india": "tier2",
  "uae": "tier3", "united arab emirates": "tier3", "qatar": "tier3", "saudi arabia": "tier3", "saudi": "tier3", "singapore": "tier3", "malaysia": "tier3",
  "usa": "tier4", "us": "tier4", "united states": "tier4", "uk": "tier4", "united kingdom": "tier4", "canada": "tier4", "australia": "tier4", "europe": "tier4", "germany": "tier4", "france": "tier4", "italy": "tier4", "spain": "tier4", "netherlands": "tier4",
};

const CODE_TO_NAME: Record<string, string> = {
  IN: "India", PK: "Pakistan", BD: "Bangladesh", LK: "Sri Lanka", BT: "Bhutan", NP: "Nepal",
  AE: "UAE", QA: "Qatar", SA: "Saudi Arabia", SG: "Singapore", MY: "Malaysia",
  US: "USA", GB: "UK", CA: "Canada", AU: "Australia", DE: "Germany", FR: "France", IT: "Italy", ES: "Spain", NL: "Netherlands",
};

function withFee(base: number, feePercent: number) {
  const fee = Math.ceil(base * feePercent / 100);
  return { fee, total: base + fee };
}

export async function POST(req: Request) {
  // Token check - login lekapothe price ivvam
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser(auth);
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  // LOCKED COUNTRY - DB nundi matrame, IP nundi kadu, localStorage nundi kadu
  const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).single();
  let lockedCountry = profile?.country || "";

  // OLD USER ki country lekapothe - body lo vachina country ni okkasari lock chesi save chey (payment fail avvakunda)
  if (!lockedCountry) {
    try {
      const body = await req.json().catch(() => ({}));
      if (body.country) {
        lockedCountry = body.country;
        await supabase.from("profiles").upsert({ id: user.id, email: user.email, country: lockedCountry });
      }
    } catch {}
  }
  if (!lockedCountry) return NextResponse.json({ error: "Country not locked" }, { status: 400 });

  const tierId = COUNTRY_TO_TIER[lockedCountry.toLowerCase().trim()];
  const tier = TIERS[tierId];
  if (!tier) return NextResponse.json({ error: "Invalid country" }, { status: 400 });

  const build = (id: string, name: string, base: number, events: number, expiry: string, storage: string, desc: string) => {
    const { fee, total } = withFee(base, tier.feePercent);
    return { id, name, basePrice: base, fee, totalPrice: total, events, expiry, storage, desc };
  };

  return NextResponse.json({
    tier,
    lockedCountry,
    plans: [
      { id: "free", name: "Free Trial", basePrice: 0, fee: 0, totalPrice: 0, events: 1, expiry: "12 Hours", storage: "2 GB", desc: "Try PicQR with 1 free event" },
      build("per-event", "Per Event", tier.perEvent, 1, "3 Days", "10 GB", "Perfect for 1 wedding"),
      build("monthly", "Monthly", tier.monthly, 4, "3 Days Per Event", "30 GB", "For regular photographers"),
      build("yearly", "Yearly", tier.yearly, 50, "3 Days Per Event", "200 GB", "Best value for full year"),
    ],
  });
}