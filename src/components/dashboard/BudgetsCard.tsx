"use client";

import React from "react";
import { AlertTriangle, CheckCircle, Plus, ShieldAlert } from "lucide-react";
import { BudgetData } from "./BudgetModal";

export interface BudgetWithUsage extends BudgetData {
  _id: string;
  spentCents: number;
  percentage: number;
  alertLevel: "NORMAL" | "WARNING" | "DANGER" | "EXTRAPOLATED";
}

interface BudgetsCardProps {
  budgets: BudgetWithUsage[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (budget: BudgetWithUsage) => void;
}

const statusConfig = {
  NORMAL: { color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  WARNING: { color: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" },
  DANGER: { color: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
  EXTRAPOLATED: { color: "bg-red-600", text: "text-red-700", bg: "bg-red-50" },
};

const formatCurrency = (value: number) =>
  (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function BudgetsCard({ budgets, loading, onAdd, onEdit }: BudgetsCardProps) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-24 animate-pulse" />
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2">
          <ShieldAlert size={16} className="text-brand-900" /> Limites do mês
        </h3>
        <button
          onClick={onAdd}
          className="p-1.5 bg-brand-50 text-brand-900 rounded-lg hover:bg-brand-100 transition-colors"
          title="Novo limite"
        >
          <Plus size={16} />
        </button>
      </div>

      {budgets.length === 0 ? (
        <button
          onClick={onAdd}
          className="w-full text-left text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors"
        >
          Configure um limite de gasto para cartão de crédito, débito ou
          categoria e receba avisos ao se aproximar dele.
        </button>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const config = statusConfig[budget.alertLevel] || statusConfig.NORMAL;
            const Icon = budget.alertLevel === "NORMAL" ? CheckCircle : AlertTriangle;
            return (
              <button
                key={budget._id}
                onClick={() => onEdit(budget)}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-brand-100 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">
                    {budget.key}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${config.bg} ${config.text}`}
                  >
                    <Icon size={10} />
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full ${config.color} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {formatCurrency(budget.spentCents)} de{" "}
                  {formatCurrency(budget.monthlyLimitCents)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
