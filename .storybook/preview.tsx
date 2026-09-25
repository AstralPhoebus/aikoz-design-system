import { useEffect } from "react";
import type { Decorator, Preview } from "@storybook/react-vite";
import { mesurerLeRendu } from "./mesures";
import { definirBaseDesLogos } from "@registry/aikoz/brand-logo/brands";

// Les trois feuilles du design system, dans l'ordre : primitives et rôles,
// puis le pont shadcn, puis Tailwind. Rien n'est redéfini ici — Storybook
// consomme exactement ce que consomme une application.
import "../build/index.css";
import "../bridge/shadcn-bridge.css";
import "../playground/playground.css";
import "./fonts.css";
import "./storybook.css";

// Chemin RELATIF, pas `/brands/`. Servi sous un sous-chemin — ce que fait
// GitHub Pages, qui publie sous `/<dépôt>/` — un chemin absolu part de la
// racine du domaine et les 19 logos sortent en 404. C'est le même piège que
// le `--base` de l'aperçu statique, et il ne se voit pas en local où le
// Storybook est servi à la racine.
definirBaseDesLogos("./brands/");

/**
 * Les deux axes du système sont des réglages GLOBAUX, pas des props de
 * story. Un registre ou un thème passé en argument obligerait à le déclarer
 * sur chaque story, et la moitié l'oublierait. En barre d'outils, ils
 * s'appliquent partout et se basculent devant n'importe quel composant —
 * c'est en basculant sous les yeux d'un composant qu'on voit ce qui bouge.
 */
declare const __THEME_INITIAL__: string;
/** « clair » par défaut ; « sombre » quand `STORYBOOK_THEME=sombre`. */
const THEME_INITIAL =
  typeof __THEME_INITIAL__ === "string" ? __THEME_INITIAL__ : "clair";

const axes: Decorator = (Story, context) => {
  const { theme, registre, marque } = context.globals as {
    theme: string;
    registre: string;
    marque: string;
  };
  useEffect(() => {
    const H = document.documentElement;
    H.classList.toggle("dark", theme === "sombre");
    if (registre === "marketing") H.setAttribute("data-register", "marketing");
    else H.removeAttribute("data-register");
    // La marque se pose ICI, pour TOUTES les histoires.
    //
    // Trois assemblages la posaient eux-mêmes, dans un `useEffect` avec
    // nettoyage. Le nettoyage arrive après le montage de l'histoire suivante :
    // `KpiCard` se rendait donc parfois sous la marque ADP, dont la police
    // n'est pas installée, et le repli n'a pas de jeu tabulaire. Son test
    // d'alignement mesurait 3,53 px d'écart entre « 1111 » et « 8888 » là où
    // il en exige moins de 0,5 — et seulement quand la suite entière
    // tournait, jamais isolé.
    //
    // Un axe posé par chaque histoire est un axe que personne n'oublie de
    // retirer : celle qui suit le repose, forcément.
    if (marque && marque !== "aikoz") H.setAttribute("data-brand", marque);
    else H.removeAttribute("data-brand");
  }, [theme, registre, marque]);
  return <Story />;
};

/**
 * Les trois mesures de rendu, sur CHAQUE histoire.
 *
 * Elles ne tournaient que sur le tableau de bord : 33 composants sur 53.
 * Les histoires existent pour tous, et le lanceur les rend toutes, dans les
 * deux thèmes — c'est le seul endroit qui ne décroche pas.
 */
const mesurer: Preview["afterEach"] = async ({
  canvasElement,
  parameters,
  viewMode,
}) => {
  if (parameters?.mesures === false) return;

  // ── JAMAIS en mode docs ───────────────────────────────────────────────────
  //
  // Une page de documentation n'est pas un écran de produit : elle empile
  // dix histoires, leurs blocs de code et leurs tableaux de props. Le
  // contrôle de débordement y mesurait la page de Storybook, pas la nôtre,
  // et trouvait 143 px — ceux de SON gabarit.
  //
  // Le coût n'était pas théorique. `afterEach` qui lève en mode docs remplace
  // l'histoire par un bloc d'erreur : la documentation PUBLIÉE affichait six
  // encadrés rouges à la place des six exemples, sur cinq pages sur six.
  // C'est exactement ce que Louis et ADP consultent.
  //
  // Le lanceur de tests, lui, rend les histoires en mode `story` : la
  // couverture ne bouge pas d'une ligne.
  if (viewMode === "docs") return;
  const echecs = mesurerLeRendu(canvasElement as HTMLElement);
  if (echecs.length) {
    throw new Error(
      `${echecs.length} défaut(s) de rendu :\n  - ` + echecs.join("\n  - "),
    );
  }
};

const preview: Preview = {
  afterEach: mesurer,
  globalTypes: {
    theme: {
      description: "Thème",
      toolbar: {
        title: "Thème",
        icon: "contrast",
        items: [
          { value: "clair", title: "Clair" },
          { value: "sombre", title: "Sombre" },
        ],
        dynamicTitle: true,
      },
    },
    marque: {
      description: "Marque",
      defaultValue: "aikoz",
      toolbar: {
        title: "Marque",
        icon: "paintbrush",
        items: [
          { value: "aikoz", title: "Aikoz" },
          { value: "adp", title: "ADP" },
          { value: "extime", title: "Extime" },
          { value: "generali", title: "Generali" },
        ],
        dynamicTitle: true,
      },
    },
    registre: {
      description: "Registre",
      toolbar: {
        title: "Registre",
        icon: "component",
        items: [
          { value: "produit", title: "Produit" },
          { value: "marketing", title: "Marketing" },
        ],
        dynamicTitle: true,
      },
    },
  },
  // `__THEME_INITIAL__` est injecté par `viteFinal` depuis `STORYBOOK_THEME`
  // (voir main.ts) : c'est ce qui permet de rejouer toute la suite en sombre.
  initialGlobals: {
    theme: THEME_INITIAL,
    registre: "produit",
    marque: "aikoz",
  },
  decorators: [axes],
  parameters: {
    layout: "centered",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true },
    // `error` et non `todo` : une violation d'accessibilité fait ÉCHOUER le
    // test plutôt que de s'afficher dans un coin. Un avertissement qu'on peut
    // ignorer finit toujours par être ignoré.
    a11y: { test: "error" },
    options: {
      storySort: {
        order: [
          "Design system",
          ["Introduction", "Tokens", "Décisions"],
          "Composants",
          "Graphiques",
          "Archive",
        ],
      },
    },
  },
};

export default preview;
