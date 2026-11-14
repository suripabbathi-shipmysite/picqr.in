export default function Home(){
const input = {width:'100%',padding:'11px 12px',borderRadius:10,border:'1px solid #EDEBFF',background:'#fff',fontSize:13,outline:'none',boxSizing:'border-box' as const};
const label = {fontSize:11,fontWeight:700,color:'#333',display:'block' as const,marginBottom:4};
const card = {background:'#fff',padding:16,borderRadius:16,border:'1px solid #EDEBFF',flex:1,textAlign:'center' as const};
const section = {maxWidth:1100,margin:'0 auto',padding:'28px 4%'};
return (
<div style={{fontFamily:'Arial',background:'linear-gradient(180deg,#FFF0FF,#FFFBF8)',minHeight:'100vh'}}>

{/* HERO */}
<div style={{...section,display:'flex',gap:28,flexWrap:'wrap'}}>
<div style={{flex:'1 1 360px'}}>
<h1 style={{fontSize:38,lineHeight:1.1,margin:'10px 0'}}>First Event <span style={{color:'#FF7A2F'}}>FREE</span> -<br/>12 Hours Only</h1>
<p style={{fontSize:13,color:'#555',lineHeight:1.6}}>Instant photo delivery for weddings via QR code. Guests upload and download instantly - no app needed.</p>
<form action="/signup" method="get" style={{background:'#fff',border:'1px solid #F0E8FF',borderRadius:16,padding:16,boxShadow:'0 12px 30px rgba(91,0,184,0.08)'}}>
<div style={{marginBottom:10}}><label style={label}>Full Name</label><input style={input} placeholder="Enter your full name" name="name" /></div>
<div style={{marginBottom:10}}><label style={label}>Country</label><select style={input} name="country" defaultValue=""><option value="" disabled>Select your country</option><option>India</option><option>USA</option><option>UK</option><option>UAE</option><option>Canada</option><option>Australia</option><option>Other</option></select></div>
<div style={{marginBottom:12}}><label style={label}>Email ID</label><input style={input} placeholder="you@example.com" name="email" type="email" /></div>
<button type="submit" style={{width:'100%',background:'linear-gradient(90deg,#5B00B8,#FF7A2F)',color:'#fff',border:'none',padding:'12px',borderRadius:10,fontWeight:800,cursor:'pointer'}}>Create Free Event</button>
<p style={{fontSize:11,color:'#888',textAlign:'center',margin:'8px 0 0'}}>No credit card required - Free for 12 hours</p>
</form>
</div>
<div style={{flex:'1 1 420px'}}>
<div style={{display:'flex',height:200}}>
<div style={{width:'38%',background:'linear-gradient(135deg,#5B00B8,#8A2BFF)',borderRadius:16,margin:'12px 0'}}></div>
<div style={{width:'62%',background:'linear-gradient(135deg,#FF7A2F,#FF8A3D)',borderRadius:16,marginLeft:-28,display:'flex',alignItems:'center',justifyContent:'center'}}>
<div style={{background:'#111',borderRadius:20,padding:5,width:120}}><div style={{background:'linear-gradient(180deg,#FF7A2F,#FF5A2F)',borderRadius:14,padding:'10px 8px',textAlign:'center',color:'#fff'}}><div style={{background:'#fff',borderRadius:8,padding:8,width:76,margin:'0 auto'}}><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=5&data=https%3A%2F%2Fpicqr.in%2Fguest%3Fid%3DSP-8821" alt="Scan to get photos" style={{width:76,height:76,display:'block'}} /></div><b style={{fontSize:11,display:'block',marginTop:7}}>Share photos<br/>in seconds</b></div></div>
</div>
</div>
<div id="how" style={{scrollMarginTop:90}}>
<h3 style={{textAlign:'center',fontSize:16,margin:'18px 0 4px'}}>How It Works</h3>
<p style={{textAlign:'center',fontSize:11,color:'#888',margin:'0 0 12px'}}>Get started in 3 simple steps</p>
<div style={{display:'flex',gap:12}}>
<div style={card}><div style={{fontSize:22}}>☁️</div><b style={{fontSize:12}}>Upload</b><p style={{fontSize:11,color:'#666'}}>Create your event and upload photos securely</p></div>
<div style={card}><div style={{fontSize:22}}>🔳</div><b style={{fontSize:12}}>QR Code</b><p style={{fontSize:11,color:'#666'}}>Share QR code with guests at your event</p></div>
<div style={card}><div style={{fontSize:22}}>👥</div><b style={{fontSize:12}}>Guests Download</b><p style={{fontSize:11,color:'#666'}}>Guests scan, view and download instantly</p></div>
</div>
</div>
</div>
</div>

{/* FEATURES - FULL PAGE FILL */}
<div id="features" style={{...section,background:'#fff',borderRadius:20,border:'1px solid #F0E8FF',scrollMarginTop:90}}>
<h2 style={{textAlign:'center',fontSize:24,margin:'0 0 6px'}}>Why Photographers Love PicQR</h2>
<p style={{textAlign:'center',fontSize:13,color:'#666',margin:'0 0 18px'}}>No app. No waiting. No WhatsApp compression.</p>
<div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
{[['⚡','Fast Delivery','Photos reach guests in seconds, not days'],['🔒','Private & Secure','Guests see only their own photos'],['📱','No App Needed','Scan QR, selfie, download - done'],['🖼️','Original Quality','No compression, full quality download'],['🔳','One Permanent QR','Print once, use for all events'],['💾','Auto Delete','Photos auto-delete as per plan']].map((f,i)=>(
<div key={i} style={{...card,flex:'1 1 160px'}}><div style={{fontSize:24}}>{f[0]}</div><b style={{fontSize:13}}>{f[1]}</b><p style={{fontSize:11,color:'#666',margin:'6px 0 0'}}>{f[2]}</p></div>
))}
</div>
</div>

{/* PRICING TEASER - PRICE NUMBERS IKKADA LEVU - SERVER NUNDE VASTHAYI */}
<div id="pricing" style={{...section,textAlign:'center',scrollMarginTop:90}}>
<h2 style={{fontSize:24,margin:'0 0 6px'}}>Simple Pricing For Every Country</h2>
<p style={{fontSize:13,color:'#666',margin:'0 0 14px'}}>Login to see price for your country only. Other country prices are not shown.</p>
<a href="/login?next=/pricing" style={{display:'inline-block',background:'linear-gradient(90deg,#5B00B8,#FF7A2F)',color:'#fff',padding:'12px 26px',borderRadius:30,fontWeight:800,fontSize:14,textDecoration:'none'}}>See My Pricing</a>
</div>

{/* TESTIMONIALS */}
<div style={{...section,background:'#0F0A24',borderRadius:20,color:'#fff'}}>
<h2 style={{textAlign:'center',fontSize:22,margin:'0 0 14px'}}>Trusted By Photographers</h2>
<div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
{[['Suresh Pabbathi','Hyderabad','Guests got photos same day. No more WhatsApp requests.'],['Amit Sharma','Delhi','QR system saved 5 hours per wedding.'],['Priya Nair','Kochi','Clients loved selfie search. Very easy.']].map((t,i)=>(
<div key={i} style={{flex:'1 1 200px',background:'#1A1230',padding:16,borderRadius:14}}><b style={{fontSize:13}}>{t[0]}</b><p style={{fontSize:11,color:'#aaa',margin:'2px 0 8px'}}>{t[1]}</p><p style={{fontSize:12,lineHeight:1.5,margin:0}}>{t[2]}</p></div>
))}
</div>
</div>

{/* FAQ + CTA */}
<div style={{...section,textAlign:'center',paddingBottom:50}}>
<h2 style={{fontSize:22}}>Frequently Asked Questions</h2>
<p style={{fontSize:13,color:'#666',textAlign:'left',maxWidth:700,margin:'12px auto',lineHeight:1.8}}><b>Do guests need an app?</b> - No. Scan QR, take selfie, download.<br/><b>Is my QR permanent?</b> - Yes. One QR for all events.<br/><b>When do photos delete?</b> - As per your plan. Free event deletes in 12 hours.</p>
<a href="/signup" style={{display:'inline-block',background:'#FF3B30',color:'#fff',padding:'13px 30px',borderRadius:30,fontWeight:800,fontSize:14,textDecoration:'none',marginTop:10}}>Start Free Event Now</a>
</div>

</div>
);}