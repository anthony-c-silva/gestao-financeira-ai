import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Budget from "@/models/Budget";
import { getAuthSession } from "@/lib/auth";

// EDITAR LIMITE (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const budget = await Budget.findOne({ _id: id, userId: session.id });
    if (!budget) {
      return NextResponse.json(
        { message: "Limite não encontrado" },
        { status: 404 },
      );
    }

    if (body.monthlyLimitCents != null) {
      const monthlyLimitCents = Number(body.monthlyLimitCents);
      if (!Number.isFinite(monthlyLimitCents) || monthlyLimitCents <= 0) {
        return NextResponse.json(
          { message: "Limite mensal inválido." },
          { status: 400 },
        );
      }
      budget.monthlyLimitCents = monthlyLimitCents;
    }

    if (body.alertThresholdPercent != null) {
      const threshold = Number(body.alertThresholdPercent);
      if (Number.isFinite(threshold) && threshold > 0 && threshold <= 100) {
        budget.alertThresholdPercent = threshold;
      }
    }

    await budget.save();
    return NextResponse.json(budget, { status: 200 });
  } catch (error) {
    console.error("Erro ao editar limite:", error);
    return NextResponse.json(
      { message: "Erro ao editar limite" },
      { status: 500 },
    );
  }
}

// EXCLUIR LIMITE (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const deleted = await Budget.findOneAndDelete({
      _id: id,
      userId: session.id,
    });

    if (!deleted) {
      return NextResponse.json(
        { message: "Limite não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Limite excluído" }, { status: 200 });
  } catch (error) {
    console.error("Erro ao excluir limite:", error);
    return NextResponse.json(
      { message: "Erro ao excluir limite" },
      { status: 500 },
    );
  }
}
