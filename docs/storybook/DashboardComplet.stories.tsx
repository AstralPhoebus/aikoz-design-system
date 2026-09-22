import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
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
import { ViewTabs } from "@registry/aikoz/view-tabs/view-tabs";
import { DateRangePicker } from "@registry/aikoz/date-range-picker/date-range-picker";
import { Select } from "@registry/aikoz/select/select";
import { Table, type TableColumn, type TableSort } from "@registry/aikoz/table/table";
import { ScoreStars } from "@registry/aikoz/score-stars/score-stars";
import { CountBadge } from "@registry/aikoz/count-badge/count-badge";
import { GeoDrilldown, type ZoneGeo } from "@registry/aikoz/geo-drilldown/geo-drilldown";
import { FranceMap } from "@registry/aikoz/france-map/france-map";
import { ResponseKanban } from "@registry/aikoz/response-kanban/response-kanban";
import { EmptyState } from "@registry/aikoz/empty-state/empty-state";
import { Accordion } from "@registry/aikoz/accordion/accordion";
import { Switch } from "@registry/aikoz/switch/switch";
import { Textarea } from "@registry/aikoz/textarea/textarea";
import { Stepper } from "@registry/aikoz/stepper/stepper";
import { ProgressBar } from "@registry/aikoz/progress-bar/progress-bar";
import { Dialog } from "@registry/aikoz/dialog/dialog";
import { Tooltip, TooltipProvider } from "@registry/aikoz/tooltip/tooltip";
import { ToastProvider, useToast } from "@registry/aikoz/toast/toast";

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
  reglages:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6|M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15H4.5a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6V4.5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 19.4 11h.1a2 2 0 1 1 0 4h-.1z",
  etoile: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9z",
  horloge: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18|M12 7v5l3 2",
  bouclier: "M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z|M9.5 12l1.8 1.8 3.3-3.6",
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

// Le maillage territorial. Trois niveaux : France > région > département.
//
// Les `id` sont les codes INSEE — « 11 » l'Île-de-France, « 75 » Paris. Ce
// n'est pas une convention interne : c'est ce qui relie ce jeu à la
// géométrie de `FranceMap`, qui porte les mêmes codes. Un identifiant maison
// obligerait à maintenir une table de correspondance, et elle vieillirait.
const TERRITOIRES: ZoneGeo[] = [
  {
    id: "11",
    label: "Île-de-France",
    value: 1284,
    children: [
      { id: "75", label: "Paris", value: 612 },
      { id: "93", label: "Seine-Saint-Denis", value: 351 },
      { id: "95", label: "Val-d'Oise", value: 201 },
      { id: "94", label: "Val-de-Marne", value: 120 },
    ],
  },
  {
    id: "84",
    label: "Auvergne-Rhône-Alpes",
    value: 866,
    children: [
      { id: "69", label: "Rhône", value: 421 },
      { id: "38", label: "Isère", value: 244 },
      { id: "74", label: "Haute-Savoie", value: 201 },
    ],
  },
  {
    id: "93",
    label: "Provence-Alpes-Côte d'Azur",
    value: 604,
    children: [
      { id: "13", label: "Bouches-du-Rhône", value: 388 },
      { id: "06", label: "Alpes-Maritimes", value: 216 },
    ],
  },
  {
    id: "76",
    label: "Occitanie",
    value: 447,
    children: [
      { id: "31", label: "Haute-Garonne", value: 268 },
      { id: "34", label: "Hérault", value: 179 },
    ],
  },
  { id: "75", label: "Nouvelle-Aquitaine", value: 392 },
  { id: "32", label: "Hauts-de-France", value: 288 },
  { id: "53", label: "Bretagne", value: 175 },
  // L'outre-mer, au niveau région (codes INSEE 01 à 06). Sans valeurs, les
  // cartouches de la carte s'afficheraient vides — ce qui se lirait comme
  // « on ne collecte rien là-bas » alors qu'on n'a simplement rien saisi.
  { id: "04", label: "La Réunion", value: 88 },
  { id: "01", label: "Guadeloupe", value: 61 },
  { id: "02", label: "Martinique", value: 54 },
  { id: "03", label: "Guyane", value: 33 },
  { id: "06", label: "Mayotte", value: 19 },
];

/** Les mêmes valeurs, à plat par code INSEE : ce que la carte consomme. */
const VALEURS_REGION: Record<string, number> = Object.fromEntries(
  TERRITOIRES.flatMap((r) => [
    [r.id, r.value] as const,
    ...(r.children ?? []).map((d) => [d.id, d.value] as const),
  ])
);

interface LigneAvis {
  id: string;
  date: string;
  site: string;
  source: string;
  note: number;
  statut: "repondu" | "attente" | "signale";
  extrait: string;
}

const AVIS: LigneAvis[] = [
  { id: "a1", date: "08/09", site: "Terminal 2E", source: "Google", note: 2, statut: "attente", extrait: "Deux heures d'attente au guichet." },
  { id: "a2", date: "07/09", site: "Orly 4", source: "Trustpilot", note: 5, statut: "repondu", extrait: "Embarquement fluide, personnel disponible." },
  { id: "a3", date: "07/09", site: "Terminal 1", source: "Google", note: 3, statut: "attente", extrait: "Signalétique confuse vers les navettes." },
  { id: "a4", date: "06/09", site: "Orly 1-2", source: "Pages Jaunes", note: 1, statut: "signale", extrait: "Bagage endommagé, aucune réponse du service." },
  { id: "a5", date: "05/09", site: "Terminal 2E", source: "Google", note: 4, statut: "repondu", extrait: "Contrôle rapide, boutiques bien achalandées." },
  { id: "a6", date: "04/09", site: "Le Bourget", source: "Trustpilot", note: 4, statut: "repondu", extrait: "Accueil impeccable en aviation d'affaires." },
];

const STATUT: Record<LigneAvis["statut"], { label: string; tone: "success" | "warning" | "error" }> = {
  repondu: { label: "Répondu", tone: "success" },
  attente: { label: "En attente", tone: "warning" },
  signale: { label: "Signalé", tone: "error" },
};

// ─── Vue « Synthèse » ────────────────────────────────────────────────────────

function VueSynthese() {
  return (
    <div className="flex flex-col gap-5">
      <InfoBanner tone="info">
        Les réponses automatisées sont publiées à J+1 et modifiables jusque-là.
      </InfoBanner>

      {/* Une seule carte à contre-thème sur l'écran : c'est ce qui la rend
          hiérarchique. Deux feraient un damier. */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card surface="inverse" density="large" className="lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
            Satisfaction globale
          </span>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-5xl font-bold leading-none tracking-tight tabular-nums">4,2</span>
            <span className="text-lg font-medium opacity-80">/5</span>
            <span className="text-sm font-semibold tabular-nums">
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
    </div>
  );
}

// ─── Vue « Avis » ────────────────────────────────────────────────────────────

function VueAvis() {
  const [tri, setTri] = useState<TableSort>({ key: "date", direction: "desc" });
  const [source, setSource] = useState("toutes");
  const [chargement, setChargement] = useState(false);

  // Le squelette de chargement n'est pas décoratif : il est rendu par `Table`
  // lui-même (`loading`), donc l'en-tête et le nombre de colonnes restent en
  // place et la page ne saute pas. On le déclenche ici comme le ferait un
  // vrai rafraîchissement.
  const rafraichir = () => {
    setChargement(true);
    window.setTimeout(() => setChargement(false), 900);
  };

  const lignes = AVIS.filter((a) => source === "toutes" || a.source === source).sort((a, b) => {
    const sens = tri.direction === "asc" ? 1 : -1;
    if (tri.key === "note") return (a.note - b.note) * sens;
    return a.date.localeCompare(b.date) * sens;
  });

  const colonnes: TableColumn<LigneAvis>[] = [
    { key: "date", header: "Date", sortable: true, width: "5rem" },
    { key: "site", header: "Site" },
    {
      key: "source",
      header: "Source",
      cell: (r) => <Badge tone="neutral">{r.source}</Badge>,
    },
    {
      key: "note",
      header: "Note",
      sortable: true,
      numeric: true,
      cell: (r) => <ScoreStars value={r.note} size="sm" />,
    },
    {
      key: "statut",
      header: "Statut",
      cell: (r) => <Badge tone={STATUT[r.statut].tone}>{STATUT[r.statut].label}</Badge>,
    },
    { key: "extrait", header: "Extrait" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card as="section" aria-label="Avis collectés" className="gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="m-0 flex items-center gap-2 text-base font-semibold">
            Avis collectés
            <CountBadge value={AVIS.length} label={`${AVIS.length} avis sur la période`} />
          </h2>
          <div className="flex flex-wrap items-end gap-2">
            <Select
              label="Source"
              size="sm"
              value={source}
              onValueChange={setSource}
              options={[
                { value: "toutes", label: "Toutes les sources" },
                { value: "Google", label: "Google" },
                { value: "Trustpilot", label: "Trustpilot" },
                { value: "Pages Jaunes", label: "Pages Jaunes" },
              ]}
            />
            <Button variant="outline" size="sm" onClick={rafraichir}>
              Rafraîchir
            </Button>
          </div>
        </div>

        <Table
          caption="Avis collectés sur la période, triables par date et par note"
          captionHidden
          columns={colonnes}
          rows={lignes}
          getRowKey={(r) => r.id}
          rowHeaderKey="extrait"
          sort={tri}
          onSortChange={setTri}
          loading={chargement}
          loadingRows={6}
          density="compact"
          empty={
            <EmptyState
              title="Aucun avis pour ce filtre"
              description="Élargissez la période ou retirez le filtre de source."
              density="compact"
              action={
                <Button variant="outline" size="sm" onClick={() => setSource("toutes")}>
                  Toutes les sources
                </Button>
              }
            />
          }
        />
      </Card>

      <Card as="section" aria-label="File de réponse">
        <ResponseKanban
          automated={[
            {
              id: "r1",
              rating: 5,
              author: "Sofiane B.",
              date: "6 sept.",
              reply: "Merci beaucoup pour votre retour, nous le transmettons aux équipes du terminal.",
              scheduleLabel: "Publication demain, 9 h",
            },
            {
              id: "r2",
              rating: 4,
              author: "Nadia L.",
              date: "5 sept.",
              reply: "Merci d'avoir pris le temps de nous écrire, au plaisir de vous revoir.",
              scheduleLabel: "Publication demain, 9 h",
            },
          ]}
          offCharter={[
            {
              id: "o1",
              rating: 2,
              author: "Claire M.",
              date: "8 sept.",
              text: "Deux heures d'attente au guichet et personne pour renseigner.",
              reply: "Désolé pour ce désagrément, on fera mieux.",
              reasonLabel: "Ton trop familier",
            },
          ]}
          sensitive={[
            {
              id: "s1",
              rating: 1,
              author: "Marc T.",
              date: "6 sept.",
              text: "Bagage endommagé, aucune réponse du service après trois relances.",
              categoryLabel: "Litige bagage",
            },
          ]}
        />
      </Card>
    </div>
  );
}

// ─── Vue « Territoires » ─────────────────────────────────────────────────────

function VueTerritoires() {
  // La carte peut se restreindre à une région ; le classement, lui, garde son
  // propre forage. Deux vues de la même donnée, chacune avec sa question —
  // les lier de force ferait que cliquer sur la carte déplacerait le
  // classement sous les yeux de quelqu'un qui ne l'a pas demandé.
  const [regionActive, setRegionActive] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <InfoBanner tone="info">
        Deux vues de la même donnée, deux questions. La carte dit <strong>où</strong> —
        cliquez une région pour descendre à ses départements. Le classement dit
        <strong> combien</strong>, et il se lit sans être daltonien ni voyant.
      </InfoBanner>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card as="section" aria-label="Carte de la répartition">
          <h2 className="m-0 mb-3 text-base font-semibold">Où sont les avis</h2>
          <FranceMap
            valueLabel="Avis reçus"
            values={VALEURS_REGION}
            region={regionActive ?? undefined}
            selected={regionActive ?? undefined}
            onSelect={(code) => setRegionActive(code === regionActive ? null : code)}
            height={320}
          />
        </Card>

        <Card as="section" aria-label="Classement territorial">
          <h2 className="m-0 mb-3 text-base font-semibold">Combien, et qui devant qui</h2>
          <GeoDrilldown
            rootLabel="France"
            zones={TERRITOIRES}
            valueLabel="Avis reçus"
            height={280}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <KpiCard label="Régions couvertes" value={7} unit=" / 13" variant="raw" icon={<Ico d={ICO.sites} />} />
        <KpiCard label="Départements actifs" value={11} variant="trend" data={[6, 7, 8, 9, 10, 11]} trend={10} icon={<Ico d={ICO.sites} />} />
        <KpiCard
          label="Concentration Île-de-France"
          value={31}
          unit="%"
          variant="target"
          target={25}
          icon={<Ico d={ICO.synthese} />}
        />
      </div>
    </div>
  );
}

// ─── Vue « Alertes » ─────────────────────────────────────────────────────────

function VueAlertes() {
  return (
    <div className="flex flex-col gap-5">
      <Card as="section" aria-label="Alertes ouvertes">
        <EmptyState
          icon={<Ico d={ICO.bouclier} />}
          title="Aucune alerte ouverte"
          titleAs="h2"
          description="Les trois alertes de la semaine ont été traitées. Une nouvelle alerte se déclenche dès qu'un site passe sous 3,5 /5 deux jours de suite."
          action={<Button size="sm">Configurer les seuils</Button>}
          secondaryAction={
            <Button variant="ghost" size="sm">
              Voir l'historique
            </Button>
          }
        />
      </Card>

      <Card as="section" aria-label="Règles de déclenchement" className="gap-3">
        <h2 className="m-0 text-base font-semibold">Règles de déclenchement</h2>
        <Accordion
          headingLevel={3}
          type="multiple"
          defaultValue={["note"]}
          items={[
            {
              value: "note",
              title: "Chute de note",
              content:
                "Un site qui passe sous 3,5 /5 pendant deux jours consécutifs déclenche une alerte adressée au responsable du site et au pilote CX.",
            },
            {
              value: "volume",
              title: "Pic de volume",
              content:
                "Un volume d'avis supérieur à trois fois la médiane des quatre dernières semaines déclenche une alerte : c'est le signe d'un incident, pas d'une tendance.",
            },
            {
              value: "sensible",
              title: "Sujet sensible",
              content:
                "Litige, sécurité, discrimination, santé : ces avis ne reçoivent jamais de réponse automatique et remontent directement en file sensible.",
            },
          ]}
        />
      </Card>
    </div>
  );
}

// ─── Vue « Réglages » ────────────────────────────────────────────────────────

function VueReglages() {
  const toast = useToast();
  const [modele, setModele] = useState(
    "Merci pour votre retour. Nous transmettons votre message aux équipes du site concerné."
  );

  return (
    <div className="flex flex-col gap-5">
      <Card as="section" aria-label="Mise en service" className="gap-4">
        <h2 className="m-0 text-base font-semibold">Mise en service</h2>
        <Stepper
          label="Progression de la mise en service"
          current={2}
          steps={[
            { label: "Sources connectées" },
            { label: "Sites rattachés" },
            { label: "Modèles de réponse" },
            { label: "Publication" },
          ]}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card as="section" aria-label="Publication" className="gap-4">
          <h2 className="m-0 text-base font-semibold">Publication</h2>
          <Switch
            label="Réponses automatiques"
            description="Publiées à J+1, modifiables jusqu'à la publication."
            defaultChecked
          />
          <Switch
            label="Relire les avis 1 et 2 étoiles"
            description="Ces avis passent en file de relecture avant publication."
            defaultChecked
          />
          <Switch
            label="Notifier par courriel"
            description="Un récapitulatif quotidien à 8 h."
          />
          <Select
            label="Signature des réponses"
            defaultValue="service"
            options={[
              { value: "service", label: "Service Relation Client" },
              { value: "site", label: "Nom du site" },
              { value: "aucune", label: "Aucune signature" },
            ]}
          />
        </Card>

        <Card as="section" aria-label="Modèle de réponse" className="gap-4">
          <h2 className="m-0 text-base font-semibold">Modèle de réponse</h2>
          <Textarea
            label="Texte par défaut"
            description="Utilisé quand aucun modèle plus précis ne correspond."
            rows={5}
            value={modele}
            onChange={(e) => setModele(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => toast({ message: "Modèle de réponse enregistré.", tone: "success" })}
            >
              Enregistrer
            </Button>
            <Tooltip content="Le modèle est appliqué aux nouvelles réponses uniquement.">
              <Button variant="ghost" size="sm">
                Portée du modèle
              </Button>
            </Tooltip>
          </div>
        </Card>
      </div>

      <Card as="section" aria-label="Quota d'exports" className="gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-base font-semibold">Quota d'exports</h2>
          <span className="text-sm text-muted-foreground tabular-nums">34 / 50 ce mois-ci</span>
        </div>
        <ProgressBar value={34} max={50} label="Exports consommés ce mois-ci" valueText="34 sur 50" />
      </Card>
    </div>
  );
}

// ─── La page ─────────────────────────────────────────────────────────────────

function DashboardComplet() {
  const [marque, setMarque] = useState<string | null>(null);
  const [sombre, setSombre] = useState(false);
  const [vue, setVue] = useState("synthese");
  const [exportOuvert, setExportOuvert] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setSombre(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const racine = document.documentElement;
    if (marque) racine.setAttribute("data-brand", marque);
    else racine.removeAttribute("data-brand");
    return () => racine.removeAttribute("data-brand");
  }, [marque]);

  // Le fil d'Ariane suit la vue : un onglet qui change le contenu sans changer
  // le repère laisse l'utilisateur sans position.
  const TITRES: Record<string, string> = {
    synthese: "Synthèse",
    avis: "Avis",
    territoires: "Territoires",
    alertes: "Alertes",
    reglages: "Réglages",
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Panneau latéral ──────────────────────────────────────────── */}
      <SidebarNav
        label="Navigation principale"
        current={vue}
        className="hidden md:flex sticky top-0 h-screen"
        header={
          <div className="flex items-center px-2 py-1">
            {/* Pas de classe : le composant applique sa boîte par défaut, qui vaut
                pour toutes les marques. La régler ici marque par marque,
                c’est reprendre à la main ce que la règle fait déjà. */}
            <BrandMark />
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
        /* `href` ET `onClick` : `NavItem` est un `<a>` par doctrine — une
           entrée de navigation change de route. Un `onClick` seul sur une
           ancre sans `href` la sortirait de l'ordre de tabulation et
           n'obéirait plus à Entrée. La vue EST adressable par ancre, donc
           le lien pointe vraiment quelque part. */
        groups={[
          {
            label: "Pilotage",
            entries: [
              { id: "synthese", label: "Synthèse", href: "#synthese", onClick: () => setVue("synthese"), icon: <Ico d={ICO.synthese} /> },
              { id: "territoires", label: "Territoires", href: "#territoires", onClick: () => setVue("territoires"), icon: <Ico d={ICO.sites} /> },
              { id: "equipes", label: "Équipes", href: "#equipes", icon: <Ico d={ICO.equipes} /> },
            ],
          },
          {
            label: "Écoute",
            entries: [
              { id: "avis", label: "Avis", href: "#avis", onClick: () => setVue("avis"), icon: <Ico d={ICO.avis} />, count: 12, countLabel: "sans réponse" },
              { id: "alertes", label: "Alertes", href: "#alertes", onClick: () => setVue("alertes"), icon: <Ico d={ICO.alertes} /> },
            ],
          },
          {
            label: "Administration",
            entries: [
              { id: "exports", label: "Exports", href: "#exports", icon: <Ico d={ICO.exports} /> },
              { id: "reglages", label: "Réglages", href: "#reglages", onClick: () => setVue("reglages"), icon: <Ico d={ICO.reglages} /> },
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
                { label: TITRES[vue] },
              ]}
            />
            <h1 className="m-0 mt-0.5 text-lg font-semibold leading-tight">{TITRES[vue]}</h1>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Input
              label="Rechercher un site, un avis"
              labelHidden
              placeholder="Rechercher…"
              className="w-40"
            />

            <DateRangePicker
              label="Période analysée"
              labelHidden
              defaultValue={{ preset: "90j" }}
              presets={[
                { value: "7j", label: "7 derniers jours" },
                { value: "30j", label: "30 derniers jours" },
                { value: "90j", label: "90 derniers jours" },
                { value: "12m", label: "12 derniers mois" },
              ]}
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

            <Dialog
              open={exportOuvert}
              onOpenChange={setExportOuvert}
              trigger={<Button size="sm">Exporter</Button>}
              title="Exporter la période"
              description="Le fichier reprend les filtres actifs : période, source et site."
              footer={
                <Button
                  size="sm"
                  onClick={() => {
                    // La boîte se ferme avec l'action : laissée ouverte, elle
                    // laisse croire que l'export n'est pas parti, et le
                    // message de confirmation apparaît derrière elle.
                    setExportOuvert(false);
                    toast({ message: "Export lancé, vous recevrez un courriel.", tone: "success" });
                  }}
                >
                  Lancer l'export
                </Button>
              }
            >
              <div className="flex flex-col gap-3">
                <Select
                  label="Format"
                  defaultValue="xlsx"
                  options={[
                    { value: "xlsx", label: "Excel (.xlsx)" },
                    { value: "csv", label: "CSV (séparateur point-virgule)" },
                    { value: "pdf", label: "PDF — rapport mis en page" },
                  ]}
                />
                <Switch label="Inclure les verbatims" defaultChecked />
                <Switch label="Inclure les réponses publiées" />
              </div>
            </Dialog>
          </div>
        </header>

        <main className="flex flex-col gap-5 p-5">
          {/* Les onglets et le panneau latéral pilotent le MÊME état : deux
              chemins vers la même vue, jamais deux positions contradictoires.
              C'est ce qu'un utilisateur attend d'une navigation secondaire. */}
          <ViewTabs
            label="Vues du tableau de bord"
            value={vue}
            onValueChange={setVue}
            tabs={[
              { value: "synthese", label: "Synthèse", content: <VueSynthese /> },
              { value: "avis", label: "Avis", content: <VueAvis /> },
              { value: "territoires", label: "Territoires", content: <VueTerritoires /> },
              { value: "alertes", label: "Alertes", content: <VueAlertes /> },
              { value: "reglages", label: "Réglages", content: <VueReglages /> },
            ]}
          />
        </main>
      </div>
    </div>
  );
}

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
          "L'application entière, en cinq vues : **Synthèse** (indicateurs et " +
          "graphiques), **Avis** (tableau triable et file de réponse), " +
          "**Territoires** (forage France → région → département), " +
          "**Alertes** et **Réglages**. C'est le seul endroit où l'on voit si le " +
          "design system tient à l'échelle d'une application — les composants " +
          "isolés ne disent rien de la densité, de l'alignement des colonnes ni " +
          "de la cohabitation des surfaces.\n\n" +
          "Le panneau latéral et les onglets pilotent le même état : deux chemins " +
          "vers une vue, jamais deux positions contradictoires.\n\n" +
          "Les bascules en haut à droite changent **la marque** (`data-brand`) et " +
          "**le thème** (`.dark`) sur la racine, exactement comme le ferait une " +
          "application consommant le registre. Sous ADP et Extime, le chrome, les " +
          "séries de graphiques et la lueur de la carte héroïne suivent ; les " +
          "couleurs de données — positif, négatif, neutre — ne suivent pas, et " +
          "c'est voulu : une hausse doit se lire pareil d'une marque à l'autre.",
      },
    },
  },
  render: () => (
    <ToastProvider>
      <TooltipProvider>
        <DashboardComplet />
      </TooltipProvider>
    </ToastProvider>
  ),
};
