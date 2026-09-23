/**
 * Audit de contraste sur le RENDU, pas sur les tokens.
 *
 * Les audits token-à-token de ce projet ont laissé passer des défauts réels,
 * pour une raison de fond : ils comparent un rôle à la surface qu'on leur
 * désigne, alors que le navigateur, lui, compose. Un Badge pose un voile à
 * 8 % sur une carte ; le texte se lit contre le RÉSULTAT, pas contre la carte
 * ni contre le voile. C'est ce composite qui a révélé que `warning-text`
 * tombait à 4,25:1 en registre marketing — la carte marketing vaut
 * oklch(0.97) et non le blanc pur du produit, et le rôle avait été calé
 * contre celle du produit.
 *
 * ── Deux pièges de calcul, tous deux rencontrés ici ──────────────────────
 *
 * 1. `getComputedStyle` rend de l'OKLCH VERBATIM. Lire ses trois nombres
 *    comme du RGB donne des ratios absurdes — 1,04:1 sur une paire qui en
 *    vaut 11,87.
 *
 * 2. La matrice OKLab → sRGB produit du LINÉAIRE. Lui appliquer ensuite la
 *    linéarisation de WCAG, c'est linéariser deux fois : la même paire
 *    ressortait à 3,09 au lieu de 6,73. Il faut encoder en gamma à la sortie
 *    de la matrice, pour rendre les valeurs comparables à celles de `rgb()`,
 *    et ne linéariser qu'au moment de la luminance.
 *
 * ── Et un piège de mesure ────────────────────────────────────────────────
 *
 * Le playground anime ses changements de thème sur 200 ms. Auditer juste
 * après une bascule mesure des couleurs EN COURS d'interpolation : le
 * premier passage annonçait 95 échecs fantômes. `figerLesTransitions()` doit
 * être appelé avant toute bascule.
 */

export interface EchecContraste {
  texte: string;
  ratio: number;
  seuil: number;
  taillePx: number;
  couleur: string;
  fond: string;
  selecteur: string;
}

type RVBA = [number, number, number, number];

/** sRGB linéaire → sRGB encodé en gamma. */
const gamma = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

/** OKLCH → sRGB encodé en gamma, borné au gamut. */
function oklchVersSrgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => gamma(Math.min(1, Math.max(0, v)))) as [number, number, number];
}

/** Analyse une couleur CSS calculée. Gère `oklch()` et `rgb()/rgba()`. */
export function analyser(css: string): RVBA | null {
  const s = String(css);
  const ok = s.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?/
  );
  if (ok) {
    const [r, v, b] = oklchVersSrgb(+ok[1], +ok[2], +ok[3]);
    let alpha = 1;
    if (ok[4]) alpha = ok[4].endsWith("%") ? parseFloat(ok[4]) / 100 : +ok[4];
    return [r, v, b, alpha];
  }
  const rgb = s.match(/rgba?\(([^)]+)\)/);
  if (!rgb) return null;
  const p = rgb[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat);
  return [p[0] / 255, p[1] / 255, p[2] / 255, p.length > 3 ? p[3] : 1];
}

const lineariser = (c: number) =>
  c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

export function luminance(c: RVBA | [number, number, number]): number {
  return (
    0.2126 * lineariser(c[0]) + 0.7152 * lineariser(c[1]) + 0.0722 * lineariser(c[2])
  );
}

export function ratio(a: RVBA, b: RVBA): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Compose `dessus` sur `dessous`. Comme le navigateur : en espace gamma. */
function composer(dessus: RVBA, dessous: RVBA): RVBA {
  return [
    dessus[0] * dessus[3] + dessous[0] * (1 - dessus[3]),
    dessus[1] * dessus[3] + dessous[1] * (1 - dessus[3]),
    dessus[2] * dessus[3] + dessous[2] * (1 - dessus[3]),
    1,
  ];
}

/**
 * Fond réellement perçu sous un élément : on remonte les ancêtres en
 * composant chaque fond semi-transparent, jusqu'au premier opaque. C'est
 * exactement ce que fait le navigateur, et ce qu'un audit de tokens ignore.
 */
export function fondEffectif(el: Element): RVBA {
  let courant: Element | null = el;
  let accumule: RVBA | null = null;
  while (courant) {
    const c = analyser(getComputedStyle(courant).backgroundColor);
    if (c && c[3] > 0) {
      accumule = accumule ? composer(accumule, c) : c;
      if (accumule[3] >= 0.999) return accumule;
    }
    courant = courant.parentElement;
  }
  return accumule ?? [1, 1, 1, 1];
}

function chemin(el: Element): string {
  const cls = String(el.className).split(/\s+/).slice(0, 2).join(".");
  return el.tagName.toLowerCase() + (cls ? "." + cls : "");
}

/** Coupe transitions et animations. À appeler AVANT toute bascule de thème. */
export function figerLesTransitions(): void {
  if (document.getElementById("aikoz-audit-gel")) return;
  const st = document.createElement("style");
  st.id = "aikoz-audit-gel";
  st.textContent =
    "*,*::before,*::after{transition:none !important;animation:none !important}";
  document.head.appendChild(st);
}

/**
 * Parcourt le document et renvoie chaque texte visible sous son seuil.
 *
 * Le seuil suit WCAG 1.4.3 : 3:1 pour le grand texte (24 px, ou 18,66 px en
 * gras), 4,5:1 sinon. Les éléments en `sr-only` sont ignorés — ils ne sont
 * pas vus, donc pas concernés par le contraste.
 */
export function auditerContraste(racine: ParentNode = document.body): EchecContraste[] {
  const echecs: EchecContraste[] = [];
  for (const el of racine.querySelectorAll("*")) {
    if (String(el.className).includes("sr-only")) continue;
    const texte = [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent?.trim())
      .map((n) => n.textContent!.trim())
      .join(" ");
    if (!texte) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    if (!(el as HTMLElement).offsetParent && cs.position !== "fixed") continue;

    const avant = analyser(cs.color);
    if (!avant) continue;
    const fond = fondEffectif(el);
    const r = ratio(composer(avant, fond), fond);

    const px = parseFloat(cs.fontSize);
    const gras = parseInt(cs.fontWeight) >= 700;
    const seuil = px >= 24 || (px >= 18.66 && gras) ? 3 : 4.5;

    // 0,005 de tolérance : un ratio affiché 4,50 ne doit pas échouer sur une
    // décimale de calcul flottant.
    if (r < seuil - 0.005) {
      echecs.push({
        texte: texte.slice(0, 48),
        ratio: +r.toFixed(2),
        seuil,
        taillePx: Math.round(px),
        couleur: cs.color,
        fond: `rgb(${fond.slice(0, 3).map((x) => Math.round(x * 255)).join(",")})`,
        selecteur: chemin(el),
      });
    }
  }
  return echecs;
}

export const COMBINAISONS = [
  { nom: "produit clair", dark: false, marketing: false },
  { nom: "produit sombre", dark: true, marketing: false },
  { nom: "marketing clair", dark: false, marketing: true },
  { nom: "marketing sombre", dark: true, marketing: true },
] as const;

/**
 * Audite les quatre combinaisons registre × thème et restaure l'état de
 * départ. Le rendu doit être figé, sinon les bascules sont mesurées en
 * cours d'interpolation.
 */
export function auditerToutesCombinaisons(): Record<string, EchecContraste[]> {
  figerLesTransitions();
  const H = document.documentElement;
  const darkAvant = H.classList.contains("dark");
  const registreAvant = H.getAttribute("data-register");

  const resultat: Record<string, EchecContraste[]> = {};
  for (const c of COMBINAISONS) {
    H.classList.toggle("dark", c.dark);
    if (c.marketing) H.setAttribute("data-register", "marketing");
    else H.removeAttribute("data-register");
    // force un recalcul de style avant de lire
    void document.body.offsetHeight;
    resultat[c.nom] = auditerContraste();
  }

  H.classList.toggle("dark", darkAvant);
  if (registreAvant) H.setAttribute("data-register", registreAvant);
  else H.removeAttribute("data-register");
  return resultat;
}
