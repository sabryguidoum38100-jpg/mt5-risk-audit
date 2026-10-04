# AuditProp — Documentation technique

## 1. Résumé technique

AuditProp est une application Next.js 15 avec App Router, TypeScript et Tailwind CSS. Elle reçoit un export d’historique de trading dans le navigateur, le normalise avec un parser déterministe, affiche les métriques dans un dashboard et utilise Groq uniquement pour l’interprétation comportementale, l’assistant chartiste et certains briefs macro.

Le dépôt est privé par défaut dans sa configuration applicative et est déployé sur Vercel depuis GitHub.

## 2. Stack

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | Next.js 15 / React 19 | Pages, rendu et interactions |
| Langage | TypeScript | Contrats, parsing et logique applicative |
| Style | Tailwind CSS / CSS global | UI AMOLED, responsive et motion |
| Graphique | Lightweight Charts | Chandeliers, volumes et mapping d’exécution |
| Graphiques analytiques | Recharts | Courbe d’equity et visualisations |
| IA | Groq SDK | Analyse comportementale, macro et chartiste |
| Modèle actuel | `openai/gpt-oss-120b` | Modèle configuré pour les synthèses Groq |
| Macro news | `rss-parser` | Lecture des flux CNBC et Yahoo Finance |
| Macro calendar | FXMacroData | Calendrier USD/EUR/GBP/JPY |
| Import CSV | Papa Parse + parser maison | Normalisation des exports |
| Déploiement | Vercel + GitHub | CI/CD et production |

## 3. Routes principales

| Route | Fonction |
|---|---|
| `/` | Landing page, import, audit et dashboard Trading OS |
| `/macro` | Calendrier économique, filtres et synthèse macro |
| `/academy` | Calculateur de risque, checklist, règles et guides |
| `/pricing` | Positionnement produit et roadmap commerciale |
| `/api/analyze` | Analyse comportementale Groq à partir de métriques agrégées |
| `/api/chat-chart` | Assistant chartiste utilisant bougies, swings et statuts |
| `/api/audit-global` | Diagnostic IA global à partir de données agrégées |
| `/api/macro-news` | Flux RSS, calendrier FXMacroData et synthèse macro |
| `/api/macro-explain` | Explication IA d’un événement économique sélectionné |
| `/opengraph-image` | Image de partage OpenGraph générée par Next.js |

## 4. Architecture des données

```text
Fichier utilisateur
      |
      v
Navigateur : validation + parser universel
      |
      +--> MT5ParseResult
      |      +--> trades normalisés
      |      +--> metrics déterministes
      |      +--> warnings / broker / format
      |
      +--> UI locale : KPIs, heatmap, equity, tags, Monte-Carlo
      |
      +--> API Groq : métriques agrégées uniquement
      |
      +--> Chartist API : bougies, swings, statuts calculés
      |
Flux macro server-side : RSS + FXMacroData
      |
      +--> articles / calendar / summary IA
```

## 5. Privacy by design

Le fichier source n’est pas envoyé tel quel à l’API comportementale. `lib/mt5-parser.ts` transforme l’export en objets normalisés puis calcule les chiffres. La route `/api/analyze` reçoit le résultat métrique nécessaire à l’interprétation. La route chartiste reçoit le contexte de graphique utile à la réponse, pas un export brut de compte.

Cette distinction doit rester documentée et testée si l’application évolue vers un système de comptes ou de persistance cloud.

## 6. Parser universel

Le point d’entrée public est `parseUniversalHistory`. Il détecte les formats CSV et HTML, identifie le broker ou la source quand les en-têtes le permettent, puis mappe des alias de colonnes vers un contrat commun : ticket, date, type, volume, symbole, prix, profit, Stop Loss et Take Profit.

Le parser est volontairement sans IA. Cela garantit une source de vérité stable, reproductible et testable. Les warnings indiquent les approximations ou colonnes absentes.

### Limites actuelles à communiquer

- Certains exports HTML Deals utilisent l’heure de ligne comme proxy de clôture.
- Les commissions et swaps ne sont pas toujours inclus dans le PnL si l’export ne les expose pas dans le champ utilisé.
- Le solde initial est détecté depuis les lignes de balance quand elles existent ; sinon une valeur par défaut est utilisée.
- La qualité du mapping dépend de la qualité et de la langue de l’export.

## 7. Séparation déterministe / IA

Les fonctions déterministes calculent : PnL, taux de réussite, profit factor, drawdown, séries de pertes, equity, holding time, Sharpe, Sortino, consistency, Monte-Carlo et swings.

Groq intervient pour transformer ces informations en texte lisible : profil de risque, forces, faiblesses, plan d’action, réponse chartiste et résumé macro. Les prompts imposent une posture prudente et interdisent l’invention de chiffres ou la validation de figures non confirmées.

## 8. Macro intelligence

`/api/macro-news` récupère deux flux RSS de presse financière et les calendriers USD, EUR, GBP et JPY depuis FXMacroData. Les résultats sont triés, filtrés et renvoyés avec les titres, sources, dates, images éventuelles, devises et impacts.

Si les flux échouent, l’interface doit montrer un état d’indisponibilité. Elle ne doit pas remplacer des données live par des valeurs fictives.

FXMacroData indique publiquement que son workflow USD peut servir à l’évaluation sans clé dans une fenêtre publique, tandis que les données non-USD, l’historique complet et la redistribution commerciale dépendent de l’abonnement et des conditions du fournisseur. Il faut confirmer la licence commerciale avant une montée en charge.

## 9. Variables d’environnement

```bash
GROQ_API_KEY=...
NEXT_PUBLIC_APP_URL=https://mt5-risk-audit.vercel.app
```

La clé Groq doit rester côté serveur dans Vercel et ne doit jamais être exposée dans le bundle client.

## 10. Installation et développement

```bash
npm install
cp .env.local.example .env.local
# renseigner GROQ_API_KEY
npm run dev
```

Vérification de production :

```bash
npm run build
npm run start -- -p 3000
```

## 11. Déploiement

Le dépôt est connecté à Vercel. Le flux recommandé est :

```bash
git status
git add app components lib docs
git commit -m "Describe the release"
git push origin main
```

Vercel lance ensuite le build Next.js et déploie la branche `main` en production.

## 12. Tests recommandés

Avant chaque release, vérifier :

1. `npx tsc --noEmit`.
2. `npm run build`.
3. Import d’un export MT4/MT5 réel.
4. Import CSV TradingView et Coinbase représentatif.
5. Fichier vide, mauvais encodage et fichier invalide.
6. Routes `/`, `/macro`, `/academy`, `/pricing`.
7. Filtres macro et modal événementielle.
8. Drawer chartiste sur mobile.
9. Export PDF et AuditCard.
10. Scan de régression pour mock data et anciennes terminologies.

## 13. Évolution recommandée

La prochaine couche technique devrait ajouter des tests unitaires du parser, un contrat Zod partagé pour les payloads API, une vraie stratégie de rate limiting, une observabilité des erreurs Groq/RSS, une file de tâches pour les briefs lourds et des tests Playwright sur les parcours critiques.

## 14. Références opérationnelles

- [Next.js](https://nextjs.org/)
- [Groq](https://groq.com/)
- [Vercel Pricing](https://vercel.com/pricing)
- [FXMacroData](https://github.com/fxmacrodata)
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- [Papa Parse](https://www.papaparse.com/)
