import { Fragment, useId, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { NavItem, type NavItemProps } from "@registry/aikoz/nav-item/nav-item";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarNavEntry extends Omit<NavItemProps, "current"> {
  /** Identifiant de l'entrée, comparé à `current`. */
  id: string;
}

export interface SidebarNavGroup {
  /**
   * Intitulé du groupe. Il NOMME la liste par `aria-labelledby`, il n'ouvre
   * pas une section : un groupe sans nom n'est qu'un trait horizontal, et un
   * lecteur d'écran ne perçoit pas le trait.
   */
  label: string;
  labelHidden?: boolean;
  entries: SidebarNavEntry[];
}

export interface SidebarNavProps {
  /**
   * Nom de la barre — **obligatoire**. Une page comporte plusieurs `<nav>`
   * (barre latérale, fil d'Ariane, pied de page) ; sans nom distinct, un
   * lecteur d'écran les annonce toutes « navigation » et l'utilisateur ne
   * sait pas dans laquelle il vient d'atterrir.
   */
  label: string;
  /** Entrées à plat. Ignoré si `groups` est fourni. */
  entries?: SidebarNavEntry[];
  /** Entrées groupées sous des intitulés. */
  groups?: SidebarNavGroup[];
  /** `id` de l'entrée correspondant à la page affichée. */
  current?: string;
  /** En-tête de la barre : logo, sélecteur de compte. */
  header?: ReactNode;
  /** Pied de la barre : profil, déconnexion. */
  footer?: ReactNode;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Barre de navigation latérale — transposée du composant Figma `Sidebar`,
 * retenue par la décision 2 de l'inventaire.
 *
 * **Ce n'est pas un cousin de `ViewTabs`, et les deux ne se mutualisent pas.**
 * Cette barre navigue entre SECTIONS : elle change la route, donc elle rend
 * des liens dans un `<nav>`, avec `aria-current="page"` et une tabulation
 * lien après lien. `ViewTabs` échange un panneau à l'intérieur d'une page :
 * `role="tablist"`, `aria-selected`, flèches. Implémenter l'un avec la
 * sémantique de l'autre annonce à un lecteur d'écran un panneau qui va
 * s'échanger alors que la page entière est remplacée — c'est l'un des défauts
 * d'accessibilité les plus répandus. Ils partagent les tokens, pas le code.
 *
 * **Ce que ce composant ne fait pas, volontairement** : il ne gère ni le repli
 * en icônes, ni le passage en tiroir sur mobile. Les deux dépendent du gabarit
 * de page — de la largeur disponible, de ce qui occupe le reste de l'écran —
 * et non de la barre. Sur petit écran, l'appelant la monte dans un `Dialog`
 * en placement `right`, qui apporte déjà le piège de focus et le retour du
 * focus au déclencheur.
 */
export function SidebarNav({
  label,
  entries,
  groups,
  current,
  header,
  footer,
  className,
}: SidebarNavProps) {
  const uid = useId();
  const blocs: SidebarNavGroup[] =
    groups ?? (entries ? [{ label, labelHidden: true, entries }] : []);

  return (
    <nav
      aria-label={label}
      className={cn(
        "flex flex-col gap-4 w-full sm:w-60 shrink-0",
        "bg-[var(--nav-surface)] p-3",
        // `--border`, et non `--border-strong`.
        //
        // Le choix précédent reposait sur une MAUVAISE MÉTRIQUE — la même que
        // celle déjà corrigée sur la palette des graphiques. Il disait : « la
        // surface de la barre ne se détache de la page que de 1,09:1, c'est
        // donc ce trait qui délimite la région ». Mais 1,09 est un ratio WCAG,
        // fait pour poser du texte sur un fond, pas pour comparer deux
        // surfaces voisines — près du noir il s'écrase quelle que soit la
        // différence réelle.
        //
        // Mesurée à la bonne échelle, l'écart perceptuel entre la barre et la
        // page vaut ΔE 0,030 en clair et 0,082 en sombre : la surface fait
        // déjà une partie du travail. Et le trait fort pesait ΔE 0,43 contre
        // la barre — trois fois et demie la bordure standard. D'où l'effet de
        // trait posé par-dessus le dessin.
        //
        // `--border` donne ΔE 0,12, encore six fois le seuil où deux tons se
        // distinguent. Le séparateur de région n'est ni un composant
        // d'interface ni un objet graphique nécessaire à la compréhension :
        // WCAG 1.4.11 ne lui impose pas 3:1, c'est le landmark `nav` et ses
        // liens qui identifient la région.
        "border-r border-border",
        className
      )}
    >
      {header && <div className="px-1">{header}</div>}

      {blocs.map((bloc, i) => (
        <Fragment key={bloc.label}>
          {/* Le trait entre deux groupes est décoratif — il double l'intitulé,
              il ne le remplace pas. D'où `--nav-border`, discret et assumé. */}
          {i > 0 && <hr className="border-0 border-t border-[var(--nav-border)] m-0" />}
          <div className="flex flex-col gap-1">
            {/* Un `<span>`, pas un `<h2>` — même raison que l'absence de
                `CardTitle` dans `Card` : le niveau de titre dépend du plan de
                la PAGE, pas du composant. Un `h2` figé ici s'insérerait dans
                l'outline du document au même rang que les sections de
                contenu, et casserait la hiérarchie dès qu'une page en décide
                autrement. `aria-labelledby` donne au groupe son nom sans
                toucher au plan. */}
            <span
              id={`${uid}-groupe-${i}`}
              className={cn(
                "px-4 text-xs font-semibold uppercase tracking-wider text-[var(--nav-on-muted)]",
                bloc.labelHidden && "sr-only"
              )}
            >
              {bloc.label}
            </span>
            {/* `<ul>` : le nombre d'entrées est annoncé à l'entrée de la liste
                (« liste de 4 éléments »), ce qu'une suite de `<a>` ne dit pas. */}
            <ul
              aria-labelledby={`${uid}-groupe-${i}`}
              className="flex flex-col gap-0.5 list-none m-0 p-0"
            >
              {bloc.entries.map((e) => {
                const { id, ...reste } = e;
                return (
                  <li key={id}>
                    <NavItem {...reste} current={id === current} />
                  </li>
                );
              })}
            </ul>
          </div>
        </Fragment>
      ))}

      {footer && <div className="mt-auto px-1">{footer}</div>}
    </nav>
  );
}
