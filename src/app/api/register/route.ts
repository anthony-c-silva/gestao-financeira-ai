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
      // NOVO CAMPO AQUI
      businessSize,
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

    // Validação extra: Se for PJ, precisa ter businessSize
    if (type === "PJ" && !businessSize) {
      return NextResponse.json(
        { message: "Selecione o enquadramento da empresa (MEI, ME, etc)." },
        { status: 400 }
      );
    }

    const userExists = await User.findOne({
      $or: [{ email }, { document }],
    });

    if (userExists) {
      return NextResponse.json(
        { message: "Usuário ou Documento já cadastrado." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      document,
      type,
      businessSize: type === "PJ" ? businessSize : null, // Garante null se for PF
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
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { message: "Erro ao registrar usuário." },
      { status: 500 }
    );
  }
}
