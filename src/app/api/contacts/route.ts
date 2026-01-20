import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contact from "@/models/Contact";

// Interface para a Query
interface ContactQuery {
  userId: string;
  type?: string;
  name?: { $regex: string; $options: "i" }; // Permite busca por nome
}

// LISTAR CONTATOS (COM PAGINAÇÃO)
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const search = searchParams.get("search"); // Busca
    const page = parseInt(searchParams.get("page") || "1"); // Página atual
    const limit = parseInt(searchParams.get("limit") || "20"); // Itens por página

    if (!userId) {
      return NextResponse.json(
        { message: "ID do usuário obrigatório" },
        { status: 400 }
      );
    }

    // Montagem da Query
    const query: ContactQuery = { userId };

    // Filtro por Tipo (Cliente/Fornecedor)
    if (type && type !== "ALL") {
      query.type = type;
    }

    // Filtro de Busca (Nome)
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Lógica de Paginação (Pular itens)
    const skip = (page - 1) * limit;

    // Executa busca e contagem ao mesmo tempo (Paralelo)
    const [contacts, total] = await Promise.all([
      Contact.find(query).sort({ name: 1 }).skip(skip).limit(limit),
      Contact.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // RETORNO NO NOVO FORMATO (Com Paginação)
    return NextResponse.json(
      {
        data: contacts, // Lista de contatos
        pagination: {
          total,
          page,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro na API de contatos:", error);
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

    // 1. Verifica duplicidade de NOME
    const existsName = await Contact.findOne({
      userId: body.userId,
      name: body.name,
      type: body.type,
    });

    if (existsName) {
      return NextResponse.json(
        { message: "Já existe um contato com este nome." },
        { status: 409 }
      );
    }

    // 2. Verifica duplicidade de DOCUMENTO (CPF/CNPJ)
    if (body.document && body.document.trim() !== "") {
      const existsDoc = await Contact.findOne({
        userId: body.userId,
        document: body.document,
      });
      if (existsDoc) {
        return NextResponse.json(
          { message: "Este CPF/CNPJ já está cadastrado." },
          { status: 409 }
        );
      }
    }

    // 3. Verifica duplicidade de TELEFONE
    if (body.phone && body.phone.trim() !== "") {
      const existsPhone = await Contact.findOne({
        userId: body.userId,
        phone: body.phone,
      });
      if (existsPhone) {
        return NextResponse.json(
          { message: "Este telefone já pertence a outro contato." },
          { status: 409 }
        );
      }
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
