import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ToastProvider } from "@registry/aikoz/toast/toast";
import { TooltipProvider } from "@registry/aikoz/tooltip/tooltip";
import { DashboardComplet } from "./dashboard-complet";

/**
 * La taille des cibles, mesurée sur le rendu.
 *
 * WCAG 2.2 a ajouté le critère **2.5.8 Target Size (Minimum)**, niveau AA :
 * toute cible de pointeur fait au moins **24 × 24 px CSS**. Ce n'est pas un
 * confort, c'est un critère de conformité — et c'est celui qu'on rate le plus
 * facilement, parce qu'une cible trop petite se voit très bien et se clique
 * très bien… à la souris, sur un grand écran, quand on sait où viser.
 *
 * Il a été écrit le 22/09/2026 après une mesure qui n'aurait jamais dû
 * attendre : le **fil d'Ariane du tableau de bord offrait des cibles de 20 px
 * de haut**. La hauteur de ligne de `text-sm`, rien de plus — personne ne
 * l'avait décidée, elle était simplement tombée là. Quatre pixels sous le
 * plancher, sur un composant relu, testé et documenté.
 *
 * **Pourquoi une story et pas un script.** La taille d'une cible n'est pas
 * dans le code : elle est dans ce que le navigateur compose. `min-h-6` ne dit
 * rien si un parent en `items-center` l'écrase, si un `line-height` la dépasse
 * ou si un `padding` la porte. La seule mesure qui vaut est
 * `getBoundingClientRect()` sur le document rendu — ici, sur **la page du
 * tableau de bord elle-même**, pas sur un échantillon reconstitué pour
 * l'occasion.
 *
 * ## Les deux seuils, et pourquoi ils ne sont pas le même
 *
 * | seuil | source | portée |
 * | --- | --- | --- |
 * | **24 px** | WCAG 2.2 AA, 2.5.8 | partout, tout le temps |
 * | **44 px** | WCAG 2.2 AAA 2.5.5 · Apple HIG · *Practical UI* | au doigt |
 *
 * Le premier ne dépend pas du périphérique : il est tenu en dur dans le
 * composant. Le second se paye en densité, et cette densité est un ATOUT à la
 * souris sur un tableau de bord — d'où la variante `tactile:`
 * (`@media (pointer: coarse)`), qui agrandit les contrôles là où on les touche
 * sans rien changer là où on les vise.
 *
 * Élargir la zone en douce — un `::after` invisible plus grand que le bouton —
 * a été écarté : ça rend la cible vraie et l'affordance fausse. On vise ce
 * qu'on voit, et on touche à côté.
 *
 * ## Les exceptions du critère, et celle qu'on ne s'accorde pas
 *
 * 2.5.8 admet qu'une cible **en ligne dans une phrase** soit plus petite : sa
 * taille est contrainte par le texte qui l'entoure. Un fil d'Ariane n'est pas
 * une phrase — c'est une liste de navigation — et l'exception ne s'y applique
 * pas. C'est exactement l'erreur de raisonnement qui avait laissé passer les
 * 20 px.
 */
const meta = {
  title: "Design system/Audit des cibles",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Plancher AA — WCAG 2.2, 2.5.8. Il ne se négocie pas. */
const PLANCHER = 24;
/** Confort au doigt — AAA 2.5.5, Apple HIG, *Practical UI*. */
const CONFORT = 44;

const SELECTEUR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([type=hidden]):not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[role="button"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="option"]',
  '[role="menuitem"]',
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/**
 * Les cibles en dette : sous le confort de 44 px, au-dessus du plancher.
 *
 * La clé est le nom accessible, la valeur la hauteur mesurée. Le cliquet
 * marche dans les deux sens, comme celui de l'audit de contraste : une cible
 * en dette qui RÉTRÉCIT échoue, et une cible en dette qui atteint 44 échoue
 * aussi, pour forcer à retirer sa ligne. La liste ne peut que rétrécir.
 *
 * Toutes portent `tactile:` : elles font 44 px ou plus au doigt. Ce qui reste
 * ici est donc la densité assumée à la souris, pas un oubli.
 */
const DETTES: Record<string, number> = {
  // Fil d'Ariane — 24 px, le plancher AA exactement. Le grandir à la souris
  // ferait respirer une ligne qui doit rester discrète au-dessus du titre.
  "Accueil": 24,
  "Écoute client": 24,
  // Bascules de marque de l'en-tête — des puces, pas des boutons d'action.
  "Aikoz": 26,
  "ADP by Aikoz": 26,
  "Extime": 26,
  "Generali": 26,
  // Bascule de thème — carrée, 32 px, à côté de contrôles de 26.
  "☾": 32,
  // « Exporter » — `Button` en taille `sm` : la densité d'une barre d'outils.
  "Exporter": 39,
  // Bascule Graphique/Tableau de `ChartFrame` — elle vit DANS la légende du
  // graphique ; à 44 px elle pèserait plus que le titre qu'elle surmonte.
  "Graphique": 32,
  "Tableau": 32,
};

interface Mesure {
  nom: string;
  largeur: number;
  hauteur: number;
  balise: string;
}

function mesurer(racine: HTMLElement) {
  const vues: Mesure[] = [];
  for (const el of Array.from(racine.querySelectorAll<HTMLElement>(SELECTEUR))) {
    const r = el.getBoundingClientRect();
    // Une cible de taille nulle n'est pas petite : elle est absente du rendu
    // (panneau replié, boîte de dialogue fermée). La mesurer n'aurait pas de
    // sens — on ne peut pas viser ce qui n'est pas là.
    if (r.width === 0 || r.height === 0) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none") continue;
    // Le champ natif d'une case à cocher ou d'un bouton radio est souvent
    // masqué sous une pastille dessinée (`ChoiceCard`, `SlotPicker`) : la
    // cible réelle est l'étiquette qui l'englobe, et c'est elle qu'on mesure.
    if (
      (el as HTMLInputElement).type === "checkbox" ||
      (el as HTMLInputElement).type === "radio"
    ) {
      const etiquette = el.closest("label");
      if (etiquette) {
        const re = etiquette.getBoundingClientRect();
        vues.push({
          nom: (etiquette.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40),
          largeur: re.width,
          hauteur: re.height,
          balise: "label>" + el.tagName.toLowerCase(),
        });
        continue;
      }
    }
    vues.push({
      nom:
        (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 40) || `<${el.tagName.toLowerCase()}>`,
      largeur: r.width,
      hauteur: r.height,
      balise: el.tagName.toLowerCase(),
    });
  }
  return vues;
}

export const ToutesLesCibles: Story = {
  name: "Toutes les cibles du tableau de bord, mesurées sur le rendu",
  parameters: {
    docs: {
      description: {
        story:
          "Chaque élément interactif de la page, mesuré par " +
          "`getBoundingClientRect()`. Le test échoue si une seule cible tombe " +
          "sous **24 × 24 px** — le critère WCAG 2.2 AA 2.5.8.\n\n" +
          "Il est né d'une mesure : le fil d'Ariane offrait des cibles de " +
          "**20 px de haut**, la hauteur de ligne de `text-sm`. Personne ne " +
          "l'avait décidée. Quatre pixels sous le plancher, sur un composant " +
          "relu, testé et documenté.\n\n" +
          "Le second seuil — **44 px**, le confort au doigt — est tenu par la " +
          "variante `tactile:` (`@media (pointer: coarse)`), qui agrandit les " +
          "contrôles là où on les touche sans rien coûter là où on les vise. " +
          "Une cible qui reste sous 44 à la souris doit figurer dans `DETTES`, " +
          "avec un cliquet à double sens : elle ne peut ni rétrécir, ni " +
          "atteindre 44 sans que sa ligne disparaisse.",
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
    const vues = mesurer(canvasElement);

    // Une page qui ne rend rien passerait tous les seuils. On vérifie d'abord
    // qu'il y a bien quelque chose à mesurer.
    await expect(vues.length).toBeGreaterThan(20);

    const echecs: string[] = [];
    // La plus petite mesure de CHAQUE libellé, dette ou non. Sans elle, une
    // dette qui atteint le confort est indistinguable d'une dette dont le
    // libellé a disparu : les deux sortent de la boucle sans entrer dans
    // cette carte, et le diagnostic rendu est alors le mauvais.
    const pireVue = new Map<string, number>();

    for (const { nom, largeur, hauteur, balise } of vues) {
      const petit = Math.min(largeur, hauteur);
      pireVue.set(nom, Math.min(pireVue.get(nom) ?? Infinity, petit));
      if (petit < PLANCHER) {
        echecs.push(
          `« ${nom} » (${balise}) : ${largeur.toFixed(0)} × ${hauteur.toFixed(0)} px, ` +
            `sous le plancher de ${PLANCHER} px du critère WCAG 2.2 AA 2.5.8.`,
        );
        continue;
      }
      if (petit >= CONFORT) continue;

      const dette = DETTES[nom];
      if (dette === undefined) {
        echecs.push(
          `« ${nom} » (${balise}) : ${largeur.toFixed(0)} × ${hauteur.toFixed(0)} px, ` +
            `sous le confort de ${CONFORT} px et absente de DETTES. Soit le ` +
            `contrôle grandit, soit sa densité est assumée et inscrite — mais ` +
            `pas laissée au hasard.`,
        );
      } else if (petit < dette) {
        echecs.push(
          `« ${nom} » : ${petit.toFixed(0)} px, en recul sur la dette reconnue de ` +
            `${dette} px. Une cible en dette a le droit de ne pas tenir le ` +
            `confort, pas de rétrécir.`,
        );
      }
    }

    for (const [nom, seuil] of Object.entries(DETTES)) {
      const vue = pireVue.get(nom);
      if (vue === undefined) {
        echecs.push(
          `« ${nom} » est inscrite dans DETTES mais n'a pas été mesurée sur la ` +
            `page — le libellé a changé, ou le contrôle a disparu. Une dette ` +
            `qu'on ne mesure plus ne protège plus rien : retirer sa ligne.`,
        );
      } else if (vue >= CONFORT) {
        echecs.push(
          `« ${nom} » atteint maintenant ${vue.toFixed(0)} px (dette : ${seuil} px) : ` +
            `retirer sa ligne de DETTES. La dette ne doit que rétrécir.`,
        );
      }
    }

    if (echecs.length) {
      throw new Error(
        `${echecs.length} cible(s) hors seuil sur ${vues.length} mesurées :\n  - ` +
          echecs.join("\n  - "),
      );
    }
  },
};
