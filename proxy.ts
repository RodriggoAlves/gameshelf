import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("zerey_session");
  const url = request.nextUrl.pathname;

  // Protected routes
  const protectedRoutes = ["/library", "/profile"];
  const isProtected = protectedRoutes.some(r => url.startsWith(r));

  if (isProtected && !session?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validação básica do formato do token de sessão (64 chars hex)
  if (isProtected && session?.value) {
    const tokenFormat = /^[a-f0-9]{64}$/;
    if (!tokenFormat.test(session.value)) {
      // Token com formato inválido — remover cookie e redirecionar
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("zerey_session");
      return response;
    }
  }

  // Redirect away from auth routes if already logged in
  if ((url === "/login" || url === "/register") && session?.value) {
    return NextResponse.redirect(new URL("/library", request.url));
  }

  // Adicionar header de segurança anti-clickjacking para API
  if (url.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/profile/:path*", "/login", "/register", "/api/:path*"],
};
