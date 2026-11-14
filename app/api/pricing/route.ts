import { NextRequest, NextResponse } from "next/server";

const PRICING: Record<string, { currency: string; symbol: string; perEvent: number; monthly: number; yearly: number }> = {
  IN: { currency: "INR", symbol: "Rs", perEvent: 399, monthly: 999, yearly: 9999 },
  PK: { currency: "USD", symbol: "$", perEvent: 4, monthly: 12, yearly: 119 },
  BD: { currency: "USD", symbol: "$", perEvent: 4, monthly: 12, yearly: 119 },
  NP: { currency: "USD", symbol: "$", perEvent: 4, monthly: 12, yearly: 119 },
  LK: { currency: "USD", symbol: "$", perEvent: 4, monthly: 12, yearly: 119 },
  BT: { currency: "USD", symbol: "$", perEvent: 4, monthly: 12, yearly: 119 },
  AE: { currency: "USD", symbol: "$", perEvent: 15, monthly: 39, yearly: 349 },
  QA: { currency: "USD", symbol: "$", perEvent: 15, monthly: 39, yearly: 349 },
  SA: { currency: "USD", symbol: "$", perEvent: 15, monthly: 39, yearly: 349 },
  SG: { currency: "USD", symbol: "$", perEvent: 15, monthly: 39, yearly: 349 },
  MY: { currency: "USD", symbol: "$", perEvent: 15, monthly: 39, yearly: 349 },
  US: { currency: "USD", symbol: "$", perEvent: 29, monthly: 99, yearly: 899 },
  GB: { currency: "USD", symbol: "$", perEvent: 29, monthly: 99, yearly: 899 },
  CA: { currency: "USD", symbol: "$", perEvent: 29, monthly: 99, yearly: 899 },
  AU: { currency: "USD", symbol: "$", perEvent: 29, monthly: 99, yearly: 899 },
  DE: { currency: "USD", symbol: "$", perEvent: 29, monthly: 99, yearly: 899 },
  FR: { currency: "USD", symbol: "$", perEvent: 29, monthly: 99, yearly: 899 },
};

export async function GET(req: NextRequest) {
  const ipCountry = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "IN";
  const accountCountry = req.cookies.get("picqr_country")?.value || ipCountry;
  if (ipCountry !== accountCountry) {
    return NextResponse.json({ locked: true, message: "Price locked to your account country. Turn off VPN to see your pricing.", accountCountry, ipCountry });
  }
  const price = PRICING[accountCountry] || PRICING["US"];
  return NextResponse.json({
    locked: false, country: accountCountry, currency: price.currency, symbol: price.symbol,
    plans: [
      { id: "free", name: "Free Trial", price: 0, events: 1, expiry: "12 Hours", storage: "2 GB", desc: "1 Free Event - Try PicQR" },
      { id: "per-event", name: "Per Event", price: price.perEvent, events: 1, expiry: "3 Days", storage: "10 GB", desc: "1 Event - Perfect for 1 wedding" },
      { id: "monthly", name: "Monthly", price: price.monthly, events: 4, expiry: "3 Days Per Event", storage: "30 GB", desc: "4 Events - Best for regular photographers" },
      { id: "yearly", name: "Yearly", price: price.yearly, events: 50, expiry: "3 Days Per Event", storage: "200 GB", desc: "50 Events - Best value - Save more" },
    ]
  });
}