import type { MT5Metrics, MT5Trade } from "./mt5-parser";

export interface MonteCarloProjection {
  simulations: number;
  horizon: number;
  successProbability: number;
  medianReturn: number;
  medianDrawdown: number;
  p90Drawdown: number;
  worstDrawdown: number;
  expectedFinalPnL: number;
  winRate: number;
  riskReward: number | null;
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
}

function createSeededRandom(seed: number) {
  let value = Math.abs(seed) || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function projectMonteCarlo(trades: MT5Trade[], metrics: MT5Metrics, simulations = 1000, horizon = 100): MonteCarloProjection {
  const wins = trades.filter((trade) => trade.profit > 0).map((trade) => trade.profit);
  const losses = trades.filter((trade) => trade.profit < 0).map((trade) => Math.abs(trade.profit));
  const winRate = trades.length ? wins.length / trades.length : 0;
  const averageWin = wins.length ? wins.reduce((sum, value) => sum + value, 0) / wins.length : 0;
  const averageLoss = losses.length ? losses.reduce((sum, value) => sum + value, 0) / losses.length : 0;
  const riskReward = averageLoss ? averageWin / averageLoss : null;
  if (!trades.length || (!wins.length && !losses.length)) return { simulations, horizon, successProbability: 0, medianReturn: 0, medianDrawdown: 0, p90Drawdown: 0, worstDrawdown: 0, expectedFinalPnL: 0, winRate, riskReward };
  const random = createSeededRandom(Math.round(metrics.totalPnL * 100) + trades.length * 7919);
  const finalPnLs: number[] = [];
  const drawdowns: number[] = [];
  for (let simulation = 0; simulation < simulations; simulation += 1) {
    let pnl = 0;
    let peak = 0;
    let maxDrawdown = 0;
    for (let trade = 0; trade < horizon; trade += 1) {
      if (random() < winRate) pnl += averageWin;
      else pnl -= averageLoss;
      peak = Math.max(peak, pnl);
      maxDrawdown = Math.max(maxDrawdown, peak - pnl);
    }
    finalPnLs.push(pnl);
    drawdowns.push(maxDrawdown);
  }
  const positive = finalPnLs.filter((value) => value > 0).length;
  return {
    simulations,
    horizon,
    successProbability: (positive / simulations) * 100,
    medianReturn: percentile(finalPnLs, 0.5),
    medianDrawdown: percentile(drawdowns, 0.5),
    p90Drawdown: percentile(drawdowns, 0.9),
    worstDrawdown: Math.max(...drawdowns),
    expectedFinalPnL: finalPnLs.reduce((sum, value) => sum + value, 0) / simulations,
    winRate: winRate * 100,
    riskReward,
  };
}
