import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ScoreStars } from "./score-stars";

const meta = {
  title: "Composants/ScoreStars",
  component: ScoreStars,
  tags: ["autodocs"],
  args: { value: 4.2 },
} satisfies Meta<typeof ScoreStars>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const LaFormePorteLaNote: Story = {
  name: "La forme porte la note, pas la couleur",
  parameters: {
    docs: {
      description: {
        story:
          "Écart d'accessibilité ASSUMÉ, décidé par Alice le 10/09/2026 : `--rating` vaut " +
          "warning.500 en clair, soit 2,18:1 sur carte — sous le seuil de 3:1. L'équipe " +
          "jugeait le palier conforme trop terne. Ce qui rend l'écart tenable : l'étoile " +
          "pleine et l'étoile vide diffèrent par la FORME, et la note est exposée en " +
          "`aria-label`. Ce qui reste dégradé : percevoir les étoiles elles-mêmes.",
      },
    },
  },
};

export const Silencieuse: Story = {
  name: "Silencieuse quand un parent annonce déjà la note",
  args: { label: null },
  parameters: {
    docs: {
      description: {
        story:
          "`label={null}` rend les étoiles `aria-hidden`. À utiliser quand la carte " +
          "englobante porte déjà l'énoncé complet — sinon la note est annoncée deux fois.",
      },
    },
  },
};

export const LaNoteSeLitSansVoirLesEtoiles: Story = {
  name: "La note se lit sans voir les étoiles",
  args: { value: 4.2, max: 5 },
  parameters: {
    docs: {
      description: {
        story:
          "Le nombre d'étoiles pleines porte la note à l'œil ; `aria-label` " +
          "la donne en toutes lettres. Les étoiles elles-mêmes sont hors de " +
          "l'arbre d'accessibilité — sans quoi un lecteur d'écran annoncerait " +
          "cinq images sans alternative au lieu d'une note.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole("img");
    await expect(note).toHaveAccessibleName(/4,2/);
    // Aucune étoile ne s'annonce séparément.
    for (const svg of canvasElement.querySelectorAll("svg")) {
      await expect(svg.closest('[aria-hidden="true"]') ?? svg.getAttribute("aria-hidden")).toBeTruthy();
    }
  },
};
