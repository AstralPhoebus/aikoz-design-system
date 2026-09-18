import { type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";

export interface BrandGlowProps {
  children: ReactNode;
  /**
   * Coin d'où part la lueur. `top-right` par défaut — c'est celui des
   * post-link Aikoz, et il laisse le coin de lecture (haut-gauche) au repos.
   */
  origin?: "top-right" | "top-left" | "top-center";
  /** Intensité, de 0 à 1. `0.55` par défaut. */
  intensity?: number;
  className?: string;
}

const ORIGINES = {
  "top-right": "82% -10%",
  "top-left": "18% -10%",
  "top-center": "50% -14%",
} as const;

/**
 * Lueur de marque — le dégradé radial des post-link Aikoz.
 *
 * **Sur surfaces sombres uniquement, et c'est mesuré, pas un goût.** Une lueur
 * ajoute de la lumière ; sur un fond clair elle n'a plus rien à éclairer, elle
 * sature. Le composant ne la rend donc qu'en thème sombre (`dark:`), et sort
 * un conteneur nu le reste du temps.
 *
 * **Elle ne touche jamais le contraste du texte.** Le voile est posé en
 * `absolute` derrière le contenu, `aria-hidden`, et son opacité est bornée :
 * au-delà, le fond s'éclaircit assez pour faire chuter le rapport du texte
 * qui passe dessus. C'est la raison pour laquelle l'intensité est un nombre
 * et non une classe libre — une valeur qu'on peut auditer.
 *
 * Les deux couleurs viennent de la marque courante (`--color-brand-glow-from`
 * / `-to`), donc la lueur suit `data-brand` sans que l'appelant s'en occupe.
 */
export function BrandGlow({
  children,
  origin = "top-right",
  intensity = 0.55,
  className,
}: BrandGlowProps) {
  const force = Math.min(0.7, Math.max(0, intensity));
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden dark:block"
        style={{
          background: `radial-gradient(120% 90% at ${ORIGINES[origin]}, color-mix(in oklch, var(--color-brand-glow-to), transparent ${Math.round(
            (1 - force) * 100
          )}%) 0%, transparent 62%)`,
        }}
      />
      {children}
    </div>
  );
}
