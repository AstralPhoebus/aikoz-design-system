import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import { ToastProvider, useToast, type ToastTone } from "./toast";
import { Button } from "../button/button";

function Declencheur({
  tone = "info",
  message,
  duration,
  action,
}: {
  tone?: ToastTone;
  message: string;
  duration?: number | null;
  action?: { label: string; onClick: () => void };
}) {
  const toast = useToast();
  return (
    <Button variant="outline" onClick={() => toast({ message, tone, duration, action })}>
      Déclencher {tone}
    </Button>
  );
}

const meta = {
  title: "Composants/Toast",
  component: ToastProvider,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  // `children` est requis par le fournisseur ; chaque story le remplace par
  // son propre `render`. Le poser ici évite de le répéter six fois.
  args: { children: null },
} satisfies Meta<typeof ToastProvider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Par défaut",
  render: () => (
    <ToastProvider>
      <Declencheur message="Réponse publiée." tone="success" />
    </ToastProvider>
  ),
  play: async ({ canvas, userEvent: ue }) => {
    await (ue ?? userEvent).click(canvas.getByRole("button", { name: /Déclencher/ }));
    await waitFor(async () => {
      await expect(canvas.getByText("Réponse publiée.")).toBeInTheDocument();
    });
  },
};

export const QuatreTons: Story = {
  name: "Quatre tons",
  render: () => (
    <ToastProvider max={4}>
      <div className="flex flex-wrap gap-2">
        {(["info", "success", "warning", "error"] as const).map((t) => (
          <Declencheur
            key={t}
            tone={t}
            duration={null}
            message={
              {
                info: "Les réponses tournent aléatoirement à chaque chargement.",
                success: "Réponse publiée.",
                warning: "Trois réponses s'écartent de la charte.",
                error: "La collecte Google Business est interrompue.",
              }[t]
            }
          />
        ))}
      </div>
    </ToastProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Même correspondance ton → token que `Badge` et `InfoBanner` : la bordure et " +
          "le glyphe portent la couleur, le texte reste `--foreground`. Le ton est " +
          "**aussi écrit en toutes lettres** en `sr-only` — « Erreur : … » — parce que " +
          "ni la couleur ni le glyphe ne se lisent à voix haute (WCAG 1.4.1).",
      },
    },
  },
};

export const DeuxRegionsLive: Story = {
  name: "Deux régions live, pas une",
  render: () => (
    <ToastProvider max={4}>
      <div className="flex gap-2">
        <Declencheur tone="success" duration={null} message="Réponse publiée." />
        <Declencheur tone="error" duration={null} message="La publication a échoué." />
      </div>
    </ToastProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Les toasts `error` vont dans une région `alert` (assertive), qui interrompt " +
          "la lecture en cours. Tous les autres dans une région `status` (polie), qui " +
          "attend une pause. Une seule région aurait forcé à choisir entre interrompre " +
          "pour un simple « Enregistré » ou laisser passer un échec de publication.\n\n" +
          "Le conteneur est **monté en permanence**, vide ou non : une région live " +
          "insérée dans le document en même temps que son contenu n'est pas annoncée.",
      },
    },
  },
  play: async ({ canvas, userEvent: ue }) => {
    const u = ue ?? userEvent;
    await u.click(canvas.getByRole("button", { name: /Déclencher success/ }));
    await u.click(canvas.getByRole("button", { name: /Déclencher error/ }));
    await waitFor(async () => {
      await expect(canvas.getByRole("status")).toHaveTextContent("Réponse publiée.");
      await expect(canvas.getByRole("alert")).toHaveTextContent("La publication a échoué.");
    });
  },
};

export const LeCompteARebourssArrete: Story = {
  name: "Le compte à rebours s'arrête au survol et au focus",
  render: () => (
    <ToastProvider>
      <Declencheur message="Réponse publiée." tone="success" duration={800} />
    </ToastProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "WCAG 2.2.1 impose de pouvoir désactiver, ajuster ou **prolonger** toute " +
          "limite de temps. Le survol ET le focus clavier mettent le compte en pause — " +
          "sans le second, un utilisateur au clavier qui atteint le bouton de fermeture " +
          "le verrait disparaître sous ses doigts.\n\n" +
          "Ce qui reste du délai est mémorisé : reprendre après une pause ne relance " +
          "pas le compte à zéro, sinon un pointeur qui frôle le message par " +
          "intermittence le maintiendrait indéfiniment.\n\n" +
          "Pour un ton `error`, passer `duration={null}` : une erreur qu'on n'a pas eu " +
          "le temps de lire est une erreur perdue.",
      },
    },
  },
  play: async ({ canvas, userEvent: ue }) => {
    const u = ue ?? userEvent;
    await u.click(canvas.getByRole("button", { name: /Déclencher/ }));
    const message = await waitFor(() => canvas.getByText("Réponse publiée."));

    // Sous le pointeur, il doit SURVIVRE à sa propre durée de vie.
    await u.hover(message);
    await new Promise((r) => setTimeout(r, 1200));
    await expect(canvas.getByText("Réponse publiée.")).toBeInTheDocument();

    // Pointeur retiré : il repart et finit par sortir.
    await u.unhover(message);
    await waitFor(
      async () => {
        await expect(canvas.queryByText("Réponse publiée.")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  },
};

export const ChaqueFermetureSeNomme: Story = {
  name: "Chaque bouton de fermeture se nomme",
  render: () => (
    <ToastProvider max={3}>
      <div className="flex gap-2">
        <Declencheur tone="success" duration={null} message="Réponse publiée." />
        <Declencheur tone="warning" duration={null} message="Trois réponses hors charte." />
      </div>
    </ToastProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Le message est dans le NOM du bouton : « Fermer : Réponse publiée ». Sans " +
          "lui, un lecteur d'écran qui liste les commandes entend « Fermer » autant de " +
          "fois qu'il y a de toasts, sans savoir lequel il ferme.",
      },
    },
  },
  play: async ({ canvas, userEvent: ue }) => {
    const u = ue ?? userEvent;
    await u.click(canvas.getByRole("button", { name: /Déclencher success/ }));
    await u.click(canvas.getByRole("button", { name: /Déclencher warning/ }));

    const fermer = await waitFor(() =>
      canvas.getByRole("button", { name: "Fermer : Réponse publiée." })
    );
    await u.click(fermer);
    await waitFor(async () => {
      await expect(canvas.queryByText("Réponse publiée.")).not.toBeInTheDocument();
      await expect(canvas.getByText("Trois réponses hors charte.")).toBeInTheDocument();
    });
  },
};

export const UneAction: Story = {
  name: "Une action, et le toast se referme",
  render: function Rendu() {
    const annuler = fn();
    return (
      <ToastProvider>
        <Declencheur
          tone="info"
          duration={null}
          message="Réponse programmée pour demain."
          action={{ label: "Annuler", onClick: annuler }}
        />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Une action referme le toast : la garder ouverte laisserait croire qu'on " +
          "peut l'actionner deux fois. Elle vient AVANT le bouton de fermeture dans " +
          "l'ordre du document — on l'atteint donc en premier au clavier, ce qui est " +
          "l'ordre d'importance.",
      },
    },
  },
  play: async ({ canvas, userEvent: ue }) => {
    const u = ue ?? userEvent;
    await u.click(canvas.getByRole("button", { name: /Déclencher/ }));
    const action = await waitFor(() => canvas.getByRole("button", { name: "Annuler" }));
    await u.click(action);
    await waitFor(async () => {
      await expect(canvas.queryByText("Réponse programmée pour demain.")).not.toBeInTheDocument();
    });
  },
};
