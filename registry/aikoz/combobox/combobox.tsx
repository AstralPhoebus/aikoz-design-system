import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComboboxOption {
  value: string;
  label: string;
  /** Second ligne — le réseau, la ville. Entre dans la recherche. */
  meta?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  /**
   * Libellé visible et persistant. **Obligatoire**, même raison que dans
   * `Input` : le placeholder disparaît à la première frappe.
   */
  label: string;
  labelHidden?: boolean;
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Consigne affichée AVANT le champ. */
  description?: string;
  error?: string;
  /** Marque le champ facultatif. Sans effet si `required` est posé. */
  optional?: boolean;
  required?: boolean;
  disabled?: boolean;
  /**
   * Message quand la recherche ne rend rien. Il **répète la saisie** :
   * « Aucun établissement pour “orlyy” » dit où chercher l'erreur, là où
   * « Aucun résultat » laisse croire à un vide de données.
   */
  emptyLabel?: (recherche: string) => string;
  /** Nombre d'options au-delà duquel on n'en rend plus. */
  maxRendu?: number;
  className?: string;
  children?: ReactNode;
}

// ─── Recherche ────────────────────────────────────────────────────────────────

/**
 * Normalise pour comparer : minuscules, accents retirés.
 *
 * Sans ça, « orly » ne trouve pas « Orly » et « roissy » ne trouve pas
 * « Roissypôle ». C'est la première chose qu'on tape et la première qui rate.
 */
export function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Les options qui correspondent, dans l'ordre d'utilité.
 *
 * Un `includes` seul range « Terminal 2E » avant « 2E » quand on tape « 2e ».
 * On classe donc : ce qui COMMENCE par la saisie d'abord, le reste ensuite,
 * et l'ordre d'origine départage à l'intérieur de chaque groupe — un tri
 * instable ferait sauter les lignes d'une frappe à l'autre.
 */
export function chercher(options: ComboboxOption[], recherche: string): ComboboxOption[] {
  const q = normaliser(recherche.trim());
  if (!q) return options;
  const debut: ComboboxOption[] = [];
  const dedans: ComboboxOption[] = [];
  for (const o of options) {
    const cible = normaliser(`${o.label} ${o.meta ?? ""}`);
    if (!cible.includes(q)) continue;
    (normaliser(o.label).startsWith(q) ? debut : dedans).push(o);
  }
  return [...debut, ...dedans];
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Champ de recherche à liste de suggestions.
 *
 * **Ce n'est pas un `Select`.** La règle est le NOMBRE d'options, et elle se
 * tranche à l'usage :
 *
 * | | `Select` | `Combobox` |
 * | --- | --- | --- |
 * | options | une dizaine | des centaines |
 * | on choisit | en parcourant | **en tapant** |
 * | saisie libre | impossible | filtre seulement |
 *
 * Chercher un établissement parmi trois cents dans un `Select`, c'est faire
 * défiler trois cents lignes. Choisir une année dans un `Combobox`, c'est
 * taper pour obtenir ce qu'on aurait vu d'un coup d'œil.
 *
 * ## Le motif ARIA, et pourquoi il est écrit à la main
 *
 * `role="combobox"` sur l'`<input>`, `aria-expanded`, `aria-controls` vers la
 * liste, `aria-activedescendant` vers l'option survolée — **le focus ne quitte
 * jamais le champ**. C'est ce qui permet de continuer à taper pendant qu'on
 * parcourt aux flèches, et c'est exactement ce qu'un `<div role="option">`
 * focusable casse : la frappe suivante part dans le vide.
 *
 * Il n'y a pas de dépendance ici parce que le motif tient en cinquante lignes
 * et que la seule partie difficile — `aria-activedescendant` — est justement
 * celle qu'une bibliothèque cache.
 *
 * **La liste est rendue dans le flux**, pas dans un `Portal`. Elle hérite donc
 * du registre et du thème de son conteneur, contrairement à `Select` et
 * `DropdownMenu` dont le panneau est à la racine du document.
 */
export function Combobox({
  label,
  labelHidden = false,
  options,
  value,
  onValueChange,
  placeholder = "Rechercher…",
  description,
  error,
  optional = false,
  required,
  disabled,
  emptyLabel = (r) => `Aucun résultat pour « ${r} »`,
  maxRendu = 50,
  className,
}: ComboboxProps) {
  const uid = useId();
  const champId = `${uid}-champ`;
  const listeId = `${uid}-liste`;
  const descId = description ? `${uid}-desc` : undefined;
  const errId = error ? `${uid}-err` : undefined;

  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const listeRef = useRef<HTMLUListElement>(null);

  const choisie = options.find((o) => o.value === value);
  const trouvees = useMemo(
    () => chercher(options, recherche).slice(0, maxRendu),
    [options, recherche, maxRendu],
  );
  const tronque = chercher(options, recherche).length - trouvees.length;

  const ouvrir = () => {
    setOuvert(true);
    setActif(0);
  };
  const fermer = () => {
    setOuvert(false);
    setRecherche("");
  };

  const retenir = (o: ComboboxOption) => {
    if (o.disabled) return;
    onValueChange?.(o.value);
    fermer();
  };

  const deplacer = (pas: number) => {
    if (!ouvert) return ouvrir();
    if (!trouvees.length) return;
    const suivant = (actif + pas + trouvees.length) % trouvees.length;
    setActif(suivant);
    // La ligne survolée doit rester visible : on parcourt sans la voir sinon.
    listeRef.current?.children[suivant]?.scrollIntoView({ block: "nearest" });
  };

  const auClavier = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        deplacer(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        deplacer(-1);
        break;
      case "Enter":
        if (ouvert && trouvees[actif]) {
          e.preventDefault();
          retenir(trouvees[actif]);
        }
        break;
      case "Escape":
        // Échap ferme SANS choisir, et rend la valeur retenue au champ : on
        // n'a pas voulu changer d'avis en ouvrant la liste.
        if (ouvert) {
          e.preventDefault();
          fermer();
        }
        break;
      case "Tab":
        // Tabuler hors du champ ferme, sans rien retenir. Un choix se fait à
        // l'Entrée ou au clic, jamais par accident en quittant.
        if (ouvert) fermer();
        break;
    }
  };

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={champId}
        className={cn("text-sm font-medium text-foreground", labelHidden && "sr-only")}
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
          <span className="ml-1 font-regular text-muted-foreground">(facultatif)</span>
        )}
      </label>

      {description && (
        <p id={descId} className="m-0 text-xs text-muted-foreground">
          {description}
        </p>
      )}

      <div className="relative">
        <input
          id={champId}
          type="text"
          role="combobox"
          // Les quatre attributs du motif. `aria-activedescendant` est celui
          // qui compte : il désigne la ligne parcourue SANS déplacer le focus,
          // donc sans interrompre la frappe.
          aria-expanded={ouvert}
          aria-controls={listeId}
          aria-activedescendant={
            ouvert && trouvees[actif] ? `${uid}-opt-${trouvees[actif].value}` : undefined
          }
          aria-autocomplete="list"
          aria-describedby={[descId, errId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          required={required}
          disabled={disabled}
          placeholder={choisie ? choisie.label : placeholder}
          value={ouvert ? recherche : (choisie?.label ?? "")}
          onChange={(e) => {
            setRecherche(e.target.value);
            setActif(0);
            if (!ouvert) setOuvert(true);
          }}
          onFocus={ouvrir}
          onBlur={(e) => {
            // Un clic DANS la liste passe par un blur du champ : on ne ferme
            // que si le focus part vraiment ailleurs.
            if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) fermer();
          }}
          onKeyDown={auClavier}
          className={cn(
            "w-full min-h-11 rounded-[var(--radius)] bg-[var(--card)] px-3.5 py-2.5 text-sm",
            "border border-[var(--input)] text-foreground",
            "placeholder:text-[var(--muted-foreground)]",
            "transition-colors motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:border-[var(--ring)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1",
            "focus-visible:ring-offset-[var(--background)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error && "border-[var(--destructive-text)]",
          )}
        />

        <ul
          ref={listeRef}
          id={listeId}
          role="listbox"
          aria-label={label}
          className={cn(
            "absolute z-40 mt-1 max-h-64 w-full min-w-0 list-none overflow-y-auto p-1",
            "rounded-[var(--radius)] border border-[var(--border-strong)]",
            "bg-[var(--popover)] shadow-lg",
            !ouvert && "hidden",
          )}
        >
          {trouvees.map((o, i) => (
            <li
              key={o.value}
              id={`${uid}-opt-${o.value}`}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              // PAS de `tabIndex` : le focus reste dans le champ, c'est tout
              // l'objet d'`aria-activedescendant`.
              onMouseDown={(e) => {
                // `mousedown` et non `click` : le clic arriverait après le
                // blur du champ, qui a déjà fermé la liste.
                e.preventDefault();
                retenir(o);
              }}
              onMouseEnter={() => setActif(i)}
              className={cn(
                "flex min-h-9 tactile:min-h-11 cursor-pointer flex-col justify-center",
                "rounded-[calc(var(--radius)/2)] px-2.5 py-1.5 text-sm",
                i === actif && "bg-[var(--surface-hover)]",
                o.value === value && "font-semibold",
                o.disabled && "pointer-events-none opacity-40",
              )}
            >
              <span className="truncate text-[var(--popover-foreground)]">{o.label}</span>
              {o.meta && (
                <span className="truncate text-xs text-muted-foreground">{o.meta}</span>
              )}
            </li>
          ))}

          {!trouvees.length && (
            <li role="option" aria-selected={false} aria-disabled className="px-2.5 py-3 text-sm text-muted-foreground">
              {emptyLabel(recherche)}
            </li>
          )}

          {tronque > 0 && (
            // Compté, jamais tu : une liste coupée en silence fait croire que
            // ce qu'on cherche n'existe pas.
            <li
              aria-hidden="true"
              className="border-t border-border px-2.5 py-2 text-xs text-muted-foreground"
            >
              {tronque} autre{tronque > 1 ? "s" : ""} — affinez la recherche
            </li>
          )}
        </ul>
      </div>

      {error && (
        <p id={errId} role="alert" className="m-0 text-xs text-[var(--destructive-text)]">
          {error}
        </p>
      )}
    </div>
  );
}
