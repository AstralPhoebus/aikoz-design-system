import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { BrandMark } from "@registry/aikoz/brand-mark/brand-mark";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SiteNavLink {
  label: string;
  href: string;
  /** Page affichée. Pose `aria-current="page"`. */
  current?: boolean;
}

export interface SiteNavProps {
  links: SiteNavLink[];
  /** Marque, à gauche. Un texte suffit ; un `<img>` doit porter son `alt`. */
  brand?: ReactNode;
  /** Adresse de l'accueil. */
  brandHref?: string;
  /** Nom accessible du lien de marque. « Aikoz, accueil » par défaut. */
  brandLabel?: string;
  /** Actions à droite : connexion, appel à l'action. */
  actions?: ReactNode;
  /**
   * Cible du lien d'évitement. `#contenu` par défaut : l'appelant doit poser
   * cet identifiant sur son `<main>`, sinon le lien ne mène nulle part.
   * `null` le retire, quand un gabarit parent le porte déjà.
   */
  skipTo?: string | null;
  /** Nom du `<nav>`. */
  label?: string;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * En-tête de site.
 *
 * **Distinct de `SidebarNav`, et pas seulement par l'apparence.** Celle-ci
 * navigue entre les pages d'un SITE public : elle est le premier élément du
 * document, elle porte le lien d'évitement, et elle se replie en menu sur
 * petit écran. `SidebarNav` navigue entre les sections d'une APPLICATION,
 * dans un gabarit qui a déjà son en-tête. Les deux rendent des liens avec
 * `aria-current="page"` — c'est leur seul point commun, et il ne justifie pas
 * de les fondre.
 *
 * **Le lien d'évitement est ici, et pas ailleurs.** C'est le premier élément
 * focusable de la page ; le mettre dans un composant qui n'est pas le premier
 * rendu ne marche pas. Il est invisible tant qu'il n'a pas le focus, puis
 * s'affiche en haut à gauche — sans lui, un utilisateur au clavier retraverse
 * toute la navigation à chaque page (WCAG 2.4.1).
 *
 * **Le menu mobile est un `disclosure`, pas une modale.** Il ne piège pas le
 * focus et ne masque pas le reste du document : ce n'est pas un dialogue,
 * c'est une liste qu'on déplie. Il se ferme sur Échap et rend le focus au
 * bouton — ce que Radix apporterait pour un `Dialog`, mais qui tient ici en
 * quinze lignes parce que le contrat est plus simple.
 */
export function SiteNav({
  links,
  brand,
  brandHref = "/",
  brandLabel = "Aikoz, accueil",
  actions,
  skipTo = "#contenu",
  label = "Navigation principale",
  className,
}: SiteNavProps) {
  const uid = useId();
  const [ouvert, setOuvert] = useState(false);
  const boutonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const surEchap = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOuvert(false);
      // Le focus revient au déclencheur : sans ça il resterait dans un menu
      // qui vient de disparaître, et l'utilisateur repartirait du début.
      boutonRef.current?.focus();
    };
    document.addEventListener("keydown", surEchap);
    return () => document.removeEventListener("keydown", surEchap);
  }, [ouvert]);

  const lien = (l: SiteNavLink, mobile = false) => (
    <li key={l.href}>
      <a
        href={l.href}
        aria-current={l.current ? "page" : undefined}
        className={cn(
          "inline-flex items-center min-h-11 px-3 rounded-[var(--radius)] no-underline",
          "text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nav-surface)]",
          mobile && "w-full",
          l.current
            ? // L'état courant tient sur DEUX canaux visuels — graisse et
              // soulignement — plus `aria-current`. Le voile de fond ne
              // compte pas : 1,19:1, mesuré ailleurs dans ce système.
              "font-semibold text-[var(--nav-on)] underline underline-offset-8 decoration-2 decoration-[var(--nav-accent)]"
            : "font-medium text-[var(--nav-on-muted)] hover:text-[var(--nav-on)]"
        )}
      >
        {l.label}
      </a>
    </li>
  );

  return (
    <header
      className={cn(
        "w-full bg-[var(--nav-surface)] border-b border-[var(--border-strong)]",
        className
      )}
    >
      {skipTo && (
        // Hors écran tant qu'il n'a pas le focus, visible dès qu'il l'a.
        // `sr-only` seul ne suffirait pas : il resterait invisible même
        // focalisé, et l'utilisateur ne saurait pas où il est.
        <a
          href={skipTo}
          className={cn(
            "sr-only focus:not-sr-only",
            "focus:absolute focus:z-50 focus:m-2 focus:rounded-[var(--radius)]",
            "focus:bg-[var(--primary)] focus:text-[var(--primary-foreground)]",
            "focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:no-underline"
          )}
        >
          Aller au contenu
        </a>
      )}

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a
          href={brandHref}
          aria-label={brandLabel}
          className={cn(
            "inline-flex items-center gap-2 no-underline shrink-0",
            "text-base font-bold text-[var(--nav-on)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nav-surface)]",
            "rounded-[var(--radius)]"
          )}
        >
          {/*
            Le LOGO, pas le nom écrit — et celui de la MARQUE COURANTE.
            `BrandMark` suit `data-brand` tout seul : passer la marque en prop
            à chaque appelant reviendrait à réimplémenter la marque blanche
            dans chaque page, et un oubli ne se verrait nulle part.
          */}
          {brand ?? <BrandMark />}
        </a>

        <nav aria-label={label} className="hidden md:block">
          <ul className="flex items-center gap-1 list-none m-0 p-0">
            {links.map((l) => lien(l))}
          </ul>
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">{actions}</div>

        <button
          ref={boutonRef}
          type="button"
          aria-expanded={ouvert}
          aria-controls={`${uid}-menu`}
          onClick={() => setOuvert((o) => !o)}
          className={cn(
            "md:hidden inline-flex items-center justify-center size-11 rounded-[var(--radius)]",
            "text-[var(--nav-on)] hover:bg-[var(--nav-surface-active)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          )}
        >
          {/* Le bouton a un nom explicite : trois traits ne se lisent pas.
              Et il change de nom selon l'état, en plus d'`aria-expanded` —
              certaines synthèses vocales n'annoncent pas l'attribut. */}
          <span className="sr-only">{ouvert ? "Fermer le menu" : "Ouvrir le menu"}</span>
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            {ouvert ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </div>

      {/* `hidden` et non une classe : le menu fermé sort de la tabulation,
          pas seulement de la vue. Même règle que l'accordéon. */}
      <div id={`${uid}-menu`} hidden={!ouvert} className="md:hidden border-t border-[var(--nav-border)]">
        <nav aria-label={label} className="mx-auto max-w-6xl px-4 py-3">
          <ul className="flex flex-col gap-1 list-none m-0 p-0">
            {links.map((l) => lien(l, true))}
          </ul>
          {actions && <div className="flex flex-wrap gap-2 pt-3">{actions}</div>}
        </nav>
      </div>
    </header>
  );
}
