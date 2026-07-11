import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import { getAuthSession } from "@/lib/auth";
import { computeAlertLevel } from "@/lib/alertLevel";

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

// LISTAR LIMITES (com gasto do mês atual já calculado)
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const budgets = await Budget.find({ userId: session.id }).sort({
      createdAt: 1,
    });

    const { start, end } = getMonthRange();

    const enriched = await Promise.all(
      budgets.map(async (budget) => {
        const matchField =
          budget.scope === "PAYMENT_METHOD" ? "paymentMethod" : "category";

        const stats = await Transaction.aggregate([
          {
            $match: {
              userId: budget.userId,
              type: "EXPENSE",
              status: "PAID",
              [matchField]: budget.key,
              date: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        const spentCents = stats[0]?.total || 0;
        const percentage =
          budget.monthlyLimitCents > 0
            ? (spentCents / budget.monthlyLimitCents) * 100
            : 0;

        return {
          _id: budget._id,
          scope: budget.scope,
          key: budget.key,
          monthlyLimitCents: budget.monthlyLimitCents,
          alertThresholdPercent: budget.alertThresholdPercent,
          spentCents,
          percentage,
          alertLevel: computeAlertLevel(
            spentCents,
            budget.monthlyLimitCents,
            budget.alertThresholdPercent,
          ),
        };
      }),
    );

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar limites:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

// CRIAR NOVO LIMITE
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const scope = body.scope === "CATEGORY" ? "CATEGORY" : "PAYMENT_METHOD";
    const key = typeof body.key === "string" ? body.key.trim() : "";
    const monthlyLimitCents = Number(body.monthlyLimitCents);
    const alertThresholdPercent = body.alertThresholdPercent
      ? Number(body.alertThresholdPercent)
      : 80;

    if (!key || !Number.isFinite(monthlyLimitCents) || monthlyLimitCents <= 0) {
      return NextResponse.json(
        { message: "Informe uma chave válida e um limite maior que zero." },
        { status: 400 },
      );
    }

    const exists = await Budget.findOne({ userId: session.id, scope, key });
    if (exists) {
      return NextResponse.json(
        { message: "Já existe um limite configurado para este item." },
        { status: 409 },
      );
    }

    const budget = await Budget.create({
      userId: session.id,
      scope,
      key,
      monthlyLimitCents,
      alertThresholdPercent,
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar limite:", error);
    return NextResponse.json(
      { message: "Erro ao criar limite" },
      { status: 500 },
    );
  }
}
