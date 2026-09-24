import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { expect, fn, within } from "storybook/test";
import { ResponseKanban } from "@registry/aikoz/response-kanban/response-kanban";

/**
 * Le contenu EXACT de la maquette envoyée par ADP le 24/09/2026, rendu par
 * le design system.
 *
 * C'est le point de cette histoire : ce n'est pas une démonstration avec des
 * données inventées qui tomberaient juste. Les avis, les dates, les motifs
 * de non-conformité et les intitulés de colonne sont ceux de leur écran —
 * seule la mise en forme change.
 */
const AUTOMATISEES = [
  {
    id: "adp-a1",
    rating: 5,
    author: "Client Google",
    date: "10 septembre 2026",
    reply:
      "Merci beaucoup pour votre note ! Toute l'équipe est ravie de vous compter parmi ses clients. À très bientôt.",
  },
  {
    id: "adp-a2",
    rating: 4,
    author: "Client Google",
    date: "10 septembre 2026",
    reply:
      "Un grand merci pour ce retour ! C'est toujours un plaisir de vous accompagner.",
  },
  // Les cinq autres sont derrière « Voir plus (5) » dans leur maquette : le
  // compteur de la colonne affiche bien 7.
  {
    id: "adp-a3",
    rating: 5,
    author: "Client Google",
    date: "9 septembre 2026",
    reply: "Merci pour votre note, au plaisir de vous accueillir de nouveau.",
  },
  {
    id: "adp-a4",
    rating: 5,
    author: "Client Google",
    date: "9 septembre 2026",
    reply:
      "Merci beaucoup, nous transmettons votre message aux équipes du terminal.",
  },
  {
    id: "adp-a5",
    rating: 4,
    author: "Client Google",
    date: "9 septembre 2026",
    reply: "Merci d'avoir pris le temps de nous évaluer.",
  },
  {
    id: "adp-a6",
    rating: 5,
    author: "Client Google",
    date: "8 septembre 2026",
    reply: "Un grand merci pour votre retour.",
  },
  {
    id: "adp-a7",
    rating: 5,
    author: "Client Google",
    date: "8 septembre 2026",
    reply: "Merci pour votre note, bon voyage.",
  },
];

const HORS_CHARTE = [
  {
    id: "adp-h1",
    rating: 2,
    author: "M. Berthier",
    date: "8 septembre 2026",
    text: "File d'attente interminable au contrôle, personne pour informer les passagers.",
    reply:
      "Nous vous invitons à vous rapprocher de la société en charge des contrôles de sûreté.",
    reasonLabel: "Réponse déresponsabilisante · renvoi vers un tiers",
  },
  {
    id: "adp-h2",
    rating: 1,
    author: "S. Nguyen",
    date: "7 septembre 2026",
    text: "Bagage endommagé à l'arrivée, aucun interlocuteur au comptoir.",
    reply: "Votre message a bien été pris en compte.",
    reasonLabel: "Absence d'excuse · pas de solution proposée",
  },
];

const SENSIBLES = [
  {
    id: "adp-s1",
    rating: 1,
    author: "C. Meunier",
    date: "10 septembre 2026",
    text: "Contrôle de sûreté humiliant pour ma mère en fauteuil, aucun accompagnement PMR malgré la demande faite en amont.",
    categoryLabel: "Accessibilité PMR · sûreté",
  },
  {
    id: "adp-s2",
    rating: 1,
    author: "Voyageur anonyme",
    date: "9 septembre 2026",
    text: "Vol de contenu dans ma valise entre l'enregistrement et la livraison bagages. Plainte déposée.",
    categoryLabel: "Sécurité · vol signalé",
  },
];

const meta = {
  title: "Assemblages/Démo ADP — État des réponses",
  component: ResponseKanban,
  parameters: { layout: "fullscreen" },
  args: {
    automated: AUTOMATISEES,
    offCharter: HORS_CHARTE,
    sensitive: SENSIBLES,
    initialVisible: 2,
    onSaveReply: fn(),
    onDraftReply: fn(),
    // Leurs intitulés, pas les nôtres : ils disent la règle de CE client.
    labels: {
      automated: {
        subtitle: "Avis 4-5 étoiles sans commentaire · publication J+1",
      },
      offCharter: {
        subtitle: "Réponses publiées non conformes à la charte éditoriale",
      },
      sensitive: {
        subtitle: "À traiter immédiatement · réponse rédigée avec l'assistant",
      },
    },
  },
  globals: { marque: "adp" },
  decorators: [
    (S) => (
      <div className="min-w-0 bg-background p-6">
        <h2 className="m-0 mb-5 font-heading text-xl font-semibold text-foreground">
          État des réponses en cours
        </h2>
        <S />
      </div>
    ),
  ],
} satisfies Meta<typeof ResponseKanban>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Clair: Story = {
  name: "Marque ADP, thème clair",
  globals: { theme: "clair" },
  parameters: {
    docs: {
      description: {
        story:
          "Le contenu **exact** de la maquette ADP du 24/09/2026, rendu par le " +
          "design system : mêmes avis, mêmes dates, mêmes motifs de non-" +
          "conformité, mêmes intitulés de colonne. Seule la mise en forme " +
          "change.\n\n" +
          "Ce que le système apporte au passage, et qu'on ne voit pas sur une " +
          "image : chaque colonne est une `section` nommée par son titre, " +
          "chaque compteur est annoncé (« 7 avis dans Réponses " +
          "automatisées »), « Voir plus » rend le focus au premier élément " +
          "révélé, et le motif de non-conformité est un texte, pas une " +
          "couleur.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Les trois colonnes portent LEURS intitulés.
    await expect(
      c.getByText(/Avis 4-5 étoiles sans commentaire/),
    ).toBeInTheDocument();
    await expect(
      c.getByText(/non conformes à la charte éditoriale/),
    ).toBeInTheDocument();
    await expect(
      c.getByText(/réponse rédigée avec l'assistant/),
    ).toBeInTheDocument();
    // Et les comptes de leur maquette : 7, 2, 2.
    await expect(
      c.getByRole("region", { name: "Réponses automatisées" }),
    ).toBeInTheDocument();
    // Le compte est ANNONCÉ, pas seulement dessiné : « 7 » nu ne dit pas de
    // quoi. Le texte est coupé entre le chiffre et son étiquette `sr-only`,
    // donc on lit le nœud entier.
    const colonne = c.getByRole("region", { name: "Réponses automatisées" });
    await expect(colonne.textContent).toMatch(
      /7\s*éléments dans « Réponses automatisées »/,
    );
  },
};

export const Sombre: Story = {
  name: "Marque ADP, thème sombre",
  globals: { theme: "sombre" },
  parameters: {
    docs: {
      description: {
        story:
          "Le même écran en sombre. Les démos ADP se font en clair — c'est un " +
          "constat, pas une règle — mais le design system doit tenir les deux, " +
          "et c'est ici qu'on le vérifie plutôt que le jour où quelqu'un " +
          "bascule son système.",
      },
    },
  },
};
