"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  Briefcase,
  ChevronDown,
  Eye,
  EyeOff
} from "lucide-react";
import { BUSINESS_SIZES } from "@/constants/business";
import { Toast } from "@/components/ui/Toast";

// --- FUNÇÕES DE VALIDAÇÃO ---
const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

const validateCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  
  return true;
};

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [personType, setPersonType] = useState<"PF" | "PJ">("PF");

  const [isBusinessSizeOpen, setIsBusinessSizeOpen] = useState(false);
  const businessSizeRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [showPassword, setShowPassword] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const businessOptions = Object.entries(BUSINESS_SIZES).map(([key, val]) => ({
    value: key,
    ...val
  }));

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    document: "",
    type: "PF",
    businessSize: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const formatDocument = (value: string, type: "PF" | "PJ") => {
    let numbers = value.replace(/\D/g, "");
    
    if (type === "PF") {
      if (numbers.length > 11) numbers = numbers.slice(0, 11);
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    } else {
      if (numbers.length > 14) numbers = numbers.slice(0, 14);
      return numbers
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const handleCepBlur = async () => {
    const cepClean = formData.cep.replace(/\D/g, "");
    if (cepClean.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepClean}/json/`,
      );
      const data = await response.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "document") formattedValue = formatDocument(value, personType);
    if (name === "phone") formattedValue = formatPhone(value);
    if (name === "cep") formattedValue = formatCEP(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const passwordsMatch =
    formData.password === formData.confirmPassword && formData.password !== "";
  const passwordStrength = checkPasswordStrength(formData.password);

  const handleNext = () => {
    if (currentStep === 1) {
      if (
        !formData.name ||
        !formData.document ||
        !formData.email ||
        !formData.phone
      ) {
        setToast({
          message: "Preencha todos os campos obrigatórios.",
          type: "error",
        });
        return;
      }

      const cleanDoc = formData.document.replace(/\D/g, "");
      
      if (personType === "PF") {
        if (!validateCPF(cleanDoc)) {
          setToast({ message: "CPF inválido. Verifique os números.", type: "error" });
          return;
        }
      } else {
        if (personType === "PJ" && (!formData.companyName || !formData.businessSize)) {
          setToast({ message: "Preencha os dados da empresa.", type: "error" });
          return;
        }
        if (!validateCNPJ(cleanDoc)) {
          setToast({ message: "CNPJ inválido. Verifique os números.", type: "error" });
          return;
        }
      }
    }

    if (currentStep === 2) {
      if (
        !formData.cep ||
        !formData.street ||
        !formData.number ||
        !formData.neighborhood ||
        !formData.city ||
        !formData.state
      ) {
        setToast({ message: "Preencha o endereço completo.", type: "error" });
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleTypeChange = (type: "PF" | "PJ") => {
    setPersonType(type);
    setFormData((prev) => ({ 
      ...prev, 
      type: type, 
      document: "" 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordsMatch || passwordStrength < 3) {
      setToast({
        message: "A senha precisa ser forte e igual à confirmação.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: personType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setToast({
          message: "Cadastro realizado! Verifique seu e-mail.",
          type: "success",
        });
        setTimeout(() => {
          router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
        }, 1500);
      } else {
        setToast({
          message: data.message || "Erro ao cadastrar.",
          type: "error",
        });
      }
    } catch (error) {
      setToast({ message: "Erro de conexão.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        businessSizeRef.current &&
        !businessSizeRef.current.contains(event.target as Node)
      ) {
        setIsBusinessSizeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center p-2 py-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Crie sua conta
          </h1>
          <p className="text-slate-500 mt-1 sm:mt-2 text-sm sm:text-base">
            Comece a transformar suas finanças hoje
          </p>
        </div>

        <div className="flex justify-center mb-5 sm:mb-8 gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${step <= currentStep ? "w-8 bg-indigo-600" : "w-2 bg-slate-200"}`}
            />
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 sm:p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden"
        >
          {currentStep === 1 && (
            <div className="space-y-3 sm:space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              
              <div className="flex gap-2 sm:gap-4 p-1 bg-slate-100 rounded-xl mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => handleTypeChange("PF")}
                  className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${personType === "PF" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <User className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> 
                  Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("PJ")}
                  className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${personType === "PJ" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Building2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> 
                  Pessoa Jurídica
                </button>
              </div>

              {/* VOLTANDO PARA O LAYOUT EMPILHADO NO MOBILE (grid-cols-1) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                    {personType === "PF" ? "CPF" : "CNPJ"}
                  </label>
                  <input
                    type="text"
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                    maxLength={personType === "PF" ? 14 : 18}
                    className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                    placeholder={
                      personType === "PF"
                        ? "000.000.000-00"
                        : "00.000.000/0000-00"
                    }
                  />
                </div>

                {personType === "PJ" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                        Razão Social
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                        placeholder="Nome da Empresa"
                      />
                    </div>
                    <div className="relative" ref={businessSizeRef}>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                        Enquadramento
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsBusinessSizeOpen(!isBusinessSizeOpen)}
                        className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-left flex justify-between items-center text-sm sm:text-base"
                      >
                        <span className="truncate">
                          {businessOptions.find((s) => s.value === formData.businessSize)?.label || "Selecione..."}
                        </span>
                        <ChevronDown size={16} className="text-slate-400 shrink-0" />
                      </button>
                      {/* ALTERAÇÃO: MENU ABRINDO PARA CIMA (bottom-full) */}
                      {isBusinessSizeOpen && (
                        <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                          {businessOptions.map((size) => (
                            <button
                              key={size.value}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, businessSize: size.value }));
                                setIsBusinessSizeOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 font-medium border-b border-slate-50 last:border-0"
                            >
                              {size.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                    Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={15}
                    className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                    placeholder="(00) 00000-0000"
                  />
                </div>

              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3 sm:space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="w-full sm:w-40">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                    CEP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      onBlur={handleCepBlur}
                      maxLength={9}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                      placeholder="00000-000"
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-3.5">
                        <Loader2
                          size={18}
                          className="animate-spin text-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                    placeholder="Rua, Av..."
                  />
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <div className="w-32">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                    Número
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                    placeholder="123"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleChange}
                    className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                    placeholder="Apto 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                  />
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-sm sm:text-base"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                      UF
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      maxLength={2}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium uppercase text-center text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3 sm:space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="bg-indigo-50 p-3 sm:p-4 rounded-2xl border border-indigo-100 mb-4 sm:mb-6">
                <h3 className="text-indigo-900 font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <Briefcase size={20} /> Quase lá!
                </h3>
                <p className="text-xs sm:text-sm text-indigo-700">
                  Defina uma senha segura para proteger os dados financeiros da
                  sua empresa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full p-3 sm:p-3.5 bg-slate-50 border rounded-xl outline-none transition-all text-slate-800 font-medium pr-20 text-sm sm:text-base ${passwordStrength >= 3 ? "border-emerald-200 focus:ring-2 focus:ring-emerald-500" : "border-slate-200 focus:ring-2 focus:ring-indigo-500"}`}
                    placeholder="••••••••"
                  />
                  
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                    {formData.password && (
                      <div className="flex items-center">
                        {passwordStrength >= 3 ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      className="text-slate-400 hover:text-indigo-600 focus:outline-none cursor-pointer p-1"
                      onMouseDown={() => setShowPassword(true)}
                      onMouseUp={() => setShowPassword(false)}
                      onMouseLeave={() => setShowPassword(false)}
                      onTouchStart={() => setShowPassword(true)}
                      onTouchEnd={() => setShowPassword(false)}
                      title="Segure para ver a senha"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-1 mt-2 h-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength ? (passwordStrength < 3 ? "bg-orange-400" : "bg-emerald-500") : "bg-slate-200"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1 text-right">
                  {passwordStrength < 3 ? "Senha fraca" : "Senha forte"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 ml-1">
                  Confirme a Senha
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full p-3 sm:p-3.5 bg-slate-50 border rounded-xl outline-none transition-all text-slate-800 font-medium pr-10 text-sm sm:text-base ${passwordsMatch ? "border-emerald-200 focus:ring-emerald-500" : "border-slate-200 focus:ring-indigo-500"}`}
                    placeholder="••••••••"
                  />
                  {formData.confirmPassword && (
                    <div className="absolute right-3 top-3.5">
                      {passwordsMatch ? (
                        <Check size={20} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={20} className="text-rose-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 sm:pt-6 flex gap-3 mt-4 border-t border-slate-50">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Voltar
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
              >
                Continuar <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !passwordsMatch || passwordStrength < 3}
                className="flex-[2] py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Finalizar Cadastro"
                )}
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
            >
              Fazer Login
            </Link>
          </p>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}