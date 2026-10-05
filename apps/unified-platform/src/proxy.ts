import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "shaurya_session";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedPath = path.startsWith("/admin") || path.startsWith("/volunteer");
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (protectedPath && !hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/volunteer/:path*"],
};
