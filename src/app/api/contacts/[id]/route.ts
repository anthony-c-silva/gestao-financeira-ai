import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contact from "@/models/Contact";
import Transaction from "@/models/Transaction";
import { getAuthSession } from "@/lib/auth";

// EDITAR CONTATO (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Garante que o contato pertence ao usuário logado
    const currentContact = await Contact.findOne({ _id: id, userId: session.id });
    if (!currentContact) {
      return NextResponse.json(
        { message: "Contato não encontrado" },
        { status: 404 }
      );
    }

    // 1. Verifica duplicidade de NOME (se mudou)
    if (body.name && body.name !== currentContact.name) {
      const existsName = await Contact.findOne({
        userId: currentContact.userId,
        name: body.name,
        type: body.type || currentContact.type,
        _id: { $ne: id }, // Exclui ele mesmo da busca
      });
      if (existsName) {
        return NextResponse.json(
          { message: "Já existe um contato com este nome." },
          { status: 409 }
        );
      }
    }

    // 2. Verifica duplicidade de DOCUMENTO
    if (
      body.document &&
      body.document.trim() !== "" &&
      body.document !== currentContact.document
    ) {
      const existsDoc = await Contact.findOne({
        userId: currentContact.userId,
        document: body.document,
        _id: { $ne: id },
      });
      if (existsDoc) {
        return NextResponse.json(
          { message: "Este CPF/CNPJ já está em uso." },
          { status: 409 }
        );
      }
    }

    // 3. Verifica duplicidade de TELEFONE
    if (
      body.phone &&
      body.phone.trim() !== "" &&
      body.phone !== currentContact.phone
    ) {
      const existsPhone = await Contact.findOne({
        userId: currentContact.userId,
        phone: body.phone,
        _id: { $ne: id },
      });
      if (existsPhone) {
        return NextResponse.json(
          { message: "Este telefone já está em uso." },
          { status: 409 }
        );
      }
    }

    // Remove campos que não devem ser alterados via body (userId nunca muda de dono)
    const safeBody = { ...body };
    delete safeBody.userId;
    delete safeBody._id;

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { $set: safeBody },
      { new: true }
    );

    return NextResponse.json(updatedContact, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Erro ao atualizar" }, { status: 500 });
  }
}

// EXCLUIR CONTATO (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    // Garante que o contato pertence ao usuário logado antes de qualquer mutação
    const existing = await Contact.findOne({ _id: id, userId: session.id });
    if (!existing) {
      return NextResponse.json(
        { message: "Contato não encontrado" },
        { status: 404 }
      );
    }

    await Transaction.updateMany(
      { contactId: id, userId: session.id },
      { $unset: { contactId: "" } }
    );

    await Contact.findByIdAndDelete(id);

    return NextResponse.json({ message: "Contato excluído" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Erro ao excluir" }, { status: 500 });
  }
}
