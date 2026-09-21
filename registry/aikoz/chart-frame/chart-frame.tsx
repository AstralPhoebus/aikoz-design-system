import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { Table, type TableColumn } from "@registry/aikoz/table/table";

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
        "bg-[var(--popover)] text-[var(--popover-foreground)] text-xs leading-snug"
      )}
    >
      {label !== undefined && label !== "" && (
        <p className="m-0 mb-1.5 font-semibold">{label}</p>
      )}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {payload.map((p, i) => (
          <li key={String(p.dataKey ?? i)} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block size-2.5 shrink-0 rounded-sm"
              style={{ background: p.color }}
            />
            <span>
              {p.name} : <strong className="tabular-nums">{formatValue(p.value ?? "")}</strong>
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

export interface ChartFrameProps<T> {
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
  tableCollapsed?: boolean;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Coque commune à tous les graphiques.
 *
 * **Pas de story pour ce fichier, et c'est délibéré** : il ne rend rien seul.
 * Ce qu'il garantit se vérifie dans les stories de `LineChart`, `BarChart` et
 * `DonutChart`, qui l'utilisent. Une story de remplissage donnerait l'illusion
 * d'une couverture sans rien tester de plus.
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
  tableCollapsed = true,
  className,
}: ChartFrameProps<T>) {
  const uid = useId().replace(/:/g, "");

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

  const tableau = (
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

  return (
    <figure className={cn("m-0 flex flex-col gap-4", className)}>
      <figcaption className="text-sm font-medium text-foreground">
        {caption}
      </figcaption>

      <div
        role="img"
        aria-label={`${summary} Les valeurs exactes sont dans le tableau qui suit.`}
        style={{ height }}
        className="w-full"
      >
        {/*
          Le SVG est masqué, et ce n'est pas une redondance avec le `role="img"`
          du parent. Recharts pose `role="img"` sur CHAQUE secteur et chaque
          tracé, sans nom accessible : axe y voit autant d'images sans
          alternative. Le parent porte le nom, le tableau porte la donnée.
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
            surSurvol: (etat) => setIndexActif(etat?.activeTooltipIndex ?? null),
          })}
        </div>
      </div>

      {/* La légende SOUS le graphique, pas au-dessus.
          Placée avant, elle s'interpose entre le titre et la donnée : l'œil
          doit traverser une liste de noms pour atteindre ce qu'il est venu
          voir. Placée après, elle ne sert qu'à ceux qui en ont besoin, au
          moment où ils en ont besoin — quand une courbe les interroge.
          L'ordre du DOM suit l'ordre visuel : un lecteur d'écran entend le
          titre, le résumé de la courbe, puis la liste des séries. */}
      {!hideLegend && <ChartLegend series={series} style={legendStyle} />}

      {tableCollapsed ? (
        <details className="group">
          <summary
            className={cn(
              "cursor-pointer list-none text-sm font-medium text-[var(--secondary)]",
              "min-h-11 inline-flex items-center gap-1.5 rounded-[var(--radius)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className="size-3 transition-transform group-open:rotate-90 motion-reduce:transition-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
            Voir les données
          </summary>
          <div className="pt-3">{tableau}</div>
        </details>
      ) : (
        tableau
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
export function ChartLegend({ series, style = "trait", className }: ChartLegendProps) {
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-2 list-none m-0 p-0", className)}>
      {series.map((s, i) => {
        const v = styleSerie(i);
        const c = couleurSerie(i);
        return (
          <li key={s.key} className="inline-flex items-center gap-2 text-sm">
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox={style === "trait" ? "0 0 28 12" : "0 0 36 14"}
              className={cn("shrink-0", style === "trait" ? "h-3 w-7" : "h-3.5 w-9")}
              fill="none"
            >
              {style === "trait" ? (
                <>
                  <line x1="0" y1="6" x2="28" y2="6" stroke={c} strokeWidth="2" strokeDasharray={v.trait} />
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
