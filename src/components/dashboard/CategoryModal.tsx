"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Tag,
  Trash2,
  Edit2,
  AlertCircle,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Briefcase,
  Wrench,
  Users,
  MoreHorizontal,
  Fuel,
  Home,
  GraduationCap,
  Heart,
  Plane,
  Smartphone,
  Wifi,
  Gift,
  Music,
} from "lucide-react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export const AVAILABLE_ICONS = [
  { name: "Tag", icon: Tag },
  { name: "Utensils", icon: Utensils },
  { name: "Car", icon: Car },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "Zap", icon: Zap },
  { name: "Briefcase", icon: Briefcase },
  { name: "Wrench", icon: Wrench },
  { name: "Users", icon: Users },
  { name: "Home", icon: Home },
  { name: "Fuel", icon: Fuel },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Heart", icon: Heart },
  { name: "Plane", icon: Plane },
  { name: "Smartphone", icon: Smartphone },
  { name: "Wifi", icon: Wifi },
  { name: "Gift", icon: Gift },
  { name: "Music", icon: Music },
  { name: "MoreHorizontal", icon: MoreHorizontal },
];

// CORES EM HEX (Fundo Claro / Texto Escuro)
const COLORS = [
  // --- NOVAS CORES DA MARCA ---
  { name: "Verde Marca", bg: "#effdf6", text: "#1ba879" }, // Brand-50 / Brand-500
  { name: "Azul Marca", bg: "#f0f1fa", text: "#000066" }, // Brand-50 / Brand-900
  
  { name: "Cinza", bg: "#f1f5f9", text: "#64748b" },
  { name: "Vermelho", bg: "#fee2e2", text: "#ef4444" },
  { name: "Laranja", bg: "#ffedd5", text: "#f97316" },
  { name: "Amarelo", bg: "#fef9c3", text: "#eab308" },
  { name: "Verde", bg: "#d1fae5", text: "#10b981" },
  { name: "Ciano", bg: "#cffafe", text: "#06b6d4" },
  { name: "Azul Claro", bg: "#dbeafe", text: "#3b82f6" },
  { name: "Roxo", bg: "#f3e8ff", text: "#a855f7" },
  { name: "Rosa", bg: "#fce7f3", text: "#ec4899" },
];

const ICON_MAP = AVAILABLE_ICONS.reduce(
  (acc, curr) => {
    acc[curr.name] = curr.icon;
    return acc;
  },
  {} as { [key: string]: React.ElementType },
);

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  isDefault: boolean;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  type: "INCOME" | "EXPENSE";
}

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  type,
}: CategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
    }
  }, [isOpen, type]);

  const fetchCategories = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/categories?userId=${userId}&type=${type}`);
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat._id);
    setName(cat.name);
    setSelectedIcon(cat.icon);
    // Encontra a cor baseada no Hex salvo
    const colorObj = COLORS.find((c) => c.text === cat.color) || COLORS[0];
    setSelectedColor(colorObj);
    setError(null);
  };

  const handleDeleteRequest = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/categories/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        fetchCategories();
        onSuccess();
        setDeleteId(null);
      } else {
        alert(data.message || "Erro ao excluir.");
      }
    } catch (e) {
      alert("Erro de conexão.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/categories/${editingId}`
        : "/api/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name,
          type,
          icon: selectedIcon,
          color: selectedColor.text,
          bg: selectedColor.bg,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        fetchCategories();
        resetForm();
      } else {
        setError(data.message || "Erro ao salvar.");
      }
    } catch (error) {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSelectedIcon("Tag");
    setSelectedColor(COLORS[0]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">
                Gerenciar Categorias
              </h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {type === "INCOME" ? "Entradas" : "Saídas"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 border-b border-slate-100"
            >
              {error && (
                <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                  {editingId ? "Editar Nome" : "Nova Categoria"}
                </label>
                <div className="flex items-center gap-3">
                  {/* Visualização da Cor: Usamos style em vez de className */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      backgroundColor: selectedColor.bg,
                      color: selectedColor.text,
                    }}
                  >
                    {(() => {
                      const Icon =
                        AVAILABLE_ICONS.find((i) => i.name === selectedIcon)
                          ?.icon || Tag;
                      return <Icon size={24} />;
                    })()}
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Academia"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    // CORRIGIDO: focus:ring-brand-900
                    className="flex-1 min-w-0 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-900 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor.name === color.name ? "border-slate-800 scale-110" : "border-transparent hover:scale-105"}`}
                      style={{ backgroundColor: color.bg }} // Cor de fundo real
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                  Ícone
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSelectedIcon(item.name)}
                      // CORRIGIDO: bg-brand-100 text-brand-900 ring-brand-900
                      className={`aspect-square flex items-center justify-center rounded-xl transition-all ${
                        selectedIcon === item.name
                          ? "bg-brand-100 text-brand-900 ring-2 ring-brand-900"
                          : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      }`}
                    >
                      <item.icon size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name}
                // CORRIGIDO: bg-brand-900 hover:bg-brand-700 shadow-brand-200
                className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  editingId
                    ? "bg-brand-900 text-white hover:bg-brand-700 shadow-brand-200"
                    : "bg-slate-800 text-white hover:bg-slate-900 shadow-slate-300"
                }`}
              >
                {loading ? (
                  "Salvando..."
                ) : editingId ? (
                  <>
                    <Save size={18} /> Atualizar
                  </>
                ) : (
                  <>
                    <Save size={18} /> Criar
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 font-bold underline"
                >
                  Cancelar Edição
                </button>
              )}
            </form>

            <div className="p-6 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">
                Categorias Existentes
              </h3>
              <div className="space-y-2">
                {loadingList ? (
                  <p className="text-center text-xs text-slate-400 py-4">
                    Carregando...
                  </p>
                ) : categories.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">
                    Nenhuma categoria encontrada.
                  </p>
                ) : (
                  categories.map((cat) => {
                    const IconComp = ICON_MAP[cat.icon] || Tag;
                    return (
                      <div
                        key={cat._id}
                        // CORRIGIDO: hover:border-brand-100
                        className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-brand-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          {/* Renderização com Style Hex */}
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: cat.bg,
                              color: cat.color,
                            }}
                          >
                            <IconComp size={16} />
                          </div>
                          <span className="text-sm font-bold text-slate-700">
                            {cat.name}
                          </span>
                          {cat.isDefault && (
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                              Padrão
                            </span>
                          )}
                        </div>

                        {!cat.isDefault && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(cat)}
                              // CORRIGIDO: hover:bg-brand-50 hover:text-brand-900
                              className="p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-900 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(cat._id)}
                              className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Categoria?"
        message="Se houver transações vinculadas a esta categoria, a exclusão será bloqueada. Deseja tentar?"
        isDeleting={isDeleting}
      />
    </>
  );
}