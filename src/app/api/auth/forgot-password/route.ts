import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/mail";

// Resposta genérica usada tanto para sucesso quanto para "usuário não encontrado":
// evita que a rota sirva como oráculo de enumeração de e-mails/documentos cadastrados.
const GENERIC_MESSAGE =
  "Se os dados informados estiverem corretos, enviamos um código de recuperação para o e-mail cadastrado.";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, document } = await req.json();

    if (!email || !document) {
      return NextResponse.json(
        { message: "Informe o e-mail e o CPF/CNPJ." },
        { status: 400 },
      );
    }

    const cleanDocument = String(document).replace(/\D/g, "");
    const user = await User.findOne({ email: String(email).trim() });

    // Só emite o código se e-mail E documento baterem com o mesmo usuário.
    // Não revelamos qual dos dois está errado (evita enumeração).
    if (user && user.document === cleanDocument) {
      // Código numérico de 6 dígitos, mesmo padrão do e-mail de verificação de cadastro.
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const passwordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      user.resetPasswordToken = resetCode;
      user.resetPasswordExpires = passwordExpires;
      await user.save();

      await sendPasswordResetEmail(user.name, user.email, resetCode);
    }

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error("Erro no forgot-password:", error);
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}