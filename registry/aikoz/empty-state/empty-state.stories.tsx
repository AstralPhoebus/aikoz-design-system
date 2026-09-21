import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { EmptyState } from "./empty-state";
import { Button } from "../button/button";

const meta = {
  title: "Composants/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    title: "Aucun avis sur cette période",
    description: "Élargissez la période d'analyse ou retirez le filtre par source.",
  },
  decorators: [(S) => <div className="w-[28rem]"><S /></div>],
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Par défaut",
  args: { action: <Button size="sm" variant="outline">Élargir à 90 jours</Button> },
};

export const IlNommeCeQuiManque: Story = {
  name: "Il nomme ce qui manque, et indique la sortie",
  args: { action: <Button size="sm">Créer une campagne</Button> },
  parameters: {
    docs: {
      description: {
        story:
          "« Aucun avis sur cette période », pas « Aucune donnée ». Et un état vide sans " +
          "action ni consigne est un cul-de-sac : l'utilisateur voit que rien ne s'affiche, " +
          "sans savoir si c'est normal, si ça va arriver, ou s'il a mal réglé quelque chose.",
      },
    },
  },
};

export const TonErreur: Story = {
  name: "Ton erreur",
  args: {
    tone: "error",
    title: "Le chargement a échoué",
    description: "La source Google n'a pas répondu. Réessayez dans un instant.",
    action: <Button size="sm" variant="outline">Réessayer</Button>,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Le fond pâle est DÉCORATIF — 1,10:1 sur la carte. L'état est porté par le trait " +
          "ET par le texte, jamais par cette teinte.",
      },
    },
  },
};

export const LeNiveauDeTitreAppartientALaPage: Story = {
  name: "Le niveau de titre appartient à la page, pas au composant",
  parameters: {
    docs: {
      description: {
        story:
          "Un état vide sans action ni consigne est un cul-de-sac : " +
          "l'utilisateur voit que rien ne s'affiche, sans savoir si c'est " +
          "normal, si son filtre est trop étroit, ou si quelque chose a " +
          "échoué. Le titre nomme donc ce qui manque — « Aucun avis sur " +
          "cette période » et non « Aucune donnée ».\n\n" +
          "Mais il sort en `<p>` par DÉFAUT, pas en titre. Même raison que " +
          "l'absence de `CardTitle` dans `Card` : le niveau dépend du plan " +
          "de la page, et un `h3` figé casserait la hiérarchie dès qu'on " +
          "place l'état vide ailleurs. `titleAs` le promeut quand la page " +
          "sait quel niveau lui revient.\n\n" +
          "J'ai écrit ce test en supposant l'inverse — il a échoué, et " +
          "c'était le test qui avait tort.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <EmptyState
        title="Aucun avis sur cette période"
        description="Élargissez la période d'analyse ou retirez le filtre par source."
      />
      <EmptyState
        titleAs="h2"
        title="Aucun avis sur cette période"
        description="Promu en titre parce que la page sait qu'il ouvre une section."
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Un seul titre : celui que l'appelant a explicitement promu.
    const titres = canvas.getAllByRole("heading");
    await expect(titres).toHaveLength(1);
    await expect(titres[0].tagName).toBe("H2");

    // L'illustration ne s'annonce pas : elle n'ajoute rien à ce que le
    // titre dit déjà, et « image » répété deux fois est du bruit.
    for (const svg of canvasElement.querySelectorAll("svg")) {
      const masque = svg.closest('[aria-hidden="true"]') ?? svg.getAttribute("aria-hidden");
      await expect(masque).toBeTruthy();
    }
  },
};
