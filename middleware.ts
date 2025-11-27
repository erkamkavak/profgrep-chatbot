import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

function isPublicApiRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/trpc") ||
    pathname === "/api/chat" ||
    pathname.startsWith("/api/chat/")
  );
}

function isMetadataRoute(pathname: string): boolean {
  return (
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest"
  );
}

function isPublicPage(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return (
    pathname.startsWith("/models") ||
    pathname.startsWith("/compare") ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms")
  );
}

function isAuthPage(pathname: string): boolean {
  return pathname.startsWith("/login") || pathname.startsWith("/register");
}

// Edge middleware – cookie-based, no Node.js APIs
export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  if (isPublicApiRoute(pathname) || isMetadataRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(req);
  const isLoggedIn = !!sessionCookie;

  // Logged-in users shouldn't see auth pages
  if (isLoggedIn && isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/", url));
  }

  // Public pages (including auth pages) are allowed regardless
  if (isAuthPage(pathname) || isPublicPage(pathname)) {
    return NextResponse.next();
  }

  // For protected pages, optimistically redirect if no session cookie
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    
    "/((?!api|_next/static|_next/image|favicon.ico|opengraph-image|manifest|models|compare|privacy|terms|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|webmanifest)$).*)",
  ],
};
