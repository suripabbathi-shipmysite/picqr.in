'use client'
import { useState, useRef, Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from "@supabase/supabase-js"

// SAFE CLIENT - If env missing, app will not hang
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

type UploadItem = { id: string; name: string; file: File; preview: string; status: 'ready' | 'uploading' | 'done' | 'error' }

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

async function savePhotosBackup(eventId: string, previews: string[]) {
  try {
    const db = await openDB()
    const tx = db.transaction('photos', 'readwrite')
    const store = tx.objectStore('photos')
    const key = `picqr_photos_${eventId}`
    const existing: string[] = await new Promise((res) => {
      const r = store.get(key)
      r.onsuccess = () => res(r.result ? r.result.value : [])
      r.onerror = () => res([])
    })
    await new Promise<void>((res) => {
      const r = store.put({ key, value: [...existing, ...previews] })
      r.onsuccess = () => res()
      r.onerror = () => res()
    })
  } catch {}
}

// THUMB - For grid + face match only - 1200px, 0.8 quality
async function makeThumb(file: File): Promise<Blob> {
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej })
  let w = img.width, h = img.height
  const MAX = 1200
  if (w > MAX || h > MAX) { const r = Math.min(MAX / w, MAX / h); w = Math.floor(w * r); h = Math.floor(h * r) }
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/jpeg', 0.8))
}

function UploadContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlEvent = searchParams.get('event') || ''
  const [eventId, setEventId] = useState(urlEvent)
  const [userQrId, setUserQrId] = useState("")
  const [checking, setChecking] = useState(true)
  const [items, setItems] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // LOGIN CHECK + REAL QR ID - WITH TIMEOUT
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if(!supabase){ router.replace("/login?next=/upload"); return; }
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000));
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        if (!session) { router.replace("/login?next=/upload"); return; }
        if(cancelled) return;
        const qrId = `PQ-${session.user.id.slice(0, 6).toUpperCase()}`;
        setUserQrId(qrId);
        if (!urlEvent) setEventId(qrId);
      } catch {
        try{ router.replace("/login?next=/upload"); }catch{}
        return;
      } finally {
        if(!cancelled) setChecking(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [router, urlEvent]);

  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return
    setMessage('Processing...')
    const next: UploadItem[] = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      file,
      preview: URL.createObjectURL(file),
      status: 'ready' as const
    }))
    setItems((p) => [...p, ...next]); setMessage(''); e.target.value = ''
  }

  // DUAL UPLOAD - Original + Thumb
  const handleUploadAll = async () => {
    if (!items.length) return alert('Please select photos first')
    const finalEventId = eventId || userQrId
    if (!finalEventId) return alert('Event ID missing')
    if(!supabase) return alert('Server not connected. Please try after 1 min. Check Vercel Env keys.')
    setUploading(true); setMessage(''); setProgress("")
    let success = 0, failed = 0
    try {
      const previewsForBackup: string[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        setProgress(`Uploading ${i + 1} / ${items.length} - ${item.name}`)
        setItems(prev => prev.map(x => x.id === item.id ? { ...x, status: 'uploading' } : x))
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${item.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

        // 1. ORIGINAL - For download - 100% Quality
        const { error: origErr } = await supabase.storage.from("event-photos").upload(`${finalEventId}/original/${fileName}`, item.file, { upsert: false, contentType: item.file.type || "image/jpeg" })
        if (origErr) {
          console.error(origErr)
          failed++
          setItems(prev => prev.map(x => x.id === item.id ? { ...x, status: 'error' } : x))
          continue
        }

        // 2. THUMB - For grid + face match - Fast, Compressed
        try {
          const thumbBlob = await makeThumb(item.file)
          await supabase.storage.from("event-photos").upload(`${finalEventId}/thumb/${fileName}`, thumbBlob, { upsert: false, contentType: "image/jpeg" })
          const { data } = supabase.storage.from("event-photos").getPublicUrl(`${finalEventId}/thumb/${fileName}`)
          if (data.publicUrl) previewsForBackup.push(data.publicUrl)
        } catch {}

        success++
        setItems(prev => prev.map(x => x.id === item.id ? { ...x, status: 'done' } : x))
      }
      if (previewsForBackup.length) await savePhotosBackup(finalEventId, previewsForBackup)
      setMessage(`Uploaded ${success} photos to ${finalEventId}. ${failed ? `${failed} failed.` : ""} Guest can now scan QR and see them. Original quality saved for download.`)
      if (success > 0) setTimeout(() => router.push(`/events?id=${finalEventId}`), 1500)
    } catch (e: any) {
      alert('Upload failed: ' + (e.message || 'Try again'))
    }
    setUploading(false); setProgress("")
  }

  if (checking) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  const doneCount = items.filter(i => i.status === 'done').length

  return (
    <div style={{ minHeight: '100vh', background: '#FFF7ED', fontFamily: 'sans-serif' }}>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 28 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#5B0DBF', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Back to Dashboard</button>
        <h1 style={{ fontSize: 28, margin: '8px 0 0' }}>Upload Photos</h1>
        <p style={{ color: '#64748B' }}>Upload photos for Event <b>{eventId}</b>. All photos link to Your Permanent QR <b>{userQrId}</b>.</p>
        <p style={{ fontSize: 12, color: '#0A7A2F', fontWeight: 700, margin: '6px 0 0' }}>Auto Compress for fast upload + Original saved for full-quality download.</p>
        {message && <p style={{ background: '#E6FFED', padding: 12, borderRadius: 10, fontSize: 13 }}>{message}</p>}
        {progress && <p style={{ background: '#FFF0FF', padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{progress}</p>}
        <div style={{ background: '#fff', border: '2px dashed #E9D5FF', padding: 32, borderRadius: 20, textAlign: 'center', marginTop: 16 }}>
          <img src="/logo.png" alt="PicQR" style={{ height: 56 }} />
          <h3>Upload Photos</h3>
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onSelect} />
          <button onClick={() => inputRef.current?.click()} style={{ background: 'linear-gradient(135deg,#5B0DBF,#F97316)', color: '#fff', padding: '14px 32px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 700 }}>+ Select Photos</button>
          <p style={{ fontSize: 12, color: '#94A3B8' }}>JPG / PNG / HEIC supported • Auto Compress + Original Saved</p>
          {items.length > 0 && <p style={{ fontSize: 13, fontWeight: 700, marginTop: 10 }}>{items.length} selected • {doneCount} uploaded</p>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #F1E6FF' }}>
              <img src={item.preview} alt={item.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              <div style={{ padding: 10, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: item.status === 'done' ? 'green' : item.status === 'error' ? 'red' : item.status === 'uploading' ? '#FF7A2F' : '#666', fontWeight: 700 }}>{item.status === 'done' ? 'Done' : item.status === 'error' ? 'Failed' : item.status === 'uploading' ? 'Uploading...' : 'Ready'}</span>
                <button onClick={() => setItems((p) => p.filter((x) => x.id !== item.id))} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer' }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && <button onClick={handleUploadAll} disabled={uploading} style={{ width: '100%', marginTop: 16, background: uploading ? '#999' : 'linear-gradient(135deg,#5B0DBF,#F97316)', color: '#fff', padding: 16, borderRadius: 999, border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 700 }}>{uploading ? 'Uploading to Cloud...' : `Upload All (${items.length}) - Auto Compress + Original`}</button>}
      </main>
    </div>
  )
}
export default function UploadPage() {
  return (<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}><UploadContent /></Suspense>)
}