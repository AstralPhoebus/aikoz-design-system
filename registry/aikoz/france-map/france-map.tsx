import { useId, useMemo, useState } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { BOITE, REGIONS, DEPARTEMENTS, DEPARTEMENTS_PAR_REGION, OUTRE_MER, type ZoneCarte } from "./geometrie";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FranceMapProps {
  /** Ce que la carte montre, **unité comprise** — « Avis reçus », « Taux (%) ». */
  valueLabel: string;
  /** Valeurs par code INSEE : `{ "11": 1284, "75": 612 }`. */
  values: Record<string, number>;
  /** Niveau affiché. `"departement"` seul montre les 96 ; avec `region`, ceux d'une région. */
  level?: "region" | "departement";
  /** Code INSEE de région — restreint l'affichage à ses départements. */
  region?: string;
  /** Prévenu au clic sur une zone. Raccourci souris : la commande de référence est ailleurs. */
  onSelect?: (code: string, nom: string) => void;
  /** Zone mise en avant, par code INSEE. */
  selected?: string;
  formatValue?: (v: number) => string;
  /** Nombre de classes de couleur. 5 par défaut ; au-delà de 6 on ne les distingue plus. */
  classes?: number;
  /**
   * Affiche les cartouches d'outre-mer. `true` par défaut au niveau national.
   * Ils disparaissent quand on est descendu dans une région de métropole :
   * ils n'y ont rien à faire.
   */
  outreMer?: boolean;
  height?: number;
  className?: string;
}

// ─── Échelle ──────────────────────────────────────────────────────────────────

/**
 * Les bornes de classes, par quantiles.
 *
 * Pas des intervalles égaux : la donnée territoriale est presque toujours
 * très asymétrique — l'Île-de-France pèse trois fois la deuxième région. À
 * intervalles égaux, elle occupe seule la dernière classe et tout le reste se
 * tasse dans la première, ce qui ne montre plus rien. Les quantiles
 * répartissent les zones entre les classes.
 */
function bornes(valeurs: number[], classes: number): number[] {
  const tri = [...valeurs].sort((a, b) => a - b);
  if (tri.length === 0) return [];
  return Array.from({ length: classes - 1 }, (_, i) => {
    const pos = ((i + 1) / classes) * (tri.length - 1);
    const bas = Math.floor(pos);
    const haut = Math.min(bas + 1, tri.length - 1);
    return tri[bas] + (tri[haut] - tri[bas]) * (pos - bas);
  });
}

/**
 * La teinte d'une classe.
 *
 * Un `color-mix` entre une couleur de MARQUE et la carte, plutôt qu'une
 * échelle figée : elle suit la marque et le thème sans qu'on ait rien à
 * recalculer.
 *
 * Le haut de l'échelle est `--primary-edge`, pas `--primary`, et c'est tout
 * le sujet. En clair les deux valent la même chose, donc rien ne change. En
 * sombre, `--primary` est un aplat de milieu de rampe (clarté ~0,45) posé sur
 * une carte à 0,223 : cinq classes n'avaient qu'un tiers de l'amplitude du
 * clair pour s'étaler, et se touchaient.
 *
 *     écart ΔE entre deux classes voisines, mesuré sur le rendu
 *     clair    0,11 à 0,18        sombre AVANT   0,054 à 0,106
 *
 * `--primary-edge` est le palier CLAIR de la même rampe — celui qui sert déjà
 * de liseré au bouton primaire en sombre. L'échelle retrouve son amplitude
 * sans introduire ni token ni couleur.
 */
function teinte(classe: number, classes: number): string {
  const part = 14 + (86 * classe) / Math.max(1, classes - 1);
  return `color-mix(in oklch, var(--primary-edge) ${part.toFixed(0)}%, var(--card))`;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Carte choroplèthe de la France — régions ou départements.
 *
 * **Elle ne remplace pas le classement, elle répond à une autre question.**
 * `GeoDrilldown` compare des longueurs de barres : il répond à « combien, et
 * qui devant qui ». La carte répond à « où » — un creux dans le Sud-Ouest,
 * une concentration autour de Paris, ça ne se lit pas dans une liste triée.
 *
 * Les trois défauts d'une choroplèthe restent vrais et sont assumés :
 *
 * 1. **La surface ment.** La Lozère et le Nord pèsent pareil à l'œil alors
 *    que l'un porte cent fois plus de monde. La carte montre donc une
 *    RÉPARTITION, jamais un classement — pour le classement, il y a les
 *    barres et le tableau, dans le même bloc.
 * 2. **La couleur seule ne dit rien de précis.** Cinq classes, pas plus :
 *    au-delà l'œil ne les sépare plus. La valeur exacte est dans l'infobulle
 *    et dans le tableau.
 * 3. **Elle ne se lit pas au lecteur d'écran.** Le SVG est donc `aria-hidden`
 *    et la carte n'est jamais le seul affichage : c'est la même règle que
 *    pour les graphiques, et c'est pour ça que `ChartFrame` a une vue
 *    « Tableau ».
 *
 * Aucune bibliothèque géographique n'est embarquée : les chemins sont
 * pré-projetés en Lambert-93 par `scripts/carte-france.py`.
 */
export function FranceMap({
  valueLabel,
  values,
  level = "region",
  region,
  onSelect,
  selected,
  formatValue = (v) => v.toLocaleString("fr-FR"),
  classes = 5,
  outreMer = true,
  height = 360,
  className,
}: FranceMapProps) {
  const uid = useId().replace(/:/g, "");
  const [survol, setSurvol] = useState<ZoneCarte | null>(null);

  const zones = useMemo(() => {
    if (region) {
      const codes = new Set(DEPARTEMENTS_PAR_REGION[region] ?? []);
      return DEPARTEMENTS.filter((z) => codes.has(z.code));
    }
    return level === "region" ? REGIONS : DEPARTEMENTS;
  }, [level, region]);

  // Les cartouches comptent dans les quantiles. Ils portent la même échelle
  // de couleur que la métropole — les exclure du calcul les tasserait tous
  // dans la classe la plus basse, ce qui se lirait comme « rien outre-mer ».
  const seuils = useMemo(() => {
    const codes = [
      ...zones.map((z) => z.code),
      ...(outreMer && !region
        ? OUTRE_MER.map((t) => (level === "region" ? t.codeRegion : t.code))
        : []),
    ];
    const v = codes.map((c) => values[c]).filter((x): x is number => typeof x === "number");
    return bornes(v, classes);
  }, [zones, values, classes, outreMer, region, level]);

  const classeDe = (code: string): number | null => {
    const v = values[code];
    if (typeof v !== "number") return null;
    let c = 0;
    while (c < seuils.length && v > seuils[c]) c++;
    return c;
  };

  // (déplacé plus haut : les seuils en dépendent)
  // Les cartouches n'apparaissent qu'au niveau national : descendus dans une
  // région de métropole, ils n'ont rien à y faire.
  const cartouches = outreMer && !region ? OUTRE_MER : [];
  const codeDrom = (t: (typeof OUTRE_MER)[number]) =>
    level === "region" ? t.codeRegion : t.code;

  const comptees = [
    ...zones.map((z) => values[z.code]),
    ...cartouches.map((t) => values[codeDrom(t)]),
  ].filter((v): v is number => typeof v === "number");
  const total = comptees.reduce((s, v) => s + v, 0);
  const renseignees = { length: comptees.length };

  return (
    <figure className={cn("m-0 flex flex-col gap-3", className)}>
      {/* Les motifs, dans leur propre `<svg>` de taille nulle.
          Ils étaient dans la carte principale, et les cartouches d'outre-mer
          y faisaient référence depuis un AUTRE `<svg>`. Ça marche dans la
          plupart des navigateurs — les identifiants sont ceux du document —
          mais ça a toujours été le genre de détail qui casse quelque part.
          Défini une fois, hors des deux, la question ne se pose plus. */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <pattern
            id={`${uid}-vide`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="var(--muted)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--border)" strokeWidth="2" />
          </pattern>
        </defs>
      </svg>

      {/* Le résumé énoncé, comme sur les graphiques : c'est lui que le
          lecteur d'écran entend, pas le dessin. */}
      <div
        role="img"
        aria-label={
          `Carte de France — ${valueLabel}. ${renseignees.length} zone` +
          `${renseignees.length > 1 ? "s" : ""} renseignée${renseignees.length > 1 ? "s" : ""} sur ` +
          `${zones.length + cartouches.length}, total ${formatValue(total)}. ` +
          `La carte montre la répartition ; ` +
          `les valeurs exactes sont dans le tableau.`
        }
        style={{ height }}
        className="w-full"
      >
        <svg
          // Repère stable : la figure contient plusieurs `<svg>` — les motifs,
          // la métropole, et un cartouche par territoire. Les distinguer par
          // leur ordre dans le DOM rendrait les tests faux au premier ajout.
          data-carte="metropole"
          viewBox={`0 0 ${BOITE.largeur} ${BOITE.hauteur}`}
          className="h-full w-full"
          // Masqué : recharts nous a appris la leçon, un dessin composé de
          // cent formes sans nom accessible devient cent images sans
          // alternative. Le parent porte le nom, le tableau porte la donnée.
          aria-hidden="true"
          onMouseLeave={() => setSurvol(null)}
        >
          {/* Le pays en fond quand on est descendu dans une région.
              Garder la même échelle préserve la position — une région ne
              saute pas au centre de l'écran — mais elle occupe alors un
              dixième du cadre, et le reste est vide. Le contour du pays
              rend ce vide lisible : on voit OÙ l'on est. Il est inerte :
              ni survol, ni clic, ni donnée. */}
          {region &&
            REGIONS.filter((r) => r.code !== region).map((r) => (
              <path
                key={`fond-${r.code}`}
                d={r.d}
                fill="var(--muted)"
                stroke="var(--card)"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            ))}

          {zones.map((z) => {
            const c = classeDe(z.code);
            const actif = selected === z.code || survol?.code === z.code;
            return (
              <path
                key={z.code}
                d={z.d}
                fill={
                  c === null
                    ? // Pas de donnée n'est pas une valeur basse : une hachure
                      // discrète, jamais la couleur de la première classe.
                      `url(#${uid}-vide)`
                    : teinte(c, classes)
                }
                // Le trait est de la couleur de la CARTE : il sépare deux
                // zones voisines quelle que soit leur classe, ce qu'aucune
                // échelle de remplissage ne peut garantir à elle seule.
                stroke={actif ? "var(--foreground)" : "var(--card)"}
                strokeWidth={actif ? 3 : 1.5}
                strokeLinejoin="round"
                className={cn(onSelect && "cursor-pointer")}
                onMouseEnter={() => setSurvol(z)}
                onClick={() => onSelect?.(z.code, z.nom)}
              />
            );
          })}
        </svg>
      </div>

      {/* Les cartouches d'outre-mer.
          Chacun à SA propre échelle : la Guyane fait quinze fois la
          Martinique, et à l'échelle de la métropole Mayotte serait un point
          de deux pixels. C'est la convention des cartes françaises, et elle
          n'est honnête que si on l'annonce — d'où la mention sous la rangée.

          Chacun dans son propre `<svg>` : imbriquer six boîtes différentes
          dans une seule demanderait six transformations calculées à la main,
          pour le même résultat. */}
      {cartouches.length > 0 && (
        <div aria-hidden="true" className="flex flex-wrap items-end gap-x-4 gap-y-2">
          {cartouches.map((t) => {
            const code = codeDrom(t);
            const c = classeDe(code);
            const actif = selected === code || survol?.code === code;
            return (
              <button
                key={t.code}
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setSurvol({ code, nom: t.nom, niveau: level, d: t.d })}
                onMouseLeave={() => setSurvol(null)}
                onClick={() => onSelect?.(code, t.nom)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-[var(--radius)] p-1",
                  onSelect && "cursor-pointer",
                )}
              >
                <svg
                  data-carte="outre-mer"
                  viewBox={`0 0 ${t.boite.largeur} ${t.boite.hauteur}`}
                  className="h-10 w-auto"
                  style={{ maxWidth: 56 }}
                >
                  <path
                    d={t.d}
                    fill={c === null ? `url(#${uid}-vide)` : teinte(c, classes)}
                    stroke={actif ? "var(--foreground)" : "var(--card)"}
                    strokeWidth={actif ? 3 : 1.5}
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[10px] leading-none text-muted-foreground">{t.nom}</span>
              </button>
            );
          })}
          <span className="self-center text-[10px] leading-tight text-muted-foreground">
            Cartouches à leur propre échelle
          </span>
        </div>
      )}

      {/* Ce que le survol révèle. Une ligne réservée en permanence : sans
          elle, la carte sauterait de quelques pixels à chaque survol. */}
      <p
        aria-hidden="true"
        className="m-0 min-h-5 text-sm text-muted-foreground"
      >
        {survol ? (
          <>
            <span className="font-medium text-foreground">{survol.nom}</span>
            {" — "}
            {typeof values[survol.code] === "number"
              ? `${formatValue(values[survol.code])} ${valueLabel.toLowerCase()}`
              : "pas de donnée"}
          </>
        ) : (
          "Survolez une zone pour voir sa valeur."
        )}
      </p>

      <Legende seuils={seuils} classes={classes} formatValue={formatValue} valueLabel={valueLabel} />
    </figure>
  );
}

// ─── Légende ──────────────────────────────────────────────────────────────────

function Legende({
  seuils,
  classes,
  formatValue,
  valueLabel,
}: {
  seuils: number[];
  classes: number;
  formatValue: (v: number) => string;
  valueLabel: string;
}) {
  if (seuils.length === 0) return null;
  // Les bornes AFFICHÉES, pas seulement les couleurs : une échelle de teintes
  // sans chiffres ne se lit pas, elle se devine.
  const etiquettes = [
    `< ${formatValue(Math.round(seuils[0]))}`,
    ...seuils.slice(0, -1).map((s, i) => `${formatValue(Math.round(s))} – ${formatValue(Math.round(seuils[i + 1]))}`),
    `≥ ${formatValue(Math.round(seuils[seuils.length - 1]))}`,
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{valueLabel}</span>
      {etiquettes.map((e, i) => (
        <span key={e} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-[3px] border border-[var(--border)]"
            style={{ background: teinte(i, classes) }}
          />
          <span className="tabular-nums">{e}</span>
        </span>
      ))}
    </div>
  );
}
