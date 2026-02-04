// src/constants/business.ts

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
    label: "Outros / Médio ou Grande Porte",
    limit: 0, // 0 = Sem limite para alertas
    description: "Faturamento acima de R$ 4.800.000,00",
  },
};

export type BusinessSizeType = keyof typeof BUSINESS_SIZES;

// --- NOVAS CORES DA MARCA ---
// Azul (#000066) e Verde (#1ba879) aplicados com fundos suaves para as categorias
const BRAND_BLUE = { bg: "#f0f1fa", text: "#000066" }; // Corporate
const BRAND_GREEN = { bg: "#effdf6", text: "#1ba879" }; // Brand
const ALERT_ORANGE = { bg: "#ffedd5", text: "#f97316" };
const DANGER_RED = { bg: "#fee2e2", text: "#ef4444" };

export const DEFAULT_CATEGORIES = [
  // RECEITAS (Foco no Verde e Azul da marca)
  { name: "Vendas", type: "INCOME", icon: "ShoppingBag", ...BRAND_GREEN },
  { name: "Serviços", type: "INCOME", icon: "Briefcase", ...BRAND_BLUE },
  { name: "Investimentos", type: "INCOME", icon: "Heart", ...BRAND_GREEN }, // Heart ou outro ícone de valor
  { name: "Outras Receitas", type: "INCOME", icon: "MoreHorizontal", ...BRAND_BLUE },

  // DESPESAS (Cores funcionais + Azul da marca para itens administrativos)
  { name: "Alimentação", type: "EXPENSE", icon: "Utensils", ...ALERT_ORANGE },
  { name: "Transporte", type: "EXPENSE", icon: "Car", ...BRAND_BLUE },
  { name: "Moradia/Aluguel", type: "EXPENSE", icon: "Home", ...BRAND_BLUE },
  { name: "Contas (Água/Luz)", type: "EXPENSE", icon: "Zap", ...DANGER_RED },
  { name: "Fornecedores", type: "EXPENSE", icon: "Users", ...BRAND_BLUE },
  { name: "Manutenção", type: "EXPENSE", icon: "Wrench", ...BRAND_BLUE },
  { name: "Saúde", type: "EXPENSE", icon: "Heart", ...DANGER_RED },
  { name: "Lazer", type: "EXPENSE", icon: "Music", ...ALERT_ORANGE },
];