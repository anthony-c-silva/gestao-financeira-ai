import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// URL base do app (usa variável de ambiente ou localhost como fallback)
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Envia e-mail com Código de Verificação (Cadastro)
 */
export async function sendVerificationEmail(name: string, email: string, code: string) {
  try {
    const cleanEmail = email.trim();

    const { data, error } = await resend.emails.send({
      from: 'Gestão.ai <onboarding@resend.dev>',
      to: [cleanEmail],
      subject: 'Seu código de verificação',
      html: `
        <div style="font-family: sans-serif; font-size: 16px; color: #333;">
          <h2>Olá, ${name}!</h2>
          <p>Seu código de verificação para o <strong>Gestão.ai</strong> é:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${code}
          </div>
          <p>Este código expira em breve.</p>
          <p>Se você não solicitou este código, ignore este e-mail.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Erro interno do Resend (Verification):", error);
      throw new Error(error.message);
    }

    console.log("E-mail de verificação enviado para:", cleanEmail);
    return data;
  } catch (error) {
    console.error("Erro ao enviar e-mail de verificação:", error);
    return null;
  }
}

/**
 * Envia e-mail com Link de Recuperação de Senha (Esqueci Minha Senha)
 */
export async function sendPasswordResetEmail(name: string, email: string, token: string) {
  try {
    const cleanEmail = email.trim();
    // Monta o link: http://localhost:3000/reset-password?token=XYZ
    const resetLink = `${BASE_URL}/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: 'Gestão.ai <onboarding@resend.dev>',
      to: [cleanEmail],
      subject: 'Redefinição de Senha',
      html: `
        <div style="font-family: sans-serif; font-size: 16px; color: #333;">
          <h2>Olá, ${name}!</h2>
          <p>Recebemos uma solicitação para redefinir sua senha no <strong>Gestão.ai</strong>.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #000066; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          <p>Ou copie e cole o link abaixo no seu navegador:</p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">${resetLink}</p>
          <p>Se você não solicitou isso, apenas ignore este e-mail.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Erro interno do Resend (Reset):", error);
      throw new Error(error.message);
    }

    console.log("E-mail de recuperação enviado para:", cleanEmail);
    return data;
  } catch (error) {
    console.error("Erro ao enviar e-mail de recuperação:", error);
    return null;
  }
}