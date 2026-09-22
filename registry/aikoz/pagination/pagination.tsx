import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationProps {
  /**
   * Nom de la navigation — **obligatoire**. Un tableau de bord en porte
   * souvent plusieurs (le classement, la file d'avis) ; sans nom distinct,
   * un lecteur d'écran les annonce toutes « navigation » et on ne sait plus
   * laquelle on parcourt.
   */
  label: string;
  /** Page courante, à partir de 1. */
  page: number;
  /** Nombre total de pages. En dessous de 2, le composant ne rend rien. */
  pages: number;
  onPageChange: (page: number) => void;
  /**
   * Nombre total d'éléments. Sert le résumé « 41–60 sur 312 », qui répond à
   * la seule question que la pagination pose vraiment : combien il en reste.
   */
  total?: number;
  /** Éléments par page. Requis avec `total` pour calculer la tranche. */
  parPage?: number;
  /**
   * Nombre de pages voisines montrées de part et d'autre de la courante.
   * 1 donne `1 … 4 5 6 … 20`.
   */
  voisines?: number;
  className?: string;
}

// ─── Fenêtre de pages ─────────────────────────────────────────────────────────

/**
 * Les numéros à rendre, avec `null` pour une coupure.
 *
 * La fenêtre garde une **largeur constante** : sans ça, la barre change de
 * taille en naviguant et les boutons se déplacent sous le doigt. C'est le
 * défaut le plus courant du motif — on calcule `page ± voisines`, et la
 * fenêtre rétrécit aux extrémités parce qu'une moitié tombe hors bornes.
 */
export function fenetre(page: number, pages: number, voisines = 1): Array<number | null> {
  // Première, dernière, deux coupures, la courante et ses voisines.
  const largeur = voisines * 2 + 5;
  if (pages <= largeur) return Array.from({ length: pages }, (_, i) => i + 1);

  const bloc = (de: number, a: number) =>
    Array.from({ length: a - de + 1 }, (_, i) => de + i);

  // Près du DÉBUT : la coupure de gauche n'aurait rien à cacher. On la retire
  // et on montre d'autant plus de numéros à droite — c'est ce report qui
  // garde la largeur constante.
  if (page <= voisines + 2) return [...bloc(1, voisines * 2 + 3), null, pages];

  // Près de la FIN, symétriquement.
  if (page >= pages - voisines - 1)
    return [1, null, ...bloc(pages - voisines * 2 - 2, pages)];

  return [1, null, ...bloc(page - voisines, page + voisines), null, pages];
}

// ─── Composant ────────────────────────────────────────────────────────────────

const CASE =
  "inline-flex min-h-9 min-w-9 tactile:min-h-11 tactile:min-w-11 items-center " +
  "justify-center rounded-[var(--radius)] px-2 text-sm tabular-nums " +
  "transition-colors motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

/**
 * Pagination.
 *
 * **Un `<nav>` nommé, une liste, et des `<button>`** — pas des liens. Dans un
 * tableau de bord, changer de page ne change pas d'URL : annoncer un lien
 * promettrait une navigation qui n'aura pas lieu, et casserait l'ouverture
 * dans un nouvel onglet sur laquelle certains comptent.
 *
 * **La page courante n'est pas un bouton.** C'est le même raisonnement que le
 * dernier niveau d'un fil d'Ariane : rendre cliquable ce sur quoi on est déjà
 * produit une commande qui ne fait rien, et prive `aria-current="page"` de son
 * support. Elle est rendue en `<span>`.
 *
 * **Le résumé porte l'information, pas les numéros.** « 41–60 sur 312 »
 * répond à la question qu'on se pose vraiment — combien il en reste — là où
 * « page 3 » ne dit rien sans connaître la taille des pages. Il est en
 * `aria-live="polite"` : la liste ne bouge pas assez pour qu'on suive au
 * clavier ce qui vient de changer.
 *
 * **La fenêtre garde une largeur constante.** Sans ça la barre change de
 * taille en naviguant et les boutons se déplacent sous le doigt — le défaut
 * le plus courant du motif, dû à un `page ± voisines` qui rétrécit aux
 * extrémités.
 *
 * Sous 2 pages, le composant ne rend **rien** : une pagination d'une seule
 * page est un contrôle qui occupe de la place sans rien offrir.
 */
export function Pagination({
  label,
  page,
  pages,
  onPageChange,
  total,
  parPage,
  voisines = 1,
  className,
}: PaginationProps) {
  if (pages < 2) return null;

  const cases = fenetre(page, pages, voisines);
  const premier = total != null && parPage != null ? (page - 1) * parPage + 1 : null;
  const dernier =
    total != null && parPage != null ? Math.min(page * parPage, total) : null;

  return (
    <nav
      aria-label={label}
      className={cn("flex min-w-0 flex-wrap items-center gap-3", className)}
    >
      {premier != null && dernier != null && (
        <p role="status" aria-live="polite" className="m-0 text-sm text-muted-foreground">
          {premier.toLocaleString("fr-FR")}–{dernier.toLocaleString("fr-FR")} sur{" "}
          {total!.toLocaleString("fr-FR")}
        </p>
      )}

      <ul className="m-0 flex min-w-0 list-none items-center gap-1 overflow-x-auto p-0">
        <li>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Page précédente"
            className={cn(
              CASE,
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className="size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7.5 2.5 4 6l3.5 3.5" />
            </svg>
          </button>
        </li>

        {cases.map((n, i) =>
          n === null ? (
            <li
              // La coupure est décorative : la liste dit déjà la profondeur, et
              // « points de suspension » lu à voix haute n'apporte rien.
              key={`coupure-${i}`}
              aria-hidden="true"
              className="select-none px-1 text-sm text-muted-foreground"
            >
              …
            </li>
          ) : n === page ? (
            <li key={n}>
              <span
                aria-current="page"
                className={cn(CASE, "bg-primary font-semibold text-primary-foreground")}
              >
                {n}
              </span>
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                onClick={() => onPageChange(n)}
                // Le numéro seul ne dit pas ce qu'on va faire. Le nom accessible
                // le dit en entier ; le libellé visible reste le chiffre.
                aria-label={`Page ${n}`}
                className={cn(CASE, "text-foreground hover:bg-muted")}
              >
                {n}
              </button>
            </li>
          ),
        )}

        <li>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === pages}
            aria-label="Page suivante"
            className={cn(
              CASE,
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className="size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  );
}
