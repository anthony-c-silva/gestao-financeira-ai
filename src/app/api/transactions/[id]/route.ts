import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

// PUT: Editar Transação (Com suporte a recorrência)
export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    // CORREÇÃO NEXT.JS 15: Aguardar params antes de usar
    const params = await props.params;
    const { id } = params;

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "SINGLE"; // SINGLE, FUTURE, ALL

    // Se for edição simples (SINGLE), atualiza direto
    if (action === "SINGLE") {
      const updatedTransaction = await Transaction.findByIdAndUpdate(id, body, {
        new: true,
      });
      return NextResponse.json(updatedTransaction);
    }

    // Se for Lote (FUTURE ou ALL), precisamos do recurrenceId
    const originalTransaction = await Transaction.findById(id);
    if (!originalTransaction || !originalTransaction.recurrenceId) {
      return NextResponse.json(
        { message: "Transação não encontrada ou não é recorrente" },
        { status: 404 },
      );
    }

    const query: {
      userId: string;
      recurrenceId: string;
      date?: { $gte: string | Date };
    } = {
      userId: originalTransaction.userId,
      recurrenceId: originalTransaction.recurrenceId,
    };

    if (action === "FUTURE") {
      // Afeta a atual e as futuras baseadas na DATA
      query.date = { $gte: originalTransaction.date };
    }

    // REMOVE A DATA DO BODY PARA EDIÇÃO EM LOTE
    // (Não queremos que todas as parcelas fiquem com a mesma data de vencimento)
    const { date, ...bulkUpdates } = body;

    await Transaction.updateMany(query, { $set: bulkUpdates });

    return NextResponse.json({ message: "Série atualizada com sucesso" });
  } catch (error) {
    return NextResponse.json({ message: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE: Excluir Transação (Com suporte a recorrência)
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    // CORREÇÃO NEXT.JS 15: Aguardar params antes de usar
    const params = await props.params;
    const { id } = params;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "SINGLE"; // SINGLE, FUTURE, ALL

    if (action === "SINGLE") {
      await Transaction.findByIdAndDelete(id);
      return NextResponse.json({ message: "Transação excluída" });
    }

    const originalTransaction = await Transaction.findById(id);
    if (!originalTransaction || !originalTransaction.recurrenceId) {
      // Se não achou ou não é recorrente, deleta só ela mesmo por segurança
      await Transaction.findByIdAndDelete(id);
      return NextResponse.json({ message: "Transação excluída" });
    }

    const query: {
      userId: string;
      recurrenceId: string;
      date?: { $gte: string | Date };
    } = {
      userId: originalTransaction.userId,
      recurrenceId: originalTransaction.recurrenceId,
    };

    if (action === "FUTURE") {
      query.date = { $gte: originalTransaction.date };
    }

    await Transaction.deleteMany(query);

    return NextResponse.json({ message: "Série excluída com sucesso" });
  } catch (error) {
    console.error("Erro no DELETE:", error);
    return NextResponse.json({ message: "Erro ao deletar" }, { status: 500 });
  }
}
