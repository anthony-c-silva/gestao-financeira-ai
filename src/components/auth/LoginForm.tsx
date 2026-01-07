"use client";

import React, { useState } from "react";
import { BadgeDollarSign, User, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: cpfCnpj,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Salva dados básicos do usuário para usar no dashboard
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        alert(data.message || "Erro ao fazer login");
      }
    } catch (error) {
      console.error("Erro de login:", error);
      alert("Ocorreu um erro ao tentar entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <BadgeDollarSign size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Finanças Simples
          </h1>
          <p className="text-gray-500 text-sm">
            Gestão descomplicada para você
          </p>
        </div>

        <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
          <div>
            <label
              htmlFor="identity"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
            >
              CPF ou CNPJ
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                <User size={18} />
              </div>
              <input
                id="identity"
                type="text"
                required
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
            >
              Senha
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/30 transform transition hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <Link
              href="/register"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Criar uma nova conta
            </Link>
            <Link
              href="/recuperar-senha"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
