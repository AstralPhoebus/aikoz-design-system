import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";
import { Combobox, chercher, normaliser, type ComboboxOption } from "./combobox";

// Un réseau d'établissements, avec les pièges qu'on rencontre : accents,
// chiffres collés à des lettres, doublons de préfixe.
const ETABLISSEMENTS: ComboboxOption[] = [
  { value: "cdg-2e", label: "Terminal 2E", meta: "Roissy-Charles-de-Gaulle" },
  { value: "cdg-2f", label: "Terminal 2F", meta: "Roissy-Charles-de-Gaulle" },
  { value: "cdg-1", label: "Terminal 1", meta: "Roissy-Charles-de-Gaulle" },
  { value: "ory-4", label: "Orly 4", meta: "Paris-Orly" },
  { value: "ory-1", label: "Orly 1", meta: "Paris-Orly" },
  { value: "roissypole", label: "Roissypôle", meta: "Zone aéroportuaire" },
  // Son libellé ne commence PAS par « Orly », son réseau si : c'est ce cas
  // qui rend visible la règle de tri.
  { value: "ory-tech", label: "Zone technique Sud", meta: "Paris-Orly" },
  { value: "lbg", label: "Paris-Le Bourget", meta: "Aviation d'affaires" },
  { value: "issy", label: "Issy-les-Moulineaux", meta: "Héliport", disabled: true },
];

const meta = {
  title: "Formulaires/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Établissement",
    options: ETABLISSEMENTS,
    placeholder: "Rechercher un établissement…",
    emptyLabel: (r: string) => `Aucun établissement pour « ${r} »`,
  },
  decorators: [(S) => <div className="max-w-md pb-72"><S /></div>],
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

function Pilote(args: React.ComponentProps<typeof Combobox>) {
  const [value, setValue] = useState<string | undefined>(args.value);
  return (
    <div className="flex flex-col gap-3">
      <Combobox {...args} value={value} onValueChange={setValue} />
      <p role="status" className="m-0 text-sm text-muted-foreground">
        Retenu : {ETABLISSEMENTS.find((o) => o.value === value)?.label ?? "aucun"}
      </p>
    </div>
  );
}

export const Defaut: Story = {
  name: "Par défaut",
  render: (args) => <Pilote {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "**Ce n'est pas un `Select`**, et la règle est le nombre d'options :\n\n" +
          "| | `Select` | `Combobox` |\n| --- | --- | --- |\n" +
          "| options | une dizaine | des centaines |\n" +
          "| on choisit | en parcourant | **en tapant** |\n\n" +
          "Chercher un établissement parmi trois cents dans un `Select`, c'est " +
          "faire défiler trois cents lignes. Choisir une année dans un " +
          "`Combobox`, c'est taper pour obtenir ce qu'on aurait vu d'un coup " +
          "d'œil.",
      },
    },
  },
};

export const LeMotifARIA: Story = {
  name: "Le focus ne quitte jamais le champ",
  render: (args) => <Pilote {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "`role=\"combobox\"` sur l'`<input>`, `aria-expanded`, " +
          "`aria-controls` vers la liste, et **`aria-activedescendant`** vers " +
          "la ligne parcourue.\n\n" +
          "Ce dernier est celui qui compte : il désigne l'option survolée " +
          "**sans déplacer le focus**. C'est ce qui permet de continuer à taper " +
          "pendant qu'on parcourt aux flèches — et c'est exactement ce qu'un " +
          "`<div role=\"option\">` focusable casse, en envoyant la frappe " +
          "suivante dans le vide.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const champ = canvas.getByRole("combobox", { name: /Établissement/ });
    await expect(champ).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(champ);
    await expect(champ).toHaveAttribute("aria-expanded", "true");

    // Le focus reste sur le CHAMP, quoi qu'il arrive.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect(champ).toHaveFocus();

    // Et c'est `aria-activedescendant` qui dit où on en est.
    const designee = champ.getAttribute("aria-activedescendant");
    await expect(designee).toBeTruthy();
    await expect(document.getElementById(designee!)).toHaveAttribute("role", "option");
  },
};

export const LaRechercheIgnoreLesAccents: Story = {
  name: "La recherche ignore les accents, et classe par utilité",
  render: (args) => <Pilote {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "« roissy » doit trouver « Roissypôle » : sans normalisation, c'est " +
          "la première chose qu'on tape et la première qui rate.\n\n" +
          "Et un `includes` seul range mal. Ce qui **commence** par la saisie " +
          "passe devant ce qui la contient : taper « orly » met « Orly 4 » et " +
          "« Orly 1 » avant les terminaux dont le réseau s'appelle " +
          "« Paris-Orly ». L'ordre d'origine départage à l'intérieur de chaque " +
          "groupe — un tri instable ferait sauter les lignes d'une frappe à " +
          "l'autre.",
      },
    },
  },
  play: async () => {
    await expect(normaliser("Roissypôle")).toBe("roissypole");

    // Sans accent, on trouve l'accentué.
    const r = chercher(ETABLISSEMENTS, "roissypole");
    await expect(r[0].label).toBe("Roissypôle");

    // Ce qui commence par la saisie passe devant ce qui la contient.
    const o = chercher(ETABLISSEMENTS, "orly");
    await expect(o).toHaveLength(3);
    // Les deux dont le LIBELLÉ commence par « Orly » passent devant celui qui
    // ne le contient que dans son réseau.
    await expect(o[0].label).toMatch(/^Orly/);
    await expect(o[1].label).toMatch(/^Orly/);
    await expect(o[2].label).toBe("Zone technique Sud");

    // La casse ne compte pas, et `meta` entre dans la recherche.
    await expect(chercher(ETABLISSEMENTS, "HÉLIPORT")[0].label).toBe("Issy-les-Moulineaux");

    // Recherche vide : tout, dans l'ordre d'origine.
    await expect(chercher(ETABLISSEMENTS, "  ")).toHaveLength(ETABLISSEMENTS.length);
  },
};

export const LeVideDitOuChercherLErreur: Story = {
  name: "Le vide répète la saisie",
  render: (args) => <Pilote {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "« Aucun établissement pour “orlyy” » dit où chercher l'erreur. " +
          "« Aucun résultat » laisse croire à un vide de données, et on va " +
          "voir ailleurs.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const champ = canvas.getByRole("combobox", { name: /Établissement/ });
    await userEvent.click(champ);
    await userEvent.type(champ, "orlyy");
    await waitFor(() =>
      expect(canvas.getByText(/Aucun établissement pour « orlyy »/)).toBeInTheDocument(),
    );
  },
};

export const AuClavierDeBoutEnBout: Story = {
  name: "Choisir au clavier, et se raviser",
  render: (args) => <Pilote {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "`Échap` ferme **sans choisir** et rend la valeur retenue au champ : " +
          "on n'a pas voulu changer d'avis en ouvrant la liste. Tabuler hors " +
          "du champ ferme aussi sans rien retenir — un choix se fait à " +
          "l'Entrée ou au clic, jamais par accident en quittant.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const champ = canvas.getByRole("combobox", { name: /Établissement/ });

    await userEvent.click(champ);
    await userEvent.type(champ, "orly");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent(/Orly/));
    const retenu = canvas.getByRole("status").textContent;

    // On rouvre, on parcourt, et on se ravise : rien ne change.
    await userEvent.click(champ);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Escape}");
    await expect(champ).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.getByRole("status")).toHaveTextContent(retenu!);
  },
};

export const LaListeCoupeeSeCompte: Story = {
  name: "Une liste coupée se compte, elle ne se tait pas",
  args: {
    options: Array.from({ length: 312 }, (_, i) => ({
      value: `ag-${i}`,
      label: `Agence ${String(i + 1).padStart(3, "0")}`,
      meta: i % 2 ? "Île-de-France" : "Provence",
    })),
    maxRendu: 50,
    label: "Agence",
    placeholder: "Rechercher parmi 312 agences…",
  },
  render: (args) => <Pilote {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "Trois cent douze agences : c'est le cas qui justifie ce composant " +
          "plutôt qu'un `Select`.\n\n" +
          "On n'en rend que cinquante — au-delà, la liste devient lente et " +
          "illisible. Mais **le reste est compté, jamais tu** : une liste " +
          "coupée en silence fait croire que ce qu'on cherche n'existe pas.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const champ = canvas.getByRole("combobox", { name: /Agence/ });
    await userEvent.click(champ);
    await waitFor(() =>
      expect(canvas.getByText(/262 autres — affinez la recherche/)).toBeInTheDocument(),
    );

    // On affine : la coupure disparaît d'elle-même.
    await userEvent.type(champ, "Agence 007");
    await waitFor(() => expect(canvas.queryByText(/autres — affinez/)).toBeNull());
  },
};
