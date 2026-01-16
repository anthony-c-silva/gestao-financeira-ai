"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  MoreHorizontal,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Briefcase,
  Wrench,
  Users,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const CATEGORIES_CONFIG = [
  { id: "ALL", label: "Todas", icon: Filter, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "Alimentação", label: "Alimentação", icon: Utensils, color: "text-orange-500", bg: "bg-orange-100" },
  { id: "Transporte", label: "Transporte", icon: Car, color: "text-blue-500", bg: "bg-blue-100" },
  { id: "Lazer", label: "Lazer", icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-100" },
  { id: "Contas Fixas", label: "Contas Fixas", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100" },
  { id: "Vendas", label: "Vendas", icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-100" },
  { id: "Serviços", label: "Serviços", icon: Wrench, color: "text-cyan-500", bg: "bg-cyan-100" },
  { id: "Salários", label: "Salários", icon: Users, color: "text-indigo-500", bg: "bg-indigo-100" },
  { id: "Outros", label: "Outros", icon: MoreHorizontal, color: "text-slate-500", bg: "bg-slate-100" },
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Transaction {
  _id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: string;
  category: string;
  paymentMethod: string;
  status: "PENDING" | "PAID";
  contactId?: {
    name: string;
  };
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  userName: string;
}

export function ExportModal({ isOpen, onClose, transactions, userName }: ExportModalProps) {
  const [period, setPeriod] = useState("THIS_MONTH");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const [activeCalendar, setActiveCalendar] = useState<"START" | "END" | null>(null);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const categoryRef = useRef<HTMLDivElement>(null);
  const calendarWrapperRef = useRef<HTMLDivElement>(null);

  // SCROLL LOCK
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      // Removido o fechamento automático do calendário ao clicar fora para evitar conflitos de UX no mobile
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const generateCalendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + offset, 1);
    setCalendarViewDate(newDate);
  };

  const handleSelectDate = (day: Date) => {
    const offset = day.getTimezoneOffset();
    const localDate = new Date(day.getTime() - offset * 60 * 1000);
    const dateStr = localDate.toISOString().split("T")[0];

    if (activeCalendar === "START") setCustomStart(dateStr);
    if (activeCalendar === "END") setCustomEnd(dateStr);
    
    setActiveCalendar(null);
  };

  const openCalendar = (type: "START" | "END") => {
    // Se clicar no mesmo que já está aberto, fecha
    if (activeCalendar === type) {
        setActiveCalendar(null);
        return;
    }

    const initialDate = type === "START" ? customStart : customEnd;
    if (initialDate) {
      setCalendarViewDate(new Date(initialDate + "T12:00:00"));
    } else {
      setCalendarViewDate(new Date());
    }
    setActiveCalendar(type);
  };

  const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return "Selecionar...";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  };

  const getFilteredData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      const tDateAdjusted = new Date(tDate.valueOf() + tDate.getTimezoneOffset() * 60000);

      if (category !== "ALL" && t.category !== category) return false;
      if (status !== "ALL" && t.status !== status) return false;

      if (period === "THIS_MONTH") return tDateAdjusted.getMonth() === currentMonth && tDateAdjusted.getFullYear() === currentYear;
      if (period === "LAST_MONTH") {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return tDateAdjusted.getMonth() === lastMonthDate.getMonth() && tDateAdjusted.getFullYear() === lastMonthDate.getFullYear();
      }
      if (period === "THIS_YEAR") return tDateAdjusted.getFullYear() === currentYear;
      if (period === "CUSTOM") {
        if (!customStart || !customEnd) return true; 
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return tDateAdjusted >= start && tDateAdjusted <= end;
      }
      return true; 
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const formatCurrency = (val: number) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleDateString("pt-BR");
  };

  const getPeriodLabel = () => {
    if (period === "CUSTOM" && customStart && customEnd) {
      return `De ${formatDateDisplay(customStart)} até ${formatDateDisplay(customEnd)}`;
    }
    const labels: Record<string, string> = {
      "THIS_MONTH": "Este Mês", "LAST_MONTH": "Mês Passado", "THIS_YEAR": "Este Ano", "ALL_TIME": "Todo o Histórico"
    };
    return labels[period] || "Período Selecionado";
  };

  const handleExportPDF = () => {
    if (period === "CUSTOM" && (!customStart || !customEnd)) { alert("Selecione as datas de início e fim."); return; }
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const filtered = getFilteredData();
      doc.setFillColor(79, 70, 229); doc.rect(0, 0, 210, 20, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.text("Relatório Financeiro", 14, 13);
      doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.text(`Empresa: ${userName}`, 14, 30);
      doc.text(`Período: ${getPeriodLabel()}`, 14, 35);
      
      const income = filtered.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount, 0);
      const expense = filtered.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount, 0);
      const balance = income - expense;
      doc.text(`Entradas: ${formatCurrency(income)} | Saídas: ${formatCurrency(expense)} | Resultado: ${formatCurrency(balance)}`, 14, 45);

      const tableData = filtered.map(t => [
        formatDate(t.date), t.description || t.category, t.category, t.type === "INCOME" ? "Entrada" : "Saída", formatCurrency(t.amount), t.status === "PAID" ? "Pago" : "Pendente", t.paymentMethod
      ]);
      autoTable(doc, { startY: 55, head: [["Data", "Descrição", "Categ.", "Tipo", "Valor", "Status", "Pgto"]], body: tableData, styles: { fontSize: 8 }, headStyles: { fillColor: [79, 70, 229] } });
      doc.save(`relatorio.pdf`); onClose();
    } catch (err) { alert("Erro ao gerar PDF"); } finally { setIsGenerating(false); }
  };

  const handleExportExcel = () => {
    if (period === "CUSTOM" && (!customStart || !customEnd)) { alert("Selecione as datas de início e fim."); return; }
    setIsGenerating(true);
    try {
      const filtered = getFilteredData();
      const excelData = filtered.map(t => ({ Data: formatDate(t.date), Descrição: t.description, Categoria: t.category, Valor: t.amount, Tipo: t.type }));
      const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "Extrato"); XLSX.writeFile(wb, `extrato.xlsx`); onClose();
    } catch (err) { alert("ErroExcel"); } finally { setIsGenerating(false); }
  };

  const currentCategoryObj = CATEGORIES_CONFIG.find(c => c.id === category) || CATEGORIES_CONFIG[0];
  const CurrentIcon = currentCategoryObj.icon;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center shrink-0">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Download size={18} className="text-indigo-600" /> Exportar Relatório
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={18} /></button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
          
          {/* 1. Período */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
               <Calendar size={12}/> Período
            </label>
            {period !== "CUSTOM" ? (
                <div className="grid grid-cols-2 gap-2">
                {[
                    {id: "THIS_MONTH", label: "Este Mês"}, {id: "LAST_MONTH", label: "Mês Passado"}, 
                    {id: "THIS_YEAR", label: "Este Ano"}, {id: "ALL_TIME", label: "Tudo"}
                ].map((p) => (
                    <button key={p.id} onClick={() => setPeriod(p.id)} className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${period === p.id ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        {p.label}
                    </button>
                ))}
                <button onClick={() => setPeriod("CUSTOM")} className="col-span-2 py-1.5 px-2 rounded-lg text-[11px] font-bold border border-slate-200 text-slate-600 border-dashed hover:text-indigo-600">
                    Selecionar Datas...
                </button>
                </div>
            ) : (
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100" ref={calendarWrapperRef}>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                           <Calendar size={12} /> Intervalo Personalizado
                        </span>
                        <button onClick={() => setPeriod("THIS_MONTH")} className="text-[10px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-medium"><ChevronLeft size={10} /> Voltar</button>
                    </div>
                    
                    {/* INPUTS DE DATA */}
                    <div className="grid grid-cols-2 gap-2 relative">
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 ml-1 block">Início</label>
                            <button 
                                onClick={() => openCalendar("START")}
                                className={`w-full p-2 bg-white border rounded-lg text-[11px] text-left font-medium flex items-center gap-2 outline-none transition-all ${activeCalendar === "START" ? "border-indigo-500 ring-2 ring-indigo-100 text-indigo-600" : "border-indigo-200 text-slate-700 hover:border-indigo-400"}`}
                            >
                                <Calendar size={12} className={activeCalendar === "START" ? "text-indigo-500" : "text-slate-400"} />
                                {formatDateDisplay(customStart)}
                            </button>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Fim</label>
                            <button 
                                onClick={() => openCalendar("END")}
                                className={`w-full p-2 bg-white border rounded-lg text-[11px] text-left font-medium flex items-center gap-2 outline-none transition-all ${activeCalendar === "END" ? "border-indigo-500 ring-2 ring-indigo-100 text-indigo-600" : "border-indigo-200 text-slate-700 hover:border-indigo-400"}`}
                            >
                                <Calendar size={12} className={activeCalendar === "END" ? "text-indigo-500" : "text-slate-400"} />
                                {formatDateDisplay(customEnd)}
                            </button>
                        </div>
                    </div>

                    {/* CALENDÁRIO INLINE (EMBUTIDO) */}
                    {/* SOLUÇÃO: Não é absolute, é relativo e empurra o conteúdo */}
                    {activeCalendar && (
                        <div className="mt-3 bg-white rounded-xl border border-indigo-100 p-3 animate-in slide-in-from-top-2 shadow-inner">
                            <div className="flex items-center justify-between mb-3">
                                <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={16} /></button>
                                <span className="text-xs font-bold text-slate-700 capitalize">{MONTHS[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}</span>
                                <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={16} /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (<span key={i} className="text-[9px] font-bold text-slate-400">{d}</span>))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {generateCalendarDays().map((day, idx) => {
                                    if (!day) return <div key={idx} />;
                                    const dayStr = day.toISOString().split("T")[0];
                                    const isSelected = dayStr === (activeCalendar === "START" ? customStart : customEnd);
                                    const isToday = dayStr === new Date().toISOString().split("T")[0];
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSelectDate(day)}
                                            className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                                isSelected ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : isToday ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            {day.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* 2. Categoria */}
          <div className="relative" ref={categoryRef}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <Filter size={12} /> Categoria
            </label>
            <button
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="w-full py-2 px-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between outline-none active:bg-slate-50 transition-colors text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`p-1 rounded-md ${currentCategoryObj.bg} ${currentCategoryObj.color}`}><CurrentIcon size={12} /></div>
                <span className="font-bold text-slate-700 truncate">{currentCategoryObj.label}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
            </button>

            {isCategoryOpen && (
              <div className="absolute bottom-full mb-1 left-0 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-40 overflow-y-auto z-[90] animate-in zoom-in-95 origin-bottom custom-scrollbar">
                {CATEGORIES_CONFIG.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => { setCategory(cat.id); setIsCategoryOpen(false); }} className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-[11px]">
                    <div className={`p-1 rounded-md ${cat.bg} ${cat.color}`}><cat.icon size={12} /></div>
                    <span className={`font-medium ${category === cat.id ? "text-indigo-600" : "text-slate-600"}`}>{cat.label}</span>
                    {category === cat.id && (<Check size={12} className="ml-auto text-indigo-600" />)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Status</label>
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
              {[{id:"ALL", l:"Todos"}, {id:"PAID", l:"Pagos"}, {id:"PENDING", l:"Pendentes"}].map((s) => (
                <button key={s.id} onClick={() => setStatus(s.id)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${status === s.id ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"}`}>
                  {s.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-50 bg-white shrink-0 grid grid-cols-2 gap-3">
            <button onClick={handleExportPDF} disabled={isGenerating} className="flex items-center justify-center gap-2 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-md shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 text-xs">
              <FileText size={16} /> PDF
            </button>
            <button onClick={handleExportExcel} disabled={isGenerating} className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 text-xs">
              <FileSpreadsheet size={16} /> Excel
            </button>
        </div>
      </div>
    </div>
  );
}