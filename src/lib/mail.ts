import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// CORREÇÃO: Ordem dos parâmetros definida explicitamente: name, email, code
export async function sendVerificationEmail(name: string, email: string, code: string) {
  try {
    // Limpeza de segurança
    const cleanEmail = email.trim(); 

    const { data, error } = await resend.emails.send({
      from: 'Gestão.ai <onboarding@resend.dev>', // Use este remetente para testes grátis
      to: [cleanEmail], // Resend prefere array de strings
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
      console.error("Erro interno do Resend:", error);
      throw new Error(error.message);
    }

    console.log("E-mail enviado com sucesso para:", cleanEmail);
    return data;
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    // Não vamos estourar o erro para não travar o cadastro, mas logamos
    return null; 
  }
}