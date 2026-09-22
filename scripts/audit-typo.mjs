/**
 * L'échelle typographique doit gouverner, pas décorer.
 *
 * Audit du 22/09/2026, contre les règles mesurables de *Practical UI*
 * (chapitre 5). Deux constats, et le second est le vrai sujet :
 *
 *  1. `font-semibold` (600) est la graisse la PLUS employée du système —
 *     47 usages contre 37 pour `medium` et 16 pour `bold` — et elle
 *     n'existait dans aucune couche de tokens.
 *
 *  2. `build/semantics.css` émet quarante rôles `--role-typography-*` que
 *     **zéro composant ne consomme**. Les composants écrivent `text-sm` et
 *     `font-semibold`, c'est-à-dire les valeurs par défaut de Tailwind.
 *     L'échelle était déclarée, documentée, et sans effet : changer
 *     `typography.body-md` ne déplaçait pas un pixel.
 *
 * Le pont `build/tailwind-typo.mjs` règle la cause — les utilitaires SONT
 * désormais les tokens. Ce contrôle règle la récidive : une taille ou une
 * graisse écrite en dur rouvre le trou sans que rien ne le signale.
 *
 * Ce qui reste autorisé : les dimensions arbitraires qui ne sont ni une
 * taille de texte ni une graisse (`max-w-[160px]` pour la boîte d'un logo,
 * `min-w-[210px]` pour une colonne). Elles ne relèvent pas d'une échelle
 * typographique, et les inventorier ici ferait du bruit sans règle derrière.
 *
 * Les COMMENTAIRES et les mentions en PROSE sont neutralisés avant l'analyse.
 * Le contrôle a échoué sur la page « Créer un composant », qui CITE
 * `text-[13px]` comme contre-exemple de ce qu'il refuse. Un contrôle qui
 * accuse la documentation de la règle qu'il applique est un contrôle qu'on
 * apprend à ignorer — c'est exactement ce qui était arrivé à l'audit du
 * mouvement, sur `animate-in` cité par `Dialog` et `Tooltip`.
 *
 * Une mention en prose se reconnaît à ses accents graves collés de part et
 * d'autre : la notation Markdown d'un bout de code. Un vrai gabarit de
 * classes n'a jamais cette forme, il contient au moins une espace.
 */
import fs from 'node:fs';
import path from 'node:path';

const DOSSIERS = ['registry/aikoz', 'docs/storybook', 'playground'];
const prim = JSON.parse(fs.readFileSync('tokens/primitives.json', 'utf8'));

const TAILLES = new Set(Object.keys(prim.dimension['font-size']));
const GRAISSES = new Set(Object.keys(prim['font-weight']));

const echecs = [];

function* fichiers(dossier) {
  if (!fs.existsSync(dossier)) return;
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) yield* fichiers(p);
    else if (/\.(tsx?|mdx)$/.test(e.name)) yield p;
  }
}

for (const dossier of DOSSIERS) {
  for (const f of fichiers(dossier)) {
    const brut = fs.readFileSync(f, 'utf8');
    // Commentaires blanchis en conservant les sauts de ligne : les numéros
    // de ligne restent justes.
    const lignes = brut
      .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
      .replace(/\/\/[^\n]*/g, (c) => ' '.repeat(c.length))
      .split('\n');
    /** Une mention Markdown en prose, pas une classe : `text-[13px]`. */
    const enProse = (ligne, m) =>
      ligne[m.index - 1] === '`' && ligne[m.index + m[0].length] === '`';
    lignes.forEach((ligne, i) => {
      // Une taille de texte écrite en dur.
      for (const m of ligne.matchAll(/\btext-\[(\d+(?:\.\d+)?)(px|rem)\]/g)) {
        if (enProse(ligne, m)) continue;
        echecs.push(
          `${f}:${i + 1} — \`${m[0]}\` : taille de texte hors échelle. ` +
            `L'échelle en propose ${TAILLES.size} : ${[...TAILLES].join(', ')}.`,
        );
      }
      // Une graisse écrite en dur, ou absente de l'échelle.
      for (const m of ligne.matchAll(/\bfont-\[(\d+)\]/g)) {
        if (enProse(ligne, m)) continue;
        echecs.push(`${f}:${i + 1} — \`${m[0]}\` : graisse écrite en dur.`);
      }
      for (const m of ligne.matchAll(
        /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g,
      )) {
        if (enProse(ligne, m)) continue;
        // `normal` est l'alias Tailwind de `regular`.
        const nom = m[1] === 'normal' ? 'regular' : m[1];
        if (!GRAISSES.has(nom)) {
          echecs.push(
            `${f}:${i + 1} — \`${m[0]}\` : graisse absente de l'échelle. ` +
              `Elle en propose ${GRAISSES.size} : ${[...GRAISSES].join(', ')}. ` +
              `Soit la classe change, soit l'échelle l'accueille — mais une ` +
              `graisse employée et non déclarée, c'est une échelle qui ment.`,
          );
        }
      }
    });
  }
}

// Le pont doit exister : sans lui, les utilitaires reprennent les valeurs par
// défaut de Tailwind et l'échelle redevient décorative.
if (!fs.existsSync('build/tailwind-typo.mjs')) {
  echecs.push(
    'build/tailwind-typo.mjs manque — lancer `npm run build:tokens`. ' +
      'Sans ce pont, `text-sm` vaut la valeur par défaut de Tailwind et non le token.',
  );
}

if (echecs.length) {
  console.error("\naudit typographie ÉCHOUÉ — l'échelle ne gouverne pas :");
  for (const e of echecs) console.error('  ✗ ' + e);
  process.exit(1);
}

console.log(
  `audit typographie OK — ${TAILLES.size} tailles et ${GRAISSES.size} graisses, ` +
    'toutes déclarées, aucune valeur écrite en dur.',
);
