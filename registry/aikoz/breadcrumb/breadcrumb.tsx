import { Fragment, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  /** Absent sur le dernier élément : la page courante n'est pas un lien. */
  href?: string;
  /**
   * Remonte d'un niveau **sans changer d'URL** — cas d'un forage dans une
   * même vue (`GeoDrilldown`). Un `<button>` est alors rendu à la place du
   * lien : ce n'est pas une navigation, et l'annoncer comme telle tromperait.
   * Ignoré si `href` est fourni.
   */
  onClick?: () => void;
  /** Icône décorative — une maison sur la racine, en général. */
  icon?: ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Nom du `<nav>`. « Fil d'Ariane » par défaut. */
  label?: string;
  /**
   * Séparateur. Toujours `aria-hidden` : il est visuel. La structure est
   * portée par la liste ordonnée, que les lecteurs d'écran annoncent déjà
   * « liste de 4 éléments, élément 3 ».
   */
  separator?: ReactNode;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Fil d'Ariane.
 *
 * Un `<nav>` nommé, une `<ol>` — l'ordre porte du sens, ce n'est pas une
 * `<ul>` —, et **le dernier élément n'est pas un lien**. C'est la faute la
 * plus courante du motif : rendre la page courante cliquable produit un lien
 * qui ne mène nulle part, et prive `aria-current="page"` de son support.
 *
 * Le séparateur est décoratif et masqué. Un « / » lu à voix haute entre
 * chaque niveau n'apporte rien : la liste ordonnée dit déjà la profondeur.
 *
 * **Ce composant ne replie pas les niveaux intermédiaires.** Un fil trop long
 * pour sa largeur passe à la ligne. Le repli en « … » est une bonne idée sur
 * un site profond, mais il masque des niveaux à tout le monde pour un
 * problème de place, et il demande son propre contrat clavier — ce sera une
 * variante explicite le jour où une arborescence le justifie.
 */
export function Breadcrumb({
  items,
  label = "Fil d'Ariane",
  separator = "/",
  className,
}: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 list-none m-0 p-0 text-sm">
        {items.map((item, i) => {
          const dernier = i === items.length - 1;
          const contenu = (
            <>
              {item.icon && (
                <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
                  {item.icon}
                </span>
              )}
              {item.label}
            </>
          );

          return (
            <Fragment key={`${item.label}-${i}`}>
              <li className="inline-flex items-center">
                {!dernier && item.onClick && !item.href ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[calc(var(--radius)/2)]",
                      // 24 px est le plancher du critère WCAG 2.2 AA 2.5.8.
                      // Mesuré ici avant correction : 20 px — la hauteur de
                      // ligne de `text-sm`. L'exception « cible dans une
                      // phrase » ne s'applique pas : un fil d'Ariane est une
                      // liste de navigation, pas du texte courant.
                      "min-h-6 tactile:min-h-11 tactile:px-1",
                      // Même soulignement au repos que le lien : c'est le seul
                      // signe qu'on peut agir dessus, et la couleur seule ne
                      // suffit pas (WCAG 1.4.1).
                      "text-muted-foreground underline underline-offset-2",
                      "hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                      "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                    )}
                  >
                    {contenu}
                  </button>
                ) : dernier || !item.href ? (
                  <span
                    // `aria-current="page"` sur un `<span>`, pas sur un lien :
                    // c'est ce qui dit « vous êtes ici » sans promettre une
                    // navigation qui n'aura pas lieu.
                    aria-current={dernier ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      dernier
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {contenu}
                  </span>
                ) : (
                  <a
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[calc(var(--radius)/2)]",
                      // 24 px est le plancher du critère WCAG 2.2 AA 2.5.8.
                      // Mesuré ici avant correction : 20 px — la hauteur de
                      // ligne de `text-sm`. L'exception « cible dans une
                      // phrase » ne s'applique pas : un fil d'Ariane est une
                      // liste de navigation, pas du texte courant.
                      "min-h-6 tactile:min-h-11 tactile:px-1",
                      // Le soulignement est là AU REPOS, pas seulement au
                      // survol : dans un fil d'Ariane rien d'autre ne
                      // distingue un lien d'un simple mot, et la couleur
                      // seule ne suffit pas (WCAG 1.4.1).
                      "text-muted-foreground underline underline-offset-2",
                      "hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                      "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                    )}
                  >
                    {contenu}
                  </a>
                )}
              </li>
              {!dernier && (
                <li aria-hidden="true" className="text-muted-foreground select-none">
                  {separator}
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
