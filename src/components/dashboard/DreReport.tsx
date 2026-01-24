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
  // O DRE Gerencial foca no que realmente aconteceu financeiramente.
  const monthlyTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    // Ajuste simples de fuso horário para garantir a leitura correta da data
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

  // (+) Receita Bruta: Tudo que entrou
  const grossRevenue = monthlyTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  // (-) Despesas: Tudo que saiu
  const totalExpenses = monthlyTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  // (=) Resultado Líquido: O que sobrou
  const netResult = grossRevenue - totalExpenses;

  // Margem de Lucro (%): Quanto sobra de cada real que entra
  const margin =
    grossRevenue > 0 ? ((netResult / grossRevenue) * 100).toFixed(1) : "0";

  const format = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calculator size={20} className="text-indigo-600" />
            DRE Gerencial
          </h3>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">
            {month.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Placar do Resultado */}
        <div
          className={`px-4 py-2 rounded-xl border flex flex-col items-end ${netResult >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Resultado Líquido
          </span>
          <span
            className={`text-xl font-black ${netResult >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {format(netResult)}
          </span>
        </div>
      </div>

      {/* Tabela Visual do DRE */}
      <div className="space-y-3">
        {/* Linha 1: Receita */}
        <div className="flex justify-between items-center p-3 bg-indigo-50/50 rounded-xl border border-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <TrendingUp size={16} />
            </div>
            <span className="text-sm font-bold text-slate-700">
              (=) Receita Bruta
            </span>
          </div>
          <span className="text-sm font-bold text-indigo-600">
            {format(grossRevenue)}
          </span>
        </div>

        {/* Linha 2: Despesas (Identadas) */}
        <div className="pl-4 space-y-2 relative border-l-2 border-slate-100 ml-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">
                <Minus size={12} />
              </span>
              <span className="text-sm font-medium text-slate-500">
                Despesas & Custos
              </span>
            </div>
            <span className="text-sm font-medium text-rose-500">
              - {format(totalExpenses)}
            </span>
          </div>
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

      <p className="text-[10px] text-center text-slate-400 mt-4">
        * Este demonstrativo considera apenas transações com status{" "}
        <strong>PAGO</strong> (Regime de Caixa) no mês atual.
      </p>
    </div>
  );
}
