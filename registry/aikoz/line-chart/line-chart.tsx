import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart as RechartsLineChart,
  Label,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartFrame,
  ChartTooltipContent,
  formatValeurParDefaut,
  couleurSerie,
  styleSerie,
  type ChartSerie, type ChartStates } from "@registry/aikoz/chart-frame/chart-frame";
import { type TableColumn } from "@registry/aikoz/table/table";

// ─── Ticks d'axe ──────────────────────────────────────────────────────────────

/**
 * Chiffres à chasse fixe sur les graduations — voir `bar-chart.tsx` pour la
 * mesure : en Gotham, les dix chiffres proportionnels s'étalent sur 35,7 px,
 * et la police embarque bien la variante tabulaire, il manquait de la demander.
 *
 * `style` et non une propriété de premier niveau : recharts type l'objet `tick`
 * en `SVGProps<SVGTextElement>`, qui ne connaît pas `fontVariantNumeric`.
 */
const TICK = {
  fill: "var(--muted-foreground)",
  fontSize: 12,
  style: { fontVariantNumeric: "tabular-nums" },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LineSerie = ChartSerie;

export interface LineChartProps extends ChartStates {
  caption: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: LineSerie[];
  /**
   * Série de RÉFÉRENCE — la période précédente, un objectif, une moyenne de
   * marché. Elle est tracée en retrait : trait fin, teinte neutre, pas de
   * marqueur. C'est ce qui remplace un composant « ComparisonLineChart » :
   * comparer deux périodes n'est pas un autre graphique, c'est une série de
   * plus qu'on ne lit pas comme les autres.
   *
   * Son écart avec la première série est CALCULÉ et énoncé dans le résumé :
   * sans ça, la comparaison n'existe que pour qui voit les deux courbes.
   */
  reference?: LineSerie;
  /**
   * Nom de l'axe horizontal, **unité comprise** — « Trimestre », « Mois ».
   * Rendu sous l'axe ET repris en en-tête du tableau.
   */
  xLabel?: string;
  /**
   * Nom de l'axe vertical, **unité comprise** — « Taux de réponse (%) »,
   * « Avis reçus ». Carbon est explicite là-dessus : un axe quantitatif sans
   * unité laisse le lecteur deviner ce qu'il compte.
   */
  yLabel?: string;
  formatValue?: (v: string | number) => string;
  height?: number;
  /**
   * Nomme chaque courbe AU BOUT de son tracé, au lieu d'une légende.
   *
   * C'est la recommandation constante de Carbon, Datawrapper et du FT, et
   * elle règle deux choses d'un coup. L'œil n'a plus d'aller-retour à faire
   * entre une liste de noms et un tracé — le nom est là où la courbe finit.
   * Et surtout, l'identification passe par du TEXTE : la courbe ne dépend
   * plus de sa couleur pour être reconnue, donc le tiret qui portait ce rôle
   * peut disparaître et les traits redeviennent pleins.
   *
   * Mesuré sur notre palette, une paire de séries sur quinze se confond en
   * niveaux de gris (1,08:1 en clair). Le tiret ne couvrait donc qu'une paire ;
   * l'étiquette les couvre toutes.
   *
   * Désactivé au-delà de quatre séries ou sous 480 px : l'étiquette n'a plus
   * la place, et deux étiquettes qui se chevauchent sont pires qu'une légende.
   */
  directLabels?: boolean;
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
 * Courbe multi-séries.
 *
 * Le contrat d'accessibilité vient de `ChartFrame` : graphique masqué,
 * tableau comme contenu réel, légende en tête, trois canaux par série,
 * aucune animation. Ce fichier n'ajoute que ce qui est propre aux courbes —
 * le tracé, les marqueurs, et la série de référence.
 *
 * **Il n'y a pas de composant `ComparisonLineChart`.** Comparer deux
 * périodes, c'est une série de plus tracée en retrait, plus un écart énoncé.
 * Deux props, pas un second composant — même raisonnement que pour
 * `ChoiceGroup`.
 */
export function LineChart({
  caption,
  data,
  xKey,
  series,
  reference,
  xLabel,
  yLabel,
  formatValue = formatValeurParDefaut,
  height = 280,
  directLabels = true,
  tableau = "bascule",
  className,
  // Les états de `ChartStates`, transmis d'un bloc : énumérés un par un,
  // le prochain qu'on ajoute manquera ici sans que rien ne le dise.
  ...etats
}: LineChartProps) {
  const toutes = reference ? [...series, reference] : series;

  // Au-delà de quatre courbes les étiquettes se chevauchent : elles sont
  // écrites à la hauteur du DERNIER point, et rien ne garantit que quatre
  // derniers points soient assez espacés verticalement. Recharts ne sait pas
  // pousser une étiquette hors de la place d'une autre ; mieux vaut la
  // légende que deux noms superposés.
  const etiquettes = directLabels && toutes.length <= 4;

  // La gouttière est dimensionnée sur le plus long libellé — environ 7 px par
  // caractère à 12 px, plus le point terminal. Mesurer le texte rendu
  // demanderait un aller-retour dans le DOM pour un gain nul : une gouttière
  // trop large coûte quelques pixels, une trop étroite tronque un nom.
  const gouttiere = etiquettes
    ? Math.min(140, Math.max(...toutes.map((s) => s.label.length)) * 7 + 16)
    : 8;

  const columns: TableColumn<Record<string, string | number>>[] = [
    { key: xKey, header: xLabel ?? "Période" },
    ...toutes.map((s) => ({
      key: s.key,
      header: s.label,
      numeric: true,
      cell: (row: Record<string, string | number>) => formatValue(row[s.key]),
    })),
  ];

  // L'écart au dernier point, énoncé. Une comparaison qui n'existe qu'à
  // l'œil n'est pas une comparaison pour tout le monde.
  let ecart = "";
  if (reference && data.length) {
    const dernier = data[data.length - 1];
    const a = Number(dernier[series[0].key]);
    const b = Number(dernier[reference.key]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const d = Math.round((a - b) * 10) / 10;
      ecart = ` Au dernier point, ${series[0].label} ${
        d >= 0 ? "dépasse" : "reste sous"
      } ${reference.label} de ${Math.abs(d)}.`;
    }
  }

  const resume =
    `${caption}. ${series.length} série${series.length > 1 ? "s" : ""}` +
    `${reference ? ` et une référence (${reference.label})` : ""} ` +
    `sur ${data.length} points.${ecart}`;

  return (
    <ChartFrame
      caption={caption}
      summary={resume}
      series={toutes}
      data={data}
      columns={columns}
      getRowKey={(_, i) => `${xKey}-${i}`}
      rowHeaderKey={xKey}
      height={height}
      // Une légende sous des courbes déjà nommées répète l'information et
      // rallonge le bloc pour rien.
      hideLegend={etiquettes}
      tableau={tableau}
      className={className}
      {...etats}
    >
      {({ infobulleActive, surSurvol }) => (
        <ResponsiveContainer width="100%" height="100%">
          {/* `style={{ cursor: "pointer" }}` — PAS une classe Tailwind sur
              `ResponsiveContainer` : Recharts pose son propre style inline
              `cursor: "default"` sur son `.recharts-wrapper` interne, qui
              l'emporterait toujours sur une classe héritée d'un ancêtre. Ce
              `style` est fusionné PAR-DESSUS ce défaut par Recharts lui-même
              (cf. `generateCategoricalChart`), donc c'est le seul point qui
              tient. Affordance seule : la valeur exacte reste dans le
              tableau qui suit, le curseur ne porte aucune information. */}
          <RechartsLineChart
            data={data}
            margin={{ top: 8, right: gouttiere, bottom: 8, left: 0 }}
            style={{ cursor: "pointer" }}
            onMouseMove={surSurvol}
            onMouseLeave={() => surSurvol(null)}
            // `tabIndex={-1}` : recharts rend son SVG focusable par défaut.
            // Dans un sous-arbre `aria-hidden`, un élément focusable est une
            // contradiction — axe la signale (aria-hidden-focus), et c'en est
            // une vraie : le focus y entrerait sans que rien ne soit annoncé.
            tabIndex={-1}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            // Graduations en chiffres tabulaires : sur un axe vertical, des chiffres
            // de chasse variable décalent les graduations les unes par rapport aux
            // autres et le rail de gauche ondule.
            <XAxis
              dataKey={xKey}
              tick={TICK}
              stroke="var(--border-strong)"
              tickLine={false}
              height={xLabel ? 44 : 30}
            >
              {xLabel && (
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
            {infobulleActive && (
              <RechartsTooltip
                content={<ChartTooltipContent formatValue={formatValue} />}
                cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }}
                isAnimationActive={false}
              />
            )}
            {reference && (
              // Tracée en PREMIER, donc sous les autres : une référence
              // passe derrière ce qu'elle sert à comparer.
              <Line
                type="monotone"
                dataKey={reference.key}
                name={reference.label}
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                strokeDasharray="3 4"
                dot={false}
                activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2.5 }}
                isAnimationActive={false}
              />
            )}
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={couleurSerie(i)}
                strokeWidth={2}
                // Trait PLEIN quand la courbe porte son nom. Le tiret existait
                // pour distinguer deux séries sans dépendre de la couleur ;
                // l'étiquette le fait mieux, avec du texte.
                strokeDasharray={etiquettes ? undefined : styleSerie(i).trait}
                dot={{ r: 3.5, fill: couleurSerie(i), strokeWidth: 0 }}
                // Halo à la couleur de la carte : le point survolé se
                // détache par un liseré qui le DÉCOUPE du fond, plutôt que
                // par un anneau sombre qui ajoute un trait de plus. C'est le
                // motif standard des dashboards, et il reste discret quand
                // plusieurs séries s'activent en même temps.
                activeDot={{ r: 6, stroke: "var(--card)", strokeWidth: 2.5 }}
                isAnimationActive={false}
              >
                {etiquettes && (
                  <LabelList
                    dataKey={s.key}
                    position="right"
                    offset={10}
                    fill={couleurSerie(i)}
                    fontSize={12}
                    fontWeight={600}
                    // Seul le DERNIER point porte le nom : `LabelList` en pose
                    // un sur chaque point sans ce filtre, et la courbe devient
                    // une phrase répétée.
                    content={({ x, y, index, value }: {
                      x?: number | string; y?: number | string;
                      index?: number; value?: number | string;
                    }) =>
                      index === data.length - 1 && value !== undefined ? (
                        <text
                          x={Number(x) + 10}
                          y={Number(y)}
                          dominantBaseline="central"
                          fill={couleurSerie(i)}
                          fontSize={12}
                          fontWeight={600}
                        >
                          {s.label}
                        </text>
                      ) : null
                    }
                  />
                )}
              </Line>
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

export { ChartLegend, SERIES } from "@registry/aikoz/chart-frame/chart-frame";
