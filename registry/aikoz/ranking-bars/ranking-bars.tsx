import { useRef, useState } from "react";
import { StarFill } from "@material-symbols-svg/react/rounded";
import { cn } from "@registry/aikoz/lib/utils";
import { Breadcrumb, type BreadcrumbItem } from "@registry/aikoz/breadcrumb/breadcrumb";
import { ProgressBar, type ProgressLevel } from "@registry/aikoz/progress-bar/progress-bar";
import { EmptyState } from "@registry/aikoz/empty-state/empty-state";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RankingBarItem {
  /** Clé stable — le libellé ne suffit pas si deux branches le partagent. */
  id: string;
  label: string;
  /** Sous-titre — un volume, un effectif. « 6 843 avis ». */
  meta?: string;
  /** Valeur classante, dans l'échelle [0, `max`]. */
  value: number;
  /** Niveau forcé — sinon déduit des seuils de `ProgressBar`. */
  level?: ProgressLevel;
  /** Éléments enfants. Absent ou vide = dernier niveau, la ligne n'est pas cliquable. */
  children?: RankingBarItem[];
}

export interface RankingBarsProps {
  /** Nom de la racine, utilisé par le fil d'Ariane après le premier forage. */
  rootLabel: string;
  /** Premier niveau. */
  items: RankingBarItem[];
  /** Borne haute de l'échelle — 5 pour une note, 100 pour un pourcentage. */
  max?: number;
  /** Ce que la valeur mesure — porte le nom accessible de chaque barre. */
  valueLabel: string;
  formatValue?: (v: number) => string;
  /** Étoile décorative après la valeur — pertinente pour une note, pas pour un pourcentage. */
  showRating?: boolean;
  /** Prévenu à chaque changement de niveau, avec le chemin complet. */
  onNavigate?: (chemin: RankingBarItem[]) => void;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Classement en barres horizontales, forable sur plusieurs niveaux —
 * transposé du bloc « Classement par thématique » (Duty Free CDG).
 *
 * **Chaque ligne EST le bouton.** Contrairement à `GeoDrilldown` — dont le
 * graphique recharts est `aria-hidden` et exige un bouton « Explorer » séparé
 * dans un tableau — ce composant ne dessine rien en SVG : les lignes sont du
 * HTML natif, donc directement focalisables et activables. Le clic et
 * l'Entrée font la même chose, sans détour.
 *
 * **Une ligne sans enfants n'est pas un bouton.** La rendre cliquable sans
 * action promettrait un détail qui n'existe pas — même raisonnement que le
 * fil d'Ariane, qui ne lie jamais la page courante.
 *
 * Le niveau de couleur de `ProgressBar` reste déduit de ses seuils par
 * défaut (90 % / 60 % de `max`), pas forcé au vert : sur une échelle de note,
 * une thématique à 2,5/5 doit pouvoir remonter en `critical`, exactement
 * comme sur le reste du système.
 */
export function RankingBars({
  rootLabel,
  items,
  max = 5,
  valueLabel,
  formatValue = (v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  showRating = true,
  onNavigate,
  className,
}: RankingBarsProps) {
  const [chemin, setChemin] = useState<RankingBarItem[]>([]);
  // L'annonce du changement de niveau : sans elle, un lecteur d'écran voit la
  // liste se réécrire sans savoir pourquoi. Même dispositif que `GeoDrilldown`.
  const [annonce, setAnnonce] = useState("");
  const ancre = useRef<HTMLDivElement | null>(null);

  const niveau = chemin.length === 0 ? items : (chemin[chemin.length - 1].children ?? []);

  const aller = (suite: RankingBarItem[]) => {
    setChemin(suite);
    const niveauSuivant = suite.length === 0 ? items : (suite[suite.length - 1].children ?? []);
    const nom = suite.length === 0 ? rootLabel : suite[suite.length - 1].label;
    setAnnonce(
      `${nom} — ${niveauSuivant.length} élément${niveauSuivant.length > 1 ? "s" : ""}.`
    );
    onNavigate?.(suite);
    // Le focus suit le forage : la ligne qu'on vient d'activer disparaît du
    // document avec l'ancien niveau. Sans reprise, il retombe sur `body`.
    requestAnimationFrame(() => ancre.current?.focus());
  };

  const fil: BreadcrumbItem[] = [
    { label: rootLabel, onClick: chemin.length ? () => aller([]) : undefined },
    ...chemin.map((it, i) => ({
      label: it.label,
      onClick: i < chemin.length - 1 ? () => aller(chemin.slice(0, i + 1)) : undefined,
    })),
  ];

  const titre = chemin.length === 0 ? rootLabel : chemin[chemin.length - 1].label;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {chemin.length > 0 && <Breadcrumb items={fil} label={`Niveaux — ${valueLabel}`} />}

      <div ref={ancre} tabIndex={-1} className="outline-none">
        {/* Région live : c'est elle qui dit qu'on a changé de niveau. */}
        <p role="status" aria-live="polite" className="sr-only">
          {annonce}
        </p>

        {niveau.length === 0 ? (
          <EmptyState
            density="compact"
            title={`Aucune donnée sous ${titre}`}
            description="Ce niveau ne se décompose pas davantage."
          />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {niveau.map((it) => {
              const forable = !!it.children?.length;
              // Portée par la ligne elle-même (aria-label du bouton/de la
              // div) : la barre imbriquée reste décorative pour ne pas
              // dupliquer l'annonce d'un `role="meter"` niché dans un bouton.
              const accessibleLabel = `${it.label} — ${formatValue(it.value)} sur ${max}, ${valueLabel}${
                it.meta ? `, ${it.meta}` : ""
              }`;
              const contenu = (
                <>
                  <span aria-hidden="true" className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-bold text-foreground">{it.label}</span>
                    {it.meta && (
                      <span className="truncate text-xs text-muted-foreground">{it.meta}</span>
                    )}
                  </span>
                  <ProgressBar
                    value={it.value}
                    max={max}
                    level={it.level}
                    label={null}
                    className="w-28 shrink-0 sm:w-48"
                  />
                  <span
                    aria-hidden="true"
                    className="flex shrink-0 items-center gap-1 text-sm font-black tabular-nums text-foreground"
                  >
                    {formatValue(it.value)}
                    {showRating && (
                      <StarFill className="size-4" style={{ color: "var(--rating)" }} />
                    )}
                  </span>
                </>
              );

              return (
                <li key={it.id}>
                  {forable ? (
                    <button
                      type="button"
                      onClick={() => aller([...chemin, it])}
                      aria-label={accessibleLabel}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-4 rounded-[var(--radius)]",
                        "bg-transparent px-2 py-1.5 text-left transition-colors cursor-pointer",
                        "hover:bg-[var(--surface-hover)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                      )}
                    >
                      {contenu}
                    </button>
                  ) : (
                    <div
                      role="group"
                      aria-label={accessibleLabel}
                      className="flex min-h-11 w-full items-center gap-4 px-2 py-1.5"
                    >
                      {contenu}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
