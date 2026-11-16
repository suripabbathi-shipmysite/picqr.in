"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // FIX 1: Already login ayyi unte - malli login adagakudadu
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await syncProfile(data.session.user.id, data.session.user);
        router.replace(next);
        return;
      }
      const savedEmail = localStorage.getItem("picqr_user_email") || "";
      if (savedEmail) setEmail(savedEmail);
      setChecking(false);
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, next]);

  const setSessionStorage = (userId: string, userEmail: string, qrId: string, country: string, fullName: string) => {
    document.cookie = "picqr_session=1; path=/; max-age=86400; SameSite=Lax";
    localStorage.setItem("picqr_logged_in", "1");
    localStorage.setItem("picqr_email", userEmail || "");
    localStorage.setItem("picqr_user_email", userEmail || "");
    localStorage.setItem("picqr_user_id", userId);
    localStorage.setItem("picqr_qr_id", qrId);
    localStorage.setItem("picqr_user_name", fullName);
    if (country) {
      localStorage.setItem("picqr_country", country);
      localStorage.setItem("picqr_user_country", country);
    }
    localStorage.removeItem("picqr_demo_events");
    localStorage.removeItem("picqr_events");
  };

  // FIX 2: Profile Sync - Google + Old User + Signup Country - Anni fix
  const syncProfile = async (userId: string, user: any) => {
    try {
      // FIX: Signup lo save chesina country - Google user kosam
      const savedSignupCountry = localStorage.getItem("picqr_signup_country") || "";
      const savedLoginNext = localStorage.getItem("picqr_login_next") || "";

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

      const qrId = `PQ-${userId.slice(0, 6).toUpperCase()}`;
      const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
      const finalCountry = profile?.country || user.user_metadata?.country || savedSignupCountry || "";

      // Profile lekapothe - Google / New user - Create chey
      if (!profile) {
        const newProfile = {
          id: userId,
          email: user.email,
          full_name: fullName,
          studio_name: fullName ? `${fullName} Photography` : "",
          qr_id: qrId,
          country: finalCountry, // FIX: "" kadu, Signup country vastundi
          plan: "FREE",
          plan_name: "Free Plan",
        };
        await supabase.from("profiles").insert(newProfile);
        setSessionStorage(userId, user.email || "", qrId, finalCountry, fullName);
        if (savedSignupCountry) localStorage.removeItem("picqr_signup_country");
        return;
      }

      // FIX: Profile undi kani emaina missing aithe - Update chey
      const updates: any = {};
      if (!profile.qr_id) updates.qr_id = qrId;
      if (!profile.plan) { updates.plan = "FREE"; updates.plan_name = "Free Plan"; }
      if (!profile.country && finalCountry) updates.country = finalCountry;
      if (!profile.full_name && fullName) updates.full_name = fullName;
      if (!profile.studio_name && fullName) updates.studio_name = `${fullName} Photography`;
      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", userId);
      }
      if (savedSignupCountry) localStorage.removeItem("picqr_signup_country");

      setSessionStorage(userId, user.email || "", profile.qr_id || qrId, profile.country || finalCountry, fullName);
    } catch {}
  };

  const input = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 12,
    border: "1.5px solid #E5E0F0",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
    background: "#FAF9FF",
  };

  const label = {
    fontSize: 12,
    fontWeight: 700,
    color: "#1A1A1A",
    display: "block" as const,
    textAlign: "left" as const,
    marginBottom: 6,
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: password });
    if (authError) {
      setLoading(false);
      if (authError.message.toLowerCase().includes("email not confirmed")) return setError("Please verify your email first. Check your inbox for verification link.");
      if (authError.message.includes("Invalid login")) return setError("Wrong email or password. Please try again.");
      return setError(authError.message);
    }
    if (!data.user) { setLoading(false); return setError("Login failed. Please try again."); }
    await syncProfile(data.user.id, data.user);
    router.push(next);
    router.refresh();
  };

  // FIX 3: Google - next ni save chesi, callback ki pampali
  const onGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    localStorage.setItem("picqr_login_next", next);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  const onForgot = async () => {
    if (!email.includes("@")) return setError("Enter your email first, then click Forgot Password.");
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return setError(error.message);
    setSuccess("Password reset link sent to your email. Check inbox.");
  };

  if (checking) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Checking login...</div>;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#5B00B8,#FF7A2F)", fontFamily: "Arial", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.25)", textAlign: "center" }}>
        <img src="/logo.png" alt="PicQR.in" style={{ height: 64, width: "auto", margin: "0 auto 8px" }} />
        <h1 style={{ fontSize: 26, margin: "6px 0 4px", letterSpacing: -0.5 }}>Welcome Back</h1>
        <p style={{ fontSize: 13, color: "#666", margin: "0 0 20px", lineHeight: 1.5 }}>
          Sign in to continue to PicQR.<br />
          <span style={{ color: "#5B00B8", fontWeight: 700 }}>Your photos. Your QR. Your pricing.</span>
        </p>
        <button onClick={onGoogleLogin} type="button" disabled={googleLoading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 13, borderRadius: 12, border: "1.5px solid #E5E0F0", fontWeight: 700, width: "100%", background: "#fff", cursor: googleLoading ? "not-allowed" : "pointer", fontSize: 14 }}>
          <span style={{ background: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, border: "1px solid #eee" }}><span style={{ color: "#4285F4" }}>G</span></span>
          {googleLoading ? "Connecting with Google..." : "Continue with Google"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: "#999", fontSize: 12 }}><span style={{ flex: 1, borderTop: "1px solid #eee" }}></span>OR<span style={{ flex: 1, borderTop: "1px solid #eee" }}></span></div>
        <form onSubmit={onLogin} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={label}>Email</label>
            <input style={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Password</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...input, paddingRight: 48 }} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" type={showPassword ? "text" : "password"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 12, fontWeight: 700, color: "#5B00B8", cursor: "pointer" }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <p style={{ fontSize: 11, color: "#888", margin: 0 }}>Password must be at least 8 characters.</p>
              <button type="button" onClick={onForgot} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 700, color: "#5B00B8", cursor: "pointer", padding: 0 }}>Forgot Password?</button>
            </div>
          </div>
          {error && <p style={{ background: "#FFF0F0", color: "#D00", fontSize: 13, padding: "10px 12px", borderRadius: 10, margin: "12px 0", textAlign: "left" }}>{error}</p>}
          {success && <p style={{ background: "#E8FFF0", color: "#0A7A2F", fontSize: 13, padding: "10px 12px", borderRadius: 10, margin: "12px 0", textAlign: "left" }}>{success}</p>}
          <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "#999" : "linear-gradient(90deg,#5B00B8,#FF7A2F)", color: "#fff", border: "none", padding: "13px", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p style={{ fontSize: 13, textAlign: "center", marginTop: 16, color: "#666" }}>
          New user? <a href="/signup" style={{ color: "#5B00B8", fontWeight: 800 }}>Create Free Account</a>
        </p>
        <p style={{ fontSize: 11, color: "#aaa", margin: "10px 0 0" }}>Secure login • Pricing is shown for your registered country only</p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}