import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "E-mail obrigatório." }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Retornamos 404 para feedback visual, mas por segurança em produção
      // alguns preferem retornar 200 para não revelar quais e-mails existem.
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    // 1. Gera o token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // 2. Define validade (1 hora a partir de agora)
    const passwordExpires = Date.now() + 3600000; // 3600000 ms = 1 hora

    // 3. Salva no Banco (AGORA VAI FUNCIONAR POIS O MODEL TEM OS CAMPOS)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = passwordExpires;
    await user.save();

    // 4. Envia o E-mail (com os 3 parâmetros corretos que ajustamos antes)
    const emailSent = await sendPasswordResetEmail(user.name, user.email, resetToken);

    if (!emailSent) {
      return NextResponse.json({ message: "Erro ao enviar e-mail. Tente novamente." }, { status: 500 });
    }

    return NextResponse.json({ message: "E-mail de recuperação enviado!" }, { status: 200 });

  } catch (error) {
    console.error("Erro no forgot-password:", error);
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}