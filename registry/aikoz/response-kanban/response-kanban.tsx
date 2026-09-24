import { useEffect, useRef, useState } from "react";
import { KanbanBoard } from "@registry/aikoz/kanban-board/kanban-board";
import { Badge } from "@registry/aikoz/badge/badge";
import { Button } from "@registry/aikoz/button/button";
import { VerbatimCard } from "@registry/aikoz/verbatim-card/verbatim-card";
import { ReplyBubble } from "@registry/aikoz/reply-bubble/reply-bubble";
import { Textarea } from "@registry/aikoz/textarea/textarea";
import { EmptyState } from "@registry/aikoz/empty-state/empty-state";
import { Dialog } from "@registry/aikoz/dialog/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AutomatedReplyItem {
  id: string;
  rating: number;
  author?: string;
  date?: string;
  /** Réponse générée par l'IA, en attente de publication. */
  reply: string;
  /** « Programmée J+1 » par défaut. */
  scheduleLabel?: string;
}

export interface OffCharterReplyItem {
  id: string;
  rating: number;
  author?: string;
  date?: string;
  /** Texte de l'avis client. */
  text: string;
  /** Réponse déjà publiée, non conforme à la charte. */
  reply: string;
  /** Motif de non-conformité, ex. « Réponse déresponsabilisante · renvoi vers un tiers ». */
  reasonLabel: string;
}

export interface SensitiveReviewItem {
  id: string;
  rating: number;
  author?: string;
  date?: string;
  text: string;
  /** Catégorie qui rend l'avis sensible, ex. « Accessibilité PMR · sûreté ». */
  categoryLabel: string;
}

export interface ResponseKanbanProps {
  automated: AutomatedReplyItem[];
  offCharter: OffCharterReplyItem[];
  sensitive: SensitiveReviewItem[];
  /** Avis affichés avant « Voir plus » dans la colonne 1. */
  initialVisible?: number;
  /** « Enregistrer » de l'édition inline, colonne 1. */
  onSaveReply?: (id: string, text: string) => void;
  /**
   * « Rédiger une réponse » (colonne 3, direct) et « Rédiger une nouvelle
   * réponse » (colonne 2, depuis l'Overlay - Détail). Ce composant ne parle à
   * personne : il renvoie l'identifiant, l'espace conversationnel qui prend le
   * relais est hors de son périmètre.
   */
  onDraftReply?: (id: string) => void;
  /**
   * Remplace le titre et le sous-titre d'une colonne.
   *
   * Les intitulés sont du CONTENU, pas de la structure : « Avis 4-5 étoiles
   * sans commentaire · publication J+1 » dit la règle de ce client-là, et le
   * suivant en aura une autre. Ce qui appartient au composant, c'est
   * l'ordre des colonnes, leur ton, et le fait que chacune soit une section
   * nommée par son titre.
   *
   * Les valeurs par défaut restent celles du produit.
   */
  labels?: Partial<
    Record<"automated" | "offCharter" | "sensitive", { title?: string; subtitle?: string }>
  >;
  className?: string;
}

// ─── Colonne 1 — Réponses automatisées ─────────────────────────────────────

function AutomatedColumn({
  items,
  visibleCount,
  onShowMore,
  onSave,
}: {
  items: AutomatedReplyItem[];
  visibleCount: number;
  onShowMore: () => void;
  onSave?: (id: string, text: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  // ── Reprise du focus ──────────────────────────────────────────────────────
  //
  // Trois commandes de cette colonne se retirent elles-mêmes du document :
  // « Modifier » (remplacé par le champ), « Voir plus » (plus rien à
  // révéler), « Annuler »/« Enregistrer » (l'édition se referme). Un élément
  // focalisé qui disparaît renvoie le focus sur `body` : au clavier, on
  // repart du haut du document, et un lecteur d'écran perd sa place. À chaque
  // fois, le focus est donc porté explicitement sur ce qui prend la suite.
  const boutonsModifier = useRef<Record<string, HTMLButtonElement | null>>({});
  const ancreRevelee = useRef<HTMLDivElement | null>(null);
  const [aRefocaliser, setARefocaliser] = useState<string | null>(null);
  const [indexRevele, setIndexRevele] = useState<number | null>(null);

  useEffect(() => {
    if (!aRefocaliser) return;
    boutonsModifier.current[aRefocaliser]?.focus();
    setARefocaliser(null);
  }, [aRefocaliser]);

  useEffect(() => {
    if (indexRevele === null) return;
    // La première carte révélée, et non son premier bouton : c'est le point
    // d'où l'utilisateur veut reprendre la LECTURE, pas une action qu'on
    // choisirait à sa place.
    ancreRevelee.current?.focus();
    setIndexRevele(null);
  }, [indexRevele]);

  const quitterEdition = (id: string) => {
    setEditingId(null);
    setARefocaliser(id);
  };

  if (items.length === 0) {
    return (
      <EmptyState
        density="compact"
        title="Aucune réponse automatisée en attente"
        description="Les nouvelles réponses générées par l'IA apparaîtront ici avant leur publication."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.slice(0, visibleCount).map((item, i) => {
        const isEditing = editingId === item.id;
        const estAncre = indexRevele !== null && i === indexRevele;
        return (
          <div
            key={item.id}
            // `tabIndex={-1}` : atteignable par script, jamais par Tab. Le
            // conteneur n'est une cible de focus qu'à l'instant où « Voir
            // plus » vient de le révéler.
            tabIndex={-1}
            ref={estAncre ? ancreRevelee : undefined}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[var(--radius)]"
          >
            {/* `text=""` : ces avis sont, par construction (cf. spec), 4-5
                étoiles SANS commentaire — VerbatimCard exige `text`, on lui
                passe la chaîne vide plutôt que d'inventer un texte qui
                n'existe pas.

                Ce commentaire était écrit en `//` au milieu d'enfants JSX :
                il s'AFFICHAIT, trois lignes de code au-dessus de chaque
                réponse automatique. Dans du JSX, seule la forme accolade +
                bloc est un commentaire ; `//` est du texte. */}
            <VerbatimCard rating={item.rating} author={item.author} date={item.date} text="" density="compact">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  label="Modifier la réponse"
                  labelHidden
                  rows={3}
                  // Le champ vient d'être demandé explicitement par
                  // « Modifier » : lui donner le focus, c'est suivre
                  // l'intention, pas la devancer.
                  autoFocus
                  defaultValue={draft[item.id] ?? item.reply}
                  onChange={(e) => setDraft((d) => ({ ...d, [item.id]: e.target.value }))}
                  // Échap = Annuler, cf. règle a11y de la spec « Champ de texte
                  // libre » : l'édition inline reste pilotable au clavier sans
                  // quitter le champ.
                  onKeyDown={(e) => {
                    if (e.key === "Escape") quitterEdition(item.id);
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => quitterEdition(item.id)}>
                    Annuler
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onSave?.(item.id, draft[item.id] ?? item.reply);
                      quitterEdition(item.id);
                    }}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <ReplyBubble origin="ai">{item.reply}</ReplyBubble>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge tone="info" size="sm">
                    {item.scheduleLabel ?? "Programmée J+1"}
                  </Badge>
                  <Button
                    ref={(n) => {
                      boutonsModifier.current[item.id] = n;
                    }}
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingId(item.id)}
                  >
                    Modifier
                  </Button>
                </div>
              </div>
            )}
          </VerbatimCard>
          </div>
        );
      })}

      {items.length > visibleCount && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            setIndexRevele(visibleCount);
            onShowMore();
          }}
        >
          Voir plus ({items.length - visibleCount})
        </Button>
      )}
    </div>
  );
}

// ─── Colonne 2 — Réponses hors charte ──────────────────────────────────────

function OffCharterColumn({
  items,
  onDraftReply,
}: {
  items: OffCharterReplyItem[];
  onDraftReply?: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        density="compact"
        title="Aucune réponse hors charte à corriger"
        description="Les réponses publiées non conformes à la charte éditoriale apparaîtront ici."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <VerbatimCard key={item.id} rating={item.rating} author={item.author} date={item.date} text={item.text} density="compact">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge tone="warning" size="sm">
              {item.reasonLabel}
            </Badge>

            {/* Overlay - Détail : composition de Dialog, pas un composant à
                part. Dialog couvre déjà tout ce que demandait cette fiche —
                placement centré, titre obligatoire, piège de focus, Échap,
                retour du focus au déclencheur — le construire à nouveau
                aurait dupliqué exactement cette mécanique. */}
            <Dialog
              trigger={
                <Button variant="ghost" size="sm">
                  Voir la réponse
                </Button>
              }
              title="Détail de l'avis"
              description={item.reasonLabel}
              footer={
                <Button onClick={() => onDraftReply?.(item.id)}>Rédiger une nouvelle réponse</Button>
              }
            >
              <div className="flex flex-col gap-3">
                <VerbatimCard
                  rating={item.rating}
                  author={item.author}
                  date={item.date}
                  text={item.text}
                  density="compact"
                />
                {/* showOrigin=false : dans cette relecture, ce qui compte est
                    le texte non conforme à la charte, pas qui l'a écrit. */}
                <ReplyBubble origin="ai" showOrigin={false}>{item.reply}</ReplyBubble>
              </div>
            </Dialog>
          </div>
        </VerbatimCard>
      ))}
    </div>
  );
}

// ─── Colonne 3 — Avis sensibles ─────────────────────────────────────────────

function SensitiveColumn({
  items,
  onDraftReply,
}: {
  items: SensitiveReviewItem[];
  onDraftReply?: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        density="compact"
        title="Aucun avis sensible à traiter"
        description="Les avis à traiter immédiatement (sûreté, accessibilité…) apparaîtront ici."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <VerbatimCard key={item.id} rating={item.rating} author={item.author} date={item.date} text={item.text} density="compact">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge tone="error" size="sm">
              {item.categoryLabel}
            </Badge>
            {/* Pas d'Overlay intermédiaire ici, contrairement à la colonne 2 :
                la spec renvoie directement vers l'espace conversationnel. */}
            <Button size="sm" onClick={() => onDraftReply?.(item.id)}>
              Rédiger une réponse
            </Button>
          </div>
        </VerbatimCard>
      ))}
    </div>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Kanban de réponses — vue de supervision en 3 colonnes fixes, classées par
 * urgence croissante de gauche à droite : réponses automatisées à valider
 * avant publication, réponses déjà publiées hors charte à corriger, avis
 * sensibles à traiter immédiatement.
 *
 * **Composite, pas un atome** : il assemble des briques déjà du registry
 * (`Card`, `Badge`, `Button`, `VerbatimCard`, `EmptyState`, `Dialog`) et de
 * nouvelles (`ReplyBubble`, `Textarea`, `CountBadge`). Il ne réinvente aucune
 * mécanique d'accessibilité que ces briques fournissent déjà.
 *
 * Trois colonnes fixes, non paramétrables à ce stade — cf. la spec de Louis.
 * Comportement en dessous de 1024px : empilement vertical par défaut
 * (`grid-cols-1` → `md:grid-cols-3`), à valider avec Louis (« à définir » dans
 * la spec).
 */
export function ResponseKanban({
  automated,
  offCharter,
  sensitive,
  initialVisible = 3,
  onSaveReply,
  onDraftReply,
  labels,
  className,
}: ResponseKanbanProps) {
  const [visibleAutomated, setVisibleAutomated] = useState(initialVisible);

  return (
    <KanbanBoard
      className={className}
      columns={[
        {
          key: "automated",
          title: labels?.automated?.title ?? "Réponses automatisées",
          subtitle: labels?.automated?.subtitle ?? "À valider avant publication J+1",
          tone: "info",
          count: automated.length,
          children: (
            <AutomatedColumn
              items={automated}
              visibleCount={visibleAutomated}
              onShowMore={() => setVisibleAutomated((v) => v + automated.length)}
              onSave={onSaveReply}
            />
          ),
        },
        {
          key: "off-charter",
          title: labels?.offCharter?.title ?? "Réponses hors charte",
          subtitle: labels?.offCharter?.subtitle ?? "Publiées, à corriger",
          tone: "warning",
          count: offCharter.length,
          children: <OffCharterColumn items={offCharter} onDraftReply={onDraftReply} />,
        },
        {
          key: "sensitive",
          title: labels?.sensitive?.title ?? "Avis sensibles",
          subtitle: labels?.sensitive?.subtitle ?? "À traiter immédiatement",
          tone: "error",
          count: sensitive.length,
          children: <SensitiveColumn items={sensitive} onDraftReply={onDraftReply} />,
        },
      ]}
    />
  );
}
