"use client";

import React from "react";
import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";

export type FeedbackType = "success" | "error" | "warning" | "info";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: FeedbackType;
  title: string;
  message: string;
}

export function FeedbackModal({
  isOpen,
  onClose,
  type,
  title,
  message,
}: FeedbackModalProps) {
  if (!isOpen) return null;

  // Configuração visual baseada no tipo de mensagem
  const styles = {
    success: {
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
      Icon: CheckCircle2,
    },
    error: {
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      button: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
      Icon: XCircle,
    },
    warning: {
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      button: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
      Icon: AlertCircle,
    },
    info: {
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
      Icon: Info,
    },
  };

  const currentStyle = styles[type];
  const Icon = currentStyle.Icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        {/* Ícone Animado */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${currentStyle.iconBg} ${currentStyle.iconColor} shadow-sm`}
        >
          <Icon size={32} strokeWidth={2.5} />
        </div>

        {/* Textos */}
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed whitespace-pre-line">
          {message}
        </p>

        {/* Botão de Ação */}
        <button
          onClick={onClose}
          className={`w-full py-3.5 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${currentStyle.button}`}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
