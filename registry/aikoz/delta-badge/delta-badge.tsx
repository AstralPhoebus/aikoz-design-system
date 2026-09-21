import { ArrowUpward, ArrowDownward, Remove } from "@material-symbols-svg/react/rounded";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  [
    "inline-flex items-center gap-0.5 shrink-0",
    "rounded-full font-semibold whitespace-nowrap tabular-nums",
  ],
  {
    variants: {
      tone: {
        // PLUS DE BORDURE, et un voile deux fois plus dense (16 % au lieu de 8).
        //
        // Le contour était justifié par WCAG 1.4.11, « 3:1 conteneur/fond ».
        // Relu, le critère ne s'applique pas ici : il vise les COMPOSANTS
        // d'interface — ce qui permet d'identifier un contrôle et son état —
        // et les objets graphiques nécessaires à la compréhension. Une pastille
        // de variation n'est ni l'un ni l'autre : elle n'est pas interactive,
        // et son sens est entièrement porté par sa flèche et son texte, qui
        // tiennent 4,5:1. La pastille elle-même n'ajoute aucune information.
        //
        // Tenir un seuil là où il ne s'applique pas n'est pas de la prudence,
        // c'est du bruit : deux traits par carte que rien n'exige. Le voile
        // densifié suffit à faire lire la forme.
        //
        // Le texte descend de 0,03 en clarté pour compenser le voile plus
        // sombre — mesuré sur le pire fond, la ligne mise en avant d'un
        // classement.
        positive: [
          "text-[var(--success)]",
          "bg-[color-mix(in_oklch,var(--success),transparent_84%)]",
        ],
        negative: [
          "text-[var(--destructive-text)]",
          "bg-[color-mix(in_oklch,var(--destructive-text),transparent_84%)]",
        ],
        // `--neutral-text`, pas `--muted-foreground` : ce dernier est le gris du
        // texte SECONDAIRE, emprunté faute de rôle. Une variation stable est
        // une donnée, au même titre qu'une hausse ou une baisse — elle mérite
        // son rôle, et il est désormais bleu ardoise plutôt que gris.
        neutral: [
          "text-[var(--neutral-text)]",
          "bg-[color-mix(in_oklch,var(--neutral-text),transparent_84%)]",
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
