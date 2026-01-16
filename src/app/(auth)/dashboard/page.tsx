"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Plus,
  Home,
  BarChart3,
  PieChart,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarClock,
  ArrowRight,
  Filter
} from "lucide-react";
import { FaturamentoCard } from "@/components/dashboard/FaturamentoCard";
import { NewTransactionModal } from "@/components/dashboard/NewTransactionModal";
import { FinanceiroView } from "@/components/dashboard/FinanceiroView";
import {
  VoiceInput,
  AiTransactionData,
} from "@/components/dashboard/VoiceInput";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UserData {
  _id: string;
  name: string;
  type?: "PF" | "PJ";
  businessSize?: string;
}

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
    type: "CLIENT" | "SUPPLIER";
  };
  createdAt?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [currentTab, setCurrentTab] = useState<"HOME" | "FLOW" | "REPORTS">(
    "HOME"
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summaryData, setSummaryData] = useState(null);
  const [showValues, setShowValues] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filtro Rápido da Home (Novo)
  const [homeFilter, setHomeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  const [aiData, setAiData] = useState<AiTransactionData | null>(null);
  const [isInputMode, setIsInputMode] = useState(false);

  // Cálculos Gerais (Baseado apenas em PAGOS para saldo real)
  const income = transactions
    .filter((t) => t.type === "INCOME" && t.status === "PAID")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "EXPENSE" && t.status === "PAID")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expense;

  const fetchTransactions = async (userId: string) => {
    try {
      const res = await fetch(`/api/transactions?userId=${userId}`);
      if (res.ok) setTransactions(await res.json());
    } catch (error) {
      console.error("Erro ao buscar transações");
    }
  };

  const fetchFiscalSummary = async (userId: string) => {
    try {
      const res = await fetch("/api/dashboard/summary", {
        headers: { "x-user-id": userId },
      });
      if (res.ok) setSummaryData(await res.json());
    } catch (error) {
      console.error("Erro fiscal");
    }
  };

  const handleAiSuccess = (data: AiTransactionData) => {
    setAiData(data);
    setIsModalOpen(true);
  };

  const handleOpenModalManual = () => {
    setAiData(null);
    setIsModalOpen(true);
  };

  const handleMarkAsPaid = async (transaction: Transaction) => {
    try {
      const res = await fetch(`/api/transactions/${transaction._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });

      if (res.ok && user) {
        fetchTransactions(user._id);
        if (user.type === "PJ" && transaction.type === "INCOME") {
          fetchFiscalSummary(user._id);
        }
      }
    } catch (error) {
      alert("Erro ao atualizar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este item?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (res.ok && user) {
        fetchTransactions(user._id);
        if (user.type === "PJ") fetchFiscalSummary(user._id);
      }
    } catch (error) {
      alert("Erro ao deletar");
    }
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (parsedUser._id) {
            await Promise.all([
              fetchTransactions(parsedUser._id),
              parsedUser.type === "PJ"
                ? fetchFiscalSummary(parsedUser._id)
                : null,
            ]);
          }
        } catch (e) {
          localStorage.removeItem("user");
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    };
    checkAuthAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const formatMoney = (value: number) => {
    if (!showValues) return "••••••";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // 1. ABA INÍCIO
  const HomeView = () => {
    const recentActivities = [...transactions]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA;
      })
      .filter((t) => {
        if (homeFilter === 'ALL') return true;
        return t.type === homeFilter;
      })
      .slice(0, 5); // ALTERADO: Agora mostra as 5 últimas

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl shadow-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full -mr-10 -mt-10 blur-3xl"></div>

          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-slate-300 text-sm font-medium">
              Saldo atual (Disponível)
            </span>
            <button
              onClick={() => setShowValues(!showValues)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {showValues ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="text-3xl sm:text-4xl font-black mb-8 relative z-10 tracking-tight break-words">
            {formatMoney(balance)}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-1.5 mb-1 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp size={14} /> Entradas
              </div>
              <span className="text-sm sm:text-lg font-bold break-words block">
                {formatMoney(income)}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-1.5 mb-1 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                <TrendingDown size={14} /> Saídas
              </div>
              <span className="text-sm sm:text-lg font-bold break-words block">
                {formatMoney(expense)}
              </span>
            </div>
          </div>
        </div>

        {user?.type === "PJ" && (
          <FaturamentoCard data={summaryData} loading={loading} />
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
              <Wallet size={18} className="text-indigo-600" />
              Últimas Atividades
            </h3>
          </div>

          {/* FILTRO RÁPIDO DE ENTRADA/SAÍDA */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setHomeFilter('ALL')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                homeFilter === 'ALL'
                  ? "bg-slate-800 text-white border-slate-800 shadow-md"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setHomeFilter('INCOME')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${
                homeFilter === 'INCOME'
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:text-emerald-600"
              }`}
            >
              <TrendingUp size={12} />
              Entradas
            </button>
            <button
              onClick={() => setHomeFilter('EXPENSE')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${
                homeFilter === 'EXPENSE'
                  ? "bg-rose-100 text-rose-700 border-rose-200 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:text-rose-600"
              }`}
            >
              <TrendingDown size={12} />
              Saídas
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
              Nenhuma movimentação encontrada neste filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((t) => (
                <div
                  key={t._id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center animate-in slide-in-from-bottom-2"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        t.type === "INCOME"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {t.type === "INCOME" ? (
                        <TrendingUp size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 text-sm truncate max-w-[150px]">
                        {t.contactId?.name || t.description || t.category}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(t.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatMoney(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. ABA RELATÓRIOS (Atualizada para incluir Previsão Futura)
  const ReportsView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- DADOS PARA O GRÁFICO (REALIZADO) ---
    const dailyMap = new Map<
      string,
      { date: string; Entradas: number; Saidas: number }
    >();

    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedTransactions.forEach((t) => {
      const dateObj = new Date(t.date);
      // Inclui no gráfico apenas o mês atual ou histórico
      if(dateObj <= new Date(today.getFullYear(), today.getMonth() + 1, 0)) {
        const dateKey = dateObj.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });

        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { date: dateKey, Entradas: 0, Saidas: 0 });
        }

        const entry = dailyMap.get(dateKey)!;
        if (t.type === "INCOME" && t.status === "PAID") entry.Entradas += t.amount;
        if (t.type === "EXPENSE" && t.status === "PAID") entry.Saidas += t.amount;
      }
    });

    const chartData = Array.from(dailyMap.values()).slice(-15); // Últimos 15 dias com movimento

    // --- CÁLCULO DE LANÇAMENTOS FUTUROS ---
    const futureTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      // Ajuste de fuso horário simples
      const tDateAdjusted = new Date(tDate.valueOf() + tDate.getTimezoneOffset() * 60000);
      return t.status === "PENDING" && tDateAdjusted >= today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const futureIncome = futureTransactions
      .filter(t => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0);
    
    const futureExpense = futureTransactions
      .filter(t => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0);

    const projectedBalance = balance + futureIncome - futureExpense;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
        <header>
          <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
          <p className="text-slate-500">Visão do passado e do futuro</p>
        </header>

        {/* 1. GRÁFICO DE REALIZADO (Fluxo Diário) */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Fluxo de Caixa (Realizado)
            </h2>
          </div>
          <div className="h-56 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(val) => `R$${val}`} />
                  {/* CORREÇÃO DO ERRO DE BUILD AQUI: Tipagem number | undefined */}
                  <Tooltip 
                    cursor={{ fill: "#f8fafc" }} 
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} 
                    formatter={(val: number | undefined) => [`R$ ${(val || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="Saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Sem dados suficientes para o gráfico.
              </div>
            )}
          </div>
        </section>

        {/* 2. TABELA DE PREVISÃO FUTURA */}
        <section className="bg-slate-800 rounded-3xl shadow-lg overflow-hidden text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="p-6 border-b border-white/10">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <CalendarClock size={18} className="text-indigo-400"/>
              Previsão de Lançamentos
            </h2>
            <p className="text-slate-400 text-xs mt-1">Próximas entradas e saídas agendadas</p>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4 border-b border-white/10">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">A Receber</p>
              <p className="text-xl font-bold text-emerald-400">{formatMoney(futureIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">A Pagar</p>
              <p className="text-xl font-bold text-rose-400">{formatMoney(futureExpense)}</p>
            </div>
          </div>

          <div className="bg-white/5 p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">Saldo Projetado:</span>
              <span className={`font-bold ${projectedBalance >= 0 ? "text-white" : "text-red-400"}`}>
                {formatMoney(projectedBalance)}
              </span>
            </div>
          </div>

          {/* Lista Compacta de Futuros */}
          <div className="bg-white text-slate-800 p-4 max-h-60 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase">Próximos Itens</h3>
            {futureTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Nada agendado.</p>
            ) : (
              <div className="space-y-2">
                {futureTransactions.slice(0, 5).map(t => (
                  <div key={t._id} className="flex justify-between items-center text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 truncate max-w-[150px]">
                        {t.description || t.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(t.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <span className={`font-bold ${t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                      {t.type === "INCOME" ? "+" : "-"}{formatMoney(t.amount)}
                    </span>
                  </div>
                ))}
                {futureTransactions.length > 5 && (
                  <button onClick={() => setCurrentTab("FLOW")} className="w-full text-center text-xs text-indigo-600 font-bold pt-2 flex items-center justify-center gap-1">
                    Ver todos <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Olá, {user.type === "PJ" ? "Empresa" : "Usuário"}
            </p>
            <p className="font-bold text-slate-800 text-sm leading-none truncate">
              {user.name}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("user");
            router.push("/login");
          }}
          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        {currentTab === "HOME" && <HomeView />}

        {currentTab === "FLOW" && (
          <FinanceiroView
            transactions={transactions}
            onMarkAsPaid={handleMarkAsPaid}
            onDelete={handleDelete}
          />
        )}

        {currentTab === "REPORTS" && <ReportsView />}
      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 w-full justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <VoiceInput
            onSuccess={handleAiSuccess}
            onModeChange={(isActive) => setIsInputMode(isActive)}
          />

          {!isInputMode && (
            <button
              onClick={handleOpenModalManual}
              className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl shadow-indigo-300 flex items-center gap-2 font-bold hover:bg-indigo-700 active:scale-95 transition-all transform hover:-translate-y-1 h-[56px] animate-in fade-in zoom-in"
            >
              <Plus size={20} />
              Registrar
            </button>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 z-20 pb-safe">
        <div className="flex justify-around items-center max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentTab("HOME")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentTab === "HOME"
                ? "text-indigo-600"
                : "text-slate-300 hover:text-slate-500"
            }`}
          >
            <Home size={24} strokeWidth={currentTab === "HOME" ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Início</span>
          </button>

          <button
            onClick={() => setCurrentTab("FLOW")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentTab === "FLOW"
                ? "text-indigo-600"
                : "text-slate-300 hover:text-slate-500"
            }`}
          >
            <BarChart3
              size={24}
              strokeWidth={currentTab === "FLOW" ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold">Fluxo</span>
          </button>

          <button
            onClick={() => setCurrentTab("REPORTS")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentTab === "REPORTS"
                ? "text-indigo-600"
                : "text-slate-300 hover:text-slate-500"
            }`}
          >
            <PieChart
              size={24}
              strokeWidth={currentTab === "REPORTS" ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold">Relatórios</span>
          </button>
        </div>
      </nav>

      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={user._id}
        initialData={aiData}
        onSuccess={() => {
          fetchTransactions(user._id);
          if (user.type === "PJ") fetchFiscalSummary(user._id);
        }}
      />
    </div>
  );
}