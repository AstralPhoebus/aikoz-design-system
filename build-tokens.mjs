import StyleDictionary from 'style-dictionary';
import fs from 'node:fs';
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
// Couche 2 — brand (rôles) : Aikoz par défaut sur :root, Generali scopé
await make('brand-aikoz.css',    [PRIM, brand('aikoz')],    { selector: ':root',                    filter: inPath('brand/aikoz'),    transforms: cssOklch }).buildAllPlatforms();
await make('brand-generali.css', [PRIM, brand('generali')], { selector: '[data-brand="generali"]',  filter: inPath('brand/generali'), transforms: cssOklch }).buildAllPlatforms();
await make('brand-adp.css', [PRIM, brand('adp')], { selector: '[data-brand="adp"]', filter: inPath('brand/adp'), transforms: cssOklch }).buildAllPlatforms();
await make('brand-extime.css', [PRIM, brand('extime')], { selector: '[data-brand="extime"]', filter: inPath('brand/extime'), transforms: cssOklch }).buildAllPlatforms();
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
await make('semantics.css', [PRIM, SEM], {
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
 * Résout `--background` jusqu'à sa valeur `oklch()` et rend sa clarté.
 *
 * Le bridge pointe vers un rôle de thème, qui pointe vers une primitive. On
 * suit la chaîne dans les fichiers générés, en préférant le bloc du MÊME
 * sélecteur — sans quoi le thème sombre se résoudrait sur les valeurs claires.
 */
function resoudreClarte(bloc, selecteur) {
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

  let valeur = (bloc.match(/--background:\s*([^;]+);/) || [])[1];
  if (!valeur) return null;
  valeur = valeur.trim();
  for (let i = 0; i < 8; i++) {
    const direct = valeur.match(/oklch\(([\d.]+)/);
    if (direct) return parseFloat(direct[1]);
    const ref = valeur.match(/var\(\s*--([a-z0-9-]+)\s*\)/i);
    if (!ref) return null;
    const suite = cherche(ref[1]);
    if (!suite) return null;
    valeur = suite;
  }
  return null;
}

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

const configTw = fs.readFileSync('tailwind.config.ts', 'utf8');
if (!/from\s+["'].\/build\/tailwind-colors\.mjs["']/.test(configTw)) {
  echecs.push(
    "tailwind.config.ts n'importe plus build/tailwind-colors.mjs — " +
      'les couleurs vont diverger du bridge en silence',
  );
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
