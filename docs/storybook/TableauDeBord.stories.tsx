import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { SiteNav } from "@registry/aikoz/site-nav/site-nav";
import { KpiCard } from "@registry/aikoz/kpi-card/kpi-card";
import { LineChart } from "@registry/aikoz/line-chart/line-chart";
import { BarChart } from "@registry/aikoz/bar-chart/bar-chart";
import { DonutChart } from "@registry/aikoz/donut-chart/donut-chart";
import { Leaderboard } from "@registry/aikoz/leaderboard/leaderboard";
import { Card } from "@registry/aikoz/card/card";
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

        {/* La rangée d'indicateurs : les quatre variantes de KpiCard côte à
            côte, pour qu'on voie d'un coup l'étoile, la barre à objectif, la
            courbe de tendance et la valeur nue s'aligner sur la même grille. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Note moyenne" value={4.2} variant="rating" icon={IconeEtoile} trend={0.3} trendUnit=" pt" />
          <KpiCard label="Taux de réponse" value={87} unit="%" variant="target" target={90} icon={IconeReponse} />
          <KpiCard
            label="Avis reçus"
            value={526}
            variant="trend"
            data={[361, 394, 389, 447, 436, 526]}
            trend={20.6}
            icon={IconeVolume}
          />
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

function Vitrine() {
  const [marque, setMarque] = useState<string | null>(null);

  useEffect(() => {
    const racine = document.documentElement;
    if (marque) racine.setAttribute("data-brand", marque);
    else racine.removeAttribute("data-brand");
    return () => racine.removeAttribute("data-brand");
  }, [marque]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-3">
        {MARQUES.map((m) => (
          <Button
            key={m.nom}
            size="sm"
            variant={marque === m.id ? "default" : "secondary"}
            onClick={() => setMarque(m.id)}
          >
            {m.nom}
          </Button>
        ))}
      </div>
      <Page />
    </div>
  );
}

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
  render: () => <Vitrine />,
};
