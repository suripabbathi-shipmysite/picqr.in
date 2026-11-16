"use client";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  // FIX: URL nundi name/email teesukomu - Only next matrame. ?name=&email= leak ledu
  const next = params.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [autoCountry, setAutoCountry] = useState("");
  const [isVPN, setIsVPN] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checking, setChecking] = useState(true);

  // FIX 1: LOGIN AYINA USER - DIRECT DASHBOARD
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.replace("/dashboard"); return; }
      setChecking(false);
    };
    checkSession();
  }, [router]);

  // AUTO LOCATION - /api/geo nundi
  useEffect(() => {
    fetch("/api/geo").then(r => r.json()).then(d => {
      const map: Record<string,string> = { IN: "India", PK: "Pakistan", BD: "Bangladesh", LK: "Sri Lanka", BT: "Bhutan", NP: "Nepal", AE: "UAE", QA: "Qatar", SA: "Saudi Arabia", SG: "Singapore", MY: "Malaysia", US: "USA", GB: "UK", CA: "Canada", AU: "Australia", DE: "Europe", FR: "Europe", IT: "Europe", ES: "Europe", NL: "Europe" };
      const c = map[d.country] || "";
      if (c) { setCountry(c); setAutoCountry(c); }
      if (d.isVPN) setIsVPN(true);
    }).catch(() => {});
  }, []);

  const input = { padding: "13px 14px", width: "100%", borderRadius: 12, border: "1.5px solid #E5E0F0", fontSize: 14, outline: "none", boxSizing: "border-box" as const, background: "#FAF9FF" };
  const label = { fontSize: 12, fontWeight: 700, color: "#1A1A1A", display: "block" as const, textAlign: "left" as const, marginBottom: 6 };
  const isCountryLocked = !!autoCountry;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const finalCountry = autoCountry || country;
    if (!cleanName || cleanName.length < 3) return setError("Please enter your full real name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return setError("Please enter a valid email address.");
    if (!finalCountry) return setError("Please select your country.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await supabase.auth.signOut();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail, password: password,
        options: { data: { full_name: cleanName, country: finalCountry }, emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already")) return setError("This email is already registered. Please Login.");
        return setError(signUpError.message);
      }
      if (data.user) {
        // FIX: QR + Plan + Studio - Profile complete ga
        const qrId = `PQ-${data.user.id.slice(0, 6).toUpperCase()}`;
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: cleanName,
          studio_name: `${cleanName} Photography`,
          country: finalCountry,
          qr_id: qrId,
          plan: "FREE",
          plan_name: "Free Plan",
        }, { onConflict: "id" });
        // LocalStorage sync - Dashboard ki kavali
        localStorage.setItem("picqr_user_name", cleanName);
        localStorage.setItem("picqr_qr_id", qrId);
        localStorage.setItem("picqr_country", finalCountry);
      }
      if (data.user && !data.session) { setSuccess("Account created! Please check your email to verify, then Login."); setLoading(false); return; }
      router.push(next);
    } catch (err: any) { setError(err.message || "Signup failed. Try again."); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    const finalCountry = autoCountry || country;
    if (!finalCountry) { setError("Please select your country first, then continue with Google."); return; }
    setGoogleLoading(true); setError("");
    // FIX: Google callback lo Dashboard ee country ni chaduvutundi
    localStorage.setItem("picqr_signup_country", finalCountry);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard`, queryParams: { access_type: "offline", prompt: "consent" } } });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  if (checking) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading...</div>;

  return (
    <div style={{ display: "flex", minHeight: "90vh", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(180deg,#F7F3FF,#FFFBF8)" }}>
      <div style={{ background: "#fff", padding: 32, borderRadius: 24, width: 440, maxWidth: "100%", boxShadow: "0 20px 60px rgba(91,0,184,0.12)", textAlign: "center", border: "1px solid #F0E8FF" }}>
        <img src="/logo.png" alt="PicQR.in" style={{ height: 64, width: "auto", margin: "0 auto 8px" }} />
        <h1 style={{ fontSize: 26, margin: "6px 0 4px", letterSpacing: -0.5 }}>Create Your Account</h1>
        <p style={{ color: "#666", margin: "0 0 20px", fontSize: 13, lineHeight: 1.5 }}>Start your first event free - No card required.<br /><span style={{ color: "#5B00B8", fontWeight: 700 }}>12 hours free • Permanent QR • Original quality</span></p>
        <button onClick={handleGoogle} type="button" disabled={googleLoading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 13, borderRadius: 12, border: "1.5px solid #E5E0F0", fontWeight: 700, width: "100%", background: "#fff", cursor: googleLoading ? "not-allowed" : "pointer", fontSize: 14 }}>
          <span style={{ background: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, border: "1px solid #eee" }}><span style={{ color: "#4285F4" }}>G</span></span>
          {googleLoading ? "Connecting with Google..." : "Sign Up with Google"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: "#999", fontSize: 12 }}><span style={{ flex: 1, borderTop: "1px solid #eee" }}></span>OR<span style={{ flex: 1, borderTop: "1px solid #eee" }}></span></div>
        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: 12 }}><label style={label}>Full Name</label><input placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} style={input} /></div>
          <div style={{ marginBottom: 12 }}><label style={label}>Email ID</label><input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} /></div>
          <div style={{ marginBottom: 12 }}>
            <label style={label}>Country {isCountryLocked ? "(Auto Detected - Locked)" : ""}</label>
            <select value={country} onChange={(e) => { if (!isCountryLocked) setCountry(e.target.value); }} disabled={isCountryLocked} style={{ ...input, cursor: isCountryLocked ? "not-allowed" : "pointer", background: isCountryLocked ? "#F0F0F0" : "#FAF9FF", opacity: isCountryLocked ? 0.8 : 1 }}>
              <option value="" disabled>Select your country</option>
              <option>India</option><option>Pakistan</option><option>Bangladesh</option><option>Sri Lanka</option><option>Bhutan</option><option>Nepal</option><option>UAE</option><option>Qatar</option><option>Saudi Arabia</option><option>Singapore</option><option>Malaysia</option><option>USA</option><option>UK</option><option>Canada</option><option>Australia</option><option>Europe</option><option>Other</option>
            </select>
            <p style={{ fontSize: 11, color: "#888", textAlign: "left", margin: "6px 0 0" }}>{autoCountry ? `📍 Detected: ${autoCountry} - Locked to your location. ${isVPN ? "• VPN Detected - Pricing locked to detected country" : ""}` : "Pricing will be shown after you login."}</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Create Password</label>
            <div style={{ position: "relative" }}>
              <input placeholder="Minimum 8 characters" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...input, paddingRight: 48 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 12, fontWeight: 700, color: "#5B00B8", cursor: "pointer" }}>{showPassword ? "Hide" : "Show"}</button>
            </div>
            <p style={{ fontSize: 11, color: "#888", textAlign: "left", margin: "6px 0 0" }}>Password must be at least 8 characters.</p>
          </div>
          {error && <p style={{ background: "#FFF0F0", color: "#D00", fontSize: 13, padding: "10px 12px", borderRadius: 10, margin: "0 0 12px", textAlign: "left" }}>{error}</p>}
          {success && <p style={{ background: "#E8FFF0", color: "#0A7A2F", fontSize: 13, padding: "10px 12px", borderRadius: 10, margin: "0 0 12px", textAlign: "left" }}>{success}</p>}
          <button type="submit" disabled={loading} style={{ display: "block", width: "100%", background: loading ? "#999" : "linear-gradient(90deg,#5B00B8,#FF7A2F)", color: "#fff", padding: 14, borderRadius: 12, fontWeight: 800, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Creating Account..." : "Create Free Account"}</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, color: "#666" }}>Already have an account? <a href="/login" style={{ color: "#5B00B8", fontWeight: 800 }}>Login</a></p>
        <p style={{ fontSize: 11, color: "#aaa", margin: "12px 0 0" }}>By continuing, you agree to our Terms & Privacy Policy.</p>
      </div>
    </div>
  );
}
export default function Signup() {
  return (<Suspense fallback={<div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading...</div>}><SignupForm /></Suspense>);
}