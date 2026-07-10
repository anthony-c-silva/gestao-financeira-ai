import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envia e-mail com Código de Verificação (Cadastro)
 */
export async function sendVerificationEmail(name: string, email: string, code: string) {
  try {
    const cleanEmail = email.trim();

    const { data, error } = await resend.emails.send({
      from: 'Smart Fin <onboarding@resend.dev>',
      to: [cleanEmail],
      subject: 'Seu código de verificação',
      html: `
        <div style="font-family: sans-serif; font-size: 16px; color: #333;">
          <h2>Olá, ${name}!</h2>
          <p>Seu código de verificação para o <strong>Smart Fin</strong> é:</p>
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
 * Envia e-mail com Código de Recuperação de Senha (Esqueci Minha Senha).
 * Usa o mesmo padrão visual/UX do código de verificação de cadastro:
 * o usuário digita o código de 6 dígitos na própria tela do app.
 */
export async function sendPasswordResetEmail(name: string, email: string, code: string) {
  try {
    const cleanEmail = email.trim();

    const { data, error } = await resend.emails.send({
      from: 'Smart Fin <onboarding@resend.dev>',
      to: [cleanEmail],
      subject: 'Código para redefinir sua senha',
      html: `
        <div style="font-family: sans-serif; font-size: 16px; color: #333;">
          <h2>Olá, ${name}!</h2>
          <p>Recebemos uma solicitação para redefinir sua senha no <strong>Smart Fin</strong>. Use o código abaixo:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${code}
          </div>
          <p>Este código expira em 15 minutos.</p>
          <p>Se você não solicitou isso, apenas ignore este e-mail — sua senha continua a mesma.</p>
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