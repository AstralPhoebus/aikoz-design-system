import { type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { Skeleton } from "@registry/aikoz/skeleton/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc";

export interface TableSort {
  key: string;
  direction: SortDirection;
}

export interface TableColumn<T> {
  key: string;
  /** En-tête de colonne. Court : il est relu à chaque cellule par un
   *  lecteur d'écran en mode tableau. */
  /**
   * Nom de la colonne. **Obligatoire, et toujours du texte** : c'est lui qui
   * nomme la cellule pour un lecteur d'écran, et il ne peut donc pas être un
   * pictogramme.
   */
  header: string;
  /**
   * Rendu VISUEL de l'en-tête — une icône au-dessus du nom, par exemple.
   *
   * Il complète `header`, il ne le remplace pas : la relation `scope="col"`
   * continue de porter le texte. Ce qu'on met ici est décoratif par
   * construction, et doit l'être par déclaration (`aria-hidden`).
   */
  headerCell?: ReactNode;
  /** Rendu de la cellule. Par défaut, la valeur brute de `row[key]`. */
  cell?: (row: T) => ReactNode;
  /**
   * Colonne de nombres : alignée à droite et en chiffres tabulaires, pour
   * que les unités s'empilent et que la comparaison verticale soit possible.
   */
  numeric?: boolean;
  /** Rend l'en-tête cliquable et pose `aria-sort`. */
  sortable?: boolean;
  /** Largeur CSS imposée — `"12rem"`, `"25%"`. */
  width?: string;
}

export interface TableProps<T> {
  /**
   * Ce que le tableau contient — **obligatoire**. C'est son nom accessible,
   * et c'est ce qui permet de savoir dans quel tableau on est quand une page
   * en porte plusieurs. Rendu en `<caption>`, donc lié nativement, sans
   * `aria-label` à maintenir en double.
   */
  caption: string;
  /** Masque la légende visuellement. Elle reste lue. */
  captionHidden?: boolean;
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  /**
   * Colonne qui NOMME la ligne — le libellé d'agence, le nom d'aéroport.
   * Elle est rendue en `<th scope="row">`, ce qui fait annoncer « Amsterdam,
   * taux de réponse, 94 % » au lieu de « 94 % » tout court quand on navigue
   * de cellule en cellule.
   */
  rowHeaderKey?: string;
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
  /** Affiche des lignes d'attente à la place des données. */
  loading?: boolean;
  /** Nombre de lignes d'attente. */
  loadingRows?: number;
  /** Rendu quand `rows` est vide — un `EmptyState`, en général. */
  empty?: ReactNode;
  /**
   * `compact` pour un tableau de CHIFFRES qu'on parcourt du regard,
   * `default` pour la lecture courante, `large` quand chaque cellule porte
   * un CONTRÔLE — une matrice de droits, une grille de réglages.
   *
   * Ce n'est pas un réglage d'esthétique : une case à 56 px de haut laisse
   * la place d'une cible de 44 px et de son anneau de focus, ce que 38 px ne
   * permet pas. La densité suit ce que la cellule contient.
   */
  density?: "compact" | "default" | "large";
  /**
   * Pose la colonne d'en-têtes de ligne sur une surface distincte.
   *
   * Sur une grille large — six colonnes de marqueurs identiques — l'œil perd
   * sa ligne en parcourant vers la droite. Un fond sourd sur la colonne qui
   * NOMME la ligne l'ancre. Sans `rowHeaderKey`, ce prop ne fait rien : il
   * n'y a pas de colonne à ancrer.
   */
  rowHeaderSurface?: boolean;
  /**
   * Trace un filet entre les COLONNES.
   *
   * Inutile sur un tableau qu'on lit ligne par ligne — il ajoute du bruit et
   * Tufte aurait raison de le dire. Nécessaire dès qu'on lit aussi en
   * COLONNE : une matrice de droits se parcourt dans les deux sens, et sept
   * colonnes de marqueurs identiques sans séparation se confondent.
   *
   * La règle : filets verticaux si et seulement si les deux axes portent du
   * sens.
   */
  columnRules?: boolean;
  /**
   * `auto` (défaut) — chaque colonne prend la largeur de son contenu. C'est
   * ce qu'on veut d'un tableau de texte : un nom long a la place, un code
   * court ne la gaspille pas.
   *
   * `fixed` — les colonnes SANS `width` déclarée se partagent le reste à
   * parts égales.
   *
   * La règle qui tranche : **des colonnes qui portent le même contenu
   * doivent avoir la même largeur.** Sur une matrice de droits, la largeur
   * suivait la longueur de l'intitulé — mesuré 165 px pour « Gestionnaire
   * POI » contre 84 px pour « Rôle 5 », presque du simple au double pour
   * deux colonnes qui contiennent le même interrupteur. Une différence de
   * largeur se lit comme une différence de sens.
   */
  layout?: "auto" | "fixed";
  className?: string;
}

// ─── Sous-éléments ────────────────────────────────────────────────────────────

/** Deux chevrons superposés : l'actif est plein, l'autre effacé. La direction
 *  ne tient donc pas à la seule couleur — la FORME diffère. */
function Fleche({ direction }: { direction?: SortDirection }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 12"
      className="size-2.5 shrink-0"
      fill="currentColor"
    >
      <path d="M5 0.5 8 4H2z" opacity={direction === "asc" ? 1 : 0.3} />
      <path d="M5 11.5 2 8h6z" opacity={direction === "desc" ? 1 : 0.3} />
    </svg>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Tableau de données.
 *
 * Un vrai `<table>`, pas une grille CSS de `div`. Ce n'est pas une question
 * de goût : les balises de tableau portent des RELATIONS que rien ne remplace.
 * Un lecteur d'écran en mode tableau annonce, à chaque déplacement, l'en-tête
 * de colonne et l'en-tête de ligne de la cellule où il arrive — « Amsterdam,
 * taux de réponse, 94 % ». Une grille de `div` ne donne que « 94 % », et
 * l'utilisateur doit compter les colonnes de tête.
 *
 * Trois choses que ce composant fait et qu'on oublie presque toujours :
 *
 * 1. **`<caption>` plutôt qu'`aria-label`.** La légende est visible par
 *    défaut, liée nativement, et ne peut pas se désynchroniser d'un titre
 *    voisin. `captionHidden` la masque quand la mise en page l'exige.
 * 2. **Le conteneur qui défile est focusable.** Un tableau plus large que son
 *    cadre défile horizontalement ; sans `tabIndex={0}` sur le conteneur, la
 *    partie hors champ est inatteignable au clavier — on ne peut pas faire
 *    défiler ce sur quoi on ne peut pas se poser. Il porte `role="region"` et
 *    un nom, sinon ce nouvel arrêt de tabulation serait muet.
 * 3. **Le tri s'annonce par `aria-sort` sur le `<th>`**, pas par une icône.
 *    Le bouton reste dans l'en-tête plutôt que d'être l'en-tête lui-même :
 *    un `<th>` cliquable sans bouton n'est ni focusable ni actionnable au
 *    clavier.
 */
export function Table<T>({
  caption,
  captionHidden = false,
  columns,
  rows,
  getRowKey,
  rowHeaderKey,
  sort,
  onSortChange,
  loading = false,
  loadingRows = 5,
  empty,
  density = "default",
  rowHeaderSurface = false,
  columnRules = false,
  layout = "auto",
  className,
}: TableProps<T>) {
  const cellule =
    density === "compact" ? "px-3 py-2" : density === "large" ? "px-4 py-4" : "px-4 py-3";

  function trier(key: string) {
    const direction: SortDirection =
      sort?.key === key && sort.direction === "asc" ? "desc" : "asc";
    onSortChange?.({ key, direction });
  }

  const vide = !loading && rows.length === 0;

  return (
    <div
      // `role="region"` + nom + `tabIndex` : les trois vont ensemble. Sans le
      // nom, un lecteur d'écran annonce « région » sans dire laquelle ; sans
      // `tabIndex`, le débordement horizontal est inatteignable au clavier.
      role="region"
      aria-label={caption}
      tabIndex={0}
      // `aria-busy` porté UNE fois par le conteneur, pas par chaque squelette :
      // c'est le tableau qui charge, pas quatorze rectangles.
      aria-busy={loading || undefined}
      className={cn(
        // `min-w-0` avec `overflow-x-auto`, toujours : un élément de flex ou de
        // grille vaut `min-width: auto` et ne rétrécit pas sous son contenu. Sans
        // lui, le conteneur s'élargit au lieu de défiler, et c'est la PAGE qui
        // finit par défiler à sa place.
        // `relative` n'est PAS décoratif : sans lui, ce conteneur est en
        // `position: static` et ne sert de bloc conteneur à personne. Tout
        // descendant `sr-only` — le `<caption>` masqué, l'étiquette d'un
        // `Switch` dans une cellule — est en `position: absolute` et prend
        // alors la PAGE pour référence. Il sort du conteneur de défilement,
        // et un tableau large pousse le document à l'horizontale au lieu de
        // défiler chez lui. Mesuré : 238 px de débordement à 375 px de large
        // sur une matrice de six colonnes à interrupteurs.
        "relative w-full min-w-0 overflow-x-auto rounded-[var(--radius)] border border-border bg-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className
      )}
    >
      <table
        className={cn(
          "w-full border-collapse text-sm",
          layout === "fixed" && "table-fixed",
        )}
      >
        <caption
          className={cn(
            "text-left text-sm text-muted-foreground",
            captionHidden ? "sr-only" : cellule
          )}
        >
          {caption}
        </caption>

        <thead>
          {/* Le trait sous l'en-tête est PORTEUR, pas décoratif : il sépare
              les noms de colonnes de rangées de cellules qui se ressemblent.
              `--border-strong` tient 3:1 contre la carte, `--border` non. */}
          <tr className="border-b-2 border-[var(--border-strong)]">
            {columns.map((c) => {
              const actif = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  // `aria-sort` ne va que sur la colonne triée : le poser à
                  // « none » partout ferait annoncer « non trié » sur chaque
                  // en-tête, à chaque parcours.
                  aria-sort={
                    actif
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  style={c.width ? { width: c.width } : undefined}
                  className={cn(
                    cellule,
                    "font-semibold text-foreground",
                    // Un en-tête riche s'aligne en HAUT, jamais en bas. Collé
                    // au bas, un libellé qui passe sur deux lignes pousse son
                    // pictogramme vers le haut : mesuré 18 px d'écart entre
                    // « Gestionnaire POI » et « Directeur », et une rangée
                    // d'icônes en escalier. Aligné en haut, les pictogrammes
                    // forment une ligne et les libellés démarrent tous au même
                    // endroit.
                    c.headerCell ? "align-top" : "align-bottom",
                    columnRules && "border-l border-border first:border-l-0",
                    c.numeric ? "text-right" : c.headerCell ? "text-center" : "text-left"
                  )}
                >
                  {c.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => trier(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 min-h-6 rounded-[calc(var(--radius)/2)]",
                        "font-semibold hover:text-[var(--secondary)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                        c.numeric && "flex-row-reverse"
                      )}
                    >
                      {c.header}
                      <Fleche direction={actif ? sort.direction : undefined} />
                    </button>
                  ) : (
                    (c.headerCell ?? c.header)
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {loading &&
            Array.from({ length: loadingRows }, (_, i) => (
              <tr key={`attente-${i}`} className="border-b border-border last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className={cellule}>
                    <Skeleton shape="text" className={c.numeric ? "w-12 ml-auto" : "w-4/5"} />
                  </td>
                ))}
              </tr>
            ))}

          {vide && (
            <tr>
              {/* `colSpan` sur toute la largeur : une cellule vide par colonne
                  ferait annoncer autant de cellules vides. */}
              <td colSpan={columns.length} className="p-0">
                {empty}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((row, i) => (
              <tr
                key={getRowKey(row, i)}
                className="border-b border-border last:border-0 hover:bg-[var(--surface-hover)]"
              >
                {columns.map((c) => {
                  const contenu = c.cell
                    ? c.cell(row)
                    : ((row as Record<string, unknown>)[c.key] as ReactNode);
                  const classes = cn(
                    cellule,
                    columnRules && "border-l border-border first:border-l-0",
                    // Chiffres tabulaires : sans eux, les colonnes de nombres
                    // ne s'alignent pas verticalement et la comparaison d'une
                    // ligne à l'autre demande de relire chiffre par chiffre.
                    c.numeric ? "text-right tabular-nums" : "text-left"
                  );
                  return c.key === rowHeaderKey ? (
                    <th
                      key={c.key}
                      scope="row"
                      className={cn(
                        classes,
                        "font-medium text-foreground",
                        rowHeaderSurface && "bg-[var(--muted)]",
                      )}
                    >
                      {contenu}
                    </th>
                  ) : (
                    <td key={c.key} className={cn(classes, "text-foreground")}>
                      {contenu}
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
