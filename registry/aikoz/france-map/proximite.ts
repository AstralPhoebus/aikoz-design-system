import { METRES_PAR_UNITE, projeter } from "./geometrie";
import type { PointCarte } from "./france-map";

/**
 * Mesurer la concurrence proche.
 *
 * Voir des points sur une carte répond à « où ». Ça ne répond pas à
 * « combien en face de nous, et est-ce qu'ils font mieux ». Cette mesure-là
 * est la question commerciale, et elle ne se lit pas à l'œil : deux cercles
 * qui se touchent à l'écran peuvent être à huit cents mètres comme à huit
 * kilomètres selon le niveau de zoom.
 *
 * Les distances sont calculées dans la boîte de la carte, en Lambert-93.
 * C'est exact : la projection est CONFORME et son facteur d'échelle varie de
 * moins d'un millième sur la métropole. Pas besoin de formule de grand
 * cercle pour comparer des agences d'une même agglomération.
 *
 * **Hors métropole, la mesure n'a pas de sens** et la fonction le dit plutôt
 * que de rendre un chiffre faux : un point que Lambert-93 ne sait pas placer
 * est écarté et compté à part.
 */

export interface VoisinProche {
  point: PointCarte;
  /** Distance à vol d'oiseau, en mètres. */
  metres: number;
}

export interface Voisinage {
  /** Le point de référence — une de nos agences. */
  point: PointCarte;
  /** Les points d'une AUTRE catégorie dans le rayon, du plus proche au plus loin. */
  voisins: VoisinProche[];
  /** Moyenne des valeurs du point de référence — reprise pour la comparaison. */
  valeur?: number;
  /** Moyenne des valeurs des voisins, ou `undefined` si aucun n'en porte. */
  moyenneVoisins?: number;
  /**
   * Écart entre notre valeur et celle des voisins. Positif = nous devant.
   * `undefined` dès qu'un des deux termes manque — mieux vaut pas de chiffre
   * qu'un chiffre construit sur du vide.
   */
  ecart?: number;
}

export interface ResultatProximite {
  voisinages: Voisinage[];
  /** Points écartés faute de position exploitable. Comptés, jamais tus. */
  ecartes: number;
}

function position(p: PointCarte): [number, number] | null {
  if (typeof p.lon !== "number" || typeof p.lat !== "number") return null;
  const xy = projeter(p.lon, p.lat);
  // Hors du domaine de Lambert-93, la formule rend n'importe quoi. On écarte.
  if (!Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) return null;
  if (xy[0] < -50 || xy[0] > 1050 || xy[1] < -50 || xy[1] > 1000) return null;
  return xy;
}

/**
 * Pour chaque point de `categorieReference`, les points des autres catégories
 * situés à moins de `rayonKm`.
 *
 * Seuls les points qui ont des COORDONNÉES entrent dans le calcul. Un point
 * replié sur le centroïde de son département est à une position inventée à
 * quelques dizaines de kilomètres près : le compter dans un rayon de deux
 * kilomètres produirait un chiffre qui a l'air juste et qui ne l'est pas.
 */
export function mesurerProximite(
  points: PointCarte[],
  {
    rayonKm,
    categorieReference,
  }: { rayonKm: number; categorieReference: string },
): ResultatProximite {
  const rayonUnites = (rayonKm * 1000) / METRES_PAR_UNITE;
  const places: Array<{ p: PointCarte; xy: [number, number] }> = [];
  let ecartes = 0;
  for (const p of points) {
    const xy = position(p);
    if (!xy) {
      ecartes++;
      continue;
    }
    places.push({ p, xy });
  }

  const voisinages: Voisinage[] = [];
  for (const { p, xy } of places) {
    if (p.categorie !== categorieReference) continue;
    const voisins: VoisinProche[] = [];
    for (const autre of places) {
      if (autre.p.id === p.id) continue;
      if (autre.p.categorie === categorieReference) continue;
      const d = Math.hypot(autre.xy[0] - xy[0], autre.xy[1] - xy[1]);
      if (d <= rayonUnites) {
        voisins.push({ point: autre.p, metres: Math.round(d * METRES_PAR_UNITE) });
      }
    }
    voisins.sort((a, b) => a.metres - b.metres);

    const avecValeur = voisins.filter((v) => typeof v.point.valeur === "number");
    const moyenneVoisins = avecValeur.length
      ? avecValeur.reduce((s, v) => s + (v.point.valeur as number), 0) / avecValeur.length
      : undefined;
    voisinages.push({
      point: p,
      voisins,
      valeur: p.valeur,
      moyenneVoisins,
      ecart:
        typeof p.valeur === "number" && typeof moyenneVoisins === "number"
          ? p.valeur - moyenneVoisins
          : undefined,
    });
  }
  return { voisinages, ecartes };
}

/** Une distance en mètres, dite comme on la dit. */
export function formaterDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;
}
