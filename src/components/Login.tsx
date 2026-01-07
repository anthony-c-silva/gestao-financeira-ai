"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (document && password) {
      // TODO: Aqui entra a chamada real para a API de login
      console.log("Login com:", document);
      router.push("/dashboard");
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  };

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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          Finanças Simples
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Gestão descomplicada para você
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto w-full"
      >
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
            CPF ou CNPJ
          </label>
          <input
            type="text"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            placeholder="000.000.000-00"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-2"
        >
          Entrar no Sistema
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-3 text-center">
        <Link
          href="/register"
          className="text-indigo-600 font-bold text-sm hover:underline"
        >
          Criar uma nova conta
        </Link>
        <button
          type="button"
          className="text-slate-400 font-medium text-sm hover:text-slate-600"
        >
          Esqueci minha senha
        </button>
      </div>
    </div>
  );
}
