import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  console.log("--- 🤖 INICIANDO IA ---");

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ ERRO FATAL: GEMINI_API_KEY não encontrada.");
      return NextResponse.json(
        { message: "Chave de API não configurada" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const text = body.text;

    console.log(`🎤 Texto recebido: "${text}"`);

    if (!text) {
      return NextResponse.json({ message: "Texto vazio" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // CORREÇÃO: Usando o nome oficial do modelo Flash (sem 'latest' e sem 'pro')
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

    console.log("⏳ Enviando para o Google Gemini...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    console.log("📩 Resposta Bruta da IA:", textResponse);

    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    console.log("✅ JSON Processado:", data);

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ ERRO NO PROCESSAMENTO:", error);

    let errorMessage = "Falha interna na IA";

    if (error instanceof Error) {
      errorMessage = error.message;

      if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
        console.error(
          "\n⚠️ AVISO: O modelo ainda não foi encontrado." +
            "\nSOLUÇÃO: O 'Default Project' do Google às vezes buga." +
            "\nCrie uma NOVA CHAVE selecionando 'Create API Key in NEW PROJECT' no site do Google AI Studio."
        );
      }
    }

    return NextResponse.json(
      {
        message: "Falha interna na IA",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
