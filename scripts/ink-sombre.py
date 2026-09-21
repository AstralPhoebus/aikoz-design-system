"""Écrit le chrome SOMBRE — le même pour toutes les marques.

Le constat d'Alice, 21/09/2026 : *« il faut fonctionner comme la version
claire pour la version sombre, dans le sens où les fonds sont les mêmes et la
brand va se faire sentir sur les éléments »*.

Mesuré, elle a raison, et l'écart était dans les tokens :

    surface.page en CLAIR   -> {color.neutral.50}   — la rampe du THÈME
    surface.page en SOMBRE  -> {color.ink.1000}     — la rampe de la MARQUE

Conséquence chiffrée, sur le chroma des surfaces :

                 clair page  clair carte  sombre page  sombre carte
    aikoz            0.0029       0.0000       0.0203        0.0804
    adp              0.0029       0.0000       0.0822        0.1465
    extime           0.0029       0.0000       0.0272        0.0406
    generali         0.0029       0.0000       0.0571        0.0949

En clair, les quatre marques partagent EXACTEMENT le même fond et la marque
ne se lit que sur les éléments — bouton, lien, accent, focus, séries. En
sombre, le fond portait la marque, jusqu'à cinquante fois le chroma du clair.
Deux modèles opposés dans un même système.

Ce script aligne le sombre sur le clair. La clarté vient de l'échelle du
thème (inchangée), la teinte et le chroma viennent désormais de la rampe
NEUTRE, interpolés à chaque palier. Les quatre marques reçoivent donc le même
chrome sombre, au hex près.

**Ça inverse une décision antérieure**, et c'est assumé : le 18/09/2026,
« ADP et Aikoz ont le même bleu en sombre » était un défaut, parce que cette
identité était SUBIE — le gamut se referme vers le noir et les teintes
convergeaient sans qu'on l'ait voulu. Elle est maintenant une RÈGLE, la même
qu'en clair, et la marque a un endroit net où s'exprimer.

Ce qui reste à la marque en sombre, et qui suffit à la reconnaître :
`--primary`, `--accent`, `--ring`, le trait de l'entrée courante, les six
séries de graphiques, la lueur de la carte héroïne, le logo.
"""
import json, collections, math

P = json.load(open('tokens/primitives.json'), object_pairs_hook=collections.OrderedDict)
C = P['color']

# ─── L'échelle de chrome sombre ──────────────────────────────────────────────
#
# Elle appartient au THÈME et à personne d'autre. Les clartés sont celles qui
# ont été auditées — séparation page/carte à 0,123, texte à 17:1, séries à
# 3:1 minimum. Le chroma et la teinte sont interpolés sur la rampe NEUTRE,
# celle-là même qui fait les fonds en thème clair.
#
# La forme compte autant que les valeurs : le chroma reste bas partout. Une
# surface sombre très chromée ne se lit pas comme profonde, elle se lit comme
# un voile de couleur posé sur du noir — et c'est précisément ce qu'on vient
# d'enlever.
#
# Cinq plans utiles : page 1000, creux 950, carte 800, survol 700,
# surplomb 600. Le 900 sert au chrome de navigation, le 400 aux bordures.
ECHELLE = {
    '400':  (0.5856, 0.0139, 260.879),
    '600':  (0.3552, 0.0146, 269.371),
    '700':  (0.2720, 0.0171, 270.767),
    '800':  (0.2232, 0.0146, 272.351),
    '900':  (0.1857, 0.0133, 271.174),
    '950':  (0.1590, 0.0116, 271.323),
    '1000': (0.1000, 0.0062, 274.320),
}
MARQUES = ['aikoz', 'adp', 'extime', 'generali']


def to_srgb(L, Ch, H):
    h = math.radians(H); a = Ch*math.cos(h); b = Ch*math.sin(h)
    l = (L+0.3963377774*a+0.2158037573*b)**3
    m = (L-0.1055613458*a-0.0638541728*b)**3
    s = (L-0.0894841775*a-1.2914855480*b)**3
    return (4.0767416621*l-3.3077115913*m+0.2309699292*s,
            -1.2684380046*l+2.6097574011*m-0.3413193965*s,
            -0.0041960863*l-0.7034186147*m+1.7076147010*s)


def hexa(L, Ch, H):
    def f(c):
        c = max(0.0, min(1.0, c))
        c = 12.92*c if c <= 0.0031308 else 1.055*c**(1/2.4)-0.055
        return round(max(0.0, min(1.0, c))*255)
    r, g, b = to_srgb(L, Ch, H)
    return '#%02X%02X%02X' % (f(r), f(g), f(b))


DESC = (
    "Chrome sombre, palier {pas} — **identique pour les quatre marques**, "
    "comme en thème clair. Clarté de l'échelle du thème ({L}), teinte et "
    "chroma interpolés sur la rampe NEUTRE ({Ch} / {H}°), celle qui fait déjà "
    "les fonds en clair. Le fond ne porte pas la marque : la marque se lit sur "
    "les ÉLÉMENTS — bouton, accent, focus, séries, lueur, logo. L'échelle est "
    "déclarée dans `scripts/ink-sombre.py` et n'appartient à aucune marque ; "
    "un garde-fou de build échoue si un fichier sombre s'en écarte."
)

for marque in MARQUES:
    chemin = f'tokens/brand/{marque}-dark.json'
    try:
        d = json.load(open(chemin), object_pairs_hook=collections.OrderedDict)
    except FileNotFoundError:
        d = collections.OrderedDict(color=collections.OrderedDict())
    ink = collections.OrderedDict()
    for pas, (L, Ch, H) in ECHELLE.items():
        ink[pas] = {"$type": "color", "$value": {
            "colorSpace": "oklch", "components": [L, Ch, H], "alpha": 1,
            "hex": hexa(L, Ch, H)},
            "$description": DESC.format(pas=pas, L=L, Ch=Ch, H=H)}
    d.setdefault('color', collections.OrderedDict())['ink'] = ink
    json.dump(d, open(chemin, 'w'), ensure_ascii=False, indent=2)
    open(chemin, 'a').write('\n')
    print(f'{marque:9} ' + ' '.join(hexa(L, Ch, H) for L, Ch, H in ECHELLE.values()))
