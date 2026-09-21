"""Recale les primitives Extime sur la charte officielle.

Source : « Extime_Charte Graphique Globale_FR_WIP », page 10, « LES COULEURS ».

Ce qu'on avait venait du Figma et s'en écartait sur trois points :
la couleur identitaire (#001E28 au lieu du vert malachite #004650), le doré
(#F4D651, un jaune vif, au lieu du doré classique #BC9B48) et les verts
secondaires (une rampe dérivée au lieu des NEUF verts nommés de la charte).

Les valeurs de la charte sont reprises au hex près. Les paliers qu'elle ne
fournit pas — il lui en faut plus de deux pour tenir une rampe de chrome et
des états de survol — sont DÉRIVÉS de son ancre : clarté descendue ou montée,
teinte et chroma conservés, chroma ramené au gamut sRGB par dichotomie.
Chaque palier dérivé le dit dans sa description.
"""
import json, collections, math

# ─── Charte, page 10 ────────────────────────────────────────────────────────
MALACHITE = '#004650'          # couleur identitaire
DORE_CLASSIQUE = '#BC9B48'     # « pour les supports imprimés, digitaux et vidéos »
VERTS = [                      # « une gamme de neuf verts »
    ('Forêt', '#007279'), ('Empire', '#007842'), ('Prairie', '#008A14'),
    ('Olive', '#758C00'), ('Émeraude', '#008A7D'), ('Céladon', '#6BA663'),
    ('Jade', '#4AA88E'), ('Printemps', '#66B32E'), ('Menthe', '#42B86B'),
]

def lin(c): return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
def to_oklch(h):
    h = h.lstrip('#')
    r, g, b = [lin(int(h[i:i+2], 16)/255) for i in (0, 2, 4)]
    l = 0.4122214708*r+0.5363325363*g+0.0514459929*b
    m = 0.2119034982*r+0.6806995451*g+0.1073969566*b
    s = 0.0883024619*r+0.2817188376*g+0.6299787005*b
    l_, m_, s_ = l**(1/3), m**(1/3), s**(1/3)
    L = 0.2104542553*l_+0.7936177850*m_-0.0040720468*s_
    A = 1.9779984951*l_-2.4285922050*m_+0.4505937099*s_
    B = 0.0259040371*l_+0.7827717662*m_-0.8086757660*s_
    return round(L, 4), round(math.hypot(A, B), 4), round(math.degrees(math.atan2(B, A)) % 360, 3)

def lin_rgb(L, C, H):
    h = math.radians(H); a = C*math.cos(h); b = C*math.sin(h)
    l = (L+0.3963377774*a+0.2158037573*b)**3
    m = (L-0.1055613458*a-0.0638541728*b)**3
    s = (L-0.0894841775*a-1.2914855480*b)**3
    return (4.0767416621*l-3.3077115913*m+0.2309699292*s,
           -1.2684380046*l+2.6097574011*m-0.3413193965*s,
           -0.0041960863*l-0.7034186147*m+1.7076147010*s)

def gamut(L, C, H): return all(-0.0005 <= c <= 1.0005 for c in lin_rgb(L, C, H))
def clamp_c(L, C, H):
    if gamut(L, C, H): return C
    bas, haut = 0.0, C
    for _ in range(40):
        mid = (bas+haut)/2
        if gamut(L, mid, H): bas = mid
        else: haut = mid
    return round(bas, 4)
def hexa(L, C, H):
    def f(c):
        c = max(0.0, min(1.0, c))
        c = 12.92*c if c <= 0.0031308 else 1.055*c**(1/2.4)-0.055
        return round(max(0.0, min(1.0, c))*255)
    r, g, b = lin_rgb(L, C, H)
    return '#%02X%02X%02X' % (f(r), f(g), f(b))

# Clarté des paliers, alignée sur les autres rampes du système.
PALIERS = {'50': 0.959, '100': 0.909, '200': 0.824, '300': 0.713, '400': 0.586,
           '500': 0.458, '600': 0.355, '700': 0.272, '800': 0.223, '900': 0.186}

def rampe(ancre_hex, nom_charte, page):
    L0, C0, H = to_oklch(ancre_hex)
    pas_ancre = min(PALIERS, key=lambda p: abs(PALIERS[p]-L0))
    out = collections.OrderedDict()
    for p, L in PALIERS.items():
        if p == pas_ancre:
            C = C0; hx = ancre_hex; note = (
                f"{nom_charte} — valeur de la charte Extime ({page}), reprise au hex près.")
            comps = [L0, C0, H]
        else:
            C = clamp_c(L, C0, H); hx = hexa(L, C, H); comps = [L, C, H]
            note = (f"Palier DÉRIVÉ de {nom_charte} ({ancre_hex}, palier {pas_ancre}) : "
                    f"clarté portée à {L}, teinte et chroma conservés"
                    + (f", chroma ramené de {C0} à {C} pour rester dans le gamut sRGB" if C < C0 else "")
                    + ". La charte ne donne qu'une valeur ; une rampe en demande dix.")
        out[p] = {"$type": "color", "$value": {
            "colorSpace": "oklch", "components": comps, "alpha": 1, "hex": hx},
            "$description": note}
    return out, pas_ancre

P = json.load(open('tokens/primitives.json'), object_pairs_hook=collections.OrderedDict)
C = P['color']

C['extime-malachite'], pas_m = rampe(MALACHITE, 'Vert malachite, couleur identitaire Extime', 'page 10')
C['extime-gold'], pas_d = rampe(DORE_CLASSIQUE, 'Doré classique', 'page 10')
print(f'extime-malachite : ancre {MALACHITE} au palier {pas_m}')
print(f'extime-gold      : ancre {DORE_CLASSIQUE} au palier {pas_d}')

# Les neuf verts : ce n'est pas une rampe mais une PALETTE. Chacun garde sa
# teinte propre ; le numéro de palier n'est qu'un rangement par clarté.
verts = collections.OrderedDict()
for nom, hx in VERTS:
    L, Ch, H = to_oklch(hx)
    p = min(PALIERS, key=lambda k: abs(PALIERS[k]-L))
    while p in verts: p = str(int(p)+25)
    verts[p] = {"$type": "color", "$value": {
        "colorSpace": "oklch", "components": [L, Ch, H], "alpha": 1, "hex": hx},
        "$description": f"Vert {nom} — un des neuf verts secondaires de la charte Extime "
                        f"(page 10), repris au hex près. Ce n'est pas une rampe mais une "
                        f"PALETTE : chaque vert a sa teinte propre, le numéro ne range que "
                        f"par clarté. Interdit n°1 de la page 11 : ne jamais employer un vert "
                        f"secondaire sans le vert malachite à proximité."}
    print(f'  vert {nom:10} {hx}  palier {p}  L={L:.3f} H={H:.0f}')
C['extime-green'] = collections.OrderedDict(sorted(verts.items(), key=lambda kv: int(kv[0])))

# `extime-ink` disparaît : la charte ne connaît pas cette famille, son rôle de
# chrome revient au malachite, qui EST la couleur identitaire.
C.pop('extime-ink', None)

json.dump(P, open('tokens/primitives.json', 'w'), ensure_ascii=False, indent=2)
open('tokens/primitives.json', 'a').write('\n')
