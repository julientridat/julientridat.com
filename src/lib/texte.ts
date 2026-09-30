/**
 * Textes modifiables depuis /admin (Sveltia CMS) — mise en forme.
 *
 * Julien écrit dans des formulaires, pas en HTML. Trois conventions seulement,
 * rappelées sous chaque champ concerné dans public/admin/config.yml :
 *   **mots**          → gras (<strong>)
 *   *mots*            → mis en valeur (<em>, en couleur sur ce site)
 *   [texte](/adresse) → lien
 * et un retour à la ligne dans le champ → retour à la ligne à l'écran.
 *
 * La typographie française est posée ici, pas à la main : espace insécable
 * avant « : ; ! ? », entre un nombre et ce qui le suit (« 2 500 € »,
 * « 60 jours ») et dans « € HT ». Les insécables déjà présentes dans les
 * fichiers sont gardées.
 */

const echapper = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Espaces insécables de la typographie française. Idempotent. */
export function typo(s: string): string {
  const I = "\u00A0";
  return s
    .replace(/ +([:;!?»])/g, `${I}$1`)
    .replace(/« +/g, `«${I}`)
    .replace(/(\d) +(?=[\d€%A-Za-zÀ-ÿ])/g, `$1${I}`)
    .replace(/€ +(HT|TTC)/g, `€${I}$1`)
    .replace(/ +· /g, `${I}· `);
}

const classe = (c?: string) => (c ? ` class="${c}"` : "");

/**
 * Texte enrichi → HTML, à poser avec set:html. Le texte est échappé avant la
 * mise en forme : rien de ce qui est tapé dans /admin ne devient du code.
 */
export function enLigne(s: string, o: { fort?: string; accent?: string; lien?: string } = {}): string {
  return echapper(typo(s.trim()))
    .replace(/\*\*(.+?)\*\*/g, `<strong${classe(o.fort)}>$1</strong>`)
    .replace(/\*(.+?)\*/g, `<em${classe(o.accent)}>$1</em>`)
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#|mailto:)[^)\s]*)\)/g, `<a href="$2"${classe(o.lien)}>$1</a>`)
    .replace(/\n/g, "<br />");
}

/** Le même texte sans mise en forme : balisage JSON-LD, meta, llms.txt. */
export function brut(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

/** Applique typo() à toutes les chaînes d'un contenu, sauf le bloc seo (title et meta restent tels quels). */
export function preparer<T>(contenu: T): T {
  const passe = (v: unknown, cle?: string): unknown => {
    if (cle === "seo") return v;
    if (typeof v === "string") return typo(v);
    if (Array.isArray(v)) return v.map((x) => passe(x));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, passe(x, k)]));
    return v;
  };
  return passe(contenu) as T;
}
