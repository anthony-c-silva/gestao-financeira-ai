import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Transaction from "@/models/Transaction";

// EDITAR CATEGORIA (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { message: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    // Proteção: Não permite editar categorias padrão do sistema
    if (category.isDefault) {
      return NextResponse.json(
        { message: "Não é possível editar categorias padrão." },
        { status: 403 },
      );
    }

    // Verifica duplicidade de nome (se mudou o nome)
    if (body.name && body.name !== category.name) {
      const exists = await Category.findOne({
        userId: category.userId,
        name: body.name,
        type: category.type,
        _id: { $ne: id }, // Exclui ela mesma da busca
      });

      if (exists) {
        return NextResponse.json(
          { message: "Já existe outra categoria com esse nome." },
          { status: 409 },
        );
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: body.name,
        icon: body.icon,
        color: body.color,
        bg: body.bg,
      },
      { new: true },
    );

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Erro ao atualizar" }, { status: 500 });
  }
}

// EXCLUIR CATEGORIA (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { message: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    // Proteção: Não permite apagar categorias padrão
    if (category.isDefault) {
      return NextResponse.json(
        { message: "Não é possível excluir categorias padrão do sistema." },
        { status: 403 },
      );
    }

    // Opcional: Verificar se há transações usando essa categoria
    // Se houver, podemos impedir ou mover para "Outros".
    // Aqui, vamos impedir por segurança.
    const usageCount = await Transaction.countDocuments({
      category: category.name,
      userId: category.userId,
    });

    if (usageCount > 0) {
      return NextResponse.json(
        {
          message: `Esta categoria é usada em ${usageCount} transações. Edite as transações antes de excluir.`,
        },
        { status: 400 },
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Categoria excluída com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ message: "Erro ao excluir" }, { status: 500 });
  }
}
