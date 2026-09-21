import { useEffect } from "react";
import type { Decorator, Preview } from "@storybook/react-vite";
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
const axes: Decorator = (Story, context) => {
  const { theme, registre } = context.globals as {
    theme: string;
    registre: string;
  };
  useEffect(() => {
    const H = document.documentElement;
    H.classList.toggle("dark", theme === "sombre");
    if (registre === "marketing") H.setAttribute("data-register", "marketing");
    else H.removeAttribute("data-register");
  }, [theme, registre]);
  return <Story />;
};

const preview: Preview = {
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
  initialGlobals: { theme: "clair", registre: "produit" },
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
