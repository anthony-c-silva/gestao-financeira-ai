"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, User, Building2, Lock, Save, Trash2, AlertTriangle, LogOut, 
  Briefcase, CheckCircle2, ChevronDown, Check, Eye, EyeOff 
} from "lucide-react";
import { BUSINESS_SIZES } from "@/constants/business";

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  type?: "PF" | "PJ";
  businessSize?: string;
  companyName?: string;
}

interface UpdateUserPayload {
  name: string;
  phone: string;
  businessSize?: string;
  companyName?: string;
  password?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onUpdateUser: (updatedUser: UserData) => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onDeleteAccount,
  onLogout
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"PROFILE" | "SECURITY">("PROFILE");
  const [loading, setLoading] = useState(false);
  
  const [isBusinessSizeOpen, setIsBusinessSizeOpen] = useState(false);
  const businessSizeRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    phone: "",
    businessSize: "",
    password: "",
    confirmPassword: ""
  });

  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", test: (pass: string) => pass.length >= 8 },
    { label: "Letra Maiúscula", test: (pass: string) => /[A-Z]/.test(pass) },
    { label: "Número", test: (pass: string) => /[0-9]/.test(pass) },
    { label: "Caractere Especial", test: (pass: string) => /[^A-Za-z0-9]/.test(pass) },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (businessSizeRef.current && !businessSizeRef.current.contains(event.target as Node)) {
        setIsBusinessSizeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const pass = formData.password;
    if (!pass) {
      setPasswordStrength(0);
      return;
    }
    const passedCount = passwordRequirements.reduce(
      (acc, req) => acc + (req.test(pass) ? 1 : 0),
      0
    );
    setPasswordStrength(passedCount);
  }, [formData.password]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        companyName: user.companyName || "",
        phone: user.phone || "",
        businessSize: user.businessSize || "",
        password: "",
        confirmPassword: ""
      }));
    }
  }, [user, isOpen]);

  const handleSelectBusinessSize = (key: string) => {
    setFormData((prev) => ({ ...prev, businessSize: key }));
    setIsBusinessSizeOpen(false);
  };

  // CORREÇÃO: Removemos o @ts-ignore e usamos cast correto
  const getBusinessLabel = () => {
    if (!formData.businessSize) return "Selecione o enquadramento...";
    return BUSINESS_SIZES[formData.businessSize as keyof typeof BUSINESS_SIZES]?.label || "Selecione...";
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 2) return "Fraca";
    if (passwordStrength === 3) return "Média";
    return "Forte";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "SECURITY") {
      if (formData.password !== formData.confirmPassword) {
        alert("As senhas não conferem.");
        return;
      }
      if (formData.password && passwordStrength < 3) {
        alert("A senha precisa ser mais forte.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload: UpdateUserPayload = {
        name: formData.name,
        phone: formData.phone,
      };

      if (user?.type === "PJ") {
        payload.businessSize = formData.businessSize;
        payload.companyName = formData.companyName;
      }

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(`/api/user/${user?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdateUser(updated);
        alert("Dados atualizados com sucesso!");
        if (activeTab === "SECURITY") setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      } else {
        alert("Erro ao atualizar.");
      }
    } catch (error) {
      alert("Erro ao conectar com servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 pb-4 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Minha Conta
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex px-6 border-b border-slate-50">
          <button 
            onClick={() => setActiveTab("PROFILE")}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "PROFILE" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Perfil & Dados
          </button>
          <button 
            onClick={() => setActiveTab("SECURITY")}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "SECURITY" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Segurança
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="settings-form" onSubmit={handleSave} className="space-y-5">
            
            {activeTab === "PROFILE" && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mb-2">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md mt-1">
                    {user.type === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 flex items-center gap-1">
                    {user.type === "PJ" ? <><User size={12}/> Nome do Responsável</> : "Nome Completo"}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
                  />
                </div>

                {user.type === "PJ" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 flex items-center gap-1">
                      <Briefcase size={12}/> Razão Social / Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={e => setFormData({...formData, companyName: e.target.value})}
                      placeholder="Ex: Minha Empresa LTDA"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
                  />
                </div>

                {user.type === "PJ" && (
                  <div className="relative" ref={businessSizeRef}>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 flex items-center gap-1">
                      <Building2 size={14}/> Enquadramento Empresarial
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setIsBusinessSizeOpen(!isBusinessSizeOpen)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 flex justify-between items-center text-left"
                    >
                      <span>{getBusinessLabel()}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isBusinessSizeOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isBusinessSizeOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in zoom-in-95 origin-top custom-scrollbar max-h-60 overflow-y-auto">
                        {Object.entries(BUSINESS_SIZES).map(([key, value]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectBusinessSize(key)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 text-sm text-slate-700 flex items-center justify-between border-b border-slate-50 last:border-0"
                          >
                            <div>
                              <p className="font-bold">{key} - {value.label.split("-")[1]}</p>
                              <p className="text-[10px] text-slate-400">{value.description}</p>
                            </div>
                            {formData.businessSize === key && <Check size={16} className="text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1 ml-1">Isso ajusta o seu limite de alerta fiscal no painel.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "SECURITY" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Lock size={16} className="text-indigo-600"/> Alterar Senha
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nova Senha</label>
                    <div className="relative">
                        <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-indigo-600"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {formData.password && (
                        <div className="mt-2 flex items-center gap-2 animate-in fade-in">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${getStrengthColor()} transition-all duration-300`} style={{ width: `${(passwordStrength / 4) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 min-w-[30px] text-right">{getStrengthText()}</span>
                        </div>
                    )}
                    {formData.password && passwordStrength < 4 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1 animate-in fade-in">
                        {passwordRequirements.map((req, idx) => {
                            const met = req.test(formData.password);
                            return (<div key={idx} className={`flex items-center gap-1.5 text-[10px] font-bold ${met ? "text-emerald-600" : "text-slate-400"}`}>{met ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}{req.label}</div>);
                        })}
                        </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Confirmar Nova Senha</label>
                    <div className="relative">
                        <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="••••••••"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-indigo-600"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2 mb-2">
                    <AlertTriangle size={16}/> Zona de Perigo
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Ao excluir sua conta, todas as transações, clientes e dados serão apagados permanentemente. Esta ação não pode ser desfeita.
                  </p>
                  <button
                    type="button"
                    onClick={onDeleteAccount}
                    className="w-full py-3 border border-rose-200 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Excluir minha conta
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>

        <div className="p-6 border-t border-slate-50 bg-white flex justify-between items-center">
            <button 
                type="button" 
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-500 text-sm font-bold flex items-center gap-1 transition-colors"
            >
                <LogOut size={16} /> Sair
            </button>

            <button
                form="settings-form"
                type="submit"
                disabled={loading}
                className="py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2 text-sm"
            >
                {loading ? "Salvando..." : <><Save size={18} /> Salvar Alterações</>}
            </button>
        </div>

      </div>
    </div>
  );
}