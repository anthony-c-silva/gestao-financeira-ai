import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Await é obrigatório no Next.js 15+ para usar cookies()
  const cookieStore = await cookies();

  // Destrói o cookie de sessão com segurança
  cookieStore.delete("smartfin_session");

  return NextResponse.json(
    { message: "Logout realizado com sucesso" },
    { status: 200 },
  );
}
