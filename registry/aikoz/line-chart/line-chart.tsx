import {
  CartesianGrid,
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
  couleurSerie,
  styleSerie,
  type ChartSerie,
} from "@registry/aikoz/chart-frame/chart-frame";
import { type TableColumn } from "@registry/aikoz/table/table";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LineSerie = ChartSerie;

export interface LineChartProps {
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
  tableCollapsed?: boolean;
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
  formatValue = (v) => String(v),
  height = 280,
  tableCollapsed = true,
  className,
}: LineChartProps) {
  const toutes = reference ? [...series, reference] : series;

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
      tableCollapsed={tableCollapsed}
      className={className}
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
            margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
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
            <XAxis
              dataKey={xKey}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
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
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
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
                strokeDasharray={styleSerie(i).trait}
                dot={{ r: 3.5, fill: couleurSerie(i), strokeWidth: 0 }}
                // Halo à la couleur de la carte : le point survolé se
                // détache par un liseré qui le DÉCOUPE du fond, plutôt que
                // par un anneau sombre qui ajoute un trait de plus. C'est le
                // motif standard des dashboards, et il reste discret quand
                // plusieurs séries s'activent en même temps.
                activeDot={{ r: 6, stroke: "var(--card)", strokeWidth: 2.5 }}
                isAnimationActive={false}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

export { ChartLegend, SERIES } from "@registry/aikoz/chart-frame/chart-frame";
