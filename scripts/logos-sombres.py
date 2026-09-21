"""Dérive la version SOMBRE de chaque logo depuis le SVG fourni.

Monochrome blanc. C'est la version que toute charte prévoit pour les fonds
sombres, et la dériver ne touche AUCUNE forme : seules les valeurs de
remplissage changent. Reprendre le fichier clair, lui, donnait une tache
illisible — mesuré contre les cartes sombres réelles : 1,31:1 pour l'encre
d'ADP, 1,14 à 1,62 pour les trois teintes principales d'Extime.

Le blanc plutôt qu'un bichrome : sur le verrou Extime, garder l'orange
d'« AÉROPORT » (4,16:1, il passerait) produirait un lockup blanc-et-orange
qu'aucune charte n'a validé. Le monochrome est la seule variante qu'elles
prévoient toutes.
"""
import re, pathlib

SOURCES = {
    'adp-clair.svg': 'adp-sombre.svg',
    'extime-clair.svg': 'extime-sombre.svg',
    'generali-clair.svg': 'generali-sombre.svg',
}
NOTE = ('<!-- Version sombre DÉRIVÉE du fichier clair fourni : tous les '
        'remplissages passés au blanc, aucune forme modifiée. À remplacer par '
        'la version officielle de la charte dès qu\'elle est transmise. -->')

base = pathlib.Path('public/logos')
for src, dst in SOURCES.items():
    s = (base / src).read_text()
    avant = set(re.findall(r'#[0-9A-Fa-f]{6}', s))
    # `fill:#xxx` dans les styles, `fill="#xxx"` sur les éléments.
    s = re.sub(r'(fill\s*:\s*)#[0-9A-Fa-f]{6}', r'\1#FFFFFF', s)
    s = re.sub(r'(fill=")#[0-9A-Fa-f]{6}(")', r'\1#FFFFFF\2', s)
    s = re.sub(r'(stroke\s*:\s*)#[0-9A-Fa-f]{6}', r'\1#FFFFFF', s)
    s = re.sub(r'(stroke=")#[0-9A-Fa-f]{6}(")', r'\1#FFFFFF\2', s)
    reste = set(re.findall(r'#[0-9A-Fa-f]{6}', s)) - {'#FFFFFF'}
    s = s.replace('<svg', NOTE + '\n<svg', 1)
    (base / dst).write_text(s)
    print(f'{dst:22} {len(avant)} teinte(s) -> blanc' +
          (f'  ⚠ restent : {sorted(reste)}' if reste else ''))
