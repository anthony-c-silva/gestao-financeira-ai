import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { getAuthSession } from "@/lib/auth";

// Definimos um tipo local para a query de atualização em lote
// Isso substitui o "any" inseguro
type BulkQuery = {
  userId: string;
  recurrenceId: string;
  date?: { $gte: Date };
};

// PUT: Editar Transação
export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const params = await props.params;
    const { id } = params;

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "SINGLE";

    // VERIFICA PROPRIEDADE: Busca a transação garantindo que pertence ao usuário
    const originalTransaction = await Transaction.findOne({
      _id: id,
      userId: session.id,
    });

    if (!originalTransaction) {
      return NextResponse.json(
        { message: "Transação não encontrada ou acesso negado" },
        { status: 404 },
      );
    }

    // Se for edição simples (SINGLE)
    if (action === "SINGLE") {
      // Remove campos sensíveis que não devem ser mudados via PUT direto
      const { userId, ...safeBody } = body;

      const updatedTransaction = await Transaction.findByIdAndUpdate(
        id,
        safeBody,
        { new: true },
      );
      return NextResponse.json(updatedTransaction);
    }

    // Validação de Recorrência para Lote
    if (!originalTransaction.recurrenceId) {
      return NextResponse.json(
        { message: "Transação não é recorrente" },
        { status: 400 },
      );
    }

    // --- CORREÇÃO DO ANY ---
    // Tipamos explicitamente o objeto query
    const query: BulkQuery = {
      userId: session.id, // Garante escopo do usuário
      recurrenceId: originalTransaction.recurrenceId,
    };

    if (action === "FUTURE") {
      query.date = { $gte: originalTransaction.date };
    }

    // Remove a data e o userId do body para evitar inconsistências em lote
    const { date, userId, ...bulkUpdates } = body;

    await Transaction.updateMany(query, { $set: bulkUpdates });

    return NextResponse.json({ message: "Série atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ message: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE: Excluir Transação
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const params = await props.params;
    const { id } = params;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "SINGLE";

    // VERIFICA PROPRIEDADE
    const originalTransaction = await Transaction.findOne({
      _id: id,
      userId: session.id,
    });

    if (!originalTransaction) {
      return NextResponse.json(
        { message: "Transação não encontrada ou acesso negado" },
        { status: 404 },
      );
    }

    if (action === "SINGLE") {
      await Transaction.findByIdAndDelete(id);
      return NextResponse.json({ message: "Transação excluída" });
    }

    if (!originalTransaction.recurrenceId) {
      // Se não é recorrente, deleta só ela mesmo
      await Transaction.findByIdAndDelete(id);
      return NextResponse.json({ message: "Transação excluída" });
    }

    // --- CORREÇÃO DO ANY ---
    const query: BulkQuery = {
      userId: session.id, // Scopo do usuário
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
