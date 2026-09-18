import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ViewTab {
  value: string;
  label: string;
  /** Panneau associé. Seul celui de l'onglet actif est monté. */
  content?: ReactNode;
  disabled?: boolean;
}

export interface ViewTabsProps {
  /**
   * Nom de la barre d'onglets — **obligatoire**. Il dit ce que ces onglets
   * font basculer : « Vues du classement », pas « Onglets ».
   */
  label: string;
  tabs: ViewTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * `automatic` — le panneau change dès que la flèche déplace le focus. C'est
   * le comportement recommandé quand l'échange est instantané : l'utilisateur
   * parcourt les vues sans avoir à valider.
   *
   * `manual` — la flèche déplace le focus, Entrée ou Espace valide. À réserver
   * aux panneaux qui déclenchent un chargement : en automatique, traverser
   * cinq onglets lancerait cinq requêtes dont quatre inutiles.
   */
  activation?: "automatic" | "manual";
  className?: string;
  /** Classe du panneau. */
  panelClassName?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Bascule de vue à l'intérieur d'une page — décision 2 de l'inventaire.
 *
 * **La règle qui décide, sans exception : c'est le COMPORTEMENT, jamais
 * l'apparence.** Ce composant échange un panneau et laisse la route
 * inchangée. Un « onglet » qui change de route est un lien stylé en onglet :
 * il relève de `SidebarNav`, ou d'une liste de liens. Lui donner `role="tab"`
 * annonce à un lecteur d'écran un panneau qui va s'échanger, alors que la
 * page entière va être remplacée.
 *
 * Clavier, conforme au motif Tabs de l'ARIA APG :
 *
 *   Tab            entre dans la barre, puis en sort vers le panneau —
 *                  un seul arrêt pour toute la barre (tabindex tournant)
 *   ← →            d'un onglet à l'autre, en boucle
 *   Début / Fin    premier / dernier onglet
 *   Entrée/Espace  valide, en activation `manual` seulement
 *
 * Le tabindex tournant est ce qui distingue une barre d'onglets d'une rangée
 * de boutons : sans lui, il faudrait dix tabulations pour traverser dix
 * onglets avant d'atteindre leur contenu.
 */
export function ViewTabs({
  label,
  tabs,
  value,
  defaultValue,
  onValueChange,
  activation = "automatic",
  className,
  panelClassName,
}: ViewTabsProps) {
  const uid = useId();
  const premier = tabs.find((t) => !t.disabled)?.value ?? tabs[0]?.value;
  const [interne, setInterne] = useState(defaultValue ?? premier);
  const actif = value ?? interne;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function choisir(v: string) {
    if (value === undefined) setInterne(v);
    onValueChange?.(v);
  }

  function naviguer(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    // Les onglets désactivés sont sautés par les flèches : les traverser
    // obligerait l'utilisateur à passer sur ce qu'il ne peut pas atteindre.
    const actifs = tabs.filter((t) => !t.disabled);
    const pos = actifs.findIndex((t) => t.value === tabs[index].value);
    let cible: string | undefined;

    switch (e.key) {
      case "ArrowRight":
        cible = actifs[(pos + 1) % actifs.length]?.value;
        break;
      case "ArrowLeft":
        cible = actifs[(pos - 1 + actifs.length) % actifs.length]?.value;
        break;
      case "Home":
        cible = actifs[0]?.value;
        break;
      case "End":
        cible = actifs[actifs.length - 1]?.value;
        break;
      case "Enter":
      case " ":
        if (activation === "manual") {
          e.preventDefault();
          choisir(tabs[index].value);
        }
        return;
      default:
        return;
    }

    if (!cible) return;
    e.preventDefault();
    // Le focus suit toujours la flèche ; la sélection ne suit qu'en
    // activation automatique. C'est exactement ce que distingue l'APG.
    refs.current[cible]?.focus();
    if (activation === "automatic") choisir(cible);
  }

  const courant = tabs.find((t) => t.value === actif);

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 border-b border-border overflow-x-auto"
      >
        {tabs.map((t, i) => {
          const estActif = t.value === actif;
          return (
            <button
              key={t.value}
              ref={(el) => {
                refs.current[t.value] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${t.value}`}
              aria-selected={estActif}
              // `aria-controls` seulement si le panneau EXISTE. Un onglet
              // sans `content` n'en rend aucun ; pointer vers un identifiant
              // absent produit de l'ARIA invalide, qu'aucun lecteur d'écran
              // ne peut suivre — et que rien ne signalait jusqu'ici.
              aria-controls={
                t.content !== undefined ? `${uid}-panel-${t.value}` : undefined
              }
              // Tabindex tournant : un seul onglet est dans l'ordre de
              // tabulation, les flèches font le reste.
              tabIndex={estActif ? 0 : -1}
              disabled={t.disabled}
              onClick={() => choisir(t.value)}
              onKeyDown={(e) => naviguer(e, i)}
              className={cn(
                "shrink-0 -mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize",
                "min-h-11 transition-colors bg-transparent cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                "rounded-t-[var(--radius)]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // L'onglet actif se distingue par le TRAIT et par la couleur
                // du texte, deux canaux — mais aucun des deux n'est le canal
                // non visuel : celui-là, c'est `aria-selected`.
                estActif
                  ? "border-[var(--secondary)] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {courant?.content !== undefined && (
        <div
          role="tabpanel"
          id={`${uid}-panel-${courant.value}`}
          aria-labelledby={`${uid}-tab-${courant.value}`}
          // `tabIndex={0}` : le panneau devient focusable, ce qui le rend
          // défilable au clavier quand son contenu déborde. Sans lui, un
          // panneau sans élément interactif est inatteignable au clavier.
          tabIndex={0}
          className={cn(
            "pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            panelClassName
          )}
        >
          {courant.content}
        </div>
      )}
    </div>
  );
}
