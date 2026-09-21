import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "storybook/preview-api";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { SidebarNav } from "@registry/aikoz/sidebar-nav/sidebar-nav";
import { BrandMark } from "@registry/aikoz/brand-mark/brand-mark";
import { Avatar } from "@registry/aikoz/avatar/avatar";
import { Breadcrumb } from "@registry/aikoz/breadcrumb/breadcrumb";
import { Input } from "@registry/aikoz/input/input";
import { Button } from "@registry/aikoz/button/button";
import { Card } from "@registry/aikoz/card/card";
import { KpiCard } from "@registry/aikoz/kpi-card/kpi-card";
import { LineChart } from "@registry/aikoz/line-chart/line-chart";
import { BarChart } from "@registry/aikoz/bar-chart/bar-chart";
import { DonutChart } from "@registry/aikoz/donut-chart/donut-chart";
import { Leaderboard } from "@registry/aikoz/leaderboard/leaderboard";
import { VerbatimCard } from "@registry/aikoz/verbatim-card/verbatim-card";
import { InfoBanner } from "@registry/aikoz/info-banner/info-banner";
import { Badge } from "@registry/aikoz/badge/badge";

// ─── Icônes ──────────────────────────────────────────────────────────────────
// Filaires, en `currentColor`, décoratives : le libellé porte le sens.

const trait = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" {...trait}>
    {d.split("|").map((p) => (
      <path key={p} d={p} />
    ))}
  </svg>
);
const ICO = {
  synthese: "M3 3v18h18|M7 15l4-4 3 3 5-6",
  avis: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  sites: "M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z|M12 10.5h.01",
  equipes: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6|M22 21v-2a4 4 0 0 0-3-3.87",
  alertes: "M12 9v4|M12 17h.01|M10.3 3.8 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z",
  exports: "M12 3v12|M8 11l4 4 4-4|M4 21h16",
  reglages: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6|M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15H4.5a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6V4.5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 19.4 11h.1a2 2 0 1 1 0 4h-.1z",
  etoile: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9z",
  horloge: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18|M12 7v5l3 2",
  loupe: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16|M21 21l-4.3-4.3",
};

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

const SERIES = [
  { key: "google", label: "Google" },
  { key: "trustpilot", label: "Trustpilot" },
  { key: "pj", label: "Pages Jaunes" },
];

// ─── Histoire ────────────────────────────────────────────────────────────────

const meta = {
  title: "Design system/Dashboard complet",
  parameters: {
    layout: "fullscreen",
    // La page occupe l'écran : la contrainte de largeur des autres histoires
    // n'a pas de sens ici, on juge justement l'occupation de l'espace.
    docs: { story: { inline: false, height: "900px" } },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const ApercuGeneral: Story = {
  name: "Aperçu général — toutes marques, clair et sombre",
  parameters: {
    docs: {
      description: {
        story:
          "L'écran complet : panneau latéral, en-tête, rangée d'indicateurs, " +
          "quatre graphiques, classement et verbatims. C'est le seul endroit où " +
          "l'on voit si le design system tient à l'échelle d'une application — " +
          "les composants isolés ne disent rien de la densité, de l'alignement " +
          "des colonnes ni de la cohabitation des surfaces.\n\n" +
          "Les deux bascules en haut à droite changent **la marque** " +
          "(`data-brand`) et **le thème** (`.dark`) sur la racine, exactement " +
          "comme le ferait une application consommant le registre. Sous ADP et " +
          "Extime, le chrome, les séries de graphiques et la lueur de la carte " +
          "héroïne suivent ; les couleurs de données — positif, négatif, " +
          "neutre — ne suivent pas, et c'est voulu : une hausse doit se lire " +
          "pareil d'une marque à l'autre.",
      },
    },
  },
  render: () => {
    const [marque, setMarque] = useState<string | null>(null);
    const [sombre, setSombre] = useState(false);

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
      <div className="flex min-h-screen bg-background text-foreground">
        {/* ── Panneau latéral ──────────────────────────────────────────── */}
        <SidebarNav
          label="Navigation principale"
          current="synthese"
          className="hidden md:flex sticky top-0 h-screen"
          header={
            <div className="flex items-center px-2 py-1">
              <BrandMark className="h-6" />
            </div>
          }
          footer={
            <div className="flex items-center gap-2 px-2 py-1">
              <Avatar name="Alice Maréchaud" size="sm" decorative />
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-medium">Alice Maréchaud</span>
                <span className="text-xs text-muted-foreground">Responsable CX</span>
              </span>
            </div>
          }
          groups={[
            {
              label: "Pilotage",
              entries: [
                { id: "synthese", label: "Synthèse", href: "#synthese", icon: <Ico d={ICO.synthese} /> },
                { id: "sites", label: "Sites", href: "#sites", icon: <Ico d={ICO.sites} /> },
                { id: "equipes", label: "Équipes", href: "#equipes", icon: <Ico d={ICO.equipes} /> },
              ],
            },
            {
              label: "Écoute",
              entries: [
                { id: "avis", label: "Avis", href: "#avis", icon: <Ico d={ICO.avis} />, count: 12, countLabel: "sans réponse" },
                { id: "alertes", label: "Alertes", href: "#alertes", icon: <Ico d={ICO.alertes} />, count: 3 },
              ],
            },
            {
              label: "Administration",
              entries: [
                { id: "exports", label: "Exports", href: "#exports", icon: <Ico d={ICO.exports} /> },
                { id: "reglages", label: "Réglages", href: "#reglages", icon: <Ico d={ICO.reglages} /> },
              ],
            },
          ]}
        />

        {/* ── Colonne principale ───────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* En-tête collant : le fil d'Ariane et les bascules restent
              atteignables quand la page défile — sur un tableau de bord long,
              revenir en haut pour changer de marque est une friction. */}
          <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
            <div className="min-w-0">
              <Breadcrumb
                items={[
                  { label: "Accueil", href: "#accueil" },
                  { label: "Écoute client", href: "#ecoute" },
                  { label: "Synthèse" },
                ]}
              />
              <h1 className="m-0 mt-0.5 text-lg font-semibold leading-tight">Synthèse</h1>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Input
                label="Rechercher un site, un avis"
                labelHidden
                placeholder="Rechercher…"
                className="w-48"
              />

              <div
                role="radiogroup"
                aria-label="Marque appliquée"
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
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]",
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
                  "inline-flex size-8 items-center justify-center rounded-full",
                  "border border-border bg-card text-muted-foreground",
                  "transition-colors hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]",
                ].join(" ")}
              >
                <span aria-hidden="true" className="text-sm leading-none">
                  {sombre ? "☀" : "☾"}
                </span>
              </button>

              <Button size="sm">Exporter</Button>
            </div>
          </header>

          <main className="flex flex-col gap-5 p-5">
            <InfoBanner tone="info">
              Les réponses automatisées sont publiées à J+1 et modifiables jusque-là.
            </InfoBanner>

            {/* Une seule carte à contre-thème sur l'écran : c'est ce qui la
                rend hiérarchique. Deux feraient un damier. */}
            <div className="grid gap-4 lg:grid-cols-4">
              <Card surface="inverse" density="large" className="lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
                  Satisfaction globale
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-5xl font-bold leading-none tracking-tight">4,2</span>
                  <span className="text-lg font-medium opacity-80">/5</span>
                  <span className="text-sm font-semibold">
                    <span aria-hidden="true">↑ </span>+0,3 pt
                    <span className="sr-only"> en hausse</span>
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <span className="max-w-[30ch] text-sm opacity-80">
                    1 654 avis sur les six derniers mois, tous canaux confondus.
                  </span>
                  <div aria-hidden="true" className="h-12 w-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[3.7, 3.8, 3.9, 3.9, 4.1, 4.2].map((v, i) => ({ v, i }))}
                        margin={{ top: 4, right: 4, left: 2, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="heroComplet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--on-inverse)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--on-inverse)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="var(--on-inverse)"
                          strokeWidth={2}
                          fill="url(#heroComplet)"
                          dot={false}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              <KpiCard
                label="Taux de réponse"
                value={87}
                unit="%"
                variant="target"
                target={90}
                icon={<Ico d={ICO.avis} />}
              />
              <KpiCard
                label="Avis reçus"
                value={526}
                variant="trend"
                data={[361, 394, 389, 447, 436, 526]}
                trend={20.6}
                icon={<Ico d={ICO.synthese} />}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <KpiCard label="Note moyenne" value={4.2} variant="rating" icon={<Ico d={ICO.etoile} />} trend={0.3} trendUnit=" pt" />
              <KpiCard label="Délai de réponse" value={6} unit="h" variant="raw" icon={<Ico d={ICO.horloge} />} trend={-14} trendTone="positive" />
            </div>

            <Card as="section" aria-label="Évolution mensuelle">
              <LineChart
                caption="Avis reçus par source, sur six mois"
                data={MOIS}
                xKey="mois"
                xLabel="Mois"
                yLabel="Avis reçus"
                series={SERIES}
                height={240}
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
                  series={SERIES}
                  height={230}
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
                  height={230}
                />
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card as="section" aria-label="Classement des sites">
                <Leaderboard caption="Note moyenne par site" entries={SITES} valueLabel="Note" />
              </Card>

              <Card as="section" aria-label="Derniers avis" className="gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="m-0 text-base font-semibold">Derniers avis</h2>
                  <Badge tone="warning" icon="!">
                    12 sans réponse
                  </Badge>
                </div>
                <VerbatimCard
                  rating={2}
                  author="Claire M."
                  date="8 sept."
                  source="Google"
                  text="Deux heures d'attente au guichet et personne pour renseigner."
                  tags={["Attente", "Accueil"]}
                />
                <VerbatimCard
                  rating={5}
                  author="Sofiane B."
                  date="6 sept."
                  source="Trustpilot"
                  text="Personnel très disponible au comptoir, embarquement fluide."
                  tags={["Accueil"]}
                />
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  },
};
