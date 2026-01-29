"use client";

import React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface MonthSelectorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthSelector({ currentDate, onDateChange }: MonthSelectorProps) {
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  // Formata: "Janeiro 2026"
  const formattedDate = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Capitaliza a primeira letra (janeiro -> Janeiro)
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6">
      <button 
        onClick={handlePrevMonth}
        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base">
        <CalendarDays size={18} className="text-indigo-500" />
        <span>{displayDate}</span>
      </div>

      <button 
        onClick={handleNextMonth}
        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}