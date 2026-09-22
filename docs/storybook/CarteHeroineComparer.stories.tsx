import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { ToastProvider } from "@registry/aikoz/toast/toast";
import { TooltipProvider } from "@registry/aikoz/tooltip/tooltip";
import { DashboardComplet } from "./dashboard-complet";

/**
 * Les deux réglages de la carte héroïne, sur la vraie page.
 *
 * Un échantillon isolé ne répond pas à la question « est-ce qu'elle ressort
 * assez ». Ressortir, c'est ressortir **par rapport au reste** : il faut le
 * reste. D'où le tableau de bord entier, et un bouton qui bascule le seul
 * réglage en jeu.
 *
 * Les deux tiennent le contraste ; c'est le poids visuel qui les sépare.
 */
const meta = {
  title: "Design system/Carte héroïne — voir les deux",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const REGLAGES = [
  {
    cle: "actuel",
    nom: "Actuel",
    fond: "var(--color-ink-500)",
    vers: "var(--color-ink-600)",
    dit: "2,4 fois la clarté des autres cartes. Le texte blanc y tient très largement.",
  },
  {
    cle: "plusClair",
    nom: "Plus clair",
    fond: "var(--color-ink-400)",
    vers: "var(--color-ink-500)",
    dit: "4,1 fois. Elle ressort davantage — et le texte blanc passe juste sous le seuil de lisibilité recommandé.",
  },
] as const;

export const VoirLesDeux: Story = {
  name: "Voir les deux et choisir",
  globals: { theme: "sombre" },
  parameters: {
    docs: {
      description: {
        story:
          "Un échantillon isolé ne dit pas si la carte ressort assez : " +
          "ressortir, c'est ressortir **par rapport au reste**. D'où la page " +
          "entière, et un bouton qui ne change que le fond de la carte du " +
          "haut.\n\n" +
          "Les deux réglages tiennent le contraste. Ce qui les sépare est le " +
          "poids visuel — et, pour le plus clair, un texte blanc qui passe " +
          "juste sous le seuil recommandé.",
      },
    },
  },
  render: function Page() {
    const [choix, setChoix] = useState<string>("actuel");
    const reglage = REGLAGES.find((r) => r.cle === choix)!;

    useEffect(() => {
      const r = document.documentElement;
      // On pose l'override sur la RACINE : c'est là que vivent les rôles, et
      // la carte héroïne les lit par `var()`. Retiré au démontage, pour que
      // la page ne laisse pas son réglage derrière elle.
      r.style.setProperty("--surface-hero", reglage.fond);
      r.style.setProperty("--surface-hero-to", reglage.vers);
      return () => {
        r.style.removeProperty("--surface-hero");
        r.style.removeProperty("--surface-hero-to");
      };
    }, [reglage]);

    return (
      <div className="flex flex-col">
        <div className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b border-border bg-card px-5 py-3">
          {REGLAGES.map((r) => (
            <button
              key={r.cle}
              type="button"
              onClick={() => setChoix(r.cle)}
              aria-pressed={choix === r.cle}
              className={
                "min-h-11 rounded-full px-5 text-sm transition-colors " +
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] " +
                (choix === r.cle
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground")
              }
            >
              {r.nom}
            </button>
          ))}
          <p className="m-0 text-sm text-muted-foreground">{reglage.dit}</p>
        </div>

        <ToastProvider>
          <TooltipProvider>
            <DashboardComplet />
          </TooltipProvider>
        </ToastProvider>
      </div>
    );
  },
};
