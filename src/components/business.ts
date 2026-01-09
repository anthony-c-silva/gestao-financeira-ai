export const BUSINESS_SIZES = {
  MEI: {
    label: "MEI - Microempreendedor Individual",
    limit: 81000,
    description: "Faturamento até R$ 81.000,00/ano",
  },
  ME: {
    label: "ME - Microempresa",
    limit: 360000,
    description: "Faturamento até R$ 360.000,00/ano",
  },
  EPP: {
    label: "EPP - Empresa de Pequeno Porte",
    limit: 4800000,
    description: "Faturamento até R$ 4.800.000,00/ano",
  },
  OTHER: {
    label: "Outros / Não se aplica",
    limit: 0, // Sem limite ou configurável depois
    description: "Faturamento acima de R$ 4.800.000,00",
  },
};

export type BusinessSizeType = keyof typeof BUSINESS_SIZES;