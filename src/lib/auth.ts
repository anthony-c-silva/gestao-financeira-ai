import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/jwt";

interface UserSession {
  id: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

export async function getAuthSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("smartfin_session")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    // Retorna o payload tipado
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}
