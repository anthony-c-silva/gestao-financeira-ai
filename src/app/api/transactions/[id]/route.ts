import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

// ATUALIZAR (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Correção de tipagem aqui
) {
  try {
    await connectDB();

    // CORREÇÃO: Agora é necessário aguardar o params antes de usá-lo
    const { id } = await params;

    const body = await req.json();

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      { ...body },
      { new: true } // Retorna o dado atualizado
    );

    if (!updatedTransaction) {
      return NextResponse.json(
        { message: "Transação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTransaction, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

// DELETAR (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Correção de tipagem aqui
) {
  try {
    await connectDB();

    // CORREÇÃO: Aguardando params aqui também
    const { id } = await params;

    await Transaction.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Item removido com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar:", error);
    return NextResponse.json({ message: "Erro ao deletar" }, { status: 500 });
  }
}
