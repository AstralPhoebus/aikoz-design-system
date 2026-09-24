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
        // TROIS rôles, pas un seul.
        //
        // Le badge dessinait tout avec la couleur de TEXTE : contour compris,
        // et un fond fait d'un voile à 8 % de cette même couleur. Un texte
        // est foncé parce qu'il doit tenir 4,5:1 — un contour n'a aucune
        // raison de l'être. L'avertissement sortait donc en kaki (#6E5100)
        // alors que la charte porte un jaune franc.
        //
        // `status.*-border` — la rampe `*.300`, #FAD94E pour l'avertissement,
        // #EC9A84 pour l'erreur — existait dans les thèmes depuis l'origine
        // et n'était publié nulle part. Quatre couleurs de la charte
        // qu'aucun composant ne pouvait demander.
        //
        // C'est toujours le contour qui tient le 3:1 contre la carte, cas
        // « badge de tendance » d'a11y.md : un aplat teinté seul donnait
        // 1,05:1 et le badge flottait sans limite. Le Figma dessine ces
        // pastilles SANS contour ; l'écart reste assumé.
        success: [
          "border-[var(--success-border)] text-[var(--success)]",
          "bg-[var(--success-subtle)]",
        ],
        warning: [
          "border-[var(--warning-border)] text-[var(--warning)]",
          "bg-[var(--warning-subtle)]",
        ],
        error: [
          "border-[var(--error-border)] text-[var(--destructive-text)]",
          "bg-[var(--error-subtle)]",
        ],
        info: [
          "border-[var(--info-border)] text-[var(--info)]",
          "bg-[var(--info-subtle)]",
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
