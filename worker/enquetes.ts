/**
 * Enquêtes LinkedIn (/enquete-pme, /enquete-agences) : enregistrement des
 * réponses et export CSV pour Julien.
 *
 * Stockage : l'espace KV déjà rattaché au Worker (OAUTH_KV), sous le préfixe
 * « enquete: » — aucun nouveau service, aucun coût. Une réponse = une clé
 * enquete:<pme|agences>:<horodatage>:<id>, valeur JSON. Le préfixe ne croise
 * pas ceux de la bibliothèque OAuth (client:, grant:, token:).
 *
 * Export : GET /api/enquetes.csv?enquete=pme|agences|toutes, avec la clé
 * d'administration du tableau (TABLEAU_ADMIN_KEY) en paramètre « cle » ou en
 * en-tête Authorization: Bearer. Ouvert dans un navigateur, le fichier se
 * télécharge et s'ouvre dans Excel ou Numbers.
 */

export interface EnvEnquetes {
  OAUTH_KV: KVNamespace;
  TABLEAU_ADMIN_KEY?: string;
}

const ENQUETES = ["pme", "agences"] as const;
type Enquete = (typeof ENQUETES)[number];
const MAX_CORPS = 20_000;
const MAX_TEXTE = 2_000;
const MAX_CHOIX = 20;

type Reponse = {
  enquete: Enquete;
  date: string;
  src: string;
  reponses: Record<string, string | string[]>;
  contact: { prenom: string; entreprise: string; email: string } | null;
};

const texte = (v: unknown, max = MAX_TEXTE) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Nettoie les réponses : identifiants courts, textes bornés, listes bornées. */
function nettoyer(brut: unknown): Record<string, string | string[]> {
  const sortie: Record<string, string | string[]> = {};
  if (!brut || typeof brut !== "object") return sortie;
  for (const [cle, valeur] of Object.entries(brut as Record<string, unknown>).slice(0, 30)) {
    if (!/^[a-z0-9_-]{1,40}$/i.test(cle)) continue;
    if (Array.isArray(valeur)) sortie[cle] = valeur.slice(0, MAX_CHOIX).map((x) => texte(x, 300)).filter(Boolean);
    else if (typeof valeur === "string" && valeur.trim()) sortie[cle] = texte(valeur);
  }
  return sortie;
}

/** POST /api/enquete — enregistre une réponse. Le champ piège rempli = robot : réponse « ok », rien n'est gardé. */
export async function enregistrerReponse(request: Request, env: EnvEnquetes): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_CORPS) return Response.json({ ok: false, erreur: "trop-long" }, { status: 413 });
  let corps: Record<string, unknown>;
  try {
    corps = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, erreur: "format" }, { status: 400 });
  }
  if (texte(corps.siteweb)) return Response.json({ ok: true });
  const enquete = corps.enquete as Enquete;
  if (!ENQUETES.includes(enquete)) return Response.json({ ok: false, erreur: "enquete" }, { status: 400 });
  const reponses = nettoyer(corps.reponses);
  if (Object.keys(reponses).length === 0) return Response.json({ ok: false, erreur: "vide" }, { status: 400 });

  // Le contact n'est gardé qu'avec le consentement coché et un e-mail plausible.
  const c = (corps.contact ?? {}) as Record<string, unknown>;
  const email = texte(c.email, 200);
  const contact =
    c.consentement === true && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? { prenom: texte(c.prenom, 100), entreprise: texte(c.entreprise, 200), email }
      : null;

  const reponse: Reponse = {
    enquete,
    date: new Date().toISOString(),
    src: texte(corps.src, 100),
    reponses,
    contact,
  };
  const cle = `enquete:${enquete}:${reponse.date}:${crypto.randomUUID().slice(0, 8)}`;
  await env.OAUTH_KV.put(cle, JSON.stringify(reponse));
  return Response.json({ ok: true });
}

const csv = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** GET /api/enquetes.csv — toutes les réponses, une ligne par réponse, séparateur « ; » (Excel français). */
export async function exporterReponses(request: Request, env: EnvEnquetes): Promise<Response> {
  const url = new URL(request.url);
  const fournie = url.searchParams.get("cle") || (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const attendue = env.TABLEAU_ADMIN_KEY || "";
  if (attendue.length < 16 || fournie !== attendue) return new Response("Clé requise.", { status: 401 });

  const filtre = url.searchParams.get("enquete") || "toutes";
  const prefixe = ENQUETES.includes(filtre as Enquete) ? `enquete:${filtre}:` : "enquete:";
  const lignes: Reponse[] = [];
  let curseur: string | undefined;
  do {
    const page = await env.OAUTH_KV.list({ prefix: prefixe, cursor: curseur });
    const valeurs = await Promise.all(page.keys.map((k) => env.OAUTH_KV.get(k.name)));
    for (const v of valeurs) if (v) lignes.push(JSON.parse(v) as Reponse);
    curseur = page.list_complete ? undefined : page.cursor;
  } while (curseur);
  lignes.sort((a, b) => a.date.localeCompare(b.date));

  const questions = [...new Set(lignes.flatMap((l) => Object.keys(l.reponses)))].sort();
  const entete = ["date", "enquete", "src", ...questions, "prenom", "entreprise", "email"];
  const corps = lignes.map((l) =>
    [
      l.date,
      l.enquete,
      l.src,
      ...questions.map((q) => {
        const v = l.reponses[q];
        return Array.isArray(v) ? v.join(" | ") : (v ?? "");
      }),
      l.contact?.prenom ?? "",
      l.contact?.entreprise ?? "",
      l.contact?.email ?? "",
    ]
      .map(csv)
      .join(";"),
  );
  // BOM : Excel lit alors les accents correctement.
  return new Response("﻿" + [entete.join(";"), ...corps].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquetes-${filtre}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
