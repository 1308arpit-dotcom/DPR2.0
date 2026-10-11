import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public static assets and auth paths
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionValue(cookieValue);

  if (!session) {
    // If it's an API route and session is missing, return 401 JSON instead of redirecting with HTML
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
