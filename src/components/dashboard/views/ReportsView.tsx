"use client";

import React, { useMemo } from "react";
import { Download, CalendarClock } from "lucide-react";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { DreReport } from "@/components/dashboard/DreReport";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DEFAULT_COLORS = [
  "#1ba879",
  "#000066",
  "#42cc9f",
  "#30306a",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
];

// Tipagens rígidas corrigidas
export interface TransactionItem {
  _id: string;
  contactId?: { name: string };
  description?: string;
  category: string;
  totalInstallments?: number;
  installment?: number;
  date: string; // CORREÇÃO: Removido o '| Date', pois via JSON (API) a data sempre chega como string
  type: "INCOME" | "EXPENSE";
  status: "PAID" | "PENDING";
  amount: number;
}

export interface CategoryItem {
  name: string;
  color?: string;
}

interface ReportsViewProps {
  transactions: TransactionItem[];
  categories: CategoryItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  balance: number;
  isMobile: boolean;
  onExportClick: () => void;
  formatMoney: (val: number) => string;
}

export function ReportsView({
  transactions,
  categories,
  selectedDate,
  onDateChange,
  balance,
  isMobile,
  onExportClick,
  formatMoney,
}: ReportsViewProps) {
  const getDisplayTitle = (t: TransactionItem) => {
    const base = t.contactId?.name || t.description || t.category;
    const suf =
      t.totalInstallments != null &&
      t.installment != null &&
      t.totalInstallments > 1
        ? ` (${t.installment}/${t.totalInstallments})`
        : "";
    return base + suf;
  };

  const today = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const {
    barChartData,
    pieChartData,
    futureTransactions,
    futureIncome,
    futureExpense,
    projectedBalance,
  } = useMemo(() => {
    const dailyMap = new Map<
      string,
      { date: string; Entradas: number; Saidas: number }
    >();
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    sortedTransactions.forEach((t) => {
      const dateObj = new Date(t.date);
      if (
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
      ) {
        const dateKey = dateObj.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        if (!dailyMap.has(dateKey))
          dailyMap.set(dateKey, { date: dateKey, Entradas: 0, Saidas: 0 });
        const entry = dailyMap.get(dateKey)!;
        if (t.type === "INCOME" && t.status === "PAID")
          entry.Entradas += t.amount;
        if (t.type === "EXPENSE" && t.status === "PAID")
          entry.Saidas += t.amount;
      }
    });

    const categoryMap: Record<string, number> = {};
    const monthTrans = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });

    monthTrans.forEach((t) => {
      if (t.type === "EXPENSE" && t.status === "PAID") {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      }
    });

    const pData = Object.keys(categoryMap)
      .map((key) => {
        const catObj = categories.find((c) => c.name === key);
        return {
          name: key,
          value: categoryMap[key],
          color: catObj?.color || null,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const fTrans = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        const tDateAdjusted = new Date(
          tDate.valueOf() + tDate.getTimezoneOffset() * 60000,
        );
        return (
          t.status === "PENDING" &&
          tDateAdjusted.getMonth() === today.getMonth() &&
          tDateAdjusted.getFullYear() === today.getFullYear()
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const fIncome = fTrans
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0);
    const fExpense = fTrans
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      barChartData: Array.from(dailyMap.values()).slice(-15),
      pieChartData: pData,
      futureTransactions: fTrans,
      futureIncome: fIncome,
      futureExpense: fExpense,
      projectedBalance: balance + fIncome - fExpense,
    };
  }, [transactions, balance, categories, today]);

  const renderCustomLabel = (props: unknown) => {
    const payload = props as {
      name?: string;
      percent?: number;
      value?: number;
    };
    const percent = payload.percent || 0;
    const name = payload.name || "";
    const value = payload.value || 0;

    return percent > 0.03 ? `${name} ${formatMoney(value)}` : "";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
          <p className="text-slate-500">Visão estratégica do negócio</p>
        </div>
        <button
          onClick={onExportClick}
          className="p-3 bg-brand-100 text-brand-700 rounded-xl hover:bg-brand-200 transition-colors shadow-sm flex items-center gap-2 font-bold text-xs"
        >
          <Download size={18} /> Exportar
        </button>
      </header>

      <MonthSelector currentDate={selectedDate} onDateChange={onDateChange} />

      <DreReport transactions={transactions} month={today} />

      <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
          Fluxo de Caixa (Realizado)
        </h2>
        <div className="h-56 w-full">
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "12px", border: "none" }}
                  formatter={(val: number) => [
                    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                  ]}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Bar
                  dataKey="Entradas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
                <Bar
                  dataKey="Saidas"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Sem dados suficientes para o gráfico.
            </div>
          )}
        </div>
      </section>

      <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider w-full mb-2">
          Despesas por Categoria
        </h2>
        <div className="h-64 w-full">
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={isMobile ? undefined : renderCustomLabel}
                  labelLine={!isMobile}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.color ||
                        DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none" }}
                  formatter={(val: number) => [
                    `R$ ${val.toLocaleString("pt-BR")}`,
                  ]}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  layout="horizontal"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Nenhuma despesa registrada.
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-800 rounded-3xl shadow-lg overflow-hidden text-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-900/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="p-6 border-b border-white/10">
          <h2 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <CalendarClock size={18} className="text-brand-400" /> Previsão de
            Lançamentos
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Próximas entradas e saídas agendadas
          </p>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4 border-b border-white/10">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">
              A Receber
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {formatMoney(futureIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">
              A Pagar
            </p>
            <p className="text-xl font-bold text-rose-400">
              {formatMoney(futureExpense)}
            </p>
          </div>
        </div>
        <div className="bg-white/5 p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-300">Saldo Projetado:</span>
            <span
              className={`font-bold ${projectedBalance >= 0 ? "text-white" : "text-red-400"}`}
            >
              {formatMoney(projectedBalance)}
            </span>
          </div>
        </div>
        <div className="bg-white text-slate-800 p-4 max-h-60 overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase">
            Próximos Itens
          </h3>
          {futureTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Nada agendado.
            </p>
          ) : (
            <div className="space-y-2">
              {futureTransactions.slice(0, 5).map((t) => (
                <div
                  key={t._id}
                  className="flex justify-between items-center text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 truncate max-w-[150px]">
                      {getDisplayTitle(t)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(t.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <span
                    className={`font-bold ${t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatMoney(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
