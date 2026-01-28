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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
          type === "success"
            ? "bg-white border-emerald-100 text-emerald-700"
            : "bg-white border-rose-100 text-rose-700"
        }`}
      >
        <div
          className={`p-1 rounded-full ${type === "success" ? "bg-emerald-100" : "bg-rose-100"}`}
        >
          {type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
        </div>
        <span className="text-sm font-bold">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
