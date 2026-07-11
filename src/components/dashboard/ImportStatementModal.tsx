"use client";

import React, { useRef, useState } from "react";
import {
  X,
  Upload,
  FileUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { useAuthFetch } from "@/lib/authClient";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

const PAYMENT_METHOD_OPTIONS = [
  "Cartão Crédito",
  "Cartão Débito",
  "Pix",
  "Dinheiro",
  "Boleto",
];

interface PreviewRow {
  tempId: string;
  date: string;
  description: string;
  amountCents: number;
  type: "INCOME" | "EXPENSE";
  suggestedCategory: string;
  isDuplicate: boolean;
}

interface CategoryOption {
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  categories: CategoryOption[];
}

type Step = "UPLOAD" | "PREVIEW";

export function ImportStatementModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
}: ImportStatementModalProps) {
  const [step, setStep] = useState<Step>("UPLOAD");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [rowCategory, setRowCategory] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authFetch = useAuthFetch();

  const formatCurrency = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const resetAll = () => {
    setStep("UPLOAD");
    setPaymentMethod(PAYMENT_METHOD_OPTIONS[0]);
    setError(null);
    setRows([]);
    setSelected({});
    setRowCategory({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleFileSelected = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const content = await file.text();
      const res = await authFetch("/api/transactions/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, content }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erro ao ler o arquivo.");
        return;
      }

      const preview: PreviewRow[] = data.transactions;
      setRows(preview);
      setSelected(
        Object.fromEntries(preview.map((r) => [r.tempId, !r.isDuplicate])),
      );
      setRowCategory(
        Object.fromEntries(preview.map((r) => [r.tempId, r.suggestedCategory])),
      );
      setStep("PREVIEW");
    } catch (e) {
      setError("Erro ao ler o arquivo. Verifique se é um OFX ou CSV válido.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const toImport = rows
        .filter((r) => selected[r.tempId])
        .map((r) => ({
          date: r.date,
          description: r.description,
          amountCents: r.amountCents,
          type: r.type,
          category: rowCategory[r.tempId] || r.suggestedCategory,
          paymentMethod,
        }));

      if (toImport.length === 0) {
        setError("Selecione ao menos uma transação para importar.");
        return;
      }

      const res = await authFetch("/api/transactions/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: toImport }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erro ao importar.");
        return;
      }

      onSuccess(data.count);
      handleClose();
    } catch (e) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Extrato"
      description="Importe uma fatura ou extrato em OFX/CSV"
    >
      <div className="flex justify-between items-center mb-4 shrink-0 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileUp size={20} className="text-brand-900" /> Importar Extrato
        </h2>
        <button
          onClick={handleClose}
          className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === "UPLOAD" && (
        <div className="space-y-5">
          <p className="text-sm text-slate-500">
            Envie o arquivo de fatura do cartão ou extrato bancário exportado
            pelo seu banco (formato <strong>.OFX</strong> ou <strong>.CSV</strong>).
            Nenhuma transação é salva antes de você revisar e confirmar.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">
              Este arquivo é de qual forma de pagamento?
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-900 text-sm font-bold text-slate-700"
            >
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full py-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/50 transition-all disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={28} className="animate-spin" />
            ) : (
              <Upload size={28} />
            )}
            <span className="text-sm font-bold">
              {loading ? "Lendo arquivo..." : "Toque para escolher o arquivo"}
            </span>
            <span className="text-xs">.ofx ou .csv</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ofx,.csv,text/csv,application/x-ofx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
            }}
          />
        </div>
      )}

      {step === "PREVIEW" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase">
              {selectedCount} de {rows.length} selecionadas
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-bold text-brand-900 hover:text-brand-700"
            >
              Trocar arquivo
            </button>
          </div>

          <div className="max-h-[45vh] overflow-y-auto custom-scrollbar space-y-2 -mx-1 px-1">
            {rows.map((row) => {
              const options = categories.filter((c) => c.type === row.type);
              return (
                <div
                  key={row.tempId}
                  className={`p-3 rounded-xl border flex flex-col gap-2 ${
                    row.isDuplicate
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!selected[row.tempId]}
                      onChange={(e) =>
                        setSelected((prev) => ({
                          ...prev,
                          [row.tempId]: e.target.checked,
                        }))
                      }
                      className="mt-1 w-4 h-4 accent-brand-900 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-700 truncate">
                          {row.description}
                        </span>
                        <span
                          className={`text-sm font-black shrink-0 flex items-center gap-1 ${row.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {row.type === "INCOME" ? (
                            <ArrowUpCircle size={14} />
                          ) : (
                            <ArrowDownCircle size={14} />
                          )}
                          {formatCurrency(row.amountCents)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs text-slate-400">
                          {new Date(row.date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                        {row.isDuplicate && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Possível duplicata
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <select
                    value={rowCategory[row.tempId] ?? ""}
                    onChange={(e) =>
                      setRowCategory((prev) => ({
                        ...prev,
                        [row.tempId]: e.target.value,
                      }))
                    }
                    className="ml-7 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-brand-900"
                  >
                    <option value="">Selecione a categoria...</option>
                    {options.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || selectedCount === 0}
            className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg bg-brand-900 hover:bg-brand-700 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            Importar {selectedCount} transaç{selectedCount === 1 ? "ão" : "ões"}
          </button>
        </div>
      )}
    </ResponsiveModal>
  );
}
