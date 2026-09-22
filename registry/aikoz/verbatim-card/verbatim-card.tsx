import { type ElementType, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";
import { ScoreStars } from "@registry/aikoz/score-stars/score-stars";
import { Badge } from "@registry/aikoz/badge/badge";

// ─── Variants ────────────────────────────────────────────────────────────────

const cardVariants = cva(
  ["flex flex-col", "bg-card border border-border", "rounded-[var(--radius)]"],
  {
    variants: {
      density: {
        compact: "p-4 gap-2",
        default: "p-5 gap-3",
      },
    },
    defaultVariants: { density: "default" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * État de RÉPONSE de l'établissement, pas sentiment de l'avis.
 *
 * Les deux ont été confondus au cadrage : le tunnel du lead magnet rend
 * `rv.status` = « Répondu ✓ » / « Sans réponse ✗ », ce qui décrit l'action de
 * l'agence, pas la tonalité du client. Le sentiment, quand il arrivera, sera
 * un `Badge` de plus — il n'appelle pas de composant dédié.
 */
export type ReplyStatus = "replied" | "unanswered";

export interface VerbatimCardProps extends VariantProps<typeof cardVariants> {
  /** Texte de l'avis. Rendu intégralement dans le DOM même s'il est tronqué. */
  text: string;
  /** Note attribuée, sur `max`. */
  rating?: number;
  max?: number;

  /** État de réponse — cf. `ReplyStatus`. */
  status?: ReplyStatus;
  /** Libellés affichés, si « Répondu » / « Sans réponse » ne conviennent pas. */
  statusLabels?: Record<ReplyStatus, string>;

  /** Plateforme d'origine : « Google », « Trustpilot »… */
  source?: string;
  /** Auteur ou établissement concerné. */
  author?: string;
  /** Date déjà formatée — la carte ne fait pas de localisation. */
  date?: string;

  /**
   * Nombre de lignes avant troncature. La coupe est faite en CSS : le texte
   * complet reste dans le DOM, donc lisible par un lecteur d'écran et par la
   * recherche du navigateur. Ne jamais tronquer la chaîne en amont.
   */
  lines?: number;

  /** Étiquettes thématiques : « Réactivité », « Expertise »… */
  tags?: string[];

  className?: string;
  onClick?: () => void;
  href?: string;
  children?: ReactNode;
}

const DEFAULT_STATUS_LABELS: Record<ReplyStatus, string> = {
  replied: "Répondu",
  unanswered: "Sans réponse",
};

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Carte d'avis client.
 *
 * Rendue en `<article>` : un avis est un contenu autonome, complet en
 * lui-même, ce qui est exactement la définition de cet élément — et ça donne
 * aux lecteurs d'écran un repère pour sauter d'un avis au suivant.
 *
 * Contrairement à `KpiCard`, les briques ne sont PAS réduites au silence
 * quand la carte est statique : l'ordre de lecture naturel — note, état,
 * texte — dit déjà tout, et le faire répéter par un libellé de carte
 * l'annoncerait deux fois. Elles ne se taisent que si la carte devient
 * cliquable et parle donc à leur place.
 */
export function VerbatimCard({
  text,
  rating,
  max = 5,
  status,
  statusLabels = DEFAULT_STATUS_LABELS,
  source,
  author,
  date,
  lines,
  tags,
  density = "default",
  className,
  onClick,
  href,
  children,
}: VerbatimCardProps) {
  const isInteractive = !!(onClick || href);
  const Comp = (href ? "a" : onClick ? "button" : "article") as ElementType;
  const compProps = href
    ? { href }
    : onClick
    ? { onClick, type: "button" as const }
    : {};

  const interactiveClasses = isInteractive
    ? cn(
        "text-left w-full transition-all cursor-pointer",
        "hover:border-[var(--ring)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        href && "no-underline"
      )
    : "";

  const meta = [source, author, date].filter(Boolean).join(" · ");

  // Quand la carte est cliquable, elle porte l'énoncé complet et les briques
  // se taisent — sinon le bouton annoncerait la note, puis la note à nouveau.
  const spoken = [
    rating !== undefined
      ? `${rating.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} sur ${max} étoiles`
      : null,
    status ? statusLabels[status] : null,
    meta || null,
    text,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Comp
      className={cn(cardVariants({ density }), interactiveClasses, className)}
      aria-label={isInteractive ? spoken : undefined}
      {...compProps}
    >
      {(rating !== undefined || status) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {rating !== undefined && (
            <ScoreStars
              value={rating}
              max={max}
              size={density === "compact" ? "sm" : "md"}
              label={isInteractive ? null : undefined}
            />
          )}
          {status && (
            <Badge
              tone={status === "replied" ? "success" : "error"}
              size="sm"
              /* Le glyphe double la couleur : sans lui l'état ne tiendrait
                 qu'à la teinte, ce qu'interdit WCAG 1.4.1. */
              icon={status === "replied" ? "✓" : "✕"}
              label={isInteractive ? null : undefined}
            >
              {statusLabels[status]}
            </Badge>
          )}
        </div>
      )}

      {meta && (
        <span className="text-xs text-muted-foreground" aria-hidden={isInteractive}>
          {meta}
        </span>
      )}

      {/* Troncature CSS : le texte complet reste dans le DOM. */}
      <p
        className={cn("text-sm text-foreground leading-relaxed m-0", lines && "overflow-hidden")}
        style={
          lines
            ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical" }
            : undefined
        }
        aria-hidden={isInteractive}
      >
        {text}
      </p>

      {tags && tags.length > 0 && (
        <ul className="flex gap-2 flex-wrap m-0 p-0 list-none" aria-label="Thèmes de l'avis">
          {tags.map((t) => (
            <li
              key={t}
              className="text-2xs rounded-full px-2 py-0.5 bg-muted text-muted-foreground"
            >
              {t}
            </li>
          ))}
        </ul>
      )}

      {children}
    </Comp>
  );
}

export { cardVariants as verbatimCardVariants };
