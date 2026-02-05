import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "E-mail obrigatório." }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Este e-mail já está verificado." }, { status: 400 });
    }

    // Gera novo código
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Atualiza no banco
    user.verificationCode = verificationCode;
    await user.save();

    // Log de Segurança (Para você ver no terminal)
    console.log("========================================");
    console.log(`📧 REENVIO DE CÓDIGO: ${email}`);
    console.log(`🔑 NOVO CÓDIGO: ${verificationCode}`);
    console.log("========================================");

    // Envia o e-mail
    try {
      await sendVerificationEmail(user.name, user.email, verificationCode);
    } catch (error) {
      console.error("Erro ao enviar e-mail de reenvio:", error);
    }

    return NextResponse.json(
      { message: "Código reenviado com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro no reenvio:", error);
    return NextResponse.json(
      { message: "Erro ao reenviar código." },
      { status: 500 }
    );
  }
}