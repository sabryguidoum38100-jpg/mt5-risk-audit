# AuditProp — Dossier de présentation

**Version de travail : octobre 2026**  
**Produit : AuditProp Trading OS**  
**URL : [mt5-risk-audit.vercel.app](https://mt5-risk-audit.vercel.app)**

> Document destiné à un partenaire produit, un mentor, un prospect professionnel ou un premier échange commercial. Les coûts et hypothèses qui suivent sont des ordres de grandeur à confirmer selon le trafic, le contrat API et le périmètre de commercialisation.

---

## 1. Executive summary

AuditProp est un **Trading OS et moteur de décision IA** qui transforme un historique de trading réel en analyse lisible et actionnable. Le produit relie dans une même expérience l’audit de performance, l’analyse comportementale, le charting, le contexte macro live et une couche Prop Firm optionnelle.

La différence centrale est l’architecture **local-first** : les transactions brutes restent dans le navigateur, les chiffres sont calculés par un moteur déterministe avant l’IA et les informations live sont affichées avec leur provenance. AuditProp n’est donc ni un simple journal, ni un chatbot qui invente une lecture de marché, ni un tableau de règles Prop Firm isolé.

---

## 2. Le problème

Un trader peut exporter des milliers de lignes depuis son broker, mais il ne voit pas facilement les causes récurrentes de ses résultats. Les outils actuels sont souvent fragmentés : un journal pour les trades, un autre outil pour les graphiques, un calendrier macro séparé et une documentation Prop Firm à interpréter manuellement.

Cette fragmentation crée trois coûts : le trader perd du temps à consolider ses données, il peut sous-estimer un risque de drawdown et il reçoit parfois des recommandations difficiles à expliquer ou à vérifier.

AuditProp résout ce problème en transformant les données d’exécution en une **boucle de décision** : observer, comprendre, contextualiser, décider et mesurer.

---

## 3. Pour qui ?

| Segment | Besoin | Réponse AuditProp |
|---|---|---|
| Trader particulier | Comprendre ses erreurs récurrentes | Audit comportemental et plan d’action |
| Trader Prop Firm | Préserver la limite et la discipline | Drawdown, consistency, daily cushion et checklist |
| Trader multi-actifs | Unifier plusieurs exports | Parser universel CSV / HTML / TXT |
| Mentor / coach | Structurer une revue d’historique | Rapport lisible, AuditCard et métriques partagées |
| Future équipe de trading | Standardiser la gouvernance du risque | Risk OS, alertes et espace collaboratif à venir |

---

## 4. Produit et fonctionnalités

### Audit et import

L’utilisateur dépose un export réel. Le parser normalise les colonnes depuis MT4/MT5, TradingView, Coinbase, eToro, XTB, Boursorama ou un CSV générique lorsque la structure est compatible. Le système affiche la source détectée, les warnings éventuels et les limites d’interprétation.

### Analyse comportementale

Le dashboard calcule les métriques de performance et repère les zones de fragilité : séries de pertes, ré-entrées rapides après une perte, drawdown, déséquilibre gain/perte, paires déficitaires, sessions faibles et comportements tagués localement.

L’IA transforme ensuite ces éléments en score de risque, forces, faiblesses et plan d’action. Le prompt n’autorise pas l’invention de chiffres.

### Charting et execution mapping

Le graphique reconstruit des chandeliers depuis l’historique disponible. Le trade sélectionné peut afficher entrée, sortie, SL et TP. Les swings sont calculés par le code et transmis à l’assistant chartiste.

Le moteur est conçu pour être prudent : si une neckline n’est pas cassée par une clôture confirmée, la figure est affichée comme **en formation / non confirmée**.

### Macro et fondamental

Les actualités sont récupérées depuis des flux RSS publics, et le calendrier économique interroge FXMacroData pour USD, EUR, GBP et JPY. Le trader peut filtrer par devise et impact, ouvrir un événement dans une modal et demander une explication IA.

### Prop Firm et Académie

La couche Prop Firm est activable ou désactivable. Elle comprend un comparatif indicatif, les concepts de daily loss et overall drawdown, un calculateur de position, une checklist pré-session et des contenus éducatifs.

L’Académie ne fabrique pas de performance lorsque l’utilisateur n’a pas importé d’historique.

### Analytics avancés

Le produit inclut une heatmap PnL, le Sharpe, le Sortino, la durée moyenne des trades gagnants et perdants, une consistency check, un coussin de perte journalière, une projection Monte-Carlo sur 1 000 trajectoires et une AuditCard AMOLED partageable.

---

## 5. Pourquoi c’est différent

### 5.1 Une architecture de confiance

La donnée la plus sensible — l’historique brut — est traitée côté navigateur. Les transactions ne sont pas envoyées telles quelles à Groq. Le serveur reçoit des métriques agrégées pour l’analyse comportementale et un contexte graphique réduit pour l’assistant chartiste.

### 5.2 Des chiffres qui précèdent le langage

Le parser et les modules analytiques calculent d’abord. L’IA interprète ensuite. Cela permet de tester les chiffres indépendamment du modèle et de réduire les hallucinations.

### 5.3 Une combinaison peu courante

AuditProp rassemble audit, comportement, graphique, macro et conformité indicative dans une seule boucle. Le positionnement est plus extensible qu’un outil centré exclusivement sur MT5 ou sur une seule Prop Firm.

### 5.4 Une posture responsable

Le produit ne promet pas de rendement, ne présente pas les simulations comme des prévisions et rappelle les limites des données. Cette posture est importante pour la confiance et pour une future distribution professionnelle.

### Scorecard de valeur marché

| Critère | Note /10 | Lecture professionnelle |
|---|---:|---|
| Positionnement Trading OS | 8,5 | Plus extensible qu’un simple analyseur MT5 |
| Privacy local-first | 9 | Différenciation forte et facile à expliquer |
| Analyse comportementale IA | 8,5 | Valeur claire si les recommandations restent reliées aux données |
| Calculs explicables | 9 | Excellent point de confiance et de testabilité |
| Multi-brokers | 8 | Bon potentiel, à renforcer par des fixtures et tests par source |
| Macro intelligence live | 8 | Forte valeur, sous réserve des droits de données et de la disponibilité des flux |
| Analytics avancés | 8,5 | Monte-Carlo, heatmap et ratios donnent une profondeur premium |
| UX SaaS | 8,5 | Interface différenciante, responsive et cohérente |
| Conversion commerciale | 7,8 | Onboarding, preuve sociale et offres réelles restent à développer |
| Potentiel B2B | 8 | Intéressant pour mentors et équipes, avec comptes et permissions à ajouter |
| **Score global actuel** | **8,4** | **MVP premium crédible ; industrialisation commerciale encore nécessaire** |

---

## 6. État actuel du produit

### Déjà opérationnel

- Application live sur Vercel.
- Routes Audit, Macro, Académie et Pricing.
- Import multi-format.
- Métriques de risque et comportement.
- Lightweight Charts et assistant chartiste.
- Flux macro live et calendrier économique.
- Monte-Carlo, tags, AuditCard et export PDF.
- Navigation responsive AMOLED.
- SEO, OpenGraph et favicon de marque.

### Limites à reconnaître devant un professionnel

- Le parser HTML peut utiliser l’heure de la ligne comme proxy lorsque l’appariement entrée/sortie n’est pas présent dans l’export.
- Commission et swap doivent être vérifiés selon les colonnes effectivement fournies par chaque broker.
- Les règles Prop Firm sont indicatives et doivent être confirmées dans les conditions du programme concerné.
- FXMacroData impose de vérifier les droits d’usage commercial pour les données non-USD, l’historique complet et la redistribution.
- Le produit n’a pas encore de compte utilisateur, sauvegarde cloud, alertes personnalisées ni espace collaboratif.

---

## 7. Points forts du code

| Point fort | Pourquoi il compte |
|---|---|
| TypeScript de bout en bout | Réduit les erreurs de contrat entre import, analyse et UI |
| Parser sans IA | Chiffres reproductibles et auditables |
| Séparation `lib` / `app` / `components` | Évolution et tests plus simples |
| API server-side | Secrets Groq non exposés au navigateur |
| Métadonnées et routes propres | Meilleure base SEO et déploiement |
| Responsive mobile-first | Compatible avec un usage avant ou après une session |
| États vides et warnings | Pas de chiffres inventés lorsque la donnée manque |

---

## 8. Technologies et coûts mensuels

Les coûts dépendent du trafic et du nombre d’analyses. Le tableau ci-dessous est une base de discussion, pas une facture contractuelle.

| Poste | Situation actuelle / hypothèse | Ordre de grandeur |
|---|---|---:|
| Vercel Hobby | Adapté à un projet personnel ou non commercial, avec limites d’usage | **0 $/mois** |
| Vercel Pro | Recommandé pour un produit commercial ; le plan officiel affiche 20 $/mois par siège développeur et un crédit d’usage inclus | **20 $/mois + usage éventuel** |
| Groq | Facturation variable selon modèle, tokens, limites et contrat ; le coût doit être surveillé dans la Console Groq | **Variable** |
| FXMacroData | Workflow USD public d’évaluation ; données non-USD, historique complet et redistribution commerciale soumis aux offres et conditions du fournisseur | **À confirmer** |
| Domaine | Optionnel si l’URL Vercel est conservée | **Environ 10–25 €/an** |
| Monitoring | À ajouter pour la production : erreurs, latence, quota et coûts IA | **Variable** |

**Budget MVP commercial prudent :** prévoir au minimum Vercel Pro et une enveloppe Groq contrôlée, puis confirmer le contrat FXMacroData avant d’ouvrir largement les données macro. Le budget exact doit être recalculé à partir du nombre d’utilisateurs, d’analyses et de tokens par rapport.

Références : [Vercel Pricing](https://vercel.com/pricing), [Groq](https://groq.com/), [FXMacroData](https://github.com/fxmacrodata).

---

## 9. Modèle de revenus

### Freemium

Une offre gratuite permet l’import et les métriques de base. Elle réduit la friction et donne à l’utilisateur une preuve de valeur immédiate.

### Abonnement Risk OS

L’abonnement peut débloquer les analyses IA plus nombreuses, les alertes, la sauvegarde d’historique, l’export avancé, les benchmarks et les fonctionnalités de mentorat. Le produit doit éviter de faire payer des fonctions essentielles de transparence ou de sécurité.

### Affiliation

L’affiliation Prop Firm est envisageable uniquement avec des liens officiels, une mention claire de la relation commerciale et aucune promesse de réussite. Les codes ne doivent jamais être inventés.

### B2B et coaching

Une offre professionnelle peut vendre la standardisation des revues de risque, des espaces coach/trader et des rapports de cohortes. C’est probablement le segment à plus forte valeur par client.

---

## 10. Roadmap recommandée

### Phase 1 — Solidifier la confiance

Ajouter les tests unitaires du parser, un contrat de validation des payloads API, le rate limiting, la journalisation d’erreurs et un centre de statut des flux macro/IA.

### Phase 2 — Onboarding et rétention

Créer un onboarding en trois minutes, un profil de risque local, des objectifs de session, des rappels de checklist et un historique de comparaison entre périodes.

### Phase 3 — Compte et collaboration

Ajouter authentification, sauvegarde chiffrée optionnelle, partage sécurisé d’un rapport, espace mentor et permissions par rôle.

### Phase 4 — Alertes et gouvernance

Créer des alertes configurables sur drawdown, perte journalière, changement de comportement, concentration par paire et approche d’une limite Prop Firm.

### Phase 5 — Distribution professionnelle

Obtenir les droits de données nécessaires, documenter la conformité, publier la politique de confidentialité détaillée, créer une offre B2B et mesurer activation, rétention et conversion.

---

## 11. Vision à long terme

AuditProp doit devenir le **système d’exploitation de la décision du trader** : un endroit où chaque décision est reliée à son contexte, à son risque et à son historique de comportement.

À terme, le produit peut devenir une couche de gouvernance entre le trader et son broker : non pas pour empêcher toute prise de risque, mais pour rendre visible le moment où le risque s’écarte du plan écrit.

---

## 12. Pitch de conclusion

> Les traders n’ont pas besoin d’un indicateur de plus. Ils ont besoin d’un système qui leur montre comment ils exécutent réellement, pourquoi ils dérapent et quelle décision est la plus défendable maintenant. AuditProp combine données locales, calculs explicables, IA prudente et contexte macro live dans un Trading OS conçu pour transformer l’historique en discipline.

---

## Annexes

- [One-pager produit](./AuditProp-One-Pager.md)
- [Documentation technique](./AuditProp-Technical-README.md)
- [Site public](https://mt5-risk-audit.vercel.app)
