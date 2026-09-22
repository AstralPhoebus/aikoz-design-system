import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ToastProvider } from "@registry/aikoz/toast/toast";
import { TooltipProvider } from "@registry/aikoz/tooltip/tooltip";
import { DashboardComplet } from "./dashboard-complet";

/**
 * L'épaisseur des traits d'icône, mesurée sur le rendu.
 *
 * Des icônes d'épaisseurs différentes sur un même écran se lisent comme des
 * icônes de familles différentes : l'une paraît plus importante que l'autre
 * sans que rien ne le justifie, et l'ensemble a l'air emprunté à deux
 * bibliothèques.
 *
 * ## Le piège : `strokeWidth` n'est pas en pixels
 *
 * Il est en unités du **viewBox**. Une même valeur donne donc une épaisseur
 * différente selon le rapport entre le viewBox et la taille d'affichage :
 *
 * ```
 * épaisseur rendue = strokeWidth × taille affichée ÷ côté du viewBox
 * ```
 *
 * Mesuré sur le tableau de bord le 22/09/2026, les icônes déclaraient 1,75,
 * 1,5 et 2 — trois valeurs proches, qui avaient l'air d'un simple manque de
 * rigueur. Elles rendaient **1,17 px, 1,5 px et 1,67 px** : 43 % d'écart. Les
 * icônes du menu latéral (viewBox 24, affichées en 16 px) paraissaient
 * nettement plus légères que celles de la barre d'outils.
 *
 * Comparer les valeurs DÉCLARÉES aurait conclu « presque pareil ». Seul le
 * rendu dit la vérité — encore une fois.
 *
 * ## La cible
 *
 * **1,5 px rendus**, la valeur que tenait déjà la moitié du système. Les
 * autres s'y sont alignées en appliquant la formule : viewBox 24 affiché en
 * 16 px demande 2,25 ; en 20 px, 1,8.
 */
const meta = {
  title: "Design system/Audit des icônes",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Épaisseur de trait visée, en pixels rendus. */
const CIBLE = 1.5;
/**
 * Tolérance. Une icône ne peut pas toujours tomber pile : le rapport
 * viewBox/taille ne donne pas forcément une valeur ronde, et un dixième de
 * pixel ne se voit pas. Un quart de pixel, si.
 */
const TOLERANCE = 0.2;

/**
 * Un viewBox plus grand que ça n'est pas une icône : c'est un graphique, une
 * carte, un logo. Ces tracés-là ont leurs propres règles d'épaisseur — le
 * contour d'un département n'est pas un pictogramme.
 */
const VIEWBOX_MAX = 64;

interface Trait {
  px: number;
  viewBox: number;
  taille: number;
  ou: string;
}

function mesurer(racine: HTMLElement): Trait[] {
  const traits: Trait[] = [];
  for (const svg of Array.from(racine.querySelectorAll("svg"))) {
    const vb = (svg.getAttribute("viewBox") ?? "").split(/\s+/).map(Number);
    const r = svg.getBoundingClientRect();
    if (vb.length !== 4 || !r.width || vb[2] > VIEWBOX_MAX) continue;

    // Seuls les tracés qui PEIGNENT un trait comptent. `strokeWidth` vaut 1
    // par défaut même sur un chemin en `stroke: none` : sans ce filtre,
    // l'audit mesurait les logos de plateformes — des aplats sans le moindre
    // trait — et réclamait de les épaissir. Même piège que l'audit du focus,
    // où un contour transparent se faisait passer pour un indicateur.
    const peint = (el: Element) => {
      const s = getComputedStyle(el);
      return (
        s.stroke !== "none" &&
        s.stroke !== "" &&
        !/[,/]\s*0(?:\.0+)?\s*\)/.test(s.stroke) &&
        parseFloat(s.strokeWidth) > 0
      );
    };
    const epaisseurs = [svg, ...Array.from(svg.querySelectorAll("*"))]
      .filter(peint)
      .map((p) => parseFloat(getComputedStyle(p).strokeWidth));
    if (!epaisseurs.length) continue; // une icône en aplat n'a pas de trait

    const echelle = r.width / vb[2];
    const parent = svg.closest("button, a, li, th, td, section, div[class]");
    traits.push({
      px: Math.round(Math.max(...epaisseurs) * echelle * 100) / 100,
      viewBox: vb[2],
      taille: Math.round(r.width),
      ou:
        (parent as HTMLElement | null)?.innerText?.trim().replace(/\s+/g, " ").slice(0, 28) ||
        "—",
    });
  }
  return traits;
}

export const UneSeuleEpaisseurDeTrait: Story = {
  name: "Une seule épaisseur de trait, mesurée sur le rendu",
  parameters: {
    docs: {
      description: {
        story:
          "Des icônes d'épaisseurs différentes sur un même écran se lisent " +
          "comme des icônes de familles différentes.\n\n" +
          "**`strokeWidth` n'est pas en pixels** : il est en unités du " +
          "viewBox. `épaisseur rendue = strokeWidth × taille ÷ côté du " +
          "viewBox`. Les icônes du tableau de bord déclaraient 1,75, 1,5 et 2 " +
          "— trois valeurs proches, qui avaient l'air d'un simple manque de " +
          "rigueur. Elles rendaient **1,17 px, 1,5 px et 1,67 px** : 43 % " +
          "d'écart, et les icônes du menu latéral paraissaient nettement plus " +
          "légères que celles de la barre d'outils.\n\n" +
          "Comparer les valeurs déclarées aurait conclu « presque pareil ».\n\n" +
          "Les tracés de graphique, de carte et de logo sont hors champ : un " +
          "contour de département n'est pas un pictogramme, et il a ses " +
          "propres règles d'épaisseur.",
      },
    },
  },
  render: () => (
    <ToastProvider>
      <TooltipProvider>
        <DashboardComplet />
      </TooltipProvider>
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    const traits = mesurer(canvasElement);
    // Une page sans icône passerait tous les seuils.
    await expect(traits.length).toBeGreaterThan(8);

    const hors = traits.filter((t) => Math.abs(t.px - CIBLE) > TOLERANCE);
    if (hors.length) {
      const groupes = new Map<number, Trait[]>();
      for (const t of hors) groupes.set(t.px, [...(groupes.get(t.px) ?? []), t]);
      throw new Error(
        `${hors.length} icône(s) hors de l'épaisseur du système sur ` +
          `${traits.length} mesurées — cible ${CIBLE} px ± ${TOLERANCE} :\n  - ` +
          [...groupes.entries()]
            .map(
              ([px, l]) =>
                `${px} px rendus (${l.length}) — viewBox ${l[0].viewBox} affiché ` +
                `en ${l[0].taille} px, près de « ${l[0].ou} ». Pour ${CIBLE} px, ` +
                `déclarer strokeWidth = ${
                  Math.round((CIBLE * l[0].viewBox) / l[0].taille * 100) / 100
                }.`,
            )
            .join("\n  - "),
      );
    }
  },
};
