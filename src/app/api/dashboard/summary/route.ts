import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { BUSINESS_SIZES, BusinessSizeType } from "@/constants/business"; // Assumindo que você criou o arquivo de constantes

// Helper para pegar o primeiro e último dia do ano corrente
const getYearRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1); // 01/Jan
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // 31/Dez
  return { start, end };
};

export async function GET(req: Request) {
  try {
    await connectDB();

    // SIMULAÇÃO DE AUTENTICAÇÃO
    // Em produção, aqui você pegaria o ID do usuário da sessão (NextAuth ou JWT)
    // Para teste rápido, vamos pegar do Header ou um hardcoded provisório se não tiver auth implementada ainda
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // 1. Buscar dados do Usuário (Para saber o Limite)
    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );

    const businessType = (user.businessSize as BusinessSizeType) || "OTHER";
    const limitInfo = BUSINESS_SIZES[businessType] || BUSINESS_SIZES.OTHER;
    const annualLimit = limitInfo.limit;

    // 2. Calcular Faturamento Anual (Soma de INCOME do ano)
    const { start, end } = getYearRange();

    const revenueStats = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: "INCOME", // Regra de negócio: Só conta entrada
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

    // 3. Regras de Alerta (Níveis 1, 2 e 3)
    let alertLevel = "NORMAL"; // NORMAL, WARNING, DANGER, EXTRAPOLATED
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
      // Aqui você pode adicionar outros resumos (saldo total, despesas mês, etc.)
    });
  } catch (error) {
    console.error("Erro no Dashboard Summary:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
