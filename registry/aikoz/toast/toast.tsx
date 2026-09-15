import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@registry/aikoz/lib/utils";

// ─── Variants ────────────────────────────────────────────────────────────────

const toastVariants = cva(
  [
    "pointer-events-auto w-full max-w-sm",
    "flex items-start gap-2.5 rounded-[var(--radius)] border p-3 shadow-lg",
    "bg-[var(--popover)] text-[var(--popover-foreground)]",
  ],
  {
    variants: {
      // Même correspondance ton → token que `InfoBanner` : la bordure et
      // l'icône portent la couleur, le texte reste `--foreground`. Un seul
      // système de tons dans tout le DS.
      tone: {
        info: "border-[var(--info)] [&_[data-glyphe]]:text-[var(--info)]",
        success: "border-[var(--success)] [&_[data-glyphe]]:text-[var(--success)]",
        warning: "border-[var(--warning)] [&_[data-glyphe]]:text-[var(--warning)]",
        error: "border-[var(--destructive-text)] [&_[data-glyphe]]:text-[var(--destructive-text)]",
      },
    },
    defaultVariants: { tone: "info" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastOptions {
  /** Message. Une phrase, au présent, qui dit ce qui vient de se passer. */
  message: string;
  tone?: ToastTone;
  /**
   * Durée avant disparition, en millisecondes. `null` = **ne disparaît pas**.
   *
   * WCAG 2.2.1 impose de pouvoir désactiver, ajuster ou prolonger toute limite
   * de temps. L'exception « temps réel » ne s'applique pas ici. Le défaut de
   * 6 s tient la règle par deux mécanismes : le compte à rebours **se met en
   * pause** au survol comme au focus clavier, et une commande de fermeture
   * reste toujours offerte.
   *
   * Pour un ton `error`, passer `null` : une erreur qu'on n'a pas eu le temps
   * de lire est une erreur perdue.
   */
  duration?: number | null;
  /** Action optionnelle — « Annuler », « Réessayer ». */
  action?: { label: string; onClick: () => void };
}

interface ToastInterne extends ToastOptions {
  id: number;
}

// ─── Contexte ─────────────────────────────────────────────────────────────────

const ContexteToast = createContext<((o: ToastOptions) => void) | null>(null);

/**
 * Déclenche un toast. Lance si aucun `ToastProvider` n'est monté — un message
 * avalé en silence est pire qu'une erreur : on croit avoir prévenu.
 */
export function useToast() {
  const ctx = useContext(ContexteToast);
  if (!ctx) {
    throw new Error(
      "useToast() sans <ToastProvider> au-dessus : le message ne serait affiché nulle part."
    );
  }
  return ctx;
}

// ─── Un toast ─────────────────────────────────────────────────────────────────

const GLYPHES: Record<ToastTone, string> = {
  info: "i",
  success: "✓",
  warning: "!",
  error: "✕",
};

/** Doublé en toutes lettres : la couleur et le glyphe ne portent pas le ton seuls. */
const TONS: Record<ToastTone, string> = {
  info: "Information",
  success: "Succès",
  warning: "Avertissement",
  error: "Erreur",
};

function Toast({
  toast,
  onClose,
}: {
  toast: ToastInterne;
  onClose: (id: number) => void;
}) {
  const [enPause, setEnPause] = useState(false);
  const restant = useRef(toast.duration ?? null);
  const debut = useRef(Date.now());

  useEffect(() => {
    if (restant.current === null || enPause) return;
    debut.current = Date.now();
    const t = window.setTimeout(() => onClose(toast.id), restant.current);
    return () => {
      window.clearTimeout(t);
      // Ce qui reste est mémorisé : sans ça, reprendre après une pause
      // relancerait le compte à zéro et le message resterait indéfiniment
      // tant que le pointeur le frôle par intermittence.
      if (restant.current !== null) {
        restant.current = Math.max(0, restant.current - (Date.now() - debut.current));
      }
    };
  }, [enPause, toast.id, onClose]);

  return (
    <div
      className={toastVariants({ tone: toast.tone ?? "info" })}
      onMouseEnter={() => setEnPause(true)}
      onMouseLeave={() => setEnPause(false)}
      // Le focus met en pause au même titre que le survol : sans ça, un
      // utilisateur au clavier qui atteint le bouton de fermeture le voit
      // disparaître sous ses doigts (WCAG 2.2.1).
      onFocusCapture={() => setEnPause(true)}
      onBlurCapture={() => setEnPause(false)}
    >
      <span
        data-glyphe
        aria-hidden="true"
        className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold"
      >
        {GLYPHES[toast.tone ?? "info"]}
      </span>

      <p className="m-0 flex-1 text-sm text-[var(--foreground)]">
        {/* Le ton écrit, pas seulement coloré (WCAG 1.4.1). En `sr-only` :
            à l'écran, la bordure et le glyphe le disent déjà. */}
        <span className="sr-only">{TONS[toast.tone ?? "info"]} : </span>
        {toast.message}
      </p>

      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onClose(toast.id);
          }}
          className={cn(
            "shrink-0 rounded-[calc(var(--radius)/2)] px-2 py-1 text-sm font-medium",
            "text-[var(--secondary)] underline underline-offset-2",
            "hover:bg-[var(--surface-hover)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          )}
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className={cn(
          "shrink-0 rounded-[calc(var(--radius)/2)] p-1 text-muted-foreground",
          "hover:bg-[var(--surface-hover)] hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        )}
      >
        <span aria-hidden="true">✕</span>
        {/* Le message est DANS le nom du bouton : sans lui, un lecteur d'écran
            qui liste les commandes entend « Fermer » autant de fois qu'il y a
            de toasts, sans savoir lequel il ferme. */}
        <span className="sr-only">Fermer : {toast.message}</span>
      </button>
    </div>
  );
}

// ─── Fournisseur ──────────────────────────────────────────────────────────────

export interface ToastProviderProps {
  children: ReactNode;
  /** Nombre maximal de toasts empilés. Au-delà, le plus ancien sort. */
  max?: number;
  className?: string;
}

/**
 * Pile de messages transitoires.
 *
 * **Deux régions live, pas une.** Les toasts `error` vont dans une région
 * `alert` (assertive), qui interrompt la lecture en cours ; tous les autres
 * dans une région `status` (polie), qui attend une pause. Une seule région
 * aurait forcé à choisir entre interrompre pour un simple « Enregistré » ou
 * laisser passer un échec de publication.
 *
 * **Le conteneur est monté en permanence**, vide ou non. Une région live
 * insérée dans le document EN MÊME TEMPS que son contenu n'est pas annoncée :
 * les technologies d'assistance n'observent que les régions déjà présentes.
 *
 * Le contenu est positionné en bas, hors du chemin du contenu principal, et
 * `pointer-events-none` sur le conteneur laisse cliquer à travers la zone
 * vide — un empilement de toasts ne doit pas bloquer la page.
 */
export function ToastProvider({ children, max = 3, className }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastInterne[]>([]);
  const prochainId = useRef(0);

  const fermer = useCallback((id: number) => {
    setToasts((l) => l.filter((t) => t.id !== id));
  }, []);

  const pousser = useCallback(
    (o: ToastOptions) => {
      const id = prochainId.current++;
      setToasts((l) => [...l, { ...o, id }].slice(-max));
    },
    [max]
  );

  const polis = toasts.filter((t) => (t.tone ?? "info") !== "error");
  const urgents = toasts.filter((t) => (t.tone ?? "info") === "error");

  return (
    <ContexteToast.Provider value={pousser}>
      {children}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-4 z-50",
          "flex flex-col items-center gap-2 px-4",
          className
        )}
      >
        <div role="status" aria-live="polite" className="contents">
          {polis.map((t) => (
            <Toast key={t.id} toast={t} onClose={fermer} />
          ))}
        </div>
        <div role="alert" className="contents">
          {urgents.map((t) => (
            <Toast key={t.id} toast={t} onClose={fermer} />
          ))}
        </div>
      </div>
    </ContexteToast.Provider>
  );
}

export { toastVariants };
export type { VariantProps };
