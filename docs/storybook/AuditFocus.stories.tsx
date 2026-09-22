import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ToastProvider } from "@registry/aikoz/toast/toast";
import { TooltipProvider } from "@registry/aikoz/tooltip/tooltip";
import { DashboardComplet } from "./dashboard-complet";

/**
 * L'indicateur de focus, mesuré au clavier.
 *
 * WCAG 2.2 **2.4.7 Focus Visible** (AA) : tout élément qui peut recevoir le
 * focus au clavier doit le montrer. C'est le critère dont dépend entièrement
 * la navigation sans souris — sans indicateur, l'utilisateur ne sait pas où il
 * est, et tabuler revient à avancer les yeux fermés.
 *
 * Le design system pose des classes `focus-visible:ring-2` un peu partout.
 * Rien ne vérifiait qu'elles PRODUISENT quelque chose : une classe absente du
 * CSS généré, un `outline-none` posé sans anneau derrière, un composant qui
 * oublie la paire — tout cela se lit correctement dans le source et ne rend
 * rien à l'écran.
 *
 * ## Pourquoi ça ne se mesure qu'au vrai clavier
 *
 * `:focus-visible` n'est pas `:focus`. Le navigateur applique une
 * HEURISTIQUE : il montre l'anneau quand le focus vient du clavier, et le
 * cache quand il vient d'un clic — c'est tout l'intérêt du sélecteur, et
 * c'est pour ça qu'on l'a préféré à `:focus`.
 *
 * Conséquence : un `element.focus()` appelé depuis un script ne déclenche
 * rien. Le premier jet de cet audit a été fait comme ça, dans la console du
 * navigateur — il a trouvé **30 éléments muets sur 30**, ce qui aurait dû
 * sauter aux yeux comme un défaut de la MESURE et non du système. Un audit
 * qui accuse tout n'accuse rien.
 *
 * D'où le `userEvent.tab()` : le lanceur de tests pilote un vrai navigateur
 * et envoie de vraies frappes. C'est la seule façon de voir ce que voit
 * quelqu'un qui tabule.
 */
const meta = {
  title: "Design system/Audit du focus",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Une couleur totalement transparente ne se voit pas.
 *
 * Ça a l'air d'une évidence et c'est le piège qui a rendu le premier
 * contrôle inutile. `outline-none` de Tailwind ne supprime pas le contour :
 * il pose `outline: 2px solid transparent`. Un composant privé de son anneau
 * mais gardant son `focus-visible:outline-none` voyait donc son `outlineColor`
 * ET son `outlineWidth` changer au focus — l'audit comptait ça comme un
 * indicateur et laissait passer un bouton parfaitement muet à l'écran.
 */
function invisible(couleur: string): boolean {
  if (!couleur || couleur === "transparent" || couleur === "none") return true;
  // `rgba(r, g, b, 0)` et `oklch(L C H / 0)` — l'alpha en dernière position.
  return /[,/]\s*0(?:\.0+)?\s*\)/.test(couleur);
}

/**
 * Ce qui se VOIT de l'état d'un élément.
 *
 * Les contributions transparentes sont neutralisées : elles n'entrent pas
 * dans l'empreinte, donc leur apparition ne peut pas se faire passer pour un
 * indicateur.
 */
function empreinte(el: Element): string {
  const s = getComputedStyle(el);
  const contour =
    s.outlineStyle === "none" ||
    parseFloat(s.outlineWidth) === 0 ||
    invisible(s.outlineColor)
      ? "—"
      : `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}`;
  // Une ombre portée dont la couleur est transparente ne dessine rien non
  // plus : on ne garde que les couches qui peignent.
  const ombre =
    s.boxShadow === "none"
      ? "—"
      : s.boxShadow
          .split(/,(?![^(]*\))/)
          .filter((c) => !invisible(c.trim()))
          .join(",") || "—";
  return [
    contour,
    ombre,
    invisible(s.borderColor) ? "—" : s.borderColor,
    invisible(s.backgroundColor) ? "—" : s.backgroundColor,
    s.color,
    s.textDecorationLine,
  ].join("|");
}

function nommer(el: Element): string {
  const e = el as HTMLElement;
  return (
    (e.innerText || e.getAttribute("aria-label") || e.getAttribute("title") || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 36) || `<${el.tagName.toLowerCase()}>`
  );
}

export const ToutCeQuiPrendLeFocusLeMontre: Story = {
  name: "Tout ce qui prend le focus le montre",
  parameters: {
    docs: {
      description: {
        story:
          "On tabule dans la page, pour de vrai, et on regarde si quelque " +
          "chose change à l'écran. Le test échoue si un élément reçoit le " +
          "focus sans rien montrer — WCAG 2.2 **2.4.7 Focus Visible**, " +
          "niveau AA.\n\n" +
          "**`:focus-visible` n'est pas `:focus`.** Le navigateur applique une " +
          "heuristique : l'anneau apparaît quand le focus vient du clavier et " +
          "reste caché quand il vient d'un clic. Un `element.focus()` appelé " +
          "depuis un script ne déclenche donc rien — le premier jet de cet " +
          "audit, fait dans la console, a trouvé *30 éléments muets sur 30*. " +
          "Un audit qui accuse tout n'accuse rien.\n\n" +
          "D'où `userEvent.tab()` : le lanceur de tests pilote un vrai " +
          "navigateur et envoie de vraies frappes. C'est la seule façon de " +
          "voir ce que voit quelqu'un qui navigue au clavier.",
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
  play: async ({ userEvent }) => {
    // L'empreinte AU REPOS de chaque élément, relevée avant toute tabulation :
    // c'est la référence à laquelle comparer une fois le focus posé.
    const repos = new Map<Element, string>();
    const candidats = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), ' +
          'select, textarea, summary, [role="tab"], [role="switch"], ' +
          '[tabindex]:not([tabindex="-1"])',
      ),
    ).filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    for (const e of candidats) repos.set(e, empreinte(e));
    await expect(candidats.length).toBeGreaterThan(20);

    const muets: string[] = [];
    const vus = new Set<Element>();
    // Autant de tabulations que d'éléments, plus une marge : la boucle
    // s'arrête d'elle-même si le focus revient au point de départ.
    for (let i = 0; i < candidats.length + 5; i++) {
      await userEvent.tab();
      const actif = document.activeElement;
      if (!actif || actif === document.body) break;
      if (vus.has(actif)) break;
      vus.add(actif);
      const avant = repos.get(actif);
      // Un élément focusable qui n'était pas dans la liste (un piège du
      // navigateur, un conteneur défilant) n'a pas de référence au repos :
      // on ne peut rien en dire, on ne l'invente pas.
      if (avant === undefined) continue;
      if (empreinte(actif) === avant) {
        muets.push(
          `« ${nommer(actif)} » (${actif.tagName.toLowerCase()}) prend le focus ` +
            `au clavier sans que rien ne change à l'écran.`,
        );
      }
    }

    // La boucle a-t-elle vraiment tabulé ? Si le focus n'a pas bougé, le test
    // passerait en ne mesurant rien — le défaut le plus discret d'un audit.
    await expect(vus.size).toBeGreaterThan(10);

    if (muets.length) {
      throw new Error(
        `${muets.length} élément(s) sans indicateur de focus sur ${vus.size} ` +
          `visités — WCAG 2.2 AA 2.4.7 :\n  - ${muets.join("\n  - ")}`,
      );
    }
  },
};
