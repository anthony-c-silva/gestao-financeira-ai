"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Users,
  Briefcase,
  Phone,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ContactModal, ContactData } from "@/components/dashboard/ContactModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { FeedbackModal, FeedbackType } from "@/components/ui/FeedbackModal";

interface Contact {
  _id: string;
  name: string;
  type: "CLIENT" | "SUPPLIER";
  phone?: string;
  document?: string;
}

interface Transaction {
  contactId?: { _id: string };
  amount: number;
  type: "INCOME" | "EXPENSE";
  status: "PAID" | "PENDING";
}

interface ContactsViewProps {
  userId: string;
  transactions: Transaction[];
}

export function ContactsView({ userId, transactions }: ContactsViewProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filterType, setFilterType] = useState<"CLIENT" | "SUPPLIER">("CLIENT");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // PAGINAÇÃO
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Estados de Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado de Feedback
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: FeedbackType;
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const fetchContacts = async (currentPage = 1) => {
    setLoading(true);
    try {
      // Monta a URL com paginação e busca
      const params = new URLSearchParams({
        userId,
        type: filterType,
        page: currentPage.toString(),
        limit: "20", // 20 itens por página
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        // A API agora retorna { data: [], pagination: {} }
        setContacts(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Efeito para buscar quando muda Tipo, Busca ou Página
  // Usamos um timeout para o Search (Debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchContacts(page);
    }, 500); // Espera 500ms após parar de digitar

    return () => clearTimeout(delayDebounceFn);
  }, [userId, filterType, searchTerm, page]);

  // Se mudar o tipo ou digitar algo novo, volta para página 1
  useEffect(() => {
    setPage(1);
  }, [filterType, searchTerm]);

  // Handlers
  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedback({
          isOpen: true,
          type: "success",
          title: "Excluído!",
          message: "O contato foi removido.",
        });
        fetchContacts(page); // Recarrega a página atual
      } else {
        throw new Error("Falha");
      }
    } catch (e) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Erro",
        message: "Falha ao excluir.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleSuccess = () => {
    fetchContacts(page);
    setFeedback({
      isOpen: true,
      type: "success",
      title: "Sucesso!",
      message: editingContact ? "Contato atualizado." : "Contato criado.",
    });
  };

  const getContactTotal = (contactId: string) => {
    return transactions
      .filter((t) => t.contactId?._id === contactId && t.status === "PAID")
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meus Contatos</h1>
          <p className="text-slate-500 text-xs">
            Gerencie clientes e fornecedores
          </p>
        </div>
        <button
          onClick={() => {
            setEditingContact(null);
            setIsModalOpen(true);
          }}
          className="p-3 bg-brand-900 text-white rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95"
        >
          <UserPlus size={20} />
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="space-y-4 sticky top-16 bg-slate-50 z-10 py-2">
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button
            onClick={() => setFilterType("CLIENT")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              filterType === "CLIENT"
                ? "bg-brand-50 text-brand-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Users size={16} /> Clientes
          </button>
          <button
            onClick={() => setFilterType("SUPPLIER")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              filterType === "SUPPLIER"
                ? "bg-rose-50 text-rose-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Briefcase size={16} /> Fornecedores
          </button>
        </div>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-900 text-sm"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-slate-400 text-xs py-10 animate-pulse">
            Carregando contatos...
          </p>
        ) : contacts.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 text-sm font-bold">
              Nenhum contato encontrado.
            </p>
            <p className="text-slate-300 text-xs">
              Tente outro termo ou cadastre um novo.
            </p>
          </div>
        ) : (
          contacts.map((contact) => {
            const total = getContactTotal(contact._id);
            const contactData: ContactData = {
              _id: contact._id,
              name: contact.name,
              type: contact.type,
              phone: contact.phone,
              document: contact.document,
            };

            return (
              <div
                key={contact._id}
                onClick={() => {
                  setEditingContact(contactData);
                  setIsModalOpen(true);
                }}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-brand-200 transition-colors cursor-pointer group relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        contact.type === "CLIENT"
                          ? "bg-brand-900"
                          : "bg-rose-500"
                      }`}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{contact.name}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {contact.document || "Sem documento"}
                      </p>
                    </div>
                  </div>
                  <Edit2
                    size={16}
                    className="text-slate-300 group-hover:text-brand-900 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                    <Phone size={12} /> {contact.phone || "---"}
                  </div>
                  {total > 0 && (
                    <div
                      className={`flex items-center gap-1 text-xs font-bold ${
                        contact.type === "CLIENT"
                          ? "text-emerald-600 bg-emerald-50"
                          : "text-rose-600 bg-rose-50"
                      } px-2 py-1 rounded-md`}
                    >
                      {contact.type === "CLIENT" ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RODAPÉ DE PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs font-bold text-slate-500">
            Página {page} de {totalPages} ({totalCount} total)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* MODAIS */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        initialData={editingContact}
        onSuccess={handleSuccess}
        onDelete={handleDeleteRequest}
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Contato?"
        message="Tem certeza? O histórico financeiro deste contato será preservado, mas o cadastro dele será apagado."
        isDeleting={isDeleting}
      />

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
