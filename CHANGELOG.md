# Journal des versions

Aikoz Design System suit le [versionnage sémantique](https://semver.org/lang/fr/).

Ce qui compte pour qui consomme le registry :

- **MAJEUR** — une prop disparaît ou change de type, un composant est renommé
  ou retiré, une variable CSS publiée cesse d'exister. Il faut relire son code.
- **MINEUR** — un composant, une prop ou un rôle nouveau. Rien à faire.
- **CORRECTIF** — un défaut corrigé sans changer le contrat. Rien à faire.

Un changement de couleur, d'espacement ou de police n'est pas cassant au sens
de l'API — mais il se voit, donc il est toujours écrit ici.

> **Ce journal commence au 22/09/2026.** Les 119 premières fusions ont eu lieu
> sans versionnage, et c'est précisément ce qu'on corrige : `tableCollapsed`
> a disparu de `ChartFrame` sans que rien ne le signale à qui l'employait.

---

## [2.6.0] — 2026-09-22

### Cassant

- **`--accent` ne vaut plus l'aplat vif de la marque, mais son VOILE.** Dans
  shadcn, `--accent` est une surface discrète de survol ; le pont la pointait
  sur `brand.accent`, un rôle détourné. Un consommateur qui écrivait
  `bg-accent` en attendant un aplat de marque obtiendra désormais un voile —
  `--color-brand-accent` reste disponible pour l'aplat.

### Corrigé

- **Les cinq dettes d'accent tombent d'un coup**, et sans retoucher une seule
  couleur de charte. Elles ne venaient pas des couleurs mais de ce qu'on leur
  demandait :

  | | avant | après | seuil |
  | --- | --- | --- | --- |
  | anneau de focus | 36–43 | **49–92** | 45 |
  | trait de l'entrée courante | 37 | **50–92** | 45 |
  | texte sur l'accent | 38–51 | **76–87** | 75 |
  | accent comme texte | 43–54 | **81+** | 75 |

- **L'accent de marque monte d'un palier en sombre** (400 → 300). À 400,
  l'anneau de focus valait 31 à 43 selon la marque — ce qui dit à qui navigue
  au clavier où il se trouve ne se voyait pas.

- **Le voile d'accent avait le même palier clair dans les deux thèmes** : en
  sombre, un voile quasi blanc sur une carte à 0,223, soit APCA 104 contre
  elle. Ce n'était pas un voile, c'était un aplat. Il prend un palier de
  milieu de rampe par marque, choisi pour se distinguer de la carte (écart 16
  à 27) tout en portant du texte.

- **L'accent cesse d'être une couleur de texte.** Posé sur la carte il
  plafonnait à 43–54 pour un plancher de 75, et aucun palier de rampe n'y
  arrivait sous Extime. Il porte du texte sur son propre voile, ou il ne
  porte rien : l'accent est un signe.

---

## [2.5.0] — 2026-09-22

### Ajouté

- **`Combobox`** — le dernier des cinq composants qui manquaient. Chercher un
  établissement parmi trois cents dans un `Select`, c'est faire défiler trois
  cents lignes.

  | | `Select` | `Combobox` |
  | --- | --- | --- |
  | options | une dizaine | des centaines |
  | on choisit | en parcourant | **en tapant** |

  Le motif ARIA est écrit à la main, sans dépendance : il tient en cinquante
  lignes, et sa seule partie difficile — **`aria-activedescendant`** — est
  justement celle qu'une bibliothèque cache. C'est elle qui désigne la ligne
  parcourue **sans déplacer le focus**, donc qui permet de continuer à taper
  en parcourant aux flèches. Un `<div role="option">` focusable casse ça, et
  la frappe suivante part dans le vide.

  La recherche **ignore les accents** — « roissy » trouve « Roissypôle », et
  c'est la première chose qu'on tape — et classe ce qui **commence** par la
  saisie avant ce qui la contient, l'ordre d'origine départageant à
  l'intérieur de chaque groupe : un tri instable ferait sauter les lignes
  d'une frappe à l'autre.

  Le vide **répète la saisie** : « Aucun établissement pour “orlyy” » dit où
  chercher l'erreur, là où « Aucun résultat » laisse croire à un vide de
  données. Et une liste coupée **compte ce qu'elle cache** — « 262 autres,
  affinez la recherche » — parce qu'une troncature silencieuse fait croire
  que ce qu'on cherche n'existe pas.

  La liste est rendue **dans le flux**, pas dans un `Portal` : elle hérite du
  registre et du thème de son conteneur, contrairement à `Select` et
  `DropdownMenu`.

---

## [2.4.0] — 2026-09-22

### Ajouté

- **`AlertDialog`** — la confirmation d'une action irréversible, qui manquait
  au `DropdownMenu` livré juste avant : sa commande destructive n'avait nulle
  part où demander confirmation.

  Ce n'est pas un `Dialog`, et la différence n'est pas cosmétique :

  | | `Dialog` | `AlertDialog` |
  | --- | --- | --- |
  | rôle ARIA | `dialog` | **`alertdialog`** |
  | clic à l'extérieur | ferme | **ne ferme pas** |
  | description | facultative | **obligatoire** |
  | focus à l'ouverture | premier élément | **le retrait** |

  Le focus va sur « Annuler » : une boîte qui demande de confirmer une
  suppression et pose le focus sur « Supprimer » transforme une barre
  d'espace réflexe en perte de données.

  Le bouton nomme ce qu'il fait — « Supprimer l'établissement », jamais
  « Confirmer » : quelqu'un qui revient à son écran après une interruption
  doit pouvoir décider en lisant le seul bouton.

  Nouvelle dépendance : `@radix-ui/react-alert-dialog`.

### Corrigé

- La CI tournait en **node 20 / npm 10**, le poste en node 24 / npm 11 : un
  verrou écrit par npm 11 n'est pas consommable par npm 10, et la marche
  tombait dès `npm ci` sur un message qui envoyait chercher ailleurs. Les
  deux marches passent en node 24, et `engines: node >= 22` inscrit
  l'attente. `audit:version` vérifie en plus que le verrou suive la version.

---

## [2.3.1] — 2026-09-22

### Corrigé

- **L'introduction annonçait « 37 composants » quand il y en avait 51.** Le
  chiffre avait été juste une fois, puis quatorze composants sont arrivés et
  personne n'est retourné éditer la phrase. C'est la première ligne que lit
  qui découvre le système, et elle mentait d'un tiers.

  Les chiffres de la vitrine sont désormais **comptés** — `chiffres.ts` est
  généré par `registry:build`, et la CI échoue si le fichier commité ne
  correspond plus. Même doctrine que le pont Tailwind et `version.json` : on
  ne déclare pas ce qu'on peut compter.

- **Les tableaux Markdown ne s'affichaient pas dans les pages de
  documentation.** MDX ne rend pas les tableaux GitHub sans `remark-gfm` :
  neuf tableaux de la seule page Accessibilité étaient une soupe de barres
  verticales, et autant ailleurs. Ils l'étaient depuis le début — on relit sa
  documentation dans l'éditeur, où elle a l'air juste.

---

## [2.3.0] — 2026-09-22

### Ajouté

- **`DropdownMenu`** — les actions par ligne d'un tableau de bord.

  Un menu contient des **commandes, pas des liens** : s'il s'agit d'aller
  ailleurs, c'est de la navigation. Le contrat clavier du motif ARIA `menu`
  — flèches, `Échap`, frappe pour atteindre une entrée, **retour du focus sur
  le déclencheur** — est délégué à Radix ; le réécrire à la main rate presque
  toujours ce dernier point.

  Le nom est obligatoire : un tableau de bord porte un menu par ligne, et
  « Actions sur Orly 4 » se distingue là où « Actions » non.

  La commande **destructive est déplacée en dernier**, après un filet, où
  qu'elle soit déclarée. Une commande irréversible voisine d'une commande
  anodine se clique par erreur : l'ordre est une protection, pas une
  convention d'affichage.

  Nouvelle dépendance : `@radix-ui/react-dropdown-menu`.

---

## [2.2.0] — 2026-09-22

### Ajouté

- **`Checkbox`** — un vrai `<input type="checkbox">` masqué en `sr-only` sous
  une boîte dessinée, jamais un `<div role="checkbox">` : il reste focusable,
  se coche à la barre d'espace, participe à l'envoi du formulaire et à
  l'autoremplissage.

  Elle existe pour ce qu'aucun autre contrôle du système ne sait dire :
  **l'état indéterminé**, celui du « tout sélectionner » quand une partie
  seulement des lignes est retenue. `Switch` est binaire par nature,
  `ChoiceGroup` ne connaît que des options complètes.

  Règle d'emploi : `Checkbox` quand l'effet a lieu à l'envoi du formulaire,
  `Switch` quand il a lieu tout de suite. Un interrupteur qui attend un bouton
  « Enregistrer » ment sur sa promesse.

  C'est le `<label>` qui porte la cible, pas la boîte de 20 px — elle serait
  sous le plancher de 24 px du critère WCAG 2.2 AA 2.5.8.

---

## [2.1.0] — 2026-09-22

### Ajouté

- **`Pagination`** — `Table` savait trier, pas paginer, et le tableau de bord
  ADP portera des centaines d'agences.

  Un `<nav>` nommé, une liste, des `<button>` — **pas des liens** : changer de
  page ne change pas d'URL dans un tableau de bord, et annoncer un lien
  promettrait une navigation qui n'aura pas lieu. La page courante est un
  `<span>` avec `aria-current`, jamais un bouton — même raisonnement que le
  dernier niveau d'un fil d'Ariane.

  Le résumé « 41–60 sur 312 » porte l'information que les numéros ne donnent
  pas, en `aria-live="polite"`. La fenêtre garde une **largeur constante** :
  ce qu'une extrémité ne peut pas prendre est reporté à l'opposé, sinon la
  barre change de taille en naviguant et les boutons se déplacent sous le
  doigt. Sous 2 pages, elle ne rend rien.

  `fenetre(page, pages, voisines)` est exportée : elle se teste sans rendu.

---

## [2.0.1] — 2026-09-22

### Corrigé

- **Le tableau de bord défilait horizontalement sur mobile.** Mesuré à
  390 px : 36 px de débordement. Le tableau du classement avait pourtant son
  conteneur `overflow-x-auto` — mais un élément de flex ou de grille vaut
  `min-width: auto` et ne rétrécit jamais sous la largeur de son contenu. La
  grille faisait 350 px, la `Card` 406. Un défilement interne ne peut pas
  contenir ce que son parent laisse s'élargir.

  `min-w-0` entre sur `Card`, `Table`, `ChartFrame` et la barre de `ViewTabs`.
  À 768 px, rien ne débordait déjà — le défaut n'existait qu'en dessous.

### Gouvernance

- `audit:conventions` refuse désormais un `overflow` horizontal posé sans
  `min-w-0` sur le même élément. Onzième convention.

---

## [2.0.0] — 2026-09-22

Majeure, à cause d'un seul changement — mais il casse à la compilation.

### Cassant

- **`ChartFrame` : `tableCollapsed` (booléen) devient `tableau: "bascule" | "dessous"`.**
  `tableCollapsed: true` s'écrit désormais `tableau="bascule"` (le tableau
  s'ouvre au clic), `tableCollapsed: false` devient `tableau="dessous"` (il est
  toujours visible). Le changement date du 21/09 et n'avait pas été annoncé.
- **`Card` : la variante `surface="inverse"` devient `surface="heros"`.**
  L'ancienne valeur reste rendue à l'identique et ne sera pas retirée sans une
  version majeure de plus. Le nom disait le MOYEN — inverser le thème — et non
  le rôle, qui est de primer.
- **75 rôles CSS `--role-*` sont retirés** : les treize familles de
  typographie, cinq rayons, cinq ombres, trois épaisseurs de bordure. Aucun
  composant ne les lisait ; si votre code les lit, l'échelle vit désormais dans
  les utilitaires Tailwind (`text-sm`, `rounded-[var(--radius)]`).
- **`--surface-inverse`, `--surface-inverse-to`, `--on-inverse`** deviennent
  des alias de `--surface-hero`, `--surface-hero-to`, `--on-hero`. Ils restent
  servis.

### Ajouté

- **Carte de France** — `FranceMap` : régions, départements, communes chargées
  à la demande, outre-mer en cartouches à sa propre échelle, symboles
  proportionnels pour les agences, et mesure de la concurrence proche
  (`mesurerProximite`).
- **`surface.hero`** — le rôle de la carte qui prime, avec `hero-to` et
  `hero-glow`, plus une bande de clarté vérifiée au build.
- **Variante `tactile:`** — `@media (pointer: coarse)`. Les contrôles denses
  passent à 44 px au doigt sans rien coûter à la souris.
- **`optional`** sur `Input`, `Select` et `Textarea` : « (facultatif) » visible
  à côté du libellé.
- **`ink.500`** dans l'échelle de chrome sombre, entre 400 et 600.

### Corrigé

- Le fil d'Ariane offrait des cibles de **20 px**, sous le plancher de 24 px du
  critère WCAG 2.2 AA 2.5.8.
- **La police de titres n'était employée nulle part.** Sous Aikoz, tous les
  titres sortaient en Inter. Son repli passe de `sans-serif` à une pile
  choisie : Futura, Avenir Next, Century Gothic.
- **L'échelle typographique ne gouvernait rien** : les composants écrivaient
  les valeurs par défaut de Tailwind. Un pont généré les branche sur les
  tokens, et `font-semibold` — la graisse la plus employée du système — entre
  enfin dans l'échelle.
- **Trois composants sur six ignoraient `prefers-reduced-motion`** : `Switch`,
  `KpiCard`, `VerbatimCard`.
- **La carte héroïne valait 15,3 fois la clarté des autres cartes en sombre.**
  Ramenée à 2,4 — un panneau allumé, pas un aplat blanc.
- **Le texte principal en sombre était du blanc pur**, et produisait un halo.
- **43 % d'écart d'épaisseur entre deux icônes du même écran** : `strokeWidth`
  est en unités du viewBox, pas en pixels.
- **Cinq `<svg>` décoratifs sans `aria-hidden`.**
- `BookingFlow` signalait ses erreurs sans y emmener le focus.

### Gouvernance

Sept contrôles tournent désormais en CI, chacun vérifié en le cassant :
`audit:conventions`, `audit:typo`, `audit:mouvement`, `audit:registry`,
`audit:marques`, plus `AuditContraste`, `AuditCibles`, `AuditFocus` et
`AuditIcones` joués comme histoires. Le contrat pour créer un composant tient
dans la page **Créer un composant** du Storybook.

---

## [1.x] — avant le 22/09/2026

Non versionné. 119 fusions, du premier token au tableau de bord à cinq vues.
L'historique complet est dans les pull requests, qui portent chacune la mesure
qui l'a motivée.
