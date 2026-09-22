import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { Card } from "@registry/aikoz/card/card";
import { DeltaBadge } from "@registry/aikoz/delta-badge/delta-badge";

/**
 * Le thème sombre — les deux arbitrages qui restent, rendus et mesurés.
 *
 * Le recheck du 22/09/2026 a passé le thème sombre au crible des règles
 * mesurables de *Practical UI*. La plupart tiennent : la profondeur est
 * portée par la CLARTÉ des surfaces et non par des ombres (une ombre noire ne
 * se voit pas sur une page noire), la page n'est pas du noir pur, les cinq
 * plans sont distincts, et 23 des 28 rôles de couleur changent bien de valeur
 * entre les deux thèmes au lieu d'être repris tels quels.
 *
 * Deux points ne se tranchent pas à la mesure, parce que la mesure dit
 * qu'ils sont conformes et l'œil dit qu'ils fatiguent. Ils sont ici, rendus
 * côte à côte, avec leur chiffre — c'est la seule façon honnête de choisir.
 *
 * **Aucun des deux n'est un défaut de conformité.** Les deux tiennent WCAG et
 * APCA très largement. Ce qui est en jeu est le confort à l'écran, la nuit,
 * sur une page qu'on regarde une heure d'affilée.
 */
const meta = {
  title: "Design system/Décisions — thème sombre",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// ─── Mesure ───────────────────────────────────────────────────────────────────

function pixel(couleur: string): [number, number, number] {
  const cv = document.createElement("canvas").getContext("2d")!;
  cv.fillStyle = "#000000";
  cv.fillRect(0, 0, 1, 1);
  cv.fillStyle = couleur;
  cv.fillRect(0, 0, 1, 1);
  const d = cv.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

/** Luminance relative — celle de WCAG 2, celle qui dit « à quel point ça brille ». */
function luminance(couleur: string): number {
  const [r, g, b] = pixel(couleur).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function wcag(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function apca(avant: string, fond: string): number {
  const Ya = (c: [number, number, number]) => {
    const [r, g, b] = c.map((v) => Math.pow(v / 255, 2.4));
    const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    return Y < 0.022 ? Y + Math.pow(0.022 - Y, 1.414) : Y;
  };
  const [Yt, Yf] = [Ya(pixel(avant)), Ya(pixel(fond))];
  if (Math.abs(Yf - Yt) < 0.0005) return 0;
  if (Yf > Yt) {
    const S = (Math.pow(Yf, 0.56) - Math.pow(Yt, 0.57)) * 1.14;
    return Math.abs((S < 0.1 ? 0 : S - 0.027) * 100);
  }
  const S = (Math.pow(Yf, 0.65) - Math.pow(Yt, 0.62)) * 1.14;
  return Math.abs((S > -0.1 ? 0 : S + 0.027) * 100);
}

const resoudre = (v: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/**
 * Mesure au montage, ET à chaque fois que la racine change de thème ou de
 * marque.
 *
 * Un `useEffect` borné aux props ne suffit pas, et le premier jet s'y est
 * fait prendre : le thème est posé par le décorateur global de Storybook,
 * qui ENVELOPPE la story — son effet s'exécute donc APRÈS celui de la story.
 * La page mesurait en clair puis passait en sombre sans remesurer, et
 * affichait 8,1× là où le rapport réel vaut 15,3×. Un chiffre faux sur une
 * page de décision est pire que pas de chiffre : il a l'air d'une mesure.
 *
 * L'observateur règle la cause plutôt que l'ordre : peu importe QUI change la
 * racine et QUAND, la mesure suit.
 */
function useMesureSurRacine<T>(mesurer: () => T): T | null {
  const [valeur, setValeur] = useState<T | null>(null);
  useEffect(() => {
    const relire = () => setValeur(mesurer());
    relire();
    const obs = new MutationObserver(relire);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-brand", "data-register"],
    });
    return () => obs.disconnect();
    // `mesurer` est redéfinie à chaque rendu ; la borner ferait boucler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return valeur;
}

// ─── Présentation ─────────────────────────────────────────────────────────────

function Chiffre({
  valeur,
  unite,
  seuil,
  sens = "haut",
}: {
  valeur: number;
  unite?: string;
  seuil?: number;
  sens?: "haut" | "bas";
}) {
  const tenu =
    seuil === undefined ? null : sens === "haut" ? valeur >= seuil : valeur <= seuil;
  return (
    <span
      className="font-mono tabular-nums"
      style={{
        color:
          tenu === null
            ? "var(--foreground)"
            : tenu
              ? "var(--success)"
              : "var(--warning)",
      }}
    >
      {valeur.toLocaleString("fr-FR", { maximumFractionDigits: valeur < 10 ? 1 : 0 })}
      {unite}
    </span>
  );
}

function Ligne({ quoi, enfants }: { quoi: string; enfants: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{quoi}</span>
      <span>{enfants}</span>
    </div>
  );
}

// ─── Décision 1 — la carte héroïne ────────────────────────────────────────────

const HERO_OPTIONS = [
  {
    cle: "ancienne",
    titre: "A — l'ancienne inversion (retirée)",
    // La valeur littérale du palier retiré, `ink.50`. Elle n'est plus dans
    // aucun rôle : la citer en dur est le seul moyen de garder la
    // comparaison lisible une fois la décision prise.
    fond: "oklch(0.9591 0.0081 278.636)",
    texte: "oklch(0.1857 0.0133 271.174)",
    pour: "La hiérarchie sans ajouter de couleur : une seule carte prime, et elle le dit en retournant le thème.",
    contre:
      "Quinze fois la clarté des autres cartes. 120 000 px² de pleine clarté sur une page à 0,001 de luminance — le seul point de l'écran qui agresse un œil adapté au noir. Et la lueur de marque, posée sur du blanc, ne se voyait plus : les quatre marques rendaient la même carte.",
  },
  {
    cle: "allume",
    titre: "B — le panneau allumé (retenu)",
    fond: "var(--surface-hero)",
    texte: "var(--on-hero)",
    pour: "Un saut de clarté OKLCH de 0,223 à 0,470 — perceptuellement uniforme, donc bien plus visible que le rapport ne le laisse croire. La lueur se lit en TEINTE et non en clarté : les quatre marques redeviennent distinctes.",
    contre:
      "Deux fois et demie les autres cartes au lieu de quinze : sur une capture d'écran de présentation, la carte prime moins violemment.",
  },
  {
    cle: "plusFort",
    titre: "C — un cran plus haut (ink.400) — écarté",
    fond: "oklch(0.5856 0.0139 260.879)",
    texte: "var(--on-hero)",
    pour: "Quatre fois les autres cartes, au lieu de deux et demie.",
    contre:
      "Le texte blanc y tombe à APCA 74, sous le plancher de 75 d'un rôle de texte. Écarté deux fois : d'abord sur la mesure, puis à l'œil — les deux réglages ont été comparés sur le tableau de bord entier, et c'est B qui a été retenu.",
  },
] as const;

function DecisionHero() {
  const mesures = useMesureSurRacine(() => {
    const lCarte = luminance(resoudre("--card"));
    const m: Record<
      string,
      { clarte: number; rapport: number; apca: number; wcag: number }
    > = {};
    for (const o of HERO_OPTIONS) {
      const fond = resoudre(o.fond.replace("var(", "").replace(")", ""));
      const texte = resoudre(o.texte.replace("var(", "").replace(")", ""));
      if (!fond || !texte) continue;
      const l = luminance(fond);
      m[o.cle] = {
        clarte: l,
        rapport: (l + 0.05) / (lCarte + 0.05),
        apca: apca(texte, fond),
        wcag: wcag(texte, fond),
      };
    }
    return m;
  });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {HERO_OPTIONS.map((o) => {
        const m = mesures?.[o.cle];
        return (
          <Card key={o.cle} as="section" aria-label={o.titre} className="flex flex-col gap-3">
            <p className="m-0 text-sm font-semibold text-foreground">{o.titre}</p>

            {/* L'échantillon, à la taille et dans la forme de la vraie carte. */}
            <div
              className="rounded-[var(--radius)] p-4 min-h-[112px] flex flex-col justify-end"
              style={{ background: o.fond, color: o.texte }}
            >
              <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
                Satisfaction globale
              </span>
              <span className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums">4,2</span>
                <span className="text-sm opacity-70">/5</span>
                <DeltaBadge value={0.3} unit=" pt" size="sm" />
              </span>
            </div>

            {m && (
              <div className="flex flex-col gap-1 rounded-[var(--radius)] bg-muted p-3">
                <Ligne
                  quoi="clarté, rapport aux autres cartes"
                  enfants={
                    <Chiffre valeur={m.rapport} unite="×" seuil={6} sens="bas" />
                  }
                />
                <Ligne
                  quoi="APCA du texte porté"
                  enfants={<Chiffre valeur={m.apca} seuil={75} />}
                />
                <Ligne
                  quoi="contraste WCAG"
                  enfants={<Chiffre valeur={m.wcag} unite=":1" seuil={4.5} />}
                />
              </div>
            )}

            <p className="m-0 text-xs text-[var(--success)]">{o.pour}</p>
            <p className="m-0 text-xs text-muted-foreground">{o.contre}</p>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Décision 2 — la blancheur du texte ───────────────────────────────────────

const TEXTE_OPTIONS = [
  { cle: "blanc", titre: "A — blanc pur (aujourd'hui)", L: 1 },
  { cle: "n50", titre: "B — neutral.50", L: 0.97 },
  { cle: "recule", titre: "C — reculé à 0,93", L: 0.93 },
] as const;

function DecisionTexte() {
  const mesures = useMesureSurRacine(() => {
    const carte = resoudre("--card");
    const page = resoudre("--background");
    const m: Record<
      string,
      { apcaCarte: number; apcaPage: number; wcagCarte: number }
    > = {};
    for (const o of TEXTE_OPTIONS) {
      const c = `oklch(${o.L} 0.0062 274.32)`;
      m[o.cle] = {
        apcaCarte: apca(c, carte),
        apcaPage: apca(c, page),
        wcagCarte: wcag(c, carte),
      };
    }
    return m;
  });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {TEXTE_OPTIONS.map((o) => {
        const m = mesures?.[o.cle];
        const couleur = `oklch(${o.L} 0.0062 274.32)`;
        return (
          <Card key={o.cle} as="section" aria-label={o.titre} className="flex flex-col gap-3">
            <p className="m-0 text-sm font-semibold text-foreground">{o.titre}</p>

            <div className="rounded-[var(--radius)] bg-[var(--card)] p-4" style={{ color: couleur }}>
              <p className="m-0 text-base font-semibold">1 654 avis sur six mois</p>
              <p className="m-0 mt-2 text-sm">
                Le halo se voit sur une phrase entière, pas sur un mot. Regardez les
                jambages : en blanc pur, ils débordent légèrement sur le fond et le
                texte semble vibrer. C'est cet effet que les guides de thème sombre
                demandent d'éviter, et il ne se mesure pas — il se constate.
              </p>
            </div>

            {m && (
              <div className="flex flex-col gap-1 rounded-[var(--radius)] bg-muted p-3">
                <Ligne quoi="APCA sur carte" enfants={<Chiffre valeur={m.apcaCarte} seuil={75} />} />
                <Ligne quoi="APCA sur page" enfants={<Chiffre valeur={m.apcaPage} seuil={75} />} />
                <Ligne
                  quoi="WCAG sur carte"
                  enfants={<Chiffre valeur={m.wcagCarte} unite=":1" seuil={7} />}
                />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── La page ──────────────────────────────────────────────────────────────────

const MARQUES = [
  { cle: null, nom: "Aikoz" },
  { cle: "adp", nom: "ADP by Aikoz" },
  { cle: "extime", nom: "Extime" },
  { cle: "generali", nom: "Generali" },
] as const;

export const DeuxArbitrages: Story = {
  name: "Les deux arbitrages du thème sombre",
  // La page parle du thème sombre : elle s'ouvre en sombre. Le thème est un
  // GLOBAL Storybook, piloté par la barre d'outils — pas un état local.
  //
  // Un premier jet portait sa propre bascule. Elle ne marchait qu'au clic :
  // au montage, l'effet de la story pose `.dark`, puis celui du décorateur
  // global — qui l'enveloppe, donc qui s'exécute APRÈS — le retire pour
  // suivre la barre d'outils. La page s'ouvrait en clair en prétendant être
  // en sombre. Deux sources de vérité pour un même axe, c'est toujours la
  // deuxième qui gagne, et jamais celle qu'on croit.
  globals: { theme: "sombre" },
  parameters: {
    // Les échantillons sont là POUR montrer des contrastes qu'on discute :
    // les faire auditer par axe ferait échouer la page sur ce qu'elle expose.
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
    docs: {
      description: {
        story:
          "Le recheck du thème sombre contre *Practical UI* a laissé deux " +
          "points qui ne se tranchent pas à la mesure : elle dit qu'ils sont " +
          "conformes, l'œil dit qu'ils fatiguent.\n\n" +
          "**La carte héroïne**, en sombre, est la plus grande surface claire " +
          "de l'écran — quinze fois la clarté des autres cartes, dix-huit fois " +
          "celle de la page. C'est le principe même du contre-thème, et il " +
          "fonctionne bien en clair (la carte s'enfonce, c'est reposant). En " +
          "sombre il s'inverse : sur un œil adapté au noir, l'aplat de pleine " +
          "clarté est le seul point de la page qui éblouit.\n\n" +
          "**Le texte principal est du blanc pur** en sombre — et c'est la " +
          "seule couleur de texte du thème écrite en dur plutôt qu'en renvoi " +
          "à un palier de rampe. Tous ses voisins sont réglés au palier près " +
          "(`text-secondary` a été relevé de neutral.300 à neutral.200 pour " +
          "passer de 63,6 à 80,2 en APCA). Le reculer à 0,93 coûte 15 points " +
          "d'APCA sur un budget de 106 pour un plancher de 75 : il reste " +
          "seize points de marge.\n\n" +
          "Les trois options de chaque décision sont **rendues**, pas " +
          "décrites, et mesurées à l'affichage. Le sélecteur en haut change la " +
          "marque et le thème **sur la racine**, comme le ferait une vraie " +
          "application : la couche marque est écrite `:root[data-brand]`, on " +
          "ne peut donc pas en montrer deux dans la même page.",
      },
    },
  },
  render: function Page(_args, { globals }) {
    const [marque, setMarque] = useState<string | null>(null);
    const sombre = globals.theme === "sombre";

    // La MARQUE, elle, n'a pas de global : elle reste locale à la page. La
    // couche marque est écrite `:root[data-brand]`, on ne peut donc pas en
    // montrer deux dans la même page — d'où un sélecteur plutôt qu'une
    // grille des quatre.
    useEffect(() => {
      const r = document.documentElement;
      if (marque) r.setAttribute("data-brand", marque);
      else r.removeAttribute("data-brand");
      return () => r.removeAttribute("data-brand");
    }, [marque]);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {MARQUES.map((m) => (
            <button
              key={m.nom}
              type="button"
              onClick={() => setMarque(m.cle)}
              aria-pressed={marque === m.cle}
              className={
                "min-h-9 tactile:min-h-11 rounded-full px-4 text-sm transition-colors " +
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] " +
                (marque === m.cle
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground")
              }
            >
              {m.nom}
            </button>
          ))}
          <p className="m-0 ml-auto text-xs text-muted-foreground">
            Thème&nbsp;: <strong>{sombre ? "sombre" : "clair"}</strong> — il se
            change dans la barre d’outils Storybook, comme partout ailleurs.
          </p>
        </div>

        <section aria-labelledby="deco-hero" className="flex flex-col gap-3">
          <h2 id="deco-hero" className="m-0 text-lg font-semibold text-foreground">
            1. La carte héroïne — décidé le 22/09
          </h2>
          <p className="m-0 max-w-3xl text-sm text-muted-foreground">
            Mesuré sur le tableau de bord&nbsp;: en clair, la carte héroïne est
            dix-neuf fois plus sombre que les autres — elle s'enfonce, et c'est
            reposant. En sombre, la même règle la rendait quinze fois plus
            claire&nbsp;: le seul aplat de pleine clarté d'une page noire. Le
            contraste était symétrique&nbsp;; le confort ne l'était pas, parce
            que l'œil qui regarde une page sombre est adapté au noir.
          </p>
          <p className="m-0 max-w-3xl text-sm text-muted-foreground">
            <strong className="text-foreground">B est retenu</strong> — sur la
            mesure, puis à l'œil&nbsp;: les deux réglages ont été comparés sur le
            tableau de bord entier, et C a été trouvé trop clair. Le rôle
            s'appelle désormais <code className="font-mono text-xs">surface.hero</code>&nbsp;:
            il nomme ce qu'il fait — primer — et non le moyen par lequel il y
            arrivait. Le clair n'a pas bougé d'un pixel, et un garde-fou de
            build refuse toute valeur hors bande.
          </p>
          <DecisionHero />
        </section>

        <section aria-labelledby="deco-texte" className="flex flex-col gap-3">
          <h2 id="deco-texte" className="m-0 text-lg font-semibold text-foreground">
            2. Le texte principal doit-il rester blanc pur&nbsp;?
          </h2>
          <p className="m-0 max-w-3xl text-sm text-muted-foreground">
            C'est la seule couleur de texte du thème sombre écrite en dur —
            <code className="mx-1 font-mono text-xs">oklch(1 0 0)</code> — quand
            toutes ses voisines renvoient à un palier de rampe, réglé au point
            d'APCA près. Le blanc pur sur fond noir produit un halo autour des
            lettres&nbsp;; le reculer coûte peu et il reste beaucoup de marge.
          </p>
          <DecisionTexte />
        </section>
      </div>
    );
  },
};
