import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StepperStep {
  label: string;
  /**
   * Rend l'étape cliquable — pour revenir en arrière dans un tunnel. Ne
   * jamais poser de lien vers une étape non encore atteinte : l'utilisateur
   * y arriverait sans les données que l'étape précédente devait produire.
   */
  href?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Index de l'étape en cours, à partir de 0. */
  current: number;
  /** Nom du `<nav>`. */
  label?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Fil de progression — transposé des 5 étapes du tunnel du prototype site.
 *
 * **Le compte est écrit en toutes lettres, pas seulement dessiné.** « Étape 2
 * sur 5 » figure dans le nom du `<nav>` : sans lui, un utilisateur de lecteur
 * d'écran entend une liste de cinq intitulés sans savoir où il en est ni
 * combien il en reste — la barre de progression et les pastilles numérotées
 * ne lui disent rien. C'est l'erreur qu'on trouve dans la quasi-totalité des
 * tunnels de commande.
 *
 * Trois états, portés chacun par **deux canaux** :
 *
 *   faite     coche (forme) + pastille pleine   + « , terminée » à l'énoncé
 *   en cours  `aria-current="step"`             + graisse + pastille pleine
 *   à venir   pastille creuse (contour)         + texte en retrait
 *
 * Aucun ne repose sur la seule couleur (WCAG 1.4.1) : la coche et le contour
 * sont des différences de FORME, lisibles en niveaux de gris.
 *
 * Une étape à venir n'est jamais un lien. Un tunnel se remonte, il ne se
 * saute pas — un lien vers l'étape 4 depuis l'étape 2 mène à un écran privé
 * des données que 2 et 3 devaient produire.
 */
export function Stepper({
  steps,
  current,
  label = "Progression",
  orientation = "horizontal",
  className,
}: StepperProps) {
  const borne = Math.min(Math.max(current, 0), steps.length - 1);

  return (
    <nav
      aria-label={`${label} — étape ${borne + 1} sur ${steps.length}`}
      className={className}
    >
      <ol
        className={cn(
          "flex list-none m-0 p-0",
          orientation === "horizontal"
            ? "flex-row flex-wrap items-center gap-x-5 gap-y-2"
            : "flex-col gap-3"
        )}
      >
        {steps.map((step, i) => {
          const faite = i < borne;
          const encours = i === borne;
          const cliquable = !!step.href && faite;

          const pastille = (
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                "text-2xs font-semibold tabular-nums border",
                faite || encours
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-transparent text-muted-foreground border-[var(--border-strong)]"
              )}
            >
              {faite ? (
                <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6.5 4.8 9.2 10 3.5" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
          );

          const texte = (
            <span
              className={cn(
                "text-sm",
                encours
                  ? "font-semibold text-foreground"
                  : faite
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {/* L'état est dit, pas seulement dessiné : la coche et la
                  pastille creuse sont muettes pour un lecteur d'écran. En UNE
                  chaîne et non dans un `sr-only` séparé — l'algorithme de nom
                  accessible joint les éléments par une espace, ce qui donnait
                  « Sources , terminée ». */}
              <span className="sr-only">
                {faite ? `${step.label}, terminée` : !encours ? `${step.label}, à venir` : step.label}
              </span>
              <span aria-hidden="true">{step.label}</span>
            </span>
          );

          return (
            <li
              key={step.label}
              aria-current={encours ? "step" : undefined}
              className={cn(
                "flex items-center gap-2",
                orientation === "horizontal" && "min-w-0"
              )}
            >
              {cliquable ? (
                <a
                  href={step.href}
                  className={cn(
                    "flex items-center gap-2 no-underline rounded-[var(--radius)]",
                    "min-h-11 px-1",
                    "hover:[&_span:last-child]:underline underline-offset-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                  )}
                >
                  {pastille}
                  {texte}
                </a>
              ) : (
                <span className="flex items-center gap-2 min-h-11 px-1">
                  {pastille}
                  {texte}
                </span>
              )}

              {/* PAS de trait de liaison entre les étapes. Il y en avait un ;
                  il a sauté au premier rendu large. Dès que la liste passe à
                  la ligne — ce qu'elle DOIT faire, WCAG 1.4.10 demande le
                  reflow plutôt qu'un défilement horizontal — le trait de la
                  dernière étape d'une ligne pend dans le vide.
                  Aucun correctif CSS ne le rattrape : on ne peut pas savoir,
                  en CSS, quel élément termine une ligne. Et le trait était de
                  toute façon un troisième canal en trop : la pastille pleine
                  ou creuse porte déjà l'état, la liste ordonnée porte déjà la
                  succession. */}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
