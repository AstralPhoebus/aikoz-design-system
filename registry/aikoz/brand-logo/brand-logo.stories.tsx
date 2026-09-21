import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { BrandLogo } from "./brand-logo";
import { BRANDS } from "./brands";

const meta = {
  title: "Marques/BrandLogo",
  component: BrandLogo,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { brand: "generali" },
} satisfies Meta<typeof BrandLogo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const LesDixNeufMarques: Story = {
  name: "Les 19 assureurs",
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        {BRANDS.map((b) => <BrandLogo key={b.id} brand={b.id} size="lg" />)}
      </div>
      <div className="flex flex-wrap gap-3">
        {BRANDS.map((b) => <BrandLogo key={b.id} brand={b.id} shape="plate" size="lg" />)}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Le rond porte les INITIALES, la plaque porte le logo. Un logo masqué dans un " +
          "rond de 40 px devient une tache : les logotypes horizontaux s'y réduisent à " +
          "rien. Les deux formes sont donc deux contenus, pas deux tailles.",
      },
    },
  },
};

export const LesMasquesSontFabriques: Story = {
  name: "Sept masques sont fabriqués",
  render: () => (
    <div className="flex flex-wrap gap-3">
      {["axa", "maif", "gmf", "mma", "groupama", "macif", "maaf"].map((b) => (
        <BrandLogo key={b} brand={b} shape="plate" size="lg" />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Sept logos sont des aplats pleins dont un masque n'aurait gardé qu'une " +
          "silhouette muette. Leur masque est FABRIQUÉ par `scripts/masques-marques.py` : " +
          "est opaque ce qui n'est ni le fond extérieur, ni le blanc. Le blanc compte " +
          "comme un trou parce que dans ces logos il EST le dessin — les lettres d'AXA, " +
          "celles de MAIF sont des réserves creusées dans un aplat.",
      },
    },
  },
};

export const LEncreEstMesuree: Story = {
  name: "L'encre est mesurée, jamais choisie",
  args: { brand: "abeille", size: "xl" },
  parameters: {
    docs: {
      description: {
        story:
          "`surTeinte()` calcule le contraste de la teinte de marque contre les deux " +
          "encres réellement utilisées et retient la meilleure. C'est ce qui rend le " +
          "jaune d'Abeille et le marine de Matmut également lisibles sans arbitrage " +
          "marque par marque — et ce qui empêche une teinte ajoutée demain d'arriver " +
          "illisible.",
      },
    },
  },
};

export const LaFormeDecideDeCeQuiEstAffiche: Story = {
  name: "La forme décide de ce qui est affiché",
  parameters: {
    docs: {
      description: {
        story:
          "Ce n'est pas un réglage esthétique, c'est le constat d'un essai " +
          "raté : masquer un logotype horizontal dans un rond de 40 px le " +
          "réduit à une tache. La forme ronde affiche donc autre chose que " +
          "la forme large.\n\n" +
          "Dans les deux cas, la marque reste NOMMÉE — une pastille sans nom " +
          "n'est qu'un carré coloré.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const nommes = canvasElement.querySelectorAll("[aria-label], img[alt]:not([alt=''])");
    await expect(nommes.length).toBeGreaterThan(0);
  },
};
