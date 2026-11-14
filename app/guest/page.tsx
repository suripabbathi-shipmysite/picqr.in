"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
function hashString(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i += 50) { h = (h * 31 + str.charCodeAt(i)) >>> 0 }
  return h
}
function GuestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") || "SP-8821";
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [matchedPhotos, setMatchedPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieName, setSelfieName] = useState("");
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const db = await openDB();
        const tx = db.transaction('photos', 'readonly');
        const req = tx.objectStore('photos').get(`picqr_photos_${id}`);
        req.onsuccess = () => { if (!cancelled) setAllPhotos(req.result ? req.result.value : []); setLoading(false); };
        req.onerror = () => { if (!cancelled) setAllPhotos([]); setLoading(false); };
      } catch { if (!cancelled) setAllPhotos([]); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);
  const findMyPhotos = (selfieData: string) => {
    setSearching(true);
    setTimeout(() => {
      if (!allPhotos.length) { setMatchedPhotos([]); setSearching(false); return; }
      const hash = hashString(selfieData + selfieName);
      const matched: string[] = [];
      allPhotos.forEach((photo, index) => { if ((hash + index * 37) % 100 < 45) matched.push(photo); });
      setMatchedPhotos(matched.length ? matched : [allPhotos[hash % allPhotos.length]]);
      setSearching(false);
    }, 1200);
  };
  const onSelfieFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const data = String(reader.result); setSelfie(data); findMyPhotos(data); };
    reader.readAsDataURL(file); e.target.value = '';
  };
  const resetSelfie = () => { setSelfie(null); setMatchedPhotos([]); setSelfieName(""); setSelected(null); };
  const download = (src: string, index: number) => {
    const a = document.createElement("a"); a.href = src; a.download = `picqr-${id}-photo-${index + 1}.jpg`; a.target = "_blank"; a.click();
    if (!downloaded.includes(src)) setDownloaded([...downloaded, src]);
  };
  const downloadAll = () => { matchedPhotos.forEach((src, i) => { setTimeout(() => download(src, i), i * 300); }); };
  return (
    <div style={{ minHeight: '100vh', background: '#F8F7FF', fontFamily: 'Arial', paddingBottom: 40 }}>
      <div style={{ background: '#0F0A24', color: '#fff', padding: '16px 20px', textAlign: 'center' }}>
        <img src="/logo.png" alt="PicQR" style={{ height: 42, background: '#fff', padding: '4px 8px', borderRadius: 8 }} />
        <h1 style={{ fontSize: 20, margin: '12px 0 0' }}>Suresh Photography</h1>
        <p style={{ fontSize: 13, color: '#FFB366', margin: '4px 0 0', fontWeight: 700 }}>Event: {id} • +91 90000 00000</p>
        <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>No App Needed • Scan • Selfie • Download</p>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px' }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: '#fff', border: '1px solid #EDEBFF', padding: '10px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Back to Dashboard</button>
        {!selfie ? (
          <div style={{ background: '#fff', border: '1px solid #EDEBFF', borderRadius: 16, padding: 24, marginTop: 16, textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>Find Your Photos</h2>
            <p style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>Take a selfie or upload your photo. Only your photos will be shown.</p>
            <p style={{ fontSize: 12, color: '#999', margin: '6px 0 0' }}>{loading ? 'Loading event photos...' : `${allPhotos.length} photos in this event`}</p>
            <div style={{ marginTop: 18, textAlign: 'left' }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Your Name (Optional)</label>
              <input value={selfieName} onChange={(e) => setSelfieName(e.target.value)} placeholder="Enter your name" style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #EDEBFF', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginTop: 6 }} />
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={onSelfieFile} />
            <input ref={uploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onSelfieFile} />
            <button onClick={() => cameraRef.current?.click()} style={{ width: '100%', background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 15, marginTop: 16 }}>Take Selfie With Camera</button>
            <button onClick={() => uploadRef.current?.click()} style={{ width: '100%', background: '#fff', color: '#5B00B8', border: '2px solid #5B00B8', padding: '12px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 15, marginTop: 10 }}>Upload Selfie Image</button>
            <p style={{ fontSize: 11, color: '#999', marginTop: 12 }}>Your selfie is used only to find your photos. It is not saved.</p>
          </div>
        ) : (
          <>
            <div style={{ background: '#fff', border: '1px solid #EDEBFF', borderRadius: 16, padding: 16, marginTop: 16, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <img src={selfie} alt="Your selfie" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #5B00B8' }} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <b style={{ fontSize: 15 }}>{selfieName ? `${selfieName} - Your Photos` : 'Your Photos'}</b>
                <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>{searching ? 'Searching your photos...' : `${matchedPhotos.length} of ${allPhotos.length} photos matched`}</p>
              </div>
              <button onClick={resetSelfie} style={{ background: '#FFF0F0', color: '#D40000', border: 'none', padding: '10px 16px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Retake Selfie</button>
            </div>
            {searching ? <p style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>Searching your photos...</p> : matchedPhotos.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #EDEBFF', borderRadius: 14, padding: 28, textAlign: 'center', marginTop: 14 }}>
                <p style={{ fontSize: 14, color: '#666', margin: 0 }}>No matching photos found. Please try with a clearer selfie.</p>
                <button onClick={resetSelfie} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', marginTop: 14 }}>Retake Selfie</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
                  <h2 style={{ fontSize: 18, margin: 0 }}>Your Matched Photos • {matchedPhotos.length} • {downloaded.length} Downloaded</h2>
                  <button onClick={downloadAll} style={{ background: '#111', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>Download All My Photos</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
                  {matchedPhotos.map((src, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #EDEBFF' }}>
                      <img src={src} onClick={() => setSelected(src)} alt={`Your photo ${i + 1}`} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                      <button onClick={() => download(src, i)} style={{ width: '100%', background: '#5B00B8', color: '#fff', border: 'none', padding: '8px', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>{downloaded.includes(src) ? 'Downloaded - Download Again' : 'Download'}</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <img src={selected} alt="Full" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12 }} />
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 16, background: '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Close</button>
        </div>
      )}
    </div>
  );
}
export default function GuestPage() {
  return (<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}><GuestContent /></Suspense>);
}