"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  UserPlus,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Repeat,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  CalendarClock,
  PlusCircle,
  Tag,
} from "lucide-react";

import { CategoryModal, AVAILABLE_ICONS } from "./CategoryModal";
import { useAuthFetch } from "@/lib/authClient";

const ICON_MAP = AVAILABLE_ICONS.reduce(
  (acc, curr) => {
    acc[curr.name] = curr.icon;
    return acc;
  },
  {} as { [key: string]: React.ElementType },
);

// --- CORES DA MARCA NOS PAGAMENTOS ---
// Pix/Dinheiro = Verde (Emerald)
// Cartões = Azul (Brand)
// Boleto = Laranja (Amber)
const PAYMENT_STYLES: { [key: string]: { bg: string; text: string } } = {
  "Pix": { bg: "bg-emerald-100", text: "text-emerald-600" },
  "Dinheiro": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Cartão Crédito": { bg: "bg-brand-100", text: "text-brand-900" },
  "Cartão Débito": { bg: "bg-brand-50", text: "text-brand-700" },
  "Boleto": { bg: "bg-amber-100", text: "text-amber-600" },
  "default": { bg: "bg-slate-100", text: "text-slate-600" },
};

export interface TransactionData {
  _id?: string;
  amount?: number;
  description?: string;
  category?: string;
  type?: "INCOME" | "EXPENSE";
  paymentMethod?: string;
  date?: string;
  status?: "PENDING" | "PAID";
  contactId?: {
    _id: string;
    name: string;
  };
  recurrenceId?: string;
  totalInstallments?: number;
}

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  initialData?: TransactionData | null;
  recurrenceAction?: "SINGLE" | "FUTURE" | "ALL" | null;
}

interface Contact {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  bg: string;
}

const PAYMENT_METHODS = [
  { id: "Pix", icon: QrCode },
  { id: "Dinheiro", icon: Banknote },
  { id: "Cartão Crédito", icon: CreditCard },
  { id: "Cartão Débito", icon: CreditCard },
  { id: "Boleto", icon: FileText },
];

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function NewTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  initialData,
  recurrenceAction,
}: NewTransactionModalProps) {
  const [loading, setLoading] = useState(false);

  // Estados
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("0,00");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [status, setStatus] = useState<"PAID" | "PENDING">("PAID");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [isRecurring, setIsRecurring] = useState(false);
  const [installments, setInstallments] = useState("2");

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contactName, setContactName] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const authFetch = useAuthFetch();

  // --- LÓGICA DE MÁSCARA DE MOEDA (BANCÁRIA) ---
  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const floatValue = Number(numericValue) / 100;
    return floatValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatCurrency(e.target.value));
  };

  const getAmountSize = (value: string) => {
    if (value.length > 12) return "text-2xl";
    if (value.length > 9) return "text-3xl";
    if (value.length > 7) return "text-4xl";
    return "text-5xl";
  };

  const fetchCategories = async () => {
    try {
      const res = await authFetch(
        `/api/categories?userId=${userId}&type=${type}`,
      );
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (!editingId && !initialData && data.length > 0) {
          if (!category) setCategory(data[0].name);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar categorias");
    }
  };

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [type, userId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setEditingId(initialData._id || null);
        
        // Formata valor inicial vindo do banco/IA
        if (initialData.amount) {
          setAmount(
            initialData.amount.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            }),
          );
        } else {
          setAmount("0,00");
        }

        if (initialData.description)
          setDescription(initialData.description || "");
        if (initialData.type) setType(initialData.type);
        if (initialData.category) setCategory(initialData.category);

        const payExists = PAYMENT_METHODS.find(
          (p) => p.id === initialData.paymentMethod,
        );
        setPaymentMethod(
          payExists && initialData.paymentMethod
            ? initialData.paymentMethod
            : "Pix",
        );

        if (initialData.date) {
          const d = new Date(initialData.date);
          if (!isNaN(d.getTime())) setDate(d.toISOString().split("T")[0]);
        }
        if (initialData.status) setStatus(initialData.status);
        if (initialData.contactId) {
          setContactName(initialData.contactId.name);
          setSelectedContactId(initialData.contactId._id);
        } else {
          setContactName("");
          setSelectedContactId(null);
        }
        setIsRecurring(false);
        setInstallments("2");
      } else {
        resetForm();
      }
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      )
        setShowSuggestions(false);
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      )
        setIsCategoryOpen(false);
      if (
        paymentRef.current &&
        !paymentRef.current.contains(event.target as Node)
      )
        setIsPaymentOpen(false);
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      )
        setIsCalendarOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setCalendarViewDate(date ? new Date(date + "T12:00:00") : new Date());

    const fetchContacts = async () => {
      const contactType = type === "INCOME" ? "CLIENT" : "SUPPLIER";
      try {
        const res = await authFetch(
          `/api/contacts?userId=${userId}&type=${contactType}&limit=1000`,
        );
        if (res.ok) {
          const data = await res.json();
          const contactsList = Array.isArray(data) ? data : data.data || [];
          setContacts(contactsList);
        }
      } catch (error) {
        console.error("Erro ao buscar contatos");
      }
    };
    fetchContacts();
  }, [type, userId, isOpen, date]);

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
    setCalendarViewDate(
      new Date(
        calendarViewDate.getFullYear(),
        calendarViewDate.getMonth() + offset,
        1,
      ),
    );
  };

  const handleSelectDate = (day: Date) => {
    const offset = day.getTimezoneOffset();
    const localDate = new Date(day.getTime() - offset * 60 * 1000);
    setDate(localDate.toISOString().split("T")[0]);
    setIsCalendarOpen(false);
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactName.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalContactId = selectedContactId;

      if (contactName && !selectedContactId) {
        const contactType = type === "INCOME" ? "CLIENT" : "SUPPLIER";
        const createRes = await authFetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name: contactName,
            type: contactType,
          }),
        });

        if (createRes.ok) {
          const newContact = await createRes.json();
          finalContactId = newContact._id;
        }
      }

      // Converte a string formatada ("1.234,56") para float (1234.56)
      const cleanAmount = parseFloat(
        amount.replace(/\./g, "").replace(",", "."),
      );

      const payload = {
        userId,
        contactId: finalContactId,
        type,
        amount: cleanAmount,
        description,
        category,
        paymentMethod,
        date,
        status,
        isRecurring,
        installments: isRecurring ? parseInt(installments) : 1,
      };

      let url = "/api/transactions";
      let method = "POST";

      if (editingId) {
        url = `/api/transactions/${editingId}`;
        method = "PUT";
        if (recurrenceAction) {
          url += `?action=${recurrenceAction}`;
        }
      }

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        alert("Erro ao salvar.");
      }
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount("0,00");
    setDescription("");
    setContactName("");
    setSelectedContactId(null);
    setCategory("");
    setPaymentMethod("Pix");
    setDate(new Date().toISOString().split("T")[0]);
    setStatus("PAID");
    setIsRecurring(false);
    setInstallments("2");
  };

  if (!isOpen) return null;

  const currentCategoryObj = categories.find((c) => c.name === category);
  const CategoryIcon = currentCategoryObj
    ? ICON_MAP[currentCategoryObj.icon] || Tag
    : Tag;
  const categoryColor = currentCategoryObj?.color || "#64748b";
  const categoryBg = currentCategoryObj?.bg || "#f1f5f9";

  const currentPayment =
    PAYMENT_METHODS.find((p) => p.id === paymentMethod) || PAYMENT_METHODS[0];
  const PaymentIcon = currentPayment.icon;
  // Pega o estilo correto (Verde ou Azul)
  const paymentStyle =
    PAYMENT_STYLES[paymentMethod] || PAYMENT_STYLES["default"];

  const formattedDateDisplay = new Date(date + "T12:00:00").toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {editingId
              ? "Editar Movimentação"
              : initialData && !editingId
                ? "IA: Conferir e Salvar"
                : "Nova Movimentação"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pb-4">
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${type === "INCOME" ? "bg-white shadow-md text-emerald-600 transform scale-[1.02]" : "text-slate-400 hover:text-slate-600"}`}
            >
              <ArrowUpCircle size={18} /> Entrada
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${type === "EXPENSE" ? "bg-white shadow-md text-rose-600 transform scale-[1.02]" : "text-slate-400 hover:text-slate-600"}`}
            >
              <ArrowDownCircle size={18} /> Saída
            </button>
          </div>

          <div className="text-center py-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Valor da transação
            </span>
            <div className="flex justify-center items-center gap-1 mt-1">
              <span className="text-2xl font-medium text-slate-400">R$</span>
              
              {/* INPUT COM MÁSCARA */}
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0,00"
                value={amount}
                onChange={handleAmountChange}
                className={`w-full max-w-[280px] ${getAmountSize(amount)} font-black text-slate-800 placeholder-slate-200 focus:outline-none bg-transparent text-center transition-all`}
                autoFocus={!initialData}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus("PAID")}
              className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${status === "PAID" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-100 text-slate-400 bg-slate-50 hover:bg-slate-100"}`}
            >
              <Check size={16} /> {type === "INCOME" ? "Recebido" : "Pago"}
            </button>
            <button
              type="button"
              onClick={() => setStatus("PENDING")}
              className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${status === "PENDING" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-100 text-slate-400 bg-slate-50 hover:bg-slate-100"}`}
            >
              <CalendarClock size={16} /> Pendente
            </button>
          </div>

          <div className="relative" ref={wrapperRef}>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
              {type === "INCOME" ? "Quem pagou?" : "Para quem?"}
            </label>
            <div className="relative group">
              <input
                type="text"
                required
                placeholder="Buscar ou adicionar novo..."
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  setSelectedContactId(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                // AZUL DA MARCA NO FOCUS
                className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-900 outline-none text-slate-700 font-bold transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-900 transition-colors">
                <Search size={20} />
              </div>
            </div>
            {showSuggestions && contactName && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 custom-scrollbar">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact._id}
                      type="button"
                      onClick={() => {
                        setContactName(contact.name);
                        setSelectedContactId(contact._id);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-brand-50 text-sm text-slate-700 font-medium flex items-center justify-between group"
                    >
                      {contact.name}
                      <Check
                        size={16}
                        className="text-brand-900 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-4 text-sm text-slate-500 flex items-center gap-2">
                    <div className="p-1.5 bg-brand-100 text-brand-900 rounded-lg">
                      <UserPlus size={16} />
                    </div>
                    <span>
                      Cadastrar <strong>{contactName}</strong> automaticamente.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 relative">
            <div ref={calendarRef} className="relative">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                Data
              </label>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between outline-none text-slate-700 font-bold text-sm focus:ring-2 focus:ring-brand-900 active:scale-[0.98] transition-all"
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon size={18} className="text-brand-900" />
                  {formattedDateDisplay}
                </span>
              </button>
              {isCalendarOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-[300px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-40 animate-in zoom-in-95 origin-bottom-left">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => changeMonth(-1)}
                      className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-slate-700 capitalize">
                      {MONTHS[calendarViewDate.getMonth()]}{" "}
                      {calendarViewDate.getFullYear()}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeMonth(1)}
                      className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold text-slate-400"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((day, idx) => {
                      if (!day) return <div key={idx} />;
                      const isSelected =
                        day.toISOString().split("T")[0] === date;
                      const isToday =
                        day.toISOString().split("T")[0] ===
                        new Date().toISOString().split("T")[0];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectDate(day)}
                          // AZUL DA MARCA NO CALENDÁRIO
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isSelected ? "bg-brand-900 text-white shadow-md shadow-brand-200" : isToday ? "bg-brand-50 text-brand-900 border border-brand-200" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                Detalhes
              </label>
              <input
                type="text"
                placeholder="Ex: Aluguel"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-900 outline-none text-slate-700 font-medium text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
            <div className="relative" ref={categoryRef}>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                Categoria
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen);
                  setIsPaymentOpen(false);
                  setIsCalendarOpen(false);
                }}
                className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between focus:ring-2 focus:ring-brand-900 outline-none active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{
                      backgroundColor: categoryBg,
                      color: categoryColor,
                    }}
                  >
                    <CategoryIcon size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate">
                    {category || "Selecione..."}
                  </span>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {isCategoryOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-30 animate-in zoom-in-95 origin-bottom custom-scrollbar">
                  {categories.length > 0 ? (
                    categories.map((cat) => {
                      const IconComp = ICON_MAP[cat.icon] || Tag;
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.name);
                            setIsCategoryOpen(false);
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                        >
                          <div
                            className="p-1.5 rounded-lg"
                            style={{
                              backgroundColor: cat.bg,
                              color: cat.color,
                            }}
                          >
                            <IconComp size={16} />
                          </div>
                          <span
                            className={`text-sm font-medium ${category === cat.name ? "text-brand-900" : "text-slate-600"}`}
                          >
                            {cat.name}
                          </span>
                          {category === cat.name && (
                            <Check
                              size={14}
                              className="ml-auto text-brand-900"
                            />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Nenhuma categoria encontrada.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateCategoryOpen(true);
                      setIsCategoryOpen(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 bg-brand-50 hover:bg-brand-100 text-brand-900 transition-colors border-t border-brand-100 sticky bottom-0"
                  >
                    <PlusCircle size={16} />
                    <span className="text-sm font-bold">
                      Criar Nova Categoria
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative" ref={paymentRef}>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                {type === "INCOME" ? "Recebimento" : "Pagamento"}
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentOpen(!isPaymentOpen);
                  setIsCategoryOpen(false);
                  setIsCalendarOpen(false);
                }}
                className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between focus:ring-2 focus:ring-brand-900 outline-none active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {/* ÍCONE DE PAGAMENTO COM COR CERTA */}
                  <div className={`p-1.5 rounded-lg ${paymentStyle.bg} ${paymentStyle.text}`}>
                    <PaymentIcon size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate">
                    {paymentMethod}
                  </span>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {isPaymentOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-30 animate-in zoom-in-95 origin-bottom custom-scrollbar">
                  {PAYMENT_METHODS.map((method) => {
                    // SELECIONA ESTILO CORRETO
                    const style = PAYMENT_STYLES[method.id] || PAYMENT_STYLES["default"];
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method.id);
                          setIsPaymentOpen(false);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`}>
                          <method.icon size={16} />
                        </div>
                        <span
                          className={`text-sm font-medium whitespace-nowrap ${paymentMethod === method.id ? "text-brand-900" : "text-slate-600"}`}
                        >
                          {method.id}
                        </span>
                        {paymentMethod === method.id && (
                          <Check size={14} className="ml-auto text-brand-900" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {!editingId && (
            <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                  <Repeat size={18} /> Repetir este lançamento?
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-900"></div>
                </label>
              </div>
              {isRecurring && (
                <div className="animate-in slide-in-from-top-2 fade-in">
                  <label className="block text-xs font-bold text-brand-400 uppercase mb-1 ml-1">
                    Repetir por quantos meses?
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-20 p-2 bg-white border border-brand-200 rounded-xl text-center font-bold text-brand-700 outline-none focus:ring-2 focus:ring-brand-900"
                    />
                    <span className="text-sm text-brand-900 font-medium">
                      Meses (Vezes)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all ${type === "INCOME" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"}`}
            >
              {loading ? (
                "Salvando..."
              ) : (
                <>
                  <Check size={20} /> Confirmar{" "}
                  {editingId
                    ? "Edição"
                    : type === "INCOME"
                      ? "Recebimento"
                      : "Pagamento"}
                </>
              )}
            </button>
          </div>
        </form>

        <CategoryModal
          isOpen={isCreateCategoryOpen}
          onClose={() => setIsCreateCategoryOpen(false)}
          onSuccess={() => {
            fetchCategories();
            setIsCreateCategoryOpen(false);
          }}
          userId={userId}
          type={type}
        />
      </div>
    </div>
  );
}