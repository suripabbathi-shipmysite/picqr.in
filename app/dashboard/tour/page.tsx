"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STEPS = [
  {
    title: "Step 1: Create Event",
    desc: "Event peru & date petti Create chey. Nee Permanent QR ke event link avutundi - Kotta QR raadu.",
    action: "Create Event",
    link: "/dashboard/new-event",
    icon: "📅",
  },
  {
    title: "Step 2: Upload Photos",
    desc: "Event photos upload chey. Original Quality lo save avutayi, Guest ki Thumb tho fast ga kanipistayi.",
    action: "Upload Photos",
    link: "/upload",
    icon: "📷",
  },
  {
    title: "Step 3: Share QR with Guests",
    desc: "Nee Permanent QR ni print chesi venue lo pettu, leka Guest Link ni WhatsApp lo pampu. Okate QR - anni events ki.",
    action: "Download QR",
    link: "/dashboard",
    icon: "🔳",
  },
  {
    title: "Step 4: Guests Scan & Download",
    desc: "Guests QR scan chesi, Selfie teesi, vaalla photos matrame chusi, Original Quality lo download chesukuntaru. No App Needed.",
    action: "Test Guest View",
    link: "", // Dynamic - Guest link
    icon: "🎉",
  },
];

export default function Tour() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [userQrId, setUserQrId] = useState("");
  const [studioName, setStudioName] = useState("");
  const [origin, setOrigin] = useState("https://picqr.in");
  const [copied, setCopied] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login?next=/dashboard/tour"); return; }
      setUserQrId(`PQ-${session.user.id.slice(0, 6).toUpperCase()}`);
      const { data: profile } = await supabase.from("profiles").select("studio_name, full_name").eq("id", session.user.id).maybeSingle();
      if (profile) setStudioName(profile.studio_name || `${profile.full_name || ""} Photography`);
    };
    load();
  }, [router]);

  const guestLink = userQrId ? `${origin}/guest?id=${userQrId}` : "";
  const qrUrl = userQrId ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(guestLink)}` : "";
  const step = STEPS[current];

  const goAction = () => {
    if (current === 2) { router.push("/dashboard"); return; }
    if (current === 3) { if (guestLink) router.push(guestLink); return; }
    router.push(step.link);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(guestLink); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: 30, background: '#F6F4FF', minHeight: '100vh', fontFamily: 'Arial' }}>
      <a href="/dashboard" style={{ color: '#5B00B8', fontWeight: 800, textDecoration: 'none' }}>← Back to Dashboard</a>
      <h1 style={{ marginTop: 12 }}>Take a Tour - How PicQR Works</h1>
      <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>{studioName} • Your Permanent QR: <b style={{ color: '#5B00B8' }}>{userQrId}</b></p>

      <div style={{ background: '#fff', padding: 24, borderRadius: 18, marginTop: 16, maxWidth: 600 }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{ flex: 1, height: 6, borderRadius: 10, background: i <= current ? 'linear-gradient(90deg,#5B00B8,#FF7A2F)' : '#eee', cursor: 'pointer' }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#999', margin: '0 0 12px' }}>Step {current + 1} of {STEPS.length} - Click on progress to jump</p>

        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 48, margin: 0 }}>{step.icon}</p>
          <h2 style={{ fontSize: 20, margin: '10px 0 8px' }}>{step.title}</h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
        </div>

        {/* Step 3 lo QR chupinchu */}
        {current === 2 && userQrId && (
          <div style={{ background: '#F8F7FF', borderRadius: 12, padding: 14, textAlign: 'center', marginTop: 12 }}>
            <img src={qrUrl} alt={`QR ${userQrId}`} style={{ width: 130, height: 130, display: 'block', margin: '0 auto', background: '#fff', padding: 8, borderRadius: 8 }} />
            <b style={{ fontSize: 13, display: 'block', marginTop: 8 }}>{userQrId} • Permanent QR</b>
            <p style={{ fontSize: 11, color: '#666', wordBreak: 'break-all', margin: '4px 0 0' }}>{guestLink}</p>
            <button onClick={copyLink} style={{ background: '#fff', border: '1.5px solid #EDEBFF', padding: '8px 16px', borderRadius: 20, fontWeight: 700, cursor: 'pointer', marginTop: 10, fontSize: 12 }}>{copied ? "Copied!" : "Copy Guest Link"}</button>
          </div>
        )}

        {/* Step 4 lo Guest flow */}
        {current === 3 && (
          <div style={{ background: '#E8FFF0', borderRadius: 12, padding: 14, marginTop: 12, fontSize: 13, lineHeight: 1.8 }}>
            <b>Guest Flow:</b><br />
                        1. Guest QR Scan chestadu<br />
                        2. Selfie teestadu<br />
                        3. Face Match - Vaalla photos matrame vastayi<br />
                        4. Original Quality Download
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} style={{ flex: 1, background: '#fff', border: '1.5px solid #EDEBFF', padding: 13, borderRadius: 10, fontWeight: 800, cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.5 : 1 }}>← Previous</button>
          {current < STEPS.length - 1 ? (
            <button onClick={() => setCurrent(current + 1)} style={{ flex: 1, background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', padding: 13, borderRadius: 10, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Next →</button>
          ) : (
            <button onClick={() => router.push("/dashboard/new-event")} style={{ flex: 1, background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', padding: 13, borderRadius: 10, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Start Now →</button>
          )}
        </div>

        <button onClick={goAction} style={{ display: 'block', textAlign: 'center', marginTop: 12, background: '#111', color: '#fff', padding: 13, borderRadius: 10, fontWeight: 800, width: '100%', border: 'none', cursor: 'pointer' }}>
          {step.action} →
        </button>

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ background: i === current ? '#0F0A24' : '#F8F7FF', color: i === current ? '#fff' : '#333', border: '1px solid #EDEBFF', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{s.icon} {s.title.replace("Step ", "").split(":")[0]}</button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', padding: 16, borderRadius: 14, marginTop: 14, maxWidth: 600, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div><b style={{ fontSize: 13 }}>Need Help?</b><p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>Free Event: Photos delete in 12 Hours. Paid: 3 Days.</p></div>
        <a href="/pricing" style={{ background: '#5B00B8', color: '#fff', padding: '10px 18px', borderRadius: 20, fontWeight: 800, fontSize: 12, textDecoration: 'none', alignSelf: 'center' }}>See Pricing</a>
      </div>
    </div>
  );
}