"use client";

import React, { useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  CalendarDays,
  FilterX,
} from "lucide-react";

interface Transaction {
  _id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: string;
  category: string;
  paymentMethod: string;
  status: "PENDING" | "PAID";
}

interface FinanceiroViewProps {
  transactions: Transaction[];
  onMarkAsPaid: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export function FinanceiroView({
  transactions,
  onMarkAsPaid,
}: FinanceiroViewProps) {
  const [viewType, setViewType] = useState<"SAIDA" | "ENTRADA">("SAIDA");
  const [filterPeriod, setFilterPeriod] = useState<"MES" | "TODOS">("MES");
  // NOVO: Estado para filtrar pelo clique nos cards
  const [activeStatusFilter, setActiveStatusFilter] = useState<
    "ALL" | "VENCIDOS" | "AVENCER" | "PAGOS"
  >("ALL");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Filtros Básicos (Tipo e Período)
  const typeFiltered = transactions.filter((t) =>
    viewType === "SAIDA" ? t.type === "EXPENSE" : t.type === "INCOME"
  );

  const listByPeriod = typeFiltered
    .filter((t) => {
      if (filterPeriod === "TODOS") return true;
      const tDate = new Date(t.date);
      const tDateAdjusted = new Date(
        tDate.valueOf() + tDate.getTimezoneOffset() * 60000
      );
      return (
        tDateAdjusted.getMonth() === today.getMonth() &&
        tDateAdjusted.getFullYear() === today.getFullYear()
      );
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Cálculos para os Cards (Sempre baseados na lista do período)
  const vencidos = listByPeriod.filter((t) => {
    const tDate = new Date(t.date);
    const tDateAdjusted = new Date(
      tDate.valueOf() + tDate.getTimezoneOffset() * 60000
    );
    return t.status === "PENDING" && tDateAdjusted < today;
  });

  const aVencer = listByPeriod.filter((t) => {
    const tDate = new Date(t.date);
    const tDateAdjusted = new Date(
      tDate.valueOf() + tDate.getTimezoneOffset() * 60000
    );
    return t.status === "PENDING" && tDateAdjusted >= today;
  });

  const pagos = listByPeriod.filter((t) => t.status === "PAID");

  // 3. Lista Final de Exibição (Aplica o filtro do Card Clicado)
  const displayList = listByPeriod.filter((t) => {
    if (activeStatusFilter === "ALL") return true;

    const tDate = new Date(t.date);
    const tDateAdjusted = new Date(
      tDate.valueOf() + tDate.getTimezoneOffset() * 60000
    );

    if (activeStatusFilter === "PAGOS") return t.status === "PAID";
    if (activeStatusFilter === "VENCIDOS")
      return t.status === "PENDING" && tDateAdjusted < today;
    if (activeStatusFilter === "AVENCER")
      return t.status === "PENDING" && tDateAdjusted >= today;
    return true;
  });

  // Totais
  const totalVencido = vencidos.reduce((acc, t) => acc + t.amount, 0);
  const totalAVencer = aVencer.reduce((acc, t) => acc + t.amount, 0);
  const totalPago = pagos.reduce((acc, t) => acc + t.amount, 0);

  // --- FORMATADORES (Mantendo a lógica fiel de valores) ---
  const formatFull = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatNoCents = (val: number) =>
    val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });

  const getCardValue = (val: number) => {
    if (val >= 10000) return formatNoCents(val);
    return formatFull(val);
  };

  const getDynamicFontSize = (text: string) => {
    const length = text.length;
    if (length > 14) return "text-[10px] sm:text-xs leading-tight";
    if (length > 10) return "text-xs sm:text-sm leading-tight";
    return "text-sm sm:text-lg leading-tight";
  };

  // Função para alternar filtro ao clicar no card
  const toggleFilter = (filter: "VENCIDOS" | "AVENCER" | "PAGOS") => {
    if (activeStatusFilter === filter) {
      setActiveStatusFilter("ALL"); // Se já está ativo, desativa (toggle)
    } else {
      setActiveStatusFilter(filter);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
      {/* SELETOR TIPO */}
      <div className="flex p-1 bg-slate-200 rounded-2xl">
        <button
          onClick={() => {
            setViewType("SAIDA");
            setActiveStatusFilter("ALL");
          }}
          className={`flex-1 py-3 sm:py-4 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
            viewType === "SAIDA"
              ? "bg-white text-rose-600 shadow-md ring-1 ring-black/5"
              : "text-slate-500 hover:bg-slate-200/50"
          }`}
        >
          <ArrowDownCircle size={18} />
          Contas a Pagar
        </button>
        <button
          onClick={() => {
            setViewType("ENTRADA");
            setActiveStatusFilter("ALL");
          }}
          className={`flex-1 py-3 sm:py-4 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
            viewType === "ENTRADA"
              ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/5"
              : "text-slate-500 hover:bg-slate-200/50"
          }`}
        >
          <ArrowUpCircle size={18} />A Receber
        </button>
      </div>

      {/* FILTRO TEMPO */}
      <div className="flex justify-between items-center px-2">
        <h2 className="text-base sm:text-lg font-bold text-slate-700 flex items-center gap-2">
          <CalendarDays className="text-indigo-600" size={20} />
          {filterPeriod === "MES" ? "Este Mês" : "Todo o Período"}
        </h2>
        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
          <button
            onClick={() => setFilterPeriod("MES")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              filterPeriod === "MES"
                ? "bg-indigo-100 text-indigo-700"
                : "text-slate-400"
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setFilterPeriod("TODOS")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              filterPeriod === "TODOS"
                ? "bg-indigo-100 text-indigo-700"
                : "text-slate-400"
            }`}
          >
            Tudo
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO INTERATIVOS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Card Vencidos */}
        <button
          onClick={() => toggleFilter("VENCIDOS")}
          className={`p-2 sm:p-4 rounded-2xl border flex flex-col items-center text-center justify-center min-h-[100px] transition-all active:scale-95 ${
            activeStatusFilter === "VENCIDOS"
              ? "bg-rose-100 border-rose-400 ring-2 ring-rose-200 shadow-lg scale-[1.02]"
              : "bg-white border-slate-100 hover:bg-slate-50"
          }`}
        >
          <div
            className={`mb-1 sm:mb-2 p-1.5 sm:p-2 rounded-full shadow-sm ${
              activeStatusFilter === "VENCIDOS"
                ? "bg-white text-rose-600"
                : "bg-rose-50 text-rose-500"
            }`}
          >
            <AlertCircle size={16} className="sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">
            Vencidos
          </span>
          <span
            className={`${getDynamicFontSize(
              getCardValue(totalVencido)
            )} font-black text-rose-600 mt-0.5 break-words w-full`}
          >
            {getCardValue(totalVencido)}
          </span>
          <span className="text-[9px] sm:text-[10px] text-rose-400 font-medium">
            {vencidos.length} contas
          </span>
        </button>

        {/* Card A Vencer */}
        <button
          onClick={() => toggleFilter("AVENCER")}
          className={`p-2 sm:p-4 rounded-2xl border flex flex-col items-center text-center justify-center min-h-[100px] transition-all active:scale-95 ${
            activeStatusFilter === "AVENCER"
              ? "bg-amber-100 border-amber-400 ring-2 ring-amber-200 shadow-lg scale-[1.02]"
              : "bg-white border-slate-100 hover:bg-slate-50"
          }`}
        >
          <div
            className={`mb-1 sm:mb-2 p-1.5 sm:p-2 rounded-full shadow-sm ${
              activeStatusFilter === "AVENCER"
                ? "bg-white text-amber-600"
                : "bg-amber-50 text-amber-500"
            }`}
          >
            <Clock size={16} className="sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">
            A Vencer
          </span>
          <span
            className={`${getDynamicFontSize(
              getCardValue(totalAVencer)
            )} font-black text-slate-700 mt-0.5 break-words w-full`}
          >
            {getCardValue(totalAVencer)}
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
            {aVencer.length} contas
          </span>
        </button>

        {/* Card Pagos */}
        <button
          onClick={() => toggleFilter("PAGOS")}
          className={`p-2 sm:p-4 rounded-2xl border flex flex-col items-center text-center justify-center min-h-[100px] transition-all active:scale-95 ${
            activeStatusFilter === "PAGOS"
              ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-200 shadow-lg scale-[1.02]"
              : "bg-white border-slate-100 hover:bg-slate-50 opacity-80"
          }`}
        >
          <div
            className={`mb-1 sm:mb-2 p-1.5 sm:p-2 rounded-full shadow-sm ${
              activeStatusFilter === "PAGOS"
                ? "bg-white text-emerald-600"
                : "bg-emerald-50 text-emerald-500"
            }`}
          >
            <CheckCircle2 size={16} className="sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">
            Pagos
          </span>
          <span
            className={`${getDynamicFontSize(
              getCardValue(totalPago)
            )} font-black text-emerald-600 mt-0.5 break-words w-full`}
          >
            {getCardValue(totalPago)}
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
            {pagos.length} contas
          </span>
        </button>
      </div>

      {/* STATUS DO FILTRO ATIVO */}
      {activeStatusFilter !== "ALL" && (
        <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-bold text-slate-600">
            Exibindo apenas:{" "}
            <span className="text-indigo-600 uppercase">
              {activeStatusFilter}
            </span>
          </span>
          <button
            onClick={() => setActiveStatusFilter("ALL")}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white px-2 py-1 rounded shadow-sm"
          >
            <FilterX size={12} />
            Limpar Filtro
          </button>
        </div>
      )}

      {/* LISTA DE CONTAS */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-medium text-sm">
              {activeStatusFilter !== "ALL"
                ? "Nenhuma conta com este status."
                : "Nenhuma conta encontrada."}
            </p>
            {activeStatusFilter === "ALL" && (
              <p className="text-xs text-slate-300 mt-1">
                Toque em + para adicionar.
              </p>
            )}
          </div>
        ) : (
          displayList.map((t) => {
            const tDate = new Date(t.date);
            const dateObj = new Date(
              tDate.valueOf() + tDate.getTimezoneOffset() * 60000
            );

            const isLate = t.status === "PENDING" && dateObj < today;
            const isToday =
              t.status === "PENDING" && dateObj.getTime() === today.getTime();

            return (
              <div
                key={t._id}
                className={`relative p-3 sm:p-4 rounded-2xl border bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all active:scale-[0.99] ${
                  isLate
                    ? "border-l-4 border-l-rose-500 ring-1 ring-rose-100"
                    : t.status === "PAID"
                    ? "border-l-4 border-l-emerald-500 opacity-60 grayscale-[0.5]"
                    : "border-l-4 border-l-amber-400"
                }`}
              >
                {/* Informações */}
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="font-bold text-slate-800 text-sm sm:text-base truncate max-w-[180px] sm:max-w-xs">
                      {t.description || t.category}
                    </span>
                    {isLate && (
                      <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        ATRASADO
                      </span>
                    )}
                    {isToday && (
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        HOJE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      {dateObj.toLocaleDateString("pt-BR")}
                    </span>
                    <span>•</span>
                    <span className="uppercase truncate max-w-[100px]">
                      {t.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Valor e Ação */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 sm:gap-1 border-t sm:border-0 border-slate-50 pt-2 sm:pt-0 mt-1 sm:mt-0">
                  <span
                    className={`text-base sm:text-lg font-black ${
                      viewType === "SAIDA"
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatFull(t.amount)}
                  </span>

                  {t.status === "PENDING" && (
                    <button
                      onClick={() => onMarkAsPaid(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-transform active:scale-90 ${
                        viewType === "SAIDA"
                          ? "bg-rose-500 hover:bg-rose-600"
                          : "bg-emerald-500 hover:bg-emerald-600"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      {viewType === "SAIDA" ? "Pagar" : "Receber"}
                    </button>
                  )}
                  {t.status === "PAID" && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <CheckCircle2 size={12} /> Pago
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
