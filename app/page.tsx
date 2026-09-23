"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  parseMT5History,
  type MT5Metrics,
  type MT5ParseResult,
} from "@/lib/mt5-parser";
import ChartistPanel from "@/components/chartist-panel";
import MacroSection from "@/components/macro-section";

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
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
              )}
            </button>
            {open === index && (
              <p className="border-t border-white/[0.07] px-4 pb-4 pt-3 text-sm leading-6 text-zinc-500">
                {answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
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

const DEMO_METRICS: MT5Metrics = {
  totalTrades: 24,
  totalWins: 13,
  totalLosses: 11,
  totalPnL: 840,
  winRate: 54.2,
  profitFactor: 1.31,
  maxDrawdownPercent: 4.8,
  maxDrawdownAbsolute: 480,
  averageWin: 142,
  averageLoss: 96,
  bestTrade: 410,
  worstTrade: -260,
  maxLosingStreak: {
    length: 3,
    totalLoss: -260,
    startTicket: "DEMO-08",
    endTicket: "DEMO-10",
    startTime: "2026-09-01T09:00:00Z",
    endTime: "2026-09-03T09:00:00Z",
  },
  significantLosingStreaks: 1,
  quickReentriesAfterLoss: 2,
  revengeWindowMinutes: 5,
  initialBalanceAssumed: 10000,
  startDate: "2026-09-01T09:00:00Z",
  endDate: "2026-09-22T16:00:00Z",
  symbolsTraded: ["EURUSD", "NAS100", "XAUUSD"],
  equityCurve: [
    {
      index: 0,
      ticket: "INIT",
      time: "2026-09-01T09:00:00Z",
      equity: 10000,
      profit: 0,
    },
    {
      index: 1,
      ticket: "DEMO-01",
      time: "2026-09-01T12:00:00Z",
      equity: 10180,
      profit: 180,
    },
    {
      index: 2,
      ticket: "DEMO-02",
      time: "2026-09-03T09:00:00Z",
      equity: 10090,
      profit: -90,
    },
    {
      index: 3,
      ticket: "DEMO-03",
      time: "2026-09-05T14:00:00Z",
      equity: 10320,
      profit: 230,
    },
    {
      index: 4,
      ticket: "DEMO-04",
      time: "2026-09-08T10:00:00Z",
      equity: 10410,
      profit: 90,
    },
    {
      index: 5,
      ticket: "DEMO-05",
      time: "2026-09-10T15:00:00Z",
      equity: 10280,
      profit: -130,
    },
    {
      index: 6,
      ticket: "DEMO-06",
      time: "2026-09-12T11:00:00Z",
      equity: 10540,
      profit: 260,
    },
    {
      index: 7,
      ticket: "DEMO-07",
      time: "2026-09-15T13:00:00Z",
      equity: 10460,
      profit: -80,
    },
    {
      index: 8,
      ticket: "DEMO-08",
      time: "2026-09-17T09:00:00Z",
      equity: 10280,
      profit: -180,
    },
    {
      index: 9,
      ticket: "DEMO-09",
      time: "2026-09-18T09:00:00Z",
      equity: 10120,
      profit: -160,
    },
    {
      index: 10,
      ticket: "DEMO-10",
      time: "2026-09-19T09:00:00Z",
      equity: 10060,
      profit: -60,
    },
    {
      index: 11,
      ticket: "DEMO-11",
      time: "2026-09-20T14:00:00Z",
      equity: 10350,
      profit: 290,
    },
    {
      index: 12,
      ticket: "DEMO-12",
      time: "2026-09-22T16:00:00Z",
      equity: 10840,
      profit: 490,
    },
  ],
};

function demoResult(): MT5ParseResult {
  return {
    trades: [],
    metrics: DEMO_METRICS,
    warnings: [],
    sourceFormat: "csv",
  };
}

function money(value: number): string {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " $";
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
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
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
      {detail && <p className="mt-2 text-xs text-zinc-500">{detail}</p>}
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
          <span className="ml-1 text-sm text-zinc-500">/100</span>
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
      <p className="text-zinc-500">
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
  const compliant = metrics.maxDrawdownPercent <= rules.total;
  const nearLimit = metrics.maxDrawdownPercent > rules.daily && compliant;
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-2xl shadow-black/10 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Shield className="h-4 w-4 text-sky-300" /> Prop Firm Rules Checker
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            Comparez votre drawdown réel aux seuils de votre challenge.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${compliant ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}
        >
          {compliant ? "Dans les limites" : "Action requise"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-500">
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
        <label className="text-xs text-zinc-500">
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
          <p className="text-xs text-zinc-500">{firm}</p>
          <p className="mt-1 text-sm font-medium text-white">{rules.tagline}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-xs text-zinc-500">Drawdown quotidien max</p>
          <p className="mt-1 font-semibold text-white">
            {rules.daily}%{" "}
            <span className="text-xs font-normal text-zinc-500">
              ({money(dailyLimit)})
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-xs text-zinc-500">Drawdown total max</p>
          <p className="mt-1 font-semibold text-white">
            {rules.total}%{" "}
            <span className="text-xs font-normal text-zinc-500">
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
            Drawdown extrait : {metrics.maxDrawdownPercent.toFixed(1)}% (
            {money(drawdownValue)})
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            {compliant
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
      <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        Premium
      </div>
      <Icon className="mb-4 h-5 w-5 text-violet-300" />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 pr-12 text-xs leading-relaxed text-zinc-500">{text}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-violet-300">
        <Lock className="h-3 w-3" /> Bientôt disponible
      </div>
    </div>
  );
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

  const handleAnalyze = useCallback(async (metrics: MT5Metrics) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data?.error || `Erreur serveur (${response.status})`);
      setAnalysis(data.analysis as PsychAnalysis);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Erreur inattendue lors de l'analyse.",
      );
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
      setParseResult(result);
    },
    [],
  );
  const loadDemo = useCallback(
    () => applyResult(demoResult(), null),
    [applyResult],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const next = files?.[0];
      if (!next) return;
      if (!/\.(csv|html?|txt)$/i.test(next.name)) {
        setParseError(
          "Format non supporté. Fournissez un export MT5 .csv ou .html.",
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
            applyResult(parseMT5History(text), next);
          } catch (error) {
            setParseError(
              error instanceof Error
                ? error.message
                : "Impossible de parser ce fichier.",
            );
          }
        })
        .catch(() =>
          setParseError("Impossible de lire le contenu du fichier."),
        );
    },
    [applyResult],
  );

  useEffect(() => {
    if (parseResult) void handleAnalyze(parseResult.metrics);
  }, [parseResult, handleAnalyze]);
  const reset = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setAnalysis(null);
    setAnalysisError(null);
    setShowWarnings(false);
    setActiveTab("cockpit");
    setPlanExpanded(false);
    if (inputRef.current) inputRef.current.value = "";
  };
  const metrics = parseResult?.metrics;

  return (
    <main className="min-h-screen overflow-hidden bg-black text-zinc-100">
      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/[0.07] py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg shadow-sky-500/20">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">
                Risk &amp; Bias Audit
              </p>
              <p className="text-[11px] text-zinc-500">
                MT5 intelligence for Prop Firms
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

        {!parseResult && (
          <>
            <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/[0.07] px-3 py-1.5 text-xs font-medium text-sky-200">
                  <Sparkles className="h-3.5 w-3.5" /> Intelligence
                  comportementale pour traders
                </div>
                <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl">
                  Transformez votre historique MT5 en{" "}
                  <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                    avantage de survie.
                  </span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
                  Analyse comportementale IA, protection contre le drawdown et
                  lecture claire de vos biais pour réussir vos challenges Prop
                  Firms avec plus de discipline.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
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
                <div className="mt-8 flex flex-wrap gap-5 text-xs text-zinc-500">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" /> Analyse
                    locale des métriques
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" /> Aucune
                    transaction brute envoyée
                  </span>
                </div>
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
                  role="button"
                  tabIndex={0}
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
                      Déposez votre historique MT5
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                      CSV, HTML ou TXT · 15 Mo maximum
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950">
                      Choisir un fichier <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    loadDemo();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-300/[0.07] px-4 py-3 text-xs font-semibold text-violet-200 transition hover:bg-violet-300/[0.12]"
                >
                  <Sparkles className="h-4 w-4" /> Tester avec un exemple
                </button>
                <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-3 text-xs leading-5 text-emerald-100/80">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>
                    Vos données de trading ne sont jamais stockées sur nos
                    serveurs. L&apos;analyse des métriques est effectuée
                    localement dans votre navigateur.
                  </span>
                </div>
                {parseError && (
                  <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-xs text-rose-200">
                    {parseError}
                  </div>
                )}
              </div>
            </section>
            <section className="border-t border-white/[0.07] py-14">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                  Comment ça marche
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  De l&apos;historique brut à une décision plus lucide
                </h2>
              </div>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {([
                  ["01", "Exporte ton rapport MT5", "CSV / HTML", Download],
                  [
                    "02",
                    "L&apos;IA détecte tes biais",
                    "Biais comportementaux et drawdown analysés",
                    ScanSearch,
                  ],
                  [
                    "03",
                    "Sécurise tes challenges",
                    "Ajuste ton plan de trading pour tes Prop Firms",
                    ShieldCheck,
                  ],
                ] as const).map(([number, title, text, Icon]) => (
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
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
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
                  Votre cockpit de risque
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {file?.name || "Mode démo interactif"} · {metrics.totalTrades}{" "}
                  transactions · {dateLabel(metrics.startDate)} →{" "}
                  {dateLabel(metrics.endDate)}
                </p>
              </div>
              <button
                onClick={reset}
                className="hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:text-white sm:flex"
              >
                <X className="h-3.5 w-3.5" /> Effacer
              </button>
            </div>
            <nav
              className="sticky top-2 z-20 grid grid-cols-3 rounded-2xl border border-white/10 bg-black/95 p-1 shadow-xl shadow-black/30 backdrop-blur"
              aria-label="Navigation du rapport"
            >
              {(
                [
                  ["cockpit", "Cockpit", "KPIs & graphique"],
                  ["behavioral", "Analyse Behavioral", "Score & biais"],
                  ["prop", "Prop Firm & Export", "Règles & Premium"],
                ] as const
              ).map(([tab, label, hint]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-2 py-2.5 text-center transition sm:px-4 ${activeTab === tab ? "bg-white text-black" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"}`}
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
                  <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-500">
                    {parseResult.warnings.map((warning, index) => (
                      <p key={index}>{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "cockpit" && (
              <>
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
                    value={`${metrics.maxDrawdownPercent.toFixed(1)}%`}
                    detail={`${signed(-metrics.maxDrawdownAbsolute)} $`}
                    icon={Activity}
                    tone={
                      metrics.maxDrawdownPercent > 10
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
                <ChartistPanel result={parseResult} />
                <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-2xl shadow-black/10">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Courbe de capital
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          Évolution de l&apos;equity par transaction
                        </p>
                      </div>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                        {metrics.symbolsTraded.join(" · ")}
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={310}>
                      <AreaChart
                        data={metrics.equityCurve}
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
                        />
                        <YAxis
                          stroke="#71717a"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={62}
                          tickFormatter={(value: number) =>
                            value.toLocaleString("fr-FR")
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
                        <p className="mt-1 text-xs text-zinc-500">
                          Lecture comportementale IA
                        </p>
                      </div>
                    </div>
                    {isAnalyzing && (
                      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-300" />
                        <p className="text-sm text-zinc-300">
                          Analyse Groq en cours…
                        </p>
                        <p className="text-xs text-zinc-500">
                          Vos métriques restent déterministes.
                        </p>
                      </div>
                    )}
                    {!isAnalyzing && analysisError && (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-xs text-rose-200">
                          {analysisError}
                        </div>
                        <button
                          onClick={() => handleAnalyze(metrics)}
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
            {activeTab === "prop" && <PropRulesChecker metrics={metrics} />}
            {activeTab === "prop" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <PremiumCard
                  icon={FileText}
                  title="Export PDF professionnel"
                  text="Transformez votre audit en rapport partageable pour votre journal ou votre coach."
                />
                <PremiumCard
                  icon={Flame}
                  title="Détecteur de revenge trading"
                  text="Identifiez les ré-entrées émotionnelles et les séquences à risque avec une vue dédiée."
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
                    <p className="mt-1 text-xs text-zinc-500">
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
                          <p className="mt-2 text-xs leading-5 text-zinc-500">
                            {bias.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-white">
                        Plan d&apos;action
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
        <footer className="mt-20 border-t border-white/[0.07] pt-10 text-xs text-zinc-500">
          <div className="grid gap-8 sm:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <p className="text-sm font-semibold text-white">
                Risk &amp; Bias Audit
              </p>
              <p className="mt-2 max-w-xs leading-5">
                Intelligence comportementale et contexte macro pour traders et
                challenges Prop Firm.
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
                  CGU / Conditions d&apos;utilisation
                </a>
              </div>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-zinc-300">
                Besoin d&apos;aide ?
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
              © {new Date().getFullYear()} Risk &amp; Bias Audit · SaaS V2
            </span>
            <span>Analyse de risque, pas conseil financier.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
