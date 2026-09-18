import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ProgressBar } from "./progress-bar";

const meta = {
  title: "Composants/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  args: { value: 87 },
  decorators: [(S) => <div className="w-64"><S /></div>],
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const Niveaux: Story = {
  name: "Les trois niveaux",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex w-64 flex-col gap-4">
      <ProgressBar value={95} />
      <ProgressBar value={72} />
      <ProgressBar value={35} />
    </div>
  ),
};

export const LeContourPorteLaLimite: Story = {
  name: "Le contour porte la limite, pas l'aplat",
  args: { value: 72 },
  parameters: {
    docs: {
      description: {
        story:
          "L'or du thème sombre ne tient que 1,40:1 sur une piste claire, et le palier qui " +
          "passait 3:1 seul rendait la barre BRUNE — une couleur qu'aucun autre thème " +
          "n'emploie. Le liseré intérieur d'1 px règle le faux dilemme : l'aplat porte " +
          "l'identité, le contour porte WCAG 1.4.11. Un seul or par thème, 12 paires sur " +
          "12 au-dessus de 3:1.",
      },
    },
  },
};

export const MeterPasProgressbar: Story = {
  name: "`meter`, pas `progressbar`",
  args: { value: 87, valueText: "87 %, objectif 90 %" },
  parameters: {
    docs: {
      description: {
        story:
          "`meter` désigne une MESURE dans une échelle connue ; `progressbar` l'avancement " +
          "d'une TÂCHE. Les lecteurs d'écran ne les annoncent pas pareil. Le défaut est " +
          "`meter` : ici la barre sert des indicateurs, pas des traitements en cours.",
      },
    },
  },
};

export const LeRepereSeLitDesDeuxCotes: Story = {
  name: "Le repère se lit qu'il tombe sur le vide ou sur le plein",
  decorators: [(S) => <div className="w-80"><S /></div>],
  parameters: {
    docs: {
      description: {
        story:
          "`marker` pose l'objectif SUR la piste. Sans lui, l'objectif n'existait " +
          "que dans l'annonce vocale : à l'écran, une barre aux trois quarts ne dit " +
          "pas si le quart manquant est un retard ou une avance.\n\n" +
          "Le repère est une **fente** de la couleur de la carte, avec un trait " +
          "neutre au milieu. Le trait seul ne tient qu'un côté — 5,99:1 sur la " +
          "piste vide, mais 1,53:1 dès qu'il tombe sur l'aplat rempli, c'est-à-dire " +
          "invisible au moment précis où l'objectif est dépassé. La fente le " +
          "détache du remplissage, le trait le détache de la piste.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <ProgressBar value={72} max={100} marker={90} valueText="72 %, objectif 90 %" />
        <span className="text-xs text-muted-foreground">72 % — objectif 90 % pas atteint</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <ProgressBar value={96} max={100} marker={90} valueText="96 %, objectif 90 %" />
        <span className="text-xs text-muted-foreground">
          96 % — objectif 90 % dépassé, le repère tombe sur le plein
        </span>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Le repère existe et se pose bien à 90 % de la piste, pas au bout.
    const pistes = [...canvasElement.querySelectorAll("[role='meter']")];
    await expect(pistes).toHaveLength(2);
    for (const piste of pistes) {
      const repere = piste.querySelector("span[aria-hidden='true']");
      await expect(repere).not.toBeNull();
      const gauche = (repere as HTMLElement).getBoundingClientRect().left;
      const bords = piste.getBoundingClientRect();
      const fraction = (gauche - bords.left) / bords.width;
      await expect(fraction).toBeGreaterThan(0.85);
      await expect(fraction).toBeLessThan(0.95);
    }
  },
};
