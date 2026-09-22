import { useId, forwardRef} from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Slot {
  /** Identifiant du créneau — un ISO 8601 complet, en général. */
  value: string;
  /** Heure affichée : « 09:30 ». */
  time: string;
  /** Créneau déjà pris. Reste annoncé, mais non sélectionnable. */
  full?: boolean;
}

export interface SlotDay {
  /** Jour en clair : « Mardi 14 avril ». C'est lui qui nomme la liste. */
  label: string;
  slots: Slot[];
}

export interface SlotPickerProps {
  /** Question posée — **obligatoire**, rendue en `<legend>`. */
  legend: string;
  days: SlotDay[];
  value?: string;
  onValueChange?: (value: string) => void;
  /** Message d'erreur, annoncé en `role="alert"`. */
  error?: string;
  /** Texte affiché quand aucun jour n'a de créneau. */
  emptyLabel?: string;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Choix d'un créneau.
 *
 * **Un seul `<fieldset>` pour tous les jours, pas un par jour.** Le choix est
 * unique sur l'ensemble : imbriquer un groupe de radios par journée
 * laisserait croire qu'on choisit une heure dans chaque, et casserait le
 * parcours aux flèches — qui, avec un `name` commun, traverse nativement
 * toute la grille, d'un jour à l'autre. Les jours nomment leur liste par
 * `aria-labelledby`, ce qui donne le contexte sans découper le groupe.
 *
 * **Un créneau complet reste annoncé.** Il est `disabled`, donc sauté par les
 * flèches, mais il est toujours lu — « 11:00, complet ». Le retirer de la
 * grille ferait disparaître l'information : l'utilisateur ne saurait pas que
 * ce créneau existe et qu'il est pris, il croirait que le cabinet n'ouvre
 * pas à cette heure-là.
 *
 * **L'état complet ne tient pas à la couleur** : texte barré, opacité,
 * `disabled` annoncé, et la mention « complet » en `sr-only`.
 */
export const SlotPicker = forwardRef<HTMLFieldSetElement, SlotPickerProps>(
  function SlotPicker({
  legend,
  days,
  value,
  onValueChange,
  error,
  emptyLabel = "Aucun créneau disponible sur cette période.",
  className,
}, ref) {
  const uid = useId();
  const errId = error ? `${uid}-err` : undefined;
  const vide = days.every((d) => d.slots.length === 0);

  return (
    <fieldset
      // La référence sert à emmener le focus ici après une soumission
      // refusée : `BookingFlow` y cherche le premier créneau sélectionnable.
      // Un `<fieldset>` ne prend pas le focus lui-même, et lui en donner un
      // artificiellement ferait annoncer le groupe sans dire quoi faire.
      ref={ref}
      className={cn("m-0 p-0 border-0 flex flex-col gap-4", className)}
      aria-describedby={errId}
    >
      <legend className="p-0 text-sm font-medium text-foreground">{legend}</legend>

      {vide ? (
        <p className="m-0 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        days.map((day, i) => (
          <div key={day.label} className="flex flex-col gap-2">
            <span
              id={`${uid}-j${i}`}
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {day.label}
            </span>
            <div
              role="group"
              aria-labelledby={`${uid}-j${i}`}
              className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2"
            >
              {day.slots.map((s) => (
                <label
                  key={s.value}
                  className={cn(
                    "relative inline-flex items-center justify-center",
                    // 44px : un créneau se vise au pouce, souvent en marchant.
                    "min-h-11 rounded-[var(--radius)] border-2 text-sm tabular-nums",
                    "transition-colors cursor-pointer",
                    "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2",
                    "has-[:focus-visible]:ring-[var(--ring)] has-[:focus-visible]:ring-offset-2",
                    "has-[:focus-visible]:ring-offset-[var(--background)]",
                    s.full
                      ? "border-border bg-[var(--muted)] text-muted-foreground line-through cursor-not-allowed opacity-70"
                      : cn(
                          "border-[var(--border-strong)] bg-[var(--card)] text-foreground",
                          "hover:bg-[var(--surface-hover)]",
                          // Comme dans `ChoiceCard` : le trait retenu et le
                          // trait au repos ne se séparent que de 1,30:1 en
                          // clair. C'est donc l'INVERSION du fond qui porte
                          // l'état, pas la teinte du trait.
                          "has-[:checked]:border-[var(--primary)]",
                          "has-[:checked]:bg-[var(--primary)]",
                          "has-[:checked]:text-[var(--primary-foreground)]",
                          "has-[:checked]:font-semibold"
                        )
                  )}
                >
                  <input
                    type="radio"
                    // Un `name` commun à TOUS les jours : c'est ce qui fait du
                    // tout un seul groupe, et ce qui laisse les flèches
                    // traverser la grille entière.
                    name={`${uid}-creneau`}
                    value={s.value}
                    checked={value === s.value}
                    disabled={s.full}
                    onChange={() => onValueChange?.(s.value)}
                    // Nom composé en UNE chaîne. Un `sr-only` séparé portant
                    // « , complet » donnait « 11:00 , complet » : l'algorithme
                    // de nom accessible joint les éléments par une espace, et
                    // la virgule se détachait. Le nom contient toujours
                    // l'heure visible, ce qu'exige WCAG 2.5.3.
                    aria-label={s.full ? `${s.time}, complet` : undefined}
                    className="sr-only"
                  />
                  {s.time}
                </label>
              ))}
            </div>
          </div>
        ))
      )}

      {error && (
        <p id={errId} role="alert" className="m-0 text-xs text-[var(--destructive-text)]">
          {error}
        </p>
      )}
    </fieldset>
  );
});
