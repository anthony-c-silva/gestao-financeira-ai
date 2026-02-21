"use client";

import React from "react";
import { X, Calendar, Layers, CheckCircle2, AlertTriangle } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface RecurrenceOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: "SINGLE" | "FUTURE" | "ALL") => void;
  type: "EDIT" | "DELETE";
}

export function RecurrenceOptionsModal({
  isOpen,
  onClose,
  onConfirm,
  type,
}: RecurrenceOptionsModalProps) {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={() => onClose()}
      title={type === "DELETE" ? "Excluir Recorrência" : "Editar Recorrência"}
      description="Escolha como deseja aplicar esta alteração na série de transações."
    >
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-full ${type === "DELETE" ? "bg-rose-100 text-rose-600" : "bg-brand-100 text-brand-900"}`}
          >
            {type === "DELETE" ? (
              <AlertTriangle size={24} />
            ) : (
              <Layers size={24} />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">
              {type === "DELETE" ? "Excluir transação" : "Editar transação"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Esta é uma transação repetida.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Opções */}
      <div className="space-y-3 mb-6">
        {/* Opção 1: Single */}
        <button
          onClick={() => onConfirm("SINGLE")}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-brand-900 hover:bg-brand-50 transition-all group text-left"
        >
          <div className="bg-slate-100 text-slate-500 group-hover:bg-brand-200 group-hover:text-brand-700 p-2 rounded-lg transition-colors">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="block text-sm font-bold text-slate-700 group-hover:text-brand-900">
              Somente esta
            </span>
            <span className="block text-xs text-slate-400 group-hover:text-brand-900">
              As outras parcelas não serão afetadas.
            </span>
          </div>
        </button>

        {/* Opção 2: Future */}
        <button
          onClick={() => onConfirm("FUTURE")}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-brand-900 hover:bg-brand-50 transition-all group text-left"
        >
          <div className="bg-slate-100 text-slate-500 group-hover:bg-brand-200 group-hover:text-brand-700 p-2 rounded-lg transition-colors">
            <Layers size={20} />
          </div>
          <div>
            <span className="block text-sm font-bold text-slate-700 group-hover:text-brand-900">
              Desta em diante
            </span>
            <span className="block text-xs text-slate-400 group-hover:text-brand-900">
              Altera esta e todas as próximas parcelas.
            </span>
          </div>
        </button>

        {/* Opção 3: All */}
        <button
          onClick={() => onConfirm("ALL")}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-brand-900 hover:bg-brand-50 transition-all group text-left"
        >
          <div className="bg-slate-100 text-slate-500 group-hover:bg-brand-200 group-hover:text-brand-700 p-2 rounded-lg transition-colors">
            <Calendar size={20} />
          </div>
          <div>
            <span className="block text-sm font-bold text-slate-700 group-hover:text-brand-900">
              Todas da série
            </span>
            <span className="block text-xs text-slate-400 group-hover:text-brand-900">
              Altera todas (passadas e futuras).
            </span>
          </div>
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
      >
        Cancelar
      </button>
    </ResponsiveModal>
  );
}
