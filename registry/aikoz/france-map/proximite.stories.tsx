import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { FranceMap, type PointCarte } from "./france-map";
import { mesurerProximite, formaterDistance } from "./proximite";
import { Table } from "@registry/aikoz/table/table";
import { DeltaBadge } from "@registry/aikoz/delta-badge/delta-badge";
import { Card } from "@registry/aikoz/card/card";

// Un réseau d'agences et la concurrence, en attendant l'API. Les coordonnées
// sont réelles : c'est ce qui rend les distances vérifiables à la main.
const RESEAU: PointCarte[] = [
  { id: "n1", nom: "Lyon Part-Dieu", lon: 4.8594, lat: 45.7606, valeur: 4.2, categorie: "Nos agences" },
  { id: "n2", nom: "Lyon Bellecour", lon: 4.8320, lat: 45.7578, valeur: 3.8, categorie: "Nos agences" },
  { id: "n3", nom: "Paris Opéra", lon: 2.3318, lat: 48.8709, valeur: 4.5, categorie: "Nos agences" },
  { id: "n4", nom: "Marseille Prado", lon: 5.3906, lat: 43.2707, valeur: 3.6, categorie: "Nos agences" },
  { id: "n5", nom: "Bordeaux Centre", lon: -0.5792, lat: 44.8378, valeur: 4.1, categorie: "Nos agences" },

  { id: "c1", nom: "Aximo Lyon Vivier-Merle", lon: 4.8560, lat: 45.7627, valeur: 4.4, categorie: "Concurrence" },
  { id: "c2", nom: "Prevoria Lyon Guillotière", lon: 4.8410, lat: 45.7530, valeur: 3.9, categorie: "Concurrence" },
  { id: "c3", nom: "Aximo Lyon Foch", lon: 4.8410, lat: 45.7710, valeur: 4.0, categorie: "Concurrence" },
  { id: "c4", nom: "Prevoria Paris Bourse", lon: 2.3412, lat: 48.8687, valeur: 4.3, categorie: "Concurrence" },
  { id: "c5", nom: "Aximo Marseille Joliette", lon: 5.3650, lat: 43.3050, valeur: 3.9, categorie: "Concurrence" },
];

const meta = {
  title: "Graphiques/FranceMap/Concurrence proche",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Analyse({ rayonKm = 2 }: { rayonKm?: number }) {
  const [selection, setSelection] = useState<string | undefined>("n1");
  const { voisinages, ecartes } = mesurerProximite(RESEAU, {
    rayonKm,
    categorieReference: "Nos agences",
  });

  const lignes = voisinages.map((v) => ({
    id: v.point.id,
    agence: v.point.nom,
    concurrents: v.voisins.length,
    plusProche: v.voisins[0] ? formaterDistance(v.voisins[0].metres) : "—",
    nous: v.valeur,
    eux: v.moyenneVoisins,
    ecart: v.ecart,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Card as="section" aria-label="Carte des agences et de la concurrence">
        <FranceMap
          valueLabel="Note moyenne"
          values={{}}
          points={RESEAU}
          categories={["Nos agences", "Concurrence"]}
          rayonKm={rayonKm}
          selected={selection}
          onSelect={(code) => setSelection(code)}
          height={380}
        />
      </Card>

      <Card as="section" aria-label="Concurrence à proximité">
        <Table
          caption={`Concurrence dans un rayon de ${rayonKm} km`}
          columns={[
            { key: "agence", header: "Agence" },
            { key: "concurrents", header: "Concurrents", numeric: true },
            { key: "plusProche", header: "Le plus proche", numeric: true },
            {
              key: "nous",
              header: "Nous",
              numeric: true,
              cell: (l) => (l.nous == null ? "—" : l.nous.toLocaleString("fr-FR")),
            },
            {
              key: "eux",
              header: "Eux",
              numeric: true,
              cell: (l) =>
                l.eux == null ? "—" : l.eux.toLocaleString("fr-FR", { maximumFractionDigits: 1 }),
            },
            {
              key: "ecart",
              header: "Écart",
              cell: (l) =>
                l.ecart == null ? (
                  // Pas de concurrent dans le rayon n'est pas un écart de
                  // zéro : c'est une absence de comparaison.
                  <span className="text-xs text-muted-foreground">sans comparaison</span>
                ) : (
                  <DeltaBadge value={Number(l.ecart.toFixed(1))} unit=" pt" size="sm" />
                ),
            },
          ]}
          rows={lignes}
          getRowKey={(l) => l.id}
          rowHeaderKey="agence"
          density="compact"
        />
        {ecartes > 0 && (
          <p role="status" className="m-0 mt-2 text-sm text-[var(--warning)]">
            {ecartes} point{ecartes > 1 ? "s" : ""} sans coordonnées {ecartes > 1 ? "sont" : "est"}{" "}
            hors du calcul. Une position repliée sur le centre d’un département est
            inventée à quelques dizaines de kilomètres près&nbsp;: la compter dans un
            rayon de {rayonKm} km donnerait un chiffre faux qui a l’air juste.
          </p>
        )}
      </Card>
    </div>
  );
}

export const DansUnRayonDeDeuxKm: Story = {
  name: "Trois concurrents dans un rayon de 2 km",
  render: () => <Analyse rayonKm={2} />,
  parameters: {
    docs: {
      description: {
        story:
          "Voir les points répond à **où**. Ça ne répond pas à « combien en " +
          "face de nous, et est-ce qu'ils font mieux » — et cette question-là " +
          "ne se lit pas à l'œil : deux cercles qui se touchent à l'écran " +
          "peuvent être à huit cents mètres comme à huit kilomètres selon le " +
          "zoom.\\n\\n" +
          "La carte trace donc le rayon autour de l'agence sélectionnée, et le " +
          "tableau le mesure. Les deux disent la même chose, l'un pour " +
          "l'intuition, l'autre pour la décision.\\n\\n" +
          "Les distances sont calculées **dans la projection**, pas à vol " +
          "d'oiseau sur la sphère. C'est exact ici : Lambert-93 est conforme " +
          "et son facteur d'échelle varie de moins d'un millième sur la " +
          "métropole. Une formule de grand cercle ne changerait pas le " +
          "deuxième chiffre après la virgule.\\n\\n" +
          "**Seuls les points qui ont des coordonnées entrent dans le calcul.** " +
          "Un point replié sur le centroïde de son département est à une " +
          "position inventée à quelques dizaines de kilomètres près ; le " +
          "compter dans un rayon de deux kilomètres produirait un chiffre qui " +
          "a l'air juste et qui ne l'est pas. Ceux-là sont écartés et comptés.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Lyon Part-Dieu a trois concurrents à moins de 2 km, dont Vivier-Merle
    // à environ 300 m — vérifiable sur une carte, c'est le but du jeu réel.
    const { voisinages } = mesurerProximite(RESEAU, {
      rayonKm: 2,
      categorieReference: "Nos agences",
    });
    const partDieu = voisinages.find((v) => v.point.id === "n1")!;
    await expect(partDieu.voisins).toHaveLength(3);
    await expect(partDieu.voisins[0].point.nom).toContain("Vivier-Merle");
    // 352 m — la même valeur qu'une formule de grand cercle, à 0,05 % près.
    await expect(partDieu.voisins[0].metres).toBeGreaterThan(345);
    await expect(partDieu.voisins[0].metres).toBeLessThan(360);

    // Bordeaux n'a aucun concurrent : l'écart est « sans comparaison », pas
    // zéro. Zéro se lirait « à égalité », ce qui est faux.
    const bordeaux = voisinages.find((v) => v.point.id === "n5")!;
    await expect(bordeaux.voisins).toHaveLength(0);
    await expect(bordeaux.ecart).toBeUndefined();
    await expect(canvas.getAllByText("sans comparaison").length).toBeGreaterThan(0);
  },
};

export const LesDistancesSontJustes: Story = {
  name: "Les distances sont justes, contrôlées hors de notre projection",
  render: () => <Analyse rayonKm={2} />,
  parameters: {
    docs: {
      description: {
        story:
          "Un calcul de distance qui se vérifie avec le même code qu'il " +
          "vérifie ne vérifie rien. Cette histoire compare nos distances à " +
          "une **référence de grand cercle** calculée à part, sur les " +
          "coordonnées d'origine.\n\n" +
          "Elle existe parce que le premier jet se trompait de 17 % : " +
          "`projeter()` arrondissait au dixième d'unité de boîte, soit **114 " +
          "mètres**. C'est bon pour un contour — un trait d'un kilomètre ne " +
          "se voit pas — et absurde pour un point qui sert à mesurer. Une " +
          "agence à 352 m d'un concurrent ressortait à 411.",
      },
    },
  },
  play: async () => {
    // Référence indépendante : haversine sur le rayon moyen terrestre, à
    // partir des coordonnées d'origine, sans passer par notre projection.
    const R = 6371008.8;
    const rad = (d: number) => (d * Math.PI) / 180;
    const grandCercle = (lon1: number, lat1: number, lon2: number, lat2: number) => {
      const p1 = rad(lat1), p2 = rad(lat2);
      const dp = p2 - p1, dl = rad(lon2 - lon1);
      const a =
        Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };

    // Un rayon large, pour que toutes les paires entrent dans la mesure.
    const { voisinages } = mesurerProximite(RESEAU, {
      rayonKm: 500,
      categorieReference: "Nos agences",
    });
    let pire = 0;
    for (const v of voisinages) {
      for (const voisin of v.voisins) {
        const ref = grandCercle(
          v.point.lon!, v.point.lat!, voisin.point.lon!, voisin.point.lat!,
        );
        pire = Math.max(pire, Math.abs(voisin.metres - ref) / ref);
      }
    }
    // Lambert-93 est conforme : son facteur d'échelle varie de moins d'un
    // millième sur la métropole. Un pour cent laisse de la marge sans rien
    // laisser passer d'une régression d'arrondi.
    await expect(pire).toBeLessThan(0.01);
  },
};

export const LeRayonChangeLaReponse: Story = {
  name: "Le rayon change la réponse, et c'est le sujet",
  render: () => <Analyse rayonKm={10} />,
  parameters: {
    docs: {
      description: {
        story:
          "Le même réseau à 10 km au lieu de 2. Marseille Prado passe de zéro " +
          "à un concurrent, et Lyon Bellecour en gagne. Le rayon n'est pas un " +
          "réglage d'affichage : c'est la définition de « proche », et elle " +
          "n'est pas la même en centre-ville et en zone rurale.\\n\\n" +
          "C'est pour ça qu'il est une **prop** et non une constante cachée.",
      },
    },
  },
  play: async () => {
    const proche = mesurerProximite(RESEAU, { rayonKm: 2, categorieReference: "Nos agences" });
    const large = mesurerProximite(RESEAU, { rayonKm: 10, categorieReference: "Nos agences" });
    const compte = (r: typeof proche) => r.voisinages.reduce((s, v) => s + v.voisins.length, 0);
    await expect(compte(large)).toBeGreaterThan(compte(proche));
  },
};
