import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("zerey_session");
  const url = request.nextUrl.pathname;

  // Protected routes
  if ((url.startsWith("/library") || url.startsWith("/profile")) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect away from auth routes if already logged in
  if ((url === "/login" || url === "/register") && session) {
    return NextResponse.redirect(new URL("/library", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/profile/:path*", "/login", "/register", "/api/:path*"],
};
