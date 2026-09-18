import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { SiteNav } from "@registry/aikoz/site-nav/site-nav";
import { KpiCard } from "@registry/aikoz/kpi-card/kpi-card";
import { BarChart } from "@registry/aikoz/bar-chart/bar-chart";
import { DonutChart } from "@registry/aikoz/donut-chart/donut-chart";
import { VerbatimCard } from "@registry/aikoz/verbatim-card/verbatim-card";
import { Card } from "@registry/aikoz/card/card";
import { Badge } from "@registry/aikoz/badge/badge";
import { Button } from "@registry/aikoz/button/button";
import { InfoBanner } from "@registry/aikoz/info-banner/info-banner";
import { Switch } from "@registry/aikoz/switch/switch";
import { ProgressBar } from "@registry/aikoz/progress-bar/progress-bar";
import { ViewTabs } from "@registry/aikoz/view-tabs/view-tabs";

const MARQUES = [
  { id: null, nom: "Aikoz" },
  { id: "adp", nom: "ADP by Aikoz" },
  { id: "extime", nom: "Extime" },
  { id: "generali", nom: "Generali" },
] as const;

const TRIMESTRES = [
  { trim: "T1", google: 820, trustpilot: 180, pj: 62 },
  { trim: "T2", google: 940, trustpilot: 268, pj: 71 },
  { trim: "T3", google: 1120, trustpilot: 302, pj: 58 },
  { trim: "T4", google: 1210, trustpilot: 340, pj: 84 },
];

function Contenu() {
  return (
    <div className="flex flex-col gap-6">
      <span className="sr-only">Vue de synthèse</span>
    </div>
  );
}

function Page() {
  return (
    <div className="min-h-[70vh] bg-background text-foreground">
      <SiteNav
        links={[
          { label: "Tableau de bord", href: "#tableau-de-bord", current: true },
          { label: "Avis", href: "#avis" },
          { label: "Réseaux", href: "#reseaux" },
        ]}
        skipTo={null}
        actions={<Button size="sm">Exporter</Button>}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <InfoBanner tone="info">
          Les réponses automatisées sont publiées à J+1 et modifiables jusque-là.
        </InfoBanner>

        <ViewTabs
          label="Vues du tableau de bord"
          defaultValue="synthese"
          tabs={[
            { value: "synthese", label: "Synthèse", content: <Contenu /> },
            { value: "reseaux", label: "Réseaux", content: <Contenu /> },
            { value: "verbatims", label: "Verbatims", content: <Contenu /> },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Note moyenne" value={4.2} variant="rating" />
          <KpiCard label="Taux de réponse" value={87} unit="%" variant="target" target={90} />
          <KpiCard label="Avis reçus" value={1654} variant="raw" />
        </div>

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
              height={220}
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
              height={220}
            />
          </Card>
        </div>

        <Card as="section" aria-label="Derniers avis" className="gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">Derniers avis</h2>
            <Badge tone="warning" icon="!">3 sans réponse</Badge>
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
            date="9 sept."
            source="Trustpilot"
            text="Personnel très disponible, tout s'est bien passé."
            tags={["Réactivité"]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button>Répondre</Button>
            <Button variant="secondary">Programmer</Button>
            <Button variant="outline">Ignorer</Button>
          </div>
        </Card>

        <Card as="section" aria-label="Réglages" className="gap-4">
          <h2 className="m-0 text-base font-semibold">Automatisation</h2>
          <Switch label="Réponse automatique" description="Publie sans validation manuelle." defaultChecked />
          <ProgressBar value={87} max={100} label="Couverture des réponses" />
        </Card>
      </main>
    </div>
  );
}

function Vitrine() {
  const [marque, setMarque] = useState<string | null>(null);
  useEffect(() => {
    const H = document.documentElement;
    const avant = H.getAttribute("data-brand");
    marque ? H.setAttribute("data-brand", marque) : H.removeAttribute("data-brand");
    return () => {
      avant ? H.setAttribute("data-brand", avant) : H.removeAttribute("data-brand");
    };
  }, [marque]);

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Marque" className="flex flex-wrap gap-2">
        {MARQUES.map((m) => (
          <Button
            key={m.nom}
            size="sm"
            variant={marque === m.id ? "default" : "outline"}
            aria-pressed={marque === m.id}
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
  title: "Design system/Vitrine marque",
  component: Vitrine,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Vitrine>;
export default meta;
type Story = StoryObj<typeof meta>;

export const UnePageEntiere: Story = {
  name: "Une page entière, trois marques",
  parameters: {
    docs: {
      description: {
        story:
          "**Une barre de navigation ne suffit pas à juger une marque.** Elle est trop " +
          "fine pour y voir trois couleurs cohabiter, et raisonner depuis elle mène à " +
          "conclure qu'une couleur de marque ne sert à rien — alors que c'est la " +
          "surface qui est trop petite.\n\n" +
          "Cette page assemble ce qu'un tableau de bord montre réellement : navigation, " +
          "indicateurs, deux graphiques, des avis, des réglages. Bascule la marque, puis " +
          "le thème et le registre en barre d'outils. C'est là que se voit ce qu'une " +
          "couleur d'accent aurait à faire — ou qu'elle n'a rien à faire.",
      },
    },
  },
};
