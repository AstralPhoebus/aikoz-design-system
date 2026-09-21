import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Dialog } from "./dialog";
import { Button } from "../button/button";

const meta = {
  title: "Composants/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  args: {
    title: "Supprimer cette campagne ?",
    description: "Les avis déjà collectés sont conservés.",
    trigger: <Button variant="outline">Ouvrir</Button>,
    children: <p className="m-0 text-sm text-muted-foreground">Cette action est définitive.</p>,
    footer: <><Button variant="ghost">Annuler</Button><Button>Supprimer</Button></>,
  },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const Placements: Story = {
  name: "Trois placements",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex gap-3">
      {(["center", "right", "bottom"] as const).map((p) => (
        <Dialog key={p} placement={p} title={`Placement ${p}`} trigger={<Button variant="outline" size="sm">{p}</Button>}>
          <p className="m-0 text-sm text-muted-foreground">Échap referme et rend le focus au déclencheur.</p>
        </Dialog>
      ))}
    </div>
  ),
};

export const LeTitreEstUnProp: Story = {
  name: "Le titre est un prop, pas un enfant",
  parameters: {
    docs: {
      description: {
        story:
          "C'est la seule façon de garantir que la modale a un nom accessible : une modale " +
          "sans nom s'annonce « dialogue », sans dire lequel. Radix apporte le reste — " +
          "piège de focus, retour du focus au déclencheur, Échap, verrouillage du " +
          "défilement, `aria-modal`. Pas d'animation : les classes `animate-in` venaient " +
          "d'un plugin non installé et ne produisaient rien.",
      },
    },
  },
};

export const LeFocusRevientAuDeclencheur: Story = {
  name: "Échap ferme, et le focus revient d'où il venait",
  parameters: {
    docs: {
      description: {
        story:
          "Les promesses qu'on rate presque toujours en écrivant une modale " +
          "à la main, ici vérifiées plutôt qu'affirmées : la modale porte son " +
          "titre comme nom accessible, le reste du document est masqué, Échap " +
          "ferme, et le focus **revient au déclencheur**.\n\n" +
          "C'est ce test qui a montré que le composant annonçait " +
          "`aria-modal` alors que Radix ne le pose plus — le masquage, lui, " +
          "est bien là.\n\n" +
          "La dernière est celle qui se casse en silence. Sans elle, un " +
          "utilisateur au clavier se retrouve au début du document après " +
          "chaque fermeture, et doit retraverser la page pour revenir où il " +
          "était.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const declencheur = canvas.getByRole("button", { name: "Ouvrir" });

    await step("le focus entre dans la modale", async () => {
      declencheur.focus();
      await userEvent.click(declencheur);
      const modale = await screen.findByRole("dialog");
      // Le nom accessible vient du titre : c'est ce que garantit le prop
      // obligatoire, et c'est ce qu'un lecteur d'écran annonce en entrant.
      await expect(modale).toHaveAccessibleName("Supprimer cette campagne ?");

      // Le reste du document est MASQUÉ. On vérifie le masquage et non
      // `aria-modal` : Radix ne pose plus l'attribut, et masquer réellement
      // est la technique la plus sûre. C'est ce test qui l'a établi — le
      // composant annonçait l'attribut, il n'y était pas.
      const conteneur = modale.closest("body > *");
      const freres = [...document.body.children].filter(
        (e) => e !== conteneur && !["SCRIPT", "STYLE"].includes(e.tagName)
      );
      await expect(freres.length).toBeGreaterThan(0);
      for (const f of freres) await expect(f).toHaveAttribute("aria-hidden", "true");
      await waitFor(() => expect(modale.contains(document.activeElement)).toBe(true));
    });

    await step("Échap ferme et rend le focus", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(declencheur));
    });
  },
};

export const LeFocusNeSortPasDeLaModale: Story = {
  name: "La tabulation tourne en boucle dans la modale",
  parameters: {
    docs: {
      description: {
        story:
          "Le piège de focus, vérifié : on tabule autant de fois qu'il y a " +
          "d'éléments focusables plus un, et l'on doit être revenu dans la " +
          "modale. Sans piège, la tabulation sort derrière le voile et " +
          "l'utilisateur au clavier pilote une page qu'il ne voit plus.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Ouvrir" }));
    const modale = await screen.findByRole("dialog");
    const focusables = modale.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    await expect(focusables.length).toBeGreaterThan(1);
    for (let i = 0; i <= focusables.length; i++) await userEvent.tab();
    await expect(modale.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
  },
};
