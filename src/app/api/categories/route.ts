import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";

interface CategoryQuery {
  userId: string;
  type?: string;
}

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

    const count = await Category.countDocuments({ userId });

    if (count === 0) {
      // DEFINIÇÃO DE CORES HEXADECIMAIS PADRÃO
      const defaultCategories = [
        // DESPESAS
        {
          name: "Alimentação",
          type: "EXPENSE",
          icon: "Utensils",
          color: "#f97316",
          bg: "#ffedd5",
        }, // Orange
        {
          name: "Transporte",
          type: "EXPENSE",
          icon: "Car",
          color: "#3b82f6",
          bg: "#dbeafe",
        }, // Blue
        {
          name: "Combustível",
          type: "EXPENSE",
          icon: "Fuel",
          color: "#ef4444",
          bg: "#fee2e2",
        }, // Red
        {
          name: "Aluguel",
          type: "EXPENSE",
          icon: "Home",
          color: "#a855f7",
          bg: "#f3e8ff",
        }, // Purple
        {
          name: "Oficina",
          type: "EXPENSE",
          icon: "Wrench",
          color: "#475569",
          bg: "#e2e8f0",
        }, // Slate
        {
          name: "Contas Fixas",
          type: "EXPENSE",
          icon: "Zap",
          color: "#eab308",
          bg: "#fef9c3",
        }, // Yellow
        {
          name: "Outros",
          type: "EXPENSE",
          icon: "MoreHorizontal",
          color: "#64748b",
          bg: "#f1f5f9",
        }, // Gray

        // RECEITAS
        {
          name: "Vendas",
          type: "INCOME",
          icon: "Briefcase",
          color: "#10b981",
          bg: "#d1fae5",
        }, // Emerald
        {
          name: "Serviços",
          type: "INCOME",
          icon: "Wrench",
          color: "#06b6d4",
          bg: "#cffafe",
        }, // Cyan
        {
          name: "Salários",
          type: "INCOME",
          icon: "Users",
          color: "#6366f1",
          bg: "#e0e7ff",
        }, // Indigo
        {
          name: "Outros",
          type: "INCOME",
          icon: "MoreHorizontal",
          color: "#64748b",
          bg: "#f1f5f9",
        }, // Gray
      ];

      const categoriesToCreate = defaultCategories.map((cat) => ({
        ...cat,
        userId,
        isDefault: true,
      }));

      await Category.insertMany(categoriesToCreate);
    }

    const query: CategoryQuery = { userId };
    if (type) query.type = type;

    const categories = await Category.find(query).sort({ name: 1 });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

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
