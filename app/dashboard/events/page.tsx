"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ALL_EVENTS: any = {
  "SP-8821": { name: "Suresh + Anitha Wedding", date: "2026-11-09", photos: 142, downloads: 58, scans: 180, selfieSearch: 97, status: "Active", plan: "FREE" },
  "SP-8820": { name: "Rahul + Priya Reception", date: "2026-11-02", photos: 98, downloads: 20, scans: 85, selfieSearch: 42, status: "Expired", plan: "PAID" },
  "SP-8819": { name: "Vikram Engagement", date: "2026-10-25", photos: 57, downloads: 0, scans: 40, selfieSearch: 18, status: "Expired", plan: "PAID" },
};

const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400",
];

function EventContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") || "SP-8821";
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"photos" | "stats">("photos");
  const ev = ALL_EVENTS[id] || ALL_EVENTS["SP-8821"];
  const go = (p: string) => router.push(p);
  const copy = async () => {
    const link = `https://picqr.in/guest/${id}`;
    try { await navigator.clipboard.writeText(link); } catch { const t = document.createElement("textarea"); t.value = link; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); }
    setCopied(true); setTimeout(() => setCopied(false), 2000); alert("Guest Link Copied: " + link);
  };
  const stat = { background: '#fff', border: '1px solid #EDEBFF', borderRadius: 14, padding: 14, flex: '1 1 130px', minWidth: 130 };
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Arial', background: '#F8F7FF' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #EDEBFF', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <img src="/logo.png" alt="PicQR" style={{ height: 42, width: 'auto' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => go("/dashboard")} style={{ background: '#F8F7FF', border: '1px solid #EDEBFF', padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Back to Dashboard</button>
          <button onClick={() => go(`/upload?event=${id}`)} style={{ background: '#FF7A2F', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Upload Photos</button>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 20px' }}>
        <button onClick={() => go("/dashboard")} style={{ background: 'none', border: 'none', color: '#5B00B8', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: 13 }}>← Back to Events</button>
        <div style={{ background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', borderRadius: 16, padding: 20, color: '#fff', marginTop: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div><p style={{ fontSize: 12, opacity: 0.9, margin: 0 }}>EVENT • {id} • {ev.plan}</p><h1 style={{ fontSize: 26, margin: '6px 0 0' }}>{ev.name}</h1><p style={{ fontSize: 13, opacity: 0.9, margin: '6px 0 0' }}>Date: {ev.date} • Status: {ev.status} • Suresh Photography</p></div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', color: '#111', minWidth: 130 }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, width: 100, margin: '0 auto' }}>{Array.from({ length: 49 }).map((_, i) => (<div key={i} style={{ background: (i % 3 === 0 || i % 7 === 0) ? '#111' : '#fff', aspectRatio: '1', border: '1px solid #eee' }}></div>))}</div><p style={{ fontSize: 10, fontWeight: 800, margin: '6px 0 0' }}>{id} • Permanent QR</p></div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <button onClick={() => go(`/guest/${id}`)} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: 'pointer', flex: '1 1 160px' }}>Open Event</button>
          <button onClick={() => go(`/upload?event=${id}`)} style={{ background: '#FF7A2F', color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: 'pointer', flex: '1 1 160px' }}>Upload Photos</button>
          <button onClick={() => go(`/guest/${id}`)} style={{ background: '#fff', color: '#5B00B8', border: '1.5px solid #EDEBFF', padding: '12px 22px', borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: 'pointer', flex: '1 1 160px' }}>Guest View</button>
          <button onClick={copy} style={{ background: '#F8F7FF', color: '#111', border: '1px solid #EDEBFF', padding: '12px 22px', borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: '1 1 160px' }}>{copied ? 'Copied!' : 'Copy Guest Link'}</button>
        </div>
        <p style={{ fontSize: 12, color: '#666', marginTop: 10, wordBreak: 'break-all' }}>Guest Link: https://picqr.in/guest/{id}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => setActiveTab("photos")} style={{ background: activeTab === "photos" ? '#111' : '#fff', color: activeTab === "photos" ? '#fff' : '#111', border: '1px solid #EDEBFF', padding: '8px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Photos ({ev.photos})</button>
          <button onClick={() => setActiveTab("stats")} style={{ background: activeTab === "stats" ? '#111' : '#fff', color: activeTab === "stats" ? '#fff' : '#111', border: '1px solid #EDEBFF', padding: '8px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Stats</button>
        </div>
        {activeTab === "stats" ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>{[{ l: 'Total Photos', v: String(ev.photos) }, { l: 'Downloads', v: String(ev.downloads) }, { l: 'QR Scans', v: String(ev.scans) }, { l: 'Selfie Search', v: String(ev.selfieSearch) }].map((s, i) => (<div key={i} style={stat}><p style={{ fontSize: 11, color: '#888', margin: 0 }}>{s.l}</p><p style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 0' }}>{s.v}</p></div>))}</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 16, marginTop: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b>Event Photos</b><button onClick={() => go(`/upload?event=${id}`)} style={{ background: 'none', border: 'none', color: '#5B00B8', fontWeight: 800, cursor: 'pointer' }}>+ Add More Photos</button></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>{DEMO_PHOTOS.map((src, i) => (<div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #EDEBFF', cursor: 'pointer' }} onClick={() => go(`/guest/${id}`)}><img src={src} alt={`Photo ${i + 1}`} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} /><p style={{ fontSize: 11, color: '#666', margin: 0, padding: '8px 10px' }}>Photo {i + 1} • Click to Open</p></div>))}</div></div>
        )}
      </div>
    </div>
  );
}

export default function EventPage() {
  return (<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}><EventContent /></Suspense>);
}