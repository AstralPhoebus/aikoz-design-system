import { useEffect, useState } from "react";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Registre des logos ───────────────────────────────────────────────────────

export interface LogoMarque {
  /** Nom de la marque, pour le nom accessible du lien qui l'entoure. */
  nom: string;
  /** Fichier posé sur fond clair. */
  clair: string;
  /**
   * Fichier posé sur fond sombre. **Facultatif, et son absence se voit** : en
   * thème sombre la marque retombe alors sur son nom écrit.
   *
   * Réutiliser le fichier clair serait pire qu'un nom : mesuré contre les
   * cartes sombres réelles, l'encre d'ADP donne 1,31:1 et les trois teintes
   * principales du logo Extime 1,14 à 1,19 — le logo ne disparaîtrait pas
   * franchement, il deviendrait une tache illisible que personne ne
   * signalerait avant la démonstration client.
   */
  sombre?: string;
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
  // Les versions sombres sont DÉRIVÉES des fichiers clairs fournis, en
  // monochrome blanc (`scripts/logos-sombres.py`) : aucune forme n'est
  // touchée, seules les valeurs de remplissage. C'est la variante que toute
  // charte prévoit pour les fonds sombres. Reprendre le fichier clair, lui,
  // donnait une tache illisible — 1,31:1 pour l'encre d'ADP, 1,14 à 1,62 pour
  // les trois teintes principales d'Extime, mesuré sur les cartes réelles.
  // À remplacer par les fichiers officiels dès qu'ils sont transmis.
  adp: {
    nom: "Groupe ADP",
    clair: "./logos/adp-clair.svg",
    sombre: "./logos/adp-sombre.svg",
  },
  extime: {
    nom: "Extime",
    clair: "./logos/extime-clair.svg",
    sombre: "./logos/extime-sombre.svg",
  },
  generali: {
    nom: "Generali",
    clair: "./logos/generali-clair.svg",
    sombre: "./logos/generali-sombre.svg",
  },
};

// ─── Composant ────────────────────────────────────────────────────────────────

export interface BrandMarkProps {
  /**
   * Marque à afficher. Par défaut, celle que porte `data-brand` sur le
   * document — le composant suit donc la bascule sans qu'on la lui passe.
   */
  brand?: string;
  /**
   * Classes de la BOÎTE, pas du logo. La boîte par défaut est
   * `h-8 max-w-[160px]` et elle **reste appliquée** : ce qu'on passe ici
   * s'AJOUTE, comme partout ailleurs dans le système.
   *
   * Elle remplaçait la boîte, et c'était un piège : un `className="shrink-0"`
   * posé pour une raison de mise en page effaçait la hauteur, et le logo
   * d'ADP se rendait à 950 × 326 px au milieu d'un en-tête. Un même nom pour
   * deux comportements — ajouter ici, remplacer là — est le défaut le plus
   * cher d'une bibliothèque.
   *
   * Passer `h-12` ou `max-w-[200px]` continue de redimensionner : c'est
   * `tailwind-merge` qui tranche, et la classe la plus tardive gagne.
   */
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
  // Le nom écrit sert deux cas : marque inconnue, et marque sans version
  // sombre quand le thème sombre est actif.
  const nomEcrit = (
    <span className={cn("text-base font-bold", className)}>
      {LOGOS[courante]?.nom ?? courante.charAt(0).toUpperCase() + courante.slice(1)}
    </span>
  );

  if (!logo) {
    return (
      <span className={cn("text-base font-bold", className)}>
        {courante.charAt(0).toUpperCase() + courante.slice(1)}
      </span>
    );
  }

  // ── RÈGLE DE CADRAGE ──────────────────────────────────────────────────
  //
  // Un logo s'inscrit dans une BOÎTE, il n'est pas calé sur sa seule hauteur.
  //
  // Caler sur la hauteur suppose que tous les logos ont le même rapport
  // largeur/hauteur. Ils ne l'ont pas : mesuré après recadrage, 2,9 pour Aikoz
  // et le Groupe ADP, 3,8 pour le verrou Extime, 7,3 pour Generali. À hauteur
  // égale, Generali est deux fois et demie plus large que les autres — il
  // écrase la barre, et à côté de lui les marques compactes paraissent
  // minuscules. C'est exactement ce qu'Alice a vu sur ADP et Extime.
  //
  // Avec une boîte, chaque logo prend toute la place que son rapport lui
  // permet : les marques compactes atteignent la hauteur, les verrous larges
  // butent sur la largeur. `object-contain` garantit qu'aucun n'est déformé —
  // toutes les chartes l'interdisent.
  const boite = cn("h-8 max-w-[160px]", className);
  const commun = "w-auto shrink-0 object-contain object-left";

  return (
    <>
      <img src={logo.clair} alt="" className={cn(commun, "dark:hidden", boite)} />
      {logo.sombre ? (
        <img src={logo.sombre} alt="" className={cn(commun, "hidden dark:block", boite)} />
      ) : (
        <span className="hidden dark:inline-flex">{nomEcrit}</span>
      )}
    </>
  );
}

/** Nom de la marque courante — pour un `aria-label` de lien. */
export function nomDeMarque(id: string | undefined): string {
  const b = id ?? "aikoz";
  return LOGOS[b]?.nom ?? b.charAt(0).toUpperCase() + b.slice(1);
}
