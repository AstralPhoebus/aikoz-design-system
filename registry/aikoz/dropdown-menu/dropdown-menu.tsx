import { type ReactNode } from "react";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuAction {
  /** Libellé de la commande. Un VERBE : « Exporter », pas « Export ». */
  label: string;
  onSelect: () => void;
  /** Icône décorative. Le libellé porte le sens, jamais elle. */
  icon?: ReactNode;
  /**
   * Rappel du raccourci clavier — « ⌘E ». Purement indicatif : le menu ne
   * l'installe pas, c'est à l'application de le faire. Affiché en `aria-hidden`
   * pour ne pas être lu au milieu du libellé.
   */
  shortcut?: string;
  disabled?: boolean;
  /**
   * Commande **destructive** : suppression, révocation, envoi irréversible.
   * Elle prend la couleur d'erreur et se place en dernier, après un séparateur.
   * Elle ne devrait jamais agir sans confirmation — voir `Dialog`.
   */
  destructive?: boolean;
}

export interface MenuGroupe {
  /**
   * Intitulé du groupe. Annoncé par `MenuPrimitive.Label`, qui n'est pas un
   * élément focusable : on ne tabule pas dessus.
   */
  label?: string;
  actions: MenuAction[];
}

export interface DropdownMenuProps {
  /**
   * Nom accessible du menu — **obligatoire**. Un tableau de bord en porte un
   * par ligne ; sans nom distinct, un lecteur d'écran annonce vingt fois
   * « menu » et on ne sait plus lequel est ouvert. « Actions sur Orly 4 »,
   * pas « Actions ».
   */
  label: string;
  /**
   * Le déclencheur. S'il est fourni, il est rendu tel quel et reçoit les
   * attributs du menu — donc il doit accepter une `ref` et des props.
   * Sans lui, un bouton d'icône est rendu, nommé par `label`.
   */
  trigger?: ReactNode;
  /** Les commandes, en un seul groupe. Exclusif de `groupes`. */
  actions?: MenuAction[];
  /** Les commandes réparties en groupes séparés par un filet. */
  groupes?: MenuGroupe[];
  /** Côté d'ouverture préféré. Radix le retourne si la place manque. */
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

const ITEM =
  "flex min-h-9 tactile:min-h-11 cursor-pointer select-none items-center gap-2.5 " +
  "rounded-[calc(var(--radius)/2)] px-2.5 text-sm outline-none " +
  "data-[highlighted]:bg-[var(--surface-hover)] " +
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-40";

/**
 * Menu de commandes.
 *
 * **Un menu contient des COMMANDES, pas des liens.** S'il s'agit d'aller
 * ailleurs, c'est de la navigation : `SidebarNav` ou `Breadcrumb`. Le motif
 * `menu` de l'ARIA décrit une liste d'actions sur un objet — « Exporter »,
 * « Archiver », « Supprimer » — et c'est ce qui lui donne son contrat clavier :
 * flèches pour parcourir, `Échap` pour fermer, frappe pour atteindre une entrée
 * par son initiale.
 *
 * Ce contrat est intégralement délégué à Radix. Le réécrire à la main rate
 * presque toujours l'un des quatre points — le plus souvent le retour du focus
 * sur le déclencheur à la fermeture, qui laisse l'utilisateur clavier au début
 * du document.
 *
 * **Le nom est obligatoire.** Un tableau de bord porte un menu par ligne ;
 * « Actions sur Orly 4 » se distingue, « Actions » non.
 *
 * **La commande destructive se place en dernier**, après un filet, et prend la
 * couleur d'erreur — jamais la couleur seule : elle reste la dernière, et son
 * libellé dit ce qu'elle détruit. Elle ne devrait pas agir sans confirmation.
 *
 * **Attention au registre.** Le panneau est rendu dans un `Portal`, donc à la
 * racine du document : il hérite du thème et du registre posés sur `<html>`,
 * pas d'un `data-register` posé sur un sous-arbre. Même réserve que `Select`.
 */
export function DropdownMenu({
  label,
  trigger,
  actions,
  groupes,
  side = "bottom",
  align = "end",
  className,
}: DropdownMenuProps) {
  // Un seul modèle interne : `actions` n'est que le cas à un groupe.
  const blocs: MenuGroupe[] = groupes ?? (actions ? [{ actions }] : []);
  // Les destructives sortent de leur groupe et forment le dernier, toujours.
  const ordinaires = blocs
    .map((g) => ({ ...g, actions: g.actions.filter((a) => !a.destructive) }))
    .filter((g) => g.actions.length);
  const destructives = blocs.flatMap((g) => g.actions.filter((a) => a.destructive));

  const rendreAction = (a: MenuAction) => (
    <MenuPrimitive.Item
      key={a.label}
      disabled={a.disabled}
      onSelect={a.onSelect}
      className={cn(
        ITEM,
        a.destructive
          ? "text-[var(--destructive-text)] data-[highlighted]:bg-[var(--error-subtle)]"
          : "text-[var(--popover-foreground)]",
      )}
    >
      {a.icon && (
        <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
          {a.icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{a.label}</span>
      {a.shortcut && (
        // Indicatif : le menu n'installe pas le raccourci, et le lire au
        // milieu du libellé ferait « Exporter commande E ».
        <span aria-hidden="true" className="shrink-0 text-xs text-muted-foreground">
          {a.shortcut}
        </span>
      )}
    </MenuPrimitive.Item>
  );

  return (
    // `modal={false}` : un menu n'est PAS une boîte de dialogue.
    //
    // En mode modal — le défaut de Radix — l'ouverture pose `aria-hidden` sur
    // tout le reste du document sans le rendre `inert` : l'arrière-plan
    // devient invisible aux technologies d'assistance tout en restant
    // tabulable. axe le refuse à juste titre, « ARIA hidden element must not
    // be focusable », et il a raison sur le fond : on peut tabuler vers un
    // contrôle qui n'est plus annoncé.
    //
    // Le motif ARIA `menu` n'est pas modal de toute façon. Le focus entre dans
    // le menu, `Échap` ferme, un clic dehors ferme — et la page derrière reste
    // défilable, ce qu'on veut dans un tableau de bord.
    <MenuPrimitive.Root modal={false}>
      {/* `asChild` TOUJOURS : sans lui, Radix rend son propre `<button>` et
          notre déclencheur se retrouve imbriqué dedans. axe l'a dit —
          « Interactive controls must not be nested ». Un bouton dans un
          bouton n'a pas de comportement défini, et le clavier en perd un. */}
      <MenuPrimitive.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label={label}
            className={cn(
              "inline-flex size-9 tactile:size-11 items-center justify-center",
              "rounded-[var(--radius)] text-muted-foreground",
              "transition-colors motion-reduce:transition-none",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
              className,
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-4"
              fill="currentColor"
            >
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
        )}
      </MenuPrimitive.Trigger>

      <MenuPrimitive.Portal>
        <MenuPrimitive.Content
          aria-label={label}
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-50 min-w-48 max-w-[min(20rem,calc(100vw-1rem))] overflow-hidden",
            "rounded-[var(--radius)] border border-[var(--border-strong)]",
            "bg-[var(--popover)] p-1 shadow-lg",
          )}
        >
          {ordinaires.map((g, i) => (
            <MenuPrimitive.Group key={g.label ?? i}>
              {i > 0 && (
                <MenuPrimitive.Separator className="-mx-1 my-1 h-px bg-[var(--border)]" />
              )}
              {g.label && (
                <MenuPrimitive.Label className="px-2.5 py-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </MenuPrimitive.Label>
              )}
              {g.actions.map(rendreAction)}
            </MenuPrimitive.Group>
          ))}

          {destructives.length > 0 && (
            <>
              {ordinaires.length > 0 && (
                <MenuPrimitive.Separator className="-mx-1 my-1 h-px bg-[var(--border)]" />
              )}
              {destructives.map(rendreAction)}
            </>
          )}
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
