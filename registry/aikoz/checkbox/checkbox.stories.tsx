import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { expect } from "storybook/test";
import { Checkbox } from "./checkbox";

const meta = {
  title: "Formulaires/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { label: "Recevoir le rapport hebdomadaire" },
  decorators: [(S) => <div className="max-w-md"><S /></div>],
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const AvecConsigneEtErreur: Story = {
  name: "La consigne précède, l'erreur suit",
  args: {
    label: "J'accepte que mes avis soient republiés",
    description: "Ils apparaîtront sur la fiche publique de l'établissement.",
    error: "Cette autorisation est nécessaire pour publier une réponse.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "La consigne sert à décider, donc elle passe AVANT. L'erreur arrive " +
          "après coup et porte `role=\"alert\"` : elle est annoncée sans qu'on " +
          "ait à retourner la chercher.",
      },
    },
  },
  play: async ({ canvas }) => {
    const c = canvas.getByRole("checkbox");
    await expect(c).toHaveAttribute("aria-invalid", "true");
    const decrit = (c.getAttribute("aria-describedby") ?? "").split(" ");
    await expect(decrit.length).toBe(2);
    await expect(canvas.getByRole("alert")).toHaveTextContent(/nécessaire/);
  },
};

export const UnVraiChampSousLaBoite: Story = {
  name: "Un vrai `<input>` sous la boîte",
  parameters: {
    docs: {
      description: {
        story:
          "En `sr-only`, jamais `display:none` ni `visibility:hidden` — ces " +
          "deux-là retirent le champ de la tabulation. Il reste focusable, se " +
          "coche à la barre d'espace, participe à l'envoi du formulaire et à " +
          "l'autoremplissage, sans qu'on écrive une ligne de clavier.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const c = canvas.getByRole("checkbox");
    await expect(c).not.toBeChecked();

    await userEvent.tab();
    await expect(c).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(c).toBeChecked();

    // Masqué à l'œil, pas aux technologies d'assistance.
    await expect(c.getBoundingClientRect().width).toBeLessThan(4);
    await expect(getComputedStyle(c).display).not.toBe("none");
    await expect(getComputedStyle(c).visibility).not.toBe("hidden");
  },
};

// ─── Ce qu'aucun autre contrôle ne sait dire ──────────────────────────────────

const LIGNES = ["Terminal 2E", "Orly 4", "Terminal 1", "Roissypôle"];

function ToutSelectionner() {
  const [retenues, setRetenues] = useState<string[]>(["Orly 4"]);
  const etat = useMemo(
    () =>
      retenues.length === 0 ? "aucune" : retenues.length === LIGNES.length ? "toutes" : "partielle",
    [retenues],
  );

  return (
    <div className="flex flex-col gap-3">
      <Checkbox
        label="Tout sélectionner"
        checked={etat === "toutes"}
        indeterminate={etat === "partielle"}
        onChange={(e) => setRetenues(e.target.checked ? [...LIGNES] : [])}
      />
      <hr className="m-0 border-0 border-t border-border" />
      <div className="flex flex-col gap-2 pl-4">
        {LIGNES.map((l) => (
          <Checkbox
            key={l}
            label={l}
            checked={retenues.includes(l)}
            onChange={(e) =>
              setRetenues((r) => (e.target.checked ? [...r, l] : r.filter((x) => x !== l)))
            }
          />
        ))}
      </div>
      <p role="status" className="m-0 text-sm text-muted-foreground">
        {retenues.length} établissement{retenues.length > 1 ? "s" : ""} sur {LIGNES.length}
      </p>
    </div>
  );
}

export const NiCocheeNiDecochee: Story = {
  name: "Ni cochée ni décochée — le « tout sélectionner »",
  render: () => <ToutSelectionner />,
  parameters: {
    docs: {
      description: {
        story:
          "C'est **la seule chose qu'aucun autre contrôle du système ne sait " +
          "dire** : `Switch` est binaire par nature, et `ChoiceGroup` ne " +
          "connaît que des options complètes. C'est ce qui justifie ce " +
          "composant à côté d'eux.\n\n" +
          "`indeterminate` n'existe pas en HTML — seulement comme **propriété " +
          "de l'élément**. Le poser en attribut JSX ne ferait rien du tout, et " +
          "le source aurait l'air juste. Il est donc appliqué par un effet sur " +
          "la référence.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const tout = canvas.getByRole("checkbox", { name: "Tout sélectionner" });
    // Une seule ligne sur quatre : ni cochée, ni décochée.
    await expect((tout as HTMLInputElement).indeterminate).toBe(true);
    await expect(tout).not.toBeChecked();

    // On coche tout : l'état intermédiaire disparaît.
    await userEvent.click(tout);
    await expect((tout as HTMLInputElement).indeterminate).toBe(false);
    await expect(tout).toBeChecked();
    for (const l of LIGNES) {
      await expect(canvas.getByRole("checkbox", { name: l })).toBeChecked();
    }

    // On en décoche une : il revient.
    await userEvent.click(canvas.getByRole("checkbox", { name: "Terminal 1" }));
    await expect((tout as HTMLInputElement).indeterminate).toBe(true);
    await expect(tout).not.toBeChecked();
  },
};

export const LeLibelleEstLaCible: Story = {
  name: "Le libellé est la cible, pas seulement la boîte",
  parameters: {
    docs: {
      description: {
        story:
          "La boîte dessinée fait 20 px — sous le plancher de 24 px du critère " +
          "WCAG 2.2 AA 2.5.8 si elle était seule à recevoir le clic. C'est le " +
          "`<label>` qui porte la cible, et qui la porte à 44 px au doigt par " +
          "la variante `tactile:`.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const c = canvas.getByRole("checkbox");
    await expect(c).not.toBeChecked();
    // Cliquer le TEXTE coche — c'est ce que `htmlFor` garantit.
    await userEvent.click(canvas.getByText("Recevoir le rapport hebdomadaire"));
    await expect(c).toBeChecked();
  },
};
