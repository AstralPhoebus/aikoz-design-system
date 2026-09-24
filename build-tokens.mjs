import StyleDictionary from 'style-dictionary';
import fs from 'node:fs';
import path from 'node:path';
import { fileHeader } from 'style-dictionary/utils';

const PRIM = 'tokens/primitives.json';
const brand = b => `tokens/brand/${b}.json`;
const theme = t => `tokens/theme/${t}.json`;
const bridgeSrc = 'tokens/bridge/shadcn.json';
const SEM = 'tokens/semantics.json';
const SEM_MKT = 'tokens/semantics-marketing.json';
const inPath = sub => t => t.filePath.includes(sub);

// hex sRGB -> composants OKLCH (matrices de Björn Ottosson). Uniquement pour
// les rares valeurs couleur littérales en hex (ex. #FFFFFF dans les thèmes) ;
// les primitives portent déjà leurs composants OKLCH dans le DTCG.
function hexToOklch(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  r = lin(r); g = lin(g); b = lin(b);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const mm = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(mm), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  const rC = Math.round(C * 1e4) / 1e4;
  return [Math.round(L * 1e4) / 1e4, rC, rC < 1e-4 ? 0 : Math.round(H * 1e3) / 1e3];
}
const isColor = token => (token.$type ?? token.type) === 'color';

// La variable CSS porte la couleur COMPLÈTE : oklch(L C H) — ou oklch(L C H / a)
// si alpha != 1. On lit les composants source du DTCG verbatim (jamais recalculés).
// Les consommateurs utilisent var(--x) brut ; la transparence passe par color-mix.
function oklchCss([L, C, H], a = 1) {
  return a === 1 ? `oklch(${L} ${C} ${H})` : `oklch(${L} ${C} ${H} / ${a})`;
}
StyleDictionary.registerTransform({
  name: 'color/oklch',
  type: 'value',
  filter: isColor,
  transform: token => {
    const v = token.value ?? token.$value;
    if (v && typeof v === 'object' && Array.isArray(v.components)) {
      return oklchCss(v.components, v.alpha ?? 1);
    }
    const c = hexToOklch(v); // littéral hex (#FFFFFF…)
    return c ? oklchCss(c) : v;
  },
});

// --- Typographie : rôles émis en LONGHAND, une propriété CSS par token.
//
// Le shorthand `font` est écarté pour deux raisons mesurées en navigateur :
// il ne transporte pas `letter-spacing` (Style Dictionary le classait en
// unknownProps et le jetait, warning masqué par verbosity:'silent'), et il
// RÉINITIALISE `font-feature-settings` / `font-variant-numeric` — donc
// `font: var(--role-typography-metric)` cassait l'alignement des chiffres
// sur le rôle des KPI.
//
// Un token typography doit produire PLUSIEURS variables : c'est un format,
// pas un transform (un transform rend une valeur pour un token).
const refToVar = s =>
  typeof s === 'string' && /^\{[^{}]+\}$/.test(s.trim())
    ? `var(--${s.trim().slice(1, -1).replace(/\./g, '-')})`
    : null;

// Propriété CSS émise pour chaque clé DTCG du token typography.
const TYPO_PROPS = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
};

StyleDictionary.registerFormat({
  name: 'css/variables-aikoz-semantics',
  format: async ({ dictionary, file, options }) => {
    const header = await fileHeader({ file });
    const lines = [];

    for (const token of dictionary.allTokens) {
      const type = token.$type ?? token.type;
      const original = token.original?.$value ?? token.original?.value;
      const note = token.$description ? ` /** ${token.$description} */` : '';

      if (type === 'typography' && original && typeof original === 'object') {
        // 5 variables, alias posés directement — aucune substitution de chaîne,
        // donc aucune collision possible entre une valeur et un nom de variable.
        if (lines.length) lines.push('');
        if (token.$description) lines.push(`  /* ${token.$description} */`);
        for (const [key, prop] of Object.entries(TYPO_PROPS)) {
          const ref = original[key];
          if (ref == null) continue;
          const value = refToVar(ref) ?? ref;
          lines.push(`  --${token.name}-${prop}: ${value};`);
        }
        continue;
      }

      // Autres rôles : alias simple -> var(--…), sinon valeur transformée.
      if (lines.length && lines[lines.length - 1].includes('letter-spacing')) lines.push('');
      const value = refToVar(original) ?? (token.$value ?? token.value);
      lines.push(`  --${token.name}: ${value};${note}`);
    }

    return `${header}${options.selector} {\n${lines.join('\n')}\n}\n`;
  },
});

// Groupe css avec sortie couleur en oklch() au lieu de hex.
const cssOklch = StyleDictionary.hooks.transformGroups.css.map(
  n => (n === 'color/css' ? 'color/oklch' : n),
);

function make(destination, source, { selector, filter, refs = true, transforms, buildPath = 'build/', format = 'css/variables' }) {
  return new StyleDictionary({
    source,
    platforms: { css: {
      ...(transforms ? { transforms } : { transformGroup: 'css' }),
      buildPath,
      files: [{ destination, format, filter,
        options: { selector, outputReferences: refs } }]
    }},
    log: { verbosity: 'silent' }
  });
}

// Couche 1 — primitives : valeurs brutes, :root, pas de références
await make('primitives.css', [PRIM], { selector: ':root', filter: inPath('primitives'), refs: false, transforms: cssOklch }).buildAllPlatforms();
// Couche 2 — brand (rôles) : Aikoz par défaut sur :root, les autres scopées.
//
// LE SÉLECTEUR PORTE UNE SPÉCIFICITÉ, PAS SEULEMENT UN NOM.
// `[data-brand="adp"]` pèse (0,1,0), exactement comme `:root` et comme
// `.dark` — et la couche thème est importée APRÈS. À spécificité égale,
// l'ordre tranche : la marque ne pouvait donc RIEN redéfinir de ce que le
// thème posait. Elle n'avait l'air de fonctionner que parce qu'elle ne
// touchait que `--color-brand-*`, que le thème ignore. Dès qu'on lui a
// confié la palette des graphiques, elle est restée sans effet : les séries
// gardaient l'outremer d'Aikoz sous toutes les marques.
//
// `:root[data-brand="adp"]` pèse (0,2,0) et passe devant le thème ; la
// variante sombre `:root[data-brand="adp"].dark` pèse (0,3,0) et passe
// devant la variante claire de la même marque.
await make('brand-aikoz.css',    [PRIM, brand('aikoz')],    { selector: ':root',                    filter: inPath('brand/aikoz'),    transforms: cssOklch }).buildAllPlatforms();
await make('brand-generali.css', [PRIM, brand('generali')], { selector: ':root[data-brand="generali"]',  filter: inPath('brand/generali'), transforms: cssOklch }).buildAllPlatforms();
await make('brand-adp.css', [PRIM, brand('adp')], { selector: ':root[data-brand="adp"]', filter: inPath('brand/adp'), transforms: cssOklch }).buildAllPlatforms();
await make('brand-extime.css', [PRIM, brand('extime')], { selector: ':root[data-brand="extime"]', filter: inPath('brand/extime'), transforms: cssOklch }).buildAllPlatforms();
// Palettes de séries en thème sombre — une marque ne peut pas tenir les deux
// thèmes avec les mêmes teintes : ce qui se lit sur du blanc disparaît sur du
// bleu nuit.
// Aikoz a lui aussi un fichier sombre, sur `:root.dark` (0,2,0) : les autres
// marques, en `:root[data-brand=x].dark` (0,3,0), passent devant. Sans ça
// Aikoz restait le cas particulier — ses valeurs sombres vivaient dans le
// thème, donc toute marque qui ne les redéfinissait pas héritait des siennes.
await make('brand-aikoz-dark.css', [PRIM, brand('aikoz-dark')], {
  selector: ':root.dark',
  filter: inPath('brand/aikoz-dark'),
  transforms: cssOklch,
}).buildAllPlatforms();
for (const m of ['generali', 'adp', 'extime']) {
  await make(`brand-${m}-dark.css`, [PRIM, brand(`${m}-dark`)], {
    selector: `:root[data-brand="${m}"].dark`,
    filter: inPath(`brand/${m}-dark`),
    transforms: cssOklch,
  }).buildAllPlatforms();
}
// Couche 3 — theme (sémantique) : light sur :root, dark sur .dark
// `.light` double `:root` : purement additif, aucune valeur ajoutée, mais il donne
// une échappatoire imbriquée. Sans elle, un bloc « clair » posé dans une page `.dark`
// hérite du dark — impossible de rendre deux thèmes côte à côte honnêtement.
// C'est la réciproque manquante de `.dark`.
await make('theme-light.css', [PRIM, brand('aikoz'), theme('light')], { selector: ':root, .light',  filter: inPath('theme/light'), transforms: cssOklch }).buildAllPlatforms();
await make('theme-dark.css',  [PRIM, brand('aikoz'), theme('dark')],  { selector: '.dark',  filter: inPath('theme/dark'), transforms: cssOklch }).buildAllPlatforms();
// Registre MARKETING — site vitrine, lead magnet, carrousels.
//
// Registre et thème sont deux axes INDÉPENDANTS : produit|marketing × clair|sombre
// = quatre combinaisons.
//
// Spécificité — le clair sort sur [data-register] seul (0,1,0), le sombre sur
// .dark[data-register] et .dark [data-register] (0,2,0). Le sombre bat donc le
// clair dès que .dark est posé, sur l'élément lui-même comme sur un ancêtre.
//
// Le filtre du sombre vise marketing.json NOMMÉMENT : inPath('theme/marketing')
// attraperait aussi marketing-light.json.
await make('theme-marketing-light.css', [PRIM, brand('aikoz'), theme('marketing-light')], {
  selector: '[data-register="marketing"]',
  filter: inPath('theme/marketing-light'), transforms: cssOklch,
}).buildAllPlatforms();
await make('theme-marketing.css', [PRIM, brand('aikoz'), theme('marketing')], {
  selector: '.dark[data-register="marketing"], .dark [data-register="marketing"]',
  filter: t => t.filePath.includes('theme/marketing.json'), transforms: cssOklch,
}).buildAllPlatforms();

// Couche 3bis — semantics : rôles MODE-INDÉPENDANTS (radius, shadow, border-width, typography).
// :root unique (pas de variante light/dark). refs:true → alias émis en var(--…).
// Le groupe 'css' rend nativement le format dimension { value, unit } en v5 (vérifié).
// semantics.json n'a aucun token couleur.
// Format maison : les rôles typographiques sortent en longhand (5 variables),
// les autres en une variable. Les alias sont posés directement en var(--…),
// donc outputReferences est inutile ici — et surtout inoffensif.
// `brand('aikoz')` en source : les rôles typographiques pointent désormais sur
// `{font.heading}` et `{font.body}`, qui vivent dans la couche MARQUE. Le
// fichier de marque n'est là que pour résoudre la référence — `outputReferences`
// fait que la feuille émet `var(--font-heading)`, donc la valeur suit bien
// `data-brand` au rendu, elle n'est pas figée sur Aikoz.
await make('semantics.css', [PRIM, brand('aikoz'), SEM], {
  selector: ':root', filter: (t) => t.filePath.includes('tokens/semantics.json'),
  format: 'css/variables-aikoz-semantics',
}).buildAllPlatforms();

// Couche 3ter — le REGISTRE ne changeait que des couleurs. Onze tokens sur
// soixante-et-onze, tous chromatiques : le marketing était « autrement
// coloré », pas « moins à plat ». Cette surcharge lui donne enfin une
// profondeur propre — ombres pour l'élévation, bordures pour la structure.
await make('semantics-marketing.css', [PRIM, SEM_MKT], {
  selector: '[data-register="marketing"]',
  filter: (t) => t.filePath.includes('semantics-marketing'),
  format: 'css/variables-aikoz-semantics',
}).buildAllPlatforms();

// Couche 4 — bridge shadcn : RUNTIME généré depuis le DTCG, oklch() complet.
// C'est le fichier consommé par les composants (playground/demo). Ne pas éditer à la main.
const bridgeTransforms = ['attribute/cti', 'name/kebab', 'color/oklch', 'size/rem'];
await make('.tmp-shadcn-light.css', [PRIM, brand('aikoz'), theme('light'), SEM, bridgeSrc], {
  selector: ':root, .light', filter: inPath('bridge/shadcn'),
  transforms: bridgeTransforms, buildPath: 'bridge/',
}).buildAllPlatforms();
await make('.tmp-shadcn-dark.css', [PRIM, brand('aikoz'), theme('dark'), SEM, bridgeSrc], {
  selector: '.dark', filter: inPath('bridge/shadcn'),
  transforms: bridgeTransforms, buildPath: 'bridge/',
}).buildAllPlatforms();
await make('.tmp-shadcn-marketing-light.css', [PRIM, brand('aikoz'), theme('marketing-light'), SEM, bridgeSrc], {
  selector: '[data-register="marketing"]', filter: inPath('bridge/shadcn'),
  transforms: bridgeTransforms, buildPath: 'bridge/',
}).buildAllPlatforms();
await make('.tmp-shadcn-marketing.css', [PRIM, brand('aikoz'), theme('marketing'), SEM, bridgeSrc], {
  selector: '.dark[data-register="marketing"], .dark [data-register="marketing"]',
  filter: inPath('bridge/shadcn'),
  transforms: bridgeTransforms, buildPath: 'bridge/',
}).buildAllPlatforms();

const bridgeHeader = `/* ============================================================\n   shadcn-bridge.css — GÉNÉRÉ depuis tokens/ (DTCG) par build-tokens.mjs\n   NE PAS ÉDITER À LA MAIN — régénérer via: npm run build:tokens\n   ============================================================ */\n\n`;
fs.writeFileSync(
  'bridge/shadcn-bridge.css',
  bridgeHeader +
    fs.readFileSync('bridge/.tmp-shadcn-light.css', 'utf8') +
    '\n' +
    fs.readFileSync('bridge/.tmp-shadcn-dark.css', 'utf8') +
    '\n' +
    fs.readFileSync('bridge/.tmp-shadcn-marketing-light.css', 'utf8') +
    '\n' +
    fs.readFileSync('bridge/.tmp-shadcn-marketing.css', 'utf8')
);
fs.unlinkSync('bridge/.tmp-shadcn-light.css');
fs.unlinkSync('bridge/.tmp-shadcn-dark.css');
fs.unlinkSync('bridge/.tmp-shadcn-marketing-light.css');
fs.unlinkSync('bridge/.tmp-shadcn-marketing.css');

const bridge0 = fs.readFileSync('bridge/shadcn-bridge.css', 'utf8');

// ─── Couleurs Tailwind, dérivées du bridge ───────────────────────────────────
//
// Ce fichier est généré parce que la config Tailwind avait DIVERGÉ du bridge,
// silencieusement. `card`, `popover`, `input` et `ring` existaient dans le CSS
// mais pas dans `tailwind.config.ts` : la classe `bg-card` — 52 éléments dans
// le playground — ne produisait donc RIEN, et les cartes n'avaient aucun fond.
// Personne ne l'a vu pendant des semaines parce qu'en thème clair une carte
// blanche manquante laisse voir une page presque blanche.
//
// Une liste tenue à la main à côté d'une liste générée finit toujours par
// diverger. Celle-ci se déduit du bridge : ajouter un rôle au bridge suffit
// désormais à le rendre utilisable en classe Tailwind.
const varsBridge = [
  ...new Set(
    [...bridge0.matchAll(/^\s*--([a-z0-9-]+):/gm)].map((m) => m[1]),
  ),
]
  // `radius` n'est pas une couleur : il a sa propre entrée dans le thème.
  .filter((n) => n !== 'radius')
  .sort();

fs.writeFileSync(
  'build/tailwind-colors.mjs',
  '// GÉNÉRÉ par build-tokens.mjs — NE PAS ÉDITER À LA MAIN.\n' +
    '// Un rôle ajouté au bridge devient automatiquement une couleur Tailwind.\n' +
    'export default ' +
    JSON.stringify(
      Object.fromEntries(varsBridge.map((n) => [n, `var(--${n})`])),
      null,
      2,
    ) +
    ';\n',
);
console.log(`build/tailwind-colors.mjs — ${varsBridge.length} couleurs exposées à Tailwind`);

// ─── La typographie passe elle aussi par Tailwind ────────────────────────────
//
// Les couleurs avaient leur pont depuis longtemps ; la typographie n'en avait
// aucun. Conséquence, mesurée : `build/semantics.css` émet quarante rôles
// `--role-typography-*` que ZÉRO composant consomme. Les composants écrivent
// `text-sm` et `font-semibold`, c'est-à-dire les valeurs par défaut de
// Tailwind — l'échelle typographique du design system était déclarative, elle
// ne gouvernait rien. Changer `typography.body-md` ne déplaçait pas un pixel.
//
// Pire : `font-semibold` (600) est la graisse la plus employée du système et
// n'existait dans AUCUNE couche de tokens.
//
// On génère donc le même pont que pour les couleurs. `text-sm` et
// `font-semibold` deviennent les tokens, sans rien changer aux composants.
{
  const prim = JSON.parse(fs.readFileSync('tokens/primitives.json', 'utf8'));
  const rem = (t) => `${t.$value.value}${t.$value.unit === 'rem' ? 'rem' : 'px'}`;
  const tailles = Object.fromEntries(
    Object.entries(prim.dimension['font-size']).map(([k, v]) => [k, rem(v)]),
  );
  const graisses = Object.fromEntries(
    Object.entries(prim['font-weight']).map(([k, v]) => [k, String(v.$value)]),
  );
  fs.writeFileSync(
    'build/tailwind-typo.mjs',
    '// GÉNÉRÉ par build-tokens.mjs — NE PAS ÉDITER À LA MAIN.\n' +
      '// Les utilitaires `text-*` et `font-*` de Tailwind SONT les tokens.\n' +
      'export const fontSize = ' + JSON.stringify(tailles, null, 2) + ';\n' +
      'export const fontWeight = ' + JSON.stringify(graisses, null, 2) + ';\n',
  );
  console.log(
    `build/tailwind-typo.mjs — ${Object.keys(tailles).length} tailles et ` +
      `${Object.keys(graisses).length} graisses exposées à Tailwind`,
  );
}

// ─── Garde-fou de sortie ─────────────────────────────────────────────────────
//
// Le bridge a déjà été livré avec la source SOMBRE servie sur le sélecteur
// CLAIR : le générateur avait été modifié sans être commité, et l'audit de
// contraste ne l'a pas vu — une palette sombre étiquetée « clair » reste
// parfaitement cohérente avec elle-même, donc elle passe tous les ratios.
//
// Vérifier la cohérence interne ne suffit pas : il faut vérifier que chaque
// combinaison porte les BONNES valeurs. C'est ce que fait ce contrôle.
const bridge = bridge0;

/**
 * Résout une variable jusqu'à sa valeur `oklch()` et rend ses composants.
 *
 * Le bridge pointe vers un rôle de thème, qui pointe vers une primitive. On
 * suit la chaîne dans les fichiers générés, en préférant le bloc du MÊME
 * sélecteur — sans quoi le thème sombre se résoudrait sur les valeurs claires.
 *
 * Il ne savait suivre que `--background` ; la carte héroïne a demandé d'en
 * suivre d'autres, et rien ne justifiait qu'il reste spécialisé.
 */
function resoudreOklch(bloc, selecteur, nomDepart = 'background') {
  const sources = ['build/theme-light.css','build/theme-dark.css','build/theme-marketing-light.css','build/theme-marketing.css','build/primitives.css','build/brand-aikoz.css']
    .filter((f) => fs.existsSync(f))
    .map((f) => ({ fichier: f, contenu: fs.readFileSync(f, 'utf8') }));

  const cherche = (nomVar) => {
    // 1) dans le bloc dont le sélecteur correspond exactement
    for (const { contenu } of sources) {
      const re = new RegExp(`^${selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{([\\s\\S]*?)^\\}`, 'm');
      const b = contenu.match(re);
      if (b) { const v = b[1].match(new RegExp(`--${nomVar}:\\s*([^;]+);`)); if (v) return v[1].trim(); }
    }
    // 2) à défaut, n'importe où (les primitives sont sur :root)
    for (const { contenu } of sources) {
      const v = contenu.match(new RegExp(`--${nomVar}:\\s*([^;]+);`));
      if (v) return v[1].trim();
    }
    return null;
  };

  let valeur =
    (bloc.match(new RegExp(`--${nomDepart}:\\s*([^;]+);`)) || [])[1] ??
    cherche(nomDepart);
  if (!valeur) return null;
  valeur = valeur.trim();
  for (let i = 0; i < 8; i++) {
    const direct = valeur.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    if (direct) return [+direct[1], +direct[2], +direct[3]];
    const gris = valeur.match(/oklch\(\s*([\d.]+)\s+0\s+0\s*\)/);
    if (gris) return [+gris[1], 0, 0];
    const ref = valeur.match(/var\(\s*--([a-z0-9-]+)\s*\)/i);
    if (!ref) return null;
    const suite = cherche(ref[1]);
    if (!suite) return null;
    valeur = suite;
  }
  return null;
}

/** La seule clarté, pour les appels qui ne veulent que ça. */
const resoudreClarte = (bloc, selecteur) =>
  resoudreOklch(bloc, selecteur)?.[0] ?? null;

const BLOCS = [
  { nom: 'produit clair',    selecteur: ':root, .light',                    clair: true  },
  { nom: 'produit sombre',   selecteur: '.dark',                            clair: false },
  { nom: 'marketing clair',  selecteur: '[data-register="marketing"]',      clair: true  },
  { nom: 'marketing sombre', selecteur: '.dark[data-register="marketing"]', clair: false },
];

const echecs = [];
const fonds = new Map();

for (const { nom, selecteur, clair } of BLOCS) {
  // on isole le bloc par son sélecteur exact en début de ligne
  const re = new RegExp(
    `^${selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{([\\s\\S]*?)^\\}`,
    'm',
  );
  const m = bridge.match(re);
  if (!m) { echecs.push(`bloc « ${nom} » absent du bridge`); continue; }

  // Le bridge émet désormais des RÉFÉRENCES (`var(--color-surface-page)`) et
  // non des littéraux : c'est ce qui fait suivre `data-brand` jusqu'aux
  // composants. Le vérificateur doit donc résoudre la chaîne, comme le
  // navigateur — sinon il ne vérifie plus rien.
  const L = resoudreClarte(m[1], selecteur);
  if (L === null) { echecs.push(`« ${nom} » : --background irrésolu`); continue; }
  fonds.set(nom, L);
  // La luminance OKLCH tranche sans ambiguïté : un fond clair est au-dessus de
  // 0,5, un fond sombre en dessous. C'est ce test qui aurait attrapé l'inversion.
  if (clair && L < 0.5) echecs.push(`« ${nom} » a un fond SOMBRE (L=${L}) — sources inversées ?`);
  if (!clair && L > 0.5) echecs.push(`« ${nom} » a un fond CLAIR (L=${L}) — sources inversées ?`);
}

// deux combinaisons qui rendent exactement la même chose = une qui ne sert à rien
const vus = new Map();
for (const [nom, L] of fonds) {
  if (vus.has(L)) echecs.push(`« ${nom} » et « ${vus.get(L)} » ont le même fond (L=${L})`);
  else vus.set(L, nom);
}

// La config Tailwind doit CONSOMMER le fichier généré. Sans ce contrôle, il
// suffit que quelqu'un remette une liste de couleurs à la main pour que la
// divergence revienne — et elle ne se voit pas : en thème clair, une carte
// blanche manquante laisse voir une page presque blanche.
// ── Garde-fou : toute marque générée doit être importée ─────────────────────
//
// `build/index.css` vit dans `build/` mais est écrit À LA MAIN et suivi par
// git — rien ne le distingue d'un fichier généré. Ajouter une marque produit
// donc son CSS sans que personne ne le charge, et la marque reste inerte sans
// la moindre erreur. C'est arrivé en ajoutant ADP.
{
  const indexCss = fs.readFileSync('build/index.css', 'utf8');
  // Toute feuille générée dans build/ doit être importée — pas seulement les
  // marques. Un fichier produit et jamais chargé est inerte, sans erreur.
  const feuilles = fs
    .readdirSync('build')
    .filter((f) => f.endsWith('.css') && f !== 'index.css');
  for (const f of feuilles) {
    if (!indexCss.includes(`@import "./${f}";`)) {
      echecs.push(
        `build/index.css n'importe pas ${f} — ce qu'il déclare serait inerte. ` +
        `Ajouter : @import "./${f}";`
      );
    }
  }
}

// Garde-fou : le chrome sombre est le MÊME pour toutes les marques.
//
// Le 21/09/2026 le sombre a été aligné sur le clair. En clair, les quatre
// marques partagent exactement le même fond (`neutral.50`, chroma 0,0029) et
// la marque ne se lit que sur les ÉLÉMENTS. En sombre, le fond portait la
// marque — chroma de la carte de 0,041 à 0,147, jusqu'à cinquante fois le
// clair. Deux modèles opposés dans un même système.
//
// Les deux garde-fous précédents disparaissent avec ce changement :
//
//   - « la rampe d'Aikoz ne doit pas s'écarter de l'échelle » n'a plus d'objet :
//     l'échelle ne vient plus d'une rampe de marque, elle est interpolée sur
//     la rampe neutre.
//   - « deux marques ne doivent pas se confondre sur la carte » est INVERSÉ :
//     elles doivent maintenant se confondre, et c'est la règle.
//
// Ce qui les remplace est plus simple à tenir : le chrome sombre est une
// valeur unique, et on vérifie qu'aucun fichier de marque ne s'en écarte.
// Ajouter une marque n'a donc plus rien à dériver côté fonds.
const ECHELLE_SOMBRE = {
  400: [0.5856, 0.0139, 260.879],
  500: [0.47, 0.0145, 265.0],
  600: [0.3552, 0.0146, 269.371],
  700: [0.272, 0.0171, 270.767],
  800: [0.2232, 0.0146, 272.351],
  900: [0.1857, 0.0133, 271.174],
  950: [0.159, 0.0116, 271.323],
  1000: [0.1, 0.0062, 274.32],
};
{
  for (const m of ['aikoz', 'adp', 'extime', 'generali']) {
    const f = `tokens/brand/${m}-dark.json`;
    if (!fs.existsSync(f)) { echecs.push(`${f} manque — le chrome sombre y est écrit`); continue; }
    const ink = JSON.parse(fs.readFileSync(f, 'utf8')).color?.ink ?? {};
    for (const [pas, attendu] of Object.entries(ECHELLE_SOMBRE)) {
      const t = ink[pas];
      if (!t) { echecs.push(`« ${m} » n'a pas de chrome sombre au palier ${pas}`); continue; }
      const v = t.$value?.components;
      if (!v || attendu.some((x, i) => Math.abs(v[i] - x) > 0.001)) {
        echecs.push(
          `« ${m} » s'écarte du chrome sombre au palier ${pas} : [${v}] au lieu de ` +
            `[${attendu}]. Le fond ne porte PAS la marque — c'est la règle depuis que le ` +
            `sombre suit le clair. Relancer scripts/ink-sombre.py.`,
        );
      }
    }
  }
}

// Garde-fou : la marque doit se lire sur les ÉLÉMENTS.
//
// C'est la contrepartie du précédent, et il devient portant : puisque les
// fonds ne distinguent plus rien, tout repose sur l'accent et le primaire.
// Si deux marques ont aussi les mêmes éléments, la marque blanche ne se voit
// plus nulle part — et cette fois rien ne le signalerait.
const SEUIL_ELEMENTS = 0.08;
{
  const oklab = (L, C, H) => {
    const h = (H * Math.PI) / 180;
    return [L, C * Math.cos(h), C * Math.sin(h)];
  };
  const ecart = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const prim = JSON.parse(fs.readFileSync('tokens/primitives.json', 'utf8')).color;
  const resoudre = (v, brandLight) => {
    if (!v) return null;
    if (typeof v !== 'string') return v.components;
    const [, rampe, pas] = v.replace(/[{}]/g, '').split('.');
    if (rampe === 'ink') return resoudre(brandLight?.color?.ink?.[pas]?.$value, brandLight);
    return prim[rampe]?.[pas]?.$value?.components ?? null;
  };

  for (const role of ['primary', 'accent']) {
    const vus = {};
    for (const m of ['aikoz', 'adp', 'extime', 'generali']) {
      const f = `tokens/brand/${m}.json`;
      if (!fs.existsSync(f)) continue;
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      const c = resoudre(j.color?.brand?.[role]?.$value, j);
      if (c) vus[m] = c;
    }
    const noms = Object.keys(vus);
    for (let i = 0; i < noms.length; i++) {
      for (let j = i + 1; j < noms.length; j++) {
        const d = ecart(oklab(...vus[noms[i]]), oklab(...vus[noms[j]]));
        if (d < SEUIL_ELEMENTS) {
          echecs.push(
            `« ${noms[i]} » et « ${noms[j]} » ont le même ${role} : ΔE ${d.toFixed(3)} ` +
              `pour un seuil de ${SEUIL_ELEMENTS}. Depuis que les fonds sont communs, ` +
              `c'est l'accent et le primaire qui portent SEULS l'identité.`,
          );
        }
      }
    }
  }
}

// Garde-fou : six séries de données doivent rester distinguables, y compris
// en vision dichromate.
//
// C'est le dernier contrôle du plan de test, et celui qui manquait le plus :
// les palettes de séries sont CALCULÉES par `scripts/palette-series.py`, donc
// personne ne les relit. Rien n'empêchait de retoucher un palier de rampe —
// ou d'ajouter une marque — et de faire tomber deux courbes l'une sur
// l'autre. Le défaut ne se voit pas sur un composant : il se voit sur un
// graphique à six séries, chez quelqu'un d'autre.
//
// Deux critères, deux métriques — c'est le point :
//
//   • SÉPARATION entre séries : ΔE OKLab, seuil 0,10. Un ratio WCAG ne dit
//     RIEN ici : deux teintes de même clarté ont un ratio de 1:1 et peuvent
//     être un rouge et un vert parfaitement distincts. Le seuil catégoriel
//     usuel est ~0,10 ; en dessous de 0,02 deux aplats se confondent.
//   • LISIBILITÉ sur la carte : ratio WCAG, seuil 3:1 (1.4.11 — un tracé est
//     un objet graphique porteur d'information).
//
// Et la séparation est mesurée trois fois : vision normale, protanopie,
// deutéranopie (matrices Viénot/Brettel/Mollon 1999). Une palette qui sépare
// bien en trichromie peut s'effondrer en deutéranopie, qui touche ~6 % des
// hommes — c'est le cas d'école du rouge et du vert de même clarté.
//
// La carte sombre est LUE dans le token émis (`ink.800` de la marque), pas
// re-dérivée : une règle de dérivation recopiée ici vieillirait à part et on
// mesurerait contre une carte qui n'est pas celle qui est rendue. C'est
// exactement ce qui s'est produit dans `palette-series.py`, qui plafonnait
// encore le chroma alors que `ink-sombre.py` ne le plafonne plus.
const SEUIL_SERIES = 0.1;
const SEUIL_TRACE = 3.0;
{
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const delin = (c) => {
    c = Math.max(0, Math.min(1, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  };
  const srgb = (hex) => {
    const h = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const oklab = (rgb) => {
    const [r, g, b] = rgb.map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  };
  // Viénot/Brettel/Mollon 1999, en LMS linéaire.
  const cvd = (rgb, type) => {
    if (type === 'normal') return rgb;
    const [r, g, b] = rgb.map(lin);
    let L = 17.8824 * r + 43.5161 * g + 4.11935 * b;
    let M = 3.45565 * r + 27.1554 * g + 3.86714 * b;
    let S = 0.0299566 * r + 0.184309 * g + 1.46709 * b;
    if (type === 'prot') L = 2.02344 * M - 2.52581 * S;
    else M = 0.494207 * L + 1.24827 * S;
    return [
      0.080944 * L - 0.130504 * M + 0.116721 * S,
      -0.0102485 * L + 0.0540194 * M - 0.113615 * S,
      -0.000365294 * L - 0.00412163 * M + 0.693513 * S,
    ].map(delin);
  };
  const dE = (a, b, type) => {
    const [x, y] = [oklab(cvd(a, type)), oklab(cvd(b, type))];
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  };

  const prim = JSON.parse(fs.readFileSync('tokens/primitives.json', 'utf8')).color;
  const lire = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
  const themes = {
    light: lire('tokens/theme/light.json'),
    dark: lire('tokens/theme/dark.json'),
  };

  for (const marque of ['aikoz', 'adp', 'extime', 'generali']) {
    const clair = lire(`tokens/brand/${marque}.json`);
    const sombre = lire(`tokens/brand/${marque}-dark.json`);

    // `{color.ink.X}` est une référence de MARQUE : le thème la pose, la
    // marque la résout. Sans ce passage, on auditerait la palette d'ADP avec
    // le bleu nuit d'Aikoz.
    const resoudre = (ref, brand) => {
      const [, rampe, pas] = ref.replace(/[{}]/g, '').split('.');
      if (rampe === 'ink') {
        const cible =
          brand?.color?.ink?.[pas]?.$value ?? clair?.color?.ink?.[pas]?.$value;
        if (!cible) return null;
        return typeof cible === 'string' ? resoudre(cible, brand) : srgb(cible.hex);
      }
      const t = prim[rampe]?.[pas];
      return t ? srgb(t.$value.hex) : null;
    };

    for (const theme of ['light', 'dark']) {
      const source = theme === 'dark' ? sombre : clair;
      // La marque redéfinit ses séries, ou hérite de celles du thème.
      const series = source?.color?.chart ?? themes[theme]?.color?.chart;
      if (!series) {
        echecs.push(`« ${marque} » n'a aucune série de données en thème ${theme}`);
        continue;
      }
      const cols = Object.keys(series)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => {
          const v = series[k].$value;
          return [k, typeof v === 'string' ? resoudre(v, source) : srgb(v.hex)];
        });
      const manquantes = cols.filter(([, c]) => !c).map(([k]) => k);
      if (manquantes.length) {
        echecs.push(
          `« ${marque} » ${theme} : les séries ${manquantes.join(', ')} pointent vers ` +
            `une primitive absente — le graphique rendrait sans couleur.`,
        );
        continue;
      }

      // La carte : blanc en clair, le palier 800 du chrome de la marque en
      // sombre — LU, pas re-dérivé.
      const ink800 = sombre?.color?.ink?.['800']?.$value ?? clair?.color?.ink?.['800']?.$value;
      const carte =
        theme === 'light'
          ? srgb('#FFFFFF')
          : typeof ink800 === 'string'
          ? resoudre(ink800, sombre)
          : ink800
          ? srgb(ink800.hex)
          : null;
      if (!carte) {
        echecs.push(`« ${marque} » ${theme} : carte introuvable, séries non auditables`);
        continue;
      }

      for (const [k, c] of cols) {
        const r = ratio(c, carte);
        if (r < SEUIL_TRACE) {
          echecs.push(
            `« ${marque} » ${theme} : la série ${k} tient ${r.toFixed(2)}:1 sur la carte, ` +
              `pour un seuil de ${SEUIL_TRACE}:1 (WCAG 1.4.11 — un tracé porte l'information). ` +
              `Relancer scripts/palette-series.py.`,
          );
        }
      }
      for (let i = 0; i < cols.length; i++) {
        for (let j = i + 1; j < cols.length; j++) {
          for (const vision of ['normal', 'prot', 'deut']) {
            const d = dE(cols[i][1], cols[j][1], vision);
            if (d < SEUIL_SERIES) {
              echecs.push(
                `« ${marque} » ${theme} : les séries ${cols[i][0]} et ${cols[j][0]} se ` +
                  `confondent en vision ${vision} — ΔE ${d.toFixed(3)} pour un seuil de ` +
                  `${SEUIL_SERIES}. Un ratio WCAG ne verrait rien (deux teintes de même ` +
                  `clarté valent 1:1). Relancer scripts/palette-series.py.`,
              );
            }
          }
        }
      }
    }
  }
}

const configTw = fs.readFileSync('tailwind.config.ts', 'utf8');
if (!/from\s+["'].\/build\/tailwind-colors\.mjs["']/.test(configTw)) {
  echecs.push(
    "tailwind.config.ts n'importe plus build/tailwind-colors.mjs — " +
      'les couleurs vont diverger du bridge en silence',
  );
}
if (!/from\s+["'].\/build\/tailwind-typo\.mjs["']/.test(configTw)) {
  echecs.push(
    "tailwind.config.ts n'importe plus build/tailwind-typo.mjs — " +
      "`text-sm` et `font-semibold` reprendraient les valeurs par défaut de " +
      "Tailwind, et l'échelle typographique redeviendrait décorative",
  );
}


// ── La carte héroïne prime sans éblouir ──────────────────────────────────────
//
// `surface.hero` est LA carte qui prime, une seule par écran. Son rôle est la
// HIÉRARCHIE, et une hiérarchie se mesure : un rapport de clarté à la carte
// ordinaire. Trop bas, elle ne prime plus ; trop haut, elle éblouit.
//
// Elle a ébloui. Mesurée sur le tableau de bord RENDU, elle valait **15,3
// fois** la clarté des autres cartes en thème sombre — 120 000 px² de pleine
// clarté sur une page à 0,001 de luminance, le seul point de l'écran qui
// agresse un œil adapté au noir. En clair elle vaut 0,05 fois : elle
// s'enfonce, et c'est reposant. Le contraste était symétrique, le confort ne
// l'était pas, et rien ne le disait — le rôle s'appelait `inverse`, du nom de
// son MOYEN, et un moyen ne se vérifie pas. Un rôle, si.
//
// Les bandes tiennent aux quatre marques : les fonds sombres leur sont
// communs, c'est la lueur d'angle qui porte la marque.
const BANDE_HEROS = {
  // Clair : la carte s'ENFONCE, très loin sous les autres.
  'produit/clair': [0.02, 0.2],
  // Sombre : un panneau ALLUMÉ, pas un aplat blanc.
  'produit/sombre': [2.0, 5.0],
  // Le registre marketing garde l'inversion : une page de site se regarde
  // quelques minutes et cherche l'impact, un tableau de bord se regarde une
  // heure et cherche le confort. C'est ce que `data-register` sert à dire.
  'marketing/clair': [0.02, 0.2],
  'marketing/sombre': [8.0, 20.0],
};

const SELECTEUR_REGISTRE = {
  'produit/clair': ':root, .light',
  'produit/sombre': '.dark',
  'marketing/clair': '[data-register="marketing"]',
  'marketing/sombre': '.dark[data-register="marketing"]',
};

/** Luminance relative WCAG d'une couleur OKLCH — « à quel point ça brille ». */
function luminanceOklch([L, C, H]) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  let R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const borne = (v) => Math.max(0, Math.min(1, v));
  [R, G, B] = [borne(R), borne(G), borne(B)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

for (const [cle, [bas, haut]] of Object.entries(BANDE_HEROS)) {
  const selecteur = SELECTEUR_REGISTRE[cle];
  const re = new RegExp(
    `^${selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{([\\s\\S]*?)^\\}`,
    'm',
  );
  const bloc = (bridge.match(re) || [])[1];
  if (!bloc) {
    echecs.push(`carte héroïne : bloc « ${cle} » absent du bridge`);
    continue;
  }
  const heros = resoudreOklch(bloc, selecteur, 'surface-hero');
  const carte = resoudreOklch(bloc, selecteur, 'card');
  if (!heros || !carte) {
    echecs.push(`carte héroïne : --surface-hero ou --card irrésolu en ${cle}`);
    continue;
  }
  const r = (luminanceOklch(heros) + 0.05) / (luminanceOklch(carte) + 0.05);
  if (r < bas || r > haut) {
    // Hors bande ne veut pas dire la même chose des deux côtés, ni dans les
    // deux thèmes : en clair la carte s'enfonce, en sombre elle s'allume.
    // Un seul message pour les quatre cas en dirait trois de travers.
    const sombre = cle.endsWith('sombre');
    const trop = r > haut;
    const pourquoi = sombre
      ? trop
        ? `Trop claire : sur une page sombre elle devient le seul aplat qui ` +
          `éblouisse un œil adapté au noir. C'est le défaut corrigé le ` +
          `22/09 — elle valait alors 15,3.`
        : `Trop sombre : elle se confond avec les cartes ordinaires, et une ` +
          `carte héroïne qui ne prime pas n'est qu'une carte.`
      : trop
        ? `Pas assez sombre : en thème clair elle prime en S'ENFONÇANT sous ` +
          `les cartes blanches. À ce niveau elle ne s'enfonce plus.`
        : `Trop sombre, au point de virer au noir : le dégradé ne se lit ` +
          `plus et la lueur de marque n'a plus de fond où se poser.`;
    echecs.push(
      `carte héroïne en ${cle} : elle vaut ${r.toFixed(2)} fois la clarté ` +
        `d'une carte ordinaire, hors de la bande [${bas} ; ${haut}]. ${pourquoi}`,
    );
  }
}


// ── Un rôle que personne ne lit est une échelle qui ment ─────────────────────
//
// `build/semantics.css` émettait **86 rôles `--role-*` dont 75 que zéro
// composant ne lisait**. Treize familles de typographie, cinq rayons, cinq
// ombres, trois épaisseurs de bordure : déclarés, documentés, versionnés, et
// sans effet. Les composants écrivaient `text-sm`, `rounded-full`,
// `border` — c'est-à-dire les valeurs par défaut de Tailwind.
//
// Le coût n'est pas la place perdue, il est la CONFIANCE : on lit le fichier
// de tokens en croyant y voir le système, et on y voit une intention. Changer
// `typography.body-md` ne déplaçait pas un pixel, et rien ne le disait.
//
// Ce contrôle interdit d'en réintroduire. Un rôle nouveau est légitime le jour
// où un composant le lit — pas la veille.
{
  const emis = [
    ...new Set((fs.readFileSync('build/semantics.css', 'utf8').match(/--role-[a-z0-9-]+/g) ?? [])),
  ];
  const DOSSIERS = ['registry/aikoz', 'docs/storybook', 'playground', 'bridge'];
  // `coverage` et `preview` sont des SORTIES de build committées : un rôle
  // qu'on n'y trouve que là n'est lu par personne, il y est recopié.
  const IGNORE = new Set(['coverage', 'preview', 'node_modules']);
  let source = '';
  const parcourir = (dossier) => {
    if (!fs.existsSync(dossier)) return;
    for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
      if (IGNORE.has(e.name)) continue;
      const chemin = path.join(dossier, e.name);
      if (e.isDirectory()) parcourir(chemin);
      else if (/\.(tsx?|mdx|css)$/.test(e.name)) source += fs.readFileSync(chemin, 'utf8');
    }
  };
  for (const d of DOSSIERS) parcourir(d);
  source += fs.readFileSync('tailwind.config.ts', 'utf8');

  const morts = emis.filter((r) => !source.includes(r));
  if (morts.length) {
    echecs.push(
      `${morts.length} rôle(s) émis que personne ne lit : ${morts.slice(0, 8).join(', ')}` +
        (morts.length > 8 ? `, et ${morts.length - 8} autres` : '') +
        `. Soit un composant les consomme, soit ils sortent de tokens/semantics.json — ` +
        `un rôle déclaré et jamais lu fait croire qu'il gouverne quelque chose.`,
    );
  }
}

// ─── Un rôle de statut défini dans un thème doit être PUBLIÉ par le pont ────
//
// Le garde-fou précédent attrape les rôles émis que personne ne lit. Il ne
// voyait pas le cas inverse, et il coûtait cher : `status.warning-border`,
// `status.error-border` et leurs deux frères existaient dans les quatre
// thèmes depuis l'origine, sans jamais être republiés sous un nom court.
// Quatre couleurs de la charte qu'AUCUN composant ne pouvait demander —
// `Badge` dessinait donc son contour avec la couleur de texte, et
// l'avertissement sortait en kaki.
//
// Un rôle qu'on ne peut pas demander n'existe pas. Il vaut moins qu'un rôle
// mort : celui-là, au moins, se voit.
{
  const theme = JSON.parse(fs.readFileSync('tokens/theme/light.json', 'utf8'));
  const pont = fs.readFileSync('bridge/shadcn-bridge.css', 'utf8');
  const nomsDeStatut = [];
  const parcourir = (o, chemin = '') => {
    if (!o || typeof o !== 'object') return;
    if ('$value' in o) {
      if (/^color\.status\./.test(chemin)) nomsDeStatut.push(chemin.replace('color.status.', ''));
      return;
    }
    for (const [k, v] of Object.entries(o)) parcourir(v, chemin ? `${chemin}.${k}` : k);
  };
  parcourir(theme);

  // On cherche si le pont POINTE vers le rôle, pas s'il porte le même nom :
  // il renomme volontiers — `status.warning-text` y devient `--warning`, et
  // `status.error-text` y devient `--destructive-text`. Chercher le nom
  // exact accusait cinq rôles parfaitement publiés.
  // Les aplats PLEINS d'un statut — la rampe `*.500`. Seule l'erreur en a un
  // usage aujourd'hui, republiée en `--destructive`. Les trois autres
  // attendent un composant qui les demande, et la doctrine est explicite :
  // « un rôle nouveau est légitime le jour où un composant le lit, pas la
  // veille ». On les nomme ici pour que leur absence soit une DÉCISION
  // relisible, pas un trou.
  const ATTENDENT_UN_USAGE = new Set(['success', 'warning', 'info']);

  const absents = nomsDeStatut.filter(
    (n) => !ATTENDENT_UN_USAGE.has(n) && !pont.includes(`--color-status-${n})`),
  );
  if (absents.length) {
    echecs.push(
      `${absents.length} rôle(s) de statut défini(s) dans les thèmes et publié(s) ` +
        `nulle part : ${absents.join(', ')}. Aucun composant ne peut les demander, ` +
        `donc ils n'existent pas. Soit tokens/bridge/shadcn.json les expose, soit ` +
        `ils sortent des thèmes.`,
    );
  }
}

if (echecs.length) {
  console.error('\nbuild ÉCHOUÉ — le bridge ne rend pas ce qu\'il annonce :');
  for (const e of echecs) console.error('  ✗ ' + e);
  process.exit(1);
}

console.log(
  'build OK — 4 combinaisons vérifiées : ' +
    [...fonds].map(([n, L]) => `${n} L=${L}`).join(' · '),
);
