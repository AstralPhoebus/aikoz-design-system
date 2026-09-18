import { useEffect, useState } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Registre des logos ───────────────────────────────────────────────────────

export interface LogoMarque {
  /** Nom de la marque, pour le nom accessible du lien qui l'entoure. */
  nom: string;
  /** Fichier posé sur fond clair. */
  clair: string;
  /** Fichier posé sur fond sombre. */
  sombre: string;
}

/**
 * Les logos, par identifiant de marque — la même clé que `data-brand`.
 *
 * **Deux fichiers par marque, jamais un seul recoloré.** Les SVG Aikoz
 * embarquent un fond opaque, et les chartes de marque interdisent en général
 * toute modification du logo. Recolorer en CSS produirait un fichier qui n'est
 * plus celui que le client a validé.
 *
 * Chemins RELATIFS : servis sous un sous-domaine — ce que fait GitHub Pages —
 * un chemin absolu partirait chercher la racine du domaine. Une application
 * dont les pages sont imbriquées doit passer ses propres chemins.
 */
export const LOGOS: Record<string, LogoMarque> = {
  aikoz: {
    nom: "Aikoz",
    clair: "./logos/aikoz-clair.svg",
    sombre: "./logos/aikoz-sombre.svg",
  },
  // ⚠ ADP n'a pas encore son fichier officiel. Tant qu'il manque, la marque
  // retombe sur son nom écrit — visible, donc réclamé. Un logo approximatif,
  // découpé dans un PDF de charte, serait pire : il passerait inaperçu.
};

// ─── Composant ────────────────────────────────────────────────────────────────

export interface BrandMarkProps {
  /**
   * Marque à afficher. Par défaut, celle que porte `data-brand` sur le
   * document — le composant suit donc la bascule sans qu'on la lui passe.
   */
  brand?: string;
  /** Hauteur du logo. `h-7` par défaut. */
  className?: string;
}

/**
 * Le logo de la marque courante.
 *
 * **Il suit `data-brand` tout seul**, via un observateur d'attribut. Le passer
 * en prop à chaque appelant reviendrait à réimplémenter la marque blanche dans
 * chaque page, et un oubli ne se verrait nulle part.
 *
 * **Sans fichier connu, il écrit le nom.** Une marque sans logo doit être
 * visible comme telle : un espace vide passerait inaperçu jusqu'à la
 * démonstration client.
 *
 * Le `alt` est vide : c'est le lien qui entoure ce composant qui porte le nom
 * accessible. Sans ça, un lecteur d'écran annoncerait la marque deux fois.
 */
export function BrandMark({ brand, className }: BrandMarkProps) {
  const [courante, setCourante] = useState<string>(() =>
    brand ?? (typeof document !== "undefined"
      ? document.documentElement.dataset.brand ?? "aikoz"
      : "aikoz")
  );

  useEffect(() => {
    if (brand) { setCourante(brand); return; }
    const H = document.documentElement;
    const lire = () => setCourante(H.dataset.brand ?? "aikoz");
    lire();
    const o = new MutationObserver(lire);
    o.observe(H, { attributes: true, attributeFilter: ["data-brand"] });
    return () => o.disconnect();
  }, [brand]);

  const logo = LOGOS[courante];

  if (!logo) {
    return (
      <span className={cn("text-base font-bold", className)}>
        {courante.charAt(0).toUpperCase() + courante.slice(1)}
      </span>
    );
  }

  return (
    <>
      <img src={logo.clair} alt="" className={cn("w-auto shrink-0 dark:hidden", className ?? "h-7")} />
      <img src={logo.sombre} alt="" className={cn("hidden w-auto shrink-0 dark:block", className ?? "h-7")} />
    </>
  );
}

/** Nom de la marque courante — pour un `aria-label` de lien. */
export function nomDeMarque(id: string | undefined): string {
  const b = id ?? "aikoz";
  return LOGOS[b]?.nom ?? b.charAt(0).toUpperCase() + b.slice(1);
}
