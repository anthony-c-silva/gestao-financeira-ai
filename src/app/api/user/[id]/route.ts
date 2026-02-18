import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Contact from "@/models/Contact";
import bcrypt from "bcryptjs";
import { getAuthSession } from "@/lib/auth";

// ATUALIZAR DADOS (PUT)
export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const params = await props.params;
    const { id } = params;

    // SEGURANÇA: Impede alterar outro usuário
    if (id !== session.id) {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const body = await req.json();

    // Se tiver senha, criptografa
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    } else {
      delete body.password;
    }

    // Impede alteração de campos sensíveis de sistema via API direta
    delete body.emailVerified;
    delete body.verificationCode;
    delete body.resetPasswordToken;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 },
      );
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
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const params = await props.params;
    const { id } = params;

    // SEGURANÇA CRÍTICA: Só permite deletar a própria conta
    if (id !== session.id) {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    // Limpeza completa em cascata
    await Transaction.deleteMany({ userId: id });
    await Contact.deleteMany({ userId: id });
    // Adicione aqui outros models se houver (ex: Category)
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Conta excluída com sucesso." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    return NextResponse.json(
      { message: "Erro ao deletar conta" },
      { status: 500 },
    );
  }
}
