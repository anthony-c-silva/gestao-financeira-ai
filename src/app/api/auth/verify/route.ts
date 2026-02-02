import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ message: "Dados incompletos." }, { status: 400 });
    }

    await connectToDatabase();

    // Busca usuário com este email e este código
    // O código verificationToken foi salvo no registro
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      verificationToken: code 
    });

    if (!user) {
      return NextResponse.json({ message: "Código inválido." }, { status: 400 });
    }

    // Sucesso: Ativa a conta e limpa o código
    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return NextResponse.json({ message: "Conta verificada com sucesso!" }, { status: 200 });

  } catch (error) {
    console.error("Erro na verificação:", error);
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}