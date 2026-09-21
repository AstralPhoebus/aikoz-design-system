"""Les couleurs secondaires de la charte Generali, entrées telles quelles.

Source : « 03. CHARTE COMPLETE francais », page 202, section 05.4 « Palette de
couleurs » du style illustratif. La charte les décrit comme les couleurs à
employer « pour les choses qui sont naturellement vertes, bleues, jaunes ».

Elles règlent la dernière fuite de l'audit d'étanchéité : Generali n'avait que
le rouge et le neutre, or une palette catégorielle veut six teintes distinctes,
et ses séries 3 à 6 empruntaient donc `midnight-blue` et `aquamarine`, deux
rampes d'Aikoz.

Aucun palier n'est inventé : on entre les valeurs de la charte, et le numéro de
palier est simplement déduit de leur clarté OKLCH.
"""
import json, collections, math

CHARTE = {
    # Les gris de la charte sont FROIDS et vont du presque-blanc au bleu-nuit :
    # c'est une rampe à part entière, pas un neutre.
    'generali-slate': ['#EBEBEB', '#B6CBD1', '#6F8A91', '#385A64', '#203E47'],
    'generali-green': ['#68B65B', '#42804F'],
    'generali-periwinkle': ['#8995C8', '#4F62A8'],
    'generali-amber': ['#D9A036'],
}
NOTE = ("Couleur secondaire de la charte Generali (page 202, « Palette de couleurs » "
        "du style illustratif). Valeur de la charte, reprise au hex près ; le numéro "
        "de palier est déduit de sa clarté OKLCH, aucune teinte n'est inventée.")

def lin(c): return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
def oklch(h):
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

# Clarté de référence des paliers, reprise de la rampe rouge de Generali pour
# que les numéros veuillent dire la même chose d'une famille à l'autre.
PRIM = json.load(open('tokens/primitives.json'), object_pairs_hook=collections.OrderedDict)
ROUGE = PRIM['color']['generali-red']
ECHELLE = {p: ROUGE[p]['$value']['components'][0] for p in ROUGE}

def palier(L):
    return min(ECHELLE, key=lambda p: abs(ECHELLE[p] - L))

for famille, hexs in CHARTE.items():
    fam = collections.OrderedDict()
    for hx in hexs:
        L, C, H = oklch(hx)
        p = palier(L)
        while p in fam:                       # deux ancres sur le même palier
            p = str(int(p) + 50)
        fam[p] = {"$type": "color", "$value": {
            "colorSpace": "oklch", "components": [L, C, H], "alpha": 1, "hex": hx},
            "$description": NOTE}
        print(f"{famille:20} {p:>4}  {hx}  L={L:.3f} C={C:.4f} H={H:.0f}")
    PRIM['color'][famille] = collections.OrderedDict(sorted(fam.items(), key=lambda kv: int(kv[0])))

json.dump(PRIM, open('tokens/primitives.json', 'w'), ensure_ascii=False, indent=2)
open('tokens/primitives.json', 'a').write('\n')
