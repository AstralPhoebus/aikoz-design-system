import { forwardRef, type ElementType, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const cardVariants = cva("flex flex-col bg-card text-card-foreground", {
  variants: {
    surface: {
      /**
       * Carte standard. La bordure porte la STRUCTURE ; l'élévation vient du
       * REGISTRE et n'ajoute que la PROFONDEUR — aucune en produit, deux
       * couches transparentes en marketing.
       *
       * `better-ui` recommande de remplacer la bordure par un anneau d'ombre.
       * On s'en écarte, et c'est mesuré : cet anneau donne 1,18:1 contre la
       * page en clair et 1,00 en sombre, moins que la bordure qu'il
       * remplacerait. La carte disparaîtrait.
       */
      raised: [
        // Propriété arbitraire `[box-shadow:…]`, et NON l'utilitaire
        // `shadow-…`. Deux échecs successifs l'ont imposé : `shadow-[var(…)]`
        // fait prendre à Tailwind un `var()` nu pour une COULEUR d'ombre — il
        // émet `--tw-shadow-color` et rien ne se voit ; et même avec l'indice
        // de type, son système de composition (`--tw-shadow`,
        // `--tw-ring-shadow`, `--tw-shadow-colored`) écrase les couleurs d'une
        // ombre multi-couches. La propriété arbitraire court-circuite tout ça.
        "border border-border rounded-[var(--radius)]",
        "[box-shadow:var(--role-elevation-card)]",
        "transition-[box-shadow] duration-150 ease-out",
        "hover:[box-shadow:var(--role-elevation-card-hover)]",
      ].join(" "),
      /** Bordure franche, aucune élévation — pour une grille dense. */
      flat: "border border-border rounded-[var(--radius)]",
      /** Ni bord ni ombre : un simple regroupement, quand le conteneur cadre déjà. */
      bare: "rounded-[var(--radius)]",
    },
    density: {
      compact: "p-4 gap-2",
      default: "p-5 gap-3",
      large: "p-6 gap-4",
    },
  },
  defaultVariants: { surface: "raised", density: "default" },
});

export interface CardProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Élément rendu. `div` par défaut — mais une carte qui présente un contenu
   * autonome (un avis, un article) doit sortir en `article`, et une carte qui
   * regroupe une section nommée en `section`. Le choix est sémantique, pas
   * décoratif : il change les repères de navigation d'un lecteur d'écran.
   */
  as?: "div" | "article" | "section" | "li";
}

/**
 * Conteneur de carte.
 *
 * Volontairement sans sous-composants `Header` / `Title` / `Footer` : le
 * niveau de titre dépend du plan de la page, pas de la carte. Un `CardTitle`
 * qui figerait un `h3` casserait la hiérarchie dès qu'une carte est utilisée
 * ailleurs. C'est à l'appelant de poser le bon niveau.
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { as = "div", surface, density, className, ...props },
  ref
) {
  // `as` est polymorphe : les types d'événements diffèrent d'un élément à
  // l'autre (un HTMLLIElement n'est pas un HTMLDivElement). On type le
  // composant sur HTMLElement et on élargit ici, plutôt que d'imposer à
  // l'appelant des handlers spécifiques au div.
  const Tag = as as ElementType;
  return (
    <Tag
      ref={ref as never}
      className={cn(cardVariants({ surface, density }), className)}
      {...props}
    />
  );
});

export { cardVariants };
