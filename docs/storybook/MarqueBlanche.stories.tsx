import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { useEffect, useState } from "react";
import { Button } from "@registry/aikoz/button/button";
import { Badge } from "@registry/aikoz/badge/badge";
import { KpiCard } from "@registry/aikoz/kpi-card/kpi-card";

const MARQUES = [
  { id: null, nom: "Aikoz", detail: "marque par défaut" },
  { id: "adp", nom: "Groupe ADP", detail: "PANTONE 2748 C · 2144 C · Bright Red C" },
  { id: "generali", nom: "Generali", detail: "marque de démonstration" },
] as const;

/**
 * La marque blanche est un ATTRIBUT, pas un thème.
 *
 * `data-brand` s'ajoute sur `<html>` et n'écrase ni le thème clair/sombre ni
 * le registre produit/marketing — les trois axes se composent. C'est ce qui
 * permet de livrer un « ADP by Aikoz » sombre en registre produit sans
 * dupliquer une seule règle.
 */
function Vitrine({ marque }: { marque: string | null }) {
  useEffect(() => {
    const H = document.documentElement;
    const avant = H.getAttribute("data-brand");
    if (marque) H.setAttribute("data-brand", marque);
    else H.removeAttribute("data-brand");
    return () => {
      avant ? H.setAttribute("data-brand", avant) : H.removeAttribute("data-brand");
    };
  }, [marque]);

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button>Publier la réponse</Button>
        <Button variant="secondary">Modifier</Button>
        <Button variant="outline">Annuler</Button>
        <Badge tone="info" icon="●">Programmée</Badge>
      </div>
      <KpiCard label="Taux de réponse" value={87} unit="%" variant="target" target={90} />
    </div>
  );
}

function Toutes() {
  const [actif, setActif] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Marque" className="flex flex-wrap gap-2">
        {MARQUES.map((m) => (
          <Button
            key={m.nom}
            size="sm"
            variant={actif === m.id ? "default" : "outline"}
            aria-pressed={actif === m.id}
            onClick={() => setActif(m.id)}
          >
            {m.nom}
          </Button>
        ))}
      </div>
      <p className="m-0 text-sm text-muted-foreground">
        {MARQUES.find((m) => m.id === actif)?.detail}
      </p>
      <Vitrine marque={actif} />
    </div>
  );
}

const meta = {
  title: "Design system/Marque blanche",
  component: Toutes,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Toutes>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TroisMarques: Story = {
  name: "Trois marques, un seul code",
  parameters: {
    docs: {
      description: {
        story:
          "`data-brand` est un **attribut**, pas un thème : il n'écrase ni le clair/sombre " +
          "ni le registre produit/marketing. Les trois axes se composent, ce qui permet de " +
          "livrer un « ADP by Aikoz » sombre en registre produit sans dupliquer une règle.\n\n" +
          "Les couleurs ADP viennent de la charte officielle : **PANTONE 2748 C** `#031F73` " +
          "(confirmé par la *Charte du logotype Groupe ADP*, mars 2016), **2144 C** " +
          "`#376DB3` et **Bright Red C** `#C84118` (*Style Guide*, p. 13). Seuls ces trois " +
          "pas sont officiels ; les autres crans des rampes sont dérivés en suivant le " +
          "profil de clarté de la rampe ultramarine Aikoz.\n\n" +
          "**Le test qui accompagne cette story n'est pas décoratif.** Un CSS de marque " +
          "généré mais jamais chargé — ou un bridge qui fige ses valeurs au lieu de les " +
          "référencer — produirait exactement cette page, à l'identique, sans que rien ne " +
          "change. C'est ce qui est arrivé : la marque blanche n'a pas fonctionné pendant " +
          "des semaines, et Generali était censé le prouver. Le test lit donc `--primary` " +
          "sur le document et vérifie qu'il bouge vraiment.",
      },
    },
  },
  play: async () => {
    const H = document.documentElement;
    // `--primary`, pas `--color-brand-primary` : c'est le token que consomment
    // les COMPOSANTS. C'est précisément là que la chaîne se rompait.
    const lire = () => getComputedStyle(H).getPropertyValue("--primary").trim();

    const avant = H.getAttribute("data-brand");
    H.removeAttribute("data-brand");
    const aikoz = lire();
    H.setAttribute("data-brand", "adp");
    const adp = lire();
    H.setAttribute("data-brand", "generali");
    const generali = lire();
    avant ? H.setAttribute("data-brand", avant) : H.removeAttribute("data-brand");

    await expect(aikoz).toBeTruthy();
    await expect(adp).not.toBe(aikoz);
    await expect(generali).not.toBe(aikoz);
    await expect(generali).not.toBe(adp);
  },
};
