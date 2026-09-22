import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { Pagination, fenetre } from "./pagination";

const meta = {
  title: "Navigation/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  // `onPageChange` est requis par le contrat : `satisfies Meta` l'exige
  // ici même si chaque histoire le remplace par son état local.
  args: {
    label: "Pages du classement",
    page: 1,
    pages: 16,
    total: 312,
    parPage: 20,
    onPageChange: () => {},
  },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

function Pilotee(args: React.ComponentProps<typeof Pagination>) {
  const [page, setPage] = useState(args.page);
  return <Pagination {...args} page={page} onPageChange={setPage} />;
}

export const Defaut: Story = {
  name: "Par défaut",
  args: {},
  render: (args) => <Pilotee {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "Un `<nav>` nommé, une liste, et des `<button>` — **pas des liens**. " +
          "Dans un tableau de bord, changer de page ne change pas d'URL : " +
          "annoncer un lien promettrait une navigation qui n'aura pas lieu, et " +
          "casserait l'ouverture dans un nouvel onglet sur laquelle certains " +
          "comptent.\n\n" +
          "Le nom du `<nav>` est **obligatoire**. Un tableau de bord en porte " +
          "souvent plusieurs ; sans nom distinct, un lecteur d'écran les " +
          "annonce toutes « navigation ».",
      },
    },
  },
};

export const LeResumePorteLInformation: Story = {
  name: "Le résumé porte l'information, pas les numéros",
  args: { page: 3 },
  render: (args) => <Pilotee {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "« 41–60 sur 312 » répond à la question qu'on se pose vraiment — " +
          "combien il en reste — là où « page 3 » ne dit rien tant qu'on ne " +
          "connaît pas la taille des pages.\n\n" +
          "Il est en `aria-live=\"polite\"` parce que la liste ne bouge pas " +
          "assez pour qu'on suive au clavier ce qui vient de changer : seul le " +
          "numéro courant se déplace, et on peut très bien ne pas le voir.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText(/41–60 sur 312/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Page suivante" }));
    await expect(canvas.getByText(/61–80 sur 312/)).toBeInTheDocument();
    // La dernière page est tronquée sur le total, pas sur la taille de page.
    await userEvent.click(canvas.getByRole("button", { name: "Page 16" }));
    await expect(canvas.getByText(/301–312 sur 312/)).toBeInTheDocument();
  },
};

export const LaPageCouranteNEstPasUnBouton: Story = {
  name: "La page courante n'est pas un bouton",
  args: { page: 5 },
  render: (args) => <Pilotee {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "Même raisonnement que le dernier niveau d'un fil d'Ariane : rendre " +
          "cliquable ce sur quoi on est déjà produit une commande qui ne fait " +
          "rien, et prive `aria-current=\"page\"` de son support. Elle est " +
          "rendue en `<span>`.",
      },
    },
  },
  play: async ({ canvas }) => {
    const courante = canvas.getByText("5");
    await expect(courante.tagName).toBe("SPAN");
    await expect(courante).toHaveAttribute("aria-current", "page");
    // Et elle n'est ni cliquable ni tabulable.
    await expect(canvas.queryByRole("button", { name: "Page 5" })).toBeNull();
  },
};

export const LaFenetreGardeSaLargeur: Story = {
  name: "La fenêtre garde sa largeur, où qu'on soit",
  args: { page: 8, pages: 20, total: 400, parPage: 20 },
  render: (args) => <Pilotee {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "C'est le défaut le plus courant du motif : on calcule " +
          "`page ± voisines`, et la fenêtre **rétrécit aux extrémités** parce " +
          "qu'une moitié tombe hors bornes. La barre change alors de taille en " +
          "naviguant, et les boutons se déplacent sous le doigt.\n\n" +
          "Ce qu'une extrémité ne peut pas prendre est reporté à l'opposé : la " +
          "largeur est constante de la première à la dernière page.",
      },
    },
  },
  play: async () => {
    // La même largeur, partout, sur un livre de 20 pages.
    const largeurs = new Set<number>();
    for (let p = 1; p <= 20; p++) largeurs.add(fenetre(p, 20, 1).length);
    await expect(largeurs.size).toBe(1);
    await expect([...largeurs][0]).toBe(7);

    // Première et dernière sont toujours là, la courante aussi.
    for (const p of [1, 2, 10, 19, 20]) {
      const f = fenetre(p, 20, 1);
      await expect(f[0]).toBe(1);
      await expect(f[f.length - 1]).toBe(20);
      await expect(f).toContain(p);
    }

    // Sous le seuil, aucune coupure : on montre tout.
    await expect(fenetre(3, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  },
};

export const UneSeulePageNeRendRien: Story = {
  name: "Une seule page ne rend rien",
  args: { pages: 1, total: 12, parPage: 20 },
  render: (args) => <Pilotee {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "Une pagination d'une seule page est un contrôle qui occupe de la " +
          "place sans rien offrir — et qui fait douter : « il y en a d'autres, " +
          "mais où ? ». Le composant ne rend rien du tout.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("navigation")).toBeNull();
  },
};

export const AuClavier: Story = {
  name: "Tout se fait au clavier, et les bornes se désactivent",
  args: { page: 1, pages: 4, total: 70, parPage: 20 },
  render: (args) => <Pilotee {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "« Précédent » est désactivé sur la première page, « Suivant » sur " +
          "la dernière. Un bouton désactivé sort de la tabulation : le focus " +
          "ne se pose pas sur une commande qui ne fera rien.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const precedent = canvas.getByRole("button", { name: "Page précédente" });
    await expect(precedent).toBeDisabled();

    await userEvent.click(canvas.getByRole("button", { name: "Page 4" }));
    await expect(canvas.getByRole("button", { name: "Page suivante" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Page précédente" })).toBeEnabled();

    // Et on navigue à la frappe, pas seulement au clic.
    const p1 = canvas.getByRole("button", { name: "Page 1" });
    p1.focus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("1")).toHaveAttribute("aria-current", "page");
  },
};
