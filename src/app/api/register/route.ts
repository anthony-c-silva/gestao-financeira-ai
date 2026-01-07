import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/app/model/User";

export async function POST(req: Request) {
  try {
    // 1. Receber os dados do formulário
    const { name, document, email, address, phone, password } =
      await req.json();

    // 2. Conectar ao Banco de Dados
    await connectDB();

    // 3. Verificar se usuário já existe
    const userExists = await User.findOne({
      $or: [{ document }, { email }],
    });

    if (userExists) {
      return NextResponse.json(
        { message: "Usuário já cadastrado com este CPF/CNPJ ou E-mail." },
        { status: 400 }
      );
    }

    // 4. Criar novo usuário
    const user = await User.create({
      name,
      document,
      email,
      address,
      phone,
      password, // Nota: Na semana 2 implementaremos criptografia (bcrypt)
    });

    return NextResponse.json(
      {
        message: "Conta criada com sucesso!",
        userId: user._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { message: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}
