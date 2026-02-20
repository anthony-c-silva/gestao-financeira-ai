import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ message: "Sessão inválida" }, { status: 401 });
    }

    await connectDB();

    // @ts-expect-error: Next.js HMR Mongoose Model union type mismatch
    const user = await User.findById(session.id).select(
      "-password -verificationCode -resetPasswordToken",
    );

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Erro na rota /api/auth/me:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
