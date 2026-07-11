import { QrCode, Banknote, CreditCard, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PaymentMethodOption {
  id: string;
  icon: LucideIcon;
}

// Fonte única das formas de pagamento suportadas — usada no lançamento de
// transações, nos limites/orçamentos e na importação de extrato.
export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: "Pix", icon: QrCode },
  { id: "Dinheiro", icon: Banknote },
  { id: "Cartão Crédito", icon: CreditCard },
  { id: "Cartão Débito", icon: CreditCard },
  { id: "Boleto", icon: FileText },
];

export const PAYMENT_METHOD_IDS = PAYMENT_METHODS.map((p) => p.id);

// Cores da marca aplicadas a cada forma de pagamento.
export const PAYMENT_STYLES: { [key: string]: { bg: string; text: string } } = {
  Pix: { bg: "bg-emerald-100", text: "text-emerald-600" },
  Dinheiro: { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Cartão Crédito": { bg: "bg-brand-100", text: "text-brand-900" },
  "Cartão Débito": { bg: "bg-brand-50", text: "text-brand-700" },
  Boleto: { bg: "bg-amber-100", text: "text-amber-600" },
  default: { bg: "bg-slate-100", text: "text-slate-600" },
};
