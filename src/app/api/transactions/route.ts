import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Contact from "@/models/Contact";

/** Adiciona N meses à data, mantendo o dia quando possível (ex.: 31/jan → 28/fev). */
function addMonths(date: Date, n: number): Date {
  const res = new Date(date);
  const day = res.getDate();
  res.setDate(1);
  res.setMonth(res.getMonth() + n);
  const lastDay = new Date(res.getFullYear(), res.getMonth() + 1, 0).getDate();
  res.setDate(Math.min(day, lastDay));
  return res;
}

// BUSCAR TRANSAÇÕES
export async function GET(req: Request) {
  try {
    await connectDB();
    // Garante que o modelo Contact está registrado antes de fazer o populate
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
      .limit(100);

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

// CRIAR NOVA TRANSAÇÃO (COM RECORRÊNCIA)
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

    if (!body.date) {
      return NextResponse.json(
        { message: "Data da transação obrigatória" },
        { status: 400 }
      );
    }

    const baseDate = new Date(body.date);
    if (Number.isNaN(baseDate.getTime())) {
      return NextResponse.json(
        { message: "Data da transação inválida" },
        { status: 400 }
      );
    }

    const isRecurring = body.isRecurring === true;

    let installmentsCount = 1;
    if (isRecurring) {
      const raw = body.installments != null ? parseInt(String(body.installments), 10) : NaN;
      if (!Number.isInteger(raw) || raw < 2 || raw > 60) {
        return NextResponse.json(
          { message: "Recorrência deve estar entre 2 e 60 meses" },
          { status: 400 }
        );
      }
      installmentsCount = raw;
    }

    const recurrenceId = isRecurring
      ? Math.random().toString(36).substring(2, 10)
      : null;

    type TransactionDoc = {
      userId: unknown;
      contactId?: unknown;
      type: string;
      amount: number;
      description: string;
      category: string;
      paymentMethod: string;
      date: Date;
      status: "PENDING" | "PAID";
      recurrenceId?: string;
      installment: number;
      totalInstallments: number;
    };
    const transactionsToCreate: TransactionDoc[] = [];

    for (let i = 0; i < installmentsCount; i++) {
      const parcelDate = addMonths(baseDate, i);

      transactionsToCreate.push({
        userId: body.userId,
        contactId: body.contactId ?? undefined,
        type: body.type,
        amount: body.amount,
        description: body.description ?? "",
        category: body.category ?? "",
        paymentMethod: body.paymentMethod ?? "",
        date: parcelDate,
        status: i === 0 ? (body.status === "PAID" ? "PAID" : "PENDING") : "PENDING",
        recurrenceId: recurrenceId ?? undefined,
        installment: i + 1,
        totalInstallments: installmentsCount,
      });
    }

    const createdTransactions = await Transaction.insertMany(transactionsToCreate);

    return NextResponse.json(createdTransactions[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return NextResponse.json({ message: "Erro ao salvar" }, { status: 500 });
  }
}
