"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Plan() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("FREE");
  const [planName, setPlanName] = useState("Free Plan");
  const [planExpiry, setPlanExpiry] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [qrId, setQrId] = useState("");
  const [studioName, setStudioName] = useState("");
  const [country, setCountry] = useState("");
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  // FIX: REAL PLAN - profiles nundi - Hardcoded PRO kadu
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login?next=/dashboard/plan"); return; }
      const qr = `PQ-${session.user.id.slice(0, 6).toUpperCase()}`;
      setQrId(qr);

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (profile) {
        const p = (profile.plan || profile.current_plan || "FREE").toUpperCase();
        setPlan(p);
        setPlanName(profile.plan_name || (p === "FREE" ? "Free Plan" : "Paid Plan"));
        setStudioName(profile.studio_name || `${profile.full_name || ""} Photography`);
        setCountry(profile.country || "");
        if (profile.plan_expiry) {
          setPlanExpiry(new Date(profile.plan_expiry).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
        }
        // Price - Country batti - DB lo unte adi, lekapothe Pricing page lo chudali
        if (profile.plan_price) setPlanPrice(profile.plan_price);
      }

      // FIX: REAL STORAGE - Supabase thumb/ nundi count
      let photoCount = 0;
      const { data: events } = await supabase.from("events").select("qr_id").eq("user_id", session.user.id);
      if (events) {
        setEventsCount(events.length);
        for (const ev of events) {
          const eventId = (ev as any).qr_id;
          if (!eventId) continue;
          const { data: files } = await supabase.storage.from("event-photos").list(`${eventId}/thumb`, { limit: 1000 });
          if (files) photoCount += files.filter(f => f.name !== ".emptyFolderPlaceholder").length;
        }
      }
      // Permanent QR ki direct photos unte
      const { data: qrFiles } = await supabase.storage.from("event-photos").list(`${qr}/thumb`, { limit: 1000 });
      if (qrFiles) {
        const qrCount = qrFiles.filter(f => f.name !== ".emptyFolderPlaceholder").length;
        // Events lo already count ayithe double avvakunda - events lo QR lekapothe matrame kalupu
        if (eventsCount === 0) photoCount = qrCount;
        else if (!events?.some((e: any) => e.qr_id === qr)) photoCount += qrCount;
      }
      setTotalPhotos(photoCount);
      setLoading(false);
    };
    load();
  }, [router, eventsCount]);

  if (loading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading your plan...</div>;

  const isFree = plan === "FREE";
  // Original photos ~4MB each
  const storageUsedGB = (totalPhotos * 4 / 1024).toFixed(2);
  const storageLimitGB = isFree ? 2 : 50;
  const storagePercent = Math.min(100, Math.round((Number(storageUsedGB) / storageLimitGB) * 100));
  const expiryRule = isFree ? "Auto delete in 12 Hours" : "Auto delete in 3 Days";

  return (
    <div style={{ padding: 30, background: '#F6F4FF', minHeight: '100vh', fontFamily: 'Arial' }}>
      <a href="/dashboard" style={{ color: '#5B00B8', fontWeight: 800, textDecoration: 'none' }}>← Back to Dashboard</a>
      <h1 style={{ marginTop: 12 }}>Plan & Usage</h1>
      <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>{studioName} • {qrId} • Country: {country || "Not set"} - Locked for pricing</p>

      <div style={{ background: '#fff', padding: 24, borderRadius: 18, marginTop: 16, maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <b style={{ fontSize: 16 }}>Current Plan: {planName} ({plan})</b>
          <span style={{ fontSize: 11, background: isFree ? '#FFF0F0' : '#E6FFED', color: isFree ? '#D40000' : '#008000', padding: '6px 12px', borderRadius: 20, fontWeight: 800 }}>{isFree ? "FREE" : "PAID ACTIVE"}</span>
        </div>

        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#666', lineHeight: 1.6 }}>
          {isFree ? (
            <>Free Plan • 1 Free Event • No Card Required<br />{expiryRule} • Valid till event expiry</>
          ) : (
            <>{planPrice ? `${planPrice} • ` : ""}Valid till {planExpiry || "Active"} • {expiryRule}</>
          )}
        </p>

        <div style={{ background: '#F8F7FF', borderRadius: 12, padding: 14, marginTop: 14, fontSize: 13, lineHeight: 1.8 }}>
          <b>Usage</b><br />
          Total Events: {eventsCount}<br />
          Total Photos Uploaded: {totalPhotos}<br />
          Permanent QR: {qrId}<br />
          {expiryRule}
        </div>

        <p style={{ fontSize: 13, margin: '16px 0 0' }}>Storage: {storageUsedGB} GB / {storageLimitGB} GB - {storagePercent}% used</p>
        <div style={{ height: 10, background: '#eee', borderRadius: 10, margin: '10px 0' }}>
          <div style={{ width: `${storagePercent}%`, height: 10, background: storagePercent > 90 ? '#FF3B30' : 'linear-gradient(90deg,#5B00B8,#FF7A2F)', borderRadius: 10 }}></div>
        </div>
        <p style={{ fontSize: 11, color: '#888', margin: '0 0 0' }}>
          {isFree ? "Free Limit: 2 GB. Upgrade to Paid for 50 GB." : "Paid Limit: 50 GB."}
          {storagePercent > 90 && " ⚠️ Storage almost full - Delete old photos or upgrade."}
        </p>

        <a href="/pricing" style={{ display: 'block', textAlign: 'center', marginTop: 18, background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', padding: 13, borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>
          {isFree ? "Upgrade Plan - Get 3 Days + 50 GB" : "View / Change Plan"}
        </a>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <a href="/dashboard" style={{ flex: 1, textAlign: 'center', background: '#fff', border: '1.5px solid #E5E0F0', color: '#333', padding: 12, borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>Back to Dashboard</a>
          <a href="/dashboard/events" style={{ flex: 1, textAlign: 'center', background: '#F8F7FF', border: '1.5px solid #EDEBFF', color: '#5B00B8', padding: 12, borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>My Events</a>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 18, borderRadius: 14, marginTop: 14, maxWidth: 600 }}>
        <b style={{ fontSize: 13 }}>All plans include</b>
        <p style={{ fontSize: 12, color: '#666', margin: '6px 0 0', lineHeight: 1.7 }}>
          ✓ Permanent QR Code - Never Expires<br />
          ✓ Selfie Search - Guest finds own photos<br />
          ✓ Original Quality Download<br />
          ✓ No App Needed for Guests
        </p>
      </div>
    </div>
  );
}