import { forwardRef, useId } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

// Aligné au pixel près sur `Input` : les deux se posent côte à côte dans un
// même formulaire, et deux champs de hauteurs différentes sur une même ligne
// se voient immédiatement.
const triggerVariants = cva(
  [
    "w-full inline-flex items-center justify-between gap-2",
    "rounded-[var(--radius)] bg-[var(--card)] text-foreground",
    "border border-[var(--input)]",
    "transition-colors text-left",
    "data-[placeholder]:text-[var(--muted-foreground)]",
    "focus-visible:outline-none focus-visible:border-[var(--ring)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1",
    "focus-visible:ring-offset-[var(--background)]",
    "disabled:cursor-not-allowed disabled:opacity-60",
  ],
  {
    variants: {
      size: {
        sm: "min-h-9 px-3 py-2 text-sm",
        md: "min-h-11 px-3.5 py-2.5 text-sm",
        lg: "min-h-12 px-4 py-3 text-base",
      },
      invalid: {
        true: "border-[var(--destructive-text)] focus-visible:border-[var(--destructive-text)] focus-visible:ring-[var(--destructive-text)]",
        false: "",
      },
    },
    defaultVariants: { size: "md", invalid: false },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  /** Grise l'option sans la retirer de la liste — elle reste annoncée. */
  disabled?: boolean;
  /**
   * Regroupe les options sous un intitulé. Radix rend un `group` doté d'un
   * `aria-labelledby`, ce que les lecteurs d'écran annoncent à l'entrée du
   * groupe. Les options sans `group` sont rendues avant les groupes.
   */
  group?: string;
}

export interface SelectProps
  extends Pick<VariantProps<typeof triggerVariants>, "size"> {
  /**
   * Libellé visible et persistant. **Obligatoire**, pour la même raison que
   * dans `Input` : le placeholder disparaît dès la sélection faite.
   */
  label: string;
  /** Rend le libellé en `sr-only`. Réservé aux filtres d'une barre d'outils
   *  dont l'intitulé est déjà porté par le contexte visuel immédiat. */
  labelHidden?: boolean;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * Texte affiché tant que rien n'est choisi. Ce n'est PAS un libellé, et ce
   * n'est pas non plus une valeur : un select sans `defaultValue` n'a pas de
   * valeur, ce que la soumission doit refléter.
   */
  placeholder?: string;
  /** Consigne affichée AVANT le champ. */
  description?: string;
  /** Message d'erreur : nommer le problème ET la correction attendue. */
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
  disabled?: boolean;
  required?: boolean;
  /** Nom du champ pour une soumission de formulaire native. */
  name?: string;
  className?: string;
  wrapperClassName?: string;
  /** Classe du panneau déroulant. */
  contentClassName?: string;
}

// ─── Sous-éléments ────────────────────────────────────────────────────────────

const Chevron = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 12 12"
    className="size-3 shrink-0 opacity-70"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.5 4.5 6 8l3.5-3.5" />
  </svg>
);

function Item({ option }: { option: SelectOption }) {
  return (
    <SelectPrimitive.Item
      value={option.value}
      disabled={option.disabled}
      className={cn(
        "relative flex items-center gap-2 select-none",
        // 40px de haut : au-dessus des 24px de WCAG 2.5.8, et confortable au
        // pouce — une liste de filtres se manipule debout, sur mobile.
        "min-h-10 pl-8 pr-3 py-2 text-sm rounded-[calc(var(--radius)-2px)]",
        "cursor-pointer outline-none",
        // `focus:` et NON `data-[highlighted]:`. Radix Select v2 ne pose pas
        // cet attribut — il déplace le focus DOM réel sur l'option, flèche
        // après flèche. Écrit avec `data-[highlighted]`, le style ne s'était
        // jamais appliqué : la navigation clavier se faisait sans le moindre
        // repère visible. Vérifié à l'exécution, pas déduit de la doc.
        //
        // MESURÉ : le voile de survol ne donne que 1,19:1 sur le panneau, et
        // aucune teinte du système ne fait mieux — l'accent aquamarine plafonne
        // à 1,24. Même cause que le survol des boutons : la teinte se déplace,
        // pas la clarté. Or c'est ici l'indicateur de focus clavier de la liste
        // (WCAG 2.4.7). Il est donc porté par un anneau intérieur en `--ring`
        // (5,77:1), le voile ne servant plus que d'appoint. `inset` : la liste
        // ne se décale pas d'un pixel.
        "focus:bg-[var(--surface-hover)]",
        "focus:shadow-[inset_0_0_0_2px_var(--ring)]",
        "data-[state=checked]:font-semibold",
        "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
      )}
    >
      {/* La coche double la graisse : l'option retenue ne se distingue jamais
          par la seule couleur ni par le seul poids typographique. */}
      <SelectPrimitive.ItemIndicator className="absolute left-2.5 inline-flex">
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6.5 4.8 9.2 10 3.5" />
        </svg>
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Liste de sélection — transposée du `MiniSelect` des maquettes.
 *
 * Bâtie sur Radix plutôt que sur un `<select>` natif, et c'est un arbitrage,
 * pas un réflexe. Le natif reste supérieur sur un point : il ouvre le sélecteur
 * du système sur mobile, que l'utilisateur connaît déjà. Ce qu'il ne sait pas
 * faire, et dont les maquettes ont besoin : styler la liste ouverte, poser une
 * coche, grouper avec un intitulé lisible. Radix rend un vrai `listbox` avec la
 * navigation clavier complète (flèches, Début/Fin, saisie au clavier pour
 * atteindre une option, Échap pour refermer), ce qui rattrape l'essentiel.
 *
 * **Le corollaire est une règle d'usage** : pour un choix long et sans mise en
 * forme — un pays, une année —, préférer un `<select>` natif. Ce composant
 * sert les listes courtes et stylées des filtres de tableau de bord.
 *
 * **Attention au registre.** Le panneau est rendu dans un `Portal`, donc à la
 * racine du document. Il hérite du registre et du thème posés sur `<html>` —
 * ce que fait l'architecture des tokens — mais **pas** d'un
 * `data-register="marketing"` posé sur un sous-arbre. Une comparaison
 * côte à côte des deux registres dans une même page verra donc son panneau
 * rendu dans le registre de la page, pas dans celui de sa colonne.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    label,
    labelHidden = false,
    optional = false,
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder = "Sélectionner…",
    description,
    error,
    size = "md",
    disabled,
    required,
    name,
    className,
    wrapperClassName,
    contentClassName,
  },
  ref
) {
  const generated = useId();
  const fieldId = `select-${generated}`;
  const descId = `${fieldId}-desc`;
  const errId = `${fieldId}-err`;

  const describedBy =
    [description ? descId : null, error ? errId : null].filter(Boolean).join(" ") ||
    undefined;

  // Les options sans `group` restent à plat et passent en tête ; les autres
  // sont regroupées dans l'ordre de première apparition, pas triées — l'ordre
  // des filtres porte souvent une intention (le plus fréquent d'abord).
  const plates = options.filter((o) => !o.group);
  const groupes = new Map<string, SelectOption[]>();
  for (const o of options) {
    if (!o.group) continue;
    const liste = groupes.get(o.group) ?? [];
    liste.push(o);
    groupes.set(o.group, liste);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {/* `htmlFor` ne s'applique pas à un bouton : c'est `aria-labelledby` sur
          le déclencheur qui fait l'association, et le clic sur le libellé est
          rattrapé par le `label` natif enveloppant… qu'on n'utilise pas ici,
          pour ne pas capturer le clic destiné à l'ouverture. */}
      <span
        id={`${fieldId}-label`}
        className={cn(
          "text-sm font-medium text-foreground",
          labelHidden && "sr-only"
        )}
      >
        {label}
        {required && (
          <>
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
      </span>

      {description && (
        <p id={descId} className="text-xs text-muted-foreground m-0">
          {description}
        </p>
      )}

      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
        name={name}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          id={fieldId}
          aria-labelledby={`${fieldId}-label ${fieldId}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(triggerVariants({ size, invalid: !!error }), className)}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <Chevron />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            // `popper` et non `item-aligned` : la liste se pose SOUS le champ
            // au lieu de recouvrir le déclencheur. Recouvrir fait perdre le
            // repère de ce qu'on est en train de régler, et sur un filtre de
            // tableau de bord ce repère est tout ce qui reste à l'écran.
            position="popper"
            sideOffset={4}
            className={cn(
              "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden",
              // `--border-strong` et non `--border` : le panneau flotte SANS
              // voile d'arrière-plan, contrairement à la modale. Sa surface ne
              // se distingue de la page que de 1,09:1 — c'est donc son trait
              // qui doit le délimiter, et `--border` n'y donnait que 1,32:1.
              // Avec `--border-strong` : 4,44:1. WCAG 1.4.11.
              "rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--popover)]",
              "text-[var(--popover-foreground)] shadow-lg p-1",
              // La liste ne doit jamais dépasser l'écran : au-delà, elle défile.
              "max-h-[min(20rem,var(--radix-select-content-available-height))]",
              contentClassName
            )}
          >
            <SelectPrimitive.Viewport className="overflow-y-auto">
              {plates.map((o) => (
                <Item key={o.value} option={o} />
              ))}
              {[...groupes.entries()].map(([nom, items]) => (
                <SelectPrimitive.Group key={nom}>
                  <SelectPrimitive.Label className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {nom}
                  </SelectPrimitive.Label>
                  {items.map((o) => (
                    <Item key={o.value} option={o} />
                  ))}
                </SelectPrimitive.Group>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

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
});

export { triggerVariants as selectVariants, SelectPrimitive };
