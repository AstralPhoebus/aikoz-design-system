import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { ResponseKanban } from "./response-kanban";

const AUTOMATISEES = [
  { id: "a1", rating: 5, author: "Sofiane B.", date: "9 sept.", reply: "Merci pour votre retour, nous sommes ravis que votre passage se soit bien déroulé." },
  { id: "a2", rating: 4, author: "Nadia K.", date: "9 sept.", reply: "Merci d'avoir pris le temps de nous évaluer, à très bientôt en agence." },
  { id: "a3", rating: 5, author: "Julien P.", date: "8 sept.", reply: "Un grand merci pour cette note, nous la transmettons à l'équipe." },
  { id: "a4", rating: 5, author: "Inès R.", date: "8 sept.", reply: "Merci beaucoup, au plaisir de vous revoir." },
  { id: "a5", rating: 4, author: "Marc T.", date: "7 sept.", reply: "Merci pour votre confiance." },
];

const HORS_CHARTE = [
  {
    id: "h1", rating: 2, author: "Claire M.", date: "8 sept.",
    text: "Deux heures d'attente au guichet et personne pour renseigner.",
    reply: "Nous vous invitons à contacter directement le prestataire en charge de l'accueil.",
    reasonLabel: "Réponse déresponsabilisante · renvoi vers un tiers",
  },
];

const SENSIBLES = [
  {
    id: "s1", rating: 1, author: "Patrick L.", date: "9 sept.",
    text: "Ascenseur en panne depuis trois semaines, impossible d'accéder au quai en fauteuil.",
    categoryLabel: "Accessibilité PMR · sûreté",
  },
];

const meta = {
  title: "Composants/ResponseKanban",
  component: ResponseKanban,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    automated: AUTOMATISEES,
    offCharter: HORS_CHARTE,
    sensitive: SENSIBLES,
    onSaveReply: fn(),
    onDraftReply: fn(),
  },
} satisfies Meta<typeof ResponseKanban>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Par défaut",
  render: (args) => (
    <div className="bg-background p-6">
      <ResponseKanban {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Un commentaire `//` posé au milieu d'enfants JSX n'est pas un
    // commentaire : c'est du texte, et il s'affichait ici — trois lignes de
    // code au-dessus de chaque réponse automatique, visibles seulement sur
    // le tableau de bord complet. Aucun test ne le voyait parce qu'aucun ne
    // regardait le texte qui n'était pas attendu.
    const fuites = [...canvasElement.querySelectorAll("*")]
      .flatMap((e) => [...e.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => (n.textContent ?? "").trim())
      .filter((t) => t.startsWith("//") || t.startsWith("/*"));
    await expect(fuites).toHaveLength(0);
  },
};

export const TroisColonnesNommees: Story = {
  name: "Trois colonnes, chacune nommée",
  render: (args) => (
    <div className="bg-background p-6">
      <ResponseKanban {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Chaque colonne est une `section` nommée par son titre via `aria-labelledby` " +
          "— donc un point de repère atteignable directement, sans traverser les " +
          "cartes de la colonne précédente. Les colonnes sont classées par urgence " +
          "croissante de gauche à droite, et ce classement est porté par le titre et " +
          "le sous-titre, pas par la couleur du liseré.",
      },
    },
  },
  play: async ({ canvas }) => {
    for (const nom of ["Réponses automatisées", "Réponses hors charte", "Avis sensibles"]) {
      await expect(canvas.getByRole("region", { name: nom })).toBeInTheDocument();
    }
  },
};

export const VoirPlusRendLeFocus: Story = {
  name: "« Voir plus » ne perd pas le focus",
  render: (args) => (
    <div className="bg-background p-6">
      <ResponseKanban {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "« Voir plus » révèle le reste de la colonne PUIS disparaît, puisqu'il n'y a " +
          "plus rien à révéler. Un bouton qui s'efface sous le doigt renvoie le focus " +
          "sur `body` : au clavier, on repart du haut du document. Le focus est donc " +
          "porté sur la première carte nouvellement révélée — là où l'utilisateur " +
          "vient de demander à aller.",
      },
    },
  },
  play: async ({ canvas, userEvent: ue }) => {
    const u = ue ?? userEvent;
    const voirPlus = canvas.getByRole("button", { name: /voir plus/i });
    await u.click(voirPlus);
    await expect(canvas.queryByRole("button", { name: /voir plus/i })).not.toBeInTheDocument();
    // Le focus ne doit pas être retombé sur le corps du document.
    await expect(document.activeElement).not.toBe(document.body);
  },
};

export const ModifierDonneLeFocusAuChamp: Story = {
  name: "« Modifier » donne le focus au champ",
  render: (args) => (
    <div className="bg-background p-6">
      <ResponseKanban {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "« Modifier » remplace la bulle par un champ d'édition et retire son propre " +
          "bouton du document. Sans reprise explicite, le focus tombe sur `body` et " +
          "l'utilisateur clavier doit retrouver le champ qu'il vient d'ouvrir. Le focus " +
          "va donc dans le champ ; Échap annule et le rend au bouton « Modifier », " +
          "qui réapparaît au même endroit.",
      },
    },
  },
  play: async ({ canvas, userEvent: ue }) => {
    const u = ue ?? userEvent;
    const modifier = canvas.getAllByRole("button", { name: "Modifier" })[0];
    await u.click(modifier);

    const champ = canvas.getByRole("textbox", { name: /modifier la réponse/i });
    await expect(champ).toHaveFocus();

    await u.keyboard("{Escape}");
    await expect(canvas.queryByRole("textbox", { name: /modifier la réponse/i })).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("button", { name: "Modifier" })[0]).toHaveFocus();
  },
};

export const LEditionRemonteLeTexte: Story = {
  name: "L'édition remonte le texte, elle ne l'enregistre pas",
  render: (args) => (
    <div className="bg-background p-6">
      <ResponseKanban {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "« Enregistrer » appelle `onSaveReply(id, texte)` et referme l'édition. Le " +
          "composant ne persiste rien et ne parle à aucun service : c'est une vue de " +
          "supervision, la décision de ce qu'on fait du texte appartient à l'appelant.",
      },
    },
  },
  play: async ({ canvas, args, userEvent: ue }) => {
    const u = ue ?? userEvent;
    await u.click(canvas.getAllByRole("button", { name: "Modifier" })[0]);
    const champ = canvas.getByRole("textbox", { name: /modifier la réponse/i });
    await u.clear(champ);
    await u.type(champ, "Merci beaucoup pour ce retour.");
    await u.click(canvas.getByRole("button", { name: "Enregistrer" }));
    await expect(args.onSaveReply).toHaveBeenCalledWith("a1", "Merci beaucoup pour ce retour.");
  },
};

export const ColonnesVides: Story = {
  name: "Une colonne vide le dit",
  args: { automated: [], offCharter: [], sensitive: [] },
  render: (args) => (
    <div className="bg-background p-6">
      <ResponseKanban {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Trois colonnes vides restent trois colonnes : la structure ne bouge pas, " +
          "chacune explique ce qui viendra s'y afficher. Une colonne qui disparaîtrait " +
          "quand elle se vide ferait croire à une vue différente d'un jour à l'autre.",
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Aucune réponse automatisée en attente")).toBeInTheDocument();
    await expect(canvas.getByText("Aucune réponse hors charte à corriger")).toBeInTheDocument();
    await expect(canvas.getByText("Aucun avis sensible à traiter")).toBeInTheDocument();
  },
};
