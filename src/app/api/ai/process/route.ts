import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { parseTransactionText } from "@/lib/aiTransactionParser";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { message: "Configuração de API pendente" },
        { status: 500 },
      );
    }

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { message: "Áudio não identificado" },
        { status: 400 },
      );
    }

    const data = await parseTransactionText(text, session.id);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Erro no processamento IA:", error);
    return NextResponse.json(
      { message: "Não foi possível processar o comando de voz." },
      { status: 500 },
    );
  }
}
