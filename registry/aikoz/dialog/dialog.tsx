import { type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const contentVariants = cva(
  [
    "fixed z-50 flex flex-col gap-4 bg-card text-card-foreground",
    "border border-border shadow-lg",
    "focus:outline-none",
    // Une modale plus haute que l'écran doit défiler d'elle-même, sinon son
    // bouton de validation devient inatteignable en zoom 200 % (WCAG 1.4.10).
    "max-h-[calc(100dvh-2rem)] overflow-y-auto",
  ],
  {
    variants: {
      placement: {
        /** Modale centrée — confirmation, formulaire court. */
        center: [
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-[calc(100vw-2rem)] max-w-lg rounded-[var(--radius)]",
        ],
        /** Panneau latéral — filtres, détail d'une ligne. */
        right: [
          "right-0 top-0 h-dvh max-h-dvh w-[calc(100vw-3rem)] max-w-md",
          "rounded-l-[var(--radius)]",
        ],
        /** Feuille basse — le réflexe mobile. */
        bottom: [
          "bottom-0 left-0 right-0 max-h-[85dvh]",
          "rounded-t-[var(--radius)]",
        ],
      },
      density: { compact: "p-4", default: "p-6" },
    },
    defaultVariants: { placement: "center", density: "default" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DialogProps extends VariantProps<typeof contentVariants> {
  /** Élément déclencheur. Le focus lui revient automatiquement à la fermeture. */
  trigger?: ReactNode;
  /**
   * Titre — **obligatoire**. Il nomme la modale pour les lecteurs d'écran.
   * Une modale sans nom s'annonce « dialogue », sans dire lequel.
   */
  title: string;
  /**
   * Titre visuellement masqué. Pour une modale dont le contenu porte déjà son
   * propre en-tête ; le nom accessible reste nécessaire.
   */
  titleHidden?: boolean;
  /** Texte d'introduction, associé par `aria-describedby`. */
  description?: string;
  children: ReactNode;
  /** Barre d'actions, rendue en bas. */
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Libellé du bouton de fermeture. */
  closeLabel?: string;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Modale et panneau latéral — un seul composant, trois placements.
 *
 * Bâti sur Radix, qui fournit ce qu'on rate presque toujours à la main : le
 * piège de focus, le retour du focus au déclencheur à la fermeture, la touche
 * Échap, le verrouillage du défilement de la page, et le masquage du reste du
 * document.
 *
 * **Le masquage passe par `aria-hidden` sur les frères, pas par
 * `aria-modal`.** Ce commentaire annonçait l'attribut ; vérifié au rendu, il
 * n'y est pas — Radix ne le pose plus. Ce n'est pas un manque : `aria-modal`
 * a une histoire de bogues dans les lecteurs d'écran, et masquer réellement
 * le reste du document est la technique plus sûre, celle que l'APG privilégie
 * désormais. Mesuré à l'ouverture : tous les frères du conteneur de la modale
 * portent `aria-hidden="true"`, et la modale n'est elle-même dans aucun
 * conteneur masqué.
 *
 * Le titre est un prop obligatoire, pas un enfant libre : c'est la seule façon
 * de garantir que la modale a un nom accessible.
 *
 * **Pas d'animation d'ouverture.** Il y en avait une, écrite en classes
 * `animate-in` / `animate-out` — sauf que ces classes viennent du plugin
 * `tailwindcss-animate`, qui n'est pas installé. Elles ne produisaient donc
 * RIEN : `animationName` valait `none`, vérifié à l'exécution. Une classe
 * morte est pire qu'une absence, elle laisse croire que le comportement
 * existe. Si une animation devient souhaitable, ce sera une décision
 * explicite, avec la dépendance qui va avec.
 */
export function Dialog({
  trigger,
  title,
  titleHidden = false,
  description,
  children,
  footer,
  placement,
  density,
  open,
  onOpenChange,
  closeLabel = "Fermer",
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-[color-mix(in_oklch,var(--foreground),transparent_45%)]"
          )}
        />
        <DialogPrimitive.Content
          className={cn(contentVariants({ placement, density }), className)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <DialogPrimitive.Title
                className={cn(
                  "text-lg font-bold text-foreground m-0",
                  titleHidden && "sr-only"
                )}
              >
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-sm text-muted-foreground m-0">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className={cn(
                "shrink-0 rounded-[var(--radius)] p-1 text-muted-foreground",
                "hover:text-foreground hover:bg-[var(--surface-hover)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                // 24px de cible visible, portée à 44px par la zone tactile —
                // WCAG 2.5.8 demande 24px au minimum, les doigts en demandent plus.
                "relative after:absolute after:inset-[-10px] after:content-['']"
              )}
              aria-label={closeLabel}
            >
              <span aria-hidden="true" className="block size-6 leading-6 text-center">
                ×
              </span>
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1">{children}</div>

          {footer && <div className="flex gap-3 flex-wrap justify-end">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { contentVariants as dialogVariants, DialogPrimitive };
