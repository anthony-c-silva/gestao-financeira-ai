import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { document, password } = await req.json();

    // Busca usuário pelo documento (CPF/CNPJ) e inclui a senha para verificação
    const user = await User.findOne({ document }).select("+password");

    if (!user) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    // Valida a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    // --- CORREÇÃO DE SEGURANÇA ---
    // Impede login se o e-mail não foi verificado
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          message: "E-mail não verificado.", 
          code: "EMAIL_NOT_VERIFIED",
          email: user.email // Retorna o email para o front poder redirecionar
        },
        { status: 403 }
      );
    }

    // Remove a senha do objeto antes de retornar
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.verificationCode;

    return NextResponse.json(
      {
        message: "Login realizado com sucesso!",
        user: userObject,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}