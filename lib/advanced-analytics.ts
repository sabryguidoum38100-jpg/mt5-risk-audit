import type { MT5Metrics, MT5Trade } from "./mt5-parser";

export interface HeatmapDay {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

export interface AdvancedAnalytics {
  sharpe: number | null;
  sortino: number | null;
  averageWinningHoldMinutes: number | null;
  averageLosingHoldMinutes: number | null;
  bestTradeContributionPercent: number | null;
  consistencyAlert: boolean;
  worstDailyPnL: number;
  dailyLossCushion: number;
  dailyLossLimit: number;
  heatmap: HeatmapDay[];
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function deviation(values: number[], target: number) {
  if (values.length < 2) return 0;
  return Math.sqrt(mean(values.map((value) => (value - target) ** 2)));
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateAdvancedAnalytics(trades: MT5Trade[], metrics: MT5Metrics, dailyLimitPercent = 5): AdvancedAnalytics {
  const returns = trades.map((trade) => trade.profit / Math.max(metrics.initialBalanceAssumed, 1));
  const averageReturn = mean(returns);
  const standardDeviation = deviation(returns, averageReturn);
  const downside = returns.filter((value) => value < 0);
  const downsideDeviation = downside.length ? Math.sqrt(mean(downside.map((value) => value ** 2))) : 0;
  const winningHolds = trades.filter((trade) => trade.profit > 0 && trade.closeTime).map((trade) => ((trade.closeTime as Date).getTime() - trade.openTime.getTime()) / 60000).filter((value) => value >= 0);
  const losingHolds = trades.filter((trade) => trade.profit < 0 && trade.closeTime).map((trade) => ((trade.closeTime as Date).getTime() - trade.openTime.getTime()) / 60000).filter((value) => value >= 0);
  const byDay = new Map<string, HeatmapDay>();
  for (const trade of trades) {
    const date = dayKey(trade.openTime);
    const current = byDay.get(date) ?? { date, pnl: 0, trades: 0, wins: 0, losses: 0 };
    current.pnl += trade.profit;
    current.trades += 1;
    if (trade.profit > 0) current.wins += 1;
    if (trade.profit < 0) current.losses += 1;
    byDay.set(date, current);
  }
  const heatmap = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)).map((day) => ({ ...day, pnl: round(day.pnl) }));
  const worstDailyPnL = heatmap.length ? Math.min(...heatmap.map((day) => day.pnl)) : 0;
  const dailyLossLimit = round(metrics.initialBalanceAssumed * dailyLimitPercent / 100);
  const dailyLossCushion = round(Math.max(0, dailyLossLimit + Math.min(0, worstDailyPnL)));
  const bestTradeContributionPercent = metrics.totalPnL > 0 ? round((metrics.bestTrade / metrics.totalPnL) * 100, 1) : null;
  return {
    sharpe: standardDeviation ? round((averageReturn / standardDeviation) * Math.sqrt(Math.max(returns.length, 1)), 2) : null,
    sortino: downsideDeviation ? round((averageReturn / downsideDeviation) * Math.sqrt(Math.max(returns.length, 1)), 2) : null,
    averageWinningHoldMinutes: winningHolds.length ? round(mean(winningHolds), 1) : null,
    averageLosingHoldMinutes: losingHolds.length ? round(mean(losingHolds), 1) : null,
    bestTradeContributionPercent,
    consistencyAlert: bestTradeContributionPercent !== null && bestTradeContributionPercent > 30,
    worstDailyPnL: round(worstDailyPnL),
    dailyLossCushion,
    dailyLossLimit,
    heatmap,
  };
}
