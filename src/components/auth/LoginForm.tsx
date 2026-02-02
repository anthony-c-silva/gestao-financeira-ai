"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { Logo } from "@/components/ui/Logo"; // Importando a Logo

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

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setToast({ message: "Login realizado com sucesso!", type: "success" });
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setHasError(true);
        // Se o erro for de verificação de email, podemos tratar aqui no futuro
        setToast({ message: data.message || "Credenciais inválidas.", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Erro de conexão.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClass = "w-full p-4 border rounded-2xl shadow-sm outline-none transition-all";
  const inputNormalClass = "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500 text-slate-800";
  const inputErrorClass = "bg-rose-50 border-rose-500 text-rose-900 placeholder-rose-300 focus:ring-2 focus:ring-rose-500 animate-shake";

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-slate-50">
      <div className="mb-8 flex flex-col items-center">
          <Logo/>
      </div>

      <form className="w-full max-w-sm mx-auto space-y-6" onSubmit={handleSubmit}>
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
              className={`${inputBaseClass} ${hasError ? inputErrorClass : inputNormalClass} pr-12`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 focus:outline-none cursor-pointer"
              onMouseDown={() => setShowPassword(true)}
              onMouseUp={() => setShowPassword(false)}
              onMouseLeave={() => setShowPassword(false)}
              onTouchStart={() => setShowPassword(true)}
              onTouchEnd={() => setShowPassword(false)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          {/* LINK NOVO: ESQUECI MINHA SENHA */}
          <div className="flex justify-end mt-2">
            <Link 
              href={`/forgot-password?doc=${encodeURIComponent(document)}`}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : "Entrar no Sistema"}
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-3 text-center">
        <p className="text-slate-500 text-sm">
          Não tem conta?{" "}
          <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
            Cadastre-se grátis
          </Link>
        </p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}