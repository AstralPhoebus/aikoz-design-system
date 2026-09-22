import { useId } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SwitchProps {
  /**
   * Libellé visible et persistant. Même règle que `Input` : un interrupteur
   * sans texte à côté ne dit pas CE QU'il active.
   */
  label: string;
  /** Rend le libellé en `sr-only`. À réserver aux grilles très denses où le
   * libellé est déjà porté par une colonne voisine — ce n'est pas l'usage
   * par défaut, contrairement au champ de recherche d'`Input`. */
  labelHidden?: boolean;
  /** Précision sous le libellé. Reliée par `aria-describedby`. */
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Interrupteur — bascule un réglage binaire immédiatement, sans confirmation
 * ni bouton Enregistrer séparé (ex. activer l'automatisation d'une réponse).
 *
 * **Sous l'habillage, un vrai `<input type="checkbox" role="switch">`.** La
 * case à cocher donne gratuitement tout ce qu'il faudrait sinon réécrire à la
 * main : focus au Tab, bascule à Espace, état exposé aux lecteurs d'écran.
 * `role="switch"` ne fait qu'affiner l'annonce (« interrupteur, activé » au
 * lieu de « case cochée ») — le clavier ne change pas d'un geste. Remplacer
 * ça par un `<div onClick>` avec `aria-checked` géré à la main serait le même
 * classique que documenté sur `ChoiceCard` avec `role="radio"` : on réinvente
 * moins bien ce que le natif fait déjà. L'input reste en `sr-only` (jamais
 * `display:none`, qui sortirait l'élément de la tabulation) ; l'anneau de
 * focus est reporté sur la piste via `has-[:focus-visible]`.
 *
 * **La piste porte l'état, pas seulement le curseur.** Gris (`--border-strong`,
 * déjà garanti >= 3:1 sur la page) à l'arrêt, teinte d'accent (`--primary`)
 * une fois actif — le curseur, lui, ne change jamais de couleur, il se
 * contente de glisser. Deux canaux non chromatiques portent donc l'état
 * (position ET couleur de piste), donc aucune info n'est portée par la seule
 * couleur (WCAG 1.4.1) même si l'un des deux canaux échappait à un lecteur
 * d'écran ou à un daltonien.
 *
 * Le curseur reste `--background` dans les deux états plutôt qu'un blanc figé
 * en dur : la maquette l'a en blanc, ce qui correspond exactement à
 * `--background` en thème clair, et la variable garde un contraste fort face
 * à la piste (grise ou d'accent) si un thème sombre inversait un jour les
 * clartés — jamais de couleur codée en dur, cf. CLAUDE.md.
 */
export function Switch({
  label,
  labelHidden = false,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
}: SwitchProps) {
  const uid = useId();
  const descId = description ? `${uid}-desc` : undefined;

  return (
    <label
      className={cn(
        "inline-flex items-start gap-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full",
          "border-2 border-transparent transition-colors",
          // Piste au repos : gris porteur, garanti >= 3:1 contre la page par
          // le rôle lui-même (cf. shadcn-bridge.css). Actif : accent produit,
          // le même token que le bouton par défaut — pas un bleu en dur.
          "bg-[var(--border-strong)] has-[:checked]:bg-[var(--primary)]",
          // L'input est en sr-only : l'anneau de focus est reporté ici.
          "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2",
          "has-[:focus-visible]:ring-[var(--ring)] has-[:focus-visible]:ring-offset-2",
          "has-[:focus-visible]:ring-offset-[var(--background)]"
        )}
      >
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          aria-describedby={descId}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block size-5 translate-x-0 rounded-full",
            // La pastille glisse de vingt pixels. Coupée sous
            // `prefers-reduced-motion` : l'état change quand même — c'est la
            // POSITION qui porte l'information, pas le déplacement.
            "bg-[var(--background)] shadow-sm transition-transform",
            "motion-reduce:transition-none",
            "peer-checked:translate-x-5"
          )}
        />
      </span>

      <span className={cn("flex flex-col gap-0.5", labelHidden && "sr-only")}>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span id={descId} className="text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
