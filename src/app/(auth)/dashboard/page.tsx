"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";

// 1. Definição da interface para corrigir o erro de 'any'
interface UserData {
  name: string;
  email?: string;
  // Adicione outros campos se necessário
}

export default function Dashboard() {
  // 2. Uso da interface no useState e inicialização correta
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 3. O setTimeout resolve o erro "Calling setState synchronously"
    // movendo a execução para o próximo ciclo de processamento (macrotask)
    const timeout = setTimeout(() => {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error("Erro ao processar dados do usuário:", error);
          localStorage.removeItem("user"); // Limpa dados corrompidos se houver
        }
      } else {
        // Opcional: Redirecionar se não houver usuário
        // router.push("/login")
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Evita renderizar a tela antes de carregar o usuário
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            FS
          </div>
          <span className="font-bold text-slate-800 text-lg">
            Finanças Simples
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            <User size={16} />
            {/* Aqui agora o TypeScript reconhece a propriedade .name */}
            <span>{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-slate-500">Bem-vindo ao seu painel financeiro.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-sm font-medium text-slate-400 uppercase">
              Saldo Total
            </span>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              R$ 0,00
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-sm font-medium text-slate-400 uppercase">
              Receitas (Mês)
            </span>
            <div className="mt-2 text-3xl font-bold text-emerald-600">
              R$ 0,00
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-sm font-medium text-slate-400 uppercase">
              Despesas (Mês)
            </span>
            <div className="mt-2 text-3xl font-bold text-rose-600">R$ 0,00</div>
          </div>
        </div>
      </main>
    </div>
  );
}
