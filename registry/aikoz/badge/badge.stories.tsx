import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Badge } from "./badge";

const meta = {
  title: "Composants/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Répondu" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut" };

export const Tons: Story = {
  name: "Les tons",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="success" icon="✓">Répondu</Badge>
      <Badge tone="warning" icon="!">À surveiller</Badge>
      <Badge tone="error" icon="✕">Critique</Badge>
      <Badge tone="info" icon="i">Info</Badge>
      <Badge tone="neutral">Neutre</Badge>
    </div>
  ),
};

export const LIconeDoubleLaCouleur: Story = {
  name: "L'icône double la couleur",
  args: { tone: "error", icon: "✕", children: "Sans réponse" },
  parameters: {
    docs: {
      description: {
        story:
          "Le glyphe n'est pas un ornement : sans lui, l'état ne tiendrait qu'à la teinte, " +
          "ce qu'interdit WCAG 1.4.1. Le voile de fond, lui, ne compte pas — mesuré à " +
          "1,19:1 sur la carte, il est décoratif.",
      },
    },
  },
};

export const LEtatNeTientPasALaCouleur: Story = {
  name: "L'état ne tient pas à la seule couleur",
  args: { tone: "warning", icon: "!", children: "3 sans réponse" },
  parameters: {
    docs: {
      description: {
        story:
          "Cinq tons, et aucun ne porte son sens par la couleur seule : " +
          "l'intitulé l'écrit, et l'icône le double pour qui balaie du " +
          "regard. En niveaux de gris, un avertissement reste un " +
          "avertissement.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText(/3 sans réponse/);
    // L'icône est décorative : c'est le texte qui porte le sens, elle ne
    // fait que le doubler visuellement.
    const icone = badge.querySelector('[aria-hidden="true"]');
    await expect(icone).not.toBeNull();
    await expect(badge).toHaveTextContent("3 sans réponse");
  },
};

export const TroisRolesPasUnSeul: Story = {
  name: "Trois rôles, pas un seul",
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["success", "warning", "error", "info", "neutral"] as const).map((t) => (
        <Badge key={t} tone={t} size="sm">
          {t}
        </Badge>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Le badge dessinait **tout** avec la couleur de texte : contour " +
          "compris, et un fond fait d'un voile à 8 % de cette même couleur. " +
          "Un texte est foncé parce qu'il doit tenir 4,5:1 ; un contour n'a " +
          "aucune raison de l'être. L'avertissement sortait donc en kaki " +
          "(#6E5100) alors que la charte porte un jaune franc.\n\n" +
          "`status.*-border` — la rampe `*.300`, **#FAD94E** pour " +
          "l'avertissement, **#EC9A84** pour l'erreur — existait dans les " +
          "quatre thèmes depuis l'origine et n'était **publié nulle part**. " +
          "Quatre couleurs de la charte qu'aucun composant ne pouvait " +
          "demander.\n\n" +
          "Cette histoire vérifie les trois rôles : le contour vient de " +
          "`-border`, le fond de `-subtle`, et seul le texte garde la couleur " +
          "de texte.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const pastilles = [...canvasElement.querySelectorAll<HTMLElement>("span")].filter(
      (s) => /rounded-full/.test(s.className) && /border/.test(s.className),
    );
    await expect(pastilles).toHaveLength(5);

    // Les QUATRE statuts. `neutral` n'a pas de rampe : il n'existe pas de
    // `status.neutral-border`, il emprunte `--muted-foreground` pour les
    // trois usages, et c'est correct — un gris n'a pas de contour à
    // distinguer de son texte.
    for (const p of pastilles.slice(0, 4)) {
      const s = getComputedStyle(p);
      // Trois couleurs DISTINCTES : si le contour retombe sur le texte, c'est
      // qu'on est revenu à l'ancien câblage.
      await expect(
        s.borderTopColor,
        `« ${p.textContent} » : le contour a la couleur du texte, donc il vient ` +
          `du rôle de TEXTE et pas du rôle de contour.`,
      ).not.toBe(s.color);
      await expect(s.backgroundColor).not.toBe(s.color);
    }
  },
};
