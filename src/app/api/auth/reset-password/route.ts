import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { message: "Preencha todos os campos." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Busca usuário pelo e-mail E verifica se o código bate E se não expirou
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: new Date() } // $gt = Greater Than (Maior que AGORA)
    });

    if (!user) {
      return NextResponse.json(
        { message: "Código inválido ou expirado. Tente solicitar novamente." },
        { status: 400 }
      );
    }

    // Criptografa a nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha e limpa os tokens usados
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json(
      { message: "Senha alterada com sucesso! Faça login agora." },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao resetar senha:", error);
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}