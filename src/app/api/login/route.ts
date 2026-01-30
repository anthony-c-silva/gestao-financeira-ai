import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb"; // <--- CORREÇÃO: Sem as chaves { }
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { document, password } = body;

    if (!document || !password) {
      return NextResponse.json(
        { message: "Documento e senha são obrigatórios." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // 1. ESTRATÉGIA DE BUSCA FLEXÍVEL (Legado vs Novo)
    // Limpa o documento para buscar apenas números
    const cleanDocument = document.replace(/\D/g, "");

    // Busca: Ou pelo documento limpo, Ou pelo documento exatamente como foi digitado (caso o banco tenha pontos)
    const user = await User.findOne({
      $or: [{ document: cleanDocument }, { document: document }],
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado. Verifique os dados." },
        { status: 404 },
      );
    }

    // 2. ESTRATÉGIA DE SENHA HÍBRIDA (Bcrypt vs Texto Puro)
    let isPasswordValid = false;
    let needsMigration = false;

    // Tenta comparar usando Bcrypt (Seguro)
    if (user.password && user.password.startsWith("$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    }
    // Se não parece hash ou a comparação falhou, testa texto puro (Legado)
    else if (user.password === password) {
      isPasswordValid = true;
      needsMigration = true; // Marca para atualizar a segurança
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Senha incorreta." },
        { status: 401 },
      );
    }

    // 3. AUTO-MIGRAÇÃO DE SEGURANÇA
    // Se a senha estava insegura (texto puro), criptografa e salva agora
    if (needsMigration) {
      console.log(`🔒 Migrando segurança do usuário: ${user.name}`);
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      // Garante que o documento salvo fique no padrão limpo também
      user.document = cleanDocument;
      await user.save();
    }

    // Prepara objeto para retorno (sem senha)
    const userObject = user.toObject();
    delete userObject.password;

    return NextResponse.json({
      message: "Login realizado com sucesso!",
      user: userObject,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
