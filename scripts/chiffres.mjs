/**
 * Les chiffres de la page d'accueil, comptés plutôt qu'écrits.
 *
 * L'introduction annonçait **37 composants** alors qu'il y en avait 51. Le
 * chiffre avait été juste une fois, puis quatorze composants sont arrivés et
 * personne n'est retourné éditer la phrase. C'est la première ligne que lit
 * quelqu'un qui découvre le système, et elle mentait d'un tiers.
 *
 * Même doctrine que le pont Tailwind et que `version.json` : on ne DÉCLARE
 * pas ce qu'on peut COMPTER. Un chiffre écrit à la main est juste le jour où
 * on l'écrit, et faux tous les autres.
 */
import fs from 'node:fs';
import path from 'node:path';

const composants = fs
  .readdirSync('registry/aikoz', { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== 'lib').length;

const entrees = JSON.parse(fs.readFileSync('registry.json', 'utf8')).items.length;

// Une marque = un logo, quelles que soient ses déclinaisons (`-blanc`).
const marques = new Set(
  fs
    .readdirSync('public/brands')
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.replace(/-blanc\.svg$|\.svg$/, '')),
).size;

// Deux registres × deux thèmes : les quatre blocs que le build vérifie.
const combinaisons = ['theme-light', 'theme-dark', 'theme-marketing-light', 'theme-marketing']
  .filter((n) => fs.existsSync(path.join('build', `${n}.css`))).length;

const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;

const sortie = `// GÉNÉRÉ par \`npm run build:chiffres\` — ne pas éditer à la main.
//
// L'introduction annonçait 37 composants quand il y en avait 51 : le chiffre
// avait été juste une fois, puis quatorze composants sont arrivés. On ne
// déclare pas ce qu'on peut compter.
export const CHIFFRES = {
  composants: ${composants},
  entrees: ${entrees},
  marques: ${marques},
  combinaisons: ${combinaisons},
  version: "${version}",
} as const;
`;

fs.writeFileSync('docs/storybook/chiffres.ts', sortie);
console.log(
  `chiffres.ts — ${composants} composants, ${entrees} entrées, ${marques} marques, ` +
    `${combinaisons} combinaisons, v${version}`,
);
