"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import * as faceapi from "face-api.js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

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

// Photo - Thumb for display + Original for download
type PhotoItem = { thumb: string; original: string; name: string }

function GuestContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([]);
  const [matchedPhotos, setMatchedPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelStatus, setModelStatus] = useState("Loading face detection...");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieName, setSelfieName] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState("");
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [studioName, setStudioName] = useState("PicQR Photographer");
  const [studioMobile, setStudioMobile] = useState("");
  const [qrOwnerFound, setQrOwnerFound] = useState(true);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setModelStatus("Face detection ready ✅");
      } catch (e) {
        console.error("Model load failed", e);
        setModelStatus("Face model failed to load - try refresh");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!id) { setQrOwnerFound(false); setLoading(false); return; }
    const loadStudio = async () => {
      const { data } = await supabase.from("profiles").select("full_name, studio_name, mobile").or(`qr_id.eq.${id},id.ilike.%${id.replace("PQ-","")}%`).limit(1).maybeSingle();
      if (data) {
        setStudioName(data.studio_name || `${data.full_name || ""} Photography`);
        setStudioMobile(data.mobile || "");
      } else {
        setStudioName(`Photographer ${id}`);
      }
    };
    loadStudio();
  }, [id]);

  // FIX 1: PHOTOS - thumb/ nundi - Upload tho match
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let photos: PhotoItem[] = [];
      try {
        // 1. Kotta structure - thumb folder
        const { data: thumbFiles } = await supabase.storage.from("event-photos").list(`${id}/thumb`, { limit: 200 });
        if (thumbFiles && thumbFiles.length > 0) {
          photos = thumbFiles.filter(f => f.name !== ".emptyFolderPlaceholder").map(f => {
            const thumb = supabase.storage.from("event-photos").getPublicUrl(`${id}/thumb/${f.name}`).data.publicUrl;
            const original = supabase.storage.from("event-photos").getPublicUrl(`${id}/original/${f.name}`).data.publicUrl;
            return { thumb, original, name: f.name };
          });
        }
        // 2. Paatha structure - direct folder (backward compatible)
        if (photos.length === 0) {
          const { data: oldFiles } = await supabase.storage.from("event-photos").list(id, { limit: 200 });
          if (oldFiles && oldFiles.length > 0) {
            const onlyFiles = oldFiles.filter(f => f.name !== "thumb" && f.name !== "original" && f.name !== ".emptyFolderPlaceholder");
            if (onlyFiles.length > 0) {
              photos = onlyFiles.map(f => {
                const url = supabase.storage.from("event-photos").getPublicUrl(`${id}/${f.name}`).data.publicUrl;
                return { thumb: url, original: url, name: f.name };
              });
            }
          }
        }
      } catch {}
      // 3. IndexedDB backup
      if (photos.length === 0) {
        try {
          const db = await openDB();
          const tx = db.transaction('photos', 'readonly');
          const req = tx.objectStore('photos').get(`picqr_photos_${id}`);
          await new Promise<void>((res) => {
            req.onsuccess = () => {
              if (req.result) photos = req.result.value.map((u: string, i: number) => ({ thumb: u, original: u, name: `photo-${i}` }));
              res();
            };
            req.onerror = () => res();
          });
        } catch {}
      }
      if (!cancelled) { setAllPhotos(photos); setLoading(false); }
    }
    if (id) load();
    return () => { cancelled = true; };
  }, [id]);

  // FACE MATCH - Thumb tho fast ga
  const findMyPhotos = async (selfieData: string) => {
    if (!modelsLoaded) { alert("Face detection is still loading. Please wait 5 seconds and try again."); return; }
    if (!allPhotos.length) { setMatchedPhotos([]); return; }
    setSearching(true);
    setSearchProgress("Reading your face...");
    try {
      const selfieImg = await faceapi.fetchImage(selfieData);
      const selfieDetection = await faceapi.detectSingleFace(selfieImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      if (!selfieDetection) {
        alert("No face found in selfie. Please take a clear front selfie with good light.");
        setSearching(false); return;
      }
      const selfieDesc = selfieDetection.descriptor;
      const matched: PhotoItem[] = [];
      for (let i = 0; i < allPhotos.length; i++) {
        setSearchProgress(`Checking ${i + 1} / ${allPhotos.length} photos...`);
        try {
          const img = await faceapi.fetchImage(allPhotos[i].thumb); // Thumb - fast
          const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
          for (const det of detections) {
            const distance = faceapi.euclideanDistance(selfieDesc, det.descriptor);
            if (distance < 0.6) { matched.push(allPhotos[i]); break; }
          }
        } catch { continue; }
      }
      setMatchedPhotos(matched);
    } catch (e) {
      console.error(e);
      alert("Face search failed. Try again with clear selfie.");
    }
    setSearching(false);
    setSearchProgress("");
  };

  const onSelfieFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const data = String(reader.result); setSelfie(data); findMyPhotos(data); };
    reader.readAsDataURL(file); e.target.value = '';
  };
  const resetSelfie = () => { setSelfie(null); setMatchedPhotos([]); setSelfieName(""); setSelected(null); };

  // FIX 2: DOWNLOAD - ORIGINAL NE - Quality taggadu
  const download = (photo: PhotoItem, index: number) => {
    const a = document.createElement("a");
    a.href = photo.original; // Original Quality
    a.download = `picqr-${id}-photo-${index + 1}.jpg`;
    a.target = "_blank"; a.click();
    if (!downloaded.includes(photo.original)) setDownloaded([...downloaded, photo.original]);
  };
  const downloadAll = () => { matchedPhotos.forEach((photo, i) => { setTimeout(() => download(photo, i), i * 300); }); };

  if (!id || !qrOwnerFound) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial' }}><h2>Invalid QR Code</h2><p>Please scan a valid PicQR code from your photographer.</p></div>;
  }

  // FIX 3: EVENT CREATE CHEYAKAPOTHE / PHOTOS LEVU ANTE - EXACT MESSAGE
  const showNotAvailable = !loading && allPhotos.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7FF', fontFamily: 'Arial', paddingBottom: 40 }}>
      <div style={{ background: '#0F0A24', color: '#fff', padding: '16px 20px', textAlign: 'center' }}>
        <img src="/logo.png" alt="PicQR" style={{ height: 42, background: '#fff', padding: '4px 8px', borderRadius: 8 }} />
        <h1 style={{ fontSize: 20, margin: '12px 0 0' }}>{studioName}</h1>
        <p style={{ fontSize: 13, color: '#FFB366', margin: '4px 0 0', fontWeight: 700 }}>Event: {id} {studioMobile ? `• ${studioMobile}` : ""}</p>
        <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>No App Needed • Scan • Selfie • Download</p>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px' }}>
        <p style={{ fontSize: 12, color: modelsLoaded ? '#0A7A2F' : '#FF7A2F', textAlign: 'center', fontWeight: 700, margin: '8px 0 0' }}>{modelStatus}</p>

        {/* PHOTOS LEVU - EVENT CREATE AVALEDU */}
        {showNotAvailable && (
          <div style={{ background: '#fff', border: '1px solid #EDEBFF', borderRadius: 16, padding: 32, marginTop: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 48, margin: 0 }}>📷</p>
            <h2 style={{ fontSize: 20, margin: '12px 0 0' }}>Your photos not available</h2>
            <p style={{ fontSize: 14, color: '#666', margin: '8px 0 0', lineHeight: 1.6 }}>
              Photographer has not uploaded photos yet for this event.<br />
              Please contact photographer.
            </p>
            <p style={{ fontSize: 12, color: '#999', margin: '12px 0 0' }}>Event: {id} • {studioName}</p>
            <button onClick={() => window.location.reload()} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', marginTop: 16 }}>Check Again</button>
          </div>
        )}

        {!showNotAvailable && !selfie && (
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
            <button disabled={!modelsLoaded} onClick={() => cameraRef.current?.click()} style={{ width: '100%', background: modelsLoaded ? 'linear-gradient(90deg,#5B00B8,#FF7A2F)' : '#999', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 800, cursor: modelsLoaded ? 'pointer' : 'not-allowed', fontSize: 15, marginTop: 16 }}>{modelsLoaded ? 'Take Selfie With Camera' : 'Loading Face Detection...'}</button>
            <button disabled={!modelsLoaded} onClick={() => uploadRef.current?.click()} style={{ width: '100%', background: '#fff', color: '#5B00B8', border: '2px solid #5B00B8', padding: '12px', borderRadius: 12, fontWeight: 800, cursor: modelsLoaded ? 'pointer' : 'not-allowed', fontSize: 15, marginTop: 10 }}>Upload Selfie Image</button>
            <p style={{ fontSize: 11, color: '#999', marginTop: 12 }}>Your selfie is used only to find your photos. It is not saved. Free face match - works in your browser.</p>
          </div>
        )}

        {!showNotAvailable && selfie && (
          <>
            <div style={{ background: '#fff', border: '1px solid #EDEBFF', borderRadius: 16, padding: 16, marginTop: 16, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <img src={selfie} alt="Your selfie" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #5B00B8' }} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <b style={{ fontSize: 15 }}>{selfieName ? `${selfieName} - Your Photos` : 'Your Photos'}</b>
                <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>{searching ? `${searchProgress}` : `${matchedPhotos.length} of ${allPhotos.length} photos matched - Real Face Match ✅`}</p>
                <p style={{ fontSize: 11, color: '#0A7A2F', margin: '4px 0 0', fontWeight: 700 }}>Download = Original Quality</p>
              </div>
              <button onClick={resetSelfie} style={{ background: '#FFF0F0', color: '#D40000', border: 'none', padding: '10px 16px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Retake Selfie</button>
            </div>
            {searching ? <p style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>{searchProgress || "Searching your photos..."}</p> : matchedPhotos.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #EDEBFF', borderRadius: 14, padding: 28, textAlign: 'center', marginTop: 14 }}>
                <p style={{ fontSize: 14, color: '#666', margin: 0 }}>No matching photos found. Please try with a clearer front selfie with good light.</p>
                <button onClick={resetSelfie} style={{ background: '#5B00B8', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', marginTop: 14 }}>Retake Selfie</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
                  <h2 style={{ fontSize: 18, margin: 0 }}>Your Matched Photos • {matchedPhotos.length} • {downloaded.length} Downloaded</h2>
                  <button onClick={downloadAll} style={{ background: '#111', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>Download All My Photos (Original)</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
                  {matchedPhotos.map((photo, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #EDEBFF' }}>
                      <img src={photo.thumb} onClick={() => setSelected(photo)} alt={`Your photo ${i + 1}`} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                      <button onClick={() => download(photo, i)} style={{ width: '100%', background: '#5B00B8', color: '#fff', border: 'none', padding: '8px', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>{downloaded.includes(photo.original) ? 'Downloaded - Download Again' : 'Download Original'}</button>
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
          <img src={selected.thumb} alt="Full" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12 }} />
          <p style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 12 }}>Preview is compressed - Download button gives Original Quality</p>
          <button onClick={(e) => { e.stopPropagation(); download(selected, 0); }} style={{ position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)', background: '#5B00B8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Download Original</button>
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 16, background: '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' }}>Close</button>
        </div>
      )}
    </div>
  );
}
export default function GuestPage() {
  return (<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}><GuestContent /></Suspense>);
}