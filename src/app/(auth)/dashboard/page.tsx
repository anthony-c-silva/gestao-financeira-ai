"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
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
} from "lucide-react";
import { FaturamentoCard } from "@/components/dashboard/FaturamentoCard";
import { NewTransactionModal } from "@/components/dashboard/NewTransactionModal";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [currentTab, setCurrentTab] = useState<"HOME" | "FLOW" | "REPORTS">(
    "HOME"
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summaryData, setSummaryData] = useState(null);
  const [showValues, setShowValues] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cálculos Gerais
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

  // ABA 1: INÍCIO (Visão Geral + Saldo)
  const HomeView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Card de Saldo Moderno */}
      <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl shadow-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full -mr-10 -mt-10 blur-3xl"></div>

        <div className="flex justify-between items-start mb-2 relative z-10">
          <span className="text-slate-300 text-sm font-medium">
            Saldo atual
          </span>
          <button
            onClick={() => setShowValues(!showValues)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        {/* Valor do Saldo: Ajuste de quebra de linha */}
        <div className="text-3xl sm:text-4xl font-black mb-8 relative z-10 tracking-tight break-words">
          {formatMoney(balance)}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              <TrendingUp size={14} /> Entradas
            </div>
            {/* Valor menor em mobile para não quebrar */}
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

      {/* Monitoramento Fiscal (PJ) */}
      {user?.type === "PJ" && (
        <FaturamentoCard data={summaryData} loading={loading} />
      )}

      {/* Lista Recente */}
      <div>
        <h3 className="text-slate-800 font-bold text-lg mb-4 flex items-center gap-2">
          <Wallet size={18} className="text-indigo-600" />
          Recentes
        </h3>
        {transactions.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
            Nenhuma conta registrada.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div
                key={t._id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center"
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
                    {" "}
                    {/* min-w-0 é essencial para truncate funcionar em flex */}
                    <p className="font-bold text-slate-700 text-sm truncate">
                      {t.description || t.category}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {new Date(t.date).toLocaleDateString("pt-BR")} •{" "}
                      {t.paymentMethod}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold text-sm ml-2 whitespace-nowrap ${
                    t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}{" "}
                  {showValues
                    ? t.amount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })
                    : "•••"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ABA 2: FLUXO (Gráficos)
  const FlowView = () => {
    const chartData = transactions
      .slice(0, 7)
      .reverse()
      .map((t, index) => ({
        name: `Dia ${index + 1}`,
        valor: t.amount,
        tipo: t.type,
      }));

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
        <header>
          <h1 className="text-2xl font-bold text-slate-800">Fluxo de Caixa</h1>
          <p className="text-slate-500">Tendência financeira</p>
        </header>

        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis dataKey="name" hide />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="#4f46e5"
                fillOpacity={1}
                fill="url(#colorValor)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
          <h3 className="font-bold text-indigo-900 mb-2">Análise Rápida</h3>
          <p className="text-sm text-indigo-700 leading-relaxed">
            Seu saldo está{" "}
            <strong>{balance >= 0 ? "positivo" : "negativo"}</strong>.
            {balance < 0
              ? " Tente reduzir gastos não essenciais."
              : " Ótimo momento para investir no negócio."}
          </p>
        </div>
      </div>
    );
  };

  // ABA 3: RELATÓRIOS (DRE Simples)
  const ReportsView = () => {
    const lucroLiquido = income - expense;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
        <header>
          <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
          <p className="text-slate-500">DRE Simplificado</p>
        </header>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
              Resultado do Período
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm">
                (+) Total de Entradas
              </span>
              <span className="font-bold text-emerald-600 text-right">
                {formatMoney(income)}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-slate-600 text-sm">
                (-) Total de Saídas
              </span>
              <span className="font-bold text-rose-600 text-right">
                {formatMoney(expense)}
              </span>
            </div>

            <div
              className={`flex justify-between items-center p-4 rounded-2xl mt-2 ${
                lucroLiquido >= 0
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800"
              }`}
            >
              <span className="text-sm font-bold">Resultado</span>
              <span className="text-xl font-black text-right break-all">
                {formatMoney(lucroLiquido)}
              </span>
            </div>
          </div>
        </section>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* HEADER FIXO */}
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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        {currentTab === "HOME" && <HomeView />}
        {currentTab === "FLOW" && <FlowView />}
        {currentTab === "REPORTS" && <ReportsView />}
      </main>

      {/* BOTÃO FLUTUANTE */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl shadow-indigo-300 flex items-center gap-2 font-bold hover:bg-indigo-700 active:scale-95 transition-all transform hover:-translate-y-1"
        >
          <Plus size={20} />
          Registrar
        </button>
      </div>

      {/* BARRA INFERIOR */}
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
        onSuccess={() => {
          fetchTransactions(user._id);
          if (user.type === "PJ") fetchFiscalSummary(user._id);
        }}
      />
    </div>
  );
}
