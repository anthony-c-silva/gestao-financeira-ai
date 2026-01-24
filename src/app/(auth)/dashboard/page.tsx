"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Plus,
  Home,
  BarChart3,
  PieChart as PieIcon,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarClock,
  ArrowRight,
  Download,
  Settings,
  ChevronDown,
  User as UserIcon,
  Users,
  Keyboard,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { FaturamentoCard } from "@/components/dashboard/FaturamentoCard";
import {
  NewTransactionModal,
  TransactionData,
} from "@/components/dashboard/NewTransactionModal";
import { FinanceiroView } from "@/components/dashboard/FinanceiroView";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ExportModal } from "@/components/dashboard/ExportModal";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import {
  VoiceInput,
  AiTransactionData,
} from "@/components/dashboard/VoiceInput";
import { ContactsView } from "@/components/dashboard/ContactsView";
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

// CORES PADRÃO (Fallback caso a categoria não tenha cor ou não seja encontrada)
const DEFAULT_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

// MAPA DE CORES: Traduz classes Tailwind (Salvas no Banco) para HEX (Usado no Gráfico)
const getColorFromClass = (className: string | undefined) => {
  if (!className) return "#94a3b8"; // Slate padrão
  if (className.includes("orange")) return "#f97316";
  if (className.includes("blue")) return "#3b82f6";
  if (className.includes("red")) return "#ef4444";
  if (className.includes("purple")) return "#a855f7";
  if (className.includes("yellow")) return "#eab308";
  if (className.includes("emerald")) return "#10b981";
  if (className.includes("cyan")) return "#06b6d4";
  if (className.includes("indigo")) return "#6366f1";
  if (className.includes("pink")) return "#ec4899";
  if (className.includes("slate")) return "#64748b";
  if (className.includes("gray")) return "#6b7280";
  return "#cbd5e1";
};

interface UserData {
  _id: string;
  name: string;
  companyName?: string;
  type?: "PF" | "PJ";
  businessSize?: string;
  email: string;
  phone: string;
}

interface Category {
  _id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string; // Ex: "text-red-500"
  bg: string;
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
    _id: string;
    name: string;
    type: "CLIENT" | "SUPPLIER";
  };
  createdAt?: string;
  installment?: number;
  totalInstallments?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [currentTab, setCurrentTab] = useState<
    "HOME" | "FLOW" | "REPORTS" | "CONTACTS"
  >("HOME");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summaryData, setSummaryData] = useState(null);
  const [showValues, setShowValues] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de Modais
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);

  // Estado do Dropdown de Perfil
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [homeFilter, setHomeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">(
    "ALL",
  );
  const [modalInitialData, setModalInitialData] =
    useState<TransactionData | null>(null);

  const [isInputMode, setIsInputMode] = useState(false);

  // Estados MODO TEXTO (Escrever IA)
  const [isTextMode, setIsTextMode] = useState(false);
  const [aiText, setAiText] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);

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

  // CORREÇÃO AQUI: Removemos "&type=EXPENSE" para buscar TODAS as categorias
  const fetchCategories = async (userId: string) => {
    try {
      // Agora trazemos receitas E despesas. Assim o gráfico acha a cor de "Salários" e "Serviços"
      const res = await fetch(`/api/categories?userId=${userId}`);
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error("Erro ao buscar categorias");
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleUpdateUser = (updatedUser: UserData) => {
    const newUserState = { ...user, ...updatedUser };
    setUser(newUserState);
    localStorage.setItem("user", JSON.stringify(newUserState));
    setIsSettingsModalOpen(false);

    if (updatedUser.businessSize && user?.type === "PJ") {
      fetchFiscalSummary(updatedUser._id);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/${user._id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Sua conta foi excluída. Esperamos vê-lo novamente!");
        handleLogout();
      } else {
        alert("Erro ao excluir conta.");
      }
    } catch (error) {
      alert("Erro ao conectar com servidor.");
    }
  };

  const handleAiSuccess = (data: AiTransactionData) => {
    setModalInitialData(data);
    setIsModalOpen(true);
  };

  const handleTextAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText.trim() || !user) return;

    setIsAiProcessing(true);
    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiText,
          userId: user._id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        handleAiSuccess(data);
        setIsTextMode(false);
        setAiText("");
      } else {
        alert("Não entendi. Tente reescrever com mais detalhes.");
      }
    } catch (error) {
      alert("Erro de conexão com a IA.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleOpenModalManual = () => {
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (t: Transaction) => {
    setModalInitialData(t);
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

  const handleDeleteRequest = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId || !user) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTransactions(user._id);
        if (user.type === "PJ") fetchFiscalSummary(user._id);
        setDeleteId(null);
      } else {
        alert("Erro ao deletar");
      }
    } catch (error) {
      alert("Erro ao deletar");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (parsedUser._id) {
            // Busca Transações E Categorias (para o gráfico)
            await Promise.all([
              fetchTransactions(parsedUser._id),
              fetchCategories(parsedUser._id),
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
  }, [router]);

  const formatMoney = (value: number) => {
    if (!showValues) return "••••••";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(" ")[0];
  };

  const getDisplayTitle = (t: Transaction) => {
    const base = t.contactId?.name || t.description || t.category;
    const suf =
      t.totalInstallments != null &&
      t.installment != null &&
      t.totalInstallments > 1
        ? ` (${t.installment}/${t.totalInstallments})`
        : "";
    return base + suf;
  };

  // --- HOME VIEW ---
  const HomeView = () => {
    const recentActivities = [...transactions]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA;
      })
      .filter((t) => (homeFilter === "ALL" ? true : t.type === homeFilter))
      .slice(0, 5);

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
              <Wallet size={18} className="text-indigo-600" /> Últimas
              Atividades
            </h3>
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setHomeFilter("ALL")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${homeFilter === "ALL" ? "bg-slate-800 text-white border-slate-800 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setHomeFilter("INCOME")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${homeFilter === "INCOME" ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:text-emerald-600"}`}
            >
              <TrendingUp size={12} /> Entradas
            </button>
            <button
              onClick={() => setHomeFilter("EXPENSE")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${homeFilter === "EXPENSE" ? "bg-rose-100 text-rose-700 border-rose-200 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:text-rose-600"}`}
            >
              <TrendingDown size={12} /> Saídas
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === "INCOME" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}
                    >
                      {t.type === "INCOME" ? (
                        <TrendingUp size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 text-sm truncate max-w-[150px]">
                        {getDisplayTitle(t)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(t.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-sm ${t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}
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

  // --- REPORTS VIEW ---
  const ReportsView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyMap = new Map<
      string,
      { date: string; Entradas: number; Saidas: number }
    >();
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    sortedTransactions.forEach((t) => {
      const dateObj = new Date(t.date);
      if (dateObj <= new Date(today.getFullYear(), today.getMonth() + 1, 0)) {
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
    const barChartData = Array.from(dailyMap.values()).slice(-15);

    // LÓGICA DE DADOS PARA PIZZA (COM CORES REAIS)
    const categoryMap: { [key: string]: number } = {};
    transactions.forEach((t) => {
      if (t.type === "EXPENSE" && t.status === "PAID") {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      }
    });

    const pieChartData = Object.keys(categoryMap)
      .map((key) => {
        // Tenta encontrar a categoria na lista carregada para pegar a cor
        // Como agora carregamos TODAS as categorias, ele vai achar "Salários" e "Serviços"
        const catObj = categories.find((c) => c.name === key);
        // Traduz a classe Tailwind (ex: text-red-500) para Hex
        const colorHex = getColorFromClass(catObj?.color);

        return {
          name: key,
          value: categoryMap[key],
          color: colorHex,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const futureTransactions = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        const tDateAdjusted = new Date(
          tDate.valueOf() + tDate.getTimezoneOffset() * 60000,
        );
        return t.status === "PENDING" && tDateAdjusted >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const futureIncome = futureTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0);
    const futureExpense = futureTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0);
    const projectedBalance = balance + futureIncome - futureExpense;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
            <p className="text-slate-500">Visão estratégica do negócio</p>
          </div>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="p-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors shadow-sm flex items-center gap-2 font-bold text-xs"
          >
            <Download size={18} /> Exportar
          </button>
        </header>

        <DreReport transactions={transactions} month={today} />

        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Fluxo de Caixa (Realizado)
            </h2>
          </div>
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
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(val: number | undefined) => [
                      `R$ ${(val || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
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
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.color ||
                          DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(val: number | undefined) => [
                      `R$ ${(val || 0).toLocaleString("pt-BR")}`,
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="p-6 border-b border-white/10">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <CalendarClock size={18} className="text-indigo-400" /> Previsão
              de Lançamentos
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
                {futureTransactions.length > 5 && (
                  <button
                    onClick={() => setCurrentTab("FLOW")}
                    className="w-full text-center text-xs text-indigo-600 font-bold pt-2 flex items-center justify-center gap-1"
                  >
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
      {/* HEADER */}
      <header className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 group outline-none"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:bg-indigo-700 transition-colors">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                  <Settings size={10} className="text-slate-600" />
                </div>
              </div>

              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {user.type === "PJ"
                    ? user.companyName || "Gestão Empresarial"
                    : "Finanças Pessoais"}
                </p>
                <div className="flex items-center gap-1">
                  <p className="font-bold text-slate-800 text-sm leading-none truncate max-w-[120px]">
                    Olá, {getFirstName(user.name)}
                  </p>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
              </div>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-50 mb-1 sm:hidden">
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {user.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors font-medium"
                >
                  <UserIcon size={16} /> Minha Conta
                </button>
                <button
                  onClick={() => {
                    setIsExportModalOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors font-medium"
                >
                  <Download size={16} /> Exportar Dados
                </button>
                <div className="h-px bg-slate-50 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-50 rounded-xl transition-colors font-bold"
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sm:hidden p-2 text-slate-300 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        {currentTab === "HOME" && <HomeView />}
        {currentTab === "FLOW" && (
          <FinanceiroView
            transactions={transactions}
            onMarkAsPaid={handleMarkAsPaid}
            onDelete={handleDeleteRequest}
            onEdit={handleEditTransaction}
          />
        )}
        {currentTab === "REPORTS" && <ReportsView />}
        {currentTab === "CONTACTS" && (
          <ContactsView userId={user._id} transactions={transactions} />
        )}
      </main>

      {/* BOTÕES FLUTUANTES + MODO TEXTO */}
      {currentTab !== "CONTACTS" && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 w-full justify-center">
          {/* MODO TEXTO ATIVO: Mostra barra de digitação */}
          {isTextMode ? (
            <div className="bg-white p-2 rounded-2xl shadow-2xl border border-indigo-100 flex items-center gap-2 w-full max-w-[350px] animate-in slide-in-from-bottom-2 zoom-in-95">
              <form
                onSubmit={handleTextAiSubmit}
                className="flex-1 flex items-center gap-2"
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Almoço 30 reais no débito"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-sm font-medium px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent focus:border-indigo-200 transition-all placeholder:text-slate-400"
                  disabled={isAiProcessing}
                />
                <button
                  type="submit"
                  disabled={!aiText.trim() || isAiProcessing}
                  className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-200"
                >
                  {isAiProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
              <button
                onClick={() => setIsTextMode(false)}
                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            // MODO PADRÃO: Mostra Botões (Voz, Teclado, +)
            <div className="pointer-events-auto flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <VoiceInput
                onSuccess={handleAiSuccess}
                onModeChange={(isActive) => setIsInputMode(isActive)}
                userId={user._id}
              />

              {/* BOTÃO DE ESCREVER (NOVO) */}
              {!isInputMode && (
                <button
                  onClick={() => setIsTextMode(true)}
                  className="bg-white text-indigo-600 h-[56px] w-[56px] rounded-full shadow-lg border border-indigo-100 flex items-center justify-center hover:bg-indigo-50 active:scale-95 transition-all"
                  title="Digitar comando"
                >
                  <Keyboard size={24} />
                </button>
              )}

              {!isInputMode && (
                <button
                  onClick={handleOpenModalManual}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl shadow-indigo-300 flex items-center gap-2 font-bold hover:bg-indigo-700 active:scale-95 transition-all transform hover:-translate-y-1 h-[56px]"
                >
                  <Plus size={20} /> Registrar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* NAVEGAÇÃO INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 z-20 pb-safe">
        <div className="flex justify-around items-center max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentTab("HOME")}
            className={`flex flex-col items-center gap-1 transition-colors ${currentTab === "HOME" ? "text-indigo-600" : "text-slate-300 hover:text-slate-500"}`}
          >
            <Home size={24} strokeWidth={currentTab === "HOME" ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Início</span>
          </button>
          <button
            onClick={() => setCurrentTab("FLOW")}
            className={`flex flex-col items-center gap-1 transition-colors ${currentTab === "FLOW" ? "text-indigo-600" : "text-slate-300 hover:text-slate-500"}`}
          >
            <BarChart3
              size={24}
              strokeWidth={currentTab === "FLOW" ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold">Fluxo</span>
          </button>
          <button
            onClick={() => setCurrentTab("REPORTS")}
            className={`flex flex-col items-center gap-1 transition-colors ${currentTab === "REPORTS" ? "text-indigo-600" : "text-slate-300 hover:text-slate-500"}`}
          >
            <PieIcon
              size={24}
              strokeWidth={currentTab === "REPORTS" ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold">Relatórios</span>
          </button>
          <button
            onClick={() => setCurrentTab("CONTACTS")}
            className={`flex flex-col items-center gap-1 transition-colors ${currentTab === "CONTACTS" ? "text-indigo-600" : "text-slate-300 hover:text-slate-500"}`}
          >
            <Users
              size={24}
              strokeWidth={currentTab === "CONTACTS" ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold">Contatos</span>
          </button>
        </div>
      </nav>

      {/* MODAIS GLOBAIS */}
      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={user._id}
        initialData={modalInitialData}
        onSuccess={() => {
          fetchTransactions(user._id);
          if (user.type === "PJ") fetchFiscalSummary(user._id);
        }}
      />
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Transação?"
        message="Essa ação é irreversível."
        isDeleting={isDeleting}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        userName={user.name}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        onDeleteAccount={() => setIsDeleteAccountModalOpen(true)}
      />

      <ConfirmationModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Excluir Conta Permanentemente?"
        message="Tem certeza absoluta? Isso apagará TODOS os seus lançamentos, contatos e configurações. Não é possível recuperar depois."
      />
    </div>
  );
}
