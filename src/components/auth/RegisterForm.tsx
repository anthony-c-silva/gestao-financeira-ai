"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    email: "",
    address: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Conta criada com sucesso! Faça login.");
        router.push("/");
      } else {
        alert(data.message || "Erro ao cadastrar.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ALTERAÇÃO AQUI: bg-white para destacar
    <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
      <header className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          className="p-3 bg-slate-50 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Cadastro</h1>
          <p className="text-sm text-slate-400">
            Preencha seus dados para começar
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 pb-4">
        {/* Campos atualizados para bg-slate-50 no input */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
            Nome Completo / Razão Social
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
              CPF ou CNPJ
            </label>
            <input
              type="text"
              required
              value={formData.document}
              onChange={(e) =>
                setFormData({ ...formData, document: e.target.value })
              }
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
              WhatsApp
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
            E-mail
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
            Endereço
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
            Definir Senha
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg mt-4 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {loading ? "Finalizando..." : "Finalizar Cadastro"}
        </button>
      </form>
    </div>
  );
}
