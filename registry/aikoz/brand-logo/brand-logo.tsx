import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";
import { BRAND_BY_ID, cheminLogo, surTeinte, type Brand } from "@registry/aikoz/brand-logo/brands";

// ─── Variants ────────────────────────────────────────────────────────────────

const pastilleVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center overflow-hidden",
    "rounded-full font-semibold tracking-tight select-none",
  ],
  {
    variants: {
      size: {
        sm: "text-2xs",
        md: "text-2xs",
        lg: "text-xs",
        xl: "text-sm",
      },
      shape: {
        /** Rond compact — porte les INITIALES. Cf. la note du composant. */
        circle: "aspect-square",
        /** Plaque large — porte le LOGO, à son rapport d'origine. */
        plate: "rounded-[var(--radius)]",
      },
    },
    compoundVariants: [
      { shape: "circle", size: "sm", class: "size-6" },
      { shape: "circle", size: "md", class: "size-8" },
      { shape: "circle", size: "lg", class: "size-10" },
      { shape: "circle", size: "xl", class: "size-14" },
      { shape: "plate", size: "sm", class: "h-7 min-w-16 px-2" },
      { shape: "plate", size: "md", class: "h-9 min-w-24 px-2.5" },
      { shape: "plate", size: "lg", class: "h-12 min-w-32 px-3" },
      { shape: "plate", size: "xl", class: "h-16 min-w-44 px-4" },
    ],
    defaultVariants: { size: "md", shape: "circle" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrandLogoProps extends VariantProps<typeof pastilleVariants> {
  /** Identifiant du registre — `axa`, `malakoff-humanis`… */
  brand: string;
  /**
   * Marque non répertoriée, fournie à la volée. Permet d'afficher un
   * établissement client sans l'ajouter au registre du marché.
   */
  custom?: Brand;
  /**
   * `true` — la marque est déjà nommée juste à côté, la pastille se tait.
   * `false` (défaut) — elle porte le nom de la marque en nom accessible.
   */
  decorative?: boolean;
  /** Affiche le nom de la marque à côté de la pastille. */
  showName?: boolean;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Pastille de marque.
 *
 * **Deux formes, et la forme décide de ce qui est affiché.** Ce n'est pas un
 * réglage esthétique, c'est le constat d'un essai raté : masquer un logo dans
 * un rond de 40 px ne marche pas. Les logotypes horizontaux — Matmut,
 * Groupama, Malakoff — s'y réduisent à une tache, et les logos construits sur
 * une forme pleine, comme le carré d'AXA, ressortent en aplat massif : un
 * masque ne garde que la silhouette, il perd tout ce que la couleur
 * distinguait à l'intérieur.
 *
 *   `circle`  rond compact → **initiales**, toujours lisibles à 24 px
 *   `plate`   plaque large, à la teinte de la marque → **le logo**, monochrome
 *
 * **Les dix-neuf marques passent aujourd'hui par le même rendu**, et ça n'a
 * pas été donné. Sept fichiers ne se masquaient pas : leur logo est un aplat
 * plein dont un masque n'aurait gardé qu'une silhouette muette. Ils ont
 * d'abord été affichés en couleur d'origine sur plaque claire — deux
 * traitements dans une même grille, ce qui obligeait à renoncer à la teinte
 * de marque partout pour rester cohérent.
 *
 * Leur masque est désormais FABRIQUÉ, par `scripts/masques-marques.py` : est
 * opaque ce qui n'est ni le fond extérieur, ni le blanc. Le blanc compte
 * comme un trou parce que dans ces logos il EST le dessin — les lettres
 * d'AXA, celles de MAIF, le M de MMA sont des réserves creusées dans un
 * aplat. Les garder donnait un pavé ; les creuser donne un logo lisible en
 * une seule encre.
 *
 * Le champ `maskable` reste dans le registre : il n'a plus d'usage
 * aujourd'hui, mais il décrit une propriété réelle des fichiers, et le
 * prochain logo ajouté pourra en avoir besoin avant qu'on lui fabrique son
 * masque. Les marques SANS fichier retombent sur les initiales.
 *
 * **Le logo est rendu en monochrome, par masque CSS.** Le fichier sert de
 * `mask-image` et la couleur vient du dessous : un seul fichier suffit pour
 * les quatre combinaisons registre × thème, là où deux versions par marque
 * auraient demandé 38 fichiers dont aucun n'existe. Le procédé marche
 * indifféremment sur un SVG et sur un PNG à fond transparent, ce qui compte
 * quand cinq marques sur dix-neuf ne sont disponibles qu'en bitmap.
 *
 * **Le repli sur les initiales n'est pas un pis-aller.** Deux marques du
 * marché n'ont aucun fichier récupérable — MMA et Swiss Life bloquent l'accès
 * automatisé —, et il en manquera toujours une. Une pastille d'initiales à la
 * teinte de la marque reste identifiable, s'aligne avec les autres, et ne
 * casse jamais la mise en page. Le composant ne connaît pas d'état « cassé ».
 *
 * **Le noir ou le blanc du contenu est MESURÉ, pas choisi.** `surTeinte()`
 * calcule la luminance relative de la teinte et retient celui des deux qui
 * contraste le plus. C'est ce qui rend le jaune d'Abeille et le marine de
 * Matmut également lisibles sans arbitrage marque par marque — et ce qui
 * protège des couleurs ajoutées plus tard.
 *
 * La teinte étant fournie par la marque, elle échappe aux tokens du design
 * system : c'est assumé. Une couleur de marque n'est pas une couleur de
 * l'interface, elle ne suit ni le thème ni le registre. Ce que le système
 * garantit, c'est le contraste À L'INTÉRIEUR de la pastille, et le fait que
 * la pastille elle-même se détache de son fond.
 */
export function BrandLogo({
  brand,
  custom,
  decorative = false,
  showName = false,
  size = "md",
  shape = "circle",
  className,
}: BrandLogoProps) {
  const m = custom ?? BRAND_BY_ID[brand];

  if (!m) {
    // Marque inconnue : on rend quand même quelque chose de neutre plutôt que
    // rien. Un trou dans une grille de logos se lit comme un bug.
    return (
      <span
        className={cn(pastilleVariants({ size, shape }), "bg-[var(--muted)] text-muted-foreground", className)}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : `Marque inconnue : ${brand}`}
        aria-hidden={decorative || undefined}
      >
        ?
      </span>
    );
  }

  const encre = surTeinte(m.color);


  return (
    <span className={cn("inline-flex items-center gap-2", showName && "min-w-0")}>
      <span
        className={cn(pastilleVariants({ size, shape }), className)}
        style={{ backgroundColor: m.color, color: encre }}
        // Quand le nom est écrit à côté, la pastille se tait : sinon un
        // lecteur d'écran annonce « AXA, AXA ».
        role={decorative || showName ? undefined : "img"}
        aria-label={decorative || showName ? undefined : m.name}
        aria-hidden={decorative || showName || undefined}
      >
        {m.asset && m.maskable !== false && shape === "plate" ? (
          <span
            aria-hidden="true"
            className="block h-[68%] w-full"
            style={{
              backgroundColor: "currentColor",
              WebkitMaskImage: `url(${cheminLogo(m.asset)})`,
              maskImage: `url(${cheminLogo(m.asset)})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        ) : m.asset && shape === "plate" ? (
          // Fichier non masquable : le logo est montré tel quel, en couleur
          // d'origine, sur la même surface claire que les autres.
          <img
            src={cheminLogo(m.asset)}
            alt=""
            aria-hidden="true"
            className="block h-[72%] w-auto max-w-full object-contain"
          />
        ) : (
          m.initials
        )}
      </span>
      {showName && (
        <span className="truncate text-sm text-foreground">{m.name}</span>
      )}
    </span>
  );
}

export { pastilleVariants as brandLogoVariants };
export { BRANDS, BRAND_BY_ID, surTeinte, definirBaseDesLogos, cheminLogo } from "@registry/aikoz/brand-logo/brands";
export type { Brand } from "@registry/aikoz/brand-logo/brands";
