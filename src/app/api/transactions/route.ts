import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Contact from "@/models/Contact";
import { getAuthSession } from "@/lib/auth";

/** Adiciona N meses à data, mantendo o dia quando possível */
function addMonths(date: Date, n: number): Date {
  const res = new Date(date);
  const day = res.getDate();
  res.setDate(1);
  res.setMonth(res.getMonth() + n);
  const lastDay = new Date(res.getFullYear(), res.getMonth() + 1, 0).getDate();
  res.setDate(Math.min(day, lastDay));
  return res;
}

// BUSCAR TRANSAÇÕES DO USUÁRIO LOGADO
export async function GET() {
  try {
    // 1. Autenticação via Cookie
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    if (!Contact) console.log("Carregando modelo Contact...");

    // 2. Busca usando APENAS o ID da sessão
    const transactions = await Transaction.find({ userId: session.id })
      .populate("contactId", "name type")
      .sort({ date: -1 })
      .limit(100);

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

// CRIAR NOVA TRANSAÇÃO
export async function POST(req: Request) {
  try {
    // 1. Autenticação via Cookie
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    if (!body.amount || !body.type) {
      return NextResponse.json(
        { message: "Dados incompletos" },
        { status: 400 },
      );
    }

    if (!body.date) {
      return NextResponse.json(
        { message: "Data da transação obrigatória" },
        { status: 400 },
      );
    }

    const baseDate = new Date(body.date);
    if (Number.isNaN(baseDate.getTime())) {
      return NextResponse.json(
        { message: "Data da transação inválida" },
        { status: 400 },
      );
    }

    const isRecurring = body.isRecurring === true;

    let installmentsCount = 1;
    if (isRecurring) {
      const raw =
        body.installments != null
          ? parseInt(String(body.installments), 10)
          : NaN;
      if (!Number.isInteger(raw) || raw < 2 || raw > 60) {
        return NextResponse.json(
          { message: "Recorrência deve estar entre 2 e 60 meses" },
          { status: 400 },
        );
      }
      installmentsCount = raw;
    }

    const recurrenceId = isRecurring
      ? Math.random().toString(36).substring(2, 10)
      : null;

    // Interface local para tipagem
    type TransactionDoc = {
      userId: string; // Garantido que é string vinda da sessão
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
        userId: session.id, // ID FORÇADO DA SESSÃO
        contactId: body.contactId ?? undefined,
        type: body.type,
        amount: body.amount,
        description: body.description ?? "",
        category: body.category ?? "",
        paymentMethod: body.paymentMethod ?? "",
        date: parcelDate,
        status:
          i === 0 ? (body.status === "PAID" ? "PAID" : "PENDING") : "PENDING",
        recurrenceId: recurrenceId ?? undefined,
        installment: i + 1,
        totalInstallments: installmentsCount,
      });
    }

    const createdTransactions =
      await Transaction.insertMany(transactionsToCreate);

    return NextResponse.json(createdTransactions[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return NextResponse.json({ message: "Erro ao salvar" }, { status: 500 });
  }
}
