import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { BrandGlow } from "./brand-glow";
import { Card } from "@registry/aikoz/card/card";
import { KpiCard } from "@registry/aikoz/kpi-card/kpi-card";

const meta = {
  title: "Composants/BrandGlow",
  component: BrandGlow,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  // `children` est requis par le composant : le donner ici évite de le répéter
  // dans chaque histoire, qui le remplace de toute façon par son `render`.
  args: { children: null },
} satisfies Meta<typeof BrandGlow>;
export default meta;
type Story = StoryObj<typeof meta>;

const Bloc = () => (
  <div className="grid gap-4 p-8 sm:grid-cols-3">
    <Card surface="heros" density="large" className="sm:col-span-2">
      <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
        Satisfaction globale
      </span>
      <span className="text-5xl font-bold leading-none tracking-tight">4,2 /5</span>
    </Card>
    <KpiCard label="Taux de réponse" value={87} unit="%" variant="target" target={90} />
  </div>
);

export const Defaut: Story = {
  name: "La lueur, en thème sombre seulement",
  parameters: {
    docs: {
      description: {
        story:
          "Le dégradé radial des post-link Aikoz, porté par la marque : ses deux " +
          "couleurs viennent de `--color-brand-glow-from` et `-to`, donc la lueur " +
          "suit `data-brand` sans que l'appelant s'en occupe.\n\n" +
          "**En thème clair, elle ne rend rien** — et c'est mesuré, pas un goût. " +
          "Une lueur ajoute de la lumière ; sur un fond clair elle n'a plus rien à " +
          "éclairer, elle sature. Bascule le thème pour la voir apparaître.\n\n" +
          "L'intensité est un nombre borné à 0,7, pas une classe libre : au-delà, " +
          "le fond s'éclaircit assez pour faire chuter le rapport du texte qui " +
          "passe dessus. Une valeur bornée s'audite, une classe libre non.",
      },
    },
  },
  render: () => (
    <BrandGlow>
      <Bloc />
    </BrandGlow>
  ),
};

export const LesTroisOrigines: Story = {
  name: "Trois origines, un seul coin au repos",
  parameters: {
    docs: {
      description: {
        story:
          "`top-right` par défaut : c'est celui des post-link, et il laisse le coin " +
          "de lecture — en haut à gauche — au repos. Une lueur qui part de là " +
          "éclaire précisément ce que l'œil aborde en premier.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col">
      {(["top-right", "top-left", "top-center"] as const).map((o) => (
        <BrandGlow key={o} origin={o}>
          <div className="p-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              origin = {o}
            </span>
            <p className="m-0 mt-2 text-2xl font-bold">Une lueur qui part d'ici</p>
          </div>
        </BrandGlow>
      ))}
    </div>
  ),
};

export const LeVoileNeTouchePasLeTexte: Story = {
  name: "Le voile est derrière, jamais devant",
  parameters: {
    docs: {
      description: {
        story:
          "Le voile est posé en `absolute`, `aria-hidden`, sur un `z-index` " +
          "inférieur au contenu. Il ne s'interpose donc jamais entre l'œil et le " +
          "texte, et un lecteur d'écran ne le rencontre pas.",
      },
    },
  },
  render: () => (
    <BrandGlow>
      <Bloc />
    </BrandGlow>
  ),
  play: async ({ canvasElement }) => {
    const voile = canvasElement.querySelector('[aria-hidden="true"].pointer-events-none');
    await expect(voile).not.toBeNull();
    // Derrière le contenu, et sans capture du pointeur : deux conditions pour
    // qu'une décoration reste une décoration.
    const style = getComputedStyle(voile as Element);
    await expect(style.pointerEvents).toBe("none");
    await expect(Number(style.zIndex)).toBeLessThan(0);
  },
};
