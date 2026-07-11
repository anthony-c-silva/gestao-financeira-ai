"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Save, Trash2, CreditCard, Tag, ChevronDown, Percent } from "lucide-react";
import { useAuthFetch } from "@/lib/authClient";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { PAYMENT_METHODS, PAYMENT_STYLES } from "@/constants/paymentMethods";
import { AVAILABLE_ICONS } from "./CategoryModal";

const ICON_MAP = AVAILABLE_ICONS.reduce(
  (acc, curr) => {
    acc[curr.name] = curr.icon;
    return acc;
  },
  {} as { [key: string]: React.ElementType },
);

const THRESHOLD_OPTIONS = ["60", "70", "80", "90"];

export interface BudgetData {
  _id?: string;
  scope: "PAYMENT_METHOD" | "CATEGORY";
  key: string;
  monthlyLimitCents: number;
  alertThresholdPercent: number;
}

export interface CategoryOption {
  name: string;
  icon?: string;
  color?: string;
  bg?: string;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: BudgetData | null;
  expenseCategories: CategoryOption[];
}

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  expenseCategories,
}: BudgetModalProps) {
  const [scope, setScope] = useState<"PAYMENT_METHOD" | "CATEGORY">(
    "PAYMENT_METHOD",
  );
  const [key, setKey] = useState(PAYMENT_METHODS[0].id);
  const [amount, setAmount] = useState("0,00");
  const [threshold, setThreshold] = useState("80");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isKeyOpen, setIsKeyOpen] = useState(false);
  const [isThresholdOpen, setIsThresholdOpen] = useState(false);
  const keyRef = useRef<HTMLDivElement>(null);
  const thresholdRef = useRef<HTMLDivElement>(null);

  const authFetch = useAuthFetch();

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setScope(initialData.scope);
      setKey(initialData.key);
      setAmount(
        (initialData.monthlyLimitCents / 100).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        }),
      );
      setThreshold(String(initialData.alertThresholdPercent));
    } else {
      setScope("PAYMENT_METHOD");
      setKey(PAYMENT_METHODS[0].id);
      setAmount("0,00");
      setThreshold("80");
    }
    setError(null);
  }, [isOpen, initialData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (keyRef.current && !keyRef.current.contains(event.target as Node))
        setIsKeyOpen(false);
      if (
        thresholdRef.current &&
        !thresholdRef.current.contains(event.target as Node)
      )
        setIsThresholdOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    const floatValue = Number(numericValue) / 100;
    setAmount(
      floatValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanAmount = parseFloat(amount.replace(/\./g, "").replace(",", "."));
      const monthlyLimitCents = Math.round(cleanAmount * 100);

      const payload = {
        scope,
        key,
        monthlyLimitCents,
        alertThresholdPercent: parseInt(threshold, 10) || 80,
      };

      const url = initialData?._id
        ? `/api/budgets/${initialData._id}`
        : "/api/budgets";
      const method = initialData?._id ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.message || "Erro ao salvar limite.");
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?._id) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/budgets/${initialData._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError("Erro ao excluir limite.");
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Ícone + cores do item atualmente selecionado, no mesmo estilo usado no
  // seletor de categoria/pagamento do lançamento de transações.
  const getKeyVisual = (optionKey: string) => {
    if (scope === "PAYMENT_METHOD") {
      const method = PAYMENT_METHODS.find((p) => p.id === optionKey);
      const style = PAYMENT_STYLES[optionKey] || PAYMENT_STYLES.default;
      const Icon = method?.icon || CreditCard;
      return { Icon, className: `${style.bg} ${style.text}`, style: undefined };
    }
    const category = expenseCategories.find((c) => c.name === optionKey);
    const Icon = (category?.icon && ICON_MAP[category.icon]) || Tag;
    return {
      Icon,
      className: "",
      style: { backgroundColor: category?.bg || "#f1f5f9", color: category?.color || "#64748b" },
    };
  };

  const currentVisual = getKeyVisual(key);
  const CurrentIcon = currentVisual.Icon;
  const keyOptions = scope === "PAYMENT_METHOD" ? PAYMENT_METHODS.map((p) => p.id) : expenseCategories.map((c) => c.name);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={() => onClose()}
      title={initialData ? "Editar Limite" : "Novo Limite"}
      description="Configure um limite mensal e receba avisos ao se aproximar dele."
    >
      <div className="pb-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h2 className="font-bold text-slate-800 text-lg">
          {initialData ? "Editar Limite" : "Novo Limite"}
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold">
            {error}
          </div>
        )}

        {!initialData && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setScope("PAYMENT_METHOD");
                setKey(PAYMENT_METHODS[0].id);
                setIsKeyOpen(false);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                scope === "PAYMENT_METHOD"
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <CreditCard size={14} /> Pagamento
            </button>
            <button
              type="button"
              onClick={() => {
                setScope("CATEGORY");
                setKey(expenseCategories[0]?.name || "");
                setIsKeyOpen(false);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                scope === "CATEGORY"
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Tag size={14} /> Categoria
            </button>
          </div>
        )}

        {/* SELETOR DE FORMA DE PAGAMENTO / CATEGORIA (mesmo padrão visual do lançamento) */}
        <div className="relative" ref={keyRef}>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
            {scope === "PAYMENT_METHOD" ? "Forma de pagamento" : "Categoria"}
          </label>
          <button
            type="button"
            onClick={() => !initialData && setIsKeyOpen(!isKeyOpen)}
            disabled={!!initialData}
            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between focus:ring-2 focus:ring-brand-900 outline-none transition-all disabled:opacity-60"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className={`p-1.5 rounded-md shrink-0 ${currentVisual.className}`}
                style={currentVisual.style}
              >
                <CurrentIcon size={14} />
              </div>
              <span className="text-sm font-bold text-slate-700 truncate">
                {key || "Selecione..."}
              </span>
            </div>
            {!initialData && (
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            )}
          </button>

          {isKeyOpen && !initialData && (
            <div className="absolute mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-56 overflow-y-auto z-30 animate-in zoom-in-95 custom-scrollbar">
              {keyOptions.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-400 text-center">
                  Nenhuma categoria de saída cadastrada ainda.
                </div>
              ) : (
                keyOptions.map((opt) => {
                  const visual = getKeyVisual(opt);
                  const OptIcon = visual.Icon;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setKey(opt);
                        setIsKeyOpen(false);
                      }}
                      className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                    >
                      <div
                        className={`p-1 rounded-md shrink-0 ${visual.className}`}
                        style={visual.style}
                      >
                        <OptIcon size={14} />
                      </div>
                      <span
                        className={`text-sm font-medium truncate ${key === opt ? "text-brand-900" : "text-slate-600"}`}
                      >
                        {opt}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Limite mensal
          </span>
          <div className="flex justify-center items-center gap-1 mt-1">
            <span className="text-lg font-medium text-slate-400">R$</span>
            <input
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={handleAmountChange}
              className="w-full max-w-[180px] text-3xl font-black text-slate-800 focus:outline-none bg-transparent text-center"
            />
          </div>
        </div>

        {/* SELETOR DE LIMIAR DE AVISO (mesmo padrão visual) */}
        <div className="relative" ref={thresholdRef}>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
            Avisar a partir de quantos % do limite
          </label>
          <button
            type="button"
            onClick={() => setIsThresholdOpen(!isThresholdOpen)}
            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between focus:ring-2 focus:ring-brand-900 outline-none transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-600 shrink-0">
                <Percent size={14} />
              </div>
              <span className="text-sm font-bold text-slate-700">{threshold}%</span>
            </div>
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          </button>

          {isThresholdOpen && (
            <div className="absolute mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-30 animate-in zoom-in-95">
              {THRESHOLD_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setThreshold(opt);
                    setIsThresholdOpen(false);
                  }}
                  className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                >
                  <div className="p-1 rounded-md bg-amber-50 text-amber-600 shrink-0">
                    <Percent size={12} />
                  </div>
                  <span
                    className={`text-sm font-medium ${threshold === opt ? "text-brand-900" : "text-slate-600"}`}
                  >
                    {opt}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex gap-3">
          {initialData && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="p-3.5 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-xl transition-colors"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-900 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Salvando..." : (
              <>
                <Save size={18} /> Salvar Limite
              </>
            )}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
