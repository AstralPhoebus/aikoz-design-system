import json, itertools, math

P = json.load(open('tokens/primitives.json'))['color']

def hex_of(ramp, step):
    return P[ramp][step]['$value']['hex']

def srgb(h):
    h=h.lstrip('#'); return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))

def lin(c): return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def lum(rgb): r,g,b=[lin(c) for c in rgb]; return 0.2126*r+0.7152*g+0.0722*b
def ratio(a,b):
    la,lb=lum(a),lum(b); return (max(la,lb)+0.05)/(min(la,lb)+0.05)

# sRGB -> OKLab (Björn Ottosson)
def oklab(rgb):
    r,g,b=[lin(c) for c in rgb]
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b
    m=0.2119034982*r+0.6806995451*g+0.1073969566*b
    s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l_,m_,s_=l**(1/3) if l>0 else 0, m**(1/3) if m>0 else 0, s**(1/3) if s>0 else 0
    return (0.2104542553*l_+0.7936177850*m_-0.0040720468*s_,
            1.9779984951*l_-2.4285922050*m_+0.4505937099*s_,
            0.0259040371*l_+0.7827717662*m_-0.8086757660*s_)

# Viénot/Brettel/Mollon 1999 — matrices en espace LMS linéaire
def cvd(rgb, kind):
    if kind=='normal': return rgb
    r,g,b=[lin(c) for c in rgb]
    L=17.8824*r+43.5161*g+4.11935*b
    M=3.45565*r+27.1554*g+3.86714*b
    S=0.0299566*r+0.184309*g+1.46709*b
    if kind=='prot': L=2.02344*M-2.52581*S
    elif kind=='deut': M=0.494207*L+1.24827*S
    else: S=-0.395913*L+0.801109*M
    r2= 0.080944*L-0.130504*M+0.116721*S
    g2=-0.0102485*L+0.0540194*M-0.113615*S
    b2=-0.000365294*L-0.00412163*M+0.693513*S
    def unlin(c):
        c=max(0.0,min(1.0,c))
        return 12.92*c if c<=0.0031308 else 1.055*c**(1/2.4)-0.055
    return (unlin(r2),unlin(g2),unlin(b2))

def dE(a,b,kind):
    x,y=oklab(cvd(a,kind)),oklab(cvd(b,kind))
    return math.dist(x,y)

# La carte SOMBRE n'est plus la même pour toutes les marques : depuis que le
# chrome suit `data-brand`, elle garde la clarté du thème (celle de
# midnight-blue.800) mais prend la teinte de la marque. Auditer les six séries
# contre la carte d'Aikoz laissait passer un écart — la sixième série d'Extime
# tombait à 2,99:1 sur SA carte, sous le seuil de 3:1.
def carte_sombre(rampes):
    """Reproduit la règle de `ink-sombre.py` : clarté du thème, teinte de la marque."""
    L_ref = P['midnight-blue']['800']['$value']['components'][0]
    rampe = rampes[0]
    source = '800' if '800' in P[rampe] else '900'
    _, Ch, H = P[rampe][source]['$value']['components']
    def gamut(c):
        return all(-0.0005 <= x <= 1.0005 for x in _oklch_lin(L_ref, c, H))
    if not gamut(Ch):
        bas, haut = 0.0, Ch
        for _ in range(40):
            mid = (bas+haut)/2
            if gamut(mid): bas = mid
            else: haut = mid
        Ch = bas
    return _oklch_srgb(L_ref, Ch, H)

def _oklch_lin(L, Ch, H):
    h = math.radians(H); a = Ch*math.cos(h); b = Ch*math.sin(h)
    l = (L+0.3963377774*a+0.2158037573*b)**3
    m = (L-0.1055613458*a-0.0638541728*b)**3
    s = (L-0.0894841775*a-1.2914855480*b)**3
    return (4.0767416621*l-3.3077115913*m+0.2309699292*s,
           -1.2684380046*l+2.6097574011*m-0.3413193965*s,
           -0.0041960863*l-0.7034186147*m+1.7076147010*s)

def _oklch_srgb(L, Ch, H):
    def f(c):
        c = max(0.0, min(1.0, c))
        return 12.92*c if c <= 0.0031308 else 1.055*c**(1/2.4)-0.055
    return tuple(f(c) for c in _oklch_lin(L, Ch, H))

CARTE = {'light': srgb('#FFFFFF'), 'dark': None}

def separation(cols):
    """Le pire écart perceptuel, toutes paires et tous types de vision."""
    pire = 9
    for a,b in itertools.combinations(cols,2):
        for k in ('normal','prot','deut'):
            pire = min(pire, dE(a,b,k))
    return pire

def choisir(rampes, theme, n=6, seuil=3.0):
    CARTE['dark'] = carte_sombre(rampes)
    """Les trois premieres series viennent des trois rampes de MARQUE, dans
    l'ordre primary / secondary / accent : une palette optimisee librement
    maximise la separation mais peut abandonner le vert d'Extime au profit de
    quatre ors — mathematiquement meilleur, illisible comme identite. Les trois
    suivantes sont libres."""
    fond = CARTE[theme]
    def pool_de(rs):
        out=[]
        for r in rs:
            for st in P[r]:
                h=hex_of(r,st); c=srgb(h)
                if ratio(c,fond) >= seuil:
                    out.append((f'{r}.{st}', c))
        return out
    pool = pool_de(rampes)
    imposees = rampes[:3]
    best=(0,None)
    for tete in itertools.product(*[pool_de([r]) for r in imposees]):
        if len(set(x[0] for x in tete))<3: continue
        sel=list(tete)
        if separation([x[1] for x in sel]) < 0.06: continue
        while len(sel)<n:
            cand=max((c for c in pool if c not in sel),
                     key=lambda c: separation([x[1] for x in sel]+[c[1]]),
                     default=None)
            if cand is None: break
            sel.append(cand)
        if len(sel)==n:
            sc=separation([x[1] for x in sel])
            if sc>best[0]: best=(sc,sel)
    return best

for marque, rampes in [
    ('aikoz',   ['ultramarine','aquamarine','midnight-blue','neutral','violet']),
    ('adp',     ['adp-blue','adp-campanula','adp-red','neutral']),
    ('extime',  ['extime-ink','extime-green','extime-gold','neutral']),
    ('generali',['generali-red','neutral','midnight-blue','aquamarine']),
]:
    print('###', marque)
    for theme in ('light','dark'):
        s,sel = choisir(rampes, theme)
        print(f'  {theme}: séparation min ΔE = {s:.3f}')
        for nom,c in sel:
            print(f'    {nom:24s} contraste carte {ratio(c,CARTE[theme]):.2f}:1')

# ─── Émission ────────────────────────────────────────────────────────────────
import os
DESC = ("Série de données {i} de la marque. Les trois premières viennent des "
        "trois rampes de marque (primary, secondary, accent) : une palette "
        "optimisée librement sépare mieux mais peut abandonner une couleur "
        "d'identité. Chaque teinte tient {c}:1 sur la carte (WCAG 1.4.11, "
        "seuil 3:1) et la palette sépare de ΔE {s} au pire, en vision normale "
        "comme en protanopie et en deutéranopie.")

for marque, rampes in [
    ('adp',     ['adp-blue','adp-campanula','adp-red','neutral']),
    ('extime',  ['extime-ink','extime-green','extime-gold','neutral']),
    ('generali',['generali-red','neutral','midnight-blue','aquamarine']),
]:
    for theme in ('light','dark'):
        s,sel = choisir(rampes, theme)
        chart={}
        for i,(nom,c) in enumerate(sel,1):
            chart[str(i)]={"$type":"color","$value":"{color.%s}"%nom,
                           "$description":DESC.format(i=i,c=f"{ratio(c,CARTE[theme]):.2f}",s=f"{s:.3f}")}
        if theme=='light':
            p=f'tokens/brand/{marque}.json'
            d=json.load(open(p))
            d['color']['chart']=chart
            json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
            open(p,'a').write('\n')
        else:
            p=f'tokens/brand/{marque}-dark.json'
            # FUSIONNER, pas écraser : ce fichier porte aussi la rampe `ink`
            # posée par `ink-sombre.py`. Un `json.dump` d'un dictionnaire neuf
            # l'effaçait, et le chrome sombre repartait sur la clarté de la
            # charte sans que rien ne le signale.
            import os
            base = json.load(open(p)) if os.path.exists(p) else {"color":{}}
            base.setdefault("color",{})["chart"]=chart
            json.dump(base,open(p,'w'),ensure_ascii=False,indent=2)
            open(p,'a').write('\n')
        print('écrit', p)
