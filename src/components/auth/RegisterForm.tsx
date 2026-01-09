"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

// Se você não criou o arquivo de constantes ainda, defino aqui para facilitar:
const BUSINESS_SIZES = {
  MEI: { label: "MEI - Até R$ 81k/ano", limit: 81000 },
  ME: { label: "ME - Até R$ 360k/ano", limit: 360000 },
  EPP: { label: "EPP - Até R$ 4.8M/ano", limit: 4800000 },
  OTHER: { label: "Outros / Acima do limite", limit: 0 },
};

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [personType, setPersonType] = useState<"PF" | "PJ">("PF");

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    name: "",
    document: "",
    type: "PF",
    businessSize: "", // NOVO ESTADO
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

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", test: (pass: string) => pass.length >= 8 },
    { label: "Letra Maiúscula", test: (pass: string) => /[A-Z]/.test(pass) },
    { label: "Número", test: (pass: string) => /[0-9]/.test(pass) },
    {
      label: "Caractere Especial",
      test: (pass: string) => /[^A-Za-z0-9]/.test(pass),
    },
  ];

  const checkCEP = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "");

    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`
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
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const maskCep = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .substring(0, 9);
  };

  const maskDocument = (value: string, type: "PF" | "PJ") => {
    let v = value.replace(/\D/g, "");
    if (type === "PF") {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      return v.substring(0, 14);
    } else {
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
      return v.substring(0, 18);
    }
  };

  const maskPhone = (value: string) => {
    let v = value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v.substring(0, 15);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.password]);

  useEffect(() => {
    if (formData.confirmPassword) {
      setPasswordsMatch(formData.password === formData.confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "document") {
      finalValue = maskDocument(value, personType);
    } else if (name === "phone") {
      finalValue = maskPhone(value);
    } else if (name === "cep") {
      finalValue = maskCep(value);
      if (finalValue.length === 9) {
        checkCEP(finalValue);
      }
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      // Validação básica da etapa 1
      const basicValidation =
        formData.name && formData.document && formData.email && formData.phone;
      // Se for PJ, EXIGE o businessSize
      if (personType === "PJ") {
        return basicValidation && formData.businessSize !== "";
      }
      return basicValidation;
    }
    if (step === 2) {
      return (
        formData.cep &&
        formData.street &&
        formData.number &&
        formData.city &&
        formData.state
      );
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      if (personType === "PJ" && !formData.businessSize && currentStep === 1) {
        alert("Por favor, selecione o enquadramento da sua empresa.");
      } else {
        alert("Preencha todos os campos obrigatórios para continuar.");
      }
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }
    if (passwordStrength < 3) {
      alert("A senha precisa ser mais forte.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          document: formData.document.replace(/\D/g, ""),
          phone: formData.phone.replace(/\D/g, ""),
          cep: formData.cep.replace(/\D/g, ""),
          type: personType, // Envia o tipo correto (PF ou PJ)
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Conta criada com sucesso! Faça login.");
        router.push("/");
      } else {
        alert(data.message || "Erro ao cadastrar.");
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="w-full max-w-lg bg-white md:p-8 p-6 rounded-3xl shadow-lg border border-slate-100 my-4 mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Novo Cadastro</h1>
            <p className="text-xs text-slate-400">
              Etapa {currentStep} de {totalSteps}
            </p>
          </div>
        </div>
      </header>

      {/* Barra de Progresso */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              step <= currentStep ? "bg-indigo-600" : "bg-slate-100"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pb-2">
        {/* ETAPA 1: DADOS PESSOAIS */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setPersonType("PF");
                  setFormData({ ...formData, document: "", businessSize: "" });
                }}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                  personType === "PF"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Pessoa Física
              </button>
              <button
                type="button"
                onClick={() => {
                  setPersonType("PJ");
                  setFormData({ ...formData, document: "" });
                }}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                  personType === "PJ"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Empresa
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                {personType === "PF" ? "Nome Completo" : "Razão Social"}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
                placeholder="Digite seu nome"
              />
            </div>

            {/* SELEÇÃO DE ENQUADRAMENTO (APENAS PARA PJ) */}
            {personType === "PJ" && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 flex items-center gap-1">
                  Enquadramento <Building2 size={12} />
                </label>
                <select
                  name="businessSize"
                  value={formData.businessSize}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800 appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Selecione o porte da empresa
                  </option>
                  <option value="MEI">{BUSINESS_SIZES.MEI.label}</option>
                  <option value="ME">{BUSINESS_SIZES.ME.label}</option>
                  <option value="EPP">{BUSINESS_SIZES.EPP.label}</option>
                  <option value="OTHER">{BUSINESS_SIZES.OTHER.label}</option>
                </select>
                <p className="text-[10px] text-slate-400 ml-1 mt-1">
                  Usaremos isso para calcular seu limite de faturamento anual.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                  {personType === "PF" ? "CPF" : "CNPJ"}
                </label>
                <input
                  type="text"
                  name="document"
                  value={formData.document}
                  onChange={handleChange}
                  placeholder={
                    personType === "PF"
                      ? "000.000.000-00"
                      : "00.000.000/0000-00"
                  }
                  maxLength={personType === "PF" ? 14 : 18}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                  WhatsApp / Celular
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
              />
            </div>
          </div>
        )}

        {/* ETAPA 2: ENDEREÇO OTIMIZADO */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-[1.5fr_1fr] gap-3">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                  CEP
                </label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  placeholder="00000-000"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-mono text-slate-800"
                />
                {loadingCep && (
                  <div className="absolute right-3 top-8 animate-spin text-indigo-600">
                    <Loader2 size={16} />
                  </div>
                )}
              </div>
              <div>
                <div className="w-full h-full flex items-end pb-3 text-xs text-slate-400">
                  Digite o CEP para buscar
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                  UF
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  maxLength={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800 uppercase text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                Endereço
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
              />
            </div>

            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                  Número
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                  Comp.{" "}
                  <span className="text-slate-300 font-normal lowercase">
                    (opc)
                  </span>
                </label>
                <input
                  type="text"
                  name="complement"
                  value={formData.complement}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                Bairro
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
              />
            </div>
          </div>
        )}

        {/* ETAPA 3: SEGURANÇA */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                Senha de Acesso
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
              />

              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500 min-w-[30px] text-right">
                    {getStrengthText()}
                  </span>
                </div>
              )}

              {formData.password && passwordStrength < 4 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {passwordRequirements.map((req, idx) => {
                    const met = req.test(formData.password);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 text-xs ${
                          met
                            ? "text-emerald-600 font-medium"
                            : "text-slate-400"
                        }`}
                      >
                        {met ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-slate-300" />
                        )}
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              )}
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
                  className={`w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all text-sm text-slate-800 ${
                    !passwordsMatch && formData.confirmPassword
                      ? "border-red-300 focus:ring-red-200"
                      : "border-slate-200 focus:ring-indigo-500"
                  }`}
                />
                {formData.confirmPassword && (
                  <div className="absolute right-3 top-3">
                    {passwordsMatch ? (
                      <Check size={18} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={18} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NAVEGAÇÃO ENTRE ETAPAS */}
        <div className="pt-4 flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
            >
              Voltar
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
            >
              Próximo
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !passwordsMatch || passwordStrength < 3}
              className="flex-[2] py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  Finalizar Cadastro
                  <Check size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
