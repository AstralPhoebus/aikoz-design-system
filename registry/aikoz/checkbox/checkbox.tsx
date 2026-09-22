import { forwardRef, useEffect, useId, useRef, type InputHTMLAttributes } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * Libellé visible et persistant. Même règle que `Input` et `Switch` : une
   * case à cocher sans texte à côté ne dit pas CE QU'elle coche.
   */
  label: string;
  /**
   * Rend le libellé en `sr-only`. À réserver aux grilles denses où une colonne
   * voisine porte déjà le sens — la case « tout sélectionner » d'un tableau,
   * typiquement. Ce n'est pas l'usage par défaut.
   */
  labelHidden?: boolean;
  /** Précision sous le libellé. Reliée par `aria-describedby`. */
  description?: string;
  /**
   * Message d'erreur. Doit nommer le problème ET dire comment le corriger.
   * Sa présence bascule la case en `aria-invalid`.
   */
  error?: string;
  /**
   * **Ni cochée ni décochée** — l'état d'une case « tout sélectionner » quand
   * une partie seulement des lignes est retenue.
   *
   * C'est la seule chose qu'aucun autre contrôle du système ne sait dire :
   * `Switch` est binaire par nature, et `ChoiceGroup` ne connaît que des
   * options complètes. Il se pose en propriété DOM, jamais en attribut —
   * `indeterminate` n'existe pas en HTML, seulement sur l'élément.
   */
  indeterminate?: boolean;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Case à cocher.
 *
 * **Un vrai `<input type="checkbox">`**, masqué en `sr-only` sous une boîte
 * dessinée — pas un `<div role="checkbox">`. Il reste focusable, se coche à la
 * barre d'espace, participe à l'envoi du formulaire et à l'autoremplissage,
 * sans qu'on écrive une ligne de clavier. Refaire ça sur un `<div>` rate
 * presque toujours un de ces quatre points.
 *
 * `display:none` et `visibility:hidden` sont exclus : ils retirent le champ de
 * la tabulation. `sr-only` le garde atteignable.
 *
 * ## Case à cocher ou interrupteur ?
 *
 * | | `Checkbox` | `Switch` |
 * | --- | --- | --- |
 * | l'effet a lieu | à l'envoi du formulaire | **immédiatement** |
 * | plusieurs choix | oui | non, chacun est indépendant |
 * | état intermédiaire | **oui** | impossible |
 *
 * Un interrupteur qui attend un bouton « Enregistrer » ment sur sa promesse :
 * il a l'air d'avoir agi. Une case à cocher qui agit sur-le-champ surprend
 * dans l'autre sens.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, labelHidden = false, description, error, indeterminate = false, className, id, disabled, ...props },
  ref,
) {
  const uid = useId();
  const fieldId = id ?? `${uid}-case`;
  const descId = description ? `${fieldId}-desc` : undefined;
  const errId = error ? `${fieldId}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;

  // `indeterminate` ne s'écrit pas en HTML : il n'existe que sur l'élément.
  // Le poser en attribut JSX ne ferait rien du tout — et le rendu aurait
  // l'air correct dans le source.
  const interne = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (interne.current) interne.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-start gap-2.5">
        <span className="relative inline-flex shrink-0 items-center">
          <input
            ref={(n) => {
              interne.current = n;
              if (typeof ref === "function") ref(n);
              else if (ref) ref.current = n;
            }}
            type="checkbox"
            id={fieldId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              // 20 px dessinés dans une cible de 44 : c'est l'étiquette qui
              // porte la cible, la boîte ne fait que la montrer.
              "inline-flex size-5 items-center justify-center rounded-[calc(var(--radius)/2)]",
              "border-2 border-[var(--border-strong)] bg-[var(--card)]",
              "transition-colors motion-reduce:transition-none",
              "peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)]",
              "peer-indeterminate:border-[var(--primary)] peer-indeterminate:bg-[var(--primary)]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)]",
              "peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--background)]",
              "peer-disabled:opacity-40",
              // `peer-checked:` ne s'applique qu'à un FRÈRE du champ, jamais à
              // un descendant : posées sur le `<svg>`, ces classes n'auraient
              // rien fait, et le source aurait eu l'air juste. On les pose donc
              // ici, sur le frère, en visant l'enfant.
              "[&>[data-marque]]:hidden",
              "peer-checked:[&>[data-marque=coche]]:block",
              "peer-indeterminate:[&>[data-marque=tiret]]:block",
              error && "border-[var(--destructive-text)]",
            )}
          >
            <svg
              data-marque="coche"
              aria-hidden="true"
              viewBox="0 0 12 12"
              className="size-3 text-[var(--primary-foreground)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6.5 4.8 9.2 10 3.5" />
            </svg>
            <svg
              data-marque="tiret"
              aria-hidden="true"
              viewBox="0 0 12 12"
              className="size-3 text-[var(--primary-foreground)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M2.5 6h7" />
            </svg>
          </span>
        </span>

        <label
          htmlFor={fieldId}
          className={cn(
            // La cible tactile est ici, pas sur la boîte : on clique le
            // libellé aussi, et c'est lui qui donne les 44 px au doigt.
            "flex min-h-5 tactile:min-h-11 min-w-0 cursor-pointer items-center text-sm text-foreground",
            disabled && "cursor-not-allowed opacity-40",
            labelHidden && "sr-only",
          )}
        >
          {label}
        </label>
      </div>

      {description && (
        <p id={descId} className="m-0 ml-[1.875rem] text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p
          id={errId}
          role="alert"
          className="m-0 ml-[1.875rem] text-xs text-[var(--destructive-text)]"
        >
          {error}
        </p>
      )}
    </div>
  );
});
