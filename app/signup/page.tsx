"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Tier preview - Signup lo country select cheste chupinchadaniki
const TIER_PREVIEW: Record<string, string> = {
  "India": "Tier 2 - INDIA • Rs 399 / Rs 999 / Rs 9999",
  "Pakistan": "Tier 1 - LOW • $9 / $29 / $299",
  "Bangladesh": "Tier 1 - LOW • $9 / $29 / $299",
  "Sri Lanka": "Tier 1 - LOW • $9 / $29 / $299",
  "Bhutan": "Tier 1 - LOW • $9 / $29 / $299",
  "Nepal": "Tier 1 - LOW • $9 / $29 / $299",
  "UAE": "Tier 3 - GULF • $35 / $119 / $999",
  "Qatar": "Tier 3 - GULF • $35 / $119 / $999",
  "Saudi Arabia": "Tier 3 - GULF • $35 / $119 / $999",
  "Singapore": "Tier 3 - GULF • $35 / $119 / $999",
  "Malaysia": "Tier 3 - GULF • $35 / $119 / $999",
  "USA": "Tier 4 - PREMIUM • $29 / $99 / $899",
  "UK": "Tier 4 - PREMIUM • $29 / $99 / $899",
  "Canada": "Tier 4 - PREMIUM • $29 / $99 / $899",
  "Australia": "Tier 4 - PREMIUM • $29 / $99 / $899",
  "Europe": "Tier 4 - PREMIUM • $29 / $99 / $899",
};

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const input = {
    padding: "13px 14px",
    width: "100%",
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

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Please enter your full name.");
    if (!email.includes("@")) return setError("Please enter a valid email address.");
    if (!country) return setError("Please select your country.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);

    // Save user + country - used for pricing on /pricing
    // Country is locked at signup - VPN cannot change it later
    localStorage.setItem("picqr_logged_in", "1");
    localStorage.setItem("picqr_user_name", name.trim());
    localStorage.setItem("picqr_user_email", email.trim().toLowerCase());
    localStorage.setItem("picqr_email", email.trim().toLowerCase());
    localStorage.setItem("picqr_country", country);
    localStorage.setItem("picqr_user_country", country);
    localStorage.setItem("picqr_name", name.trim());
    document.cookie = "picqr_session=1; path=/; max-age=86400; SameSite=Lax";

    setTimeout(() => {
      router.push(next);
    }, 400);
  };

  const handleGoogle = () => {
    if (!country) {
      setError("Please select your country first, then continue with Google.");
      return;
    }
    setGoogleLoading(true);
    localStorage.setItem("picqr_logged_in", "1");
    localStorage.setItem("picqr_country", country);
    localStorage.setItem("picqr_user_country", country);
    localStorage.setItem("picqr_user_name", name.trim() || "Photographer");
    localStorage.setItem("picqr_name", name.trim() || "Photographer");
    if (email.includes("@")) {
      localStorage.setItem("picqr_user_email", email.trim().toLowerCase());
      localStorage.setItem("picqr_email", email.trim().toLowerCase());
    }
    document.cookie = "picqr_session=1; path=/; max-age=86400; SameSite=Lax";
    setTimeout(() => router.push(next), 400);
  };

  return (
    <div style={{ display: "flex", minHeight: "90vh", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(180deg,#F7F3FF,#FFFBF8)" }}>
      <div style={{ background: "#fff", padding: 32, borderRadius: 24, width: 440, maxWidth: "100%", boxShadow: "0 20px 60px rgba(91,0,184,0.12)", textAlign: "center", border: "1px solid #F0E8FF" }}>
        <img src="/logo.png" alt="PicQR.in" style={{ height: 64, width: "auto", margin: "0 auto 8px" }} />
        <h1 style={{ fontSize: 26, margin: "6px 0 4px", letterSpacing: -0.5 }}>Create Your Account</h1>
        <p style={{ color: "#666", margin: "0 0 20px", fontSize: 13, lineHeight: 1.5 }}>
          Start your first event free - No card required.<br />
          <span style={{ color: "#5B00B8", fontWeight: 700 }}>12 hours free • Permanent QR • Original quality</span>
        </p>

        <button onClick={handleGoogle} type="button" disabled={googleLoading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 13, borderRadius: 12, border: "1.5px solid #E5E0F0", fontWeight: 700, width: "100%", background: "#fff", cursor: googleLoading ? "not-allowed" : "pointer", fontSize: 14 }}>
          <span style={{ background: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, border: "1px solid #eee" }}><span style={{ color: "#4285F4" }}>G</span></span>
          {googleLoading ? "Connecting with Google..." : "Sign Up with Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: "#999", fontSize: 12 }}><span style={{ flex: 1, borderTop: "1px solid #eee" }}></span>OR<span style={{ flex: 1, borderTop: "1px solid #eee" }}></span></div>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: 12 }}>
            <label style={label}>Full Name</label>
            <input placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} style={input} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={label}>Email ID</label>
            <input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={label}>Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ ...input, cursor: "pointer" }}>
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
            {country && TIER_PREVIEW[country] ? (
              <p style={{ fontSize: 11, color: "#5B00B8", fontWeight: 700, textAlign: "left", margin: "6px 0 0", background: "#F0E8FF", padding: "6px 10px", borderRadius: 8 }}>{TIER_PREVIEW[country]}</p>
            ) : (
              <p style={{ fontSize: 11, color: "#888", textAlign: "left", margin: "6px 0 0" }}>Pricing is shown for your country only after login.</p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Create Password</label>
            <div style={{ position: "relative" }}>
              <input placeholder="Minimum 8 characters" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...input, paddingRight: 48 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 12, fontWeight: 700, color: "#5B00B8", cursor: "pointer" }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#888", textAlign: "left", margin: "6px 0 0" }}>Password must be at least 8 characters.</p>
          </div>

          {error && <p style={{ background: "#FFF0F0", color: "#D00", fontSize: 13, padding: "10px 12px", borderRadius: 10, margin: "0 0 12px", textAlign: "left" }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ display: "block", width: "100%", background: loading ? "#999" : "linear-gradient(90deg,#5B00B8,#FF7A2F)", color: "#fff", padding: 14, borderRadius: 12, fontWeight: 800, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Creating Account..." : "Create Free Account"}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 13, color: "#666" }}>Already have an account? <a href="/login" style={{ color: "#5B00B8", fontWeight: 800 }}>Login</a></p>
        <p style={{ fontSize: 11, color: "#aaa", margin: "12px 0 0" }}>By continuing, you agree to our Terms & Privacy Policy.</p>
      </div>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center", fontFamily: "Arial" }}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}