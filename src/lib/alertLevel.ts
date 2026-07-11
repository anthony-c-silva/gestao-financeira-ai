export type AlertLevel = "NORMAL" | "WARNING" | "DANGER" | "EXTRAPOLATED";

/**
 * Calcula o nível de alerta de um valor acumulado (ex: faturamento anual,
 * gasto no cartão de crédito no mês) em relação a um limite configurado.
 * Mesma régua usada no cartão de Faturamento PJ, reaproveitada pelos Limites/Orçamentos.
 */
export function computeAlertLevel(
  current: number,
  limit: number,
  warningThresholdPercent = 80,
): AlertLevel {
  if (limit <= 0) return "NORMAL";
  const percentage = (current / limit) * 100;

  if (current > limit) return "EXTRAPOLATED";
  if (percentage >= 90) return "DANGER";
  if (percentage >= warningThresholdPercent) return "WARNING";
  return "NORMAL";
}
