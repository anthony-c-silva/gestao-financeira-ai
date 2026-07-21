import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Category from "@/models/Category";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mail";
import { BUSINESS_SIZES, DEFAULT_CATEGORIES } from "@/constants/business";

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
      // Antes bastava ser não-vazio: um "mei" minúsculo era gravado como está e
      // depois não batia com a chave de BUSINESS_SIZES, fazendo o resumo fiscal
      // cair no "OTHER" e desligar o alerta de teto de faturamento sem avisar.
      //
      // `hasOwn` e não `in`: o operador `in` enxerga o Object.prototype, então
      // um businessSize "toString" ou "constructor" passaria por aqui.
      if (!Object.hasOwn(BUSINESS_SIZES, businessSize)) {
        return NextResponse.json(
          { message: "Enquadramento inválido. Use MEI, ME, EPP ou OTHER." },
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
    const existingUser = await User.findOne({ email });

    // LÓGICA DE RE-CADASTRO:
    // Se o usuário existe e JÁ verificou o email -> Bloqueia.
    // Se o usuário existe e NÃO verificou -> Permite atualizar e reenviar código.
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado e verificado." },
        { status: 400 },
      );
    }

    const docExists = await User.findOne({ document: cleanDocument });
    // Se o documento existe em OUTRO usuário já verificado, bloqueia.
    if (docExists && docExists.email !== email && docExists.emailVerified) {
      return NextResponse.json(
        { message: "Este documento (CPF/CNPJ) já está cadastrado." },
        { status: 400 },
      );
    }

    // 4. Hash da Senha e Geração do Código
    const hashedPassword = await bcrypt.hash(password, 10);
    // Gera código de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // --- LOG DE SEGURANÇA NO TERMINAL (Para você ver o código se o e-mail falhar) ---
    console.log("========================================");
    console.log(`📧 TENTATIVA DE CADASTRO: ${email}`);
    console.log(`🔑 CÓDIGO GERADO: ${verificationCode}`);
    console.log("========================================");

    let userId;

    if (existingUser && !existingUser.emailVerified) {
      // ATUALIZAÇÃO (Usuário tentou antes mas não verificou)
      existingUser.name = name;
      existingUser.companyName = type === "PJ" ? companyName : undefined;
      existingUser.document = cleanDocument;
      existingUser.type = type;
      existingUser.businessSize = type === "PJ" ? businessSize : undefined;
      existingUser.phone = phone.replace(/\D/g, "");
      existingUser.password = hashedPassword;
      existingUser.verificationCode = verificationCode; // Atualiza o código
      existingUser.verificationCodeSentAt = new Date();
      existingUser.address = {
        cep: cep?.replace(/\D/g, ""),
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      };
      await existingUser.save();
      userId = existingUser._id;
    } else {
      // CRIAÇÃO (Usuário novo)
      const newUser = await User.create({
        name,
        companyName: type === "PJ" ? companyName : undefined,
        document: cleanDocument,
        type,
        businessSize: type === "PJ" ? businessSize : undefined,
        email,
        phone: phone.replace(/\D/g, ""),
        password: hashedPassword,
        verificationCode, // Salva o código
        verificationCodeSentAt: new Date(),
        emailVerified: false,
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
      userId = newUser._id;

      // Cria as categorias padrão para o novo usuário
      const categoriesToCreate = DEFAULT_CATEGORIES.map((cat) => ({
        userId: newUser._id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.text,
        bg: cat.bg,
        isDefault: true,
      }));

      await Category.insertMany(categoriesToCreate);
    }

    // 7. Envia o E-mail de Verificação
    try {
      // Passamos os 3 argumentos que o mail.ts espera: Nome, Email, Código
      await sendVerificationEmail(name, email, verificationCode);
    } catch (emailError) {
      console.error("Erro ao enviar e-mail (verifique o console para o código):", emailError);
      // Não bloqueamos o sucesso, pois o usuário pode ver o código no console do servidor
    }

    return NextResponse.json(
      { message: "Cadastro realizado! Verifique seu e-mail." },
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