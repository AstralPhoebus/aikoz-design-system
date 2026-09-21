"""Choisit, par marque, le palier d'accent qui tient comme TEXTE.

`text.accent` pointait sur `aquamarine`, une rampe d'Aikoz, sous toutes les
marques. Le rôle ne peut pas simplement prendre `brand.accent` : celui-ci est
une SURFACE (l'aplat d'un bouton), et il est clair par construction — 3,95:1
sur blanc chez ADP, très en dessous des 4,5 exigés d'un texte. Il faut donc un
palier distinct, pris dans la MÊME rampe d'accent, choisi par la mesure.
"""
import json, collections, math

P = json.load(open('tokens/primitives.json'))['color']

RAMPE_ACCENT = {
    'aikoz': 'aquamarine',
    'adp': 'adp-red',
    'extime': 'extime-gold',
    # La charte Generali donne un accent NEUTRE (neutral.50) : il n'y a pas de
    # rampe d'accent chromatique. Le texte d'accent se replie donc sur le rouge,
    # sa seule couleur.
    'generali': 'generali-red',
}
# L'échelle de chrome sombre : la carte vaut le palier 800.
ECHELLE_800 = (0.2232, 0.0804)
RAMPE_INK = {'aikoz': 'midnight-blue', 'adp': 'adp-blue',
             'extime': 'extime-malachite', 'generali': 'generali-red'}

def srgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
def lin(c): return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
def lum(c): r, g, b = [lin(x) for x in c]; return 0.2126*r+0.7152*g+0.0722*b
def ratio(a, b):
    la, lb = lum(a), lum(b); return (max(la, lb)+0.05)/(min(la, lb)+0.05)

def oklch_srgb(L, C, H):
    h = math.radians(H); a = C*math.cos(h); b = C*math.sin(h)
    l = (L+0.3963377774*a+0.2158037573*b)**3
    m = (L-0.1055613458*a-0.0638541728*b)**3
    s = (L-0.0894841775*a-1.2914855480*b)**3
    def f(c):
        c = max(0.0, min(1.0, 4.0767416621*l-3.3077115913*m+0.2309699292*s if c == 0 else c))
        return c
    r = 4.0767416621*l-3.3077115913*m+0.2309699292*s
    g = -1.2684380046*l+2.6097574011*m-0.3413193965*s
    bb = -0.0041960863*l-0.7034186147*m+1.7076147010*s
    def g8(c):
        c = max(0.0, min(1.0, c))
        return 12.92*c if c <= 0.0031308 else 1.055*c**(1/2.4)-0.055
    return (g8(r), g8(g), g8(bb))

BLANC = srgb('#FFFFFF')

resultats = {}
for marque, rampe in RAMPE_ACCENT.items():
    # La carte sombre de la marque : clarté et chroma de l'échelle, teinte de
    # sa rampe de chrome.
    ink = RAMPE_INK[marque]
    src = '800' if '800' in P[ink] else '900'
    _, Cink, Hink = P[ink][src]['$value']['components']
    carte_sombre = oklch_srgb(ECHELLE_800[0], min(Cink, ECHELLE_800[1]), Hink)

    pas = sorted(P[rampe], key=lambda x: int(x))
    def meilleur(fond, veut_fonce):
        candidats = [(p, srgb(P[rampe][p]['$value']['hex'])) for p in pas]
        ok = [(p, c) for p, c in candidats if ratio(c, fond) >= 4.5]
        if not ok: return None, None
        # Le plus PROCHE du seuil : on veut la teinte la plus vive qui passe,
        # pas la plus sombre possible — sinon l'accent perd son caractère.
        return min(ok, key=lambda pc: ratio(pc[1], fond))
    pc, cc = meilleur(BLANC, True)
    pd, cd = meilleur(carte_sombre, False)
    resultats[marque] = {
        'clair': (pc, round(ratio(cc, BLANC), 2)),
        'sombre': (pd, round(ratio(cd, carte_sombre), 2)),
        'rampe': rampe,
    }
    print(f"{marque:9} accent-text clair {rampe}.{pc} ({resultats[marque]['clair'][1]}:1 sur blanc)"
          f"  ·  sombre {rampe}.{pd} ({resultats[marque]['sombre'][1]}:1 sur la carte)")

# ── Écriture ────────────────────────────────────────────────────────────────
for marque, r in resultats.items():
    p = f'tokens/brand/{marque}.json'
    d = json.load(open(p), object_pairs_hook=collections.OrderedDict)
    b = d['color']['brand']
    b['accent-text'] = {"$type": "color", "$value": "{color.%s.%s}" % (r['rampe'], r['clair'][0]),
        "$description":
            f"Texte teinté de l'accent — {r['clair'][1]}:1 sur la carte claire. "
            f"Un palier DISTINCT de `accent` : celui-ci est une surface, clair par "
            f"construction, et ne tient pas 4,5:1 sous du texte. Choisi comme le plus "
            f"vif des paliers qui passent le seuil, pour que l'accent garde son caractère. "
            f"Remplace `aquamarine`, une rampe d'Aikoz, que toutes les marques portaient."}
    b['on-accent'] = {"$type": "color", "$value": "{color.ink.900}",
        "$description":
            "Texte posé sur l'aplat d'accent. Pointait sur `midnight-blue.900`, une "
            "primitive d'AIKOZ, y compris sous ADP et Extime. Passe par `ink`, la rampe "
            "de chrome de la marque — même valeur pour Aikoz, sa propre rampe."}
    json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2); open(p, 'a').write('\n')

    pd_ = f'tokens/brand/{marque}-dark.json'
    try:
        dd = json.load(open(pd_), object_pairs_hook=collections.OrderedDict)
    except FileNotFoundError:
        dd = collections.OrderedDict([("color", collections.OrderedDict())])
    dd['color'].setdefault('brand', collections.OrderedDict())['accent-text'] = {
        "$type": "color", "$value": "{color.%s.%s}" % (r['rampe'], r['sombre'][0]),
        "$description": f"Texte teinté de l'accent, thème sombre — {r['sombre'][1]}:1 sur la carte de la marque."}
    json.dump(dd, open(pd_, 'w'), ensure_ascii=False, indent=2); open(pd_, 'a').write('\n')
    print(f"  écrit {p} et {pd_}")
