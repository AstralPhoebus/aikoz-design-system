import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import {
  ChartFrame,
  ChartLegend,
  couleurSerie,
  type ChartFrameProps,
} from "./chart-frame";

type Point = { mois: string; google: number; trustpilot: number };
const DONNEES: Point[] = [
  { mois: "Juil.", google: 334, trustpilot: 88 },
  { mois: "Août", google: 312, trustpilot: 103 },
  { mois: "Sept.", google: 381, trustpilot: 118 },
];
const SERIES = [
  { key: "google", label: "Google" },
  { key: "trustpilot", label: "Trustpilot" },
];
const COLONNES = [
  { key: "mois", header: "Mois" },
  { key: "google", header: "Google", numeric: true },
  { key: "trustpilot", header: "Trustpilot", numeric: true },
];

/** Un tracé minimal : la coquille se teste sans dépendre d'un vrai graphique. */
const Trace = () => (
  <svg
    viewBox="0 0 100 40"
    className="h-full w-full"
    preserveAspectRatio="none"
  >
    <polyline
      points="0,30 50,18 100,6"
      fill="none"
      stroke={couleurSerie(0)}
      strokeWidth="2"
    />
    <polyline
      points="0,36 50,33 100,31"
      fill="none"
      stroke={couleurSerie(1)}
      strokeWidth="2"
    />
  </svg>
);

// `ChartFrame` est générique. `satisfies Meta<typeof ChartFrame>` le résout
// en `unknown` et les `args` typés sur `Point` ne passent plus ; on fige donc
// l'instanciation dans un composant concret, que Storybook documente comme
// n'importe quel autre.
const Cadre = (props: ChartFrameProps<Point>) => (
  <ChartFrame<Point> {...props} />
);

const meta = {
  title: "Graphiques/ChartFrame",
  component: Cadre,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    caption: "Avis reçus par source, sur trois mois",
    summary: "Deux séries sur trois points. Google passe de 334 à 381.",
    series: SERIES,
    data: DONNEES,
    columns: COLONNES,
    getRowKey: (_: Point, i: number) => `p-${i}`,
    rowHeaderKey: "mois",
    height: 160,
    children: () => <Trace />,
  },
  decorators: [
    (S) => (
      <div className="max-w-2xl">
        <S />
      </div>
    ),
  ],
} satisfies Meta<typeof Cadre>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const LeTableauEstLeContenu: Story = {
  name: "Le graphique est masqué, le tableau EST le contenu",
  parameters: {
    docs: {
      description: {
        story:
          "La coquille que tout graphique du système traverse. Elle existe " +
          "pour que le contrat d'accessibilité soit tenu **par construction** " +
          "plutôt que répété — et oublié une fois sur cinq.\n\n" +
          "Un SVG de données ne se lit pas : on ne peut ni comparer deux " +
          "valeurs, ni en retrouver une, ni copier quoi que ce soit. Le " +
          'tracé est donc masqué aux lecteurs d\'écran, un `role="img"` ' +
          "porte le résumé, et le **tableau porte la donnée**.\n\n" +
          "Ce test est la raison pour laquelle trois autres décisions " +
          "tiennent : l'infobulle qui ne s'ouvre qu'à la souris, " +
          "l'estompement au survol, et l'exception tritanopie de la palette. " +
          "Toutes s'appuient sur « le tableau porte les valeurs ». Si ce " +
          "test tombe, ces trois-là tombent avec lui.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Le résumé est porté par un role="img" nommé — pas par le SVG.
    const resume = canvas.getByRole("img");
    await expect(resume).toHaveAccessibleName(/Deux séries sur trois points/);
    await expect(resume).toHaveAccessibleName(/vue « Tableau »/);

    // Le tracé lui-même est hors de l'arbre d'accessibilité.
    const svg = canvasElement.querySelector("svg");
    await expect(svg).not.toBeNull();
    await expect(svg!.closest('[aria-hidden="true"]')).not.toBeNull();

    // Et le tableau, lui, est à un clic, avec ses relations intactes.
    await userEvent.click(canvas.getByRole("tab", { name: "Tableau" }));
    const tableau = canvas.getByRole("table");
    await expect(within(tableau).getAllByRole("columnheader")).toHaveLength(3);
    await expect(within(tableau).getAllByRole("rowheader")).toHaveLength(
      DONNEES.length,
    );
  },
};

export const LOrdreDeLecture: Story = {
  name: "Titre, graphique, légende, tableau — dans cet ordre",
  parameters: {
    docs: {
      description: {
        story:
          "La légende est passée SOUS le graphique. Placée avant, elle " +
          "s'interposait entre le titre et la donnée : l'œil devait " +
          "traverser une liste de noms pour atteindre ce qu'il venait voir.\n\n" +
          "L'ordre du DOM suit l'ordre visuel, donc un lecteur d'écran " +
          "entend la même chose qu'on voit : le titre, le résumé du tracé, " +
          "les séries, puis les valeurs.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const figure = canvasElement.querySelector("figure")!;
    // Le titre ouvre la figure — il partage sa ligne avec le sélecteur de vue,
    // qui ne coûte donc aucune hauteur.
    await expect(figure.querySelector("figcaption")).toBe(
      figure.firstElementChild!.firstElementChild,
    );
    // La légende est après le tracé, jamais avant.
    const legende = figure.querySelector("ul")!;
    const trace = figure.querySelector('[role="img"]')!;
    await expect(
      trace.compareDocumentPosition(legende) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  },
};

export const LaBasculeNeDeplaceRien: Story = {
  name: "Passer au tableau ne déplace rien sur la page",
  parameters: {
    docs: {
      description: {
        story:
          "Le tableau était replié dans un `details` sous le graphique. " +
          "Mesuré sur le tableau de bord, l'ouvrir faisait passer le bloc de " +
          "378 à 650 px — **+72 %** — et décalait de 272 px tout ce qui suit. " +
          "Sur une grille à deux colonnes, la rangée se désalignait en plus.\n\n" +
          "Les deux vues partagent maintenant la même zone, à la hauteur du " +
          "graphique ; le tableau défile à l'intérieur. Cette histoire mesure " +
          "la figure avant et après la bascule : l'écart doit être nul.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const figure = canvasElement.querySelector("figure")!;
    const avant = figure.getBoundingClientRect().height;

    await userEvent.click(canvas.getByRole("tab", { name: "Tableau" }));
    await expect(canvas.getByRole("table")).toBeInTheDocument();
    const apres = figure.getBoundingClientRect().height;

    // Mesuré sur le rendu, pas déduit du CSS : c'est le saut lui-même qui
    // était le défaut, pas la règle qui le produisait.
    await expect(Math.abs(apres - avant)).toBeLessThanOrEqual(1);

    // Et le retour au graphique ne déplace rien non plus.
    await userEvent.click(canvas.getByRole("tab", { name: "Graphique" }));
    await expect(
      Math.abs(figure.getBoundingClientRect().height - avant),
    ).toBeLessThanOrEqual(1);
  },
};

export const LaLegendeMontreLesDeuxCanaux: Story = {
  name: "La légende montre ce que le graphique montre",
  parameters: {
    docs: {
      description: {
        story:
          "Chaque entrée porte le canal tel qu'on le reconnaîtra dans le " +
          "graphique. Le nom du canal est aussi écrit en `sr-only` : sans " +
          "lui, la légende lue à voix haute donne une liste de noms sans " +
          "clé de lecture — « Google, Trustpilot », sans dire à quoi les " +
          "rattacher.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-6">
      <ChartLegend series={SERIES} style="trait" />
      <ChartLegend series={SERIES} style="aplat" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const entrees = canvasElement.querySelectorAll("li");
    await expect(entrees.length).toBe(SERIES.length * 2);
    // Chaque entrée nomme son canal pour qui ne voit pas la pastille.
    for (const li of entrees) {
      await expect(li.querySelector(".sr-only")).not.toBeNull();
    }
  },
};

// ─── Quand il n'y a rien à tracer ────────────────────────────────────────────

export const LeVideNeLaisseRienACherche: Story = {
  name: "Un vide nomme ce qui manque",
  args: {
    data: [],
    emptyLabel: "Aucun avis entre le 1er et le 7 septembre",
    emptyHint: "Élargissez la période, ou retirez le filtre par source.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Sans donnée, la coque remplace **tout** son contenu : le graphique, " +
          "la bascule, la légende et le tableau. Aucun des quatre n'a de sens " +
          "sur du vide, et une bascule « Graphique / Tableau » posée sur rien " +
          "envoie chercher la donnée dans l'autre onglet.\n\n" +
          "Le titre reste : c'est la seule chose qui dise QUOI manque.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(
      c.getByText("Aucun avis entre le 1er et le 7 septembre"),
    ).toBeVisible();
    // Ni bascule, ni tableau : rien à commuter, rien à lire.
    await expect(c.queryByRole("tablist")).toBeNull();
    await expect(c.queryByRole("table")).toBeNull();
    // Le titre du bloc, lui, est toujours là.
    await expect(
      c.getByText("Avis reçus par source, sur trois mois"),
    ).toBeVisible();
  },
};

export const UnEchecPorteSaReprise: Story = {
  name: "Un échec porte sa reprise, et n'est pas rouge",
  args: {
    data: [],
    error: "La collecte Google Business ne répond pas",
    onRetry: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "`error` est la **raison**, telle qu'on la montre — pas un code, pas " +
          "« Une erreur est survenue ».\n\n" +
          "Et ce n'est pas peint en rouge : dans ce système le rouge dit que " +
          "l'utilisateur est refusé ou que quelque chose va être détruit. Un " +
          "chargement qui échoue ne fait ni l'un ni l'autre — il y a un bouton " +
          "à cliquer, pas une décision à prendre. Voir `EmptyState`.\n\n" +
          "La région live est montée **en permanence**, vide tant que tout va " +
          "bien : une région créée déjà remplie n'est pas annoncée de façon " +
          "fiable, c'est le changement de contenu d'une région existante qui " +
          "l'est. Et elle ne porte que la phrase d'état, jamais le survol du " +
          "graphique, qui la ferait parler en continu.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole("button", { name: "Réessayer" })).toBeVisible();
    // La raison est annoncée, et par la région live.
    const live = canvasElement.querySelector(
      '[role="status"][aria-live="polite"]',
    )!;
    await expect(live).toHaveTextContent(
      "La collecte Google Business ne répond pas",
    );
  },
};

export const LaRepriseRamemeLaDonnee: Story = {
  name: "La reprise ramène la donnée",
  render: (args) => {
    const [echoue, setEchoue] = useState(true);
    return (
      <Cadre
        {...args}
        data={echoue ? [] : DONNEES}
        error={echoue ? "La collecte Google Business ne répond pas" : undefined}
        onRetry={() => setEchoue(false)}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "L'échec est un état **transitoire** : la coque le quitte comme elle " +
          "y est entrée, sans que la page bouge autour. C'est ce que garantit " +
          "la hauteur portée par la zone et non par le graphique.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Réessayer" }));
    // Le graphique et sa bascule reviennent, la phrase d'état se tait.
    await expect(await c.findByRole("tablist")).toBeVisible();
    const live = canvasElement.querySelector(
      '[role="status"][aria-live="polite"]',
    )!;
    await expect(live).toHaveTextContent("");
  },
};
