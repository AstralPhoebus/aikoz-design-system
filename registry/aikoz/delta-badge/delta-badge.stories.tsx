import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { DeltaBadge } from "./delta-badge";

const meta = {
  title: "Composants/DeltaBadge",
  component: DeltaBadge,
  tags: ["autodocs"],
  args: { value: 12 },
} satisfies Meta<typeof DeltaBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const TroisSignes: Story = {
  name: "Hausse, baisse, stable",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <DeltaBadge value={12} />
      <DeltaBadge value={-8} />
      <DeltaBadge value={0} />
    </div>
  ),
};

export const ZeroNestPasUneHausse: Story = {
  name: "Zéro n'est ni une hausse ni une baisse",
  args: { value: 0 },
  parameters: {
    docs: {
      description: {
        story:
          "L'état neutre existe parce que rendre zéro en vert ou en rouge affirme un " +
          "mouvement qui n'a pas eu lieu. La flèche disparaît, le signe aussi.",
      },
    },
  },
};

export const LeSensNeTientPasALaCouleur: Story = {
  name: "Le sens de la variation ne tient pas à la couleur",
  args: { value: 18, unit: "%" },
  parameters: {
    docs: {
      description: {
        story:
          "WCAG 1.4.1 vérifié plutôt qu'affirmé : une flèche haut/bas double " +
          "le ton, et `aria-label` donne le sens en toutes lettres. En " +
          "niveaux de gris, une hausse et une baisse restent distinctes — la " +
          "couleur ne fait que renforcer.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const pastille = within(canvasElement).getByRole("img");
    await expect(pastille).toHaveAccessibleName(/hausse/);
    // Le signe est aussi écrit, pas seulement coloré.
    await expect(pastille).toHaveTextContent(/\+18/);
    // Et la flèche existe comme forme, en plus du texte.
    await expect(pastille.querySelector("svg")).not.toBeNull();
  },
};
