"""Cale la rampe de chrome SOMBRE de chaque marque sur l'échelle de clarté du
thème, en gardant sa teinte.

Le constat d'Alice : « pour le sombre ADP le bleu est pas assez foncé ». Exact,
et ce n'est pas un réglage mais une règle qui manquait.

La clarté du chrome sombre est une propriété du THÈME, pas de la marque. La
marque donne la teinte et la saturation ; le thème fixe l'échelle — page,
carte, creux, bordure. Sans cette règle, chaque marque imposait la clarté de
sa charte : la carte d'ADP sortait à L=0,292 contre 0,223 chez Aikoz, soit 30 %
plus claire, et le thème sombre n'était plus le même thème d'une marque à
l'autre.

On reprend donc, pour chaque palier, la clarté de `midnight-blue` — la rampe de
référence du sombre Aikoz — avec la teinte et le chroma de la marque. Le chroma
est ramené par dichotomie au maximum atteignable dans sRGB : à clarté basse une
saturation de milieu de rampe sort du gamut et vire, c'est le piège déjà
rencontré sur l'or d'Extime.
"""
import json, collections, math

P = json.load(open('tokens/primitives.json'), object_pairs_hook=collections.OrderedDict)
C = P['color']

def comps(ramp, step):
    return C[ramp][step]['$value']['components']

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

def hexa(L, Ch, H):
    def f(c):
        c = max(0.0, min(1.0, c))
        c = 12.92*c if c <= 0.0031308 else 1.055*c**(1/2.4)-0.055
        return round(max(0.0, min(1.0, c))*255)
    r, g, b = to_srgb(L, Ch, H)
    return '#%02X%02X%02X' % (f(r), f(g), f(b))

def chroma_max(L, Ch, H):
    if dans_gamut(L, Ch, H):
        return Ch
    bas, haut = 0.0, Ch
    for _ in range(40):
        mid = (bas+haut)/2
        if dans_gamut(L, mid, H): bas = mid
        else: haut = mid
    return round(bas, 4)

# Les paliers que le thème sombre consomme, avec la clarté de référence.
PALIERS = ['400', '700', '800', '900', '950', '1000']
REF = {p: comps('midnight-blue', p)[0] for p in PALIERS}

MARQUES = {'adp': 'adp-blue', 'extime': 'extime-ink'}

for marque, rampe in MARQUES.items():
    chemin = f'tokens/brand/{marque}-dark.json'
    d = json.load(open(chemin), object_pairs_hook=collections.OrderedDict)
    ink = collections.OrderedDict()
    for pas in PALIERS:
        source = pas if pas in C[rampe] else '900'
        _, Ch, H = comps(rampe, source)
        L = REF[pas]
        Ch2 = chroma_max(L, Ch, H)
        ink[pas] = {"$type": "color", "$value": {
            "colorSpace": "oklch", "components": [L, Ch2, H], "alpha": 1,
            "hex": hexa(L, Ch2, H)},
            "$description":
                f"Chrome sombre, palier {pas} — clarté du thème ({L}), teinte de la marque "
                f"({H}°). La clarté de l'échelle sombre appartient au THÈME : laissée à la "
                f"charte, la carte d'ADP sortait 30 % plus claire que celle d'Aikoz et le "
                f"thème sombre n'était plus le même d'une marque à l'autre."
                + (f" Chroma ramené de {Ch} à {Ch2} : au-delà, la couleur sort du gamut sRGB."
                   if Ch2 < Ch else "")}
        print(f"{marque:8} ink.{pas:<5} L={L:<6} C={Ch}->{Ch2:<7} {hexa(L, Ch2, H)}")
    d['color']['ink'] = ink
    json.dump(d, open(chemin, 'w'), ensure_ascii=False, indent=2)
    open(chemin, 'a').write('\n')
