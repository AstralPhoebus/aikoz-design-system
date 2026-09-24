import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useId, useState, type ReactNode } from "react";
import { expect, within } from "storybook/test";
import { Table, type TableColumn } from "@registry/aikoz/table/table";
import { Switch } from "@registry/aikoz/switch/switch";
import { cn } from "@registry/aikoz/lib/utils";
import { Badge } from "@registry/aikoz/badge/badge";
import { Card } from "@registry/aikoz/card/card";
import { BrandMark } from "@registry/aikoz/brand-mark/brand-mark";

// ─── Les données de l'écran ──────────────────────────────────────────────────

type Fonctionnalite = { key: string; label: string; icone: ReactNode };
type Role = { key: string; label: string; icone: ReactNode };

/**
 * Pictogrammes au trait, décoratifs.
 *
 * `aria-hidden` sur chacun : le libellé porte tout le sens, et un lecteur
 * d'écran qui annoncerait « image » devant chaque nom de colonne rendrait la
 * matrice illisible. Ils servent le repérage visuel, rien d'autre — ce qui
 * est exactement leur rôle dans une grille où toutes les lignes se
 * ressemblent.
 *
 * Trait de 1,5, comme partout ailleurs dans le système : l'écart d'épaisseur
 * entre pictogrammes est le premier défaut qu'on voit sur une grille.
 */
function Glyphe({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-full"
    >
      <path d={d} />
    </svg>
  );
}

const D = {
  bulle:
    "M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z",
  courbe: "M3 17l6-6 4 4 8-8M21 7v5m0-5h-5",
  epingle:
    "M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3ZM3.5 9h17m-17 6h17",
  boutique: "M4 9h16l-1 11H5L4 9Zm2.5 0L8 4h8l1.5 5M9 13v3m6-3v3",
  immeuble:
    "M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 10h3a1 1 0 0 1 1 1v10M8 8h2m-2 4h2m-2 4h2M5 21h14",
  personne: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  badge:
    "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3.5 7a3.5 3.5 0 0 1 7 0",
  carte: "M9 4 3 7v13l6-3 6 3 6-3V4l-6 3-6-3Zm0 0v13m6-10v13",
  maison: "M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z",
} as const;

const FONCTIONNALITES: Fonctionnalite[] = [
  { key: "avis", label: "Réponse aux avis", icone: <Glyphe d={D.bulle} /> },
  { key: "kpi", label: "Dashboard KPI", icone: <Glyphe d={D.courbe} /> },
  { key: "nap", label: "Gestion des NAP", icone: <Glyphe d={D.epingle} /> },
  { key: "gbp", label: "Publications GBP", icone: <Glyphe d={D.globe} /> },
];

// Trois rôles restent à nommer, et dans la maquette DEUX colonnes portaient
// le même intitulé (« RÔLE 6 »).
//
// Ce n'est pas un détail de relecture : dans une matrice, le nom de la
// colonne est la MOITIÉ du nom de chaque case. Deux colonnes homonymes, et
// douze cases deviennent indiscernables — « Réponse aux avis pour Rôle 6 »
// désigne deux droits différents.
const ROLES: Role[] = [
  { key: "poi", label: "Gestionnaire POI", icone: <Glyphe d={D.boutique} /> },
  { key: "dir", label: "Directeur", icone: <Glyphe d={D.immeuble} /> },
  { key: "mkt", label: "Pôle marketing", icone: <Glyphe d={D.personne} /> },
  { key: "r5", label: "Rôle 5", icone: <Glyphe d={D.badge} /> },
  // Leurs deux dernières colonnes portent le MÊME intitulé, « RÔLE 6 ».
  // On le rend tel quel : c'est ce qu'ils nous ont envoyé, et l'histoire
  // « Modifiable » mesure ce que ça coûte.
  { key: "r6a", label: "Rôle 6", icone: <Glyphe d={D.carte} /> },
  { key: "r6b", label: "Rôle 6", icone: <Glyphe d={D.maison} /> },
];

// Relevé case par case sur leur capture du 24/09/2026.
const DROITS: Record<string, Record<string, boolean>> = {
  avis: { poi: true, dir: true, mkt: true, r5: true, r6a: true, r6b: true },
  kpi: { poi: false, dir: true, mkt: false, r5: true, r6a: true, r6b: true },
  nap: { poi: true, dir: true, mkt: true, r5: false, r6a: true, r6b: true },
  gbp: { poi: false, dir: true, mkt: true, r5: false, r6a: true, r6b: true },
};

// ─── L'assemblage ────────────────────────────────────────────────────────────

/**
 * Le nom de chaque case, DÉDUIT de sa ligne et de sa colonne.
 *
 * C'est la seule chose que cet assemblage apporte, et c'est celle qu'on
 * oublie : vingt-quatre interrupteurs sans nom propre, c'est vingt-quatre
 * fois « interrupteur, activé » au lecteur d'écran. Personne n'écrit ces
 * libellés à la main, et personne ne les maintient quand une colonne bouge.
 */
const nommerLaCase = (f: Fonctionnalite, r: Role) =>
  `${f.label} pour ${r.label}`;

/** Marqueur de légende : dessiné, jamais un contrôle. */
function Marqueur({
  ouvert = false,
  children,
}: {
  ouvert?: boolean;
  children: ReactNode;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-block h-5 w-9 shrink-0 rounded-full transition-none",
          ouvert ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-[var(--background)] shadow-sm",
            ouvert ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </span>
      {children}
    </span>
  );
}

function MatriceHabilitation({
  modifiable,
  roles = ROLES,
}: {
  modifiable: boolean;
  roles?: Role[];
}) {
  const [droits, setDroits] = useState(DROITS);
  const titreId = useId();

  const colonnes: TableColumn<Fonctionnalite>[] = [
    {
      key: "label",
      header: "Fonctionnalité",
      width: "17rem",
      cell: (f) => (
        // L'icône dans une boîte, pas nue : elle sépare la colonne d'ancrage
        // des colonnes de contrôles, et donne au nom de la ligne un point de
        // départ constant quelle que soit sa longueur.
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-[calc(var(--radius)/1.5)] border border-border bg-[var(--card)] p-1.5 text-muted-foreground"
          >
            {f.icone}
          </span>
          <span className="truncate">{f.label}</span>
        </span>
      ),
    },
    ...roles.map((r) => ({
      key: r.key,
      header: r.label,
      headerCell: (
        <span className="flex flex-col items-center gap-1.5">
          <span aria-hidden="true" className="size-5 text-muted-foreground">
            {r.icone}
          </span>
          <span className="text-center leading-tight">{r.label}</span>
        </span>
      ),
      cell: (f: Fonctionnalite) => {
        const accorde = droits[f.key][r.key];
        // Centré dans sa colonne. `Table` aligne à gauche par défaut, ce qui
        // convient à du texte de longueur variable — pas à une grille de
        // marqueurs identiques, où l'œil compare des COLONNES et où le
        // moindre décalage se lit comme une différence.
        return (
          <span className="flex justify-center">
            {modifiable ? (
              <Switch
                label={nommerLaCase(f, r)}
                labelHidden
                checked={accorde}
                onCheckedChange={(v) =>
                  setDroits((d) => ({
                    ...d,
                    [f.key]: { ...d[f.key], [r.key]: v },
                  }))
                }
              />
            ) : (
              // En lecture seule, PAS d'interrupteur : il donne envie de cliquer
              // sur ce qui ne se clique pas.
              //
              // Mais pas un `<span>` bricolé non plus, ce que j'avais fait
              // d'abord : `Badge` EXISTE, c'est une pastille, elle porte un ton
              // et son contour tient le 3:1 contre la carte. Réécrire à la main
              // ce que le système fournit, c'est exactement la dérive qu'un
              // design system est censé empêcher.
              <Badge
                tone={accorde ? "success" : "neutral"}
                size="sm"
                label={nommerLaCase(f, r)}
              >
                {accorde ? "Autorisé" : "Non"}
              </Badge>
            )}
          </span>
        );
      },
    })),
  ];

  return (
    // La coque du tableau de bord, pas celle de la maquette. Une seule chose
    // s'y ajoute : le FILET D'ACCENT en haut de la carte. C'est le
    // vocabulaire du système — `SiteNav` l'emploie déjà, et c'est la seule
    // place de la troisième couleur de marque. Il dit « ce bloc appartient à
    // cette marque » sans repeindre un bandeau entier.
    <Card
      as="section"
      aria-labelledby={titreId}
      className="gap-5 border-t-2 border-t-[var(--nav-accent)]"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <BrandMark className="shrink-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2
            id={titreId}
            className="m-0 font-heading text-xl font-semibold tracking-tight text-foreground"
          >
            Matrice d'habilitation
          </h2>
          <p className="m-0 text-sm text-muted-foreground">
            Accès aux fonctionnalités par profil utilisateur
          </p>
        </div>
      </div>

      <Table
        // Masqué : le titre au-dessus dit déjà la même chose, et l'entendre
        // deux fois de suite n'apprend rien.
        caption="Accès aux fonctionnalités par profil utilisateur"
        captionHidden
        columns={colonnes}
        rows={FONCTIONNALITES}
        getRowKey={(f) => f.key}
        rowHeaderKey="label"
        // `large` : chaque cellule porte un contrôle, il lui faut la place
        // d'une cible de 44 px et de son anneau de focus.
        density="large"
        // La colonne qui NOMME la ligne est ancrée sur un fond sourd : sur
        // six colonnes de marqueurs identiques, l'œil perd sa ligne en
        // parcourant vers la droite.
        rowHeaderSurface
        // Une matrice se lit dans les DEUX sens : sans filet vertical, sept
        // colonnes de marqueurs identiques se confondent.
        columnRules
        // Les six colonnes de rôles portent le MÊME contenu : elles doivent
        // avoir la même largeur. En `auto`, la largeur suivait la longueur
        // de l'intitulé — 165 px pour « Gestionnaire POI » contre 84 px pour
        // « Rôle 5 » — et l'écart se lisait comme une différence de sens.
        layout="fixed"
      />

      {/* La légende n'existe QUE pour la version modifiable. Un interrupteur
          ne dit pas de lui-même ce que son état signifie ici ; une pastille
          qui porte le mot « Autorisé » n'a besoin d'aucune légende. */}
      {modifiable && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          {/* Les marqueurs de la légende sont DESSINÉS, pas des `Switch` :
              un contrôle focalisable qui ne commande rien est exactement le
              piège qu'on évite en lecture seule. Ils sont `aria-hidden`, le
              texte à côté porte tout le sens. */}
          <Marqueur ouvert>Accès ouvert</Marqueur>
          <Marqueur>Accès fermé</Marqueur>
          <span className="ml-auto">
            Les changements s'appliquent à la prochaine connexion.
          </span>
        </div>
      )}
    </Card>
  );
}

// ─── Storybook ───────────────────────────────────────────────────────────────

const meta = {
  title: "Assemblages/Matrice d'habilitation",
  component: MatriceHabilitation,
  parameters: { layout: "fullscreen" },
  args: { modifiable: true },
  // La marque est un global de barre d'outils, plus un décorateur maison :
  // celui-ci la posait sur la racine et la retirait au démontage, et le
  // nettoyage arrivait après le montage de l'histoire suivante.
  globals: { marque: "adp" },
  decorators: [
    (S) => (
      <div className="min-w-0 max-w-5xl p-4">
        <S />
      </div>
    ),
  ],
} satisfies Meta<typeof MatriceHabilitation>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Modifiable: Story = {
  name: "Modifiable — marque ADP, thème clair",
  globals: { theme: "clair" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Chaque case porte SON nom, déduit de sa ligne et de sa colonne.
    await expect(
      c.getByRole("switch", { name: "Réponse aux avis pour Directeur" }),
    ).toBeInTheDocument();

    // On lit le nom par l'étiquette ASSOCIÉE, pas par `aria-label` : `Switch`
    // rend un vrai `<label for>`, et `getAttribute("aria-label")` rendait
    // `null` vingt-quatre fois — soit un seul nom distinct, et une assertion
    // qui mesurait mon erreur au lieu du composant.
    const noms = c
      .getAllByRole("switch")
      .map(
        (s) => (s as HTMLInputElement).labels?.[0]?.textContent?.trim() ?? "",
      );
    await expect(noms).toHaveLength(24);

    // ── Ce que coûtent deux colonnes homonymes ────────────────────────────
    //
    // Leur maquette nomme DEUX colonnes « RÔLE 6 ». Le nom d'une case est
    // déduit de sa ligne et de sa colonne : quatre paires de cases portent
    // donc le même nom et désignent des droits différents. Au lecteur
    // d'écran comme au relecteur, elles sont indiscernables.
    //
    // Ce test ne tombe pas : il MESURE le coût, pour qu'il soit chiffré dans
    // la conversation avec ADP plutôt qu'observé le jour de la recette.
    // ── Les colonnes de rôles font la même largeur ────────────────────────
    //
    // Elles portent le MÊME contenu — un interrupteur — donc une différence
    // de largeur se lit comme une différence de sens. En `layout="auto"`,
    // la largeur suivait la longueur de l'intitulé : mesuré 165 px pour
    // « Gestionnaire POI » contre 84 px pour « Rôle 5 ».
    const entetes = [...canvasElement.querySelectorAll("thead th")].slice(1);
    const largeurs = entetes.map((t) =>
      Math.round(t.getBoundingClientRect().width),
    );
    const ecart = Math.max(...largeurs) - Math.min(...largeurs);
    await expect(
      ecart,
      `les colonnes de rôles mesurent ${largeurs.join(" · ")} px : elles ` +
        `portent le même contenu et doivent donc avoir la même largeur.`,
    ).toBeLessThanOrEqual(1);

    // ── Les en-têtes s'alignent ───────────────────────────────────────────
    //
    // Collé au bas de sa cellule, un libellé qui passe sur deux lignes pousse
    // son pictogramme vers le haut : mesuré 18 px d'écart entre
    // « Gestionnaire POI » et « Directeur », et une rangée d'icônes en
    // escalier. Aligné en haut, les six pictogrammes forment une ligne.
    const tops = entetes.map((t) => {
      const sp = [...t.querySelectorAll("span")];
      return Math.round(sp[0].getBoundingClientRect().top);
    });
    await expect(
      Math.max(...tops) - Math.min(...tops),
      `les pictogrammes d'en-tête sont à ${tops.join(" · ")} px : ils doivent ` +
        `former une ligne, pas un escalier.`,
    ).toBeLessThanOrEqual(1);

    const distincts = new Set(noms).size;
    await expect(
      distincts,
      `${noms.length - distincts} cases indiscernables : deux colonnes ` +
        `portent le même intitulé dans la maquette.`,
    ).toBe(20);
  },
};

export const LesNomsCorriges: Story = {
  name: "Une fois les colonnes nommées",
  args: {
    roles: ROLES.map((r, i) => (i === 5 ? { ...r, label: "Rôle 7" } : r)),
  },
  globals: { theme: "clair" },
  parameters: {
    docs: {
      description: {
        story:
          "La même matrice une fois les six colonnes nommées. Les vingt-quatre " +
          "cases redeviennent distinctes.\n\n" +
          "« Rôle 5 », « Rôle 6 » et « Rôle 7 » sont des réservations : les " +
          "vrais noms appartiennent à ADP, et c'est la seule chose qui manque " +
          "pour que cet écran soit livrable.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const noms = within(canvasElement)
      .getAllByRole("switch")
      .map(
        (s) => (s as HTMLInputElement).labels?.[0]?.textContent?.trim() ?? "",
      );
    await expect(new Set(noms).size).toBe(24);
  },
};

export const LectureSeule: Story = {
  name: "Consultable — marque ADP, thème clair",
  args: { modifiable: false },
  globals: { theme: "clair" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Aucun interrupteur : ce qui ne se change pas ne se présente pas comme
    // un contrôle.
    await expect(c.queryAllByRole("switch")).toHaveLength(0);
    await expect(
      c.getByText("Réponse aux avis pour Directeur"),
    ).toBeInTheDocument();
  },
};
