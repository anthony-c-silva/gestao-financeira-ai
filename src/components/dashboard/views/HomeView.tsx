"use client";

import React, { useState } from "react";
import { Eye, EyeOff, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { FaturamentoCard } from "@/components/dashboard/FaturamentoCard";

// 1. Tipagem rigorosa para a transação
export interface TransactionItem {
  _id: string;
  contactId?: { name: string };
  description?: string;
  category: string;
  totalInstallments?: number;
  installment?: number;
  date: string;
  createdAt?: string;
  type: "INCOME" | "EXPENSE";
  status: "PAID" | "PENDING";
  amount: number;
}

// 2. Tipagem rigorosa ALINHADA com o FaturamentoCard
export interface FiscalSummary {
  businessType?: string;
  limitLabel: string;
  annualLimit: number;
  currentRevenue: number;
  percentage: number;
  // Agora o TypeScript sabe que não é uma string qualquer, e sim os status oficiais
  alertLevel: "NORMAL" | "WARNING" | "DANGER" | "EXTRAPOLATED";
}

interface HomeViewProps {
  transactions: TransactionItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  balance: number;
  income: number;
  expense: number;
  summaryData: FiscalSummary | null;
  loading: boolean;
  userType?: "PF" | "PJ";
  showValues: boolean;
  onToggleShowValues: () => void;
  formatMoney: (val: number) => string;
}

export function HomeView({
  transactions,
  selectedDate,
  onDateChange,
  balance,
  income,
  expense,
  summaryData,
  loading,
  userType,
  showValues,
  onToggleShowValues,
  formatMoney,
}: HomeViewProps) {
  const [homeFilter, setHomeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">(
    "ALL",
  );

  const getDisplayTitle = (t: TransactionItem) => {
    const base = t.contactId?.name || t.description || t.category;
    const suf =
      t.totalInstallments != null &&
      t.installment != null &&
      t.totalInstallments > 1
        ? ` (${t.installment}/${t.totalInstallments})`
        : "";
    return base + suf;
  };

  const recentActivities = [...transactions]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date).getTime();
      const dateB = new Date(b.createdAt || b.date).getTime();
      return dateB - dateA;
    })
    .filter((t) => (homeFilter === "ALL" ? true : t.type === homeFilter))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <MonthSelector currentDate={selectedDate} onDateChange={onDateChange} />

      <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl shadow-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-900/20 rounded-full -mr-10 -mt-10 blur-3xl"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <span className="text-slate-300 text-sm font-medium">
            Saldo do Mês (Realizado)
          </span>
          <button
            onClick={onToggleShowValues}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {showValues ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="text-3xl sm:text-4xl font-black mb-8 relative z-10 tracking-tight break-words">
          {formatMoney(balance)}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              <TrendingUp size={14} /> Entradas
            </div>
            <span className="text-sm sm:text-lg font-bold break-words block">
              {formatMoney(income)}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 mb-1 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
              <TrendingDown size={14} /> Saídas
            </div>
            <span className="text-sm sm:text-lg font-bold break-words block">
              {formatMoney(expense)}
            </span>
          </div>
        </div>
      </div>

      {/* O AS ANY FOI REMOVIDO DAQUI! 🎉 */}
      {userType === "PJ" && (
        <FaturamentoCard data={summaryData} loading={loading} />
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
            <Wallet size={18} className="text-brand-900" /> Últimas Atividades
          </h3>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setHomeFilter("ALL")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${homeFilter === "ALL" ? "bg-slate-800 text-white border-slate-800 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setHomeFilter("INCOME")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${homeFilter === "INCOME" ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:text-emerald-600"}`}
          >
            <TrendingUp size={12} /> Entradas
          </button>
          <button
            onClick={() => setHomeFilter("EXPENSE")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${homeFilter === "EXPENSE" ? "bg-rose-100 text-rose-700 border-rose-200 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:text-rose-600"}`}
          >
            <TrendingDown size={12} /> Saídas
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
            Nenhuma movimentação encontrada neste filtro.
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((t) => (
              <div
                key={t._id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center animate-in slide-in-from-bottom-2"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === "INCOME" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}
                  >
                    {t.type === "INCOME" ? (
                      <TrendingUp size={18} />
                    ) : (
                      <TrendingDown size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 text-sm truncate max-w-[150px]">
                      {getDisplayTitle(t)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(t.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold text-sm ${t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {formatMoney(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
