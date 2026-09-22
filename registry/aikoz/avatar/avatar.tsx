import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const avatarVariants = cva(
  [
    "relative inline-flex shrink-0 overflow-hidden select-none",
    "items-center justify-center rounded-full",
    "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
    "font-semibold uppercase leading-none",
  ],
  {
    variants: {
      size: {
        sm: "size-6 text-2xs",
        md: "size-8 text-xs",
        lg: "size-10 text-sm",
        xl: "size-12 text-base",
      },
    },
    defaultVariants: { size: "md" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /**
   * Nom de la personne ou de l'entité. Sert à calculer les initiales ET à
   * décrire l'image — un avatar sans nom n'est qu'une pastille colorée.
   */
  name: string;
  /** URL de l'image. Absente ou en échec, les initiales prennent le relais. */
  src?: string;
  /**
   * Décoratif : le nom est déjà écrit à côté, dans une ligne de classement par
   * exemple. L'avatar est alors masqué aux lecteurs d'écran, qui l'entendraient
   * sinon deux fois.
   */
  decorative?: boolean;
  /** Initiales imposées, si le calcul automatique ne convient pas. */
  initials?: string;
  className?: string;
}

/**
 * Deux premières initiales : « Allianz Lyon Centre » → AL, « AXA » → AX.
 * Les particules sont ignorées — « Banque de France » donne BF, pas BD.
 */
function computeInitials(name: string) {
  const PARTICULES = new Set(["de", "du", "des", "la", "le", "les", "of", "and", "et"]);
  const mots = name
    .trim()
    .split(/[\s-]+/)
    .filter((m) => m && !PARTICULES.has(m.toLowerCase()));
  if (mots.length === 0) return name.slice(0, 2).toUpperCase();
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Avatar — image avec repli sur les initiales.
 *
 * Bâti sur Radix : la bascule vers le repli quand l'image échoue à charger
 * n'est pas triviale à faire correctement, et la réécrire à la main
 * contreviendrait à la règle 1 de l'inventaire.
 */
export function Avatar({
  name,
  src,
  initials,
  decorative = false,
  size = "md",
  className,
}: AvatarProps) {
  const texte = initials ?? computeInitials(name);

  return (
    <AvatarPrimitive.Root
      className={cn(avatarVariants({ size }), className)}
      // L'image est décrite par le nom, jamais par « avatar de » : un lecteur
      // d'écran annonce déjà la nature de l'élément.
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? true : undefined}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          className="size-full object-cover"
        />
      )}
      {/* delayMs : évite le clignotement des initiales pendant que l'image
          charge, sur une liste de classement où elles défilent. */}
      <AvatarPrimitive.Fallback delayMs={src ? 300 : 0} asChild>
        <span aria-hidden="true">{texte}</span>
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { avatarVariants, computeInitials };
