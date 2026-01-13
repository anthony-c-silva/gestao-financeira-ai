import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { message: "Configuração de API pendente" },
        { status: 500 }
      );
    }

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { message: "Áudio não identificado" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Versão definida pelo seu sucesso nos testes
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Você é um assistente financeiro (JSON mode).
      DATA ATUAL: ${new Date().toISOString()}
      
      CATEGORIAS: Alimentação, Transporte, Lazer, Contas Fixas, Vendas, Serviços, Salários, Outros.
      
      ANALISE: "${text}"
      
      RETORNE APENAS JSON VÁLIDO (sem markdown):
      {
        "amount": number (use 0 se não encontrar),
        "description": string,
        "category": string (escolha a melhor),
        "type": "INCOME" ou "EXPENSE",
        "paymentMethod": "Pix", "Dinheiro", "Cartão Crédito", "Cartão Débito" ou "Boleto",
        "date": "YYYY-MM-DD"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Limpeza de segurança para garantir apenas o JSON
    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Mantemos apenas um log simples de erro no servidor para monitoramento
    console.error("Erro no processamento IA:", error);

    return NextResponse.json(
      { message: "Não foi possível processar o comando de voz." },
      { status: 500 }
    );
  }
}
