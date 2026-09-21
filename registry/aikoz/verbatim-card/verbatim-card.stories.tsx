import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { VerbatimCard } from "./verbatim-card";

const meta = {
  title: "Données/VerbatimCard",
  component: VerbatimCard,
  tags: ["autodocs"],
  args: {
    text: "Accueil impeccable, on m'a rappelée dans l'heure alors que je n'attendais pas de retour avant plusieurs jours.",
    rating: 5,
    status: "replied",
    source: "Google",
    author: "Lyon Part-Dieu",
    date: "12 mars 2026",
  },
  decorators: [(S) => <div className="w-96"><S /></div>],
} satisfies Meta<typeof VerbatimCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const LEtatEstCeluiDeLaReponse: Story = {
  name: "L'état est celui de la RÉPONSE, pas du sentiment",
  args: { status: "unanswered", rating: 2 },
  parameters: {
    docs: {
      description: {
        story:
          "Les deux ont été confondus au cadrage. `status` décrit l'action de l'agence — " +
          "répondu ou non — pas la tonalité du client. Le sentiment, quand il arrivera, " +
          "sera un `Badge` de plus : il n'appelle pas de composant dédié.",
      },
    },
  },
};

export const Tronquee: Story = {
  name: "Troncature en CSS, texte entier dans le DOM",
  args: { lines: 2, tags: ["Réactivité", "Expertise"] },
  parameters: {
    docs: {
      description: {
        story:
          "La coupe est faite en CSS : le texte complet reste lisible par un lecteur " +
          "d'écran et par la recherche du navigateur. Ne jamais tronquer la chaîne en amont.",
      },
    },
  },
};

export const LAvisEstUnContenuAutonome: Story = {
  name: "Un avis est un contenu autonome, et sa note se lit",
  parameters: {
    docs: {
      description: {
        story:
          "Un avis se tient seul : il sort en `article`, ce qui en fait un " +
          "repère de navigation et permet de passer d'un avis au suivant " +
          "sans traverser leur contenu.\n\n" +
          "La note en étoiles est portée par `ScoreStars`, donc annoncée en " +
          "toutes lettres — deux étoiles pleines ne disent rien à qui ne les " +
          "voit pas.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const avis = canvas.getByRole("article");
    await expect(avis).toBeInTheDocument();
    // La note s'annonce, elle ne se compte pas.
    const note = within(avis).queryByRole("img");
    if (note) await expect(note).toHaveAccessibleName(/\d/);
  },
};
