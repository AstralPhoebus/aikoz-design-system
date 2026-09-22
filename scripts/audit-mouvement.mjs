/**
 * Tout ce qui bouge doit pouvoir s'arrêter.
 *
 * `prefers-reduced-motion` n'est pas une option de confort : pour qui souffre
 * de troubles vestibulaires, une animation non sollicitée provoque des
 * vertiges et des nausées. Le système d'exploitation porte déjà le réglage —
 * il ne reste qu'à l'écouter.
 *
 * Audit du 22/09/2026. Le design system l'écoutait **à moitié** :
 * `Accordion`, `ProgressBar` et `Skeleton` coupaient bien leur animation ;
 * `Switch` faisait glisser sa pastille de vingt pixels sans rien demander, et
 * `KpiCard` rétrécissait la carte entière à l'appui. Trois composants sur six.
 *
 * Une règle appliquée à moitié ne protège personne : l'utilisateur qui a
 * coché la case dans ses réglages voit certaines choses s'arrêter et pas
 * d'autres, et n'a aucun moyen de savoir lesquelles.
 *
 * ## Ce qui compte comme mouvement
 *
 * Un fondu de COULEUR n'en est pas — `transition-colors` reste autorisé sans
 * garde, et il vaut mieux le garder : il adoucit un changement d'état sans
 * rien déplacer. Ce qui compte, c'est ce qui bouge dans l'espace ou ce qui
 * pulse : `transition-transform`, `animate-*`, et `transition-all` — qui
 * anime tout, y compris ce qu'on n'avait pas prévu d'animer.
 *
 * ## Portée du contrôle
 *
 * La garde est cherchée dans le MÊME appel `cn(...)` ou la même chaîne de
 * classes que l'utilitaire de mouvement — pas ailleurs dans le fichier. Un
 * composant qui garde une animation et pas l'autre doit échouer, sinon le
 * contrôle reproduirait précisément le défaut qu'il est censé attraper.
 *
 * Les COMMENTAIRES sont neutralisés avant l'analyse, et les mentions en
 * PROSE aussi. Le premier jet ne faisait ni l'un ni l'autre et signalait
 * quatre fautes qui n'en étaient pas : `Dialog` et `Tooltip` expliquent — en
 * commentaire pour l'un, dans le texte d'une histoire pour l'autre — que
 * leurs classes `animate-in` ont été RETIRÉES. Un contrôle qui accuse la
 * documentation d'un correctif est un contrôle qu'on apprend à ignorer.
 *
 * Une mention en prose se reconnaît à ses accents graves collés de part et
 * d'autre — `` `animate-in` ``, la notation Markdown d'un bout de code. Un
 * gabarit de classes n'a jamais cette forme : il contient au moins une
 * espace, donc au moins un caractère entre l'accent et l'utilitaire.
 */
import fs from 'node:fs';
import path from 'node:path';

const DOSSIERS = ['registry/aikoz', 'docs/storybook', 'playground'];

/** Les utilitaires qui déplacent ou font pulser quelque chose. */
const MOUVEMENT =
  /\b(transition-transform|transition-all|animate-(?!none\b)[a-z][a-z0-9-]*)\b/g;
/** Les deux façons d'écouter le réglage système. */
const GARDE = /\b(motion-reduce|motion-safe):/;

const echecs = [];

function* fichiers(dossier) {
  if (!fs.existsSync(dossier)) return;
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (e.name === 'coverage' || e.name === 'node_modules') continue;
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) yield* fichiers(p);
    else if (/\.tsx$/.test(e.name)) yield p;
  }
}

/**
 * La portion de source qui porte les classes autour de `i`.
 *
 * Remonte jusqu'au `cn(` englobant et redescend jusqu'à sa parenthèse
 * fermante. À défaut de `cn(`, on retombe sur la ligne — une classe écrite
 * en chaîne simple n'a pas d'autre étendue.
 */
function bloc(source, i) {
  const debut = source.lastIndexOf('cn(', i);
  if (debut === -1) {
    const a = source.lastIndexOf('\n', i) + 1;
    const b = source.indexOf('\n', i);
    return source.slice(a, b === -1 ? source.length : b);
  }
  let profondeur = 0;
  for (let j = debut + 2; j < source.length; j++) {
    if (source[j] === '(') profondeur++;
    else if (source[j] === ')') {
      profondeur--;
      if (profondeur === 0) {
        // L'utilitaire est-il vraiment DANS cet appel ? Sinon le `cn(`
        // trouvé est un appel précédent, déjà refermé : on prend la ligne.
        if (j > i) return source.slice(debut, j + 1);
        const a = source.lastIndexOf('\n', i) + 1;
        const b = source.indexOf('\n', i);
        return source.slice(a, b === -1 ? source.length : b);
      }
    }
  }
  return source.slice(debut);
}

for (const dossier of DOSSIERS) {
  for (const f of fichiers(dossier)) {
    const brut = fs.readFileSync(f, 'utf8');
    // Les commentaires sont blanchis en conservant les sauts de ligne : les
    // numéros de ligne et les positions restent justes.
    const source = brut
      .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
      .replace(/\/\/[^\n]*/g, (c) => ' '.repeat(c.length));
    for (const m of source.matchAll(MOUVEMENT)) {
      const ligne = source.slice(0, m.index).split('\n').length;
      // Une mention Markdown en prose, pas une classe : `animate-in`.
      if (source[m.index - 1] === '`' && source[m.index + m[0].length] === '`')
        continue;
      const portee = bloc(source, m.index);
      if (GARDE.test(portee)) continue;
      echecs.push(
        `${f}:${ligne} — \`${m[0]}\` sans garde de mouvement. ` +
          `Ajouter \`motion-reduce:\` (couper) ou \`motion-safe:\` (n'animer ` +
          `que si le système le permet) dans le MÊME bloc de classes. ` +
          `Un fondu de couleur n'est pas concerné : \`transition-colors\` ` +
          `reste libre.`,
      );
    }
  }
}

if (echecs.length) {
  console.error('\naudit mouvement ÉCHOUÉ — ça bouge sans pouvoir s’arrêter :');
  for (const e of echecs) console.error('  ✗ ' + e);
  console.error(
    '\n`prefers-reduced-motion` n’est pas une option de confort : pour qui ' +
      'souffre de troubles vestibulaires, une animation non sollicitée ' +
      'provoque vertiges et nausées. Le système porte déjà le réglage.\n',
  );
  process.exit(1);
}

console.log(
  'audit mouvement OK — toute animation de position ou de pulsation écoute ' +
    '`prefers-reduced-motion`.',
);
