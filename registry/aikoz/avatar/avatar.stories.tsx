import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Avatar } from "./avatar";

const meta = {
  title: "Composants/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { name: "Camille Brun" },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const Tailles: Story = {
  name: "Les tailles",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex items-center gap-3">
      {(["sm", "md", "lg", "xl"] as const).map((s) => (
        <Avatar key={s} name="Camille Brun" size={s} />
      ))}
    </div>
  ),
};

export const LesParticulesSontIgnorees: Story = {
  name: "Les particules sont ignorées",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "« Banque de France » donne BF, pas BD. Sans cette règle, les initiales d'un " +
          "établissement seraient calculées sur un mot vide.",
      },
    },
  },
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Banque de France" />
      <Avatar name="Allianz Lyon Centre" />
      <Avatar name="AXA" />
    </div>
  ),
};

export const Decoratif: Story = {
  name: "Décoratif quand le nom est à côté",
  args: { decorative: true },
  parameters: {
    docs: {
      description: {
        story:
          "Dans une ligne de classement, le nom est déjà écrit. L'avatar est alors masqué " +
          "aux lecteurs d'écran, qui l'entendraient sinon deux fois.",
      },
    },
  },
};

export const LesInitialesPrennentLeRelais: Story = {
  name: "Sans image, les initiales — et le nom reste annoncé",
  args: { name: "Alice Maréchaud" },
  parameters: {
    docs: {
      description: {
        story:
          "Une image absente ou en échec ne doit pas laisser un trou : les " +
          "initiales prennent le relais. Le nom, lui, reste porté par " +
          "`aria-label` dans les deux cas — un avatar sans nom n'est qu'une " +
          "pastille colorée.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const avatar = canvas.getByRole("img", { name: "Alice Maréchaud" });
    await expect(avatar).toHaveTextContent("AM");
  },
};

export const DecoratifQuandLeNomEstDejaLa: Story = {
  name: "Décoratif quand le nom est déjà écrit à côté",
  args: { name: "Alice Maréchaud", decorative: true },
  parameters: {
    docs: {
      description: {
        story:
          "Dans une ligne de classement où le nom est déjà écrit, l'avatar " +
          "l'annoncerait une seconde fois. `decorative` le sort de l'arbre " +
          "d'accessibilité — il reste visible, il cesse d'être lu.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("img")).toBeNull();
    await expect(canvasElement.querySelector('[aria-hidden="true"]')).not.toBeNull();
  },
};
