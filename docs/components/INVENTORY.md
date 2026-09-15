# Aikoz — Inventaire des composants

> Version 1.3 — dérivée de `aikoz-composants-V1_LB.xlsx` (specs fonctionnelles de Louis), **recroisée avec le code du repo, le fichier Figma** (`ODMOwBvckfjPxTCUP1S1Su`) **et le handoff Satellite App**, enrichie des arbitrages du 26/08 et du basculement de périmètre du 09/09/2026.
> Ce fichier est la **source de vérité** du périmètre de la bibliothèque. Il est lu par Claude Code avant toute création de composant.

---

## Périmètre

**Inclus** : le **dashboard Aikoz** (produit SaaS, direct et white-label) **et le site** — vitrine, FAQ, et le lead magnet « Satellite App ».

> **Le site est entré au périmètre le 09/09/2026.** La v1.2 l'excluait explicitement. L'analyse du handoff `Copy of Aikoz - Satellite App - MVP` a montré que ce n'est pas une landing page mais **un tunnel en 5 étapes qui débouche sur un mini-dashboard personnalisé** — le prospect saisit son agence et on lui montre son propre tableau de bord. Les composants dashboard ne sont donc pas repoussés derrière le site : ils en sont la charge utile.

```
« Votre univers ? » → « Vous êtes ? » → nom d'agence → marque → sources
                            │
                  ┌─────────┴─────────┐
             agentDash            marqueDash
      classement de zone       volume d'avis
      visibilité IA            classement réseau
      rang dans le réseau      volume par marque
      3 derniers avis Google   forces / faiblesses
                  └─────────┬─────────┘
                  démo → créneau → confirmé
```

Ce que le tunnel ajoute, ce sont les composants de **parcours et de page** : étapes, sélecteurs, accordéon, prise de rendez-vous, navigation de site. Ils portent la mention *site* dans la colonne Famille.

**Exclus** : rien pour l'instant.

## Les deux registres

Un même composant sert les deux surfaces, dans deux registres visuels distincts. Ce ne sont pas deux palettes : c'est **une palette de primitives, deux couches sémantiques**.

**Registre et thème sont deux axes indépendants** — quatre combinaisons, pas deux. La première version confondait « marketing » et « sombre », ce qui interdisait un site clair : la même erreur de cadrage que l'API `size` de `KpiCard`.

| | Registre produit | Registre marketing |
|---|---|---|
| Surface | dashboard, Power BI | site, lead magnet, carrousels |
| Bascule | *(rien)* | `data-register="marketing"` |
| Texte discret | gris neutre | **teinté bleu** |
| Aquamarine | signal rare | accent, jamais un aplat sur clair |

| | Thème clair | Thème sombre |
|---|---|---|
| Bascule | *(rien)* ou `.light` | `.dark` |
| CTA marketing | **ultramarine** — l'aquamarine tombe à 1,24:1 sur blanc | **aquamarine** |

Un site marketing sombre se déclare `<html class="dark" data-register="marketing">`. Les 76 paires des quatre combinaisons sont auditées sans échec.

La règle qui vaut pour les deux, et que le lead magnet violait : **une couleur qui sert à tout ne signale plus rien.** Dans le prototype de Louis, l'accent apparaissait 102 fois sur 14 propriétés CSS — texte, fond, contour, ombre. Le registre marketing lui rend un rôle unique.

> Les valeurs du registre marketing ne sont pas importées du bundle Claude Design des carrousels : 12 de ses 15 couleurs étaient absentes des primitives Aikoz, et les ajouter aurait créé une seconde palette divergente. Chaque rôle est servi par le primitive Aikoz le plus proche, mesuré. Cf. `tokens/theme/marketing.json`.

## Règles de construction

1. **Origine `shadcn`** = le composant existe dans shadcn/Radix, on l'habille avec les tokens Aikoz. On ne le réécrit pas.
2. **Origine `aikoz`** = pas d'équivalent, on le construit (souvent par composition de primitives shadcn).
3. Les composants consomment exclusivement des tokens **sémantiques** (`role.*`), jamais de primitives (`dimension.*`, couleurs brutes).
4. On ne détaille la spec d'un composant que **juste avant de le construire** — pas d'avance sur les fiches.
5. Contraste ≥ 4.5:1 en light et dark, focus visible au clavier, sur tous les composants.
6. Un composant s'audite contre **toutes les surfaces** où un consommateur peut le poser — carte, page, fond discret — et dans **les deux registres**, pas seulement celle de son premier appelant.

## Comment lire la colonne Statut

Trois sources indépendantes, systématiquement distinguées :

| Marqueur | Sens |
|---|---|
| **code** | fichier livré dans `registry/aikoz/` sur `main` |
| **composant Figma** | vrai composant (`symbol`) dans les pages Atomes / Molécules / Organismes — réutilisable |
| **maquetté** | dessiné dans les maquettes de la page 1, mais **jamais componentisé** — à reconstruire de zéro |
| **prototype site** | présent dans le handoff Satellite App en HTML/React de maquette — la structure existe, l'habillage est à refaire aux tokens |

Un composant peut être maquetté sans exister comme composant Figma. La distinction change le coût : un composant Figma se transpose, une maquette se re-spécifie.

---

## Inventaire

| # | Composant | Famille | Origine | Priorité | Statut | Dépend de |
|---|---|---|---|---|---|---|
| 1 | `Button` | Actions | shadcn | v1 | **livré au registry** — ⚠ axes de variantes toujours désalignés avec le Figma | — |
| 2 | `KpiCard` | Data display | aikoz | v1 | **livré** — `variant` × `density`, décision 1 appliquée | ScoreStars, DeltaBadge, ProgressBar |
| 3 | `ScoreStars` | Data display | aikoz | v1 | **livré** — rôle `--rating` (500 clair, écart assumé ; 400 sombre) | — |
| 4 | `DeltaBadge` | Data display | aikoz | v1 | **livré** — état neutre ajouté, ton forçable | Badge |
| 5 | `Badge` | Data display | shadcn | v1 | **livré** — 5 tons, contour porteur du contraste | — |
| 6 | `Tooltip` | Feedback | shadcn | v1 | **livré** | — |
| 7 | `Select` | Forms | shadcn | v1 | **livré** | — |
| 8 | `ViewTabs` | Navigation | shadcn | v1 | **livré** — tabindex tournant, activation auto ou manuelle | — |
| 9 | `Card` | Layout | shadcn | v1 | **livré** — 3 surfaces × 3 densités, prop `as` sémantique | — |
| 10 | `ChoiceCard` | Navigation | aikoz | v1 | **livré** — vrai `<input>` en sr-only ; la coche porte l'état, pas le trait | — |
| 10b | `ChoiceGroup` | Forms | aikoz | v1 | **livré** — fieldset + legend ; remplace BrandPicker et SourceToggle | ChoiceCard |
| 11 | `DonutChart` | Data display | aikoz | v1 | **livré** — pourcentage écrit sur chaque part | ChartFrame |
| 12 | ~~`RankedBarChart`~~ | Data display | aikoz | — | **fondu dans `BarChart`** — horizontal, trié, une série | BarChart |
| 13 | `Leaderboard` | Data display | aikoz | v1 | **livré** — bâti sur `Table` ; pas de `RankRow` exporté, cf. le composant | Table, DeltaBadge, BrandLogo |
| 14 | ~~`MapWidget`~~ → `GeoDrilldown` | Data display | aikoz | v1 | ✅ **construit** — forage `France > Région > Département`, pas une carte (cf. décision 4) | Breadcrumb, BarChart, EmptyState |
| 15 | `Avatar` | Data display | shadcn | v1 | **livré** — repli sur initiales, 4 tailles | — |
| 16 | `Table` | Data display | shadcn | v1 | **livré** — caption, scope col/row, aria-sort, conteneur focusable | Skeleton |
| 17 | `Breadcrumb` | Navigation | shadcn | v1 | **livré** — dernier élément non cliquable, liens soulignés au repos | — |
| 18 | `DateRangePicker` | Forms | aikoz | v1 | **livré** — préréglages en radio + saisie libre native ; pas de calendrier en grille, cf. le composant | Popover |
| 19 | `Skeleton` | Feedback | shadcn | v1 | **livré** — muet pour les lecteurs d'écran, aria-busy au conteneur | — |
| 20 | `EmptyState` | Feedback | aikoz | v1 | **livré** — nomme ce qui manque, indique la sortie | Button |
| 21 | `Dialog` / `Sheet` | Overlays | shadcn | v1 | **livré** — 3 placements, sur Radix | — |
| 22 | `Toast` | Feedback | aikoz | plus tard | ✅ **construit** — deux régions live, compte à rebours pausable (WCAG 2.2.1) | — |
| 23 | `VerbatimCard` | Data display | aikoz | v1 | **livré** — rendue en `<article>`, troncature CSS | ScoreStars, Badge |
| 24 | `ProgressBar` | Data display | aikoz | v1 | **livré** — 3 niveaux, rôles `status.*-fill` | — |
| 25 | `SidebarNav` | Navigation | aikoz | v1 | **livré** — ni repli en icônes ni tiroir mobile : cela relève du gabarit | NavItem |
| 26 | `NavItem` | Navigation | aikoz | v1 | **livré** — état courant sur 3 canaux (aria-current, trait, graisse) | — |
| 27 | `Stepper` | Parcours · site | aikoz | v1 | **livré** — « étape 3 sur 5 » dans le nom du nav, pas seulement dessiné | — |
| 28 | ~~`BrandPicker`~~ | Forms · site | aikoz | — | **fondu dans `ChoiceGroup`** — `selection="single"` + `layout="grid"`, cf. écart 6 | ChoiceGroup |
| 29 | ~~`SourceToggle`~~ | Forms · site | aikoz | — | **fondu dans `ChoiceGroup`** — `selection="multiple"` + `meta={<Badge/>}`, cf. écart 6 | ChoiceGroup |
| 30 | `Input` | Forms | shadcn | v1 | **livré** — 4 états, libellé obligatoire, erreur en `role=alert` | — |
| 31 | `Accordion` | Layout · site | shadcn | v1 | **livré** — `hidden` sur le panneau fermé, bouton enveloppé dans un titre | — |
| 32 | `BookingFlow` | Overlays · site | aikoz | v1 | **livré** — ne parle à personne : `status` en entrée, `onSubmit` en sortie | Dialog, Input, SlotPicker |
| 32b | `SlotPicker` | Forms · site | aikoz | v1 | **livré** — brique extraite de `BookingFlow` ; un seul fieldset pour tous les jours | — |
| 33 | `LogoMarquee` | Data display · site | aikoz | v1 | **livré** — ne défile pas : WCAG 2.2.2, cf. le composant | BrandLogo |
| 34 | `FeaturePanel` | Layout · site | aikoz | v1 | **livré** — le niveau des sous-titres se déduit de celui de la section | — |
| 35 | `SiteNav` | Navigation · site | aikoz | v1 | **livré** — porte le lien d'évitement ; menu mobile en disclosure, pas en modale | — |
| 36 | `SiteFooter` | Navigation · site | aikoz | v1 | **livré** — 0 titre dans le plan du document, colonnes nommées par aria-labelledby | — |

**Compte** : 36 composants = **14 d'origine shadcn** + **22 spécifiques Aikoz**.

Répartition par **usage constaté** — dans les maquettes du dashboard d'un côté, dans le handoff Satellite App de l'autre. Un composant générique non observé sur le site (`Skeleton`, `EmptyState`) reste classé dashboard tant qu'il n'y est pas vu.

| Dashboard seul | Site seul | **Les deux** |
|---|---|---|
| 13 | 10 | **13** |

**Les 13 partagés sont le cœur du sujet** : `Button`, `Card`, `Badge`, `Input`, `Dialog`, `Avatar`, `KpiCard`, `ScoreStars`, `DeltaBadge`, `ProgressBar`, `VerbatimCard`, `Leaderboard`, `RankedBarChart`.

Plus d'un tiers du périmètre sert les deux surfaces. C'est là que le design system se rentabilise — et c'est ce qui rendrait coûteux de redessiner le site à côté. Le registre marketing existe précisément pour que ces treize-là traversent sans être réécrits.

État réel : **33 livrés** — les 31 précédents plus `SlotPicker` et `BookingFlow`.

> **À jour au 15/09/2026 — le registre est complet.** `GeoDrilldown` et `Toast` sont construits ; il ne reste aucune ligne ouverte.

**Il ne reste plus rien à construire sans arbitrage.** Ce qui subsiste : les **charts** (`DonutChart`, `RankedBarChart`, `LineChart`, `ComparisonLineChart`, `StackedBarChart`, `ChartLegend`) et **`MapWidget`**, qui est de la dataviz géographique — tous réservés à Alice. Plus `Toast`, que l'inventaire avait lui-même reporté à « plus tard ».

*Les 13 premiers livrés sont tous dans les 13 partagés : le travail fait sert déjà les deux surfaces. Les suivants couvrent les deux périmètres — `Table`, `Select` et `DateRangePicker` côté dashboard, `Accordion`, `Stepper` et `ChoiceGroup` côté site.*

*Entrées récentes : `ProgressBar`, `SidebarNav` et `NavItem` par les décisions 1 et 2 ; les dix suivants par le basculement de périmètre du 09/09.*

---

## Écarts relevés au recroisement

Cinq écarts ont un impact sur le plan de charge ou sur la qualité. Ils appellent une décision ou une correction, pas seulement une note.

### 1. `Button` n'est pas publiable

`registry/aikoz/button/button.tsx` est sur `main` mais `registry.json` ne déclare que `kpi-card`. Le Button est donc **invisible pour `npx shadcn add`** : il existe pour nous, pas pour un consommateur du registry.

Second écart, de fond : les axes de variantes ne concordent pas.

| | Code | Figma |
|---|---|---|
| Style | `default`, `secondary`, `outline`, `ghost` | `Primary`, `Ghost` |
| Surface | — (géré par `.dark`) | `Light`, `Dark` (axe de variante) |
| État | `hover`, `active`, `focus`, `disabled` | `Default`, `Hover`, `Disabled` |

Le Figma traite la surface comme un axe de variante là où le code la traite comme un contexte de thème. Le code a raison (c'est ce qui rend le white-label possible) : c'est le Figma qui doit s'aligner. `secondary` et `outline` n'ont par ailleurs aucun équivalent maquetté — soit ils sont spéculatifs, soit le Figma est en retard.

### 2. `KpiCard` : le code et la maquette ne décrivent pas la même carte

| | Code (`kpi-card.tsx`) | Maquette (Figma + `dashboard-marche-light.png`) |
|---|---|---|
| Valeur | ✅ | ✅ |
| Label | ✅ | ✅ |
| Étoiles | ✅ `StarRating` | ❌ absentes |
| Badge de tendance | ✅ `TrendBadge`, en bas | ✅ en haut à droite |
| Barre de progression | ❌ | ✅ sous la valeur, avec objectif |
| Sparkline | ✅ (taille `lg`) | ❌ absente |

Les quatre KpiCard des maquettes portent toutes une `ProgressBar` + un sous-texte d'objectif (« Objectif · 90 % », « vs 4,2 marché »). Le code livre à la place des étoiles et une sparkline.

> **Résolu** — cf. décision 1. Aucun des deux n'est périmé : ce sont deux variantes légitimes de métriques différentes. Le défaut était l'axe de l'API, pas le contenu de la carte.

### 3. `ScoreStars` et `DeltaBadge` existent déjà, inlinés

Ils ne sont pas « à créer » mais **à extraire** de `kpi-card.tsx` (`StarRating` l.62-86, `TrendBadge` l.88-107). Deux réserves à lever au passage :

- `StarRating` colore les étoiles en **`text-amber-400`** — une couleur Tailwind brute, hors tokens. C'est la seule violation de la règle 3 du présent document dans tout le code livré. Il faut un rôle dédié (`role.color.rating.*`), pas un détournement d'un rôle existant.
- `TrendBadge` ne gère que positif / négatif. La spec de Louis et le composant Figma `Tag` prévoient tous deux un **état neutre (gris)**, absent du code.

### 4. `MapWidget` : le statut de la v1.0 était faux

La v1.0 annonçait « maquetté Figma ». Vérification faite sur les quatre pages du fichier (Atomes, Molécules, Organismes, Page 1) : **aucun composant, frame ou calque de type carte, choroplèthe ou tracé géographique**. Recherche par nom (`Map`, `Carte`, `Geo`, `Choropleth`, `Département`, `Région`) : seules remontent des **étiquettes textuelles** de région (« Région · Est », « Région · Nord-IDF », « Région · Ouest », « Région · France »).

Lecture la plus probable : la segmentation géographique est prévue, sa **représentation cartographique ne l'est pas**. `MapWidget` est donc à considérer comme entièrement à spécifier — c'est le composant le plus coûteux de la liste et le seul sans aucune référence visuelle.

### 5. La navigation des maquettes est une Sidebar, pas des Tabs

L'inventaire v1.0 listait `Tabs` en v1 et laissait « Tabs ou sidebar ? » en question ouverte. Les maquettes répondent : **les deux dashboards (light et dark) utilisent une `Sidebar`**, composant Figma existant (organisme), avec `NavItem` (molécule, 3 états) — quatre entrées : Marché, Campagnes, Hall of Fames, Paramètres.

`ViewTab` existe bien, mais comme frame non componentisé et en usage secondaire (bascule de vue à l'intérieur d'un panneau), pas comme navigation globale.

> **Résolu** — cf. décision 2. Les deux entrent en v1 : ce sont deux composants aux contrats d'accessibilité distincts, qui coexistent dans un même écran. `Tabs` ne « rétrograde » pas, il change de périmètre.

---

## Composants présents en Figma, absents de l'inventaire v1.0

Huit composants Figma n'étaient reflétés nulle part dans la liste. Trois d'entre eux sont utilisés dans les maquettes du dashboard et sont donc, de fait, des prérequis v1.

| Composant Figma | Page | Variantes | Usage constaté | Suite à donner |
|---|---|---|---|---|
| `ProgressBar` | Atomes | Good / Warning / Critical | **dans les 4 KpiCard** des maquettes | v1 — prérequis de `KpiCard`, cf. écart 2 |
| `Sidebar` | Organismes | — | **navigation des 2 dashboards** | v1 si la Sidebar est retenue, cf. écart 5 |
| `NavItem` | Molécules | Default / Active / Hover | dans `Sidebar` | idem |
| `Input` | Atomes | Default / Focus / Error / Disabled | prérequis de `SearchBar` | à arbitrer |
| `SearchBar` | Molécules | Default / Focus | **topbar des maquettes** | à arbitrer — dépend de `Input` |
| `Topbar` | Organismes | — | maquettes | layout plutôt que composant — à arbitrer |
| `KpiGrid` | Organismes | — | maquettes | layout plutôt que composant — à arbitrer |
| `Chip` | Atomes | Default / Active / Hover | aucun usage constaté | à arbitrer — recoupe peut-être `Badge` / `Tag` |
| `Tag` | Atomes | Positive / Negative / Neutral | aucun usage constaté | cf. `VerbatimCard` ci-dessous |

`Topbar` et `KpiGrid` sont vraisemblablement des **gabarits de mise en page**, pas des composants de bibliothèque. À confirmer avant de les faire entrer dans le périmètre.

---

## Décisions prises — 26/08/2026

### 1 · `KpiCard` — deux axes, pas deux cartes

La question « code ou maquette » était mal posée : les deux cartes affichent des métriques de **nature différente** et fonctionnent toutes les deux. Le vrai défaut est que l'API indexe la richesse sur `size`, ce qui mélange **la place disponible** et **la nature de la donnée**.

```tsx
<KpiCard variant="rating" | "target" | "trend" | "raw"
         density="compact" | "default" | "large" />
```

`variant` décrit ce que la donnée *est*, `density` la place qu'on lui accorde. Aujourd'hui `size="lg"` force la sparkline : impossible d'afficher une note en étoiles dans une grande carte.

| Métrique | Échelle | Appui |
|---|---|---|
| Note moyenne 4,2 | bornée 0–5 | étoiles → `rating` |
| Taux de réponse 87 % | bornée, avec objectif | barre → `target` |
| Avis traités 312 | non bornée | tendance → `trend` |
| Délai 6 h | bornée par un objectif | barre inversée (moins = mieux) → `target` |

**Conséquence : l'extraction de `ScoreStars` et `DeltaBadge` n'est plus bloquée.** Avec `ProgressBar`, ils deviennent les briques d'appui que les variantes composent. `ProgressBar` entre en v1.

**Principe retenu pour le DS** : variantes **fermées** par défaut, plus un slot d'échappement documenté « si tu t'en sers deux fois, ça doit devenir une variante ». Sur un dashboard la cohérence prime sur la flexibilité — un même type de métrique doit se lire pareil d'un écran à l'autre.

**Reste à valider avec Louis** : les 4 cartes des maquettes portent toutes une barre, y compris « Avis traités · 312 » dont le sous-texte est « 30 derniers jours ». Une barre suppose un dénominateur — 312 sur combien ? Le système de variantes force cette question, la maquette actuelle l'esquive.

### 6 · `BrandPicker` + `SourceToggle` = `ChoiceGroup`

Mis côte à côte, les deux ne diffèrent que par **deux choses** : l'arité de la sélection (une marque contre plusieurs sources) et le contenu des cartes (un logo contre un libellé et un compte). Deux props, donc — pas deux composants. C'est exactement le raisonnement de la décision 1 sur `KpiCard` : deux axes indépendants valent mieux que le produit de leurs combinaisons.

Ce qui a été vérifié avant de les fondre, parce que l'inverse arrive souvent : leurs **contrats d'accessibilité sont-ils différents ?** Non — les deux sont un `<fieldset>` avec `<legend>`, l'un peuplé de `radio`, l'autre de `checkbox`, et c'est précisément le prop `selection` qui bascule. Là où `SidebarNav` et `ViewTabs` avaient deux sémantiques irréconciliables, ici il n'y en a qu'une, paramétrée.

La sortie de secours de `BrandPicker` — « Je ne trouve pas ma marque » — est un `escape` rendu **hors du `<fieldset>`** : ce n'est pas une septième marque, et la mêler aux options la ferait compter dans « 7 sur 7 ».

**Réversible.** Si l'un des deux acquiert un comportement propre — une recherche dans la grille de marques, par exemple — il se détachera.

### 2 · Navigation — `SidebarNav` et `ViewTabs`, les deux

Ce ne sont pas deux options concurrentes mais **deux composants distincts qui coexistent dans le même écran** : la sidebar navigue entre sections, les tabs basculent de vue à l'intérieur d'une page. Ils n'ont pas le même contrat d'accessibilité.

| | `SidebarNav` | `ViewTabs` |
|---|---|---|
| Rôle | navigation entre sections | bascule de vue dans la page |
| Sémantique | `<nav>` + liens | `role="tablist"` / `role="tab"` |
| État courant | `aria-current="page"` | `aria-selected="true"` |
| Clavier | Tab de lien en lien | flèches ← → + roving tabindex |
| Effet | change la route | échange un panneau, même route |

**Règle à appliquer sans exception : c'est le comportement qui décide, jamais l'apparence.** Un « onglet » qui change de route est un lien stylé en onglet ; l'implémenter en `role="tab"` annonce à un lecteur d'écran un panneau qui va s'échanger alors que la page entière est remplacée. C'est un des bugs d'a11y les plus fréquents.

Les deux entrent en v1. Ils partagent les **tokens**, pas le composant : `NavItem` ressemble à un onglet, mais mutualiser ferait fuiter la mauvaise sémantique.

### 3 · Typographie — longhand

Le shorthand CSS `font` ne transporte pas `letter-spacing` et **réinitialise `font-feature-settings` et `font-variant-numeric`** — vérifié en navigateur : `font: var(--role-typography-metric)` casse l'alignement des chiffres, sur le rôle des KPI. Les rôles passent en longhand, 5 variables par rôle. Coût de migration nul, aucun composant ne consomme encore ces variables.

L'unité `em` du tracking est conservée et l'écart au type `dimension` du DTCG documenté : l'alternative conforme (ratio sans unité recomposé en `calc(x * 1em)`) violerait la règle verrouillée « la variable porte la valeur directement utilisable ».

### 4 · `ScoreStars` — `role.color.rating` sur `warning-600`

`text-amber-400`, seule couleur hors tokens du code livré, donne **1,67:1** sur carte : hors sujet au regard du seuil 3:1 de WCAG 1.4.11 (l'étoile porte l'information, ce n'est pas du texte). Rampe mesurée contre `--card` :

| palier | light | dark |
|---|---|---|
| 400 | 1,66 ❌ | 10,45 ✅ |
| 500 | 2,18 ❌ | 7,97 ✅ |
| **600** | **3,25 ✅** | **5,35 ✅** |
| 700 | 5,13 ✅ | 3,39 ✅ |

`warning-600` est le seul palier conforme des deux côtés. Marge courte en light : si la carte s'assombrit un jour, c'est le premier ratio à retester.

### 5 · `VerbatimCard` — au périmètre v1

Retenue. L'atome Figma `Tag` (3 variantes de sentiment, sans usage maquetté) n'a de sens que sur un avis unitaire. Reste à confirmer côté produit le moment où le dashboard donne accès aux avis un par un, pour situer la priorité dans le lot.

---

## Décisions prises — 10/09/2026

Deux écarts relevés au recroisement des maquettes Cockpit Mono-POI / Multi-POI (ADP), tranchés par Louis.

### 6 · `KpiCard` — 5e variante `benchmark`

Les cartes de métrique du cockpit (« Note de la source », « Taux de réponse »…) affichent systématiquement une ligne secondaire « vs Moyenne marché ». Ça ne correspond à aucune des quatre variantes actées en décision 1 (`rating` / `target` / `trend` / `raw`) : ni étoile, ni objectif, ni tendance, la donnée d'appui est une comparaison à une référence externe, pas une lecture de la valeur elle-même.

```tsx
<KpiCard variant="rating" | "target" | "trend" | "raw" | "benchmark"
         density="compact" | "default" | "large" />
```

**Confirmé** : c'est une 5e variante, pas un détournement de `raw`. Contenu : valeur principale (code couleur selon performance, cf. specs `KpiCard`), puis une ligne « vs Moyenne marché » + sa valeur — sans appui graphique (pas d'étoile, pas de barre, pas de sparkline).

> **Livré le 11/09** — purement textuel, pas de signe/delta implicite : `benchmarkValue` + `benchmarkLabel` (défaut « vs Moyenne marché »), même formatage `fr-FR` que la valeur principale.

### 7 · `En-tête de section` — gabarit, pas composant

**Confirmé** : c'est un gabarit de mise en page (bandeau titre + pictogramme + action optionnelle à droite, ex. sélecteur de période), au même titre que `Topbar` et `KpiGrid` déjà signalés comme tels dans le tableau ci-dessus. Il ne rejoint pas la bibliothèque de composants et sort du décompte des 36 — documenté ici pour mémoire, à réutiliser en HTML/Tailwind directement dans les pages qui en ont besoin, pas en tant que composant du registry.

---

## Décisions prises — 11/09/2026

Batch de composants demandé par Louis (`aikoz-composants-V2_LB.xlsx`, branche `nouveaux_composants_Louis`) pour le panneau de paramétrage de la réponse automatique et le Kanban de supervision des réponses. Trois éléments de la liste recoupaient un composant déjà livré — non reconstruits, cf. règle « si overlap, ne rien recréer ».

### 8 · Trois recoupements confirmés — rien reconstruit

| Demandé | Recoupe | Pourquoi c'est le même composant |
|---|---|---|
| `Graphique barres empilées (polarité)` | `BarChart` (`layout="stacked"`, `orientation="vertical"`) | Le composant livré au 09/09 fait déjà exactement ça : séries empilées à 100 %, séparateur 2px, trame comme second canal. Usage : `<BarChart layout="stacked" orientation="vertical" series={[positif, négatif]} xKey="segment" />`. |
| `Overlay - Détail` | `Dialog` (placement `center`, défaut) | Focus piégé, retour de focus, Échap, titre obligatoire, footer pour le CTA — tout ce que demandait la fiche est déjà le contrat documenté de `Dialog`. Voir la composition dans `ResponseKanban` (colonne « Réponses hors charte »). |
| `Carte avis` | `VerbatimCard` (+ `children` pour `ReplyBubble`) | `VerbatimCard` couvre déjà note/auteur/date/texte/étiquette de statut, et expose un slot `children` — exactement ce qu'il fallait pour y loger la `ReplyBubble`. Pas un sous-composant séparé. |

`Carte avis` n'était d'ailleurs pas dans la liste explicite de Louis : elle apparaissait uniquement comme sous-composant du Kanban dans la fiche Excel. Signalée ici plutôt que construite en silence.

### 9 · `Carte de choix (segmenté)` et `Chip de sélection` — variantes de `ChoiceCard`/`ChoiceGroup`, pas deux nouveaux composants

Les deux demandaient la même mécanique d'accessibilité que `ChoiceCard` a déjà (input réel en `sr-only`, anneau reporté, groupe en `fieldset`/`legend`) — seul l'habillage visuel change. Construire deux composants séparés aurait dupliqué cette mécanique avec le risque de la refaire moins bien une seconde fois, exactement le raisonnement qui a produit `ChoiceGroup` en 08/2026 (« deux props, pas deux composants »).

```tsx
<ChoiceCard appearance="card" | "segmented" | "chip" />
<ChoiceGroup layout="grid" | "list" | "segmented" | "chip" />
```

`segmented` : rang connecté (le conteneur `ChoiceGroup` porte le contour partagé et les séparateurs), le remplissage `--primary` porte l'état, pas de pastille de coche. `chip` : pastilles indépendantes avec espace normal, coche inline sur sélection. `appearance="card"` (défaut) reste inchangé au pixel près — vérifié par re-lecture des 4 usages existants avant/après.

### 10 · Cinq composants livrés

| Composant | Rôle | Notes |
|---|---|---|
| `Switch` | Interrupteur binaire immédiat | `<input type="checkbox" role="switch">` natif — pas de dépendance Radix ajoutée. |
| `InfoBanner` | Bandeau d'information (info/warning/error) | `role="status"`, jamais `role="alert"` ; mêmes tons que `Badge` mais texte en `--foreground` (paragraphe, pas un mot court). |
| `Textarea` | Champ de texte libre multiligne | Sibling d'`Input` (mêmes tokens bordure/focus/erreur) ; `rows` + redimensionnement natif plutôt qu'auto-grow — plus robuste dans une liste à plusieurs champs ouverts (le Kanban). |
| `CountBadge` | Badge / pastille numérique | Deux variantes non confondables au premier regard : `count` (cercle plein `--primary`) et `rank` (marqueur discret, carré). |
| `ReplyBubble` | Bulle de réponse (IA/opérateur) sous un avis | Traitement en creux, pensée pour vivre dans `VerbatimCard.children`, pas comme une carte de plus. |

### 11 · `ResponseKanban` — composite, Kanban de supervision des réponses

3 colonnes fixes par urgence croissante (réponses automatisées à valider → hors charte à corriger → avis sensibles à traiter). Assemble `Card`, `Badge`, `Button`, `VerbatimCard`, `EmptyState`, `Dialog` (existants) et `ReplyBubble`, `Textarea`, `CountBadge` (nouveaux, décision 10). L'en-tête de chaque colonne reproduit le gabarit « En-tête de section » (décision 7) directement en JSX plutôt que d'importer un composant qui n'existe pas.

Reste ouvert (« à définir »/« à confirmer » dans la fiche de Louis, non tranché ici) : comportement des 3 colonnes en dessous de 1024px (empilement vertical appliqué par défaut, à valider), pagination vs accordéon pour « Voir plus » (implémenté en pagination simple), variante `operator` de `ReplyBubble` (construite mais jamais vue en usage réel).

> **⚠️ Compte du tableau ci-dessus non recalculé.** Cette session ajoute 6 nouveaux composants au registry (`Switch`, `InfoBanner`, `Textarea`, `CountBadge`, `ReplyBubble`, `ResponseKanban`) et étend 2 existants (`ChoiceCard`/`ChoiceGroup`, `KpiCard`) sans toucher aux décomptes « 36 composants » / répartition dashboard-site du haut de ce fichier, qui datent d'avant le fast-forward du 10/09 (36 commits, dont Leaderboard, Select, SidebarNav, Card, Avatar, Dialog, les 3 charts…). Ce fichier a besoin d'une passe de réconciliation complète contre `registry.json` (43 entrées à ce jour) avant que ces chiffres redeviennent fiables — pas fait ici pour ne pas introduire un mauvais compte au passage.

---

## Points encore à trancher

- **Charts** et **Web Components** : tranchés le 09/09 — cf. « Architecture actée » ci-dessus.
- **Palette du lead magnet** : tranchée — registre marketing distinct, et le prototype de Louis s'y aligne. Ce qu'il doit corriger : remplacer ses 27 couleurs en dur par les tokens, rendre à l'aquamarine son rôle unique de CTA, supprimer les 32 dégradés et 17 ombres décoratifs. Son `#FF4D6D` est en revanche à garder — il comblait un trou réel, repris ici en `error.400`.
- **Dénominateur de la variante `target`** pour les métriques non bornées — cf. décision 1, à valider avec Louis.

---

## Specs fonctionnelles (source : Louis, 08/2026)

Reprises telles quelles pour les composants dashboard. Les captures d'écran correspondantes sont dans le xlsx source.

### `KpiCard`
**Rôle** — mettre en avant une donnée : note, pourcentage, durée, volume.
**Contenu** — la valeur, avec code couleur selon performance : note verte > 4.0 / rouge < 4.0 (couleur portée par l'étoile) ; taux de réponse vert > 85% / rouge < 85%. Durée et volume : seuils à définir.
**Interactivité** — aucune.

> ⚠ Diverge des maquettes, cf. écart 2. Les maquettes ne montrent pas d'étoile et ajoutent une barre de progression avec objectif.

### `DonutChart`
**Rôle** — comparer plusieurs cohortes de données ; permettre de choisir les données comparées.
**Contenu** — somme au centre ; étiquette de variation sous la somme (verte si positive, rouge si négative — seuil à définir) ; sections colorées (vert/rouge en binaire, palette au-delà de 2 cohortes) ; légendes (titre, donnée, répartition) ; menu déroulant si d'autres données sont restituables.
**Interactivité** — pas d'interaction sur une donnée unique. Avec plusieurs données : menu déroulant cliquable. On-hover : met en exergue la cohorte survolée et grise les autres.

### `RankedBarChart` (graphique bâton)
**Rôle** — présenter une hiérarchie entre entités (marques, agences) et son évolution dans le temps. Bâtons classés par ordre décroissant, de droite à gauche.
**Contenu** — en-tête (titre, sous-titre, infobulle optionnelle) ; bâton + logo/image + chiffre ; card au survol (titre, légendes, note/volume/pourcentage) ; plage temporelle (texte + années).
**Interactivité** — plage temporelle cliquable → recalcule la répartition et peut modifier l'ordre des bâtons. Survol d'un bâton → card de détail.

### `Leaderboard` (classement)
**Rôle** — comparer des entités ou individus (Top 5 / 8 / 10), identifier visuellement le podium, connaître sa position.
**Contenu** — en-tête (titre, sous-titre, infobulle optionnelle) ; par ligne : rang fixe, initiale, texte, valeur, étiquette de variation (vert positif / gris neutre / rouge négatif) ; liseré, chiffre et initiale en or / argent / bronze pour les trois premiers.
**Interactivité** — aucune.

> Note de recroisement : le composant Figma `RankRow` n'expose que deux états (`Default`, `Highlight` — la ligne « Vous »). L'or / argent / bronze du podium **n'est pas maquetté**. À produire à partir de la spec seule.

### `DeltaBadge` (étiquette de variation)
**Rôle** — mettre en exergue une donnée ou un mot.
**Contenu** — texte, chiffre ou pourcentage. Vert si positif, rouge si négatif, gris si neutre.
**Interactivité** — aucune.

### `ChoiceCard` (card de segmentation)
**Rôle** — segmenter le parcours utilisateur en scénarios. Chaque clic renvoie une décision au back-office (ex. « assurance » → tag transmis à Aikoz pour déterminer le marché à étudier).
**Contenu** — picto ou logo dans un cercle/rectangle, titre, sous-titre. Si inactif : tag « Bientôt disponible ici ».
**États** — actif / inactif (en plus des états standards).
**Interactivité** — cliquable.

### `Tabs` (tabulation header)
**Rôle** — naviguer entre les vues.
**Contenu** — 5 entrées maximum.
**Interactivité** — cliquable, déclenche la navigation.

### `Button`
**Rôle** — déclencher une action : valider, annuler, naviguer, ouvrir une modale.
**Variantes** — default, secondary, outline, ghost. **Tailles** — sm 36px, md 44px (défaut), lg 48px.
**États** — default, hover, active, focus (anneau clavier), disabled, loading si action asynchrone.
**Règles** — coins pilule (`rounded-full`), label obligatoire, icône optionnelle gauche/droite, disabled ni cliquable ni focusable.

---

## Fondation — soldée

La couche de tokens est fermée. Plus rien n'empêche de construire.

| Chantier | État | PR |
|---|---|---|
| `font-size` sous `dimension.font-size.*` | livré | [#22](https://github.com/Voice-of-Customers-by-Okuden/aikoz-design-system/pull/22) |
| `--role-typography-label-sm` corrompu | corrigé à la racine | [#22](https://github.com/Voice-of-Customers-by-Okuden/aikoz-design-system/pull/22) |
| `semantics.css` jamais importé | corrigé | [#22](https://github.com/Voice-of-Customers-by-Okuden/aikoz-design-system/pull/22) |
| Rôles typographiques en longhand | livré | [#25](https://github.com/Voice-of-Customers-by-Okuden/aikoz-design-system/pull/25) |
| Playground — onglets Tokens et Décisions | livré | [#24](https://github.com/Voice-of-Customers-by-Okuden/aikoz-design-system/pull/24) |

**Letter-spacing** — restauré. Les 14 rôles sortent en longhand, 5 variables chacun, et le tracking s'applique en suivant la taille : `-2,88px` sur `heading-display` (72px × -0,04em), `0,5px` sur `label-sm` (10px × 0,05em). Le shorthand `font` est abandonné : outre le tracking, il réinitialisait `font-feature-settings` et `font-variant-numeric`, cassant l'alignement des chiffres sur le rôle `metric`.

**Unité `em`** — conservée, écart au type `dimension` du DTCG documenté. L'alternative conforme (ratio sans unité recomposé en `calc(x * 1em)`) violerait la règle « la variable porte la valeur directement utilisable ». `em` transite en outre nativement vers Figma, qui stocke le letter-spacing en pourcentage de la taille.

---

## Ordre de construction

État au 26/08/2026, tout dans [PR #28](https://github.com/Voice-of-Customers-by-Okuden/aikoz-design-system/pull/28).

- [x] **`ScoreStars`** extrait, rôle `role.color.rating` créé — `warning-700` en light, `warning-600` en dark.
- [x] **`DeltaBadge`** extrait, état neutre ajouté, ton forçable.
- [x] **`ProgressBar`** transposé du Figma, famille de rôles `status.*-fill` créée.
- [x] **`Button` déclaré dans `registry.json`** — il était non installable.
- [x] **Registre marketing** — `tokens/theme/marketing.json`, émis sur `[data-register="marketing"]`, 24 paires auditées sans échec ([PR #29](https://github.com/Voice-of-Customers-by-Okuden/aikoz-design-system/pull/29)).
- [x] **Périmètre réécrit** — le site entre, 26 → 36 composants.

Cinq composants au registry : `button`, `score-stars`, `delta-badge`, `progress-bar`, `kpi-card`.

### Suite — le site d'abord

Le branchement du système se fait **en priorité sur le site**, le dashboard pur suit. L'ordre découle de ce que le tunnel consomme.

1. [x] **`KpiCard` refondu** sur `variant` × `density` — 4 variantes × 3 densités, niveau déduit de l'objectif.
2. [x] **`VerbatimCard`** livrée, et `Badge` avec. Le composant `Tag` que l'inventaire listait en dépendance n'existe pas : un tag de sentiment est un `Badge` avec un autre contenu.
3. [x] **`Card`, `Avatar`, `Dialog`** livrés — les 13 partagés le sont désormais tous sauf `Leaderboard` et `RankedBarChart`.
4. **`Leaderboard`, `RankedBarChart`** ← prochaine étape — le `marqueDash` du tunnel les demande, et le dashboard aussi.
5. **Composants de tunnel** : `Stepper`, `ChoiceCard`, `BrandPicker`, `SourceToggle`, `BookingFlow`.
6. **Pages de site** : `SiteNav`, `SiteFooter`, `Accordion`, `FeaturePanel`, `LogoMarquee`.
7. **Dashboard pur, en dernier** : `MapWidget`, `Table`, `Breadcrumb`, `TimeRangePicker`, `Toast`, `Skeleton`, `EmptyState`, `DonutChart`, `Tooltip`, `Select`, `ViewTabs`, `SidebarNav`, `NavItem`.

**Architecture actée** : composants React distribués par le registry shadcn. Le white-label passe par la couche de tokens (`data-brand`), le registre par `data-register` — **pas** par des Web Components : le levier d'embarquabilité est déjà la couche de tokens, et si des Web Components s'imposent un jour, les tokens passent tels quels et seule la coquille est réécrite. Charts sur le module `chart` de shadcn (recharts), déjà en dépendance.
