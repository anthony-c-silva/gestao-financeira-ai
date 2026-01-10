import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Contact from "@/models/Contact"; // Importante importar para o Mongoose reconhecer o vínculo

// BUSCAR TRANSAÇÕES
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "ID do usuário obrigatório" },
        { status: 400 }
      );
    }

    // Busca as últimas 50 transações e POPULA os dados do contato (traz o nome)
    const transactions = await Transaction.find({ userId })
      .populate("contactId", "name type") // <--- A MÁGICA ACONTECE AQUI
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
