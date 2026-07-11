import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { parseTransactionText } from "@/lib/aiTransactionParser";
import { sendWhatsAppMessage, verifyWebhookSignature } from "@/lib/whatsapp";

// --- VERIFICAÇÃO DO WEBHOOK (handshake exigido pela Meta ao configurar a URL) ---
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ message: "Token inválido" }, { status: 403 });
}

const formatCurrency = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function handleBalanceCommand(userId: string, to: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const stats = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: "PAID",
        date: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);

  const income = stats.find((s) => s._id === "INCOME")?.total || 0;
  const expense = stats.find((s) => s._id === "EXPENSE")?.total || 0;
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  await sendWhatsAppMessage(
    to,
    `📊 Resumo de ${monthLabel}\n\n✅ Entradas: ${formatCurrency(income)}\n❌ Saídas: ${formatCurrency(expense)}\n💰 Saldo: ${formatCurrency(income - expense)}`,
  );
}

// --- RECEBIMENTO DE MENSAGENS ---
export async function POST(req: Request) {
  const rawBody = await req.text();

  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("WhatsApp webhook: assinatura inválida, requisição rejeitada.");
    return NextResponse.json({ message: "Assinatura inválida" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // A Meta também envia webhooks de "status" (entregue/lido) — não são mensagens novas.
    if (!message) {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const from: string = message.from;

    if (message.type !== "text" || !message.text?.body) {
      await sendWhatsAppMessage(
        from,
        "Por enquanto só entendo mensagens de texto. Ex: \"Almoço 30 reais no débito\".",
      );
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    const text: string = message.text.body.trim();

    await connectDB();

    // Casa o número que mandou a mensagem com o telefone cadastrado no perfil
    // (guardamos o telefone sem DDI; o WhatsApp manda com DDI, então comparamos o final).
    const suffix = from.replace(/\D/g, "").slice(-9);
    const user = await User.findOne({ phone: { $regex: `${suffix}$` } });

    if (!user) {
      await sendWhatsAppMessage(
        from,
        "Não encontrei nenhuma conta do Smart Fin com este número. Confira o telefone cadastrado no app em Minha Conta.",
      );
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    const normalizedText = text.toLowerCase();
    if (["saldo", "resumo", "balanco", "balanço"].includes(normalizedText)) {
      await handleBalanceCommand(user._id.toString(), from);
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    if (!process.env.GEMINI_API_KEY) {
      await sendWhatsAppMessage(from, "O assistente de IA está temporariamente indisponível.");
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    const parsed = await parseTransactionText(text, user._id.toString());

    if (!parsed.amount || parsed.amount <= 0) {
      await sendWhatsAppMessage(
        from,
        "Não entendi o valor. Tente algo como \"Mercado 150 reais no crédito\" ou \"Recebi 2000 de salário\".",
      );
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    const transaction = await Transaction.create({
      userId: user._id,
      type: parsed.type === "INCOME" ? "INCOME" : "EXPENSE",
      amount: parsed.amount,
      description: parsed.description || text,
      category: parsed.category || "Outros",
      paymentMethod: parsed.paymentMethod || "Pix",
      date: parsed.date ? new Date(parsed.date) : new Date(),
      status: "PENDING",
    });

    const icon = transaction.type === "INCOME" ? "✅" : "💸";
    await sendWhatsAppMessage(
      from,
      `${icon} Registrado no Smart Fin:\n\n${transaction.description}\n${formatCurrency(transaction.amount)} • ${transaction.category} • ${transaction.paymentMethod}\n\nStatus: Pendente (confirme o pagamento/recebimento no app).`,
    );

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Erro no webhook do WhatsApp:", error);
    // Sempre responde 200 para a Meta não ficar reenviando o mesmo evento em loop.
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
