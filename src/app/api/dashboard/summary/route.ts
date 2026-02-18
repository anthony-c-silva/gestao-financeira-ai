import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { BUSINESS_SIZES, BusinessSizeType } from "@/constants/business";
import { getAuthSession } from "@/lib/auth";

// Helper para pegar o primeiro e último dia do ano corrente
const getYearRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1); // 01/Jan
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // 31/Dez
  return { start, end };
};

export async function GET(req: Request) {
  try {
    // 1. Segurança: Obtém sessão do cookie
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    // 2. Buscar dados do Usuário (Para saber o Limite) usando o ID da sessão
    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const businessType = (user.businessSize as BusinessSizeType) || "OTHER";
    const limitInfo = BUSINESS_SIZES[businessType] || BUSINESS_SIZES.OTHER;
    const annualLimit = limitInfo.limit;

    // 3. Calcular Faturamento Anual (Soma de INCOME do ano)
    const { start, end } = getYearRange();

    const revenueStats = await Transaction.aggregate([
      {
        $match: {
          userId: user._id, // Garante que só busca dados deste usuário
          type: "INCOME",
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const currentRevenue = revenueStats[0]?.total || 0;

    // 4. Regras de Alerta
    let alertLevel = "NORMAL";
    let percentage = 0;

    if (annualLimit > 0) {
      percentage = (currentRevenue / annualLimit) * 100;

      if (currentRevenue > annualLimit) alertLevel = "EXTRAPOLATED";
      else if (percentage >= 90) alertLevel = "DANGER";
      else if (percentage >= 80) alertLevel = "WARNING";
    }

    return NextResponse.json({
      businessType: businessType,
      limitLabel: limitInfo.label,
      annualLimit,
      currentRevenue,
      percentage,
      alertLevel,
    });
  } catch (error) {
    console.error("Erro no Dashboard Summary:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
