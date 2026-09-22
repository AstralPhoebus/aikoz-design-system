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
