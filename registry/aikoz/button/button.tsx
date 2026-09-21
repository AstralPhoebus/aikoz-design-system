import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-full font-medium",
    // Pas de `whitespace-nowrap` : avec lui, un libellé long sortait du
    // conteneur et se faisait rogner — un bouton qui découpe son propre
    // libellé est cassé, et sur mobile le texte disparaissait purement.
    // Le repli gracieux est le retour à la ligne : la pastille s'allonge,
    // ce qui signale au passage qu'il faut raccourcir l'intitulé.
    "max-w-full text-center text-balance",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        default: [
          // Le liseré n'est PAS décoratif. En thème sombre, le fond de l'action
          // primaire est une couleur de marque vive, donc à peine plus claire
          // que la carte : le libellé se lit (APCA 84 à 90) mais la FORME du
          // bouton ne se détache pas du bloc — sous le seuil de 45 d'un
          // élément d'interface. Le liseré la rend identifiable sans toucher
          // au fond, donc sans rien céder sur la vivacité de la marque.
          //
          // En clair, `--primary-edge` vaut `--primary` : le liseré existe,
          // ne se voit pas, et ne coûte rien.
          "bg-[var(--primary)] text-[var(--primary-foreground)]",
          "border border-[var(--primary-edge)]",
          "hover:bg-[color-mix(in_oklch,var(--primary),transparent_10%)] active:bg-[color-mix(in_oklch,var(--primary),transparent_20%)]",
        ],
        secondary: [
          "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
          "hover:bg-[color-mix(in_oklch,var(--secondary),transparent_10%)] active:bg-[color-mix(in_oklch,var(--secondary),transparent_20%)]",
        ],
        // Le survol de ces deux variantes est porté par la BORDURE, pas par une
        // teinte. Mesuré : un voile d'accent à 12 % donne 1,025:1 sur fond
        // clair — invisible. Monter l'opacité n'y change rien (1,073 à 40 %) :
        // l'aquamarine a presque la même luminance que le fond clair, on
        // déplace la teinte sans déplacer la clarté. La bordure forte, elle,
        // tient 4,07 à 4,58:1 selon le thème.
        outline: [
          "border border-[var(--border)] bg-transparent text-[var(--foreground)]",
          "hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]",
          "active:bg-[var(--surface-active,var(--surface-hover))]",
        ],
        ghost: [
          // Bordure transparente au repos : elle apparaît au survol sans
          // décaler la mise en page d'un pixel.
          "border border-transparent bg-transparent text-[var(--foreground)]",
          "hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]",
          "active:bg-[var(--surface-active,var(--surface-hover))]",
        ],
      },
      size: {
        sm: "min-h-9 px-4 py-2 text-sm",
        md: "min-h-11 px-6 py-2.5 text-sm",
        lg: "min-h-12 px-8 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        /* Sans type explicite, un <button> dans un <form> vaut type="submit"
           et soumet le formulaire au moindre clic. Le défaut sûr est "button" ;
           un bouton de soumission le déclare. Ne s'applique pas à asChild, où
           l'élément rendu n'est pas forcément un bouton. */
        {...(asChild ? {} : { type: type ?? "button" })}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
