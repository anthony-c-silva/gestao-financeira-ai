import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// O domínio que vai aparecer no remetente (pode usar o padrão do Resend para testes)
// Quando for para produção, deve configurar o seu domínio real no painel do Resend.
const EMAIL_FROM = "onboarding@resend.dev"; 

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Confirme o seu email - Financeiro.AI",
      html: `
        <div style="font-family: sans-serif; font-size: 16px; color: #333;">
          <h1>Bem-vindo ao Financeiro.AI! 🚀</h1>
          <p>Para ativar a sua conta, use o código abaixo:</p>
          <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${token}
          </div>
          <p>Este código expira em 1 hora.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar email de verificação:", error);
    return { success: false, error };
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Recuperação de Senha - Financeiro.AI",
      html: `
        <div style="font-family: sans-serif; font-size: 16px; color: #333;">
          <h2>Esqueceu a sua senha?</h2>
          <p>Não se preocupe. Use o código abaixo para redefinir a sua senha:</p>
          <div style="background: #e0e7ff; color: #3730a3; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${token}
          </div>
          <p><strong>Atenção:</strong> Este código é válido por apenas 15 minutos.</p>
          <p>Se não solicitou esta alteração, ignore este e-mail.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar email de reset:", error);
    return { success: false, error };
  }
};