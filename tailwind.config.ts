import type { Config } from "tailwindcss";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — fichier généré par npm run build:tokens
import couleurs from "./build/tailwind-colors.mjs";

const config: Config = {
  darkMode: "class",
  // `docs` et `.storybook` sont scannés eux aussi. Sans eux, toute classe
  // utilisée UNIQUEMENT dans une histoire de vitrine était silencieusement
  // absente du CSS : `lg:col-span-2` ne faisait rien, et la page sur laquelle
  // on juge le design system ne rendait pas ce qu'elle déclarait. Même angle
  // mort que le `tsconfig` qui n'incluait pas `docs`.
  content: [
    "./registry/**/*.{ts,tsx}",
    "./playground/**/*.{ts,tsx}",
    "./docs/**/*.{ts,tsx,mdx}",
    "./.storybook/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Généré par `npm run build:tokens` depuis le bridge. Ne pas lister
      // les couleurs à la main ici : c'est exactement ce qui avait fait
      // diverger la config du CSS — `card`, `popover`, `input` et `ring`
      // existaient dans le bridge et manquaient ici, donc `bg-card` ne
      // produisait rien sur 52 éléments.
      //
      // Les paires `x` / `x-foreground` sont aussi exposées en objet
      // imbriqué, pour que `bg-primary text-primary-foreground` fonctionne
      // comme chez shadcn.
      colors: {
        ...couleurs,
        ...Object.fromEntries(
          Object.keys(couleurs)
            .filter((n) => !n.endsWith("-foreground"))
            .filter((n) => `${n}-foreground` in couleurs)
            .map((n) => [
              n,
              { DEFAULT: couleurs[n], foreground: couleurs[`${n}-foreground`] },
            ]),
        ),
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
