"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import SiteNav from "@/components/site-nav";

type Impact = "all" | "high" | "moderate" | "low";
interface CalendarItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary: string | null;
  impact: Exclude<Impact, "all">;
  currency: "USD" | "EUR" | "GBP" | "JPY" | null;
}
interface MacroPayload {
  calendar: CalendarItem[];
  marketSummary: string | null;
  fetchedAt: string;
  sources: number;
}

const impactLabel = {
  high: "Élevé",
  moderate: "Moyen",
  low: "Faible",
} as const;
const impactClass = {
  high: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  moderate: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  low: "border-sky-300/20 bg-sky-300/10 text-sky-200",
} as const;

function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton-shimmer rounded-xl ${className}`} />;
}

export default function MacroPage() {
  const [data, setData] = useState<MacroPayload | null>(null);
  const [currency, setCurrency] = useState("all");
  const [impact, setImpact] = useState<Impact>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/macro-news", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "Flux économiques indisponibles.");
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const events = useMemo(
    () =>
      data?.calendar.filter(
        (item) =>
          (currency === "all" || item.currency === currency) &&
          (impact === "all" || item.impact === impact),
      ) ?? [],
    [data, currency, impact],
  );
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "Date indisponible";
  const openEvent = async (item: CalendarItem) => {
    setSelected(item); setExplanation(null); setExplaining(true);
    try {
      const response = await fetch("/api/macro-explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: item.title, currency: item.currency, impact: item.impact, summary: item.summary }) });
      const payload = await response.json();
      setExplanation(payload.explanation ?? "Analyse IA indisponible pour cet événement.");
    } catch { setExplanation("Analyse IA indisponible pour cet événement."); }
    finally { setExplaining(false); }
  };
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] py-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
              Macro / Fondamental
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Le contexte avant le clic.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
              Calendrier économique dynamique et synthèse IA fondés sur des flux
              publics réels. Aucun événement fictif n&apos;est injecté dans
              cette vue.
            </p>
            <div className="mt-4 flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Flux FXMacroData : Connecté</span><span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Groq AI Engine : En ligne</span></div>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" /> Analyse Macro IA
          </button>
        </div>
        {error && (
          <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}
        {loading && (
          <div className="mt-8 space-y-4"><div className="flex items-center gap-3 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin text-sky-300" />Récupération des flux économiques réels…</div><div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-44" /><Skeleton className="h-44" /></div><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        )}
        {data && (
          <>
            <section className="mt-8 rounded-3xl border border-sky-300/15 bg-sky-300/[0.05] p-5 sm:p-7">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-sky-300" /> Synthèse IA
                globale
              </div>
              <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
                {data.marketSummary ??
                  "Le brief IA n'est pas disponible. Vérifiez GROQ_API_KEY ou relancez l'analyse."}
              </p>
              <p className="mt-5 text-[11px] text-zinc-600">
                Brief généré à partir des actualités live · {data.sources} flux
                répondants · {date(data.fetchedAt)}
              </p>
            </section>
            <section className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                    Cette semaine
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Calendrier économique
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                    className="rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="all">Toutes devises</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                  <select
                    value={impact}
                    onChange={(event) =>
                      setImpact(event.target.value as Impact)
                    }
                    className="rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="all">Tous impacts</option>
                    <option value="high">Élevé</option>
                    <option value="moderate">Moyen</option>
                    <option value="low">Faible</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08]">
                <div className="hidden grid-cols-[1.3fr_0.45fr_0.7fr_0.8fr] gap-4 border-b border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 sm:grid">
                  <span>Événement</span>
                  <span>Devise</span>
                  <span>Impact</span>
                  <span>Publication</span>
                </div>
                {events.length > 0 ? (
                  events.map((item, index) => (
                    <button
                      key={`${item.link}-${index}`}
                      type="button"
                      onClick={() => void openEvent(item)}
                      className="grid gap-2 border-b border-white/[0.07] px-4 py-4 transition last:border-0 hover:bg-white/[0.03] sm:grid-cols-[1.3fr_0.45fr_0.7fr_0.8fr] sm:items-center sm:gap-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-600">
                          {item.source}
                          {item.summary ? ` · ${item.summary}` : ""}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-zinc-400">
                        {item.currency ?? "—"}
                      </span>
                      <span
                        className={`w-fit rounded-full border px-2 py-1 text-[10px] font-semibold ${impactClass[item.impact]}`}
                      >
                        {impactLabel[item.impact]}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {date(item.publishedAt)}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-zinc-500">
                    <CalendarDays className="mx-auto mb-3 h-6 w-6 text-zinc-700" />
                    Aucun événement réel ne correspond à ces filtres au moment
                    de la requête.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#09090b] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Événement live</p><h2 className="mt-2 text-xl font-semibold text-white">{selected.title}</h2></div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Fermer" className="rounded-xl p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-400"><span className="rounded-full bg-white/5 px-3 py-1.5">{selected.currency ?? "—"}</span><span className={`rounded-full border px-3 py-1.5 ${impactClass[selected.impact]}`}>{selected.impact === "high" ? "🔴 Élevé" : selected.impact === "moderate" ? "🟡 Moyen" : "🟢 Faible"}</span><span className="rounded-full bg-white/5 px-3 py-1.5">{date(selected.publishedAt)}</span></div>
            <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Analyse IA</p><p className="mt-3 text-sm leading-6 text-zinc-300">{explaining ? "Analyse en cours…" : explanation ?? "Analyse indisponible."}</p></div>
            <p className="mt-4 text-xs text-zinc-600">Source : {selected.source}. Les liens bruts d’API ne sont pas ouverts automatiquement.</p>
          </div>
        </div>
      )}
    </main>
  );
}
