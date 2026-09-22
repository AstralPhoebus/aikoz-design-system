import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@registry/aikoz/lib/utils";
import { Dialog } from "@registry/aikoz/dialog/dialog";
import { Button } from "@registry/aikoz/button/button";
import { Input } from "@registry/aikoz/input/input";
import { SlotPicker, type SlotDay } from "@registry/aikoz/slot-picker/slot-picker";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingValues {
  name: string;
  email: string;
  company?: string;
  slot: string;
}

export type BookingStatus = "form" | "sending" | "confirmed" | "failed";

export interface BookingFlowProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  days: SlotDay[];
  /**
   * État affiché. Contrôlé par l'appelant : c'est LUI qui parle au serveur,
   * ce composant ne fait que rendre l'état qu'on lui donne.
   */
  status?: BookingStatus;
  onSubmit?: (values: BookingValues) => void;
  /** Message d'échec. Il doit dire quoi faire, pas seulement que ça a raté. */
  failureMessage?: string;
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Prise de rendez-vous — la modale du tunnel du prototype site.
 *
 * **Ce composant ne parle à personne.** Il ne connaît ni serveur ni
 * `fetch` : l'appelant lui passe un `status` et reçoit un `onSubmit`. Un
 * composant de design system qui déclencherait lui-même un appel réseau
 * serait intestable et impossible à réutiliser — et il imposerait sa forme
 * d'API à toutes les applications qui l'installent.
 *
 * **Les deux états de confirmation ne remplacent pas la modale, ils la
 * remplissent.** Le titre reste le même repère, le contenu change. C'est ce
 * qui permet au focus de rester dans un dialogue déjà nommé plutôt que de
 * repartir de zéro.
 *
 * **Le changement d'état est annoncé ET reçoit le focus.** Deux mécanismes,
 * parce qu'ils ne servent pas la même personne : `role="status"` prévient
 * qui écoute, le focus déplacé emmène qui navigue au clavier là où se trouve
 * la suite. Sans le focus, l'utilisateur resterait sur un bouton
 * « Confirmer » qui n'existe plus, et repartirait du début du document.
 *
 * La validation se fait à la SOUMISSION, jamais à la frappe : corriger
 * quelqu'un pendant qu'il écrit affiche une erreur dès le premier caractère.
 */
export function BookingFlow({
  trigger,
  open,
  onOpenChange,
  title = "Réserver une démonstration",
  description = "Trente minutes, en visioconférence, avec un consultant.",
  days,
  status = "form",
  onSubmit,
  failureMessage = "L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez ; si le problème persiste, écrivez à contact@okuden.fr.",
  className,
}: BookingFlowProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [slot, setSlot] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof BookingValues, string>>>({});
  const finRef = useRef<HTMLParagraphElement>(null);
  // Le premier champ en erreur, pour y emmener le focus après une soumission
  // refusée. Sans lui l'utilisateur reste sur « Confirmer », trois `role=
  // "alert"` partent en même temps — les lecteurs d'écran en font la queue ou
  // en perdent — et il ne lui reste qu'à remonter le formulaire à tâtons.
  const nomRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const creneauRef = useRef<HTMLFieldSetElement>(null);

  // Le focus suit l'état. À l'arrivée d'une confirmation ou d'un échec, il
  // se pose sur le message : sans ça il resterait sur un bouton disparu.
  useEffect(() => {
    if (status === "confirmed" || status === "failed") finRef.current?.focus();
  }, [status]);

  /**
   * Valide, et rend le premier champ fautif — `null` si tout va bien.
   *
   * Rendre le champ plutôt qu'un booléen est ce qui permet d'y emmener le
   * focus. « Le formulaire est invalide » ne dit pas OÙ, et c'est justement
   * ce que l'utilisateur a besoin de savoir.
   */
  function valider(): "name" | "email" | "slot" | null {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Indiquez votre nom, pour savoir qui nous rencontrons.";
    // Volontairement permissif : une adresse valide au sens de la norme peut
    // ne pas ressembler à ce qu'on imagine. On refuse l'absence d'arobase ou
    // de domaine, pas les formes inhabituelles.
    if (!email.includes("@") || !email.split("@")[1]?.includes("."))
      e.email = "L'adresse doit contenir un domaine, par exemple prenom.nom@exemple.fr.";
    if (!slot) e.slot = "Choisissez un créneau pour poursuivre.";
    setErrors(e);
    // L'ordre est celui du formulaire : on emmène au PREMIER problème, pas au
    // premier trouvé par l'objet.
    return (["name", "email", "slot"] as const).find((k) => e[k]) ?? null;
  }

  const enCours = status === "sending";

  return (
    <Dialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={status === "form" ? description : undefined}
      className={className}
      footer={
        status === "form" ? (
          <Button
            onClick={() => {
              const fautif = valider();
              if (fautif) {
                // Le focus va au champ, pas au message : c'est là qu'on
                // corrige, et le message le suit par `aria-describedby`.
                if (fautif === "slot") {
                  // Un `<fieldset>` ne prend pas le focus. On vise le premier
                  // créneau SÉLECTIONNABLE : emmener sur un créneau complet
                  // serait emmener dans une impasse.
                  creneauRef.current
                    ?.querySelector<HTMLInputElement>(
                      'input[type="radio"]:not([disabled])',
                    )
                    ?.focus();
                } else {
                  (fautif === "name" ? nomRef : emailRef).current?.focus();
                }
                return;
              }
              onSubmit?.({ name, email, company: company || undefined, slot });
            }}
            disabled={enCours}
          >
            {enCours ? "Envoi…" : "Confirmer le rendez-vous"}
          </Button>
        ) : undefined
      }
    >
      {status === "form" && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              ref={nomRef}
              label="Nom"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              ref={emailRef}
              label="Adresse e-mail"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
          </div>
          <Input
            label="Établissement"
            optional
            autoComplete="organization"
            description="Cela nous permet de préparer des exemples de votre réseau."
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <SlotPicker
            ref={creneauRef}
            legend="Choisissez un créneau"
            days={days}
            value={slot}
            onValueChange={setSlot}
            error={errors.slot}
          />
        </div>
      )}

      {(status === "confirmed" || status === "failed") && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex size-12 items-center justify-center rounded-full",
              status === "confirmed"
                ? "bg-[var(--success-subtle)] text-[var(--success)]"
                : "bg-[var(--error-subtle)] text-[var(--destructive-text)]"
            )}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              {status === "confirmed" ? <path d="M4 12.5 9.5 18 20 6.5" /> : <path d="M12 7v6M12 17h.01" />}
            </svg>
          </span>
          {/* `tabIndex={-1}` : focalisable par script, jamais par tabulation.
              Le `role="status"` annonce, le focus emmène — deux canaux pour
              deux façons de naviguer. */}
          <p
            ref={finRef}
            tabIndex={-1}
            role="status"
            className="m-0 text-base font-semibold text-foreground focus-visible:outline-none"
          >
            {status === "confirmed"
              ? "C'est confirmé."
              : "Le rendez-vous n'a pas pu être enregistré."}
          </p>
          <p className="m-0 max-w-sm text-sm text-muted-foreground text-balance">
            {status === "confirmed"
              ? "Vous recevez une invitation par e-mail dans les prochaines minutes. Elle contient le lien de connexion."
              : failureMessage}
          </p>
        </div>
      )}
    </Dialog>
  );
}
