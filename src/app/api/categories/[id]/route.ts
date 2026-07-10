import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Transaction from "@/models/Transaction";
import { getAuthSession } from "@/lib/auth";

// NOTA: GET/POST "por id" não fazem sentido aqui (POST não usa o [id] da rota).
// Essa rota existe para EDITAR (PUT) e EXCLUIR (DELETE) uma categoria específica.
// Listagem/criação seguem em /api/categories (route.ts), fonte única de verdade.

// EDITAR CATEGORIA (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const category = await Category.findOne({ _id: id, userId: session.id });
    if (!category) {
      return NextResponse.json(
        { message: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    if (category.isDefault) {
      return NextResponse.json(
        { message: "Categorias padrão não podem ser editadas." },
        { status: 403 },
      );
    }

    const newName = typeof body.name === "string" ? body.name.trim() : category.name;

    if (newName && newName !== category.name) {
      const nameTaken = await Category.findOne({
        userId: session.id,
        name: newName,
        type: category.type,
        _id: { $ne: id },
      });
      if (nameTaken) {
        return NextResponse.json(
          { message: "Já existe uma categoria com este nome." },
          { status: 409 },
        );
      }
    }

    const oldName = category.name;

    category.name = newName;
    if (body.color) category.color = body.color;
    if (body.bg) category.bg = body.bg;
    if (body.icon) category.icon = body.icon;
    await category.save();

    // Propaga o rename para as transações já lançadas, senão elas "perdem" a categoria nos relatórios
    if (newName !== oldName) {
      await Transaction.updateMany(
        { userId: session.id, category: oldName },
        { $set: { category: newName } },
      );
    }

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error("Erro ao editar categoria:", error);
    return NextResponse.json(
      { message: "Erro ao editar categoria" },
      { status: 500 },
    );
  }
}

// EXCLUIR CATEGORIA (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const category = await Category.findOne({ _id: id, userId: session.id });
    if (!category) {
      return NextResponse.json(
        { message: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    if (category.isDefault) {
      return NextResponse.json(
        { message: "Categorias padrão não podem ser excluídas." },
        { status: 403 },
      );
    }

    const inUse = await Transaction.exists({
      userId: session.id,
      category: category.name,
    });
    if (inUse) {
      return NextResponse.json(
        {
          message:
            "Esta categoria possui transações vinculadas e não pode ser excluída.",
        },
        { status: 409 },
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({ message: "Categoria excluída" }, { status: 200 });
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    return NextResponse.json(
      { message: "Erro ao excluir categoria" },
      { status: 500 },
    );
  }
}
