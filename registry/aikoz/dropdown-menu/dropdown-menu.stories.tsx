import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { DropdownMenu } from "./dropdown-menu";
import { Button } from "@registry/aikoz/button/button";

const meta = {
  title: "Navigation/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Actions sur Orly 4",
    actions: [
      { label: "Exporter les avis", onSelect: fn(), shortcut: "⌘E" },
      { label: "Relancer la collecte", onSelect: fn() },
      { label: "Archiver l'établissement", onSelect: fn() },
    ],
  },
  decorators: [(S) => <div className="flex justify-end pb-64"><S /></div>],
} satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Par défaut",
  parameters: {
    docs: {
      description: {
        story:
          "**Un menu contient des commandes, pas des liens.** S'il s'agit " +
          "d'aller ailleurs, c'est de la navigation : `SidebarNav` ou " +
          "`Breadcrumb`. Le motif `menu` de l'ARIA décrit une liste d'actions " +
          "sur un objet, et c'est ce qui lui donne son contrat clavier.\n\n" +
          "**Le nom est obligatoire.** Un tableau de bord porte un menu par " +
          "ligne : « Actions sur Orly 4 » se distingue, « Actions » non.",
      },
    },
  },
};

export const LeContratClavier: Story = {
  name: "Flèches, Échap, et le focus qui revient",
  parameters: {
    docs: {
      description: {
        story:
          "Ouvrir, parcourir aux flèches, fermer à `Échap` — et **le focus " +
          "revient sur le déclencheur**. C'est le point que rate presque " +
          "toujours un menu réécrit à la main : sans ce retour, l'utilisateur " +
          "clavier se retrouve au début du document, sans rien pour lui dire " +
          "où il est.\n\n" +
          "Le contrat est intégralement délégué à Radix. Ce qui est à nous, " +
          "c'est le nom, l'ordre et les couleurs.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const declencheur = canvas.getByRole("button", { name: "Actions sur Orly 4" });

    await userEvent.click(declencheur);
    const menu = await waitFor(() => document.querySelector('[role="menu"]')!);
    await expect(menu).toBeInTheDocument();
    await expect(menu).toHaveAttribute("aria-label", "Actions sur Orly 4");

    // Les flèches parcourent, sans qu'on écrive une ligne de clavier.
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toHaveTextContent("Exporter les avis");
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toHaveTextContent("Relancer la collecte");

    // Échap ferme ET rend le focus au déclencheur.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    await expect(declencheur).toHaveFocus();
  },
};

export const LaDestructiveEstToujoursDerniere: Story = {
  name: "La destructive est toujours la dernière",
  args: {
    groupes: [
      {
        label: "Données",
        actions: [
          { label: "Exporter les avis", onSelect: fn() },
          // Déclarée AU MILIEU, volontairement : le composant la déplace.
          { label: "Supprimer l'établissement", onSelect: fn(), destructive: true },
          { label: "Relancer la collecte", onSelect: fn() },
        ],
      },
      { label: "Partage", actions: [{ label: "Copier le lien", onSelect: fn() }] },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Elle est déclarée **au milieu du premier groupe** dans cette " +
          "histoire, et le composant la sort pour la placer en dernier, après " +
          "un filet. Une commande irréversible voisine d'une commande " +
          "anodine se clique par erreur — l'ordre est une protection, pas une " +
          "convention d'affichage.\n\n" +
          "La couleur ne porte pas seule : la position et le libellé " +
          "— « Supprimer l'établissement », qui dit ce qui disparaît — " +
          "restent lisibles sans elle.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions sur Orly 4" }));
    const items = await waitFor(() => {
      const l = [...document.querySelectorAll('[role="menuitem"]')];
      if (l.length < 4) throw new Error("menu pas encore ouvert");
      return l;
    });
    await expect(items).toHaveLength(4);
    await expect(items[items.length - 1]).toHaveTextContent("Supprimer l'établissement");
    // Et elle n'est pas dans son groupe d'origine.
    await expect(items[0]).toHaveTextContent("Exporter les avis");
    await expect(items[1]).toHaveTextContent("Relancer la collecte");

    // On referme : une histoire ne laisse pas la page dans un état transitoire,
    // sans quoi l'audit d'accessibilité mesure un document à moitié ouvert.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  },
};

// ─── Un déclencheur à soi ─────────────────────────────────────────────────────

function AvecBouton() {
  const [dernier, setDernier] = useState("aucune");
  return (
    <div className="flex flex-col items-end gap-3">
      <DropdownMenu
        label="Actions sur la sélection"
        trigger={<Button size="sm" variant="ghost">Actions</Button>}
        actions={[
          { label: "Exporter en CSV", onSelect: () => setDernier("Exporter en CSV") },
          { label: "Marquer comme traité", onSelect: () => setDernier("Marquer comme traité") },
          { label: "Retirer de la sélection", onSelect: () => setDernier("Retirer"), destructive: true },
        ]}
      />
      <p role="status" className="m-0 text-sm text-muted-foreground">
        Dernière commande : {dernier}
      </p>
    </div>
  );
}

export const UnDeclencheurASoi: Story = {
  name: "Un déclencheur à soi",
  render: () => <AvecBouton />,
  parameters: {
    docs: {
      description: {
        story:
          "Sans `trigger`, un bouton d'icône est rendu et nommé par `label`. " +
          "Avec, l'élément fourni est rendu tel quel et reçoit les attributs du " +
          "menu — il doit donc accepter une `ref` et des props, ce que font " +
          "tous les composants du système.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    const item = await waitFor(() =>
      [...document.querySelectorAll('[role="menuitem"]')].find((e) =>
        /Exporter en CSV/.test(e.textContent ?? ""),
      )!,
    );
    await userEvent.click(item);
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent("Exporter en CSV"),
    );
  },
};
