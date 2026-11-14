'use client'
import { useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type UploadItem = { id: string; name: string; preview: string; status: 'ready' | 'uploading' | 'done' }

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

async function savePhotos(eventId: string, previews: string[]) {
  const db = await openDB()
  const tx = db.transaction('photos', 'readwrite')
  const store = tx.objectStore('photos')
  const key = `picqr_photos_${eventId}`
  const existing: string[] = await new Promise((res) => {
    const r = store.get(key)
    r.onsuccess = () => res(r.result ? r.result.value : [])
    r.onerror = () => res([])
  })
  await new Promise<void>((res, rej) => {
    const r = store.put({ key, value: [...existing, ...previews] })
    r.onsuccess = () => res()
    r.onerror = () => rej(r.error)
  })
}

async function compressFile(file: File): Promise<string> {
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej })
  let w = img.width, h = img.height
  const MAX = 1200
  if (w > MAX || h > MAX) { const r = Math.min(MAX / w, MAX / h); w = Math.floor(w * r); h = Math.floor(h * r) }
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.75)
}

function UploadContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = searchParams.get('event') || 'SP-8821'
  const [items, setItems] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return
    setMessage('Processing...')
    const next: UploadItem[] = []
    for (const file of files) {
      try { const preview = await compressFile(file); next.push({ id: Math.random().toString(36).slice(2), name: file.name, preview, status: 'ready' }) } catch {}
    }
    setItems((p) => [...p, ...next]); setMessage(''); e.target.value = ''
  }
  const handleUploadAll = async () => {
    if (!items.length) return alert('Please select photos first')
    setUploading(true); setMessage('Saving photos to Permanent QR...')
    try {
      await savePhotos(eventId, items.map((i) => i.preview))
      setItems((p) => p.map((x) => ({ ...x, status: 'done' })))
      setMessage(`Saved ${items.length} photos for ${eventId}`)
      alert(`Success! ${items.length} Photos Uploaded`)
      router.push(`/events?id=${eventId}`)
    } catch { alert('Save failed. Please try with a smaller photo.') }
    setUploading(false)
  }
  return (
    <div style={{ minHeight: '100vh', background: '#FFF7ED', fontFamily: 'sans-serif' }}>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 28 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#5B0DBF', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Back to Dashboard</button>
        <h1 style={{ fontSize: 28, margin: '8px 0 0' }}>Upload Photos</h1>
        <p style={{ color: '#64748B' }}>Upload photos for Event {eventId}. All photos link to Permanent QR SP-8821.</p>
        {message && <p style={{ background: '#E6FFED', padding: 12, borderRadius: 10, fontSize: 13 }}>{message}</p>}
        <div style={{ background: '#fff', border: '2px dashed #E9D5FF', padding: 32, borderRadius: 20, textAlign: 'center', marginTop: 16 }}>
          <img src="/logo.png" alt="PicQR" style={{ height: 56 }} />
          <h3>Upload Photos</h3>
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onSelect} />
          <button onClick={() => inputRef.current?.click()} style={{ background: 'linear-gradient(135deg,#5B0DBF,#F97316)', color: '#fff', padding: '14px 32px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 700 }}>+ Select Photos</button>
          <p style={{ fontSize: 12, color: '#94A3B8' }}>JPG / PNG / HEIC supported</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #F1E6FF' }}>
              <img src={item.preview} alt={item.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              <div style={{ padding: 10, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.status === 'done' ? 'Done' : 'Ready'}</span>
                <button onClick={() => setItems((p) => p.filter((x) => x.id !== item.id))} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer' }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && <button onClick={handleUploadAll} disabled={uploading} style={{ width: '100%', marginTop: 16, background: 'linear-gradient(135deg,#5B0DBF,#F97316)', color: '#fff', padding: 16, borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 700 }}>{uploading ? 'Saving...' : `Upload All (${items.length})`}</button>}
      </main>
    </div>
  )
}
export default function UploadPage() {
  return (<Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}><UploadContent /></Suspense>)
}