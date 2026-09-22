/**
 * Toucher au registry sans dire ce qui a changé, c'est le défaut qu'on paie
 * chez le consommateur.
 *
 * `ChartFrame` a perdu sa prop `tableCollapsed` le 21/09/2026. Louis consomme
 * le registry publié : à son prochain `shadcn add`, son code aurait cessé de
 * compiler, sans qu'aucun signal ne soit passé entre les deux. Le dépôt était
 * à `1.0.0` depuis le premier commit, et n'avait pas de journal.
 *
 * Ce contrôle exige donc deux choses, et seulement quand le contenu LIVRÉ
 * change :
 *
 *  1. la version de `package.json` monte,
 *  2. `CHANGELOG.md` porte une entrée pour cette version.
 *
 * Il ne dit pas si le numéro est le bon — majeur, mineur, correctif : ça, c'est
 * un jugement sur la portée du changement, et aucune machine ne le rendra. Le
 * journal rappelle la règle en tête ; c'est à l'auteur de la PR de trancher.
 *
 * Une PR qui ne touche qu'à la documentation, aux tests ou à l'outillage ne
 * déclenche rien : elle ne change pas ce que le consommateur installe.
 *
 * Il vérifie aussi que **le verrou suit**. Monter la version dans
 * `package.json` sans relancer `npm install` laisse `package-lock.json` sur
 * l'ancienne : `npm ci` refuse alors de s'exécuter — « can only install
 * packages when your package.json and package-lock.json are in sync » — et la
 * CI tombe dès sa première étape, sur un message qui ne dit pas d'où ça vient.
 * C'est arrivé le 22/09/2026, sur une montée de version que ce contrôle avait
 * lui-même exigée.
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

/** Ce qui part chez le consommateur. Le reste ne le regarde pas. */
const LIVRE = [/^registry\/aikoz\//, /^registry\.json$/, /^tokens\//, /^bridge\//];

const base = process.env.BASE_REF || 'origin/main';

function git(commande) {
  return execSync(commande, { encoding: 'utf8' }).trim();
}

let modifies;
try {
  modifies = git(`git diff --name-only ${base}...HEAD`).split('\n').filter(Boolean);
} catch {
  console.log(
    `audit version ignoré — impossible de comparer à ${base}. ` +
      'Le contrôle a besoin de la branche de référence pour savoir ce qui change.',
  );
  process.exit(0);
}

const touchent = modifies.filter((f) => LIVRE.some((re) => re.test(f)));
if (!touchent.length) {
  console.log('audit version OK — rien de livré ne change, aucune version à monter.');
  process.exit(0);
}

const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
let versionBase;
try {
  versionBase = JSON.parse(git(`git show ${base}:package.json`)).version;
} catch {
  versionBase = null;
}

const echecs = [];

if (versionBase && version === versionBase) {
  echecs.push(
    `${touchent.length} fichier(s) livré(s) changent et la version reste ` +
      `${version}. Un consommateur installe le nouveau contenu sans pouvoir ` +
      `le distinguer de l'ancien.\n    ` +
      touchent.slice(0, 6).join('\n    ') +
      (touchent.length > 6 ? `\n    et ${touchent.length - 6} autres` : ''),
  );
}

// Le verrou porte la version lui aussi. `npm ci` compare les deux et refuse
// de s'exécuter si elles divergent.
if (fs.existsSync('package-lock.json')) {
  const verrou = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  const versionsVerrou = [verrou.version, verrou.packages?.['']?.version];
  if (versionsVerrou.some((v) => v && v !== version)) {
    echecs.push(
      `package-lock.json est resté en ${versionsVerrou.filter(Boolean).join(' / ')} ` +
        `alors que package.json est en ${version}. \`npm ci\` refusera de ` +
        `s'exécuter — « can only install packages when your package.json and ` +
        `package-lock.json are in sync » — et la CI tombera dès sa première ` +
        `étape, sur un message qui ne dit pas d'où ça vient. Correctif : ` +
        `\`npm install\` puis commit du verrou.`,
    );
  }
}

const journal = fs.existsSync('CHANGELOG.md') ? fs.readFileSync('CHANGELOG.md', 'utf8') : '';
if (!journal) {
  echecs.push('CHANGELOG.md manque.');
} else if (!journal.includes(`[${version}]`)) {
  echecs.push(
    `CHANGELOG.md n'a pas d'entrée \`[${version}]\`. Une version sans journal ` +
      `oblige à lire les commits pour savoir ce qui a bougé — c'est-à-dire à ` +
      `ne pas le savoir.`,
  );
}

if (echecs.length) {
  console.error('\naudit version ÉCHOUÉ :');
  for (const e of echecs) console.error('  ✗ ' + e);
  console.error(
    '\nMAJEUR si une prop, un composant ou une variable CSS publiée disparaît ' +
      'ou change de type. MINEUR pour un ajout. CORRECTIF sinon.\n',
  );
  process.exit(1);
}

console.log(
  `audit version OK — ${version}, ${touchent.length} fichier(s) livré(s) ` +
    'modifiés, entrée de journal présente.',
);
