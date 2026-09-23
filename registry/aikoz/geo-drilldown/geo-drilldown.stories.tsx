import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import { GeoDrilldown, type ZoneGeo } from "./geo-drilldown";

const RESEAU: ZoneGeo[] = [
  {
    id: "idf", label: "Île-de-France", value: 1284,
    children: [
      { id: "75", label: "Paris", value: 612 },
      { id: "92", label: "Hauts-de-Seine", value: 318 },
      { id: "93", label: "Seine-Saint-Denis", value: 201 },
      { id: "94", label: "Val-de-Marne", value: 153 },
    ],
  },
  {
    id: "ara", label: "Auvergne-Rhône-Alpes", value: 866,
    children: [
      { id: "69", label: "Rhône", value: 421 },
      { id: "38", label: "Isère", value: 244 },
      { id: "63", label: "Puy-de-Dôme", value: 201 },
    ],
  },
  {
    id: "paca", label: "Provence-Alpes-Côte d'Azur", value: 604,
    children: [
      { id: "13", label: "Bouches-du-Rhône", value: 388 },
      { id: "06", label: "Alpes-Maritimes", value: 216 },
    ],
  },
  { id: "bre", label: "Bretagne", value: 312 },
];

const meta = {
  title: "Graphiques/GeoDrilldown",
  component: GeoDrilldown,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    rootLabel: "France",
    zones: RESEAU,
    valueLabel: "Avis reçus",
    onNavigate: fn(),
  },
} satisfies Meta<typeof GeoDrilldown>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const PasUneCarte: Story = {
  name: "Ce n'est pas une carte, et c'est délibéré",
  parameters: {
    docs: {
      description: {
        story:
          "Le Figma ne contient **aucun tracé géographique** — seulement des étiquettes " +
          "de région. Une choroplèthe aurait par ailleurs trois défauts ici : elle " +
          "encode la valeur par une teinte sur des surfaces de tailles très inégales " +
          "(la Lozère et le Nord pèsent pareil à l'œil), elle demande un fond de carte " +
          "à tenir à jour, et elle ne se lit pas du tout au lecteur d'écran.\n\n" +
          "Une barre horizontale compare des **longueurs** — ce que l'œil fait le " +
          "mieux — et se double d'un tableau.",
      },
    },
  },
};

export const LeForageVitDansLeTableau: Story = {
  name: "Le forage vit dans le tableau, pas dans le graphique",
  parameters: {
    docs: {
      description: {
        story:
          "Le graphique est `aria-hidden` (cf. `ChartFrame`). Y mettre la seule " +
          "commande de navigation la rendrait **inatteignable au clavier** et " +
          "invisible à un lecteur d'écran. Le bouton « Explorer » vit donc dans le " +
          "tableau, qui est le contenu réel ; le clic sur une barre reste offert en " +
          "plus, comme raccourci à la souris.\n\n" +
          "Chaque bouton porte le nom de sa zone en `sr-only` : sans lui, un lecteur " +
          "d'écran qui liste les commandes entend « Explorer » quatre fois de suite.",
      },
    },
  },
  play: async ({ canvas, args, userEvent: ue }) => {
    const u = ue ?? userEvent;
    const bouton = canvas.getByRole("button", { name: /Explorer Île-de-France/i });
    await u.click(bouton);

    await waitFor(async () => {
      // `rowheader` et non `getByText` : « Paris » apparaît aussi comme
      // étiquette d'axe dans le SVG, la requête serait ambiguë.
      await expect(canvas.getByRole("rowheader", { name: "Paris" })).toBeInTheDocument();
    });
    // Paris n'a pas d'enfants : sa ligne n'offre donc PAS de bouton.
    await expect(canvas.queryByRole("button", { name: /Explorer Paris/i })).not.toBeInTheDocument();
    await expect(args.onNavigate).toHaveBeenCalled();
  },
};

export const LeFilRemonte: Story = {
  name: "Le fil d'Ariane remonte, sans changer d'URL",
  parameters: {
    docs: {
      description: {
        story:
          "Les niveaux parcourus deviennent des `<button>`, pas des liens : on ne " +
          "change pas d'URL, et annoncer un lien qui n'en est pas un tromperait. Le " +
          "niveau courant porte `aria-current=\"page\"` et n'est pas actionnable.",
      },
    },
  },
  play: async ({ canvas, userEvent: ue }) => {
    const u = ue ?? userEvent;
    await u.click(canvas.getByRole("button", { name: /Explorer Auvergne/i }));
    await waitFor(async () => {
      await expect(canvas.getByRole("rowheader", { name: "Rhône" })).toBeInTheDocument();
    });

    // Le fil rend « France » actionnable une fois qu'on a foré.
    const retour = canvas.getByRole("button", { name: "France" });
    await u.click(retour);
    await waitFor(async () => {
      await expect(canvas.getByRole("rowheader", { name: "Bretagne" })).toBeInTheDocument();
    });
  },
};

export const LeChangementDeNiveauSAnnonce: Story = {
  name: "Le changement de niveau s'annonce",
  parameters: {
    docs: {
      description: {
        story:
          "Sans région live, un lecteur d'écran voit le tableau se réécrire sans " +
          "savoir pourquoi. Le focus suit aussi le forage : la commande qu'on vient " +
          "d'actionner disparaît avec l'ancien niveau, et sans reprise il retomberait " +
          "sur `body`.",
      },
    },
  },
  play: async ({ canvas, canvasElement, userEvent: ue }) => {
    const u = ue ?? userEvent;
    await u.click(canvas.getByRole("button", { name: /Explorer Île-de-France/i }));
    // `getAllByRole` et non `getByRole` : le bloc porte DEUX régions live, et
    // c'est correct. Celle-ci dit qu'on a changé de niveau ; celle de
    // `ChartFrame` dit que la donnée n'est pas arrivée. Elles ne parlent
    // jamais en même temps — s'il n'y a pas de donnée, il n'y a pas de niveau
    // à forer — mais une requête qui se croit seule tombe le jour où le
    // composant gagne une seconde région.
    await waitFor(async () => {
      const regions = canvas.getAllByRole("status").map((r) => r.textContent);
      await expect(regions.join(" ")).toMatch(/Île-de-France — 4 zones/);
    });
    // Le focus est posé dans un `requestAnimationFrame` — l'assertion doit
    // l'attendre, sinon elle mesure l'instant d'avant.
    await waitFor(async () => {
      await expect(canvasElement.contains(document.activeElement)).toBe(true);
    });
    await expect(document.activeElement).not.toBe(document.body);
  },
};

export const DernierNiveau: Story = {
  name: "Une zone sans enfant le dit",
  parameters: {
    docs: {
      description: {
        story:
          "« Bretagne » n'a pas de départements dans ce jeu de données : sa ligne " +
          "affiche « Dernier niveau » au lieu d'un bouton mort. Un bouton désactivé " +
          "aurait été pire — il reste dans la liste des commandes sans rien faire.",
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Dernier niveau")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /Explorer Bretagne/i })).not.toBeInTheDocument();
  },
};
