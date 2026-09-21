import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ChartFrame, ChartLegend, couleurSerie, type ChartFrameProps } from "./chart-frame";

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
  <svg viewBox="0 0 100 40" className="h-full w-full" preserveAspectRatio="none">
    <polyline points="0,30 50,18 100,6" fill="none" stroke={couleurSerie(0)} strokeWidth="2" />
    <polyline points="0,36 50,33 100,31" fill="none" stroke={couleurSerie(1)} strokeWidth="2" />
  </svg>
);

// `ChartFrame` est générique. `satisfies Meta<typeof ChartFrame>` le résout
// en `unknown` et les `args` typés sur `Point` ne passent plus ; on fige donc
// l'instanciation dans un composant concret, que Storybook documente comme
// n'importe quel autre.
const Cadre = (props: ChartFrameProps<Point>) => <ChartFrame<Point> {...props} />;

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
  decorators: [(S) => <div className="max-w-2xl"><S /></div>],
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
          "tracé est donc masqué aux lecteurs d'écran, un `role=\"img\"` " +
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
    await expect(resume).toHaveAccessibleName(/tableau qui suit/);

    // Le tracé lui-même est hors de l'arbre d'accessibilité.
    const svg = canvasElement.querySelector("svg");
    await expect(svg).not.toBeNull();
    await expect(svg!.closest('[aria-hidden="true"]')).not.toBeNull();

    // Et le tableau, lui, est bien là avec ses relations — replié, mais
    // présent dans le document, donc lu.
    const tableau = canvas.getByRole("table", { hidden: true });
    await expect(within(tableau).getAllByRole("columnheader", { hidden: true })).toHaveLength(3);
    await expect(within(tableau).getAllByRole("rowheader", { hidden: true })).toHaveLength(DONNEES.length);
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
    const roles = [...figure.children].map((e) => e.tagName);
    await expect(roles[0]).toBe("FIGCAPTION");
    await expect(roles[roles.length - 1]).toBe("DETAILS");
    // La légende est après le tracé, jamais avant.
    const legende = figure.querySelector("ul")!;
    const trace = figure.querySelector('[role="img"]')!;
    await expect(
      trace.compareDocumentPosition(legende) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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
