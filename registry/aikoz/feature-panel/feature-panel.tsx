import { useId, type ElementType, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Feature {
  /** Titre du levier. Court, et il porte le sens à lui seul. */
  title: string;
  description: string;
  /** Pictogramme. Décoratif : il illustre, il n'informe pas. */
  icon?: ReactNode;
  /** Chiffre ou mention en exergue — « ×3 », « 48 h ». */
  metric?: string;
}

export interface FeaturePanelProps {
  /** Titre de la section — « Quatre leviers ». */
  title: string;
  /** Chapô, sous le titre. */
  intro?: string;
  features: Feature[];
  /**
   * Niveau du titre de section. `2` par défaut : un panneau de leviers est
   * une section de page, sous le `h1`. Les titres de leviers prennent
   * automatiquement le niveau suivant — c'est la seule façon de garantir que
   * le plan reste cohérent quand l'appelant déplace la section.
   */
  headingLevel?: 2 | 3 | 4;
  /** Colonnes aux grandes largeurs. */
  columns?: 2 | 3 | 4;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Panneau de leviers — « Quatre leviers » de la page Notre Solution.
 *
 * **Le plan se déduit, il ne se saisit pas deux fois.** L'appelant donne le
 * niveau du titre de SECTION ; les titres de leviers prennent le suivant.
 * C'est la seule façon d'éviter le cas classique — une section en `h2` avec
 * des cartes en `h4` parce que quelqu'un a choisi le niveau à l'apparence.
 * Ici on ne peut pas sauter de niveau, c'est arithmétique.
 *
 * C'est aussi pourquoi ce composant impose un titre là où `Card` s'y
 * refusait : `Card` est un conteneur neutre dont le titre est du contenu
 * libre ; ici la section EST une unité du plan, et ses leviers en sont les
 * sous-unités. La structure fait partie du composant.
 *
 * **Une `<ul>`, pas une grille de `<div>`.** « Quatre leviers » n'est pas une
 * figure de style : un lecteur d'écran annonce « liste de 4 éléments » et
 * l'utilisateur sait combien il en reste. Une grille de div le laisse
 * compter.
 */
export function FeaturePanel({
  title,
  intro,
  features,
  headingLevel = 2,
  columns = 4,
  className,
}: FeaturePanelProps) {
  const uid = useId();
  const Titre = `h${headingLevel}` as ElementType;
  // Le niveau des leviers découle de celui de la section, plafonné à h6.
  const SousTitre = `h${Math.min(headingLevel + 1, 6)}` as ElementType;

  return (
    <section aria-labelledby={`${uid}-titre`} className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-3 max-w-2xl">
        <Titre id={`${uid}-titre`} className="m-0 font-heading text-2xl font-bold text-foreground text-balance">
          {title}
        </Titre>
        {intro && <p className="m-0 text-base text-muted-foreground text-balance">{intro}</p>}
      </div>

      <ul
        className={cn(
          "grid gap-4 list-none m-0 p-0",
          columns === 2
            ? "sm:grid-cols-2"
            : columns === 3
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {features.map((f) => (
          <li
            key={f.title}
            className={cn(
              "flex flex-col gap-2 rounded-[var(--radius)] p-5",
              // Trait plutôt qu'ombre : la marque proscrit les ombres portées
              // sur le contenu, elles sont réservées aux surfaces flottantes.
              "border border-border bg-card"
            )}
          >
            {f.icon && (
              <span aria-hidden="true" className="text-[var(--secondary)] [&>svg]:size-6">
                {f.icon}
              </span>
            )}
            {f.metric && (
              // Le chiffre est décoratif au sens strict : il répète ce que la
              // description énonce. Il n'est donc pas masqué — il EST du
              // texte — mais il ne porte jamais à lui seul l'information.
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {f.metric}
              </span>
            )}
            <SousTitre className="m-0 font-heading text-base font-semibold text-foreground">
              {f.title}
            </SousTitre>
            <p className="m-0 text-sm text-muted-foreground">{f.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
