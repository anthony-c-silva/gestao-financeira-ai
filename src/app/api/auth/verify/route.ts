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

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // Normaliza para comparação (remove espaços e garante string)
    const codeInput = String(code).trim();
    const codeStored = String(user.verificationCode ?? "").trim();

    if (!codeStored || codeStored !== codeInput) {
      return NextResponse.json(
        { message: "Código inválido ou expirado." },
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