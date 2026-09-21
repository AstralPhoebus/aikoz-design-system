import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Tooltip } from "./tooltip";
import { Button } from "../button/button";

const meta = {
  title: "Composants/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  args: {
    content: "Nombre d'avis reçus sur la période, toutes sources confondues.",
    children: <Button variant="outline" size="sm">Avis traités</Button>,
  },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const JamaisUneInformationNecessaire: Story = {
  name: "Jamais une information nécessaire",
  parameters: {
    docs: {
      description: {
        story:
          "La règle qui prime sur toutes les autres. Une infobulle n'existe ni au tactile, " +
          "ni à l'impression, ni en zoom fort. Elle sert une précision de CONFORT : " +
          "l'intitulé complet d'une colonne abrégée, la date exacte derrière « il y a 3 j ». " +
          "Deux pièges qu'elle ne rattrape pas : un déclencheur `disabled` n'ouvrira jamais " +
          "rien, et Radix relie par `aria-describedby` — un bouton en icône seule a besoin " +
          "de son propre `aria-label` en plus.",
      },
    },
  },
};

export const EchapFermeSansBougerLePointeur: Story = {
  name: "Elle s'ouvre au focus et se ferme sur Échap",
  parameters: {
    docs: {
      description: {
        story:
          "Deux des trois obligations de **WCAG 1.4.13** vérifiées plutôt " +
          "qu'affirmées : l'infobulle apparaît au FOCUS et pas seulement au " +
          "survol — sans quoi elle n'existe pas au clavier — et **Échap la " +
          "ferme sans déplacer le pointeur**, pour qu'elle ne masque pas " +
          "indéfiniment ce qu'il y a dessous.\n\n" +
          "La troisième — rester ouverte quand le pointeur passe dessus — " +
          "n'est pas testée ici : elle demande un survol soutenu que " +
          "`userEvent` simule mal, et un test qui passe pour de mauvaises " +
          "raisons vaut moins que pas de test.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cible = canvas.getByRole("button", { name: "Avis traités" });

    cible.focus();
    const bulle = await screen.findByRole("tooltip");
    await expect(bulle).toHaveTextContent(/Nombre d'avis reçus/);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    // Le focus n'a pas bougé : fermer une infobulle ne doit pas coûter sa
    // place dans la page.
    await expect(document.activeElement).toBe(cible);
  },
};
