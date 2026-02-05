import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: "E-mail e código são obrigatórios." },
        { status: 400 }
      );
    }

    // Busca o usuário e força retorno como 'any' para evitar erro de TS
    const user = await User.findOne({ email }) as any;

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // --- DEBUG: LOGS PARA VER O QUE ESTÁ ACONTECENDO ---
    console.log("--- DEBUG VERIFICAÇÃO ---");
    console.log("Email:", email);
    console.log("Código Recebido (Input):", code);
    console.log("Código no Banco (User):", user.verificationCode);
    console.log("Tipos:", typeof code, typeof user.verificationCode);
    console.log("-------------------------");

    // Normaliza para comparação (remove espaços e garante string)
    const codeInput = String(code).trim();
    const codeStored = String(user.verificationCode).trim();

    if (codeStored !== codeInput) {
      return NextResponse.json(
        { message: `Código inválido. Recebido: ${codeInput}, Esperado: ${codeStored}` }, // Mensagem detalhada para debug
        { status: 400 }
      );
    }

    // Atualiza o usuário
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          emailVerified: true, 
          verificationCode: null 
        } 
      }
    );

    return NextResponse.json(
      { message: "E-mail verificado com sucesso!" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro na verificação:", error);
    return NextResponse.json(
      { message: "Ocorreu um erro ao verificar o código." },
      { status: 500 }
    );
  }
}