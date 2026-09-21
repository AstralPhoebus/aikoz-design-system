"""Complète les rampes secondaires de Generali à partir des valeurs de charte.

La charte ne donne qu'une ou deux valeurs pour l'ambre, le vert et la
pervenche. Ça suffisait tant que la carte sombre portait la teinte de la
marque : le vivier de teintes admissibles était large.

Depuis que le sombre suit le clair — fonds communs, marque sur les éléments —
le vivier de Generali est tombé à 18 teintes, et sa palette de séries plafonne
à ΔE 0,092 en sombre, sous le seuil de 0,10. Vérifié par recherche exhaustive :
ce n'est pas la recherche qui échoue, c'est qu'il n'y a pas assez de couleurs.

Aucune valeur n'est inventée. Chaque palier manquant est DÉRIVÉ du palier de
charte : clarté déplacée sur le profil de `extime-gold` (une rampe déjà
construite de cette façon), teinte conservée, chroma ramené au gamut sRGB.
"""
import json, collections, math

CHEMIN = 'tokens/primitives.json'
d = json.load(open(CHEMIN), object_pairs_hook=collections.OrderedDict)
C = d['color']

PROFIL = {'50': 0.9590, '100': 0.9090, '200': 0.8240, '300': 0.7031, '400': 0.5860,
          '500': 0.4580, '600': 0.3550, '700': 0.2720, '800': 0.2230, '900': 0.1860}
RAMPES = ['generali-amber', 'generali-green', 'generali-periwinkle']


def to_srgb(L, Ch, H):
    h = math.radians(H); a = Ch*math.cos(h); b = Ch*math.sin(h)
    l = (L+0.3963377774*a+0.2158037573*b)**3
    m = (L-0.1055613458*a-0.0638541728*b)**3
    s = (L-0.0894841775*a-1.2914855480*b)**3
    return (4.0767416621*l-3.3077115913*m+0.2309699292*s,
            -1.2684380046*l+2.6097574011*m-0.3413193965*s,
            -0.0041960863*l-0.7034186147*m+1.7076147010*s)


def dans_gamut(L, Ch, H):
    return all(-0.0005 <= c <= 1.0005 for c in to_srgb(L, Ch, H))


def chroma_max(L, Ch, H):
    if dans_gamut(L, Ch, H):
        return Ch
    bas, haut = 0.0, Ch
    for _ in range(40):
        mid = (bas+haut)/2
        if dans_gamut(L, mid, H): bas = mid
        else: haut = mid
    return round(bas, 4)


def hexa(L, Ch, H):
    def f(c):
        c = max(0.0, min(1.0, c))
        c = 12.92*c if c <= 0.0031308 else 1.055*c**(1/2.4)-0.055
        return round(max(0.0, min(1.0, c))*255)
    r, g, b = to_srgb(L, Ch, H)
    return '#%02X%02X%02X' % (f(r), f(g), f(b))


for rampe in RAMPES:
    existants = {k: C[rampe][k]['$value']['components'] for k in C[rampe]}
    # Le palier de charte le plus proche sert de source de teinte et de chroma.
    def source(L):
        return min(existants.items(), key=lambda kv: abs(kv[1][0] - L))
    complet = collections.OrderedDict()
    for pas, L in PROFIL.items():
        if pas in C[rampe]:
            complet[pas] = C[rampe][pas]
            continue
        k_src, (Ls, Cs, Hs) = source(L)
        Ch = chroma_max(L, Cs, Hs)
        note = (f" Chroma ramené de {Cs} à {Ch} pour rester dans le gamut sRGB."
                if Ch < Cs else "")
        complet[pas] = {"$type": "color", "$value": {
            "colorSpace": "oklch", "components": [L, Ch, round(Hs, 3)], "alpha": 1,
            "hex": hexa(L, Ch, Hs)},
            "$description":
                f"Palier DÉRIVÉ du palier {k_src} de la charte : clarté portée à {L} "
                f"sur le profil de `extime-gold`, teinte et chroma conservés.{note} "
                f"La charte Generali ne donne qu'une ou deux valeurs pour cette "
                f"couleur ; une palette catégorielle en demande plus. Depuis que les "
                f"fonds sombres sont communs aux marques, le vivier de Generali était "
                f"tombé à 18 teintes et sa séparation de séries à ΔE 0,092, sous le "
                f"seuil de 0,10 — vérifié par recherche exhaustive : il manquait des "
                f"couleurs, pas un meilleur algorithme."}
    C[rampe] = complet
    print(f'{rampe:22} {len(existants)} paliers de charte -> {len(complet)}')

json.dump(d, open(CHEMIN, 'w'), ensure_ascii=False, indent=2)
open(CHEMIN, 'a').write('\n')
