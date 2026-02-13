import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = ["/dashboard"];
const publicAuthRoutes = ["/login", "/register", "/forgot-password"];

// O único detalhe que muda é o nome desta função
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicAuthRoute = publicAuthRoutes.some((route) => pathname.startsWith(route));

  const cookie = req.cookies.get("smartfin_session")?.value;

  if (isProtectedRoute && !cookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (cookie) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "fallback_inseguro_mude_no_env"
      );
      await jwtVerify(cookie, secret);

      if (isPublicAuthRoute) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } catch (error) {
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.delete("smartfin_session");
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};