"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Flame,
  Gauge,
  Lock,
  Loader2,
  MessageCircle,
  Percent,
  RotateCcw,
  ScanSearch,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  parseUniversalHistory,
  recalculateMetrics,
  type MT5Metrics,
  type MT5ParseResult,
  type MT5Trade,
} from "@/lib/mt5-parser";
import ChartistPanel from "@/components/chartist-panel";
import MacroSection from "@/components/macro-section";
import SiteNav from "@/components/site-nav";
import AuditPropLogo from "@/components/auditprop-logo";
import { calculateAdvancedAnalytics } from "@/lib/advanced-analytics";
import { ConsistencyCheck, InstitutionalMetrics, PnlHeatmap } from "@/components/advanced-analytics";
import { AuditCard, MonteCarloPanel, StrategyRoadmap, TradeTagging, TradingOsSummary } from "@/components/trading-os-panels";
import { projectMonteCarlo } from "@/lib/monte-carlo";
import { DEMO_TRADE_COUNT, getDemoHistoryCsv } from "@/lib/demo-history";
import DecisionGate from "@/components/decision-gate";

interface DetectedBias {
  name: string;
  severity: "low" | "medium" | "high";
  description: string;
}

interface PsychAnalysis {
  riskScore: number;
  summary: string;
  biasesDetected: DetectedBias[];
  drawdownAlert: { level: "ok" | "warning" | "critical"; message: string };
  recommendations: string[];
}

interface GlobalAudit {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  actionPlan: string[];
}

type PropFirm = "FTMO" | "Topstep" | "FundedNext";
type AccountSize = 10000 | 50000 | 100000 | 200000;

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const questions = [
    [
      "Quels fichiers MT5 sont compatibles ?",
      "Les exports CSV, HTML et TXT de MetaTrader 5 sont acceptés. Les métriques sont calculées localement avant l'analyse IA.",
    ],
    [
      "Les actualités macro sont-elles fictives ?",
      "Non. Le module récupère des flux RSS publics distants à chaque chargement et affiche les titres, sources, horaires et liens originaux.",
    ],
    [
      "L'analyse constitue-t-elle un conseil financier ?",
      "Non. Il s'agit d'un outil d'analyse de risque et de contexte. Les décisions de trading restent sous votre responsabilité.",
    ],
    [
      "Comment fonctionne le baromètre IA ?",
      "Les cinq dernières actualités réelles récupérées sont envoyées à Groq pour produire un résumé prudent, sans inventer de chiffres ni d'événements.",
    ],
  ];
  return (
    <section id="faq" className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Questions fréquentes
        </h2>
      </div>
      <div className="mt-8 space-y-2">
        {questions.map(([question, answer], index) => (
          <div
            key={question}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.025]"
          >
            <button
              onClick={() => setOpen(open === index ? null : index)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium text-white"
            >
              <span>{question}</span>
              {open === index ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-sky-300" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
              )}
            </button>
            {open === index && (
              <p className="border-t border-white/[0.07] px-4 pb-4 pt-3 text-sm leading-6 text-zinc-400">
                {answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductProofSection() {
  const proofPoints = [
    ["Données locales d’abord", "Les transactions brutes restent dans le navigateur. Le moteur comportemental reçoit uniquement les métriques agrégées nécessaires à l’interprétation.", ShieldCheck],
    ["Calculs explicables", "PnL, drawdown, heatmap, holding time, swings et projections sont calculés par des fonctions déterministes avant toute synthèse IA.", Gauge],
    ["Contexte réellement vivant", "Le calendrier et les flux macro sont récupérés depuis des sources publiques. Si un flux manque, l’interface affiche un état vide plutôt qu’un chiffre inventé.", Activity],
    ["Décision, pas prédiction", "La roadmap croise historique, structure de prix et contexte économique pour cadrer l’action — sans promesse de rendement.", Brain],
  ] as const;
  return <section className="border-t border-white/[0.07] py-14"><div className="mx-auto max-w-4xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Pourquoi AuditProp</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Un système de décision que vous pouvez comprendre.</h2><p className="mt-4 text-sm leading-6 text-zinc-400">Une architecture pensée pour réduire le bruit, rendre les risques visibles et préserver la confiance entre votre historique et l’analyse.</p></div><div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2">{proofPoints.map(([title, text, Icon]) => <article key={title} className="neon-card rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><Icon className="h-4 w-4" /></span><h3 className="text-sm font-semibold text-white">{title}</h3></div><p className="mt-3 text-xs leading-5 text-zinc-400">{text}</p></article>)}</div></section>;
}

function HeroDashboardPreview() {
  return (
    <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#0d0d10] p-3 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between text-[10px] text-zinc-400"><span className="font-semibold text-white">Aperçu du cockpit</span><span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-sky-200">Aperçu Démo</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2">{[["PnL", "+12,4%", "text-emerald-300"], ["Drawdown", "-3,1%", "text-amber-300"], ["Win rate", "61,8%", "text-sky-300"]].map(([label, value, tone]) => <div key={label} className="rounded-xl border border-white/[0.07] bg-black/40 p-2"><p className="text-[9px] uppercase tracking-wider text-zinc-400">{label}</p><p className={`mt-1 text-xs font-semibold ${tone}`}>{value}</p></div>)}</div>
      <div className="mt-3 flex h-16 items-end gap-1 rounded-xl border border-white/[0.06] bg-black/40 px-2 py-2">{[22, 31, 27, 40, 36, 48, 44, 56, 52, 62, 58, 69, 66, 76, 72, 84].map((height, index) => <span key={index} className={`flex-1 rounded-t-sm ${index === 5 || index === 11 ? "bg-emerald-300/80" : "bg-sky-300/35"}`} style={{ height: `${height}%` }} />)}</div>
      <p className="mt-2 text-[10px] text-zinc-400">Equity · comportements · contexte macro · décision</p>
    </div>
  );
}

const FIRM_RULES: Record<
  PropFirm,
  { tagline: string; daily: number; total: number }
> = {
  FTMO: { tagline: "Challenge & Verification", daily: 5, total: 10 },
  Topstep: { tagline: "Trading Combine", daily: 5, total: 10 },
  FundedNext: { tagline: "Evaluation", daily: 5, total: 10 },
};

function money(value: number): string {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateLabel(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
}

function LiveBadge({ label, online = true }: { label: string; online?: boolean }) {
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${online ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"}`}><span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />{label}</span>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton-shimmer rounded-xl ${className}`} />;
}

function deriveInsights(trades: MT5ParseResult["trades"]) {
  const bySymbol = new Map<string, number>();
  const byWeekday = new Map<string, number>();
  const bySession = new Map<string, number>();
  const sessionFor = (hour: number) => hour >= 8 && hour < 13 ? "Londres" : hour >= 13 && hour < 21 ? "New York" : "Asie";
  for (const trade of trades) {
    bySymbol.set(trade.symbol, (bySymbol.get(trade.symbol) ?? 0) + trade.profit);
    const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(trade.openTime);
    byWeekday.set(day, (byWeekday.get(day) ?? 0) + trade.profit);
    const session = sessionFor(trade.openTime.getHours());
    bySession.set(session, (bySession.get(session) ?? 0) + trade.profit);
  }
  const sorted = (map: Map<string, number>) => [...map.entries()].sort((a, b) => b[1] - a[1]);
  const pairs = sorted(bySymbol);
  const profitablePairs = pairs.filter(([, profit]) => profit > 0);
  const worstDay = [...byWeekday.entries()].filter(([, profit]) => profit < 0).sort((a, b) => a[1] - b[1])[0] ?? null;
  const sessions = sorted(bySession);
  const toxicPair = pairs.find(([, profit]) => profit < 0) ?? null;
  return { profitablePair: profitablePairs[0] ?? null, toxicPair, worstDay, bestSession: sessions.find(([, profit]) => profit > 0) ?? null };
}

function InsightCard({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "good" | "bad" | "neutral" }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-400/20"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</p><p className={`mt-3 truncate text-base font-semibold ${tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-rose-300" : "text-white"}`}>{value}</p><p className="mt-1 text-xs text-zinc-400">{detail}</p></div>;
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "good" | "bad" | "warn" | "neutral";
}) {
  const tones = {
    good: "text-emerald-300 bg-emerald-400/10",
    bad: "text-rose-300 bg-rose-400/10",
    warn: "text-amber-300 bg-amber-400/10",
    neutral: "text-sky-300 bg-sky-400/10",
  };
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-2xl shadow-black/10">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p
        className={`text-2xl font-semibold tracking-tight ${tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-rose-300" : tone === "warn" ? "text-amber-300" : "text-white"}`}
      >
        {value}
      </p>
      {detail && <p className="mt-2 text-xs text-zinc-400">{detail}</p>}
    </div>
  );
}

function RiskGauge({ score }: { score: number }) {
  const value = Math.min(100, Math.max(0, Math.round(score)));
  const color = value < 33 ? "#34d399" : value < 66 ? "#fbbf24" : "#fb7185";
  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <span className="text-5xl font-semibold tracking-tight text-white">
            {value}
          </span>
          <span className="ml-1 text-sm text-zinc-400">/100</span>
        </div>
        <span className="text-sm font-medium" style={{ color }}>
          {value < 33
            ? "Discipline saine"
            : value < 66
              ? "Vigilance requise"
              : "Risque élevé"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Severity({ value }: { value: DetectedBias["severity"] }) {
  const style =
    value === "high"
      ? "bg-rose-400/10 text-rose-300"
      : value === "medium"
        ? "bg-amber-400/10 text-amber-300"
        : "bg-emerald-400/10 text-emerald-300";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}
    >
      {value === "high" ? "Élevé" : value === "medium" ? "Modéré" : "Faible"}
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { ticket: string; equity: number; profit: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">
        {point.ticket === "INIT" ? "Solde initial" : `Ticket #${point.ticket}`}
      </p>
      <p className="mt-1 font-semibold text-white">{money(point.equity)}</p>
      <p className={point.profit >= 0 ? "text-emerald-300" : "text-rose-300"}>
        {signed(point.profit)} $
      </p>
    </div>
  );
}

function PropRulesChecker({ metrics }: { metrics: MT5Metrics }) {
  const [firm, setFirm] = useState<PropFirm>("FTMO");
  const [capital, setCapital] = useState<AccountSize>(10000);
  const rules = FIRM_RULES[firm];
  const dailyLimit = (capital * rules.daily) / 100;
  const totalLimit = (capital * rules.total) / 100;
  const drawdownValue = (capital * metrics.maxDrawdownPercent) / 100;
  const hasCapital = metrics.initialBalanceDetected;
  const compliant = hasCapital && metrics.maxDrawdownPercent <= rules.total;
  const nearLimit = hasCapital && metrics.maxDrawdownPercent > rules.daily && compliant;
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-2xl shadow-black/10 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Shield className="h-4 w-4 text-sky-300" /> Prop Firm Rules Checker
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            Comparez votre drawdown réel aux seuils de votre challenge.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${compliant ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}
        >
          {!hasCapital ? "Capital requis" : compliant ? "Dans les limites" : "Action requise"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-400">
          Prop firm
          <select
            value={firm}
            onChange={(e) => setFirm(e.target.value as PropFirm)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-white outline-none ring-sky-400 focus:ring-1"
          >
            {Object.keys(FIRM_RULES).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-400">
          Capital du compte
          <select
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value) as AccountSize)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-white outline-none ring-sky-400 focus:ring-1"
          >
            {[10000, 50000, 100000, 200000].map((size) => (
              <option key={size} value={size}>
                {money(size)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-xs text-zinc-400">{firm}</p>
          <p className="mt-1 text-sm font-medium text-white">{rules.tagline}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-xs text-zinc-400">Drawdown quotidien max</p>
          <p className="mt-1 font-semibold text-white">
            {rules.daily}%{" "}
            <span className="text-xs font-normal text-zinc-400">
              ({money(dailyLimit)})
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-xs text-zinc-400">Drawdown total max</p>
          <p className="mt-1 font-semibold text-white">
            {rules.total}%{" "}
            <span className="text-xs font-normal text-zinc-400">
              ({money(totalLimit)})
            </span>
          </p>
        </div>
      </div>
      <div
        className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${compliant ? (nearLimit ? "border-amber-400/20 bg-amber-400/[0.06]" : "border-emerald-400/20 bg-emerald-400/[0.06]") : "border-rose-400/25 bg-rose-400/[0.07]"}`}
      >
        <div className="mt-0.5">
          {compliant ? (
            nearLimit ? (
              <AlertTriangle className="h-4 w-4 text-amber-300" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            )
          ) : (
            <ShieldAlert className="h-4 w-4 text-rose-300" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {hasCapital ? <>Drawdown extrait : {metrics.maxDrawdownPercent.toFixed(1)}% ({money(drawdownValue)})</> : "Drawdown extrait : —"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            {!hasCapital
              ? "Saisissez le capital initial pour calculer le drawdown en pourcentage et la conformité."
              : compliant
              ? nearLimit
                ? "Vous êtes sous la limite totale, mais votre drawdown dépasse déjà le seuil quotidien de référence."
                : "Votre historique reste sous les limites configurées pour ce challenge."
              : "Votre drawdown dépasse la limite totale de référence. Réduisez le risque avant de poursuivre le challenge."}
          </p>
        </div>
      </div>
    </section>
  );
}

function PremiumCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        Premium
      </div>
      <Icon className="mb-4 h-5 w-5 text-violet-300" />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 pr-12 text-xs leading-relaxed text-zinc-400">{text}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-violet-300">
        <Lock className="h-3 w-3" /> Module avancé
      </div>
    </div>
  );
}

function PdfExportCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><FileText className="h-4 w-4" /> Rapport PDF professionnel</div>
      <p className="mt-3 text-xs leading-5 text-zinc-300">Générez un rapport imprimable avec le dashboard, les métriques, les graphiques et le contexte de votre audit.</p>
      <button type="button" onClick={() => window.print()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-3 py-2 text-xs font-semibold text-black transition hover:bg-emerald-200"><Download className="h-3.5 w-3.5" /> Exporter le rapport PDF</button>
      <p className="mt-2 text-[10px] text-zinc-400">La boîte de dialogue d’impression permet de choisir « Enregistrer au format PDF ».</p>
    </div>
  );
}

function fingerprint(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `auditprop-analysis-${(hash >>> 0).toString(16)}`;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<MT5ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showWarnings, setShowWarnings] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PsychAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"cockpit" | "behavioral" | "prop">(
    "cockpit",
  );
  const [planExpanded, setPlanExpanded] = useState(false);
  const [chartRange, setChartRange] = useState<"all" | "7" | "30" | "90">("all");
  const [globalAudit, setGlobalAudit] = useState<GlobalAudit | null>(null);
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
  const [globalAuditError, setGlobalAuditError] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<MT5Trade | null>(null);
  const [propFirmEnabled, setPropFirmEnabled] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [capitalInput, setCapitalInput] = useState<number | "">("");

  const handleAnalyze = useCallback(async (metrics: MT5Metrics, trades: MT5Trade[]) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    const cacheKey = fingerprint({ metrics, trades: trades.map((trade) => ({ ...trade, openTime: trade.openTime.toISOString(), closeTime: trade.closeTime?.toISOString() ?? null })) });
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        setAnalysis(JSON.parse(cached) as PsychAnalysis);
        setIsAnalyzing(false);
        return;
      }
    } catch {
      // Le cache local est facultatif.
    }
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics, closureContext: trades.map((trade) => ({ ticket: trade.ticket, closeTime: (trade.closeTime ?? trade.openTime).toISOString(), profit: trade.profit, volume: trade.volume, symbol: trade.symbol })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `Erreur serveur (${response.status})`);
      setAnalysis(data.analysis as PsychAnalysis);
      try { window.localStorage.setItem(cacheKey, JSON.stringify(data.analysis)); } catch { /* stockage facultatif */ }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Erreur inattendue lors de l'analyse.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const applyResult = useCallback(
    (result: MT5ParseResult, nextFile: File | null) => {
      setFile(nextFile);
      setParseError(null);
      setAnalysis(null);
      setAnalysisError(null);
      setGlobalAudit(null);
      setGlobalAuditError(null);
      setSelectedTrade(result.trades[0] ?? null);
      setIsDemo(false);
      window.localStorage.removeItem("auditprop-capital");
      setCapitalInput(result.metrics.initialBalanceDetected ? result.metrics.initialBalanceAssumed : "");
      setParseResult(result);
    },
    [],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const next = files?.[0];
      if (!next) return;
      if (!/\.(csv|html?|txt)$/i.test(next.name)) {
        setParseError(
          "Format non supporté. Fournissez un export CSV ou HTML compatible.",
        );
        return;
      }
      if (next.size > 15 * 1024 * 1024) {
        setParseError("Fichier trop volumineux (limite : 15 Mo).");
        return;
      }
      setParseResult(null);
      setAnalysis(null);
      setAnalysisError(null);
      setFile(next);
      next
        .text()
        .then((text) => {
          try {
            applyResult(parseUniversalHistory(text), next);
          } catch (error) {
            setParseError(
              error instanceof Error
                ? `${error.message} Exportez à nouveau l'historique en CSV UTF-8 ou en HTML depuis votre broker, puis réessayez.`
                : "Impossible de parser ce fichier. Exportez à nouveau l'historique en CSV UTF-8 ou en HTML depuis votre broker.",
            );
          }
        })
        .catch(() =>
          setParseError("Impossible de lire le contenu du fichier."),
        );
    },
    [applyResult],
  );

  const loadDemo = useCallback(() => {
    try {
      const result = parseUniversalHistory(getDemoHistoryCsv());
      setFile(null);
      setParseError(null);
      setAnalysis(null);
      setAnalysisError(null);
      setGlobalAudit(null);
      setGlobalAuditError(null);
      setSelectedTrade(result.trades[0] ?? null);
      window.localStorage.removeItem("auditprop-capital");
      setCapitalInput(result.metrics.initialBalanceDetected ? result.metrics.initialBalanceAssumed : "");
      setIsDemo(true);
      setParseResult(result);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "La démo est indisponible.");
    }
  }, []);

  const baseMetrics = parseResult?.metrics;
  const metrics = useMemo(() => baseMetrics && parseResult ? recalculateMetrics(parseResult.trades, capitalInput === "" ? 0 : capitalInput) : undefined, [baseMetrics, parseResult, capitalInput]);

  useEffect(() => {
    if (parseResult && metrics) void handleAnalyze(metrics, parseResult.trades);
  }, [parseResult, metrics, handleAnalyze]);
  const reset = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setAnalysis(null);
    setAnalysisError(null);
    setGlobalAudit(null);
    setGlobalAuditError(null);
    setSelectedTrade(null);
    setIsDemo(false);
    setShowWarnings(false);
    setActiveTab("cockpit");
    setPlanExpanded(false);
    if (inputRef.current) inputRef.current.value = "";
  };
  const generateGlobalAudit = async () => {
    if (!metrics || isGeneratingAudit) return;
    setIsGeneratingAudit(true);
    setGlobalAuditError(null);
    try {
      const response = await fetch("/api/audit-global", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metrics: { ...metrics, advanced } }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Audit IA indisponible.");
      setGlobalAudit(payload as GlobalAudit);
    } catch (error) {
      setGlobalAuditError(error instanceof Error ? error.message : "Audit IA indisponible.");
    } finally {
      setIsGeneratingAudit(false);
    }
  };
  const insights = useMemo(() => parseResult ? deriveInsights(parseResult.trades) : null, [parseResult]);
  const visibleEquity = useMemo(() => {
    if (!metrics || chartRange === "all") return metrics?.equityCurve ?? [];
    return metrics.equityCurve.slice(-Number(chartRange));
  }, [metrics, chartRange]);
  const advanced = useMemo(() => parseResult && metrics ? calculateAdvancedAnalytics(parseResult.trades, metrics) : null, [parseResult, metrics]);
  const monteCarlo = useMemo(() => parseResult && metrics ? projectMonteCarlo(parseResult.trades, metrics) : null, [parseResult, metrics]);

  return (
    <main className="min-h-screen overflow-hidden bg-black text-zinc-100">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/[0.07] py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg shadow-sky-500/20">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
                  <p className="text-sm font-semibold tracking-tight text-white">
                    AuditProp Trading OS
              </p>
              <p className="text-[11px] text-zinc-400">
                Decision intelligence for every trader
              </p>
            </div>
          </div>
          {parseResult && (
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Nouvelle analyse
            </button>
          )}
        </header>

        {!parseResult && <div className="flex max-w-full flex-wrap gap-2 overflow-x-auto border-b border-white/[0.07] py-3 sm:flex-nowrap"><LiveBadge label="Flux FXMacroData : Connecté" /><LiveBadge label="Groq AI Engine : En ligne" /></div>}

        {!parseResult && (
          <>
            <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/[0.07] px-3 py-1.5 text-xs font-medium text-sky-200">
                  <Sparkles className="h-3.5 w-3.5" /> Trading OS · moteur de décision IA
                </div>
                <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl">
                  Transformez votre historique de trading en{" "}
                  <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                    avantage de survie.
                  </span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
                  Analyse comportementale IA, protection contre le drawdown et
                  lecture claire de vos biais pour prendre de meilleures
                  décisions, actif après actif, session après session.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="mr-1 font-medium text-zinc-400">
                    Compatible avec
                  </span>
                  {["FTMO", "FundedNext", "Topstep", "MFF"].map((firm) => (
                    <span
                      key={firm}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-semibold text-zinc-300"
                    >
                      {firm}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-5 text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" /> Analyse
                    locale des métriques
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" /> Aucune
                    transaction brute envoyée
                  </span>
                </div>
                <button type="button" onClick={loadDemo} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300/60 hover:bg-emerald-300/20">
                  <Sparkles className="h-3.5 w-3.5" /> Tester la démo · {DEMO_TRADE_COUNT} trades
                </button>
              </div>
              <div>
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    handleFiles(event.dataTransfer.files);
                  }}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      inputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Importer un historique de trading"
                  className={`group cursor-pointer rounded-3xl border p-5 shadow-2xl shadow-black/20 transition ${isDragging ? "border-sky-300/60 bg-sky-300/[0.08]" : "border-white/[0.12] bg-white/[0.045] hover:border-sky-300/30 hover:bg-white/[0.06]"}`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.html,.htm,.txt"
                    className="hidden"
                    onChange={(event) => handleFiles(event.target.files)}
                  />
                  <div className="rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/20 to-indigo-400/20 text-sky-200">
                      <UploadCloud className="h-6 w-6 transition group-hover:-translate-y-1" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Déposez votre historique de trading
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      MT4/5, eToro, XTB, Boursorama, Coinbase ou TradingView · CSV / HTML / TXT · 15 Mo maximum
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950">
                      Choisir un fichier <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <button type="button" onClick={(event) => { event.stopPropagation(); loadDemo(); }} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-300/20">
                      <Sparkles className="h-3.5 w-3.5" /> Tester la démo
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-3 text-xs leading-5 text-emerald-100/80">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>
                    Vos données de trading ne sont jamais stockées sur nos
                    serveurs. L’analyse des métriques est effectuée
                    localement dans votre navigateur.
                  </span>
                </div>
                {parseError && (
                  <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-xs text-rose-200">
                    {parseError}
                  </div>
                )}
                <HeroDashboardPreview />
              </div>
            </section>
            <section className="border-t border-white/[0.07] py-14">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                  Comment ça marche
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  De l’historique brut à une décision plus lucide
                </h2>
              </div>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {(
                  [
                    ["01", "Exporte ton rapport MT5", "CSV / HTML", Download],
                    [
                      "02",
                      "L’IA détecte tes biais",
                      "Biais comportementaux et drawdown analysés",
                      ScanSearch,
                    ],
                    [
                      "03",
                      "Sécurise tes challenges",
                      "Ajuste ton plan de trading avec des décisions mesurées",
                      ShieldCheck,
                    ],
                  ] as const
                ).map(([number, title, text, Icon]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-300/10 text-sky-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-sky-300">
                        Étape {number}
                      </span>
                    </div>
                    <h3 className="mt-5 text-sm font-semibold text-white">
                      {title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-400">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <ProductProofSection />
            <MacroSection />
            <FAQSection />
          </>
        )}

        {parseResult && metrics && (
          <div className="space-y-7 pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Rapport prêt à être
                  exploité
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  Votre moteur de décision
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {isDemo ? "Démo AuditProp · données synthétiques" : file?.name || "Historique importé"} · {isDemo ? "45 trades" : parseResult.broker ?? "Source détectée"} · {metrics.totalTrades}{" "}
                  transactions · {dateLabel(metrics.startDate)} →{" "}
                  {dateLabel(metrics.endDate)}
                </p>
                <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-3">
                  <label className="text-xs font-medium text-amber-100">Capital initial de référence ($)
                    <input type="number" min="1" step="100" value={capitalInput} placeholder="Entrez votre capital" onChange={(event) => { const raw = event.target.value; setCapitalInput(raw === "" ? "" : Math.max(1, Number(raw))); }} className="mt-2 block w-52 rounded-xl border border-amber-300/20 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-300" />
                  </label>
                  <p className="max-w-md text-[11px] leading-5 text-zinc-400">Prioritaire pour les calculs. Détection automatique utilisée comme valeur de départ si le rapport contient un dépôt explicite.</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2"><LiveBadge label="Flux FXMacroData : Connecté" /><LiveBadge label={isAnalyzing ? "Groq AI Engine : Analyse" : "Groq AI Engine : En ligne"} /></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20">
                  <FileText className="h-3.5 w-3.5" /> Exporter l’audit en PDF
                </button>
                <button onClick={reset} className="hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:text-white sm:flex">
                  <X className="h-3.5 w-3.5" /> Effacer
                </button>
              </div>
            </div>
            <nav
              className="sticky top-2 z-20 grid grid-cols-3 rounded-2xl border border-white/10 bg-black/95 p-1 shadow-xl shadow-black/30 backdrop-blur"
              aria-label="Navigation du rapport"
            >
              <div className="col-span-3 mb-1 flex items-center justify-end px-2 pt-1"><label className="flex items-center gap-2 text-[10px] text-zinc-400"><input type="checkbox" checked={propFirmEnabled} onChange={(event) => { setPropFirmEnabled(event.target.checked); if (!event.target.checked && activeTab === "prop") setActiveTab("cockpit"); }} className="accent-emerald-400" /> Module Prop Firm</label></div>
              {(
                [
                  ["cockpit", "Cockpit", "KPIs & graphique"],
                  ["behavioral", "Analyse Behavioral", "Score & biais"],
                  ...(propFirmEnabled ? [["prop", "Prop Firm & Export", "Optionnel"]] as const : []),
                ] as const
              ).map(([tab, label, hint]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-2 py-2.5 text-center transition sm:px-4 ${activeTab === tab ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}`}
                >
                  <span className="block text-[11px] font-semibold sm:text-xs">
                    {label}
                  </span>
                  <span
                    className={`mt-0.5 hidden text-[10px] sm:block ${activeTab === tab ? "text-zinc-600" : "text-zinc-600"}`}
                  >
                    {hint}
                  </span>
                </button>
              ))}
            </nav>
            <TradingOsSummary metrics={metrics} />
            {parseResult.warnings.length > 0 && (
              <div>
                <button
                  onClick={() => setShowWarnings((value) => !value)}
                  className="flex items-center gap-2 text-xs text-amber-300"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />{" "}
                  {parseResult.warnings.length} avertissement
                  {parseResult.warnings.length > 1 ? "s" : ""}{" "}
                  {showWarnings ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                {showWarnings && (
                  <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                    {parseResult.warnings.map((warning, index) => (
                      <p key={index}>{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "cockpit" && (
              <>
                {insights && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><InsightCard label={insights.profitablePair ? "Paire la plus rentable" : "Aucune paire rentable"} value={insights.profitablePair?.[0] ?? "Aucune donnée positive"} detail={insights.profitablePair ? `${signed(insights.profitablePair[1])} $ net` : "Aucun PnL positif sur l'import"} tone={insights.profitablePair ? "good" : "neutral"} /><InsightCard label="Paire la plus déficitaire" value={insights.toxicPair?.[0] ?? "Donnée insuffisante"} detail={insights.toxicPair ? `${signed(insights.toxicPair[1])} $ net` : "Importez plusieurs trades"} tone="bad" /><InsightCard label="Pire jour de la semaine" value={insights.worstDay?.[0] ?? "Donnée insuffisante"} detail={insights.worstDay ? `${signed(insights.worstDay[1])} $ cumulé` : "Données insuffisantes"} tone="bad" /><InsightCard label={insights.bestSession ? "Session positive" : "Aucune session positive"} value={insights.bestSession?.[0] ?? "Aucune donnée positive"} detail={insights.bestSession ? `${signed(insights.bestSession[1])} $ cumulé` : "Aucun PnL positif sur l'import"} tone={insights.bestSession ? "good" : "neutral"} /></div>}
                <DecisionGate metrics={metrics} trades={parseResult.trades} />
                {metrics.smallSampleSymbols.length > 0 && <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs text-amber-100">Échantillon trop faible : {metrics.smallSampleSymbols.map((symbol) => `${symbol} (${parseResult.trades.filter((trade) => trade.symbol === symbol).length} trades)`).join(", ")}. Les statistiques par paire restent indicatives sous 5 trades.</div>}
                {metrics.abnormalSizingAlert && <div className="space-y-2 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs text-rose-100"><p>Sizing anormal détecté : {metrics.abnormalSizingCount} saut(s) de lot dans le temps.</p>{metrics.sizingAlerts.map((alert, index) => <p key={`${alert.message}-${index}`} className={alert.kind === "too-large" ? "text-rose-200" : "text-amber-200"}>{alert.message}</p>)}</div>}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  <StatCard
                    label="P&L total"
                    value={`${signed(metrics.totalPnL)} $`}
                    icon={metrics.totalPnL >= 0 ? TrendingUp : TrendingDown}
                    tone={metrics.totalPnL >= 0 ? "good" : "bad"}
                  />
                  <StatCard
                    label="Win rate"
                    value={`${metrics.winRate.toFixed(1)}%`}
                    detail={`${metrics.totalWins} gagnants · ${metrics.totalLosses} perdants`}
                    icon={Percent}
                    tone={metrics.winRate >= 50 ? "good" : "warn"}
                  />
                  <StatCard
                    label="Max drawdown"
                    value={metrics.initialBalanceDetected ? `${metrics.maxDrawdownPercent.toFixed(1)}%` : "—"}
                    detail={metrics.initialBalanceDetected ? `${signed(-metrics.maxDrawdownAbsolute)} $` : "Capital requis"}
                    icon={Activity}
                    tone={
                      !metrics.initialBalanceDetected
                        ? "neutral"
                        : metrics.maxDrawdownPercent > 10
                        ? "bad"
                        : metrics.maxDrawdownPercent > 5
                          ? "warn"
                          : "good"
                    }
                  />
                  <StatCard
                    label="Profit factor"
                    value={
                      metrics.profitFactor === null
                        ? "∞"
                        : metrics.profitFactor.toFixed(2)
                    }
                    icon={Gauge}
                    tone={(metrics.profitFactor ?? 0) >= 1 ? "good" : "bad"}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3"><div><p className="text-xs font-semibold text-white">Execution Mapping</p><p className="mt-1 text-[11px] text-zinc-400">Sélectionnez un trade pour afficher entrée, sortie, SL et TP.</p></div><select value={selectedTrade?.ticket ?? ""} onChange={(event) => setSelectedTrade(parseResult.trades.find((trade) => trade.ticket === event.target.value) ?? null)} className="max-w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white"><option value="">Aucun trade sélectionné</option>{parseResult.trades.map((trade) => <option key={trade.ticket} value={trade.ticket}>#{trade.ticket} · {trade.symbol} · {signed(trade.profit)} $</option>)}</select></div>
                <ChartistPanel result={parseResult} selectedTrade={selectedTrade} />
                {advanced && <div className="grid gap-4 lg:grid-cols-2"><PnlHeatmap days={advanced.heatmap} /><InstitutionalMetrics analytics={advanced} /></div>}
                {advanced && <ConsistencyCheck analytics={advanced} />}
                {advanced && monteCarlo && <div className="grid gap-4 lg:grid-cols-2"><MonteCarloPanel projection={monteCarlo} /><TradeTagging trades={parseResult.trades} /></div>}
                {advanced && <StrategyRoadmap result={parseResult} metrics={metrics} advanced={advanced} />}
                <section className="rounded-3xl border border-violet-400/15 bg-violet-400/[0.04] p-4 shadow-2xl shadow-black/10 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-violet-300" /> Diagnostic IA global</div><p className="mt-1 text-xs text-zinc-400">Une synthèse Groq basée uniquement sur les métriques agrégées.</p></div><button type="button" onClick={() => void generateGlobalAudit()} disabled={isGeneratingAudit} className="inline-flex items-center gap-2 rounded-xl bg-violet-300 px-3 py-2 text-xs font-semibold text-black transition hover:bg-violet-200 disabled:opacity-50">{isGeneratingAudit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Générer l’Audit IA</button></div>{globalAuditError && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{globalAuditError}</p>}{globalAudit && <div className="mt-5 space-y-5"><p className="text-sm leading-6 text-zinc-300">{globalAudit.summary}</p><div className="grid gap-4 md:grid-cols-3">{[["Forces", globalAudit.strengths, "text-emerald-300"], ["Faiblesses", globalAudit.weaknesses, "text-rose-300"], ["Plan d'action", globalAudit.actionPlan, "text-sky-300"]].map(([title, items, tone]) => <div key={title as string} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"><h4 className={`text-xs font-semibold uppercase tracking-wider ${tone as string}`}>{title as string}</h4><ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-400">{(items as string[]).map((item, index) => <li key={index}>• {item}</li>)}</ul></div>)}</div></div>}</section>
                <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-2xl shadow-black/10">
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Courbe de capital
                        </h3>
                        <p className="mt-1 text-xs text-zinc-400">
                          Évolution de l’equity par transaction
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">{metrics.symbolsTraded.join(" · ")}</span><div className="flex rounded-lg border border-white/10 p-0.5">{(["all", "7", "30", "90"] as const).map((range) => <button key={range} type="button" onClick={() => setChartRange(range)} className={`rounded-md px-2 py-1 text-[10px] ${chartRange === range ? "bg-emerald-400 text-black" : "text-zinc-400 hover:text-white"}`}>{range === "all" ? "Tout" : `${range} tr`}</button>)}</div></div>
                    </div>
                    <ResponsiveContainer width="100%" height={310}>
                      <AreaChart
                        data={visibleEquity}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="v2Equity"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#38bdf8"
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="95%"
                              stopColor="#38bdf8"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff12"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="index"
                          stroke="#71717a"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: "#ffffff1a" }}
                          tickFormatter={(value: number) => `#${value}`}
                        />
                        <YAxis
                          stroke="#71717a"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={62}
                          domain={["dataMin - 100", "dataMax + 100"]}
                          tickFormatter={(value: number) =>
                            `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`
                          }
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <ReferenceLine
                          y={metrics.initialBalanceAssumed}
                          stroke="#ffffff30"
                          strokeDasharray="4 4"
                        />
                        <Area
                          type="monotone"
                          dataKey="equity"
                          stroke="#38bdf8"
                          strokeWidth={2.5}
                          fill="url(#v2Equity)"
                          dot={false}
                          activeDot={{
                            r: 5,
                            fill: "#38bdf8",
                            stroke: "#07090f",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-2xl shadow-black/10">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Psychological risk score
                        </h3>
                        <p className="mt-1 text-xs text-zinc-400">
                          Lecture comportementale IA
                        </p>
                      </div>
                    </div>
                    {isAnalyzing && (
                      <div className="min-h-[240px] space-y-4 pt-4"><Skeleton className="h-8 w-24" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><div className="pt-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-sky-300" /><p className="mt-3 text-sm text-zinc-300">Analyse Groq en cours…</p><p className="mt-1 text-xs text-zinc-400">Vos métriques restent déterministes.</p></div></div>
                    )}
                    {!isAnalyzing && analysisError && (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-xs text-rose-200">
                          {analysisError}
                        </div>
                        <button
                          onClick={() => handleAnalyze(metrics, parseResult.trades)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300"
                        >
                          Réessayer
                        </button>
                      </div>
                    )}
                    {!isAnalyzing && analysis && (
                      <div className="space-y-5">
                        <RiskGauge score={analysis.riskScore} />
                        <p className="text-sm leading-6 text-zinc-400">
                          {analysis.summary}
                        </p>
                        <div
                          className={`rounded-2xl border p-4 ${analysis.drawdownAlert.level === "critical" ? "border-rose-400/20 bg-rose-400/[0.06]" : analysis.drawdownAlert.level === "warning" ? "border-amber-400/20 bg-amber-400/[0.06]" : "border-emerald-400/20 bg-emerald-400/[0.06]"}`}
                        >
                          <p className="text-xs leading-5 text-zinc-300">
                            {analysis.drawdownAlert.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {activeTab === "prop" && propFirmEnabled && <PropRulesChecker metrics={metrics} />}
            {activeTab === "prop" && propFirmEnabled && (
              <div className="grid gap-3 sm:grid-cols-2">
                <AuditCard metrics={metrics} />
                <PdfExportCard />
                <PremiumCard
                  icon={Flame}
                  title="Sur-réactivité post-perte"
                  text="Identifiez les ré-entrées précipitées et les séquences de compensation avec une terminologie institutionnelle."
                />
              </div>
            )}
            {activeTab === "behavioral" && analysis && (
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Psychological risk score
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      Analyse comportementale IA
                    </p>
                  </div>
                </div>
                <RiskGauge score={analysis.riskScore} />
                <p className="mt-5 text-sm leading-6 text-zinc-400">
                  {analysis.summary}
                </p>
                <div
                  className={`mt-5 rounded-2xl border p-4 ${analysis.drawdownAlert.level === "critical" ? "border-rose-400/20 bg-rose-400/[0.06]" : analysis.drawdownAlert.level === "warning" ? "border-amber-400/20 bg-amber-400/[0.06]" : "border-emerald-400/20 bg-emerald-400/[0.06]"}`}
                >
                  <p className="text-xs leading-5 text-zinc-300">
                    {analysis.drawdownAlert.message}
                  </p>
                </div>
              </div>
            )}
            {activeTab === "behavioral" &&
              analysis &&
              analysis.biasesDetected.length > 0 && (
                <div className="grid gap-7 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-6">
                    <h3 className="mb-4 text-sm font-semibold text-white">
                      Biais détectés
                    </h3>
                    <div className="space-y-3">
                      {analysis.biasesDetected.map((bias, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm font-medium text-white">
                              <Flame className="h-3.5 w-3.5 text-violet-300" />
                              {bias.name}
                            </span>
                            <Severity value={bias.severity} />
                          </div>
                          <p className="mt-2 text-xs leading-5 text-zinc-400">
                            {bias.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-white">
                        Plan d’action
                      </h3>
                      <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        {analysis.recommendations.length} étapes
                      </span>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {analysis.recommendations
                        .slice(0, planExpanded ? undefined : 1)
                        .map((recommendation, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 text-sm leading-5 text-zinc-300"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                            {recommendation}
                          </li>
                        ))}
                    </ul>
                    {analysis.recommendations.length > 1 && (
                      <button
                        onClick={() => setPlanExpanded((value) => !value)}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white"
                      >
                        {planExpanded
                          ? "Réduire le plan"
                          : "Voir le plan complet"}
                        {planExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
        <footer className="mt-20 border-t border-white/[0.07] pt-10 text-xs text-zinc-400">
          <div className="grid gap-8 sm:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <AuditPropLogo className="h-7 w-7 text-emerald-400" />
                <span>AuditProp</span>
              </div>
              <p className="mt-2 max-w-xs leading-5">
                Trading OS universel : comportement, contexte macro et décision
                mesurée pour chaque marché.
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-zinc-300">
                Informations
              </p>
              <div className="mt-3 space-y-2">
                <a href="#mentions-legales" className="block hover:text-white">
                  Mentions légales
                </a>
                <a href="#confidentialite" className="block hover:text-white">
                  Politique de confidentialité
                </a>
                <a href="#cgu" className="block hover:text-white">
                  CGU / Conditions d’utilisation
                </a>
              </div>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-zinc-300">
                Besoin d’aide ?
              </p>
              <div className="mt-3 space-y-2">
                <a
                  href="mailto:support@risk-bias-audit.com"
                  className="block hover:text-white"
                >
                  Contact / Support
                </a>
                <a href="#faq" className="block hover:text-white">
                  FAQ
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
            <span>
              © {new Date().getFullYear()} AuditProp · SaaS V2
            </span>
            <span>Analyse de risque, pas conseil financier.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
