import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip as RechartsTooltip } from "recharts";
import { cn } from "@registry/aikoz/lib/utils";
import {
  ChartFrame,
  ChartTooltipContent,
  opaciteSerie,
  couleurSerie, type ChartStates } from "@registry/aikoz/chart-frame/chart-frame";
import { type TableColumn } from "@registry/aikoz/table/table";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DonutPart {
  key: string;
  label: string;
  value: number;
}

export interface DonutChartProps extends ChartStates {
  caption: string;
  parts: DonutPart[];
  /** Chiffre au centre — un total, une part dominante. */
  centerValue?: string;
  centerLabel?: string;
  formatValue?: (v: number) => string;
  height?: number;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Anneau de répartition — transposé du `SourcesDonut` des maquettes.
 *
 * **Un anneau se lit mal, et il faut le savoir avant d'en poser un.** L'œil
 * compare des longueurs bien mieux que des angles : au-delà de quatre ou
 * cinq parts, ou dès que deux parts sont proches, une barre horizontale
 * renseigne davantage. L'anneau garde un avantage réel — il montre qu'on
 * regarde un TOUT — d'où le chiffre au centre, qui est souvent la seule
 * information que le lecteur retiendra.
 *
 * Chaque part porte donc **son pourcentage écrit**, en plus de la trame et
 * de la couleur. C'est le seul moyen de comparer deux parts voisines sans
 * les mesurer à l'œil.
 *
 * Le reste du contrat vient de `ChartFrame` : anneau masqué, tableau comme
 * contenu, aucune animation.
 */
export function DonutChart({
  caption,
  parts,
  centerValue,
  centerLabel,
  formatValue = (v) => String(v),
  height = 260,
  className,
  // Les états de `ChartStates`, transmis d'un bloc : énumérés un par un,
  // le prochain qu'on ajoute manquera ici sans que rien ne le dise.
  ...etats
}: DonutChartProps) {
  const total = parts.reduce((t, p) => t + p.value, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);

  const columns: TableColumn<DonutPart>[] = [
    { key: "label", header: "Source" },
    { key: "value", header: "Volume", numeric: true, cell: (p) => formatValue(p.value) },
    { key: "part", header: "Part", numeric: true, cell: (p) => `${pct(p.value)} %` },
  ];

  const resume =
    `${caption}. ${parts.length} parts, total ${formatValue(total)}. ` +
    parts.map((p) => `${p.label} ${pct(p.value)} %`).join(", ") + ".";

  return (
    <ChartFrame
      caption={caption}
      summary={resume}
      series={parts.map((p) => ({ key: p.key, label: `${p.label} · ${pct(p.value)} %` }))}
      data={parts}
      columns={columns}
      getRowKey={(p) => p.key}
      rowHeaderKey="label"
      height={height}
      legendStyle="aplat"
      className={className}
      {...etats}
    >
      {({ infobulleActive, indexActif, surSurvol }) => (
        <div className="relative h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart
            // `tabIndex={-1}` : recharts rend son SVG focusable par défaut.
            // Dans un sous-arbre `aria-hidden`, un élément focusable est une
            // contradiction — axe la signale (aria-hidden-focus), et c'en est
            // une vraie : le focus y entrerait sans que rien ne soit annoncé.
            tabIndex={-1}
            style={{ cursor: "pointer" }}
            >
              {infobulleActive && (
                <RechartsTooltip
                  content={
                    <ChartTooltipContent
                      formatValue={(v) =>
                        `${formatValue(Number(v))} · ${pct(Number(v))} %`
                      }
                    />
                  }
                  isAnimationActive={false}
                />
              )}
              <Pie
                data={parts}
                dataKey="value"
                nameKey="label"
                innerRadius="58%"
                outerRadius="88%"
                // Le trait à la couleur de la carte sépare deux parts de
                // teintes voisines, que la palette produira forcément.
                stroke="var(--card)"
                strokeWidth={2}
                isAnimationActive={false}
                // La part pointée s'écarte de 6px vers l'extérieur. C'est le
                // geste que font tous les anneaux modernes, et il fonctionne
                // ici pour une raison précise : sur un cercle, une part fine
                // ne peut pas s'agrandir en largeur — le seul axe disponible
                // est le rayon.
                activeIndex={indexActif ?? undefined}
                activeShape={(p: unknown) => {
                  const s = p as { outerRadius: number };
                  return <Sector {...s} outerRadius={s.outerRadius + 6} />;
                }}
                // Ce calque est RECOUVERT par celui des trames : il ne reçoit
                // jamais le pointeur. Le survol et l'infobulle sont donc
                // portés par le calque du dessus, pas ici.
                tooltipType="none"
                // `rootTabIndex` et non `tabIndex` : recharts pose lui-même
                // `tabindex="0"` sur le groupe racine du `<Pie>` et ignore un
                // `tabIndex` passé en prop. Le sous-arbre est masqué, un
                // élément focusable dedans est une contradiction — axe la
                // signale, et c'en est une vraie : le focus y entrerait sans
                // que rien ne soit annoncé.
                rootTabIndex={-1}
              >
                {parts.map((p, i) => (
                  <Cell
                    key={p.key}
                    fill={couleurSerie(i)}
                    fillOpacity={opaciteSerie(indexActif, i)}
                  />
                ))}
              </Pie>
              {/* Calque transparent posé par-dessus : il ne peint rien, il
                  capte le pointeur et porte le contour d'emphase. Il portait
                  autrefois la trame ; celle-ci a été retirée, la couleur
                  suffisant jusqu'à cinq parts (cf. `ChartFrame`). */}
              <Pie
                data={parts}
                dataKey="value"
                innerRadius="58%"
                outerRadius="88%"
                stroke="none"
                isAnimationActive={false}
                rootTabIndex={-1}
                // `nameKey` : c'est CE calque qui alimente l'infobulle, donc
                // c'est lui qui doit savoir nommer les parts. Sans lui,
                // l'infobulle affichait « 1 : 318 » — l'index de la part à la
                // place de son libellé.
                nameKey="label"
                onMouseEnter={(_, index) => surSurvol({ activeTooltipIndex: index })}
                onMouseLeave={() => surSurvol(null)}
              >
                {parts.map((p, i) => (
                  <Cell
                    key={p.key}
                    fill="transparent"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {(centerValue || centerLabel) && (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0",
                "flex flex-col items-center justify-center text-center"
              )}
            >
              {centerValue && (
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {centerValue}
                </span>
              )}
              {centerLabel && (
                <span className="text-xs text-muted-foreground">{centerLabel}</span>
              )}
            </div>
          )}
        </div>
      )}
    </ChartFrame>
  );
}
