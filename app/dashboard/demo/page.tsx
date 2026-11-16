"use client";
import { useState } from "react";

export default function Demo(){
const [step,setStep] = useState(1);
const [found,setFound] = useState(false);

const steps = [
{ n:1, t:"Step 1: Photographer Creates an Event", d:"The photographer clicks New Event in the dashboard. Example: Raj & Anjali Wedding - Hyderabad. Instantly, a unique QR code and guest link are created for this event.", img:"https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80", tag:"PHOTOGRAPHER SIDE" },
{ n:2, t:"Step 2: Photographer Uploads Photos", d:"The photographer uploads all 600 photos from the wedding in the browser. HD and 4K photos are supported. All photos are stored securely on PicQR.", img:"https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80", tag:"UPLOAD" },
{ n:3, t:"Step 3: QR is Shared With Guests", d:"The QR poster is printed and placed at the venue. Or the link is shared on WhatsApp. Guests do not need to install any app - they just scan the QR.", img:"https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80", tag:"QR SHARE" },
{ n:4, t:"Step 4: Guest Takes One Selfie", d:"The guest camera opens on their phone. They take one selfie. PicQR AI searches for that face in all 600 photos. The selfie is never saved - 100% private.", img:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80", tag:"GUEST SELFIE" },
{ n:5, t:"Step 5: Guest Gets Only Their Photos", d:"In 10-30 seconds, the guest sees only the 18 photos they appear in. They cannot see other guests photos. They can download in full resolution or share them.", img:"https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=600&q=80", tag:"RESULT" },
];

const s = steps[step-1];

return (<div style={{padding:24,background:'#F6F4FF',minHeight:'100vh',fontFamily:'Arial'}}>
<a href="/" style={{textDecoration:"none",color:"#666",fontWeight:600}}>← Home</a>
<a href="/dashboard" style={{textDecoration:'none',color:'#5B00B8',fontWeight:800}}>← Back to Dashboard</a>

<div style={{maxWidth:760,margin:'16px auto',background:'#fff',padding:26,borderRadius:22,border:'1px solid #EDEBFF'}}>
<span style={{background:'#F0E8FF',color:'#5B00B8',padding:'6px 12px',borderRadius:20,fontSize:12,fontWeight:800}}>✦ LIVE DEMO - HOW PICQR WORKS</span>
<h1 style={{fontSize:28,margin:'14px 0 6px'}}>View Demo - Step by Step</h1>
<p style={{color:'#666',fontSize:13,margin:0}}>See this demo once and you can explain it easily to your clients.</p>

<div style={{display:'flex',gap:6,marginTop:20}}>{steps.map((x,i)=>(<div key={i} onClick={()=>setStep(x.n)} style={{flex:1,height:8,borderRadius:10,background: step>=x.n ? 'linear-gradient(90deg,#5B00B8,#FF7A2F)' : '#EDEBFF',cursor:'pointer'}}></div>))}</div>
<p style={{fontSize:12,color:'#888',margin:'8px 0 0'}}>Step {step} of 5 - Click to go to the next step</p>

<img src={s.img} style={{width:'100%',height:260,objectFit:'cover',borderRadius:16,marginTop:16}}/>
<span style={{display:'inline-block',marginTop:14,background:'#FFF0E6',color:'#FF7A2F',padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:800}}>{s.tag}</span>
<h2 style={{fontSize:20,margin:'10px 0 8px'}}>{s.t}</h2>
<p style={{color:'#555',lineHeight:1.7,fontSize:14}}>{s.d}</p>

{step===4 && (<div style={{background:'#F6F4FF',padding:18,borderRadius:14,marginTop:14,textAlign:'center'}}>
{!found ? (<><p style={{fontWeight:800}}>👉 Try It - Click the Selfie Button</p><button onClick={()=>setFound(true)} style={{background:'linear-gradient(90deg,#5B00B8,#FF7A2F)',color:'#fff',border:'none',padding:'12px 24px',borderRadius:30,fontWeight:800,marginTop:10}}>📸 Take Selfie</button></>) : (<><p style={{fontWeight:800,color:'#008000'}}>✓ Face Found! Found 18 photos out of 600 photos</p><button onClick={()=>setStep(5)} style={{background:'#0F0A24',color:'#fff',border:'none',padding:'12px 24px',borderRadius:30,fontWeight:800,marginTop:10}}>See My 18 Photos →</button></>)}
</div>)}

{step===5 && (<div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap'}}>{[1,2,3].map(i=>(<img key={i} src={`https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=300&q=80`} style={{width:110,height:90,objectFit:'cover',borderRadius:12}}/>))}<p style={{width:'100%',fontSize:13,color:'#666',margin:0}}>This is how the guest sees only their own photos. The other 582 photos are not visible to them.</p></div>)}

<div style={{display:'flex',justifyContent:'space-between',marginTop:22,gap:12}}>
<button disabled={step===1} onClick={()=>{setStep(step-1);setFound(false)}} style={{padding:'12px 20px',borderRadius:30,border:'1.5px solid #E5E0F0',background:'#fff',fontWeight:700,opacity:step===1?0.4:1}}>← Previous</button>
{step<5 ? <button onClick={()=>{setStep(step+1);setFound(false)}} style={{padding:'12px 22px',borderRadius:30,border:'none',background:'linear-gradient(90deg,#5B00B8,#FF7A2F)',color:'#fff',fontWeight:800}}>Next Step →</button> : <a href="/dashboard/new-event" style={{padding:'12px 22px',borderRadius:30,background:'linear-gradient(90deg,#5B00B8,#FF7A2F)',color:'#fff',fontWeight:800,textDecoration:'none'}}>Create My First Event →</a>}
</div>
</div>

<div style={{maxWidth:760,margin:'14px auto',background:'#0F0A24',color:'#fff',padding:20,borderRadius:18,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
<div><b>In Simple Words:</b><p style={{margin:'6px 0 0',fontSize:13,opacity:0.8}}>Scan QR → Take Selfie → Get Your Photos. That&apos;s it! No app needed.</p></div>
<a href="/dashboard/new-event" style={{background:'#fff',color:'#5B00B8',padding:'11px 18px',borderRadius:30,fontWeight:800,fontSize:13,textDecoration:'none'}}>Start Now →</a>
</div>
</div>)}