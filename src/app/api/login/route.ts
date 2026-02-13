import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT, JWTPayload } from "jose";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// 1. Interface explícita removendo o "any"
interface UserPayload extends JWTPayload {
  id: string;
  name: string;
  email: string;
  document: string;
  type: string;
}

// Função utilitária para assinar o JWT tipada
async function signToken(payload: UserPayload) {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback_inseguro_mude_no_env"
  );
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Sessão dura 7 dias
    .sign(secret);
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // Tipamos o JSON de entrada para garantir segurança
    const body = await req.json();
    const document = String(body.document);
    const password = String(body.password);

    // --- A SOLUÇÃO PROFISSIONAL ---
    // Usamos a Query Builder API do Mongoose.
    // Isso evita o erro de "Object literal may only specify known properties"
    // e mantém o ESLint feliz por não usar "any".
    const user = await User.findOne()
      .where("document").equals(document)
      .select("+password");

    if (!user) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          message: "E-mail não verificado.", 
          code: "EMAIL_NOT_VERIFIED",
          email: user.email 
        },
        { status: 403 }
      );
    }

    // Prepara os dados limpos usando a interface definida
    const userObject: UserPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      document: user.document,
      type: user.type
    };

    // Gera o Token JWT
    const token = await signToken(userObject);

    // AWAIT COOKIES() - No Next.js recente, cookies() é uma Promise!
    const cookieStore = await cookies();
    
    cookieStore.set({
      name: "smartfin_session",
      value: token,
      httpOnly: true, // Proteção XSS
      secure: process.env.NODE_ENV === "production", // HTTPS em produção
      sameSite: "strict", // Proteção CSRF
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return NextResponse.json(
      {
        message: "Login realizado com sucesso!",
        user: userObject,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}