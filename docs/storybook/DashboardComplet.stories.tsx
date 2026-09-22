import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToastProvider } from "@registry/aikoz/toast/toast";
import { TooltipProvider } from "@registry/aikoz/tooltip/tooltip";
import { DashboardComplet } from "./dashboard-complet";

// ─── Histoire ────────────────────────────────────────────────────────────────

const meta = {
  title: "Design system/Dashboard complet",
  parameters: {
    layout: "fullscreen",
    // La page occupe l'écran : la contrainte de largeur des autres histoires
    // n'a pas de sens ici, on juge justement l'occupation de l'espace.
    docs: { story: { inline: false, height: "900px" } },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const ApercuGeneral: Story = {
  name: "Aperçu général — toutes marques, clair et sombre",
  parameters: {
    docs: {
      description: {
        story:
          "L'application entière, en cinq vues : **Synthèse** (indicateurs et " +
          "graphiques), **Avis** (tableau triable et file de réponse), " +
          "**Territoires** (forage France → région → département), " +
          "**Alertes** et **Réglages**. C'est le seul endroit où l'on voit si le " +
          "design system tient à l'échelle d'une application — les composants " +
          "isolés ne disent rien de la densité, de l'alignement des colonnes ni " +
          "de la cohabitation des surfaces.\n\n" +
          "Le panneau latéral et les onglets pilotent le même état : deux chemins " +
          "vers une vue, jamais deux positions contradictoires.\n\n" +
          "Les bascules en haut à droite changent **la marque** (`data-brand`) et " +
          "**le thème** (`.dark`) sur la racine, exactement comme le ferait une " +
          "application consommant le registre. Sous ADP et Extime, le chrome, les " +
          "séries de graphiques et la lueur de la carte héroïne suivent ; les " +
          "couleurs de données — positif, négatif, neutre — ne suivent pas, et " +
          "c'est voulu : une hausse doit se lire pareil d'une marque à l'autre.",
      },
    },
  },
  render: () => (
    <ToastProvider>
      <TooltipProvider>
        <DashboardComplet />
      </TooltipProvider>
    </ToastProvider>
  ),
};
