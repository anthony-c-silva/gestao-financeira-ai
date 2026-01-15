import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Contact from "@/models/Contact";

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

    // Lógica de Recorrência
    const isRecurring = body.isRecurring === true;
    const installmentsCount = body.installments
      ? parseInt(body.installments)
      : 1;

    // Geramos um ID simples e aleatório para agrupar as parcelas
    const recurrenceId = isRecurring
      ? Math.random().toString(36).substring(7)
      : null;

    const transactionsToCreate = [];
    const baseDate = new Date(body.date);

    // Loop para criar as parcelas
    for (let i = 0; i < installmentsCount; i++) {
      const newDate = new Date(baseDate);
      // Adiciona 'i' meses à data original (ex: hoje, mês que vem, outro mês...)
      newDate.setMonth(newDate.getMonth() + i);

      transactionsToCreate.push({
        userId: body.userId,
        contactId: body.contactId,
        type: body.type,
        amount: body.amount,
        description: body.description,
        category: body.category,
        paymentMethod: body.paymentMethod,
        date: newDate,
        // A primeira parcela mantém o status escolhido (ex: PAGO)
        // As futuras (i > 0) nascem sempre como PENDENTE
        status: i === 0 ? body.status : "PENDING",
        recurrenceId: recurrenceId,
        installment: i + 1,
        totalInstallments: installmentsCount,
      });
    }

    // Salva tudo de uma vez no banco
    const createdTransactions = await Transaction.insertMany(
      transactionsToCreate
    );

    // Retorna apenas a primeira para o front-end não bugar
    return NextResponse.json(createdTransactions[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return NextResponse.json({ message: "Erro ao salvar" }, { status: 500 });
  }
}
