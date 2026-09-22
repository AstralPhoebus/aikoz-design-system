import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — fichier généré par npm run build:tokens
import couleurs from "./build/tailwind-colors.mjs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — fichier généré par npm run build:tokens
import { fontSize, fontWeight } from "./build/tailwind-typo.mjs";

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
      // Les utilitaires `font-sans` / `font-mono` passent par le pont, donc par
      // la couche marque : `font-sans` suit `data-brand`. Sans ça, `font-sans`
      // servait la pile par défaut de Tailwind et court-circuitait les tokens.
      fontFamily: {
        sans: 'var(--font-body)',
        heading: 'var(--font-heading)',
        mono: 'var(--font-mono)',
      },
      // Généré depuis les primitives, comme les couleurs. Sans ce pont,
      // `text-sm` et `font-semibold` valaient les défauts de Tailwind et
      // l'échelle typographique du design system ne gouvernait rien : elle
      // était déclarée, documentée, et sans effet. Mesuré — `semantics.css`
      // émet quarante rôles `--role-typography-*` que zéro composant
      // consomme.
      fontSize,
      fontWeight,
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
  plugins: [
    // ── `tactile:` — le pointeur grossier ────────────────────────────────
    //
    // Mesuré sur le dashboard : le fil d'Ariane offrait des cibles de **20 px
    // de haut**, sous le plancher de 24 px du critère WCAG 2.2 AA 2.5.8 ; la
    // bascule Graphique/Tableau, les puces de marque et le bouton de thème
    // tenaient entre 24 et 32 px. Au doigt, une cible de 32 px se rate.
    //
    // Deux seuils, pas un :
    //
    //  - **24 px partout** — c'est le critère AA, il ne dépend pas du
    //    périphérique. Il est tenu dans le composant, en dur.
    //  - **44 px au doigt** — c'est le confort réel, et le prix (des
    //    contrôles plus hauts) ne se justifie que là où on touche l'écran.
    //
    // D'où cette variante plutôt qu'un agrandissement global : à la souris
    // la densité du tableau de bord est un atout, au doigt elle est un
    // défaut. `@media (pointer: coarse)` sépare les deux cas sans deviner.
    //
    // Élargir la zone en douce — un `::after` invisible plus grand que le
    // bouton — a été écarté : ça rend la cible vraie et l'affordance
    // fausse, on vise ce qu'on voit et on touche autre chose à côté.
    plugin(({ addVariant }) => {
      addVariant("tactile", "@media (pointer: coarse)");
    }),
  ],
};

export default config;
