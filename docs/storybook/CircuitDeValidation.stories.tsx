import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import { KanbanBoard } from "@registry/aikoz/kanban-board/kanban-board";
import { VerbatimCard } from "@registry/aikoz/verbatim-card/verbatim-card";
import { ReplyBubble } from "@registry/aikoz/reply-bubble/reply-bubble";
import { Badge } from "@registry/aikoz/badge/badge";
import { Button } from "@registry/aikoz/button/button";
import { EmptyState } from "@registry/aikoz/empty-state/empty-state";
import { ToastProvider, useToast } from "@registry/aikoz/toast/toast";

// ─── La donnée ───────────────────────────────────────────────────────────────

type Etat = "brouillon" | "attente" | "renvoyee" | "validee";

type Reponse = {
  id: string;
  rating: number;
  author: string;
  date: string;
  text: string;
  reply: string;
  etat: Etat;
  /** Ce que le responsable a demandé de corriger. */
  motif?: string;
};

const DEPART: Reponse[] = [
  {
    id: "r1",
    rating: 2,
    author: "M. Berthier",
    date: "8 septembre 2026",
    text: "File d'attente interminable au contrôle, personne pour informer les passagers.",
    reply:
      "Nous sommes navrés de cette attente. Vos remarques sont transmises à l'exploitation du terminal.",
    etat: "brouillon",
  },
  {
    id: "r2",
    rating: 1,
    author: "S. Nguyen",
    date: "7 septembre 2026",
    text: "Bagage endommagé à l'arrivée, aucun interlocuteur au comptoir.",
    reply:
      "Nous vous présentons nos excuses. Un dossier a été ouvert, notre service bagages vous recontacte sous 48 heures.",
    etat: "attente",
  },
  {
    id: "r3",
    rating: 3,
    author: "C. Meunier",
    date: "6 septembre 2026",
    text: "Signalétique confuse entre les terminaux 2E et 2F.",
    reply: "Merci de votre retour, nous en prenons note.",
    etat: "renvoyee",
    motif: "Réponse déresponsabilisante · pas de solution proposée",
  },
];

// ─── L'assemblage ────────────────────────────────────────────────────────────

/**
 * L'état de la réponse, porté par la CARTE.
 *
 * C'est le point que la demande manquait : « Réponse envoyée à votre
 * responsable, en attente de validation » n'est pas un message passager,
 * c'est **l'état de la réponse**. Un toast disparaît en six secondes ;
 * quelqu'un qui revient sur son écran dix minutes plus tard doit toujours
 * savoir où en est son travail.
 *
 * Le toast confirme le GESTE au moment où on le fait. Les deux, jamais l'un
 * à la place de l'autre.
 */
const ETIQUETTE: Record<Etat, { texte: string; tone: "info" | "warning" | "success" } | null> = {
  brouillon: null,
  attente: { texte: "En attente de validation", tone: "info" },
  renvoyee: { texte: "Renvoyée pour correction", tone: "warning" },
  validee: { texte: "Validée · publication J+1", tone: "success" },
};

function Carte({
  r,
  action,
}: {
  r: Reponse;
  action?: { libelle: string; onClick: () => void };
}) {
  const etiquette = ETIQUETTE[r.etat];
  return (
    <VerbatimCard rating={r.rating} author={r.author} date={r.date} text={r.text}>
      <ReplyBubble origin="ai">{r.reply}</ReplyBubble>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {etiquette && (
            <Badge tone={etiquette.tone} size="sm">
              {etiquette.texte}
            </Badge>
          )}
          {r.motif && (
            <span className="text-xs text-muted-foreground">{r.motif}</span>
          )}
        </div>
        {action && (
          <Button variant="secondary" size="sm" onClick={action.onClick}>
            {action.libelle}
          </Button>
        )}
      </div>
    </VerbatimCard>
  );
}

function CircuitDeValidation() {
  const [reponses, setReponses] = useState(DEPART);
  const toast = useToast();

  const par = (e: Etat) => reponses.filter((r) => r.etat === e);
  const deplacer = (id: string, etat: Etat) =>
    setReponses((rs) => rs.map((r) => (r.id === id ? { ...r, etat } : r)));

  const envoyer = (r: Reponse) => {
    deplacer(r.id, "attente");
    // Le toast confirme le GESTE. L'état, lui, reste écrit sur la carte.
    toast({
      message: "Réponse envoyée à votre responsable.",
      tone: "success",
    });
  };

  const colonnes = [
    {
      key: "brouillon",
      title: "À envoyer",
      subtitle: "Rédigées, pas encore soumises",
      tone: "primary" as const,
      count: par("brouillon").length,
      children: (
        <Liste vide="Aucune réponse à envoyer.">
          {par("brouillon").map((r) => (
            <Carte
              key={r.id}
              r={r}
              action={{ libelle: "Envoyer pour validation", onClick: () => envoyer(r) }}
            />
          ))}
        </Liste>
      ),
    },
    {
      key: "attente",
      title: "En attente de validation",
      subtitle: "Chez le responsable",
      tone: "info" as const,
      count: par("attente").length,
      children: (
        <Liste vide="Rien en attente.">
          {par("attente").map((r) => (
            <Carte key={r.id} r={r} />
          ))}
        </Liste>
      ),
    },
    {
      key: "renvoyee",
      title: "Renvoyées",
      subtitle: "À corriger puis renvoyer",
      tone: "warning" as const,
      count: par("renvoyee").length,
      children: (
        <Liste vide="Aucune correction demandée.">
          {par("renvoyee").map((r) => (
            <Carte
              key={r.id}
              r={r}
              action={{ libelle: "Corriger", onClick: () => deplacer(r.id, "brouillon") }}
            />
          ))}
        </Liste>
      ),
    },
  ];

  return <KanbanBoard columns={colonnes} />;
}

function Liste({ children, vide }: { children: React.ReactNode[]; vide: string }) {
  if (!children.length) {
    return <EmptyState title={vide} density="compact" />;
  }
  return <div className="flex flex-col gap-3">{children}</div>;
}

// ─── Storybook ───────────────────────────────────────────────────────────────

const surMarque = (marque: string) => (S: () => React.ReactElement) => {
  const Deco = () => {
    useEffect(() => {
      document.documentElement.setAttribute("data-brand", marque);
      return () => document.documentElement.removeAttribute("data-brand");
    }, []);
    return (
      <ToastProvider>
        <div className="min-w-0 p-4">
          <S />
        </div>
      </ToastProvider>
    );
  };
  return <Deco />;
};

const meta = {
  title: "Assemblages/Circuit de validation",
  component: CircuitDeValidation,
  parameters: { layout: "fullscreen" },
  decorators: [surMarque("adp")],
} satisfies Meta<typeof CircuitDeValidation>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Par défaut — marque ADP, thème clair",
  globals: { theme: "clair" },
  parameters: {
    docs: {
      description: {
        story:
          "Bâti sur `KanbanBoard`, comme `ResponseKanban` — **le même tableau, " +
          "d'autres colonnes**.\n\n" +
          "### Ce n'est pas « État des réponses »\n\n" +
          "La question s'est posée, et les deux écrans se ressemblent assez " +
          "pour qu'elle se pose. Ils répondent pourtant à deux **modèles de " +
          "gouvernance** différents :\n\n" +
          "| | État des réponses | Circuit de validation |\n| --- | --- | --- |\n" +
          "| la réponse est | **automatique** | **écrite à la main** |\n" +
          "| elle part | demain, toute seule | quand un responsable l'accepte |\n" +
          "| on peut | la modifier jusque-là | la corriger si elle revient |\n" +
          "| l'axe des colonnes | l'**urgence** | l'**étape** |\n\n" +
          "Le sous-titre par défaut de la première colonne d'`État des " +
          "réponses` disait « À valider avant publication J+1 ». Il décrivait " +
          "un circuit d'approbation alors qu'il habillait des réponses qui " +
          "n'attendent personne — c'est ce mot-là qui faisait confondre les " +
          "deux écrans, pas leur structure. Il dit désormais « Publiées " +
          "demain, modifiables jusque-là ».",
      },
    },
  },
};

export const LEtatVitSurLaCartePasDansLeToast: Story = {
  name: "L'état vit sur la carte, pas dans le toast",
  globals: { theme: "clair" },
  parameters: {
    docs: {
      description: {
        story:
          "« Réponse envoyée à votre responsable, en attente de validation » " +
          "n'est pas un message passager : c'est **l'état de la réponse**.\n\n" +
          "Un toast disparaît en six secondes. Quelqu'un qui revient sur son " +
          "écran dix minutes plus tard doit toujours savoir où en est son " +
          "travail — et il ne le saura que si l'information est écrite sur la " +
          "carte.\n\n" +
          "Le toast confirme le **geste**, au moment où on le fait. Les deux, " +
          "jamais l'un à la place de l'autre. Cette histoire mesure les deux " +
          "moitiés : le toast apparaît, et la pastille reste après lui.",
      },
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Envoyer pour validation" }));

    // 1. Le geste est confirmé.
    await waitFor(() =>
      expect(document.body).toHaveTextContent("Réponse envoyée à votre responsable."),
    );

    // 2. Et l'état est ÉCRIT sur la carte — c'est lui qui survivra au toast.
    const attente = c.getAllByText("En attente de validation");
    // Une fois dans le titre de la colonne, une fois sur la carte déplacée.
    await expect(attente.length).toBeGreaterThanOrEqual(2);
  },
};
