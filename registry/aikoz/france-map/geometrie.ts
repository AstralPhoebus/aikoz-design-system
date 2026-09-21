/**
 * La France en chemins SVG — régions et départements de métropole.
 *
 * **Fichier GÉNÉRÉ. Ne pas éditer à la main.** Il est produit par
 * `scripts/carte-france.py`, qui projette les géométries une fois pour toutes
 * en Lambert-93 (EPSG:2154), la projection officielle française.
 *
 * Pré-projeter est le point : le composant n'embarque **aucune bibliothèque
 * géographique**, ne calcule rien à l'affichage, et rend la même chose
 * partout. Les GeoJSON source pèsent 776 Ko ; ce fichier en pèse une fraction
 * et remplace aussi la dépendance de projection.
 *
 * Les coordonnées vivent dans une boîte de 1000 × 929.9 unités, axe Y vers le
 * bas, simplifiées (Douglas-Peucker, tolérance 1,2 unité) et arrondies à
 * l'unité — un peu plus d'un kilomètre au sol, un demi-pixel à l'écran.
 *
 * Le `code` est le code INSEE : « 11 » pour l'Île-de-France, « 75 » pour
 * Paris. C'est lui qui relie la carte aux données.
 *
 * Source : france-geojson (Grégoire David), versions simplifiées, dérivées
 * d'ADMIN EXPRESS de l'IGN — Licence Ouverte / Open Licence (Etalab).
 * https://github.com/gregoiredavid/france-geojson
 */

export interface ZoneCarte {
  /** Code INSEE — « 11 » Île-de-France, « 75 » Paris. */
  code: string;
  nom: string;
  niveau: "region" | "departement";
  /** Attribut `d` d'un `<path>`, déjà projeté. */
  d: string;
}

/** La boîte commune aux deux niveaux : passer de l'un à l'autre ne saute pas. */
export const BOITE = { largeur: 1000, hauteur: 929.9 } as const;

export const REGIONS: ZoneCarte[] = [
  { code: "11", nom: "Île-de-France", niveau: "region", d: "M498 196l3 -3l8 5l2 -3l4 2l13 -1l1 -4l6 2l0 8l6 5l1 3l2 -1l2 4l2 -2l1 5l5 4l2 -2l0 3l-4 1l1 3l-2 0l-1 2l5 2l0 5l-2 3l7 4l-5 5l-1 4l-3 0l2 3l-3 2l1 8l-3 0l0 2l-20 1l-2 5l1 4l-2 6l-2 0l-3 4l-7 4l-2 -4l-3 1l1 1l-4 2l-16 -1l2 -3l1 1l1 -4l-3 -6l-3 0l-1 -6l-3 1l-2 -2l-2 2l-6 -3l-3 3l-12 2l0 -11l-3 -1l0 -5l-4 2l-4 -3l-2 -4l1 -4l-5 -3l0 -3l-3 0l-4 -5l1 -3l-2 -1l3 -4l-3 -4l0 -7l-2 -1l0 -5l-2 -1l-4 -11l1 -2l1 1l8 -2l7 -15l3 5l2 -1l6 3l8 -2l4 -3l2 2l8 1l2 3l3 -3l18 10Z" },
  { code: "24", nom: "Centre-Val de Loire", niveau: "region", d: "M516 348l4 8l-4 11l7 6l3 13l0 7l4 4l-2 19l-1 3l-5 -1l-14 8l-3 -2l-6 8l-3 0l2 11l-5 2l-3 -1l-9 2l-5 6l0 3l-6 -1l-7 2l-7 -3l-11 1l-1 -3l-4 1l1 2l-2 4l-3 -3l-3 3l-2 -2l-4 1l-2 -3l-7 7l-4 -5l-4 3l-6 0l0 -2l-2 0l2 -4l-4 -2l0 -5l-4 -4l-4 0l-1 -3l-6 -3l-2 -3l3 -6l-8 -10l0 -3l-7 -8l0 -7l-5 -3l-4 0l3 4l-7 0l-4 3l-5 -2l-3 2l-1 -13l-2 1l-2 -2l-2 1l-2 -2l1 -1l-1 -3l-2 1l-5 -2l-1 -4l2 -11l7 -10l-1 -2l4 -9l-1 -4l2 -7l10 5l1 -1l-2 -5l2 -1l4 2l0 -2l11 -4l-3 -3l14 -12l-1 -5l5 -5l-1 -5l1 -3l-2 -1l0 -4l3 0l0 -6l4 0l0 -1l-7 -5l2 -1l-3 -11l7 -3l4 -5l0 -7l2 -4l-8 -6l-2 -9l5 -4l15 -4l0 -3l3 2l10 1l4 -3l-1 -4l6 -3l1 -7l5 2l0 5l2 1l0 7l3 4l-3 4l2 1l-1 3l4 5l3 0l0 3l5 3l-1 4l2 4l4 3l4 -2l0 5l3 1l0 11l12 -2l3 -3l6 3l2 -2l2 2l3 -1l1 6l5 3l0 7l-1 -1l-2 3l2 1l5 -1l9 1l4 -2l-1 -1l3 -1l2 4l7 -4l6 3l7 16l-8 8l1 10l-11 3l0 3l6 8l0 4l2 3l-8 2l1 3Z" },
  { code: "27", nom: "Bourgogne-Franche-Comté", niveau: "region", d: "M567 423l-4 0l2 3l-4 0l0 4l-1 -1l-5 4l-1 -6l-4 -1l-2 3l-5 -3l-5 4l-10 -8l-1 -3l2 -6l-1 -6l2 -4l0 -6l-4 -4l0 -7l-3 -13l-7 -6l4 -11l-5 -10l0 -1l8 -2l-2 -3l0 -4l-6 -8l0 -3l11 -3l-1 -10l8 -8l-7 -16l-6 -3l3 -4l2 0l2 -6l-1 -4l2 -5l20 -1l1 -3l3 4l5 -1l8 11l-3 7l4 0l2 5l5 -3l0 3l4 3l1 6l3 3l-2 1l1 2l3 -2l0 6l10 1l1 -2l3 2l4 -3l3 1l-1 -3l3 4l3 1l1 -4l17 -1l-2 -3l3 -3l13 2l0 4l6 3l-3 2l2 2l3 -2l6 9l-5 5l4 4l-1 3l2 1l3 -2l1 3l6 3l3 -4l0 3l4 4l1 3l3 -2l3 -1l1 2l3 -8l8 0l2 -4l2 4l6 -2l1 -13l3 -1l0 -3l3 1l9 -13l1 4l5 -7l6 -2l3 7l4 2l9 -4l4 2l3 5l4 -1l5 -4l14 12l2 -2l1 4l10 4l3 7l-3 5l2 2l4 0l3 5l-1 5l-9 0l2 4l-4 2l0 3l-4 3l0 2l3 0l6 -2l3 2l-1 2l-6 4l1 4l-6 9l-8 5l-3 5l1 2l-5 4l-9 3l-4 5l3 3l-2 9l2 1l-23 22l3 3l-5 8l1 2l-11 16l-4 2l-9 1l0 -5l-5 -3l-7 7l-5 1l0 -6l-2 1l-1 -2l-4 -2l1 -2l-6 -3l1 -4l-7 -2l-1 -3l-9 2l-4 -2l-4 -1l-10 34l-3 -1l0 -5l-4 -2l2 -3l-4 -2l-2 4l-4 -3l-4 3l-3 -3l-4 0l-1 8l-7 6l-1 0l0 -3l-3 1l-1 -1l-1 1l-6 -2l-5 3l-3 0l-1 -3l-5 -1l1 -8l5 -2l1 -15l-3 -2l-7 0l-1 -4l-3 1l-4 -2l0 -6l-7 -10l0 -4Z" },
  { code: "28", nom: "Normandie", niveau: "region", d: "M262 162l3 -3l9 0l7 4l26 4l12 5l14 -3l9 -8l13 -3l-13 -3l-4 -4l9 -19l24 -13l34 -8l18 -12l5 0l-1 3l14 12l7 15l-3 1l-3 5l0 2l2 -2l1 2l-2 3l2 11l-2 3l5 0l-5 9l2 4l3 10l-1 2l-5 -2l-7 19l-8 2l-1 -1l-1 2l3 10l-3 1l1 3l-1 3l-6 3l1 4l-7 3l-10 -3l0 3l-15 4l-5 4l2 9l8 6l-2 4l1 4l-3 7l-9 4l3 11l-4 3l-7 -9l-2 2l-6 0l-3 -6l-5 -1l-2 -2l1 -9l-5 -5l-9 1l-7 5l0 3l-4 -2l-4 1l1 -7l-6 0l-1 -6l1 -1l-4 -4l-4 2l2 1l-2 3l-3 -2l-4 3l-4 -3l-4 1l-10 6l-1 -4l-4 1l1 2l-3 1l-6 -7l-7 -1l-3 2l-13 -6l-4 1l0 2l-7 5l-7 -4l-5 -13l6 1l6 -3l-7 -4l-3 -5l-1 -8l-2 -2l5 -9l-4 -14l3 -15l-3 1l-5 -11l-5 -5l-4 -16l3 -3l0 -5l-1 -3l-5 -3l0 -5l20 9l6 0l4 -4l3 -1l10 2l2 8l-5 3l-1 4l8 13l0 3l3 2Z" },
  { code: "32", nom: "Hauts-de-France", niveau: "region", d: "M591 164l-1 4l-7 -4l-1 1l-2 -1l-2 1l1 3l-13 5l1 10l6 3l-1 2l-8 1l1 7l-3 2l0 3l4 -1l2 2l-14 18l-5 -4l-1 -5l-2 2l-2 -4l-2 1l-1 -3l-6 -5l1 -4l-3 -5l-4 -1l-1 4l-5 1l-5 -1l-3 1l-4 -2l-2 3l-8 -5l-3 3l-6 -3l1 -1l-2 -1l-11 -5l-3 3l-2 -3l-8 -1l-2 -2l-4 3l-8 2l-9 -2l-2 -9l5 2l1 -2l-5 -14l5 -9l-5 0l2 -3l-2 -11l2 -3l-1 -2l-2 2l0 -2l3 -5l3 -1l-7 -15l-14 -12l1 -3l-5 0l4 -4l4 -9l3 -1l2 3l6 0l-9 -10l1 -7l6 0l-6 -4l2 -14l3 0l-3 -3l-1 -13l3 -6l-1 -11l4 0l8 -7l48 -13l1 8l4 6l-3 3l3 10l5 0l6 9l2 0l3 3l3 -5l5 -3l4 0l1 -2l3 1l4 7l3 1l-2 4l3 13l6 3l6 -4l3 1l-2 3l7 0l4 4l0 8l3 7l2 -5l7 0l3 2l8 -3l6 6l0 2l5 0l1 2l-6 12l5 0l2 5l-6 6l0 4l6 2l-1 4l3 1l-3 12l2 3l-7 7l-2 5l-2 -1l-2 3l3 4l0 4l-2 2l0 10Z" },
  { code: "44", nom: "Grand Est", niveau: "region", d: "M602 110l5 -1l9 3l4 -1l4 -4l6 -1l0 -7l5 -7l4 -3l3 1l1 2l-2 3l-4 13l7 6l-3 5l1 6l9 -1l6 4l5 6l6 0l4 4l-1 4l2 -1l6 3l2 9l12 -6l3 1l4 -2l5 2l2 4l6 0l1 4l9 -2l2 -3l6 -1l7 5l4 -2l3 1l6 4l-1 2l3 1l-1 4l8 12l2 0l1 5l7 1l1 -3l-2 -3l7 -1l6 3l2 7l3 -3l11 2l5 -3l0 -3l5 -1l1 2l3 -1l2 7l5 1l2 3l7 1l3 -3l5 3l4 -3l11 6l8 1l-7 17l-7 6l-1 3l-7 8l-2 5l0 7l-3 12l1 6l-3 3l-2 9l-5 10l0 9l4 5l-4 9l-1 10l1 4l-2 4l1 4l5 6l-6 5l2 3l-2 3l-4 -1l-1 1l2 1l-4 5l-9 1l-5 -2l1 -4l-4 -1l0 -4l-3 -5l-4 0l-2 -2l3 -5l-3 -7l-10 -4l-1 -4l-2 2l-14 -12l-5 4l-4 1l-3 -5l-4 -2l-9 4l-4 -2l-3 -7l-6 2l-5 7l-1 -4l-9 13l-3 -1l0 3l-3 1l-1 13l-6 2l-2 -4l-2 4l-8 0l-3 8l-1 -2l-3 1l-3 2l-1 -3l-4 -4l0 -3l-3 4l-6 -3l-1 -3l-3 2l-2 -1l1 -3l-4 -4l5 -5l-6 -9l-3 2l-2 -2l3 -2l-6 -3l0 -4l-13 -2l-3 3l2 3l-17 1l-1 4l-3 -1l-3 -4l1 3l-3 -1l-4 3l-3 -2l-1 2l-10 -1l0 -6l-3 2l-1 -2l2 -1l-3 -3l-1 -6l-4 -3l0 -3l-5 3l-2 -5l-4 0l3 -4l-1 -1l1 -3l-8 -10l-5 1l0 -5l-2 -1l0 -5l3 -2l-2 -3l3 0l1 -4l5 -5l-7 -4l2 -3l0 -5l-5 -2l1 -2l2 0l-1 -3l4 -1l2 -9l3 -1l1 -3l6 -6l-2 -2l-4 1l0 -3l3 -2l-1 -7l8 -1l1 -2l-6 -3l-1 -10l13 -5l-1 -3l2 -1l2 1l1 -1l7 4l1 -14l2 -2l0 -4l-3 -4l2 -3l2 1l2 -5l7 -7l-2 -3l3 -12l-3 -1l1 -4Z" },
  { code: "52", nom: "Pays de la Loire", niveau: "region", d: "M164 343l3 -3l1 2l6 0l1 -4l3 -1l1 2l3 -1l1 2l2 -1l0 -2l3 -1l3 -11l14 -5l14 1l2 -5l11 -4l0 -3l5 1l1 3l8 3l7 -18l9 -3l0 -7l-4 -19l4 -6l-2 -11l2 -8l3 3l3 -2l7 1l6 7l3 -1l-1 -2l4 -1l1 4l10 -6l4 -1l4 3l4 -3l3 2l2 -3l-2 -1l4 -2l4 4l-1 1l1 6l6 0l0 8l3 -2l4 2l0 -3l7 -5l9 -1l5 5l-1 9l2 2l5 1l3 6l6 0l2 -2l4 7l3 2l2 -2l7 5l0 1l-4 0l0 6l-3 0l0 4l2 1l-1 3l1 5l-5 5l1 5l-14 12l3 3l-11 4l0 2l-4 -2l-2 1l2 5l-1 1l-10 -5l-2 7l1 4l-4 9l1 2l-7 10l-2 11l-2 -1l-2 2l-3 6l-3 -1l-3 4l-3 -1l2 -3l-2 -1l-12 1l-3 2l-6 -1l-4 1l-1 5l-3 2l-4 -1l-3 1l-5 -2l-7 3l1 3l3 1l0 5l3 4l5 2l-2 6l7 14l1 9l-3 2l1 5l-2 4l2 3l0 -3l5 3l-8 7l-3 -1l-3 2l-6 -4l-1 2l-6 0l-2 -1l3 -4l-3 0l-11 5l-5 -1l0 5l-9 -8l-8 -1l-3 -5l-7 -2l-13 -9l-2 -11l-5 -8l-13 -14l0 -7l2 0l7 -11l3 -1l-4 -7l-12 -4l1 -3l4 -1l-1 -11l-8 4l-4 -4l-5 1l-5 -3l1 -4l-3 -5l8 -4l-1 -2ZM178 392l-4 -1l-2 -3l1 -4l4 2l-1 4l5 2l0 4l-1 0l-2 -4Z" },
  { code: "53", nom: "Bretagne", niveau: "region", d: "M95 219l5 -1l0 -4l3 -3l-2 -4l4 -4l6 4l7 -3l4 0l3 -3l1 3l7 -2l0 4l5 1l0 2l-3 1l8 4l-2 3l8 7l0 6l6 4l1 5l1 -3l3 1l5 -5l5 -2l2 -4l3 1l7 -3l1 2l-3 3l1 1l4 -3l3 7l2 0l1 -2l3 0l-1 -3l4 0l3 1l3 9l1 0l-4 -11l4 -4l5 0l4 1l-3 4l2 3l4 1l13 -1l5 13l4 3l5 0l5 -6l4 -1l9 4l-1 7l2 11l-4 6l4 19l0 7l-9 3l-7 18l-8 -3l-1 -3l-5 -1l0 3l-11 4l-2 5l-14 -1l-6 3l-1 -2l-5 2l-4 3l-1 10l-3 1l0 2l-2 1l-1 -2l-3 1l-1 -2l-3 1l-1 4l-6 0l-1 -2l-4 3l-1 -5l4 0l-2 -2l-3 -1l-6 0l-3 -2l-2 4l-2 -1l-6 1l-3 -1l-4 -6l10 3l3 -4l-2 -6l-6 1l-4 4l-2 -2l-5 3l-1 -2l-7 1l-1 3l3 5l-3 1l-1 -3l1 -7l-4 -7l2 -4l4 -2l-2 -3l-4 9l-8 -9l-3 2l-4 1l-4 -7l0 -9l-1 9l-10 -2l-3 -4l-4 2l-4 -1l-7 -12l0 5l-5 1l-5 -2l-3 1l0 -3l-2 1l3 4l-2 2l-12 0l-1 -3l2 -1l0 -2l-4 -11l-7 -5l-1 1l-5 -4l-4 0l-1 -3l23 -3l4 3l2 -2l1 -4l-2 -5l-10 -5l-2 1l-4 6l1 -8l-4 -2l3 -2l0 -3l2 -2l0 5l7 0l3 2l5 -2l3 2l3 -1l-7 -2l1 -2l-3 -1l-1 1l-4 0l3 -6l-2 -1l-12 5l-4 -2l-2 2l-5 -1l1 -4l-1 -4l2 -5l0 -3l3 -5l8 -1l4 -5l8 0l6 -4l8 4l2 -4l9 1l5 -3l1 7l3 -1l4 4l0 -6l2 -1l10 2l0 3ZM115 347l3 1l0 3l6 2l-2 2l-9 -1l-2 -8l4 1Z" },
  { code: "75", nom: "Nouvelle-Aquitaine", niveau: "region", d: "M418 461l7 -7l2 3l4 -1l2 2l3 -3l3 3l2 -4l-1 -2l4 -1l1 3l11 -1l7 3l7 -2l6 1l3 9l3 2l1 -2l2 4l4 1l4 9l2 1l-1 9l4 5l0 6l-3 1l-5 9l-2 -1l-5 5l9 12l0 6l-3 0l-1 4l3 5l-2 13l3 3l-6 0l-4 -3l-2 1l0 7l-6 4l-5 8l1 6l-2 1l-1 5l-2 0l-3 3l3 7l-14 2l-2 -2l-6 5l-3 0l-10 -11l-5 1l-1 -2l-9 4l1 6l-1 3l1 4l-5 3l0 3l-4 1l1 6l-7 5l-5 1l0 3l-6 7l-6 2l5 16l-6 2l-5 -2l-2 7l5 3l-3 8l-3 0l1 4l-1 3l-5 -2l0 3l-3 0l-1 4l-5 4l-7 -5l-2 2l-6 0l-6 4l-1 -1l-4 2l-6 -2l-2 0l-2 4l-2 -1l0 -1l-4 1l-2 8l-5 -3l2 -3l-3 -3l-3 4l-7 1l-4 3l2 2l0 7l-2 0l2 7l-4 2l0 6l-3 1l1 2l2 1l0 3l10 0l4 7l0 4l-2 1l0 3l1 2l2 -3l2 2l-1 5l2 3l-5 4l2 3l-4 4l0 5l-4 -1l-2 5l-3 2l-1 7l-5 0l-2 3l0 7l-3 1l1 5l-1 3l-5 4l-4 0l-4 -3l-3 4l-9 -11l-3 0l-2 -8l-14 1l-12 -8l-1 2l-7 -5l-2 1l-3 -3l2 -4l-5 2l-1 6l-6 -2l-2 -5l4 -3l3 -12l-8 -4l-4 0l-1 3l-3 0l0 -5l-3 -1l-5 1l-4 -7l14 -5l11 -18l13 -49l6 -40l5 -11l8 2l4 0l-2 -6l-7 -7l-8 13l12 -81l5 -8l2 0l1 5l15 16l8 27l4 6l2 -2l-5 -9l-4 -23l-4 -10l-12 -12l-1 -3l-15 -10l0 -7l7 -2l-1 -6l4 -1l3 -7l-3 -4l4 -2l-5 -12l-6 -4l2 -4l6 -5l-1 -4l14 -5l-3 4l2 1l6 0l1 -2l7 4l2 -2l3 1l8 -7l-5 -3l0 3l-2 -3l2 -4l-1 -5l3 -2l-1 -9l-7 -14l2 -6l-5 -2l-3 -4l0 -5l-3 -1l-1 -3l7 -3l5 2l3 -1l4 1l3 -2l1 -5l4 -1l6 1l3 -2l12 -1l2 1l-2 3l3 1l3 -4l3 1l5 -8l3 5l5 2l2 -1l1 3l-1 1l2 2l2 -1l2 2l2 -1l1 13l3 -2l5 2l4 -3l7 0l-3 -4l4 0l5 3l0 7l7 8l0 3l8 10l-3 6l2 3l6 3l1 3l4 0l4 4l0 5l4 2l-2 4l2 0l0 2l6 0l4 -3l4 5ZM222 467l4 -2l-1 3l9 2l1 4l-5 -1l-7 -5l-5 0l-1 -4l4 -1l1 2l-2 1l2 1ZM235 503l0 -3l-8 -8l-2 -9l7 6l5 1l0 6l3 4l-1 5l-3 3l-1 -5Z" },
  { code: "76", nom: "Occitanie", niveau: "region", d: "M437 829l-4 -1l1 -2l-10 -2l-4 -3l-5 0l0 4l-3 1l-6 -11l-9 -2l-5 2l-3 -6l-9 -2l-2 -2l-3 2l-4 -4l-11 -4l-3 3l0 3l-2 2l2 9l-10 -1l-7 1l-5 -4l-5 5l-2 -4l-6 -3l-14 5l-7 -4l-3 -7l-2 1l-9 -7l-1 -7l3 -1l0 -6l2 -4l5 0l1 -7l3 -2l2 -5l4 1l0 -5l4 -4l-2 -3l5 -4l-2 -3l1 -5l-2 -2l-2 3l-1 -2l0 -3l2 -1l0 -4l-4 -7l-10 0l0 -3l-2 -1l-1 -2l3 -1l0 -6l4 -2l-2 -7l2 0l0 -7l-2 -2l4 -3l7 -1l3 -4l3 3l-2 3l5 3l2 -8l4 -1l0 1l2 1l2 -4l2 0l6 2l4 -2l1 1l6 -4l6 0l2 -2l7 5l5 -4l1 -4l3 0l0 -3l5 2l1 -3l-1 -4l3 0l3 -8l-5 -3l2 -7l5 2l6 -2l-5 -16l6 -2l6 -7l0 -3l5 -1l7 -5l-1 -6l4 -1l0 -3l5 -3l-1 -4l1 -3l-1 -6l9 -4l1 2l5 -1l10 11l3 0l6 -5l2 2l9 -2l3 7l-1 4l5 6l-2 8l2 5l0 3l2 3l0 -3l6 -2l3 -1l2 3l9 -1l1 -3l4 -4l3 -11l9 -9l3 2l0 6l6 -2l1 7l4 2l-1 5l4 8l5 -15l1 -3l2 0l1 -5l2 -2l3 4l4 -3l0 -4l3 1l5 -5l3 2l6 14l7 -2l1 -5l2 0l2 1l1 4l5 -1l7 7l4 14l2 5l2 0l3 11l5 5l-1 8l5 -2l10 7l2 -4l6 -4l1 6l4 -1l0 -4l13 5l3 7l2 0l1 2l-1 8l6 4l4 8l-2 0l-2 5l-10 7l2 2l-4 11l2 4l-10 -1l-5 8l4 1l-2 3l-15 8l0 4l-8 -3l1 -4l-2 -2l-7 0l-7 4l-13 11l-4 1l-11 12l-9 -1l-9 5l-12 16l-3 10l1 4l-2 29l2 8l5 3l0 3l3 4l-6 1l-4 -4l-5 0l-1 -1l-2 2l-6 0l-3 4l-9 1l-1 2l1 5l-7 -2l-3 2l-4 0l-3 -5l-13 -5l-4 2l-3 -1l-6 6l-4 1l-3 -1l-3 -9l-4 0l-6 -4l-5 0l0 -6l4 -2Z" },
  { code: "84", nom: "Auvergne-Rhône-Alpes", niveau: "region", d: "M645 478l10 -34l4 1l4 2l9 -2l1 3l7 2l-1 4l6 3l-1 2l4 2l1 2l2 -1l0 6l5 -1l7 -7l5 3l0 5l9 -1l4 -2l10 -13l2 0l5 4l-4 8l1 4l-9 3l-1 2l2 1l-2 6l6 -3l5 1l10 -7l2 -4l-3 0l-2 -2l4 -9l3 -1l3 3l8 -7l14 0l6 2l-2 3l6 6l-4 8l0 6l7 2l-1 7l3 -2l2 2l7 9l0 3l-3 5l-12 4l0 11l9 7l5 0l-2 5l2 8l7 4l1 3l5 2l-4 8l2 7l-5 5l-1 -2l-6 2l0 3l-4 1l0 4l-3 1l-6 -3l-9 5l-4 -1l-7 3l1 4l-8 -1l-1 -4l-2 -1l-2 1l-3 -1l-2 1l1 4l-1 1l-1 5l8 1l1 5l2 0l0 9l-1 0l-3 -2l-3 2l-9 0l-5 4l-2 -2l-3 2l-2 2l2 2l-10 4l-2 4l2 2l-3 3l-2 -1l-2 2l-6 -1l0 4l-3 7l5 4l-2 0l-2 4l-9 -3l-1 5l3 1l-2 1l-4 0l2 5l4 3l2 -1l1 2l5 -1l2 5l3 1l0 8l-2 0l0 3l3 0l-1 1l-7 -3l1 3l-3 2l-6 2l-2 -4l-3 0l0 -4l-3 -1l-14 -2l1 -7l-4 3l-3 -3l-9 5l-4 0l-4 3l-1 -7l-3 -2l-8 0l0 5l-10 -6l-4 0l0 4l-4 1l-1 -6l-6 4l-2 4l-10 -7l-5 2l1 -8l-5 -5l-3 -11l-2 0l-2 -5l-4 -14l-7 -7l-5 1l-1 -4l-2 -1l-2 0l-1 5l-7 2l-6 -14l-3 -2l-5 5l-3 -1l0 4l-4 3l-3 -4l-2 2l-1 5l-2 0l-1 3l-5 15l-4 -8l1 -5l-4 -2l-1 -7l-6 2l0 -6l-3 -2l-9 9l-3 11l-4 4l-1 3l-9 1l-2 -3l-7 2l-2 4l-2 -3l0 -3l-2 -5l2 -8l-5 -6l1 -4l-3 -7l5 0l-3 -7l3 -3l2 0l1 -5l2 -1l-1 -6l5 -8l6 -4l0 -7l2 -1l4 3l6 0l-3 -3l2 -13l-3 -5l1 -4l3 0l0 -6l-9 -12l5 -5l2 1l5 -9l3 -1l0 -6l-4 -5l1 -9l-2 -1l-4 -9l-4 -1l-2 -4l-1 2l-3 -2l-2 -3l2 -1l-3 -2l0 -6l6 -6l8 -2l3 1l5 -2l-2 -11l3 0l6 -8l3 2l14 -8l5 1l1 3l10 8l5 -4l5 3l2 -3l4 1l1 6l5 -4l1 1l0 -4l4 0l-2 -3l4 0l0 4l7 10l0 6l4 2l3 -1l1 4l7 0l3 2l-1 15l-5 2l-1 8l5 1l1 3l3 0l5 -3l6 2l1 -1l1 1l3 -1l0 3l1 0l7 -6l1 -8l4 0l3 3l4 -3l4 3l2 -4l4 2l-2 3l4 2l0 5l3 1ZM657 654l-2 1l2 1l0 4l6 0l3 -6l2 0l-5 -6l-5 2l-1 4Z" },
  { code: "93", nom: "Provence-Alpes-Côte d'Azur", niveau: "region", d: "M799 620l1 3l-2 5l-5 5l6 8l-3 2l0 6l8 7l1 5l11 2l9 6l4 -1l1 3l23 -7l-1 4l3 7l-3 3l0 6l-4 2l-3 6l-4 3l3 7l-4 4l-1 -1l-11 8l-4 0l-2 4l-4 0l-2 9l-1 -1l-10 4l-1 5l-3 6l-8 2l-1 -1l-2 2l-2 6l-8 7l0 1l6 -2l2 1l-5 11l-5 -3l-4 4l-7 1l-2 1l0 5l-7 -3l-5 0l-3 3l0 6l-3 -1l1 -4l-7 1l-2 -3l-6 -2l-1 1l1 3l-4 4l-2 0l-2 -6l-3 -1l1 -1l-6 -1l-3 -4l-4 2l-5 -4l-2 1l-12 -1l2 -3l-2 -4l2 -3l-3 -4l-8 3l-13 0l-5 -9l-2 -1l-5 3l-1 3l2 2l-3 3l-18 -3l-2 -3l2 -1l0 -3l-5 -2l-20 0l0 -4l15 -8l2 -3l-4 -1l5 -8l10 1l-2 -4l4 -11l-2 -2l10 -7l2 -5l2 0l-4 -8l-6 -4l1 -8l-5 -6l0 -7l8 0l3 2l1 7l4 -3l4 0l9 -5l3 3l4 -3l-1 7l14 2l3 1l0 4l3 0l2 4l6 -2l3 -2l-1 -3l7 3l1 -1l-3 0l0 -3l2 0l0 -8l-3 -1l-2 -5l-5 1l-1 -2l-2 1l-4 -3l-2 -5l4 0l2 -1l-3 -1l1 -5l9 3l2 -4l2 0l-5 -4l3 -7l0 -4l6 1l2 -2l2 1l3 -3l-2 -2l2 -4l10 -4l-2 -2l2 -2l3 -2l2 2l5 -4l9 0l3 -2l3 2l1 0l0 -9l-2 0l-1 -5l-8 -1l1 -5l1 -1l-1 -4l2 -1l3 1l2 -1l2 1l1 4l6 1l2 0l-1 -4l2 -1l8 -2l4 10l5 0l1 11l8 5l3 0l2 -2l5 2l0 5l6 10l-7 0l-2 3ZM667 732l0 9l3 0l2 6l4 0l6 -5l-1 -4l-4 4l-3 -7l-4 1l-3 -4ZM657 654l1 -4l5 -2l5 6l-2 0l-3 6l-6 0l0 -4l-2 -1l2 -1Z" },
  { code: "94", nom: "Corse", niveau: "region", d: "M991 881l1 19l-2 3l-5 3l0 2l2 -2l3 0l-5 8l1 4l-5 4l2 3l-2 5l-9 -3l0 -4l-4 -2l-12 -3l-9 -8l1 -4l6 -2l3 -4l-11 -1l0 -3l-3 2l-3 -3l3 -3l-2 -2l5 -3l0 -5l1 -1l-2 -3l-12 3l-1 -5l5 -3l-1 -3l6 -3l-1 -2l-2 -3l-10 -6l-2 -7l9 -4l0 -1l-5 -3l-1 -4l-3 2l-1 -1l1 -4l3 0l-1 -3l4 0l0 -10l3 -1l1 -3l2 -2l2 1l2 -4l7 -4l7 -1l7 -10l7 0l6 5l3 -6l-1 -6l-2 -3l2 -18l8 2l3 18l-2 12l6 10l5 28l1 17l-9 15l0 10Z" },
];

export const DEPARTEMENTS: ZoneCarte[] = [
  { code: "01", nom: "Ain", niveau: "departement", d: "M645 478l10 -34l4 1l4 2l9 -2l1 3l7 2l-1 4l6 3l-1 2l4 2l1 2l2 -1l0 6l5 -1l7 -7l5 3l0 5l11 -2l12 -14l7 4l-4 8l1 4l-9 3l-1 2l2 1l-2 6l-5 1l0 3l-4 -2l-1 3l2 14l-3 19l-2 3l-3 0l-1 6l-4 4l-5 -7l1 -1l-11 -11l0 -4l-5 -3l-8 12l-8 -5l-13 1l-1 -6l-2 -2l-2 -2l-3 2l0 -3l-5 -2l2 -2l-1 -12l3 -7l-1 -1Z" },
  { code: "02", nom: "Aisne", niveau: "departement", d: "M591 164l-1 4l-7 -4l-1 1l-2 -1l-2 1l1 3l-13 5l1 10l6 3l-1 2l-8 1l1 7l-3 2l0 3l4 -1l2 2l-6 6l-1 3l-3 1l-2 6l-2 2l-5 -4l-1 -5l-2 2l-2 -4l-2 1l-1 -3l-6 -5l0 -8l-6 -2l4 -3l-1 -4l-7 -2l0 3l-3 -1l0 -3l5 0l0 -6l-4 -1l-1 -2l7 -3l2 -9l4 0l-4 -3l1 -2l-1 -3l1 0l1 -5l-3 -5l2 -8l-4 -12l4 -5l3 -13l4 -2l7 2l1 -2l8 1l4 -3l4 3l6 -5l12 5l6 -2l-1 4l2 1l14 3l-1 4l3 1l-3 12l2 3l-7 7l-2 5l-2 -1l-2 3l3 4l0 4l-2 2l0 10Z" },
  { code: "03", nom: "Allier", niveau: "departement", d: "M527 419l1 3l10 8l5 -4l5 3l2 -3l4 1l1 6l5 -4l1 1l0 -4l4 0l-2 -3l4 0l0 4l7 10l0 6l4 2l3 -1l1 4l7 0l3 2l-1 15l-2 0l-4 4l-9 4l3 7l-1 1l3 15l-4 3l-4 -1l-1 5l-7 -8l-8 0l-2 -5l-2 -1l-4 2l-13 -1l-3 -1l-2 -4l-5 1l-8 -7l2 -7l-3 -1l-3 1l-2 5l-6 -3l0 3l-3 2l-3 6l-5 -3l-6 -13l-4 -1l-2 -4l-1 2l-5 -5l2 -1l-3 -2l0 -6l5 -6l9 -2l3 1l5 -2l-2 -11l3 0l6 -8l3 2l14 -8l5 1Z" },
  { code: "04", nom: "Alpes-de-Haute-Provence", niveau: "departement", d: "M712 669l8 -2l8 2l-6 -9l2 -2l4 5l1 -6l-2 -1l4 -7l8 -6l0 -3l6 1l5 8l2 -3l-2 -5l4 -2l2 2l2 -6l4 5l4 2l12 0l3 -10l4 -1l2 -4l5 -3l4 -4l3 0l1 3l-2 5l-5 5l6 9l-3 1l0 6l-5 3l-4 7l-2 1l-2 8l5 9l0 3l14 14l-4 1l-4 -3l-5 5l-4 0l-2 4l3 2l-10 3l-3 -2l-6 1l-4 7l-4 -1l-5 -5l-3 0l-13 13l-6 -8l-6 4l-2 -3l-3 -1l-2 3l-7 -9l-8 1l4 -10l-7 -4l2 -11l-3 1l0 -5l6 -4l-1 -3l7 3l1 -1l-3 0l0 -3l2 0Z" },
  { code: "05", nom: "Hautes-Alpes", niveau: "departement", d: "M749 577l3 1l2 -1l2 1l1 4l6 1l2 0l-1 -4l2 -1l8 -2l4 10l5 0l1 11l8 5l3 0l2 -2l5 2l0 5l6 10l-7 0l-2 3l-3 0l-4 4l-5 3l-2 4l-4 1l-3 10l-12 0l-4 -2l-4 -5l-2 6l-2 -2l-4 2l2 5l-2 3l-5 -8l-6 -1l0 3l-8 6l-4 7l2 1l-1 6l-4 -5l-2 2l6 9l-8 -2l-8 2l0 -8l-3 -1l-2 -5l-5 1l-1 -2l-2 1l-4 -3l-2 -5l4 0l2 -1l-3 -1l1 -5l9 3l2 -4l2 0l-5 -4l3 -7l0 -4l6 1l2 -2l2 1l3 -3l-2 -2l2 -4l10 -4l-2 -2l2 -2l3 -2l2 2l5 -4l9 0l3 -2l3 2l1 0l0 -9l-2 0l-1 -5l-8 -1l1 -5l1 -1l-1 -4l2 -1Z" },
  { code: "06", nom: "Alpes-Maritimes", niveau: "departement", d: "M796 649l8 7l1 5l11 2l9 6l4 -1l1 3l5 0l18 -7l-1 4l3 5l0 4l-3 1l0 6l-4 2l-3 6l-4 3l3 7l-8 7l-4 0l-4 4l-4 0l-2 4l-4 0l-2 9l-1 -1l-3 3l-6 0l-3 7l-3 -2l1 -10l-8 -2l-3 -4l0 -7l-7 -1l-2 -3l5 -3l-3 -2l2 -4l4 0l5 -5l4 3l4 -1l-14 -14l0 -3l-5 -9l2 -8l2 -1l4 -7l5 -3Z" },
  { code: "07", nom: "Ardèche", niveau: "departement", d: "M627 570l8 -2l0 -6l8 -5l3 1l0 3l3 3l0 9l1 4l-1 3l4 7l-2 5l4 6l-3 9l-5 7l1 13l-6 8l1 11l-3 7l0 10l-10 -6l-4 0l0 4l-4 1l-1 -6l-6 4l-2 4l-10 -7l-5 2l-1 -1l2 -7l-5 -5l-3 -11l-2 0l-2 -5l-3 -12l4 -3l2 -5l3 1l3 -2l0 -3l9 -1l4 -8l6 -2l-1 -4l6 -2l-3 -3l4 -5l-2 -2l5 1l3 -10Z" },
  { code: "08", nom: "Ardennes", niveau: "departement", d: "M602 110l5 -1l9 3l4 -1l4 -4l6 -1l0 -7l5 -7l4 -3l3 1l1 2l-2 3l-4 13l7 6l-3 5l1 6l9 -1l6 4l5 6l6 0l4 4l-1 4l5 -1l-8 8l-2 -3l-4 1l-3 -3l-4 10l3 10l-4 6l1 4l-6 5l-3 -2l-5 3l-9 -2l-3 2l-4 -6l-10 1l-3 -3l-4 -1l-4 -5l-13 -2l0 -10l2 -2l0 -4l-3 -4l2 -3l2 1l2 -5l7 -7l-2 -3l3 -12l-3 -1l1 -4Z" },
  { code: "09", nom: "Ariège", niveau: "departement", d: "M431 761l3 5l-1 3l12 5l1 2l1 -1l2 1l0 7l3 2l0 6l-4 3l3 1l1 5l-8 2l-1 4l6 8l10 -2l5 5l0 4l-12 0l-2 4l-12 4l-5 -1l1 -2l-10 -2l-4 -3l-5 0l0 4l-3 1l-6 -11l-9 -2l-5 2l-3 -6l-9 -2l-2 -2l-3 2l-4 -4l-2 -8l4 -2l-1 -3l8 -1l3 -3l-2 -2l0 -7l3 0l2 -4l8 0l4 6l4 -3l-1 -3l-4 -2l2 -3l6 1l4 -3l0 -1l-6 -6l2 -2l2 -1l4 5l1 4l2 1l4 0l-1 -7l2 2l8 2l4 -2Z" },
  { code: "10", nom: "Aube", niveau: "departement", d: "M551 263l-1 -8l3 -2l-2 -3l5 -2l-1 -2l2 -4l3 -1l5 5l1 3l12 2l3 -2l0 -4l2 0l1 -3l2 0l3 -6l4 0l1 -3l3 1l2 -2l10 -1l2 4l-2 6l6 5l8 1l0 2l7 -3l3 2l-2 8l2 1l2 5l4 0l-1 2l6 3l-2 2l3 5l0 12l-2 4l-6 -1l-2 4l1 5l-8 -1l-3 3l2 3l-17 1l-1 4l-2 0l-4 -5l1 3l-3 -1l-4 3l-3 -2l-1 2l-10 -1l0 -6l-3 2l-1 -2l2 -1l-3 -3l-1 -6l-4 -3l0 -3l-5 3l-2 -5l-4 0l3 -4l-1 -1l1 -3l-8 -10l-5 1l-1 -3Z" },
  { code: "11", nom: "Aude", niveau: "departement", d: "M431 761l3 -6l5 -2l0 -3l4 -6l4 4l3 -2l3 2l3 -3l5 5l5 -2l3 3l0 -5l3 -2l10 3l7 -1l7 2l-3 3l-1 4l3 1l1 3l4 1l3 -3l0 4l4 2l8 -7l0 -4l1 4l5 2l4 -1l0 4l14 3l3 4l-12 17l-2 7l1 4l-1 8l-13 -8l-6 2l-3 6l-17 -1l-13 1l2 10l-13 8l-1 -5l-5 -5l-6 2l-7 -3l1 -2l-4 -3l1 -4l8 -2l0 -3l-1 -2l-3 -1l4 -3l0 -6l-3 -2l0 -7l-2 -1l-1 1l-1 -2l-12 -5l1 -3l-3 -5Z" },
  { code: "12", nom: "Aveyron", niveau: "departement", d: "M469 631l0 -3l6 -2l3 -1l2 3l9 -1l1 -3l4 -4l3 -11l9 -9l3 2l0 6l6 -2l1 7l4 2l1 10l9 10l-1 7l5 5l-1 8l2 6l-2 5l2 -2l1 3l4 1l-1 4l11 0l1 2l-3 1l-1 5l-4 2l13 7l-7 8l1 2l-3 2l-3 0l-3 4l1 2l-3 2l-10 -2l0 14l-6 -2l-3 2l-1 -4l-8 -3l-5 3l-4 -1l-8 -10l1 -4l-6 -6l2 -3l-4 -7l-4 -1l-1 -2l-7 -4l-1 -2l-6 -1l3 -1l-3 0l-3 -4l-11 5l-1 -3l-5 -2l4 -8l-7 -1l0 -3l3 -4l-3 -3l-1 -8l15 -10l6 1l3 -1l1 -3Z" },
  { code: "13", nom: "Bouches-du-Rhône", niveau: "departement", d: "M647 697l8 1l8 4l6 8l9 4l10 0l16 7l5 0l4 -3l4 -1l2 -3l2 2l1 4l-6 3l-1 5l-2 1l4 3l-1 6l6 6l-7 2l2 4l-2 4l3 0l3 5l-5 3l-1 6l-3 -1l-2 2l-5 -4l-2 1l-12 -1l2 -3l-2 -4l2 -3l-3 -4l-8 3l-13 0l-5 -9l-2 -1l-5 3l-1 3l2 2l-3 3l-18 -3l-2 -3l2 -1l0 -3l-5 -2l-20 0l0 -4l15 -8l2 -3l-4 -1l5 -8l10 1l-2 -4l4 -11l-2 -2l7 -6ZM667 732l0 9l3 0l2 6l4 0l6 -5l-1 -4l-4 4l-3 -7l-4 1l-3 -4Z" },
  { code: "14", nom: "Calvados", niveau: "departement", d: "M262 162l3 -3l9 0l7 4l26 4l12 5l8 -1l6 -2l9 -8l11 -2l1 13l3 2l0 1l-4 2l5 4l-1 5l3 1l-4 9l5 4l-2 5l-1 1l-2 -2l-3 3l-4 -3l-7 4l-2 -3l-4 2l-1 3l-13 6l-12 -3l-1 4l-5 -6l-13 4l-4 -2l1 3l-10 6l-8 -4l-7 1l-6 -6l6 -3l14 -15l-1 -1l0 -8l-3 -4l3 -4l-2 -2l-3 3l-7 -5l-3 -6l1 -6Z" },
  { code: "15", nom: "Cantal", niveau: "departement", d: "M491 547l11 4l3 5l12 0l4 7l5 3l6 -7l1 7l6 0l2 6l2 1l-1 4l2 5l4 1l-3 7l3 1l1 5l-5 5l-3 -1l0 4l-4 3l-3 -4l-2 2l-1 5l-2 0l-1 3l-5 15l-4 -8l1 -5l-4 -2l-1 -7l-6 2l0 -6l-3 -2l-9 9l-3 11l-4 4l-1 3l-9 1l-2 -3l-7 2l-2 4l-2 -3l0 -3l-2 -5l2 -8l-5 -6l1 -4l-3 -7l5 0l-3 -7l3 -3l2 0l1 -5l2 -1l-1 -6l5 -8l6 -4l0 -7l2 -1l4 3l6 0l-3 -3l2 -6Z" },
  { code: "16", nom: "Charente", niveau: "departement", d: "M314 495l4 -2l1 -6l3 0l4 -4l5 -1l2 3l3 -1l4 3l11 1l3 -3l-3 -2l4 -3l3 4l4 2l6 -2l2 -3l6 0l2 3l-1 5l7 4l1 5l-6 4l-2 -1l0 5l-4 9l-4 -2l0 4l-5 2l-6 10l-4 2l-1 7l-10 7l-3 0l-4 9l1 7l-3 1l-7 8l-5 -2l-4 3l1 -3l-4 -3l-4 0l0 -4l-8 -3l-3 1l-1 -2l3 -3l-5 -2l5 -3l-1 -11l-4 -1l2 -3l-6 -6l-3 0l4 -4l-3 -5l1 -3l-3 0l4 -4l5 0l3 -2l3 1l1 3l5 -3l2 -4l-2 -8l4 -1l0 -3Z" },
  { code: "17", nom: "Charente-Maritime", niveau: "departement", d: "M222 467l4 -2l-1 3l9 2l1 4l-5 -1l-7 -5l-5 0l-1 -4l4 -1l1 2l-2 1l2 1ZM246 459l11 -5l3 0l-3 4l2 1l9 -2l4 4l-1 5l4 3l5 8l5 0l9 6l8 1l1 2l5 1l0 2l2 -1l2 6l2 1l0 3l-4 1l2 8l-2 4l-5 3l-1 -3l-3 -1l-3 2l-5 0l-4 4l3 0l-1 3l3 5l-4 4l3 0l6 6l-2 3l4 1l1 11l-5 3l5 2l-3 3l1 2l7 0l4 2l0 4l4 0l4 3l-2 5l1 2l-3 1l0 3l-3 -1l-5 3l-2 -1l-10 -8l-3 1l-3 -5l1 -6l-11 -3l0 -3l-10 0l-2 -8l-6 -9l-9 -9l-1 -3l-15 -10l0 -7l7 -2l-1 -6l4 -1l3 -7l-3 -4l4 -2l-5 -12l-6 -4l2 -4l6 -5l-1 -4ZM235 503l0 -3l-8 -8l-2 -9l7 6l5 1l0 6l3 4l-1 5l-3 3l-1 -5Z" },
  { code: "18", nom: "Cher", niveau: "departement", d: "M474 338l4 -1l5 5l5 -3l3 4l4 0l3 2l6 7l2 -2l0 -2l3 0l2 2l5 -2l4 8l-4 11l7 6l3 13l0 7l3 1l1 9l-2 4l1 6l-2 6l-5 -1l-14 8l-3 -2l-6 8l-3 0l2 11l-5 2l-3 -1l-9 2l-5 6l0 3l-8 -1l0 -3l3 -2l-3 -7l2 -9l-3 -2l1 -3l-6 -5l3 -3l-4 -5l7 -8l-5 -2l2 -6l-5 -5l1 -6l-3 -2l-8 2l-7 -3l5 -4l-1 -4l5 0l-1 -4l3 -3l4 3l9 -2l1 -3l-3 -8l6 -4l1 3l2 -1l1 -7l-2 -1l-2 -5l-4 0l-1 -3l8 -4Z" },
  { code: "19", nom: "Corrèze", niveau: "departement", d: "M449 525l10 -5l5 3l3 -1l3 1l-1 2l6 1l0 3l3 -1l2 -4l6 1l4 -3l2 7l-3 2l-1 4l3 5l-2 13l3 2l-3 1l-7 -3l-2 1l0 7l-6 4l-5 8l1 6l-2 1l-1 5l-2 0l-3 3l3 7l-14 2l-2 -2l-6 5l-3 0l-10 -11l-5 1l-1 -2l-7 3l-3 -5l-1 -4l2 -2l-11 -3l3 -3l-4 -1l3 -6l-3 -1l0 -5l3 -1l3 -5l-4 -2l2 -2l-2 -2l1 -3l6 1l9 -10l1 2l6 -1l8 -7l5 -2l1 -3l6 2l2 -1l-1 -2Z" },
  { code: "21", nom: "Côte-d'Or", niveau: "departement", d: "M609 308l1 -4l17 -1l-2 -3l3 -3l13 2l0 4l6 3l-3 2l2 2l3 -2l6 9l-5 5l4 4l-1 3l2 1l3 -2l1 3l6 3l3 -4l0 3l4 4l1 3l3 -2l7 0l1 -3l4 2l0 8l-2 3l-3 0l-2 3l4 3l2 5l3 -1l-2 7l3 2l-2 1l-2 14l-4 6l-7 4l0 2l2 1l-3 4l-2 -1l-9 3l-3 -2l-4 2l-6 0l0 1l-14 5l-1 -3l-6 -2l-2 -6l-3 1l-5 -3l-2 -4l-4 1l0 -2l-5 -1l-4 -5l1 -4l-3 -5l-3 1l-1 -9l-4 -7l3 -4l0 -6l9 -15l-2 -1l3 -3l-1 -4l2 1l3 -3l-1 -7l-4 -1l0 -4l3 -2l-1 -2Z" },
  { code: "22", nom: "Côtes-d'Armor", niveau: "departement", d: "M95 219l5 -1l0 -4l3 -3l-2 -4l4 -4l6 4l7 -3l4 0l3 -3l1 3l7 -2l0 4l5 1l0 2l-3 1l8 4l-2 3l8 7l0 6l6 4l1 5l1 -3l3 1l5 -5l5 -2l2 -4l3 1l7 -3l1 2l-3 3l1 1l4 -3l3 7l6 -2l1 3l3 1l0 2l3 -2l2 3l3 -1l0 9l-2 3l1 8l-3 0l1 2l-4 4l-3 -2l-4 4l-5 0l0 4l-7 7l-6 1l-2 -5l-2 -1l-6 1l1 3l-2 5l-6 4l-3 -2l1 -8l-6 2l-3 -4l-3 1l-5 -4l-3 1l-4 -4l-5 0l-1 3l-5 1l-4 1l-5 -4l-4 2l-2 -1l1 -1l-9 -2l4 -10l-2 -9l-3 -1l1 -4l2 -1l-2 -6l4 -3l-3 -2l1 -3l-3 -2l-1 -6Z" },
  { code: "23", nom: "Creuse", niveau: "departement", d: "M468 455l8 0l3 9l3 2l1 -2l2 4l4 1l4 9l2 1l-1 9l4 5l0 6l-3 1l-5 9l-2 -1l-5 5l3 6l4 3l-4 3l-6 -1l-2 4l-3 1l0 -3l-6 -1l1 -2l-3 -1l-3 1l-5 -3l-10 5l-1 -10l-8 -5l-6 1l-5 -2l0 -3l3 -1l-2 -3l-4 1l-1 -1l3 -5l-3 -2l1 -7l-3 -1l0 -4l-3 -6l-3 1l-2 -4l3 -2l-1 -2l2 -5l-1 -4l7 -7l2 3l4 -1l2 2l3 -3l3 3l2 -4l-1 -2l4 -1l1 3l11 -1l7 3l5 -1Z" },
  { code: "24", nom: "Dordogne", niveau: "departement", d: "M363 522l1 2l6 0l3 2l-2 5l4 4l4 -4l2 2l8 -1l4 8l2 -1l4 2l-3 3l1 2l8 3l2 2l-2 2l4 2l-3 5l-3 1l0 5l3 1l0 2l-3 2l0 2l4 1l-3 3l3 1l8 2l-2 2l4 9l-2 1l1 6l-1 3l1 4l-5 3l0 3l-4 1l1 6l-7 5l-5 1l0 3l-5 6l-6 -6l-4 0l-5 4l-2 -1l-1 -2l2 -4l-3 -4l-2 2l-8 1l-2 -3l-6 4l-2 -2l-7 3l-5 -1l0 -7l-5 -6l0 -4l4 -2l-3 -2l-3 0l-3 4l-10 0l-2 -3l-3 0l4 -6l-2 -3l6 -12l-2 -5l-6 1l0 -3l3 -1l-1 -2l5 -5l5 2l7 -8l3 -1l-1 -7l2 -5l2 -4l3 0l10 -7l1 -7l4 -2l5 -7Z" },
  { code: "25", nom: "Doubs", niveau: "departement", d: "M775 338l1 1l6 0l3 3l-3 2l3 9l-4 5l9 -2l3 2l-4 5l-3 1l1 4l-6 9l-8 5l-3 5l1 2l-5 4l-9 3l-4 5l3 3l-2 9l2 1l-22 21l-1 1l2 2l-6 -5l4 -4l-3 -4l9 -8l-5 -5l-9 -5l-3 -10l-10 -3l-1 -3l-1 3l-2 0l-1 -1l3 -3l-1 -3l3 -6l-7 -7l-2 -4l10 -4l5 -4l4 1l6 -3l3 -4l2 1l3 -4l4 0l4 -8l6 -2l9 3l2 -2l0 -4l2 2l3 -3l5 0l2 1l2 -2Z" },
  { code: "26", nom: "Drôme", niveau: "departement", d: "M648 563l6 0l7 -5l5 3l1 3l4 -1l-1 4l4 0l0 5l1 3l0 5l-2 4l5 0l11 3l7 -4l-1 25l2 0l-2 3l9 1l4 5l8 3l5 -1l-3 5l-2 -1l-2 2l-6 -1l0 4l-3 7l5 4l-2 0l-2 4l-9 -3l-1 5l3 1l-2 1l-4 0l2 5l4 3l2 -1l1 2l5 -1l2 5l3 1l0 8l-2 0l0 3l3 0l-1 1l-7 -3l1 3l-3 2l-6 2l-2 -4l-3 0l0 -4l-3 -1l-14 -2l1 -7l-4 3l-3 -3l-9 5l-4 0l-4 3l-1 -7l-3 -2l-8 0l1 -10l2 -2l-1 -11l6 -8l-1 -13l5 -7l3 -9l-4 -6l2 -5l-4 -7l1 -3l-2 -14ZM657 654l-2 1l2 1l0 4l6 0l3 -6l2 0l-5 -6l-5 2l-1 4Z" },
  { code: "27", nom: "Eure", niveau: "departement", d: "M353 159l12 -5l6 5l3 0l2 4l9 -2l1 3l6 1l0 4l-3 0l-1 1l2 3l3 -2l5 7l2 -2l0 -3l6 -1l1 -3l7 0l3 -8l2 -2l9 0l6 1l5 4l4 -1l5 14l-1 2l-5 -2l-7 19l-8 2l-1 -1l-1 2l3 10l-3 1l1 3l-1 3l-6 3l1 4l-7 3l-10 -3l0 3l-15 4l-1 3l-6 1l-2 -5l2 -1l-1 -3l-9 -7l-2 -6l-2 2l-6 -1l-4 -3l4 -10l-5 -4l4 -9l-3 -1l1 -5l-5 -4l4 -2l0 -1l-3 -2l-1 -13Z" },
  { code: "28", nom: "Eure-et-Loir", niveau: "departement", d: "M383 234l5 -4l15 -4l0 -3l3 2l10 1l4 -3l-1 -4l6 -3l1 -7l5 2l0 5l2 1l0 7l3 4l-3 4l2 1l-1 3l4 5l3 0l0 3l5 3l-1 4l2 4l4 3l4 -2l0 5l3 1l0 8l-1 1l2 2l-7 18l-9 3l-6 -1l-4 5l-4 -2l-2 2l1 4l-6 -3l0 4l-3 -1l-1 3l-4 0l-4 -3l-3 1l-2 -6l-3 -1l-1 -4l-7 0l-1 -2l4 -2l0 -1l-6 3l-1 -1l-6 0l0 -3l4 0l0 -1l-7 -5l2 -1l-3 -11l7 -3l4 -5l0 -7l2 -4l-8 -6l-2 -9Z" },
  { code: "29", nom: "Finistère", niveau: "departement", d: "M95 219l1 6l3 2l-1 3l3 2l-4 3l2 6l-2 1l-1 4l3 1l2 9l-3 5l1 3l-12 5l-1 3l5 13l5 -1l6 5l3 -2l2 5l-2 5l-3 1l-3 3l-2 -3l-1 9l-10 -2l-3 -4l-2 2l-6 -1l-7 -12l0 5l-5 1l-5 -2l-3 1l0 -3l-2 1l3 4l-2 2l-12 0l-1 -3l2 -1l0 -2l-4 -11l-7 -5l-1 1l-5 -4l-4 0l-1 -3l23 -3l4 3l2 -2l1 -4l-2 -5l-10 -5l-2 1l-4 6l1 -8l-4 -2l3 -2l0 -3l2 -2l0 5l7 0l3 2l5 -2l3 2l3 -1l-7 -2l1 -2l-3 -1l-1 1l-4 0l3 -6l-2 -1l-12 5l-4 -2l-2 2l-5 -1l1 -4l-1 -4l2 -5l1 -6l4 -3l6 0l6 -6l1 2l5 -1l6 -4l8 4l2 -4l9 1l5 -3l1 7l3 -1l4 4l0 -6l2 -1l10 2l0 3Z" },
  { code: "2A", nom: "Corse-du-Sud", niveau: "departement", d: "M927 834l15 5l6 -1l0 3l4 4l11 4l0 3l6 6l3 8l5 -1l0 11l3 2l-1 5l6 1l4 -4l2 1l1 19l-2 3l-5 3l0 2l2 -2l3 0l-5 8l1 4l-5 4l2 3l-2 5l-9 -3l0 -4l-16 -5l-9 -8l1 -4l6 -2l3 -4l-11 -1l0 -3l-3 2l-3 -3l3 -3l-2 -2l4 -1l1 -7l1 -1l-2 -3l-12 3l-1 -5l5 -3l-1 -3l6 -3l-3 -5l-10 -6l-2 -7l9 -4l0 -1l-5 -3l-1 -4l-3 2l0 -5Z" },
  { code: "2B", nom: "Haute-Corse", niveau: "departement", d: "M991 881l-2 -1l-4 4l-6 -1l1 -5l-3 -2l0 -11l-5 1l-3 -8l-6 -6l0 -3l-11 -4l-4 -4l0 -3l-6 1l-15 -5l3 0l-1 -3l4 0l0 -10l3 -1l1 -3l2 -2l2 1l2 -4l5 -3l9 -2l7 -10l7 0l6 5l3 -6l-1 -6l-2 -3l2 -18l8 2l3 18l-2 12l6 10l5 28l1 17l-9 15l0 10Z" },
  { code: "30", nom: "Gard", niveau: "departement", d: "M551 674l4 4l8 2l6 -1l0 -5l3 -1l8 5l6 0l5 -4l0 -7l2 -1l-3 -2l-1 -3l2 -2l-5 -6l4 -1l4 -6l5 5l-1 8l5 -2l10 7l2 -4l6 -4l1 6l4 -1l0 -4l13 5l3 7l2 0l1 2l-1 8l6 4l4 8l-2 0l-2 5l-10 7l2 2l-4 11l2 4l-10 -1l-5 8l4 1l-2 3l-15 8l0 4l-8 -3l1 -4l-2 -2l-1 -3l5 -3l2 -3l-4 -9l-10 -7l-2 1l0 -4l-4 -2l0 -2l-8 0l2 -4l-3 -4l-4 -1l-3 3l-1 3l-4 0l-3 7l-3 -1l-1 -4l-6 2l-1 -4l-4 0l-1 -2l7 -8l-13 -7l4 -2l1 -5l3 -1Z" },
  { code: "31", nom: "Haute-Garonne", niveau: "departement", d: "M380 710l9 -3l2 2l4 -2l4 5l10 -5l0 -1l-5 -2l5 0l-1 -2l2 -1l5 1l2 -3l1 2l5 -3l2 10l4 2l0 4l4 4l-3 2l4 0l1 4l-3 2l10 5l6 8l5 2l3 -2l0 6l-3 3l-3 -2l-3 2l-4 -4l-4 6l0 3l-5 2l-3 6l-4 2l-8 -2l-2 -2l1 7l-3 1l-3 -2l0 -3l-5 -6l-2 1l-2 2l1 2l5 4l-4 4l-6 -1l-2 3l6 4l-3 3l-2 1l-1 -4l-6 -3l-5 1l-2 4l-3 0l0 7l2 2l-3 3l-8 1l1 3l-4 2l2 8l-11 -4l-3 3l0 3l-2 2l2 9l-14 -1l-1 -3l2 -15l6 2l6 -9l-2 -2l-1 -6l-4 3l1 -6l-8 -6l6 -8l4 -1l-2 -1l6 -6l-2 -2l5 -1l7 -9l3 2l1 -1l7 1l4 4l2 -1l-1 -3l2 -1l1 -5l-1 -1l2 -1l2 -6l2 2l4 -4l3 0l-1 -4l-2 1l-2 -4l-3 0l-2 -3l1 -3l-8 -8Z" },
  { code: "32", nom: "Gers", niveau: "departement", d: "M319 689l4 -1l0 1l2 1l2 -4l2 0l6 2l4 -2l1 1l6 -4l6 0l2 -2l7 5l5 -4l1 4l5 -3l2 2l-3 1l1 3l-5 5l1 2l2 -1l6 3l0 6l2 1l-2 3l12 10l-1 3l2 3l3 0l2 4l2 -1l1 4l-3 0l-4 4l-2 -2l-2 6l-2 1l1 1l-1 5l-2 1l1 3l-2 1l-4 -4l-7 -1l-1 1l-3 -2l-7 9l-5 1l-15 -2l0 -2l-4 1l0 -3l-4 -2l-7 2l-3 -7l2 0l-3 -8l-4 0l-3 -3l-2 -6l-10 2l-1 -1l-5 1l0 -3l-2 -1l-1 -2l3 -1l0 -6l4 -2l-2 -7l2 0l0 -7l-2 -2l4 -3l7 -1l3 -4l3 3l-2 3l5 3l2 -8Z" },
  { code: "33", nom: "Gironde", niveau: "departement", d: "M269 556l10 0l0 3l9 2l2 1l1 10l8 3l2 3l6 3l5 -3l1 2l8 -2l2 5l-6 12l2 3l-4 6l3 0l2 3l10 0l3 -4l6 2l-4 2l2 6l-5 0l-2 4l0 -2l-7 4l3 3l3 1l-2 4l-13 11l2 13l-7 1l3 8l-4 3l-3 1l-3 -3l-3 -1l0 6l-4 1l-8 -2l1 -7l-17 -12l0 -4l-3 -2l-12 4l-5 -3l-6 0l1 -7l-6 -2l-2 2l-10 3l0 -7l5 -11l8 2l4 0l-2 -6l-7 -7l-8 13l13 -85l4 -4l2 0l1 5l15 16l8 27l4 6l2 -2l-5 -9l-3 -19Z" },
  { code: "34", nom: "Hérault", niveau: "departement", d: "M550 699l4 0l1 4l6 -2l1 4l3 1l3 -7l4 0l1 -3l3 -3l4 1l3 4l-2 4l8 0l0 2l4 2l0 4l2 -1l10 7l4 9l-2 3l-5 3l1 3l-7 0l-7 4l-13 11l-4 1l-11 12l-9 -1l-10 7l-3 -4l-14 -3l0 -4l-4 1l-5 -2l-1 -4l0 4l-5 4l-2 3l-5 -2l0 -4l-3 3l-4 -1l-1 -3l-3 -1l1 -4l3 -3l-2 -1l7 -4l-1 -6l-3 -4l2 -9l6 1l2 3l11 -3l1 -4l4 -2l6 2l0 -14l10 2l3 -2l-1 -2l3 -4l3 0l3 -2Z" },
  { code: "35", nom: "Ille-et-Vilaine", niveau: "departement", d: "M194 232l-1 -3l4 0l3 1l1 6l-3 2l0 -2l-3 -1l-1 -3ZM204 239l-4 -11l4 -4l5 0l4 1l-3 4l2 3l4 1l13 -1l5 13l4 3l5 0l5 -6l4 -1l9 4l-1 7l2 11l-4 6l4 19l0 7l-9 3l-7 18l-8 -3l-1 -3l-5 -1l0 3l-11 4l-2 5l-14 -1l-6 3l-1 -2l-9 5l-2 -9l5 -1l-1 -2l-3 0l6 -7l0 -2l-3 1l-2 -4l3 -3l-4 -7l-9 -1l1 -4l2 -2l5 -1l-1 -2l-4 2l0 -5l-2 -2l7 -7l0 -4l5 0l4 -4l3 2l4 -4l-1 -2l3 0l-1 -8l3 -9l-1 -3l-2 1Z" },
  { code: "36", nom: "Indre", niveau: "departement", d: "M413 379l9 -4l5 1l1 -3l3 0l0 -2l5 2l3 -2l4 5l4 1l1 4l-5 4l1 1l6 2l8 -2l3 2l-1 6l5 5l-2 6l5 2l-7 8l4 5l-3 3l6 5l-1 3l3 2l-2 9l3 7l-3 2l0 4l-5 1l-7 -3l-11 1l-1 -3l-4 1l1 2l-2 4l-3 -3l-3 3l-2 -2l-4 1l-2 -3l-7 7l-4 -5l-4 3l-6 0l0 -2l-2 0l2 -4l-4 -2l0 -5l-4 -4l-4 0l-1 -3l-6 -3l-2 -3l3 -6l-4 -6l4 0l1 2l3 -3l1 1l-1 -4l5 -16l0 -2l4 -5l4 -1l5 2l5 -8l3 -1l-3 -7Z" },
  { code: "37", nom: "Indre-et-Loire", niveau: "departement", d: "M368 329l1 -2l15 5l0 6l3 -3l5 2l1 3l2 -2l3 4l-2 3l5 9l-2 1l1 5l-1 8l4 3l4 -2l4 5l5 12l-3 1l-5 8l-5 -2l-6 2l-7 22l1 4l-1 -1l-2 3l-2 -2l-4 0l-3 -2l-1 -5l-7 -8l0 -7l-5 -3l-4 0l3 4l-7 0l-4 3l-5 -2l-3 2l-1 -13l-2 1l-2 -2l-2 1l-2 -2l1 -1l-1 -3l-2 1l-5 -2l-1 -4l2 -11l7 -10l-1 -2l4 -9l-1 -4l2 -7l10 5l1 -1l-2 -5l2 -1l4 2l0 -2l9 -3l2 -2Z" },
  { code: "38", nom: "Isère", niveau: "departement", d: "M704 531l8 13l0 4l3 -1l9 5l0 -9l4 -1l5 5l6 0l3 4l1 7l-3 3l-1 4l3 4l-1 5l3 -1l5 2l-2 3l1 4l-1 1l-1 5l8 1l1 5l2 0l-1 9l-3 -2l-3 2l-9 0l-5 4l-2 -2l-5 4l2 2l-4 3l-5 0l-3 5l-3 1l-8 -3l-4 -5l-9 -1l2 -3l-2 0l1 -25l-7 4l-11 -3l-5 0l2 -4l0 -5l-1 -3l0 -5l-4 0l1 -4l-4 1l-1 -3l-5 -3l-7 5l-6 0l-2 -2l-2 -10l1 -3l7 -7l-4 -5l1 -1l15 -3l1 -5l7 -5l-5 -2l-2 -5l2 0l1 -3l8 5l8 -12l5 3l0 4l11 11l-1 1l5 7Z" },
  { code: "39", nom: "Jura", niveau: "departement", d: "M691 367l4 4l7 -2l3 5l6 5l0 5l-2 3l1 3l-3 3l1 1l2 0l1 -3l1 3l10 3l3 10l9 5l5 5l-9 8l3 4l-4 4l7 6l-5 8l1 2l-11 16l-4 2l-9 1l0 -5l-5 -3l-7 7l-5 1l0 -6l-2 1l-1 -2l-4 -2l1 -2l-6 -3l2 -5l6 -1l-1 -3l-3 -2l1 -6l2 0l2 -5l-3 -5l0 -4l-2 0l1 -4l-4 -4l9 -3l-4 -3l0 -2l-5 0l-2 -4l-3 -1l0 -3l3 -4l-2 -1l0 -2l7 -4l4 -6l2 -14l2 -1Z" },
  { code: "40", nom: "Landes", niveau: "departement", d: "M295 727l-7 3l-5 -2l-3 1l-1 -1l2 -2l-1 -1l-11 5l-4 -3l-4 2l-3 -4l-7 4l-8 0l-2 3l-5 -2l-7 3l0 -2l3 0l-3 -4l-9 4l-5 1l-4 -1l-4 -4l-3 1l6 -13l12 -45l6 -33l10 -3l2 -2l6 2l-1 7l6 0l5 3l12 -4l3 2l0 4l17 12l-1 7l8 2l4 -1l0 -6l3 1l3 6l0 5l19 3l-6 12l-1 10l-5 -3l2 -3l-3 -3l-3 4l-7 1l-4 3l2 2l0 7l-2 0l2 7l-4 2l0 6l-3 1l3 6Z" },
  { code: "41", nom: "Loir-et-Cher", niveau: "departement", d: "M384 289l6 0l1 1l6 -3l0 1l-4 2l8 2l1 4l3 1l2 6l3 -1l1 2l7 1l1 -3l3 1l0 -4l6 3l3 0l-3 4l4 7l-4 3l3 4l-2 3l4 4l1 -3l6 3l2 7l6 0l0 -3l6 1l1 2l8 -2l10 1l1 5l-8 4l1 3l4 0l2 5l2 1l-1 7l-2 1l-1 -3l-6 4l3 8l-1 3l-9 2l-4 -3l-3 3l1 4l-2 1l-7 -2l-4 -5l-3 2l-5 -2l0 2l-3 0l-1 3l-5 -1l-9 4l-6 -10l-4 2l-4 -3l1 -8l-1 -5l2 -1l-5 -9l2 -3l-3 -4l-2 2l-1 -3l-5 -2l-3 3l0 -6l-15 -5l-1 2l-3 -2l14 -12l-1 -5l5 -5l-1 -5l1 -3l-2 -1l0 -4l3 0l0 -3Z" },
  { code: "42", nom: "Loire", niveau: "departement", d: "M585 469l0 6l5 1l1 3l3 0l5 -3l6 2l1 -1l1 1l3 -1l0 3l1 0l7 -6l3 2l-2 1l3 2l-2 3l-2 -1l-4 2l-1 5l-4 2l5 5l-5 1l7 6l-2 3l2 2l3 2l-1 8l-2 1l4 2l-2 7l10 10l4 -1l4 1l0 2l3 -2l-1 8l3 1l1 -2l3 4l0 9l-10 5l0 6l-8 2l-5 -4l-3 1l-1 -4l-2 -1l2 -2l-1 -3l-5 1l-3 -3l-6 0l1 2l-3 0l-4 3l-1 -2l-2 3l-2 -4l-3 0l-2 3l-1 -2l0 -5l4 -3l2 -5l-4 -8l-7 -5l-5 -11l-4 -5l4 -9l-4 -4l1 -5l4 1l4 -3l-3 -15l1 -1l-3 -7l9 -4Z" },
  { code: "43", nom: "Haute-Loire", niveau: "departement", d: "M586 558l1 2l2 -3l3 0l2 4l2 -3l1 2l4 -3l3 0l-1 -2l2 0l5 0l2 3l5 -1l1 3l-2 2l2 1l1 4l3 -1l5 5l-3 9l-5 -1l2 2l-4 5l3 3l-5 1l-1 3l1 2l-6 2l-4 8l-9 1l0 3l-3 2l-3 -1l-2 5l-4 3l-8 -9l-5 1l-1 -4l-2 -1l-2 0l-1 5l-7 2l-6 -14l-3 -2l-1 -5l-3 -1l3 -7l-4 -1l-2 -5l1 -4l-2 -1l-2 -6l-6 0l-1 -7l4 0l9 -6l11 1l3 -2l8 8l4 -4l6 3l3 -4l2 3l4 0Z" },
  { code: "44", nom: "Loire-Atlantique", niveau: "departement", d: "M164 343l3 -3l1 2l6 0l1 -4l3 -1l1 2l3 -1l1 2l2 -1l0 -2l3 -1l3 -11l14 -5l14 1l2 -5l11 -4l0 -3l5 1l1 3l8 3l-1 4l4 1l3 10l9 4l-4 2l1 6l5 1l0 11l-4 1l-10 0l-11 4l-1 2l4 0l2 5l4 1l1 5l-5 5l0 3l4 1l4 4l0 2l-6 -1l-4 -4l-2 4l-6 1l0 7l-6 3l0 -11l-2 -1l-4 3l3 13l-3 2l-11 -3l-2 -5l-6 0l1 -3l-6 -2l-8 -12l-12 -4l1 -3l4 -1l-1 -11l-8 4l-4 -4l-5 1l-5 -3l1 -4l-3 -5l8 -4l-1 -2Z" },
  { code: "45", nom: "Loiret", niveau: "departement", d: "M520 285l6 3l7 16l-8 8l1 10l-11 3l0 3l6 8l0 4l2 3l-8 2l1 3l-3 2l-4 -2l-3 0l0 3l-4 0l-4 -6l-3 -2l-4 0l-3 -4l-5 3l-5 -5l-4 1l-2 -6l-13 0l-4 2l-1 -2l-6 -1l0 3l-4 1l-2 -1l-2 -7l-6 -3l-1 3l-4 -4l2 -3l-3 -4l4 -3l0 -3l-4 -3l3 -5l-3 0l-1 -4l2 -2l4 2l4 -5l6 1l7 -1l9 -20l11 -2l3 -3l6 3l2 -2l2 2l3 -1l1 6l3 0l3 6l-1 4l-1 -1l-2 3l2 1l5 -1l9 1l4 -2l-1 -1l3 -1l2 4l7 -4Z" },
  { code: "46", nom: "Lot", niveau: "departement", d: "M417 591l7 -3l1 2l5 -1l10 11l3 0l6 -5l2 2l9 -2l3 7l-1 4l5 6l-2 8l2 5l0 3l2 3l-1 3l-3 1l-6 -1l-15 10l1 8l3 3l-2 2l-12 3l-5 4l-1 -3l-3 0l1 5l-4 2l-2 -5l-2 -1l-9 8l-1 -2l-4 -1l1 -6l-4 2l-8 -5l-3 -3l4 -4l-5 1l-5 -16l6 -2l6 -7l0 -3l5 -1l7 -5l-1 -6l4 -1l0 -3l5 -3l-1 -4l1 -3l-1 -6l2 -1Z" },
  { code: "47", nom: "Lot-et-Garonne", niveau: "departement", d: "M337 613l3 4l0 7l5 1l7 -3l2 2l6 -4l2 3l8 -1l2 -2l3 4l-2 4l1 2l2 1l5 -4l4 0l5 4l0 3l-6 2l5 16l-6 2l-5 -2l-2 7l5 3l-3 8l-3 0l1 4l-1 3l-5 -2l0 3l-3 0l-1 4l-5 4l-7 -5l-2 2l-6 0l-6 4l-1 -1l-4 2l-6 -2l-2 0l-2 4l-2 -1l0 -1l-4 1l-1 -2l6 -12l-19 -3l0 -8l7 -4l-3 -8l7 -1l-2 -13l13 -11l2 -4l-3 -1l-3 -3l7 -4l0 2l2 -4l5 0Z" },
  { code: "48", nom: "Lozère", niveau: "departement", d: "M549 596l3 2l6 14l7 -2l1 -5l2 0l2 1l1 4l5 -1l8 9l3 12l2 5l2 0l3 11l-4 6l-4 1l5 6l-2 2l1 3l3 2l-2 1l0 7l-5 4l-6 0l-8 -5l-3 1l0 5l-14 -1l-5 -6l-11 0l1 -4l-4 -1l-1 -3l-2 2l2 -5l-2 -6l1 -8l-5 -5l1 -7l-7 -7l5 -15l1 -3l2 0l1 -5l2 -2l3 4l4 -3l0 -4l3 1l5 -5Z" },
  { code: "49", nom: "Maine-et-Loire", niveau: "departement", d: "M246 316l1 -4l5 4l11 2l2 0l0 -3l7 4l2 -1l5 3l5 1l5 -2l3 0l2 -3l4 3l4 -1l3 5l7 2l2 -2l1 1l-2 2l1 4l4 2l4 -2l14 7l3 -1l0 -1l3 0l-2 7l1 4l-4 9l1 2l-7 10l-2 11l-2 -1l-5 8l-3 -1l-3 4l-3 -1l2 -3l-2 -1l-12 1l-3 2l-6 -1l-4 1l-1 5l-3 2l-4 -1l-3 1l-5 -2l-7 3l-2 -4l-14 -2l2 -3l-4 -4l-4 -1l0 -3l5 -5l-1 -5l-1 -1l-2 1l-3 -6l-4 0l3 -4l9 -2l13 0l1 -1l0 -7l0 -4l-5 -1l-1 -6l4 -2l-9 -4l-3 -10l-4 -1l1 -4Z" },
  { code: "50", nom: "Manche", niveau: "departement", d: "M262 162l-1 6l3 6l7 5l3 -3l2 2l-3 4l3 4l0 8l1 1l-20 19l3 1l3 4l7 -1l7 4l-1 2l7 5l-2 3l1 5l-7 9l-7 -1l-3 2l-13 -6l-4 1l0 2l-7 5l-3 -1l-4 -3l-5 -13l6 1l6 -3l-7 -4l-3 -5l-1 -8l-2 -2l5 -9l-4 -14l3 -15l-3 1l-5 -11l-5 -5l-4 -16l3 -3l0 -5l-1 -3l-5 -3l0 -5l20 9l6 0l4 -4l3 -1l10 2l2 8l-5 3l-1 4l8 13l0 3l3 2Z" },
  { code: "51", nom: "Marne", niveau: "departement", d: "M591 164l13 2l4 5l4 1l3 3l10 -1l4 6l3 -2l9 2l5 -3l6 5l-4 2l5 12l-2 4l4 0l-2 4l2 1l-6 5l-1 2l1 6l-3 2l0 2l8 5l0 4l-1 2l-14 2l0 1l5 2l0 2l-5 3l2 5l-8 0l-3 -2l-7 3l0 -2l-8 -1l-6 -5l2 -6l-2 -4l-10 1l-2 2l-3 -1l-1 3l-4 0l-3 6l-2 0l-1 3l-2 0l0 4l-3 2l-12 -2l-1 -3l-5 -5l-7 -4l2 -3l0 -5l-5 -2l1 -2l2 0l-1 -3l4 -1l2 -9l3 -1l1 -3l6 -6l-2 -2l-4 1l0 -3l3 -2l-1 -5l0 -2l8 -1l1 -2l-6 -3l-1 -10l13 -5l-1 -3l2 -1l2 1l1 -1l7 4l1 -4Z" },
  { code: "52", nom: "Haute-Marne", niveau: "departement", d: "M633 248l8 0l-2 -5l5 -3l0 -2l-5 -2l0 -1l14 -2l2 7l2 -2l1 4l16 7l11 9l-4 4l2 0l-1 4l4 -2l7 8l1 -2l3 2l-1 3l3 1l3 4l-3 1l0 3l-3 6l10 5l1 8l4 -1l3 5l-3 0l-3 6l-3 -1l0 3l-5 2l2 6l-1 6l-6 2l-2 -4l-2 4l-8 0l-3 8l-1 -2l-3 1l-3 2l-1 -3l-4 -4l0 -3l-3 4l-6 -3l-1 -3l-3 2l-2 -1l1 -3l-4 -4l5 -5l-6 -9l-3 2l-2 -2l3 -2l-6 -3l0 -4l-5 -1l0 -8l1 -1l7 0l2 -8l-1 -10l-3 -2l2 -2l-6 -3l1 -2l-4 0l-2 -5l-2 -1l2 -8Z" },
  { code: "53", nom: "Mayenne", niveau: "departement", d: "M261 245l4 2l3 -2l7 1l6 7l3 -1l-1 -2l4 -1l1 4l10 -6l4 -1l4 3l4 -3l3 2l2 -3l-2 -1l4 -2l4 4l-1 1l1 6l6 0l-1 7l-4 1l-3 3l1 13l-7 5l2 4l-1 5l-3 0l-5 5l4 5l-8 3l-1 3l2 1l0 2l-5 3l1 2l3 1l0 4l-4 0l-4 -3l-2 3l-13 1l-5 -3l-2 1l-7 -4l0 3l-2 0l-11 -2l-5 -4l6 -14l9 -3l0 -7l-4 -19l4 -6l-2 -11l1 -7Z" },
  { code: "54", nom: "Meurthe-et-Moselle", niveau: "departement", d: "M681 153l12 -6l3 1l4 -2l5 2l0 2l6 4l1 4l-2 3l3 4l-1 3l4 2l2 6l-3 6l3 2l-3 2l2 3l-5 1l0 1l2 4l6 4l0 3l4 1l2 3l9 0l3 3l-2 6l3 1l3 4l4 0l1 2l7 1l3 3l17 9l4 -2l7 5l4 7l2 -1l-9 4l-5 6l-2 -1l-3 4l-8 -1l-3 -2l-2 -4l-3 3l1 2l-3 -1l-2 2l-11 1l-2 -2l-5 3l-5 0l-2 5l-1 -2l-9 3l-2 -5l-5 -2l2 -3l0 -4l-3 -1l-4 2l-1 -1l0 -4l-4 -2l0 -3l4 -3l-2 -3l1 -5l-4 -4l2 -1l2 -8l-1 -4l2 -1l-3 -3l6 -4l-3 -3l3 -6l-3 -3l1 -3l-3 0l-2 -1l1 -7l-2 0l-1 -5l3 -6l-2 0l0 -4l-3 -6l-4 -3l-11 5l3 -3l-2 0l-1 -7Z" },
  { code: "55", nom: "Meuse", niveau: "departement", d: "M649 179l6 -5l-1 -4l4 -6l-3 -10l4 -10l3 3l4 -1l2 3l8 -8l5 8l-1 2l2 9l2 0l-3 3l11 -5l4 3l3 6l0 4l2 0l-3 6l1 5l2 0l-1 7l2 1l3 0l-1 3l3 3l-3 6l3 3l-6 4l3 3l-2 1l1 8l-4 5l4 4l-1 5l2 3l-4 3l0 3l4 2l-2 7l-4 0l-11 5l-4 0l-9 -9l-16 -7l-1 -4l-1 2l-3 -1l1 -12l-8 -5l3 -4l-1 -6l7 -7l-2 -1l2 -4l-4 0l2 -4l-5 -12l4 -2l-3 -3Z" },
  { code: "56", nom: "Morbihan", niveau: "departement", d: "M115 347l3 1l0 3l6 2l-2 2l-9 -1l-2 -8l4 1ZM97 298l2 3l3 -3l3 -1l2 -8l-2 -2l-4 2l-5 -5l-5 1l-5 -13l3 -4l8 -2l6 0l3 2l-1 1l2 1l4 -2l5 4l9 -2l1 -3l5 0l4 4l3 -1l5 4l3 -1l3 4l6 -2l-1 8l3 2l6 -4l2 -5l-1 -3l8 0l2 5l6 -1l2 2l0 5l4 -2l1 2l-5 1l-2 2l-1 4l9 1l4 7l-3 3l2 4l3 -1l0 2l-6 7l3 0l1 2l-5 1l3 11l-2 8l-3 1l0 2l-2 1l-1 -2l-3 1l-1 -2l-3 1l-1 4l-6 0l-1 -2l-4 3l-1 -5l4 0l-5 -3l-6 0l-3 -2l-2 4l-2 -1l-6 1l-3 -1l-4 -6l10 3l3 -4l-2 -6l-6 1l-4 4l-2 -2l-5 3l-1 -2l-7 1l-1 3l3 5l-3 1l-1 -3l1 -7l-4 -7l2 -4l1 1l3 -4l-3 -2l-3 9l-8 -9l-3 2l-4 1l-4 -7l0 -9Z" },
  { code: "57", nom: "Moselle", niveau: "departement", d: "M708 152l5 0l1 4l9 -2l2 -3l6 -1l7 5l4 -2l3 1l8 7l-1 4l8 12l2 0l1 5l7 1l1 -3l-2 -3l7 -1l6 3l2 7l3 -3l11 2l5 -3l0 -3l5 -1l1 2l3 -1l2 7l7 2l-3 12l-3 2l-5 -3l-8 3l-2 -3l-11 -2l-2 -7l-2 1l-2 11l-3 -1l-2 4l7 6l2 -1l0 2l-2 0l0 3l3 2l3 -3l0 -2l10 5l1 2l-4 8l2 2l2 0l-5 11l-3 3l-6 -1l-10 -9l-4 2l-17 -9l-3 -3l-7 -1l-1 -2l-3 1l-4 -5l-3 -1l2 -6l-3 -3l-9 0l-2 -3l-4 -1l0 -3l-6 -4l-2 -4l0 -1l5 -1l-2 -3l3 -2l-3 -2l3 -6l-2 -6l-4 -2l1 -3l-3 -4l2 -3l-1 -4l-3 -2Z" },
  { code: "58", nom: "Nièvre", niveau: "departement", d: "M516 348l-1 -3l8 -2l3 2l5 -3l4 6l3 0l2 3l3 -1l4 2l4 -3l6 2l0 -7l6 6l0 3l6 2l4 5l3 -1l3 2l2 -5l3 2l-2 2l0 3l5 -2l4 7l3 -3l5 1l1 9l3 -1l3 5l-1 4l-10 4l-1 4l2 1l-1 5l-4 3l1 1l2 -1l0 6l4 6l-3 2l1 5l-18 9l-1 -4l-3 -1l-4 1l-7 -1l2 3l-4 0l0 4l-1 -1l-5 4l-1 -6l-4 -1l-2 3l-5 -3l-5 4l-10 -8l-1 -3l2 -6l-1 -6l2 -4l0 -6l-4 -4l0 -7l-3 -13l-7 -6l4 -11l-4 -8Z" },
  { code: "59", nom: "Nord", niveau: "departement", d: "M467 8l30 -8l1 8l4 6l-3 3l3 10l5 0l6 9l2 0l3 3l3 -5l5 -3l4 0l1 -2l3 1l4 7l3 1l-2 4l3 13l6 3l6 -4l3 1l-2 3l7 0l4 4l0 8l3 7l2 -5l7 0l3 2l8 -3l6 6l0 2l5 0l1 2l-6 12l5 0l2 5l-6 6l1 3l-4 2l-7 -3l1 -4l-6 2l-12 -5l-6 5l-4 -3l-4 3l-8 -1l-1 2l-7 -2l-4 2l-3 -1l-2 -3l2 -4l-2 -2l4 -7l-1 -3l3 -1l-3 -4l-7 1l-1 -2l5 -3l-6 -8l5 -5l-3 0l-1 -4l-3 -3l-4 1l-1 -3l-5 0l-1 -5l5 -4l-3 -4l-3 1l-1 4l-2 0l0 -1l-5 1l-3 -2l-6 1l-7 -4l-2 -7l4 -3l-10 -2l-7 -17l-4 -4Z" },
  { code: "60", nom: "Oise", niveau: "departement", d: "M448 129l3 2l0 3l3 1l3 -2l12 4l2 -2l10 1l4 4l4 0l2 3l2 -1l4 4l4 -2l1 4l3 -5l7 1l0 -5l3 1l4 -5l2 2l3 -2l2 3l2 -4l4 1l-2 8l3 5l-1 5l-1 0l1 3l-1 2l4 3l-4 0l-2 9l-7 3l1 2l4 1l0 6l-5 0l0 3l3 1l0 -3l6 2l2 4l-2 1l-3 6l-13 1l-4 -2l-2 3l-8 -5l-3 3l-6 -3l1 -1l-2 -1l-11 -5l-3 3l-2 -3l-8 -1l-2 -2l-4 3l-8 2l-9 -2l-2 -9l5 2l1 -2l-5 -14l5 -9l-5 0l2 -3l-2 -11l2 -3l-1 -2l-2 2l0 -2l3 -5l3 -1Z" },
  { code: "61", nom: "Orne", niveau: "departement", d: "M277 222l9 -4l2 -2l-1 -3l4 2l13 -4l5 6l1 -4l12 3l13 -6l1 -3l4 -2l2 3l7 -4l4 3l3 -3l2 2l-1 4l2 2l8 2l2 -2l2 6l9 7l0 9l3 0l2 9l8 6l-2 4l0 7l-4 5l-7 3l3 11l-4 3l-7 -9l-2 2l-6 0l-3 -6l-5 -1l-2 -2l1 -9l-5 -5l-9 1l-7 5l0 3l-4 -2l-3 2l0 -8l-6 0l-1 -6l1 -1l-6 -4l-2 6l-3 -2l-4 3l-4 -3l-4 1l-10 6l-1 -4l-4 1l1 2l-3 1l-6 -7l5 -5l2 -4l-1 -5l2 -3l-7 -5l1 -2Z" },
  { code: "62", nom: "Pas-de-Calais", niveau: "departement", d: "M467 8l4 4l7 17l10 2l-4 3l2 7l7 4l6 -1l3 2l5 -1l0 1l2 0l1 -4l3 -1l3 4l-5 4l1 5l5 0l1 3l4 -1l3 3l1 4l3 0l-5 5l6 8l-5 3l1 2l7 -1l3 4l-3 1l1 3l-4 7l2 2l-3 5l-4 -1l-6 2l-2 -1l-1 -3l-6 4l-2 -1l3 -5l-1 -1l-2 -2l-3 3l-7 -2l-1 -3l-2 3l-1 -2l-2 0l-3 5l-4 -2l1 -5l7 -4l-3 -3l-3 -1l-2 3l-2 -2l-2 1l-2 -1l-7 3l-2 -1l-3 0l-2 -5l-7 -4l1 -2l-1 -1l-1 1l-9 -5l-7 3l-7 -6l2 -14l3 0l-3 -3l-1 -13l3 -6l-1 -11l4 0l8 -7l18 -5Z" },
  { code: "63", nom: "Puy-de-Dôme", niveau: "departement", d: "M495 482l5 3l3 -6l3 -2l0 -3l6 3l2 -5l3 -1l3 1l-2 7l8 7l5 -1l2 4l3 1l13 1l4 -2l2 1l2 5l8 0l11 12l-4 9l4 5l5 11l7 5l4 8l-2 5l-4 3l0 5l-4 0l-2 -3l-3 4l-6 -3l-4 4l-8 -8l-3 2l-11 -1l-9 6l-4 0l-6 7l-5 -3l-4 -7l-12 0l-3 -5l-11 -4l0 -7l-3 -5l1 -4l3 0l0 -6l-9 -12l5 -5l2 1l5 -9l3 -1l0 -6l-4 -5l1 -6Z" },
  { code: "64", nom: "Pyrénées-Atlantiques", niveau: "departement", d: "M295 727l10 0l4 7l0 4l-2 1l0 3l1 2l2 -3l2 2l-1 5l2 3l-5 4l2 3l-4 4l0 5l-4 -1l-2 5l-3 2l-1 7l-5 0l-2 3l0 7l-3 1l1 7l-6 5l-4 0l-4 -3l-3 4l-2 0l-2 -5l-5 -6l-3 0l-2 -8l-14 1l-12 -8l-1 2l-7 -5l-2 1l-3 -3l2 -4l-5 2l-1 6l-6 -2l-2 -5l4 -3l3 -12l-8 -4l-4 0l-1 3l-3 0l0 -5l-3 -1l-5 1l-2 -4l-2 -1l0 -2l11 -3l9 -11l3 -1l4 4l4 1l5 -1l9 -4l3 4l-3 0l0 2l7 -3l5 2l2 -3l8 0l7 -4l3 4l4 -2l4 3l11 -5l1 1l-2 2l1 1l3 -1l5 2l7 -3Z" },
  { code: "65", nom: "Hautes-Pyrénées", niveau: "departement", d: "M305 727l2 -2l4 0l2 6l3 3l4 0l3 8l-2 0l3 7l7 -2l4 2l0 3l4 -1l0 2l11 1l6 3l-6 6l2 1l-4 1l-6 8l8 6l-1 6l4 -3l1 6l2 2l-6 9l-6 -2l-2 15l1 3l-5 0l-3 -3l-5 5l-2 -4l-6 -3l-14 5l-4 -1l-6 -10l-2 1l-9 -7l-1 -7l3 -1l0 -7l2 -3l5 0l1 -7l3 -2l2 -5l4 1l0 -5l4 -4l-2 -3l5 -4l-2 -3l1 -5l-2 -2l-2 3l-1 -2l0 -3l2 -1l0 -4l-4 -7Z" },
  { code: "66", nom: "Pyrénées-Orientales", niveau: "departement", d: "M464 821l1 1l13 -8l-2 -10l13 -1l17 1l3 -6l6 -2l13 8l0 28l6 4l0 3l3 4l-6 1l-4 -4l-5 0l-1 -1l-2 2l-6 0l-3 4l-9 1l-1 2l1 5l-7 -2l-3 2l-4 0l-3 -5l-13 -5l-9 2l-4 5l-7 0l-3 -9l-4 0l-6 -4l-5 0l0 -6l17 -6l2 -4l12 0Z" },
  { code: "67", nom: "Bas-Rhin", niveau: "departement", d: "M821 190l7 1l3 -3l5 3l4 -3l11 6l9 2l-5 8l-3 8l-7 6l-1 3l-7 8l-2 7l0 5l-3 12l1 6l-3 3l-2 9l-5 10l-4 0l0 -3l-3 0l0 -5l-10 -3l-4 -6l-13 -4l2 -2l0 -11l-1 0l1 -3l-4 0l1 -2l6 1l6 -6l2 -8l-2 0l-2 -2l4 -8l-8 -7l-3 0l0 2l-3 3l-3 -2l0 -3l2 0l0 -2l-2 1l-7 -6l2 -4l3 1l2 -11l2 -1l2 7l11 2l2 3l8 -3l5 3l3 -2l3 -10Z" },
  { code: "68", nom: "Haut-Rhin", niveau: "departement", d: "M797 264l5 0l4 6l10 3l0 5l3 0l0 3l4 0l0 9l4 5l-4 9l-1 10l1 4l-2 4l5 12l-5 3l2 3l-2 3l-4 -1l-1 1l2 1l-2 3l-11 3l-5 -2l1 -4l-4 -1l0 -4l-3 -5l-4 0l-2 -2l3 -5l-1 -5l-12 -6l-1 -4l4 -2l-1 -4l2 -2l0 -9l4 -2l5 -11l-2 -1l2 -4l6 -13Z" },
  { code: "69", nom: "Rhône", niveau: "departement", d: "M618 474l1 -8l4 0l3 3l4 -3l4 3l2 -4l2 1l2 1l-2 3l4 2l0 5l4 2l-3 7l-1 15l5 1l0 3l3 -2l2 2l2 2l1 6l13 -1l-1 3l-2 0l0 2l7 5l-7 5l-1 5l-15 3l-1 1l4 5l-6 7l-4 -4l-1 2l-3 -1l1 -8l-3 2l0 -2l-4 -1l-4 1l-10 -10l2 -7l-4 -2l2 -1l1 -8l-3 -2l-2 -2l2 -3l-7 -6l5 -1l-5 -5l4 -2l1 -5l4 -2l2 1l2 -3l-3 -2l2 -1l-3 -2Z" },
  { code: "70", nom: "Haute-Saône", niveau: "departement", d: "M713 305l4 -5l1 4l5 -7l6 -2l3 7l4 2l9 -4l4 2l3 5l4 -1l5 -4l14 12l-4 6l4 11l-2 1l2 7l-2 1l-2 -1l-5 0l-3 3l-2 -2l0 4l-2 2l-9 -3l-6 2l-4 8l-4 0l-3 4l-2 -1l-6 6l-3 1l-4 -1l-12 8l-4 -1l-7 2l-7 -6l2 -7l-3 1l-2 -5l-4 -3l2 -3l3 0l2 -3l0 -8l-4 -2l-1 3l-2 -2l2 -5l8 0l2 -4l2 4l6 -2l1 -6l-2 -6l5 -2l0 -3l3 1l5 -8Z" },
  { code: "71", nom: "Saône-et-Loire", niveau: "departement", d: "M599 386l3 1l1 -3l2 -1l4 5l5 1l0 2l4 -1l2 4l5 3l3 -1l2 6l6 2l1 3l14 -5l0 -1l6 0l4 -2l3 2l9 -3l2 1l0 3l3 1l2 4l4 0l1 2l4 1l-1 3l-8 2l4 4l-1 4l2 0l0 4l3 5l-2 5l-2 0l-1 6l3 2l1 3l-7 2l-7 -2l-1 -3l-1 -1l-8 3l-4 -2l-4 -1l-10 34l-2 0l-2 -2l1 -4l-4 -2l2 -3l-4 -2l-2 4l-4 -3l-4 3l-3 -3l-4 0l-1 8l-7 6l-1 0l0 -3l-3 1l-1 -1l-1 1l-6 -2l-5 3l-3 0l-1 -3l-5 -1l1 -8l5 -2l1 -15l-3 -2l-7 0l-1 -4l-3 1l-4 -2l0 -6l-7 -10l0 -4l7 0l3 1l1 4l2 -1l16 -8l-1 -5l3 -2l-4 -6l0 -6l-2 1l-1 -1l4 -3l1 -5l-2 -1l1 -4l4 -1Z" },
  { code: "72", nom: "Sarthe", niveau: "departement", d: "M326 260l4 -1l4 2l0 -3l7 -5l9 -1l5 5l-1 9l2 2l5 1l3 6l6 0l2 -2l4 7l3 2l2 -2l7 5l0 1l-4 0l0 6l-3 0l0 4l2 1l-1 3l1 5l-5 5l1 5l-14 12l3 3l-11 4l0 2l-4 -2l-2 1l2 5l-1 1l-8 -5l-5 0l0 1l-3 1l-6 -2l-3 -4l-5 -1l-4 2l-4 -2l-1 -4l2 -2l-1 -1l-2 2l-9 -4l-1 -6l-3 -1l-1 -2l5 -3l0 -2l-2 -1l1 -3l8 -3l-4 -5l5 -5l3 0l1 -5l-2 -4l7 -5l-1 -13l3 -3l4 -1Z" },
  { code: "73", nom: "Savoie", niveau: "departement", d: "M783 511l1 6l3 3l6 4l5 0l-2 5l2 8l7 4l1 3l5 2l-4 8l2 7l-5 5l-1 -2l-6 2l0 3l-4 1l0 4l-3 1l-6 -3l-9 5l-4 -1l-7 3l1 4l-8 -1l-1 -4l-4 0l-4 -4l-7 0l1 -3l-3 -6l1 -4l3 -3l1 -3l-5 -8l-6 0l-5 -5l-4 1l0 9l-9 -5l-3 1l0 -4l-8 -12l4 -5l1 -6l3 0l2 -3l3 -19l2 0l1 9l3 4l3 -1l1 3l5 4l7 -3l3 3l0 3l3 0l0 1l7 -1l8 -19l3 -2l4 3l-2 1l1 4l4 2l4 0l2 3l0 4l7 -6Z" },
  { code: "74", nom: "Haute-Savoie", niveau: "departement", d: "M783 511l-7 6l0 -4l-2 -3l-4 0l-4 -2l-1 -4l2 -1l-4 -3l-3 2l-8 19l-7 1l0 -1l-3 0l0 -3l-3 -3l-7 3l-5 -4l-1 -3l-3 1l-3 -4l-1 -9l-2 0l-2 -5l0 -9l1 -3l4 2l2 -4l9 -3l5 1l10 -7l2 -4l-3 0l-2 -2l4 -9l3 -1l3 3l8 -7l19 1l0 6l5 4l-4 8l0 6l7 2l-1 7l3 -2l2 2l5 6l2 6l-7 7l-8 2l-1 5Z" },
  { code: "75", nom: "Paris", niveau: "departement", d: "M487 218l3 1l0 2l-9 1l-6 -4l6 -5l4 0l2 5Z" },
  { code: "76", nom: "Seine-Maritime", niveau: "departement", d: "M423 99l5 0l-1 3l14 12l7 15l-3 1l-3 5l0 2l2 -2l1 2l-2 3l2 11l-2 3l5 0l-5 9l-4 1l-5 -4l-13 -2l-4 3l-3 8l-7 0l-1 3l-6 1l0 3l-2 2l-5 -7l-3 2l-2 -3l1 -1l3 0l0 -4l-6 -1l-1 -3l-9 2l-2 -4l-3 0l-6 -5l-10 4l-13 -3l-2 -2l-1 -5l8 -16l24 -13l34 -8l18 -12Z" },
  { code: "77", nom: "Seine-et-Marne", niveau: "departement", d: "M497 234l2 -8l-2 -9l1 -12l-3 -3l3 -6l3 -3l8 5l2 -3l4 2l3 -1l5 1l5 -1l1 -4l6 2l0 8l6 5l1 3l2 -1l2 4l2 -2l1 5l5 4l2 -2l0 3l-4 1l1 3l-2 0l-1 2l5 2l0 5l-2 3l7 4l-5 5l-1 4l-3 0l2 3l-3 2l1 8l-3 0l0 2l-20 1l-2 5l1 4l-2 6l-2 0l-3 4l-7 4l-2 -4l-3 1l1 1l-4 2l-9 -1l-5 1l-2 -1l2 -3l1 1l1 -4l-3 -6l-3 0l-1 -6l1 -4l7 -5l-2 -11l3 -8l-1 -5l4 -2l-1 -1Z" },
  { code: "78", nom: "Yvelines", niveau: "departement", d: "M473 213l-2 1l-1 6l5 6l-9 4l-1 4l-2 0l-2 4l3 3l-3 6l-5 -1l2 3l-4 9l-3 0l-4 -3l-2 -4l1 -4l-5 -3l0 -3l-3 0l-4 -5l1 -3l-2 -1l3 -4l-3 -4l0 -7l-2 -1l0 -5l-2 -1l-4 -11l1 -2l1 1l8 -3l5 1l3 3l7 -3l2 2l0 4l3 -3l7 5l7 -1l-1 1l5 5l0 4Z" },
  { code: "79", nom: "Deux-Sèvres", niveau: "departement", d: "M265 395l7 -3l5 2l3 -1l4 1l3 -2l1 -5l4 -1l6 1l3 -2l12 -1l2 1l-2 3l5 0l2 7l2 1l2 8l-2 3l4 2l-1 2l-1 -1l-3 1l2 8l3 2l-7 10l6 2l-5 13l2 0l-1 6l4 4l-2 2l1 2l3 3l5 -4l2 1l-2 3l2 3l-3 1l1 3l-3 4l5 4l2 -1l-3 8l-2 -3l-5 1l-4 4l-3 0l-1 6l-4 2l-2 -1l-2 -6l-2 1l0 -2l-5 -1l-1 -2l-8 -1l-9 -6l-5 0l-5 -8l-4 -3l1 -5l3 -2l3 1l8 -7l-5 -3l0 3l-2 -3l2 -4l-1 -5l3 -2l-1 -9l-7 -14l2 -6l-5 -2l-3 -4l0 -5l-3 -1l-1 -3Z" },
  { code: "80", nom: "Somme", niveau: "departement", d: "M423 99l4 -4l4 -9l3 -1l2 3l6 0l-6 -7l-2 -1l0 -9l4 -1l3 3l9 -2l7 4l1 -1l1 1l-1 2l7 4l2 5l3 0l2 1l7 -3l2 1l2 -1l2 2l2 -3l3 1l3 3l-7 4l-1 5l4 2l3 -5l2 0l1 2l2 -3l1 3l7 2l3 -3l2 2l1 1l-3 5l2 1l6 -4l1 3l2 1l2 -2l9 0l5 4l1 3l-4 10l-4 5l4 12l-4 -1l-2 4l-2 -3l-3 2l-2 -2l-4 5l-3 -1l0 5l-7 -1l-3 5l-1 -4l-4 2l-4 -4l-2 1l-2 -3l-4 0l-4 -4l-10 -1l-2 2l-12 -4l-3 2l-3 -1l0 -3l-5 -4l-5 -13l-14 -12l1 -3l-5 0Z" },
  { code: "81", nom: "Tarn", niveau: "departement", d: "M454 676l11 -5l3 4l3 0l-3 1l6 1l1 2l7 4l1 2l4 1l4 7l-2 3l6 6l-1 4l8 10l4 1l5 -3l8 3l1 4l-2 4l-11 3l-2 -3l-6 -1l-2 9l3 4l1 6l-4 3l-13 0l-2 1l-10 -3l-3 2l0 5l-3 -3l-5 2l-7 -6l3 -3l-1 -2l-3 2l-5 -2l-6 -8l-10 -5l3 -2l-1 -4l-4 0l3 -2l-4 -4l0 -4l-4 -2l-3 -9l2 -3l-2 -1l2 -2l3 1l3 -5l3 -1l0 -2l-2 -2l-1 -5l8 2l3 -3l2 1l-1 -2l3 -1l4 1l-2 -2l2 0l5 1Z" },
  { code: "82", nom: "Tarn-et-Garonne", niveau: "departement", d: "M389 652l5 -1l-4 4l3 3l8 5l4 -2l-1 6l4 1l1 2l9 -8l2 1l2 5l4 -2l-1 -5l3 0l1 3l5 -4l12 -3l-1 5l7 1l-4 8l5 2l1 3l-5 -1l-2 0l2 2l-4 -1l-3 1l1 2l-2 -1l-3 3l-8 -2l1 5l2 2l-6 8l-3 -1l-2 2l2 1l0 2l-3 0l-3 3l-1 -2l-2 3l-5 -1l-2 1l1 2l-5 0l5 2l0 1l-7 4l-3 1l-4 -5l-4 2l-2 -2l-7 3l-4 -1l-2 -1l2 -3l-2 -1l0 -6l-6 -3l-2 1l-1 -2l5 -5l-1 -3l3 -1l-2 -2l-5 3l-1 -5l1 -3l3 0l0 -3l5 2l1 -3l-1 -4l3 0l3 -8l-5 -3l2 -7l5 2l6 -2Z" },
  { code: "83", nom: "Var", niveau: "departement", d: "M719 714l2 -3l3 1l2 3l6 -4l6 8l13 -13l3 0l5 5l4 1l2 -6l8 -2l3 2l4 -2l3 5l7 1l0 7l3 4l8 2l-2 6l1 4l3 2l0 2l-5 3l0 1l-5 1l-1 -1l-2 2l-2 6l-8 7l0 1l6 -2l2 1l-5 11l-5 -3l-4 4l-7 1l-2 1l0 5l-7 -3l-5 0l-3 3l0 6l-3 -1l1 -4l-7 1l-2 -3l-6 -2l-1 1l1 3l-4 4l-2 0l-2 -6l-3 -1l1 -1l-6 -1l-2 -3l1 -6l5 -3l-3 -5l-3 0l2 -4l-2 -4l7 -2l-6 -6l1 -6l-4 -3l2 -1l1 -5l6 -3l-3 -6Z" },
  { code: "84", nom: "Vaucluse", niveau: "departement", d: "M657 654l1 -4l5 -2l5 6l-2 0l-3 6l-6 0l0 -4l-2 -1l2 -1ZM640 663l0 -5l8 0l3 2l1 7l4 -3l4 0l9 -5l3 3l4 -3l-1 7l17 3l0 4l3 0l2 4l3 0l0 5l3 -1l-2 12l7 3l-4 10l8 -1l7 9l-2 3l-4 1l-4 3l-5 0l-16 -7l-10 0l-9 -4l-6 -8l-8 -4l-8 -1l5 -4l0 -2l2 0l0 -3l-10 -9l1 -8l-1 -2l-2 0l-2 -6Z" },
  { code: "85", nom: "Vendée", niveau: "departement", d: "M248 389l5 2l10 0l3 7l3 1l0 5l3 4l5 2l-2 6l7 14l1 9l-3 2l1 5l-2 4l2 3l0 -3l5 3l-8 7l-3 -1l-3 2l-6 -4l-1 2l-6 0l-2 -1l3 -4l-3 0l-11 5l-5 -1l0 5l-11 -9l-6 0l-3 -5l-7 -2l-13 -9l-2 -11l-5 -8l-13 -14l0 -7l2 0l7 -11l3 -1l4 5l6 2l-1 3l6 0l2 5l11 3l3 -2l-3 -13l4 -3l2 1l0 11l6 -3l0 -7l6 -1l2 -4l7 6ZM178 392l-4 -1l-2 -3l1 -4l4 2l-1 4l5 2l0 4l-1 0l-2 -4Z" },
  { code: "86", nom: "Vienne", niveau: "departement", d: "M318 388l1 -3l3 1l5 -8l3 5l5 2l2 -1l1 3l-1 1l2 2l2 -1l2 2l2 -1l1 13l3 -2l5 2l4 -3l7 0l-3 -4l4 0l5 3l0 7l7 8l0 3l8 10l-3 6l2 3l6 3l1 3l5 1l3 3l0 5l4 2l-6 8l-5 -2l-4 8l-6 -1l-4 6l-2 0l0 10l-7 -1l-2 3l-6 2l-4 -2l-3 -4l-4 3l3 2l-1 2l-4 1l-1 -1l-8 0l-5 -4l1 -6l-2 1l-5 -4l3 -4l-1 -3l3 -1l-2 -3l2 -3l-2 -1l-5 4l-3 -3l-1 -2l2 -2l-4 -4l1 -6l-2 0l5 -13l-6 -2l7 -10l-3 -2l-2 -8l3 -1l1 1l1 -2l-4 -2l2 -3l-2 -8l-2 -1l-2 -7Z" },
  { code: "87", nom: "Haute-Vienne", niveau: "departement", d: "M377 482l1 -4l-2 -4l3 -2l4 -6l6 1l4 -8l5 2l2 -4l4 0l0 2l6 0l4 -3l5 9l-2 5l1 2l-3 2l2 4l3 -1l3 6l0 4l3 1l-1 7l3 2l-3 5l1 1l4 -1l2 3l-3 1l0 3l5 2l6 -1l8 5l0 7l2 5l-6 1l-2 -2l-1 3l-5 2l-8 7l-6 1l-1 -2l-9 10l-6 -1l-1 3l-8 -3l-1 -2l3 -3l-4 -2l-2 1l-4 -8l-8 1l-2 -2l-4 4l-4 -4l2 -5l-3 -2l-6 0l-1 -2l6 -5l0 -4l4 2l4 -9l0 -5l2 1l6 -4l-1 -5l-7 -4l0 -7Z" },
  { code: "88", nom: "Vosges", niveau: "departement", d: "M685 258l9 -2l4 -3l2 1l4 -4l1 1l4 -2l4 2l-3 6l5 2l2 5l9 -3l1 2l2 -5l5 0l5 -3l2 2l11 -1l2 -2l3 1l-1 -2l3 -3l2 4l3 2l8 1l3 -4l2 1l5 -6l9 -4l-1 3l1 0l0 11l-2 2l7 1l1 3l-6 13l-2 4l2 1l-5 11l-4 2l0 9l-2 2l1 4l-6 4l-14 -12l-5 4l-4 1l-3 -5l-4 -2l-9 4l-4 -2l-3 -7l-6 2l-5 7l-1 -4l-4 5l-2 -3l-4 1l-1 -8l-10 -5l3 -6l0 -3l3 -1l0 -2l-6 -3l1 -3l-3 -2l-1 2l-5 -6l-2 -2l-4 2l1 -4l-2 0l4 -4Z" },
  { code: "89", nom: "Yonne", niveau: "departement", d: "M520 285l3 -4l2 0l2 -6l-1 -4l2 -5l20 -1l1 -3l3 4l5 -1l8 10l-1 3l1 1l-3 4l4 0l2 5l5 -3l0 3l4 3l1 6l3 3l-2 1l1 2l3 -2l0 6l10 1l1 -2l3 2l4 -3l3 1l-1 -3l3 4l3 1l1 2l-3 2l0 4l4 1l1 7l-3 3l-2 -1l1 4l-3 3l2 1l-3 5l-6 10l0 6l-3 4l3 6l-4 0l-3 3l-4 -7l-5 2l0 -3l2 -2l-3 -2l-2 5l-3 -2l-3 1l-4 -5l-6 -2l0 -3l-5 -3l0 -3l-1 7l-6 -2l-4 3l-4 -2l-3 1l-2 -3l-3 0l-4 -6l-5 3l-4 -2l-2 -6l1 -1l-6 -6l0 -5l11 -3l-1 -10l8 -8l-7 -16l-6 -3Z" },
  { code: "90", nom: "Territoire de Belfort", niveau: "departement", d: "M775 314l2 -2l1 4l12 6l1 5l-3 5l2 2l4 0l3 5l-1 5l-9 0l2 4l-4 2l-3 -6l3 -2l-5 -4l-4 1l-3 -7l2 -1l-4 -11l4 -6Z" },
  { code: "91", nom: "Essonne", niveau: "departement", d: "M475 226l9 5l8 -1l6 5l-4 2l1 5l-3 8l2 11l-11 10l-2 -2l-2 2l-4 -1l-2 -2l-3 3l-12 2l0 -11l-3 -1l-1 -6l4 -6l-2 -3l5 1l3 -6l-3 -3l2 -4l2 0l1 -4l9 -4Z" },
  { code: "92", nom: "Hauts-de-Seine", niveau: "departement", d: "M479 209l3 1l-1 3l-6 5l6 4l-1 8l-10 -10l1 -6l8 -5Z" },
  { code: "93", nom: "Seine-Saint-Denis", niveau: "departement", d: "M496 203l2 5l-1 9l1 6l-7 -6l-4 1l-2 -5l-4 0l1 -3l-3 -1l0 -2l3 1l3 -1l5 1l6 -5Z" },
  { code: "94", nom: "Val-de-Marne", niveau: "departement", d: "M481 222l9 -1l0 -2l-3 -1l4 -1l3 2l5 7l-2 8l-3 -1l-2 -3l-8 1l-4 -3l1 -6Z" },
  { code: "95", nom: "Val-d'Oise", niveau: "departement", d: "M498 196l-2 7l-6 5l-11 -1l-6 6l0 -4l-5 -5l1 -1l-7 1l-7 -5l-3 3l0 -4l-2 -2l-7 3l-3 -3l-5 0l7 -15l3 5l2 -1l6 3l8 -2l4 -3l2 2l8 1l2 3l3 -3l18 10Z" },
];

/** Les départements d'une région, par code INSEE de région. */
export const DEPARTEMENTS_PAR_REGION: Record<string, string[]> = {
  "84": [
    "01",
    "03",
    "07",
    "15",
    "26",
    "38",
    "42",
    "43",
    "63",
    "69",
    "73",
    "74"
  ],
  "27": [
    "21",
    "25",
    "39",
    "58",
    "70",
    "71",
    "89",
    "90"
  ],
  "53": [
    "22",
    "29",
    "35",
    "56"
  ],
  "24": [
    "18",
    "28",
    "36",
    "37",
    "41",
    "45"
  ],
  "94": [
    "2A",
    "2B"
  ],
  "44": [
    "08",
    "10",
    "51",
    "52",
    "54",
    "55",
    "57",
    "67",
    "68",
    "88"
  ],
  "32": [
    "02",
    "59",
    "60",
    "62",
    "80"
  ],
  "11": [
    "75",
    "77",
    "78",
    "91",
    "92",
    "93",
    "94",
    "95"
  ],
  "28": [
    "14",
    "27",
    "50",
    "61",
    "76"
  ],
  "75": [
    "16",
    "17",
    "19",
    "23",
    "24",
    "33",
    "40",
    "47",
    "64",
    "79",
    "86",
    "87"
  ],
  "76": [
    "09",
    "11",
    "12",
    "30",
    "31",
    "32",
    "34",
    "46",
    "48",
    "65",
    "66",
    "81",
    "82"
  ],
  "52": [
    "44",
    "49",
    "53",
    "72",
    "85"
  ],
  "93": [
    "04",
    "05",
    "06",
    "13",
    "83",
    "84"
  ]
};
