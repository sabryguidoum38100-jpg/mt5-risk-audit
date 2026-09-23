"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Target,
  TrendingDown,
} from "lucide-react";
import SiteNav from "@/components/site-nav";

const rules = [
  {
    title: "Max Daily Loss",
    icon: TrendingDown,
    tone: "rose",
    summary: "La perte maximale autorisée sur une journée de trading.",
    detail:
      "Additionnez les pertes réalisées et le flottant de toutes les positions. Une marge de sécurité de 1 à 2 % sous la limite évite qu'un spread ou un mouvement rapide ne transforme une journée acceptable en violation.",
  },
  {
    title: "Max Overall Drawdown",
    icon: ShieldCheck,
    tone: "amber",
    summary: "Le seuil de perte totale à ne jamais franchir.",
    detail:
      "Calculez le drawdown depuis le solde ou l'equity de référence imposé par votre firme. Le risque par trade doit être calibré pour survivre à une série de pertes, pas seulement pour viser un rendement quotidien.",
  },
  {
    title: "Consistency Rule",
    icon: Target,
    tone: "sky",
    summary: "La régularité des résultats plutôt qu'un seul gros coup.",
    detail:
      "Vérifiez les règles propres à votre programme : certaines firmes limitent la part du meilleur jour ou demandent une distribution régulière des profits. Consultez toujours les conditions officielles de votre compte.",
  },
  {
    title: "Gestion du risque",
    icon: CheckCircle2,
    tone: "emerald",
    summary: "Une unité de risque claire avant chaque entrée.",
    detail:
      "Définissez le stop, le montant risqué et le scénario d'invalidation avant l'ordre. Ne déplacez pas le stop pour éviter une perte et réduisez la taille après une séquence défavorable.",
  },
] as const;

const guides = [
  {
    title: "Overtrading",
    icon: TrendingDown,
    summary: "Trop de trades, trop peu de sélection.",
    steps: [
      "Fixez un nombre maximal de setups par session.",
      "Exigez une checklist complète avant chaque entrée.",
      "Fermez la plateforme après votre quota ou votre limite de perte.",
    ],
  },
  {
    title: "Revenge trading",
    icon: AlertTriangle,
    summary: "Réagir à une perte au lieu de suivre le plan.",
    steps: [
      "Imposez une pause après une perte hors plan.",
      "Notez l'émotion et le déclencheur dans votre journal.",
      "Revenez uniquement avec le même risque prédéfini, jamais avec une taille augmentée.",
    ],
  },
  {
    title: "Respect du plan",
    icon: Brain,
    summary: "Transformer une intention en protocole mesurable.",
    steps: [
      "Écrivez les conditions d'entrée et de sortie avant la session.",
      "Capturez une preuve de chaque décision importante.",
      "Faites une revue hebdomadaire basée sur les faits, pas sur le résultat d'un trade.",
    ],
  },
];
const toneClasses = {
  rose: "bg-rose-300/10 text-rose-300",
  amber: "bg-amber-300/10 text-amber-300",
  sky: "bg-sky-300/10 text-sky-300",
  emerald: "bg-emerald-300/10 text-emerald-300",
} as const;

export default function AcademyPage() {
  const [openRule, setOpenRule] = useState(0);
  const [openGuide, setOpenGuide] = useState(0);
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <header className="border-b border-white/[0.07] py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
            Académie Prop Firm
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Maîtriser les règles. Stabiliser le comportement.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
            Des guides courts et actionnables pour comprendre les règles de
            challenge, calibrer le risque et réduire les biais qui détruisent la
            constance.
          </p>
        </header>
        <section className="py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                Fondamentaux
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Maîtriser les règles Prop Firm
              </h2>
            </div>
            <span className="hidden text-xs text-zinc-600 sm:block">
              4 modules interactifs
            </span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {rules.map((rule, index) => {
              const Icon = rule.icon;
              const isOpen = openRule === index;
              return (
                <article
                  key={rule.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <button
                    onClick={() => setOpenRule(isOpen ? -1 : index)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[rule.tone]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white">
                        {rule.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-500">
                        {rule.summary}
                      </span>
                    </span>
                    {isOpen ? (
                      <ChevronDown className="mt-1 h-4 w-4 rotate-180 text-zinc-500" />
                    ) : (
                      <ChevronDown className="mt-1 h-4 w-4 text-zinc-500" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="mt-4 border-t border-white/[0.07] pt-4 text-sm leading-6 text-zinc-400">
                      {rule.detail}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        <section className="border-t border-white/[0.07] py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Discipline
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Gestion des Biais Comportementaux
              </h2>
            </div>
            <span className="hidden text-xs text-zinc-600 sm:block">
              Guides pratiques
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {guides.map((guide, index) => {
              const Icon = guide.icon;
              const isOpen = openGuide === index;
              return (
                <article
                  key={guide.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <button
                    onClick={() => setOpenGuide(isOpen ? -1 : index)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-300/10 text-violet-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-white">
                        {guide.title}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        {guide.summary}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-500 transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <ol className="mt-4 space-y-3 border-t border-white/[0.07] pt-4">
                      {guide.steps.map((step, stepIndex) => (
                        <li
                          key={step}
                          className="flex gap-3 text-sm leading-6 text-zinc-400"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-300/10 text-[10px] font-semibold text-violet-300">
                            {stepIndex + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.05] p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Votre protocole de survie
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Une règle n'est utile que si elle est transformée en limite
                opérationnelle : risque fixe, pause après perte et revue
                documentée. Utilisez l&apos;Audit MT5 pour vérifier vos
                comportements sur des données réelles.
              </p>
              <a
                href="/"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
              >
                Analyser mon historique <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
