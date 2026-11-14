"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo";

type EventItem = {
  id: string;
  name: string;
  date: string;
  photos: number;
  downloads: number;
  scans: number;
  selfieSearch: number;
  status: string;
  createdAt: number;
  plan: "FREE" | "PAID";
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('picqr-db', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getRealPhotoCount(eventId: string): Promise<number> {
  try {
    const db = await openDB();
    const tx = db.transaction('photos', 'readonly');
    const req = tx.objectStore('photos').get(`picqr_photos_${eventId}`);
    return await new Promise((res) => {
      req.onsuccess = () => res(req.result ? req.result.value.length : 0);
      req.onerror = () => res(0);
    });
  } catch { return 0; }
}

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"home" | "events" | "branding" | "account">("home");
  const [showAnn, setShowAnn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [studioName, setStudioName] = useState("Suresh Photography");
  const [ownerName, setOwnerName] = useState("Suresh Pabbathi");
  const [mobile, setMobile] = useState("+91 90000 00000");
  const [studioLogo, setStudioLogo] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [watermark, setWatermark] = useState(true);
  const [plan] = useState<"FREE" | "PAID">("FREE");
  const [planExpiry] = useState("2026-11-11, 06:00 PM");
  const [origin, setOrigin] = useState("https://picqr.in");
  const [realPhotos, setRealPhotos] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const guestLink = `${origin}/guest?id=SP-8821`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(guestLink)}`;
  const [events] = useState<EventItem[]>([
    { id: "SP-8821", name: "Suresh + Anitha Wedding", date: "2026-11-09", photos: 142, downloads: 58, scans: 180, selfieSearch: 97, status: "Active", createdAt: Date.now() - 4 * 3600 * 1000, plan: "FREE" },
    { id: "SP-8820", name: "Rahul + Priya Reception", date: "2026-11-02", photos: 98, downloads: 20, scans: 85, selfieSearch: 42, status: "Expired", createdAt: Date.now() - 8 * 24 * 3600 * 1000, plan: "PAID" },
    { id: "SP-8819", name: "Vikram Engagement", date: "2026-10-25", photos: 57, downloads: 0, scans: 40, selfieSearch: 18, status: "Expired", createdAt: Date.now() - 16 * 24 * 3600 * 1000, plan: "PAID" },
  ]);
  const loadRealCounts = async () => {
    setRefreshing(true);
    const counts: Record<string, number> = {};
    for (const ev of events) {
      counts[ev.id] = await getRealPhotoCount(ev.id);
    }
    setRealPhotos(counts);
    setRefreshing(false);
  };
  useEffect(() => { loadRealCounts(); }, []);
  const getDisplayPhotos = (ev: EventItem) => {
    if (realPhotos[ev.id] !== undefined && realPhotos[ev.id] > 0) return realPhotos[ev.id];
    if (ev.id === "SP-8821" && realPhotos[ev.id] === 0) return 0;
    return ev.photos;
  };
  const totalPhotos = events.reduce((a, e) => a + getDisplayPhotos(e), 0);
  const totalDownloads = events.reduce((a, e) => a + e.downloads, 0);
  const totalScans = events.reduce((a, e) => a + e.scans, 0);
  const totalSelfie = events.reduce((a, e) => a + e.selfieSearch, 0);
  const storageUsedGB = (totalPhotos * 1.2 / 1024).toFixed(2);
  const storageLimitGB = plan === "FREE" ? 2 : 50;
  const storagePercent = Math.min(100, Math.round((Number(storageUsedGB) / storageLimitGB) * 100));
  const getExpiryText = (ev: EventItem) => {
    const hours = ev.plan === "FREE" ? 12 : 72;
    const expiryTime = ev.createdAt + hours * 3600 * 1000;
    const left = expiryTime - Date.now();
    if (left <= 0) return "Deleted - Auto Delete Done";
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `Auto Delete in ${h}h ${m}m - ${ev.plan === "FREE" ? "12 Hours Rule" : "3 Days Rule"}`;
  };
  const copyLink = async () => {
    const link = guestLink;
    try { await navigator.clipboard.writeText(link); } catch { const t = document.createElement("textarea"); t.value = link; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const downloadQR = async () => {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "picqr-SP-8821.png"; a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = qrUrl; a.download = "picqr-SP-8821.png"; a.target = "_blank"; a.click();
    }
  };
  const go = (path: string) => { router.push(path); };
  const openEvent = (id: string) => go(`/events?id=${id}`);
  const openUpload = (id: string) => go(`/upload?event=${id}`);
  const logout = () => { document.cookie = "picqr_session=; path=/; max-age=0"; localStorage.removeItem("picqr_logged_in"); window.location.href = "/"; };
  const saveProfile = () => { setSavedMsg("Saved Successfully"); setTimeout(() => setSavedMsg(""), 2500); };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; setStudioLogo(URL.createObjectURL(file)); };
  const removeLogo = () => setStudioLogo(null);
  const sideLink = { display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10, color: '#ccc', fontSize: 13, cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', textAlign: 'left' as const };
  const sideActive = { ...sideLink, background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', fontWeight: 800 };
  const stat = { background: '#fff', border: '1px solid #EDEBFF', borderRadius: 14, padding: 14, flex: '1 1 130px', minWidth: 130 };
  const input = { width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #EDEBFF', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const label = { fontSize: 11, fontWeight: 700, color: '#333', display: 'block' as const, marginBottom: 4 };
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial', background: '#F8F7FF' }}>
      <div style={{ width: 240, background: '#0F0A24', color: '#fff', padding: '18px 14px', flexShrink: 0 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '6px 10px', display: 'inline-block', lineHeight: 0 }}><Logo dark={false} /></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#1A1230', padding: 10, borderRadius: 12, marginTop: 16 }}>
          {studioLogo ? (<img src={studioLogo} alt="Studio" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#fff' }} />) : (<div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg,#5B00B8,#FF7A2F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{studioName.slice(0, 1).toUpperCase()}</div>)}
          <div style={{ minWidth: 0 }}><b style={{ fontSize: 12, display: 'block', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{studioName}</b><p style={{ fontSize: 10, color: '#aaa', margin: '2px 0 0' }}>{ownerName}</p><p style={{ fontSize: 10, color: '#FFB366', margin: '2px 0 0', fontWeight: 700 }}>{mobile}</p></div>
        </div>
        <p style={{ fontSize: 10, color: '#888', margin: '16px 6px 6px' }}>WORKSPACE</p>
        <button onClick={() => setTab("home")} style={tab === "home" ? sideActive : sideLink}>Home</button>
        <button onClick={() => setTab("events")} style={tab === "events" ? sideActive : sideLink}>Events ({events.length})</button>
        <button onClick={() => setTab("branding")} style={tab === "branding" ? sideActive : sideLink}>Studio Branding</button>
        <p style={{ fontSize: 10, color: '#888', margin: '16px 6px 6px' }}>ACCOUNT</p>
        <button onClick={() => setTab("account")} style={tab === "account" ? sideActive : sideLink}>Account</button>
        <a href="/pricing" style={{ ...sideLink, textDecoration: 'none' }}>Pricing</a>
        <button onClick={logout} style={{ ...sideLink, color: '#FF7A2F' }}>Sign Out</button>
        <div style={{ background: '#FFF0F0', borderRadius: 12, padding: 12, marginTop: 16, color: '#111' }}><b style={{ fontSize: 11, color: '#D40000' }}>{plan === "FREE" ? "FREE EVENT USED" : "PAID PLAN ACTIVE"}</b><p style={{ fontSize: 10, lineHeight: 1.5, margin: '6px 0' }}>{plan === "FREE" ? "Free Event: Photos delete in 12 Hours." : "Paid Event: Photos delete in 3 Days."}<br />Plan Expiry: {planExpiry}</p><a href="/pricing" style={{ display: 'block', textAlign: 'center', background: '#FF3B30', color: '#fff', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>Upgrade Now</a></div>
        <div style={{ background: '#FFF8E6', borderRadius: 12, padding: 12, marginTop: 12, color: '#111' }}><b style={{ fontSize: 11 }}>Reminder</b><p style={{ fontSize: 10, lineHeight: 1.5, margin: '4px 0 0' }}>Your free event photos will auto delete soon. Download backup before expiry.</p></div>
      </div>
      <div style={{ flex: 1, padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div><p style={{ fontSize: 12, color: '#888', margin: 0 }}>Welcome, {ownerName}</p><h1 style={{ fontSize: 22, margin: '2px 0 0', textTransform: 'capitalize' }}>{tab}</h1></div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={loadRealCounts} style={{ background: '#fff', border: '1.5px solid #EDEBFF', padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, color: '#5B00B8', cursor: 'pointer' }}>{refreshing ? 'Refreshing...' : 'Refresh Counts'}</button>
            <a href="/pricing" style={{ background: '#fff', border: '1.5px solid #EDEBFF', padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, color: '#5B00B8', textDecoration: 'none' }}>Pricing</a>
            <div style={{ position: 'relative' }}><button onClick={() => setShowAnn(!showAnn)} style={{ background: '#FFF0FF', border: '1.5px solid #EDEBFF', padding: '8px 14px', borderRadius: 20, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Announcements <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>3</span></button>{showAnn && (<div style={{ position: 'absolute', top: 42, right: 0, width: 320, background: '#fff', borderRadius: 16, border: '1px solid #EDEBFF', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', padding: 14, zIndex: 50 }}><b>Announcements</b><p style={{ fontSize: 13, margin: '10px 0' }}>One Free Event - Try PicQR Free, No Card Required</p><p style={{ fontSize: 13 }}>QR Code is Permanent - Never Expires</p><a href="/pricing" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', padding: '10px', borderRadius: 20, fontWeight: 800, fontSize: 13, textDecoration: 'none', marginTop: 12 }}>See Pricing</a></div>)}</div>
            <a href="/pricing" style={{ background: '#FF3B30', color: '#fff', padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Upgrade to Create Event</a>
          </div>
        </div>
        {tab === "home" && (
          <>
            <div style={{ background: '#FFF0F0', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', marginTop: 14 }}><div><b style={{ fontSize: 13, color: '#D40000' }}>Your Free Event is Completed!</b><p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>Free Event used. Upgrade - Next event photos delete in 3 Days.</p></div><a href="/pricing" style={{ background: '#FF3B30', color: '#fff', padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 12, textDecoration: 'none' }}>Upgrade Now</a></div>
            <div style={{ background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', borderRadius: 16, padding: 18, display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 14, color: '#fff', alignItems: 'center', flexWrap: 'wrap' }}>
              <div><b>Your Permanent QR - One QR For All Events</b><p style={{ fontSize: 12, opacity: 0.9 }}>Only QR - SP-8821. Print once, use forever. Studio: {studioName}</p><p style={{ fontSize: 11, background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: 8, wordBreak: 'break-all' }}>{guestLink}</p><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button onClick={downloadQR} style={{ background: '#fff', color: '#5B00B8', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Download QR</button><button onClick={() => setShowPoster(true)} style={{ background: '#111', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Download QR As Poster</button><button onClick={copyLink} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '8px 16px', borderRadius: 20, cursor: 'pointer' }}>{copied ? 'Copied!' : 'Copy Guest Link'}</button><button onClick={() => router.push(guestLink)} style={{ background: '#FF7A2F', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Open Guest Page</button></div></div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', color: '#111' }}><img src={qrUrl} alt="Permanent QR SP-8821" style={{ width: 140, height: 140, display: 'block', margin: '0 auto' }} /><p style={{ fontSize: 10, fontWeight: 800, margin: '6px 0 0' }}>SP-8821 • Permanent QR</p><p style={{ fontSize: 10, color: '#666', margin: '2px 0 0' }}>Scan to open Guest Page</p><p style={{ fontSize: 10, color: '#5B00B8', fontWeight: 700, margin: '2px 0 0' }}>{getDisplayPhotos(events[0])} Photos Linked</p></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>{[{ l: 'Total Events', v: String(events.length) }, { l: 'Total Upload Images', v: String(totalPhotos) }, { l: 'Total Download Images', v: String(totalDownloads) }, { l: 'QR Scans - Total Users', v: String(totalScans) }, { l: 'Selfie Search Count', v: String(totalSelfie) }, { l: 'Current Plan', v: plan }].map((s, i) => (<div key={i} style={stat}><p style={{ fontSize: 11, color: '#888', margin: 0 }}>{s.l}</p><p style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 0' }}>{s.v}</p></div>))}</div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 16, marginTop: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ fontSize: 13 }}>Storage Used</b><span style={{ fontSize: 12 }}>{storageUsedGB} GB / {storageLimitGB} GB - {storagePercent}%</span></div><div style={{ background: '#F0F0F0', height: 10, borderRadius: 20, marginTop: 10, overflow: 'hidden' }}><div style={{ width: `${storagePercent}%`, background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', height: '100%' }}></div></div><p style={{ fontSize: 11, color: '#888', margin: '8px 0 0' }}>Free Plan Limit: 2 GB. Paid Plan Limit: 50 GB.</p></div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 16, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><b style={{ fontSize: 13 }}>Watermark On / Off</b><p style={{ fontSize: 11, color: '#666', margin: '4px 0 0' }}>{watermark ? `ON - ${studioName} logo will show on photos` : "OFF - No logo on photos"}</p></div><button onClick={() => setWatermark(!watermark)} style={{ background: watermark ? '#008000' : '#ccc', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>{watermark ? "ON" : "OFF"}</button></div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 16, marginTop: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b>Latest Event</b><button onClick={() => setTab("events")} style={{ background: 'none', border: 'none', color: '#5B00B8', fontWeight: 800, cursor: 'pointer' }}>View Events →</button></div>{events.slice(0, 1).map(ev => (<div key={ev.id} style={{ border: '1px solid #EDEBFF', borderRadius: 12, padding: 14, marginTop: 12 }}><b>{ev.name}</b><p style={{ fontSize: 12, color: '#666', margin: '6px 0 0' }}>ID: {ev.id} • Date: {ev.date} • Uploads: {getDisplayPhotos(ev)} • Downloads: {ev.downloads}</p><div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}><button onClick={() => openEvent(ev.id)} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Open Event</button><button onClick={() => openUpload(ev.id)} style={{ background: '#FF7A2F', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Upload Photos</button><button onClick={() => router.push(`/guest?id=${ev.id}`)} style={{ background: '#111', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Test Guest View</button></div></div>))}</div>
          </>
        )}
        {tab === "events" && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 16, marginTop: 14 }}><b>Event History - All Events</b><p style={{ fontSize: 12, color: '#666' }}>Free Events auto delete in 12 Hours. Paid Events auto delete in 3 Days.</p>{events.map(ev => (<div key={ev.id} style={{ border: '1px solid #EDEBFF', borderRadius: 12, padding: 14, marginTop: 12, background: '#fff' }}><div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}><b style={{ fontSize: 14 }}>{ev.name}</b><span style={{ fontSize: 11, background: ev.plan === "FREE" ? '#FFF0F0' : '#E6FFED', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>{ev.plan} • {ev.status}</span></div><p style={{ fontSize: 12, color: '#666', margin: '6px 0' }}>ID: {ev.id} • Date: {ev.date} • Uploads: {getDisplayPhotos(ev)} • Downloads: {ev.downloads} • Scans: {ev.scans} • Selfie Search: {ev.selfieSearch}</p><p style={{ fontSize: 12, color: '#D40000', fontWeight: 700, margin: 0 }}>{getExpiryText(ev)}</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}><button type="button" onClick={() => openEvent(ev.id)} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Open Event</button><button type="button" onClick={() => openUpload(ev.id)} style={{ background: '#FF7A2F', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Upload Photos</button></div></div>))}</div>
        )}
        {tab === "branding" && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 16, marginTop: 14, maxWidth: 520 }}><b>Studio Branding</b><p style={{ fontSize: 12, color: '#666' }}>This logo and studio name will show on guest page and QR page.</p><div style={{ marginBottom: 12, marginTop: 12 }}><label style={label}>Studio Name</label><input style={input} value={studioName} onChange={e => setStudioName(e.target.value)} placeholder="Studio Name" /></div><div style={{ marginBottom: 12 }}><label style={label}>Mobile Number</label><input style={input} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 90000 00000" /></div><div style={{ marginBottom: 12 }}><label style={label}>Photographer Logo</label><input type="file" accept="image/*" onChange={handleLogoUpload} /></div><div style={{ background: '#F8F7FF', border: '1px solid #EDEBFF', borderRadius: 12, padding: 14 }}><p style={{ fontSize: 11, fontWeight: 700, color: '#888', margin: '0 0 10px' }}>PREVIEW - Guest Will See This:</p>{studioLogo ? (<div><img src={studioLogo} alt="Studio Logo" style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 12, background: '#fff', border: '1px solid #eee', display: 'block' }} /><b style={{ fontSize: 14, display: 'block', marginTop: 8 }}>{studioName}</b><p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>{mobile}</p><button onClick={removeLogo} style={{ background: '#FFF0F0', color: '#D40000', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>Remove Logo</button></div>) : (<div style={{ background: '#0F0A24', borderRadius: 12, padding: 16, color: '#fff', textAlign: 'center' }}><div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#5B00B8,#FF7A2F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, margin: '0 auto' }}>{studioName.slice(0, 1).toUpperCase()}</div><b style={{ fontSize: 16, display: 'block', marginTop: 10 }}>{studioName}</b><p style={{ fontSize: 13, color: '#FFB366', margin: '4px 0 0', fontWeight: 700 }}>{mobile}</p></div>)}</div><div style={{ background: '#F8F7FF', borderRadius: 10, padding: 12, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><b style={{ fontSize: 13 }}>Watermark</b><p style={{ fontSize: 11, color: '#666', margin: 0 }}>{watermark ? `ON - ${studioName}` : "OFF"}</p></div><button onClick={() => setWatermark(!watermark)} style={{ background: watermark ? '#008000' : '#ccc', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>{watermark ? "ON" : "OFF"}</button></div><button onClick={saveProfile} style={{ width: '100%', background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', marginTop: 12 }}>Save Branding</button>{savedMsg && <p style={{ color: 'green', fontSize: 12, textAlign: 'center' }}>{savedMsg}</p>}</div>
        )}
        {tab === "account" && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 16, marginTop: 14, maxWidth: 520 }}><b>Account Details</b><div style={{ marginBottom: 12, marginTop: 12 }}><label style={label}>Owner Name</label><input style={input} value={ownerName} onChange={e => setOwnerName(e.target.value)} /></div><div style={{ marginBottom: 12 }}><label style={label}>Studio Name</label><input style={input} value={studioName} onChange={e => setStudioName(e.target.value)} /></div><div style={{ marginBottom: 12 }}><label style={label}>Mobile Number</label><input style={input} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 90000 00000" /></div><div style={{ background: '#F8F7FF', borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 1.8 }}><b>Plan Details</b><br />Current Plan: {plan}<br />Permanent QR ID: SP-8821<br />Plan Expiry: {planExpiry}<br />Free Event: 12 Hours Auto Delete<br />Paid Event: 3 Days Auto Delete<br />Storage: {storageUsedGB} GB / {storageLimitGB} GB<br />Real Uploaded Photos: {totalPhotos}</div><button onClick={saveProfile} style={{ width: '100%', background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', marginTop: 12 }}>Save Account</button>{savedMsg && <p style={{ color: 'green', fontSize: 12, textAlign: 'center' }}>{savedMsg}</p>}</div>
        )}
        {showPoster && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}><div style={{ background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center', maxWidth: 340, width: '100%' }}>{studioLogo ? <img src={studioLogo} alt="Studio" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 10, margin: '0 auto', display: 'block' }} /> : <b style={{ fontSize: 18 }}>{studioName}</b>}{!studioLogo && <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0', fontWeight: 700 }}>{mobile}</p>}{studioLogo && <b style={{ fontSize: 16, display: 'block', marginTop: 8 }}>{studioName}</b>}<p style={{ fontSize: 12, color: '#666', margin: '4px 0 12px' }}>Scan QR To Get Your Photos</p><img src={qrUrl} alt="Permanent QR SP-8821" style={{ width: 200, height: 200, display: 'block', margin: '0 auto', border: '2px solid #111', padding: 10, borderRadius: 8 }} /><p style={{ fontSize: 12, fontWeight: 800, margin: '12px 0 0' }}>SP-8821 • Permanent QR</p><p style={{ fontSize: 11, color: '#666', margin: '4px 0 0', wordBreak: 'break-all' }}>{guestLink}</p><button onClick={downloadQR} style={{ width: '100%', background: '#5B00B8', color: '#fff', border: 'none', padding: '11px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', marginTop: 12 }}>Download This QR</button><button onClick={() => setShowPoster(false)} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', padding: '11px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', marginTop: 8 }}>Close Poster</button></div></div>
        )}
      </div>
    </div>
  );
}