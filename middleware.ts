import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_HIERARCHY } from "./src/lib/rbac";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  console.log(`[Middleware] ${req.method} ${pathname} - Auth: ${!!token}`);

  // 1. Critical Public Assets & Next.js Internals
  // Restricted to absolute minimum required for /login and framework operation
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.png" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png"
  ) {
    return NextResponse.next();
  }

  // 2. Authentication Barrier: Public vs. Protected
  const isLoginPage = pathname === "/login";

  if (!token) {
    // If NOT authenticated and NOT on login page, FORCE redirect to /login
    if (!isLoginPage) {
      console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`);
      const loginUrl = new URL("/login", req.url);
      if (pathname !== "/" && pathname !== "/dashboard") {
        loginUrl.searchParams.set("callbackUrl", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Absolute Protected Route Logic (Zero-Tolerance)
  if (token) {
    // Redirect authenticated users away from login/root to dashboard
    if (isLoginPage || pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Explicit protection for all potential sub-directories and API nodes
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
        // Restrictions for Investments & User Management (Admins Only)
        if (pathname.startsWith("/dashboard/investments") || pathname.startsWith("/dashboard/users")) {
          if (token.role !== "CO_FOUNDER" && token.role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
          }
        }

        // Restrictions for System Audit / Activity Ledger (Min Role: LEADER)
        if (pathname.startsWith("/dashboard/activity") || pathname.startsWith("/dashboard/audit-logs")) {
          const userRole = (token.role as string) || "";
          const roleLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
          if (roleLevel < 2) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
          }
        }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
