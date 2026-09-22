/**
 * Publie la version du design system à côté du registry.
 *
 * Le schéma de registry shadcn n'a pas de champ `version` à sa racine, et en
 * ajouter un le rendrait invalide. La version voyage donc dans son propre
 * fichier, servi par le même site : un consommateur — ou un script chez lui —
 * peut demander `…/version.json` et savoir ce qu'il installe.
 *
 * Ça existe parce que `tableCollapsed` a disparu de `ChartFrame` sans que
 * personne ne puisse le voir venir. Une version qu'on ne peut pas lire depuis
 * l'extérieur ne protège personne.
 */
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const entrees = JSON.parse(fs.readFileSync('registry.json', 'utf8')).items.length;

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync(
  'public/version.json',
  JSON.stringify(
    {
      nom: pkg.name,
      version: pkg.version,
      entrees,
      journal: 'https://github.com/Voice-of-Customers-by-Okuden/aikoz-design-system/blob/main/CHANGELOG.md',
      publie: new Date().toISOString().slice(0, 10),
    },
    null,
    2,
  ) + '\n',
);
console.log(`version.json — ${pkg.name} ${pkg.version}, ${entrees} entrées`);
