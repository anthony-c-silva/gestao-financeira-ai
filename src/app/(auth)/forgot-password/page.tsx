"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, KeyRound, ArrowRight, CheckCircle, ArrowLeft, Eye, EyeOff, ShieldCheck, User } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { Logo } from "@/components/ui/Logo";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const docFromUrl = searchParams.get("doc") || "";

  const [step, setStep] = useState<"REQUEST" | "CODE" | "SUCCESS">("REQUEST");
  const [loading, setLoading] = useState(false);
  
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const formatDocument = (value: string) => {
    let numbers = value.replace(/\D/g, "");
    if (numbers.length > 14) numbers = numbers.slice(0, 14);

    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return numbers
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
  };

  useEffect(() => {
    if (docFromUrl) {
      setDocument(formatDocument(docFromUrl));
    }
  }, [docFromUrl]);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocument(formatDocument(e.target.value));
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !document) {
      setToast({ message: "Preencha o CPF/CNPJ e o E-mail.", type: "error" });
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, document }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setCode("");
        setNewPassword("");
        setStep("CODE");
        setToast({ message: data.message || "Código enviado com sucesso!", type: "success" });
      } else {
        setToast({ message: data.message || "Dados incorretos.", type: "error" });
      }

    } catch (error) {
      setToast({ message: "Erro de conexão com o servidor.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setToast({ message: "O código deve ter 6 dígitos.", type: "error" });
      return;
    }
    if (newPassword.length < 3) {
      setToast({ message: "A senha é muito curta.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setStep("SUCCESS");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setToast({ message: data.message || "Erro ao alterar senha.", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Erro de conexão.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      
      {/* Logo Centralizada */}
      <div className="mb-6 flex justify-center animate-in fade-in slide-in-from-top-4 duration-500">
        <Logo />
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-brand-100/50 border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Cabeçalho do Card */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {step === "REQUEST" && "Recuperar Acesso"}
            {step === "CODE" && "Código Enviado"}
            {step === "SUCCESS" && "Sucesso!"}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {step === "REQUEST" && "Informe seus dados para receber o código."}
            {step === "CODE" && (
              <>
                Enviamos o código para:<br/>
                <span className="font-bold text-brand-900">{email}</span>
              </>
            )}
            {step === "SUCCESS" && "Sua senha foi redefinida."}
          </p>
        </div>

        {step === "SUCCESS" ? (
          <div className="flex flex-col items-center justify-center py-4 animate-in zoom-in duration-500">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
              <CheckCircle size={32} />
            </div>
            <p className="text-slate-500 text-center text-sm mb-6">
              Você será redirecionado para o login em instantes.
            </p>
            <Link href="/login" className="w-full text-center bg-brand-900 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200">
              Ir para Login
            </Link>
          </div>
        ) : (
          <>
            {step === "REQUEST" ? (
              <form onSubmit={handleRequestCode} className="space-y-4 animate-in slide-in-from-left-4" autoComplete="off">
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    CPF ou CNPJ
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={document}
                      onChange={handleDocumentChange}
                      placeholder="000.000.000-00"
                      className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-900 outline-none transition-all text-slate-800 font-medium text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    E-mail Cadastrado
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Confirme seu e-mail"
                      className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-900 outline-none transition-all text-slate-800 font-medium text-sm"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-brand-900 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <>Enviar Código <ArrowRight size={18} /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-in slide-in-from-right-4" autoComplete="off">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Código de Segurança</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full p-2.5 pl-10 text-lg tracking-widest font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-900 outline-none transition-all text-center text-slate-800"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nova Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha segura"
                      className="w-full p-2.5 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-900 outline-none transition-all text-slate-800 font-medium text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 text-slate-400 hover:text-brand-900 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : "Redefinir Senha"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setStep("REQUEST")}
                    className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Voltar e corrigir dados
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-brand-900 transition-colors text-sm">
          <ArrowLeft size={16} /> Cancelar e voltar
        </Link>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center p-4 bg-slate-50">
      <Suspense fallback={<div className="text-center"><Loader2 className="animate-spin text-brand-900 mx-auto" /></div>}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}