"use client";

import React from "react";
import { AlertTriangle, CheckCircle, Plus, ShieldAlert, CreditCard, Tag } from "lucide-react";
import { BudgetData, CategoryOption } from "./BudgetModal";
import { PAYMENT_METHODS, PAYMENT_STYLES } from "@/constants/paymentMethods";
import { AVAILABLE_ICONS } from "./CategoryModal";

const ICON_MAP = AVAILABLE_ICONS.reduce(
  (acc, curr) => {
    acc[curr.name] = curr.icon;
    return acc;
  },
  {} as { [key: string]: React.ElementType },
);

export interface BudgetWithUsage extends BudgetData {
  _id: string;
  spentCents: number;
  percentage: number;
  alertLevel: "NORMAL" | "WARNING" | "DANGER" | "EXTRAPOLATED";
}

interface BudgetsCardProps {
  budgets: BudgetWithUsage[];
  categories: CategoryOption[];
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

export function BudgetsCard({
  budgets,
  categories,
  loading,
  onAdd,
  onEdit,
}: BudgetsCardProps) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-24 animate-pulse" />
    );
  }

  const getBudgetVisual = (budget: BudgetWithUsage) => {
    if (budget.scope === "PAYMENT_METHOD") {
      const method = PAYMENT_METHODS.find((p) => p.id === budget.key);
      const style = PAYMENT_STYLES[budget.key] || PAYMENT_STYLES.default;
      return {
        Icon: method?.icon || CreditCard,
        className: `${style.bg} ${style.text}`,
        style: undefined as React.CSSProperties | undefined,
      };
    }
    const category = categories.find((c) => c.name === budget.key);
    return {
      Icon: (category?.icon && ICON_MAP[category.icon]) || Tag,
      className: "",
      style: {
        backgroundColor: category?.bg || "#f1f5f9",
        color: category?.color || "#64748b",
      },
    };
  };

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
            const StatusIcon = budget.alertLevel === "NORMAL" ? CheckCircle : AlertTriangle;
            const visual = getBudgetVisual(budget);
            const KeyIcon = visual.Icon;
            return (
              <button
                key={budget._id}
                onClick={() => onEdit(budget)}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-brand-100 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex justify-between items-center mb-1.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1.5 rounded-md shrink-0 ${visual.className}`}
                      style={visual.style}
                    >
                      <KeyIcon size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">
                      {budget.key}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${config.bg} ${config.text}`}
                  >
                    <StatusIcon size={10} />
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full ${config.color} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-medium ml-8">
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
