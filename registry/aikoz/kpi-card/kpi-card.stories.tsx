import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { KpiCard } from "./kpi-card";

const meta = {
  title: "Données/KpiCard",
  component: KpiCard,
  tags: ["autodocs"],
  args: { label: "Taux de réponse", value: 87, unit: "%", variant: "target", target: 90 },
} satisfies Meta<typeof KpiCard>;

// Les cartes isolées se regardent à une largeur réaliste de colonne de tableau
// de bord ; les grilles, elles, ont besoin de la pleine largeur. La contrainte
// vit donc sur les histoires, pas sur le meta — sinon elle s'ajoute à celle des
// grilles et les chiffres se chevauchent.
const carteSeule: Story["decorators"] = [(S) => <div className="w-72"><S /></div>];
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { name: "Par défaut", decorators: carteSeule };

export const DeuxAxesIndependants: Story = {
  name: "Deux axes : variant × density",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap gap-4">
      <KpiCard className="w-52" label="Note moyenne" value={4.2} max={5} variant="rating" />
      <KpiCard className="w-52" label="Taux de réponse" value={87} unit="%" variant="target" target={90} />
      <KpiCard className="w-52" label="Avis traités" value={312} variant="trend" data={[4, 6, 5, 8, 7, 9]} trend={18} />
      <KpiCard className="w-52" label="Délai de réponse" value={6} unit="h" variant="raw" />
    </div>
  ),
};

export const LeNiveauVientDeLObjectif: Story = {
  name: "Le niveau vient de l'objectif, pas du maximum",
  decorators: carteSeule,
  args: { label: "Taux de réponse", value: 87, unit: "%", variant: "target", target: 90 },
  parameters: {
    docs: {
      description: {
        story:
          "87 sur un objectif de 90, c'est 97 % de l'objectif — donc « bon ». Rapporté à " +
          "un maximum de 100, ce serait « à surveiller ». Le niveau se calcule sur " +
          "`value/target`, jamais sur `value/max` : sinon un objectif atteint à 97 % " +
          "s'afficherait en alerte.",
      },
    },
  },
};

export const AlignementDansUneGrille: Story = {
  name: "Les valeurs s'alignent d'une carte à l'autre",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "Le libellé réserve **deux lignes** (`min-h-8`), qu'il en occupe une ou deux. " +
          "Sans cette réserve, un « Taux de réponse -48h » qui passe à la ligne décale " +
          "vers le bas tout ce qu'il porte, et les chiffres d'une même grille ne " +
          "s'alignent plus — l'œil compare alors des hauteurs au lieu de comparer des " +
          "valeurs.\n\n" +
          "Le coût est assumé : une grille où tous les libellés tiennent sur une ligne " +
          "porte 16px de vide sous chacun. C'est le prix d'un alignement qui ne dépend " +
          "pas du texte qu'on y met.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <KpiCard label="Nombre d'avis" value={1654} variant="raw" />
      <KpiCard label="Taux de réponse -48h" value={87} unit="%" variant="target" target={90} />
      <KpiCard label="Note" value={4.2} variant="rating" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const valeurs = [...canvasElement.querySelectorAll("[class*='font-bold']")];
    await expect(valeurs.length).toBeGreaterThanOrEqual(3);
    const hauts = valeurs.slice(0, 3).map((v) => Math.round(v.getBoundingClientRect().top));
    // Toutes les valeurs démarrent à la même hauteur, à 1px près.
    await expect(Math.max(...hauts) - Math.min(...hauts)).toBeLessThanOrEqual(1);
  },
};

export const UnLibelleTropLongCasseLAlignement: Story = {
  name: "Trois lignes de libellé : la réserve ne suffit plus",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "`min-h-8` réserve deux lignes, pas trois. Au-delà, le libellé repousse sa " +
          "valeur et l'alignement se perd — la réserve ne peut pas anticiper une " +
          "longueur arbitraire.\n\n" +
          "Ce n'est pas un défaut à corriger en montant la réserve : passer à trois " +
          "lignes ajouterait 16px de vide à **toutes** les cartes pour un cas rare. " +
          "C'est un signal de rédaction — un intitulé de KPI qui tient sur trois " +
          "lignes est un intitulé à raccourcir.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <KpiCard label="Note" value={4.2} variant="rating" />
      <KpiCard
        label="Taux de réponse aux avis négatifs sous quarante-huit heures ouvrées"
        value={87}
        unit="%"
        variant="target"
        target={90}
      />
      <KpiCard label="Nombre d'avis" value={1654} variant="raw" />
    </div>
  ),
};

// Une icône de démonstration : `currentColor` pour qu'elle hérite de la puce,
// et aucun titre — c'est le libellé qui nomme l'indicateur, pas le glyphe.
const IconeAvis = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LIconeEtLaVariationTiennentLeurRang: Story = {
  name: "L'icône a sa puce, la variation suit le chiffre",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "Deux dispositifs repris des tableaux de bord SaaS récents.\n\n" +
          "**L'icône vit dans une puce**, pas nue en haut à droite : posée sur " +
          "`--muted`, elle devient un repère qu'on retrouve d'une carte à l'autre au " +
          "lieu d'un glyphe qui flotte. Le fond reste neutre — une puce teintée " +
          "ferait porter un sens à une icône qui n'en a pas.\n\n" +
          "**La variation est collée au chiffre**, sur la même ligne de base. " +
          "Séparés, l'œil fait deux arrêts pour une seule information ; côte à côte, " +
          "« 312 ↑ +18 % » se lit d'un trait.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <KpiCard label="Avis reçus" value={1654} variant="raw" icon={IconeAvis} trend={12} />
      <KpiCard label="Taux de réponse" value={87} unit="%" variant="target" target={90} icon={IconeAvis} />
      <KpiCard label="Avis traités" value={312} variant="trend" data={[4, 6, 5, 8, 7, 9]} trend={18} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // La puce et le chiffre coexistent : l'ancienne implémentation les rendait
    // exclusifs (icône OU variation), ce qui privait d'icône toute carte qui
    // affichait une évolution.
    const carte = canvasElement.querySelector("article, [data-slot]") ?? canvasElement;
    await expect(carte.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
  },
};
