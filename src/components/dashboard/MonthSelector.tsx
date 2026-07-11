"use client";

import React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface MonthSelectorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  /** "month" (padrão) navega mês a mês; "year" navega ano a ano. */
  granularity?: "month" | "year";
}

export function MonthSelector({
  currentDate,
  onDateChange,
  granularity = "month",
}: MonthSelectorProps) {
  const step = granularity === "year" ? "year" : "month";

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (step === "year") newDate.setFullYear(newDate.getFullYear() - 1);
    else newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (step === "year") newDate.setFullYear(newDate.getFullYear() + 1);
    else newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  // Formata: "Janeiro 2026" ou, em modo ano, apenas "2026"
  const formattedDate =
    step === "year"
      ? String(currentDate.getFullYear())
      : currentDate.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        });

  // Capitaliza a primeira letra (janeiro -> Janeiro)
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6">
      <button
        onClick={handlePrev}
        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-brand-900 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base">
        <CalendarDays size={18} className="text-brand-900" />
        <span>{displayDate}</span>
      </div>

      <button
        onClick={handleNext}
        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-brand-900 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}