"use client";

import React from "react";
import { X, Calendar, Layers, CheckCircle2, AlertTriangle } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
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
              <h3 className="text-lg font-bold text-slate-800">
                Transação Recorrente
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Como você deseja aplicar essa alteração?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:bg-slate-50 hover:text-slate-500 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Opção 1: Apenas Esta */}
          <button
            onClick={() => onConfirm("SINGLE")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-brand-900 hover:bg-brand-50 transition-all group text-left"
          >
            <div className="bg-slate-100 text-slate-500 group-hover:bg-brand-200 group-hover:text-brand-700 p-2 rounded-lg transition-colors">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-700 group-hover:text-brand-900">
                Apenas esta
              </span>
              <span className="block text-xs text-slate-400 group-hover:text-brand-900">
                Altera somente o item selecionado.
              </span>
            </div>
          </button>

          {/* Opção 2: Desta em diante */}
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

          {/* Opção 3: Todas */}
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
          className="w-full mt-6 py-3 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
