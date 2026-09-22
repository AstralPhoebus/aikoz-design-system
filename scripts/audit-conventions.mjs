/**
 * Les conventions du design system, figées.
 *
 * Elles étaient toutes respectées — par 48 composants sur 48, ou 47 sur 48 —
 * et aucune n'était écrite ni vérifiée. C'est de la **dette de règle** : une
 * convention que tout le monde suit sans qu'elle existe nulle part tient tant
 * que la même personne écrit tout le code. Elle tombe au premier composant
 * écrit par quelqu'un d'autre, et personne ne saura dire si c'est lui qui a
 * dérivé ou la règle qui n'en était pas une.
 *
 * On ne fige ici que ce que le code respecte DÉJÀ intégralement. Une
 * convention suivie à 70 % n'est pas une règle : c'est un défaut ou un
 * arbitrage, et ça se traite autrement.
 *
 * ## Ce qui n'est PAS ici, et pourquoi
 *
 * - **`cn()` pour composer les classes.** `BarChart` et `LineChart` passent
 *   leur `className` tel quel à `ChartFrame`, qui compose. Exiger `cn()` là où
 *   il n'y a rien à fusionner serait une règle qui se trompe de cible.
 * - **Le français dans les noms d'histoires.** Détectable seulement par des
 *   heuristiques (accents, articles) qui ratent « Choix unique ». Une règle
 *   qu'on ne sait pas mesurer n'est pas une règle, c'est un vœu.
 */
import fs from 'node:fs';
import path from 'node:path';

const RACINE = 'registry/aikoz';

/**
 * Les exceptions, nommées et justifiées.
 *
 * Une exception anonyme est un trou ; une exception qui porte sa raison est
 * une décision. Elles se relisent, et elles rétrécissent.
 */
const EXCEPTIONS = {
  'hex-en-dur': {
    leaderboard:
      "Or, argent, bronze. Ces trois teintes ne viennent PAS des tokens et " +
      "n'y viendront pas : ce sont des références culturelles à des métaux, " +
      "pas des couleurs d'interface. Elles ne suivent ni le thème ni le " +
      "registre, exactement comme les couleurs de marque ne suivent pas le " +
      "thème.",
  },
};

const echecs = [];
const composants = fs
  .readdirSync(RACINE, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== 'lib')
  .map((e) => e.name);

/**
 * Toute balise `<svg>` du source, même écrite sur plusieurs lignes.
 *
 * On s'arrête au `>` qui ferme la balise, en laissant passer les accolades
 * JSX (`viewBox={...}`) qui en contiennent parfois un.
 */
const BALISES_SVG = /<svg\b(?:[^<>]|\{[^{}]*\})*?>/g;
/** Les quatre façons de dire à une technologie d'assistance ce qu'elle voit. */
const ETIQUETTE = /aria-hidden|role="img"|aria-label|aria-labelledby/;

/** Le source sans ses commentaires — on ne juge pas la prose. */
function sansCommentaires(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (c) => ' '.repeat(c.length));
}

for (const nom of composants) {
  const fichier = path.join(RACINE, nom, `${nom}.tsx`);
  const histoires = path.join(RACINE, nom, `${nom}.stories.tsx`);
  const ou = `${nom}`;

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(nom)) {
    echecs.push(
      `${ou} — le dossier n'est pas en kebab-case. Le nom du dossier, celui ` +
        `du fichier et celui de l'entrée de registry sont le même : c'est ce ` +
        `qui permet à \`shadcn add ${nom}\` de fonctionner sans table de ` +
        `correspondance.`,
    );
    continue;
  }
  if (!fs.existsSync(fichier)) {
    echecs.push(`${ou} — pas de ${nom}.tsx. Le fichier porte le nom du dossier.`);
    continue;
  }

  const brut = fs.readFileSync(fichier, 'utf8');
  const code = sansCommentaires(brut);

  if (/export default/.test(code)) {
    echecs.push(
      `${ou} — export par défaut. Tous les composants s'exportent par leur ` +
        `NOM : un import par défaut se renomme librement chez le ` +
        `consommateur, et deux applications finissent par appeler la même ` +
        `chose autrement.`,
    );
  }
  if (!/export (interface|type) \w+Props/.test(code)) {
    echecs.push(
      `${ou} — n'exporte pas son interface \`Props\`. Elle fait partie du ` +
        `contrat : sans elle, un consommateur ne peut pas typer un ` +
        `composant qui enveloppe le nôtre.`,
    );
  }
  // Le mot `className` apparaît de toute façon dans le rendu : ce qu'on
  // vérifie, c'est qu'il est DÉCLARÉ dans le contrat — soit en propre, soit
  // hérité des attributs HTML natifs par `extends ...HTMLAttributes`.
  const declareClassName =
    /className\??:\s*string/.test(code) || /extends\s+[^{]*HTMLAttributes/.test(code);
  if (!declareClassName) {
    echecs.push(
      `${ou} — n'accepte pas \`className\`. Un composant qu'on ne peut pas ` +
        `placer dans une grille sans l'envelopper d'un \`<div>\` force le ` +
        `consommateur à ajouter un nœud au DOM pour chaque usage.`,
    );
  }
  if (/--color-(midnight|ultramarine|aquamarine|adp|extime|generali|neutral|ink|success|warning|error)-\d/.test(code)) {
    echecs.push(
      `${ou} — écrit une PRIMITIVE de couleur. Un composant ne connaît que ` +
        `des rôles : la primitive ne suit ni la marque, ni le thème, ni le ` +
        `registre. S'il manque un rôle, on en crée un — on n'en détourne pas ` +
        `un voisin.`,
    );
  }
  // Un hex dans un `viewBox` ou un `d=` de tracé n'est pas une couleur.
  const hex = code.replace(/viewBox="[^"]*"/g, '').replace(/\sd="[^"]*"/g, '').match(/#[0-9a-fA-F]{6}\b/);
  if (hex && !EXCEPTIONS['hex-en-dur'][nom]) {
    echecs.push(
      `${ou} — couleur en dur (${hex[0]}). Même raison qu'au-dessus. Si ` +
        `c'est délibéré, la raison s'inscrit dans EXCEPTIONS de ce fichier — ` +
        `une exception anonyme est un trou, une exception qui porte sa raison ` +
        `est une décision.`,
    );
  }

  // Un défilement qui ne peut pas contenir.
  //
  // Un élément de flex ou de grille vaut `min-width: auto` : il ne rétrécit
  // jamais sous la largeur de son contenu. Un `overflow-x-auto` posé dessus
  // sans `min-w-0` ne défile donc pas — il s'élargit, et c'est la PAGE qui
  // défile à sa place. Mesuré sur le tableau de bord à 390 px : la grille
  // faisait 350, la carte 406, et la page débordait de 36 px alors que le
  // tableau avait bien son conteneur scrollable.
  for (const ligne of code.split('\n')) {
    if (!/overflow-(x-)?(auto|scroll)/.test(ligne)) continue;
    if (/min-w-0/.test(ligne)) continue;
    echecs.push(
      `${ou} — un \`overflow\` horizontal sans \`min-w-0\` sur le même élément. ` +
        `Il ne contiendra rien : il s'élargira, et la page défilera à sa ` +
        `place. Les deux classes vont ensemble, toujours.`,
    );
  }

  for (const m of code.matchAll(BALISES_SVG)) {
    if (ETIQUETTE.test(m[0])) continue;
    const ligne = code.slice(0, m.index).split('\n').length;
    echecs.push(
      `${ou}:${ligne} — un \`<svg>\` sans \`aria-hidden\`, \`role="img"\` ni ` +
        `libellé. Un pictogramme décoratif se MASQUE : sans ça, un lecteur ` +
        `d'écran annonce « graphique » au milieu d'une phrase, ou pire lit le ` +
        `contenu du tracé. S'il porte du sens, il prend \`role="img"\` et un ` +
        `\`aria-label\` — mais dans ce système le sens est toujours dans le ` +
        `texte à côté.`,
    );
  }

  if (!fs.existsSync(histoires)) {
    echecs.push(
      `${ou} — pas de ${nom}.stories.tsx. Les histoires SONT les tests : un ` +
        `composant sans histoire n'est ni testé, ni documenté, ni visible.`,
    );
    continue;
  }
  const hist = fs.readFileSync(histoires, 'utf8');
  if (!/satisfies Meta/.test(hist)) {
    echecs.push(
      `${ou} — \`meta\` sans \`satisfies Meta\`. C'est ce qui fait typer les ` +
        `\`args\` de chaque histoire contre les props réelles ; sans lui, une ` +
        `prop renommée laisse les histoires compiler et mentir.`,
    );
  }
  if (!/play:\s*async/.test(hist)) {
    echecs.push(
      `${ou} — aucune histoire ne joue un \`play\`. Une histoire sans \`play\` ` +
        `montre le composant ; elle ne vérifie pas qu'il tient sa promesse. ` +
        `Au moins une doit échouer si on retire la règle centrale du ` +
        `composant.`,
    );
  }
}

// Une exception qui ne s'applique plus doit disparaître, comme une dette.
for (const [regle, cas] of Object.entries(EXCEPTIONS)) {
  for (const nom of Object.keys(cas)) {
    if (!composants.includes(nom)) {
      echecs.push(
        `EXCEPTIONS[${regle}] cite « ${nom} », qui n'existe plus. Une ` +
          `exception qu'on ne mesure plus ne protège rien : retirer sa ligne.`,
      );
    }
  }
}

if (echecs.length) {
  console.error('\naudit conventions ÉCHOUÉ :');
  for (const e of echecs) console.error('  ✗ ' + e);
  process.exit(1);
}

console.log(
  `audit conventions OK — ${composants.length} composants, onze conventions ` +
    `tenues, une exception nommée.`,
);
