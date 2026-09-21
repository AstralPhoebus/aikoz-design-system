import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Table } from "./table";
import { EmptyState } from "../empty-state/empty-state";

type Ligne = { agence: string; avis: number; taux: string };
const lignes: Ligne[] = [
  { agence: "Lyon Part-Dieu", avis: 312, taux: "94 %" },
  { agence: "Paris Opéra", avis: 287, taux: "88 %" },
  { agence: "Marseille Prado", avis: 154, taux: "71 %" },
];
const colonnes = [
  { key: "agence", header: "Agence" },
  { key: "avis", header: "Avis", numeric: true },
  { key: "taux", header: "Taux de réponse", numeric: true },
];

const meta = {
  title: "Données/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    caption: "Taux de réponse par agence, 30 derniers jours",
    columns: colonnes,
    rows: lignes,
    getRowKey: (r: Ligne) => r.agence,
    rowHeaderKey: "agence",
  },
} satisfies Meta<typeof Table<Ligne>>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const UnVraiTable: Story = {
  name: "Un vrai `<table>`, pas une grille de div",
  parameters: {
    docs: {
      description: {
        story:
          "Les balises de tableau portent des RELATIONS que rien ne remplace. En mode " +
          "tableau, un lecteur d'écran annonce « Lyon Part-Dieu, taux de réponse, 94 % » " +
          "à chaque déplacement ; une grille de div donne « 94 % » et l'utilisateur doit " +
          "compter les colonnes. `<caption>` plutôt qu'`aria-label` : visible, liée " +
          "nativement, impossible à désynchroniser d'un titre voisin.",
      },
    },
  },
};

export const Chargement: Story = {
  name: "Chargement",
  args: { loading: true, rows: [], loadingRows: 3 },
  parameters: {
    docs: {
      description: {
        story:
          "`aria-busy` est porté UNE fois par le conteneur, pas par chacun des squelettes : " +
          "c'est le tableau qui charge, pas quatorze rectangles.",
      },
    },
  },
};

export const Vide: Story = {
  name: "Vide",
  args: {
    rows: [],
    empty: (
      <EmptyState
        title="Aucun avis sur cette période"
        description="Élargissez la période d'analyse ou retirez le filtre par source."
      />
    ),
  },
};

export const LesRelationsDuTableauSontReelles: Story = {
  name: "Chaque cellule sait de quelle colonne et de quelle ligne elle vient",
  args: { caption: "Avis par agence", columns: colonnes, rows: lignes, rowHeaderKey: "agence" },
  parameters: {
    docs: {
      description: {
        story:
          "Ce que le composant promet et que rien ne vérifiait : une vraie " +
          "`<caption>` qui NOMME le tableau, des `<th scope=\"col\">` en tête " +
          "de colonne, et un `<th scope=\"row\">` par ligne.\n\n" +
          "C'est ce trio qui fait annoncer « Lyon Part-Dieu, taux de réponse, " +
          "94 % » au lieu de « 94 % ». Une grille de `div` rend la même chose " +
          "à l'écran et rien à l'oreille — et la différence ne se voit sur " +
          "aucune capture.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tableau = canvas.getByRole("table");

    // La légende NOMME le tableau : c'est elle, pas un titre voisin, qui
    // répond quand un lecteur d'écran demande « quel tableau ? ».
    await expect(tableau).toHaveAccessibleName("Avis par agence");

    const enTetesColonne = within(tableau).getAllByRole("columnheader");
    await expect(enTetesColonne).toHaveLength(colonnes.length);
    for (const th of enTetesColonne) await expect(th).toHaveAttribute("scope", "col");

    // Un en-tête de LIGNE par ligne de données — c'est lui qui donne le
    // « Lyon Part-Dieu » du début de l'annonce.
    const enTetesLigne = within(tableau).getAllByRole("rowheader");
    await expect(enTetesLigne).toHaveLength(lignes.length);
    for (const th of enTetesLigne) await expect(th).toHaveAttribute("scope", "row");
    await expect(enTetesLigne[0]).toHaveTextContent("Lyon Part-Dieu");
  },
};

export const LeConteneurQuiDefileEstAtteignable: Story = {
  name: "On peut se poser sur la zone qui défile",
  args: { caption: "Avis par agence", columns: colonnes, rows: lignes, rowHeaderKey: "agence" },
  parameters: {
    docs: {
      description: {
        story:
          "Un tableau plus large que son cadre défile horizontalement. Sans " +
          "arrêt de tabulation sur le conteneur, la partie hors champ est " +
          "inatteignable au clavier : on ne fait pas défiler ce sur quoi on " +
          "ne peut pas se poser. Et cet arrêt doit être NOMMÉ, sinon il " +
          "s'annonce comme une région vide.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await expect(region).toHaveAttribute("tabindex", "0");
    await expect(region).toHaveAccessibleName();
  },
};
