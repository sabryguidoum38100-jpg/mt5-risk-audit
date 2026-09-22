"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  Gauge,
  AlertTriangle,
  Brain,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  CheckCircle2,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  parseMT5History,
  type MT5ParseResult,
  type MT5Metrics,
} from "@/lib/mt5-parser";

// ---------------------------------------------------------------------------
// Types locaux (miroir de app/api/analyze/route.ts)
// ---------------------------------------------------------------------------

interface DetectedBias {
  name: string;
  severity: "low" | "medium" | "high";
  description: string;
}

interface PsychAnalysis {
  riskScore: number;
  summary: string;
  biasesDetected: DetectedBias[];
  drawdownAlert: {
    level: "ok" | "warning" | "critical";
    message: string;
  };
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Formatage
// ---------------------------------------------------------------------------

function fmtSigned(n: number): string {
  const sign = n > 0 ? "+" : "";
  return sign + n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function PrimaryStatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "positive" | "negative" | "warning" | "neutral";
}) {
  const toneText: Record<string, string> = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    warning: "text-amber-400",
    neutral: "text-white",
  };
  const toneChip: Record<string, string> = {
    positive: "bg-emerald-500/10 text-emerald-400",
    negative: "bg-red-500/10 text-red-400",
    warning: "bg-amber-500/10 text-amber-400",
    neutral: "bg-white/10 text-zinc-300",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-zinc-500">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneChip[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className={`text-[26px] font-semibold leading-none tabular-nums ${toneText[tone]}`}>{value}</p>
      {sub && <p className="mt-2 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function SecondaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "warning";
}) {
  const toneText =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
      ? "text-red-400"
      : tone === "warning"
      ? "text-amber-400"
      : "text-white";
  return (
    <div className="p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-[15px] font-medium tabular-nums ${toneText}`}>{value}</p>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { ticket: string; equity: number; profit: number } }[];
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const isInit = d.ticket === "INIT";
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-500">{isInit ? "Solde initial" : `Ticket #${d.ticket}`}</p>
      <p className="mt-0.5 font-medium tabular-nums text-white">
        {d.equity.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      {!isInit && (
        <p className={`tabular-nums ${d.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {fmtSigned(d.profit)}
        </p>
      )}
    </div>
  );
}

function RiskGauge({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const color = clamped < 33 ? "#34d399" : clamped < 66 ? "#fbbf24" : "#f87171";
  const label = clamped < 33 ? "Discipline saine" : clamped < 66 ? "Vigilance requise" : "Risque élevé";
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-3xl font-semibold tabular-nums text-white">
          {clamped}
          <span className="text-base text-zinc-500">/100</span>
        </span>
        <span className="text-sm font-medium" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const map = {
    low: "bg-emerald-500/10 text-emerald-400",
    medium: "bg-amber-500/10 text-amber-400",
    high: "bg-red-500/10 text-red-400",
  };
  const text = { low: "Faible", medium: "Modéré", high: "Élevé" };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${map[severity]}`}>
      {text[severity]}
    </span>
  );
}

function DrawdownAlertBox({ alert }: { alert: PsychAnalysis["drawdownAlert"] }) {
  const styles = {
    ok: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", icon: CheckCircle2, color: "text-emerald-400" },
    warning: { border: "border-amber-500/20", bg: "bg-amber-500/5", icon: AlertTriangle, color: "text-amber-400" },
    critical: { border: "border-red-500/30", bg: "bg-red-500/5", icon: ShieldAlert, color: "text-red-400" },
  } as const;
  const s = styles[alert.level];
  const Icon = s.icon;
  return (
    <div className={`flex gap-3 rounded-xl border ${s.border} ${s.bg} p-4`}>
      <Icon className={`h-4 w-4 flex-shrink-0 ${s.color}`} />
      <p className="text-sm leading-relaxed text-zinc-300">{alert.message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------

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

  const handleAnalyze = useCallback(async (metrics: MT5Metrics) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur serveur (${res.status})`);
      setAnalysis(data.analysis as PsychAnalysis);
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : "Erreur inattendue lors de l'analyse.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleFiles = useCallback((fileList: FileList | null) => {
    const f = fileList?.[0];
    if (!f) return;

    setParseError(null);
    setAnalysis(null);
    setAnalysisError(null);
    setParseResult(null);

    if (!/\.(csv|html?|txt)$/i.test(f.name)) {
      setParseError("Format non supporté. Fournissez un export MetaTrader 5 au format .csv ou .html.");
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setParseError("Fichier trop volumineux (limite : 15 Mo).");
      return;
    }

    setFile(f);

    f.text()
      .then((text) => {
        try {
          const result = parseMT5History(text);
          setParseResult(result);
        } catch (e) {
          setParseError(e instanceof Error ? e.message : "Erreur inattendue lors du parsing du fichier.");
        }
      })
      .catch(() => setParseError("Impossible de lire le contenu du fichier."));
  }, []);

  // Lance automatiquement l'analyse psychologique dès que le parsing réussit
  useEffect(() => {
    if (parseResult) void handleAnalyze(parseResult.metrics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseResult]);

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setAnalysis(null);
    setAnalysisError(null);
    setShowWarnings(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const metrics = parseResult?.metrics ?? null;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Risk &amp; Bias Audit</h1>
            <p className="text-xs text-zinc-500">Analyse comportementale d&apos;historique MT5</p>
          </div>
        </div>
        {parseResult && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            Nouveau fichier
          </button>
        )}
      </header>

      {/* Zone de dépôt (affichée tant qu'aucun résultat n'est disponible) */}
      {!parseResult && (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-20 text-center transition-colors ${
              isDragging
                ? "border-indigo-400/60 bg-indigo-400/5"
                : "border-white/10 bg-zinc-950/40 hover:border-white/20 hover:bg-zinc-950/60"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.html,.htm,.txt"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div
              className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${
                isDragging ? "border-indigo-400/40 bg-indigo-400/10" : "border-white/10 bg-white/5"
              }`}
            >
              <UploadCloud className={`h-6 w-6 ${isDragging ? "text-indigo-400" : "text-zinc-500"}`} />
            </div>
            <p className="mb-1 text-sm font-medium text-white">
              Glissez-déposez votre historique MT5
            </p>
            <p className="text-xs text-zinc-500">Export .csv ou .html — ou cliquez pour parcourir</p>
          </div>

          {parseError && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">Échec du parsing</p>
                <p className="mt-0.5 text-xs text-zinc-400">{parseError}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Résultats */}
      {parseResult && metrics && (
        <div className="space-y-8">
          {/* Ligne d'information sur le fichier */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {file?.name}
            </span>
            <span>{metrics.totalTrades} transactions</span>
            {metrics.startDate && (
              <span>
                {fmtDate(metrics.startDate)} → {fmtDate(metrics.endDate)}
              </span>
            )}
            {parseResult.warnings.length > 0 && (
              <button
                onClick={() => setShowWarnings((v) => !v)}
                className="ml-auto inline-flex items-center gap-1 text-amber-400/80 transition-colors hover:text-amber-400"
              >
                {parseResult.warnings.length} ligne{parseResult.warnings.length > 1 ? "s" : ""} ignorée
                {parseResult.warnings.length > 1 ? "s" : ""}
                {showWarnings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>

          {showWarnings && (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-xs text-zinc-500">
              {parseResult.warnings.map((w, i) => (
                <p key={i} className="py-0.5">
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Cartes de statistiques clés */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <PrimaryStatCard
              label="P&L total"
              value={fmtSigned(metrics.totalPnL)}
              icon={metrics.totalPnL >= 0 ? TrendingUp : TrendingDown}
              tone={metrics.totalPnL >= 0 ? "positive" : "negative"}
            />
            <PrimaryStatCard
              label="Win rate"
              value={`${metrics.winRate.toFixed(1)}%`}
              sub={`${metrics.totalWins} gagnants / ${metrics.totalLosses} perdants`}
              icon={Percent}
              tone={metrics.winRate >= 50 ? "positive" : "warning"}
            />
            <PrimaryStatCard
              label="Max drawdown"
              value={`${metrics.maxDrawdownPercent.toFixed(1)}%`}
              sub={fmtSigned(-metrics.maxDrawdownAbsolute)}
              icon={Activity}
              tone={
                metrics.maxDrawdownPercent > 10
                  ? "negative"
                  : metrics.maxDrawdownPercent > 5
                  ? "warning"
                  : "positive"
              }
            />
            <PrimaryStatCard
              label="Profit factor"
              value={metrics.profitFactor === null ? "∞" : metrics.profitFactor.toFixed(2)}
              icon={Gauge}
              tone={
                (metrics.profitFactor ?? 0) >= 1.5
                  ? "positive"
                  : (metrics.profitFactor ?? 0) >= 1
                  ? "warning"
                  : "negative"
              }
            />
          </div>

          {/* Statistiques secondaires */}
          <div className="grid grid-cols-2 divide-x divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
            <SecondaryStat label="Gain moyen" value={fmtSigned(metrics.averageWin)} tone="positive" />
            <SecondaryStat label="Perte moyenne" value={fmtSigned(-metrics.averageLoss)} tone="negative" />
            <SecondaryStat label="Meilleur trade" value={fmtSigned(metrics.bestTrade)} tone="positive" />
            <SecondaryStat label="Pire trade" value={fmtSigned(metrics.worstTrade)} tone="negative" />
            <SecondaryStat
              label="Pire série de pertes"
              value={metrics.maxLosingStreak ? `${metrics.maxLosingStreak.length} trades` : "—"}
              tone={metrics.maxLosingStreak && metrics.maxLosingStreak.length >= 3 ? "warning" : undefined}
            />
            <SecondaryStat
              label="Ré-entrées rapides"
              value={`${metrics.quickReentriesAfterLoss}`}
              tone={metrics.quickReentriesAfterLoss > 0 ? "warning" : undefined}
            />
          </div>

          {/* Courbe de capital */}
          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Courbe de capital (equity curve)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.equityCurve} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
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
                  width={64}
                  tickFormatter={(v: number) => v.toLocaleString("fr-FR")}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={metrics.initialBalanceAssumed} stroke="#ffffff30" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#818cf8", stroke: "#000", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Analyse psychologique */}
          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-6">
            <div className="mb-5 flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-medium text-zinc-300">
                Analyse psychologique &amp; biais comportementaux
              </h2>
            </div>

            {isAnalyzing && (
              <div className="flex items-center gap-2 py-10 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse en cours via Gemini…
              </div>
            )}

            {!isAnalyzing && analysisError && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-xs text-zinc-400">{analysisError}</p>
                </div>
                <button
                  onClick={() => handleAnalyze(metrics)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20"
                >
                  Réessayer
                </button>
              </div>
            )}

            {!isAnalyzing && analysis && (
              <div className="space-y-6">
                <RiskGauge score={analysis.riskScore} />

                <p className="text-sm leading-relaxed text-zinc-400">{analysis.summary}</p>

                <DrawdownAlertBox alert={analysis.drawdownAlert} />

                {analysis.biasesDetected.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-medium text-zinc-500">Biais détectés</h3>
                    <div className="space-y-2">
                      {analysis.biasesDetected.map((b, i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                              <Flame className="h-3.5 w-3.5 text-zinc-500" />
                              {b.name}
                            </span>
                            <SeverityBadge severity={b.severity} />
                          </div>
                          <p className="text-xs leading-relaxed text-zinc-500">{b.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-medium text-zinc-500">Recommandations</h3>
                    <ul className="space-y-2.5">
                      {analysis.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
