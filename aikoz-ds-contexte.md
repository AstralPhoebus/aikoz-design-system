# Aikoz Design System — Contexte & doctrine

> À lire au démarrage de CHAQUE session (Claude Code comme le chat).
> Source unique de vérité du contexte projet. Toute décision structurante s'écrit ici, tout de suite.
> Dernière mise à jour : 2026-09-22

## 1. Objectif
Construire le design system Aikoz by Okuden : socle de composants React pour un SaaS B2B d'analyse d'avis clients (assurance, banque, auto), aussi distribué en marque blanche. Cap : fondations solides vers un dashboard d'analyse d'avis démontrable (v0.1). Démarrage dev produit : à poser à Arnaud/Louis.

## 2. Rôles
- Alice — product designer / archi DS. Conçoit, tranche le visuel, exécute dans Claude Code.
- Claude (chat) — assistant senior UX-UI + architecte DS. Conçoit, challenge, audite. N'a PAS accès au repo → Alice colle captures/sorties.
- Équipe : Arnaud (fondateur, valide brand) · Pietro (N+1, autorité technique) · Tommy (data) · Louis (produit) · Julien (commercial) · Cyril (tech, indispo août).
- Gouvernance PR : Alice merge ses PR elle-même. Seul réflexe : vérifier le rendu visuel avant de figer.

## 3. Façon de travailler (contrat d'équipe)
Boucle : Claude rédige un prompt auto-suffisant → Alice le colle dans Claude Code → valide chaque commande « 1. Yes » (jamais « don't ask again ») → colle la sortie → Claude audite. Playground = labo ; composant/tokens = produit fini.
Délégation : Claude tranche et avance sur la plomberie et l'archi quand Alice n'a pas de préférence forte ; Alice juge le rendu, pas chaque décision intermédiaire. Question uniquement si choix de marque/design ou aiguillage structurant.
Principes non négociables : jamais une couleur à l'œil (auditer chiffré) ; une variable = un rôle ; aucune valeur en dur hors primitives ; le bridge est généré, JAMAIS édité à la main ; lecture seule avant modif ; fichier temporaire + diff avant bascule, .bak avant remplacement ; commits atomiques. `generated/` jamais committé ; **`public/r/` l'est** — le registry publié embarque une copie du source et la CI vérifie qu'ils ne divergent pas.
Definition of Done (composant) : (1) zéro couleur en dur ; (2) tous variants + tailles ; (3) tous états repos/hover/active/focus-visible/disabled ; (4) focus a11y conforme ; (5) audit contraste chiffré light+dark ; (6) rendu validé playground light+dark ; (7) déclaré au registry + build OK ; (8) décisions documentées ici.
Rituel début de session : branche ? git status propre ? build:tokens passe ? playground démarre ? un seul serveur Vite ?
Rituel fin de session : maj de ce fichier + commit propre + écrire les 3 prochaines étapes.

## 4. Architecture des tokens (modèle Lyse, MIT)
Build via Style Dictionary (build-tokens.mjs, config inline) depuis le DTCG (tokens/), en cascade :
1. Primitives (tokens/primitives.json → build/primitives.css) : palette brute, rampes 50→1000 (12 paliers) pour midnight-blue, ultramarine, aquamarine, neutral, success, warning, error, info ; generali-red s'arrête à 900. Layout + typo complètes. Couleurs au **format DTCG objet** : `$value` = { colorSpace: "oklch", components: [L, C, H], alpha, hex }. Les `components` OKLCH font foi, `hex` = repli sRGB. `$description` décrit l'**usage** de la teinte. Sortie CSS en `oklch()` complet (transform `color/oklch`, composants source verbatim).
2. Brand (tokens/brand/aikoz.json → build/brand-aikoz.css) : rôles de marque, constants (ne varient pas par thème).
3. Theme sémantique (tokens/theme/{light,dark}.json → build/theme-{light,dark}.css) : rôles adaptatifs, préfixe --color-{namespace}-{role}, namespaces surface/text/border/status/nav, sélecteurs :root (light) / .dark (dark).
4. Bridge (tokens/bridge/shadcn.json → bridge/shadcn-bridge.css) : RUNTIME **généré** depuis le DTCG (transform `color/oklch`), consommé par playground/demo. Mappe chaque variable shadcn vers un token sémantique, en **oklch() complet**. Consommation : `var(--x)` brut côté Tailwind/composants — JAMAIS `oklch(var(--x))` / `hsl(var(--x))` ; transparence via `color-mix(in oklch, var(--x), transparent N%)`. Extensions DS (au-delà du set shadcn) : `--success`, `--destructive-text`, `--chart-1`, adossées aux rôles sémantiques `status.success-text` / `status.error-text` / `chart.1` (valeurs par mode light/dark). NE JAMAIS éditer à la main — régénérer.
Régénération : npm run build:tokens.
Long terme (non bloquant) : composants cibles Web Components (Lit/Stencil) pour agnosticisme framework + marque blanche.

## 5. État actuel — 22/09/2026, version 2.7.1

- Repo : Voice-of-Customers-by-Okuden/aikoz-design-system, **public**. Site publié par GitHub Pages depuis `main` (racine `public/` + Storybook) : https://voice-of-customers-by-okuden.github.io/aikoz-design-system/
- **53 composants, 54 entrées de registry, 250 tests.** Louis a l'accès `write` et consomme le registry publié par `shadcn add`.
- **Versionnage sémantique** depuis la 2.0.0 (22/09) : `CHANGELOG.md` à la racine, `public/version.json` publié à côté du registry, `npm run audit:version` refuse une PR qui touche à `registry/`, `tokens/` ou `bridge/` sans monter la version ET écrire l'entrée de journal — verrou npm compris.
- **Les chiffres de la vitrine sont comptés, pas écrits** : `docs/storybook/chiffres.ts` est généré par `registry:build`. L'introduction annonçait 37 composants quand il y en avait 51.
- `public/r/` **est** committé — le registry publié embarque une copie du source, et la CI échoue s'ils divergent. (Contredit le §3, corrigé.)
- Node **24** en local comme en CI (`engines: node >= 22`) : un verrou écrit par npm 11 n'est pas consommable par npm 10.
- **Les démos ADP se font en mode clair.** Constat rapporté par Alice le 22/09, pas une règle établie : on ne sait pas si c'est le cas des autres clients. Conséquence pratique sur les priorités — un défaut du mode sombre ne bloque pas une démo ADP, mais reste un défaut à corriger, le système devant tenir dans les quatre combinaisons.
- **Tommy (`AstralPhoebus`) pousse aussi des composants.** Il a créé le concept Aikoz ; ses correctifs viennent souvent d'un usage réel en projet client, donc ils valent d'être pris. Il n'est pas dans les règles internes du dépôt : lui donner les commandes, pas les principes. PR #127 (22/09) : arrondi des infobulles, z-index du donut, slot `badge` sur `ViewTabs`.
- Storybook : le serveur de dev **ne rescanne pas un fichier créé après son démarrage** — une classe Tailwind neuve n'a alors aucune règle. Redémarrer avant de conclure à une classe morte. Piège rencontré trois fois le 22/09.

### Les huit contrôles qui tournent en CI
| contrôle | ce qu'il refuse |
|---|---|
| `build:tokens` | un bridge qui ment, une échelle sombre qui diverge, une carte héroïne hors bande, **un rôle `--role-*` que personne ne lit** |
| `audit:conventions` | un composant qui s'écarte des **onze conventions** du système |
| `audit:typo` | une taille ou une graisse hors échelle |
| `audit:mouvement` | une animation de position sans `motion-reduce`/`motion-safe` |
| `audit:marques` | une couleur empruntée à la rampe d'une autre marque |
| `audit:registry` | une entrée absente ou qui ne livre pas ce que ses imports atteignent |
| `audit:version` | une PR qui change le livré sans version ni journal |
| stories | `AuditContraste` (WCAG + APCA, 8 combinaisons) · `AuditCibles` · `AuditFocus` · `AuditIcones` · axe en mode `error` |

**Chaque garde-fou a été vérifié en le cassant.** Trois d'entre eux ne mesuraient rien avant qu'on essaie.

## 6. Décisions verrouillées (avec le pourquoi)
- Format & câblage couleur : primitives en DTCG objet (components oklch, source de vérité) ; toute variable CSS porte la couleur **complète** (`oklch(L C H)`, ou `/ alpha`) ; consommateurs en `var(--x)` brut ; transparence via `color-mix(in oklch, …, transparent N%)` ou variable à alpha inclus. Pourquoi : couleur atomique/opaque au point de définition → pas de manipulation de composants dispersée, pas d'erreur de syntaxe, prêt gamut large. Jamais `oklch(var())` / `hsl(var())` / triplet nu.
- Grammaire couleur : « l'aquamarine (#70ffd4) est l'étincelle du foncé » — vit sur midnight, jamais à nu sur blanc (échoue WCAG 1.4.11).
- Primary adaptatif (modélisé) : surface.action = midnight light / aquamarine dark ; text.on-action = blanc / midnight. → --primary.
- Secondary adaptatif : surface.action-secondary = ultramarine hsl(226 60% 52%) light / pâle #BDCAEF hsl(224 61% 84%) dark (même teinte/saturation, luminosité change). Primitive ultramarine.225 créée. → --secondary.
- Accent = brand.accent = aquamarine, **aquamarine.300 dans les deux thèmes**. Mais `--accent` (shadcn) NE pointe PAS dessus : dans shadcn c'est une **surface discrète**, et la pointer sur l'aplat vif rendait la paire illisible (APCA 38 chez ADP). `--accent` = `surface.accent` (le voile), `--accent-foreground` = `text.accent`. L'aplat de marque reste disponible en `--color-brand-accent`. (22/09/2026)
- **L'accent est un SIGNE, pas une couleur de texte.** Posé sur la carte il plafonnait à 43-54 en APCA pour un plancher de 75, et aucun palier de rampe n'y arrivait sous Extime. Il porte du texte sur son propre voile, ou il ne porte rien. (22/09/2026)
- **`brand.focus` est un rôle à soi.** Il était emprunté — `brand.secondary` en clair, `brand.accent` en sombre — parce qu'aucune des deux sources ne tient dans les deux thèmes (accent : 12 chez Aikoz en clair, 0 chez Generali ; secondaire : 9-24 chez les quatre en sombre ; seuil 45). Le rôle porte EXACTEMENT les couleurs d'avant : corriger une architecture ne donne pas le droit de changer une identité. (22/09/2026)
- Outline : bordure neutre light / bordure + texte aquamarine dark. Voile de survol = aquamarine.
- Focus : :focus-visible, ring >= 2px, **ring-offset de 2px en `--background`** — l'anneau ne touche donc jamais le contrôle, il se mesure contre la page/la carte, jamais contre le bouton. `border.focus` = `brand.focus`. Socle AA = 2.4.7 + 1.4.11 ; apparence chiffrée = 2.4.13 (AAA).
- Règle de hover (à modéliser en tokens surface.*-hover, pas dans le composant) : surface claire → s'assombrit ; surface foncée → s'éclaircit. Sur fond sombre, jouer sur la luminosité, pas l'opacité.
- Forme/typo : pilule pour actions, radius léger pour champs. Label medium (500), casse normale. Tailles sm 36 / md 44 (défaut) / lg 48px.
- **Cibles : 24 px partout (WCAG 2.2 AA 2.5.8), 44 au doigt** via la variante `tactile:` (`@media (pointer: coarse)`). Élargir la zone en douce par un `::after` invisible est écarté : ça rend la cible vraie et l'affordance fausse. (22/09/2026)
- **Carte héroïne** : `surface.hero` — le rôle est la HIÉRARCHIE, pas l'inversion. En clair elle s'enfonce (0,05× la clarté des autres cartes), en sombre elle s'allume (2,4×) au lieu d'éblouir (15,3× auparavant). Bande vérifiée au build. Le registre marketing garde l'inversion. (22/09/2026)
- **Le sombre n'est pas le clair inversé** : pas de blanc pur en texte (halo), profondeur portée par la clarté des surfaces et non par des ombres, un voile doit avoir son palier sombre.

## 7. Pièges & dettes

### La leçon de la journée du 22/09 : **on mesure le rendu, jamais le déclaré**
Chaque défaut trouvé ressemblait à du code correct, parce que la mauvaise chose était mesurée.
- `strokeWidth` est en unités du **viewBox** : 1,75 rendait 1,17 px ici et 1,67 px là.
- `outline-none` de Tailwind pose `outline: 2px solid transparent` — un contour qui ne peint rien se faisait passer pour un indicateur de focus.
- `strokeWidth` vaut 1 par défaut sur un chemin en `stroke: none` — l'audit réclamait d'épaissir des logos sans trait.
- `:focus-visible` ne répond qu'au **vrai clavier** : `element.focus()` depuis un script ne déclenche rien.
- Un audit qui scanne des `.mdx` accuse la documentation qui **cite** la règle. Neutraliser commentaires et citations Markdown.
- **Toujours assortir un audit d'une assertion « ai-je mesuré quelque chose ? »** — sans elle, un audit qui ne mesure rien passe.

### Dettes fermées le 22/09
- ✅ Les **cinq dettes d'accent** — sans retoucher une couleur de charte. `PAIRES` ne contient plus aucune `dette`.
- ✅ **75 rôles `--role-*` sur 86** que zéro composant ne lisait : retirés, et le build refuse d'en réintroduire.
- ✅ L'échelle typographique ne gouvernait rien (pont `build/tailwind-typo.mjs`).
- ✅ Les tableaux Markdown ne s'affichaient pas dans les MDX (`remark-gfm` manquait).

### Dettes ouvertes
- **Réécriture d'historique** — `references/20250324_COVEA_Aikoz.pdf`, `20250604_ALLIANZ_Aikoz.pdf`, la présentation commerciale, les polices sous licence (PP Radio Grotesk, Satoshi) et `typo extime.zip` sont **lisibles publiquement dans l'historique git**. Le dépôt ne peut pas passer en privé : plan gratuit, GitHub Pages s'arrêterait et Louis n'installerait plus rien. `git filter-repo` + force-push + ticket au support GitHub pour purger les anciens SHA (ce ticket, Alice seule peut l'ouvrir). Aucun fork, Louis n'a aucun commit, sa branche est supprimée — **vérifier seulement qu'il n'a pas un clone local avec du travail en cours**. Prévu « ce soir » ; Louis est en congé, le risque de démo a disparu.
- **119 commits signés `Alice Maréchaud <ton@email.com>`** — adresse bidon d'une config git jamais remplie. À corriger pendant la réécriture, c'est le seul moment où c'est gratuit.
- **Écart assumé avec la charte ADP** : elle impose l'aplat 100 % (« applied in a 100 % solid block », page 18 barrant les primaires en teinte) et le système pose des voiles. Décision d'Alice du 22/09 : on assume, c'est écrit avec la citation dans « Ajouter une marque » pour être défendable. Les 24 couleurs secondaires ADP ne sont PAS entrées dans les tokens — rien ne les consommerait.
- `border` / `input` à ~1,3:1 — filets hairline, préexistant, décision de design en attente.
- `verify:bridge` / `doctor` : jamais construits. Le besoin est en partie couvert par `build:tokens` et `audit:registry`.
- Ramp `generali-red` sans 950/1000.
- README périmé (dit à tort que Claude Code lit DESIGN.md).

## 8. Backlog / à auditer
- **Polices sous licence non livrées** (doctrine assumée : un DS *déclare* la police, il ne la *livre* pas — `public/fonts/LISEZ-MOI.md`). Manquent : les fichiers **Extime** (brand center) et **Gotham** pour ADP (à acheter chez Hœfler & Co). Les replis sont ceux que les chartes désignent.
- **Généraliser `Pagination` dans `Table`** : le composant existe, le tableau ne l'emploie pas encore.
- Composants encore absents et jugés non nécessaires aujourd'hui : `slider`, `drawer`, `sheet`, `calendar`, `command`, `tag`, `spinner`.
- Button : hiérarchie light, hovers + max-width.
- Modéliser les tokens de hover (`surface.*-hover`) selon la règle du §6.
- `--radius` à câbler proprement.

## 9. Prochaines étapes (3 max, à réactualiser)
1. **Réécriture d'historique** (10 min) + texte du ticket au support GitHub, dès qu'Alice donne le feu vert.
2. Envoyer à Louis : `ChartFrame` a perdu `tableCollapsed` au profit de `tableau: "bascule" | "dessous"` (seul changement cassant) ; on est en 2.7.1 ; cinq composants neufs ; la page **Créer un composant** est le contrat.
3. Brancher `Pagination` dans `Table`.

## En attente externe
- **Alice** : feu vert pour la réécriture d'historique, et ouverture du ticket au support GitHub (elle seule peut).
- **Louis** (en congé) : confirmer qu'il n'a pas de clone local avec du travail en cours avant la réécriture.
- **Cyril** : licence Gotham pour ADP (Hœfler & Co) · fichiers de police Extime (brand center).
- Pietro : Tailwind v3 ou v4 (choix d'archi ; ne bloque plus l'oklch, confirmé fonctionnel sur v3 via valeurs arbitraires + color-mix).
- Arnaud (Brand Brain) : voix unique vs collective, ton agents/COMEX, contenu anglais, corpus d'exemples, ton Labels Aikoz.
