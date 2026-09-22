import type { StorybookConfig } from "@storybook/react-vite";
import remarkGfm from "remark-gfm";
import path from "path";
import { fileURLToPath } from "url";

// `__dirname` n'existe pas : Storybook charge ce fichier comme un module ES.
const ici = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  // Les stories vivent À CÔTÉ du composant qu'elles montrent, pas dans un
  // dossier séparé. Une story éloignée de son composant cesse d'être mise à
  // jour avec lui — c'est la même raison qui fait dériver une liste tenue à
  // la main d'une liste générée.
  stories: [
    // Les pages de doc d'abord : elles ouvrent le catalogue.
    "../docs/storybook/**/*.mdx",
    "../docs/storybook/**/*.stories.@(ts|tsx)",
    "../registry/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    // Contrôle d'accessibilité sur chaque story. Il ne remplace pas
    // `playground/audit.ts` : axe vérifie le balisage, notre audit vérifie
    // le CONTRASTE RENDU dans les quatre combinaisons, ce qu'axe ne fait pas
    // sur des couleurs composées.
    "@storybook/addon-a11y",
    // ── Les tableaux Markdown ────────────────────────────────────────────
    //
    // MDX ne rend PAS les tableaux GitHub sans `remark-gfm`. Sans lui, un
    // tableau reste une soupe de barres verticales dans un paragraphe — et
    // personne ne le voit tant qu'on relit la doc dans l'éditeur.
    //
    // Constaté le 22/09/2026 : huit tableaux illisibles sur la seule page
    // Accessibilité, et autant ailleurs. Ils y étaient depuis le début.
    {
      name: "@storybook/addon-docs",
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: { remarkPlugins: [remarkGfm] },
        },
      },
    },
    "@storybook/addon-mcp",
  ],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(ici, ".."),
      "@registry": path.resolve(ici, "../registry"),
    };
    return config;
  },
};
export default config;
