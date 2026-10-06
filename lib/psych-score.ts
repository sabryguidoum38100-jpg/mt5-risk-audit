import type { MT5Metrics } from "./mt5-parser";

/** Score déterministe 0–100 : l’IA ne décide jamais de la note. */
export function calculatePsychologicalScore(metrics: MT5Metrics): number {
  const drawdown = Math.min(30, metrics.maxDrawdownPercent * 3);
  const reactivity = Math.min(25, metrics.quickReentriesAfterLoss * 8);
  const streaks = Math.min(20, metrics.significantLosingStreaks * 7);
  const sizing = Math.min(15, metrics.abnormalSizingCount * 5);
  const lowEdge = metrics.totalTrades >= 5 && metrics.winRate < 50 ? 10 : 0;
  return Math.round(Math.min(100, drawdown + reactivity + streaks + sizing + lowEdge));
}
