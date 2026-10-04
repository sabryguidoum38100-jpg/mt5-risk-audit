const DEMO_PROFITS = [
  118, -72, 94, 156, -108, 86, 132, -64, 71, 205,
  -95, 110, 48, -121, 178, 92, -76, 134, 64, -88,
  146, -102, 83, 119, -67, 54, 187, -115, 102, 76,
  -81, 141, 66, -98, 158, 91, -74, 126, -109, 88,
  173, -69, 97, 52, 139,
];

const DEMO_SYMBOLS = ["EURUSD", "GBPUSD", "XAUUSD", "US30", "USDJPY"];
const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.084,
  GBPUSD: 1.267,
  XAUUSD: 2328.4,
  US30: 38840,
  USDJPY: 151.2,
};

/**
 * Synthetic onboarding fixture, intentionally explicit and clearly labeled as demo data.
 * It never enters the production analytics unless the user clicks “Tester la démo”.
 */
export function getDemoHistoryCsv(): string {
  const rows = ["Ticket,Time,Type,Volume,Symbol,Price,Profit,SL,TP"];
  for (let index = 0; index < DEMO_PROFITS.length; index += 1) {
    const symbol = DEMO_SYMBOLS[index % DEMO_SYMBOLS.length];
    const price = BASE_PRICES[symbol] + ((index % 7) - 3) * (symbol === "US30" ? 18 : symbol === "XAUUSD" ? 2.4 : 0.0018);
    const type = index % 3 === 0 ? "sell" : "buy";
    const date = new Date(Date.UTC(2026, 0, 5 + index, 8 + (index % 11), 10 + (index % 45)));
    const point = symbol === "US30" ? 10 : symbol === "XAUUSD" ? 1 : 0.001;
    const stopDistance = 18 * point;
    const targetDistance = 30 * point;
    const sl = type === "buy" ? price - stopDistance : price + stopDistance;
    const tp = type === "buy" ? price + targetDistance : price - targetDistance;
    rows.push([
      String(700001 + index),
      date.toISOString(),
      type,
      "0.10",
      symbol,
      price.toFixed(symbol === "US30" ? 1 : symbol === "XAUUSD" ? 2 : 5),
      DEMO_PROFITS[index].toFixed(2),
      sl.toFixed(symbol === "US30" ? 1 : symbol === "XAUUSD" ? 2 : 5),
      tp.toFixed(symbol === "US30" ? 1 : symbol === "XAUUSD" ? 2 : 5),
    ].join(","));
  }
  return rows.join("\n");
}

export const DEMO_TRADE_COUNT = DEMO_PROFITS.length;
