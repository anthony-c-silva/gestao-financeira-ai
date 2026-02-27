import React from "react";
import { TrendingUp, Minus, Calculator } from "lucide-react";

interface Transaction {
  type: "INCOME" | "EXPENSE";
  amount: number;
  status: "PENDING" | "PAID";
  date: string;
  category: string;
}

interface DreReportProps {
  transactions: Transaction[];
  month: Date; // Mês de referência para o relatório
}

export function DreReport({ transactions, month }: DreReportProps) {
  // 1. Filtra transações APENAS do mês selecionado e que estão PAGAS (Regime de Caixa)
  const monthlyTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    const tDateAdjusted = new Date(
      tDate.valueOf() + tDate.getTimezoneOffset() * 60000,
    );

    return (
      t.status === "PAID" &&
      tDateAdjusted.getMonth() === month.getMonth() &&
      tDateAdjusted.getFullYear() === month.getFullYear()
    );
  });

  // 2. Cálculos do DRE
  const grossRevenue = monthlyTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = monthlyTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  const netResult = grossRevenue - totalExpenses;
  const margin =
    grossRevenue > 0 ? ((netResult / grossRevenue) * 100).toFixed(1) : "0.0";

  // --- FORMATAÇÃO MATEMÁTICA (PADRÃO DE CENTAVOS) ---
  const format = (val: number) =>
    (val / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
      {/* Cabeçalho do Card - Responsivo */}
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-0">
          {" "}
          {/* min-w-0 ajuda no flexbox responsivo */}
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
            <Calculator size={20} className="text-brand-900 shrink-0" />
            DRE Gerencial
          </h3>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1 truncate">
            {month.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Linha 1: Receita Bruta */}
        <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase">
                (+) Entradas
              </span>
              <span className="text-sm font-medium text-slate-500">
                Receita Bruta
              </span>
            </div>
          </div>
          <span className="text-sm font-bold text-emerald-600">
            {format(grossRevenue)}
          </span>
        </div>

        {/* Linha 2: Despesas */}
        <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <Minus size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase">
                (-) Saídas
              </span>
              <span className="text-sm font-medium text-slate-500">
                Despesas & Custos
              </span>
            </div>
          </div>
          <span className="text-sm font-medium text-rose-500">
            - {format(totalExpenses)}
          </span>
        </div>

        {/* Linha Divisória */}
        <div className="border-t border-dashed border-slate-200 my-2"></div>

        {/* Linha 3: Resultado Final */}
        <div
          className={`flex justify-between items-center p-4 rounded-xl border-2 ${netResult >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}
        >
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-800">
              LUCRO / PREJUÍZO
            </span>
            <span
              className={`text-xs font-bold ${netResult >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              Margem Líquida: {margin}%
            </span>
          </div>
          <span
            className={`text-lg font-black ${netResult >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {format(netResult)}
          </span>
        </div>
      </div>
    </div>
  );
}
