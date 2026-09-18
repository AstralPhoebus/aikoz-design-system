import type { Meta, StoryObj } from "@storybook/react-vite";
// Hooks de Storybook, pas ceux de React : dans une fonction `render` les deux
// ne se mélangent pas.
import { useEffect, useState } from "storybook/preview-api";
import { SiteNav } from "@registry/aikoz/site-nav/site-nav";
import { KpiCard } from "@registry/aikoz/kpi-card/kpi-card";
import { LineChart } from "@registry/aikoz/line-chart/line-chart";
import { BarChart } from "@registry/aikoz/bar-chart/bar-chart";
import { DonutChart } from "@registry/aikoz/donut-chart/donut-chart";
import { Leaderboard } from "@registry/aikoz/leaderboard/leaderboard";
import { Card } from "@registry/aikoz/card/card";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Button } from "@registry/aikoz/button/button";
import { ViewTabs } from "@registry/aikoz/view-tabs/view-tabs";

// ─── Icônes de démonstration ─────────────────────────────────────────────────
// Filaires, en `currentColor`, 16px : le format que prennent les références.
// Elles nomment la ligne, elles ne la qualifient pas — d'où `aria-hidden` et
// l'absence de titre.

const trait = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const IconeEtoile = (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trait}>
    <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9z" />
  </svg>
);
const IconeReponse = (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trait}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconeVolume = (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trait}>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-4 3 3 5-6" />
  </svg>
);
const IconeDelai = (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trait}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

// ─── Données ─────────────────────────────────────────────────────────────────

const MOIS = [
  { mois: "Avr.", google: 268, trustpilot: 74, pj: 19 },
  { mois: "Mai", google: 291, trustpilot: 81, pj: 22 },
  { mois: "Juin", google: 275, trustpilot: 96, pj: 18 },
  { mois: "Juil.", google: 334, trustpilot: 88, pj: 25 },
  { mois: "Août", google: 312, trustpilot: 103, pj: 21 },
  { mois: "Sept.", google: 381, trustpilot: 118, pj: 27 },
];

const TRIMESTRES = [
  { trim: "T1", google: 820, trustpilot: 180, pj: 62 },
  { trim: "T2", google: 940, trustpilot: 268, pj: 71 },
  { trim: "T3", google: 1120, trustpilot: 302, pj: 58 },
  { trim: "T4", google: 1210, trustpilot: 340, pj: 84 },
];

const SITES = [
  { id: "cdg2", rank: 1, name: "Terminal 2E", code: "CDG", value: "4,6 /5", delta: 3.1 },
  { id: "ory4", rank: 2, name: "Orly 4", code: "ORY", value: "4,4 /5", delta: 1.8 },
  { id: "cdg1", rank: 3, name: "Terminal 1", code: "CDG", value: "4,1 /5", delta: -0.4 },
  { id: "ory1", rank: 4, name: "Orly 1-2", code: "ORY", value: "3,8 /5", delta: -2.2, highlighted: true },
  { id: "lbg", rank: 5, name: "Le Bourget", code: "LBG", value: "3,5 /5", delta: -1.1 },
];

const MARQUES = [
  { id: null, nom: "Aikoz" },
  { id: "adp", nom: "ADP by Aikoz" },
  { id: "extime", nom: "Extime" },
  { id: "generali", nom: "Generali" },
] as const;

// ─── Page ────────────────────────────────────────────────────────────────────

function Vide() {
  return <div className="sr-only">Vue de synthèse</div>;
}

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav
        links={[
          { label: "Tableau de bord", href: "#tableau-de-bord", current: true },
          { label: "Avis", href: "#avis" },
          { label: "Réseaux", href: "#reseaux" },
          { label: "Sites", href: "#sites" },
        ]}
        skipTo={null}
        actions={<Button size="sm">Exporter</Button>}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
        <ViewTabs
          label="Vues du tableau de bord"
          defaultValue="synthese"
          tabs={[
            { value: "synthese", label: "Synthèse", content: <Vide /> },
            { value: "sources", label: "Sources", content: <Vide /> },
            { value: "sites", label: "Sites", content: <Vide /> },
          ]}
        />

        {/* La rangée d'indicateurs. La PREMIÈRE carte est à contre-thème :
            c'est l'indicateur dont tout le reste dépend, et sur une grille où
            quatre cartes blanches se valent, rien ne le disait. Une seule sur
            l'écran — deux ne hiérarchiseraient plus rien.

            Les trois autres restent des `KpiCard` standard : l'étoile, la
            barre à objectif et la courbe de tendance, pour qu'on voie les
            variantes s'aligner sur la même grille. */}
        <div className="grid gap-4 lg:grid-cols-4">
          <Card surface="inverse" density="large" className="lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
              Satisfaction globale
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-5xl font-bold leading-none tracking-tight">4,2</span>
              <span className="text-lg font-medium opacity-80">/5</span>
              {/* Pas de `DeltaBadge` ici : ses tons sont calibrés sur la carte
                  standard, et son vert de succès tombe à 1,4:1 sur ce fond.
                  La variation se dit donc en toutes lettres, dans la couleur
                  de texte de la surface. */}
              <span className="text-sm font-semibold">
                <span aria-hidden="true">↑ </span>+0,3 pt
                <span className="sr-only"> en hausse</span>
              </span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <span className="max-w-[28ch] text-sm opacity-80">
                1 654 avis sur les six derniers mois, tous canaux confondus.
              </span>
              <div aria-hidden="true" className="h-12 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[3.7, 3.8, 3.9, 3.9, 4.1, 4.2].map((v, i) => ({ v, i }))}
                    margin={{ top: 4, right: 4, left: 2, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="heroAire" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--on-inverse)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--on-inverse)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {/* La série emprunte la couleur de TEXTE de la surface,
                        pas `--chart-1` : celle-ci est calibrée contre la carte
                        standard et se perdrait sur ce fond. */}
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="var(--on-inverse)"
                      strokeWidth={2}
                      fill="url(#heroAire)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <KpiCard label="Taux de réponse" value={87} unit="%" variant="target" target={90} icon={IconeReponse} />
          <KpiCard
            label="Avis reçus"
            value={526}
            variant="trend"
            data={[361, 394, 389, 447, 436, 526]}
            trend={20.6}
            icon={IconeVolume}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard label="Note moyenne" value={4.2} variant="rating" icon={IconeEtoile} trend={0.3} trendUnit=" pt" />
          <KpiCard label="Délai de réponse" value={6} unit="h" variant="raw" icon={IconeDelai} trend={-14} trendTone="positive" />
        </div>

        <Card as="section" aria-label="Évolution mensuelle">
          <LineChart
            caption="Avis reçus par source, sur six mois"
            data={MOIS}
            xKey="mois"
            xLabel="Mois"
            yLabel="Avis reçus"
            series={[
              { key: "google", label: "Google" },
              { key: "trustpilot", label: "Trustpilot" },
              { key: "pj", label: "Pages Jaunes" },
            ]}
            height={260}
          />
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card as="section" aria-label="Volume par trimestre">
            <BarChart
              caption="Avis reçus par source et par trimestre"
              data={TRIMESTRES}
              xKey="trim"
              xLabel="Trimestre"
              yLabel="Avis reçus"
              layout="stacked"
              series={[
                { key: "google", label: "Google" },
                { key: "trustpilot", label: "Trustpilot" },
                { key: "pj", label: "Pages Jaunes" },
              ]}
              height={240}
            />
          </Card>

          <Card as="section" aria-label="Répartition par source">
            <DonutChart
              caption="Répartition des avis par source"
              parts={[
                { key: "google", label: "Google", value: 1240 },
                { key: "trustpilot", label: "Trustpilot", value: 318 },
                { key: "pj", label: "Pages Jaunes", value: 96 },
              ]}
              centerValue="1 654"
              centerLabel="avis"
              height={240}
            />
          </Card>
        </div>

        <Card as="section" aria-label="Classement des sites">
          <Leaderboard caption="Note moyenne par site" entries={SITES} valueLabel="Note" />
        </Card>
      </main>
    </div>
  );
}

// ─── Histoire ────────────────────────────────────────────────────────────────

const meta = {
  title: "Design system/Tableau de bord",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const UnePageEntiere: Story = {
  name: "Une page entière, quatre graphiques",
  parameters: {
    docs: {
      description: {
        story:
          "Un composant isolé ne dit pas si le design system tient. Cette page " +
          "met les quatre variantes de `KpiCard`, une courbe, un histogramme " +
          "empilé, un anneau et un classement sur la même grille, sous la même " +
          "marque — c'est là qu'on voit si les couleurs de série se répètent " +
          "d'un graphique à l'autre, si les cartes s'alignent, et si la marque " +
          "change vraiment autre chose que la couleur du bouton.\n\n" +
          "Les boutons en haut basculent `data-brand` sur la racine : c'est le " +
          "même mécanisme que celui qu'un consommateur du registre applique.",
      },
    },
  },
  render: () => {
    const [marque, setMarque] = useState<string | null>(null);
    // Le bouton bascule la CLASSE, il ne passe pas par `setGlobals`.
    // J'ai essayé l'inverse pour garder la barre d'outils synchronisée : sans
    // le manager — iframe seule, Storybook publié sur Pages — le canal
    // n'existe pas et le bouton ne faisait rien. Un bouton qui ne marche que
    // dans un contexte sur deux ne marche pas.
    //
    // Conséquence assumée : la barre d'outils et le bouton peuvent diverger.
    // Le dernier geste l'emporte, et l'état lu sur la classe garde le libellé
    // juste dans tous les cas.
    const [sombre, setSombre] = useState(false);
    // L'état se relit APRÈS le montage : le décorateur de `preview.tsx` pose
    // la classe dans son propre effet, donc à l'initialisation du `useState`
    // elle n'est pas encore là et le libellé démarrait à l'envers quand on
    // ouvrait l'histoire déjà en sombre.
    useEffect(() => {
      setSombre(document.documentElement.classList.contains("dark"));
    }, []);

    useEffect(() => {
      const racine = document.documentElement;
      if (marque) racine.setAttribute("data-brand", marque);
      else racine.removeAttribute("data-brand");
      return () => racine.removeAttribute("data-brand");
    }, [marque]);

    return (
      <div>
        {/* La barre de démonstration n'est PAS un composant du design system :
          c'est le chassis de l'histoire. Elle emprunte donc les tokens sans
          rien inventer — piste `--muted`, pastille active sur `--card` avec
          l'ombre de carte, exactement le contrôle segmenté des références.
          Une rangée de boutons pleins mettait quatre appels à l'action au
          même rang, alors qu'un seul est actif à la fois. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Marque
        </span>

        <div
          role="radiogroup"
          aria-label="Marque appliquée à la page"
          className="inline-flex items-center gap-0.5 rounded-full bg-muted p-0.5"
        >
          {MARQUES.map((m) => {
            const actif = marque === m.id;
            return (
              <button
                key={m.nom}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setMarque(m.id)}
                className={[
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  actif
                    ? "bg-card text-foreground [box-shadow:var(--role-elevation-card)]"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {m.nom}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-pressed={sombre}
          aria-label={sombre ? "Passer en thème clair" : "Passer en thème sombre"}
          onClick={() => {
            const suivant = !sombre;
            document.documentElement.classList.toggle("dark", suivant);
            setSombre(suivant);
          }}
          className={[
            "ml-auto inline-flex size-9 items-center justify-center rounded-full",
            "border border-border bg-card text-muted-foreground",
            "transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          ].join(" ")}
        >
          <span aria-hidden="true" className="text-base leading-none">
            {sombre ? "\u2600" : "\u263E"}
          </span>
        </button>
      </div>

        <Page />
      </div>
    );
  },
};
