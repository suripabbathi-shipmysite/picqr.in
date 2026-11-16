"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EventRow = {
  id: string;
  name: string;
  date: string;
  plan: string;
  status: string;
  downloads: number;
  scans: number;
  selfieSearch: number;
  createdAt: number;
  photos: number;
};

function EventContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") || ""; // ?id=PQ-XXXXXX - lekapothe List chupistam
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"photos" | "stats">("photos");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selected, setSelected] = useState<EventRow | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [studioName, setStudioName] = useState("");
  const [userQrId, setUserQrId] = useState("");
  const [origin, setOrigin] = useState("https://picqr.in");

  useEffect(() => { setOrigin(window.location.origin); }, []);

  // FIX: REAL EVENTS - Supabase events table nundi - Ee user vi matrame
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login?next=/dashboard/events"); return; }
      setUserQrId(`PQ-${session.user.id.slice(0, 6).toUpperCase()}`);

      const { data: profile } = await supabase.from("profiles").select("studio_name, full_name").eq("id", session.user.id).maybeSingle();
      if (profile) setStudioName(profile.studio_name || `${profile.full_name || ""} Photography`);

      const { data } = await supabase.from("events").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
      let rows: EventRow[] = [];
      if (data) {
        rows = await Promise.all(data.map(async (e: any) => {
          const eventId = e.qr_id || e.id;
          // Real photo count - Supabase thumb/ nundi
          let count = 0;
          try {
            const { data: files } = await supabase.storage.from("event-photos").list(`${eventId}/thumb`, { limit: 1000 });
            if (files) count = files.filter(f => f.name !== ".emptyFolderPlaceholder").length;
          } catch {}
          return {
            id: eventId, name: e.name, date: e.date || e.created_at?.slice(0, 10),
            plan: e.plan || "FREE", status: e.status || "Active",
            downloads: e.downloads || 0, scans: e.scans || 0, selfieSearch: e.selfie_search || 0,
            createdAt: new Date(e.created_at).getTime(), photos: count,
          };
        }));
      }
      setEvents(rows);

      // ?id unte - aa event ni select chey
      if (id) {
        const found = rows.find(r => r.id === id);
        if (found) {
          setSelected(found);
          // Real photos - thumb nundi
          const { data: thumbFiles } = await supabase.storage.from("event-photos").list(`${id}/thumb`, { limit: 100 });
          if (thumbFiles) {
            setPhotos(thumbFiles.filter(f => f.name !== ".emptyFolderPlaceholder").map(f => supabase.storage.from("event-photos").getPublicUrl(`${id}/thumb/${f.name}`).data.publicUrl));
          }
        } else {
          // Event table lo ledu kani QR ki photos unte - Permanent QR event la chupinchu
          const { data: thumbFiles } = await supabase.storage.from("event-photos").list(`${id}/thumb`, { limit: 100 });
          if (thumbFiles && thumbFiles.length > 0) {
            setSelected({ id, name: `Event ${id}`, date: new Date().toISOString().slice(0, 10), plan: "FREE", status: "Active", downloads: 0, scans: 0, selfieSearch: 0, createdAt: Date.now(), photos: thumbFiles.length });
            setPhotos(thumbFiles.filter(f => f.name !== ".emptyFolderPlaceholder").map(f => supabase.storage.from("event-photos").getPublicUrl(`${id}/thumb/${f.name}`).data.publicUrl));
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  const go = (p: string) => router.push(p);

  // FIX: Guest Link CORRECT format - ?id=
  const guestLink = selected ? `${origin}/guest?id=${selected.id}` : `${origin}/guest?id=${userQrId}`;
  const qrUrl = selected ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(guestLink)}` : "";

  const copy = async () => {
    try { await navigator.clipboard.writeText(guestLink); } catch { const t = document.createElement("textarea"); t.value = guestLink; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const getExpiryText = (ev: EventRow) => {
    const hours = ev.plan === "FREE" ? 12 : 72;
    const left = ev.createdAt + hours * 3600 * 1000 - Date.now();
    if (left <= 0) return "Deleted - Auto Delete Done";
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `Auto Delete in ${h}h ${m}m`;
  };

  const stat = { background: '#fff', border: '1px solid #EDEBFF', borderRadius: 14, padding: 14, flex: '1 1 130px', minWidth: 130 };

  if (loading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading events...</div>;

  // NO ?id - EVENT LIST
  if (!id || !selected) {
    return (
      <div style={{ minHeight: '100vh', fontFamily: 'Arial', background: '#F8F7FF', padding: '18px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <button onClick={() => go("/dashboard")} style={{ background: 'none', border: 'none', color: '#5B00B8', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: 13 }}>← Back to Dashboard</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
            <div><h1 style={{ fontSize: 24, margin: 0 }}>My Events • {events.length}</h1><p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>Your Permanent QR: {userQrId} • {studioName}</p></div>
            <button onClick={() => go("/pricing")} style={{ background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>+ Create Event</button>
          </div>
          {events.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 32, textAlign: 'center', marginTop: 16 }}>
              <p style={{ fontSize: 48, margin: 0 }}>📷</p>
              <b style={{ fontSize: 16 }}>No events yet</b>
              <p style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>Create your first free event. Photos delete in 12 Hours for Free.</p>
              <button onClick={() => go("/pricing")} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', marginTop: 14 }}>Create First Event</button>
            </div>
          ) : events.map(ev => (
            <div key={ev.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 16, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}><b style={{ fontSize: 15 }}>{ev.name}</b><span style={{ fontSize: 11, background: ev.plan === "FREE" ? '#FFF0F0' : '#E6FFED', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>{ev.plan} • {ev.status}</span></div>
              <p style={{ fontSize: 12, color: '#666', margin: '6px 0' }}>ID: {ev.id} • Date: {ev.date} • Photos: {ev.photos} • Downloads: {ev.downloads} • Scans: {ev.scans}</p>
              <p style={{ fontSize: 12, color: '#D40000', fontWeight: 700, margin: 0 }}>{getExpiryText(ev)}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <button onClick={() => go(`/dashboard/events?id=${ev.id}`)} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Open Event</button>
                <button onClick={() => go(`/upload?event=${ev.id}`)} style={{ background: '#FF7A2F', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Upload Photos</button>
                <button onClick={() => go(`/guest?id=${ev.id}`)} style={{ background: '#111', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Guest View</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ?id - EVENT DETAIL - Real Photos
  const ev = selected;
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Arial', background: '#F8F7FF' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #EDEBFF', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <img src="/logo.png" alt="PicQR" style={{ height: 42, width: 'auto' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => go("/dashboard")} style={{ background: '#F8F7FF', border: '1px solid #EDEBFF', padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Back to Dashboard</button>
          <button onClick={() => go(`/upload?event=${ev.id}`)} style={{ background: '#FF7A2F', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Upload Photos</button>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 20px' }}>
        <button onClick={() => go("/dashboard/events")} style={{ background: 'none', border: 'none', color: '#5B00B8', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: 13 }}>← Back to Events</button>
        <div style={{ background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', borderRadius: 16, padding: 20, color: '#fff', marginTop: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div><p style={{ fontSize: 12, opacity: 0.9, margin: 0 }}>EVENT • {ev.id} • {ev.plan}</p><h1 style={{ fontSize: 26, margin: '6px 0 0' }}>{ev.name}</h1><p style={{ fontSize: 13, opacity: 0.9, margin: '6px 0 0' }}>Date: {ev.date} • Status: {ev.status} • {studioName}</p><p style={{ fontSize: 12, opacity: 0.9, margin: '4px 0 0' }}>{getExpiryText(ev)}</p></div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', color: '#111', minWidth: 130 }}>
            <img src={qrUrl} alt={`QR ${ev.id}`} style={{ width: 100, height: 100, display: 'block', margin: '0 auto' }} />
            <p style={{ fontSize: 10, fontWeight: 800, margin: '6px 0 0' }}>{ev.id} • Permanent QR</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <button onClick={() => go(`/guest?id=${ev.id}`)} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: 'pointer', flex: '1 1 160px' }}>Open Event</button>
          <button onClick={() => go(`/upload?event=${ev.id}`)} style={{ background: '#FF7A2F', color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: 'pointer', flex: '1 1 160px' }}>Upload Photos</button>
          <button onClick={() => go(`/guest?id=${ev.id}`)} style={{ background: '#fff', color: '#5B00B8', border: '1.5px solid #EDEBFF', padding: '12px 22px', borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: 'pointer', flex: '1 1 160px' }}>Guest View</button>
          <button onClick={copy} style={{ background: '#F8F7FF', color: '#111', border: '1px solid #EDEBFF', padding: '12px 22px', borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: '1 1 160px' }}>{copied ? 'Copied!' : 'Copy Guest Link'}</button>
        </div>
        <p style={{ fontSize: 12, color: '#666', marginTop: 10, wordBreak: 'break-all' }}>Guest Link: {guestLink}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => setActiveTab("photos")} style={{ background: activeTab === "photos" ? '#111' : '#fff', color: activeTab === "photos" ? '#fff' : '#111', border: '1px solid #EDEBFF', padding: '8px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Photos ({ev.photos})</button>
          <button onClick={() => setActiveTab("stats")} style={{ background: activeTab === "stats" ? '#111' : '#fff', color: activeTab === "stats" ? '#fff' : '#111', border: '1px solid #EDEBFF', padding: '8px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Stats</button>
        </div>
        {activeTab === "stats" ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>{[{ l: 'Total Photos', v: String(ev.photos) }, { l: 'Downloads', v: String(ev.downloads) }, { l: 'QR Scans', v: String(ev.scans) }, { l: 'Selfie Search', v: String(ev.selfieSearch) }].map((s, i) => (<div key={i} style={stat}><p style={{ fontSize: 11, color: '#888', margin: 0 }}>{s.l}</p><p style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 0' }}>{s.v}</p></div>))}</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDEBFF', padding: 16, marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b>Event Photos - Real Uploads</b><button onClick={() => go(`/upload?event=${ev.id}`)} style={{ background: 'none', border: 'none', color: '#5B00B8', fontWeight: 800, cursor: 'pointer' }}>+ Add More Photos</button></div>
            {photos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32 }}><p style={{ fontSize: 14, color: '#666', margin: 0 }}>No photos uploaded yet for this event.</p><button onClick={() => go(`/upload?event=${ev.id}`)} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', marginTop: 12 }}>Upload Photos</button></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>{photos.map((src, i) => (<div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #EDEBFF', cursor: 'pointer' }} onClick={() => go(`/guest?id=${ev.id}`)}><img src={src} alt={`Photo ${i + 1}`} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} /><p style={{ fontSize: 11, color: '#666', margin: 0, padding: '8px 10px' }}>Photo {i + 1} • Click to Open Guest</p></div>))}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventPage() {
  return (<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}><EventContent /></Suspense>);
}