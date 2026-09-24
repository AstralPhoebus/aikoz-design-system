import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { KanbanBoard } from "./kanban-board";

const meta = {
  title: "Composants/KanbanBoard",
  component: KanbanBoard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    columns: [
      {
        key: "a",
        title: "À valider",
        subtitle: "Rédigées, pas encore soumises",
        tone: "primary",
        count: 7,
        children: <p className="m-0 text-sm text-muted-foreground">Sept réponses.</p>,
      },
      {
        key: "b",
        title: "En attente",
        subtitle: "Chez le responsable",
        tone: "info",
        count: 2,
        children: <p className="m-0 text-sm text-muted-foreground">Deux réponses.</p>,
      },
      {
        key: "c",
        title: "Renvoyées",
        subtitle: "À corriger",
        tone: "warning",
        count: 1,
        children: <p className="m-0 text-sm text-muted-foreground">Une réponse.</p>,
      },
    ],
  },
} satisfies Meta<typeof KanbanBoard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const ChaqueColonneEstUneSectionNommee: Story = {
  name: "Chaque colonne est une section nommée",
  parameters: {
    docs: {
      description: {
        story:
          "C'est le contrat que ce composant tient, et la raison pour laquelle " +
          "il existe : chaque colonne est une `section` **nommée par son " +
          "titre** (`aria-labelledby`), donc atteignable au repère par un " +
          "lecteur d'écran, et son compte est un `CountBadge` étiqueté plutôt " +
          "qu'un nombre nu.\n\n" +
          "Les cartes, elles, sont fournies par l'appelant. Une file de " +
          "réponses et un circuit de validation n'affichent pas les mêmes " +
          "choses — et le jour où ils divergeraient dans un composant unique, " +
          "c'est ce composant qui deviendrait illisible.",
      },
    },
  },
  play: async ({ canvas }) => {
    for (const nom of ["À valider", "En attente", "Renvoyées"]) {
      const section = canvas.getByRole("region", { name: nom });
      await expect(section).toBeInTheDocument();
    }
    // Le compte est annoncé, pas seulement dessiné.
    await expect(canvas.getByText(/éléments dans « À valider »/)).toBeInTheDocument();
  },
};

export const LeLisereSuitLeTon: Story = {
  name: "Le liseré et le compteur ne peuvent pas se désaccorder",
  parameters: {
    docs: {
      description: {
        story:
          "`tone` pilote les deux. Deux props, c'est deux occasions de les " +
          "laisser dire des choses différentes — un liseré ambre au-dessus " +
          "d'un compteur bleu ne veut plus rien dire.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const liseres = [...canvasElement.querySelectorAll<HTMLElement>("[style*='border-color']")];
    await expect(liseres).toHaveLength(3);
    // Trois tons, trois couleurs de liseré distinctes.
    const couleurs = new Set(liseres.map((l) => getComputedStyle(l).borderLeftColor));
    await expect(couleurs.size).toBe(3);
    await expect(c.getAllByRole("region")).toHaveLength(3);
  },
};
