"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Clock3, ShieldCheck } from "lucide-react";
import type { AdvancedAnalytics, HeatmapDay } from "@/lib/advanced-analytics";

function money(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} $`;
}

function HeatCell({ day, selected, onSelect }: { day: HeatmapDay; selected: boolean; onSelect: () => void }) {
  const tone = day.pnl > 0 ? "bg-emerald-400/75 hover:bg-emerald-300" : day.pnl < 0 ? "bg-rose-400/75 hover:bg-rose-300" : "bg-zinc-800 hover:bg-zinc-700";
  return <button type="button" title={`${day.date} · ${money(day.pnl)} · ${day.trades} trades · ${day.trades ? ((day.wins / day.trades) * 100).toFixed(0) : 0}% win rate`} onClick={onSelect} className={`h-7 w-7 rounded-md transition duration-200 hover:scale-110 ${tone} ${selected ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""}`} aria-label={`Détails du ${day.date}`} />;
}

export function PnlHeatmap({ days }: { days: HeatmapDay[] }) {
  const [selected, setSelected] = useState<HeatmapDay | null>(null);
  const months = useMemo(() => {
    const grouped = new Map<string, HeatmapDay[]>();
    for (const day of days) grouped.set(day.date.slice(0, 7), [...(grouped.get(day.date.slice(0, 7)) ?? []), day]);
    return [...grouped.entries()];
  }, [days]);
  return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-2xl shadow-black/10 sm:p-6"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold text-white"><BarChart3 className="h-4 w-4 text-emerald-300" /> Calendrier PnL</div><p className="mt-1 text-xs text-zinc-400">Survolez ou sélectionnez une journée pour voir le détail.</p></div><div className="flex gap-2 text-[10px] text-zinc-400"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-emerald-400" /> Gain</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-rose-400" /> Perte</span></div></div>{months.length ? <div className="mt-5 space-y-4">{months.map(([month, monthDays]) => <div key={month}><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${month}-01`))}</p><div className="flex flex-wrap gap-1.5">{monthDays.map((day) => <HeatCell key={day.date} day={day} selected={selected?.date === day.date} onSelect={() => setSelected(day)} />)}</div></div>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-400">Aucune journée exploitable.</div>}{selected && <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">{selected.date}</p><button type="button" onClick={() => setSelected(null)} className="text-xs text-zinc-400 hover:text-white">Fermer</button></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><span className="block text-zinc-600">PnL</span><strong className={selected.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}>{money(selected.pnl)}</strong></div><div><span className="block text-zinc-600">Win rate</span><strong className="text-white">{selected.trades ? ((selected.wins / selected.trades) * 100).toFixed(0) : 0}%</strong></div><div><span className="block text-zinc-600">Trades</span><strong className="text-white">{selected.trades}</strong></div></div></div>}</section>;
}

export function InstitutionalMetrics({ analytics }: { analytics: AdvancedAnalytics }) {
  const duration = (value: number | null) => value === null ? "—" : value < 60 ? `${value.toFixed(0)} min` : `${(value / 60).toFixed(1)} h`;
  return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-2xl shadow-black/10 sm:p-6"><div className="flex items-center gap-2 text-sm font-semibold text-white"><Clock3 className="h-4 w-4 text-sky-300" /> Métriques institutionnelles</div><p className="mt-1 text-xs text-zinc-400">Risque ajusté et durée de détention calculés localement.</p><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Ratio de Sharpe" value={analytics.sharpe === null ? "—" : analytics.sharpe.toFixed(2)} /><Metric label="Ratio de Sortino" value={analytics.sortino === null ? "—" : analytics.sortino.toFixed(2)} /><Metric label="Holding gagnant" value={duration(analytics.averageWinningHoldMinutes)} /><Metric label="Holding perdant" value={duration(analytics.averageLosingHoldMinutes)} /></div></section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-3"><p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p><p className="mt-2 text-lg font-semibold text-white">{value}</p></div>; }

export function ConsistencyCheck({ analytics }: { analytics: AdvancedAnalytics }) {
  return <section className={`rounded-3xl border p-4 shadow-2xl shadow-black/10 sm:p-6 ${analytics.consistencyAlert ? "border-amber-400/20 bg-amber-400/[0.05]" : "border-emerald-400/15 bg-emerald-400/[0.04]"}`}><div className="flex items-center gap-2 text-sm font-semibold text-white">{analytics.consistencyAlert ? <AlertTriangle className="h-4 w-4 text-amber-300" /> : <ShieldCheck className="h-4 w-4 text-emerald-300" />} Conformité &amp; Consistency Check</div><div className="mt-5 space-y-4 text-sm"><div className="flex items-center justify-between gap-3"><span className="text-zinc-400">Meilleur trade / PnL total</span><strong className={analytics.consistencyAlert ? "text-amber-300" : "text-emerald-300"}>{analytics.bestTradeContributionPercent === null ? "—" : `${analytics.bestTradeContributionPercent.toFixed(1)}%`}</strong></div><div className="flex items-center justify-between gap-3"><span className="text-zinc-400">Coussin de perte journalière</span><strong className="text-white">{analytics.dailyLossCushion.toLocaleString("fr-FR")} $ / {analytics.dailyLossLimit.toLocaleString("fr-FR")} $</strong></div></div><p className="mt-4 text-xs leading-5 text-zinc-400">{analytics.consistencyAlert ? "Alerte : un seul trade génère plus de 30% du PnL. Vérifiez la régularité avant une évaluation." : "La contribution du meilleur trade reste sous le seuil de 30%."}</p></section>;
}
