import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      name,
      document,
      type,
      email,
      phone,
      password,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
    } = await req.json();

    // 1. Verifica se usuário já existe
    const userExists = await User.findOne({
      $or: [{ email }, { document }],
    });

    if (userExists) {
      return NextResponse.json(
        { message: "Usuário ou Documento já cadastrado." },
        { status: 400 }
      );
    }

    // 2. SEGURANÇA: Criptografar (Hash) a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Criação do Usuário
    await User.create({
      name,
      document,
      type,
      email,
      phone,
      password: hashedPassword,
      address: {
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      },
    });

    return NextResponse.json(
      { message: "Usuário criado com sucesso!" },
      { status: 201 }
    );
  } catch (error) {
    // CORREÇÃO: Removido o ': any' aqui
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { message: "Erro ao registrar usuário." },
      { status: 500 }
    );
  }
}
