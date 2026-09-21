"""Étanchéité des marques : sous une marque donnée, aucune couleur ne doit
venir de la rampe d'une autre.

Les couleurs de STATUT et de DONNÉES (positif, négatif, neutre, avertissement,
info) sont exclues : elles sont volontairement communes à toutes les marques —
une hausse doit se lire pareil partout.

Le script résout chaque rôle couleur jusqu'à la PRIMITIVE, en empilant les
couches dans l'ordre réel du CSS et en donnant la priorité à la marque, puis
range la famille primitive obtenue par propriétaire.
"""
import json, sys, re
from collections import defaultdict

def charger(p):
    return json.load(open(p))

PRIM = charger('tokens/primitives.json')

PROPRIETAIRE = {
    'midnight-blue': 'aikoz', 'ultramarine': 'aikoz', 'aquamarine': 'aikoz',
    'adp-blue': 'adp', 'adp-campanula': 'adp', 'adp-red': 'adp',
    'extime-malachite': 'extime', 'extime-green': 'extime', 'extime-gold': 'extime',
    'generali-red': 'generali', 'generali-slate': 'generali',
    'generali-green': 'generali', 'generali-periwinkle': 'generali',
    'generali-amber': 'generali',
}
# Familles sans propriétaire : neutres et statuts, communes par construction.
COMMUNES = {'neutral', 'success', 'warning', 'error', 'info', 'data', 'violet'}

# Rôles exclus de l'audit : ils PORTENT le statut, donc leur teinte ne dit rien
# de la marque et ne doit surtout pas en changer.
def exclu(chemin):
    return chemin.startswith('color.status.') or chemin.startswith('color.rating.')

# Les POLICES suivent la même règle : une marque ne porte pas la police d'une
# autre. `font-family.mono` est commune — aucune charte n'impose de police à
# chasse fixe —, et `font-family.systeme` est le défaut neutre d'une marque
# dont la charte typographique n'est pas encore connue.
POLICES = {'heading': 'aikoz', 'body': 'aikoz', 'roboto': 'generali', 'gotham': 'adp', 'extime': 'extime'}
POLICES_COMMUNES = {'mono', 'systeme'}

def auditer_polices(marque):
    d = charger(f'tokens/brand/{marque}.json').get('font', {})
    fuites = []
    for role, tok in d.items():
        m = REF.match(str(tok.get('$value', '')).strip())
        if not m: continue
        fam = m.group(1).split('.')[-1]
        if fam in POLICES_COMMUNES: continue
        if POLICES.get(fam, fam) != marque:
            fuites.append((role, fam, POLICES.get(fam, '?')))
    return fuites

def aplatir(obj, prefixe='', sortie=None):
    if sortie is None: sortie = {}
    if isinstance(obj, dict):
        if '$value' in obj:
            sortie[prefixe] = obj['$value']
            return sortie
        for k, v in obj.items():
            aplatir(v, f'{prefixe}.{k}' if prefixe else k, sortie)
    return sortie

def couches(marque, theme):
    """Dans l'ordre de priorité CROISSANTE : la dernière gagne."""
    fichiers = ['tokens/semantics.json', f'tokens/theme/{theme}.json']
    if marque != 'aikoz':
        fichiers.append(f'tokens/brand/{marque}.json')
        if theme == 'dark':
            fichiers.append(f'tokens/brand/{marque}-dark.json')
    else:
        fichiers.append('tokens/brand/aikoz.json')
        if theme == 'dark':
            fichiers.append('tokens/brand/aikoz-dark.json')
    plat = {}
    for f in fichiers:
        plat.update(aplatir(charger(f)))
    return plat

REF = re.compile(r'^\{([^}]+)\}$')

def famille(valeur, plat, vus=None):
    """Remonte la chaîne de références jusqu'à une famille primitive."""
    vus = vus or set()
    if not isinstance(valeur, str):
        return None
    m = REF.match(valeur.strip())
    if not m:
        return None
    cible = m.group(1)
    if cible in vus:
        return None
    vus.add(cible)
    morceaux = cible.split('.')
    if morceaux[0] == 'color' and len(morceaux) >= 2 and morceaux[1] in PRIM.get('color', {}):
        return morceaux[1]
    if cible in plat:
        return famille(plat[cible], plat, vus)
    return None

probleme = False
for theme in ('light', 'dark'):
    print(f'\n═══ thème {theme} ═══')
    for marque in ('aikoz', 'adp', 'extime', 'generali'):
        plat = couches(marque, theme)
        par_famille = defaultdict(list)
        for chemin, valeur in plat.items():
            if not chemin.startswith('color.') or exclu(chemin):
                continue
            f = famille(valeur, plat)
            if f:
                par_famille[f].append(chemin)
        etrangeres = {f: r for f, r in par_famille.items()
                      if f not in COMMUNES and PROPRIETAIRE.get(f, f) != marque}
        siennes = sorted(f for f in par_famille if PROPRIETAIRE.get(f) == marque)
        communes = sorted(f for f in par_famille if f in COMMUNES)
        fuites_police = auditer_polices(marque)
        etat = 'ÉTANCHE' if not etrangeres and not fuites_police else 'FUITE'
        if etrangeres or fuites_police: probleme = True
        print(f'\n  {marque:9} {etat}')
        print(f'    siennes  : {", ".join(siennes) or "—"}')
        print(f'    communes : {", ".join(communes) or "—"}')
        for f, roles in sorted(etrangeres.items()):
            print(f'    ✗ {f} (marque « {PROPRIETAIRE.get(f, "?")} ») sur {len(roles)} rôle(s) :')
            for r in sorted(roles)[:8]:
                print(f'        {r}')
            if len(roles) > 8:
                print(f'        … et {len(roles)-8} autres')
        for role, fam, proprio in fuites_police:
            print(f'    ✗ police {fam} (marque « {proprio} ») sur font.{role}')

sys.exit(1 if probleme else 0)
