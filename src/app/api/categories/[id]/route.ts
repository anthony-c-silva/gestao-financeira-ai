import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { getAuthSession } from "@/lib/auth";

interface CategoryQuery {
  userId: string;
  type?: string;
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    // userId vem da sessão, não da URL
    const type = searchParams.get("type");

    const count = await Category.countDocuments({ userId: session.id });

    if (count === 0) {
      // SEED INICIAL DE CATEGORIAS
      const defaultCategories = [
        // DESPESAS
        {
          name: "Alimentação",
          type: "EXPENSE",
          icon: "Utensils",
          color: "#f97316",
          bg: "#ffedd5",
        },
        {
          name: "Transporte",
          type: "EXPENSE",
          icon: "Car",
          color: "#3b82f6",
          bg: "#dbeafe",
        },
        {
          name: "Combustível",
          type: "EXPENSE",
          icon: "Fuel",
          color: "#ef4444",
          bg: "#fee2e2",
        },
        {
          name: "Aluguel",
          type: "EXPENSE",
          icon: "Home",
          color: "#a855f7",
          bg: "#f3e8ff",
        },
        {
          name: "Oficina",
          type: "EXPENSE",
          icon: "Wrench",
          color: "#475569",
          bg: "#e2e8f0",
        },
        {
          name: "Contas Fixas",
          type: "EXPENSE",
          icon: "Zap",
          color: "#eab308",
          bg: "#fef9c3",
        },
        {
          name: "Outros",
          type: "EXPENSE",
          icon: "MoreHorizontal",
          color: "#64748b",
          bg: "#f1f5f9",
        },

        // RECEITAS
        {
          name: "Vendas",
          type: "INCOME",
          icon: "Briefcase",
          color: "#10b981",
          bg: "#d1fae5",
        },
        {
          name: "Serviços",
          type: "INCOME",
          icon: "Wrench",
          color: "#06b6d4",
          bg: "#cffafe",
        },
        {
          name: "Salários",
          type: "INCOME",
          icon: "Users",
          color: "#6366f1",
          bg: "#e0e7ff",
        },
        {
          name: "Outros",
          type: "INCOME",
          icon: "MoreHorizontal",
          color: "#64748b",
          bg: "#f1f5f9",
        },
      ];

      const categoriesToCreate = defaultCategories.map((cat) => ({
        ...cat,
        userId: session.id, // Usa o ID da sessão
        isDefault: true,
      }));

      await Category.insertMany(categoriesToCreate);
    }

    const query: CategoryQuery = { userId: session.id };
    if (type) query.type = type;

    const categories = await Category.find(query).sort({ name: 1 });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Erro categorias:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    if (!body.name || !body.type) {
      return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
    }

    const exists = await Category.findOne({
      userId: session.id,
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
      userId: session.id, // Força o ID da sessão
      name: body.name,
      type: body.type,
      color: body.color || "#64748b",
      bg: body.bg || "#f1f5f9",
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
