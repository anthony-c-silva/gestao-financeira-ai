"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Mail, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0); 
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Redireciona se não tiver e-mail na URL
  useEffect(() => {
    if (!email) {
      router.push("/login");
    }
  }, [email, router]);

  // Lógica do Contador
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ message: "Conta verificada com sucesso!", type: "success" });
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setToast({ message: data.message || "Código inválido.", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Erro de conexão.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    setCountdown(30); 

    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ message: "Novo código enviado!", type: "success" });
      } else {
        setToast({ message: data.message || "Erro ao reenviar.", type: "error" });
        setCountdown(0); 
      }
    } catch (error) {
      setToast({ message: "Erro de conexão.", type: "error" });
      setCountdown(0);
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      
      {/* Logo no Topo */}
      <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <Logo />
      </div>

      <div className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-brand-100/50 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-900 border border-brand-100 shadow-sm">
            <Mail size={28} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Verifique seu e-mail
          </h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Enviamos um código de verificação para:
            <br />
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">
              {email}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 text-center">
              Código de 6 Dígitos
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-center text-3xl font-black tracking-[0.5em] text-slate-800 placeholder-slate-300 transition-all font-mono"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
            {code.length === 6 && (
              <div className="absolute right-4 top-[38px] text-emerald-500 animate-in zoom-in duration-300">
                <CheckCircle2 size={24} />
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-4 bg-brand-900 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 hover:bg-brand-700 hover:shadow-brand-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "Confirmar Código"}
          </button>

          {/* Área de Reenvio */}
          <div className="pt-2 text-center border-t border-slate-50">
            <p className="text-xs text-slate-400 mb-2">Não recebeu o código?</p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={countdown > 0 || resending}
              className="text-xs font-bold text-brand-900 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {resending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} className={countdown > 0 ? "" : "group-hover:rotate-180 transition-transform"} />
              )}
              {countdown > 0 ? `Aguarde ${countdown}s para reenviar` : "Reenviar código agora"}
            </button>
          </div>
        </form>

        {/* --- RODAPÉ DE NAVEGAÇÃO --- */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
          <Link 
            href="/register"
            className="block text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Digitou errado? <span className="font-bold underline text-slate-500 hover:text-brand-900">Cadastrar novamente</span>
          </Link>

          <Link 
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-900 transition-colors py-2 rounded-xl hover:bg-slate-50 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Voltar para o Login
          </Link>
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

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-900" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}