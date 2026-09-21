import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { FranceMap } from "./france-map";
import { REGIONS, DEPARTEMENTS, BOITE } from "./geometrie";

// Des valeurs plausibles pour les treize régions de métropole, volontairement
// très asymétriques : c'est le cas réel, et c'est ce qui met l'échelle à
// l'épreuve.
const PAR_REGION: Record<string, number> = {
  "11": 1284, // Île-de-France
  "84": 866,  // Auvergne-Rhône-Alpes
  "93": 604,  // Provence-Alpes-Côte d'Azur
  "76": 447,  // Occitanie
  "75": 392,  // Nouvelle-Aquitaine
  "32": 288,  // Hauts-de-France
  "53": 175,  // Bretagne
  "44": 168,  // Grand Est
  "52": 141,  // Pays de la Loire
  "28": 96,   // Normandie
  "24": 88,   // Centre-Val de Loire
  "27": 71,   // Bourgogne-Franche-Comté
  // La Corse n'a volontairement PAS de valeur : il faut voir ce que fait
  // l'absence de donnée.
};

const meta = {
  title: "Graphiques/FranceMap",
  component: FranceMap,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    valueLabel: "Avis reçus",
    values: PAR_REGION,
    level: "region",
  },
} satisfies Meta<typeof FranceMap>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const LaSurfaceMent: Story = {
  name: "La surface ment, et c'est pour ça qu'elle n'est jamais seule",
  parameters: {
    docs: {
      description: {
        story:
          "Une choroplèthe encode la valeur par une teinte sur des surfaces " +
          "de tailles très inégales. L'Île-de-France porte la plus forte " +
          "valeur du jeu — 1 284 — et occupe une des plus petites surfaces ; " +
          "la Nouvelle-Aquitaine en porte trois fois moins sur cinq fois plus " +
          "de terrain. L'œil lit d'abord l'aire.\n\n" +
          "La carte répond donc à **où**, jamais à **combien**. Pour le " +
          "combien, `GeoDrilldown` compare des longueurs de barres et donne le " +
          "tableau. Les deux vivent dans le même bloc, et c'est la raison " +
          "d'être de la vue « Carte ».\n\n" +
          "Les classes sont des **quantiles**, pas des intervalles égaux : " +
          "à intervalles égaux, l'Île-de-France occuperait seule la dernière " +
          "classe et les douze autres régions se tasseraient dans la première.",
      },
    },
  },
};

export const SansDonnee: Story = {
  name: "Pas de donnée n'est pas une valeur basse",
  parameters: {
    docs: {
      description: {
        story:
          "La Corse n'a pas de valeur dans ce jeu. Elle est hachurée, pas " +
          "teintée de la classe la plus basse : sans ça, « on ne sait pas » " +
          "et « presque rien » se ressembleraient, et on lirait une donnée " +
          "qui n'existe pas.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg")!;
    const corse = [...svg.querySelectorAll("path")].filter((p) =>
      (p.getAttribute("fill") ?? "").includes("url(#")
    );
    // Une seule zone sans donnée dans ce jeu, et elle est hachurée.
    await expect(corse).toHaveLength(1);
  },
};

export const LeDessinEstMasque: Story = {
  name: "Le dessin est masqué, le résumé porte le sens",
  parameters: {
    docs: {
      description: {
        story:
          "Le SVG est `aria-hidden`. Une carte, c'est cent formes sans nom " +
          "accessible : laissées à l'arbre d'accessibilité, elles deviennent " +
          "cent images sans alternative. Le parent porte un `role=\"img\"` " +
          "nommé, qui énonce ce que la carte montre, combien de zones sont " +
          "renseignées, et renvoie au tableau pour les valeurs.\n\n" +
          "C'est exactement la règle de `ChartFrame`, appliquée à un autre " +
          "dessin.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const resume = canvas.getByRole("img");
    await expect(resume).toHaveAccessibleName(/12 zones renseignées sur 13/);
    // \s et non une espace : `toLocaleString("fr-FR")` sépare les milliers
    // par une espace fine insécable (U+202F), pas par une espace ordinaire.
    await expect(resume).toHaveAccessibleName(/total 4\s620/);
    await expect(resume).toHaveAccessibleName(/tableau/);
    // Et le dessin, lui, est hors de l'arbre.
    const svg = canvasElement.querySelector("svg")!;
    await expect(svg.getAttribute("aria-hidden")).toBe("true");
  },
};

export const LaLegendePorteLesBornes: Story = {
  name: "La légende porte les bornes, pas seulement les teintes",
  parameters: {
    docs: {
      description: {
        story:
          "Une échelle de teintes sans chiffres ne se lit pas, elle se " +
          "devine. Chaque classe affiche sa borne, en chiffres tabulaires " +
          "pour qu'elles s'alignent.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Cinq classes par défaut, donc cinq bornes affichées.
    const pastilles = canvasElement.querySelectorAll("[aria-hidden='true'].size-3");
    await expect(pastilles).toHaveLength(5);
  },
};

export const LeClicRemonteLaZone: Story = {
  name: "Le clic remonte la zone — un raccourci, pas la commande",
  args: { onSelect: fn(), selected: "84" },
  parameters: {
    docs: {
      description: {
        story:
          "Le clic sur une zone est offert à la souris, et c'est tout ce " +
          "qu'il est. Le dessin étant `aria-hidden`, y placer la seule " +
          "commande de navigation la rendrait inatteignable au clavier — " +
          "c'est la faute que `GeoDrilldown` évite déjà en mettant " +
          "« Explorer » dans le tableau.\n\n" +
          "La zone sélectionnée est cerclée en `--foreground` : un trait plus " +
          "épais et plus contrasté, pas un changement de teinte, qui se " +
          "confondrait avec une classe.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const svg = canvasElement.querySelector("svg")!;
    const chemins = [...svg.querySelectorAll("path")];
    // La zone sélectionnée porte le trait épais, et elle est la seule.
    const epais = chemins.filter((p) => p.getAttribute("stroke-width") === "3");
    await expect(epais).toHaveLength(1);
    await userEvent.click(chemins[0]);
    await expect(args.onSelect).toHaveBeenCalled();
  },
};

export const UneRegionEtSesDepartements: Story = {
  name: "Une région et ses départements, à la même échelle",
  args: {
    region: "84",
    valueLabel: "Avis reçus",
    values: { "69": 421, "38": 244, "74": 201, "73": 118, "63": 97, "42": 88, "01": 76, "26": 61, "07": 44, "03": 38, "15": 21, "43": 19 },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Les deux niveaux partagent **une seule boîte englobante**, " +
          "calculée sur la France entière. Passer des régions à une région " +
          "ne change donc pas d'échelle : la zone reste à sa place et à sa " +
          "taille, au lieu de sauter au centre de l'écran. C'est ce qui rend " +
          "le forage lisible.\n\n" +
          "En contrepartie, une région n'occupe qu'un dixième du cadre. Le " +
          "reste du pays est donc dessiné derrière, en contour inerte — ni " +
          "survol, ni clic, ni donnée : il ne dit pas une valeur, il dit " +
          "**où l'on est**.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg")!;
    // Douze départements en Auvergne-Rhône-Alpes, plus les douze AUTRES
    // régions posées derrière en contour inerte.
    const fond = svg.querySelectorAll('path[fill="var(--muted)"]');
    await expect(fond).toHaveLength(12);
    await expect(svg.querySelectorAll("path")).toHaveLength(24);
    // Et la boîte n'a pas bougé : c'est ce qui fait que la région reste à sa
    // place au lieu de sauter au centre.
    await expect(svg.getAttribute("viewBox")).toBe(`0 0 ${BOITE.largeur} ${BOITE.hauteur}`);
  },
};

export const LaGeometrieEstComplete: Story = {
  name: "Treize régions, quatre-vingt-seize départements",
  parameters: {
    docs: {
      description: {
        story:
          "La géométrie est un fichier **généré** par `scripts/carte-france.py`, " +
          "qui projette les contours une fois pour toutes en Lambert-93 " +
          "(EPSG:2154), la projection officielle française.\n\n" +
          "Le composant n'embarque donc **aucune bibliothèque géographique** " +
          "et ne calcule rien à l'affichage. Les GeoJSON source pèsent 776 Ko ; " +
          "le fichier généré en fait 53, simplification de Douglas-Peucker " +
          "comprise — à 600 px de large, un point tous les deux kilomètres " +
          "n'est pas distinguable.\n\n" +
          "Source : *france-geojson* (Grégoire David), dérivé d'ADMIN EXPRESS " +
          "de l'IGN, Licence Ouverte / Etalab. Les GeoJSON bruts ne sont pas " +
          "versionnés ; seul le dérivé l'est, avec sa mention de source.",
      },
    },
  },
  play: async () => {
    await expect(REGIONS).toHaveLength(13);
    await expect(DEPARTEMENTS).toHaveLength(96);
    // Chaque zone a un chemin non vide et un code INSEE.
    for (const z of [...REGIONS, ...DEPARTEMENTS]) {
      await expect(z.d.length).toBeGreaterThan(20);
      await expect(z.code).toMatch(/^[0-9][0-9AB]$/);
    }
  },
};
