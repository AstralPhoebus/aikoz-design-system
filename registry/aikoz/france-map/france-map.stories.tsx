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
  // Les cinq territoires d'outre-mer, au niveau RÉGION (codes 01 à 06).
  "01": 61, "02": 54, "03": 33, "04": 88, "06": 19,
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
    const svg = canvasElement.querySelector('[data-carte="metropole"]')!;
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
    // Treize régions de métropole plus cinq cartouches d'outre-mer ; seule la
    // Corse n'a pas de valeur.
    await expect(resume).toHaveAccessibleName(/17 zones renseignées sur 18/);
    // \s et non une espace : `toLocaleString("fr-FR")` sépare les milliers
    // par une espace fine insécable (U+202F), pas par une espace ordinaire.
    await expect(resume).toHaveAccessibleName(/total 4\s875/);
    await expect(resume).toHaveAccessibleName(/tableau/);
    // Et le dessin, lui, est hors de l'arbre.
    const svg = canvasElement.querySelector('[data-carte="metropole"]')!;
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
    const svg = canvasElement.querySelector('[data-carte="metropole"]')!;
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
    const svg = canvasElement.querySelector('[data-carte="metropole"]')!;
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

export const OutreMerEnCartouches: Story = {
  name: "L'outre-mer en cartouches, à sa propre échelle",
  parameters: {
    docs: {
      description: {
        story:
          "Cinq territoires, cinq cartouches. Ce n'est pas un raccourci : à " +
          "leur vraie position et à la vraie échelle, ils seraient cinq " +
          "points invisibles répartis sur huit mille kilomètres. C'est la " +
          "convention des cartes françaises.\n\n" +
          "Chacun est projeté **localement** — équirectangulaire corrigée de " +
          "la latitude. Lambert-93 n'est valable que pour la métropole ; " +
          "appliquée à La Réunion elle renvoie des coordonnées absurdes.\n\n" +
          "Ils ne sont pas non plus à la même échelle **entre eux** : la " +
          "Guyane fait quinze fois la Martinique, et une échelle commune " +
          "réduirait Mayotte à deux pixels. La rangée le dit en toutes " +
          "lettres — une carte qui triche sur l'échelle sans le dire est une " +
          "carte qui ment.\n\n" +
          "Ils comptent dans les **quantiles** : les exclure du calcul les " +
          "tasserait tous dans la classe la plus basse, ce qui se lirait " +
          "comme « rien outre-mer ». Et ils disparaissent dès qu'on descend " +
          "dans une région de métropole, où ils n'ont rien à faire.\n\n" +
          "La géométrie n'est stockée **qu'une fois** : la Guadeloupe région " +
          "et la Guadeloupe département ont le même contour, seul le code " +
          "INSEE change. L'émettre deux fois doublait douze kilo-octets pour " +
          "rien.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const cartouches = canvasElement.querySelectorAll('[data-carte="outre-mer"]');
    await expect(cartouches).toHaveLength(5);
    // Chacun a SA boîte : deux cartouches qui partagent un viewBox seraient
    // à la même échelle, ce qu'on vient justement d'exclure.
    const boites = new Set([...cartouches].map((c) => c.getAttribute("viewBox")));
    await expect(boites.size).toBe(5);
    // Et l'échelle est annoncée, pas sous-entendue.
    await expect(canvasElement.textContent).toContain("Cartouches à leur propre échelle");
  },
};

export const PasDOutreMerDansUneRegion: Story = {
  name: "Descendu dans une région, les cartouches disparaissent",
  args: {
    region: "84",
    values: { "69": 421, "38": 244, "74": 201, "73": 118, "63": 97, "42": 88 },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-carte="outre-mer"]')).toHaveLength(0);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Les cartouches répondent à « et l'outre-mer ? » au niveau " +
          "national. Descendu dans Auvergne-Rhône-Alpes, la question ne se " +
          "pose plus : les garder ferait cinq vignettes sans rapport avec ce " +
          "qu'on regarde.",
      },
    },
  },
};

export const LEchelleTientDansLesDeuxThemes: Story = {
  name: "L'échelle se lit dans les deux thèmes, sur les quatre marques",
  parameters: {
    docs: {
      description: {
        story:
          "Une échelle séquentielle bâtie sur `color-mix` ne se comporte pas " +
          "pareil selon le fond. En clair, elle part du blanc et a toute " +
          "l'amplitude ; en sombre, elle part d'une carte à 0,223 de clarté, " +
          "et si le haut de l'échelle est un aplat de milieu de rampe, les " +
          "cinq classes se touchent.\n\n" +
          "C'est arrivé : mesurées sur le rendu, deux classes voisines " +
          "n'étaient séparées que de **ΔE 0,054** chez Aikoz en sombre, contre " +
          "0,18 en clair. Le haut de l'échelle est donc `--primary-edge`, le " +
          "palier clair de la rampe — celui qui sert déjà de liseré au bouton " +
          "primaire. Aucune couleur nouvelle, et l'amplitude revient.\n\n" +
          "Cette histoire mesure les pastilles **telles qu'elles sont " +
          "rendues**, dans les huit combinaisons. Un `color-mix` ne se calcule " +
          "pas sur les tokens : il faut le lire sur le document.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const cv = document.createElement("canvas").getContext("2d")!;
    const px = (couleur: string): [number, number, number] => {
      cv.fillStyle = "#000000";
      cv.fillRect(0, 0, 1, 1);
      cv.fillStyle = couleur;
      cv.fillRect(0, 0, 1, 1);
      const d = cv.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const oklab = (rgb: [number, number, number]) => {
      const [r, g, b] = rgb.map((v) => lin(v / 255));
      const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
      const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
      const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      return [
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
      ];
    };
    const dE = (a: [number, number, number], b: [number, number, number]) => {
      const [x, y] = [oklab(a), oklab(b)];
      return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
    };

    // Deux aplats se confondent sous ΔE 0,05. On garde de la marge : une
    // carte se regarde en petit, et les zones ne sont pas côte à côte.
    const SEUIL_VOISINES = 0.09;
    // La classe la plus basse doit rester visible sur la carte, sinon une
    // zone renseignée se lit comme une zone vide.
    const SEUIL_FOND = 0.05;

    const H = document.documentElement;
    const echecs: string[] = [];
    for (const sombre of [false, true]) {
      H.classList.toggle("dark", sombre);
      for (const marque of [null, "adp", "extime", "generali"]) {
        if (marque) H.setAttribute("data-brand", marque);
        else H.removeAttribute("data-brand");
        await new Promise((r) => setTimeout(r, 60));
        const pastilles = [...canvasElement.querySelectorAll(".size-3")].map((e) =>
          px(getComputedStyle(e).backgroundColor)
        );
        const carte = px(getComputedStyle(H).getPropertyValue("--card").trim());
        const ou = `${marque ?? "aikoz"}/${sombre ? "sombre" : "clair"}`;
        const fond = dE(pastilles[0], carte);
        if (fond < SEUIL_FOND) {
          echecs.push(`${ou} — la classe la plus basse se confond avec la carte : ΔE ${fond.toFixed(3)}`);
        }
        for (let i = 1; i < pastilles.length; i++) {
          const d = dE(pastilles[i], pastilles[i - 1]);
          if (d < SEUIL_VOISINES) {
            echecs.push(`${ou} — classes ${i} et ${i + 1} : ΔE ${d.toFixed(3)} pour un seuil de ${SEUIL_VOISINES}`);
          }
        }
      }
    }
    H.classList.remove("dark");
    H.removeAttribute("data-brand");
    await expect(echecs).toEqual([]);
  },
};
