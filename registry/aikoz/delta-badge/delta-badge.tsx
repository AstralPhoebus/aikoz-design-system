import { ArrowUpward, ArrowDownward, Remove } from "@material-symbols-svg/react/rounded";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  [
    "inline-flex items-center gap-0.5 shrink-0",
    "rounded-full border font-semibold whitespace-nowrap",
  ],
  {
    variants: {
      tone: {
        // La bordure porte la couleur en plus du fond : sur fond très clair le
        // seul aplat ne tient pas le 3:1 conteneur/fond de WCAG 1.4.11.
        positive: [
          "border-[var(--success)] text-[var(--success)]",
          "bg-[color-mix(in_oklch,var(--success),transparent_92%)]",
        ],
        negative: [
          "border-[var(--destructive-text)] text-[var(--destructive-text)]",
          "bg-[color-mix(in_oklch,var(--destructive-text),transparent_92%)]",
        ],
        // `--neutral-text`, pas `--muted-foreground` : ce dernier est le gris du
        // texte SECONDAIRE, emprunté faute de rôle. Une variation stable est
        // une donnée, au même titre qu'une hausse ou une baisse — elle mérite
        // son rôle, et il est désormais bleu ardoise plutôt que gris.
        neutral: [
          "border-[var(--neutral-text)] text-[var(--neutral-text)]",
          "bg-[color-mix(in_oklch,var(--neutral-text),transparent_92%)]",
        ],
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-0.5",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  }
);

const iconSize = { sm: "w-2.5 h-2.5", md: "w-3 h-3" } as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeltaTone = "positive" | "negative" | "neutral";

export interface DeltaBadgeProps
  extends Omit<VariantProps<typeof badgeVariants>, "tone"> {
  /** Variation à afficher. Le signe détermine le ton, sauf si `tone` est forcé. */
  value: number;
  /** Unité accolée à la valeur : `%`, ` pts`, etc. */
  unit?: string;
  /**
   * Force le ton. Utile quand « moins » est un progrès — un délai de réponse
   * qui baisse est une bonne nouvelle et doit rester vert.
   */
  tone?: DeltaTone;
  /** En deçà de ce seuil (valeur absolue), la variation est jugée neutre. */
  neutralThreshold?: number;
  /**
   * Libellé accessible. Par défaut « en hausse de 12 % ».
   * `null` si un parent annonce déjà la variation — le badge devient alors
   * décoratif, comme `ScoreStars` et `ProgressBar`. Sans ça, un badge posé
   * dans une carte cliquable reste un élément annonçable orphelin.
   */
  label?: string | null;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

const ICON = {
  positive: ArrowUpward,
  negative: ArrowDownward,
  neutral: Remove,
} as const;

/**
 * Étiquette de variation.
 *
 * Extrait de `kpi-card.tsx`, où il vivait inliné sous le nom `TrendBadge` et
 * ne gérait que positif / négatif. L'état neutre — prévu par la spec de Louis
 * et par le composant Figma `Tag` — est ajouté ici.
 *
 * L'information n'est jamais portée par la seule couleur : une flèche haut /
 * bas / tiret double le ton, et `aria-label` donne le sens en toutes lettres.
 */
export function DeltaBadge({
  value,
  unit = "%",
  tone,
  size = "md",
  neutralThreshold = 0,
  label,
  className,
}: DeltaBadgeProps) {
  const resolved: DeltaTone =
    tone ??
    (Math.abs(value) <= neutralThreshold
      ? "neutral"
      : value > 0
      ? "positive"
      : value < 0
      ? "negative"
      : "neutral");

  const Icon = ICON[resolved];
  const magnitude = Math.abs(value).toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  });
  const signed = `${value > 0 ? "+" : value < 0 ? "−" : ""}${magnitude}${unit}`;

  const decorative = label === null;
  const accessibleLabel = decorative
    ? undefined
    : label ??
      (resolved === "neutral"
        ? `stable, ${magnitude}${unit}`
        : resolved === "positive"
        ? `en hausse de ${magnitude}${unit}`
        : `en baisse de ${magnitude}${unit}`);

  return (
    <span
      className={cn(badgeVariants({ tone: resolved, size }), className)}
      aria-label={accessibleLabel}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
    >
      <Icon className={iconSize[size ?? "md"]} aria-hidden="true" />
      <span aria-hidden="true">{signed}</span>
    </span>
  );
}

export { badgeVariants as deltaBadgeVariants };
