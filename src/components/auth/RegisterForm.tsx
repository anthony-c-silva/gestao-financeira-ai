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
} from "lucide-react";
import { BUSINESS_SIZES } from "@/constants/business";
import { Toast } from "@/components/ui/Toast";
import { Logo } from "@/components/ui/Logo";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [personType, setPersonType] = useState<"PF" | "PJ">("PF");

  const [isBusinessSizeOpen, setIsBusinessSizeOpen] = useState(false);
  const businessSizeRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // --- CORREÇÃO: Converte o Objeto de constantes em Array para uso no select ---
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

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
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

    if (name === "document") formattedValue = formatDocument(value);
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
      if (
        personType === "PJ" &&
        (!formData.companyName || !formData.businessSize)
      ) {
        setToast({ message: "Preencha os dados da empresa.", type: "error" });
        return;
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
    <div className="min-h-screen flex flex-col justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
              <Logo/>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Crie sua conta
          </h1>
          <p className="text-slate-500 mt-2">
            Comece a transformar suas finanças hoje
          </p>
        </div>

        <div className="flex justify-center mb-8 gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${step <= currentStep ? "w-8 bg-indigo-600" : "w-2 bg-slate-200"}`}
            />
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden"
        >
          {currentStep === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex gap-4 p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setPersonType("PF");
                    setFormData((prev) => ({ ...prev, type: "PF" }));
                  }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${personType === "PF" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <User size={18} /> Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPersonType("PJ");
                    setFormData((prev) => ({ ...prev, type: "PJ" }));
                  }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${personType === "PJ" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Building2 size={18} /> Pessoa Jurídica
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    {personType === "PF" ? "CPF" : "CNPJ"}
                  </label>
                  <input
                    type="text"
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                    maxLength={18}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    placeholder={
                      personType === "PF"
                        ? "000.000.000-00"
                        : "00.000.000/0000-00"
                    }
                  />
                </div>
              </div>

              {personType === "PJ" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                      placeholder="Nome da Empresa"
                    />
                  </div>
                  <div className="relative" ref={businessSizeRef}>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                      Enquadramento
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBusinessSizeOpen(!isBusinessSizeOpen)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium text-left flex justify-between items-center"
                    >
                      {/* CORREÇÃO: Usa o businessOptions para buscar o label */}
                      {businessOptions.find(
                        (s) => s.value === formData.businessSize,
                      )?.label || "Selecione..."}
                      <ChevronDown size={16} className="text-slate-400" />
                    </button>
                    {isBusinessSizeOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                        {/* CORREÇÃO: Usa o businessOptions para fazer o map */}
                        {businessOptions.map((size) => (
                          <button
                            key={size.value}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                businessSize: size.value,
                              }));
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
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={15}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex gap-4">
                <div className="w-40">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
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
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    placeholder="Rua, Av..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-32">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    Número
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    placeholder="123"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    placeholder="Apto 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                      UF
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      maxLength={2}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium uppercase text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-6">
                <h3 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
                  <Briefcase size={20} /> Quase lá!
                </h3>
                <p className="text-sm text-indigo-700">
                  Defina uma senha segura para proteger os dados financeiros da
                  sua empresa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full p-3.5 bg-slate-50 border rounded-xl outline-none transition-all text-slate-800 font-medium pr-10 ${passwordStrength >= 3 ? "border-emerald-200 focus:ring-2 focus:ring-emerald-500" : "border-slate-200 focus:ring-2 focus:ring-indigo-500"}`}
                    placeholder="••••••••"
                  />
                  {formData.password && (
                    <div className="absolute right-3 top-3.5">
                      {passwordStrength >= 3 ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                    </div>
                  )}
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                  Confirme a Senha
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full p-3.5 bg-slate-50 border rounded-xl outline-none transition-all text-slate-800 font-medium pr-10 ${passwordsMatch ? "border-emerald-200 focus:ring-emerald-500" : "border-slate-200 focus:ring-indigo-500"}`}
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

          <div className="pt-6 flex gap-3 mt-4 border-t border-slate-50">
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