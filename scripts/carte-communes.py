"""Découpe les communes en un fichier par département, prêt à charger.

35 191 communes, 4,5 Mo une fois projetées : impossible à embarquer dans un
composant. Mais personne ne regarde la France entière à l'échelle communale —
on regarde UN département, ou UNE ville. Le découpage par département suit
donc l'usage.

    par département   48 Ko en moyenne, 99 Ko au pire (Pas-de-Calais)
    sur le réseau     ~15 Ko, gzippé (ratio 0,32 mesuré sur nos fichiers)

Même projection et MÊME BOÎTE que les régions et les départements : une
commune reste à sa place quand on descend, elle ne saute pas au centre.

Source : france-geojson (Grégoire David), dérivé d'ADMIN EXPRESS de l'IGN —
Licence Ouverte / Etalab. Le GeoJSON brut n'est pas versionné.

Usage
-----
    python3 scripts/carte-communes.py <dossier-des-geojson>
"""
import json, math, sys, pathlib, collections

exec(open('scripts/carte-france.py').read().split('def main(')[0])

# La boîte est celle de la métropole, figée dans le fichier généré : la
# recalculer sur les communes donnerait des bornes légèrement différentes, et
# les deux couches ne se superposeraient plus.
GEOM = pathlib.Path('registry/aikoz/france-map/geometrie.ts').read_text()


def borne(nom):
    import re
    m = re.search(rf'{nom}: ([\d.]+)', GEOM)
    return float(m.group(1))


def main(dossier):
    dossier = pathlib.Path(dossier)
    src = dossier / 'communes-version-simplifiee.geojson'
    d = json.load(open(src))

    # On reprojette tout pour retrouver exactement la même boîte que
    # `carte-france.py` : elle se calcule sur les régions ET les départements.
    ref = []
    for f in ('regions-version-simplifiee.geojson', 'departements-version-simplifiee.geojson'):
        for e in json.load(open(dossier / f))['features']:
            for a in anneaux(e['geometry']):
                ref.extend(lambert93(x, y) for x, y in a)
    xmin = min(p[0] for p in ref); xmax = max(p[0] for p in ref)
    ymin = min(p[1] for p in ref); ymax = max(p[1] for p in ref)
    echelle = 1000.0 / (xmax - xmin)

    TOLERANCE = 0.3          # une commune est petite : la tolérance suit
    sans_geometrie = []
    par_dep = collections.defaultdict(list)

    for f in d['features']:
        if f.get('geometry') is None:
            # 37 communes du jeu source n'ont pas de contour. On les signale
            # plutôt que de les perdre en silence.
            sans_geometrie.append(f['properties']['code'])
            continue
        p = f['properties']
        morceaux = []
        for a in anneaux(f['geometry']):
            brut = [((lambert93(x, y)[0] - xmin) * echelle,
                     (ymax - lambert93(x, y)[1]) * echelle) for x, y in a]
            simple = douglas_peucker(brut, TOLERANCE)
            pts, prec = [], None
            for x, y in simple:
                q = (round(x, 1), round(y, 1))
                if q == prec:
                    continue
                pts.append(q); prec = q
            if len(pts) < 3:
                continue
            bouts = [f"M{pts[0][0]} {pts[0][1]}"]
            px, py = pts[0]
            for x, y in pts[1:]:
                bouts.append(f"l{round(x-px,1)} {round(y-py,1)}")
                px, py = x, y
            morceaux.append("".join(bouts) + "Z")
        if morceaux:
            # Le centroïde, pondéré par l'aire : une agence qui n'a qu'un
            # code INSEE se pose là. Deux nombres par commune, c'est le prix
            # d'un point placé au bon endroit plutôt qu'au hasard.
            sx = sy = sa = 0.0
            for a in anneaux(f['geometry']):
                proj = [((lambert93(x, y)[0] - xmin) * echelle,
                         (ymax - lambert93(x, y)[1]) * echelle) for x, y in a]
                for i in range(len(proj)):
                    x1, y1 = proj[i]; x2, y2 = proj[(i + 1) % len(proj)]
                    w = x1 * y2 - x2 * y1
                    sa += w; sx += (x1 + x2) * w; sy += (y1 + y2) * w
            if abs(sa) > 1e-9:
                c = [round(sx / (3 * sa), 1), round(sy / (3 * sa), 1)]
            else:
                pts_ = [q for a in anneaux(f['geometry'])
                        for q in (((lambert93(x, y)[0] - xmin) * echelle,
                                   (ymax - lambert93(x, y)[1]) * echelle) for x, y in a)]
                c = [round(sum(q[0] for q in pts_) / len(pts_), 1),
                     round(sum(q[1] for q in pts_) / len(pts_), 1)]
            par_dep[p['code'][:2]].append(
                {"code": p['code'], "nom": p['nom'], "d": "".join(morceaux), "c": c})

    cible = pathlib.Path('public/communes')
    cible.mkdir(parents=True, exist_ok=True)
    total = 0
    for dep, lst in sorted(par_dep.items()):
        lst.sort(key=lambda z: z['code'])
        f = cible / f'{dep}.json'
        f.write_text(json.dumps({"departement": dep, "zones": lst}, ensure_ascii=False, separators=(',', ':')))
        total += f.stat().st_size
    pire = max((cible / f'{d}.json').stat().st_size for d in par_dep)
    print(f'public/communes/ — {len(par_dep)} fichiers, {total/1048576:.1f} Mo au total, '
          f'{total/len(par_dep)/1024:.0f} Ko en moyenne, {pire/1024:.0f} Ko au pire')
    print(f'{sum(len(v) for v in par_dep.values())} communes écrites, '
          f'{len(sans_geometrie)} sans contour dans la source (ignorées)')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
