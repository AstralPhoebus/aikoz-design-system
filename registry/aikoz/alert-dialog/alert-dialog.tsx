import { type ReactNode } from "react";
import * as AlertPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@registry/aikoz/lib/utils";
import { Button } from "@registry/aikoz/button/button";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertDialogProps {
  /**
   * La question, sous forme de question — « Supprimer Orly 4 ? », pas
   * « Confirmation ». Un titre qui ne dit pas ce qui va arriver oblige à lire
   * le corps, et personne ne lit le corps d'une boîte de dialogue.
   */
  title: string;
  /**
   * **Obligatoire** — ce qui va arriver, et ce qui est irréversible.
   * `role="alertdialog"` exige une description : c'est elle que les lecteurs
   * d'écran annoncent juste après le titre, et sans elle l'alerte n'annonce
   * que son bouton.
   */
  description: string;
  /**
   * Libellé de la commande qui agit. **Il nomme ce qu'il fait** — « Supprimer
   * l'établissement », jamais « Confirmer » ni « OK ». Un utilisateur qui
   * arrive en milieu de tâche doit pouvoir décider en lisant le seul bouton.
   */
  confirmLabel: string;
  onConfirm: () => void;
  /** Libellé du retrait. « Annuler » par défaut. */
  cancelLabel?: string;
  onCancel?: () => void;
  /**
   * L'action est-elle destructive ? Elle prend alors la couleur d'erreur —
   * qui ne porte jamais seule : le titre et le libellé disent déjà ce qui
   * disparaît.
   */
  destructive?: boolean;
  /** Déclencheur. Sans lui, le composant est piloté par `open`. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Contenu supplémentaire entre la description et les commandes. */
  children?: ReactNode;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Confirmation d'une action irréversible.
 *
 * **Ce n'est pas un `Dialog`**, et la différence n'est pas cosmétique :
 *
 * | | `Dialog` | `AlertDialog` |
 * | --- | --- | --- |
 * | rôle ARIA | `dialog` | **`alertdialog`** |
 * | clic à l'extérieur | ferme | **ne ferme pas** |
 * | `Échap` | ferme | ferme, et c'est le retrait |
 * | description | facultative | **obligatoire** |
 * | focus à l'ouverture | premier élément | **le retrait** |
 *
 * `role="alertdialog"` dit aux technologies d'assistance qu'il s'agit d'une
 * interruption qui attend une décision, et fait annoncer la description juste
 * après le titre. C'est le seul rôle ARIA qui l'obtient.
 *
 * **Le focus va sur le retrait, pas sur l'action.** Une boîte qui demande de
 * confirmer une suppression et pose le focus sur « Supprimer » transforme une
 * barre d'espace réflexe en perte de données. Le défaut sûr est de ne rien
 * faire.
 *
 * **Le clic à l'extérieur ne ferme pas.** Un retrait par inadvertance n'est
 * pas grave ; ce qui l'est, c'est de croire avoir annulé. La décision est
 * explicite dans les deux sens.
 *
 * **Le bouton nomme ce qu'il fait.** « Supprimer l'établissement », jamais
 * « Confirmer » : quelqu'un qui revient à son écran après une interruption
 * doit pouvoir décider en lisant le seul bouton.
 */
export function AlertDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel = "Annuler",
  onCancel,
  destructive = false,
  trigger,
  open,
  onOpenChange,
  children,
  className,
}: AlertDialogProps) {
  return (
    <AlertPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertPrimitive.Trigger asChild>{trigger}</AlertPrimitive.Trigger>}
      <AlertPrimitive.Portal>
        <AlertPrimitive.Overlay className="fixed inset-0 z-40 bg-[color-mix(in_oklch,var(--foreground),transparent_45%)]" />
        <AlertPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "flex w-[calc(100vw-2rem)] max-w-md min-w-0 flex-col gap-4",
            "max-h-[calc(100dvh-2rem)] overflow-y-auto p-6",
            "rounded-[var(--radius)] border border-border bg-[var(--card)]",
            "text-[var(--card-foreground)] shadow-lg",
            className,
          )}
        >
          <AlertPrimitive.Title className="m-0 font-heading text-lg font-bold text-foreground">
            {title}
          </AlertPrimitive.Title>

          {/* Obligatoire : `alertdialog` sans description n'annonce que son
              bouton, et l'interruption perd son motif. */}
          <AlertPrimitive.Description className="m-0 text-sm text-muted-foreground">
            {description}
          </AlertPrimitive.Description>

          {children}

          <div className="flex flex-wrap justify-end gap-2">
            {/* Le RETRAIT en premier dans le DOM : c'est lui que Radix met au
                focus à l'ouverture, et c'est le défaut sûr. */}
            <AlertPrimitive.Cancel asChild>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                {cancelLabel}
              </Button>
            </AlertPrimitive.Cancel>
            <AlertPrimitive.Action asChild>
              <Button
                size="sm"
                onClick={onConfirm}
                className={cn(
                  // Pas de rôle `destructive-hover` dans le système : on
                  // assombrit par un mélange plutôt que d'inventer un token
                  // que rien d'autre ne consommerait.
                  destructive &&
                    "bg-[var(--destructive)] text-[var(--destructive-foreground)] " +
                      "hover:bg-[color-mix(in_oklch,var(--destructive),black_12%)]",
                )}
              >
                {confirmLabel}
              </Button>
            </AlertPrimitive.Action>
          </div>
        </AlertPrimitive.Content>
      </AlertPrimitive.Portal>
    </AlertPrimitive.Root>
  );
}
