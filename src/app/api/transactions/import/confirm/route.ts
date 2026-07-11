import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { getAuthSession } from "@/lib/auth";

interface ImportRow {
  date: string;
  description: string;
  amountCents: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  paymentMethod: string;
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const rows: ImportRow[] = Array.isArray(body.transactions)
      ? body.transactions
      : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Nenhuma transação selecionada." },
        { status: 400 },
      );
    }
    if (rows.length > 1000) {
      return NextResponse.json(
        { message: "Selecione no máximo 1000 transações por vez." },
        { status: 400 },
      );
    }

    const docs = [];
    for (const row of rows) {
      const date = new Date(row.date);
      const amount = Math.round(Number(row.amountCents));

      if (Number.isNaN(date.getTime()) || !Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      docs.push({
        userId: session.id,
        type: row.type === "INCOME" ? "INCOME" : "EXPENSE",
        amount,
        description: row.description?.slice(0, 200) || "Transação importada",
        category: row.category || "Outros",
        paymentMethod: row.paymentMethod || "Extrato Importado",
        date,
        status: "PENDING" as const,
      });
    }

    if (docs.length === 0) {
      return NextResponse.json(
        { message: "Nenhuma transação válida para importar." },
        { status: 400 },
      );
    }

    const created = await Transaction.insertMany(docs);

    return NextResponse.json(
      { message: "Importação concluída", count: created.length },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao confirmar importação:", error);
    return NextResponse.json(
      { message: "Erro ao importar transações." },
      { status: 500 },
    );
  }
}
