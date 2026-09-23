"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  Globe2,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface MacroItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  image: string | null;
  kind: "news" | "calendar";
  summary: string | null;
  impact: "high" | "moderate" | "low";
}
interface MacroResponse {
  fetchedAt: string;
  sources: number;
  articles: MacroItem[];
  calendar: MacroItem[];
  marketSummary: string | null;
  error?: string;
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Heure indisponible";
}

function impactLabel(impact: MacroItem["impact"]) {
  return impact === "high"
    ? "Impact élevé"
    : impact === "moderate"
      ? "Impact modéré"
      : "Impact faible";
}

function impactClass(impact: MacroItem["impact"]) {
  return impact === "high"
    ? "border-rose-300/20 bg-rose-300/10 text-rose-200"
    : impact === "moderate"
      ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
      : "border-sky-300/20 bg-sky-300/10 text-sky-200";
}

function fallbackVisual(item: MacroItem) {
  const calendar = item.kind === "calendar";
  return (
    <div
      className={`flex h-36 items-center justify-between border-b border-white/[0.07] px-5 ${calendar ? "bg-gradient-to-br from-amber-400/20 via-orange-400/10 to-black" : "bg-gradient-to-br from-sky-400/20 via-violet-400/10 to-black"}`}
    >
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {calendar ? "Economic calendar" : "Market intelligence"}
        </span>
        <p className="mt-2 max-w-[14rem] text-sm font-medium text-zinc-300">
          {item.source}
        </p>
      </div>
      <TrendingUp
        className={`h-9 w-9 ${calendar ? "text-amber-300/60" : "text-sky-300/60"}`}
      />
    </div>
  );
}

export default function MacroSection() {
  const [data, setData] = useState<MacroResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/macro-news", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "Flux macro indisponibles.");
      setData(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les flux macro.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="border-y border-white/[0.07] bg-black py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-200">
              <Globe2 className="h-3.5 w-3.5" /> Données live · aucun mock
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Flash Macro &amp; Santé des Marchés
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              Actualités financières et calendrier économique récupérés depuis
              des flux publics distants, puis synthétisés par Groq à partir des
              cinq derniers articles.
            </p>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Actualiser
          </button>
        </div>
        {loading && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-sky-300" /> Connexion
            aux flux CNBC, Yahoo Finance et Forex Factory…
          </div>
        )}
        {error && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {data && (
          <>
            <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-3xl border border-sky-300/15 bg-sky-300/[0.05] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-sky-300" /> Baromètre IA du
                  marché
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  {data.marketSummary ??
                    "Résumé IA indisponible : la clé GROQ_API_KEY n'est pas configurée ou aucun article n'a été récupéré."}
                </p>
                <p className="mt-5 text-[11px] text-zinc-600">
                  Actualisé le {formatDate(data.fetchedAt)} · {data.sources}{" "}
                  source{data.sources > 1 ? "s" : ""} répondante
                  {data.sources > 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <CalendarDays className="h-4 w-4 text-amber-300" /> Calendrier
                  économique live
                </div>
                <div className="mt-4 space-y-2">
                  {data.calendar.length > 0 ? (
                    data.calendar.slice(0, 5).map((item, index) => (
                      <a
                        key={`${item.link}-${index}`}
                        href="/macro"
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/30 p-3 transition hover:border-amber-300/30"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-zinc-200">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-[10px] text-zinc-600">
                            {item.source} · {formatDate(item.publishedAt)}
                          </span>
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0 text-zinc-600" />
                      </a>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500">
                      Aucun événement publié par le flux calendrier au moment de
                      la requête.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.articles.map((item, index) => (
                <a
                  key={`${item.link}-${index}`}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition hover:-translate-y-0.5 hover:border-sky-300/30"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className="h-36 w-full object-cover opacity-80 transition group-hover:opacity-100"
                    />
                  ) : (
                    fallbackVisual(item)
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-600">
                      <span>{item.source}</span>
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                    <span
                      className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${impactClass(item.impact)}`}
                    >
                      {impactLabel(item.impact)}
                    </span>
                    <h3 className="mt-2 line-clamp-3 text-sm font-medium leading-5 text-zinc-200">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
                        {item.summary}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
