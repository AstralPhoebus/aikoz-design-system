import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Icônes par défaut ──────────────────────────────────────────────────────
// Décoratives dans tous les cas : le ton est déjà porté par le texte et par
// la bordure/fond du bandeau (WCAG 1.4.1), l'icône ne fait que le renforcer.

// `strokeWidth` est en unités du VIEWBOX. Viewbox de 24 affiché en 20 px :
// un trait de 2 rendait 1,67 px là où le reste du système en rend 1,5.
// 1,5 × 24 / 20 = 1,8.
function DefaultInfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="11" x2="12" y2="16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1.15" fill="currentColor" />
    </svg>
  );
}

function DefaultWarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M12 3.5 21.2 19a1.2 1.2 0 0 1-1.03 1.8H3.83A1.2 1.2 0 0 1 2.8 19L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line x1="12" y1="9.75" x2="12" y2="14.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17.25" r="1.1" fill="currentColor" />
    </svg>
  );
}

function DefaultErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const DEFAULT_ICONS: Record<InfoBannerTone, ReactNode> = {
  info: <DefaultInfoIcon />,
  warning: <DefaultWarningIcon />,
  error: <DefaultErrorIcon />,
};

// ─── Variants ────────────────────────────────────────────────────────────────

const infoBannerVariants = cva(
  ["flex w-full items-start gap-2.5 rounded-[var(--radius)] border p-3"],
  {
    variants: {
      // Même mapping ton → token que `Badge` (bordure + icône portent la
      // couleur, fond = voile 8%) : un seul système de tons dans tout le DS.
      // Différence avec Badge : le TEXTE reste `--foreground`, pas la couleur
      // du ton. Un badge est un mot court, calé pour tenir 4,5:1 dans sa
      // propre teinte ; un bandeau porte 1-2 phrases, et la même remontée de
      // ton sur un paragraphe entier n'a jamais été mesurée à cette longueur.
      // On préfère un canal éprouvé (`--foreground`, déjà audité partout) et
      // on confine le ton à la bordure/fond (3:1, non-textuel) et à l'icône.
      tone: {
        info: [
          "border-[var(--info)]",
          "bg-[color-mix(in_oklch,var(--info),transparent_92%)]",
          "[&_svg]:text-[var(--info)]",
        ],
        warning: [
          "border-[var(--warning)]",
          "bg-[color-mix(in_oklch,var(--warning),transparent_92%)]",
          "[&_svg]:text-[var(--warning)]",
        ],
        error: [
          "border-[var(--destructive-text)]",
          "bg-[color-mix(in_oklch,var(--destructive-text),transparent_92%)]",
          "[&_svg]:text-[var(--destructive-text)]",
        ],
      },
    },
    defaultVariants: { tone: "info" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type InfoBannerTone = "info" | "warning" | "error";

export interface InfoBannerProps extends VariantProps<typeof infoBannerVariants> {
  /** Texte explicatif, 1-2 phrases. Pas de titre séparé : le bandeau reste au fil du texte. */
  children: ReactNode;
  /** Pictogramme posé avant le texte. Décoratif ; un glyphe par défaut est fourni par ton si omis. */
  icon?: ReactNode;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Bandeau d'information — explique une règle ou un comportement automatique
 * du produit AVANT que l'utilisateur agisse (ex. « les réponses affichées
 * tournent aléatoirement »), pas après une action de sa part.
 *
 * `role="status"` : c'est une annonce non urgente, jamais `role="alert"` — ce
 * dernier est réservé aux bandeaux de ton `error` qui doivent interrompre la
 * lecture. Un bandeau statique déjà présent au chargement de la page n'est
 * pas relu automatiquement par la région live ; `role="status"` ne prend
 * effet que si le composant apparaît ou change après coup (ex. affiché
 * conditionnellement), ce qui reste cohérent avec le reste du DS
 * (`BookingFlow`, `DateRangePicker`).
 *
 * Pas de bouton de fermeture : la spec observée est un bloc statique, non
 * cliquable. Un `onDismiss` optionnel pourrait s'ajouter plus tard, mais
 * l'inventer maintenant ferait porter au composant un état (fermé/rouvert)
 * qu'aucun usage réel ne réclame encore.
 */
export function InfoBanner({
  children,
  tone = "info",
  icon,
  className,
}: InfoBannerProps) {
  return (
    <div role="status" className={cn(infoBannerVariants({ tone }), className)}>
      <span aria-hidden="true" className="shrink-0 inline-flex mt-0.5">
        {icon ?? DEFAULT_ICONS[tone ?? "info"]}
      </span>
      <p className="m-0 text-sm text-[var(--foreground)] text-balance">{children}</p>
    </div>
  );
}

export { infoBannerVariants };
