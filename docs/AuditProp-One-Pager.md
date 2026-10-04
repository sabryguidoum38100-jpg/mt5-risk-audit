# AuditProp — One-pager produit

> **Trading OS & moteur de décision IA pour traders**
>
> Transformer un historique de trading réel en décisions plus mesurées, plus explicables et plus actionnables.

## 1. Le problème

Les traders disposent de données, mais rarement d’un système qui relie correctement :

- la performance réelle par paire, session et journée ;
- le drawdown et le risque de rupture ;
- les biais comportementaux et les réactions après une perte ;
- la structure technique du prix ;
- le contexte macroéconomique du moment.

Les outils existants sont souvent spécialisés dans un seul domaine : journal de trading, graphique, calendrier macro ou règles de Prop Firm. Le trader doit donc assembler plusieurs produits et interpréter lui-même les contradictions.

## 2. Pour qui ?

- Traders Forex, indices, futures et crypto.
- Traders en challenge ou compte financé, avec module Prop Firm optionnel.
- Traders particuliers qui veulent comprendre leur exécution, pas seulement leur résultat.
- Mentors, coachs et analystes qui ont besoin d’un support d’audit lisible.
- Futures équipes de trading qui souhaitent standardiser la revue de risque.

## 3. La proposition de valeur

**AuditProp est un Trading OS local-first qui transforme un export de trading en boucle de décision :**

1. Importer un historique CSV, HTML ou TXT.
2. Calculer localement les métriques de performance et de risque.
3. Identifier les comportements observables et les zones de fragilité.
4. Croiser les résultats avec le graphique et le contexte macro live.
5. Produire une roadmap claire pour la prochaine session et la semaine suivante.

## 4. Fonctionnalités principales

### Audit de trading

- Import universel multi-brokers et exchanges.
- PnL net, win rate, profit factor, drawdown, séries de pertes.
- Courbe d’equity, heatmap journalière et filtres de période.
- Paire la plus contributrice, paire la plus déficitaire, jour faible et session positive.

### Intelligence comportementale

- Score de risque psychologique.
- Détection des séries de pertes et ré-entrées rapides après perte.
- Analyse des biais d’exécution : FOMO, hors-plan, breakout, sur-réaction et pression d’exécution.
- Plan d’action présenté sous forme de décisions concrètes.

### Charting & Assistant IA

- Chandeliers reconstruits depuis les données importées.
- Swing highs / swing lows calculés algorithmiquement.
- Entrée, sortie, Stop Loss et Take Profit du trade sélectionné.
- Assistant chartiste dans un drawer mobile-first.
- Anti-hallucination : une figure sans cassure de neckline reste « en formation / non confirmée ».

### Macro intelligence live

- Actualités issues de flux publics RSS.
- Calendrier économique USD, EUR, GBP et JPY via FXMacroData.
- Filtres par devise et impact.
- Modal d’explication d’un événement sans redirection vers un fichier brut.
- Synthèse Groq fondée sur les articles récupérés réellement.

### Couche Prop Firm optionnelle

- Comparatif indicatif des limites daily loss / overall drawdown.
- Consistency check.
- Coussin de perte restante.
- Calculateur de taille de position.
- Checklist pré-session.

### Académie & partage

- Guides de gestion du risque et des biais.
- Monte-Carlo sur 1 000 trajectoires à partir du Win Rate et du Risk:Reward réels.
- AuditCard AMOLED pour partage.
- Export PDF du rapport.

## 5. Ce qui différencie AuditProp

### Local-first et confiance

Les transactions brutes restent dans le navigateur. Le moteur comportemental envoie uniquement les métriques agrégées nécessaires à l’analyse IA. Le module chartiste travaille sur les bougies, swings et statuts calculés.

### Calculs déterministes avant l’IA

Les chiffres ne sont pas « devinés » par un LLM. Le parser TypeScript calcule d’abord les métriques. L’IA intervient ensuite pour expliquer, hiérarchiser et proposer un plan.

### Un seul système au lieu de plusieurs outils

AuditProp relie historique, comportement, charting, macro, risque et éventuellement Prop Firm dans un même flux.

### Décision plutôt que prédiction

Le produit ne promet pas de rendement et ne fabrique pas de signaux. Il rend les risques visibles et encadre l’exécution.

## 6. Points forts de la base technique

- Next.js 15 App Router et TypeScript.
- Parser synchrone, testable et sans IA.
- API server-side pour Groq et les flux macro.
- UI responsive AMOLED avec navigation par routes.
- Lightweight Charts pour l’exécution graphique.
- Fonctions analytiques séparées du rendu.
- Déploiement Vercel et intégration GitHub.
- Architecture facile à enrichir avec comptes, alertes et stockage optionnel.

## 7. Modèle de revenus envisagé

- **Free / Audit** : import, métriques locales et découverte du produit.
- **Risk OS abonnement** : diagnostics IA avancés, export, alertes, historique et fonctionnalités collaboratives.
- **Affiliation transparente** : partenaires Prop Firm uniquement avec liens et conditions officielles vérifiables.
- **B2B / coaching** : espaces mentor, revue de cohortes et audits standardisés.

## 8. Vision

Devenir la couche de décision et de gouvernance du trader : un système qui observe l’exécution réelle, explique les risques, contextualise le marché et aide à décider avant le prochain ordre.

## 9. Message de présentation en 30 secondes

> AuditProp est un Trading OS local-first. Le trader importe son historique, les métriques sont calculées localement, puis l’IA explique les biais et les zones de risque. AuditProp ajoute le charting, le calendrier macro live et une roadmap de décision, sans transformer l’outil en boîte noire ni promettre des gains.

## 10. Site

[https://mt5-risk-audit.vercel.app](https://mt5-risk-audit.vercel.app)
