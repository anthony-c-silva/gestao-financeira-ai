import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "fallback_inseguro_mude_no_env",
    );

    const { payload } = await jwtVerify(token, secret);

    // Retorna o payload tipado
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}
