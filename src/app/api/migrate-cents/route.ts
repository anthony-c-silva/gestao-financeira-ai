import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    await connectDB();

    // O comando $mul (multiply) do MongoDB multiplica o campo 'amount' por 100 em TODAS as transações do banco
    const result = await Transaction.updateMany(
      {}, // O filtro vazio {} significa "Aplicar em todas as transações"
      { $mul: { amount: 100 } },
    );

    return NextResponse.json(
      {
        message: "Migração para o Padrão de Centavos concluída com sucesso! 🚀",
        documentosAtualizados: result.modifiedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro na migração:", error);
    return NextResponse.json(
      { message: "Erro ao tentar migrar os dados." },
      { status: 500 },
    );
  }
}
