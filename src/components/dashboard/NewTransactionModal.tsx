"use client";

import React, { useState } from "react";
import { X, Check, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
}: NewTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "Outros",
    paymentMethod: "Pix",
    date: new Date().toISOString().split("T")[0],
    status: "PAID",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CORREÇÃO AQUI: O spread (...formData) vem antes das sobrescrições
      const payload = {
        ...formData,
        userId,
        type,
        // Garante que amount seja número e substitui a string do formData
        amount: parseFloat(formData.amount.replace(",", ".")),
      };

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      onSuccess();
      onClose();

      // Reset do form mantendo a data atual
      setFormData({
        amount: "",
        description: "",
        category: "Outros",
        paymentMethod: "Pix",
        date: new Date().toISOString().split("T")[0],
        status: "PAID",
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            Nova Movimentação
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seletor de Tipo */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === "INCOME"
                  ? "bg-white shadow-sm text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              <ArrowUpCircle size={18} /> Entrada
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === "EXPENSE"
                  ? "bg-white shadow-sm text-rose-600"
                  : "text-slate-400"
              }`}
            >
              <ArrowDownCircle size={18} /> Saída
            </button>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full text-4xl font-black text-slate-800 placeholder-slate-200 focus:outline-none border-b-2 border-slate-100 focus:border-indigo-500 py-2 transition-colors bg-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                Descrição
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Aluguel"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                Data
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-700 text-sm font-medium"
              >
                <option>Outros</option>
                <option>Alimentação</option>
                <option>Transporte</option>
                <option>Lazer</option>
                <option>Contas Fixas</option>
                <option>Vendas</option>
                <option>Serviços</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                Pagamento
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-700 text-sm font-medium"
              >
                <option>Pix</option>
                <option>Dinheiro</option>
                <option>Cartão Crédito</option>
                <option>Cartão Débito</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all ${
              type === "INCOME"
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
            }`}
          >
            {loading ? (
              "Salvando..."
            ) : (
              <>
                <Check size={20} /> Confirmar{" "}
                {type === "INCOME" ? "Entrada" : "Saída"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
