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

// Lista de Ícones
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

const COLORS = [
  { name: "Cinza", bg: "bg-slate-100", text: "text-slate-600" },
  { name: "Vermelho", bg: "bg-red-100", text: "text-red-600" },
  { name: "Laranja", bg: "bg-orange-100", text: "text-orange-600" },
  { name: "Amarelo", bg: "bg-yellow-100", text: "text-yellow-600" },
  { name: "Verde", bg: "bg-emerald-100", text: "text-emerald-600" },
  { name: "Ciano", bg: "bg-cyan-100", text: "text-cyan-600" },
  { name: "Azul", bg: "bg-blue-100", text: "text-blue-600" },
  { name: "Roxo", bg: "bg-purple-100", text: "text-purple-600" },
  { name: "Rosa", bg: "bg-pink-100", text: "text-pink-600" },
];

// Mapa de ícones para renderização
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

  // Form States
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega a lista ao abrir
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
    }
  }, [isOpen, type]); // Recarrega se mudar o tipo (Entrada/Saída)

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

    // Tenta encontrar a cor, senão usa a primeira
    const colorObj = COLORS.find((c) => c.text === cat.color) || COLORS[0];
    setSelectedColor(colorObj);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        fetchCategories(); // Atualiza a lista
        onSuccess(); // Avisa o pai que mudou algo
      } else {
        alert(data.message || "Erro ao excluir.");
      }
    } catch (e) {
      alert("Erro de conexão.");
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
        onSuccess(); // Atualiza dropdown do pai
        fetchCategories(); // Atualiza lista local
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
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
          {/* Form */}
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
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${selectedColor.bg} ${selectedColor.text}`}
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
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
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
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color.bg} ${selectedColor.name === color.name ? "border-slate-800 scale-110" : "border-transparent hover:scale-105"}`}
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
                    className={`aspect-square flex items-center justify-center rounded-xl transition-all ${
                      selectedIcon === item.name
                        ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500"
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
              className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                editingId
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
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

          {/* Lista de Existentes */}
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
                      className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${cat.bg} ${cat.color}`}
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
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat._id)}
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
  );
}
