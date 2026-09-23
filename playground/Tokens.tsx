import { useEffect, useState } from "react";
import { contrast } from "./contrast";

/**
 * Page de contrôle des tokens.
 *
 * Ne contient AUCUNE liste de tokens en dur : elle lit les custom properties
 * réellement chargées dans le document (feuilles de style + @import récursifs),
 * puis résout chaque valeur via getComputedStyle. Conséquence : tout token
 * ajouté, renommé ou supprimé dans tokens/ apparaît ici au rebuild, sans
 * toucher à ce fichier. C'est un outil de contrôle, pas un composant du DS.
 */

// ─── Collecte des variables ───────────────────────────────────────────────────

function collectNames(sheet: CSSStyleSheet, acc: Set<string>, seen: Set<CSSStyleSheet>) {
  if (seen.has(sheet)) return;
  seen.add(sheet);

  let rules: CSSRuleList;
  try {
    rules = sheet.cssRules;
  } catch {
    return; // feuille cross-origin — ignorée
  }

  for (const rule of Array.from(rules)) {
    // @import → on descend dans la feuille importée (build/index.css en a 6)
    if (rule instanceof CSSImportRule && rule.styleSheet) {
      collectNames(rule.styleSheet, acc, seen);
      continue;
    }
    const style = (rule as CSSStyleRule).style;
    if (!style) continue;
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      if (prop.startsWith("--")) acc.add(prop);
    }
  }
}

function useCssVars(themeKey: string) {
  const [vars, setVars] = useState<Record<string, string>>({});

  useEffect(() => {
    const names = new Set<string>();
    const seen = new Set<CSSStyleSheet>();
    for (const sheet of Array.from(document.styleSheets)) {
      collectNames(sheet as CSSStyleSheet, names, seen);
    }
    const cs = getComputedStyle(document.documentElement);
    const out: Record<string, string> = {};
    names.forEach((n) => {
      const v = cs.getPropertyValue(n).trim();
      if (v) out[n] = v;
    });
    setVars(out);
    // themeKey = thème + registre : les valeurs résolues changent avec les deux
  }, [themeKey]);

  return vars;
}

const byPrefix = (vars: Record<string, string>, prefix: string) =>
  Object.entries(vars)
    .filter(([n]) => n.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));

/**
 * Tri d'une échelle dimensionnelle par valeur croissante, pas par nom :
 * l'ordre alphabétique donne « 4xl, 5xl, lg, md, sm, xl, xs », illisible.
 * Les valeurs non numériques (ex. radius `full` = 9999px) finissent en queue.
 */
const byScale = (vars: Record<string, string>, prefix: string) =>
  byPrefix(vars, prefix).sort(([, a], [, b]) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
    if (Number.isNaN(na)) return 1;
    if (Number.isNaN(nb)) return -1;
    // rem et px cohabitent (spacing hairline) — on ramène rem en px pour comparer
    const toPx = (v: string, n: number) => (v.includes("rem") ? n * 16 : n);
    return toPx(a, na) - toPx(b, nb);
  });

// ─── Briques d'affichage ──────────────────────────────────────────────────────

function Section({
  title,
  count,
  note,
  children,
}: {
  title: string;
  count?: number;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {count !== undefined && (
          <span className="text-xs font-mono text-muted-foreground">{count}</span>
        )}
      </div>
      {note && <p className="text-sm text-muted-foreground mb-4 max-w-2xl">{note}</p>}
      <div className={note ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

function VarName({ name }: { name: string }) {
  return (
    <code className="text-xs font-mono text-muted-foreground break-all">{name}</code>
  );
}

/** Bandeau d'alerte — sert à signaler un écart constaté, pas à décorer. */
function Flag({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-[var(--radius)] border border-[var(--destructive-text)] bg-[color-mix(in_oklch,var(--destructive-text),transparent_94%)] px-4 py-3 text-sm text-[var(--destructive-text)] max-w-3xl">
      {children}
    </div>
  );
}

// ─── Couleurs ─────────────────────────────────────────────────────────────────

function Swatch({ name, value }: { name: string; value: string }) {
  const label = name.replace("--color-", "");
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div
        className="h-14 rounded-[var(--radius)] border border-border"
        style={{ background: value }}
        title={value}
      />
      <span className="text-xs font-medium text-foreground truncate">{label}</span>
      <span className="text-2xs font-mono text-muted-foreground truncate">{value}</span>
    </div>
  );
}

/**
 * Deux couches distinctes, volontairement séparées :
 *  - primitives  : --color-<famille>-<palier numérique>, invariantes au thème
 *  - rôles       : --color-<domaine>-<qualifieur>, recalculés en light/dark
 * Les mélanger donnait ~70 « familles » d'un seul élément.
 */
function groupColors(vars: Record<string, string>, kind: "primitive" | "role") {
  const families = new Map<string, [string, string][]>();
  for (const [name, value] of byPrefix(vars, "--color-")) {
    const rest = name.replace("--color-", "");
    const isPrimitive = /-\d+$/.test(rest);
    if ((kind === "primitive") !== isPrimitive) continue;
    const family = isPrimitive ? rest.replace(/-\d+$/, "") : rest.split("-")[0];
    if (!families.has(family)) families.set(family, []);
    families.get(family)!.push([name, value]);
  }
  return [...families.entries()];
}

function ColorGrid({
  vars,
  kind,
}: {
  vars: Record<string, string>;
  kind: "primitive" | "role";
}) {
  const families = groupColors(vars, kind);
  return (
    <>
      {families.map(([family, entries]) => (
        <div key={family} className="mb-8">
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-sm font-semibold text-foreground">{family}</h3>
            <span className="text-xs font-mono text-muted-foreground">
              {entries.length}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3">
            {entries.map(([name, value]) => (
              <Swatch key={name} name={name} value={value} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Typographie ──────────────────────────────────────────────────────────────

/**
 * Rend chaque rôle via `font: var(--role-typography-*)` — exactement comme le
 * ferait un composant — puis relit les valeurs calculées. C'est ce qui rend
 * visible ce que le shorthand `font` laisse tomber en silence.
 */
const TYPO_PROPS = [
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
] as const;

/** Regroupe les variables longhand par rôle : --role-typography-<rôle>-<prop>. */
function groupTypographyRoles(vars: Record<string, string>) {
  const roles = new Map<string, Record<string, string>>();
  for (const [name, value] of byPrefix(vars, "--role-typography-")) {
    const prop = TYPO_PROPS.find((p) => name.endsWith(`-${p}`));
    if (!prop) continue;
    const role = name.slice("--role-typography-".length, name.length - prop.length - 1);
    if (!roles.has(role)) roles.set(role, {});
    roles.get(role)![prop] = value;
  }
  return [...roles.entries()];
}

/**
 * Applique chaque rôle en longhand — exactement comme le ferait un composant —
 * puis relit les valeurs calculées. Le letter-spacing et les chiffres tabulaires
 * doivent survivre : c'est tout l'objet du passage au longhand.
 */
function TypographyRoles({ vars }: { vars: Record<string, string> }) {
  const roles = groupTypographyRoles(vars);
  const [computed, setComputed] = useState<Record<string, any>>({});

  useEffect(() => {
    const out: Record<string, any> = {};
    for (const [role] of roles) {
      const el = document.getElementById(`type-sample-${role}`);
      if (!el) continue;
      const cs = getComputedStyle(el);
      out[role] = {
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
      };
    }
    setComputed(out);
  }, [vars]);

  if (!roles.length) {
    return (
      <Flag>
        Aucun rôle <code className="font-mono">--role-typography-*</code> chargé.
        Vérifier que <code className="font-mono">build/semantics.css</code> est bien
        importé dans <code className="font-mono">build/index.css</code>.
      </Flag>
    );
  }

  // Régression à surveiller : si un rôle déclare un tracking non nul et calcule
  // `normal`, c'est que le longhand a été contourné quelque part.
  const lost = roles.filter(([role, props]) => {
    const declared = props["letter-spacing"];
    const c = computed[role];
    if (!declared || !c) return false;
    return parseFloat(declared) !== 0 && c.letterSpacing === "normal";
  });

  return (
    <>
      {lost.length > 0 && (
        <Flag>
          <strong>{lost.length} rôle(s) perdent leur letter-spacing.</strong> Le
          longhand a été contourné quelque part — vérifier le format dans{" "}
          <code className="font-mono">build-tokens.mjs</code>.
        </Flag>
      )}
      <div className="space-y-5">
        {roles.map(([role, props]) => {
          const c = computed[role];
          const style: React.CSSProperties = {
            fontFamily: props["font-family"],
            fontSize: props["font-size"],
            fontWeight: props["font-weight"] as any,
            lineHeight: props["line-height"] as any,
            letterSpacing: props["letter-spacing"],
          };
          return (
            <div
              key={role}
              className="border-b border-border pb-5 last:border-0 flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {role}
                </span>
                <VarName name={`--role-typography-${role}-*`} />
              </div>
              <div id={`type-sample-${role}`} style={style} className="text-foreground">
                Les avis clients façonnent la réputation — 4,2/5
              </div>
              {c && (
                <div className="flex gap-4 flex-wrap text-xs font-mono text-muted-foreground">
                  <span>size {c.fontSize}</span>
                  <span>lh {c.lineHeight}</span>
                  <span>weight {c.fontWeight}</span>
                  <span
                    className={
                      c.letterSpacing === "normal" &&
                      parseFloat(props["letter-spacing"] || "0") !== 0
                        ? "text-[var(--destructive-text)]"
                        : "text-[var(--success)]"
                    }
                  >
                    tracking {c.letterSpacing}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function TypeScale({ vars }: { vars: Record<string, string> }) {
  const sizes = byScale(vars, "--dimension-font-size-");
  return (
    <div className="space-y-3">
      {sizes.map(([name, value]) => (
        <div key={name} className="flex items-baseline gap-4 border-b border-border pb-3">
          <span className="w-16 shrink-0 text-xs font-mono text-muted-foreground">
            {name.replace("--dimension-font-size-", "")}
          </span>
          <span className="w-20 shrink-0 text-xs font-mono text-muted-foreground">
            {value}
          </span>
          <span
            className="text-foreground truncate"
            style={{ fontSize: value, lineHeight: 1.2 }}
          >
            Aikoz
          </span>
        </div>
      ))}
    </div>
  );
}

function ScalarList({
  vars,
  prefix,
  strip,
  scale = true,
}: {
  vars: Record<string, string>;
  prefix: string;
  strip: string;
  /** false pour les valeurs non ordonnables (familles de police). */
  scale?: boolean;
}) {
  const items = scale ? byScale(vars, prefix) : byPrefix(vars, prefix);
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {items.map(([name, value]) => (
        <div
          key={name}
          className="flex items-baseline justify-between gap-3 rounded-[var(--radius)] border border-border bg-card px-3 py-2"
        >
          <span className="text-xs font-medium text-foreground truncate">
            {name.replace(strip, "")}
          </span>
          {/* `shrink-0` refusait de rétrécir, et une valeur longue — la pile
              de polices de Gotham fait 346 px — poussait la PAGE de 155 px à
              640 px de large. Un `title` garde la valeur entière au survol. */}
          <span
            className="min-w-0 truncate text-xs font-mono text-muted-foreground"
            title={String(value)}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

function Radius({ vars }: { vars: Record<string, string> }) {
  const roles = byScale(vars, "--role-radius-");
  const prims = byScale(vars, "--dimension-radius-");
  const show = roles.length ? roles : prims;
  return (
    <>
      <div className="flex flex-wrap gap-4 mb-6">
        {show.map(([name, value]) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 bg-[var(--secondary)] border border-border"
              style={{ borderRadius: value }}
            />
            <span className="text-xs font-medium text-foreground">
              {name.replace("--role-radius-", "").replace("--dimension-radius-", "")}
            </span>
            <span className="text-2xs font-mono text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
      {roles.length > 0 && (
        <ScalarList vars={vars} prefix="--dimension-radius-" strip="--dimension-radius-" />
      )}
    </>
  );
}

function Spacing({ vars }: { vars: Record<string, string> }) {
  const items = byScale(vars, "--dimension-spacing-");
  return (
    <div className="space-y-2">
      {items.map(([name, value]) => (
        <div key={name} className="flex items-center gap-4">
          <span className="w-14 shrink-0 text-xs font-mono text-muted-foreground">
            {name.replace("--dimension-spacing-", "")}
          </span>
          <span className="w-20 shrink-0 text-xs font-mono text-muted-foreground">
            {value}
          </span>
          <div
            className="h-4 bg-[var(--secondary)] rounded-sm min-w-[1px]"
            style={{ width: value }}
          />
        </div>
      ))}
    </div>
  );
}

function BorderWidth({ vars }: { vars: Record<string, string> }) {
  const roles = byScale(vars, "--role-border-width-");
  const prims = byScale(vars, "--dimension-border-width-");
  const show = roles.length ? roles : prims;
  return (
    <div className="flex flex-wrap gap-6">
      {show.map(([name, value]) => (
        <div key={name} className="flex flex-col gap-2">
          <div
            className="w-32 h-16 rounded-[var(--radius)] border-[var(--border)]"
            style={{ borderStyle: "solid", borderWidth: value }}
          />
          <span className="text-xs font-medium text-foreground">
            {name
              .replace("--role-border-width-", "")
              .replace("--dimension-border-width-", "")}
          </span>
          <span className="text-2xs font-mono text-muted-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

function Shadows({ vars }: { vars: Record<string, string> }) {
  const items = [...byPrefix(vars, "--shadow-"), ...byPrefix(vars, "--role-shadow-")];
  return (
    <div className="flex flex-wrap gap-6">
      {items.map(([name, value]) => (
        <div key={name} className="flex flex-col gap-2">
          <div
            className="w-32 h-20 rounded-[var(--radius)] bg-card border border-border"
            style={{ boxShadow: value }}
          />
          <span className="text-xs font-medium text-foreground">
            {name.replace("--shadow-", "").replace("--role-shadow-", "")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Thème / bridge ───────────────────────────────────────────────────────────

const PAIRS: [string, string, string][] = [
  ["texte / fond", "--foreground", "--background"],
  ["texte carte / carte", "--card-foreground", "--card"],
  ["texte discret / fond", "--muted-foreground", "--background"],
  ["primary fg / primary", "--primary-foreground", "--primary"],
  ["secondary fg / secondary", "--secondary-foreground", "--secondary"],
  ["accent fg / accent", "--accent-foreground", "--accent"],
  ["destructive fg / destructive", "--destructive-foreground", "--destructive"],
  ["success / carte", "--success", "--card"],
  ["destructive-text / carte", "--destructive-text", "--card"],
];

function Contrast({ vars, dark }: { vars: Record<string, string>; dark: boolean }) {
  const [rows, setRows] = useState<{ label: string; ratio: number | null }[]>([]);

  useEffect(() => {
    setRows(
      PAIRS.map(([label, fg, bg]) => ({
        label,
        ratio: vars[fg] && vars[bg] ? contrast(vars[fg], vars[bg]) : null,
      }))
    );
  }, [vars, dark]);

  return (
    <div className="max-w-xl">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-0 text-sm">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-2">
          paire
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-2 text-right">
          ratio
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pb-2 text-right">
          AA
        </span>
        {rows.map(({ label, ratio }) => {
          const pass = ratio !== null && ratio >= 4.5;
          const large = ratio !== null && ratio >= 3 && ratio < 4.5;
          return (
            <div key={label} className="contents">
              <span className="text-foreground border-t border-border py-2">{label}</span>
              <span className="font-mono text-muted-foreground border-t border-border py-2 text-right">
                {ratio === null ? "—" : `${ratio.toFixed(2)}:1`}
              </span>
              <span
                className={`font-mono border-t border-border py-2 text-right ${
                  pass
                    ? "text-[var(--success)]"
                    : large
                    ? "text-muted-foreground"
                    : "text-[var(--destructive-text)]"
                }`}
              >
                {ratio === null ? "—" : pass ? "OK" : large ? "large" : "échec"}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Seuil AA texte normal : 4,5:1. « large » = conforme seulement en gros texte
        (≥ 24px, ou ≥ 18,66px gras) ou pour un élément non textuel (seuil 3:1).
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Tokens({
  dark,
  register = "produit",
}: {
  dark: boolean;
  register?: string;
}) {
  // Le registre change les valeurs résolues autant que le thème : il doit
  // entrer dans la clé de recalcul, sinon la page affiche des mesures périmées.
  const vars = useCssVars(`${dark}|${register}`);
  const total = Object.keys(vars).length;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-10 max-w-2xl">
        {total} variables CSS chargées, lues directement dans le document — cette page
        n'a aucune liste en dur, elle reflète le résultat du dernier{" "}
        <code className="font-mono text-xs bg-muted px-1 rounded">
          npm run build:tokens
        </code>
        . Bascule le thème en haut à droite : toutes les valeurs se recalculent.
      </p>

      <Section
        title="Rôles typographiques"
        note="Chaque rôle est appliqué en longhand, exactement comme le ferait un composant, puis relu en valeurs calculées. Le tracking doit apparaître en vert : c'est ce que le shorthand font jetait."
      >
        <TypographyRoles vars={vars} />
      </Section>

      <Section title="Échelle de taille" count={byPrefix(vars, "--dimension-font-size-").length}>
        <TypeScale vars={vars} />
      </Section>

      <Section title="Contraste — paires du thème actif">
        <Contrast vars={vars} dark={dark} />
      </Section>

      <Section
        title="Couleurs — rôles"
        note="Couche sémantique : ces valeurs changent avec le thème. C'est ce que les composants consomment."
      >
        <ColorGrid vars={vars} kind="role" />
      </Section>

      <Section
        title="Couleurs — primitives"
        note="Couche brute, invariante au thème. Aucun composant ne doit s'y brancher directement."
      >
        <ColorGrid vars={vars} kind="primitive" />
      </Section>

      <Section title="Radius">
        <Radius vars={vars} />
      </Section>

      <Section title="Spacing" count={byPrefix(vars, "--dimension-spacing-").length}>
        <Spacing vars={vars} />
      </Section>

      <Section title="Épaisseur de bordure">
        <BorderWidth vars={vars} />
      </Section>

      <Section title="Ombres">
        <Shadows vars={vars} />
      </Section>

      <Section
        title="Graisses, interlignes, tracking"
        note="Primitives brutes. Le tracking est déclaré en em — non conforme au type dimension du DTCG, chantier ouvert."
      >
        <div className="space-y-6">
          <ScalarList vars={vars} prefix="--font-weight-" strip="--font-weight-" />
          <ScalarList vars={vars} prefix="--line-height-" strip="--line-height-" />
          <ScalarList vars={vars} prefix="--letter-spacing-" strip="--letter-spacing-" />
          <ScalarList vars={vars} prefix="--font-family-" strip="--font-family-" scale={false} />
        </div>
      </Section>
    </div>
  );
}
