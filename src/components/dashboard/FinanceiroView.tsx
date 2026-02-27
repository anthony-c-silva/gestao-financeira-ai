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
  HelpCircle,
  User,
  Building2,
  Pencil,
  Trash2,
  Repeat,
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
  contactId?: {
    _id: string;
    name: string;
    type: "CLIENT" | "SUPPLIER";
  };
  recurrenceId?: string;
  installment?: number;
  totalInstallments?: number;
}

interface FinanceiroViewProps {
  transactions: Transaction[];
  onMarkAsPaid: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  selectedDate: Date; // NOVA PROP RECEBIDA DO DASHBOARD
}

export function FinanceiroView({
  transactions,
  onMarkAsPaid,
  onDelete,
  onEdit,
  selectedDate, // Usando a data global
}: FinanceiroViewProps) {
  const [viewType, setViewType] = useState<"SAIDA" | "ENTRADA">("SAIDA");
  const [filterPeriod, setFilterPeriod] = useState<"DIA" | "MES" | "TODOS">(
    "MES",
  );
  const [activeStatusFilter, setActiveStatusFilter] = useState<
    "ALL" | "VENCIDOS" | "A VENCER" | "PAGOS"
  >("ALL");
  const [confirmingTransaction, setConfirmingTransaction] =
    useState<Transaction | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const typeFiltered = transactions.filter((t) =>
    viewType === "SAIDA" ? t.type === "EXPENSE" : t.type === "INCOME",
  );

  const listByPeriod = typeFiltered
    .filter((t) => {
      if (filterPeriod === "TODOS") return true;

      const tDate = new Date(t.date);
      const tDateAdjusted = new Date(
        tDate.valueOf() + tDate.getTimezoneOffset() * 60000,
      );

      if (filterPeriod === "DIA") {
        // "Hoje" continua sendo HOJE (dia real)
        return (
          tDateAdjusted.getDate() === today.getDate() &&
          tDateAdjusted.getMonth() === today.getMonth() &&
          tDateAdjusted.getFullYear() === today.getFullYear()
        );
      }

      // "Mês" agora obedece ao seletor global (selectedDate)
      return (
        tDateAdjusted.getMonth() === selectedDate.getMonth() &&
        tDateAdjusted.getFullYear() === selectedDate.getFullYear()
      );
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const vencidos = listByPeriod.filter((t) => {
    const tDate = new Date(t.date);
    const tDateAdjusted = new Date(
      tDate.valueOf() + tDate.getTimezoneOffset() * 60000,
    );
    return t.status === "PENDING" && tDateAdjusted < today;
  });

  const aVencer = listByPeriod.filter((t) => {
    const tDate = new Date(t.date);
    const tDateAdjusted = new Date(
      tDate.valueOf() + tDate.getTimezoneOffset() * 60000,
    );
    return t.status === "PENDING" && tDateAdjusted >= today;
  });

  const pagos = listByPeriod.filter((t) => t.status === "PAID");

  const displayList = listByPeriod.filter((t) => {
    if (activeStatusFilter === "ALL") return true;
    const tDate = new Date(t.date);
    const tDateAdjusted = new Date(
      tDate.valueOf() + tDate.getTimezoneOffset() * 60000,
    );
    if (activeStatusFilter === "PAGOS") return t.status === "PAID";
    if (activeStatusFilter === "VENCIDOS")
      return t.status === "PENDING" && tDateAdjusted < today;
    if (activeStatusFilter === "A VENCER")
      return t.status === "PENDING" && tDateAdjusted >= today;
    return true;
  });

  const totalVencido = vencidos.reduce((acc, t) => acc + t.amount, 0);
  const totalAVencer = aVencer.reduce((acc, t) => acc + t.amount, 0);
  const totalPago = pagos.reduce((acc, t) => acc + t.amount, 0);

  // --- FORMATAÇÃO MATEMÁTICA (PADRÃO DE CENTAVOS) ---
  const formatFull = (val: number) =>
    (val / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatNoCents = (val: number) =>
    (val / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  const getCardValue = (val: number) =>
    val >= 1000000 ? formatNoCents(val) : formatFull(val);

  const getDynamicFontSize = (text: string) => {
    const length = text.length;
    if (length > 14) return "text-[10px] sm:text-xs leading-tight";
    if (length > 10) return "text-xs sm:text-sm leading-tight";
    return "text-sm sm:text-lg leading-tight";
  };

  const toggleFilter = (filter: "VENCIDOS" | "A VENCER" | "PAGOS") => {
    if (activeStatusFilter === filter) setActiveStatusFilter("ALL");
    else setActiveStatusFilter(filter);
  };

  const handleConfirmAction = () => {
    if (confirmingTransaction) {
      onMarkAsPaid(confirmingTransaction);
      setConfirmingTransaction(null);
    }
  };

  const getFilterTitle = () => {
    if (filterPeriod === "DIA") return "Hoje (Dia Atual)";
    if (filterPeriod === "MES")
      return selectedDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
    return "Todo o Período";
  };

  const getLabel = (type: "LATE" | "PENDING" | "DONE") => {
    if (viewType === "SAIDA") {
      if (type === "LATE") return "Vencidos";
      if (type === "PENDING")
        return filterPeriod === "DIA" ? "Vence Hoje" : "A Vencer";
      if (type === "DONE") return "Pagos";
    } else {
      if (type === "LATE") return "Em Atraso";
      if (type === "PENDING")
        return filterPeriod === "DIA" ? "Receber Hoje" : "A Receber";
      if (type === "DONE") return "Recebidos";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
      <div className="flex p-1 bg-slate-200 rounded-2xl">
        <button
          onClick={() => {
            setViewType("SAIDA");
            setActiveStatusFilter("ALL");
          }}
          className={`flex-1 py-3 sm:py-4 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${viewType === "SAIDA" ? "bg-white text-rose-600 shadow-md ring-1 ring-black/5" : "text-slate-500 hover:bg-slate-200/50"}`}
        >
          <ArrowDownCircle size={18} /> Contas a Pagar
        </button>
        <button
          onClick={() => {
            setViewType("ENTRADA");
            setActiveStatusFilter("ALL");
          }}
          className={`flex-1 py-3 sm:py-4 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${viewType === "ENTRADA" ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/5" : "text-slate-500 hover:bg-slate-200/50"}`}
        >
          <ArrowUpCircle size={18} /> A Receber
        </button>
      </div>

      <div className="flex justify-between items-center px-2">
        <h2 className="text-base sm:text-lg font-bold text-slate-700 flex items-center gap-2 capitalize">
          <CalendarDays className="text-brand-900" size={20} />{" "}
          {getFilterTitle()}
        </h2>
        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
          <button
            onClick={() => setFilterPeriod("DIA")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterPeriod === "DIA" ? "bg-brand-100 text-brand-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            Hoje
          </button>
          <button
            onClick={() => setFilterPeriod("MES")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterPeriod === "MES" ? "bg-brand-100 text-brand-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            Mês
          </button>
          <button
            onClick={() => setFilterPeriod("TODOS")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterPeriod === "TODOS" ? "bg-brand-100 text-brand-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            Tudo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <button
          onClick={() => toggleFilter("VENCIDOS")}
          className={`p-2 sm:p-4 rounded-2xl border flex flex-col items-center text-center justify-center min-h-[100px] transition-all active:scale-95 ${activeStatusFilter === "VENCIDOS" ? "bg-rose-100 border-rose-400 ring-2 ring-rose-200 shadow-lg scale-[1.02]" : "bg-white border-slate-100 hover:bg-slate-50"}`}
        >
          <div
            className={`mb-1 sm:mb-2 p-1.5 sm:p-2 rounded-full shadow-sm ${activeStatusFilter === "VENCIDOS" ? "bg-white text-rose-600" : "bg-rose-50 text-rose-500"}`}
          >
            <AlertCircle size={16} className="sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">
            {getLabel("LATE")}
          </span>
          <span
            className={`${getDynamicFontSize(getCardValue(totalVencido))} font-black text-rose-600 mt-0.5 break-words w-full`}
          >
            {getCardValue(totalVencido)}
          </span>
          <span className="text-[9px] sm:text-[10px] text-rose-400 font-medium">
            {vencidos.length} contas
          </span>
        </button>

        <button
          onClick={() => toggleFilter("A VENCER")}
          className={`p-2 sm:p-4 rounded-2xl border flex flex-col items-center text-center justify-center min-h-[100px] transition-all active:scale-95 ${activeStatusFilter === "A VENCER" ? "bg-amber-100 border-amber-400 ring-2 ring-amber-200 shadow-lg scale-[1.02]" : "bg-white border-slate-100 hover:bg-slate-50"}`}
        >
          <div
            className={`mb-1 sm:mb-2 p-1.5 sm:p-2 rounded-full shadow-sm ${activeStatusFilter === "A VENCER" ? "bg-white text-amber-600" : "bg-amber-50 text-amber-500"}`}
          >
            <Clock size={16} className="sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">
            {getLabel("PENDING")}
          </span>
          <span
            className={`${getDynamicFontSize(getCardValue(totalAVencer))} font-black text-slate-700 mt-0.5 break-words w-full`}
          >
            {getCardValue(totalAVencer)}
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
            {aVencer.length} contas
          </span>
        </button>

        <button
          onClick={() => toggleFilter("PAGOS")}
          className={`p-2 sm:p-4 rounded-2xl border flex flex-col items-center text-center justify-center min-h-[100px] transition-all active:scale-95 ${activeStatusFilter === "PAGOS" ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-200 shadow-lg scale-[1.02]" : "bg-white border-slate-100 hover:bg-slate-50 opacity-80"}`}
        >
          <div
            className={`mb-1 sm:mb-2 p-1.5 sm:p-2 rounded-full shadow-sm ${activeStatusFilter === "PAGOS" ? "bg-white text-emerald-600" : "bg-emerald-50 text-emerald-500"}`}
          >
            <CheckCircle2 size={16} className="sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">
            {getLabel("DONE")}
          </span>
          <span
            className={`${getDynamicFontSize(getCardValue(totalPago))} font-black text-emerald-600 mt-0.5 break-words w-full`}
          >
            {getCardValue(totalPago)}
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
            {pagos.length} contas
          </span>
        </button>
      </div>

      {activeStatusFilter !== "ALL" && (
        <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-bold text-slate-600">
            Exibindo apenas:{" "}
            <span className="text-brand-900 uppercase">
              {activeStatusFilter === "VENCIDOS"
                ? getLabel("LATE")
                : activeStatusFilter === "A VENCER"
                  ? getLabel("PENDING")
                  : getLabel("DONE")}
            </span>
          </span>
          <button
            onClick={() => setActiveStatusFilter("ALL")}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white px-2 py-1 rounded shadow-sm"
          >
            <FilterX size={12} /> Limpar Filtro
          </button>
        </div>
      )}

      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-medium text-sm">
              {activeStatusFilter !== "ALL"
                ? "Nenhuma conta com este status."
                : filterPeriod === "DIA"
                  ? "Nenhuma conta para hoje."
                  : "Nenhuma conta encontrada neste período."}
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
              tDate.valueOf() + tDate.getTimezoneOffset() * 60000,
            );
            const isLate = t.status === "PENDING" && dateObj < today;
            const isToday =
              t.status === "PENDING" && dateObj.getTime() === today.getTime();
            const displayTitle =
              t.contactId?.name || t.description || t.category;
            const displaySubtitle = t.contactId
              ? t.description || t.category
              : t.category;
            const isRecurring = t.totalInstallments && t.totalInstallments > 1;

            return (
              <div
                key={t._id}
                className={`relative p-3 sm:p-4 rounded-2xl border bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all active:scale-[0.99] ${isLate ? "border-l-4 border-l-rose-500 ring-1 ring-rose-100" : t.status === "PAID" ? "border-l-4 border-l-emerald-500 opacity-60 grayscale-[0.5]" : "border-l-4 border-l-amber-400"}`}
              >
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="font-bold text-slate-800 text-sm sm:text-base truncate max-w-[180px] sm:max-w-xs flex items-center gap-1.5">
                      {t.contactId &&
                        (t.contactId.type === "CLIENT" ? (
                          <User size={14} className="text-brand-900 shrink-0" />
                        ) : (
                          <Building2
                            size={14}
                            className="text-orange-500 shrink-0"
                          />
                        ))}
                      {displayTitle}
                    </span>

                    {isLate && (
                      <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {viewType === "SAIDA" ? "ATRASADO" : "PENDENTE"}
                      </span>
                    )}
                    {isToday && (
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        HOJE
                      </span>
                    )}

                    {isRecurring && (
                      <span className="bg-brand-100 text-brand-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <Repeat size={10} /> {t.installment}/
                        {t.totalInstallments}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate max-w-[250px]">
                    <span className="text-slate-400">{displaySubtitle}</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      {dateObj.toLocaleDateString("pt-BR")}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="uppercase truncate max-w-[100px]">
                      {t.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 sm:gap-1 border-t sm:border-0 border-slate-50 pt-2 sm:pt-0 mt-1 sm:mt-0">
                  <span
                    className={`text-base sm:text-lg font-black ${viewType === "SAIDA" ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {formatFull(t.amount)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1.5 text-slate-400 hover:text-brand-900 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>

                    {t.status === "PENDING" && (
                      <button
                        onClick={() => setConfirmingTransaction(t)}
                        className={`ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-transform active:scale-90 ${viewType === "SAIDA" ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
                      >
                        <CheckCircle2 size={14} />{" "}
                        {viewType === "SAIDA" ? "Pagar" : "Receber"}
                      </button>
                    )}
                    {t.status === "PAID" && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <CheckCircle2 size={12} />{" "}
                        {viewType === "SAIDA" ? "Pago" : "Recebido"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {confirmingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${confirmingTransaction.type === "EXPENSE" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}
              >
                <HelpCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {confirmingTransaction.type === "EXPENSE"
                  ? "Confirmar Pagamento?"
                  : "Confirmar Recebimento?"}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Confirmar que{" "}
                <strong className="text-slate-800">
                  {confirmingTransaction.type === "EXPENSE"
                    ? "pagou"
                    : "recebeu"}
                </strong>{" "}
                o valor de{" "}
                <strong className="text-slate-800">
                  {formatFull(confirmingTransaction.amount)}
                </strong>{" "}
                referente a{" "}
                <strong className="text-slate-800">
                  {confirmingTransaction.contactId?.name ||
                    confirmingTransaction.description ||
                    confirmingTransaction.category}
                </strong>
                ?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmingTransaction(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`flex-1 py-3 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 ${confirmingTransaction.type === "EXPENSE" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"}`}
                >
                  <CheckCircle2 size={18} />{" "}
                  {confirmingTransaction.type === "EXPENSE"
                    ? "Pagar"
                    : "Receber"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
