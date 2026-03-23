/** Puntos máximos por pregunta si aciertas al instante (estilo Kahoot). */
export const MAX_POINTS_PER_QUESTION = 1000;

/**
 * Puntos por respuesta correcta: más rápido = más puntos.
 * En t=0 → MAX; en t=timeLimitMs → 0. Incorrecto o fuera de tiempo → no usar (0 pts).
 */
export function computePointsForCorrectAnswer(
  elapsedMs: number,
  timeLimitMs: number,
): number {
  if (timeLimitMs <= 0) return 0;
  const t = Math.min(Math.max(0, elapsedMs), timeLimitMs);
  return Math.floor(MAX_POINTS_PER_QUESTION * (1 - t / timeLimitMs));
}
