"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  FileSpreadsheet,
  Calendar,
  Download,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { useAuthFetch } from "@/lib/authClient";

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
  currentDashboardDate: Date; // A Data selecionada no Dashboard
}

export function ExportModal({
  isOpen,
  onClose,
  transactions,
  userName,
  currentDashboardDate,
}: ExportModalProps) {
  const [scope, setScope] = useState<"MONTH" | "ALL">("MONTH");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authFetch = useAuthFetch();

  // Formata o nome do mês atual (ex: "Fevereiro de 2026")
  const monthLabel = currentDashboardDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const displayMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  // Reseta o scope para MONTH sempre que o modal abre ou a data muda
  useEffect(() => {
    if (isOpen) {
      setScope("MONTH");
      setError(null);
    }
  }, [isOpen, currentDashboardDate]);

  // Função para obter os dados do período escolhido.
  // No escopo "ALL" busca o histórico completo do servidor, já que o dashboard
  // só mantém em memória as transações do ano selecionado.
  const getFilteredData = async (): Promise<Transaction[]> => {
    if (scope === "ALL") {
      const res = await authFetch("/api/transactions?all=true");
      if (!res.ok) throw new Error("Falha ao buscar histórico completo");
      return res.json();
    }

    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      // Ajuste de fuso horário simples para garantir comparação correta
      const tDateAdjusted = new Date(
        tDate.valueOf() + tDate.getTimezoneOffset() * 60000,
      );

      return (
        tDateAdjusted.getMonth() === currentDashboardDate.getMonth() &&
        tDateAdjusted.getFullYear() === currentDashboardDate.getFullYear()
      );
    });
  };

  // --- FORMATAÇÃO MATEMÁTICA (PADRÃO DE CENTAVOS) ---
  const formatCurrency = (val: number) =>
    (val / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // --- LÓGICA DO PDF ---
  const handleExportPDF = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const doc = new jsPDF();
      const data = await getFilteredData();

      // Ordenar por data
      data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Cálculos de Totais (feitos em centavos)
      const income = data
        .filter((t) => t.type === "INCOME" && t.status === "PAID")
        .reduce((acc, t) => acc + t.amount, 0);
      const expense = data
        .filter((t) => t.type === "EXPENSE" && t.status === "PAID")
        .reduce((acc, t) => acc + t.amount, 0);
      const total = income - expense;

      // Cabeçalho
      doc.setFontSize(18);
      doc.text("Relatório Financeiro", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado por: ${userName}`, 14, 28);
      doc.text(
        `Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`,
        14,
        33,
      );
      doc.text(
        `Período: ${scope === "ALL" ? "Todo o Histórico" : displayMonth}`,
        14,
        38,
      );

      // Resumo Financeiro
      doc.setDrawColor(220);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 45, 180, 25, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Entradas (Realizado)", 20, 53);
      doc.text("Saídas (Realizado)", 80, 53);
      doc.text("Resultado", 140, 53);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");

      doc.setTextColor(22, 163, 74); // Verde
      doc.text(formatCurrency(income), 20, 62);

      doc.setTextColor(225, 29, 72); // Vermelho
      doc.text(formatCurrency(expense), 80, 62);

      doc.setTextColor(
        total >= 0 ? 22 : 225,
        total >= 0 ? 163 : 29,
        total >= 0 ? 74 : 72,
      );
      doc.text(formatCurrency(total), 140, 62);

      // Tabela
      const tableData = data.map((t) => [
        new Date(t.date).toLocaleDateString("pt-BR"),
        t.description,
        t.category,
        t.contactId?.name || "-",
        t.status === "PAID"
          ? t.type === "INCOME"
            ? "Recebido"
            : "Pago"
          : "Pendente",
        t.type === "INCOME"
          ? `+ ${formatCurrency(t.amount)}`
          : `- ${formatCurrency(t.amount)}`,
      ]);

      autoTable(doc, {
        startY: 80,
        head: [
          ["Data", "Descrição", "Categoria", "Contato", "Status", "Valor"],
        ],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 102] }, // Azul da marca (#000066)
        columnStyles: {
          5: { halign: "right", fontStyle: "bold" },
        },
        didParseCell: function (data) {
          // Pintar valores de vermelho ou verde
          if (data.section === "body" && data.column.index === 5) {
            const rawValue = data.cell.raw as string;
            if (rawValue.includes("-")) {
              data.cell.styles.textColor = [225, 29, 72]; // Vermelho
            } else {
              data.cell.styles.textColor = [22, 163, 74]; // Verde
            }
          }
        },
      });

      const fileName = `Relatorio_${scope === "ALL" ? "Geral" : displayMonth.replace(" ", "_")}.pdf`;
      doc.save(fileName);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- LÓGICA DO EXCEL ---
  const handleExportExcel = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const data = await getFilteredData();
      const formattedData = data.map((t) => ({
        Data: new Date(t.date).toLocaleDateString("pt-BR"),
        Descrição: t.description,
        Categoria: t.category,
        Contato: t.contactId?.name || "",
        Tipo: t.type === "INCOME" ? "Entrada" : "Saída",
        Status: t.status === "PAID" ? "Concluído" : "Pendente",
        // Importante: Valor numérico (dividido por 100) para o Excel somar corretamente
        Valor: t.type === "EXPENSE" ? -(t.amount / 100) : t.amount / 100,
        Pagamento: t.paymentMethod,
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transações");

      const fileName = `Extrato_${scope === "ALL" ? "Geral" : displayMonth.replace(" ", "_")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Erro ao gerar Excel. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={() => onClose()}
      title="Exportar Dados"
      description="Escolha o formato e o período"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Download size={20} className="text-brand-900" /> Exportar Dados
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Período
        </p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setScope("MONTH")}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              scope === "MONTH"
                ? "border-brand-900 bg-brand-50 text-brand-700"
                : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar size={20} />
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm">Apenas {displayMonth}</span>
                <span className="text-[10px] opacity-70">
                  O que você está vendo no painel
                </span>
              </div>
            </div>
            {scope === "MONTH" && <CheckCircle2 size={18} />}
          </button>

          <button
            onClick={() => setScope("ALL")}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              scope === "ALL"
                ? "border-brand-900 bg-brand-50 text-brand-700"
                : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} />
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm">Todo o Histórico</span>
                <span className="text-[10px] opacity-70">
                  Todas as transações já registradas
                </span>
              </div>
            </div>
            {scope === "ALL" && <CheckCircle2 size={18} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 transition-all font-bold text-sm"
        >
          <FileText size={24} />
          Gerar PDF
        </button>

        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition-all font-bold text-sm"
        >
          <FileSpreadsheet size={24} />
          Gerar Excel
        </button>
      </div>
    </ResponsiveModal>
  );
}
