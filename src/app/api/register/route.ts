import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Category from "@/models/Category";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mail";
import { DEFAULT_CATEGORIES } from "@/constants/business"; // <--- IMPORTAÇÃO DAS CORES NOVAS

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

    // 1. Validações de PJ (Lógica Mantida)
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

    // 2. Limpeza de Documento
    const cleanDocument = document.replace(/\D/g, "");

    // 3. Verificações de Duplicidade
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado." },
        { status: 400 },
      );
    }

    const docExists = await User.findOne({ document: cleanDocument });
    if (docExists) {
      return NextResponse.json(
        { message: "Este documento (CPF/CNPJ) já está cadastrado." },
        { status: 400 },
      );
    }

    // 4. Hash da Senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Criação do Usuário
    const newUser = await User.create({
      name,
      companyName: type === "PJ" ? companyName : undefined,
      document: cleanDocument,
      type,
      businessSize: type === "PJ" ? businessSize : undefined,
      email,
      phone: phone.replace(/\D/g, ""),
      password: hashedPassword,
      address: {
        cep: cep?.replace(/\D/g, ""),
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      },
    });

    // 6. Criação das Categorias Padrão (COM AS NOVAS CORES DO CLIENTE)
    // Aqui usamos a lista importada de 'constants/business.ts' que já está com o Azul e Verde corretos.
    const categoriesToCreate = DEFAULT_CATEGORIES.map((cat: any) => ({
      userId: newUser._id,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.text, // Mapeamos 'text' (do arquivo constants) para 'color' (do banco)
      bg: cat.bg,      // Mapeamos 'bg'
      isDefault: true,
    }));

    await Category.insertMany(categoriesToCreate);

    // 7. Envia o E-mail de Verificação (Lógica Mantida)
    try {
      await sendVerificationEmail(newUser.name, newUser.email);
    } catch (emailError) {
      console.error("Erro ao enviar e-mail:", emailError);
      // Não bloqueia o cadastro se o e-mail falhar, mas loga o erro
    }

    return NextResponse.json(
      { message: "Cadastro realizado com sucesso!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { message: "Ocorreu um erro ao criar a conta." },
      { status: 500 },
    );
  }
}