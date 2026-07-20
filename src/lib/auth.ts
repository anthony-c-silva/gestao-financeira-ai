import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/jwt";

interface UserSession {
  id: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

/**
 * Resolve a sessão a partir de:
 *  1. Cookie httpOnly `smartfin_session` (usado pelo app web), ou
 *  2. Cabeçalho `Authorization: Bearer <token>` (usado pelo app mobile).
 * O mesmo JWT vale para os dois; a mudança é apenas aditiva, então a web
 * continua funcionando exatamente como antes.
 */
export async function getAuthSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  let token = cookieStore.get("smartfin_session")?.value;

  if (!token) {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    // Retorna o payload tipado
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}
