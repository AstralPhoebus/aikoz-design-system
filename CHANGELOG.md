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

## [2.19.0] — 2026-09-25

Contribution de Louis Brach (#129).

### Ajouté

- **`RankingBars`** — classement en barres horizontales, forable sur
  plusieurs niveaux.

  Il ne double pas `GeoDrilldown`, et la raison est structurelle : rien n'y
  est dessiné en SVG, donc **chaque ligne EST le bouton**, directement
  focalisable et activable. `GeoDrilldown`, dont le graphique recharts est
  `aria-hidden`, doit passer par un bouton « Explorer » dans un tableau à
  côté.

  Une ligne sans enfants n'est pas un bouton : la rendre cliquable sans
  action promettrait un détail qui n'existe pas. Même raisonnement que le fil
  d'Ariane, qui ne lie jamais la page courante.

### Corrigé

- **Deux assertions de ses histoires cherchaient un bouton sur une feuille**,
  et contredisaient donc la règle du composant. Elles dataient d'une version
  antérieure, et sa CI n'allait jamais assez loin pour le dire. Elles
  vérifient désormais la présence, pas la cliquabilité.

---

## [2.18.0] — 2026-09-25

Contribution de Louis Brach (#127).

### Ajouté

- **`ViewTab.badge`** — un compte à côté du libellé d'un onglet. Le
  `CountBadge` passé en `label={null}` est `aria-hidden` : le nom accessible
  de l'onglet reste son seul libellé. Mesuré « Classement » pour un onglet qui
  affiche « Classement 128 ».
- **`formatValeurParDefaut`**, exporté par `ChartFrame` : deux décimales au
  maximum, format français. `maximumFractionDigits` et non `toFixed`, pour
  qu'un entier reste « 30 » au lieu de devenir « 30,00 ».

### Corrigé

- **Les infobulles des trois graphiques rendaient la précision flottante
  brute** — « 30.000004333 » pour une moyenne. Le format s'applique à
  l'infobulle ET au tableau équivalent, qui restent donc d'accord sur la même
  valeur.
- **L'infobulle du donut passait sous le libellé central.** Sans `z-index`
  explicite, l'ordre du DOM l'emportait dès qu'ils se chevauchaient.

---

## [2.17.3] — 2026-09-25

### Corrigé

- **L'audit de rendu cassait la documentation PUBLIÉE.** Depuis la 2.9.0, il
  tourne sur chaque histoire, `afterEach` compris en mode docs. Or une page
  de documentation n'est pas un écran de produit : elle empile dix histoires,
  leurs blocs de code et leurs tableaux de props. Le contrôle de débordement
  y mesurait le gabarit de Storybook, pas le nôtre, et trouvait **143 px** qui
  ne nous appartenaient pas.

  Un `afterEach` qui lève en mode docs **remplace l'histoire par un bloc
  d'erreur**. Mesuré sur le site publié : **six encadrés rouges à la place
  des six exemples, sur cinq pages de composant sur six.** Zéro badge rendu
  sur la page `Badge`. C'est exactement ce que Louis et ADP consultent.

  L'audit ne tourne plus en mode docs, et son contrôle de débordement mesure
  désormais le **canevas de l'histoire**, plus le document. Le lanceur de
  tests rend les histoires en mode `story` : la couverture ne bouge pas, et
  le contrôle attrape toujours un vrai débordement, vérifié en retirant le
  `relative` de `Table`.

---

## [2.17.2] — 2026-09-24

### Corrigé

- **La marque est un global de barre d'outils, plus un décorateur maison.**
  Trois assemblages posaient `data-brand` sur la racine dans un `useEffect`
  avec nettoyage. Le nettoyage arrive APRÈS le montage de l'histoire
  suivante : celle-ci pouvait donc se rendre sous une marque qui n'était pas
  la sienne. Un axe posé par CHAQUE histoire est un axe que personne n'oublie
  de retirer — celle qui suit le repose, forcément. Au passage, la marque
  devient commutable depuis la barre d'outils, comme le thème et le registre.
- **Le test d'alignement de `KpiCard` mentait depuis au moins la veille.**
  Il mesure la chasse des chiffres en dessinant « 1111 » et « 8888 », sans
  attendre les polices : dans la suite complète, une police finissait de
  charger en cours de route et changeait les métriques sous la sonde. Il
  annonçait 3,53 px d'écart, soit « pas de jeu tabulaire », alors que le
  composant est correct. Isolé il passait, en CI il passait — deux
  environnements, deux verdicts, et aucun des deux ne parlait du composant.
  Un `await document.fonts.ready` suffit.

---

## [2.17.1] — 2026-09-24

### Corrigé

- **Le sous-titre par défaut de la première colonne de `ResponseKanban`
  décrivait le mauvais écran.** Il disait « À valider avant publication
  J+1 », c'est-à-dire un circuit d'APPROBATION — une réponse qui attend
  l'accord de quelqu'un. Ces réponses-là n'attendent personne : elles partent
  demain, et on peut les modifier jusque-là.

  C'est ce mot qui faisait confondre « État des réponses » avec « Circuit de
  validation », deux écrans qui répondent à deux modèles de gouvernance
  distincts — l'un automatique avec droit d'intervention, l'autre manuel avec
  obligation d'accord. Il dit désormais « Publiées demain, modifiables
  jusque-là », et la distinction est écrite dans l'assemblage.

---

## [2.17.0] — 2026-09-24

### Changé

- **Le fond d'un statut en thème CLAIR descend de deux paliers.** Il était sur
  la rampe `*.50`, le sombre sur `*.950` — et le `.950` est bien plus loin de
  son fond que le `.50` du sien. Mesuré sur le rendu, l'écart perceptuel
  entre la pastille et la carte :

  | ton | clair avant | sombre | rapport |
  | --- | --- | --- | --- |
  | success | 0,018 | 0,110 | **6,2×** |
  | warning | 0,032 | 0,151 | **4,7×** |
  | error | 0,015 | 0,099 | **6,7×** |
  | info | 0,009 | 0,097 | **10,5×** |

  Le clair paraissait fade à côté du sombre d'un facteur 5 à 10, et ce
  n'était pas une impression.

  Après : **0,130 · 0,127 · 0,129 · 0,050.** Toujours la même rampe, deux
  paliers plus bas.

  **La règle se dit par le résultat, pas par le palier** : le fond descend au
  palier le plus profond qui tienne 4,5:1 avec le texte du même statut.
  Chaque rampe a son profil de clarté, et le même numéro n'y donne pas le
  même écart — `info` plafonne à `.100`, son texte étant trop clair pour un
  bleu plus profond. Mesuré : `info.200` donne **4,18:1**, sous le plancher.
  C'est l'audit qui l'a dit, pas moi : mon estimation annonçait 4,77 parce
  que j'avais deviné la valeur du palier au lieu de la lire.

---

## [2.16.0] — 2026-09-24

### Ajouté

- **Le pont publie `--success-border`, `--warning-border`, `--error-border` et
  `--info-border`** — la rampe `*.300` de la charte : **#FAD94E** pour
  l'avertissement, **#EC9A84** pour l'erreur.

  Ces rôles existaient dans les quatre thèmes **depuis l'origine** et
  n'étaient republiés nulle part. Quatre couleurs de la charte qu'aucun
  composant ne pouvait demander.
- **Neuvième garde de build : un rôle de statut défini dans un thème doit
  être publié par le pont.** Le contrôle des rôles morts attrapait l'inverse
  — les rôles émis que personne ne lit — et ne voyait pas celui-ci, qui coûte
  plus cher : un rôle mort se voit, un rôle injoignable non. Vérifié en
  retirant `--warning-border` du pont.

  Il cherche si le pont **pointe** vers le rôle, pas s'il porte le même nom :
  le pont renomme volontiers — `status.warning-text` y devient `--warning`.
  Le premier jet accusait cinq rôles parfaitement publiés.

  Trois rôles sont nommés comme attendant un usage : les aplats pleins
  `status.success`, `status.warning` et `status.info`. Seule l'erreur en a un
  aujourd'hui, republiée en `--destructive`.

### Changé

- **`Badge` emploie TROIS rôles au lieu d'un.** Il dessinait tout avec la
  couleur de texte — contour compris, et un fond fait d'un voile à 8 % de
  cette même couleur. Un texte est foncé parce qu'il doit tenir 4,5:1 ; un
  contour n'a aucune raison de l'être. L'avertissement sortait donc en kaki
  (#6E5100) alors que la charte porte un jaune franc.

  Le contour vient de `-border`, le fond de `-subtle`, et seul le texte garde
  la couleur de texte. `neutral` reste sur `--muted-foreground` : il n'a pas
  de rampe de statut, et un gris n'a pas de contour à distinguer de son
  texte.

---

## [2.15.1] — 2026-09-24

### Corrigé

- **Les en-têtes riches d'un `Table` s'alignaient en bas, donc en escalier.**
  Collé au bas de sa cellule, un libellé qui passe sur deux lignes pousse son
  pictogramme vers le haut : mesuré **18 px d'écart** entre « Gestionnaire
  POI » et « Directeur », et une rangée d'icônes en marches. Une colonne avec
  `headerCell` s'aligne désormais en HAUT — les pictogrammes forment une
  ligne et les libellés démarrent tous au même endroit. Écart mesuré après :
  **0 px**, sur les icônes comme sur les textes.

---

## [2.15.0] — 2026-09-24

### Ajouté

- **`Table.layout="fixed"`** — les colonnes sans `width` déclarée se
  partagent le reste à parts égales.

  La règle qui tranche : **des colonnes qui portent le même contenu doivent
  avoir la même largeur.** Sur la matrice d'habilitation, la largeur suivait
  la longueur de l'intitulé — mesuré **165 · 107 · 152 · 84 · 85 · 84 px**
  pour six colonnes contenant le même interrupteur, presque du simple au
  double. Une différence de largeur se lit comme une différence de sens.
  Après : **113 px partout, écart 0.** Une histoire le mesure, vérifiée en
  retirant le prop.

  `auto` reste le défaut : sur un tableau de texte, un nom long doit avoir la
  place et un code court ne doit pas la gaspiller.

---

## [2.14.0] — 2026-09-24

### Ajouté

- **`Table.density="large"`** — 56 px de haut. Ce n'est pas un réglage
  d'esthétique : une cellule qui porte un CONTRÔLE a besoin de la place d'une
  cible de 44 px et de son anneau de focus, ce que 38 px ne donnent pas.
- **`Table.rowHeaderSurface`** — pose la colonne d'en-têtes de ligne sur un
  fond sourd. Sur six colonnes de marqueurs identiques, l'œil perd sa ligne
  en parcourant vers la droite.
- **`Table.columnRules`** — filets verticaux. Inutiles sur un tableau qu'on
  lit ligne par ligne, nécessaires dès qu'on lit aussi en COLONNE. La règle :
  filets verticaux si et seulement si les deux axes portent du sens.
- **`TableColumn.headerCell`** — rendu visuel de l'en-tête, une icône
  au-dessus du nom par exemple. Il COMPLÈTE `header`, il ne le remplace pas :
  `scope="col"` continue de porter le texte.

### Corrigé

- **`BrandMark` : `className` REMPLAÇAIT la boîte au lieu de s'y ajouter.** Un
  `shrink-0` posé pour une raison de mise en page effaçait
  `h-8 max-w-[160px]`, et le logo d'ADP se rendait à **950 × 326 px** au
  milieu d'un en-tête. Un même nom pour deux comportements — ajouter partout
  ailleurs, remplacer ici — est le défaut le plus cher d'une bibliothèque :
  il ne se voit qu'à l'usage, et il se voit tard. Redimensionner reste
  possible, `tailwind-merge` tranche en faveur de la classe passée.
- **Le trait sous l'en-tête d'un `Table` passe en `--border-strong`.** Il
  sépare les noms de colonnes de rangées de cellules qui se ressemblent :
  `--border` ne tient pas 3:1 contre la carte, `--border-strong` oui.

### Changé

- **La matrice d'habilitation est retravaillée.** Filet d'accent de marque en
  haut de la carte — le vocabulaire de `SiteNav`, seule place de la troisième
  couleur de marque —, logo et titre de bloc, un pictogramme par ligne et par
  colonne, colonne d'ancrage, lignes à 56 px, filets verticaux, légende
  dessinée. Les marqueurs de la légende ne sont PAS des `Switch` : un
  contrôle focalisable qui ne commande rien est le piège qu'on évite.

---

## [2.13.0] — 2026-09-24

### Ajouté

- **Assemblage « Démo ADP — État des réponses »** : le contenu **exact** de la
  maquette ADP du 24/09/2026, rendu par le design system. Mêmes avis, mêmes
  dates, mêmes motifs de non-conformité, mêmes intitulés de colonne, mêmes
  comptes (7 · 2 · 2). Seule la mise en forme change. En clair ET en sombre.
- **`ResponseKanban.labels`** — remplace le titre et le sous-titre d'une
  colonne. Les intitulés sont du CONTENU : « Avis 4-5 étoiles sans
  commentaire · publication J+1 » dit la règle de ce client-là, et le suivant
  en aura une autre. Ce qui appartient au composant, c'est l'ordre des
  colonnes, leur ton, et le fait que chacune soit une section nommée.
- **La matrice d'habilitation porte les données réelles d'ADP**, relevées case
  par case, doublon de colonne compris — et une seconde histoire montre la
  même matrice une fois les colonnes nommées.

### Mesuré

- **Deux colonnes de la maquette ADP portent le même intitulé (« RÔLE 6 »).**
  Le nom d'une case se déduit de sa ligne et de sa colonne : l'histoire
  compte **20 noms distincts pour 24 cases**, soit **quatre paires de droits
  indiscernables**. Le test ne tombe pas, il chiffre — pour que ce soit un
  chiffre dans la conversation avec ADP plutôt qu'une surprise en recette.

---

## [2.12.0] — 2026-09-24

### Ajouté

- **`KanbanBoard`** — le tableau à colonnes, extrait de `ResponseKanban`. Il
  tient le contrat de STRUCTURE quel que soit ce qu'on y met : chaque colonne
  est une `section` nommée par son titre, le compte est un `CountBadge`
  étiqueté, et `tone` pilote le liseré ET le compteur — deux props, c'était
  deux occasions de les laisser dire des choses différentes. Les cartes sont
  fournies par l'appelant : une file de réponses et un circuit de validation
  n'affichent pas les mêmes choses.
- **Assemblage « Circuit de validation »** (Storybook). Bâti sur
  `KanbanBoard`, comme `ResponseKanban` — le même tableau, d'autres colonnes.
  Il porte la distinction que la demande manquait : **l'état de la réponse
  vit sur la CARTE, le toast ne confirme que le geste.** « En attente de
  validation » n'est pas un message passager ; un toast disparaît en six
  secondes, et quelqu'un qui revient dix minutes plus tard doit toujours
  savoir où en est son travail.
- **Assemblage « Matrice d'habilitation »** (Storybook), en marque ADP.
  Modifiable ou consultable. Chaque case porte un nom déduit de sa ligne et
  de sa colonne — « Réponse aux avis pour Directeur » — sans quoi vingt-quatre
  interrupteurs annoncent vingt-quatre fois « interrupteur, activé ».

### Changé

- **`ResponseKanban` est bâti sur `KanbanBoard`.** Son API ne bouge pas, son
  rendu non plus ; ses trois colonnes restent ses trois colonnes.

---

## [2.11.1] — 2026-09-24

### Corrigé

- **`Table` : un tableau large poussait la PAGE au lieu de défiler chez lui.**
  Son conteneur de débordement était en `position: static`, donc bloc
  conteneur de personne. Tout descendant `sr-only` — le `<caption>` masqué,
  l'étiquette d'un `Switch` posé dans une cellule — est en
  `position: absolute` et prenait alors **la page** pour référence : il
  sortait du conteneur et étirait le document. Mesuré sur une matrice de six
  colonnes à interrupteurs : **238 px de débordement à 375 px de large**. Un
  `relative` le corrige, et une histoire le mesure en forçant le tableau à
  2 400 px — vérifiée en retirant le mot.

---

## [2.11.0] — 2026-09-23

### Ajouté

- **Le vocabulaire des props est écrit** — nouvelle section de « Créer un
  composant ». Un design system a deux cents props ; ce qui le rend
  apprenable n'est pas leur nombre, c'est qu'un même mot veuille toujours dire
  la même chose. `label` nomme un contrôle ou une mesure, `title` titre un
  bloc qu'on lit, `caption` nomme un jeu de données, `description` est la
  ligne de contexte sous l'un des trois. Les rappels disent CE QUI a changé,
  jamais le geste qui l'a changé.
- **`ChoiceCard.onCheckedChange`**, du même nom que sur `Switch`.
- **`KpiCard.description`**, la ligne de contexte.
- **Douzième convention tenue par la CI** : `caption` est obligatoire, ou
  n'existe pas. C'est le nom accessible d'un jeu de données — une figure sans
  nom n'a pas d'alternative, il ne peut pas être facultatif.

### Déprécié

- **`ChoiceCard.onChange`** → `onCheckedChange`. Il portait le nom exact que
  `Checkbox` hérite de React, avec une signature incompatible : ici un
  booléen, là un `ChangeEvent`. Qui apprenait l'un et écrivait l'autre
  recevait un événement là où il attendait `true`, sans que TypeScript le voie
  si le rappel ignorait son argument. **Le pire cas n'est pas deux noms pour
  une chose : c'est un nom pour deux choses.**
- **`KpiCard.caption`** → `description`. C'était le seul endroit du système où
  ce mot désignait autre chose que le nom accessible d'un jeu de données.

Les deux anciens noms continuent de fonctionner, et **une histoire exerce
chacun** : un alias que rien n'exerce cesse de marcher sans que personne ne le
voie. Ils partiront à la prochaine version majeure.

---

## [2.10.1] — 2026-09-23

### Corrigé

- **Les 54 descriptions du registry étaient écrites sans accents.** « Etat
  vide », « donnee », « apres », « regle » : c'est le SEUL texte que voit qui
  fait `shadcn add` — la page du registry, la sortie de la commande, l'entrée
  dans son propre `registry.json` — et il se lisait comme une note interne,
  pas comme un livrable. Les 54 sont réécrites. Une seule faute de frappe
  corrigée au passage, nommée explicitement : `delibrement` → délibérément.
- **`audit:registry` refuse désormais une description en français dépouillé.**
  Pas d'heuristique : une liste courte des mots qui, dans notre vocabulaire,
  ne s'écrivent jamais sans accent. « masque » et « annonce » en sont
  volontairement absents — ils existent sans accent, et un audit qui crie
  faux finit par se contourner. Le contenu des accents graves est ignoré :
  `data-brand` et `role=tablist` n'ont pas à porter d'accent.

---

## [2.10.0] — 2026-09-23

### Ajouté

- **`ChartFrame` : les états sans donnée.** La coque n'avait ni vide, ni
  échec, ni rien. Un graphique dont la source tombait rendait un cadre vide,
  une bascule « Graphique / Tableau » commutant entre deux vides, et une
  légende de séries absentes. Trois nouvelles props — `error`, `onRetry`,
  `emptyLabel`/`emptyHint` — remplacent TOUT le contenu de la coque par un
  état qui nomme ce qui manque. Le titre, lui, reste : c'est la seule chose
  qui dise de quoi il n'y a rien à montrer.
- **Les trois graphiques les transmettent d'un bloc**, via la nouvelle
  interface `ChartStates` qu'ils étendent. Énumérées une par une, le
  quatrième graphique en aurait oublié une, et l'oubli ne se serait vu que le
  jour où la source tombe.
- **`ChartFrame` porte une région live.** Montée en permanence et repliée en
  `sr-only` tant que tout va bien : une région créée déjà remplie n'est pas
  annoncée de façon fiable, c'est le changement de contenu d'une région
  existante qui l'est. L'état est rendu DEDANS, pas recopié à côté — une
  phrase d'état doublée d'une phrase visible identique se lit deux fois.

### Changé

- **`EmptyState tone="error"` n'est plus rouge.** Dans ce système le rouge dit
  une seule chose : l'utilisateur est refusé, ou quelque chose va être
  détruit. Un chargement qui échoue ne fait ni l'un ni l'autre — personne n'a
  rien fait de mal, et il n'y a rien à décider : il y a un bouton à cliquer.
  Le trait passe au plein sur fond sourd ; ce qui distingue l'échec du vide
  est désormais la présence d'une **action de reprise**, pas une teinte.
  Mesuré : le trait est à 4,07:1 du fond en clair, 4,92:1 en sombre — WCAG
  1.4.11 demande 3:1. Renoncer au rouge ne dispense pas d'être visible.
  *Aucun appelant n'utilisait ce ton : le changement est visuel, pas cassant.*

### Corrigé

- **Quatre entrées du registry ne livraient pas ce dont elles ont besoin.**
  `chart-frame`, `bar-chart`, `line-chart` et `donut-chart` importent
  maintenant `EmptyState` et `Button` ; `shadcn add bar-chart` aurait réussi
  et la compilation aurait cassé chez le consommateur. Attrapé par
  `audit:registry`, pas par une relecture.
- **La description de `chart-frame` disait « légende AVANT le graphique ».**
  Elle est après depuis le #95, et c'est ce texte que lit qui fait
  `shadcn add`.
- **Le commentaire de `chart-frame` disait qu'il n'avait pas de story.** Il en
  a depuis le #95.

---

## [2.9.0] — 2026-09-23

### Corrigé

- **`Toast` : le bouton de fermeture faisait 20 px de large**, sous le
  plancher de 24 px du critère WCAG 2.2 AA 2.5.8. La hauteur passait, la
  largeur non.
- **`KpiCard` : la courbe d'ambiance n'était pas masquée.** recharts exposait
  un `<svg>` anonyme, et un lecteur d'écran annonçait « graphique » après la
  valeur sans rien pouvoir en dire. Elle est une ambiance ; le chiffre juste
  au-dessus porte l'information.
- La page Tokens du playground poussait la page de 155 px à 640 px de large :
  une valeur longue (la pile de polices de Gotham, 346 px) était en
  `shrink-0`.

### Gouvernance

- **Les mesures de rendu s'appliquent désormais à CHAQUE histoire**, dans les
  deux thèmes, via `afterEach` du preview : cible d'au moins 24 px, `<svg>`
  masqué ou nommé, aucun débordement horizontal.

  Elles ne tournaient que sur le tableau de bord — **33 composants sur 53**.
  Les vingt autres, dont `Combobox`, `Checkbox`, `AlertDialog` et
  `Pagination`, n'étaient vus par aucune. Élargir la page d'audit aurait
  demandé d'y ajouter chaque composant à la main ; les histoires, elles,
  existent déjà pour tous.

  Trois défauts trouvés au premier passage, tous dans des composants absents
  du tableau de bord. Et deux faux positifs écartés en chemin : un lien
  d'évitement fait 1 × 1 px par construction, et un `<svg>` dans un
  sous-arbre déjà `aria-hidden` l'est aussi.

---

## [2.8.0] — 2026-09-23

### Corrigé

- **Le canevas des stories n'était pas peint dans le lanceur de tests.** La
  règle visait `body.sb-show-main` — une classe que pose le CANEVAS de
  Storybook, et que le lanceur n'a pas : chaque story y est rendue sans ce
  chrome. Tant que la suite tournait en clair, le blanc du navigateur
  ressemblait par coïncidence à `--background` et personne ne voyait rien.

### Gouvernance

- **Toute la suite tourne désormais dans les DEUX thèmes.** Elle ne tournait
  qu'en clair : 2 histoires sur 250 déclaraient le sombre, `axe` compris.
  `AuditContraste` balayait bien les huit combinaisons, mais il ne regarde
  que des paires de couleurs, jamais le rendu d'un composant.

  `STORYBOOK_THEME=sombre` rejoue la même suite dans l'autre thème —
  `npm run test:sombre`, et une étape de plus en CI. Une variable plutôt
  qu'un second jeu d'histoires : deux jeux divergent, et c'est toujours celui
  qu'on ne regarde pas qui pourrit.

  Au premier passage, **135 tests sur 250 sont tombés**. Un seul défaut
  derrière : axe mesurait du texte clair sur un fond `#fcfcfc`. Le système
  tenait, c'est la mesure qui n'avait jamais eu lieu.

---

## [2.7.1] — 2026-09-22

### Corrigé

- **L'anneau de focus reprend les couleurs qu'il avait.** En sortant
  `brand.focus` de ses emprunts, la 2.7.0 l'avait placé sur la rampe
  **primaire** de chaque marque — et Aikoz y perdait son **aquamarine** en
  sombre au profit de l'ultramarine. La couleur de signature remplacée par la
  couleur primaire, sans que personne l'ait demandé.

  Et pour un anneau objectivement moins bon : aquamarine.300 vaut APCA 91 et
  WCAG 13,9 sur la carte sombre, contre 47 et 6,2 pour l'ultramarine.

  Le rôle `brand.focus` reste — c'est lui qui règle les deux sources — mais
  avec **exactement** les couleurs d'avant. Corriger une architecture ne donne
  pas le droit de changer une identité.

---

## [2.7.0] — 2026-09-22

### Ajouté

- **`brand.focus`** — l'anneau de focus devient un rôle à SOI.

  Il valait `brand.secondary` en clair et `brand.accent` en sombre : deux
  sources pour un même rôle. Ce n'était pas une négligence mais un
  contournement, et la mesure dit pourquoi — **aucune des deux ne tient dans
  les deux thèmes** :

  | | accent clair | accent sombre | secondaire clair | secondaire sombre |
  | --- | --- | --- | --- | --- |
  | Aikoz | **12** | 91 | 78 | **22** |
  | ADP | 64 | 54 | 76 | **24** |
  | Extime | 52 | 49 | 78 | **22** |
  | Generali | **0** | 62 | 92 | **9** |

  Seuil : 45. Le palier est désormais choisi sur la rampe **primaire** de
  chaque marque — l'anneau reste de la marque — et vérifié contre la carte ET
  la page, en APCA **et** en WCAG 2. Generali prend le 500 et non le 400 :
  APCA passait à 57, WCAG plafonnait à 2,83 pour un seuil de 3. Les deux
  mesures ne disent pas la même chose, et on tient les deux.

  Conséquence chez Generali en clair : l'anneau de focus n'est plus
  exactement la couleur du bouton secondaire, qu'il ne se distinguait de
  celui-ci que par son liseré de deux pixels.

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
