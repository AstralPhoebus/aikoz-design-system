import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { BrandMark, LOGOS, nomDeMarque } from "./brand-mark";

const meta = {
  title: "Marque/BrandMark",
  component: BrandMark,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof BrandMark>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Par défaut — la marque du document",
  parameters: {
    docs: {
      description: {
        story:
          "Sans prop, il affiche la marque que porte `data-brand` sur la " +
          "racine, et **il la suit** via un observateur d'attribut. Le passer " +
          "en prop à chaque appelant reviendrait à réimplémenter la marque " +
          "blanche dans chaque page, et un oubli ne se verrait nulle part.",
      },
    },
  },
};

export const LesQuatreMarques: Story = {
  name: "Les quatre marques, cadrées par la même boîte",
  parameters: {
    docs: {
      description: {
        story:
          "Un logo s'inscrit dans une BOÎTE, il n'est pas calé sur sa seule " +
          "hauteur. Les rapports largeur/hauteur vont de 2,9 à 7,3 selon la " +
          "marque : à hauteur égale, le plus large écrase les autres et les " +
          "compacts paraissent minuscules.\n\n" +
          "`object-contain` garantit qu'aucun n'est déformé — toutes les " +
          "chartes l'interdisent.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-6">
      {Object.keys(LOGOS).map((b) => (
        <div key={b} className="flex items-center gap-4">
          <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {b}
          </span>
          <BrandMark brand={b} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Toutes les marques rendent à la MÊME hauteur : c'est la règle de
    // cadrage, et c'est elle qu'on vérifie, pas une largeur particulière.
    const visibles = [...canvasElement.querySelectorAll("img")].filter(
      (i) => i.offsetParent !== null
    );
    await expect(visibles.length).toBe(Object.keys(LOGOS).length);
    await waitFor(async () => {
      for (const i of visibles) await expect(i.naturalWidth).toBeGreaterThan(0);
    });
    const hauteurs = visibles.map((i) => Math.round(i.getBoundingClientRect().height));
    await expect(Math.max(...hauteurs) - Math.min(...hauteurs)).toBeLessThanOrEqual(1);
  },
};

export const UneMarqueSansLogoEcritSonNom: Story = {
  name: "Une marque sans fichier écrit son nom",
  args: { brand: "une-marque-inconnue" },
  parameters: {
    docs: {
      description: {
        story:
          "Une marque sans logo doit être visible COMME TELLE. Un espace " +
          "vide passerait inaperçu jusqu'à la démonstration client ; un nom " +
          "écrit se remarque, donc se réclame.\n\n" +
          "La même règle vaut pour une marque qui n'a pas de version sombre " +
          "de son logo : le thème sombre écrit alors son nom plutôt que de " +
          "réutiliser le fichier clair, qui deviendrait une tache illisible.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector("img")).toBeNull();
    await expect(canvas.getByText("Une-marque-inconnue")).toBeInTheDocument();
    // `nomDeMarque` sert les `aria-label` des liens qui entourent le logo :
    // il doit répondre pour une marque inconnue comme pour les autres.
    await expect(nomDeMarque("une-marque-inconnue")).toBe("Une-marque-inconnue");
    await expect(nomDeMarque("adp")).toBe("Groupe ADP");
  },
};

export const LeLogoEstDecoratif: Story = {
  name: "Le logo est décoratif, c'est le lien qui le nomme",
  parameters: {
    docs: {
      description: {
        story:
          "Le `alt` est vide, délibérément : c'est le lien qui entoure ce " +
          "composant qui porte le nom accessible. Sans ça, un lecteur " +
          "d'écran annoncerait la marque deux fois — « Aikoz, lien Aikoz ».",
      },
    },
  },
  render: () => (
    <a href="#accueil" aria-label={`${nomDeMarque("aikoz")} — accueil`} className="inline-flex">
      <BrandMark brand="aikoz" />
    </a>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lien = canvas.getByRole("link", { name: "Aikoz — accueil" });
    // Une seule source de nom : le lien. Les images n'en portent aucun.
    for (const img of lien.querySelectorAll("img")) {
      await expect(img).toHaveAttribute("alt", "");
    }
  },
};
