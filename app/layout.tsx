"use client";
import "./globals.css";
import Logo from "../components/Logo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(
      document.cookie.includes("picqr_session") ||
      localStorage.getItem("picqr_logged_in") === "1"
    );
  }, [path]);

  // Dashboard / Login / Signup / Pricing lo main Header + Footer vaddu - vallaki own layout undi
  const hide = path?.startsWith("/dashboard") || path?.startsWith("/login") || path?.startsWith("/signup") || path?.startsWith("/pricing");

  const goToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (path === "/") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", `/#${id}`);
        return;
      }
    }
    router.push(`/#${id}`);
  };

  const pricingHref = isLoggedIn ? "/pricing" : "/login?next=/pricing";

  const logout = () => {
    document.cookie = "picqr_session=; path=/; max-age=0";
    localStorage.removeItem("picqr_logged_in");
    window.location.href = "/";
  };

  if (hide) {
    return (
      <html lang="en">
        <body style={{ margin: 0 }}>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial', background: '#FFFBF8', scrollBehavior: 'smooth' }}>

        {!isLoggedIn && (
          <div style={{ background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', textAlign: 'center', padding: '8px 10px', fontSize: 13, fontWeight: 700 }}>
            FREE: One Free Event - Try PicQR Free, No Card Required <a href="/signup" style={{ color: '#fff' }}>Start Free</a>
          </div>
        )}

        {/* HEADER - SCALE LEDU - SCALE VALLE LOGO HALF / CUT AVTUNDI */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4%', background: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 20px rgba(91,0,184,0.08)' }}>
          <div style={{ lineHeight: 0 }}>
            <Logo />
          </div>
          <nav style={{ display: 'flex', gap: 26, alignItems: 'center', fontSize: 14, fontWeight: 600 }}>
            <a href="/#features" onClick={(e) => goToSection(e, "features")} style={{ color: '#111', textDecoration: 'none', cursor: 'pointer' }}>Features</a>
            <a href={pricingHref} style={{ color: '#111', textDecoration: 'none' }}>Pricing</a>
            {isLoggedIn ? (
              <>
                <a href="/dashboard" style={{ color: '#111', textDecoration: 'none' }}>Dashboard</a>
                <button onClick={logout} style={{ background: '#fff', border: '1.5px solid #EDEBFF', padding: '10px 18px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Logout</button>
              </>
            ) : (
              <>
                <a href="/login" style={{ color: '#111', textDecoration: 'none' }}>Login</a>
                <a href="/signup" style={{ background: 'linear-gradient(90deg,#5B00B8,#FF7A2F)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 800, textDecoration: 'none' }}>Get Started</a>
              </>
            )}
          </nav>
        </header>

        {children}

        {/* FOOTER - LANDING FULL FLEDGED GA KANIPINCHADANIKI */}
        <footer style={{ background: '#0F0A24', color: '#ccc', padding: '44px 6% 22px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 30, flexWrap: 'wrap' }}>
            <div style={{ flex: 1.4, minWidth: 260 }}>
              <div style={{ background: '#fff', display: 'inline-block', borderRadius: 10, padding: '6px 10px', lineHeight: 0 }}>
                <Logo />
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>Scan. Selfie. Every photo you are in. Guests do not need any app.</p>
              <p style={{ fontSize: 12 }}>Email: hello@picqr.in</p>
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ color: '#fff' }}>Product</b>
              <a href="/#features" onClick={(e) => goToSection(e, "features")} style={{ color: '#aaa', textDecoration: 'none', fontSize: 13, display: 'block', marginTop: 8, cursor: 'pointer' }}>Features</a>
              <a href="/#how" onClick={(e) => goToSection(e, "how")} style={{ color: '#aaa', textDecoration: 'none', fontSize: 13, display: 'block', marginTop: 8, cursor: 'pointer' }}>How It Works</a>
              <a href={pricingHref} style={{ color: '#aaa', textDecoration: 'none', fontSize: 13, display: 'block', marginTop: 8 }}>Pricing</a>
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ color: '#fff' }}>Account</b>
              {isLoggedIn ? (
                <>
                  <a href="/dashboard" style={{ color: '#aaa', textDecoration: 'none', fontSize: 13, display: 'block', marginTop: 8 }}>Dashboard</a>
                  <button onClick={logout} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 13, padding: 0, marginTop: 8, cursor: 'pointer' }}>Logout</button>
                </>
              ) : (
                <>
                  <a href="/login" style={{ color: '#aaa', textDecoration: 'none', fontSize: 13, display: 'block', marginTop: 8 }}>Sign In</a>
                  <a href="/signup" style={{ color: '#aaa', textDecoration: 'none', fontSize: 13, display: 'block', marginTop: 8 }}>Sign Up Free</a>
                </>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.12)', marginTop: 30, paddingTop: 18, fontSize: 12 }}>© 2026 PicQR.in • Privacy • Terms • No selfies stored, ever.</div>
        </footer>

      </body>
    </html>
  );
}