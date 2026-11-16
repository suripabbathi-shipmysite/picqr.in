"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Account() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("");
  const [qrId, setQrId] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [planExpiry, setPlanExpiry] = useState("");
  const [studioLogo, setStudioLogo] = useState<string | null>(null);

  // FIX: REAL USER - Suresh kadu, login ayina user
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login?next=/dashboard/account"); return; }
      const user = session.user;
      setEmail(user.email || "");
      const realQr = `PQ-${user.id.slice(0, 6).toUpperCase()}`;
      setQrId(realQr);

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (profile) {
        setOwnerName(profile.full_name || user.user_metadata?.full_name || "");
        setStudioName(profile.studio_name || "");
        setMobile(profile.mobile || "");
        // Country - LOCKED - Marchalemu, Pricing kosam
        setCountry(profile.country || "");
        setPlan((profile.plan || "FREE").toUpperCase());
        if (profile.plan_expiry) setPlanExpiry(new Date(profile.plan_expiry).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
        if (profile.studio_logo) setStudioLogo(profile.studio_logo);
        // QR DB lo lekapothe save chey
        if (!profile.qr_id) {
          await supabase.from("profiles").update({ qr_id: realQr }).eq("id", user.id);
        }
      } else {
        const metaName = user.user_metadata?.full_name || "";
        setOwnerName(metaName);
        setStudioName(metaName ? `${metaName} Photography` : "");
      }
      setLoading(false);
    };
    load();
  }, [router]);

  // FIX: REAL SAVE - Supabase ki
  const saveChanges = async () => {
    if (!ownerName.trim()) return setError("Please enter your name");
    if (!mobile.trim()) return setError("Please enter mobile number");
    setError(""); setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }
    const { error: upErr } = await supabase.from("profiles").upsert({
      id: session.user.id,
      email: email,
      full_name: ownerName.trim(),
      studio_name: studioName.trim() || `${ownerName.trim()} Photography`,
      mobile: mobile.trim(),
      qr_id: qrId,
      // Country ni ikkada update cheyamu - Locked
    }, { onConflict: "id" });
    setSaving(false);
    if (upErr) return setError(upErr.message);
    // LocalStorage sync
    localStorage.setItem("picqr_user_name", ownerName.trim());
    localStorage.setItem("picqr_qr_id", qrId);
    setSavedMsg("Saved Successfully ✅");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("picqr_logged_in");
    window.location.href = "/";
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading your account...</div>;

  const input = { padding: 13, width: '100%', borderRadius: 10, border: '1.5px solid #E5E0F0', marginTop: 12, display: 'block' as const, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const };
  const label = { fontSize: 12, fontWeight: 700, color: '#333', display: 'block' as const, marginTop: 12 };

  const initials = (ownerName || studioName || "P").trim().slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: 30, background: '#F6F4FF', minHeight: '100vh', fontFamily: 'Arial' }}>
      <a href="/dashboard" style={{ color: '#5B00B8', fontWeight: 800, textDecoration: 'none' }}>← Back to Dashboard</a>
      <h1 style={{ marginTop: 12 }}>Account</h1>
      <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>Your details show on Guest page & QR poster. Country is locked for pricing.</p>

      <div style={{ background: '#fff', padding: 24, borderRadius: 18, marginTop: 16, maxWidth: 600 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {studioLogo ? (
            <img src={studioLogo} alt="Studio" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg,#5B00B8,#FF7A2F)', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>{initials}</div>
          )}
          <div>
            <b style={{ fontSize: 16 }}>{ownerName || "My Studio"}</b>
            <p style={{ fontSize: 13, color: '#888', margin: '2px 0 0' }}>{studioName || "Photographer"}</p>
            <p style={{ fontSize: 12, color: '#5B00B8', fontWeight: 800, margin: '2px 0 0' }}>{qrId} • Permanent QR • {plan} Plan</p>
          </div>
        </div>

        <label style={label}>Full Name *</label>
        <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Your full name" style={input} />

        <label style={label}>Studio Name</label>
        <input value={studioName} onChange={e => setStudioName(e.target.value)} placeholder="Studio Name" style={input} />

        <label style={label}>Email - Cannot Change</label>
        <input value={email} disabled style={{ ...input, background: '#F5F5F5', color: '#888', cursor: 'not-allowed' }} />

        <label style={label}>Mobile Number *</label>
        <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 90000 00000" style={input} />

        <label style={label}>Country - Locked 🔒</label>
        <input value={country || "Not set - Contact support to set country"} disabled style={{ ...input, background: '#FFF8E6', color: '#666', cursor: 'not-allowed', fontWeight: 700 }} />
        <p style={{ fontSize: 11, color: '#999', margin: '6px 0 0' }}>Country decides your pricing. It cannot be changed here to prevent price misuse. Contact support if wrong.</p>

        <div style={{ background: '#F8F7FF', borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 1.8, marginTop: 16 }}>
          <b>Plan Details</b><br />
          Current Plan: {plan}<br />
          Permanent QR ID: {qrId}<br />
          {planExpiry ? <>Plan Expiry: {planExpiry}<br /></> : null}
          Guest Link: {typeof window !== "undefined" ? `${window.location.origin}/guest?id=${qrId}` : ""}
        </div>

        {error && <p style={{ background: '#FFF0F0', color: '#D00', fontSize: 13, padding: '10px 12px', borderRadius: 10, marginTop: 12 }}>{error}</p>}
        {savedMsg && <p style={{ background: '#E8FFF0', color: '#0A7A2F', fontSize: 13, padding: '10px 12px', borderRadius: 10, marginTop: 12 }}>{savedMsg}</p>}

        <button onClick={saveChanges} disabled={saving} style={{ display: 'block', textAlign: 'center', marginTop: 16, background: saving ? '#999' : 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', padding: 13, borderRadius: 10, fontWeight: 800, width: '100%', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <a href="/dashboard" style={{ flex: 1, textAlign: 'center', background: '#fff', border: '1.5px solid #E5E0F0', color: '#333', padding: 12, borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>Back to Dashboard</a>
          <button onClick={logout} style={{ flex: 1, background: '#FFF0F0', border: 'none', color: '#D00', padding: 12, borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}