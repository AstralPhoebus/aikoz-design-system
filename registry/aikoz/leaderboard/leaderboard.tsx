import { type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { Table, type TableColumn } from "@registry/aikoz/table/table";
import { DeltaBadge } from "@registry/aikoz/delta-badge/delta-badge";
import { BrandLogo } from "@registry/aikoz/brand-logo/brand-logo";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  /** Clé stable. Le rang ne convient pas : il change à chaque tri. */
  id: string;
  rank: number;
  /** Nom de l'établissement. Seul champ obligatoire avec `id` et `rank`. */
  name: string;
  /** Code court — `AMS`, `LYO-PDX`. Affiché en second, jamais à la place du nom. */
  code?: string;
  /** Entité de rattachement : réseau, groupe, marque. */
  organization?: string;
  /** Identifiant de marque du registre `BrandLogo`, pour la pastille. */
  brand?: string;
  /** Valeur classante, déjà formatée — le composant ne fait pas de mise en forme. */
  value: ReactNode;
  /** Écart par rapport à la période précédente, en points. */
  delta?: number;
  /**
   * Marque la ligne de l'utilisateur — l'état `Highlight` du composant Figma.
   * Une seule ligne devrait la porter.
   */
  highlighted?: boolean;
}

export interface LeaderboardProps {
  /** Ce que le classement classe, et sur quoi. **Obligatoire**, cf. `Table`. */
  caption: string;
  captionHidden?: boolean;
  entries: LeaderboardEntry[];
  /** Intitulé de la colonne de valeur. */
  valueLabel?: string;
  /** Libellé de la ligne mise en avant, pour l'annonce. */
  highlightLabel?: string;
  loading?: boolean;
  empty?: ReactNode;
  density?: "compact" | "default";
  className?: string;
}

// Or, argent, bronze. Ces trois teintes ne viennent PAS des tokens et n'y
// viendront pas : ce sont des références culturelles à des métaux, pas des
// couleurs d'interface. Elles ne suivent ni le thème ni le registre, comme
// les couleurs de marque.
const MEDAILLES: Record<number, { fond: string; encre: string; nom: string }> = {
  1: { fond: "#C9A227", encre: "#241A00", nom: "1re place" },
  2: { fond: "#9DA3A8", encre: "#15181A", nom: "2e place" },
  3: { fond: "#A9713B", encre: "#1B0F04", nom: "3e place" },
};

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Classement d'établissements.
 *
 * **Bâti sur `Table`, et pas sur une liste de `<div>`.** Un classement porte
 * plusieurs attributs comparables par ligne — rang, nom, réseau, valeur,
 * écart — c'est la définition d'un tableau. En mode tableau, un lecteur
 * d'écran annonce alors « Amsterdam-Schiphol, taux de réponse, 94 % » à
 * chaque déplacement, ce qu'une pile de div ne donne jamais.
 *
 * **Il n'y a pas de composant `RankRow` exporté**, contrairement au fichier
 * Figma. Une ligne qui n'a de sens qu'à l'intérieur de son tableau n'est pas
 * un composant : c'est un rendu de cellule. L'exporter inviterait à la poser
 * ailleurs, où elle perdrait ses en-têtes — donc son sens. Même raisonnement
 * que l'absence de `CardTitle` dans `Card`.
 *
 * **Le podium ne tient pas à la couleur.** Le composant Figma n'expose que
 * `Default` et `Highlight` ; l'or, l'argent et le bronze sont produits ici à
 * partir de la spec. Ils sont donc doublés : la pastille métallique porte le
 * CHIFFRE du rang, et son nom complet est dit en `sr-only`. Un utilisateur
 * qui ne distingue pas l'or du bronze lit « 1re place » — et de toute façon
 * le rang est écrit.
 *
 * La ligne « vous » se signale par un trait latéral et un libellé annoncé,
 * jamais par la seule teinte du fond : mesuré ailleurs dans ce système, un
 * voile de surlignage ne dépasse pas 1,19:1.
 */
export function Leaderboard({
  caption,
  captionHidden = false,
  entries,
  valueLabel = "Valeur",
  highlightLabel = "Votre établissement",
  loading,
  empty,
  density = "default",
  className,
}: LeaderboardProps) {
  const avecMarque = entries.some((e) => e.brand);
  const avecDelta = entries.some((e) => e.delta !== undefined);

  const columns: TableColumn<LeaderboardEntry>[] = [
    {
      key: "rank",
      header: "Rang",
      width: "4.5rem",
      cell: (e) => {
        const m = MEDAILLES[e.rank];
        return (
          <span className="inline-flex items-center gap-2">
            <span
              className={cn(
                "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                "text-2xs font-semibold tabular-nums",
                !m && "bg-[var(--muted)] text-muted-foreground"
              )}
              style={m ? { backgroundColor: m.fond, color: m.encre } : undefined}
            >
              {e.rank}
            </span>
            {m && <span className="sr-only">{m.nom}</span>}
          </span>
        );
      },
    },
    {
      key: "name",
      header: "Établissement",
      cell: (e) => (
        <span className="flex items-center gap-2.5 min-w-0">
          {avecMarque && e.brand && <BrandLogo brand={e.brand} size="sm" decorative />}
          <span className="flex flex-col min-w-0">
            <span className="truncate font-medium text-foreground">
              {/* Une seule chaîne : un `sr-only` séparé produisait
                  « Marseille Prado — Votre établissement » avec une espace
                  surnuméraire avant le tiret. */}
              {e.highlighted ? (
                <>
                  <span className="sr-only">{`${e.name} — ${highlightLabel}`}</span>
                  <span aria-hidden="true">{e.name}</span>
                </>
              ) : (
                e.name
              )}
              {e.highlighted && (
                <>
                  {/* Marqueur invisible : il ne sert qu'au sélecteur CSS du
                      trait latéral. L'annonce passe par le sr-only ci-dessus,
                      pas par lui. */}
                  <span data-vous hidden />
                </>
              )}
            </span>
            {(e.code || e.organization) && (
              // Le code et le réseau sont en retrait mais RESTENT du texte :
              // ils passent 4,5:1, ce ne sont pas des mentions décoratives.
              <span className="truncate text-xs text-muted-foreground">
                {[e.code, e.organization].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
        </span>
      ),
    },
    { key: "value", header: valueLabel, numeric: true, cell: (e) => e.value },
  ];

  if (avecDelta) {
    columns.push({
      key: "delta",
      header: "Évolution",
      numeric: true,
      width: "7rem",
      cell: (e) =>
        e.delta === undefined ? (
          // Une cellule vide se lit « vide », ce qui est juste : la donnée
          // manque. Un tiret se lirait « tiret », ce qui n'est pas la même
          // information.
          <span className="sr-only">Non renseigné</span>
        ) : (
          <DeltaBadge value={e.delta} size="sm" />
        ),
    });
  }

  return (
    <Table
      caption={caption}
      captionHidden={captionHidden}
      columns={columns}
      rows={entries}
      getRowKey={(e) => e.id}
      rowHeaderKey="name"
      loading={loading}
      empty={empty}
      density={density}
      className={cn(
        // Le trait latéral de la ligne « vous ». En `box-shadow` intérieur
        // plutôt qu'en bordure : la bordure décalerait les cellules.
        "[&_tr:has([data-vous])]:shadow-[inset_3px_0_0_0_var(--ring)]",
        "[&_tr:has([data-vous])]:bg-[var(--surface-hover)]",
        className
      )}
    />
  );
}
