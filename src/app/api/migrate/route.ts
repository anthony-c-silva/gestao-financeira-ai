import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";

// Mapa de Tradução (Antigo -> Novo)
const COLOR_MAP: Record<string, { color: string; bg: string }> = {
  // Laranjas
  "text-orange-500": { color: "#f97316", bg: "#ffedd5" },
  "text-orange-600": { color: "#f97316", bg: "#ffedd5" },
  "bg-orange-100": { color: "#f97316", bg: "#ffedd5" },

  // Azuis
  "text-blue-500": { color: "#3b82f6", bg: "#dbeafe" },
  "text-blue-600": { color: "#3b82f6", bg: "#dbeafe" },
  "bg-blue-100": { color: "#3b82f6", bg: "#dbeafe" },

  // Vermelhos
  "text-red-500": { color: "#ef4444", bg: "#fee2e2" },
  "text-red-600": { color: "#ef4444", bg: "#fee2e2" },
  "bg-red-100": { color: "#ef4444", bg: "#fee2e2" },

  // Roxos
  "text-purple-500": { color: "#a855f7", bg: "#f3e8ff" },
  "text-purple-600": { color: "#a855f7", bg: "#f3e8ff" },
  "bg-purple-100": { color: "#a855f7", bg: "#f3e8ff" },

  // Amarelos
  "text-yellow-500": { color: "#eab308", bg: "#fef9c3" },
  "text-yellow-600": { color: "#eab308", bg: "#fef9c3" },
  "bg-yellow-100": { color: "#eab308", bg: "#fef9c3" },

  // Verdes (Emerald)
  "text-emerald-500": { color: "#10b981", bg: "#d1fae5" },
  "text-emerald-600": { color: "#10b981", bg: "#d1fae5" },
  "bg-emerald-100": { color: "#10b981", bg: "#d1fae5" },

  // Cianos
  "text-cyan-500": { color: "#06b6d4", bg: "#cffafe" },
  "text-cyan-600": { color: "#06b6d4", bg: "#cffafe" },
  "bg-cyan-100": { color: "#06b6d4", bg: "#cffafe" },

  // Índigos
  "text-indigo-500": { color: "#6366f1", bg: "#e0e7ff" },
  "text-indigo-600": { color: "#6366f1", bg: "#e0e7ff" },
  "bg-indigo-100": { color: "#6366f1", bg: "#e0e7ff" },

  // Rosas
  "text-pink-500": { color: "#ec4899", bg: "#fce7f3" },
  "text-pink-600": { color: "#ec4899", bg: "#fce7f3" },
  "bg-pink-100": { color: "#ec4899", bg: "#fce7f3" },

  // Cinzas/Slates
  "text-slate-500": { color: "#64748b", bg: "#f1f5f9" },
  "text-slate-600": { color: "#64748b", bg: "#f1f5f9" },
  "bg-slate-100": { color: "#64748b", bg: "#f1f5f9" },
  "bg-slate-200": { color: "#475569", bg: "#e2e8f0" }, // Oficina antiga
};

export async function GET() {
  try {
    await connectDB();

    // Busca todas as categorias que ainda usam classes CSS (começam com "text-" ou "bg-")
    const categoriesToUpdate = await Category.find({
      $or: [{ color: /^text-/ }, { bg: /^bg-/ }],
    });

    let updatedCount = 0;

    for (const cat of categoriesToUpdate) {
      // Tenta encontrar a cor nova baseada na antiga
      const newColors = COLOR_MAP[cat.color] || COLOR_MAP[cat.bg];

      if (newColors) {
        cat.color = newColors.color;
        cat.bg = newColors.bg;
        await cat.save();
        updatedCount++;
      } else {
        // Fallback se não achar: vira Cinza Padrão
        cat.color = "#64748b";
        cat.bg = "#f1f5f9";
        await cat.save();
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: "Migração concluída com sucesso!",
      total: categoriesToUpdate.length,
      updated: updatedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Erro na migração", error },
      { status: 500 },
    );
  }
}
