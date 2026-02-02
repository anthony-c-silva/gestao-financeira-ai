import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Category from "@/models/Category";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mail"; // Importa o envio de e-mail

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const {
      name,
      companyName,
      document,
      type,
      businessSize,
      email,
      phone,
      password,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
    } = await req.json();

    // 1. Validações de PJ
    if (type === "PJ") {
      if (!businessSize) {
        return NextResponse.json(
          { message: "Selecione o enquadramento da empresa (MEI, ME, etc)." },
          { status: 400 },
        );
      }
      if (!companyName) {
        return NextResponse.json(
          { message: "A Razão Social é obrigatória para contas empresariais." },
          { status: 400 },
        );
      }
    }

    // 2. Limpeza de Documento (Segurança e Padronização)
    const cleanDocument = document.replace(/\D/g, "");

    const userExists = await User.findOne({
      $or: [{ email }, { document: cleanDocument }],
    });

    if (userExists) {
      return NextResponse.json(
        { message: "Usuário ou Documento já cadastrado." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Gera o Token de Verificação (6 Dígitos)
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. CRIA O USUÁRIO (Com trava de segurança)
    const newUser = await User.create({
      name,
      companyName: type === "PJ" ? companyName : null,
      document: cleanDocument, // Salva limpo
      type,
      businessSize: type === "PJ" ? businessSize : null,
      email,
      phone,
      password: hashedPassword,
      address: {
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      },
      // Campos de Segurança
      verificationToken,
      emailVerified: false, // Começa bloqueado até confirmar o e-mail
    });

    // 5. DEFINE AS CATEGORIAS PADRÃO (KIT INICIAL)
    const defaultCategories = [
      // DESPESAS (Saídas)
      { name: "Alimentação", type: "EXPENSE", icon: "Utensils", color: "text-orange-500", bg: "bg-orange-100" },
      { name: "Transporte", type: "EXPENSE", icon: "Car", color: "text-blue-500", bg: "bg-blue-100" },
      { name: "Combustível", type: "EXPENSE", icon: "Fuel", color: "text-red-500", bg: "bg-red-100" },
      { name: "Aluguel", type: "EXPENSE", icon: "Home", color: "text-purple-500", bg: "bg-purple-100" },
      { name: "Oficina", type: "EXPENSE", icon: "Wrench", color: "text-slate-600", bg: "bg-slate-200" },
      { name: "Contas Fixas", type: "EXPENSE", icon: "Zap", color: "text-yellow-500", bg: "bg-yellow-100" },
      { name: "Outros", type: "EXPENSE", icon: "MoreHorizontal", color: "text-slate-500", bg: "bg-slate-100" },

      // RECEITAS (Entradas)
      { name: "Vendas", type: "INCOME", icon: "Briefcase", color: "text-emerald-500", bg: "bg-emerald-100" },
      { name: "Serviços", type: "INCOME", icon: "Wrench", color: "text-cyan-500", bg: "bg-cyan-100" },
      { name: "Salários", type: "INCOME", icon: "Users", color: "text-indigo-500", bg: "bg-indigo-100" },
      { name: "Outros", type: "INCOME", icon: "MoreHorizontal", color: "text-slate-500", bg: "bg-slate-100" },
    ];

    const categoriesToCreate = defaultCategories.map((cat) => ({
      ...cat,
      userId: newUser._id,
      isDefault: true,
    }));

    await Category.insertMany(categoriesToCreate);

    // 6. Envia o E-mail de Verificação
    const emailResult = await sendVerificationEmail(email, verificationToken);

    if (!emailResult.success) {
      console.error("Aviso: Usuário criado, mas falha ao enviar email:", emailResult.error);
    }

    return NextResponse.json(
      { message: "Cadastro realizado! Enviamos um código para o seu e-mail." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { message: "Erro ao registrar usuário." },
      { status: 500 },
    );
  }
}