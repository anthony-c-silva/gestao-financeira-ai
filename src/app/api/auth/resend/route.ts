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

    // Rate limit simples: no máximo 1 reenvio a cada 30s por conta
    const RESEND_COOLDOWN_MS = 30_000;
    if (user.verificationCodeSentAt) {
      const elapsed = Date.now() - new Date(user.verificationCodeSentAt).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { message: `Aguarde ${waitSeconds}s antes de solicitar um novo código.` },
          { status: 429 },
        );
      }
    }

    // Gera novo código
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Atualiza no banco
    user.verificationCode = verificationCode;
    user.verificationCodeSentAt = new Date();
    await user.save();

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