import { forwardRef, type ElementType, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const cardVariants = cva("flex flex-col", {
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
        "text-card-foreground",
        // La surface n'est plus un APLAT. Un dégradé très court, de `--card`
        // vers 30 % du fond de page, suffit à donner à la carte un haut et un
        // bas — c'est ce qui sépare les tableaux de bord récents de ceux qui
        // font vieux, et c'est le seul geste de la référence QORE qui tienne
        // en produit sans devenir décoratif.
        //
        // Le sens est imposé par le thème et non choisi : le mélange va vers
        // la PAGE, donc en clair le bas se grise à peine et en sombre il
        // s'assombrit. Un dégradé écrit en dur aurait éclairci le haut, ce qui
        // est impossible en clair où la carte est déjà blanche.
        "[background:linear-gradient(180deg,var(--card)_0%,color-mix(in_oklch,var(--card),var(--background)_30%)_100%)]",
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
      flat: "bg-card text-card-foreground border border-border rounded-[var(--radius)]",
      /** Ni bord ni ombre : un simple regroupement, quand le conteneur cadre déjà. */
      bare: "bg-card text-card-foreground rounded-[var(--radius)]",
      /**
       * LA carte qui prime — une seule par écran.
       *
       * Dans une grille où toutes les cartes se ressemblent, aucune ne prime.
       * Celle-ci prime sans ajouter de couleur au système ni changer sa
       * taille. C'est le geste des tableaux de bord bancaires — une carte
       * noire pour le solde, des cartes blanches pour le reste.
       *
       * **Le rôle est la hiérarchie, pas l'inversion.** La variante s'est
       * longtemps appelée `inverse`, du nom de son MOYEN : retourner le
       * thème. Le moyen ne marchait qu'en clair. Mesuré sur le tableau de
       * bord, la carte valait 0,05 fois la clarté des autres en thème clair —
       * elle s'enfonce, c'est reposant — et **15,3 fois** en thème sombre :
       * 120 000 px² de pleine clarté sur une page à 0,001 de luminance, le
       * seul point de l'écran qui éblouisse un œil adapté au noir. Le
       * contraste était symétrique, le confort ne l'était pas.
       *
       * En sombre elle est donc devenue un **panneau allumé** plutôt qu'un
       * aplat blanc : 2,5 fois la clarté d'une carte, un saut de clarté OKLCH
       * de 0,223 à 0,470. OKLCH étant perceptuellement uniforme, ce saut se
       * voit bien plus que le rapport ne le laisse croire.
       *
       * D'où la règle d'emploi : **une seule par écran**. Deux cartes
       * héroïnes ne hiérarchisent plus rien, elles font un damier.
       *
       * Le dégradé se lit en deux couches. La base va d'un palier de la rampe
       * de chrome à un autre — même rampe, donc la surface reste une surface :
       * un dégradé qui change de teinte se lit comme une image. Par-dessus,
       * une lueur d'angle porte la SECONDE couleur de marque, qui suit
       * `data-brand` : marine vers campanule chez ADP, encre vers vert chez
       * Extime. C'est là que la marque se voit vraiment.
       */
      heros: [
        "rounded-[var(--radius)] border border-transparent",
        "text-[var(--on-hero)]",
        "[background:radial-gradient(130%_150%_at_88%_0%,color-mix(in_oklch,var(--hero-glow),transparent_58%)_0%,transparent_62%),linear-gradient(135deg,var(--surface-hero)_0%,var(--surface-hero-to)_100%)]",
        "[box-shadow:var(--role-elevation-card)]",
        "transition-[box-shadow] duration-150 ease-out",
        "hover:[box-shadow:var(--role-elevation-card-hover)]",
      ].join(" "),
      /**
       * ANCIEN NOM de `heros`, rendu à l'identique.
       *
       * Louis consomme le registry PUBLIÉ : retirer une valeur de variante
       * casserait son application au prochain `shadcn add`. Elle reste donc,
       * et pointe sur le même rendu. À ne plus employer — le nom décrivait
       * le moyen, pas le rôle.
       */
      inverse: [
        "rounded-[var(--radius)] border border-transparent",
        "text-[var(--on-hero)]",
        "[background:radial-gradient(130%_150%_at_88%_0%,color-mix(in_oklch,var(--hero-glow),transparent_58%)_0%,transparent_62%),linear-gradient(135deg,var(--surface-hero)_0%,var(--surface-hero-to)_100%)]",
        "[box-shadow:var(--role-elevation-card)]",
        "transition-[box-shadow] duration-150 ease-out",
        "hover:[box-shadow:var(--role-elevation-card-hover)]",
      ].join(" "),
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
