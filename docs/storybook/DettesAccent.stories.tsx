import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";

/**
 * Les cinq dettes de contraste perceptuel, rendues et mesurées sur la page.
 *
 * Elles ont toutes la même cause : l'accent de la marque. Ce sont donc des
 * couleurs de CHARTE, et ça ne se tranche pas dans une PR technique — mais ça
 * ne se tranche pas non plus sur un tableau de chiffres. Chaque cas est ici
 * côte à côte, tel quel et corrigé, avec sa mesure prise sur le rendu au
 * moment où vous le regardez.
 *
 * Le seuil rappelé à côté de chaque mesure est celui de la NATURE du rôle :
 * 75 pour du texte, 45 pour un élément d'interface.
 */
const meta = {
  title: "Design system/Décisions/Dettes d'accent",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// ─── Mesure ───────────────────────────────────────────────────────────────────

function apcaDe(avant: string, fond: string): number {
  const cv = document.createElement("canvas").getContext("2d")!;
  const px = (c: string): [number, number, number] => {
    cv.fillStyle = "#000000";
    cv.fillRect(0, 0, 1, 1);
    cv.fillStyle = c;
    cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const Ya = (c: [number, number, number]) => {
    const [r, g, b] = c.map((v) => Math.pow(v / 255, 2.4));
    const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    return Y < 0.022 ? Y + Math.pow(0.022 - Y, 1.414) : Y;
  };
  const [Yt, Yf] = [Ya(px(avant)), Ya(px(fond))];
  if (Math.abs(Yf - Yt) < 0.0005) return 0;
  if (Yf > Yt) {
    const S = (Math.pow(Yf, 0.56) - Math.pow(Yt, 0.57)) * 1.14;
    return Math.abs((S < 0.1 ? 0 : S - 0.027) * 100);
  }
  const S = (Math.pow(Yf, 0.65) - Math.pow(Yt, 0.62)) * 1.14;
  return Math.abs((S > -0.1 ? 0 : S + 0.027) * 100);
}

/**
 * Lit une couleur telle qu'elle est résolue MAINTENANT, sur la racine.
 *
 * Premier jet : une sonde `<div data-brand="adp" class="dark">` posée dans la
 * page, pour afficher les quatre marques côte à côte. Elle ne mesurait rien —
 * les quatre cartes affichaient la même valeur et le même APCA.
 *
 * La cause est dans l'architecture, et elle est volontaire : la couche marque
 * est écrite `:root[data-brand="adp"]`, pas `[data-brand="adp"]`. Ce `:root`
 * est ce qui lui donne assez de spécificité pour passer devant `.dark` — sans
 * lui, le changement de marque ne redéfinissait rien, un défaut qu'on a déjà
 * corrigé une fois. Conséquence : une marque ne s'applique QUE sur la racine,
 * et on ne peut pas en afficher deux dans la même page.
 *
 * D'où le sélecteur en haut de cette page. Elle montre une combinaison à la
 * fois, comme le ferait une vraie application.
 */
function resoudre(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

// ─── Les cinq cas ─────────────────────────────────────────────────────────────

interface Cas {
  titre: string;
  quoi: string;
  seuil: number;
  /** Où ça coince, en clair. */
  ou: string;
  /** La variable de premier plan et son fond, telles qu'elles sont aujourd'hui. */
  avant: string;
  fond: string;
  /** La proposition : le même rôle, un autre palier. */
  propose: string;
  pourquoi: string;
  /** Les combinaisons où la paire ne tient pas, telles que mesurées. */
  fautives: string[];
  /** Comment ça se voit : du texte, un trait, un aplat. */
  forme: "texte" | "trait" | "aplat";
}

const CAS: Cas[] = [
  {
    titre: "L'accent employé comme TEXTE",
    quoi: "--color-text-accent sur --card",
    seuil: 75,
    ou: "les quatre marques en sombre, et ADP en clair (73, à deux points)",
    avant: "--color-text-accent",
    fond: "--card",
    propose: "un palier plus clair de la même rampe d'accent",
    pourquoi:
      "Depuis que la carte sombre est neutre, un accent de milieu de rampe n'a plus " +
      "assez d'écart avec elle. C'est exactement ce qu'on a corrigé pour les couleurs " +
      "de statut ; l'accent est resté en arrière.",
    fautives: ["aikoz/sombre", "adp/sombre", "extime/sombre", "generali/sombre", "adp/clair"],
    forme: "texte",
  },
  {
    titre: "Le texte POSÉ SUR l'accent",
    quoi: "--accent-foreground sur --accent",
    seuil: 75,
    ou: "ADP (38) et Extime (51), dans les deux thèmes",
    avant: "--accent-foreground",
    fond: "--accent",
    propose: "assombrir l'aplat, ou changer la couleur du texte posé dessus",
    pourquoi:
      "L'orange d'ADP et l'or d'Extime sont des teintes de clarté moyenne : ni le " +
      "blanc ni l'encre ne s'y détachent vraiment. C'est le cas d'école décrit dans " +
      "Practical UI — une couleur de marque claire ne peut pas porter de texte telle " +
      "quelle.",
    fautives: ["adp/clair", "adp/sombre", "extime/clair", "extime/sombre"],
    forme: "aplat",
  },
  {
    titre: "L'anneau de focus",
    quoi: "--ring sur --card et --background",
    seuil: 45,
    ou: "ADP en sombre seulement (36 et 38)",
    avant: "--ring",
    fond: "--card",
    propose: "un palier plus clair de l'accent d'ADP en sombre",
    pourquoi:
      "Un anneau de focus est ce qui dit à quelqu'un qui navigue au clavier où il se " +
      "trouve. C'est la dette la plus gênante des cinq, même si c'est la plus discrète " +
      "à l'œil.",
    fautives: ["adp/sombre"],
    forme: "trait",
  },
  {
    titre: "Le trait de l'entrée courante",
    quoi: "--color-nav-accent sur --nav-surface",
    seuil: 45,
    ou: "ADP en sombre seulement (37)",
    avant: "--color-nav-accent",
    fond: "--nav-surface",
    propose: "le même palier que l'anneau de focus — c'est la même couleur",
    pourquoi:
      "Moins grave : l'entrée courante est déjà signalée par la graisse du libellé et " +
      "par `aria-current`. Le trait n'est pas seul à porter l'information, ce qui est " +
      "précisément la règle qu'on s'impose partout.",
    fautives: ["adp/sombre"],
    forme: "trait",
  },
];

// ─── Rendu ────────────────────────────────────────────────────────────────────

function Echantillon({ cas, cle }: { cas: Cas; cle: string }) {
  const [mesure, setMesure] = useState<number | null>(null);

  useEffect(() => {
    // Après la bascule de racine : le style calculé n'est à jour qu'au cadre
    // suivant.
    const id = requestAnimationFrame(() => {
      const avant = resoudre(cas.avant);
      const fond = resoudre(cas.fond);
      if (avant && fond) setMesure(apcaDe(avant, fond));
    });
    return () => cancelAnimationFrame(id);
  }, [cas, cle]);

  const tient = mesure !== null && mesure >= cas.seuil;

  return (
    <div>
      <div className="rounded-[var(--radius)] border border-border bg-card p-4">
        {cas.forme === "texte" && (
          <p className="m-0 text-sm" style={{ color: `var(${cas.avant})` }}>
            Taux de réponse en hausse de 12 %
          </p>
        )}
        {cas.forme === "aplat" && (
          <span
            className="inline-flex min-h-9 items-center rounded-full px-4 text-sm font-medium"
            style={{ background: `var(${cas.fond})`, color: `var(${cas.avant})` }}
          >
            Voir le détail
          </span>
        )}
        {cas.forme === "trait" && (
          <span className="inline-flex min-h-9 items-center rounded-[var(--radius)] px-3 text-sm"
            style={{ boxShadow: `0 0 0 3px var(${cas.avant})` }}>
            Élément au focus
          </span>
        )}

        <p className="m-0 mt-3 text-xs tabular-nums">
          <strong className={tient ? "text-[var(--success)]" : "text-[var(--destructive-text)]"}>
            APCA {mesure === null ? "…" : Math.round(mesure)}
          </strong>
          <span className="text-muted-foreground"> / seuil {cas.seuil}</span>
        </p>
      </div>
    </div>
  );
}

const MARQUES = [
  { id: null, nom: "Aikoz" },
  { id: "adp", nom: "ADP" },
  { id: "extime", nom: "Extime" },
  { id: "generali", nom: "Generali" },
] as const;

export const LesCinqDettes: Story = {
  name: "Les cinq dettes, rendues et mesurées",
  parameters: {
    // La règle de contraste est désactivée ICI, et seulement ici : cette page
    // rend délibérément des paires qui ne tiennent pas leur seuil — c'est son
    // objet même. La laisser active reviendrait à demander à l'audit de
    // valider ce qu'on lui montre comme défectueux. Toutes les autres règles
    // d'axe restent actives, et l'audit du système tourne sans exception sur
    // « Audit de contraste ».
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
    docs: {
      description: {
        story:
          "Chaque cas est rendu **dans son contexte** et mesuré au moment où " +
          "vous le regardez. Les chiffres ne viennent pas d'un tableau écrit à " +
          "la main : ils sont lus sur ces éléments-là.\n\n" +
          "Le sélecteur change la marque et le thème **sur la racine**, comme " +
          "le ferait une vraie application. Une seule combinaison à la fois, " +
          "et c'est une contrainte, pas un choix : la couche marque est écrite " +
          "`:root[data-brand=\"adp\"]`, et ce `:root` est ce qui lui donne " +
          "assez de spécificité pour passer devant `.dark`. Deux marques ne " +
          "peuvent pas cohabiter dans une page.\n\n" +
          "Chaque cas indique **où** il ne tient pas. Basculez sur ces " +
          "combinaisons-là : ailleurs, la mesure passe le seuil et s'affiche " +
          "en vert.\n\n" +
          "Toutes ces dettes ont la même cause : **l'accent de la marque**. Ce " +
          "sont des couleurs de charte — un arbitrage, pas un défaut à " +
          "corriger d'office.",
      },
    },
  },
  render: () => {
    const [marque, setMarque] = useState<string | null>(null);
    const [sombre, setSombre] = useState(false);

    useEffect(() => {
      const r = document.documentElement;
      if (marque) r.setAttribute("data-brand", marque);
      else r.removeAttribute("data-brand");
      r.classList.toggle("dark", sombre);
      return () => {
        r.removeAttribute("data-brand");
        r.classList.remove("dark");
      };
    }, [marque, sombre]);

    const cle = `${marque ?? "aikoz"}-${sombre}`;
    const ici = `${marque ?? "aikoz"}/${sombre ? "sombre" : "clair"}`;

    return (
      <div className="min-h-screen bg-background p-6">
        <h1 className="m-0 text-xl font-semibold text-foreground">
          Cinq dettes, une seule cause
        </h1>
        <p className="m-0 mt-2 max-w-[70ch] text-sm text-muted-foreground">
          Toutes portent sur l’accent de la marque. Chaque cas est rendu
          ci-dessous et mesuré sur la page. Le seuil rappelé est celui de la
          nature du rôle : 75 pour du texte, 45 pour un élément d’interface.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Marque appliquée"
            className="inline-flex items-center gap-0.5 rounded-full bg-muted p-0.5"
          >
            {MARQUES.map((m) => (
              <button
                key={m.nom}
                type="button"
                role="radio"
                aria-checked={marque === m.id}
                onClick={() => setMarque(m.id)}
                className={[
                  "min-h-8 rounded-full px-3 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  marque === m.id
                    ? "bg-card text-foreground [box-shadow:var(--role-elevation-card)]"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {m.nom}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={sombre}
            onClick={() => setSombre((v) => !v)}
            className="min-h-8 rounded-full border border-border bg-card px-3 text-xs text-foreground"
          >
            {sombre ? "Thème sombre" : "Thème clair"}
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-10">
          {CAS.map((cas) => {
            const concerne = cas.fautives.includes(ici);
            return (
              <section key={cas.quoi}>
                <h2 className="m-0 flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
                  {cas.titre}
                  {concerne && (
                    <span className="rounded-full bg-[color-mix(in_oklch,var(--destructive-text),transparent_84%)] px-2 py-0.5 text-2xs font-medium text-[var(--destructive-text)]">
                      ne tient pas ici
                    </span>
                  )}
                </h2>
                <p className="m-0 mt-1 font-mono text-xs text-muted-foreground">{cas.quoi}</p>
                <p className="m-0 mt-2 max-w-[70ch] text-sm text-muted-foreground">
                  <strong className="text-foreground">Où :</strong> {cas.ou}. {cas.pourquoi}
                </p>
                <p className="m-0 mt-1 max-w-[70ch] text-sm text-muted-foreground">
                  <strong className="text-foreground">Piste :</strong> {cas.propose}.
                </p>
                <div className="mt-3 max-w-md">
                  <Echantillon cas={cas} cle={cle} />
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  },
};
