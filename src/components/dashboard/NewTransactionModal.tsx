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
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Briefcase,
  Wrench,
  Users,
  MoreHorizontal,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  CalendarClock,
} from "lucide-react";

// Definindo a interface para os dados que vêm da IA
interface AiTransactionData {
  amount?: number;
  description?: string;
  category?: string;
  type?: "INCOME" | "EXPENSE";
  paymentMethod?: string;
  date?: string;
}

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  initialData?: AiTransactionData | null; // Tipagem corrigida aqui
}

interface Contact {
  _id: string;
  name: string;
}

// --- CONFIGURAÇÕES VISUAIS ---
const CATEGORIES = [
  {
    id: "Outros",
    icon: MoreHorizontal,
    color: "text-slate-500",
    bg: "bg-slate-100",
  },
  {
    id: "Alimentação",
    icon: Utensils,
    color: "text-orange-500",
    bg: "bg-orange-100",
  },
  { id: "Transporte", icon: Car, color: "text-blue-500", bg: "bg-blue-100" },
  { id: "Lazer", icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-100" },
  {
    id: "Contas Fixas",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-100",
  },
  {
    id: "Vendas",
    icon: Briefcase,
    color: "text-emerald-500",
    bg: "bg-emerald-100",
  },
  { id: "Serviços", icon: Wrench, color: "text-cyan-500", bg: "bg-cyan-100" },
  {
    id: "Salários",
    icon: Users,
    color: "text-indigo-500",
    bg: "bg-indigo-100",
  },
];

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
  initialData, // Agora tipado corretamente
}: NewTransactionModalProps) {
  const [loading, setLoading] = useState(false);

  // Dados do Formulário
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Outros");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [status, setStatus] = useState<"PAID" | "PENDING">("PAID");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Estados de Interface
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // Lógica de Contatos
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactName, setContactName] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Efeito: Preenchimento automático via IA
  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.amount) setAmount(initialData.amount.toString());
      if (initialData.description) setDescription(initialData.description);
      if (initialData.type) setType(initialData.type);

      const catExists = CATEGORIES.find((c) => c.id === initialData.category);
      setCategory(
        catExists && initialData.category ? initialData.category : "Outros"
      );

      const payExists = PAYMENT_METHODS.find(
        (p) => p.id === initialData.paymentMethod
      );
      setPaymentMethod(
        payExists && initialData.paymentMethod
          ? initialData.paymentMethod
          : "Pix"
      );

      if (initialData.date) setDate(initialData.date);
    }
  }, [initialData, isOpen]);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (
        paymentRef.current &&
        !paymentRef.current.contains(event.target as Node)
      ) {
        setIsPaymentOpen(false);
      }
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
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
        const res = await fetch(
          `/api/contacts?userId=${userId}&type=${contactType}`
        );
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (error) {
        console.error("Erro ao buscar contatos");
      }
    };

    setContactName("");
    setSelectedContactId(null);
    fetchContacts();
  }, [type, userId, isOpen]);

  // --- LÓGICA DO CALENDÁRIO ---
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
    const newDate = new Date(
      calendarViewDate.getFullYear(),
      calendarViewDate.getMonth() + offset,
      1
    );
    setCalendarViewDate(newDate);
  };

  const handleSelectDate = (day: Date) => {
    const offset = day.getTimezoneOffset();
    const localDate = new Date(day.getTime() - offset * 60 * 1000);
    setDate(localDate.toISOString().split("T")[0]);
    setIsCalendarOpen(false);
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactName.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalContactId = selectedContactId;

      if (contactName && !selectedContactId) {
        const contactType = type === "INCOME" ? "CLIENT" : "SUPPLIER";
        const createRes = await fetch("/api/contacts", {
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

      const payload = {
        userId,
        contactId: finalContactId,
        type,
        amount: parseFloat(amount.replace(",", ".")),
        description,
        category,
        paymentMethod,
        date,
        status,
      };

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setContactName("");
    setSelectedContactId(null);
    setCategory("Outros");
    setPaymentMethod("Pix");
    setDate(new Date().toISOString().split("T")[0]);
    setStatus("PAID");
  };

  if (!isOpen) return null;

  const currentCategory =
    CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const CategoryIcon = currentCategory.icon;
  const currentPayment =
    PAYMENT_METHODS.find((p) => p.id === paymentMethod) || PAYMENT_METHODS[0];
  const PaymentIcon = currentPayment.icon;
  const formattedDateDisplay = new Date(date + "T12:00:00").toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "short", year: "numeric" }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? "IA: Conferir e Salvar" : "Nova Movimentação"}
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
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === "INCOME"
                  ? "bg-white shadow-md text-emerald-600 transform scale-[1.02]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <ArrowUpCircle size={18} /> Entrada
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === "EXPENSE"
                  ? "bg-white shadow-md text-rose-600 transform scale-[1.02]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
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
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-48 text-5xl font-black text-slate-800 placeholder-slate-200 focus:outline-none bg-transparent text-center"
                autoFocus={!initialData} // Se veio da IA, não foca automaticamente para evitar teclado subindo
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus("PAID")}
              className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                status === "PAID"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-100 text-slate-400 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <Check size={16} />
              {type === "INCOME" ? "Recebido" : "Pago"}
            </button>
            <button
              type="button"
              onClick={() => setStatus("PENDING")}
              className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                status === "PENDING"
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-slate-100 text-slate-400 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <CalendarClock size={16} />
              Pendente
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
                className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-bold transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Search size={20} />
              </div>
            </div>

            {showSuggestions && contactName && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
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
                      className="w-full text-left px-5 py-3 hover:bg-indigo-50 text-sm text-slate-700 font-medium flex items-center justify-between group"
                    >
                      {contact.name}
                      <Check
                        size={16}
                        className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-4 text-sm text-slate-500 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
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
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between outline-none text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500 active:scale-[0.98] transition-all"
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon size={18} className="text-indigo-500" />
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
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                              : isToday
                              ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                              : "text-slate-600 hover:bg-slate-100"
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

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                Detalhes
              </label>
              <input
                type="text"
                placeholder="Ex: Parcela 2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium text-sm"
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
                className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between focus:ring-2 focus:ring-indigo-500 outline-none active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className={`p-1.5 rounded-lg ${currentCategory.bg} ${currentCategory.color}`}
                  >
                    <CategoryIcon size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate">
                    {category}
                  </span>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {isCategoryOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-30 animate-in zoom-in-95 origin-bottom">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setIsCategoryOpen(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div
                        className={`p-1.5 rounded-lg ${cat.bg} ${cat.color}`}
                      >
                        <cat.icon size={16} />
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          category === cat.id
                            ? "text-indigo-600"
                            : "text-slate-600"
                        }`}
                      >
                        {cat.id}
                      </span>
                      {category === cat.id && (
                        <Check size={14} className="ml-auto text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={paymentRef}>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                Pagamento
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentOpen(!isPaymentOpen);
                  setIsCategoryOpen(false);
                  setIsCalendarOpen(false);
                }}
                className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between focus:ring-2 focus:ring-indigo-500 outline-none active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <PaymentIcon size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate">
                    {paymentMethod}
                  </span>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {isPaymentOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-30 animate-in zoom-in-95 origin-bottom">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setIsPaymentOpen(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                        <method.icon size={16} />
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          paymentMethod === method.id
                            ? "text-indigo-600"
                            : "text-slate-600"
                        }`}
                      >
                        {method.id}
                      </span>
                      {paymentMethod === method.id && (
                        <Check size={14} className="ml-auto text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all ${
                type === "INCOME"
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                  : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
              }`}
            >
              {loading ? (
                "Salvando..."
              ) : (
                <>
                  <Check size={20} /> Confirmar{" "}
                  {type === "INCOME" ? "Entrada" : "Saída"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
