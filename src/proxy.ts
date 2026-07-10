import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/jwt";

const protectedRoutes = ["/dashboard"];
const publicAuthRoutes = ["/login", "/register", "/forgot-password", "/verify"];

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
      await jwtVerify(cookie, getJwtSecret());

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
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/verify",
  ],
};