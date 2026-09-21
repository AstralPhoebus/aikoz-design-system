import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Select } from "./select";

const meta = {
  title: "Formulaires/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    label: "Période",
    defaultValue: "30j",
    options: [
      { value: "7j", label: "7 derniers jours" },
      { value: "30j", label: "30 derniers jours" },
      { value: "90j", label: "90 derniers jours" },
    ],
  },
  decorators: [(S) => <div className="w-72"><S /></div>],
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const Groupes: Story = {
  name: "Options groupées",
  args: {
    label: "Source",
    defaultValue: undefined,
    placeholder: "Toutes les sources",
    options: [
      { value: "google", label: "Google", group: "Généralistes" },
      { value: "trustpilot", label: "Trustpilot", group: "Généralistes" },
      { value: "avis", label: "Avis Vérifiés", group: "Certifiés" },
      { value: "opinion", label: "Opinion System", group: "Certifiés", disabled: true },
    ],
  },
};

export const LeFocusClavierEstUnAnneau: Story = {
  name: "Le focus clavier est un anneau, pas un voile",
  parameters: {
    docs: {
      description: {
        story:
          "Aucune teinte du système ne délimite l'option survolée : le voile donne 1,19:1 " +
          "sur le panneau, l'accent aquamarine 1,24. Même cause que le survol des boutons. " +
          "Or `data-highlighted` n'existe pas dans Radix Select v2 — c'est le focus DOM " +
          "réel qui se déplace. L'anneau intérieur en `--ring` tient 5,77:1.",
      },
    },
  },
};

export const QuandPreferrerLeNatif: Story = {
  name: "Quand préférer un `<select>` natif",
  args: { label: "Pays", defaultValue: undefined, placeholder: "Sélectionner…" },
  parameters: {
    docs: {
      description: {
        story:
          "Radix a été choisi pour styler la liste ouverte, poser une coche et grouper. " +
          "Le natif reste supérieur sur un point : il ouvre le sélecteur du système sur " +
          "mobile. Pour un choix long et sans mise en forme — un pays, une année — " +
          "préférer le natif.",
      },
    },
  },
};

export const LeChoixSeFaitAuClavier: Story = {
  name: "Le choix se fait au clavier, et le libellé nomme le champ",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const declencheur = canvas.getByRole("combobox");

    // Le libellé visible EST le nom accessible : c'est ce que garantit le
    // prop obligatoire, et c'est ce qui distingue « Période » de « champ ».
    await expect(declencheur).toHaveAccessibleName(/Période/);

    declencheur.focus();
    await userEvent.keyboard("{Enter}");
    const liste = await screen.findByRole("listbox");
    await expect(liste).toBeInTheDocument();

    // Navigation puis validation : un select qui ne s'ouvre qu'à la souris
    // exclut la moitié de ses utilisateurs, et rien à l'écran ne le montre.
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(declencheur));
  },
  parameters: {
    docs: {
      description: {
        story:
          "Ouvrir, parcourir, choisir, refermer — au clavier seul. Un select " +
          "qui ne s'ouvre qu'à la souris exclut la moitié de ses " +
          "utilisateurs, et rien à l'écran ne le montre. Le focus revient au " +
          "déclencheur après la fermeture, sinon la tabulation repart du " +
          "début du document.",
      },
    },
  },
};
