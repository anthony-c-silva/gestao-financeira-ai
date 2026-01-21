import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Category from "@/models/Category"; // Importamos o modelo novo
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();

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

    // Validações de PJ
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

    const userExists = await User.findOne({
      $or: [{ email }, { document }],
    });

    if (userExists) {
      return NextResponse.json(
        { message: "Usuário ou Documento já cadastrado." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. CRIA O USUÁRIO
    const newUser = await User.create({
      name,
      companyName: type === "PJ" ? companyName : null,
      document,
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
    });

    // 2. DEFINE AS CATEGORIAS PADRÃO (KIT INICIAL)
    const defaultCategories = [
      // DESPESAS (Saídas)
      {
        name: "Alimentação",
        type: "EXPENSE",
        icon: "Utensils",
        color: "text-orange-500",
        bg: "bg-orange-100",
      },
      {
        name: "Transporte",
        type: "EXPENSE",
        icon: "Car",
        color: "text-blue-500",
        bg: "bg-blue-100",
      },
      {
        name: "Combustível",
        type: "EXPENSE",
        icon: "Fuel",
        color: "text-red-500",
        bg: "bg-red-100",
      }, // NOVO
      {
        name: "Aluguel",
        type: "EXPENSE",
        icon: "Home",
        color: "text-purple-500",
        bg: "bg-purple-100",
      }, // NOVO
      {
        name: "Oficina",
        type: "EXPENSE",
        icon: "Wrench",
        color: "text-slate-600",
        bg: "bg-slate-200",
      }, // NOVO
      {
        name: "Contas Fixas",
        type: "EXPENSE",
        icon: "Zap",
        color: "text-yellow-500",
        bg: "bg-yellow-100",
      },
      {
        name: "Outros",
        type: "EXPENSE",
        icon: "MoreHorizontal",
        color: "text-slate-500",
        bg: "bg-slate-100",
      },

      // RECEITAS (Entradas)
      {
        name: "Vendas",
        type: "INCOME",
        icon: "Briefcase",
        color: "text-emerald-500",
        bg: "bg-emerald-100",
      },
      {
        name: "Serviços",
        type: "INCOME",
        icon: "Wrench",
        color: "text-cyan-500",
        bg: "bg-cyan-100",
      },
      {
        name: "Salários",
        type: "INCOME",
        icon: "Users",
        color: "text-indigo-500",
        bg: "bg-indigo-100",
      },
      {
        name: "Outros",
        type: "INCOME",
        icon: "MoreHorizontal",
        color: "text-slate-500",
        bg: "bg-slate-100",
      },
    ];

    // Adiciona o ID do usuário em cada categoria
    const categoriesToCreate = defaultCategories.map((cat) => ({
      ...cat,
      userId: newUser._id,
      isDefault: true, // Marca como padrão
    }));

    // 3. SALVA TUDO NO BANCO DE UMA VEZ
    await Category.insertMany(categoriesToCreate);

    return NextResponse.json(
      { message: "Usuário criado com sucesso!" },
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
