"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState("");
  const [showCountry, setShowCountry] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    // Pre-fill email from signup, and check if country already exists
    const savedEmail = localStorage.getItem("picqr_user_email") || localStorage.getItem("picqr_email") || "";
    if (savedEmail) setEmail(savedEmail);
    const savedCountry = localStorage.getItem("picqr_country") || localStorage.getItem("picqr_user_country") || "";
    if (savedCountry) setCountry(savedCountry);
  }, []);

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

  const saveSession = (userEmail: string, userCountry: string, userName?: string) => {
    document.cookie = "picqr_session=1; path=/; max-age=86400; SameSite=Lax";
    localStorage.setItem("picqr_logged_in", "1");
    localStorage.setItem("picqr_email", userEmail.toLowerCase());
    localStorage.setItem("picqr_user_email", userEmail.toLowerCase());
    if (userCountry) {
      localStorage.setItem("picqr_country", userCountry);
      localStorage.setItem("picqr_user_country", userCountry);
    }
    if (userName) {
      localStorage.setItem("picqr_user_name", userName);
      localStorage.setItem("picqr_name", userName);
    }
  };

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    // If user signed up before, country must exist. If not, ask for country.
    const savedCountry = localStorage.getItem("picqr_country") || localStorage.getItem("picqr_user_country") || country;
    if (!savedCountry) {
      setShowCountry(true);
      setError("Please select your country to continue. Pricing is shown for your country only.");
      return;
    }

    setLoading(true);

    // TODO: Replace with real API auth - POST /api/auth/login
    // Server must verify password and return the registered country from DB.
    // Frontend must not trust a country sent from the client.
    setTimeout(() => {
      saveSession(email, savedCountry);
      router.push(next);
    }, 400);
  };

  const onGoogleLogin = () => {
    setError("");
    const savedCountry = localStorage.getItem("picqr_country") || localStorage.getItem("picqr_user_country") || country;

    // Google flow - If no country saved yet, ask for country first
    if (!savedCountry) {
      setShowCountry(true);
      setError("Please select your country first, then continue with Google.");
      return;
    }

    setGoogleLoading(true);

    // TODO: Replace with real Google OAuth - /api/auth/google
    // After Google verifies the user, server must return the registered country.
    // If this is a new Google user, server must create the account with the selected country.
    setTimeout(() => {
      const googleEmail = email && email.includes("@") ? email : localStorage.getItem("picqr_user_email") || "user@gmail.com";
      const googleName = localStorage.getItem("picqr_user_name") || localStorage.getItem("picqr_name") || "Photographer";
      saveSession(googleEmail, savedCountry, googleName);
      router.push(next);
    }, 500);
  };

  const onConfirmCountryAndGoogle = () => {
    if (!country) {
      setError("Please select your country.");
      return;
    }
    setShowCountry(false);
    setError("");
    onGoogleLogin();
  };

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
            <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>Password must be at least 8 characters.</p>
          </div>

          {showCountry && (
            <div style={{ marginBottom: 12, background: "#F7F3FF", border: "1px solid #EDEBFF", borderRadius: 12, padding: 12 }}>
              <label style={label}>Country - Required for pricing</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ ...input, cursor: "pointer", background: "#fff" }}>
                <option value="" disabled>Select your country</option>
                <option>India</option>
                <option>Pakistan</option>
                <option>Bangladesh</option>
                <option>Sri Lanka</option>
                <option>Bhutan</option>
                <option>Nepal</option>
                <option>UAE</option>
                <option>Qatar</option>
                <option>Saudi Arabia</option>
                <option>Singapore</option>
                <option>Malaysia</option>
                <option>USA</option>
                <option>UK</option>
                <option>Canada</option>
                <option>Australia</option>
                <option>Europe</option>
                <option>Other</option>
              </select>
              <button type="button" onClick={onConfirmCountryAndGoogle} style={{ marginTop: 10, width: "100%", background: "#0F0A24", color: "#fff", border: "none", padding: "11px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>
                Confirm Country & Continue with Google
              </button>
            </div>
          )}

          {error && <p style={{ background: "#FFF0F0", color: "#D00", fontSize: 13, padding: "10px 12px", borderRadius: 10, margin: "0 0 12px", textAlign: "left" }}>{error}</p>}

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