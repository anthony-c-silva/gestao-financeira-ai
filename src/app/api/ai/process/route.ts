import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { message: "Configuração de API pendente" },
        { status: 500 }
      );
    }

    const { text, userId } = await req.json();

    if (!text) {
      return NextResponse.json(
        { message: "Áudio não identificado" },
        { status: 400 }
      );
    }

    // 1. BUSCAR AS CATEGORIAS DO USUÁRIO NO BANCO
    await connectDB();
    let categoriesList = "Alimentação, Transporte, Lazer, Contas Fixas, Outros"; // Fallback padrão

    if (userId) {
      // Busca categorias de SAÍDA e ENTRADA para dar contexto completo
      const userCategories = await Category.find({ userId }).select("name");
      if (userCategories.length > 0) {
        categoriesList = userCategories.map((c) => c.name).join(", ");
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 2. INJETAR AS CATEGORIAS NO PROMPT
    const prompt = `
      Você é um assistente financeiro (JSON mode).
      DATA ATUAL: ${new Date().toISOString()}
      
      SUAS CATEGORIAS VÁLIDAS: ${categoriesList}
      (Use APENAS uma dessas categorias. Se não encaixar perfeitamente, use "Outros" ou a mais próxima).
      
      COMANDO DO USUÁRIO: "${text}"
      
      RETORNE APENAS JSON (sem markdown):
      {
        "amount": number (use 0 se não encontrar),
        "description": string (resumida),
        "category": string (exatamente uma das categorias acima),
        "type": "INCOME" ou "EXPENSE" (baseado no contexto: gastou/pagou = EXPENSE, recebeu/ganhou = INCOME),
        "paymentMethod": "Pix", "Dinheiro", "Cartão Crédito", "Cartão Débito" ou "Boleto" (chute Pix se incerto),
        "date": "YYYY-MM-DD"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Erro no processamento IA:", error);
    return NextResponse.json(
      { message: "Não foi possível processar o comando de voz." },
      { status: 500 }
    );
  }
}