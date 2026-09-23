import { useId, useState, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { ChoiceCard } from "@registry/aikoz/choice-card/choice-card";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  visual?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
}

export interface ChoiceGroupProps {
  /**
   * Question posée — **obligatoire**. Rendue en `<legend>`, donc lue à
   * l'entrée du groupe : « Sélectionnez votre marque, bouton radio, 1 sur 6 ».
   * Sans elle, l'utilisateur entend six options sans savoir ce qu'on lui
   * demande.
   */
  legend: string;
  /** Masque la question visuellement quand un titre voisin la porte déjà. */
  legendHidden?: boolean;
  /** Consigne affichée AVANT les options — jamais après, il serait trop tard. */
  description?: string;
  options: ChoiceOption[];
  /**
   * `single` rend des boutons radio, `multiple` des cases à cocher. Les deux
   * ne se parcourent pas pareil au clavier et ne s'annoncent pas pareil : ce
   * n'est pas un réglage d'apparence.
   */
  selection?: "single" | "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (values: string[]) => void;
  /**
   * `grid` pour des tuiles de logos, `list` pour des lignes.
   * `segmented` — un seul rang connecté, options à largeur égale, sans
   * espace entre elles : elles doivent se lire comme UN contrôle (ex. délai
   * avant publication). Chaque `ChoiceCard` reçoit `appearance="segmented"`.
   * `chip` — rang de pastilles indépendantes, avec espace normal entre
   * elles : contrairement au segmenté, ce ne sont pas des fragments d'un
   * même contrôle. Chaque `ChoiceCard` reçoit `appearance="chip"`.
   */
  layout?: "grid" | "list" | "segmented" | "chip";
  /** Colonnes de la grille aux grandes largeurs. */
  columns?: 2 | 3 | 4;
  /** Message d'erreur, annoncé en `role="alert"`. */
  error?: string;
  /**
   * Sortie de secours — « Je ne trouve pas ma marque ». Rendue APRÈS les
   * options, hors du groupe de choix : ce n'est pas une option de plus, c'est
   * un autre chemin. La mêler aux autres ferait compter « 7 sur 7 » là où il
   * n'y a que six marques.
   */
  escape?: ReactNode;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Groupe de choix en cartes.
 *
 * **Ce composant remplace `BrandPicker` et `SourceToggle` de l'inventaire.**
 * Mis côte à côte, les deux ne diffèrent que par deux choses : l'arité de la
 * sélection (une marque contre plusieurs sources) et le contenu des cartes
 * (un logo contre un libellé et un compte). Deux props, donc — pas deux
 * composants. C'est le même raisonnement que pour `KpiCard` : deux axes
 * indépendants valent mieux que le produit de leurs combinaisons.
 *
 * Le grille est un `<fieldset>` avec `<legend>` — la seule construction qui
 * fasse annoncer la question à l'entrée du groupe. `role="radiogroup"` sur
 * un `<div>` en approche l'effet, mais il faut alors gérer soi-même le nom,
 * le parcours aux flèches et le tabindex tournant, que le natif offre.
 *
 * **La sortie de secours est rendue hors du `<fieldset>`.** « Je ne trouve
 * pas ma marque » n'est pas une septième marque : la mêler aux options la
 * ferait compter dans « 7 sur 7 », et un lecteur d'écran l'annoncerait comme
 * un choix possible au même titre que les autres.
 */
export function ChoiceGroup({
  legend,
  legendHidden = false,
  description,
  options,
  selection = "single",
  value,
  defaultValue = [],
  onValueChange,
  layout = "list",
  columns = 3,
  error,
  escape,
  className,
}: ChoiceGroupProps) {
  const uid = useId();
  const [interne, setInterne] = useState<string[]>(defaultValue);
  const retenus = value ?? interne;
  const descId = description ? `${uid}-desc` : undefined;
  const errId = error ? `${uid}-err` : undefined;

  function basculer(v: string, coche: boolean) {
    const suivant =
      selection === "single"
        ? [v]
        : coche
        ? [...retenus, v]
        : retenus.filter((x) => x !== v);
    if (value === undefined) setInterne(suivant);
    onValueChange?.(suivant);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <fieldset
        className="m-0 p-0 border-0 flex flex-col gap-3"
        aria-describedby={[descId, errId].filter(Boolean).join(" ") || undefined}
      >
        <legend
          className={cn(
            "p-0 text-sm font-medium text-foreground",
            legendHidden && "sr-only"
          )}
        >
          {legend}
        </legend>

        {description && (
          <p id={descId} className="m-0 text-xs text-muted-foreground">
            {description}
          </p>
        )}

        <div
          className={cn(
            layout === "segmented"
              ? // Un seul rang connecté : le contour partagé et les
                // séparateurs internes vivent ICI, sur le conteneur — pas sur
                // chaque `ChoiceCard`, qui n'a plus ni bordure ni radius
                // propres en `appearance="segmented"`. `overflow-hidden` +
                // `divide-x` sont ce qui fait lire trois `<label>` comme UN
                // seul contrôle plutôt que trois cartes bordées côte à côte.
                "flex rounded-[var(--radius)] border-2 border-[var(--border-strong)] divide-x divide-[var(--border-strong)] overflow-hidden"
              : layout === "chip"
              ? // Pastilles indépendantes : espace normal, pas de contour
                // partagé — l'inverse de "segmented".
                "flex flex-wrap gap-2"
              : cn(
                  "grid gap-3",
                  layout === "list"
                    ? "grid-cols-1"
                    : columns === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : columns === 4
                    ? "grid-cols-2 sm:grid-cols-4"
                    : "grid-cols-2 sm:grid-cols-3"
                )
          )}
        >
          {options.map((o) => (
            <ChoiceCard
              key={o.value}
              {...o}
              type={selection === "single" ? "radio" : "checkbox"}
              name={`${uid}-groupe`}
              checked={retenus.includes(o.value)}
              onCheckedChange={(coche) => basculer(o.value, coche)}
              layout={layout === "grid" ? "tile" : "row"}
              appearance={
                layout === "segmented" ? "segmented" : layout === "chip" ? "chip" : "card"
              }
            />
          ))}
        </div>
      </fieldset>

      {error && (
        <p id={errId} role="alert" className="m-0 text-xs text-[var(--destructive-text)]">
          {error}
        </p>
      )}

      {/* Hors du fieldset : ce n'est pas une option du groupe. */}
      {escape}
    </div>
  );
}
