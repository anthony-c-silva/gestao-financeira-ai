import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email, document } = await req.json();

    // 1. Validação estrita: Precisa dos dois
    if (!email || !document) {
      return NextResponse.json({ message: "Informe o CPF/CNPJ e o E-mail cadastrado." }, { status: 400 });
    }

    await connectToDatabase();

    // Limpa o documento (remove pontos e traços) para comparar com o banco
    const cleanDocument = document.replace(/\D/g, "");

    // 2. BUSCA EXATA: O usuário precisa ter ESSE documento E ESSE email
    const user = await User.findOne({ 
      document: cleanDocument,
      email: email.toLowerCase() 
    });

    // --- MUDANÇA AQUI: Retorna erro real se não encontrar ---
    if (!user) {
      return NextResponse.json(
        { message: "Este e-mail não corresponde ao CPF/CNPJ informado." },
        { status: 404 } // Erro: Não encontrado
      );
    }

    // 3. Gera código de 6 dígitos
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Validade de 15 minutos
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    // Salva no banco
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = expires;
    await user.save();

    // Envia o e-mail
    const emailSent = await sendPasswordResetEmail(email, resetToken);

    if (!emailSent.success) {
       return NextResponse.json({ message: "Erro ao enviar e-mail. Tente novamente." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Código enviado com sucesso!" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro no esqueci minha senha:", error);
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}