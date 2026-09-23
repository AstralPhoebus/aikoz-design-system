import { useId, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChoiceCardProps {
  /** Libellé de l'option. Visible, toujours. */
  label: string;
  value: string;
  /**
   * `radio` — un seul choix dans le groupe. `checkbox` — plusieurs.
   * Ce n'est pas cosmétique : les deux ne se parcourent pas pareil au
   * clavier, et un lecteur d'écran annonce « bouton radio, 2 sur 5 » d'un
   * côté, « case à cocher, cochée » de l'autre.
   */
  type?: "radio" | "checkbox";
  /** Nom du groupe. Obligatoire pour un `radio` : c'est lui qui les relie. */
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  /**
   * L'état coché a changé.
   *
   * **Même nom que `Switch`, et c'est délibéré.** Il s'appelait `onChange`,
   * c'est-à-dire exactement le nom que `Checkbox` hérite de React — mais avec
   * une signature incompatible : ici un booléen, là un `ChangeEvent`. Qui
   * apprenait l'un et écrivait l'autre recevait un événement là où il
   * attendait `true`, sans que TypeScript le voie si le rappel ignorait son
   * argument.
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * @deprecated Employer `onCheckedChange`. Conservé pour ne rien casser chez
   * qui consomme déjà le registry ; retiré à la prochaine version majeure.
   */
  onChange?: (checked: boolean) => void;
  /** Précision sous le libellé. Reliée par `aria-describedby`. */
  description?: string;
  /** Logo, icône, illustration. Décoratif — le libellé porte le sens. */
  visual?: ReactNode;
  /** Élément de fin de ligne : un `Badge` de compte, en général. */
  meta?: ReactNode;
  disabled?: boolean;
  /** Disposition interne. `tile` empile le visuel au-dessus du libellé. */
  layout?: "row" | "tile";
  /**
   * Habillage visuel — la mécanique d'accessibilité (input réel, `sr-only`,
   * anneau reporté par `has-[:focus-visible]`) ne change jamais, seules les
   * classes Tailwind changent selon la valeur :
   *
   * - `"card"` (défaut) — la carte isolée avec pastille de coche, inchangée.
   * - `"segmented"` — pensé pour un rang connecté (`ChoiceGroup`
   *   `layout="segmented"`) : sélectionnée = fond foncé + texte clair
   *   (mêmes jetons que `Button` `variant="default"`), non sélectionnée =
   *   fond clair + `muted-foreground`. Pas de pastille : dans un rang
   *   connecté, le remplissage suffit à porter l'état.
   * - `"chip"` — pastille compacte, sélectionnée = coche + fond foncé, non
   *   sélectionnée = fond clair + contour.
   */
  appearance?: "card" | "segmented" | "chip";
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Option présentée en carte — la brique de `ChoiceGroup`.
 *
 * **Sous la carte, il y a un vrai `<input>`.** Il n'est pas supprimé, il est
 * mis en `sr-only` : il reste focusable, il garde son rôle, il se coche à la
 * barre d'espace, et les flèches parcourent les radios du groupe sans qu'on
 * écrive une ligne de clavier. La carte n'est que le vêtement. Refaire tout
 * ça avec `role="radio"` sur un `<div>` est un classique — et un classique
 * qui rate presque toujours le parcours aux flèches.
 *
 * `sr-only` et **non** `display: none` ni `visibility: hidden` : ces deux-là
 * retirent l'élément de la tabulation. L'anneau de focus est reporté sur la
 * carte par `has-[:focus-visible]`, sinon le focus deviendrait invisible.
 *
 * **C'est la coche qui porte l'état, pas le trait.** Mesuré : le trait
 * retenu (`--ring`) et le trait non retenu (`--border-strong`) ne se
 * distinguent que de **1,30:1 en clair** — leurs teintes diffèrent, leurs
 * clartés non. Les deux passent largement 3:1 contre la carte, donc un audit
 * texte/fond ne signale rien ; mais l'information utile ici n'est pas
 * « y a-t-il un trait », c'est « lequel des deux ». La coche est une
 * différence de FORME, elle survit aux niveaux de gris et à la plupart des
 * dyschromatopsies. Le trait ne fait que renforcer, pour qui perçoit la
 * teinte. Retirer la coche casserait le composant (WCAG 1.4.1).
 */
export function ChoiceCard({
  label,
  value,
  type = "radio",
  name,
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  description,
  visual,
  meta,
  disabled,
  layout = "row",
  appearance = "card",
  className,
}: ChoiceCardProps) {
  const uid = useId();
  const descId = description ? `${uid}-desc` : undefined;

  return (
    <label
      className={cn(
        "relative flex cursor-pointer transition-colors",
        // 44px au minimum même pour une option d'une ligne (WCAG 2.5.8).
        "min-h-11",
        appearance === "chip" ? "px-4 py-2 rounded-full items-center gap-2" : "p-4",
        appearance !== "chip" &&
          (layout === "tile"
            ? "flex-col items-center justify-center gap-2 text-center"
            : "flex-row items-start gap-3"),
        appearance === "segmented" && "flex-1 justify-center text-center",
        // L'anneau de focus est reporté ici : l'input est en sr-only, le
        // focus doit rester visible quelque part.
        "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2",
        "has-[:focus-visible]:ring-[var(--ring)] has-[:focus-visible]:ring-offset-2",
        "has-[:focus-visible]:ring-offset-[var(--background)]",
        // "segmented" vit dans un conteneur `overflow-hidden` (`ChoiceGroup`,
        // pour que les coins arrondis du rang partagé restent nets) : un
        // anneau à décalage positif y serait rogné sur les segments de bord.
        // `ring-inset` + décalage nul gardent l'anneau DANS la boîte — les
        // deux utilitaires `ring-*` de Tailwind sont faits pour se composer.
        appearance === "segmented" &&
          "has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-offset-0",
        // ── "card" (défaut) — inchangé, byte pour byte. ────────────────────
        appearance === "card" && [
          "rounded-[var(--radius)] border bg-[var(--card)]",
          // `border-2` en permanence, seule la TEINTE change : faire passer
          // le trait de 1 à 2px à la sélection décalerait la carte d'un
          // pixel, et toute la grille avec elle.
          "border-2 border-[var(--border-strong)]",
          "has-[:checked]:border-[var(--ring)] has-[:checked]:bg-[var(--surface-hover)]",
          "hover:bg-[var(--surface-hover)]",
        ],
        // ── "segmented" — le remplissage porte l'état, pas de pastille.
        // Pas de bordure ni de radius propres : dans `ChoiceGroup`
        // `layout="segmented"`, c'est le conteneur qui porte le contour
        // partagé et les séparateurs, pour que le rang se lise comme UN
        // contrôle. Mêmes jetons que `Button` `variant="default"`.
        appearance === "segmented" && [
          "bg-[var(--card)] text-[var(--muted-foreground)]",
          "has-[:checked]:bg-[var(--primary)] has-[:checked]:text-[var(--primary-foreground)]",
          "has-[:checked]:font-medium",
          "hover:bg-[var(--surface-hover)]",
          "has-[:checked]:hover:bg-[color-mix(in_oklch,var(--primary),transparent_10%)]",
        ],
        // ── "chip" — pastille compacte, coche + fond foncé au lieu du
        // contour au repos.
        appearance === "chip" && [
          "border-2 border-[var(--border-strong)] bg-[var(--card)] text-[var(--foreground)]",
          "has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary)]",
          "has-[:checked]:text-[var(--primary-foreground)]",
          "hover:bg-[var(--surface-hover)]",
          "has-[:checked]:hover:bg-[color-mix(in_oklch,var(--primary),transparent_10%)]",
        ],
        disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
        className
      )}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        aria-describedby={descId}
        onChange={(e) => (onCheckedChange ?? onChange)?.(e.target.checked)}
        className="peer sr-only"
      />

      {visual && (
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0 inline-flex items-center justify-center",
            appearance === "chip" ? "size-4" : layout === "tile" ? "h-10" : "size-6"
          )}
        >
          {visual}
        </span>
      )}

      {/* "chip" — la coche est INLINE, pas une pastille absolue : sur une
          pastille compacte le badge en coin déborderait. Révélée par
          `peer-checked`, comme celle de "card". */}
      {appearance === "chip" && (
        <span
          aria-hidden="true"
          className="hidden shrink-0 size-3.5 items-center justify-center peer-checked:inline-flex"
        >
          <svg aria-hidden="true" viewBox="0 0 12 12" className="size-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6.5 4.8 9.2 10 3.5" />
          </svg>
        </span>
      )}

      <span
        className={cn(
          "flex flex-col gap-0.5 min-w-0",
          layout === "row" && appearance !== "chip" && "flex-1"
        )}
      >
        <span
          className={cn(
            "text-sm font-medium",
            // "card" fixe sa couleur : le texte ne change jamais de teinte,
            // seule la carte se colore. "segmented"/"chip" héritent de la
            // couleur du `<label>` (`text-current`) puisque c'est justement
            // elle qui bascule clair/foncé à la sélection.
            appearance === "card" && "text-foreground"
          )}
        >
          {label}
        </span>
        {description && (
          <span
            id={descId}
            className={cn(
              "text-xs",
              appearance === "card" ? "text-muted-foreground" : "text-current opacity-80"
            )}
          >
            {description}
          </span>
        )}
      </span>

      {meta && <span className="shrink-0">{meta}</span>}

      {/* La coche — LE canal qui porte l'état, cf. la note du composant :
          les deux teintes de trait ne se séparent que de 1,30:1 en clair.
          Décorative pour les technologies d'assistance, qui lisent déjà
          « coché » sur l'input. Seulement pour "card" : dans un rang
          "segmented", le remplissage porte déjà l'état sans ambiguïté ; sur
          un "chip", la coche est rendue plus haut, inline. */}
      {appearance === "card" && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-2 top-2",
            "inline-flex size-4 items-center justify-center rounded-full",
            "bg-[var(--ring)] text-[var(--primary-foreground)]",
            // `peer-checked` : l'input porte `peer` et précède cette pastille
            // dans le même parent, c'est la seule condition du sélecteur.
            "opacity-0 peer-checked:opacity-100"
          )}
        >
          <svg aria-hidden="true" viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6.5 4.8 9.2 10 3.5" />
          </svg>
        </span>
      )}
    </label>
  );
}
