import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const trackVariants = cva(
  // --track, pas --muted : en dark ce dernier vaut exactement --card (1,00:1),
  // la piste y serait strictement invisible.
  ["relative w-full overflow-hidden rounded-full", "bg-[var(--track)]"],
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: { size: "md" },
  }
);

// Rôles de REMPLISSAGE, pas rôles de texte : un aplat porteur s'audite contre
// la piste au seuil 3:1 (WCAG 1.4.11), là où un texte s'audite à 4,5:1 contre
// la surface.
//
// Le jaune a imposé une sortie par le haut. En thème clair, l'aplat vif du
// thème sombre (#F0C420) ne donne que 1,40:1 sur la piste ; le forcer à
// respecter 3:1 seul le rendait brun (#8C6800), soit une barre d'une couleur
// que le thème sombre n'a nulle part. On applique donc au remplissage le
// dispositif déjà retenu pour Badge : le CONTOUR porte la limite, l'aplat
// reste libre. Résultat, le même jaune dans les deux thèmes — et 3:1 tenu par
// un liseré 1 px, invisible en sombre où l'aplat passait déjà seul.
const FILL: Record<ProgressLevel, { bg: string; edge: string }> = {
  good: { bg: "var(--success-fill)", edge: "var(--success-fill-edge)" },
  warning: { bg: "var(--warning-fill)", edge: "var(--warning-fill-edge)" },
  critical: { bg: "var(--error-fill)", edge: "var(--error-fill-edge)" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProgressLevel = "good" | "warning" | "critical";

/**
 * `meter` — une MESURE dans une échelle connue : taux de réponse, note, jauge.
 * `progressbar` — l'avancement d'une TÂCHE : téléversement, import, calcul.
 *
 * ARIA distingue les deux et les lecteurs d'écran ne les annoncent pas pareil.
 * Le défaut est `meter` : dans ce design system la barre sert des indicateurs,
 * pas des traitements en cours.
 */
export type ProgressRole = "meter" | "progressbar";

export interface ProgressBarProps extends VariantProps<typeof trackVariants> {
  /** Valeur atteinte. Bornée à [0, max]. */
  value: number;
  /** Borne haute de l'échelle. */
  max?: number;
  /**
   * Niveau, qui porte la couleur. Omis, il est déduit de `thresholds` — et la
   * couleur est alors redondante avec la longueur, aucune information n'est
   * portée par la seule couleur.
   *
   * À forcer quand « moins » est un progrès (un délai de réponse bas est bon).
   * Attention : un niveau forcé porte une information que la longueur ne double
   * PAS — passer alors un `valueText` qui l'énonce, sous peine de tomber sous
   * le coup de WCAG 1.4.1.
   */
  level?: ProgressLevel;
  /**
   * Seuils de déduction du niveau, en fraction de `max`.
   * Au-dessus de `good` → good ; au-dessus de `warning` → warning ; sinon critical.
   */
  thresholds?: { good: number; warning: number };
  /**
   * Libellé accessible. Par défaut « 87 sur 100 ».
   * `null` si un parent annonce déjà la valeur — la barre devient alors
   * décorative et n'est plus exposée deux fois aux lecteurs d'écran.
   */
  label?: string | null;
  /** Texte substitué à la valeur brute dans l'annonce (« 87 %, objectif 90 % »). */
  valueText?: string;
  /**
   * Repère fixe sur la piste — typiquement l'OBJECTIF, dans la même unité que
   * `value`. Sans lui, une barre remplie aux trois quarts ne dit pas si le
   * quart manquant est un échec ou une avance : l'objectif n'existait que dans
   * l'annonce vocale, jamais à l'écran.
   *
   * Purement visuel : la valeur annoncée ne change pas. Passer l'objectif dans
   * `valueText` pour qu'il soit aussi énoncé.
   */
  marker?: number;
  /** Rôle ARIA — cf. `ProgressRole`. `meter` par défaut. */
  role?: ProgressRole;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Barre de progression.
 *
 * Transposée du composant Figma `ProgressBar` (atome, niveaux Good / Warning /
 * Critical). Brique d'appui de la variante `target` de `KpiCard` : les quatre
 * cartes des maquettes en portent une.
 *
 * Le niveau ne se lit jamais à la seule couleur : la longueur du remplissage
 * porte la même information, et `aria-valuetext` la donne en toutes lettres.
 */
export function ProgressBar({
  value,
  max = 100,
  level,
  thresholds = { good: 0.9, warning: 0.6 },
  size = "md",
  label,
  marker,
  valueText,
  role = "meter",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const fraction = max > 0 ? clamped / max : 0;

  const resolved: ProgressLevel =
    level ??
    (fraction >= thresholds.good
      ? "good"
      : fraction >= thresholds.warning
      ? "warning"
      : "critical");

  // Un repère hors de l'échelle ne se dessine pas : il se poserait sur le bord
  // et se lirait comme une fin de piste. Aux extrêmes exacts non plus — collé
  // au bord arrondi, il disparaît dans le rayon.
  const markerFraction =
    marker !== undefined && max > 0 && marker > 0 && marker < max ? marker / max : null;

  const formatted = clamped.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  const decorative = label === null;
  const accessibleLabel = decorative ? undefined : label ?? `${formatted} sur ${max}`;

  return (
    <div
      className={cn(trackVariants({ size }), className)}
      role={decorative ? undefined : role}
      aria-hidden={decorative ? true : undefined}
      aria-label={accessibleLabel}
      aria-valuenow={decorative ? undefined : clamped}
      aria-valuemin={decorative ? undefined : 0}
      aria-valuemax={decorative ? undefined : max}
      aria-valuetext={decorative ? undefined : valueText}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
        style={{
          width: `${fraction * 100}%`,
          background: FILL[resolved].bg,
          // Liseré INTÉRIEUR : il ne consomme pas de place, donc la longueur du
          // remplissage reste exactement proportionnelle à la valeur.
          boxShadow: `inset 0 0 0 1px ${FILL[resolved].edge}`,
        }}
      />
      {markerFraction !== null && (
        // Trois pixels, pas un : une FENTE de la couleur de la carte, et un
        // trait neutre au milieu.
        //
        // Le trait seul ne tient qu'un côté. Sur la piste vide il donne 5,99:1
        // en clair et 5,66:1 en sombre ; posé sur l'aplat rempli — ce qui
        // arrive dès que la valeur dépasse l'objectif — il tombe à 1,53:1 et
        // 1,18:1, c'est-à-dire invisible. La fente le détache du remplissage,
        // le trait le détache de la piste : le repère se lit où qu'il tombe.
        //
        // Un repère coloré aurait réglé le problème en en créant un autre — le
        // remplissage porte déjà le niveau par sa couleur, une seconde teinte
        // sur la même barre entrerait en concurrence avec lui.
        <span
          aria-hidden="true"
          className="absolute inset-y-0 flex w-1 -translate-x-1/2 justify-center bg-[var(--card)]"
          style={{ left: `${markerFraction * 100}%` }}
        >
          <span className="w-0.5 rounded-full bg-[var(--muted-foreground)]" />
        </span>
      )}
    </div>
  );
}

export { trackVariants as progressBarVariants };
