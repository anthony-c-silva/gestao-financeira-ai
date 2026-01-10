"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  UserPlus,
  CalendarClock,
} from "lucide-react";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

interface Contact {
  _id: string;
  name: string;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
}: NewTransactionModalProps) {
  const [loading, setLoading] = useState(false);

  // Dados do Formulário
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Outros");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"PAID" | "PENDING">("PAID"); // NOVO: Estado para controlar se está pago

  // Lógica de Contatos (Clientes/Fornecedores)
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactName, setContactName] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

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
        status, // CORREÇÃO: Enviando o status corretamente agora
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            Nova Movimentação
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seletor de Tipo */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === "INCOME"
                  ? "bg-white shadow-sm text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              <ArrowUpCircle size={18} /> Entrada
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === "EXPENSE"
                  ? "bg-white shadow-sm text-rose-600"
                  : "text-slate-400"
              }`}
            >
              <ArrowDownCircle size={18} /> Saída
            </button>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-4xl font-black text-slate-800 placeholder-slate-200 focus:outline-none border-b-2 border-slate-100 focus:border-indigo-500 py-2 transition-colors bg-transparent"
            />
          </div>

          {/* NOVO: Seletor de Status (Pago ou Pendente) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
              Situação
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus("PAID")}
                className={`flex-1 py-2 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  status === "PAID"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 text-slate-400 hover:border-slate-200"
                }`}
              >
                <Check size={16} />
                {type === "INCOME" ? "Recebido" : "Pago"}
              </button>
              <button
                type="button"
                onClick={() => setStatus("PENDING")}
                className={`flex-1 py-2 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  status === "PENDING"
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-slate-100 text-slate-400 hover:border-slate-200"
                }`}
              >
                <CalendarClock size={16} />
                Pendente
              </button>
            </div>
          </div>

          {/* CAMPO INTELIGENTE: Cliente / Fornecedor */}
          <div className="relative" ref={wrapperRef}>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
              {type === "INCOME" ? "Cliente" : "Fornecedor"}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={
                  type === "INCOME"
                    ? "De quem você recebeu?"
                    : "Para quem você pagou?"
                }
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  setSelectedContactId(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full p-3 pl-10 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
            </div>

            {showSuggestions && contactName && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto">
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
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-sm text-slate-700 flex items-center justify-between group"
                    >
                      {contact.name}
                      <Check
                        size={16}
                        className="text-indigo-600 opacity-0 group-hover:opacity-100"
                      />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                    <UserPlus size={16} />
                    <span>
                      Novo: <strong>{contactName}</strong> será cadastrado.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data e Detalhes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                Detalhes (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Parcela 1/3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-700 text-sm font-medium"
              >
                <option>Outros</option>
                <option>Alimentação</option>
                <option>Transporte</option>
                <option>Lazer</option>
                <option>Contas Fixas</option>
                <option>Vendas</option>
                <option>Serviços</option>
                <option>Matéria-prima</option>
                <option>Salários</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-700 text-sm font-medium"
              >
                <option>Pix</option>
                <option>Dinheiro</option>
                <option>Cartão Crédito</option>
                <option>Cartão Débito</option>
                <option>Boleto</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all ${
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
        </form>
      </div>
    </div>
  );
}
