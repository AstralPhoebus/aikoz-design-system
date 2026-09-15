import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { LineChart } from "./line-chart";

const meta = {
  title: "Graphiques/LineChart",
  component: LineChart,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [(S) => <div className="w-[44rem]"><S /></div>],
  args: {
    caption: "Taux de réponse aux avis, par réseau",
    xKey: "mois",
    xLabel: "Mois",
    yLabel: "Taux de réponse (%)",
    formatValue: (v: string | number) => `${v} %`,
    series: [
      { key: "sudest", label: "Sud-Est" },
      { key: "idf", label: "Île-de-France" },
      { key: "nord", label: "Nord" },
      { key: "ouest", label: "Ouest" },
    ],
    data: [
      { mois: "Janv.", sudest: 71, idf: 64, nord: 58, ouest: 66 },
      { mois: "Févr.", sudest: 74, idf: 66, nord: 57, ouest: 68 },
      { mois: "Mars", sudest: 79, idf: 71, nord: 61, ouest: 70 },
      { mois: "Avr.", sudest: 83, idf: 74, nord: 66, ouest: 69 },
      { mois: "Mai", sudest: 88, idf: 78, nord: 70, ouest: 73 },
      { mois: "Juin", sudest: 91, idf: 83, nord: 72, ouest: 77 },
    ],
  },
} satisfies Meta<typeof LineChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const LeTableauEstLeContenu: Story = {
  name: "Le graphique est masqué, le tableau est le contenu",
  play: async ({ canvas }) => {
    // Le résumé énoncé renvoie explicitement au tableau.
    await expect(canvas.getByRole("img")).toHaveAccessibleName(/4 séries sur 6 points/);
    await expect(canvas.getByRole("table")).toBeInTheDocument();
    // Zéro animation : recharts en met par défaut, une courbe qui se dessine
    // retarde la lecture sans rien apprendre (WCAG 2.3.3).
    const animes = [...canvas.getByRole("img").querySelectorAll("*")]
      .filter((e) => getComputedStyle(e).animationName !== "none");
    await expect(animes).toHaveLength(0);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Un SVG de courbes, même étiqueté, ne se lit pas : on ne peut ni comparer deux " +
          "points, ni retrouver une valeur, ni suivre une tendance. Le `aria-label` donne " +
          "le résumé, le tableau donne la donnée — et il réutilise `Table`, donc ses " +
          "en-têtes de ligne et de colonne.",
      },
    },
  },
};

export const AvecReference: Story = {
  name: "Avec une série de référence",
  args: {
    caption: "Taux de réponse Sud-Est, comparé à l'année précédente",
    series: [{ key: "sudest", label: "2026" }],
    reference: { key: "n1", label: "2025" },
    data: [
      { mois: "Janv.", sudest: 71, n1: 63 }, { mois: "Févr.", sudest: 74, n1: 65 },
      { mois: "Mars", sudest: 79, n1: 69 }, { mois: "Avr.", sudest: 83, n1: 74 },
      { mois: "Mai", sudest: 88, n1: 76 }, { mois: "Juin", sudest: 91, n1: 80 },
    ],
  },
  play: async ({ canvas }) => {
    // L'écart est CALCULÉ et énoncé : sans ça, la comparaison n'existe que
    // pour qui voit les deux courbes.
    await expect(canvas.getByRole("img")).toHaveAccessibleName(/dépasse 2025 de 11/);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Il n'y a pas de composant `ComparisonLineChart` : comparer deux périodes, c'est " +
          "une série de plus tracée en retrait, plus un écart énoncé. Deux props, pas un " +
          "second composant.",
      },
    },
  },
};

export const LaCouleurNeDistinguePas: Story = {
  name: "La couleur ne distingue pas les séries",
  parameters: {
    docs: {
      description: {
        story:
          "Mesuré sur notre palette : la meilleure séparation atteignable entre six séries " +
          "est de **1,26:1 en clair, 1,30 en sombre** — un ratio de LUMINANCE, pas un " +
          "écart perceptuel. Elles se confondent en niveaux de " +
          "gris et pour une part des daltonismes. Le pointillé et la forme du marqueur ne " +
          "sont donc pas décoratifs — ils portent la distinction, dans un ordre FIXE pour " +
          "qu'une série garde son identité d'un écran à l'autre.",
      },
    },
  },
};
