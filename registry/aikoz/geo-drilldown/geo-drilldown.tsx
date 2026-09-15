import { useMemo, useRef, useState } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { Breadcrumb, type BreadcrumbItem } from "@registry/aikoz/breadcrumb/breadcrumb";
import { BarChart } from "@registry/aikoz/bar-chart/bar-chart";
import { Button } from "@registry/aikoz/button/button";
import { EmptyState } from "@registry/aikoz/empty-state/empty-state";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZoneGeo {
  id: string;
  /** Nom affiché — « Île-de-France », « Rhône ». */
  label: string;
  /** Valeur mesurée sur la zone. */
  value: number;
  /** Zones filles. Absent ou vide = on ne peut pas forer plus bas. */
  children?: ZoneGeo[];
}

export interface GeoDrilldownProps {
  /** Nom de la racine — « France » en général. */
  rootLabel: string;
  /** Premier niveau : les régions. */
  zones: ZoneGeo[];
  /** Ce que la valeur mesure, **unité comprise** — « Avis reçus », « Taux (%) ». */
  valueLabel: string;
  formatValue?: (v: number) => string;
  /** Prévenu à chaque changement de niveau, avec le chemin complet. */
  onNavigate?: (chemin: ZoneGeo[]) => void;
  height?: number;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Forage géographique — `France > Région > Département`.
 *
 * **Ce n'est pas une carte, et c'est délibéré.** L'inventaire notait que le
 * Figma ne contient aucun tracé géographique, seulement des étiquettes de
 * région. Une carte choroplèthe aurait par ailleurs trois défauts ici : elle
 * encode la valeur par une teinte sur des surfaces de tailles très inégales
 * (la Lozère et le Nord pèsent pareil à l'œil), elle demande un fond de carte
 * à tenir à jour, et elle ne se lit pas du tout au lecteur d'écran. Une barre
 * horizontale compare des longueurs — ce que l'œil fait le mieux — et se
 * double d'un tableau.
 *
 * **Le forage ne passe PAS par le clic sur les barres.** Le graphique est
 * `aria-hidden` (cf. `ChartFrame`) : y mettre la seule commande de navigation
 * la rendrait inatteignable au clavier et invisible à un lecteur d'écran. Le
 * bouton « Explorer » vit donc dans le **tableau**, qui est le contenu réel.
 * Le clic sur une barre reste offert en plus, comme raccourci à la souris.
 *
 * Le fil d'Ariane remonte. Il utilise `onClick` et non `href` : on ne change
 * pas d'URL, et annoncer un lien qui n'en est pas un tromperait.
 */
export function GeoDrilldown({
  rootLabel,
  zones,
  valueLabel,
  formatValue = (v) => v.toLocaleString("fr-FR"),
  onNavigate,
  height = 320,
  className,
}: GeoDrilldownProps) {
  const [chemin, setChemin] = useState<ZoneGeo[]>([]);
  // L'annonce du changement de niveau : sans elle, un lecteur d'écran voit le
  // tableau se réécrire sans savoir pourquoi.
  const [annonce, setAnnonce] = useState("");
  const ancre = useRef<HTMLDivElement | null>(null);

  const niveau = chemin.length === 0 ? zones : (chemin[chemin.length - 1].children ?? []);

  const aller = (suite: ZoneGeo[]) => {
    setChemin(suite);
    const zonesSuivantes = suite.length === 0 ? zones : (suite[suite.length - 1].children ?? []);
    const nom = suite.length === 0 ? rootLabel : suite[suite.length - 1].label;
    setAnnonce(`${nom} — ${zonesSuivantes.length} zone${zonesSuivantes.length > 1 ? "s" : ""}.`);
    onNavigate?.(suite);
    // Le focus suit le forage : la commande qu'on vient d'actionner disparaît
    // du document avec l'ancien niveau. Sans reprise, il retombe sur `body`.
    requestAnimationFrame(() => ancre.current?.focus());
  };

  const fil: BreadcrumbItem[] = [
    { label: rootLabel, onClick: chemin.length ? () => aller([]) : undefined },
    ...chemin.map((z, i) => ({
      label: z.label,
      onClick: i < chemin.length - 1 ? () => aller(chemin.slice(0, i + 1)) : undefined,
    })),
  ];

  const data = useMemo(
    () => niveau.map((z) => ({ zone: z.label, valeur: z.value, id: z.id })),
    [niveau]
  );

  const zoneParLabel = useMemo(
    () => new Map(niveau.map((z) => [z.label, z])),
    [niveau]
  );

  const titre = chemin.length === 0 ? rootLabel : chemin[chemin.length - 1].label;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Breadcrumb items={fil} label="Niveau géographique" />

      {/* `tabIndex={-1}` : cible de focus après un forage, jamais dans la
          tabulation. */}
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
          <BarChart
            caption={`${valueLabel} — ${titre}`}
            data={data}
            xKey="zone"
            xLabel="Zone"
            yLabel={valueLabel}
            orientation="horizontal"
            series={[{ key: "valeur", label: valueLabel }]}
            formatValue={(v) => formatValue(Number(v))}
            height={height}
            tableCollapsed={false}
            onBarClick={(ligne: Record<string, string | number>) => {
              const z = zoneParLabel.get(String(ligne.zone));
              if (z?.children?.length) aller([...chemin, z]);
            }}
            extraColumns={[
              {
                key: "explorer",
                header: "Détail",
                cell: (ligne: Record<string, string | number>) => {
                  const z = zoneParLabel.get(String(ligne.zone));
                  if (!z?.children?.length) {
                    return (
                      <span className="text-xs text-muted-foreground">
                        Dernier niveau
                      </span>
                    );
                  }
                  return (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => aller([...chemin, z])}
                    >
                      {/* Le nom de la zone est DANS le bouton, en `sr-only` :
                          sans lui, un lecteur d'écran qui liste les commandes
                          entend « Explorer » huit fois de suite. */}
                      Explorer
                      <span className="sr-only"> {z.label}</span>
                    </Button>
                  );
                },
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
