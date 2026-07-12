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
  PawPrint,
  Dog,
  Cat,
  Bone,
  Baby,
  School,
  Backpack,
  Stethoscope,
  Pill,
  HeartPulse,
  Syringe,
  Glasses,
  Coffee,
  Pizza,
  Beer,
  ShoppingCart,
  IceCreamCone,
  Dumbbell,
  Gamepad2,
  Film,
  Ticket,
  PartyPopper,
  Cake,
  Trophy,
  Camera,
  Palette,
  BookOpen,
  Bus,
  Train,
  Bike,
  MapPin,
  Luggage,
  Droplet,
  Flame,
  Snowflake,
  Sofa,
  Lamp,
  Refrigerator,
  WashingMachine,
  ShowerHead,
  Hammer,
  Paintbrush,
  TreePine,
  Flower2,
  CreditCard,
  Wallet,
  Banknote,
  PiggyBank,
  TrendingUp,
  Landmark,
  Building,
  Building2,
  HandCoins,
  Umbrella,
  Shield,
  Shirt,
  Scissors,
  Sparkles,
  Laptop,
  Monitor,
  Lock,
} from "lucide-react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useAuthFetch } from "@/lib/authClient";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

export const AVAILABLE_ICONS = [
  // Gerais
  { name: "Tag", icon: Tag },
  { name: "MoreHorizontal", icon: MoreHorizontal },
  { name: "Gift", icon: Gift },
  { name: "Heart", icon: Heart },
  // Pets
  { name: "PawPrint", icon: PawPrint },
  { name: "Dog", icon: Dog },
  { name: "Cat", icon: Cat },
  { name: "Bone", icon: Bone },
  // Família
  { name: "Baby", icon: Baby },
  { name: "School", icon: School },
  { name: "Backpack", icon: Backpack },
  { name: "GraduationCap", icon: GraduationCap },
  // Saúde
  { name: "Stethoscope", icon: Stethoscope },
  { name: "Pill", icon: Pill },
  { name: "HeartPulse", icon: HeartPulse },
  { name: "Syringe", icon: Syringe },
  { name: "Glasses", icon: Glasses },
  // Alimentação
  { name: "Utensils", icon: Utensils },
  { name: "Coffee", icon: Coffee },
  { name: "Pizza", icon: Pizza },
  { name: "Beer", icon: Beer },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "IceCreamCone", icon: IceCreamCone },
  // Lazer
  { name: "Music", icon: Music },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Film", icon: Film },
  { name: "Ticket", icon: Ticket },
  { name: "PartyPopper", icon: PartyPopper },
  { name: "Cake", icon: Cake },
  { name: "Trophy", icon: Trophy },
  { name: "Camera", icon: Camera },
  { name: "Palette", icon: Palette },
  { name: "BookOpen", icon: BookOpen },
  { name: "Plane", icon: Plane },
  // Transporte
  { name: "Car", icon: Car },
  { name: "Fuel", icon: Fuel },
  { name: "Bus", icon: Bus },
  { name: "Train", icon: Train },
  { name: "Bike", icon: Bike },
  { name: "MapPin", icon: MapPin },
  { name: "Luggage", icon: Luggage },
  // Casa / contas
  { name: "Home", icon: Home },
  { name: "Zap", icon: Zap },
  { name: "Droplet", icon: Droplet },
  { name: "Flame", icon: Flame },
  { name: "Wifi", icon: Wifi },
  { name: "Smartphone", icon: Smartphone },
  { name: "Snowflake", icon: Snowflake },
  { name: "Sofa", icon: Sofa },
  { name: "Lamp", icon: Lamp },
  { name: "Refrigerator", icon: Refrigerator },
  { name: "WashingMachine", icon: WashingMachine },
  { name: "ShowerHead", icon: ShowerHead },
  { name: "Wrench", icon: Wrench },
  { name: "Hammer", icon: Hammer },
  { name: "Paintbrush", icon: Paintbrush },
  { name: "TreePine", icon: TreePine },
  { name: "Flower2", icon: Flower2 },
  { name: "Lock", icon: Lock },
  // Financeiro / trabalho
  { name: "Briefcase", icon: Briefcase },
  { name: "Users", icon: Users },
  { name: "CreditCard", icon: CreditCard },
  { name: "Wallet", icon: Wallet },
  { name: "Banknote", icon: Banknote },
  { name: "PiggyBank", icon: PiggyBank },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "Landmark", icon: Landmark },
  { name: "Building", icon: Building },
  { name: "Building2", icon: Building2 },
  { name: "HandCoins", icon: HandCoins },
  { name: "Umbrella", icon: Umbrella },
  { name: "Shield", icon: Shield },
  // Vestuário / cuidados
  { name: "Shirt", icon: Shirt },
  { name: "Scissors", icon: Scissors },
  { name: "Sparkles", icon: Sparkles },
  // Tecnologia
  { name: "Laptop", icon: Laptop },
  { name: "Monitor", icon: Monitor },
];

// CORES EM HEX (Fundo Claro / Texto Escuro)
const COLORS = [
  { name: "Verde Marca", bg: "#effdf6", text: "#1ba879" },
  { name: "Azul Marca", bg: "#f0f1fa", text: "#000066" },
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

  const authFetch = useAuthFetch();

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
    }
  }, [isOpen, type]);

  const fetchCategories = async () => {
    setLoadingList(true);
    try {
      const res = await authFetch(
        `/api/categories?userId=${userId}&type=${type}`,
      );
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
    const colorObj = COLORS.find((c) => c.text === cat.color) || COLORS[0];
    setSelectedColor(colorObj);
    setError(null);
  };

  const handleDeleteRequest = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const res = await authFetch(`/api/categories/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        fetchCategories();
        onSuccess();
        setDeleteId(null);
      } else {
        setError(data.message || "Erro ao excluir.");
      }
    } catch (e) {
      setError("Erro de conexão.");
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

      const res = await authFetch(url, {
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

  return (
    <>
      <ResponsiveModal
        isOpen={isOpen}
        onClose={() => onClose()}
        title="Gerenciar Categorias"
        description={`Gerencie suas categorias de ${type === "INCOME" ? "Entradas" : "Saídas"}`}
      >
        {/* CABEÇALHO (Fora do no-drag para permitir arrastar para fechar) */}
        <div className="pb-4 border-b border-slate-100 flex justify-between items-center shrink-0">
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
            className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-x-hidden px-1 py-4" data-vaul-no-drag>
          <form
            onSubmit={handleSubmit}
            className="space-y-5 border-b border-slate-100 pb-6 mb-6"
          >
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0" /> {error}
              </div>
            )}

            {/* NOME DA CATEGORIA */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">
                {editingId ? "Editar Nome" : "Nova Categoria"}
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors"
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
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-900 outline-none text-slate-700 font-bold text-sm transition-all"
                />
              </div>
            </div>

            {/* SELETOR DE COR */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">
                Cor
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor.name === color.name
                        ? "border-slate-800 scale-110 shadow-md"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.bg }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* SELETOR DE ÍCONE */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">
                Ícone
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1 -m-1">
                {AVAILABLE_ICONS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    title={item.name}
                    className={`aspect-square flex items-center justify-center rounded-xl transition-all shrink-0 ${
                      selectedIcon === item.name
                        ? "bg-brand-100 text-brand-900 ring-2 ring-brand-900 shadow-sm"
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    }`}
                  >
                    <item.icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            {/* BOTÃO SUBMIT E CANCELAR */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !name}
                className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </form>

          {/* LISTA DE CATEGORIAS EXISTENTES */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1">
              Categorias Existentes
            </h3>
            <div className="space-y-2">
              {loadingList ? (
                <p className="text-center text-xs text-slate-400 py-4 animate-pulse">
                  Carregando categorias...
                </p>
              ) : categories.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500 font-medium">
                    Nenhuma categoria encontrada.
                  </p>
                </div>
              ) : (
                categories.map((cat) => {
                  const IconComp = ICON_MAP[cat.icon] || Tag;
                  return (
                    <div
                      key={cat._id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-brand-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
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
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(cat)}
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
      </ResponsiveModal>

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
