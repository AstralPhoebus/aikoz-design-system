import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { AlertDialog } from "./alert-dialog";
import { Button } from "@registry/aikoz/button/button";

const meta = {
  title: "Retours/AlertDialog",
  component: AlertDialog,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    title: "Supprimer Orly 4 ?",
    description:
      "Les 312 avis collectés sur cet établissement seront retirés du tableau de bord. Cette action est irréversible.",
    confirmLabel: "Supprimer l'établissement",
    destructive: true,
    onConfirm: fn(),
    trigger: <Button variant="ghost" size="sm">Supprimer</Button>,
  },
} satisfies Meta<typeof AlertDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Par défaut",
  parameters: {
    docs: {
      description: {
        story:
          "**Le titre pose la question**, il n'annonce pas « Confirmation ». " +
          "Un titre qui ne dit pas ce qui va arriver oblige à lire le corps, " +
          "et personne ne lit le corps d'une boîte de dialogue.\n\n" +
          "**Le bouton nomme ce qu'il fait** — « Supprimer l'établissement », " +
          "jamais « Confirmer » ni « OK ». Quelqu'un qui revient à son écran " +
          "après une interruption doit pouvoir décider en lisant le seul " +
          "bouton.",
      },
    },
  },
};

export const CeNEstPasUnDialog: Story = {
  name: "Ce n'est pas un `Dialog`, et ça se mesure",
  parameters: {
    docs: {
      description: {
        story:
          "| | `Dialog` | `AlertDialog` |\n" +
          "| --- | --- | --- |\n" +
          "| rôle ARIA | `dialog` | **`alertdialog`** |\n" +
          "| clic à l'extérieur | ferme | **ne ferme pas** |\n" +
          "| description | facultative | **obligatoire** |\n" +
          "| focus à l'ouverture | premier élément | **le retrait** |\n\n" +
          "`role=\"alertdialog\"` dit aux technologies d'assistance qu'il " +
          "s'agit d'une interruption qui attend une décision, et fait annoncer " +
          "la description juste après le titre. C'est le seul rôle ARIA qui " +
          "l'obtient — un `dialog` ordinaire annonce son titre et s'arrête là.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Supprimer" }));
    const boite = await waitFor(() => document.querySelector('[role="alertdialog"]')!);
    await expect(boite).toBeInTheDocument();

    // La description est reliée, pas seulement présente.
    const decritPar = boite.getAttribute("aria-describedby");
    await expect(decritPar).toBeTruthy();
    await expect(document.getElementById(decritPar!)).toHaveTextContent(/irréversible/);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeNull());
  },
};

export const LeFocusVaSurLeRetrait: Story = {
  name: "Le focus va sur le retrait, jamais sur l'action",
  parameters: {
    docs: {
      description: {
        story:
          "Une boîte qui demande de confirmer une suppression et pose le focus " +
          "sur « Supprimer » transforme une **barre d'espace réflexe en perte " +
          "de données**. Le défaut sûr est de ne rien faire.\n\n" +
          "C'est aussi pourquoi « Annuler » est en premier dans le DOM : ce " +
          "n'est pas un choix de mise en page, c'est ce qui décide du focus.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeTruthy());

    await waitFor(() =>
      expect(document.activeElement).toHaveTextContent("Annuler"),
    );
    // Et surtout : PAS sur la commande destructive.
    await expect(document.activeElement).not.toHaveTextContent(
      "Supprimer l'établissement",
    );

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeNull());
  },
};

// ─── Le clic à l'extérieur ────────────────────────────────────────────────────

function AvecCompteur() {
  const [supprime, setSupprime] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <AlertDialog
        title="Supprimer Orly 4 ?"
        description="Les 312 avis collectés seront retirés du tableau de bord. Cette action est irréversible."
        confirmLabel="Supprimer l'établissement"
        destructive
        onConfirm={() => setSupprime(true)}
        trigger={<Button variant="ghost" size="sm">Supprimer</Button>}
      />
      <p role="status" className="m-0 text-sm text-muted-foreground">
        {supprime ? "Établissement supprimé" : "Rien n'a été supprimé"}
      </p>
    </div>
  );
}

export const LeClicDehorsNeFermePas: Story = {
  name: "Le clic à l'extérieur ne ferme pas",
  render: () => <AvecCompteur />,
  parameters: {
    docs: {
      description: {
        story:
          "Un retrait par inadvertance n'est pas grave ; ce qui l'est, c'est " +
          "de **croire avoir annulé**. La décision est explicite dans les deux " +
          "sens : on choisit, ou on presse `Échap`.\n\n" +
          "C'est la différence avec `Dialog`, où le clic dehors ferme — parce " +
          "qu'un panneau de filtres qu'on quitte ne coûte rien.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    // L'état se lit AVANT l'ouverture : une alerte est modale, et Radix pose
    // `aria-hidden` sur tout le reste du document. `getByRole` ne voit alors
    // plus le `role="status"` — et c'est correct, contrairement au menu
    // déroulant où la modalité elle-même était le défaut. Ici l'interruption
    // EST le contrat.
    await expect(canvas.getByRole("status")).toHaveTextContent("Rien n'a été supprimé");

    await userEvent.click(canvas.getByRole("button", { name: "Supprimer" }));
    const boite = await waitFor(() => document.querySelector('[role="alertdialog"]')!);

    // On clique le voile : la boîte reste.
    const voile = document.querySelector<HTMLElement>(".fixed.inset-0")!;
    await userEvent.click(voile);
    await expect(document.querySelector('[role="alertdialog"]')).toBe(boite);

    // Il faut choisir pour que quelque chose arrive.
    const agir = [...boite.querySelectorAll("button")].find((b) =>
      /Supprimer l'établissement/.test(b.textContent ?? ""),
    )!;
    await userEvent.click(agir);
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent("Établissement supprimé"),
    );
  },
};

export const NonDestructive: Story = {
  name: "Toutes les confirmations ne détruisent pas",
  args: {
    title: "Publier les 14 réponses en attente ?",
    description:
      "Elles apparaîtront sur les fiches publiques dans l'heure. Vous pourrez les modifier ensuite.",
    confirmLabel: "Publier les réponses",
    destructive: false,
    trigger: <Button size="sm">Publier</Button>,
  },
  parameters: {
    docs: {
      description: {
        story:
          "`destructive` pilote la couleur, pas le comportement : " +
          "l'interruption, la description obligatoire et le focus sur le " +
          "retrait valent pour toute décision qu'on ne veut pas voir prise par " +
          "réflexe. Publier quatorze réponses sur des fiches publiques se " +
          "défait, mais après coup et à la main.",
      },
    },
  },
};
