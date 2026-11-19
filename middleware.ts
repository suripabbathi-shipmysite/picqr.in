import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that need login
const PROTECTED = ["/dashboard", "/upload", "/events", "/pricing"];

// Routes that logged-in user should not see again
const AUTH_ONLY = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const hasSession = req.cookies.get("picqr_session")?.value === "1";

  // 1. Protected route + No session = Go to login
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  if (isProtected && !hasSession) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Login / Signup + Already logged in = Go to dashboard
  const isAuthOnly = AUTH_ONLY.some((p) => path === p || path.startsWith(p + "/"));
  if (isAuthOnly && hasSession) {
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/events/:path*",
    "/pricing/:path*",
    "/login",
    "/signup",
  ],
};