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

    setDocument(value);
    setHasError(false); // Limpa erro ao digitar
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setHasError(false); // Limpa erro ao digitar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasError(false);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHasError(true);
        setToast({ message: data.message || "Erro ao entrar.", type: "error" });
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      setHasError(true);
      setToast({ message: "Erro de conexão.", type: "error" });
      setLoading(false);
    }
  };

  // Helper para classes de input (Padronizado com o Cadastro)
  const getInputClass = () => `
    w-full p-2.5 pl-4 bg-slate-50 border rounded-xl outline-none transition-all font-medium text-slate-800 text-sm
    ${hasError 
      ? "border-rose-400 focus:ring-2 focus:ring-rose-200" 
      : "border-slate-200 focus:ring-2 focus:ring-brand-900"}
  `;

  return (
    // LAYOUT CENTRALIZADO (justify-center items-center)
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      
      {/* Container com largura limitada (Compacto) */}
      <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        
        <Logo />

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-brand-100/50 border border-slate-100 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
              CPF ou CNPJ
            </label>
            <input
              type="text"
              required
              placeholder="000.000.000-00"
              value={document}
              onChange={handleDocumentChange}
              className={getInputClass()}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                className={`${getInputClass()} pr-10`} // pr-10 para o ícone não ficar em cima do texto
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-900 transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar senha" : "Ver senha"}
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
            // Botão Compacto (py-3.5 e rounded-xl)
            className="w-full py-3.5 bg-brand-900 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "Entrar no Sistema"}
          </button>
        </form>

        <div className="mt-8 text-center">
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