"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewEvent() {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [userQrId, setUserQrId] = useState("");
  const [studioName, setStudioName] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [planName, setPlanName] = useState("Free Plan");
  const [existingEvents, setExistingEvents] = useState(0);

  // FIX: Real User + Real Plan
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login?next=/dashboard/new-event"); return; }
      const qr = `PQ-${session.user.id.slice(0, 6).toUpperCase()}`;
      setUserQrId(qr);
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (profile) {
        setStudioName(profile.studio_name || `${profile.full_name || ""} Photography`);
        const p = (profile.plan || "FREE").toUpperCase();
        setPlan(p);
        setPlanName(profile.plan_name || (p === "FREE" ? "Free Plan" : "Paid Plan"));
      }
      // Already events unte count - Free user ki 1 free event rule kosam
      const { data: evs } = await supabase.from("events").select("id").eq("user_id", session.user.id);
      if (evs) setExistingEvents(evs.length);
      setLoading(false);
    };
    load();
  }, [router]);

  // FIX: REAL CREATE - Supabase events table lo
  const createEvent = async () => {
    if (!eventName.trim()) return setError("Please enter event name - Ex: Raj & Anjali Wedding");
    if (!eventDate) return setError("Please select event date");
    setError(""); setCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    // PicQR Logic: ONE Permanent QR - Event ki kotta QR kaadu, nee Permanent QR ne vadutam
    // Event name/date ni aa QR ki link chestam
    const { data: existing } = await supabase.from("events").select("id").eq("user_id", session.user.id).eq("qr_id", userQrId).maybeSingle();

    let result;
    if (existing) {
      // Same QR ki event undi - Update chey (Peru / Date marchu)
      result = await supabase.from("events").update({
        name: eventName.trim(),
        date: eventDate,
        plan: plan,
        status: "Active",
      }).eq("id", existing.id).select().single();
    } else {
      result = await supabase.from("events").insert({
        user_id: session.user.id,
        qr_id: userQrId, // Permanent QR - Kottha QR kaadu
        name: eventName.trim(),
        date: eventDate,
        plan: plan,
        status: "Active",
        downloads: 0,
        scans: 0,
      }).select().single();
    }

    setCreating(false);
    if (result.error) return setError(result.error.message);

    setSuccess(`Event Created ✅ - Your Permanent QR: ${userQrId}`);
    // Upload ki pampu - Photos akkade upload chestaru
    setTimeout(() => router.push(`/upload?event=${userQrId}`), 800);
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading...</div>;

  const isFree = plan === "FREE";
  const expiryText = isFree ? "Auto delete in 12 Hours" : "Auto delete in 3 Days";
  const input = { padding: 13, width: '100%', borderRadius: 10, border: '1.5px solid #E5E0F0', marginBottom: 12, display: 'block' as const, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const };

  return (
    <div style={{ padding: 30, background: '#F6F4FF', minHeight: '100vh', fontFamily: 'Arial' }}>
      <a href="/dashboard" style={{ color: '#5B00B8', fontWeight: 800, textDecoration: 'none' }}>← Back to Dashboard</a>
      <h1 style={{ marginTop: 16 }}>Create New Event</h1>
      <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>Studio: {studioName} • Your Permanent QR: <b style={{ color: '#5B00B8' }}>{userQrId}</b> • Same QR for all events</p>

      {existingEvents > 0 && (
        <div style={{ background: '#FFF8E6', border: '1px solid #FFE08A', padding: 12, borderRadius: 12, marginTop: 14, maxWidth: 600, fontSize: 13 }}>
          ⚠️ You already have an event on this QR. Creating again will update name/date for same QR - <b>{userQrId}</b>. Photos already uploaded will stay.
        </div>
      )}

      <div style={{ background: '#fff', padding: 24, borderRadius: 18, marginTop: 16, maxWidth: 600 }}>
        <label style={{ fontSize: 12, fontWeight: 700 }}>Event Name *</label>
        <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Event Name - Ex: Raj & Anjali Wedding" style={input} />

        <label style={{ fontSize: 12, fontWeight: 700 }}>Event Date *</label>
        <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={input} />

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: 12, border: isFree ? '1.5px solid #E5E0F0' : '1.5px solid #5B00B8', borderRadius: 10, background: isFree ? '#fff' : '#F7F3FF' }}>
            <b>{isFree ? "Free Plan" : planName}</b>
            <p style={{ fontSize: 12, margin: '4px 0 0', color: '#666' }}>{isFree ? "1 Free Event • No Card Required" : "Paid Plan Active"}</p>
            <p style={{ fontSize: 11, color: '#5B00B8', fontWeight: 700, margin: '4px 0 0' }}>{isFree ? "Current Plan" : "Your Plan"}</p>
          </div>
          <div style={{ flex: 1, padding: 12, border: '1.5px solid #E5E0F0', borderRadius: 10 }}>
            <b>Validity</b>
            <p style={{ fontSize: 12, margin: '4px 0 0', color: '#666' }}>{expiryText}</p>
            <p style={{ fontSize: 11, color: '#D40000', fontWeight: 700, margin: '4px 0 0' }}>{isFree ? "Upgrade for 3 Days" : "3 Days Rule"}</p>
          </div>
        </div>

        <div style={{ background: '#F8F7FF', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 12, lineHeight: 1.7 }}>
          <b>Your QR will be:</b><br />
          Permanent QR: {userQrId}<br />
          Guest Link: {typeof window !== "undefined" ? `${window.location.origin}/guest?id=${userQrId}` : ""}<br />
          Print once, use forever.
        </div>

        {error && <p style={{ background: '#FFF0F0', color: '#D00', fontSize: 13, padding: '10px 12px', borderRadius: 10, marginTop: 12 }}>{error}</p>}
        {success && <p style={{ background: '#E8FFF0', color: '#0A7A2F', fontSize: 13, padding: '10px 12px', borderRadius: 10, marginTop: 12 }}>{success}</p>}

        <button onClick={createEvent} disabled={creating} style={{ display: 'block', textAlign: 'center', marginTop: 16, background: creating ? '#999' : 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', padding: 13, borderRadius: 10, fontWeight: 800, width: '100%', border: 'none', cursor: creating ? 'not-allowed' : 'pointer', fontSize: 14 }}>
          {creating ? "Creating Event..." : "+ Create Event & Go to Upload"}
        </button>

        <a href="/dashboard/events" style={{ display: 'block', textAlign: 'center', marginTop: 10, fontSize: 13, color: '#666' }}>View My Events</a>
        {isFree && <a href="/pricing" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 13, color: '#5B00B8', fontWeight: 700 }}>Upgrade to Paid - Get 3 Days Validity</a>}
      </div>
    </div>
  );
}