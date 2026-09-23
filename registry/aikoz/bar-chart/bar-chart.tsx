import {
  Bar,
  CartesianGrid,
  Label,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartFrame,
  ChartTooltipContent,
  opaciteSerie,
  couleurSerie,
  type ChartSerie, type ChartStates } from "@registry/aikoz/chart-frame/chart-frame";
import { useId } from "react";
import { type TableColumn } from "@registry/aikoz/table/table";

/**
 * Le sommet d'une barre, arrondi ; sa base, franche.
 *
 * Arrondir les quatre coins ferait flotter la barre au-dessus de l'axe alors
 * qu'elle en part : la base est une mesure, pas une décoration. C'est le tracé
 * commun aux tableaux de bord récents, et il ne change rien à la LONGUEUR —
 * le rayon se prend à l'intérieur, la hauteur reste proportionnelle.
 *
 * Le rayon se borne à la moitié de la largeur ET à la hauteur : sur une barre
 * plus courte que son rayon, un arrondi non borné produit un tracé qui se
 * replie sur lui-même.
 */
function cheminBarre(x: number, y: number, w: number, h: number, r: number) {
  const rayon = Math.max(0, Math.min(r, w / 2, h));
  if (rayon === 0) return `M${x},${y}h${w}v${h}h${-w}Z`;
  return (
    `M${x},${y + h}` +
    `V${y + rayon}` +
    `a${rayon},${rayon} 0 0 1 ${rayon},${-rayon}` +
    `h${w - 2 * rayon}` +
    `a${rayon},${rayon} 0 0 1 ${rayon},${rayon}` +
    `V${y + h}` +
    `Z`
  );
}

// ─── Ticks d'axe ──────────────────────────────────────────────────────────────

/**
 * Chiffres à chasse fixe sur les graduations.
 *
 * Mesuré : en Gotham, les dix chiffres proportionnels s'étalent sur 35,7 px de
 * large — un axe vertical dont les valeurs ne s'alignent pas verticalement.
 * Gotham EMBARQUE les chiffres tabulaires (écart mesuré 0 une fois la variante
 * demandée) ; il manquait seulement de les demander. Même constat en Montserrat
 * (30,2) et en Inter (23,9).
 *
 * Hoisté plutôt que recopié : la variante avait été oubliée sur une des cinq
 * déclarations de ticks du module parce qu'elles étaient écrites à la main.
 *
 * `style` et non une propriété de premier niveau : recharts type l'objet `tick`
 * en `SVGProps<SVGTextElement>`, qui ne connaît pas `fontVariantNumeric` —
 * la propriété CSS passe par `style`, qui est bien dans le typage.
 */
const CHIFFRES_ALIGNES = { fontVariantNumeric: "tabular-nums" } as const;

const TICK = {
  fill: "var(--muted-foreground)",
  fontSize: 12,
  style: CHIFFRES_ALIGNES,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BarChartProps extends ChartStates {
  caption: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: ChartSerie[];
  /**
   * `stacked` empile les séries — pour une composition dont le TOTAL compte.
   * `grouped` les juxtapose — pour comparer les séries entre elles.
   * `stacked-percent` empile, mais chaque barre est ramenée à 100 % de son
   * propre total — pour comparer une RÉPARTITION d'une catégorie à l'autre
   * (ex. polarité positif/négatif par segment), où le total de chaque barre
   * n'a justement pas à être comparable. Chaque part porte son pourcentage
   * écrit, et les catégories passent en en-têtes au-dessus des barres — cf.
   * la note du composant.
   *
   * Ce n'est pas un réglage d'apparence : empilé, on lit bien le total mais
   * mal chaque part, sauf la première qui seule part de zéro. Groupé, on
   * compare les parts mais on perd le total. Le choix dépend de la question
   * posée, pas de la place disponible.
   */
  layout?: "stacked" | "grouped" | "stacked-percent";
  /** Barres horizontales — indispensable quand les libellés sont longs. */
  orientation?: "vertical" | "horizontal";
  /**
   * Nom de l'axe des catégories, **unité comprise**. Rendu sur le graphique
   * ET repris en en-tête du tableau.
   */
  xLabel?: string;
  /**
   * Nom de l'axe des valeurs, **unité comprise** — « Avis reçus »,
   * « Part (%) ». Carbon est explicite : un axe quantitatif sans unité laisse
   * le lecteur deviner ce qu'il compte.
   */
  yLabel?: string;
  formatValue?: (v: string | number) => string;
  height?: number;
  /**
   * Colonnes ajoutées au tableau équivalent, après les séries. Sert à y poser
   * une COMMANDE — le graphique étant `aria-hidden`, le tableau est le seul
   * endroit où une action reste atteignable au clavier.
   */
  extraColumns?: TableColumn<Record<string, string | number>>[];
  /**
   * Clic sur une barre. **Raccourci à la souris uniquement** : le graphique
   * est masqué aux technologies d'assistance, donc toute action offerte ici
   * doit aussi exister dans le tableau, via `extraColumns`.
   */
  onBarClick?: (ligne: Record<string, string | number>) => void;
  /** Déplie le tableau équivalent au lieu de le replier dans un `details`. */
  /**
   * Comment le tableau équivalent cohabite avec le graphique — voir
   * `ChartFrame`. `"bascule"` par défaut : deux vues du même bloc, à hauteur
   * constante.
   */
  tableau?: "bascule" | "dessous";
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Barres empilées ou groupées.
 *
 * **Le second canal d'une barre n'est pas un pointillé mais une TRAME** :
 * un aplat n'a pas de tracé où poser des tirets. Hachures, points,
 * quadrillage — même rôle, même ordre fixe que les tracés des courbes, de
 * sorte qu'une série garde son identité d'un type de graphique à l'autre.
 *
 * **Un séparateur clair entre les segments empilés.** Deux séries adjacentes
 * dont les teintes se ressemblent — et la palette garantit qu'il y en aura —
 * fusionneraient en un seul bloc. Le trait de 2 px à la couleur de la carte
 * les sépare sans ajouter de couleur.
 *
 * Le reste du contrat — graphique masqué, tableau comme contenu, légende en
 * tête, aucune animation — vient de `ChartFrame`.
 */
export function BarChart({
  caption,
  data,
  xKey,
  series,
  layout = "stacked",
  orientation = "vertical",
  xLabel,
  yLabel,
  extraColumns,
  onBarClick,
  tableau = "bascule",
  formatValue = (v) => String(v),
  height = 300,
  className,
  // Les états de `ChartStates`, transmis d'un bloc : énumérés un par un,
  // le prochain qu'on ajoute manquera ici sans que rien ne le dise.
  ...etats
}: BarChartProps) {
  const horizontal = orientation === "horizontal";
  // Les dégradés vivent dans le SVG du graphique : sans identifiant unique,
  // deux histogrammes sur la même page partageraient leurs `<linearGradient>`
  // et le second reprendrait les couleurs du premier.
  const idDegrade = useId().replace(/:/g, "");
  const percent = layout === "stacked-percent";
  const empile = layout === "stacked" || percent;

  const columns: TableColumn<Record<string, string | number>>[] = [
    { key: xKey, header: xLabel ?? "Catégorie" },
    ...series.map((s) => ({
      key: s.key,
      header: s.label,
      numeric: true,
      cell: (row: Record<string, string | number>) => formatValue(row[s.key]),
    })),
    ...(extraColumns ?? []),
  ];

  // En empilé, le total est l'information principale : il a sa colonne. En
  // pourcentage aussi — c'est justement ce que le graphique NE montre pas
  // (chaque barre est ramenée à 100 %), donc le tableau reste le seul endroit
  // où le volume réel de chaque catégorie est lisible.
  if (empile && series.length > 1) {
    columns.push({
      key: "__total",
      header: "Total",
      numeric: true,
      cell: (row) =>
        formatValue(series.reduce((t, s) => t + Number(row[s.key] ?? 0), 0)),
    });
  }

  // Données du GRAPHIQUE en pourcentage — le tableau, lui, garde les valeurs
  // réelles ci-dessus : c'est le seul endroit où le volume par catégorie
  // reste lisible une fois la barre ramenée à 100 %.
  const chartData = percent
    ? data.map((row) => {
        const total = series.reduce((t, s) => t + Number(row[s.key] ?? 0), 0);
        const next: Record<string, string | number> = { ...row };
        for (const s of series) {
          next[s.key] = total ? (Number(row[s.key] ?? 0) / total) * 100 : 0;
        }
        return next;
      })
    : data;

  // L'accord suit le nombre de séries : « 1 série groupée », pas « groupées ».
  const pluriel = series.length > 1 ? "s" : "";
  const resume =
    `${caption}. ${series.length} série${pluriel} ` +
    `${percent ? "ramenée" + pluriel + " à 100 % par catégorie" : empile ? "empilée" + pluriel : "groupée" + pluriel} ` +
    `sur ${data.length} catégorie${data.length > 1 ? "s" : ""}.`;

  return (
    <ChartFrame
      caption={caption}
      summary={resume}
      series={series}
      data={data}
      columns={columns}
      getRowKey={(row) => String(row[xKey])}
      rowHeaderKey={xKey}
      height={height}
      legendStyle="aplat"
      tableau={tableau}
      className={className}
      {...etats}
    >
      {({ infobulleActive, indexActif, surSurvol }) => (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={chartData}
            layout={horizontal ? "vertical" : "horizontal"}
            // `tabIndex={-1}` : recharts rend son SVG focusable par défaut.
            // Dans un sous-arbre `aria-hidden`, un élément focusable est une
            // contradiction — axe la signale (aria-hidden-focus), et c'en est
            // une vraie : le focus y entrerait sans que rien ne soit annoncé.
            tabIndex={-1}
            margin={{ top: percent && !horizontal ? 28 : 8, right: 8, bottom: 8, left: 0 }}
            // `cursor: pointer` en style inline : recharts pose son propre
            // `cursor: default` sur son `.recharts-wrapper`, qu'une classe
            // héritée ne peut pas battre.
            style={{ cursor: "pointer" }}
            onMouseMove={surSurvol}
            onMouseLeave={() => surSurvol(null)}
          >
            <defs>
              {/* Un dégradé par série, dense à la BASE et nominal au sommet.
                  La barre paraît ainsi partir de l'axe au lieu d'y être posée.

                  Le sens n'est pas indifférent : la couleur nominale reste le
                  point le plus CLAIR de la barre, donc tous les contrastes déjà
                  audités — l'étiquette de pourcentage au centre du segment, la
                  série contre la carte — restent des bornes basses. Éclaircir
                  le sommet les aurait invalidés d'un coup. */}
              {series.map((s, i) => (
                <linearGradient
                  key={s.key}
                  id={`${idDegrade}-s${i}`}
                  x1="0"
                  y1="1"
                  x2="0"
                  y2="0"
                >
                  <stop
                    offset="0%"
                    stopColor={`color-mix(in oklch, ${couleurSerie(i)}, black 16%)`}
                  />
                  <stop offset="100%" stopColor={couleurSerie(i)} />
                </linearGradient>
              ))}
            </defs>
            {infobulleActive && (
              <RechartsTooltip
                content={<ChartTooltipContent formatValue={(v) => formatValue(v)} />}
                // Le voile de survol de recharts assombrit toute la colonne.
                // `--surface-hover` est le token prévu pour ça ; un noir à 10 %
                // ne suivrait pas le thème.
                cursor={{ fill: "var(--surface-hover)" }}
                isAnimationActive={false}
              />
            )}
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={horizontal}
              horizontal={!horizontal}
            />
            {horizontal ? (
              <>
                // Graduations en chiffres tabulaires : sur un axe vertical, des chiffres
            // de chasse variable décalent les graduations les unes par rapport aux
            // autres et le rail de gauche ondule.
            <XAxis
                  type="number"
                  domain={percent ? [0, 100] : undefined}
                  ticks={percent ? [0, 50, 100] : undefined}
                  tickFormatter={percent ? (v) => `${v} %` : undefined}
                  tick={TICK}
                  stroke="var(--border-strong)"
                  tickLine={false}
                  height={yLabel ? 44 : 30}
                >
                  {/* En disposition couchée, c'est l'axe HORIZONTAL qui porte
                      les valeurs : `yLabel` le nomme, pas `xLabel`. */}
                  {yLabel && (
                    <Label
                      value={yLabel}
                      position="insideBottom"
                      offset={-2}
                      fill="var(--muted-foreground)"
                      fontSize={12}
                    />
                  )}
                </XAxis>
                <YAxis
                  type="category"
                  dataKey={xKey}
                  // Largeur DÉDUITE du libellé le plus long, pas figée à
                  // 120px : « Auvergne-Rhône-Alpes » s'y faisait rogner à
                  // gauche, et « Provence-Alpes-Côte d'Azur » passait à la
                  // ligne. Une barre couchée sert justement à loger des
                  // libellés longs — les tronquer lui retire sa raison d'être.
                  // Bornée à 260px pour ne pas écraser la zone de tracé.
                  width={Math.min(
                    260,
                    Math.max(
                      96,
                      Math.max(...chartData.map((d) => String(d[xKey] ?? "").length)) * 7 + 16
                    )
                  )}
                  tick={TICK}
                  stroke="var(--border-strong)"
                  tickLine={false}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xKey}
                  // En pourcentage, la catégorie devient un en-tête DE
                  // COHORTE au-dessus de sa barre — pas un repère d'axe : on
                  // veut la voir avant même de lire la barre, comme un titre
                  // de colonne. `orientation="top"`, trait masqué, graisse
                  // relevée sur `--foreground` plutôt que le gris habituel
                  // des ticks d'axe.
                  orientation={percent ? "top" : "bottom"}
                  axisLine={!percent}
                  tick={
                    percent
                      ? { ...TICK, fill: "var(--foreground)", fontSize: 13, fontWeight: 600 }
                      : TICK
                  }
                  stroke="var(--border-strong)"
                  tickLine={false}
                  height={xLabel && !percent ? 44 : 30}
                >
                  {/* En pourcentage la catégorie passe EN HAUT, comme un
                      en-tête de cohorte : y ajouter un nom d'axe sous les
                      barres pointerait vers des ticks qui n'y sont plus. */}
                  {xLabel && !percent && (
                    <Label
                      value={xLabel}
                      position="insideBottom"
                      offset={-2}
                      fill="var(--muted-foreground)"
                      fontSize={12}
                    />
                  )}
                </XAxis>
                <YAxis
                  width={yLabel ? 60 : 44}
                  domain={percent ? [0, 100] : undefined}
                  ticks={percent ? [0, 50, 100] : undefined}
                  tickFormatter={percent ? (v) => `${v} %` : undefined}
                  tick={TICK}
                  stroke="var(--border-strong)"
                  tickLine={false}
                >
                  {yLabel && (
                    <Label
                      value={yLabel}
                      angle={-90}
                      position="insideLeft"
                      style={{ textAnchor: "middle" }}
                      fill="var(--muted-foreground)"
                      fontSize={12}
                    />
                  )}
                </YAxis>
              </>
            )}
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                onClick={onBarClick ? (_, index) => onBarClick(chartData[index]) : undefined}
                style={onBarClick ? { cursor: "pointer" } : undefined}
                // `name` : sans lui l'infobulle affiche la CLÉ de la série
                // (« pj ») au lieu de son libellé (« Pages Jaunes »).
                name={s.label}
                stackId={empile ? "pile" : undefined}
                fill={couleurSerie(i)}
                stroke="var(--card)"
                strokeWidth={empile ? 2 : 0}
                isAnimationActive={false}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                shape={((props: any) => {
                  // Pourcentage écrit au centre de la part — seul moyen de
                  // comparer deux parts voisines sans les mesurer à l'œil
                  // (même raisonnement que `DonutChart`). Masqué sous ~18px :
                  // en dessous, le texte ne tiendrait pas dans le segment.
                  const valeur = Math.round(Number(props.value ?? 0));
                  const etiquette = percent && props.height > 18;
                  // Contraste mesuré (colorjs.io) blanc/encre contre les 6
                  // couleurs de `--chart-*`, light ET dark : `--primary-foreground`
                  // convient partout SAUF chart-5 (indice 4) où lui seul
                  // n'atteint que 4,05:1 en sombre — blanc fixe y passe dans
                  // les deux thèmes (4,62 / 6,64) et est donc conservé tel quel.
                  const texte = i % 6 === 4 ? "oklch(1 0 0)" : "var(--primary-foreground)";
                  return (
                    // L'emphase se fait par RETRAIT : la catégorie pointée
                    // garde sa pleine intensité, les autres s'effacent.
                    <g opacity={opaciteSerie(indexActif, props.index)}>
                      <path
                        d={cheminBarre(
                          props.x,
                          props.y,
                          props.width,
                          props.height,
                          // Empilé, seul le segment du HAUT s'arrondit : arrondir
                          // chaque segment creuserait des encoches entre eux et
                          // ferait lire une pile comme des blocs détachés.
                          !empile || i === series.length - 1 ? 4 : 0
                        )}
                        fill={`url(#${idDegrade}-s${i})`}
                      />
                      {empile && (
                        // Le séparateur : sans lui, deux segments de teintes
                        // voisines fusionnent en un seul bloc.
                        <path
                          d={cheminBarre(
                            props.x,
                            props.y,
                            props.width,
                            props.height,
                            !empile || i === series.length - 1 ? 4 : 0
                          )}
                          fill="none"
                          stroke="var(--card)"
                          strokeWidth={2}
                        />
                      )}
                      {etiquette && (
                        <text
                          x={props.x + props.width / 2}
                          y={props.y + props.height / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={texte}
                          fontSize={13}
                          fontWeight={700}
                        >
                          {valeur} %
                        </text>
                      )}
                    </g>
                  );
                }) as never}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
