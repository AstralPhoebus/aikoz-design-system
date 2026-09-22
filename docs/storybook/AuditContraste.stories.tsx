import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

/**
 * L'audit de contraste, exécuté par le navigateur et non par un calcul sur les
 * tokens.
 *
 * Toutes les mesures de ce projet ont été faites à la main, dans la console,
 * une décision après l'autre. Ça a tenu tant qu'il y avait quatre paires ;
 * aujourd'hui il y en a une centaine et **trois défauts sont passés dans la
 * même journée** :
 *
 * - l'accent d'ADP est tombé à 4,37:1 sous son texte quand `on-accent` a
 *   changé de cible — la paire n'a pas été remesurée après le changement ;
 * - les étoiles portaient le jaune d'avertissement ;
 * - la bordure du menu latéral pesait 3,5 fois la bordure standard.
 *
 * Aucun n'aurait survécu à un contrôle automatique. C'est pourquoi celui-ci
 * tourne en CI, avec les autres tests.
 *
 * **Pourquoi dans une story et pas dans un script Node.** Un calcul sur les
 * tokens ne voit pas ce que le navigateur compose : un `color-mix`, un
 * dégradé, un voile transparent. Le piège est documenté dans la page
 * Accessibilité — un audit token-à-token avait validé des paires qui, une fois
 * rendues, tombaient sous le seuil. Ici on lit `getComputedStyle` sur le vrai
 * document, dans les huit combinaisons marque × thème.
 */
const meta = {
  title: "Design system/Audit de contraste",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const MARQUES = [null, "adp", "extime", "generali"] as const;

/**
 * Les trois natures, et leur seuil perceptuel.
 *
 * APCA a été ajouté le 21/09/2026 parce que WCAG 2 est mauvais sur fond
 * sombre — c'est documenté, et ça nous est arrivé : cinq rôles de texte
 * tenaient 5,2 à 10,7:1 en sombre, donc « très bien », tout en valant 40 à 72
 * en APCA. Le rouge d'erreur plafonnait à 40 quand il vaut 85 en clair.
 *
 * Le seuil ne se déduit PAS du seuil WCAG. La source est explicite : 75 pour
 * du texte, **45 pour un ÉLÉMENT D'INTERFACE**, **15 pour un élément NON
 * TEXTUEL**. Un tracé de courbe est non textuel ; une bordure de champ, un
 * anneau de focus, un marqueur d'état sont des éléments d'interface — leur
 * forme identifie un contrôle.
 *
 * Le premier jet déduisait 45 du 3:1 de WCAG 1.4.11, et mettait donc les six
 * séries en dette pour un seuil qui ne les concerne pas. WCAG 1.4.11 confond
 * les deux catégories ; APCA ne les confond pas, et c'est ce qu'on est venu
 * chercher.
 */
const SEUIL_APCA = { texte: 75, element: 45, objet: 15 } as const;

/**
 * Les paires, avec leur seuil WCAG, leur nature, et leur dette éventuelle.
 *
 * `dette` est la valeur APCA la plus basse mesurée sur les huit combinaisons,
 * pour une paire qui tient WCAG 2 mais pas le seuil perceptuel. Les six qui
 * restent sont toutes la MÊME décision : l'accent et le primaire des marques.
 * Les remonter, c'est retoucher une couleur de charte, pas un token de chrome.
 *
 * Le cliquet marche dans les deux sens : une paire en dette qui EMPIRE
 * échoue, et une paire en dette qui PASSE échoue aussi, pour forcer à retirer
 * la ligne. La liste ne peut que rétrécir.
 */
const PAIRES: Array<{
  avant: string;
  fond: string;
  seuil: number;
  quoi: string;
  nature: keyof typeof SEUIL_APCA;
  dette?: number;
}> = [
  // Texte : WCAG 1.4.3, 4,5:1.
  { avant: "--foreground", fond: "--card", seuil: 4.5, nature: "texte", quoi: "texte sur carte" },
  { avant: "--foreground", fond: "--background", seuil: 4.5, nature: "texte", quoi: "texte sur page" },
  { avant: "--muted-foreground", fond: "--card", seuil: 4.5, nature: "texte", quoi: "texte atténué sur carte" },
  { avant: "--muted-foreground", fond: "--background", seuil: 4.5, nature: "texte", quoi: "texte atténué sur page" },
  { avant: "--card-foreground", fond: "--card", seuil: 4.5, nature: "texte", quoi: "texte de carte" },
  { avant: "--primary-foreground", fond: "--primary", seuil: 4.5, nature: "texte", quoi: "texte sur action primaire" },
  { avant: "--accent-foreground", fond: "--accent", seuil: 4.5, nature: "texte", quoi: "texte sur accent", dette: 37 /* idem — l'orange d'ADP, le vert d'Extime */ },
  { avant: "--color-text-accent", fond: "--card", seuil: 4.5, nature: "texte", quoi: "texte d'accent sur carte", dette: 35 /* l'accent employé comme texte sur la carte */ },
  { avant: "--color-nav-on", fond: "--nav-surface", seuil: 4.5, nature: "texte", quoi: "texte de navigation" },
  { avant: "--color-nav-on-muted", fond: "--nav-surface", seuil: 4.5, nature: "texte", quoi: "texte de navigation atténué" },
  { avant: "--color-text-on-action-secondary", fond: "--color-surface-action-secondary", seuil: 4.5, nature: "texte", quoi: "texte sur action secondaire" },
  { avant: "--success", fond: "--card", seuil: 4.5, nature: "texte", quoi: "texte de succès" },
  { avant: "--destructive-text", fond: "--card", seuil: 4.5, nature: "texte", quoi: "texte d'erreur" },
  { avant: "--warning", fond: "--card", seuil: 4.5, nature: "texte", quoi: "texte d'avertissement" },
  { avant: "--neutral-text", fond: "--card", seuil: 4.5, nature: "texte", quoi: "texte de variation neutre" },
  { avant: "--on-hero", fond: "--surface-hero", seuil: 4.5, nature: "texte", quoi: "texte sur la carte héroïne" },
  // Le dégradé va de `hero` à `hero-to` : le second arrêt porte le texte lui
  // aussi, et c'est LUI le plus exposé en sombre — il est plus foncé.
  { avant: "--on-hero", fond: "--surface-hero-to", seuil: 4.5, nature: "texte", quoi: "texte sur le second arrêt de la carte héroïne" },
  // Objets graphiques et composants : WCAG 1.4.11, 3:1.
  { avant: "--input", fond: "--card", seuil: 3.0, nature: "element", quoi: "bordure de champ sur carte" },
  { avant: "--input", fond: "--background", seuil: 3.0, nature: "element", quoi: "bordure de champ sur page" },
  { avant: "--ring", fond: "--background", seuil: 3.0, nature: "element", quoi: "anneau de focus sur page", dette: 37 /* l'anneau de focus EST l'accent de marque */ },
  { avant: "--ring", fond: "--card", seuil: 3.0, nature: "element", quoi: "anneau de focus sur carte", dette: 35 /* idem */ },
  { avant: "--color-nav-accent", fond: "--nav-surface", seuil: 3.0, nature: "element", quoi: "trait de l'entrée courante", dette: 36 /* le trait de l'entrée courante EST l'accent ; il est doublé par la graisse et par aria-current, il ne porte donc pas seul */ },
  ...[1, 2, 3, 4, 5, 6].map((i) => ({
    avant: `--chart-${i}`,
    fond: "--card",
    seuil: 3.0,
    // Non textuel : un tracé de courbe. C'est 15, pas 45 — le seuil des
    // éléments d'interface ne le concerne pas. Et il n'y a pas le choix :
    // mesuré, exiger 45 des six séries fait tomber leur séparation ΔE à
    // 0,056–0,086 selon la marque, sous le seuil de 0,10. Sur fond sombre on
    // peut avoir six séries bien SÉPARÉES ou six séries très CONTRASTÉES,
    // pas les deux — le vivier tombe de 31 à 13 teintes.
    nature: "objet" as const,
    quoi: `série ${i} sur carte`,
  })),
  { avant: "--success-fill-edge", fond: "--track", seuil: 3.0, nature: "element", quoi: "contour de jauge, niveau bon" },
  { avant: "--warning-fill-edge", fond: "--track", seuil: 3.0, nature: "element", quoi: "contour de jauge, niveau moyen" },
  { avant: "--error-fill-edge", fond: "--track", seuil: 3.0, nature: "element", quoi: "contour de jauge, niveau critique" },
];

function mesurer() {
  const cv = document.createElement("canvas").getContext("2d")!;
  const pixel = (couleur: string): [number, number, number] | null => {
    if (!couleur) return null;
    cv.fillStyle = "#000000";
    cv.fillRect(0, 0, 1, 1);
    cv.fillStyle = couleur;
    // Une valeur que le navigateur ne sait pas lire laisse `fillStyle` sur la
    // précédente : on le détecte plutôt que de mesurer du noir par erreur.
    if (cv.fillStyle === "#000000" && !/^#0{3,6}$|black/i.test(couleur)) return null;
    cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const lum = (c: [number, number, number]) => {
    const [r, g, b] = c.map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  // APCA (brouillon WCAG 3) — la formule de référence : Y est une luminance
  // en puissance 2,4, adoucie sous 0,022 pour éviter la singularité du noir.
  // Vérifiée sur les valeurs canoniques : noir sur blanc 106,04, blanc sur
  // noir −107,88, #888 sur blanc 63,06. Le signe dit la polarité (négatif =
  // texte clair sur fond sombre) ; on ne compare que la grandeur.
  const Ya = (c: [number, number, number]) => {
    const [r, g, b] = c.map((v) => Math.pow(v / 255, 2.4));
    const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    return Y < 0.022 ? Y + Math.pow(0.022 - Y, 1.414) : Y;
  };
  const apca = (txt: [number, number, number], fond: [number, number, number]) => {
    const [Yt, Yf] = [Ya(txt), Ya(fond)];
    if (Math.abs(Yf - Yt) < 0.0005) return 0;
    if (Yf > Yt) {
      const S = (Math.pow(Yf, 0.56) - Math.pow(Yt, 0.57)) * 1.14;
      return (S < 0.1 ? 0 : S - 0.027) * 100;
    }
    const S = (Math.pow(Yf, 0.65) - Math.pow(Yt, 0.62)) * 1.14;
    return (S > -0.1 ? 0 : S + 0.027) * 100;
  };

  const H = document.documentElement;
  const lire = (n: string) => getComputedStyle(H).getPropertyValue(n).trim();

  const echecs: string[] = [];
  const absents: string[] = [];
  // Pour le cliquet : la PIRE valeur d'une paire en dette sur les huit
  // combinaisons. Si elle tient partout, sa ligne doit disparaître.
  const pireEnDette = new Map<string, number>();
  let mesurees = 0;

  for (const theme of ["clair", "sombre"] as const) {
    H.classList.toggle("dark", theme === "sombre");
    for (const marque of MARQUES) {
      if (marque) H.setAttribute("data-brand", marque);
      else H.removeAttribute("data-brand");
      for (const { avant, fond, seuil, quoi, nature, dette } of PAIRES) {
        const a = pixel(lire(avant));
        const b = pixel(lire(fond));
        if (!a || !b) {
          absents.push(`${avant} ou ${fond}`);
          continue;
        }
        const [x, y] = [lum(a), lum(b)];
        const r = (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
        mesurees++;
        if (r < seuil) {
          echecs.push(
            `${marque ?? "aikoz"}/${theme} — ${quoi} : ${r.toFixed(2)}:1 ` +
              `pour un seuil de ${seuil} (${avant} sur ${fond})`,
          );
        }

        const cible = SEUIL_APCA[nature];
        const p = Math.abs(apca(a, b));
        const cle = `${quoi} (${avant} sur ${fond})`;
        if (dette === undefined) {
          if (p < cible) {
            echecs.push(
              `${marque ?? "aikoz"}/${theme} — ${quoi} : APCA ${p.toFixed(0)} pour un ` +
                `seuil de ${cible} (${nature}) — le ratio WCAG, lui, vaut ` +
                `${r.toFixed(2)}:1, c'est tout le problème.`,
            );
          }
        } else if (p < dette) {
          echecs.push(
            `${marque ?? "aikoz"}/${theme} — ${quoi} : APCA ${p.toFixed(0)}, en recul ` +
              `sur la dette reconnue de ${dette}. Une paire en dette a le droit de ` +
              `ne pas tenir son seuil, pas d'empirer.`,
          );
        } else {
          pireEnDette.set(cle, Math.min(pireEnDette.get(cle) ?? Infinity, p));
        }
      }
    }
  }
  H.classList.remove("dark");
  H.removeAttribute("data-brand");

  for (const { avant, fond, quoi, nature, dette } of PAIRES) {
    if (dette === undefined) continue;
    const pire = pireEnDette.get(`${quoi} (${avant} sur ${fond})`);
    if (pire !== undefined && pire >= SEUIL_APCA[nature]) {
      echecs.push(
        `${quoi} tient maintenant APCA ${pire.toFixed(0)} partout : retirer sa ` +
          `\`dette\` de PAIRES (${avant} sur ${fond}). La dette ne doit que rétrécir.`,
      );
    }
  }
  return { echecs, absents: [...new Set(absents)], mesurees };
}

export const ToutesLesPaires: Story = {
  name: "Toutes les paires, 4 marques × 2 thèmes",
  parameters: {
    docs: {
      description: {
        story:
          "Chaque paire de couleurs du système, mesurée **sur le rendu** dans " +
          "les huit combinaisons de marque et de thème. Le test échoue si une " +
          "seule tombe sous son seuil — 4,5:1 pour du texte (WCAG 1.4.3), " +
          "3:1 pour un objet graphique ou un composant (1.4.11).\n\n" +
          "**Et depuis le 21/09/2026, le contraste perceptuel (APCA) en plus** : " +
          "75 pour du texte, 45 pour un élément d'interface, 15 pour un objet " +
          "non textuel. WCAG 2 est mauvais sur fond sombre — cinq rôles de " +
          "texte tenaient 5,2 à 10,7:1 tout en valant 40 à 72 en APCA.\n\n" +
          "Il tourne en CI. Trois défauts de la même journée lui ont donné " +
          "naissance : l'accent d'ADP tombé à 4,37:1 après un changement de " +
          "`on-accent`, les étoiles sur le jaune d'avertissement, et la " +
          "bordure du menu latéral trois fois et demie trop forte.",
      },
    },
  },
  render: () => (
    <div className="max-w-xl text-sm">
      <p className="m-0 font-medium text-foreground">Audit de contraste</p>
      <p className="m-0 mt-2 text-muted-foreground">
        Le résultat est dans l’onglet <strong>Interactions</strong> : cette
        histoire ne rend rien, elle mesure. Un échec y nomme la marque, le
        thème, la paire et le ratio obtenu.
      </p>
    </div>
  ),
  play: async () => {
    const { echecs, absents, mesurees } = mesurer();
    // Un token absent est un échec à part entière : une paire qu'on croit
    // auditée et qui ne l'est pas est pire qu'une paire qu'on sait manquante.
    await expect(absents, `tokens introuvables : ${absents.join(", ")}`).toHaveLength(0);
    await expect(mesurees).toBeGreaterThan(200);
    await expect(echecs, `\n${echecs.join("\n")}\n`).toHaveLength(0);
  },
};
