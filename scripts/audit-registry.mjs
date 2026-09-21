/**
 * Le registry doit décrire TOUT le registry, et chaque entrée doit être
 * installable.
 *
 * Deux angles morts, trouvés le 21/09/2026 en cherchant pourquoi
 * `geo-drilldown` renvoyait 404 sur le site publié :
 *
 *  1. Quatre composants existaient dans `registry/aikoz/` sans figurer dans
 *     `registry.json` — `brand-glow`, `brand-mark`, `geo-drilldown`, `toast`.
 *     Ils étaient rendus dans Storybook, testés, documentés… et impossibles à
 *     installer. Le garde-fou existant compare `public/r/` aux sources : il ne
 *     voit rien d'une entrée qui n'a jamais existé.
 *
 *  2. Une entrée peut omettre un fichier dont son composant a besoin.
 *     `npx shadcn add` réussit, et l'application casse à la compilation chez
 *     le consommateur — c'est-à-dire chez Louis, pas ici.
 *
 * Ce contrôle ne regarde donc pas ce qui est écrit, mais ce qui est RÉSOLU :
 * il suit les imports `@registry/aikoz/...` de chaque composant et vérifie que
 * chaque fichier atteint est livré par l'entrée.
 */
import fs from 'node:fs';
import path from 'node:path';

const RACINE = 'registry/aikoz';
const reg = JSON.parse(fs.readFileSync('registry.json', 'utf8'));
const parNom = new Map(reg.items.map((i) => [i.name, i]));
const echecs = [];

// ── 1. Tout composant présent sur le disque est une entrée ──────────────────
const dossiers = fs
  .readdirSync(RACINE, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'lib')
  .map((d) => d.name);

for (const nom of dossiers) {
  if (!fs.existsSync(path.join(RACINE, nom, `${nom}.tsx`))) continue;
  if (!parNom.has(nom)) {
    echecs.push(
      `« ${nom} » existe dans ${RACINE}/ mais n'est pas une entrée de registry.json — ` +
        `il est rendu, testé, documenté, et personne ne peut l'installer.`,
    );
  }
}

// ── 2. Chaque entrée livre tous les fichiers qu'elle atteint ────────────────
const importRegistry = /from "@registry\/aikoz\/([^"]+)"/g;

/** Résout un import `@registry/aikoz/x/y` vers un chemin de fichier réel. */
function chemin(imp) {
  const candidats = [`${RACINE}/${imp}.tsx`, `${RACINE}/${imp}.ts`];
  return candidats.find((c) => fs.existsSync(c)) ?? null;
}

/** Le fichier principal d'une entrée du registry. */
const principal = (nom) => `${RACINE}/${nom}/${nom}.tsx`;

for (const item of reg.items) {
  const livres = new Set((item.files ?? []).map((f) => f.path));

  // Une dépendance peut être satisfaite de deux façons : le fichier est LIVRÉ
  // dans l'entrée, ou l'entrée la déclare en `registryDependencies` et
  // `shadcn add` l'installe à part. Les deux conventions cohabitent dans ce
  // registry, l'audit doit donc accepter les deux — sinon il crie sur les
  // quatre entrées qui font déjà les choses proprement.
  const deleguees = new Set();
  for (const dep of item.registryDependencies ?? []) {
    if (!parNom.has(dep)) {
      echecs.push(`« ${item.name} » dépend de « ${dep} », qui n'est pas une entrée du registry.`);
      continue;
    }
    deleguees.add(principal(dep));
    // La délégation est transitive : `shadcn add` installe la dépendance avec
    // SES propres dépendances.
    const pile = [dep];
    while (pile.length) {
      const d = pile.pop();
      for (const f of parNom.get(d).files ?? []) deleguees.add(f.path);
      for (const sous of parNom.get(d).registryDependencies ?? []) {
        if (parNom.has(sous) && !deleguees.has(principal(sous))) {
          deleguees.add(principal(sous));
          pile.push(sous);
        }
      }
    }
  }
  const fourni = (chemin) => livres.has(chemin) || deleguees.has(chemin);

  for (const f of livres) {
    if (!fs.existsSync(f)) {
      echecs.push(`« ${item.name} » déclare ${f}, qui n'existe pas.`);
    }
  }

  // Parcours transitif depuis les fichiers de l'entrée.
  const vus = new Set();
  const pile = [...livres].filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
  while (pile.length) {
    const fichier = pile.pop();
    if (vus.has(fichier) || !fs.existsSync(fichier)) continue;
    vus.add(fichier);
    const txt = fs.readFileSync(fichier, 'utf8');
    for (const m of txt.matchAll(importRegistry)) {
      const cible = chemin(m[1]);
      if (!cible) {
        echecs.push(`« ${item.name} » : ${fichier} importe @registry/aikoz/${m[1]}, introuvable.`);
        continue;
      }
      if (!fourni(cible)) {
        echecs.push(
          `« ${item.name} » ne livre pas ${cible}, dont ${path.basename(fichier)} a besoin — ` +
            `« shadcn add ${item.name} » réussirait et la compilation casserait chez le consommateur.`,
        );
      }
      // On ne descend pas dans une dépendance déléguée : c'est SON entrée
      // qui répond de ses fichiers, et elle est auditée pour son compte.
      if (livres.has(cible)) pile.push(cible);
    }
  }

  // `cn` vient de lib/utils.ts, qui importe clsx et tailwind-merge : les deux
  // paquets n'apparaissent dans aucun fichier de composant, et manquent donc
  // aux dépendances si on ne les ajoute pas exprès.
  if (livres.has(`${RACINE}/lib/utils.ts`)) {
    for (const pkg of ['clsx', 'tailwind-merge']) {
      if (!(item.dependencies ?? []).includes(pkg)) {
        echecs.push(`« ${item.name} » livre lib/utils.ts sans déclarer la dépendance ${pkg}.`);
      }
    }
  }
}

if (echecs.length) {
  console.error("\naudit registry ÉCHOUÉ — le registry ne décrit pas ce qu'il contient :");
  for (const e of echecs) console.error('  ✗ ' + e);
  process.exit(1);
}

console.log(
  `audit registry OK — ${reg.items.length} entrées, ${dossiers.length} composants sur disque, ` +
    'imports résolus et livrés.',
);
