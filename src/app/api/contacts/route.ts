import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contact from "@/models/Contact";

// LISTAR CONTATOS
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");

    if (!userId) {
      return NextResponse.json(
        { message: "ID do usuário obrigatório" },
        { status: 400 }
      );
    }

    // CORREÇÃO: Definimos a interface do objeto ao invés de usar 'any'
    const query: { userId: string; type?: string } = { userId };

    if (type) {
      query.type = type;
    }

    const contacts = await Contact.find(query).sort({ name: 1 });

    return NextResponse.json(contacts, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

// CRIAR NOVO CONTATO
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.userId || !body.name || !body.type) {
      return NextResponse.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Verifica duplicidade
    const exists = await Contact.findOne({
      userId: body.userId,
      name: body.name,
      type: body.type,
    });

    if (exists) {
      return NextResponse.json(exists, { status: 200 });
    }

    const newContact = await Contact.create(body);
    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar contato:", error);
    return NextResponse.json(
      { message: "Erro ao salvar contato" },
      { status: 500 }
    );
  }
}
