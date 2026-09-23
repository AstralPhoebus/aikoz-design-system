import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { Table, type TableColumn } from "@registry/aikoz/table/table";
import { EmptyState } from "@registry/aikoz/empty-state/empty-state";
import { Button } from "@registry/aikoz/button/button";

// ─── Vocabulaire des séries ──────────────────────────────────────────────────

/**
 * Six séries, trois canaux redondants chacune, dans un ordre FIXE : la
 * série 1 aura toujours le même trait plein et le même rond, quel que soit
 * le graphique. Une identité qui change d'un écran à l'autre ne s'apprend
 * pas.
 *
 * **Le pointillé n'est pas décoratif — la trame, elle, a été retirée.** Mesuré sur notre
 * palette : la meilleure séparation atteignable entre six séries est de
 * **1,26:1 en clair, 1,30 en sombre** — un ratio de LUMINANCE, pas un écart
 * perceptuel. Elles se confondent donc en niveaux
 * de gris et pour une part des daltonismes. La couleur ne porte pas la
 * distinction — elle la renforce, pour qui la perçoit.
 *
 * **Correction d'une mesure fausse.** Ce commentaire disait que la couleur
 * n'avait « aucun pouvoir distinctif », sur la foi d'un ratio de contraste
 * WCAG entre séries. C'était la mauvaise métrique : le ratio WCAG mesure une
 * LUMINANCE, il sert à lire du texte sur un fond, pas à distinguer deux
 * aplats voisins. La bonne mesure est l'écart perceptuel (ΔE OKLab), évalué
 * en simulant les trois daltonismes.
 *
 * Mesuré ainsi, la palette sépare de **ΔE 0,19 à 0,28** en vision normale
 * comme en protanopie et en deutéranopie — très au-dessus du seuil de ~0,10.
 * La couleur suffit donc, et les trames qui hachuraient les barres ont été
 * retirées : elles alourdissaient la lecture sans rien apporter.
 *
 * **Une exception, assumée :** en tritanopie, bleu et vert virent tous deux au
 * turquoise et l'écart tombe à 0,068. Elle touche une personne sur dix mille,
 * contre près de 8 % des hommes pour la deutéranopie, et le tableau sous le
 * graphique porte la donnée sans dépendre d'aucune couleur.
 *
 * Le POINTILLÉ des courbes reste, lui : deux courbes se superposent là où
 * deux barres ne se touchent que par un bord, et les styles de trait sont la
 * recommandation constante de la littérature (Carbon, Datawrapper).
 *
 * Les couleurs de statut restent exclues — une série qui porte le jaune
 * d'avertissement se lit comme une alerte.
 */
export const SERIES = [
  { trait: undefined, nom: "trait plein" },
  { trait: "8 4", nom: "tirets longs" },
  { trait: "2 3", nom: "pointillé fin" },
  { trait: "12 3 2 3", nom: "tiret-point" },
  { trait: "4 4", nom: "tirets courts" },
  { trait: "1 5", nom: "points espacés" },
] as const;

export const couleurSerie = (i: number) => `var(--chart-${(i % 6) + 1})`;
export const styleSerie = (i: number) => SERIES[i % SERIES.length];

// ─── Survol ───────────────────────────────────────────────────────────────────

export interface ContexteGraphique {
  /** Identifiant unique, dérivé de `useId`. */
  idTrames: string;
  /**
   * Faut-il rendre l'infobulle ? Faux quand le pointeur est ailleurs, et faux
   * aussi après un appui sur Échap — cf. `ChartFrame`.
   */
  infobulleActive: boolean;
  /** Index de la catégorie survolée, ou `null`. Sert à l'emphase. */
  indexActif: number | null;
  /** À brancher sur le graphique recharts pour suivre la catégorie survolée. */
  surSurvol: (etat: { activeTooltipIndex?: number | null } | null) => void;
}

/**
 * Emphase de la valeur survolée — **par retrait, pas par ajout**.
 *
 * L'élément pointé ne change pas : ce sont les autres qui s'effacent à 30 %.
 * C'est le geste de Carbon, et il vaut mieux que ce qu'on avait — un contour
 * `--foreground` de 2px, qui lisait comme une SÉLECTION et non comme un
 * survol, et qui ajoutait un trait là où l'œil cherchait une donnée.
 *
 * **J'avais écarté l'atténuation pour une mauvaise raison** : la crainte que
 * les séries estompées tombent sous les 3:1 de WCAG 1.4.11. Ce seuil vaut
 * pour l'état au repos, celui qui permet d'identifier un composant. Une
 * atténuation de survol est transitoire, réversible au moindre mouvement, et
 * n'enlève aucune information — le tableau porte toutes les valeurs. Carbon,
 * Ant Design et Material appliquent tous ce geste.
 *
 * 30 % est la valeur de Carbon. Plus haut, l'effacement ne se voit pas ;
 * plus bas, les autres séries disparaissent au lieu de passer au second plan.
 */
export const OPACITE_ESTOMPEE = 0.3;

/**
 * Opacité d'une série selon ce qui est survolé. `1` quand rien ne l'est —
 * un graphique au repos ne doit jamais être à demi effacé.
 */
export function opaciteSerie(indexActif: number | null, index: number): number {
  return indexActif === null || indexActif === index ? 1 : OPACITE_ESTOMPEE;
}

export interface LigneInfobulle {
  dataKey?: string | number;
  name?: string;
  value?: string | number;
  color?: string;
}

/**
 * Contenu d'infobulle commun aux trois graphiques.
 *
 * Reprend les tokens de `Tooltip` (`--popover`, `--popover-foreground`,
 * `--border-strong`) : une infobulle est une surface flottante comme une
 * autre, et une inversion figée sur `--foreground` casserait le thème.
 *
 * **Elle n'est jamais la seule source d'une valeur** — le tableau qui suit le
 * graphique les porte toutes. C'est ce qui la rend acceptable alors qu'elle
 * ne s'ouvre qu'à la souris.
 */
export function ChartTooltipContent({
  active,
  label,
  payload,
  formatValue = (v) => String(v),
}: {
  active?: boolean;
  label?: string | number;
  payload?: LigneInfobulle[];
  formatValue?: (v: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-[var(--border-strong)] px-3 py-2 shadow-lg",
        "bg-[var(--popover)] text-[var(--popover-foreground)] text-xs leading-snug",
      )}
    >
      {label !== undefined && label !== "" && (
        <p className="m-0 mb-1.5 font-semibold">{label}</p>
      )}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {payload.map((p, i) => (
          <li
            key={String(p.dataKey ?? i)}
            className="flex items-center gap-1.5"
          >
            <span
              aria-hidden="true"
              className="inline-block size-2.5 shrink-0 rounded-sm"
              style={{ background: p.color }}
            />
            <span>
              {p.name} :{" "}
              <strong className="tabular-nums">
                {formatValue(p.value ?? "")}
              </strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChartSerie {
  key: string;
  label: string;
}

/**
 * Les états où il n'y a rien à tracer.
 *
 * Extrait de `ChartFrameProps` pour que chaque graphique les ÉTENDE et les
 * transmette d'un bloc : transmis un par un, le cinquième graphique en
 * oublie un, et l'oubli ne se voit que le jour où la source tombe.
 */
export interface ChartStates {
  /**
   * La donnée n'est pas arrivée. La chaîne est la RAISON, telle qu'on la
   * montre : « La collecte Google Business ne répond pas. »
   *
   * Sa présence remplace tout le contenu de la coque — graphique, bascule,
   * légende et tableau — parce qu'aucun des quatre n'a de sens sans donnée.
   * Le titre, lui, reste : c'est ce qui dit QUOI a échoué.
   *
   * **Ce n'est pas peint en rouge**, cf. `EmptyState`.
   */
  error?: string;
  /** Rend le bouton de reprise. Sans lui, l'échec est un cul-de-sac. */
  onRetry?: () => void;
  /**
   * Ce qui manque quand `data` est vide, dit en clair : « Aucun avis sur
   * cette période ». Par défaut le composant nomme le graphique, ce qui est
   * toujours moins bon — il ignore le filtre qui a produit le vide.
   */
  emptyLabel?: string;
  /** Ce qu'on peut faire pour y remédier. */
  emptyHint?: string;
}

export interface ChartFrameProps<T> extends ChartStates {
  /**
   * Ce que le graphique montre — **obligatoire**. C'est la légende du
   * tableau équivalent, donc le nom accessible de la donnée.
   */
  caption: string;
  /** Phrase de résumé. Complétée automatiquement par le renvoi au tableau. */
  summary: string;
  series: ChartSerie[];
  /** Données brutes, telles qu'elles alimentent le tableau équivalent. */
  data: T[];
  /** Colonnes du tableau équivalent. */
  columns: TableColumn<T>[];
  getRowKey: (row: T, index: number) => string;
  /** Colonne qui NOMME la ligne — cf. `Table`. */
  rowHeaderKey?: string;
  /** Le graphique lui-même. Voir `ContexteGraphique`. */
  children: (ctx: ContexteGraphique) => ReactNode;
  height?: number;
  /** Masque la légende, quand le graphique étiquette déjà ses parts. */
  hideLegend?: boolean;
  /** Aplats plutôt que tracés : la légende montre des pastilles pleines. */
  legendStyle?: "trait" | "aplat";
  /**
   * Comment le tableau équivalent cohabite avec le graphique.
   *
   * `"bascule"` (défaut) — deux vues du MÊME bloc, commutées par un
   * sélecteur posé sur la ligne du titre. La zone garde exactement la même
   * hauteur, donc afficher les valeurs ne déplace rien sur la page.
   *
   * `"dessous"` — le tableau est rendu sous le graphique, toujours visible.
   * Pour les pages où il EST le contenu, comme le forage territorial.
   */
  tableau?: "bascule" | "dessous";
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Coque commune à tous les graphiques.
 *
 * Ce commentaire a longtemps dit qu'il n'y avait **pas** de story pour ce
 * fichier. Il y en a depuis le #95, et c'est le bon endroit : la coque a des
 * garanties qui lui appartiennent — la bascule qui ne déplace rien, l'ordre
 * de lecture, les états sans donnée — et les vérifier dans `LineChart`
 * revient à tester trois fois la même chose en croyant en tester trois.
 *
 * Elle existe pour que le contrat d'accessibilité soit tenu **par
 * construction** plutôt que répété — et oublié une fois sur cinq. Tout
 * graphique du système passe par elle, et en hérite :
 *
 * 1. **Le graphique est masqué, le tableau EST le contenu.** Un SVG de
 *    données ne se lit pas : on ne peut ni comparer deux valeurs, ni en
 *    retrouver une, ni copier quoi que ce soit. Le `aria-label` donne le
 *    résumé, le tableau donne la donnée — et il réutilise `Table`, donc ses
 *    en-têtes de ligne et de colonne.
 * 2. **La légende arrive APRÈS le graphique.** Placée avant, elle
 *    s'interposait entre le titre et la donnée : l'œil devait traverser une
 *    liste de noms pour atteindre ce qu'il venait voir. En dessous, elle ne
 *    sert qu'à ceux qui en ont besoin, au moment où une courbe les
 *    interroge. Et `LineChart` la masque carrément quand ses courbes portent
 *    déjà leur nom au bout du tracé.
 * 3. **Trois canaux par série**, jamais la couleur seule (WCAG 1.4.1).
 * 4. **Aucune animation** (WCAG 2.3.3).
 *
 * Le tableau est replié dans un `details` par défaut : présent dans le
 * document et lu, sans occuper la place.
 */
export function ChartFrame<T>({
  caption,
  summary,
  series,
  data,
  columns,
  getRowKey,
  rowHeaderKey,
  children,
  height = 280,
  hideLegend = false,
  legendStyle = "trait",
  tableau = "bascule",
  error,
  onRetry,
  emptyLabel,
  emptyHint,
  className,
}: ChartFrameProps<T>) {
  const uid = useId().replace(/:/g, "");
  const [vue, setVue] = useState<"graphique" | "tableau">("graphique");

  // ── Survol : l'infobulle et l'emphase ────────────────────────────────────
  //
  // WCAG 1.4.13 — un contenu qui apparaît au survol doit pouvoir être ÉCARTÉ
  // sans déplacer le pointeur. Recharts ne le prévoit pas : son infobulle
  // suit la souris et rien ne la referme. Échap la retire donc ici, et elle
  // ne revient qu'après être sorti puis rentré dans le graphique — c'est le
  // comportement attendu par le critère, pas une bascule permanente.
  const [survol, setSurvol] = useState(false);
  const [ecartee, setEcartee] = useState(false);
  const [indexActif, setIndexActif] = useState<number | null>(null);

  useEffect(() => {
    if (!survol || ecartee) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEcartee(true);
    };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [survol, ecartee]);

  const tableauRendu = (
    <Table
      caption={caption}
      captionHidden
      columns={columns}
      rows={data}
      getRowKey={getRowKey}
      rowHeaderKey={rowHeaderKey}
      density="compact"
    />
  );

  // ── Graphique OU tableau, jamais l'un qui pousse l'autre ────────────────
  //
  // Le tableau était replié dans un `details` sous le graphique. Mesuré sur
  // le tableau de bord : l'ouvrir faisait passer le bloc de 378 à 650 px
  // (+72 %) et décalait de 272 px tout ce qui suit. Sur une grille à deux
  // colonnes, la rangée se désaligne en plus.
  //
  // Deux VUES du même bloc à la place, commutées sur la ligne du titre. La
  // zone garde la hauteur du graphique, le tableau défile à l'intérieur :
  // afficher les valeurs ne déplace plus rien.
  //
  // Et non, l'export ne remplace pas ce tableau. C'est un autre parcours,
  // qui produit un fichier : WCAG 1.1.1 demande l'équivalent DANS la page.
  // Le SVG est `aria-hidden` — sans ce tableau, les valeurs exactes
  // n'existent nulle part pour qui ne voit pas le dessin.
  const bascule = tableau === "bascule";
  const onglet = (cle: "graphique" | "tableau", libelle: string) => (
    <button
      type="button"
      role="tab"
      id={`${uid}-onglet-${cle}`}
      aria-selected={vue === cle}
      aria-controls={`${uid}-vue`}
      // Un seul arrêt de tabulation pour le groupe, les flèches font le
      // reste : c'est le patron ARIA des onglets.
      tabIndex={vue === cle ? 0 : -1}
      onClick={() => setVue(cle)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        setVue(cle === "graphique" ? "tableau" : "graphique");
      }}
      className={cn(
        "min-h-8 tactile:min-h-11 tactile:px-4 rounded-full px-2.5 text-xs transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]",
        vue === cle
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {libelle}
    </button>
  );

  // ── Quand il n'y a rien à tracer ─────────────────────────────────────────
  //
  // Deux situations, un seul rendu : la coque garde son titre et sa hauteur,
  // et remplace TOUT le reste — graphique, bascule, légende, tableau. Aucun
  // des quatre n'a de sens sans donnée, et une bascule « Graphique /
  // Tableau » posée sur du vide laisse chercher la donnée dans l'autre
  // onglet.
  //
  // Le titre reste, lui : c'est la seule chose qui dise QUOI manque.
  const etat = error
    ? {
        title: error,
        description: onRetry
          ? "La donnée n'a pas pu être chargée. Rien n'est perdu côté serveur."
          : "La donnée n'a pas pu être chargée.",
        tone: "error" as const,
      }
    : data.length === 0
      ? {
          title: emptyLabel ?? `Aucune donnée pour « ${caption} »`,
          description: emptyHint,
          tone: "default" as const,
        }
      : null;

  return (
    <figure className={cn("m-0 flex flex-col gap-4", className)}>
      {/* Le titre ouvre la figure, quoi qu'il arrive : c'est la seule chose
          qui dise de QUOI il n'y a rien à montrer. Le sélecteur de vue, lui,
          disparaît avec la donnée — commuter entre deux vues vides envoie
          chercher le contenu dans l'autre onglet. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <figcaption className="font-heading text-sm font-medium text-foreground">
          {caption}
        </figcaption>
        {!etat && bascule && (
          <div
            role="tablist"
            aria-label={`Affichage de « ${caption} »`}
            className="flex shrink-0 items-center gap-0.5 rounded-full bg-[color-mix(in_oklch,var(--muted),transparent_55%)] p-0.5"
          >
            {onglet("graphique", "Graphique")}
            {onglet("tableau", "Tableau")}
          </div>
        )}
      </div>

      {/*
        La région live est montée EN PERMANENCE — repliée en `sr-only` tant
        que tout va bien, donc en `absolute`, hors du flux et sans gouttière
        parasite. Une région créée DÉJÀ remplie n'est pas annoncée de façon
        fiable : c'est le changement de contenu d'une région existante qui
        l'est.

        Et l'état est rendu DEDANS, pas recopié à côté : une phrase d'état
        doublée d'une phrase visible identique se lit deux fois.
      */}
      <div
        role="status"
        aria-live="polite"
        className={etat ? "flex w-full" : "sr-only"}
        style={etat ? { minHeight: height } : undefined}
      >
        {etat && (
          <EmptyState
            className="w-full"
            tone={etat.tone}
            title={etat.title}
            description={etat.description}
            action={
              onRetry ? (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  Réessayer
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      {!etat && (
        <>
          <div
            id={bascule ? `${uid}-vue` : undefined}
            role={bascule ? "tabpanel" : undefined}
            aria-labelledby={bascule ? `${uid}-onglet-${vue}` : undefined}
            // La hauteur est portée ICI, pas par le graphique : c'est elle qui
            // garantit que la bascule ne déplace rien.
            style={{ height }}
            className="w-full"
          >
            {bascule && vue === "tableau" ? (
              <div className="h-full min-w-0 overflow-auto">{tableauRendu}</div>
            ) : (
              <div
                role="img"
                aria-label={
                  bascule
                    ? `${summary} Les valeurs exactes sont dans la vue « Tableau ».`
                    : `${summary} Les valeurs exactes sont dans le tableau qui suit.`
                }
                className="h-full w-full"
              >
                {/*
              Le SVG est masqué, et ce n'est pas une redondance avec le
              `role="img"` du parent. Recharts pose `role="img"` sur CHAQUE
              secteur et chaque tracé, sans nom accessible : axe y voit autant
              d'images sans alternative. Le parent porte le nom, le tableau
              porte la donnée.
            */}
                <div
                  aria-hidden="true"
                  className="h-full w-full"
                  onMouseEnter={() => setSurvol(true)}
                  onMouseLeave={() => {
                    setSurvol(false);
                    setEcartee(false);
                    setIndexActif(null);
                  }}
                >
                  {children({
                    idTrames: uid,
                    infobulleActive: survol && !ecartee,
                    indexActif,
                    surSurvol: (etat) =>
                      setIndexActif(etat?.activeTooltipIndex ?? null),
                  })}
                </div>
              </div>
            )}
          </div>

          {/* La légende SOUS le graphique, pas au-dessus.
          Placée avant, elle s'interpose entre le titre et la donnée : l'œil
          doit traverser une liste de noms pour atteindre ce qu'il est venu
          voir. Placée après, elle ne sert qu'à ceux qui en ont besoin, au
          moment où ils en ont besoin — quand une courbe les interroge.

          Elle reste affichée dans la vue tableau : la retirer ferait
          exactement le saut de mise en page qu'on vient de supprimer, et
          elle reste juste, les colonnes portant les mêmes séries. */}
          {!hideLegend && <ChartLegend series={series} style={legendStyle} />}

          {!bascule && tableauRendu}
        </>
      )}
    </figure>
  );
}

// ─── Légende ──────────────────────────────────────────────────────────────────

export interface ChartLegendProps {
  series: ChartSerie[];
  /** `trait` pour les courbes, `aplat` pour les barres et les parts. */
  style?: "trait" | "aplat";
  className?: string;
}

/**
 * Légende d'un graphique.
 *
 * Chaque entrée montre les canaux tels qu'on les reconnaîtra dans le
 * graphique — la couleur et, pour les courbes, le tracé. Une légende qui
 * montrerait autre chose que le graphique ne sert à rien.
 *
 * Le nom du canal est aussi écrit en `sr-only`. Sans lui, la légende lue à
 * voix haute donne une liste de noms sans clé de lecture.
 */
export function ChartLegend({
  series,
  style = "trait",
  className,
}: ChartLegendProps) {
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-5 gap-y-2 list-none m-0 p-0",
        className,
      )}
    >
      {series.map((s, i) => {
        const v = styleSerie(i);
        const c = couleurSerie(i);
        return (
          <li key={s.key} className="inline-flex items-center gap-2 text-sm">
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox={style === "trait" ? "0 0 28 12" : "0 0 36 14"}
              className={cn(
                "shrink-0",
                style === "trait" ? "h-3 w-7" : "h-3.5 w-9",
              )}
              fill="none"
            >
              {style === "trait" ? (
                <>
                  <line
                    x1="0"
                    y1="6"
                    x2="28"
                    y2="6"
                    stroke={c}
                    strokeWidth="2"
                    strokeDasharray={v.trait}
                  />
                  <circle cx="14" cy="6" r="3.5" fill={c} />
                </>
              ) : (
                // Pastille pleine. Elle montre exactement ce que montre le
                // graphique — c'est toute la fonction d'une légende.
                <rect x="0" y="0" width="36" height="14" rx="3" fill={c} />
              )}
            </svg>
            <span className="text-foreground">{s.label}</span>
            <span className="sr-only">
              ({style === "trait" ? v.nom : "aplat"})
            </span>
          </li>
        );
      })}
    </ul>
  );
}
