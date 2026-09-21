import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "./input";

const meta = {
  title: "Formulaires/Input",
  component: Input,
  tags: ["autodocs"],
  args: { label: "Nom de l'agence" },
  decorators: [(S) => <div className="w-80"><S /></div>],
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const LeLibelleEstObligatoire: Story = {
  name: "Le libellé est obligatoire",
  args: { placeholder: "Lyon Part-Dieu" },
  parameters: {
    docs: {
      description: {
        story:
          "`label` est un prop requis, pas une option. Un `placeholder` n'est pas un " +
          "libellé : il disparaît à la saisie, laissant l'utilisateur sans repère sur ce " +
          "qu'il est en train de remplir.",
      },
    },
  },
};

export const LaConsigneArriveAvant: Story = {
  name: "La consigne arrive AVANT le champ",
  args: {
    label: "Code postal",
    description: "Cinq chiffres, sans espace.",
    inputMode: "numeric",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Placée après le champ, elle arrive trop tard : l'utilisateur a déjà saisi.",
      },
    },
  },
};

export const LErreurDitCommentCorriger: Story = {
  name: "L'erreur dit comment corriger",
  args: {
    label: "Adresse e-mail",
    type: "email",
    required: true,
    defaultValue: "camille.brun",
    error: "L'adresse doit contenir un domaine, par exemple camille.brun@neoassur.fr",
  },
  parameters: {
    docs: {
      description: {
        story:
          "« Champ invalide » ne dit rien. Le message nomme le problème ET la correction " +
          "attendue, et il est annoncé en `role=\"alert\"` puisqu'il apparaît après coup.",
      },
    },
  },
};

export const LectureSeuleEnTirete: Story = {
  name: "Lecture seule : un trait tireté, pas un fond",
  args: { label: "Identifiant", defaultValue: "AG-4417", readOnly: true },
  parameters: {
    docs: {
      description: {
        story:
          "L'état est porté par un trait TIRETÉ : `--muted` ne se détache pas de `--card` " +
          "— de 1,00 à 1,19:1 selon la combinaison, strictement identique en produit " +
          "sombre. Un état signalé par un fond invisible n'est pas signalé. Et c'est " +
          "`readOnly`, pas `disabled` : la valeur reste focusable, donc découvrable.",
      },
    },
  },
};

export const LeChampEstBienDecritParSonErreur: Story = {
  name: "Le champ est relié à son erreur et à sa consigne",
  args: {
    label: "Adresse e-mail",
    type: "email",
    required: true,
    description: "Utilisée pour l'envoi du rapport hebdomadaire.",
    defaultValue: "camille.brun",
    error: "L'adresse doit contenir un domaine, par exemple camille.brun@neoassur.fr",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Un message d'erreur affiché à côté d'un champ n'est pas un message " +
          "d'erreur : rien ne dit à un lecteur d'écran qu'il s'y rapporte. Ce " +
          "test vérifie le lien lui-même — `aria-describedby` pointe sur la " +
          "consigne ET sur l'erreur, `aria-invalid` est posé, et le message " +
          "est en `role=\"alert\"` puisqu'il apparaît après coup.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const champ = canvas.getByLabelText(/Adresse e-mail/);
    await expect(champ).toHaveAttribute("aria-invalid", "true");

    // `aria-describedby` doit désigner les DEUX textes : une consigne qu'on
    // perd à l'apparition de l'erreur, c'est le format attendu qui disparaît
    // au moment précis où l'utilisateur en a besoin.
    const ids = (champ.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    await expect(ids.length).toBe(2);
    const textes = ids.map((id) => canvasElement.querySelector(`#${CSS.escape(id)}`)?.textContent ?? "");
    await expect(textes.some((t) => t.includes("rapport hebdomadaire"))).toBe(true);
    await expect(textes.some((t) => t.includes("doit contenir un domaine"))).toBe(true);

    await expect(canvas.getByRole("alert")).toHaveTextContent(/doit contenir un domaine/);
  },
};

export const LaSaisieAtteintLeChamp: Story = {
  name: "Ce qu'on tape arrive dans le champ",
  args: { label: "Nom de l'agence" },
  parameters: {
    docs: {
      description: {
        story:
          "Le test le plus bête du lot, et le seul qui attrape un champ rendu " +
          "inerte par un `readOnly` oublié ou un `pointer-events: none` hérité.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const champ = canvas.getByLabelText("Nom de l'agence");
    await userEvent.type(champ, "Orly 4");
    await expect(champ).toHaveValue("Orly 4");
  },
};
