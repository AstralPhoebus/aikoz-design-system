import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import { RankingBars, type RankingBarItem } from "./ranking-bars";

const THEMATIQUES: RankingBarItem[] = [
  {
    id: "personnel",
    label: "Personnel & accueil",
    meta: "6 843 avis",
    value: 5,
    children: [
      { id: "personnel-amabilite", label: "Amabilité", meta: "4 102 avis", value: 4.9 },
      { id: "personnel-reactivite", label: "Réactivité", meta: "2 741 avis", value: 4.8 },
    ],
  },
  { id: "satisfaction", label: "Satisfaction générique", meta: "3 982 avis", value: 5 },
  { id: "boutiques", label: "Boutiques & restauration", meta: "10 802 avis", value: 4.9 },
  { id: "clientele", label: "Clientèle internationale", meta: "7 899 avis", value: 4.9 },
  { id: "autres", label: "Autres thématiques", meta: "382 avis", value: 4.5 },
];

const meta = {
  title: "Graphiques/RankingBars",
  component: RankingBars,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    rootLabel: "Thématiques",
    items: THEMATIQUES,
    valueLabel: "Note moyenne",
    onNavigate: fn(),
  },
  decorators: [(S) => <div className="w-[36rem]"><S /></div>],
} satisfies Meta<typeof RankingBars>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Classement par thématique, meilleure note en premier",
};

export const ChaqueLigneEstLeBouton: Story = {
  name: "Chaque ligne est le bouton — pas de tableau caché à côté",
  parameters: {
    docs: {
      description: {
        story:
          "Contrairement à `GeoDrilldown`, rien n'est dessiné en SVG ici : les lignes " +
          "sont du HTML natif, donc directement focalisables et activables. Pas besoin " +
          "d'un bouton « Explorer » séparé dans un tableau à côté.",
      },
    },
  },
  play: async ({ canvas, args, userEvent: ue }) => {
    const u = ue ?? userEvent;
    const ligne = canvas.getByRole("button", { name: /Personnel & accueil/i });
    await u.click(ligne);

    await waitFor(async () => {
      await expect(canvas.getByRole("button", { name: /Amabilité/i })).toBeInTheDocument();
    });
    await expect(args.onNavigate).toHaveBeenCalled();
  },
};

export const UneLigneSansEnfantNEstPasUnBouton: Story = {
  name: "Une ligne sans enfant n'est pas un bouton",
  parameters: {
    docs: {
      description: {
        story:
          "La rendre cliquable sans action promettrait un détail qui n'existe pas — " +
          "même raisonnement que le fil d'Ariane, qui ne lie jamais la page courante. " +
          "« Satisfaction générique » n'a pas de sous-thématiques : sa ligne est un " +
          "`<div role=\"group\">`, pas un `<button>`.",
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole("button", { name: /Satisfaction générique/i })
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole("group", { name: /Satisfaction générique/i })).toBeInTheDocument();
  },
};

export const LeFilRemonte: Story = {
  name: "Le fil d'Ariane remonte, sans changer d'URL",
  play: async ({ canvas, userEvent: ue }) => {
    const u = ue ?? userEvent;
    await u.click(canvas.getByRole("button", { name: /Personnel & accueil/i }));
    await waitFor(async () => {
      await expect(canvas.getByRole("button", { name: /Amabilité/i })).toBeInTheDocument();
    });

    const retour = canvas.getByRole("button", { name: "Thématiques" });
    await u.click(retour);
    await waitFor(async () => {
      await expect(canvas.getByRole("button", { name: /Boutiques & restauration/i })).toBeInTheDocument();
    });
  },
};

export const LeChangementDeNiveauSAnnonce: Story = {
  name: "Le changement de niveau s'annonce",
  play: async ({ canvas, canvasElement, userEvent: ue }) => {
    const u = ue ?? userEvent;
    await u.click(canvas.getByRole("button", { name: /Personnel & accueil/i }));
    await waitFor(async () => {
      await expect(canvas.getByRole("status")).toHaveTextContent(/Personnel & accueil — 2 éléments/);
    });
    await waitFor(async () => {
      await expect(canvasElement.contains(document.activeElement)).toBe(true);
    });
    await expect(document.activeElement).not.toBe(document.body);
  },
};

export const NiveauBasEnCritical: Story = {
  name: "Une note basse redescend le niveau de couleur",
  args: {
    items: [
      { id: "a", label: "Propreté", meta: "412 avis", value: 4.8 },
      { id: "b", label: "Attente en caisse", meta: "203 avis", value: 2.6 },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Le niveau reste déduit des seuils par défaut de `ProgressBar` (90 % / 60 % " +
          "de `max`), pas forcé au vert : une thématique à 2,6/5 doit pouvoir remonter " +
          "en `critical`, exactement comme partout ailleurs dans le système.",
      },
    },
  },
};
