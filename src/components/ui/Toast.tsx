"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Some depois de 3 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    // ALTERAÇÃO 1: Adicionado w-[90vw] (90% da tela no mobile) e max-w-md para limitar no desktop
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 fade-in duration-300 w-[90vw] max-w-md sm:w-auto">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
          type === "success"
            ? "bg-white border-emerald-100 text-emerald-700"
            : "bg-white border-rose-100 text-rose-700"
        }`}
      >
        {/* ALTERAÇÃO 2: shrink-0 impede que o ícone seja esmagado */}
        <div
          className={`p-1 rounded-full shrink-0 ${type === "success" ? "bg-emerald-100" : "bg-rose-100"}`}
        >
          {type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
        </div>
        
        {/* ALTERAÇÃO 3: flex-1 faz o texto ocupar todo espaço sobrando, evitando quebras desnecessárias */}
        <span className="text-sm font-bold flex-1 text-left">
          {message}
        </span>
        
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-slate-600 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}