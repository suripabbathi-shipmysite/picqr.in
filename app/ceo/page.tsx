"use client";
import { useState } from "react";

const CEO_EMAIL = "suripabbathi94@gmail.com";
const DEMO_OTP = "123456";

type Area = { id: string; name: string; countries: string; symbol: string; perEvent: number; monthly: number; yearly: number; users: number; income: number };
type Expense = { id: number; type: string; amount: number; date: string; note: string; status: string };
type Tx = { id: number; type: string; amount: number; date: string; status: string; method: string };
type Partner = { id: number; name: string; mail: string; mobile: string; share: number; bankName: string; accountLast4: string; ifsc: string; upi: string; status: string };

const INITIAL_AREAS: Area[] = [
  { id: "india", name: "India", countries: "India", symbol: "Rs", perEvent: 399, monthly: 999, yearly: 9999, users: 120, income: 85000 },
  { id: "low", name: "LOW", countries: "Pakistan, Bangladesh, Nepal, Sri Lanka", symbol: "$", perEvent: 4, monthly: 12, yearly: 119, users: 45, income: 540 },
  { id: "gulf", name: "GULF", countries: "UAE, Qatar, Saudi, Singapore, Malaysia", symbol: "$", perEvent: 15, monthly: 39, yearly: 349, users: 30, income: 890 },
  { id: "premium", name: "PREMIUM", countries: "USA, UK, Canada, Australia, Europe", symbol: "$", perEvent: 29, monthly: 99, yearly: 899, users: 25, income: 2100 },
];

export default function CeoDashboard() {
  const [isLogged, setIsLogged] = useState(false);
  const [mail, setMail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState("overview");
  const [areas, setAreas] = useState<Area[]>(INITIAL_AREAS);
  const [priceLog, setPriceLog] = useState<string[]>(["Initial prices loaded"]);
  const [globalPct, setGlobalPct] = useState(10);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, type: "Vercel", amount: 1500, date: "2026-11-01", note: "Hosting", status: "Paid" },
    { id: 2, type: "Supabase", amount: 2000, date: "2026-11-01", note: "Database", status: "Paid" },
  ]);
  const [expType, setExpType] = useState("Vercel");
  const [expAmount, setExpAmount] = useState("");
  const [expNote, setExpNote] = useState("");
  const [balance, setBalance] = useState(46500);
  const [txs, setTxs] = useState<Tx[]>([{ id: 1, type: "Add Money", amount: 50000, date: "2026-11-01", status: "Approved", method: "UPI" }]);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletMethod, setWalletMethod] = useState("UPI");
  const [walletMsg, setWalletMsg] = useState("");

  // --- CEO BANK DETAILS - YOUR MAIN RAZORPAY BANK ---
  const [ceoBank, setCeoBank] = useState({ name: "Your Name", bankName: "HDFC Bank", accountLast4: "1234", ifsc: "HDFC0001234", upi: "yourname@okhdfc", mobile: "90000 00000" });
  const [showBank, setShowBank] = useState(false);

  // --- PARTNERS ---
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pName, setPName] = useState("");
  const [pMail, setPMail] = useState("");
  const [pMobile, setPMobile] = useState("");
  const [pShare, setPShare] = useState("30");
  const [pBank, setPBank] = useState("");
  const [pAcc, setPAcc] = useState("");
  const [pIfsc, setPIfsc] = useState("");
  const [pUpi, setPUpi] = useState("");

  const photographers = [
    { id: "SP-8821", studio: "Suresh Photography", owner: "Suresh Pabbathi", country: "IN", plan: "Monthly", events: 3, revenue: 999 },
    { id: "SP-8822", studio: "Amit Studio", owner: "Amit Sharma", country: "IN", plan: "Yearly", events: 12, revenue: 9999 },
  ];

  const totalIncomeINR = areas.find(a => a.id === "india")?.income || 0;
  const totalIncomeUSD = areas.filter(a => a.id !== "india").reduce((a, x) => a + x.income, 0);
  const totalExpense = expenses.filter(e => e.status === "Paid").reduce((a, e) => a + e.amount, 0);
  const totalUsers = areas.reduce((a, x) => a + x.users, 0);
  const totalPartnerShare = partners.reduce((a, p) => a + p.share, 0);
  const ceoShare = 100 - totalPartnerShare;

  const sendOtp = () => {
    if (mail.trim().toLowerCase() !== CEO_EMAIL.trim().toLowerCase()) { setLoginError("Access Denied. Expected: " + CEO_EMAIL); return; }
    setOtpSent(true); setLoginError("");
  };
  const verifyOtp = () => {
    if (otp.trim() !== DEMO_OTP) { setLoginError("Wrong OTP. Use 123456"); return; }
    setIsLogged(true);
  };

  const addPartner = () => {
    if (!pName || !pMail || !pMobile || !pShare) { setWalletMsg("Fill Name, Mail, Mobile, Share %"); return; }
    if (totalPartnerShare + Number(pShare) > 100) { setWalletMsg("Total share cannot be more than 100%. CEO share now is " + ceoShare + "%"); return; }
    const newP: Partner = { id: Date.now(), name: pName, mail: pMail, mobile: pMobile, share: Number(pShare), bankName: pBank, accountLast4: pAcc.slice(-4) || "----", ifsc: pIfsc, upi: pUpi, status: "Active" };
    setPartners([...partners, newP]);
    setPName(""); setPMail(""); setPMobile(""); setPShare("30"); setPBank(""); setPAcc(""); setPIfsc(""); setPUpi("");
    setWalletMsg("Partner added. Partner can also login with OTP using their mail.");
  };
  const removePartner = (id: number) => setPartners(partners.filter(p => p.id !== id));
  const payPartner = (p: Partner) => {
    const amount = Math.round((totalIncomeINR * p.share) / 100);
    if (amount > balance) { setWalletMsg("Insufficient wallet balance to pay partner."); return; }
    setBalance(balance - amount);
    setTxs([{ id: Date.now(), type: `Pay to Partner - ${p.name}`, amount, date: new Date().toISOString().slice(0, 10), status: "Paid to " + p.upi, method: "Bank / UPI" }, ...txs]);
    setWalletMsg(`Rs ${amount} paid to ${p.name} (${p.share}%).`);
  };

  const applyGlobal = (isIncrease: boolean) => {
    const factor = isIncrease ? (1 + globalPct / 100) : (1 - globalPct / 100);
    const updated = areas.map(a => ({ ...a, perEvent: Math.round(a.perEvent * factor), monthly: Math.round(a.monthly * factor), yearly: Math.round(a.yearly * factor) }));
    setAreas(updated); setPriceLog([`Global ${isIncrease ? "+" : "-"}${globalPct}% applied. India Monthly now Rs ${updated[0].monthly}.`, ...priceLog]);
  };
  const resetPrices = () => { setAreas(INITIAL_AREAS); setPriceLog(["Prices reset.", ...priceLog]); };
  const updateAreaPrice = (id: string, field: "perEvent" | "monthly" | "yearly", value: number) => { setAreas(areas.map(a => a.id === id ? { ...a, [field]: value } : a)); };
  const saveArea = (a: Area) => { setPriceLog([`${a.name} saved - Monthly ${a.symbol}${a.monthly}`, ...priceLog]); };
  const addExpense = () => {
    if (!expAmount) return;
    setExpenses([{ id: Date.now(), type: expType, amount: Number(expAmount), date: new Date().toISOString().slice(0, 10), note: expNote || expType, status: "Paid" }, ...expenses]);
    setBalance(balance - Number(expAmount)); setExpAmount(""); setExpNote("");
  };
  const addMoney = () => {
    const amt = Number(walletAmount);
    if (!amt || amt < 100) { setWalletMsg("Minimum Add Money is Rs 100."); return; }
    setBalance(balance + amt); setTxs([{ id: Date.now(), type: "Add Money", amount: amt, date: new Date().toISOString().slice(0, 10), status: "Approved", method: walletMethod }, ...txs]);
    setWalletMsg(`Rs ${amt} added.`); setWalletAmount("");
  };
  const withdrawMoney = () => {
    const amt = Number(walletAmount);
    if (!amt || amt < 1000) { setWalletMsg("Minimum Withdraw is Rs 1000."); return; }
    if (amt > balance) { setWalletMsg("Insufficient balance."); return; }
    setBalance(balance - amt); setTxs([{ id: Date.now(), type: "Withdraw", amount: amt, date: new Date().toISOString().slice(0, 10), status: "Pending - 24 Hours Hold", method: walletMethod }, ...txs]);
    setWalletMsg(`Withdraw Rs ${amt} requested.`); setWalletAmount("");
  };

  if (!isLogged) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F0A24', fontFamily: 'Arial', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 420, maxWidth: '100%', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 4px' }}>CEO Dashboard</h2>
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px' }}>Only CEO mail ID can open this page.</p>
        {!otpSent ? (<><input value={mail} onChange={e => setMail(e.target.value)} placeholder="Enter CEO Mail ID" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #EDEBFF', fontSize: 13, boxSizing: 'border-box' }} /><button onClick={sendOtp} style={{ width: '100%', background: '#0F0A24', color: '#fff', border: 'none', padding: 12, borderRadius: 12, fontWeight: 800, marginTop: 12, cursor: 'pointer' }}>Send OTP</button></>) : (<><p style={{ fontSize: 12, color: '#666' }}>OTP sent to {mail}</p><input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6 Digit OTP" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #EDEBFF', fontSize: 13, boxSizing: 'border-box' }} /><button onClick={verifyOtp} style={{ width: '100%', background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', border: 'none', padding: 12, borderRadius: 12, fontWeight: 800, marginTop: 12, cursor: 'pointer' }}>Verify & Open Dashboard</button></>)}
        {loginError && <p style={{ fontSize: 12, color: 'red', marginTop: 12 }}>{loginError}</p>}
        <p style={{ fontSize: 11, color: '#888', marginTop: 14 }}>Demo OTP: 123456</p>
      </div>
    </div>
  );

  const sideLink = { display: 'flex', gap: 10, alignItems: 'center', padding: '11px 12px', borderRadius: 10, color: '#ccc', fontSize: 13, cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', textAlign: 'left' as const };
  const sideActive = { ...sideLink, background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', fontWeight: 800 };
  const card = { background: '#fff', border: '1px solid #EDEBFF', borderRadius: 16, padding: 16 };
  const input = { padding: '10px 12px', borderRadius: 10, border: '1px solid #EDEBFF', fontSize: 13, outline: 'none' };
  const btn = { background: '#0F0A24', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial', background: '#F8F7FF' }}>
      <div style={{ width: 250, background: '#0F0A24', color: '#fff', padding: '18px 14px', flexShrink: 0 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', color: '#0F0A24', fontWeight: 900 }}>PicQR - CEO</div>
        <div style={{ background: 'linear-gradient(135deg,#FF7A2F,#FF5A2F)', borderRadius: 12, padding: 12, marginTop: 16 }}><b style={{ fontSize: 13 }}>CEO - {mail}</b><p style={{ fontSize: 11, margin: '4px 0 0' }}>Wallet: Rs {balance.toLocaleString()} • CEO Share: {ceoShare}%</p></div>
        <p style={{ fontSize: 10, color: '#888', margin: '18px 6px 6px' }}>CEO MENU</p>
        <button onClick={() => setTab("overview")} style={tab === "overview" ? sideActive : sideLink}>Overview</button>
        <button onClick={() => setTab("photographers")} style={tab === "photographers" ? sideActive : sideLink}>Photographers</button>
        <button onClick={() => setTab("price")} style={tab === "price" ? sideActive : sideLink}>Price Control</button>
        <button onClick={() => setTab("income")} style={tab === "income" ? sideActive : sideLink}>Income - Area Wise</button>
        <button onClick={() => setTab("expenses")} style={tab === "expenses" ? sideActive : sideLink}>Expenses</button>
        <button onClick={() => setTab("wallet")} style={tab === "wallet" ? sideActive : sideLink}>Wallet</button>
        <button onClick={() => setTab("partner")} style={tab === "partner" ? sideActive : sideLink}>Partner & Bank Details</button>
        <button onClick={() => setIsLogged(false)} style={{ ...sideLink, color: '#FF7A2F' }}>Logout</button>
      </div>
      <div style={{ flex: 1, padding: '20px 22px' }}>
        <h1 style={{ fontSize: 24, margin: 0, textTransform: 'capitalize' }}>{tab === "price" ? "Price Control" : tab === "partner" ? "Partner & Bank Details" : tab}</h1>
        {walletMsg && <p style={{ fontSize: 12, color: '#5B00B8', background: '#fff', padding: '10px 14px', borderRadius: 10, marginTop: 12 }}>{walletMsg}</p>}

        {tab === "overview" && (<><div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>{[{ l: 'Income - India', v: `Rs ${totalIncomeINR.toLocaleString()}` }, { l: 'Income - Other', v: `$${totalIncomeUSD}` }, { l: 'Total Expense', v: `Rs ${totalExpense.toLocaleString()}` }, { l: 'Wallet Balance', v: `Rs ${balance.toLocaleString()}` }, { l: 'Total Users', v: String(totalUsers) }, { l: 'Partners', v: `${partners.length} • CEO Share ${ceoShare}%` }].map((s, i) => (<div key={i} style={{ ...card, flex: '1 1 160px' }}><p style={{ fontSize: 11, color: '#888', margin: 0 }}>{s.l}</p><p style={{ fontSize: 20, fontWeight: 900, margin: '6px 0 0' }}>{s.v}</p></div>))}</div><div style={{ ...card, marginTop: 14 }}><b>Price History</b>{priceLog.map((l, i) => (<p key={i} style={{ fontSize: 12, color: '#666', margin: '6px 0 0' }}>• {l}</p>))}</div></>)}
        {tab === "photographers" && (<div style={{ ...card, marginTop: 16 }}>{photographers.map(p => (<div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F0F0F0' }}><div><b style={{ fontSize: 13 }}>{p.studio}</b><p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>{p.owner} • {p.country} • {p.plan}</p></div><span style={{ fontSize: 12, fontWeight: 800 }}>Events: {p.events} • Rs {p.revenue}</span></div>))}</div>)}
        {tab === "price" && (<div style={{ marginTop: 16 }}><div style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}><b style={{ fontSize: 13 }}>Global:</b><input type="number" value={globalPct} onChange={e => setGlobalPct(Number(e.target.value))} style={{ ...input, width: 80 }} /><span>%</span><button onClick={() => applyGlobal(true)} style={{ ...btn, background: '#008000' }}>+ Increase All</button><button onClick={() => applyGlobal(false)} style={{ ...btn, background: '#C00' }}>- Decrease All</button><button onClick={resetPrices} style={{ ...btn, background: '#666' }}>Reset</button></div><div style={{ ...card, marginTop: 14 }}>{areas.map(a => (<div key={a.id} style={{ border: '1px solid #EDEBFF', borderRadius: 12, padding: 14, marginTop: 12 }}><b style={{ fontSize: 13 }}>{a.name} - {a.countries}</b><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}><label style={{ fontSize: 12 }}>Per Event <input type="number" value={a.perEvent} onChange={e => updateAreaPrice(a.id, "perEvent", Number(e.target.value))} style={{ ...input, width: 90 }} /></label><label style={{ fontSize: 12 }}>Monthly <input type="number" value={a.monthly} onChange={e => updateAreaPrice(a.id, "monthly", Number(e.target.value))} style={{ ...input, width: 90 }} /></label><label style={{ fontSize: 12 }}>Yearly <input type="number" value={a.yearly} onChange={e => updateAreaPrice(a.id, "yearly", Number(e.target.value))} style={{ ...input, width: 90 }} /></label><button onClick={() => saveArea(a)} style={{ ...btn, background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)' }}>Save</button></div></div>))}</div></div>)}
        {tab === "income" && (<div style={{ ...card, marginTop: 16 }}>{areas.map(a => (<div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #F0F0F0' }}><div><b style={{ fontSize: 13 }}>{a.name}</b><p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>{a.countries}<br />Per {a.symbol}{a.perEvent} • Monthly {a.symbol}{a.monthly} • Yearly {a.symbol}{a.yearly}</p></div><b>{a.symbol}{a.income.toLocaleString()} • {a.users} users</b></div>))}</div>)}
        {tab === "expenses" && (<div style={{ marginTop: 16 }}><div style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap' }}><select value={expType} onChange={e => setExpType(e.target.value)} style={input}><option>Vercel</option><option>Supabase</option><option>Domain</option><option>Other</option></select><input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="Amount in Rs" type="number" style={{ ...input, flex: '1 1 120px' }} /><input value={expNote} onChange={e => setExpNote(e.target.value)} placeholder="Note" style={{ ...input, flex: '1 1 200px' }} /><button onClick={addExpense} style={{ ...btn, background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)' }}>+ Add Expense</button></div><div style={{ ...card, marginTop: 14 }}><b>Total Expense: Rs {totalExpense.toLocaleString()}</b>{expenses.map(e => (<div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F0F0F0' }}><span style={{ fontSize: 13 }}>{e.type} - {e.note} • {e.date}</span><b>Rs {e.amount}</b></div>))}</div></div>)}
        {tab === "wallet" && (<div style={{ marginTop: 16 }}><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><div style={{ ...card, flex: '1 1 200px', background: '#0F0A24', color: '#fff' }}><p style={{ fontSize: 11, margin: 0 }}>Wallet Balance</p><p style={{ fontSize: 26, fontWeight: 900, margin: '8px 0 0' }}>Rs {balance.toLocaleString()}</p></div><div style={{ ...card, flex: '1 1 260px' }}><b>Add / Withdraw</b><div style={{ display: 'flex', gap: 8, marginTop: 10 }}><input value={walletAmount} onChange={e => setWalletAmount(e.target.value)} placeholder="Amount" type="number" style={{ ...input, flex: 1 }} /><select value={walletMethod} onChange={e => setWalletMethod(e.target.value)} style={input}><option>UPI</option><option>Bank Transfer</option><option>Card</option></select></div><div style={{ display: 'flex', gap: 8, marginTop: 10 }}><button onClick={addMoney} style={{ ...btn, background: '#008000', flex: 1 }}>+ Add (Min 100)</button><button onClick={withdrawMoney} style={{ ...btn, background: '#FF7A2F', flex: 1 }}>Withdraw (Min 1000)</button></div></div></div><div style={{ ...card, marginTop: 14 }}><b>History</b>{txs.map(t => (<div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F0F0F0' }}><span style={{ fontSize: 13 }}>{t.type} • {t.method} • {t.date} • {t.status}</span><b>Rs {t.amount}</b></div>))}</div></div>)}

        {tab === "partner" && (
          <div style={{ marginTop: 16 }}>
            <div style={{ ...card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}><b>Your Bank Details - Razorpay Main Account</b><button onClick={() => setShowBank(!showBank)} style={{ ...btn, background: '#5B00B8' }}>{showBank ? "Hide Bank Details" : "Show Bank Details"}</button></div>
              <p style={{ fontSize: 11, color: '#888', margin: '8px 0 0' }}>Razorpay money comes to this bank only. Partner share is paid by you from this bank.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <input value={ceoBank.name} onChange={e => setCeoBank({ ...ceoBank, name: e.target.value })} placeholder="Your Full Name" style={{ ...input, flex: '1 1 160px' }} />
                <input value={ceoBank.mobile} onChange={e => setCeoBank({ ...ceoBank, mobile: e.target.value })} placeholder="Your Mobile" style={{ ...input, flex: '1 1 140px' }} />
                <input value={ceoBank.bankName} onChange={e => setCeoBank({ ...ceoBank, bankName: e.target.value })} placeholder="Bank Name" style={{ ...input, flex: '1 1 140px' }} />
                <input value={ceoBank.accountLast4} onChange={e => setCeoBank({ ...ceoBank, accountLast4: e.target.value })} placeholder="Account Last 4 Digits Only" style={{ ...input, flex: '1 1 140px' }} />
                <input value={ceoBank.ifsc} onChange={e => setCeoBank({ ...ceoBank, ifsc: e.target.value })} placeholder="IFSC" style={{ ...input, flex: '1 1 140px' }} />
                <input value={ceoBank.upi} onChange={e => setCeoBank({ ...ceoBank, upi: e.target.value })} placeholder="UPI ID" style={{ ...input, flex: '1 1 160px' }} />
              </div>
              {showBank && <p style={{ fontSize: 12, background: '#F8F7FF', padding: 12, borderRadius: 10, marginTop: 12, lineHeight: 1.7 }}>Name: {ceoBank.name}<br />Bank: {ceoBank.bankName} • Account Ending: ****{ceoBank.accountLast4}<br />IFSC: {ceoBank.ifsc} • UPI: {ceoBank.upi} • Mobile: {ceoBank.mobile}</p>}
            </div>

            <div style={{ ...card, marginTop: 14 }}>
              <b>Add CEO Partner</b>
              <p style={{ fontSize: 11, color: '#888', margin: '6px 0 0' }}>CEO Share Now: {ceoShare}% • Partner Total: {totalPartnerShare}% • Partner will login with their mail + OTP.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Partner Name" style={{ ...input, flex: '1 1 160px' }} />
                <input value={pMail} onChange={e => setPMail(e.target.value)} placeholder="Partner Mail ID" style={{ ...input, flex: '1 1 180px' }} />
                <input value={pMobile} onChange={e => setPMobile(e.target.value)} placeholder="Partner Mobile" style={{ ...input, flex: '1 1 140px' }} />
                <input value={pShare} onChange={e => setPShare(e.target.value)} placeholder="Share % - Ex: 30" type="number" style={{ ...input, flex: '1 1 100px' }} />
                <input value={pBank} onChange={e => setPBank(e.target.value)} placeholder="Partner Bank Name" style={{ ...input, flex: '1 1 140px' }} />
                <input value={pAcc} onChange={e => setPAcc(e.target.value)} placeholder="Partner Account Last 4" style={{ ...input, flex: '1 1 140px' }} />
                <input value={pIfsc} onChange={e => setPIfsc(e.target.value)} placeholder="Partner IFSC" style={{ ...input, flex: '1 1 140px' }} />
                <input value={pUpi} onChange={e => setPUpi(e.target.value)} placeholder="Partner UPI ID" style={{ ...input, flex: '1 1 160px' }} />
                <button onClick={addPartner} style={{ ...btn, background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', width: '100%' }}>+ Add Partner</button>
              </div>
            </div>

            <div style={{ ...card, marginTop: 14 }}>
              <b>Partner List & Profit Split - Razorpay Income Rs {totalIncomeINR.toLocaleString()}</b>
              {partners.length === 0 && <p style={{ fontSize: 12, color: '#888', marginTop: 10 }}>No partner added yet. Add partner above.</p>}
              {partners.map(p => {
                const shareAmount = Math.round((totalIncomeINR * p.share) / 100);
                return (
                  <div key={p.id} style={{ border: '1px solid #EDEBFF', borderRadius: 12, padding: 14, marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div><b style={{ fontSize: 14 }}>{p.name} - {p.share}% Share</b><p style={{ fontSize: 12, color: '#666', margin: '4px 0 0', lineHeight: 1.6 }}>Mail: {p.mail}<br />Mobile: {p.mobile}<br />Bank: {p.bankName} • Acc ****{p.accountLast4} • IFSC: {p.ifsc} • UPI: {p.upi}</p></div>
                      <div style={{ textAlign: 'right' }}><b style={{ fontSize: 16, color: '#008000' }}>Share Amount: Rs {shareAmount.toLocaleString()}</b><p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>From Total Income Rs {totalIncomeINR.toLocaleString()}</p></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={() => payPartner(p)} style={{ ...btn, background: '#008000' }}>Pay Rs {shareAmount.toLocaleString()} To Partner</button>
                      <button onClick={() => removePartner(p.id)} style={{ ...btn, background: '#C00' }}>Remove Partner</button>
                    </div>
                  </div>
                );
              })}
              <div style={{ background: '#F8F7FF', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 12, lineHeight: 1.7 }}>
                <b>How Razorpay Split Works:</b><br />1. Customer pays via Razorpay - Money goes to Your Bank ({ceoBank.bankName} ****{ceoBank.accountLast4})<br />2. Dashboard calculates Partner Share - Example: Total Rs 85,000, Partner 30% = Rs 25,500<br />3. You click Pay To Partner - Money goes from your Wallet to Partner UPI / Bank<br />4. History is saved in Wallet tab.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}