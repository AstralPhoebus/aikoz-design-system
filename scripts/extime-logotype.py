"""Isole le LOGOTYPE Extime du verrou co-brandé fourni.

Le fichier reçu est le verrou « extime — hosted by PARIS AÉROPORT ». Or la
charte Extime (p. 8) définit le logotype comme le losange encadré plus le mot
« extime », seul. Dans un panneau de navigation, le verrou réduit le logotype
à un tiers de la largeur : c'est ce qui le faisait paraître minuscule.

Ce n'est pas une modification du logo — interdite par la charte (p. 9,
interdits 2 et 5) — c'est une EXTRACTION : le verrou est un assemblage de deux
marques, on en garde une, sans toucher ni ses formes ni sa couleur.

L'extraction est propre parce que le SVG sépare les deux marques par classe :
`st0` (#004650, le vert malachite de la charte) porte le logotype Extime,
`st1`, `st2` et `st3` portent « hosted by » et le logo Paris Aéroport.
"""
import re, xml.etree.ElementTree as ET, pathlib

SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

src = pathlib.Path('logos/marque/EXTIME_idWp0vFhgt_1.svg')
arbre = ET.fromstring(src.read_text())

GARDE = 'st0'   # le vert malachite : le logotype Extime

def elaguer(parent):
    """Retire tout ce qui ne porte pas la classe gardée, puis les groupes vides."""
    for enfant in list(parent):
        tag = enfant.tag.split('}')[-1]
        if tag == 'style':
            continue
        cls = enfant.get('class')
        if cls and cls != GARDE:
            parent.remove(enfant); continue
        elaguer(enfant)
        if tag == 'g' and len(enfant) == 0:
            parent.remove(enfant)

elaguer(arbre)

# La feuille de style ne décrit plus que la classe restante.
for st in arbre.iter('{%s}style' % SVG):
    st.text = '.st0{fill:#004650;}'

sortie = pathlib.Path('logos/marque/extime-logotype.svg')
sortie.write_bytes(ET.tostring(arbre, encoding='utf-8'))
restants = len(re.findall(r'class="st0"', sortie.read_text()))
print(f'{restants} tracés conservés (classe {GARDE}), le reste du verrou retiré')
print(f'écrit {sortie} — viewBox encore celui du verrou, à recadrer')
