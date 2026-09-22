"""Projette la France en chemins SVG, une fois pour toutes.

Pourquoi pré-projeter plutôt que d'embarquer une carte
-------------------------------------------------------
Une carte dans un design system, c'est d'abord une question de POIDS et de
DÉPENDANCES. Les deux GeoJSON source pèsent 776 Ko et une bibliothèque de
projection en pèse 30 de plus. Or la France ne bouge pas : la projection peut
être calculée ici, une fois, et le composant n'embarque plus que des chaînes
`d` de `<path>`.

Résultat : **aucune dépendance géographique à l'exécution**, rien à tenir à
jour côté consommateur, et un rendu identique partout puisqu'il n'y a plus de
calcul au runtime.

Projection
----------
Lambert-93 (EPSG:2154), la projection officielle française — conique conforme
sur l'ellipsoïde GRS80. C'est celle qu'attend un jeu dérivé de l'IGN, et elle
ne déforme pas les surfaces de façon visible à l'échelle du pays.
Les coordonnées sont ensuite ramenées dans une boîte de 1000 unités de large,
l'axe Y retourné (SVG descend), et arrondies au dixième — soit une précision
de l'ordre de la centaine de mètres, très au-delà de ce qu'un écran montre.

Source des données
------------------
`france-geojson` (Grégoire David), versions simplifiées, dérivées d'ADMIN
EXPRESS de l'IGN — **Licence Ouverte / Open Licence (Etalab)**, redistribution
autorisée avec attribution. Les GeoJSON bruts ne sont PAS versionnés : seul le
dérivé l'est, avec sa mention de source.

  https://github.com/gregoiredavid/france-geojson

Usage
-----
    python3 scripts/carte-france.py <dossier-des-geojson>
"""
import json, math, sys, pathlib, collections

# ─── Lambert-93 ───────────────────────────────────────────────────────────────
A = 6378137.0                      # GRS80, demi-grand axe
F_APLAT = 1 / 298.257222101
E = math.sqrt(2 * F_APLAT - F_APLAT ** 2)
LAT0, LON0 = math.radians(46.5), math.radians(3.0)
LAT1, LAT2 = math.radians(44.0), math.radians(49.0)
X0, Y0 = 700000.0, 6600000.0


def _m(lat):
    return math.cos(lat) / math.sqrt(1 - E ** 2 * math.sin(lat) ** 2)


def _t(lat):
    return math.tan(math.pi / 4 - lat / 2) / (
        ((1 - E * math.sin(lat)) / (1 + E * math.sin(lat))) ** (E / 2)
    )


_N = math.log(_m(LAT1) / _m(LAT2)) / math.log(_t(LAT1) / _t(LAT2))
_F = _m(LAT1) / (_N * _t(LAT1) ** _N)
_RHO0 = A * _F * _t(LAT0) ** _N


def lambert93(lon, lat):
    lon, lat = math.radians(lon), math.radians(lat)
    rho = A * _F * _t(lat) ** _N
    theta = _N * (lon - LON0)
    return X0 + rho * math.sin(theta), Y0 + _RHO0 - rho * math.cos(theta)


# ─── Lecture et projection ───────────────────────────────────────────────────
def douglas_peucker(pts, tol):
    """Simplification de Ramer-Douglas-Peucker, en unités de la boîte.

    Le jeu source est déjà « simplifié », mais pour l'IGN : il garde de quoi
    zoomer sur une commune. Un tableau de bord montre la France sur 600 px de
    large — un point tous les deux kilomètres n'y est pas distinguable, il
    n'ajoute que du poids. Sans cette passe, le fichier généré pèse 244 Ko.
    """
    if len(pts) < 3:
        return pts
    debut, fin = pts[0], pts[-1]
    dx, dy = fin[0]-debut[0], fin[1]-debut[1]
    norme = math.hypot(dx, dy)
    pire, idx = -1.0, 0
    for i in range(1, len(pts)-1):
        x, y = pts[i]
        if norme == 0:
            d = math.hypot(x-debut[0], y-debut[1])
        else:
            d = abs(dy*x - dx*y + fin[0]*debut[1] - fin[1]*debut[0]) / norme
        if d > pire:
            pire, idx = d, i
    if pire <= tol:
        return [debut, fin]
    return douglas_peucker(pts[:idx+1], tol)[:-1] + douglas_peucker(pts[idx:], tol)


def anneaux(geom):
    """Aplatis une géométrie en liste d'anneaux (listes de points)."""
    if geom["type"] == "Polygon":
        return list(geom["coordinates"])
    if geom["type"] == "MultiPolygon":
        return [a for poly in geom["coordinates"] for a in poly]
    raise ValueError(geom["type"])


# ─── Outre-mer ────────────────────────────────────────────────────────────────
#
# Lambert-93 n'est valable QUE pour la métropole : appliquée à la Réunion, elle
# renvoie des coordonnées absurdes. Et même bien projeté, un territoire de
# quarante kilomètres placé à sa vraie position serait un point invisible à
# huit mille kilomètres du reste.
#
# Convention des cartes françaises : des CARTOUCHES, chacun à sa propre
# échelle, posés à côté de la métropole. Chaque territoire est donc projeté
# localement — équirectangulaire corrigée de la latitude, ce qui est exact à
# l'échelle d'une île — puis normalisé dans sa propre boîte.
DROM_REGION = {"01": "Guadeloupe", "02": "Martinique", "03": "Guyane",
               "04": "La Réunion", "06": "Mayotte"}
DROM_DEPARTEMENT = {"971": "Guadeloupe", "972": "Martinique", "973": "Guyane",
                    "974": "La Réunion", "976": "Mayotte"}


def locale(anneaux_, lat_moy):
    """Projection locale : x corrigé par cos(latitude), y tel quel."""
    k = math.cos(math.radians(lat_moy))
    return [[(x * k, y) for x, y in a] for a in anneaux_]


def charger(chemin):
    d = json.load(open(chemin))
    out = []
    for f in d["features"]:
        p = f["properties"]
        out.append({"code": p["code"], "nom": p["nom"],
                    "anneaux": [[lambert93(x, y) for x, y in a] for a in anneaux(f["geometry"])]})
    return out


def charger_brut(chemin, codes):
    """Les entités demandées, en degrés — pas de Lambert-93 ici."""
    d = json.load(open(chemin))
    out = []
    for f in d["features"]:
        p = f["properties"]
        if p["code"] not in codes:
            continue
        out.append({"code": p["code"], "nom": codes[p["code"]],
                    "anneaux": anneaux(f["geometry"])})
    return out


def main(dossier):
    dossier = pathlib.Path(dossier)
    regions = charger(dossier / "regions-version-simplifiee.geojson")
    departements = charger(dossier / "departements-version-simplifiee.geojson")
    # La géométrie d'un territoire d'outre-mer est la MÊME au niveau région et
    # au niveau département — la Guadeloupe région et la Guadeloupe département
    # ont le même contour. On ne la stocke donc qu'une fois, avec ses deux
    # codes INSEE : l'émettre deux fois doublait douze kilo-octets pour rien.
    drom = []
    f_dep = dossier / "departements-avec-outre-mer.geojson"
    if f_dep.exists():
        vers_region = {"971": "01", "972": "02", "973": "03", "974": "04", "976": "06"}
        for e in charger_brut(f_dep, DROM_DEPARTEMENT):
            e["codeRegion"] = vers_region[e["code"]]
            drom.append(e)

    # Une seule boîte englobante pour les deux niveaux : sans ça, passer des
    # régions aux départements ferait sauter la carte d'une échelle à l'autre.
    tous = [p for jeu in (regions, departements) for e in jeu for a in e["anneaux"] for p in a]
    xmin = min(p[0] for p in tous); xmax = max(p[0] for p in tous)
    ymin = min(p[1] for p in tous); ymax = max(p[1] for p in tous)
    LARGEUR = 1000.0
    echelle = LARGEUR / (xmax - xmin)
    hauteur = round((ymax - ymin) * echelle, 1)

    # La boîte fait 1000 unités pour ~1100 km : une unité vaut donc un peu plus
    # d'un kilomètre, et le rendu fait 600 px de large. Une tolérance de 1,2
    # unité déplace un trait d'un demi-pixel au plus.
    TOLERANCE = 1.2
    # Sous ce seuil, un anneau est une île de moins de ~25 km² : invisible, et
    # il n'y en a pas qu'une.
    AIRE_MIN = 20.0

    def aire(pts):
        s = 0.0
        for i in range(len(pts)):
            x1, y1 = pts[i]; x2, y2 = pts[(i+1) % len(pts)]
            s += x1*y2 - x2*y1
        return abs(s) / 2

    def chemin_svg(anneaux_):
        morceaux = []
        for a in anneaux_:
            brut = [((x - xmin) * echelle, (ymax - y) * echelle) for x, y in a]
            simple = douglas_peucker(brut, TOLERANCE)
            pts, precedent = [], None
            for x, y in simple:
                q = (round(x), round(y))
                if q == precedent:
                    continue
                pts.append(q); precedent = q
            if len(pts) < 3 or aire(pts) < AIRE_MIN:
                continue
            # Chemin RELATIF : les écarts entre points voisins tiennent sur un
            # ou deux caractères là où les absolus en prennent trois ou quatre.
            bouts = [f"M{pts[0][0]} {pts[0][1]}"]
            px, py = pts[0]
            for x, y in pts[1:]:
                bouts.append(f"l{x-px} {y-py}")
                px, py = x, y
            morceaux.append("".join(bouts) + "Z")
        return "".join(morceaux)

    def bloc_drom(jeu):
        lignes = []
        for e in sorted(jeu, key=lambda e: e["code"]):
            pts = [p for a in e["anneaux"] for p in a]
            lat_moy = sum(p[1] for p in pts) / len(pts)
            proj = locale(e["anneaux"], lat_moy)
            tous_ = [p for a in proj for p in a]
            x0 = min(p[0] for p in tous_); x1 = max(p[0] for p in tous_)
            y0 = min(p[1] for p in tous_); y1 = max(p[1] for p in tous_)
            # Chaque cartouche a sa propre boîte de 100 de large : les
            # territoires ne sont PAS à la même échelle entre eux, et la
            # légende doit le dire. Les mettre à l'échelle commune ferait de
            # Mayotte un point de deux pixels à côté de la Guyane.
            LARG = 100.0
            ech = LARG / (x1 - x0)
            haut = round((y1 - y0) * ech, 1)
            morceaux = []
            for a in proj:
                brut = [((x - x0) * ech, (y1 - y) * ech) for x, y in a]
                # Tolérance proportionnelle : la boîte fait 100 unités, pas 1000.
                simple = douglas_peucker(brut, 0.35)
                q, prec = [], None
                for x, y in simple:
                    r = (round(x, 1), round(y, 1))
                    if r == prec:
                        continue
                    q.append(r); prec = r
                if len(q) < 3:
                    continue
                bouts = [f"M{q[0][0]} {q[0][1]}"]
                px, py = q[0]
                for x, y in q[1:]:
                    bouts.append(f"l{round(x-px,1)} {round(y-py,1)}")
                    px, py = x, y
                morceaux.append("".join(bouts) + "Z")
            lignes.append(f'  {{ code: "{e["code"]}", codeRegion: "{e["codeRegion"]}", '
                          f'nom: {json.dumps(e["nom"], ensure_ascii=False)}, '
                          f'd: "{"".join(morceaux)}", '
                          f'boite: {{ largeur: {LARG:.0f}, hauteur: {haut} }} }},')
        return "\n".join(lignes)

    def centroide(anneaux_):
        """Le centroïde pondéré par l'aire, pas la moyenne des sommets.

        La moyenne des sommets se déplace vers les côtes découpées : sur une
        région bretonne, elle sort dans la mer. Le centroïde d'aire, lui,
        tombe où l'on s'attend.
        """
        sx = sy = sa = 0.0
        for a in anneaux_:
            for i in range(len(a)):
                x1, y1 = a[i]; x2, y2 = a[(i + 1) % len(a)]
                w = x1 * y2 - x2 * y1
                sa += w; sx += (x1 + x2) * w; sy += (y1 + y2) * w
        if abs(sa) < 1e-9:
            pts = [p for a in anneaux_ for p in a]
            return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
        return sx / (3 * sa), sy / (3 * sa)

    def bloc_centroides(jeu):
        out = []
        for e in sorted(jeu, key=lambda e: e["code"]):
            pts = [((x - xmin) * echelle, (ymax - y) * echelle)
                   for a in e["anneaux"] for x, y in a]
            anx = []
            k = 0
            for a in e["anneaux"]:
                anx.append([((x - xmin) * echelle, (ymax - y) * echelle) for x, y in a])
            cx, cy = centroide(anx)
            out.append(f'  "{e["code"]}": [{cx:.1f}, {cy:.1f}],')
        return "\n".join(out)

    def boites(jeu):
        """La boîte englobante de chaque département, dans la boîte commune.

        Descendre au niveau commune en gardant le cadrage national rend le
        département minuscule — mesuré, moins de 1 % de la surface pour le
        Rhône. Il faut donc cadrer, et pour cadrer il faut la boîte. Elle est
        calculée ici plutôt qu'au runtime : la déduire en relisant les
        chaînes `d` demanderait d'écrire un parseur de chemin SVG.
        """
        out = []
        for e in sorted(jeu, key=lambda e: e["code"]):
            pts = [((x - xmin) * echelle, (ymax - y) * echelle)
                   for a in e["anneaux"] for x, y in a]
            bx0 = min(p[0] for p in pts); bx1 = max(p[0] for p in pts)
            by0 = min(p[1] for p in pts); by1 = max(p[1] for p in pts)
            out.append(f'  "{e["code"]}": {{ x: {bx0:.1f}, y: {by0:.1f}, '
                       f'largeur: {bx1-bx0:.1f}, hauteur: {by1-by0:.1f} }},')
        return "\n".join(out)

    def bloc(jeu, niveau):
        lignes = []
        for e in sorted(jeu, key=lambda e: e["code"]):
            d = chemin_svg(e["anneaux"])
            lignes.append(f'  {{ code: "{e["code"]}", nom: {json.dumps(e["nom"], ensure_ascii=False)}, '
                          f'niveau: "{niveau}", d: "{d}" }},')
        return "\n".join(lignes)

    sortie = f'''/**
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
 * Les coordonnées vivent dans une boîte de {LARGEUR:.0f} × {hauteur} unités, axe Y vers le
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

export interface ZoneOutreMer {{
  /** Code INSEE de DÉPARTEMENT — « 971 » la Guadeloupe. */
  code: string;
  /** Code INSEE de RÉGION du même territoire — « 01 » la Guadeloupe. */
  codeRegion: string;
  nom: string;
  d: string;
  /** Sa boîte à elle : un cartouche n'est pas à l'échelle de la métropole. */
  boite: {{ largeur: number; hauteur: number }};
}}

export interface ZoneCarte {{
  /** Code INSEE — « 11 » Île-de-France, « 75 » Paris. */
  code: string;
  nom: string;
  niveau: "region" | "departement";
  /** Attribut `d` d'un `<path>`, déjà projeté. */
  d: string;
}}

/** La boîte commune aux deux niveaux : passer de l'un à l'autre ne saute pas. */
export const BOITE = {{ largeur: {LARGEUR:.0f}, hauteur: {hauteur} }} as const;

export const REGIONS: ZoneCarte[] = [
{bloc(regions, "region")}
];

export const DEPARTEMENTS: ZoneCarte[] = [
{bloc(departements, "departement")}
];

/**
 * Les territoires d'outre-mer, chacun dans SA boîte.
 *
 * Ils ne sont pas à l'échelle de la métropole, ni entre eux : la Guyane fait
 * quinze fois la Martinique. À l'échelle commune, Mayotte serait un point de
 * deux pixels. C'est la convention des cartes françaises — des cartouches —
 * et le composant l'annonce en toutes lettres.
 *
 * Chacun est projeté LOCALEMENT (équirectangulaire corrigée de la latitude) :
 * Lambert-93 n'est valable que pour la métropole.
 */
export const OUTRE_MER: ZoneOutreMer[] = [
{bloc_drom(drom)}
];

/**
 * Où poser un point dont on ne connaît que la zone.
 *
 * Une agence a normalement des coordonnées. Quand elle n'a qu'un code de
 * département ou de région, on la place au centroïde — pondéré par l'aire,
 * pas la moyenne des sommets, qui sort dans la mer sur une côte découpée.
 *
 * C'est un pis-aller et ça se voit : plusieurs agences du même département
 * se superposent exactement. Le composant le signale plutôt que de les
 * disperser au hasard, ce qui inventerait des positions.
 */
export const CENTROIDES_REGION: Record<string, [number, number]> = {{
{bloc_centroides(regions)}
}};

/**
 * Deux tables et non une : le code « 11 » est l'Île-de-France en région ET
 * l'Aude en département. Les fusionner écrasait silencieusement l'une par
 * l'autre — le compilateur l'a dit, sinon une agence de Carcassonne serait
 * apparue à Paris.
 */
export const CENTROIDES_DEPARTEMENT: Record<string, [number, number]> = {{
{bloc_centroides(departements)}
}};

/**
 * Projette un point WGS84 (longitude, latitude) dans la boîte de la carte.
 *
 * C'est la même Lambert-93 que les contours, en vingt lignes. Elle est ici
 * parce qu'un contour se pré-calcule mais pas un point : une agence, un
 * concurrent, une adresse arrivent à l'exécution.
 *
 * Valable pour la MÉTROPOLE. Hors de son domaine — l'outre-mer, l'étranger —
 * elle renvoie des coordonnées qui sortent de la boîte ; le composant les
 * écarte plutôt que de les dessiner n'importe où.
 */
export function projeter(lon: number, lat: number): [number, number] {{
  const A = 6378137;
  const E = {E!r};
  const N = {_N!r};
  const F = {_F!r};
  const RHO0 = {_RHO0!r};
  const LON0 = {LON0!r};
  const rad = (d: number) => (d * Math.PI) / 180;
  const phi = rad(lat);
  const t =
    Math.tan(Math.PI / 4 - phi / 2) /
    Math.pow((1 - E * Math.sin(phi)) / (1 + E * Math.sin(phi)), E / 2);
  const rho = A * F * Math.pow(t, N);
  const theta = N * (rad(lon) - LON0);
  const x = 700000 + rho * Math.sin(theta);
  const y = 6600000 + RHO0 - rho * Math.cos(theta);
  return [
    Math.round((x - {xmin!r}) * {echelle!r} * 10) / 10,
    Math.round(({ymax!r} - y) * {echelle!r} * 10) / 10,
  ];
}}

/**
 * La boîte englobante de chaque département, dans la boîte commune.
 *
 * Elle sert à CADRER quand on descend au niveau commune : au cadrage
 * national, le Rhône occupe moins de 1 % de la surface et ses communes sont
 * illisibles. Les départements voisins restent dessinés derrière, ce qui
 * donne le contexte sans faire sauter l'échelle d'un cran à l'autre.
 */
export const BOITES_DEPARTEMENT: Record<
  string,
  {{ x: number; y: number; largeur: number; hauteur: number }}
> = {{
{boites(departements)}
}};

/** Les départements d'une région, par code INSEE de région. */
export const DEPARTEMENTS_PAR_REGION: Record<string, string[]> = {json.dumps(
        RATTACHEMENT, ensure_ascii=False, indent=2)};
'''
    cible = pathlib.Path('registry/aikoz/france-map/geometrie.ts')
    cible.parent.mkdir(parents=True, exist_ok=True)
    cible.write_text(sortie)
    print(f'{cible} — {cible.stat().st_size/1024:.0f} Ko, '
          f'{len(regions)} régions, {len(departements)} départements, '
          f'boîte {LARGEUR:.0f}×{hauteur}')


# Rattachement département -> région (INSEE 2016). Écrit en clair : le GeoJSON
# des départements ne le porte pas, et le déduire d'une intersection
# géométrique serait fragile pour un fait administratif stable.
RATTACHEMENT = {
    "84": ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
    "27": ["21", "25", "39", "58", "70", "71", "89", "90"],
    "53": ["22", "29", "35", "56"],
    "24": ["18", "28", "36", "37", "41", "45"],
    "94": ["2A", "2B"],
    "44": ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
    "32": ["02", "59", "60", "62", "80"],
    "11": ["75", "77", "78", "91", "92", "93", "94", "95"],
    "28": ["14", "27", "50", "61", "76"],
    "75": ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
    "76": ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
    "52": ["44", "49", "53", "72", "85"],
    "93": ["04", "05", "06", "13", "83", "84"],
}

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
