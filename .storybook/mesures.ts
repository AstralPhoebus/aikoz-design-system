/**
 * Les trois mesures de rendu, appliquées à CHAQUE histoire.
 *
 * `AuditCibles`, `AuditFocus` et `AuditIcones` ne tournaient que sur le
 * tableau de bord : **33 composants sur 53** étaient couverts. Les vingt
 * autres — dont `Combobox`, `Checkbox`, `AlertDialog` et `Pagination`,
 * livrés la veille — n'étaient vus par aucun des trois.
 *
 * Élargir la page d'audit aurait été le mauvais réflexe : il aurait fallu y
 * ajouter chaque composant à la main, et c'est exactement le genre de liste
 * qui décroche. Les histoires, elles, existent déjà pour tous — une par
 * comportement, et le lanceur les rend toutes, dans les deux thèmes.
 *
 * Ce qui est mesuré ici est donc le MINIMUM vérifiable partout, sans rien
 * savoir du composant :
 *
 *  - toute cible de pointeur fait au moins 24 × 24 px (WCAG 2.2 AA 2.5.8) ;
 *  - tout `<svg>` est masqué ou nommé ;
 *  - aucun débordement horizontal de la page.
 *
 * Le focus n'y est pas : il demande de vraies frappes clavier, donc un `play`,
 * et il reste mesuré par `AuditFocus` sur la page complète.
 */

/** Plancher AA — WCAG 2.2, 2.5.8. */
const PLANCHER = 24;

const CIBLES = [
  "a[href]",
  "button:not([disabled])",
  "input:not([type=hidden]):not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[role="button"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="option"]',
  '[role="menuitem"]',
].join(", ");

/** Une balise `<svg>`, même écrite sur plusieurs lignes. */
const ETIQUETTE = /aria-hidden|role="img"|aria-label|aria-labelledby/;

function nommer(el: Element): string {
  const e = el as HTMLElement;
  return (
    (e.innerText || e.getAttribute("aria-label") || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 32) || `<${el.tagName.toLowerCase()}>`
  );
}

/**
 * Rend les défauts trouvés dans un arbre rendu, sans rien supposer du
 * composant. Une liste vide vaut « rien à dire ».
 */
export function mesurerLeRendu(racine: HTMLElement): string[] {
  const echecs: string[] = [];

  for (const el of Array.from(racine.querySelectorAll<HTMLElement>(CIBLES))) {
    const r = el.getBoundingClientRect();
    // Une cible de taille nulle n'est pas petite : elle est absente du rendu
    // (panneau replié, dialogue fermé). On ne peut pas viser ce qui n'est
    // pas là.
    if (r.width === 0 || r.height === 0) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none") continue;
    // Un élément d'un pixel n'est pas une cible trop petite : il est CACHÉ
    // par construction et se révèle au focus — c'est le motif `sr-only` du
    // lien d'évitement. Le mesurer au repos accuse un composant qui fait
    // exactement ce qu'il faut.
    if (r.width <= 1 && r.height <= 1) continue;
    // Le champ natif d'une case ou d'un radio est masqué sous une pastille
    // dessinée : la cible réelle est l'étiquette qui l'englobe.
    const type = (el as HTMLInputElement).type;
    if (type === "checkbox" || type === "radio") continue;
    if (Math.min(r.width, r.height) < PLANCHER) {
      echecs.push(
        `« ${nommer(el)} » : ${Math.round(r.width)} × ${Math.round(r.height)} px, ` +
          `sous le plancher de ${PLANCHER} px du critère WCAG 2.2 AA 2.5.8.`,
      );
    }
  }

  for (const svg of Array.from(racine.querySelectorAll("svg"))) {
    if (ETIQUETTE.test(svg.outerHTML.slice(0, svg.outerHTML.indexOf(">") + 1))) continue;
    if (svg.getAttribute("aria-hidden") || svg.getAttribute("aria-label")) continue;
    if (svg.getAttribute("role") === "img") continue;
    // Un `<svg>` DANS un sous-arbre déjà masqué l'est aussi : c'est le cas
    // des tracés que recharts génère à l'intérieur d'un conteneur
    // `aria-hidden`, où le tableau équivalent porte l'information. Regarder
    // la seule balise accusait `LineChart` et le tableau de bord à tort.
    if (svg.closest('[aria-hidden="true"]')) continue;
    echecs.push(
      `un \`<svg>\` sans \`aria-hidden\`, \`role="img"\` ni libellé. Un ` +
        `pictogramme décoratif se masque : sans ça, un lecteur d'écran ` +
        `annonce « graphique » au milieu d'une phrase.`,
    );
  }

  const d = document.documentElement;
  const debord = d.scrollWidth - d.clientWidth;
  if (debord > 1) {
    echecs.push(
      `la page déborde de ${debord} px à l'horizontale. Un contenu large ` +
        `défile dans SON conteneur, jamais en poussant la page — et un ` +
        `\`overflow-x-auto\` sans \`min-w-0\` ne contient rien.`,
    );
  }

  return echecs;
}
