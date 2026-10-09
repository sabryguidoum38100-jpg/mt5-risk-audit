"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, LockKeyhole, ShieldAlert, ShieldCheck } from "lucide-react";
import type { MT5Metrics, MT5Trade } from "@/lib/mt5-parser";

function money(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
}

type GateStatus = "go" | "caution" | "stop";

export default function DecisionGate({ metrics, trades }: { metrics: MT5Metrics; trades: MT5Trade[] }) {
  const [riskPercent, setRiskPercent] = useState("0.50");
  const [symbol, setSymbol] = useState(metrics.symbolsTraded[0] ?? "");
  const [committed, setCommitted] = useState(false);

  const capital = metrics.initialBalanceDetected ? metrics.initialBalanceAssumed : 0;
  const risk = Number(riskPercent) || 0;
  const latestDay = metrics.endDate?.slice(0, 10) ?? null;
  const dailyPnl = useMemo(
    () => latestDay ? trades.filter((trade) => (trade.closeTime ?? trade.openTime).toISOString().slice(0, 10) === latestDay).reduce((sum, trade) => sum + trade.profit, 0) : 0,
    [latestDay, trades],
  );
  const dailyBudget = capital * 0.01;
  const dailyLoss = Math.max(0, -dailyPnl);
  const remainingBudget = Math.max(0, dailyBudget - dailyLoss);
  const symbolTrades = trades.filter((trade) => trade.symbol === symbol);
  const checks = [
    {
      label: "Capital de référence renseigné",
      ok: capital > 0,
      detail: capital > 0 ? money(capital) : "Saisissez le capital dans le rapport",
    },
    {
      label: "Risque planifié ≤ 0,50 %",
      ok: risk > 0 && risk <= 0.5,
      detail: risk > 0 ? `${risk.toFixed(2)} % · ${capital > 0 ? money((capital * risk) / 100) : "capital requis"}` : "Indiquez le risque prévu",
    },
    {
      label: "Coussin journalier disponible",
      ok: capital > 0 && remainingBudget > 0,
      detail: capital > 0 ? `${money(remainingBudget)} restante(s) sur ${money(dailyBudget)}` : "Calcul indisponible",
    },
    {
      label: "Échantillon exploitable sur l’actif",
      ok: symbolTrades.length >= 5,
      detail: `${symbolTrades.length} trade(s) sur ${symbol || "actif non sélectionné"} · seuil recommandé : 5`,
    },
    {
      label: "Pas de pression post-série",
      ok: (metrics.maxLosingStreak?.length ?? 0) < 3 && metrics.quickReentriesAfterLoss === 0,
      detail: metrics.maxLosingStreak?.length && metrics.maxLosingStreak.length >= 3 ? `${metrics.maxLosingStreak.length} pertes consécutives détectées` : `${metrics.quickReentriesAfterLoss} réentrée(s) rapide(s) détectée(s)`,
    },
  ];
  const failed = checks.filter((check) => !check.ok).length;
  const status: GateStatus = capital <= 0 || risk > 1 || failed >= 3 ? "stop" : failed > 0 ? "caution" : "go";
  const statusCopy = {
    go: { label: "FEU VERT CONDITIONNEL", description: "Les garde-fous principaux sont respectés. Exécutez uniquement le plan défini.", icon: ShieldCheck },
    caution: { label: "RÉDUIRE L’EXPOSITION", description: "Un ou plusieurs signaux invitent à réduire la taille ou à attendre une meilleure configuration.", icon: AlertTriangle },
    stop: { label: "PAUSE DÉCISIONNELLE", description: "Le contexte de risque n’est pas suffisamment documenté pour autoriser une nouvelle exécution.", icon: ShieldAlert },
  }[status];
  const StatusIcon = statusCopy.icon;

  return (
    <section className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.035] p-4 shadow-2xl shadow-black/10 sm:p-5" aria-labelledby="decision-gate-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <LockKeyhole className="h-4 w-4 text-emerald-300" />
            <h2 id="decision-gate-title">Risk Firewall · Gate avant exécution</h2>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-400">Un contrôle déterministe avant le prochain trade. Aucune prédiction, aucune donnée ajoutée : uniquement vos métriques importées.</p>
        </div>
        <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] ${status === "go" ? "bg-emerald-400/10 text-emerald-300" : status === "caution" ? "bg-amber-300/10 text-amber-200" : "bg-rose-400/10 text-rose-200"}`}>
          <StatusIcon className="h-3.5 w-3.5" /> {statusCopy.label}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_0.8fr_1fr]">
        <label className="text-xs text-zinc-400">Actif ciblé
          <select value={symbol} onChange={(event) => setSymbol(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-300">
            {metrics.symbolsTraded.length === 0 ? <option value="">Aucun actif</option> : metrics.symbolsTraded.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs text-zinc-400">Risque prévu (%)
          <input inputMode="decimal" value={riskPercent} onChange={(event) => setRiskPercent(event.target.value.replace(",", "."))} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-300" aria-label="Risque prévu en pourcentage" />
        </label>
        <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Budget de perte du jour</p>
          <p className="mt-1 text-lg font-semibold text-white">{capital > 0 ? money(remainingBudget) : "—"}</p>
          <p className="mt-1 text-[11px] text-zinc-500">Limite de référence locale : 1 % du capital</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.label} className={`flex items-start gap-2 rounded-xl border p-3 ${check.ok ? "border-emerald-400/10 bg-emerald-400/[0.035]" : "border-amber-300/15 bg-amber-300/[0.035]"}`}>
            {check.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200" />}
            <div><p className="text-xs font-medium text-zinc-200">{check.label}</p><p className="mt-0.5 text-[11px] text-zinc-500">{check.detail}</p></div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-3">
        <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" /><p className="max-w-2xl text-xs leading-5 text-zinc-300">{statusCopy.description}</p></div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={committed} onChange={(event) => setCommitted(event.target.checked)} className="h-4 w-4 accent-emerald-400" /> Je respecte ce cadre</label>
      </div>
      {committed && <p className="mt-3 text-[11px] font-medium text-emerald-300">Engagement enregistré localement pour cette session. Il ne remplace pas votre propre jugement.</p>}
    </section>
  );
}
