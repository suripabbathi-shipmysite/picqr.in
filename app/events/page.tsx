"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// SAFE CLIENT - If env missing, app will not hang
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

type PhotoItem = { thumb: string; original: string; name: string };

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open('picqr-db', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'key' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    } catch (e) { reject(e); }
  })
}

function EventContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") || "";
  const [eventName, setEventName] = useState("Event");
  const [eventDate, setEventDate] = useState("");
  const [eventPlan, setEventPlan] = useState("FREE");
  const [eventStatus, setEventStatus] = useState("Active");
  const [studioName, setStudioName] = useState("");
  const [userQrId, setUserQrId] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const [deleting, setDeleting] = useState("");

  // LOGIN CHECK + REAL QR ID
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if(!supabase){ router.replace("/login?next=/events"); return; }
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000));
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        if (!session) { router.replace("/login?next=/events"); return; }
        if(cancelled) return;
        const qrId = `PQ-${session.user.id.slice(0, 6).toUpperCase()}`;
        setUserQrId(qrId);
        const { data: profile } = await supabase.from("profiles").select("studio_name, full_name").eq("id", session.user.id).maybeSingle();
        if (profile && !cancelled) setStudioName(profile.studio_name || profile.full_name || "");
      } catch {
        try{ router.replace("/login?next=/events"); }catch{}
        return;
      } finally {
        if(!cancelled) setChecking(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [router]);

  // LOAD EVENT DETAILS + PHOTOS FROM SUPABASE
  useEffect(() => {
    if(checking) return;
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        if(supabase){
          // Event details - Try by qr_id first, then by id
          let ev: any = null;
          const { data: byQr } = await supabase.from("events").select("*").eq("qr_id", id).maybeSingle();
          if (byQr) ev = byQr;
          if (!ev) {
            const { data: byId } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
            if (byId) ev = byId;
          }
          if (ev && !cancelled) {
            setEventName(ev.name || `Event ${id}`);
            setEventDate(ev.date || ev.created_at?.slice(0, 10) || "");
            setEventPlan(ev.plan || "FREE");
            setEventStatus(ev.status || "Active");
          } else if (!cancelled) {
            // No event row - Use QR ID as event name, photos still load from storage
            setEventName(`Event ${id}`);
            setEventDate("");
            setEventPlan("FREE");
            setEventStatus("Active");
          }

          // Photos - thumb folder first
          let list: PhotoItem[] = [];
          const { data: thumbFiles } = await supabase.storage.from("event-photos").list(`${id}/thumb`, { limit: 1000 });
          if (thumbFiles && thumbFiles.length > 0) {
            list = thumbFiles.filter(f => f.name !== ".emptyFolderPlaceholder").map(f => {
              const thumb = supabase.storage.from("event-photos").getPublicUrl(`${id}/thumb/${f.name}`).data.publicUrl;
              const original = supabase.storage.from("event-photos").getPublicUrl(`${id}/original/${f.name}`).data.publicUrl;
              return { thumb, original, name: f.name };
            });
          }
          // Old structure - direct folder
          if (list.length === 0) {
            const { data: oldFiles } = await supabase.storage.from("event-photos").list(id, { limit: 1000 });
            if (oldFiles && oldFiles.length > 0) {
              const onlyFiles = oldFiles.filter(f => f.name !== "thumb" && f.name !== "original" && f.name !== ".emptyFolderPlaceholder");
              if (onlyFiles.length > 0) {
                list = onlyFiles.map(f => {
                  const url = supabase.storage.from("event-photos").getPublicUrl(`${id}/${f.name}`).data.publicUrl;
                  return { thumb: url, original: url, name: f.name };
                });
              }
            }
          }
          if (!cancelled && list.length > 0) { setPhotos(list); setLoading(false); return; }
        }
      } catch {}
      // Fallback - IndexedDB backup
      try {
        const db = await openDB();
        const tx = db.transaction('photos', 'readonly');
        const req = tx.objectStore('photos').get(`picqr_photos_${id}`);
        await new Promise<void>((res) => {
          req.onsuccess = () => {
            if (!cancelled && req.result) {
              const arr = req.result.value.map((u: string, i: number) => ({ thumb: u, original: u, name: `photo-${i}` }));
              setPhotos(arr);
            }
            res();
          };
          req.onerror = () => res();
        });
      } catch {
        try {
          const saved = localStorage.getItem(`picqr_photos_${id}`);
          if (!cancelled && saved) {
            const arr = JSON.parse(saved).map((u: string, i: number) => ({ thumb: u, original: u, name: `photo-${i}` }));
            setPhotos(arr);
          }
        } catch {}
      }
      if(!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, checking]);

  const removePhoto = async (photo: PhotoItem) => {
    if(!confirm("Delete this photo? Guest will not see it anymore.")) return;
    setDeleting(photo.name);
    const next = photos.filter((p) => p.name !== photo.name);
    setPhotos(next);
    try {
      if(supabase){
        await supabase.storage.from("event-photos").remove([`${id}/thumb/${photo.name}`, `${id}/original/${photo.name}`, `${id}/${photo.name}`]);
      }
      const db = await openDB();
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put({ key: `picqr_photos_${id}`, value: next.map(p => p.thumb) });
    } catch {}
    setDeleting("");
    if(selected?.name === photo.name) setSelected(null);
  };

  const downloadPhoto = (photo: PhotoItem, index: number) => {
    const a = document.createElement("a");
    a.href = photo.original;
    a.download = `picqr-${id}-photo-${index + 1}.jpg`;
    a.target = "_blank"; a.click();
  };

  if (checking) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial' }}>Loading...</div>;
  if (!id) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial' }}><h2>No Event Selected</h2><p>Please go to Dashboard and select an event.</p><button onClick={() => router.push("/dashboard")} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', marginTop: 12 }}>Go to Dashboard</button></div>;

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Arial', background: '#F8F7FF' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 20px' }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: 'none', border: 'none', color: '#5B00B8', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Back to Dashboard</button>
        <div style={{ background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', borderRadius: 16, padding: 20, color: '#fff', marginTop: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div><p style={{ fontSize: 12, margin: 0 }}>EVENT • {id} • {eventPlan}</p><h1 style={{ fontSize: 26, margin: '6px 0 0' }}>{eventName}</h1><p style={{ fontSize: 13, margin: '6px 0 0' }}>Date: {eventDate || "-"} • Status: {eventStatus} • {studioName || userQrId}</p></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => router.push(`/guest?id=${id}`)} style={{ background: '#111', color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Test Guest View</button>
            <button onClick={() => router.push(`/upload?event=${id}`)} style={{ background: '#fff', color: '#5B00B8', border: 'none', padding: '12px 22px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Upload Photos</button>
          </div>
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
            {photos.map((photo, i) => (
              <div key={photo.name + i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #EDEBFF' }}>
                <img src={photo.thumb} alt={`Photo ${i + 1}`} onClick={() => setSelected(photo)} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#666' }}>Photo {i + 1}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => downloadPhoto(photo, i)} style={{ background: 'none', border: 'none', color: '#5B00B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Download</button>
                    <button onClick={() => removePhoto(photo)} disabled={deleting === photo.name} style={{ background: 'none', border: 'none', color: '#D40000', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{deleting === photo.name ? 'Deleting...' : 'Delete'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, flexDirection: 'column' }}>
          <img src={selected.thumb} alt="Full" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12 }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={(e) => { e.stopPropagation(); downloadPhoto(selected, 0); }} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Download Original</button>
            <button onClick={() => setSelected(null)} style={{ background: '#fff', border: 'none', padding: '10px 20px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventPage() {
  return (<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}><EventContent /></Suspense>);
}