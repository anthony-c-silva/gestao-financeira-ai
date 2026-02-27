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

    // PADRÃO DE CENTAVOS: Multiplicamos o limite em Reais por 100 para a matemática ficar correta
    const annualLimitCents = limitInfo.limit * 100;

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
          total: { $sum: "$amount" }, // Esse valor já está em centavos no banco!
        },
      },
    ]);

    const currentRevenueCents = revenueStats[0]?.total || 0;

    // 4. Regras de Alerta (Feitas todas em Centavos)
    let alertLevel = "NORMAL";
    let percentage = 0;

    if (annualLimitCents > 0) {
      percentage = (currentRevenueCents / annualLimitCents) * 100;

      if (currentRevenueCents > annualLimitCents) alertLevel = "EXTRAPOLATED";
      else if (percentage >= 90) alertLevel = "DANGER";
      else if (percentage >= 80) alertLevel = "WARNING";
    }

    return NextResponse.json({
      businessType: businessType,
      limitLabel: limitInfo.label,
      annualLimit: annualLimitCents, // Enviamos em centavos para o Front
      currentRevenue: currentRevenueCents, // Enviamos em centavos para o Front
      percentage,
      alertLevel,
    });
  } catch (error) {
    console.error("Erro no Dashboard Summary:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
