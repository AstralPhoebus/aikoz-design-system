import { useId, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccordionItem {
  value: string;
  /** Intitulé du volet. C'est lui qui devient un titre du document. */
  title: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /**
   * `single` — un seul volet ouvert, ouvrir referme le précédent. C'est le
   * comportement de la FAQ du prototype site.
   * `multiple` — plusieurs volets ouverts en même temps, pour une
   * documentation qu'on compare.
   */
  type?: "single" | "multiple";
  /** Valeurs ouvertes au montage. */
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (open: string[]) => void;
  /**
   * Niveau de titre des intitulés. **3 par défaut, et le prop existe pour
   * qu'on le règle**, pas pour décorer : les intitulés d'un accordéon
   * forment le plan de la section, et un lecteur d'écran s'en sert pour
   * sauter de volet en volet. Le bon niveau est celui d'un cran sous le
   * titre qui précède l'accordéon.
   *
   * C'est la différence avec `Card`, qui n'a délibérément pas de titre :
   * là le titre était du contenu libre, ici il EST la structure.
   */
  headingLevel?: 2 | 3 | 4 | 5;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Accordéon — transposé de la FAQ du prototype site.
 *
 * Le motif tient en trois attributs, et chacun règle un problème précis :
 *
 *   `aria-expanded`   sur le bouton — dit ouvert ou fermé. Sans lui,
 *                     l'utilisateur clique sans savoir ce qu'il déclenche.
 *   `aria-controls`   sur le bouton — relie au panneau.
 *   `hidden`          sur le panneau fermé — le retire de l'arbre
 *                     d'accessibilité ET de la tabulation. Un panneau
 *                     seulement masqué en `height: 0` reste focusable :
 *                     le focus disparaît dans du contenu invisible.
 *
 * Le bouton est **enveloppé dans un titre**, pas remplacé par lui. Un
 * `<h3>` cliquable n'est ni focusable ni actionnable au clavier ; un bouton
 * sans titre autour prive la section de son plan. Il faut les deux.
 *
 * Pas d'animation de hauteur : animer vers `height: auto` demande de mesurer
 * le contenu à chaque ouverture, et le résultat saute dès que le contenu
 * change de taille — une image qui charge, une police qui arrive. Le volet
 * s'ouvre net. C'est plus honnête et ça ne casse jamais.
 */
export function Accordion({
  items,
  type = "single",
  defaultValue = [],
  value,
  onValueChange,
  headingLevel = 3,
  className,
}: AccordionProps) {
  const uid = useId();
  const [interne, setInterne] = useState<string[]>(defaultValue);
  const ouverts = value ?? interne;
  const Titre = `h${headingLevel}` as ElementType;

  function basculer(v: string) {
    const deja = ouverts.includes(v);
    const suivant =
      type === "single" ? (deja ? [] : [v]) : deja ? ouverts.filter((x) => x !== v) : [...ouverts, v];
    if (value === undefined) setInterne(suivant);
    onValueChange?.(suivant);
  }

  return (
    <div className={cn("flex flex-col divide-y divide-border border-y border-border", className)}>
      {items.map((item) => {
        const ouvert = ouverts.includes(item.value);
        const idBouton = `${uid}-${item.value}-bouton`;
        const idPanneau = `${uid}-${item.value}-panneau`;

        return (
          <div key={item.value}>
            <Titre className="m-0 font-heading">
              <button
                type="button"
                id={idBouton}
                aria-expanded={ouvert}
                aria-controls={idPanneau}
                disabled={item.disabled}
                onClick={() => basculer(item.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-4",
                  "min-h-12 py-3 text-left text-base font-medium text-foreground",
                  "bg-transparent cursor-pointer transition-colors",
                  "hover:text-[var(--secondary)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <span className="min-w-0">{item.title}</span>
                {/* Le chevron TOURNE : l'état ne tient pas à un changement de
                    teinte mais à une orientation, perceptible même sans
                    percevoir la couleur. Et il est décoratif — `aria-expanded`
                    porte déjà l'information pour les lecteurs d'écran. */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 12 12"
                  className={cn(
                    "size-3 shrink-0 transition-transform motion-reduce:transition-none",
                    ouvert && "rotate-180"
                  )}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 4.5 6 8l3.5-3.5" />
                </svg>
              </button>
            </Titre>

            {/* `hidden` plutôt qu'une classe : l'attribut retire le panneau de
                l'arbre d'accessibilité et de la tabulation d'un coup. */}
            <div
              id={idPanneau}
              role="region"
              aria-labelledby={idBouton}
              hidden={!ouvert}
              className="pb-4 text-sm text-muted-foreground"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
