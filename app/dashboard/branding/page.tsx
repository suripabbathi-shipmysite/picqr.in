"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Branding() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  const [studioName, setStudioName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [qrId, setQrId] = useState("");
  const [studioLogo, setStudioLogo] = useState<string | null>(null);
  const [watermark, setWatermark] = useState(true);

  // FIX: REAL USER - Login ayina user branding
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login?next=/dashboard/branding"); return; }
      const user = session.user;
      setQrId(`PQ-${user.id.slice(0, 6).toUpperCase()}`);
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (profile) {
        setStudioName(profile.studio_name || "");
        setOwnerName(profile.full_name || "");
        setMobile(profile.mobile || "");
        if (profile.studio_logo) setStudioLogo(profile.studio_logo);
        if (profile.watermark !== undefined) setWatermark(profile.watermark);
      } else {
        const metaName = user.user_metadata?.full_name || "";
        setOwnerName(metaName);
        setStudioName(metaName ? `${metaName} Photography` : "");
      }
      setLoading(false);
    };
    load();
  }, [router]);

  // FIX: REAL LOGO UPLOAD - Supabase Storage ki - Refresh ayina pothadu
  const onLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please select an image file");
    if (file.size > 2 * 1024 * 1024) return setError("Logo must be under 2MB");
    setError("");
    // Instant preview
    const preview = URL.createObjectURL(file);
    setStudioLogo(preview);
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${session.user.id}/logo-${Date.now()}-${cleanName}`;
      const { error: upErr } = await supabase.storage.from("event-photos").upload(fileName, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-photos").getPublicUrl(fileName);
      setStudioLogo(data.publicUrl);
      // DB lo kuda save - Guest page lo kanipinchali ante
      await supabase.from("profiles").update({ studio_logo: data.publicUrl }).eq("id", session.user.id);
      setSavedMsg("Logo uploaded ✅");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err: any) {
      setError(err.message || "Logo upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeLogo = async () => {
    setStudioLogo(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await supabase.from("profiles").update({ studio_logo: null }).eq("id", session.user.id);
    setSavedMsg("Logo removed");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  // FIX: REAL SAVE - Studio Name + Mobile + Watermark -> profiles
  const saveBranding = async () => {
    if (!studioName.trim()) return setError("Please enter studio name");
    setError(""); setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }
    const { error: upErr } = await supabase.from("profiles").upsert({
      id: session.user.id,
      studio_name: studioName.trim(),
      full_name: ownerName.trim(),
      mobile: mobile.trim(),
      studio_logo: studioLogo,
      watermark: watermark,
      qr_id: qrId,
    }, { onConflict: "id" });
    setSaving(false);
    if (upErr) return setError(upErr.message);
    setSavedMsg("Branding Saved Successfully ✅ - Guest page lo kanipistundi");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading branding...</div>;

  const input = { padding: 13, width: '100%', borderRadius: 10, border: '1.5px solid #E5E0F0', marginTop: 12, display: 'block' as const, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const };

  return (
    <div style={{ padding: 30, background: '#F6F4FF', minHeight: '100vh', fontFamily: 'Arial' }}>
      <a href="/dashboard" style={{ color: '#5B00B8', fontWeight: 800, textDecoration: 'none' }}>← Back to Dashboard</a>
      <h1 style={{ marginTop: 12 }}>Studio Branding</h1>
      <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>Your logo, studio name & watermark show on Guest page & QR poster. QR: {qrId}</p>

      <div style={{ background: '#fff', padding: 24, borderRadius: 18, marginTop: 16, maxWidth: 600 }}>
        <p style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>Upload your studio logo - It will show on guest page & watermark</p>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onLogoFile} />
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed #D9D2FF', padding: 24, borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: studioLogo ? '#fff' : '#FAF9FF' }}
        >
          {studioLogo ? (
            <div>
              <img src={studioLogo} alt="Studio Logo" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 12, background: '#fff', border: '1px solid #eee', margin: '0 auto', display: 'block' }} />
              <p style={{ fontSize: 12, color: '#5B00B8', fontWeight: 700, margin: '10px 0 0' }}>{uploading ? "Uploading..." : "Click to change logo"}</p>
              <button onClick={(e) => { e.stopPropagation(); removeLogo(); }} style={{ marginTop: 10, background: '#FFF0F0', color: '#D40000', padding: '8px 16px', borderRadius: 20, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Remove Logo</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 32, margin: 0 }}>📷</p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Drag & Drop Logo Here or Click to Upload</p>
              <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0' }}>PNG / JPG - Under 2MB - Square logo best</p>
              <button style={{ marginTop: 12, background: '#5B00B8', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer' }}>Upload Logo</button>
            </>
          )}
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginTop: 16 }}>Studio Name *</label>
        <input value={studioName} onChange={e => setStudioName(e.target.value)} placeholder="Studio Name - Ex: Your Studio Photography" style={input} />

        <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginTop: 12 }}>Owner Name</label>
        <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Owner Name" style={input} />

        <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginTop: 12 }}>Mobile Number</label>
        <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 90000 00000" style={input} />

        {/* Watermark Toggle */}
        <div style={{ background: '#F8F7FF', borderRadius: 12, padding: 14, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <b style={{ fontSize: 13 }}>Watermark On / Off</b>
            <p style={{ fontSize: 11, color: '#666', margin: '4px 0 0' }}>{watermark ? `ON - "${studioName || "Your Studio"}" logo will show on photos` : "OFF - No logo on photos"}</p>
          </div>
          <button onClick={() => setWatermark(!watermark)} style={{ background: watermark ? '#008000' : '#ccc', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>{watermark ? "ON" : "OFF"}</button>
        </div>

        {/* LIVE PREVIEW - Guest chuse laaga */}
        <div style={{ background: '#0F0A24', borderRadius: 14, padding: 18, marginTop: 16, color: '#fff', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#FFB366', margin: '0 0 10px', letterSpacing: 1 }}>PREVIEW - Guest Will See This:</p>
          {studioLogo ? <img src={studioLogo} alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain', background: '#fff', borderRadius: 10, margin: '0 auto', display: 'block', padding: 6 }} /> : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#5B00B8,#FF7A2F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, margin: '0 auto' }}>{(studioName || "P").slice(0, 1).toUpperCase()}</div>
          )}
          <b style={{ fontSize: 16, display: 'block', marginTop: 10 }}>{studioName || "My Studio"}</b>
          <p style={{ fontSize: 12, color: '#FFB366', margin: '4px 0 0', fontWeight: 700 }}>{mobile || qrId} • Watermark: {watermark ? "ON" : "OFF"}</p>
        </div>

        {error && <p style={{ background: '#FFF0F0', color: '#D00', fontSize: 13, padding: '10px 12px', borderRadius: 10, marginTop: 12 }}>{error}</p>}
        {savedMsg && <p style={{ background: '#E8FFF0', color: '#0A7A2F', fontSize: 13, padding: '10px 12px', borderRadius: 10, marginTop: 12 }}>{savedMsg}</p>}

        <button onClick={saveBranding} disabled={saving} style={{ display: 'block', textAlign: 'center', marginTop: 16, background: saving ? '#999' : 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', padding: 13, borderRadius: 10, fontWeight: 800, width: '100%', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>
          {saving ? "Saving..." : "Save Branding"}
        </button>
      </div>
    </div>
  );
}