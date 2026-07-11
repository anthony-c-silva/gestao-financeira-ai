// Máscaras de formatação reutilizadas em vários formulários (cadastro, login,
// recuperação de senha, contatos) — antes duplicadas em cada componente.

/** Formata CPF (11 dígitos) ou CNPJ (14 dígitos), detectando o tipo pela quantidade de dígitos já digitados. */
export function formatCPFOrCNPJ(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 14);

  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return clean
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Formata CPF ou CNPJ sabendo de antemão o tipo de pessoa (útil enquanto o usuário ainda digita). */
export function formatDocumentByType(value: string, type: "PF" | "PJ"): string {
  const maxLength = type === "PF" ? 11 : 14;
  const clean = value.replace(/\D/g, "").slice(0, maxLength);

  if (type === "PF") {
    return clean
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }

  return clean
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

/** Formata telefone/celular brasileiro: (00) 0000-0000 ou (00) 00000-0000. */
export function formatPhone(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d)(\d{4})$/, "$1-$2")
    .substring(0, 15);
}

/** Formata CEP: 00000-000. */
export function formatCEP(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1");
}
