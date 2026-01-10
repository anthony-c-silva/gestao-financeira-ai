import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
// Importamos e "usamos" o Contact para garantir que ele seja registrado no Mongoose
import Contact from "@/models/Contact";

// BUSCAR TRANSAÇÕES
export async function GET(req: Request) {
  try {
    await connectDB();

    // TRUQUE PARA CORRIGIR O "MissingSchemaError":
    // Acessamos o modelo explicitamente para garantir que ele foi compilado.
    // Isso evita que o Next.js "esqueça" de registrar o modelo em modo dev/HMR.
    if (!Contact) console.log("Carregando modelo Contact...");

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "ID do usuário obrigatório" },
        { status: 400 }
      );
    }

    const transactions = await Transaction.find({ userId })
      .populate("contactId", "name type")
      .sort({ date: -1 })
      .limit(50);

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

// CRIAR NOVA TRANSAÇÃO
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.userId || !body.amount || !body.type) {
      return NextResponse.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    const newTransaction = await Transaction.create(body);

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return NextResponse.json({ message: "Erro ao salvar" }, { status: 500 });
  }
}
