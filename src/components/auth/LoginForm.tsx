"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Toast } from "@/components/ui/Toast";

export function LoginForm() {
  const router = useRouter();
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Novo estado para controlar o erro visual (bordas vermelhas)
  const [hasError, setHasError] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpa erro anterior ao tentar enviar
    setHasError(false);

    if (!document || !password) {
      setHasError(true); // Ativa borda vermelha e tremida
      setToast({
        message: "Por favor, preencha todos os campos.",
        type: "error",
      });
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

        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setHasError(true); // Ativa borda vermelha e tremida no erro da API
        setToast({
          message: data.message || "Credenciais inválidas.",
          type: "error",
        });
      }
    } catch (error) {
      setToast({ message: "Erro de conexão. Tente novamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para resetar o erro quando o usuário digita
  const handleInputChange = (setter: (val: string) => void, value: string) => {
    if (hasError) setHasError(false);
    setter(value);
  };

  // Classes dinâmicas para o input (Normal vs Erro)
  const inputBaseClass =
    "w-full p-4 border rounded-2xl shadow-sm outline-none transition-all";
  const inputNormalClass =
    "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500 text-slate-800";
  const inputErrorClass =
    "bg-rose-50 border-rose-500 text-rose-900 placeholder-rose-300 focus:ring-2 focus:ring-rose-500 animate-shake";

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-slate-50">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-xl">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Financeiro.AI
        </h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">
          Gestão inteligente para o seu negócio
        </p>
      </div>

      <form
        className="w-full max-w-sm mx-auto space-y-6"
        onSubmit={handleSubmit}
      >
        <div>
          <label
            className={`block text-xs font-bold uppercase mb-1 ml-1 ${hasError ? "text-rose-500" : "text-slate-500"}`}
          >
            CPF ou CNPJ
          </label>
          <input
            type="text"
            value={document}
            onChange={(e) => handleInputChange(setDocument, e.target.value)}
            placeholder="000.000.000-00"
            className={`${inputBaseClass} ${hasError ? inputErrorClass : inputNormalClass}`}
          />
        </div>
        <div>
          <label
            className={`block text-xs font-bold uppercase mb-1 ml-1 ${hasError ? "text-rose-500" : "text-slate-500"}`}
          >
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => handleInputChange(setPassword, e.target.value)}
            placeholder="••••••••"
            className={`${inputBaseClass} ${hasError ? inputErrorClass : inputNormalClass}`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={24} className="animate-spin" /> Entrando...
            </>
          ) : (
            "Entrar no Sistema"
          )}
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-3 text-center">
        <Link
          href="/register"
          className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
        >
          Cadastre-se grátis
        </Link>
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
