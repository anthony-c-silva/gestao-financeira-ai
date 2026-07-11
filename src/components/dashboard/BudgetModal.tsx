"use client";

import React, { useEffect, useState } from "react";
import { X, Save, Trash2, CreditCard, Tag } from "lucide-react";
import { useAuthFetch } from "@/lib/authClient";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

const PAYMENT_METHOD_OPTIONS = [
  "Cartão Crédito",
  "Cartão Débito",
  "Pix",
  "Dinheiro",
  "Boleto",
];

export interface BudgetData {
  _id?: string;
  scope: "PAYMENT_METHOD" | "CATEGORY";
  key: string;
  monthlyLimitCents: number;
  alertThresholdPercent: number;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: BudgetData | null;
  expenseCategories: string[];
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
  const [key, setKey] = useState(PAYMENT_METHOD_OPTIONS[0]);
  const [amount, setAmount] = useState("0,00");
  const [threshold, setThreshold] = useState("80");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setKey(PAYMENT_METHOD_OPTIONS[0]);
      setAmount("0,00");
      setThreshold("80");
    }
    setError(null);
  }, [isOpen, initialData]);

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
                setKey(PAYMENT_METHOD_OPTIONS[0]);
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
                setKey(expenseCategories[0] || "");
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

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
            {scope === "PAYMENT_METHOD" ? "Forma de pagamento" : "Categoria"}
          </label>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={!!initialData}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-900 text-sm font-bold text-slate-700 disabled:opacity-60"
          >
            {(scope === "PAYMENT_METHOD"
              ? PAYMENT_METHOD_OPTIONS
              : expenseCategories
            ).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
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

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
            Avisar a partir de quantos % do limite
          </label>
          <select
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-900 text-sm font-bold text-slate-700"
          >
            <option value="60">60%</option>
            <option value="70">70%</option>
            <option value="80">80%</option>
            <option value="90">90%</option>
          </select>
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
