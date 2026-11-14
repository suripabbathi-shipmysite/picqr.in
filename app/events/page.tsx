"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ALL_EVENTS: any = {
  "SP-8821": { name: "Suresh + Anitha Wedding", date: "2026-11-09", plan: "FREE", status: "Active" },
  "SP-8820": { name: "Rahul + Priya Reception", date: "2026-11-02", plan: "PAID", status: "Expired" },
  "SP-8819": { name: "Vikram Engagement", date: "2026-10-25", plan: "PAID", status: "Expired" },
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

function EventContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") || "SP-8821";
  const ev = ALL_EVENTS[id] || ALL_EVENTS["SP-8821"];
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const db = await openDB();
        const tx = db.transaction('photos', 'readonly');
        const req = tx.objectStore('photos').get(`picqr_photos_${id}`);
        req.onsuccess = () => {
          if (!cancelled) setPhotos(req.result ? req.result.value : []);
          setLoading(false);
        };
        req.onerror = () => { if (!cancelled) setPhotos([]); setLoading(false); };
      } catch {
        try {
          const saved = localStorage.getItem(`picqr_photos_${id}`);
          if (!cancelled) setPhotos(saved ? JSON.parse(saved) : []);
        } catch { if (!cancelled) setPhotos([]); }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const removePhoto = async (src: string) => {
    const next = photos.filter((p) => p !== src);
    setPhotos(next);
    try {
      const db = await openDB();
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put({ key: `picqr_photos_${id}`, value: next });
    } catch {}
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Arial', background: '#F8F7FF' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 20px' }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: 'none', border: 'none', color: '#5B00B8', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Back to Dashboard</button>
        <div style={{ background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', borderRadius: 16, padding: 20, color: '#fff', marginTop: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div><p style={{ fontSize: 12, margin: 0 }}>EVENT • {id} • {ev.plan}</p><h1 style={{ fontSize: 26, margin: '6px 0 0' }}>{ev.name}</h1><p style={{ fontSize: 13, margin: '6px 0 0' }}>Date: {ev.date} • Status: {ev.status} • Suresh Photography</p></div>
          <button onClick={() => router.push(`/upload?event=${id}`)} style={{ background: '#fff', color: '#5B00B8', border: 'none', padding: '12px 22px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Upload Photos</button>
        </div>
        <h2 style={{ fontSize: 18, marginTop: 20 }}>Event Photos • {loading ? 'Loading...' : photos.length}</h2>
        {loading ? (
          <p style={{ color: '#666' }}>Loading photos...</p>
        ) : photos.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #EDEBFF', borderRadius: 14, padding: 28, textAlign: 'center', marginTop: 12 }}>
            <p style={{ fontSize: 14, color: '#666', margin: 0 }}>No photos uploaded yet for this event.</p>
            <button onClick={() => router.push(`/upload?event=${id}`)} style={{ background: '#FF7A2F', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', marginTop: 14 }}>Upload Photos</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
            {photos.map((src, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #EDEBFF' }}>
                <img src={src} alt={`Photo ${i + 1}`} onClick={() => setSelected(src)} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px' }}>
                  <span style={{ fontSize: 12, color: '#666' }}>Photo {i + 1}</span>
                  <button onClick={() => removePhoto(src)} style={{ background: 'none', border: 'none', color: '#D40000', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <img src={selected} alt="Full" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}

export default function EventPage() {
  return (<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}><EventContent /></Suspense>);
}