import { type ElementType, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /**
   * Ce qu'il n'y a pas, dit en clair : « Aucun avis sur cette période ».
   * Pas « Rien à afficher », qui ne dit ni quoi ni pourquoi.
   */
  title: string;
  /**
   * Élément rendu pour le titre. `p` par défaut, **volontairement** : le
   * niveau de titre dépend du plan de la page, pas du composant — même
   * raison que l'absence de `CardTitle` dans `Card`. Passer `h2`/`h3` quand
   * l'état vide remplace une région qui portait déjà un titre de ce rang.
   */
  titleAs?: "p" | "h2" | "h3" | "h4";
  /**
   * Ce qu'on peut faire pour y remédier. La règle : un état vide qui
   * n'indique pas la sortie est un cul-de-sac. « Élargissez la période ou
   * retirez le filtre par source. »
   */
  description?: string;
  /** Illustration ou icône. Décorative : le texte porte tout le sens. */
  icon?: ReactNode;
  /** Action principale — un `Button`, en général. */
  action?: ReactNode;
  /** Action secondaire, en retrait. */
  secondaryAction?: ReactNode;
  /**
   * `default` — un vide normal, attendu : aucun résultat sur ce filtre.
   * `error` — un vide subi : la donnée n'est pas arrivée.
   *
   * **Ce ton n'est pas rouge, et c'est délibéré.** Voir le composant.
   */
  tone?: "default" | "error";
  density?: "compact" | "default";
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * État vide.
 *
 * Trois choses le distinguent d'un simple message centré :
 *
 * 1. **Il nomme ce qui manque**, pas le fait qu'il manque quelque chose.
 *    « Aucun avis sur cette période » et non « Aucune donnée ».
 * 2. **Il indique la sortie.** Un état vide sans action ni consigne est un
 *    cul-de-sac : l'utilisateur voit que rien ne s'affiche, sans savoir si
 *    c'est normal, si ça va arriver, ou s'il a mal réglé quelque chose.
 * 3. **Il ne parle pas deux fois.** L'icône est décorative ; le ton se lit
 *    dans le texte, jamais à la seule couleur du cadre — ce que WCAG 1.4.1
 *    exige et qu'un liseré muet ne satisfait pas.
 *
 * ## Un échec de chargement n'est pas rouge
 *
 * Dans ce système, le rouge dit une seule chose : **l'utilisateur est
 * refusé, ou quelque chose va être détruit**. Une saisie invalide, une
 * suppression à confirmer. C'est une couleur qui qualifie un geste.
 *
 * Un chargement qui échoue ne refuse rien et ne détruit rien. Personne n'a
 * rien fait de mal, et il n'y a rien à décider : il y a un bouton à
 * cliquer. Le peindre en rouge réclame une émotion là où il faut un clic,
 * et use la couleur qui devra servir le jour où ça compte vraiment.
 *
 * | | ce qui s'est passé | couleur |
 * | --- | --- | --- |
 * | `tone="default"` | rien à montrer, c'est normal | trait tireté |
 * | `tone="error"` | la donnée n'est pas arrivée | **trait plein, sourd** |
 * | `Badge`/`InfoBanner` `tone="error"` | un fait anormal à signaler | rouge |
 * | `AlertDialog destructive` | ça va détruire | rouge |
 *
 * Ce qui distingue l'échec du vide n'est donc pas une teinte : c'est que
 * l'échec **porte une action de reprise**. Un `tone="error"` sans `action`
 * est un cul-de-sac, et la règle 2 s'applique d'abord.
 *
 * Le composant n'annonce rien de lui-même. Quand il REMPLACE un contenu qui
 * était là — après un filtre, après un rechargement — c'est au conteneur de
 * poser la région live : lui seul sait si l'apparition est un événement ou
 * l'état initial de la page.
 */
export function EmptyState({
  title,
  titleAs = "p",
  description,
  icon,
  action,
  secondaryAction,
  tone = "default",
  density = "default",
  className,
}: EmptyStateProps) {
  const Titre = titleAs as ElementType;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-[var(--radius)] border",
        density === "compact" ? "gap-2 p-6" : "gap-3 p-10",
        tone === "error"
          ? // Trait PLEIN sur fond sourd, et aucune trace de rouge : le
            // tireté dit « emplacement en attente », le plein dit « il y a
            // quelque chose ici, et c'est ce message ». La différence entre
            // les deux tons se lit dans le texte et dans le bouton, pas dans
            // une teinte (WCAG 1.4.1).
            "border-[var(--border-strong)] bg-[var(--muted)]"
          : "border-dashed border-border bg-[var(--card)]",
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="text-muted-foreground [&>svg]:size-8"
        >
          {icon}
        </span>
      )}

      <Titre
        className={cn(
          "m-0 font-heading font-semibold text-foreground",
          density === "compact" ? "text-sm" : "text-base",
        )}
      >
        {title}
      </Titre>

      {description && (
        <p className="m-0 max-w-prose text-sm text-muted-foreground text-balance">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
