import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware that protects all app pages.
 *
 * Allowed without a session:
 *   - /admin/login          (the sign-in page itself)
 *   - /api/auth/*           (NextAuth internal endpoints)
 *
 * Every other page path requires a valid JWT whose `role` is "admin";
 * otherwise the request is redirected to /admin/login.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let NextAuth's own API routes and the login page through unconditionally.
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    const loginUrl = new URL("/admin/login", req.url);
    // Preserve the intended destination so we can redirect back after login.
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all pages, excluding Next internals, static assets, and API routes.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
