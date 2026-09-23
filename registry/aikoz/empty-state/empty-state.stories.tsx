import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { EmptyState } from "./empty-state";
import { Button } from "../button/button";
import { analyser, fondEffectif, ratio } from "../../../playground/audit";

const meta = {
  title: "Composants/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    title: "Aucun avis sur cette période",
    description:
      "Élargissez la période d'analyse ou retirez le filtre par source.",
  },
  decorators: [
    (S) => (
      <div className="w-[28rem]">
        <S />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  name: "Par défaut",
  args: {
    action: (
      <Button size="sm" variant="outline">
        Élargir à 90 jours
      </Button>
    ),
  },
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

export const UnEchecNEstPasRouge: Story = {
  name: "Un échec de chargement n'est pas rouge",
  args: {
    tone: "error",
    title: "La collecte Google Business ne répond pas",
    description:
      "Les avis affichés datent du 21 septembre. Rien n'est perdu côté serveur.",
    action: (
      <Button size="sm" variant="secondary">
        Réessayer
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Dans ce système le rouge dit une seule chose : **l'utilisateur est " +
          "refusé, ou quelque chose va être détruit**. C'est une couleur qui " +
          "qualifie un geste.\n\n" +
          "Un chargement qui échoue ne refuse rien et ne détruit rien. " +
          "Personne n'a rien fait de mal, et il n'y a rien à décider : il y a " +
          "un bouton à cliquer. Le peindre en rouge réclame une émotion là où " +
          "il faut un clic, et use la couleur qui devra servir le jour où ça " +
          "compte.\n\n" +
          "| | ce qui s'est passé | couleur |\n| --- | --- | --- |\n" +
          '| `tone="default"` | rien à montrer, c\'est normal | trait tireté |\n' +
          '| `tone="error"` | la donnée n\'est pas arrivée | **trait plein, sourd** |\n' +
          '| `Badge` `tone="error"` | un fait anormal à signaler | rouge |\n' +
          "| `AlertDialog destructive` | ça va détruire | rouge |\n\n" +
          "Ce qui distingue l'échec du vide n'est donc pas une teinte : c'est " +
          "que l'échec **porte une action de reprise**.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const cadre = canvasElement.querySelector<HTMLElement>(
      '[class*="rounded-"]',
    )!;
    const st = getComputedStyle(cadre);

    // On mesure ce qui est PEINT, pas le nom de la variable : la question
    // « est-ce rouge ? » est une question de chroma et de teinte, et elle se
    // pose sur la couleur résolue.
    for (const [quoi, css] of [
      ["le trait", st.borderTopColor],
      ["le fond", st.backgroundColor],
    ] as const) {
      const [L, C, h] = versOklch(css);
      // Un rouge de notre palette porte C >= 0.10 autour de h ≈ 25°. Un gris
      // sourd reste sous 0.03, quelle que soit sa teinte nominale.
      const rouge = C >= 0.06 && h >= 0 && h <= 60;
      await expect(
        rouge,
        `${quoi} est peint ${css} — oklch(${L.toFixed(2)} ${C.toFixed(3)} ${Math.round(h)}), ` +
          `soit un rouge. Un échec de chargement ne se peint pas en rouge.`,
      ).toBe(false);
      await expect(
        C,
        `${quoi} est peint ${css} — oklch(${L.toFixed(2)} ${C.toFixed(3)} ${Math.round(h)}).`,
      ).toBeLessThan(0.06);
    }

    // Le trait DÉLIMITE le composant : WCAG 1.4.11 le veut à 3:1 de ce qui
    // l'entoure. Renoncer au rouge ne dispense pas d'être visible — c'est
    // même là que se perdent les états « sourds ».
    //
    // `fondEffectif` et non le fond du parent : ce parent-là est transparent,
    // et la condition « si le fond existe » sautait l'assertion en silence.
    // Un audit qui ne mesure rien passe toujours.
    const fond = fondEffectif(cadre.parentElement!);
    const trait = analyser(st.borderTopColor)!;
    const r = ratio(trait, fond);
    await expect(
      r,
      `le trait est à ${r.toFixed(2)}:1 du fond qui l'entoure — WCAG 1.4.11 ` +
        `demande 3:1 pour une limite qui identifie un composant.`,
    ).toBeGreaterThanOrEqual(3);

    // Et le texte se lit sur le remplissage, qui n'est plus celui du cas
    // normal : la paire titre/fond change avec le ton, elle se remesure.
    const titre = within(canvasElement).getByText(/ne répond pas/);
    const rt = ratio(
      analyser(getComputedStyle(titre).color)!,
      analyser(st.backgroundColor)!,
    );
    await expect(
      rt,
      `le titre est à ${rt.toFixed(2)}:1 de son fond.`,
    ).toBeGreaterThanOrEqual(4.5);

    // Et la reprise est là : sans elle, l'échec est un cul-de-sac.
    await expect(
      within(canvasElement).getByRole("button", { name: "Réessayer" }),
    ).toBeVisible();
  },
};

/**
 * La couleur rendue par le navigateur → OKLCH, pour poser la question au
 * pixel plutôt qu'au nom de la variable.
 *
 * **Les deux formes existent, et c'est ce qui m'avait fait mesurer faux** :
 * `getComputedStyle` rend `oklch(0.57 0.014 260)` tel quel quand la valeur
 * est déjà en `oklch()`, et `rgb(…)` sinon. Lu comme du rgb, un `oklch()`
 * donnait un chroma de 0,318 — soit un bleu pur — sur une bordure grise.
 */
function versOklch(css: string): [number, number, number] {
  const n = css.match(/[\d.]+/g)!.map(Number);

  if (css.startsWith("oklch")) {
    const [L, C, h] = n;
    return [L, C, h ?? 0];
  }

  const [r, g, b] = n.slice(0, 3).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s2 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s2;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s2;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s2;
  const h = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return [L, Math.hypot(a, bb), h];
}
