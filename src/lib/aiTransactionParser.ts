import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";

export interface ParsedTransaction {
  amount: number; // em centavos
  description: string;
  category: string;
  type: "INCOME" | "EXPENSE";
  paymentMethod: string;
  date: string; // YYYY-MM-DD
}

/**
 * Usa o Gemini para transformar um comando em linguagem natural (voz, texto do
 * app ou mensagem de WhatsApp) em uma transação estruturada, usando as
 * categorias reais do usuário como contexto. Compartilhado entre
 * /api/ai/process (voz/texto no app) e o bot de WhatsApp.
 */
export async function parseTransactionText(
  text: string,
  userId?: string,
): Promise<ParsedTransaction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  await connectDB();
  let categoriesList = "Alimentação, Transporte, Lazer, Contas Fixas, Outros";

  if (userId) {
    const userCategories = await Category.find({ userId }).select("name");
    if (userCategories.length > 0) {
      categoriesList = userCategories.map((c) => c.name).join(", ");
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  const data = JSON.parse(jsonString) as ParsedTransaction;

  // A IA devolve decimais (ex: 15.50). Multiplicamos por 100 e arredondamos
  // para garantir um número inteiro limpo em centavos (1550).
  if (typeof data.amount === "number") {
    data.amount = Math.round(data.amount * 100);
  }

  return data;
}
