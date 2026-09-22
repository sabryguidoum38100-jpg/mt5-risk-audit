/**
 * lib/mt5-parser.ts
 * ---------------------------------------------------------------------------
 * Moteur de parsing ULTRA-STRICT pour les historiques MetaTrader 5
 * (exports .csv et .html/.htm), et calcul déterministe des métriques de
 * performance et de risque.
 *
 * ZÉRO IA dans ce fichier : tout est du TypeScript pur, synchrone et
 * testable. C'est le seul fichier source de vérité pour les chiffres —
 * app/api/analyze/route.ts ne fait qu'interpréter le JSON produit ici.
 *
 * Formats supportés :
 *  - CSV "un ticket par ligne" (export History > Export vers CSV) avec les
 *    colonnes usuelles Time/Position/Symbol/Type/Volume/Price/.../Time/
 *    Price/Commission/Swap/Profit (gère les deux colonnes "Time" dupliquées
 *    par position, pas par nom).
 *  - HTML "Rapport" (History > Enregistrer en tant que rapport), table
 *    "Deals" avec colonnes Time/Deal/Symbol/Type/Direction/Volume/Price/
 *    Order/Commission/Swap/Profit/Balance/Comment.
 *
 * Limites assumées (MVP) :
 *  - Pour le format HTML "Deals", chaque ligne de sortie (profit renseigné)
 *    est traitée comme une transaction unique ; l'heure de cette ligne est
 *    utilisée comme horodatage de la transaction (proxy de l'heure de
 *    clôture), sans appariement précis avec la ligne d'entrée correspondante.
 *  - Commission et swap ne sont PAS ajoutés au P&L : on utilise tel quel le
 *    contenu de la colonne "Profit" de l'export.
 *  - Le solde initial utilisé pour le drawdown en % est détecté depuis les
 *    lignes de type "balance" (dépôts) du rapport HTML si présentes, sinon
 *    une valeur par défaut (DEFAULT_INITIAL_BALANCE) est utilisée.
 */

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export type MT5TradeType = "buy" | "sell";

export interface MT5Trade {
  ticket: string;
  openTime: Date;
  closeTime: Date | null;
  type: MT5TradeType;
  volume: number;
  symbol: string;
  price: number;
  profit: number;
}

export interface LosingStreak {
  length: number;
  totalLoss: number;
  startTicket: string;
  endTicket: string;
  startTime: string;
  endTime: string;
}

export interface EquityPoint {
  index: number;
  ticket: string;
  time: string;
  equity: number;
  profit: number;
}

export interface MT5Metrics {
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  totalPnL: number;
  winRate: number;
  profitFactor: number | null; // null = pas de perte enregistrée (facteur infini)
  maxDrawdownPercent: number;
  maxDrawdownAbsolute: number;
  averageWin: number;
  averageLoss: number; // valeur positive (perte moyenne en valeur absolue)
  bestTrade: number;
  worstTrade: number;
  maxLosingStreak: LosingStreak | null;
  significantLosingStreaks: number; // nb de séries de pertes >= SIGNIFICANT_STREAK_LENGTH
  quickReentriesAfterLoss: number; // trades ouverts < revengeWindowMinutes après une perte
  revengeWindowMinutes: number;
  equityCurve: EquityPoint[];
  initialBalanceAssumed: number;
  startDate: string | null;
  endDate: string | null;
  symbolsTraded: string[];
}

export interface MT5ParseResult {
  trades: MT5Trade[];
  metrics: MT5Metrics;
  warnings: string[];
  sourceFormat: "csv" | "html";
}

export class MT5ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MT5ParserError";
  }
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const REVENGE_WINDOW_MINUTES = 5;
const DEFAULT_INITIAL_BALANCE = 10000;
const SIGNIFICANT_STREAK_LENGTH = 3;

type HeaderRole =
  | "ticket"
  | "time"
  | "type"
  | "volume"
  | "symbol"
  | "price"
  | "profit";

const HEADER_ALIASES: Record<HeaderRole, string[]> = {
  ticket: ["ticket", "deal", "position", "order", "#", "id"],
  time: [
    "open time",
    "close time",
    "heure d'ouverture",
    "heure de cloture",
    "heure",
    "date",
    "time",
  ],
  type: ["type", "direction", "sens"],
  volume: ["volume", "lots", "lot", "size", "taille"],
  symbol: ["symbol", "symbole", "instrument", "pair", "paire"],
  price: ["open price", "prix d'ouverture", "price", "prix"],
  profit: [
    "profit",
    "p/l",
    "p&l",
    "benefice",
    "gain/perte",
    "resultat",
    "result",
    "net profit",
  ],
};

const EXCLUDED_TYPE_KEYWORDS = [
  "balance",
  "credit",
  "depot",
  "deposit",
  "withdrawal",
  "retrait",
  "correction",
];

// ---------------------------------------------------------------------------
// Petits utilitaires
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .toLowerCase()
    .trim();
}

function parseNumber(raw: string | undefined): number {
  if (raw == null) return NaN;
  let s = raw.toString().trim();
  if (s === "" || s === "-") return NaN;

  s = s.replace(/[\s\u00A0]/g, ""); // espaces / espaces insécables (séparateurs de milliers)

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // Le séparateur décimal est le dernier des deux rencontrés
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    s = s.replace(",", ".");
  }

  const n = parseFloat(s);
  return n;
}

function parseDateFlexible(raw: string | undefined): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  // Format MT5 natif : 2024.01.02 09:05:23  (ou sans secondes)
  let m = s.match(
    /^(\d{4})\.(\d{2})\.(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      m[6] ? Number(m[6]) : 0
    );
  }

  // Date seule : 2024.01.02
  m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  // Format dd/mm/yyyy hh:mm(:ss)
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    return new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      Number(m[4]),
      Number(m[5]),
      m[6] ? Number(m[6]) : 0
    );
  }

  // Repli : parseur natif (ISO, etc.)
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  return null;
}

// ---------------------------------------------------------------------------
// Détection des colonnes (en-têtes flexibles, FR/EN)
// ---------------------------------------------------------------------------

interface ColumnMap {
  ticket?: number;
  openTime?: number;
  closeTime?: number;
  type?: number;
  volume?: number;
  symbol?: number;
  price?: number;
  profit?: number;
}

function matchRole(headerCell: string): HeaderRole | null {
  const h = normalize(headerCell);
  if (!h) return null;
  for (const [role, aliases] of Object.entries(HEADER_ALIASES) as [
    HeaderRole,
    string[]
  ][]) {
    if (aliases.some((alias) => h === normalize(alias))) return role;
  }
  // Repli : correspondance partielle si aucune correspondance exacte trouvée
  for (const [role, aliases] of Object.entries(HEADER_ALIASES) as [
    HeaderRole,
    string[]
  ][]) {
    if (aliases.some((alias) => h.includes(normalize(alias)))) return role;
  }
  return null;
}

function detectColumnRoles(headerCells: string[]): ColumnMap {
  const map: ColumnMap = {};
  headerCells.forEach((cell, idx) => {
    const role = matchRole(cell);
    if (!role) return;
    switch (role) {
      case "ticket":
        if (map.ticket === undefined) map.ticket = idx;
        break;
      case "time":
        if (map.openTime === undefined) map.openTime = idx;
        else if (map.closeTime === undefined) map.closeTime = idx;
        break;
      case "type":
        if (map.type === undefined) map.type = idx;
        break;
      case "volume":
        if (map.volume === undefined) map.volume = idx;
        break;
      case "symbol":
        if (map.symbol === undefined) map.symbol = idx;
        break;
      case "price":
        if (map.price === undefined) map.price = idx;
        break;
      case "profit":
        if (map.profit === undefined) map.profit = idx;
        break;
    }
  });
  return map;
}

function isPlausibleHeader(map: ColumnMap): boolean {
  return (
    map.symbol !== undefined &&
    map.profit !== undefined &&
    map.openTime !== undefined &&
    map.type !== undefined
  );
}

// ---------------------------------------------------------------------------
// Construction stricte d'une transaction à partir d'une ligne
// ---------------------------------------------------------------------------

function buildTradeFromRow(
  cells: string[],
  map: ColumnMap,
  rowNumber: number,
  warnings: string[]
): MT5Trade | "balance" | null {
  const get = (idx?: number): string =>
    idx !== undefined ? (cells[idx] ?? "").toString().trim() : "";

  const typeRaw = get(map.type);
  const normalizedType = normalize(typeRaw);

  if (EXCLUDED_TYPE_KEYWORDS.some((k) => normalizedType.includes(k))) {
    return "balance";
  }

  let type: MT5TradeType | null = null;
  if (/^(buy|achat|long|b)$/i.test(typeRaw) || normalizedType.includes("buy") || normalizedType.includes("achat")) {
    type = "buy";
  } else if (
    /^(sell|vente|short|s)$/i.test(typeRaw) ||
    normalizedType.includes("sell") ||
    normalizedType.includes("vente")
  ) {
    type = "sell";
  }

  if (!type) {
    warnings.push(
      `Ligne ${rowNumber} ignorée : type de transaction non reconnu ("${typeRaw}").`
    );
    return null;
  }

  const openTime = parseDateFlexible(get(map.openTime));
  if (!openTime) {
    warnings.push(`Ligne ${rowNumber} ignorée : date d'ouverture invalide.`);
    return null;
  }

  const closeTimeRaw = get(map.closeTime);
  const closeTime = closeTimeRaw ? parseDateFlexible(closeTimeRaw) : null;

  const volume = parseNumber(get(map.volume));
  const symbol = get(map.symbol);
  const price = parseNumber(get(map.price));
  const profit = parseNumber(get(map.profit));

  // Une ligne "d'entrée" (in) d'un Deal HTML n'a pas de profit renseigné :
  // c'est un cas normal, on l'ignore silencieusement (pas un warning).
  if (isNaN(profit)) return null;

  if (!symbol) {
    warnings.push(`Ligne ${rowNumber} ignorée : symbole manquant.`);
    return null;
  }
  if (isNaN(volume) || volume <= 0) {
    warnings.push(`Ligne ${rowNumber} ignorée : volume invalide.`);
    return null;
  }
  if (isNaN(price) || price <= 0) {
    warnings.push(`Ligne ${rowNumber} ignorée : prix invalide.`);
    return null;
  }

  const ticket = get(map.ticket) || `auto-${rowNumber}`;

  return {
    ticket,
    openTime,
    closeTime,
    type,
    volume,
    symbol: symbol.toUpperCase(),
    price,
    profit,
  };
}

// ---------------------------------------------------------------------------
// Parsing CSV
// ---------------------------------------------------------------------------

import Papa from "papaparse";

function parseCSVContent(content: string): {
  trades: MT5Trade[];
  warnings: string[];
  balanceHint?: number;
} {
  const warnings: string[] = [];
  const parsed = Papa.parse<string[]>(content.trim(), {
    skipEmptyLines: true,
  });

  if (parsed.errors && parsed.errors.length > 0) {
    parsed.errors.forEach((e) =>
      warnings.push(`CSV : ${e.message} (ligne ${e.row ?? "?"})`)
    );
  }

  const rows = (parsed.data as unknown as string[][]).filter((r) =>
    Array.isArray(r)
  );

  if (rows.length < 2) {
    throw new MT5ParserError(
      "Le fichier CSV ne contient pas assez de lignes pour être analysé."
    );
  }

  let headerIdx = -1;
  let columnMap: ColumnMap = {};
  for (let i = 0; i < rows.length; i++) {
    const map = detectColumnRoles(rows[i]);
    if (isPlausibleHeader(map)) {
      headerIdx = i;
      columnMap = map;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new MT5ParserError(
      "Impossible de détecter les en-têtes attendus (Ticket, Heure, Type, Symbole, Volume, Prix, Profit) dans le fichier CSV."
    );
  }

  const trades: MT5Trade[] = [];
  let balanceSum = 0;
  let balanceSeen = false;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c || !c.trim())) continue;

    const built = buildTradeFromRow(row, columnMap, i + 1, warnings);
    if (built === "balance") {
      const idx = columnMap.profit;
      if (idx !== undefined) {
        const v = parseNumber(row[idx]);
        if (!isNaN(v)) {
          balanceSum += v;
          balanceSeen = true;
        }
      }
      continue;
    }
    if (built) trades.push(built);
  }

  return { trades, warnings, balanceHint: balanceSeen ? balanceSum : undefined };
}

// ---------------------------------------------------------------------------
// Parsing HTML (rapport MT5)
// ---------------------------------------------------------------------------

function decodeHtmlCell(cellHtml: string): string {
  const withoutTags = cellHtml.replace(/<[^>]+>/g, "");
  return withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseHTMLContent(content: string): {
  trades: MT5Trade[];
  warnings: string[];
  balanceHint?: number;
} {
  const warnings: string[] = [];
  const cleaned = content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const rowMatches = cleaned.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
  if (!rowMatches || rowMatches.length === 0) {
    throw new MT5ParserError(
      "Aucune ligne de tableau (<tr>) détectée dans le fichier HTML."
    );
  }

  const rows: string[][] = rowMatches.map((rowHtml) => {
    const cellMatches = rowHtml.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || [];
    return cellMatches.map((cellHtml) => decodeHtmlCell(cellHtml));
  });

  let headerIdx = -1;
  let columnMap: ColumnMap = {};
  let sectionEndIdx = rows.length;

  for (let i = 0; i < rows.length; i++) {
    const map = detectColumnRoles(rows[i]);
    if (isPlausibleHeader(map)) {
      if (headerIdx === -1) {
        headerIdx = i;
        columnMap = map;
      } else {
        // Deuxième section détectée (ex. table "Positions" après "Deals") :
        // on s'arrête à la première section exploitable pour ne pas
        // compter deux fois les mêmes transactions.
        sectionEndIdx = i;
        break;
      }
    }
  }

  if (headerIdx === -1) {
    throw new MT5ParserError(
      "Impossible de détecter un tableau d'historique exploitable (colonnes Ticket, Heure, Type, Symbole, Volume, Prix, Profit) dans le fichier HTML."
    );
  }

  const trades: MT5Trade[] = [];
  let balanceSum = 0;
  let balanceSeen = false;

  for (let i = headerIdx + 1; i < sectionEndIdx; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every((c) => !c.trim())) continue;

    const built = buildTradeFromRow(row, columnMap, i + 1, warnings);
    if (built === "balance") {
      const idx = columnMap.profit;
      if (idx !== undefined) {
        const v = parseNumber(row[idx]);
        if (!isNaN(v)) {
          balanceSum += v;
          balanceSeen = true;
        }
      }
      continue;
    }
    if (built) trades.push(built);
  }

  return { trades, warnings, balanceHint: balanceSeen ? balanceSum : undefined };
}

// ---------------------------------------------------------------------------
// Calcul déterministe des métriques
// ---------------------------------------------------------------------------

function computeMetrics(
  trades: MT5Trade[],
  initialBalanceHint?: number
): MT5Metrics {
  const initialBalanceAssumed =
    initialBalanceHint && initialBalanceHint > 0
      ? round2(initialBalanceHint)
      : DEFAULT_INITIAL_BALANCE;

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.profit > 0);
  const losses = trades.filter((t) => t.profit < 0);

  const totalPnL = round2(trades.reduce((s, t) => s + t.profit, 0));
  const winRate = totalTrades > 0 ? round2((wins.length / totalTrades) * 100) : 0;

  const grossProfit = wins.reduce((s, t) => s + t.profit, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
  const profitFactor =
    grossLoss > 0 ? round2(grossProfit / grossLoss) : grossProfit > 0 ? null : 0;

  const averageWin = wins.length > 0 ? round2(grossProfit / wins.length) : 0;
  const averageLoss = losses.length > 0 ? round2(grossLoss / losses.length) : 0;

  const bestTrade = totalTrades > 0 ? round2(Math.max(...trades.map((t) => t.profit))) : 0;
  const worstTrade = totalTrades > 0 ? round2(Math.min(...trades.map((t) => t.profit))) : 0;

  // --- Courbe de capital + Max Drawdown ---------------------------------
  let equity = initialBalanceAssumed;
  let peak = initialBalanceAssumed;
  let maxDDPercent = 0;
  let maxDDAbsolute = 0;

  const equityCurve: EquityPoint[] = [
    {
      index: 0,
      ticket: "INIT",
      time: trades[0]?.openTime.toISOString() ?? new Date().toISOString(),
      equity: round2(equity),
      profit: 0,
    },
  ];

  trades.forEach((t, i) => {
    equity += t.profit;
    if (equity > peak) peak = equity;
    const ddAbs = peak - equity;
    const ddPct = peak > 0 ? (ddAbs / peak) * 100 : 0;
    if (ddPct > maxDDPercent) {
      maxDDPercent = ddPct;
      maxDDAbsolute = ddAbs;
    }
    equityCurve.push({
      index: i + 1,
      ticket: t.ticket,
      time: t.openTime.toISOString(),
      equity: round2(equity),
      profit: round2(t.profit),
    });
  });

  // --- Séries de pertes consécutives ------------------------------------
  let currentStreak: MT5Trade[] = [];
  let maxStreak: MT5Trade[] = [];
  let significantStreaks = 0;

  for (const t of trades) {
    if (t.profit < 0) {
      currentStreak.push(t);
      if (currentStreak.length > maxStreak.length) maxStreak = [...currentStreak];
    } else {
      if (currentStreak.length >= SIGNIFICANT_STREAK_LENGTH) significantStreaks++;
      currentStreak = [];
    }
  }
  if (currentStreak.length >= SIGNIFICANT_STREAK_LENGTH) significantStreaks++;

  const maxLosingStreak: LosingStreak | null =
    maxStreak.length > 0
      ? {
          length: maxStreak.length,
          totalLoss: round2(maxStreak.reduce((s, t) => s + t.profit, 0)),
          startTicket: maxStreak[0].ticket,
          endTicket: maxStreak[maxStreak.length - 1].ticket,
          startTime: maxStreak[0].openTime.toISOString(),
          endTime: maxStreak[maxStreak.length - 1].openTime.toISOString(),
        }
      : null;

  // --- Détection heuristique du "revenge trading" ------------------------
  // Compte les transactions ouvertes moins de REVENGE_WINDOW_MINUTES après
  // la clôture (ou l'ouverture si l'heure de clôture est inconnue) d'une
  // transaction perdante.
  let quickReentriesAfterLoss = 0;
  for (let i = 0; i < trades.length - 1; i++) {
    const current = trades[i];
    const next = trades[i + 1];
    if (current.profit < 0) {
      const refTime = current.closeTime ?? current.openTime;
      const deltaMinutes = (next.openTime.getTime() - refTime.getTime()) / 60000;
      if (deltaMinutes >= 0 && deltaMinutes <= REVENGE_WINDOW_MINUTES) {
        quickReentriesAfterLoss++;
      }
    }
  }

  const symbolsTraded = Array.from(new Set(trades.map((t) => t.symbol))).sort();

  return {
    totalTrades,
    totalWins: wins.length,
    totalLosses: losses.length,
    totalPnL,
    winRate,
    profitFactor,
    maxDrawdownPercent: round2(maxDDPercent),
    maxDrawdownAbsolute: round2(maxDDAbsolute),
    averageWin,
    averageLoss,
    bestTrade,
    worstTrade,
    maxLosingStreak,
    significantLosingStreaks: significantStreaks,
    quickReentriesAfterLoss,
    revengeWindowMinutes: REVENGE_WINDOW_MINUTES,
    equityCurve,
    initialBalanceAssumed,
    startDate: trades[0]?.openTime.toISOString() ?? null,
    endDate: trades[trades.length - 1]?.openTime.toISOString() ?? null,
    symbolsTraded,
  };
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Parse un historique MetaTrader 5 (contenu brut du fichier, CSV ou HTML)
 * et retourne les transactions extraites ainsi que toutes les métriques
 * calculées de façon déterministe.
 *
 * @throws {MT5ParserError} si le fichier est vide, illisible, ou ne contient
 *         aucune transaction exploitable.
 */
export function parseMT5History(rawContent: string): MT5ParseResult {
  if (!rawContent || !rawContent.trim()) {
    throw new MT5ParserError("Le fichier fourni est vide.");
  }

  const head = rawContent.slice(0, 5000);
  const isHTML =
    /<\s*(!doctype html|html|table|body)[\s>]/i.test(head) ||
    /<tr[\s>]/i.test(rawContent.slice(0, 20000));

  const { trades: rawTrades, warnings, balanceHint } = isHTML
    ? parseHTMLContent(rawContent)
    : parseCSVContent(rawContent);

  if (rawTrades.length === 0) {
    throw new MT5ParserError(
      "Aucune transaction exploitable n'a été trouvée. Vérifiez qu'il s'agit bien d'un export d'historique MetaTrader 5 (CSV ou HTML) contenant les colonnes Ticket, Heure, Type, Volume, Symbole, Prix et Profit."
    );
  }

  // Dédoublonnage strict par ticket, puis tri chronologique.
  const uniqueMap = new Map<string, MT5Trade>();
  for (const t of rawTrades) uniqueMap.set(t.ticket, t);

  const trades = Array.from(uniqueMap.values()).sort(
    (a, b) => a.openTime.getTime() - b.openTime.getTime()
  );

  const metrics = computeMetrics(trades, balanceHint);

  return {
    trades,
    metrics,
    warnings,
    sourceFormat: isHTML ? "html" : "csv",
  };
}
