"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  FileText,
  Save,
  Trash2,
  AlertCircle,
} from "lucide-react";

export interface ContactData {
  _id?: string;
  name: string;
  type: "CLIENT" | "SUPPLIER";
  phone?: string;
  document?: string;
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialData?: ContactData | null;
  onSuccess: () => void;
  onDelete?: (id: string) => void;
}

export function ContactModal({
  isOpen,
  onClose,
  userId,
  initialData,
  onSuccess,
  onDelete,
}: ContactModalProps) {
  const [formData, setFormData] = useState<ContactData>({
    name: "",
    type: "CLIENT",
    phone: "",
    document: "",
  });
  const [loading, setLoading] = useState(false);
  // NOVO: Estado para armazenar a mensagem de erro personalizada
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        phone: initialData.phone || "",
        document: initialData.document || "",
      });
    } else {
      setFormData({ name: "", type: "CLIENT", phone: "", document: "" });
    }
    setError(null); // Limpa erro ao abrir
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const maskPhone = (v: string) =>
    v
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2")
      .substring(0, 15);

  const maskDocument = (v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length <= 11) {
      return clean
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .substring(0, 14);
    }
    return clean
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 18);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let finalVal = value;
    if (name === "phone") finalVal = maskPhone(value);
    if (name === "document") finalVal = maskDocument(value);

    setFormData((prev) => ({ ...prev, [name]: finalVal }));
    // Limpa o erro assim que o usuário começa a corrigir
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = initialData?._id
        ? `/api/contacts/${initialData._id}`
        : "/api/contacts";
      const method = initialData?._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userId }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        // Define o erro no estado para mostrar a tarja vermelha
        setError(data.message || "Erro ao salvar contato.");
      }
    } catch (error) {
      console.error(error);
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-lg">
            {initialData ? "Editar Contato" : "Novo Contato"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto custom-scrollbar"
        >
          {/* TARJA DE ERRO PERSONALIZADA */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-2 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "CLIENT" })}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                formData.type === "CLIENT"
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "SUPPLIER" })}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                formData.type === "SUPPLIER"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              Fornecedor
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 flex items-center gap-1">
              <User size={12} /> Nome
            </label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-bold text-slate-700 ${
                error && error.includes("nome")
                  ? "border-rose-300 focus:ring-rose-200"
                  : "border-slate-200 focus:ring-brand-900"
              }`}
              placeholder={
                formData.type === "CLIENT"
                  ? "Nome do Cliente"
                  : "Nome do Fornecedor"
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 flex items-center gap-1">
                <Phone size={12} /> Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className={`w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${
                  error && error.includes("telefone")
                    ? "border-rose-300 focus:ring-rose-200"
                    : "border-slate-200 focus:ring-brand-900"
                }`}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 flex items-center gap-1">
                <FileText size={12} /> CPF / CNPJ
              </label>
              <input
                type="text"
                name="document"
                value={formData.document || ""}
                onChange={handleChange}
                className={`w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${
                  error && (error.includes("CPF") || error.includes("CNPJ"))
                    ? "border-rose-300 focus:ring-rose-200"
                    : "border-slate-200 focus:ring-brand-900"
                }`}
                placeholder="Documento"
              />
            </div>
          </div>
        </form>

        <div className="p-5 border-t border-slate-50 bg-slate-50/50 flex gap-3">
          {initialData && onDelete && initialData._id && (
            <button
              type="button"
              onClick={() => onDelete(initialData._id!)}
              className="p-3 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-brand-900 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              "Salvando..."
            ) : (
              <>
                <Save size={18} /> Salvar Contato
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
