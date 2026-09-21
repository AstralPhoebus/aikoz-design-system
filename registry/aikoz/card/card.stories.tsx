import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Card } from "./card";

const meta = {
  title: "Composants/Card",
  component: Card,
  tags: ["autodocs"],
  args: { children: "Contenu de la carte" },
} satisfies Meta<typeof Card>;

// La contrainte de largeur vit sur les histoires, pas sur le meta : les
// decorateurs se COMPOSENT, donc posee ici elle s'ajouterait a celle des
// histoires en grille et ecraserait leurs colonnes.
const carteSeule: Story["decorators"] = [(S) => <div className="w-72"><S /></div>];
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut", decorators: carteSeule };

export const Surfaces: Story = {
  name: "Les trois surfaces",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Card surface="raised" className="w-48">raised</Card>
      <Card surface="flat" className="w-48">flat</Card>
      <Card surface="bare" className="w-48">bare</Card>
    </div>
  ),
};

export const PasDeCardTitle: Story = {
  name: "Pas de `CardTitle`, délibérément",
  decorators: carteSeule,
  args: { as: "article", children: "Une carte rendue en <article>" },
  parameters: {
    docs: {
      description: {
        story:
          "Un `CardTitle` figerait un `h3` et casserait la hiérarchie dès qu'une carte est " +
          "utilisée ailleurs : le niveau de titre dépend du plan de la PAGE, pas de la " +
          "carte. Le prop `as` est sémantique et non décoratif — un avis autonome sort en " +
          "`article`, une section nommée en `section`, et ça change les repères de " +
          "navigation d'un lecteur d'écran.",
      },
    },
  },
};

export const LaCarteAContreTheme: Story = {
  name: "La carte à contre-thème, une seule par écran",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "Sombre en thème clair, claire en thème sombre. Sa raison d'être est " +
          "la **hiérarchie**, pas la décoration : dans une grille où toutes les " +
          "cartes sont blanches, aucune ne prime. L'inversion fait primer la " +
          "principale sans ajouter de couleur au système ni changer sa taille — " +
          "c'est le geste des tableaux de bord bancaires, une carte noire pour " +
          "le solde et des cartes blanches pour le reste.\n\n" +
          "D'où la règle d'emploi : **une seule par écran**. Deux cartes " +
          "inversées ne hiérarchisent plus rien, elles font un damier.\n\n" +
          "Le dégradé a deux couches. La base va d'un palier de la rampe de " +
          "chrome à un autre — même rampe, donc la surface reste une surface. " +
          "Par-dessus, une lueur d'angle porte la **seconde couleur de " +
          "marque** et suit `data-brand` : marine vers campanule chez ADP, " +
          "encre vers vert chez Extime. Bascule la marque dans la barre " +
          "d'outils pour le voir.",
      },
    },
  },
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card surface="inverse" density="large" className="sm:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
          Satisfaction globale
        </span>
        <span className="text-5xl font-bold leading-none tracking-tight">4,2 /5</span>
        <span className="text-sm opacity-80">
          1 654 avis sur les six derniers mois, tous canaux confondus.
        </span>
      </Card>
      <Card surface="raised" density="large">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Taux de réponse
        </span>
        <span className="text-4xl font-bold leading-none tracking-tight">87 %</span>
      </Card>
    </div>
  ),
};

export const LaBaliseSuitLeSens: Story = {
  name: "La balise suit le sens, pas la mise en page",
  parameters: {
    docs: {
      description: {
        story:
          "`as` n'est pas un réglage cosmétique : il change les repères de " +
          "navigation d'un lecteur d'écran. Une carte qui présente un " +
          "contenu autonome — un avis, un article — sort en `article` ; une " +
          "carte qui regroupe une section nommée sort en `section`, et ne " +
          "devient un repère QUE si elle est nommée.\n\n" +
          "Et pas de `CardTitle` : le niveau de titre dépend du plan de la " +
          "page, pas de la carte. Un `h3` figé casserait la hiérarchie dès " +
          "qu'on réutilise la carte ailleurs.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <Card as="article">Un avis, contenu autonome</Card>
      <Card as="section" aria-label="Derniers avis">Une section nommée</Card>
      <Card>Un simple conteneur</Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("article")).toHaveTextContent("contenu autonome");
    // Une `section` n'est un repère que NOMMÉE — c'est la règle ARIA, et
    // c'est pourquoi le composant ne pose pas `section` par défaut.
    await expect(canvas.getByRole("region", { name: "Derniers avis" })).toBeInTheDocument();
    // La carte nue ne crée aucun repère : elle ne prétend rien.
    await expect(canvas.getByText("Un simple conteneur").tagName).toBe("DIV");
  },
};
