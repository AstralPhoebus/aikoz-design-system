import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────
//
// Sibling de `fieldVariants` (Input) : mêmes tokens de couleur/bordure/focus,
// pour que les deux champs restent une paire visuellement assortie côte à
// côte dans un formulaire. Ce qui diffère, c'est le gabarit — une zone
// multiligne se dimensionne en hauteur minimale + `resize`, pas en `size`
// texte unique comme l'Input.
const textareaVariants = cva(
  [
    "w-full rounded-[var(--radius)] bg-[var(--card)] text-foreground",
    "border border-[var(--input)]",
    "placeholder:text-[var(--muted-foreground)]",
    "px-3.5 py-2.5 text-sm",
    "transition-colors",
    "focus-visible:outline-none focus-visible:border-[var(--ring)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1",
    "focus-visible:ring-offset-[var(--background)]",
    // Même remarque que sur Input : `disabled` sort du parcours clavier,
    // `readOnly` le garde focusable et donc découvrable.
    "disabled:cursor-not-allowed disabled:opacity-60",
    "read-only:border-dashed read-only:bg-[var(--muted)] read-only:cursor-default",
  ],
  {
    variants: {
      invalid: {
        true: "border-[var(--destructive-text)] focus-visible:border-[var(--destructive-text)] focus-visible:ring-[var(--destructive-text)]",
        false: "",
      },
      resize: {
        // Redimensionnement manuel natif : simple, robuste, zéro JS de mesure
        // de scrollHeight ni ResizeObserver. Voir la note sur `rows` plus bas
        // pour la justification complète du choix face à l'auto-grow.
        vertical: "resize-y",
        none: "resize-none",
      },
    },
    defaultVariants: { invalid: false, resize: "vertical" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    Pick<VariantProps<typeof textareaVariants>, "resize"> {
  /**
   * Libellé. Toujours requis pour le nom accessible — mais peut être rendu
   * `sr-only` via `labelHidden` pour la variante `inline` : dans une édition
   * en place (« Modifier »), le contexte affiché nomme déjà le champ, un
   * libellé visible en doublon serait redondant. Le nom accessible, lui,
   * reste obligatoire : jamais de `<textarea>` sans label ni aria-label.
   */
  label: string;
  /**
   * Rend le libellé `sr-only`. Usage prévu : variante `inline` (remplacement
   * d'un contenu affiché), où le contexte environnant porte déjà le repère
   * visuel. En `standalone` (formulaire), laisser le libellé visible.
   */
  labelHidden?: boolean;
  /** Consigne affichée avant le champ — format attendu, longueur, contrainte. */
  description?: string;
  /**
   * Message d'erreur (ex. « Ce champ ne peut pas être vide »). Sa présence
   * bascule le champ en `aria-invalid` et l'associe via `aria-describedby`,
   * même mécanique que `Input`.
   */
  /**
   * Marque le champ **facultatif**, en toutes lettres à côté du libellé.
   *
   * *Practical UI* (chapitre 8) et les guides d'accessibilité demandent la
   * même chose : on marque les obligatoires OU les facultatifs, et on ne
   * laisse jamais l'utilisateur deviner lesquels sont lesquels. Un formulaire
   * où trois champs sur quatre portent une astérisque a choisi le mauvais
   * camp — c'est le quatrième qu'il fallait nommer.
   *
   * Le marqueur est **visible**, pas `sr-only` : celui qui voit l'écran a
   * exactement le même besoin de savoir qu'il peut passer son chemin.
   *
   * Sans effet si `required` est posé. Un champ marqué des deux façons ne
   * veut rien dire ; plutôt que d'échouer à la compilation — ce qui rendait
   * `args: { required: true }` inexprimable dans les histoires et compliquait
   * la vie de qui étale des props — l'obligation l'emporte, toujours, et
   * l'audit des formulaires vérifie qu'aucun champ ne porte les deux
   * marqueurs à l'écran.
   */
  optional?: boolean;
  error?: string;
  /**
   * Nombre de lignes visibles. Détermine la hauteur initiale ; l'utilisateur
   * peut ensuite agrandir via la poignée native (`resize`). Défaut choisi
   * pour une réponse courte à moyenne (ex. correction d'une réponse
   * automatique) sans dominer l'écran.
   */
  rows?: number;
  className?: string;
  /** Classe du conteneur, pour la mise en page. */
  wrapperClassName?: string;
}


// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Champ de texte libre — zone de saisie multiligne, éditable dans son
 * contexte (ex. corriger une réponse automatique avant publication, sans
 * changer d'écran).
 *
 * Choix : `rows` + poignée de redimensionnement native (`resize-y`), plutôt
 * qu'un auto-grow au fil de la frappe. L'auto-grow (mesurer `scrollHeight` à
 * chaque `onChange`, ou un ResizeObserver) ajoute une dépendance JS, un
 * risque de layout thrashing dans une liste (ex. futur "Kanban de réponses"
 * avec plusieurs zones ouvertes), et un comportement à réaccorder à chaque
 * changement de police/densité. `rows` + resize natif est déclaratif, ne
 * dépend d'aucun effet, fonctionne identiquement sur tous les navigateurs, et
 * laisse la main à l'utilisateur — plus robuste pour un composant de
 * registry appelé dans des contextes qu'on ne contrôle pas tous.
 *
 * Ce composant ne rend AUCUN bouton d'action : "Annuler" / "Enregistrer" sont
 * composés par l'appelant (voir `onKeyDown` pour brancher Échap = Annuler).
 * Il ne valide rien lui-même : comme `Input`, la validation et l'affichage de
 * `error` sont décidés par l'appelant, typiquement à la sauvegarde.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      labelHidden = false,
      optional = false,
      description,
      error,
      rows = 3,
      resize = "vertical",
      required,
      id,
      className,
      wrapperClassName,
      ...props
    },
    ref
  ) {
    const generated = useId();
    const fieldId = id ?? `textarea-${generated}`;
    const descId = `${fieldId}-desc`;
    const errId = `${fieldId}-err`;

    const describedBy =
      [description ? descId : null, error ? errId : null].filter(Boolean).join(" ") ||
      undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        <label
          htmlFor={fieldId}
          className={cn(
            "text-sm font-medium text-foreground",
            labelHidden && "sr-only"
          )}
        >
          {label}
          {required && (
            <>
              {/* L'astérisque est décoratif ; l'obligation est dite en toutes
                  lettres, jamais portée par le seul symbole. */}
              <span aria-hidden="true" className="text-[var(--destructive-text)]">
                {" "}
                *
              </span>
              <span className="sr-only"> (obligatoire)</span>
            </>
          )}
          {!required && optional && (
            // Visible, jamais `sr-only` : qui voit l'écran a le même
            // besoin de savoir qu'il peut passer son chemin.
            <span className="ml-1 font-regular text-muted-foreground">
              (facultatif)
            </span>
          )}
        </label>

        {/* La consigne précède le champ — elle sert à le remplir, pas à le relire. */}
        {description && (
          <p id={descId} className="text-xs text-muted-foreground m-0">
            {description}
          </p>
        )}

        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(textareaVariants({ invalid: !!error, resize }), className)}
          {...props}
        />

        {/* role="alert" : l'erreur apparaît après coup (ex. sauvegarde d'un
            champ vide), elle doit être annoncée sans que l'utilisateur ait à
            retourner la chercher. */}
        {error && (
          <p
            id={errId}
            role="alert"
            className="text-xs text-[var(--destructive-text)] m-0"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

export { textareaVariants };
