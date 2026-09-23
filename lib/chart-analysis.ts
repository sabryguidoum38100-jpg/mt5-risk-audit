import type { MT5Metrics, MT5ParseResult } from "./mt5-parser";

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ticket?: string;
  symbol?: string;
  direction?: "buy" | "sell";
  profit?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  kind: "high" | "low";
}

export interface ChartPattern {
  name: "Double Bottom" | "Head & Shoulders";
  status: "Confirmée" | "En formation / Non confirmée";
  neckline?: number;
  evidence: string;
}

export interface ChartContext {
  candles: ChartCandle[];
  swings: SwingPoint[];
  patterns: ChartPattern[];
  selectedSymbol: string;
  dataQuality: "reconstructed" | "ohlcv";
}

function timestamp(value: Date | string): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

export function buildChartContext(result: MT5ParseResult): ChartContext {
  const trades = [...result.trades].sort((a, b) => a.openTime.getTime() - b.openTime.getTime());
  const selectedSymbol = result.metrics.symbolsTraded[0] ?? "MT5";
  const candles: ChartCandle[] = trades.length
    ? trades.map((trade, index) => {
        const base = Number.isFinite(trade.price) && trade.price > 0 ? trade.price : 100 + index;
        const move = Math.max(Math.abs(trade.profit) / Math.max(trade.volume, 1) / 10000, base * 0.001);
        const close = base + (trade.profit >= 0 ? move : -move);
        return {
          time: timestamp(trade.openTime),
          open: base,
          high: Math.max(base, close) + move * 0.35,
          low: Math.min(base, close) - move * 0.35,
          close,
          volume: Math.max(trade.volume * 1000, 1),
          ticket: trade.ticket,
          symbol: trade.symbol,
          direction: trade.type,
          profit: trade.profit,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
        };
      })
    : result.metrics.equityCurve.slice(1).map((point, index, points) => {
        const previous = index === 0 ? result.metrics.initialBalanceAssumed : points[index - 1].equity;
        const move = Math.max(Math.abs(point.profit) / 10000, 0.001);
        const open = 100 + (previous - result.metrics.initialBalanceAssumed) / 1000;
        const close = open + (point.equity - previous) / 1000;
        return {
          time: timestamp(point.time),
          open,
          high: Math.max(open, close) + move,
          low: Math.min(open, close) - move,
          close,
          volume: Math.max(Math.abs(point.profit), 1),
          ticket: point.ticket,
          symbol: selectedSymbol,
          profit: point.profit,
        };
      });

  const swings = detectSwings(candles);
  return { candles, swings, patterns: detectPatterns(candles, swings), selectedSymbol, dataQuality: "reconstructed" };
}

export function detectSwings(candles: ChartCandle[], radius = 2): SwingPoint[] {
  const points: SwingPoint[] = [];
  for (let index = radius; index < candles.length - radius; index += 1) {
    const current = candles[index];
    const left = candles.slice(index - radius, index);
    const right = candles.slice(index + 1, index + radius + 1);
    if (left.every((candle) => current.high > candle.high) && right.every((candle) => current.high >= candle.high)) {
      points.push({ index, time: current.time, price: current.high, kind: "high" });
    }
    if (left.every((candle) => current.low < candle.low) && right.every((candle) => current.low <= candle.low)) {
      points.push({ index, time: current.time, price: current.low, kind: "low" });
    }
  }
  return points;
}

function detectPatterns(candles: ChartCandle[], swings: SwingPoint[]): ChartPattern[] {
  const patterns: ChartPattern[] = [];
  const lows = swings.filter((point) => point.kind === "low");
  if (lows.length >= 2) {
    const first = lows[lows.length - 2];
    const second = lows[lows.length - 1];
    const tolerance = Math.max(first.price, second.price) * 0.015;
    if (Math.abs(first.price - second.price) <= tolerance) {
      const neckline = Math.max(...candles.slice(first.index, second.index + 1).map((candle) => candle.high));
      const confirmed = candles.slice(second.index + 1).some((candle) => candle.close > neckline);
      patterns.push({ name: "Double Bottom", neckline, status: confirmed ? "Confirmée" : "En formation / Non confirmée", evidence: confirmed ? "Clôture au-dessus de la neckline détectée." : "Les deux creux sont proches, mais aucune clôture n'a cassé la neckline." });
    }
  }
  const highs = swings.filter((point) => point.kind === "high");
  if (highs.length >= 3) {
    const [left, head, right] = highs.slice(-3);
    if (head.price > left.price && head.price > right.price && Math.abs(left.price - right.price) / head.price < 0.03) {
      const neckline = Math.min(...candles.slice(left.index, right.index + 1).map((candle) => candle.low));
      const confirmed = candles.slice(right.index + 1).some((candle) => candle.close < neckline);
      patterns.push({ name: "Head & Shoulders", neckline, status: confirmed ? "Confirmée" : "En formation / Non confirmée", evidence: confirmed ? "Clôture sous la neckline détectée." : "La structure ressemble à un H&S, mais la neckline n'est pas cassée en clôture." });
    }
  }
  return patterns;
}

export function chartContextForPrompt(context: ChartContext): string {
  return JSON.stringify({
    selectedSymbol: context.selectedSymbol,
    dataQuality: context.dataQuality,
    swings: context.swings,
    patterns: context.patterns,
    latestCandles: context.candles.slice(-12),
  }, null, 2);
}
