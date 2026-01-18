import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Contact from "@/models/Contact";
import bcrypt from "bcryptjs";

// ATUALIZAR DADOS (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    // É necessário aguardar o params na versão nova do Next.js
    const { id } = await params;
    
    // Pega os dados enviados pelo Modal
    const body = await req.json();

    // Se tiver senha, criptografa
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    } else {
      delete body.password;
    }

    // AQUI É O PULO DO GATO: { new: true } retorna o dado JÁ atualizado
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: body }, // $set garante que vamos atualizar campos específicos (como companyName)
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

// DELETAR CONTA (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Limpeza completa
    await Transaction.deleteMany({ userId: id });
    await Contact.deleteMany({ userId: id });
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Conta excluída com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    return NextResponse.json({ message: "Erro ao deletar conta" }, { status: 500 });
  }
}