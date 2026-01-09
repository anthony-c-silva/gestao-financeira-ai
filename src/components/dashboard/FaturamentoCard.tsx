"use client";

import React from "react";
import { AlertTriangle, CheckCircle, TrendingUp, Phone } from "lucide-react";

interface FaturamentoCardProps {
  data: {
    limitLabel: string;
    annualLimit: number;
    currentRevenue: number;
    percentage: number;
    alertLevel: "NORMAL" | "WARNING" | "DANGER" | "EXTRAPOLATED";
  } | null;
  loading: boolean;
}

export function FaturamentoCard({ data, loading }: FaturamentoCardProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-48 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-full mb-4"></div>
        <div className="h-2 bg-slate-200 rounded-full w-full"></div>
      </div>
    );
  }

  if (!data) return null;

  const statusConfig = {
    NORMAL: {
      color: "bg-emerald-500",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      icon: CheckCircle,
    },
    WARNING: {
      color: "bg-yellow-500",
      text: "text-yellow-700",
      bg: "bg-yellow-50",
      icon: AlertTriangle,
    },
    DANGER: {
      color: "bg-orange-500",
      text: "text-orange-700",
      bg: "bg-orange-50",
      icon: AlertTriangle,
    },
    EXTRAPOLATED: {
      color: "bg-red-600",
      text: "text-red-700",
      bg: "bg-red-50",
      icon: AlertTriangle,
    },
  };

  const config = statusConfig[data.alertLevel] || statusConfig.NORMAL;
  const Icon = config.icon;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        <div>
          <h3 className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 flex-wrap">
            <TrendingUp size={16} className="shrink-0" />
            <span className="break-words">Fiscal ({data.limitLabel})</span>
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
            Acumulado em {new Date().getFullYear()}
          </p>
        </div>

        {/* Badge de Porcentagem */}
        <div
          className={`self-start sm:self-auto px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 ${config.bg} ${config.text} whitespace-nowrap`}
        >
          <Icon size={12} />
          {data.percentage.toFixed(1)}% do limite
        </div>
      </div>

      {/* Valores - Responsivo: Coluna no Mobile, Linha no Desktop */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-800 break-all sm:break-normal leading-tight">
          {formatCurrency(data.currentRevenue)}
        </span>
        <span className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-1.5 whitespace-nowrap">
          / {formatCurrency(data.annualLimit)}
        </span>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${config.color} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(data.percentage, 100)}%` }}
        />
      </div>

      {/* Mensagens de Alerta e Botão */}
      {data.alertLevel !== "NORMAL" && (
        <div
          className={`mt-4 p-4 rounded-xl ${config.bg} border border-dashed ${
            data.alertLevel === "EXTRAPOLATED"
              ? "border-red-200"
              : "border-yellow-200"
          }`}
        >
          <p className={`text-xs font-medium mb-3 ${config.text}`}>
            {data.alertLevel === "WARNING" &&
              "Atenção: Você atingiu 80% do seu limite."}
            {data.alertLevel === "DANGER" &&
              "Cuidado: Você está muito próximo de estourar o limite!"}
            {data.alertLevel === "EXTRAPOLATED" &&
              "URGENTE: Limite ultrapassado. Regularize sua situação."}
          </p>

          <button
            onClick={() =>
              window.open(
                "https://wa.me/555196603937?text=Ola, preciso de ajuda com meu enquadramento",
                "_blank"
              )
            }
            className="w-full py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Phone size={14} className="text-green-600 shrink-0" />
            Falar com Especialista
          </button>
        </div>
      )}
    </div>
  );
}
