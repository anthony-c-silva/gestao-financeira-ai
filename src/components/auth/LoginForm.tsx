"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { Logo } from "@/components/ui/Logo";

export function LoginForm() {
  const router = useRouter();
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // --- MÁSCARA DE CPF/CNPJ ---
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 14) value = value.slice(0, 14);

    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      value = value.replace(/^(\d{2})(\d)/, "$1.$2");
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
      value = value.replace(/(\d{4})(\d)/, "$1-$2");
    }

    if (hasError) setHasError(false);
    setDocument(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasError(false);

    if (!document || !password) {
      setHasError(true);
      setToast({ message: "Por favor, preencha todos os campos.", type: "error" });
      return;
    }

    setLoading(true);

    // CORREÇÃO DE LOGICA: Remove pontos e traços antes de enviar
    const cleanDocument = document.replace(/\D/g, "");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          document: cleanDocument, // Envia limpo
          password 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Salva dados básicos (opcional, pois o cookie é o principal)
        localStorage.setItem("user", JSON.stringify(data.user));
        setToast({ message: "Login realizado com sucesso!", type: "success" });
        
        // Pequeno delay para garantir que o cookie foi setado antes do redirect
        setTimeout(() => router.push("/dashboard"), 500);
      } else {
        setHasError(true);
        setToast({ message: data.message || "Credenciais inválidas.", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Erro de conexão.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Estilos padronizados (Small & Compact)
  const inputBaseClass = "w-full p-2.5 bg-slate-50 border rounded-xl outline-none transition-all font-medium text-slate-800 text-sm";
  const inputNormalClass = "border-slate-200 focus:ring-2 focus:ring-brand-900";
  const inputErrorClass = "border-rose-400 focus:ring-2 focus:ring-rose-200";

  return (
    // Layout Centralizado
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      
      {/* Container Limitado */}
      <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        
        <Logo />

        {/* Cartão Branco (Consistência com Cadastro) */}
        <form 
          className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-brand-100/50 border border-slate-100 space-y-4" 
          onSubmit={handleSubmit}
        >
          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ml-1 ${hasError ? "text-rose-500" : "text-slate-500"}`}>
              CPF ou CNPJ
            </label>
            <input
              type="text"
              value={document}
              onChange={handleDocumentChange}
              placeholder="000.000.000-00"
              className={`${inputBaseClass} ${hasError ? inputErrorClass : inputNormalClass}`}
            />
          </div>
          
          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ml-1 ${hasError ? "text-rose-500" : "text-slate-500"}`}>
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { if(hasError) setHasError(false); setPassword(e.target.value); }}
                placeholder="••••••••"
                className={`${inputBaseClass} ${hasError ? inputErrorClass : inputNormalClass} pr-10`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-900 focus:outline-none cursor-pointer"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                title="Segure para ver a senha"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Link Esqueci Minha Senha */}
            <div className="flex justify-end mt-2">
              <Link 
                href={`/forgot-password?doc=${encodeURIComponent(document)}`}
                className="text-xs font-bold text-brand-900 hover:text-brand-700 transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-900 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "Entrar no Sistema"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            Não tem conta?{" "}
            <Link href="/register" className="text-brand-900 font-bold hover:text-brand-700 transition-colors">
              Criar agora
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