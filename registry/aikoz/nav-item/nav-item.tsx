import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItemProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  /** Libellé de l'entrée. Toujours visible : cf. la note du composant. */
  label: string;
  /** Icône décorative. Le libellé porte le sens, jamais elle. */
  icon?: ReactNode;
  /**
   * Entrée correspondant à la page affichée. Pose `aria-current="page"`, que
   * les lecteurs d'écran annoncent — c'est le seul canal non visuel de l'état.
   */
  current?: boolean;
  /**
   * Compteur en fin de ligne : avis en attente, alertes. Le nombre est intégré
   * au nom accessible du lien, sinon il n'est qu'une pastille muette.
   */
  count?: number;
  /** Nom donné au compteur dans l'énoncé. « 3 en attente » par défaut. */
  countLabel?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Entrée de navigation — brique de `SidebarNav`, transposée du composant Figma
 * `NavItem` (3 états : défaut, actif, survol).
 *
 * C'est un `<a>`, jamais un `<button>` : cette entrée **change de route**. Un
 * bouton s'annonce comme une action dans la page, ce qui trompe sur ce qui va
 * se passer, et prive l'utilisateur de tout ce qu'un lien lui doit — ouvrir
 * dans un onglet, copier l'adresse, revenir en arrière.
 *
 * **L'état courant ne tient jamais à la couleur seule** (WCAG 1.4.1). Il est
 * porté par trois canaux qui se doublent : `aria-current="page"` pour
 * l'annonce, un **trait vertical** en `--nav-accent`, et la **graisse** du
 * libellé. Le voile de fond ne compte pas dans le lot : mesuré à 1,19:1 en
 * clair et 1,07:1 en sombre, il est décoratif — c'est le même piège que le
 * survol des boutons, la teinte se déplace sans que la clarté bouge.
 *
 * Le libellé reste visible même quand une icône l'accompagne. Une barre
 * réduite aux icônes fait porter le sens à des pictogrammes que personne ne
 * décode de la même façon ; si le pli l'impose un jour, ce sera une variante
 * explicite, avec une infobulle ET un `aria-label`.
 */
export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  function NavItem(
    { label, icon, current = false, count, countLabel, className, ...props },
    ref
  ) {
    const compte =
      count !== undefined
        ? `${count} ${countLabel ?? "en attente"}`
        : undefined;

    return (
      <a
        ref={ref}
        // `page` et non `true` : la valeur dit DE QUOI l'élément est le
        // courant. `aria-current="page"` s'annonce « page courante » ;
        // `true` s'annonce « courant », ce qui ne renseigne sur rien.
        aria-current={current ? "page" : undefined}
        // Nom composé en UNE chaîne, et non par un `sr-only` séparé :
        // l'algorithme de nom accessible joint les éléments par une espace,
        // ce qui donnait « Campagnes , 3 en attente » — une virgule
        // détachée, et une pause à la lecture. Le nom contient toujours le
        // libellé visible, ce qu'exige WCAG 2.5.3.
        aria-label={compte ? `${label}, ${compte}` : undefined}
        className={cn(
          "group relative flex items-center gap-3 no-underline",
          // 44px de haut : la cible confortable, bien au-delà des 24px
          // exigés par WCAG 2.5.8. Une entrée de menu se vise vite.
          "min-h-11 pl-4 pr-3 py-2 rounded-[var(--radius)]",
          "text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nav-surface)]",
          current
            ? "font-semibold text-[var(--nav-on)] bg-[var(--nav-surface-active)]"
            : "font-medium text-[var(--nav-on-muted)] hover:text-[var(--nav-on)] hover:bg-[var(--nav-surface-active)]",
          className
        )}
        {...props}
      >
        {/* Le trait de l'entrée courante. En absolu et non en `border-left` :
            une bordure conditionnelle décalerait le libellé de 3px à chaque
            changement de page. `--nav-accent` vaut ultramarine en clair et
            aquamarine en sombre — 5,77:1 et 15,08:1 sur la barre. */}
        {current && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--nav-accent)]"
          />
        )}

        {icon && (
          <span aria-hidden="true" className="shrink-0 inline-flex size-5 items-center justify-center">
            {icon}
          </span>
        )}

        <span className="flex-1 min-w-0 truncate">{label}</span>

        {count !== undefined && (
          // La pastille est muette : le compte est porté par `aria-label`,
          // sinon le nombre n'est qu'une tache colorée que rien n'annonce.
          <span
              aria-hidden="true"
              className={cn(
                "shrink-0 inline-flex items-center justify-center",
                "min-w-5 h-5 px-1.5 rounded-full text-2xs font-semibold tabular-nums",
                "bg-[var(--nav-accent)] text-[var(--nav-surface)]"
              )}
            >
            {count}
          </span>
        )}
      </a>
    );
  }
);
