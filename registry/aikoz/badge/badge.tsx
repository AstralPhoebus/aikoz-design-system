import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  [
    // Ni `shrink-0` ni `whitespace-nowrap` : un libellé court ne les
    // déclenche jamais (il tient toujours sur une ligne), mais un libellé
    // long (ex. un motif de non-conformité en toutes lettres) doit pouvoir
    // se replier plutôt que déborder de son conteneur, coupé net par les
    // bords arrondis. `rounded-full` reste correct sur plusieurs lignes : le
    // rayon se borne automatiquement à la moitié de la hauteur de chaque
    // ligne, sans distorsion.
    "inline-flex items-center gap-1",
    "rounded-full border font-semibold",
  ],
  {
    variants: {
      tone: {
        // Une seule couleur par ton, portée par le texte ET le contour ; le fond
        // n'est qu'un voile à 8 %. C'est le contour qui tient le 3:1 contre la
        // carte — le cas « badge de tendance » documenté dans a11y.md : un aplat
        // teinté seul donnait 1,05:1, le badge flottait sans limite visible.
        // Le Figma dessine ces pastilles SANS contour ; l'écart est assumé.
        success: [
          "border-[var(--success)] text-[var(--success)]",
          "bg-[color-mix(in_oklch,var(--success),transparent_92%)]",
        ],
        warning: [
          "border-[var(--warning)] text-[var(--warning)]",
          "bg-[color-mix(in_oklch,var(--warning),transparent_92%)]",
        ],
        error: [
          "border-[var(--destructive-text)] text-[var(--destructive-text)]",
          "bg-[color-mix(in_oklch,var(--destructive-text),transparent_92%)]",
        ],
        info: [
          "border-[var(--info)] text-[var(--info)]",
          "bg-[color-mix(in_oklch,var(--info),transparent_92%)]",
        ],
        neutral: [
          "border-[var(--muted-foreground)] text-[var(--muted-foreground)]",
          "bg-[color-mix(in_oklch,var(--muted-foreground),transparent_92%)]",
        ],
      },
      size: {
        sm: "text-2xs px-1.5 py-0.5",
        md: "text-xs px-2 py-0.5",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeTone = "success" | "warning" | "error" | "info" | "neutral";

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  /**
   * Icône ou glyphe posé avant le texte. **Fortement recommandé** : sans lui,
   * le ton n'est porté que par la couleur, ce qu'interdit WCAG 1.4.1. Le
   * libellé peut suffire s'il énonce déjà l'état (« Répondu », « Critique ») —
   * c'est alors le texte qui joue ce rôle, pas la teinte.
   */
  icon?: ReactNode;
  /**
   * Précision lue en PLUS du texte visible, quand celui-ci est trop court pour
   * se suffire (« 3 » → « 3 avis sans réponse »). Rendue en `sr-only` : elle
   * s'ajoute, elle ne remplace pas. Un `role="img"` + `aria-label` aurait
   * effacé le texte visible de l'arbre d'accessibilité.
   *
   * `null` si un parent annonce déjà l'état — le badge devient décoratif,
   * comme `ScoreStars`, `ProgressBar` et `DeltaBadge`.
   */
  label?: string | null;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Étiquette de statut — cinq tons repris du composant Figma `Badge`
 * (Success / Warning / Error / Info / Neutral).
 *
 * À distinguer de `DeltaBadge`, qui porte une **variation** (hausse, baisse,
 * stable) et non un **état**. Deux concepts, deux composants : mutualiser
 * ferait porter à l'un la sémantique de l'autre.
 */
export function Badge({
  children,
  tone = "neutral",
  size = "md",
  icon,
  label,
  className,
}: BadgeProps) {
  const decorative = label === null;
  return (
    <span
      className={cn(badgeVariants({ tone, size }), className)}
      aria-hidden={decorative ? true : undefined}
    >
      {icon && (
        <span className="shrink-0 inline-flex" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {!decorative && label && <span className="sr-only"> {label}</span>}
    </span>
  );
}

export { badgeVariants };
