import crypto from "crypto";

const GRAPH_API_VERSION = "v25.0";

/**
 * Envia uma mensagem de texto via WhatsApp Cloud API (Meta) para o número informado.
 * `to` deve estar no formato E.164 sem o "+" (ex: "5551999998888").
 */
export async function sendWhatsAppMessage(to: string, body: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("WhatsApp: WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID não configurados.");
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      },
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error("WhatsApp: falha ao enviar mensagem:", res.status, errBody);
    }
  } catch (error) {
    console.error("WhatsApp: erro de rede ao enviar mensagem:", error);
  }
}

/**
 * Valida a assinatura HMAC-SHA256 que a Meta envia no header
 * "x-hub-signature-256" para garantir que o webhook realmente veio da Meta.
 * Se WHATSAPP_APP_SECRET não estiver configurado, pula a validação (modo
 * simplificado para teste pessoal) — mas isso deve ser evitado em produção.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true; // sem segredo configurado, não há o que validar

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
