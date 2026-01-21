import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";

interface CategoryQuery {
  userId: string;
  type?: string;
}

// LISTAR CATEGORIAS (COM AUTO-CORREÇÃO PARA USUÁRIOS ANTIGOS)
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");

    if (!userId) {
      return NextResponse.json(
        { message: "Usuário obrigatório" },
        { status: 400 },
      );
    }

    // 1. Verifica se o usuário já tem categorias cadastradas
    const count = await Category.countDocuments({ userId });

    // 2. SE NÃO TIVER (Usuário Antigo), CRIA AS PADRÕES AGORA (Lazy Migration)
    if (count === 0) {
      const defaultCategories = [
        // DESPESAS
        {
          name: "Alimentação",
          type: "EXPENSE",
          icon: "Utensils",
          color: "text-orange-500",
          bg: "bg-orange-100",
        },
        {
          name: "Transporte",
          type: "EXPENSE",
          icon: "Car",
          color: "text-blue-500",
          bg: "bg-blue-100",
        },
        {
          name: "Combustível",
          type: "EXPENSE",
          icon: "Fuel",
          color: "text-red-500",
          bg: "bg-red-100",
        },
        {
          name: "Aluguel",
          type: "EXPENSE",
          icon: "Home",
          color: "text-purple-500",
          bg: "bg-purple-100",
        },
        {
          name: "Oficina",
          type: "EXPENSE",
          icon: "Wrench",
          color: "text-slate-600",
          bg: "bg-slate-200",
        },
        {
          name: "Contas Fixas",
          type: "EXPENSE",
          icon: "Zap",
          color: "text-yellow-500",
          bg: "bg-yellow-100",
        },
        {
          name: "Outros",
          type: "EXPENSE",
          icon: "MoreHorizontal",
          color: "text-slate-500",
          bg: "bg-slate-100",
        },

        // RECEITAS
        {
          name: "Vendas",
          type: "INCOME",
          icon: "Briefcase",
          color: "text-emerald-500",
          bg: "bg-emerald-100",
        },
        {
          name: "Serviços",
          type: "INCOME",
          icon: "Wrench",
          color: "text-cyan-500",
          bg: "bg-cyan-100",
        },
        {
          name: "Salários",
          type: "INCOME",
          icon: "Users",
          color: "text-indigo-500",
          bg: "bg-indigo-100",
        },
        {
          name: "Outros",
          type: "INCOME",
          icon: "MoreHorizontal",
          color: "text-slate-500",
          bg: "bg-slate-100",
        },
      ];

      const categoriesToCreate = defaultCategories.map((cat) => ({
        ...cat,
        userId, // Vincula ao usuário antigo que fez a requisição
        isDefault: true,
      }));

      await Category.insertMany(categoriesToCreate);
      // O código segue abaixo para buscar o que acabou de criar
    }

    // 3. Busca normal (agora garantimos que sempre haverá dados)
    const query: CategoryQuery = { userId };
    if (type) query.type = type;

    const categories = await Category.find(query).sort({ name: 1 });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

// CRIAR NOVA CATEGORIA (Mantém igual)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.userId || !body.name || !body.type) {
      return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
    }

    const exists = await Category.findOne({
      userId: body.userId,
      name: body.name,
      type: body.type,
    });

    if (exists) {
      return NextResponse.json(
        { message: "Categoria já existe." },
        { status: 409 },
      );
    }

    const newCategory = await Category.create({
      userId: body.userId,
      name: body.name,
      type: body.type,
      color: body.color || "text-slate-500",
      bg: body.bg || "bg-slate-100",
      icon: body.icon || "Tag",
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao criar categoria" },
      { status: 500 },
    );
  }
}
