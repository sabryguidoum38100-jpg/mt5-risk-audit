# AuditProp — Trading OS & moteur de décision IA

AuditProp transforme un historique réel de trading en une lecture explicable du risque, du comportement et du contexte de marché.

## Présentation professionnelle

- [One-pager produit](./docs/AuditProp-One-Pager.md)
- [Dossier de présentation complet](./docs/AuditProp-Dossier-Presentation.md)
- [Documentation technique](./docs/AuditProp-Technical-README.md)
- [Application en production](https://mt5-risk-audit.vercel.app)

## Proposition de valeur

AuditProp combine audit de performance, analyse comportementale, charting, macro intelligence live et couche Prop Firm optionnelle. Les transactions brutes restent dans le navigateur, les métriques sont calculées par du TypeScript déterministe avant l’intervention de l’IA et les flux macro sont affichés avec leur provenance.

## Stack

Next.js 15, App Router, React, TypeScript, Tailwind CSS, Groq SDK, Lightweight Charts, Recharts, Papa Parse, RSS Parser et Vercel.

## Installation locale

```bash
npm install
cp .env.local.example .env.local
# renseigner GROQ_API_KEY dans .env.local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Vérification production

```bash
npx tsc --noEmit
npm run build
npm run start -- -p 3000
```

## Variables d’environnement

```bash
GROQ_API_KEY=...
NEXT_PUBLIC_APP_URL=https://mt5-risk-audit.vercel.app
```

La clé Groq doit rester côté serveur et ne doit jamais être commitée.

## Architecture courte

- `lib/mt5-parser.ts` : parser universel et métriques déterministes, sans IA.
- `lib/advanced-analytics.ts` : ratios institutionnels, holding time et heatmap.
- `lib/monte-carlo.ts` : projections statistiques à partir des trades importés.
- `app/api/analyze/route.ts` : analyse comportementale Groq à partir de métriques agrégées.
- `app/api/chat-chart/route.ts` : assistant chartiste à partir de bougies et swings.
- `app/api/macro-news/route.ts` : RSS publics et calendrier FXMacroData.
- `components/chartist-panel.tsx` : graphique, mapping d’exécution et drawer IA.
- `components/trading-os-panels.tsx` : roadmap, tagging et synthèses Trading OS.
- `app/page.tsx` : landing page et dashboard principal.

## Limites à connaître

Les formats d’export ne contiennent pas tous le même niveau de précision. Certains HTML utilisent une heure proxy lorsqu’un appariement entrée/sortie n’est pas disponible. Les règles Prop Firm sont indicatives et doivent être confirmées auprès du programme concerné. Les droits d’usage commercial des données macro doivent être vérifiés avant une distribution à grande échelle.

## Licence et données externes

Les dépendances et services externes restent soumis à leurs propres licences et conditions. Avant une commercialisation, documenter la licence des flux macro, la politique de confidentialité, les limites de responsabilité et la gestion des données utilisateur.
