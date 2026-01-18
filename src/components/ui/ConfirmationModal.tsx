"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting?: boolean; // Para mostrar loading se necessário
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    // CORREÇÃO: Alterado z-[70] para z-[100] para garantir que fique acima do SettingsModal (que é z-80)
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center relative">
        
        {/* Botão Fechar X no topo */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Ícone de Alerta */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-rose-100 text-rose-600 shadow-sm shadow-rose-100">
          <Trash2 size={32} strokeWidth={2} />
        </div>

        {/* Textos */}
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          {message}
        </p>

        {/* Botões de Ação */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            disabled={isDeleting}
          >
            Cancelar
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-[1.5] py-3.5 rounded-2xl bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Apagando..." : "Sim, Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}