"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Plus,
  Home,
  BarChart3,
  PieChart as PieIcon,
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
import { RecurrenceOptionsModal } from "@/components/dashboard/RecurrenceOptionsModal";
import { Toast } from "@/components/ui/Toast";
import { FeedbackModal } from "@/components/ui/FeedbackModal";
import { useAuthFetch } from "@/lib/authClient";

// Importando as Novas Views Limpas
import { HomeView } from "@/components/dashboard/views/HomeView";
import { ReportsView } from "@/components/dashboard/views/ReportsView";

// ==========================================
// INTERFACES DE TIPAGEM ESTRITA
// ==========================================
interface UserData {
  _id: string;
  name: string;
  companyName?: string;
  type?: "PF" | "PJ";
  businessSize?: string;
  email: string;
  phone: string;
}

export interface Category {
  _id: string;
  name: string;
  color?: string;
  bg?: string;
  icon?: string;
  type: "INCOME" | "EXPENSE";
}

export interface Transaction {
  _id: string;
  // CORREÇÃO: Removido o '?' do type. Agora, se o contato existir, ele tem que ter um tipo (CLIENT ou SUPPLIER)
  contactId?: { _id: string; name: string; type: "CLIENT" | "SUPPLIER" } | null;
  description: string;
  category: string;
  paymentMethod: string;
  type: "INCOME" | "EXPENSE";
  status: "PAID" | "PENDING";
  amount: number;
  date: string;
  createdAt?: string;
  totalInstallments?: number;
  installment?: number;
  recurrenceId?: string;
}

export interface FiscalSummary {
  businessType?: string;
  limitLabel: string;
  annualLimit: number;
  currentRevenue: number;
  percentage: number;
  alertLevel: "NORMAL" | "WARNING" | "DANGER" | "EXTRAPOLATED";
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [currentTab, setCurrentTab] = useState<
    "HOME" | "FLOW" | "REPORTS" | "CONTACTS"
  >("HOME");

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summaryData, setSummaryData] = useState<FiscalSummary | null>(null);

  const [showValues, setShowValues] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(false);

  const [deleteTransaction, setDeleteTransaction] =
    useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null,
  );

  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const [recurrenceAction, setRecurrenceAction] = useState<
    "EDIT" | "DELETE" | null
  >(null);
  const [pendingRecurrenceAction, setPendingRecurrenceAction] = useState<
    "SINGLE" | "FUTURE" | "ALL" | null
  >(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [modalInitialData, setModalInitialData] =
    useState<TransactionData | null>(null);

  const [isInputMode, setIsInputMode] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [aiText, setAiText] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
    },
    [],
  );

  const handleSessionExpired = useCallback(() => {
    showToast("Sua sessão expirou. Faça login novamente.", "error");
  }, [showToast]);

  const authFetch = useAuthFetch(handleSessionExpired);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await authFetch("/api/transactions");
      if (res.ok) setTransactions(await res.json());
    } catch (error) {
      console.error("Erro ao buscar transações");
    }
  }, [authFetch]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await authFetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error("Erro ao buscar categorias");
    }
  }, [authFetch]);

  const fetchFiscalSummary = useCallback(async () => {
    try {
      const res = await authFetch("/api/dashboard/summary");
      if (res.ok) setSummaryData(await res.json());
    } catch (error) {
      console.error("Erro fiscal");
    }
  }, [authFetch]);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const res = await authFetch("/api/auth/me");

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);

          await Promise.all([
            fetchTransactions(),
            fetchCategories(),
            userData.type === "PJ" ? fetchFiscalSummary() : null,
          ]);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [
    authFetch,
    fetchTransactions,
    fetchCategories,
    fetchFiscalSummary,
    router,
  ]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao sair:", error);
      window.location.href = "/login";
    }
  };

  const handleUpdateUser = (updatedUser: UserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
    setIsSettingsModalOpen(false);
    if (updatedUser.businessSize && updatedUser.type === "PJ") {
      fetchFiscalSummary();
    }
    showToast("Perfil atualizado!", "success");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const res = await authFetch(`/api/user/${user._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsDeleteAccountModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsDeleteSuccessOpen(true);
      } else {
        showToast("Erro ao excluir conta.", "error");
      }
    } catch (error) {
      showToast("Erro ao conectar com servidor.", "error");
    }
  };

  const handleAiSuccess = (data: AiTransactionData) => {
    const completeData: TransactionData = {
      ...data,
      status: "PENDING",
      paymentMethod: "PIX",
    };
    setModalInitialData(completeData);
    setIsModalOpen(true);
    setIsFabOpen(false);
  };

  const handleTextAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText.trim() || !user) return;
    setIsAiProcessing(true);
    try {
      const res = await authFetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      if (res.ok) {
        const data = await res.json();
        handleAiSuccess(data);
        setIsTextMode(false);
        setAiText("");
      } else {
        showToast("Não entendi. Tente reescrever.", "error");
      }
    } catch (error) {
      showToast("Erro de conexão com a IA.", "error");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleOpenModalManual = () => {
    setModalInitialData(null);
    setPendingRecurrenceAction(null);
    setIsModalOpen(true);
    setIsFabOpen(false);
  };

  const handleEditRequest = (t: Transaction) => {
    if (t.recurrenceId) {
      setEditTransaction(t);
      setRecurrenceAction("EDIT");
    } else {
      setModalInitialData(t as unknown as TransactionData);
      setPendingRecurrenceAction(null);
      setIsModalOpen(true);
    }
  };

  const handleDeleteRequest = (t: Transaction) => {
    if (t.recurrenceId) {
      setDeleteTransaction(t);
      setRecurrenceAction("DELETE");
    } else {
      setDeleteTransaction(t);
    }
  };

  const confirmRecurrenceAction = (action: "SINGLE" | "FUTURE" | "ALL") => {
    setRecurrenceAction(null);
    if (editTransaction) {
      setModalInitialData(editTransaction as unknown as TransactionData);
      setPendingRecurrenceAction(action);
      setIsModalOpen(true);
      setEditTransaction(null);
    }
    if (deleteTransaction) executeDelete(action);
  };

  const executeDelete = async (
    action: "SINGLE" | "FUTURE" | "ALL" = "SINGLE",
  ) => {
    if (!deleteTransaction || !user) return;
    setIsDeleting(true);
    try {
      const res = await authFetch(
        `/api/transactions/${deleteTransaction._id}?action=${action}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        fetchTransactions();
        if (user.type === "PJ") fetchFiscalSummary();
        setDeleteTransaction(null);
        if (action === "SINGLE") showToast("Transação excluída.", "success");
        else showToast("Série recorrente atualizada.", "success");
      } else showToast("Erro ao deletar.", "error");
    } catch (error) {
      showToast("Erro ao deletar.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsPaid = async (transaction: Transaction) => {
    try {
      const res = await authFetch(`/api/transactions/${transaction._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      if (res.ok && user) {
        fetchTransactions();
        if (user.type === "PJ" && transaction.type === "INCOME")
          fetchFiscalSummary();
        showToast("Status atualizado!", "success");
      }
    } catch (error) {
      showToast("Erro ao atualizar.", "error");
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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
    }
    return () => {
      if (typeof window !== "undefined")
        window.removeEventListener("resize", handleResize);
    };
  }, []);

  const formatMoney = (value: number) => {
    if (!showValues) return "••••••";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const monthlyTransactions = transactions.filter((t) => {
    const tDateAdjusted = new Date(
      new Date(t.date).valueOf() + new Date(t.date).getTimezoneOffset() * 60000,
    );
    return (
      tDateAdjusted.getMonth() === selectedDate.getMonth() &&
      tDateAdjusted.getFullYear() === selectedDate.getFullYear()
    );
  });

  const income = monthlyTransactions
    .filter((t) => t.type === "INCOME" && t.status === "PAID")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const expense = monthlyTransactions
    .filter((t) => t.type === "EXPENSE" && t.status === "PAID")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expense;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-brand-900 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse text-sm">
          Carregando seus dados...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 group outline-none"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-brand-900 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:bg-brand-700 transition-colors">
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
                    Olá, {user.name.split(" ")[0]}
                  </p>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
              </div>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in slide-in-from-top-2">
                <button
                  onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 rounded-xl transition-colors font-medium"
                >
                  <UserIcon size={16} /> Minha Conta
                </button>
                <button
                  onClick={() => {
                    setIsExportModalOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 rounded-xl transition-colors font-medium"
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
      </header>

      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        {currentTab === "HOME" && (
          <HomeView
            transactions={transactions}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            balance={balance}
            income={income}
            expense={expense}
            summaryData={summaryData}
            loading={loading}
            userType={user?.type}
            showValues={showValues}
            onToggleShowValues={() => setShowValues(!showValues)}
            formatMoney={formatMoney}
          />
        )}
        {currentTab === "FLOW" && (
          <FinanceiroView
            transactions={transactions}
            onMarkAsPaid={(t) => handleMarkAsPaid(t as unknown as Transaction)}
            onDelete={(t) => handleDeleteRequest(t as unknown as Transaction)}
            onEdit={(t) => handleEditRequest(t as unknown as Transaction)}
            selectedDate={selectedDate}
          />
        )}
        {currentTab === "REPORTS" && (
          <ReportsView
            transactions={transactions}
            categories={categories}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            balance={balance}
            isMobile={isMobile}
            onExportClick={() => setIsExportModalOpen(true)}
            formatMoney={formatMoney}
          />
        )}
        {currentTab === "CONTACTS" && (
          <ContactsView userId={user._id} transactions={transactions} />
        )}
      </main>

      {/* --- MENU FLUTUANTE DE TEXTO --- */}
      {isTextMode && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 w-full justify-center">
          <div className="bg-white p-2 rounded-2xl shadow-2xl border border-brand-100 flex items-center gap-2 w-full max-w-[350px] animate-in slide-in-from-bottom-2 zoom-in-95">
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
                className="w-full bg-slate-50 text-slate-800 text-sm font-medium px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-900 border border-transparent focus:border-brand-200 transition-all placeholder:text-slate-400"
                disabled={isAiProcessing}
              />
              <button
                type="submit"
                disabled={!aiText.trim() || isAiProcessing}
                className="bg-brand-900 text-white p-3 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-md"
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
        </div>
      )}

      {/* --- MENU "EXPLOSÃO" --- */}
      {isFabOpen && !isTextMode && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsFabOpen(false)}
          />
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 sm:gap-4 w-full justify-center animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
            <div className="scale-90 sm:scale-110">
              <VoiceInput
                onSuccess={(data) => {
                  handleAiSuccess(data);
                  setIsFabOpen(false);
                }}
                onModeChange={(isActive) => setIsInputMode(isActive)}
                userId={user._id}
              />
            </div>
            <button
              onClick={() => {
                setIsTextMode(true);
                setIsFabOpen(false);
              }}
              className="bg-white text-brand-900 h-12 w-12 sm:h-[56px] sm:w-[56px] rounded-full shadow-lg border border-brand-100 flex items-center justify-center hover:bg-brand-50 active:scale-95 transition-all"
            >
              <Keyboard className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={handleOpenModalManual}
              className="bg-brand-900 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-xl shadow-brand-300 flex items-center gap-2 font-bold hover:bg-brand-700 active:scale-95 transition-all transform hover:-translate-y-1 h-12 sm:h-[56px]"
            >
              <Plus className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Registrar</span>
            </button>
          </div>
        </>
      )}

      {/* --- NAVEGAÇÃO --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 z-40 pb-safe">
        <div className="flex justify-around items-end max-w-2xl mx-auto relative">
          <button
            onClick={() => {
              setCurrentTab("HOME");
              setIsFabOpen(false);
            }}
            className={`flex flex-col items-center gap-1 w-16 ${currentTab === "HOME" ? "text-brand-900" : "text-slate-300"}`}
          >
            <Home size={24} strokeWidth={currentTab === "HOME" ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Início</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab("FLOW");
              setIsFabOpen(false);
            }}
            className={`flex flex-col items-center gap-1 w-16 ${currentTab === "FLOW" ? "text-brand-900" : "text-slate-300"}`}
          >
            <BarChart3
              size={24}
              strokeWidth={currentTab === "FLOW" ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold">Fluxo</span>
          </button>

          <div className="relative -top-6">
            <button
              onClick={() => setIsFabOpen(!isFabOpen)}
              className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-90 ${
                isFabOpen
                  ? "bg-slate-800 text-white rotate-45 shadow-slate-400"
                  : "bg-brand-900 text-white shadow-brand-300"
              }`}
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          </div>

          <button
            onClick={() => {
              setCurrentTab("REPORTS");
              setIsFabOpen(false);
            }}
            className={`flex flex-col items-center gap-1 w-16 ${currentTab === "REPORTS" ? "text-brand-900" : "text-slate-300"}`}
          >
            <PieIcon
              size={24}
              strokeWidth={currentTab === "REPORTS" ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold">Relatórios</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab("CONTACTS");
              setIsFabOpen(false);
            }}
            className={`flex flex-col items-center gap-1 w-16 ${currentTab === "CONTACTS" ? "text-brand-900" : "text-slate-300"}`}
          >
            <Users
              size={24}
              strokeWidth={currentTab === "CONTACTS" ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold">Contatos</span>
          </button>
        </div>
      </nav>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={user._id}
        initialData={modalInitialData}
        recurrenceAction={pendingRecurrenceAction}
        onSuccess={() => {
          fetchTransactions();
          if (user.type === "PJ") fetchFiscalSummary();
          showToast("Salvo com sucesso!", "success");
        }}
      />
      <ConfirmationModal
        isOpen={!!deleteTransaction && !deleteTransaction.recurrenceId}
        onClose={() => setDeleteTransaction(null)}
        onConfirm={() => executeDelete("SINGLE")}
        title="Excluir Transação?"
        message="Essa ação é irreversível."
        isDeleting={isDeleting}
      />
      <RecurrenceOptionsModal
        isOpen={!!recurrenceAction}
        onClose={() => {
          setRecurrenceAction(null);
          setDeleteTransaction(null);
          setEditTransaction(null);
        }}
        onConfirm={confirmRecurrenceAction}
        type={recurrenceAction || "DELETE"}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        userName={user.name}
        currentDashboardDate={selectedDate}
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
        message="Tem certeza absoluta? Isso apagará TODOS os seus dados."
      />
      <FeedbackModal
        isOpen={isDeleteSuccessOpen}
        onClose={() => {
          setIsDeleteSuccessOpen(false);
          handleLogout();
        }}
        type="success"
        title="Conta Excluída"
        message="Sua conta foi excluída com sucesso."
      />
    </div>
  );
}
