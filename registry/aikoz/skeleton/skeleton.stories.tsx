import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Skeleton, SkeletonText } from "./skeleton";

const meta = {
  title: "Composants/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Par défaut",
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" className="size-10" />
        <div className="flex-1"><SkeletonText lines={2} /></div>
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  ),
};

export const MuetParChoix: Story = {
  name: "Muet pour les lecteurs d'écran, par choix",
  render: () => <Skeleton className="h-16 w-64" />,
  parameters: {
    docs: {
      description: {
        story:
          "Annoncer « rectangle gris » quatorze fois ne renseigne personne. C'est au " +
          "CONTENEUR de dire qu'un chargement est en cours, une fois, par `aria-busy` — " +
          "ce que fait `Table`. Le fond est sur `--track` et non `--muted` : en sombre ce " +
          "dernier vaut exactement `--card`, le squelette y serait invisible.",
      },
    },
  },
};

export const IlNeParleJamais: Story = {
  name: "Il ne parle jamais — c'est au conteneur de le faire",
  parameters: {
    docs: {
      description: {
        story:
          "Annoncer « rectangle gris » quatorze fois ne renseigne personne. " +
          "Le squelette est donc intégralement hors de l'arbre " +
          "d'accessibilité.\n\n" +
          "C'est au CONTENEUR de dire qu'un chargement est en cours — une " +
          "fois, par `aria-busy` — et de dire ce qui a chargé une fois fini, " +
          "par une région live. Cette story montre les deux moitiés du " +
          "contrat : le squelette muet, et le conteneur qui parle à sa " +
          "place.\n\n" +
          "Le conteneur porte `role=\"status\"`, pas seulement " +
          "`aria-label` : un élément générique n'a pas le droit de porter un " +
          "nom accessible, il serait ignoré. L'audit de cette story l'a " +
          "signalé — l'exemple était faux avant de servir d'exemple.",
      },
    },
  },
  render: () => (
    // `role="status"` et pas un `div` nu : un élément générique n'a pas le
    // droit de porter un nom accessible (`aria-prohibited-attr`), et le nom
    // serait simplement ignoré. C'est l'audit de cette story qui l'a dit —
    // l'exemple était faux avant de servir d'exemple.
    <div
      role="status"
      aria-busy="true"
      aria-label="Chargement des avis"
      className="flex flex-col gap-2"
    >
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-40" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const squelettes = canvasElement.querySelectorAll('[aria-hidden="true"]');
    await expect(squelettes.length).toBe(3);
    // Et le conteneur, lui, dit ce qui se passe — une seule fois.
    const zone = within(canvasElement).getByRole("status");
    await expect(zone).toHaveAttribute("aria-busy", "true");
    await expect(zone).toHaveAccessibleName("Chargement des avis");
  },
};
