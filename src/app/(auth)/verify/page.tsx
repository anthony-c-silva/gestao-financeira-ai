"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { Toast } from "@/components/ui/Toast";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pega o email da URL se vier (ex: /verify?email=joao@teste.com)
  const emailFromUrl = searchParams.get("email");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailFromUrl) {
      setToast({ message: "E-mail não identificado. Faça login novamente.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFromUrl, code }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setToast({ message: data.message || "Código inválido.", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Erro de conexão.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Conta Verificada!</h2>
        <p className="text-slate-500 text-center text-sm mb-6">
          Agora você tem acesso total ao sistema. Redirecionando...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Verifique seu E-mail</h1>
        <p className="text-slate-500 text-sm text-center mt-2">
          Enviamos um código de 6 dígitos para: <br/>
          <span className="font-bold text-slate-800">{emailFromUrl}</span>
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-brand-100/50 border border-slate-100">
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 text-center">
              Digite o Código
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full p-4 text-center text-3xl tracking-[0.5em] font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-900 outline-none transition-all text-slate-800"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-4 bg-brand-900 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Confirmar Código"}
          </button>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// O componente principal precisa envolver o conteúdo em Suspense por causa do useSearchParams
export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-slate-50">
      <Suspense fallback={<div className="text-center">Carregando...</div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}