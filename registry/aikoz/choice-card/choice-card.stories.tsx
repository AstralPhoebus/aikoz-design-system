import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { ChoiceCard } from "./choice-card";

const meta = {
  title: "Formulaires/ChoiceCard",
  component: ChoiceCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { label: "Google", value: "google", name: "demo", description: "Fiches d'établissement" },
  decorators: [(S) => <div className="w-72"><S /></div>],
} satisfies Meta<typeof ChoiceCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const CestLaCocheQuiPorteLEtat: Story = {
  name: "C'est la coche qui porte l'état, pas le trait",
  args: { defaultChecked: true },
  parameters: {
    docs: {
      description: {
        story:
          "Mesuré : le trait retenu (`--ring`) et le trait au repos (`--border-strong`) ne " +
          "se distinguent que de **1,30:1 en clair** — leurs teintes diffèrent, leurs " +
          "clartés non. Les deux passent largement 3:1 contre la carte, donc un audit " +
          "texte/fond ne signale rien ; mais l'information utile n'est pas « y a-t-il un " +
          "trait », c'est « lequel des deux ». Retirer la coche casserait le composant. " +
          "`border-2` en permanence, seule la teinte change : passer de 1 à 2 px " +
          "décalerait toute la grille.",
      },
    },
  },
};

export const UnVraiInputSousLaCarte: Story = {
  name: "Un vrai `<input>` sous la carte",
  play: async ({ canvas, userEvent }) => {
    // La promesse du composant : un VRAI champ natif, masqué par `sr-only` et
    // non par `display:none` — ces deux-là le retireraient de la tabulation.
    // Le test passe par le CLAVIER, parce que c'est le seul chemin qui casse
    // quand on remplace le champ par un `<div role="radio">`.
    const champ = canvas.getByRole("radio", { name: /Google/ });
    await expect(champ).not.toBeChecked();

    await userEvent.tab();
    await expect(champ).toHaveFocus();

    await userEvent.keyboard(" ");
    await expect(champ).toBeChecked();

    // Masqué à l'œil sans l'être aux technologies d'assistance : une boîte
    // d'un pixel, jamais `display:none`.
    const boite = champ.getBoundingClientRect();
    await expect(boite.width).toBeLessThan(4);
    await expect(getComputedStyle(champ).display).not.toBe("none");
  },
  parameters: {
    docs: {
      description: {
        story:
          "En `sr-only`, pas en `display:none` — ces deux-là le retirent de la tabulation. " +
          "Il reste focusable, se coche à la barre d'espace, et les flèches parcourent les " +
          "radios du groupe sans qu'on écrive une ligne de clavier. Refaire ça avec " +
          "`role=\"radio\"` sur un `<div>` rate presque toujours le parcours aux flèches.",
      },
    },
  },
};

export const LAncienNomMarcheEncore: Story = {
  name: "`onChange` marche encore, mais ne s'écrit plus",
  render: () => {
    const [recu, setRecu] = useState<string[]>([]);
    return (
      <div className="flex flex-col gap-3">
        <ChoiceCard
          label="Câblée par onCheckedChange"
          value="neuf"
          type="checkbox"
          onCheckedChange={(c) => setRecu((r) => [...r, `neuf:${c}`])}
        />
        <ChoiceCard
          label="Câblée par onChange"
          value="ancien"
          type="checkbox"
          onChange={(c) => setRecu((r) => [...r, `ancien:${c}`])}
        />
        <p role="status" className="m-0 text-sm text-muted-foreground">
          Reçu : {recu.join(" ") || "rien"}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Le rappel s'appelait `onChange` — c'est-à-dire exactement le nom " +
          "que `Checkbox` hérite de React, mais avec une **signature " +
          "incompatible** : ici un booléen, là un `ChangeEvent`. Qui " +
          "apprenait l'un et écrivait l'autre recevait un événement là où il " +
          "attendait `true`, sans que TypeScript le voie si le rappel " +
          "ignorait son argument.\n\n" +
          "Il s'appelle désormais `onCheckedChange`, comme sur `Switch`. " +
          "L'ancien continue de fonctionner pour ne rien casser chez qui " +
          "consomme déjà le registry, et **cette histoire est ce qui le " +
          "garantit** : un alias que rien n'exerce cesse de marcher sans que " +
          "personne ne le voie.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: /onCheckedChange/ }));
    await expect(canvas.getByRole("status")).toHaveTextContent("neuf:true");

    await userEvent.click(canvas.getByRole("checkbox", { name: /par onChange/ }));
    await expect(canvas.getByRole("status")).toHaveTextContent("ancien:true");
  },
};
