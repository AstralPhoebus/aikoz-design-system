import { type ElementType, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@registry/aikoz/lib/utils";
import { ScoreStars } from "@registry/aikoz/score-stars/score-stars";
import { DeltaBadge, type DeltaTone } from "@registry/aikoz/delta-badge/delta-badge";
import { ProgressBar, type ProgressLevel } from "@registry/aikoz/progress-bar/progress-bar";

// ─── Variants ────────────────────────────────────────────────────────────────

/**
 * DEUX AXES INDÉPENDANTS.
 *
 * L'API précédente indexait la richesse sur `size` (sm/md/lg), ce qui mélangeait
 * deux choses sans rapport : la place disponible et la nature de la métrique.
 * Conséquence, `size="lg"` imposait la sparkline — impossible d'afficher une
 * note en étoiles dans une grande carte.
 *
 *   variant  → ce que la donnée EST
 *   density  → la place qu'on lui accorde
 */
const cardVariants = cva(
  ["relative flex flex-col", "bg-card border border-border", "rounded-[var(--radius)]", "shadow-sm"],
  {
    variants: {
      density: {
        compact: "p-4 gap-1.5 min-w-[150px]",
        default: "p-5 gap-2 min-w-[210px]",
        large: "p-6 gap-3 min-w-[270px]",
      },
    },
    defaultVariants: { density: "default" },
  }
);

const valueVariants = cva("font-sans font-bold leading-none tracking-tight text-foreground", {
  variants: {
    density: { compact: "text-3xl", default: "text-4xl", large: "text-5xl" },
  },
  defaultVariants: { density: "default" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * `rating`     — échelle bornée 0..max, l'appui est une notation en étoiles.
 * `target`     — bornée avec un objectif, l'appui est une barre de progression.
 * `trend`      — non bornée, l'appui est une courbe de tendance.
 * `raw`        — la valeur seule, sans appui.
 * `benchmark`  — repère de comparaison permanent, l'appui est une valeur de
 *                référence affichée en clair, pas une variation.
 */
export type KpiVariant = "rating" | "target" | "trend" | "raw" | "benchmark";
export type KpiDensity = "compact" | "default" | "large";

export interface KpiCardProps {
  label: string;
  value: number;
  variant?: KpiVariant;
  density?: KpiDensity;

  /** Unité accolée à la valeur : « % », « h », « /5 »… */
  unit?: string;
  /** Borne haute — 5 en `rating`, 100 en `target`. Ignorée ailleurs. */
  max?: number;

  /** `target` — objectif à atteindre, exprimé dans l'unité de `value`. */
  target?: number;
  /**
   * `target` — force le niveau. Sans lui, il est déduit de `value / target`
   * (bon ≥ 95 % de l'objectif, moyen ≥ 80 %). À forcer quand « moins » est un
   * progrès : un délai de réponse sous l'objectif est une bonne nouvelle.
   */
  level?: ProgressLevel;

  /** `trend` — les points de la courbe de tendance. */
  data?: number[];

  /**
   * Variation affichée en étiquette, en POINTS et non en série : c'est un
   * seul nombre. Le commentaire précédent disait « points de la courbe » à
   * côté de ce champ, ce qui laissait croire qu'il prenait la série — la
   * série, c'est `data`.
   */
  trend?: number;
  trendUnit?: string;
  /** Force le ton de l'étiquette — un délai qui baisse est une bonne nouvelle. */
  trendTone?: DeltaTone;

  /** Ligne de contexte sous l'appui : « Objectif · 90 % », « 30 derniers jours ». */
  caption?: string;

  /** `benchmark` — valeur de référence affichée en repère permanent (pas une variation). */
  benchmarkValue?: number;
  /** Libellé de la référence. « vs Moyenne marché » par défaut. */
  benchmarkLabel?: string;

  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Carte d'indicateur.
 *
 * Compose trois briques du registry selon la variante : `ScoreStars`,
 * `ProgressBar`, `DeltaBadge`. Chacune reçoit `label={null}` — la carte porte
 * déjà la valeur dans son propre libellé accessible, une brique qui la
 * réannoncerait la ferait entendre deux fois au lecteur d'écran.
 */
export function KpiCard({
  label,
  value,
  variant = "raw",
  density = "default",
  unit,
  max,
  target,
  level,
  data,
  trend,
  trendUnit = "%",
  trendTone,
  caption,
  benchmarkValue,
  benchmarkLabel = "vs Moyenne marché",
  icon,
  className,
  onClick,
  href,
}: KpiCardProps) {
  const scale = max ?? (variant === "rating" ? 5 : 100);

  // Une note se lit « 4,2 », un volume « 312 » : la décimale ne se force que
  // là où elle porte du sens.
  const formatted = value.toLocaleString("fr-FR", {
    minimumFractionDigits: variant === "rating" ? 1 : 0,
    maximumFractionDigits: 1,
  });

  const suffix = unit ?? (variant === "rating" ? `/${scale}` : "");

  // Même unité, même règle d'arrondi que la valeur principale : un repère de
  // comparaison qui ne « matche » pas visuellement casserait la lecture.
  const formattedBenchmark =
    benchmarkValue !== undefined
      ? benchmarkValue.toLocaleString("fr-FR", {
          minimumFractionDigits: variant === "rating" ? 1 : 0,
          maximumFractionDigits: 1,
        })
      : null;

  // Le niveau se juge contre l'OBJECTIF quand il y en a un, pas contre la borne
  // haute. « 87 % pour un objectif de 90 % », c'est 97 % du chemin : c'est bon.
  // Le calculer sur value/max donnait 0,87 → warning, et une barre ambre là où
  // les maquettes montrent du vert. La longueur du remplissage, elle, reste
  // proportionnelle à `max` : c'est l'échelle réelle.
  const resolvedLevel: ProgressLevel | undefined =
    level ??
    (target !== undefined && target > 0
      ? (() => {
          const reached = value / target;
          return reached >= 0.95 ? "good" : reached >= 0.8 ? "warning" : "critical";
        })()
      : undefined);

  const isInteractive = !!(onClick || href);
  const Comp = (href ? "a" : onClick ? "button" : "div") as ElementType;
  const compProps = href ? { href } : onClick ? { onClick, type: "button" as const } : {};

  const interactiveClasses = isInteractive
    ? cn(
        "transition-all cursor-pointer",
        "hover:shadow-lg hover:border-[var(--ring)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        "active:scale-[0.99]",
        href && "no-underline",
        onClick && "text-left w-full"
      )
    : "";

  // Énoncé complet : la carte dit TOUT, les briques d'appui se taisent.
  // La tendance en fait partie — sans elle, un lecteur d'écran activant la
  // carte n'entendait jamais le « +0,1 » que l'œil voit en haut à droite.
  const spokenTrend =
    trend === undefined
      ? null
      : `${trend > 0 ? "en hausse de" : trend < 0 ? "en baisse de" : "stable,"} ${Math.abs(
          trend
        ).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}${trendUnit}`;

  const spoken = [
    `${label} : ${formatted}${suffix}`,
    spokenTrend,
    target !== undefined ? `objectif ${target}${unit ?? ""}` : null,
    formattedBenchmark !== null ? `${benchmarkLabel} ${formattedBenchmark}${suffix}` : null,
    caption,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Comp
      className={cn(cardVariants({ density }), interactiveClasses, className)}
      aria-label={isInteractive ? spoken : undefined}
      {...compProps}
    >
      <div className="flex items-start justify-between gap-2">
        {/* `min-h-8` : deux lignes de `text-xs`, réservées que le libellé
            tienne sur une ligne ou deux. Sans ça, la valeur et le repère de
            comparaison qui suivent démarrent à des hauteurs différentes
            d'une carte à l'autre dans une même grille — un « Taux de
            réponse -48h » sur deux lignes décale tout ce qu'il porte, pas
            un « Nombre d'avis » resté sur une seule. */}
        <span className="min-h-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {icon && (
          // L'icône dans une PUCE, pas nue. C'est le geste commun aux
          // tableaux de bord SaaS récents : elle devient un repère qu'on
          // retrouve d'une carte à l'autre au lieu d'un glyphe flottant.
          // Fond `--track` et non une teinte : une puce colorée ferait porter un
          // sens à l'icône, qui n'en a pas. Et `--track` plutôt que `--muted`
          // pour la raison déjà rencontrée sur ProgressBar — en thème sombre
          // `--muted` vaut le fond de page, donc 1,12:1 sur la carte : la puce
          // s'y lirait comme un trou, pas comme un repère.
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center",
              "rounded-[calc(var(--radius)*0.75)] bg-[var(--track)] text-muted-foreground",
              "[&>svg]:size-4"
            )}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Le chiffre et sa variation sur UNE ligne. Séparés, l'œil fait deux
          arrêts pour une seule information ; côte à côte, « 87 % ↑ 4,2 pts »
          se lit d'un trait. C'est le motif de toutes les références. */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={valueVariants({ density })}>{formatted}</span>
        {suffix && (
          <span className="text-base font-medium text-muted-foreground">{suffix}</span>
        )}
        {trend !== undefined && (
          <DeltaBadge
            value={trend}
            unit={trendUnit}
            tone={trendTone}
            size="sm"
            className="self-center"
            /* Décoratif seulement si la carte parle : sur une carte statique le
               badge reste le seul porteur du sens de la variation. */
            label={isInteractive ? null : undefined}
          />
        )}
      </div>

      {variant === "rating" && (
        <ScoreStars
          value={value}
          max={scale}
          size={density === "compact" ? "sm" : density === "large" ? "lg" : "md"}
          label={null}
        />
      )}

      {variant === "target" && (
        <ProgressBar
          value={value}
          max={scale}
          level={resolvedLevel}
          size={density === "compact" ? "sm" : density === "large" ? "lg" : "md"}
          label={null}
        />
      )}

      {variant === "trend" && data && data.length > 1 && (
        <ResponsiveContainer
          width="100%"
          height={density === "compact" ? 32 : density === "large" ? 64 : 48}
        >
          <LineChart
            data={data.map((v) => ({ v }))}
            margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
          >
            <Line
              type="monotone"
              dataKey="v"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {variant === "benchmark" && formattedBenchmark !== null && (
        <div className="flex items-baseline gap-1 text-sm text-muted-foreground">
          <span>{benchmarkLabel}</span>
          <span className="font-medium text-foreground">
            {formattedBenchmark}
            {suffix}
          </span>
        </div>
      )}

      {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
    </Comp>
  );
}

export { cardVariants as kpiCardVariants };
