import json, colorsys, math

PP='tokens/primitives.json'
P=json.load(open(PP))
C=P['color']

def oklch_to_hex(L,Ch,H):
    h=math.radians(H); a=Ch*math.cos(h); b=Ch*math.sin(h)
    l_=L+0.3963377774*a+0.2158037573*b
    m_=L-0.1055613458*a-0.0638541728*b
    s_=L-0.0894841775*a-1.2914855480*b
    l,m,s=l_**3,m_**3,s_**3
    r= 4.0767416621*l-3.3077115913*m+0.2309699292*s
    g=-1.2684380046*l+2.6097574011*m-0.3413193965*s
    bb=-0.0041960863*l-0.7034186147*m+1.7076147010*s
    def f(c):
        c=max(0.0,min(1.0,c))
        c=12.92*c if c<=0.0031308 else 1.055*c**(1/2.4)-0.055
        return round(max(0.0,min(1.0,c))*255)
    return '#%02X%02X%02X'%(f(r),f(g),f(bb))

DESC=("Prolongement DÉRIVÉ de la rampe, absent de la charte de la marque : "
      "la clarté descend de {d:.3f} en OKLCH, teinte et chroma inchangés. "
      "Nécessaire parce que le thème sombre sépare la page, la carte et le "
      "creux sur trois niveaux, là où la charte s'arrête à 900.")

# Les deux paliers manquants, calqués sur l'écart de clarté de midnight-blue
# (0,186 -> 0,159 -> 0,133), la rampe de référence du thème sombre Aikoz.
for rampe in ('adp-blue','extime-ink'):
    base=C[rampe]['900']['$value']
    L0,Ch,H=base['components']
    for pas,delta in (('950',0.027),('1000',0.053)):
        L=round(L0-delta,4)
        C[rampe][pas]={"$type":"color","$value":{
            "colorSpace":"oklch","components":[L,Ch,H],"alpha":1,
            "hex":oklch_to_hex(L,Ch,H)},
            "$description":DESC.format(d=delta)}
        print(rampe,pas,'L',L,C[rampe][pas]['$value']['hex'])

json.dump(P,open(PP,'w'),ensure_ascii=False,indent=2); open(PP,'a').write('\n')

# ── L'indirection `ink` : chaque marque nomme sa propre rampe de chrome ──────
PAS=['50','100','200','300','400','500','600','700','800','900','950','1000']
INK={'aikoz':'midnight-blue','adp':'adp-blue','extime':'extime-ink','generali':'midnight-blue'}
NOTE=("Rampe de CHROME de la marque — fonds, bordures, navigation en thème "
      "sombre. C'est l'indirection qui manquait : le thème pointait "
      "directement `midnight-blue`, une primitive Aikoz, donc toute marque "
      "gardait le bleu nuit d'Aikoz sous ses propres couleurs.")
for marque,rampe in INK.items():
    p=f'tokens/brand/{marque}.json'
    d=json.load(open(p))
    d['color']['ink']={s:{"$type":"color","$value":"{color.%s.%s}"%(rampe,s),
                          "$description":NOTE if s=='50' else f"Palier {s} de la rampe de chrome ({rampe})."}
                       for s in PAS}
    json.dump(d,open(p,'w'),ensure_ascii=False,indent=2); open(p,'a').write('\n')
    print('ink ->',marque,rampe)

# ── Les thèmes cessent de nommer une primitive Aikoz ────────────────────────
import re
for f in ['tokens/theme/dark.json','tokens/theme/light.json',
          'tokens/theme/marketing.json','tokens/theme/marketing-light.json']:
    s=open(f).read()
    n=len(re.findall(r'\{color\.midnight-blue\.', s))
    s=re.sub(r'\{color\.midnight-blue\.(\d+)\}', r'{color.ink.\1}', s)
    open(f,'w').write(s)
    print(f, n, 'références redirigées vers color.ink')
