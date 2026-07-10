/**
 * Segredo usado para assinar/verificar o cookie de sessão (JWT).
 * Sem fallback: se JWT_SECRET não estiver configurado, falha alto em vez de
 * aceitar silenciosamente uma string conhecida (o que permitiria forjar sessões).
 *
 * Isolado em módulo próprio (sem depender de "next/headers") para poder ser
 * importado tanto por Route Handlers quanto pelo middleware (src/proxy.ts),
 * que roda no Edge Runtime.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET não está definido. Configure a variável de ambiente antes de autenticar usuários.",
    );
  }
  return new TextEncoder().encode(secret);
}
