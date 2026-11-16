import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const cfCountry = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry");
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip") || forwarded || "unknown";

  if (cfCountry) {
    return NextResponse.json({ country: cfCountry, ip: realIp, source: "vercel-header", isVPN: false });
  }
  try {
    const r = await fetch(`http://ip-api.com/json/${realIp}?fields=countryCode,country,proxy,hosting`, { cache: "no-store" });
    const d = await r.json();
    return NextResponse.json({
      country: d.countryCode || "IN",
      countryName: d.country,
      ip: realIp,
      isVPN: d.proxy === true || d.hosting === true,
      source: "ip-api"
    });
  } catch {
    return NextResponse.json({ country: "IN", ip: realIp, source: "fallback", isVPN: false });
  }
}