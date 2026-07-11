import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import { getAuthSession } from "@/lib/auth";
import { parseStatementFile } from "@/lib/statementParser";

// Gera uma sugestão de categoria por palavras-chave simples (sem custo, sem IA)
// comparando a descrição do lançamento com os nomes das categorias do usuário.
function suggestCategory(
  description: string,
  categories: { name: string; type: "INCOME" | "EXPENSE" }[],
  type: "INCOME" | "EXPENSE",
): string {
  const normalizedDesc = description.toLowerCase();
  const sameType = categories.filter((c) => c.type === type);

  const match = sameType.find((c) => {
    const word = c.name.toLowerCase().split(/[\s/()]+/)[0];
    return word.length >= 4 && normalizedDesc.includes(word);
  });

  return match?.name || sameType[0]?.name || "";
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const fileName = String(body.fileName || "");
    const content = String(body.content || "");

    if (!content) {
      return NextResponse.json(
        { message: "Arquivo vazio ou inválido." },
        { status: 400 },
      );
    }

    let parsed;
    try {
      parsed = parseStatementFile(fileName, content);
    } catch (parseError) {
      console.error("Erro ao ler arquivo de extrato:", parseError);
      return NextResponse.json(
        { message: "Não foi possível ler este arquivo. Verifique o formato (OFX ou CSV)." },
        { status: 400 },
      );
    }

    if (parsed.length === 0) {
      return NextResponse.json(
        {
          message:
            "Nenhuma transação encontrada no arquivo. Confira se é um extrato/fatura válido.",
        },
        { status: 400 },
      );
    }

    // Limite de segurança por importação
    const rows = parsed.slice(0, 1000);

    const categories = await Category.find({ userId: session.id }).select(
      "name type",
    );

    const dates = rows.map((r) => new Date(r.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const existing = await Transaction.find({
      userId: session.id,
      date: { $gte: minDate, $lte: maxDate },
    }).select("date amount");

    const existingKeys = new Set(
      existing.map(
        (t) => `${new Date(t.date).toISOString().slice(0, 10)}_${Math.abs(t.amount)}`,
      ),
    );

    const preview = rows.map((row, index) => {
      const type: "INCOME" | "EXPENSE" = row.amount >= 0 ? "INCOME" : "EXPENSE";
      const amountCents = Math.round(Math.abs(row.amount) * 100);
      const key = `${row.date}_${amountCents}`;

      return {
        tempId: `${index}-${row.externalId || key}`,
        date: row.date,
        description: row.description,
        amountCents,
        type,
        suggestedCategory: suggestCategory(row.description, categories, type),
        isDuplicate: existingKeys.has(key),
      };
    });

    return NextResponse.json({ transactions: preview }, { status: 200 });
  } catch (error) {
    console.error("Erro no preview de importação:", error);
    return NextResponse.json(
      { message: "Erro ao processar o arquivo." },
      { status: 500 },
    );
  }
}
