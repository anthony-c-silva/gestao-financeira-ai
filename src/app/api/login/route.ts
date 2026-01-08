import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User"; // Verifique se sua pasta é 'model' ou 'models'
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { document, password } = await req.json();

    // 1. Busca o usuário e pede a senha (que vem oculta por padrão)
    const user = await User.findOne({ document }).select("+password");

    if (!user) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    // 2. Compara a senha digitada com o hash do banco
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    // 3. Remove a senha antes de devolver os dados para o front-end
    const userData = user.toObject();
    delete userData.password;

    return NextResponse.json(
      {
        message: "Login realizado com sucesso!",
        user: userData,
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
