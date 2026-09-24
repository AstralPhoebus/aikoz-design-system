import { useId, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { Card } from "@registry/aikoz/card/card";
import { CountBadge, type CountBadgeTone } from "@registry/aikoz/count-badge/count-badge";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KanbanColumn {
  key: string;
  /** Titre de la colonne. Il NOMME la section : `aria-labelledby` pointe dessus. */
  title: string;
  /** Ce que la colonne contient, et ce qu'on attend de l'utilisateur. */
  subtitle: string;
  /**
   * Pilote le liseré ET le compteur — une seule décision, pas deux.
   *
   * Le ton dit l'urgence, jamais autre chose : `info` ce qui attend,
   * `warning` ce qui cloche, `error` ce qui presse. Une colonne dont le ton
   * ne dit rien prend `primary`.
   */
  tone: CountBadgeTone;
  /**
   * Compte affiché. Séparé du contenu **volontairement** : une colonne peut
   * n'en rendre qu'une partie (« Voir plus »), et c'est le total qui compte.
   */
  count: number;
  /** Le corps de la colonne. Le tableau décide de ses cartes. */
  children: ReactNode;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  className?: string;
}

/** Le liseré reprend la couleur du ton : une décision, pas deux. */
const LISERE: Record<CountBadgeTone, string> = {
  primary: "--primary",
  info: "--info",
  warning: "--warning",
  error: "--destructive-text",
};

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Tableau à colonnes.
 *
 * **Ce qu'il fait, et que rien d'autre ne fait** : il tient le contrat de
 * structure d'un tableau à colonnes, quel que soit ce qu'on y met.
 *
 * - chaque colonne est une `section` NOMMÉE par son titre (`aria-labelledby`),
 *   donc atteignable au repère par un lecteur d'écran ;
 * - le compte est un `CountBadge` étiqueté, jamais un nombre nu ;
 * - le liseré et le compteur partagent la couleur du ton, sans qu'on puisse
 *   les désaccorder ;
 * - une colonne par ligne sous `md`, où trois colonnes côte à côte ne se
 *   lisent plus.
 *
 * **Il ne décide de rien d'autre.** Les cartes sont fournies par l'appelant :
 * une file de réponses et un circuit de validation n'affichent pas les mêmes
 * choses, et le jour où ils divergeraient dans un composant unique, c'est ce
 * composant qui deviendrait illisible.
 *
 * `ResponseKanban` est bâti dessus — c'est le même tableau, avec trois
 * colonnes qu'il connaît.
 *
 * ## Le gabarit d'en-tête n'est pas un composant
 *
 * Liseré + titre + sous-titre + compteur est reproduit ici en JSX. Louis a
 * tranché le 10/09/2026 que « En-tête de section » est un GABARIT de mise en
 * page et non un composant de bibliothèque ; on suit cette décision.
 */
export function KanbanBoard({ columns, className }: KanbanBoardProps) {
  const uid = useId();

  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-4",
        // Le nombre de colonnes suit la donnée, sans classe conditionnelle
        // à écrire : `md:grid-cols-2` et `md:grid-cols-3` ne se génèrent pas
        // dynamiquement en Tailwind, mais une variable CSS, si.
        "md:[grid-template-columns:repeat(var(--kanban-colonnes),minmax(0,1fr))]",
        className,
      )}
      style={{ "--kanban-colonnes": columns.length } as React.CSSProperties}
    >
      {columns.map((c) => {
        const titreId = `${uid}-${c.key}`;
        return (
          <Card
            key={c.key}
            as="section"
            aria-labelledby={titreId}
            surface="flat"
            density="compact"
            className="gap-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex min-w-0 flex-col gap-0.5 border-l-4 pl-3"
                style={{ borderColor: `var(${LISERE[c.tone]})` }}
              >
                <h3 id={titreId} className="m-0 text-sm font-semibold text-foreground">
                  {c.title}
                </h3>
                <p className="m-0 text-xs text-muted-foreground">{c.subtitle}</p>
              </div>
              <CountBadge
                value={c.count}
                variant="count"
                tone={c.tone}
                label={`éléments dans « ${c.title} »`}
              />
            </div>
            {c.children}
          </Card>
        );
      })}
    </div>
  );
}
