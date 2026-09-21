import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { BarChart } from "./bar-chart";

const meta = {
  title: "Graphiques/BarChart",
  component: BarChart,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [(S) => <div className="w-[44rem]"><S /></div>],
  args: {
    caption: "Avis reçus par source et par trimestre",
    xKey: "trim",
    xLabel: "Trimestre",
    yLabel: "Avis reçus",
    series: [
      { key: "google", label: "Google" },
      { key: "trustpilot", label: "Trustpilot" },
      { key: "pj", label: "Pages Jaunes" },
    ],
    data: [
      { trim: "T1", google: 820, trustpilot: 210, pj: 64 },
      { trim: "T2", google: 940, trustpilot: 268, pj: 71 },
      { trim: "T3", google: 1120, trustpilot: 302, pj: 58 },
      { trim: "T4", google: 1240, trustpilot: 318, pj: 96 },
    ],
  },
} satisfies Meta<typeof BarChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empile: Story = { name: "Empilé" };

export const LeTotalALaColonne: Story = {
  name: "En empilé, le total a sa colonne",
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Tableau" }));
    await expect(canvas.getByRole("columnheader", { name: "Total" })).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          "Empilé, on lit bien le total mais mal chaque part — sauf la première, qui seule " +
          "part de zéro. Le total est donc l'information que l'empilement met en avant : " +
          "il a sa colonne dans le tableau équivalent.",
      },
    },
  },
};

export const Horizontal: Story = {
  name: "Horizontal, trié — l'ex-RankedBarChart",
  args: {
    caption: "Classement des agences par taux de réponse",
    xKey: "agence",
    xLabel: "Agence",
    yLabel: "Taux de réponse (%)",
    orientation: "horizontal",
    layout: "grouped",
    formatValue: (v: string | number) => `${v} %`,
    series: [{ key: "taux", label: "Taux de réponse" }],
    data: [
      { agence: "Lyon Part-Dieu", taux: 94 },
      { agence: "Paris Opéra", taux: 91 },
      { agence: "Bordeaux Chartrons", taux: 88 },
      { agence: "Marseille Prado", taux: 84 },
      { agence: "Lille Grand Place", taux: 79 },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Il n'y a pas de `RankedBarChart` : c'est ce composant, horizontal, trié, à une " +
          "série. L'horizontal est indispensable dès que les libellés sont longs.",
      },
    },
  },
};

export const LaTrameEstLeSecondCanal: Story = {
  name: "Le second canal d'un aplat est une trame",
  parameters: {
    docs: {
      description: {
        story:
          "Une barre n'a pas de tracé où poser un pointillé. Hachures, points, " +
          "quadrillage — même rôle et même ordre fixe que les tracés des courbes, pour " +
          "qu'une série garde son identité d'un type de graphique à l'autre. Et un " +
          "séparateur de 2 px entre segments empilés : deux teintes voisines " +
          "fusionneraient sinon en un seul bloc.",
      },
    },
  },
};

export const SurvolEtEmphase: Story = {
  name: "Le survol met la valeur en avant",
  parameters: {
    docs: {
      description: {
        story:
          "**L'emphase se fait par RETRAIT.** La catégorie pointée ne change pas ; ce " +
          "sont les autres qui s'effacent à 30 % — la valeur de Carbon. C'est le geste " +
          "des dashboards modernes, et il remplace un contour `--foreground` de 2px qui " +
          "lisait comme une SÉLECTION plutôt qu'un survol.\n\n" +
          "J'avais d'abord écarté l'atténuation en craignant que les séries estompées " +
          "tombent sous les 3:1 de WCAG 1.4.11. Ce seuil vaut pour l'état **au repos**, " +
          "celui qui permet d'identifier un composant ; une atténuation de survol est " +
          "transitoire, réversible au moindre mouvement, et n'enlève aucune information " +
          "puisque le tableau porte toutes les valeurs.\n\n" +
          "**Échap referme l'infobulle** (WCAG 1.4.13, « Dismissible »). Recharts ne le " +
          "prévoit pas : son infobulle suit la souris et rien ne la referme. " +
          "`ChartFrame` écoute donc Échap tant que le pointeur est sur le graphique, et " +
          "la rétablit dès qu'on ressort puis revient — ce n'est pas une bascule " +
          "permanente.\n\n" +
          "L'infobulle n'est jamais la seule source d'une valeur : le tableau qui suit " +
          "les porte toutes. C'est ce qui la rend acceptable alors qu'elle ne s'ouvre " +
          "qu'à la souris.",
      },
    },
  },
  play: async ({ canvasElement, userEvent: ue }) => {
    const u = ue ?? userEvent;
    const secteurs = canvasElement.querySelectorAll(".recharts-rectangle, .recharts-bar-rectangle");
    if (!secteurs.length) return;

    await u.hover(secteurs[secteurs.length - 1] as Element);
    await waitFor(async () => {
      await expect(canvasElement.querySelector(".recharts-tooltip-wrapper")).toBeInTheDocument();
    });

    // Échap doit la retirer du document, pas seulement la masquer.
    await u.keyboard("{Escape}");
    await waitFor(async () => {
      await expect(canvasElement.querySelector(".recharts-tooltip-wrapper")).not.toBeInTheDocument();
    });
  },
};
