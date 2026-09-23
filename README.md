# Risk & Bias Audit — MT5

MVP à page unique (Next.js 15, App Router, TypeScript, Tailwind CSS) qui
analyse un export d'historique MetaTrader 5 (CSV ou HTML) pour en extraire
des métriques de risque et détecter des biais psychologiques de trading
(revenge trading, dépassement de drawdown, séries de pertes) via l'API
Groq et le modèle `llama-3.3-70b-versatile`.

## Installation

```bash
npm install
cp .env.local.example .env.local
# puis renseignez GROQ_API_KEY dans .env.local
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Structure

- `lib/mt5-parser.ts` — moteur de parsing CSV/HTML (100 % TypeScript pur,
  sans IA) + calcul déterministe des métriques (P&L, win rate, profit
  factor, max drawdown, séries de pertes, détection de ré-entrées rapides
  après une perte).
- `app/api/analyze/route.ts` — route API qui envoie uniquement le JSON des
  métriques (jamais les transactions brutes) à Groq pour une analyse
  comportementale orientée prop firm.
- `app/page.tsx` — interface (drag & drop, cartes de stats, courbe de
  capital via Recharts, carte d'analyse psychologique).

## Comment obtenir un export MT5

Dans le terminal MetaTrader 5, onglet **Historique du compte** :

- clic droit → **Exporter vers CSV**, ou
- clic droit → **Enregistrer en tant que rapport** (HTML).

## Limites connues du MVP

- Pour le format HTML "Deals", l'heure de chaque transaction est une
  approximation (heure de la ligne de clôture), sans appariement précis
  entrée/sortie.
- Le solde initial utilisé pour le drawdown en % est détecté depuis les
  lignes de dépôt du rapport si présentes, sinon une valeur par défaut de
  10 000 est utilisée.
- Commission et swap ne sont pas ajoutés au P&L (colonne "Profit" brute de
  l'export).
