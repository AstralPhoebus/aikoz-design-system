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

/** Les paires, avec leur seuil et la raison du seuil. */
const PAIRES: Array<{ avant: string; fond: string; seuil: number; quoi: string }> = [
  // Texte : WCAG 1.4.3, 4,5:1.
  { avant: "--foreground", fond: "--card", seuil: 4.5, quoi: "texte sur carte" },
  { avant: "--foreground", fond: "--background", seuil: 4.5, quoi: "texte sur page" },
  { avant: "--muted-foreground", fond: "--card", seuil: 4.5, quoi: "texte atténué sur carte" },
  { avant: "--muted-foreground", fond: "--background", seuil: 4.5, quoi: "texte atténué sur page" },
  { avant: "--card-foreground", fond: "--card", seuil: 4.5, quoi: "texte de carte" },
  { avant: "--primary-foreground", fond: "--primary", seuil: 4.5, quoi: "texte sur action primaire" },
  { avant: "--accent-foreground", fond: "--accent", seuil: 4.5, quoi: "texte sur accent" },
  { avant: "--color-text-accent", fond: "--card", seuil: 4.5, quoi: "texte d'accent sur carte" },
  { avant: "--color-nav-on", fond: "--nav-surface", seuil: 4.5, quoi: "texte de navigation" },
  { avant: "--color-nav-on-muted", fond: "--nav-surface", seuil: 4.5, quoi: "texte de navigation atténué" },
  { avant: "--color-text-on-action-secondary", fond: "--color-surface-action-secondary", seuil: 4.5, quoi: "texte sur action secondaire" },
  { avant: "--success", fond: "--card", seuil: 4.5, quoi: "texte de succès" },
  { avant: "--destructive-text", fond: "--card", seuil: 4.5, quoi: "texte d'erreur" },
  { avant: "--warning", fond: "--card", seuil: 4.5, quoi: "texte d'avertissement" },
  { avant: "--neutral-text", fond: "--card", seuil: 4.5, quoi: "texte de variation neutre" },
  { avant: "--on-inverse", fond: "--surface-inverse", seuil: 4.5, quoi: "texte sur surface à contre-thème" },
  // Objets graphiques et composants : WCAG 1.4.11, 3:1.
  { avant: "--input", fond: "--card", seuil: 3.0, quoi: "bordure de champ sur carte" },
  { avant: "--input", fond: "--background", seuil: 3.0, quoi: "bordure de champ sur page" },
  { avant: "--ring", fond: "--background", seuil: 3.0, quoi: "anneau de focus sur page" },
  { avant: "--ring", fond: "--card", seuil: 3.0, quoi: "anneau de focus sur carte" },
  { avant: "--color-nav-accent", fond: "--nav-surface", seuil: 3.0, quoi: "trait de l'entrée courante" },
  ...[1, 2, 3, 4, 5, 6].map((i) => ({
    avant: `--chart-${i}`,
    fond: "--card",
    seuil: 3.0,
    quoi: `série ${i} sur carte`,
  })),
  { avant: "--success-fill-edge", fond: "--track", seuil: 3.0, quoi: "contour de jauge, niveau bon" },
  { avant: "--warning-fill-edge", fond: "--track", seuil: 3.0, quoi: "contour de jauge, niveau moyen" },
  { avant: "--error-fill-edge", fond: "--track", seuil: 3.0, quoi: "contour de jauge, niveau critique" },
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
  const H = document.documentElement;
  const lire = (n: string) => getComputedStyle(H).getPropertyValue(n).trim();

  const echecs: string[] = [];
  const absents: string[] = [];
  let mesurees = 0;

  for (const theme of ["clair", "sombre"] as const) {
    H.classList.toggle("dark", theme === "sombre");
    for (const marque of MARQUES) {
      if (marque) H.setAttribute("data-brand", marque);
      else H.removeAttribute("data-brand");
      for (const { avant, fond, seuil, quoi } of PAIRES) {
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
      }
    }
  }
  H.classList.remove("dark");
  H.removeAttribute("data-brand");
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
