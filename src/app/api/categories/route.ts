import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { getAuthSession } from "@/lib/auth";
import { DEFAULT_CATEGORIES } from "@/constants/business";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const count = await Category.countDocuments()
      .where("userId")
      .equals(session.id);

    if (count === 0) {
      // Fonte única de verdade para categorias-padrão: src/constants/business.ts
      const categoriesToCreate = DEFAULT_CATEGORIES.map((cat) => ({
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.text,
        bg: cat.bg,
        userId: session.id,
        isDefault: true,
      }));

      await Category.insertMany(categoriesToCreate);
    }

    const dbQuery = Category.find().where("userId").equals(session.id);

    if (type) {
      dbQuery.where("type").equals(type);
    }

    const categories = await dbQuery.sort({ name: 1 });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    // Agora utilizamos a variável 'error' registando a falha no servidor
    console.error("Erro GET categorias:", error);
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

    const exists = await Category.findOne()
      .where("userId")
      .equals(session.id)
      .where("name")
      .equals(body.name)
      .where("type")
      .equals(body.type);

    if (exists) {
      return NextResponse.json(
        { message: "Categoria já existe." },
        { status: 409 },
      );
    }

 
    const newCategory = await Category.create({
      userId: session.id,
      name: body.name,
      type: body.type,
      color: body.color || "#64748b",
      bg: body.bg || "#f1f5f9",
      icon: body.icon || "Tag",
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {

    console.error("Erro POST categorias:", error);
    return NextResponse.json(
      { message: "Erro ao criar categoria" },
      { status: 500 },
    );
  }
}
