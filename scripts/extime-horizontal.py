"""Compose la version HORIZONTALE du logotype Extime à partir de ses tracés.

Le fichier reçu ne contient que la version verticale (symbole au-dessus du
mot), prise dans le verrou co-brandé. Alice a envoyé la version horizontale en
image : symbole à gauche, « extime » à sa droite. La charte confirme qu'elle
existe — page 8, N.B. : « Ces principes s'appliquent également à la version
horizontale du logotype Extime ».

On ne redessine rien : les tracés sont ceux du fichier officiel, on ne change
que leur POSITION relative. Les proportions du symbole et du mot restent
exactement celles de la version verticale ; seul l'espacement entre les deux
est un choix, calé sur l'image de référence.

À remplacer par le fichier officiel horizontal dès qu'il est disponible.
"""
import xml.etree.ElementTree as ET, pathlib, re

SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)

# Boîtes mesurées dans le navigateur sur la version verticale extraite.
SYMBOLE = (36.1, 0.0, 43.0, 55.6)      # x, y, largeur, hauteur
MOT     = (0.2, 62.4, 114.71, 26.7)
ECART   = 0.35                          # part de la largeur du symbole
HAUSSE  = 0.076                         # le mot est légèrement au-dessus de l'axe du symbole

sx, sy, sw, sh = SYMBOLE
mx, my, mw, mh = MOT
ecart = ECART * sw
cible_x = sx + sw + ecart
centre_symbole = sy + sh / 2
cible_centre_mot = centre_symbole - HAUSSE * sh
dx = cible_x - mx
dy = cible_centre_mot - (my + mh / 2)

arbre = ET.fromstring(pathlib.Path('logos/marque/extime-logotype.svg').read_text())

# Le symbole est le seul tracé au-dessus de y=60 ; tout le reste est le mot.
# On les sépare par cette hauteur plutôt que par un index : un index se périme
# au premier réenregistrement du fichier source.
groupe_mot = ET.Element('{%s}g' % SVG, {'transform': f'translate({dx:.3f} {dy:.3f})'})

def repartir(parent):
    for enfant in list(parent):
        tag = enfant.tag.split('}')[-1]
        if tag in ('path', 'rect', 'polygon', 'line', 'circle'):
            d = enfant.get('d') or ''
            m = re.search(r'[-\d.]+[,\s]+([-\d.]+)', d) if d else None
            y = float(enfant.get('y')) if enfant.get('y') else (float(m.group(1)) if m else 99)
            if y > 58:                      # appartient au mot
                parent.remove(enfant); groupe_mot.append(enfant)
        elif tag == 'g':
            repartir(enfant)

repartir(arbre)
arbre.append(groupe_mot)

# Nouveau cadre, au plus juste (règle d'intégration des logos).
x0 = sx
y0 = 0.0
x1 = cible_x + mw
y1 = sh
arbre.set('viewBox', f'{x0} {y0} {x1-x0:.2f} {y1-y0:.2f}')
for attr in ('width', 'height', 'x', 'y', 'style'):
    arbre.attrib.pop(attr, None)

pathlib.Path('public/logos/extime-clair.svg').write_bytes(ET.tostring(arbre, encoding='utf-8'))
print(f'viewBox {x0} {y0} {x1-x0:.2f} {y1-y0:.2f}  — rapport {(x1-x0)/(y1-y0):.2f}')
print(f'mot déplacé de ({dx:.2f}, {dy:.2f})')
