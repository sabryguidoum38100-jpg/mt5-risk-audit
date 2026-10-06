import { readFileSync } from "node:fs";
import { parseMT5History, recalculateMetrics } from "../lib/mt5-parser";

const file = process.argv[2] ?? "tests/fixtures/historique_mt5-2.html";
const parsed = parseMT5History(readFileSync(file, "utf8"));
const metrics = recalculateMetrics(parsed.trades, 3000);
const failures: string[] = [];
const assertEqual = (label: string, actual: number, expected: number) => {
  if (Math.abs(actual - expected) > 0.01) failures.push(`${label}: obtenu ${actual}, attendu ${expected}`);
};

assertEqual("Capital initial", metrics.initialBalanceAssumed, 3000);
assertEqual("PnL total", metrics.totalPnL, -27.77);
assertEqual("Win rate", metrics.winRate, (7 / 13) * 100);
assertEqual("Drawdown absolu", metrics.maxDrawdownAbsolute, 64.01);
assertEqual("Drawdown maximum", metrics.maxDrawdownPercent, 2.1);
if (metrics.maxLosingStreak?.length !== 3) failures.push(`Série maximale: obtenu ${metrics.maxLosingStreak?.length ?? 0}, attendu 3`);
if (metrics.maxLosingStreak && Math.abs(metrics.maxLosingStreak.totalLoss + 64.01) > 0.01) failures.push(`Perte de série: obtenu ${metrics.maxLosingStreak.totalLoss}, attendu -64.01`);

if (failures.length) {
  console.error(`BENCHMARK ÉCHOUÉ (${file})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`BENCHMARK OK (${file})`);
console.log(JSON.stringify({ trades: parsed.trades.length, ...metrics }, null, 2));
