"""RÈGLE D'INTÉGRATION : un logo entre dans le système cadré au plus juste.

Le défaut qui l'a imposée : le SVG du Groupe ADP porte un viewBox de
113,4 × 56,7 pour un tracé de 85 × 29,2 — 49 % de la hauteur est du vide. À
`h-6`, le logo visible ne fait donc que 12 px de haut là où celui de Generali,
cadré au plus juste, en fait 24. Ce n'est pas un réglage à faire marque par
marque dans le composant : c'est une propriété du FICHIER, et elle se corrige
à l'entrée, une fois.

La règle : le viewBox est ramené à la boîte englobante du tracé. Aucune forme
n'est touchée, aucune couleur — seul le cadre change. Le logo livré par la
marque reste le logo livré par la marque.

La boîte englobante se mesure dans un navigateur (`svg.getBBox()`), parce
qu'elle dépend des transformations et des épaisseurs de trait : un calcul
approché sur les `d=` se tromperait. Les valeurs ci-dessous ont été relevées
ainsi ; pour en ajouter une, ouvrir le SVG et lire `getBBox()`.
"""
import re, pathlib, json

# viewBox d'origine -> boîte englobante mesurée (x, y, largeur, hauteur)
MESURES = {
    'adp-clair.svg':      (14.2, 13.8, 85.0, 29.2),
    'adp-sombre.svg':     (14.2, 13.8, 85.0, 29.2),
    'extime-clair.svg':   (0.2, 0.0, 341.6, 89.1),
    'extime-sombre.svg':  (0.2, 0.0, 341.6, 89.1),
    'generali-clair.svg': (0.0, 0.0, 427.7, 58.6),
    'generali-sombre.svg': (0.0, 0.0, 427.7, 58.6),
}
SEUIL = 0.03  # en deçà de 3 % de marge, on ne touche pas : le gain est nul

base = pathlib.Path('public/logos')
ratios = {}
for nom, (x, y, w, h) in MESURES.items():
    f = base / nom
    s = f.read_text()
    m = re.search(r'viewBox="([\d.\-\s]+)"', s)
    vx, vy, vw, vh = [float(v) for v in m.group(1).split()]
    perte = 1 - (w * h) / (vw * vh)
    if perte < SEUIL:
        print(f'{nom:22} déjà au plus juste ({perte:.1%} de marge)')
    else:
        s = s.replace(m.group(0), f'viewBox="{x} {y} {w} {h}"', 1)
        # `width`/`height` figés contrediraient le nouveau cadre.
        s = re.sub(r'\s(width|height)="[\d.]+(px)?"', '', s, count=2)
        f.write_text(s)
        print(f'{nom:22} recadré : {vw}×{vh} -> {w}×{h}  ({perte:.0%} de vide retiré)')
    ratios[nom] = round(w / h, 3)

print('\nRapports largeur/hauteur après recadrage :')
for nom, r in ratios.items():
    if 'clair' in nom:
        print(f'  {nom.split("-")[0]:10} {r}')
