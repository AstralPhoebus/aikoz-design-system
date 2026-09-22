import { useEffect, useState } from "react";
import { Star, StarFill, ArrowUpward } from "@material-symbols-svg/react/rounded";
import { contrast, cssVar } from "./contrast";

/**
 * Page de décisions.
 *
 * Rien ici n'est un composant du design system : ce sont des maquettes de
 * comparaison, écrites pour rendre un arbitrage visible. Elles vivent dans le
 * playground et n'ont pas vocation à être extraites.
 *
 * Historique de cadrage — les décisions 1 et 2 étaient d'abord posées en
 * « A ou B ». C'était faux : la 1 oppose deux VARIANTES d'un même composant,
 * la 2 deux COMPOSANTS distincts qui coexistent. Reformulées en conséquence.
 */

type Status = "ouverte" | "tranchée" | "reformulée";

const STATUS_STYLE: Record<Status, string> = {
  ouverte:
    "border-[var(--destructive-text)] text-[var(--destructive-text)] bg-[color-mix(in_oklch,var(--destructive-text),transparent_94%)]",
  tranchée:
    "border-[var(--success)] text-[var(--success)] bg-[color-mix(in_oklch,var(--success),transparent_94%)]",
  reformulée:
    "border-[var(--secondary)] text-[var(--secondary)] bg-[color-mix(in_oklch,var(--secondary),transparent_94%)]",
};

function Decision({
  n,
  title,
  status,
  question,
  children,
  impact,
  outcome,
}: {
  n: number;
  title: string;
  status: Status;
  question: React.ReactNode;
  children: React.ReactNode;
  impact: React.ReactNode;
  outcome: React.ReactNode;
}) {
  return (
    <section className="mb-16 pb-16 border-b border-border last:border-0">
      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)] text-sm font-bold shrink-0">
          {n}
        </span>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <span
          className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${STATUS_STYLE[status]}`}
        >
          {status}
        </span>
      </div>
      <div className="text-base text-foreground mb-6 max-w-2xl">{question}</div>

      <div className="mb-6">{children}</div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-[var(--radius)] bg-muted p-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Ce que ça change
          </h4>
          <div className="text-sm text-foreground">{impact}</div>
        </div>
        <div className="rounded-[var(--radius)] border border-border p-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {status === "tranchée" ? "Décision prise" : "Ce que je propose"}
          </h4>
          <div className="text-sm text-foreground">{outcome}</div>
        </div>
      </div>
    </section>
  );
}

function Panel({
  tag,
  label,
  source,
  children,
  tone = "neutral",
}: {
  tag?: string;
  label: string;
  source: string;
  children: React.ReactNode;
  tone?: "neutral" | "retenu" | "écarté";
}) {
  const ring =
    tone === "retenu"
      ? "border-[var(--success)]"
      : tone === "écarté"
      ? "border-border opacity-60"
      : "border-border";
  return (
    <div className="flex-1 min-w-[250px] flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {tag && (
          <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full border border-border text-xs font-bold text-foreground shrink-0">
            {tag}
          </span>
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
            {label}
            {tone === "retenu" && (
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--success)]">
                retenu
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{source}</div>
        </div>
      </div>
      <div
        className={`rounded-[var(--radius)] border bg-card p-5 flex-1 flex items-start ${ring}`}
      >
        {children}
      </div>
    </div>
  );
}

const Face = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap gap-6 items-stretch">{children}</div>
);

// ─── 1 · KpiCard — variantes par nature de métrique ───────────────────────────

function Stars({ color, value = 4 }: { color: string; value?: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} sur 5 étoiles`}>
      {Array.from({ length: 5 }).map((_, i) =>
        i < value ? (
          <StarFill key={i} className="w-5 h-5" style={{ color }} aria-hidden="true" />
        ) : (
          <Star key={i} className="w-5 h-5 text-muted-foreground/30" aria-hidden="true" />
        )
      )}
    </div>
  );
}

function Delta({ v }: { v: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5 border border-[var(--success)] bg-[color-mix(in_oklch,var(--success),transparent_92%)] text-[var(--success)]">
      <ArrowUpward className="w-3 h-3" aria-hidden="true" />
      {v}
    </span>
  );
}

function Sparkline() {
  const pts = [3.6, 3.7, 3.8, 3.7, 3.9, 4.0, 3.9, 4.1, 4.0, 4.2, 4.2, 4.3];
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const d = pts
    .map((p, i) => `${(i / (pts.length - 1)) * 100},${28 - ((p - min) / (max - min)) * 24}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="w-full h-8"
      aria-hidden="true"
    >
      <polyline
        points={d}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Maquette de l'API proposée : variant × density, deux axes indépendants. */
function KpiVariant({ variant }: { variant: "rating" | "target" | "trend" }) {
  const head = {
    rating: ["Note moyenne", "4,2", "/5", "0,1"],
    target: ["Taux de réponse", "87", "%", "4,2 pts"],
    trend: ["Avis traités", "312", "", "18"],
  }[variant];

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-muted-foreground">{head[0]}</span>
        <Delta v={head[3]} />
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-foreground">{head[1]}</span>
        <span className="text-base font-medium text-muted-foreground">{head[2]}</span>
      </div>

      {variant === "rating" && <Stars color="var(--color-warning-600)" />}

      {variant === "target" && (
        <>
          <div
            className="h-2 w-full rounded-full bg-muted overflow-hidden"
            role="img"
            aria-label="87 % de l'objectif de 90 %"
          >
            <div
              className="h-full rounded-full bg-[var(--success)]"
              style={{ width: "87%" }}
            />
          </div>
          <span className="text-xs text-muted-foreground">Objectif · 90 %</span>
        </>
      )}

      {variant === "trend" && (
        <>
          <Sparkline />
          <span className="text-xs text-muted-foreground">30 derniers jours</span>
        </>
      )}
    </div>
  );
}

// ─── 2 · Navigation — coexistence ─────────────────────────────────────────────

const SECTIONS = ["Marché", "Campagnes", "Hall of Fames", "Paramètres"];
const VIEWS = ["Vue d'ensemble", "Par agence", "Par source"];

function NavCoexist() {
  return (
    <div className="w-full flex gap-4">
      {/* SidebarNav — navigation globale, des liens */}
      <nav
        aria-label="Démo navigation principale"
        className="w-40 shrink-0 flex flex-col gap-1"
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          SidebarNav
        </span>
        {SECTIONS.map((n, i) => (
          <span
            key={n}
            aria-current={i === 0 ? "page" : undefined}
            className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] text-sm ${
              i === 0
                ? "bg-[color-mix(in_oklch,var(--secondary),transparent_88%)] text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            <span
              className={`w-3 h-3 rounded-sm shrink-0 ${
                i === 0 ? "bg-[var(--secondary)]" : "bg-muted-foreground/40"
              }`}
            />
            <span className="truncate">{n}</span>
          </span>
        ))}
      </nav>

      {/* ViewTabs — bascule de vue, dans la page */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          ViewTabs
        </span>
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {VIEWS.map((v, i) => (
            <span
              key={v}
              className={`px-3 py-2 text-sm -mb-px border-b-2 whitespace-nowrap ${
                i === 0
                  ? "border-[var(--secondary)] text-foreground font-medium"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {v}
            </span>
          ))}
        </div>
        <div className="flex-1 rounded-[var(--radius)] bg-muted min-h-[92px]" />
      </div>
    </div>
  );
}

function ContractTable() {
  const rows: [string, string, string][] = [
    ["Rôle", "navigation entre sections", "bascule de vue dans la page"],
    ["Sémantique", "<nav> + liens", 'role="tablist" / role="tab"'],
    ["État courant", 'aria-current="page"', 'aria-selected="true"'],
    ["Clavier", "Tab de lien en lien", "flèches ← → + roving tabindex"],
    ["Effet", "change la route", "échange un panneau, même route"],
  ];
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[520px]">
        <thead>
          <tr>
            {["", "SidebarNav", "ViewTabs"].map((h) => (
              <th
                key={h}
                className="text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-2 pr-4"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, a, b]) => (
            <tr key={k}>
              <td className="border-t border-border py-2 pr-4 text-muted-foreground whitespace-nowrap">
                {k}
              </td>
              <td className="border-t border-border py-2 pr-4 text-foreground font-mono text-xs">
                {a}
              </td>
              <td className="border-t border-border py-2 text-foreground font-mono text-xs">
                {b}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 3 · Letter-spacing ───────────────────────────────────────────────────────

const NUMBERS = ["1 248", "312", "4 807", "1 111"];

function TypeSample({ longhand }: { longhand: boolean }) {
  const base: React.CSSProperties = longhand
    ? {
        fontFamily: "var(--role-typography-label-sm-font-family)",
        fontSize: "var(--role-typography-label-sm-font-size)",
        fontWeight: "var(--role-typography-label-sm-font-weight)" as any,
        lineHeight: "var(--role-typography-label-sm-line-height)" as any,
        letterSpacing: "var(--role-typography-label-sm-letter-spacing)",
      }
    : // Le shorthand n'existe plus dans le build : valeurs figées pour conserver
      // la démonstration de ce qu'il jetait.
      { font: "500 0.625rem/2 Inter, sans-serif" };

  const numeric: React.CSSProperties = longhand
    ? {
        fontFamily: "var(--role-typography-metric-font-family)",
        fontSize: "var(--dimension-font-size-xl)",
        fontWeight: "var(--role-typography-metric-font-weight)" as any,
        lineHeight: "var(--role-typography-metric-line-height)" as any,
      }
    : { font: '500 1.25rem/1.15 "JetBrains Mono", monospace' };

  const [read, setRead] = useState<{ ls: string; vn: string } | null>(null);
  const id = `ls-${longhand ? "b" : "a"}`;

  useEffect(() => {
    const a = document.getElementById(id);
    const b = document.getElementById(id + "-num");
    if (!a || !b) return;
    setRead({
      ls: getComputedStyle(a).letterSpacing,
      vn: getComputedStyle(b).fontVariantNumeric,
    });
  }, [longhand]);

  return (
    // `tabular-nums` posé ici, sur le conteneur : c'est le cas réel — la propriété
    // vient d'un ancêtre, et le shorthand `font` la réinitialise.
    <div
      className="w-full flex flex-col gap-4"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          label-sm · tracking déclaré : wider (0.05em)
        </div>
        <div id={id} style={base} className="text-foreground">
          AVIS TRAITÉS CE MOIS
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          metric · chiffres alignés ?
        </div>
        <div id={id + "-num"} style={numeric} className="text-foreground">
          {NUMBERS.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
      </div>

      {read && (
        <div className="text-xs font-mono flex flex-col gap-0.5 pt-2 border-t border-border">
          <span
            className={
              read.ls === "normal"
                ? "text-[var(--destructive-text)]"
                : "text-[var(--success)]"
            }
          >
            letter-spacing : {read.ls}
          </span>
          <span
            className={
              read.vn === "normal"
                ? "text-[var(--destructive-text)]"
                : "text-[var(--success)]"
            }
          >
            variant-numeric : {read.vn}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── 4 · Couleur de notation ──────────────────────────────────────────────────

const RATING_STEPS = [400, 500, 600, 700];

function RatingRamp({ dark }: { dark: boolean }) {
  const [rows, setRows] = useState<
    { step: number; color: string; ratio: number | null }[]
  >([]);

  useEffect(() => {
    const card = cssVar("--card");
    setRows(
      RATING_STEPS.map((step) => {
        const color = cssVar(`--color-warning-${step}`);
        return { step, color, ratio: color ? contrast(color, card) : null };
      })
    );
  }, [dark]);

  return (
    <div className="w-full flex flex-col gap-3">
      {rows.map(({ step, color, ratio }) => {
        const ok = ratio !== null && ratio >= 3;
        const chosen = step === 700;
        return (
          <div
            key={step}
            className={`flex items-center gap-3 flex-wrap rounded-[var(--radius)] px-2 ${
              chosen
                ? "bg-[color-mix(in_oklch,var(--success),transparent_94%)] py-1"
                : ""
            }`}
          >
            <span className="w-14 shrink-0 text-xs font-mono text-muted-foreground">
              {step}
              {chosen ? " ←" : ""}
            </span>
            <Stars color={color} />
            <span
              className={`text-xs font-mono ${
                ok ? "text-[var(--success)]" : "text-[var(--destructive-text)]"
              }`}
            >
              {ratio === null ? "—" : `${ratio.toFixed(2)}:1 ${ok ? "OK" : "échec"}`}
            </span>
          </div>
        );
      })}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        Seuil 3:1 — WCAG 1.4.11. Bascule le thème : la rampe s'inverse, et 600 reste le
        seul palier conforme des deux côtés.
      </div>
    </div>
  );
}

function StarOption({ color, dark }: { color: string; dark: boolean }) {
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => {
    const m = color.match(/^var\(\s*(--[^),\s]+)/);
    setRatio(contrast(m ? cssVar(m[1]) : color, cssVar("--card")));
  }, [color, dark]);

  const ok = ratio !== null && ratio >= 3;
  return (
    <div className="w-full flex flex-col gap-3">
      <Stars color={color} />
      <div className="text-xs font-mono text-muted-foreground break-all">{color}</div>
      <div className="text-xs font-mono pt-2 border-t border-border">
        <span className={ok ? "text-[var(--success)]" : "text-[var(--destructive-text)]"}>
          {ratio === null ? "—" : `${ratio.toFixed(2)}:1 vs carte · ${ok ? "OK" : "échec"}`}
        </span>
      </div>
    </div>
  );
}

// ─── 5 · VerbatimCard ─────────────────────────────────────────────────────────

function SentimentTag({ kind }: { kind: "positive" | "negative" | "neutral" }) {
  const map = {
    positive: ["var(--success)", "Positif"],
    negative: ["var(--destructive-text)", "Négatif"],
    neutral: ["var(--muted-foreground)", "Neutre"],
  } as const;
  const [color, label] = map[kind];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 border"
      style={{
        color,
        borderColor: color,
        background: `color-mix(in oklch, ${color}, transparent 92%)`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function VerbatimCardMockup() {
  return (
    <div className="w-full max-w-[420px] flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <Stars color="var(--color-warning-600)" value={4} />
          <span className="text-xs text-muted-foreground">
            Google · Allianz Lyon Centre · 12 août 2026
          </span>
        </div>
        <SentimentTag kind="positive" />
      </div>
      <p className="text-sm text-foreground leading-relaxed">
        « Prise en charge rapide après mon sinistre, la conseillère a rappelé le
        lendemain comme promis. Un peu de retard sur l'expertise, mais rien de bloquant. »
      </p>
      <div className="flex gap-2 flex-wrap pt-1">
        {["Réactivité", "Expertise"].map((t) => (
          <span
            key={t}
            className="text-xs rounded-full px-2 py-0.5 bg-muted text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Decisions({ dark }: { dark: boolean }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-10 max-w-2xl">
        Les cinq décisions sont prises. Tout est rendu avec les vrais tokens —
        bascule le thème pour vérifier en dark. Ces maquettes servent à rendre un choix
        visible ; ce ne sont pas des composants du design system.
      </p>

      <Decision
        n={1}
        status="tranchée"
        title="KpiCard — deux axes, variant × density"
        question={
          <>
            Ce n'était pas « quelle carte ». Les deux affichent des métriques de nature
            différente et fonctionnent toutes les deux. Le problème est que l'API indexe
            la richesse sur <code className="font-mono text-xs">size</code>, ce qui mélange{" "}
            <strong>la place disponible</strong> et{" "}
            <strong>la nature de la donnée</strong>.
          </>
        }
        impact={
          <>
            <strong>L'extraction n'est plus bloquée.</strong>{" "}
            <code className="font-mono text-xs">ScoreStars</code>,{" "}
            <code className="font-mono text-xs">DeltaBadge</code> et{" "}
            <code className="font-mono text-xs">ProgressBar</code> deviennent les briques
            d'appui que les variantes composent — on les extrait sans attendre.{" "}
            <code className="font-mono text-xs">ProgressBar</code> entre en v1 (composant
            Figma existant).
          </>
        }
        outcome={
          <>
            Deux axes indépendants :{" "}
            <code className="font-mono text-xs">
              variant = rating | target | trend | raw
            </code>{" "}
            pour ce que la donnée <em>est</em>, et{" "}
            <code className="font-mono text-xs">density</code> pour la place qu'on lui
            donne. Aujourd'hui <code className="font-mono text-xs">size="lg"</code> force
            la sparkline : impossible d'avoir une note en étoiles dans une grande carte.
            <br />
            <br />
            <strong>À valider avec Louis :</strong> dans les maquettes les 4 cartes
            portent une barre, y compris « Avis traités · 312 » dont le sous-texte est
            « 30 derniers jours ». Une barre suppose un dénominateur — 312 sur combien ?
          </>
        }
      >
        <Face>
          <Panel tag="1" label="variant rating" source="échelle bornée 0–5 → étoiles">
            <KpiVariant variant="rating" />
          </Panel>
          <Panel tag="2" label="variant target" source="bornée, avec objectif → barre">
            <KpiVariant variant="target" />
          </Panel>
          <Panel tag="3" label="variant trend" source="non bornée → tendance">
            <KpiVariant variant="trend" />
          </Panel>
        </Face>
      </Decision>

      <Decision
        n={2}
        status="tranchée"
        title="Navigation — deux composants, deux contrats"
        question={
          <>
            Ce n'était pas « Sidebar ou Tabs ». Ce sont deux composants distincts qui{" "}
            <strong>coexistent dans le même écran</strong> : la sidebar navigue entre
            sections, les tabs basculent de vue dans une page. Ils n'ont pas le même
            contrat d'accessibilité.
          </>
        }
        impact={
          <>
            Les deux entrent en v1. Ils partagent les <strong>tokens</strong>, pas le
            composant : <code className="font-mono text-xs">NavItem</code> ressemble à un
            onglet, mais mutualiser ferait fuiter la mauvaise sémantique.
          </>
        }
        outcome={
          <>
            <strong>C'est le comportement qui décide, jamais l'apparence.</strong> Si un
            « onglet » change de route, c'est un lien stylé en onglet — l'implémenter en{" "}
            <code className="font-mono text-xs">role="tab"</code> annonce à un lecteur
            d'écran un panneau qui va s'échanger, alors que la page entière est remplacée.
            C'est un des bugs d'a11y les plus fréquents. Règle à écrire dans le DS.
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <Panel
            label="Coexistence dans un même écran"
            source="sidebar globale + tabs de vue"
          >
            <NavCoexist />
          </Panel>
          <ContractTable />
        </div>
      </Decision>

      <Decision
        n={3}
        status="tranchée"
        title="Typographie — longhand"
        question="Le shorthand CSS font ne transportait pas le letter-spacing, et effaçait les chiffres tabulaires. Livré : les 14 rôles sortent désormais en longhand, 5 variables chacun."
        impact={
          <>
            5 variables par rôle au lieu d'1 (70 au total), deux lignes au lieu d'une côté
            composant. Coût de migration nul : aucun composant ne consomme encore ces
            variables.
          </>
        }
        outcome={
          <>
            <strong>Longhand retenu.</strong> Colonne A : le tracking déclaré est perdu et
            les chiffres ne s'alignent pas — sur le rôle{" "}
            <code className="font-mono text-xs">metric</code>, celui des KPI. Une couche
            de tokens qui jette des données source sans rien dire n'est pas fiable.
          </>
        }
      >
        <Face>
          <Panel tag="A" label="Shorthand font" source="ancien build · valeurs figées" tone="écarté">
            <TypeSample longhand={false} />
          </Panel>
          <Panel
            tag="B"
            label="Longhand"
            source="livré — var(--role-typography-*-…)"
            tone="retenu"
          >
            <TypeSample longhand={true} />
          </Panel>
        </Face>
      </Decision>

      <Decision
        n={4}
        status="tranchée"
        title="ScoreStars — role.color.rating, 700 en light / 600 en dark"
        question="StarRating colore les étoiles en text-amber-400 : la seule couleur hors tokens de tout le code livré."
        impact={
          <>
            Une couleur Tailwind brute ne suit ni le thème ni le white-label : chez
            Generali, les étoiles resteraient ambre. Nouveau rôle à créer — aucun rôle
            existant ne porte la sémantique « notation ».
          </>
        }
        outcome={
          <>
            <strong>
              <code className="font-mono text-xs">role.color.rating</code> →{" "}
              <code className="font-mono text-xs">warning-600</code>.
            </strong>{" "}
            Corrigé après coup : le palier 600 n'avait été mesuré que contre --card. Sur --background (2,98) et --muted (2,73) il échoue. Retenu : 700 en light (5,13 / 4,70 / 4,30), 600 en dark (5,35 / 5,99 / 5,35).
            La marge est courte en light — si un jour la carte s'assombrit, c'est le
            premier ratio à retester.
          </>
        }
      >
        <Face>
          <Panel
            tag="A"
            label="text-amber-400"
            source="code actuel · hors tokens"
            tone="écarté"
          >
            <StarOption color="#fbbf24" dark={dark} />
          </Panel>
          <Panel
            tag="B"
            label="rampe warning"
            source="mesuré contre --card"
            tone="retenu"
          >
            <RatingRamp dark={dark} />
          </Panel>
        </Face>
      </Decision>

      <Decision
        n={5}
        status="tranchée"
        title="VerbatimCard — au périmètre v1"
        question="Absente de la liste de Louis et du Figma. Mais le Figma contient un atome Tag avec 3 variantes de sentiment, sans aucun usage maquetté."
        impact={
          <>
            +1 composant spécifique en v1.{" "}
            <code className="font-mono text-xs">ScoreStars</code> garde une raison d'être
            même si le KpiCard n'utilise les étoiles que dans sa variante{" "}
            <code className="font-mono text-xs">rating</code>. L'atome{" "}
            <code className="font-mono text-xs">Tag</code> du Figma trouve son emploi.
          </>
        }
        outcome={
          <>
            <strong>Prévue en v1.</strong> Un tag de sentiment ne se qualifie que sur un
            avis unitaire — quelqu'un a dessiné cet atome pour un écran jamais maquetté.
            Reste à confirmer côté produit le moment où le dashboard donne accès aux avis
            un par un, pour situer la priorité dans le lot.
          </>
        }
      >
        <Panel
          label="Proposition"
          source="maquette · réutilise l'atome Tag du Figma"
          tone="retenu"
        >
          <VerbatimCardMockup />
        </Panel>
      </Decision>
    </div>
  );
}
