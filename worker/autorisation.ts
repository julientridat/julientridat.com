/**
 * La page de consentement du connecteur Claude : /authorize.
 *
 * Claude (claude.ai, l'app, Claude Code) demande l'accès au tableau ; Julien l'accorde ici,
 * une fois. Seule sa clé peut l'accorder — celle que son navigateur garde déjà pour
 * /tableau : la page la lit dans ce navigateur (ou Julien colle son lien) et la renvoie en
 * POST à la même origine, où elle est comparée à TABLEAU_ADMIN_KEY à temps constant.
 * L'accès accordé porte l'empreinte de cette clé : si Julien la change, tous les accès
 * accordés à Claude tombent (worker/mcp.ts la revérifie à chaque appel).
 *
 * La bibliothèque OAuth (@cloudflare/workers-oauth-provider) sert /token, /register et
 * /.well-known/* ; elle laisse /authorize à cette page.
 */
import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { egal, empreinteCle } from "./tableau";

export interface EnvAutorisation {
  OAUTH_KV: KVNamespace;
  /** Injecté par la bibliothèque OAuth à chaque requête. */
  OAUTH_PROVIDER: OAuthHelpers;
  TABLEAU_ADMIN_KEY?: string;
}

/** Ce qu'un accès accordé à Claude emporte (chiffré dans le jeton par la bibliothèque). */
export interface PropsClaude {
  role: "julien";
  empreinte: string;
}

const COOKIE = "__Host-consentement";
const DUREE = 600;

/* L'accès ne peut repartir que vers Claude : claude.ai / claude.com (le site, les apps),
   ou la machine elle-même (Claude Code). Une application qui se ferait passer pour Claude
   ne récupérerait donc rien, même si Julien cliquait « Autoriser ». */
function retourDeClaude(uri: string): URL | null {
  try {
    const u = new URL(uri);
    if (u.protocol === "https:" && /^(?:[\w-]+\.)*claude\.(?:ai|com)$/.test(u.hostname)) return u;
    if (u.protocol === "http:" && /^(?:localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname)) return u;
  } catch {
    /* URI illisible : refusée */
  }
  return null;
}

function esc(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function cookie(request: Request, nom: string): string | null {
  const m = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${nom}=([^;]+)`));
  return m ? m[1] : null;
}

function page(titre: string, corps: string, status = 200, entetes: Record<string, string> = {}, retour = "", nonce = ""): Response {
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${esc(titre)} · Le tableau</title>
<style>
:root { --paper: #f1f2f4; --white: #fbfbfc; --ink: #111216; --ink-2: #43464e; --ink-3: #7a7e88; --line: rgba(17,18,22,.1); --violet: #6c4cf1; --late: #b4321f; }
* { box-sizing: border-box; margin: 0; }
body { background: var(--paper); color: var(--ink-2); font: 16px/1.5 -apple-system, "Helvetica Neue", sans-serif; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; }
main { background: var(--white); border: 1px solid var(--line); border-top: 5px solid var(--violet); border-radius: 20px; padding: 28px 26px; width: min(520px, 100%); display: grid; gap: 14px; }
.kicker { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .14em; color: var(--violet); }
h1 { font-weight: 400; font-size: 1.5rem; letter-spacing: -.02em; color: var(--ink); line-height: 1.2; }
ul { padding-left: 20px; display: grid; gap: 4px; }
.note { font-size: .88rem; color: var(--ink-3); }
.ok { color: var(--violet); font-size: .9rem; }
.err { color: var(--late); font-size: .9rem; }
label { display: grid; gap: 6px; font-size: .9rem; }
input[type=text] { width: 100%; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); padding: 10px 12px; font: inherit; color: var(--ink); }
.actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; margin-top: 6px; }
button { font: inherit; font-weight: 500; border-radius: 999px; padding: 10px 20px; cursor: pointer; border: 1px solid var(--line); background: var(--white); color: var(--ink-2); }
button.oui { background: var(--ink); color: var(--white); border-color: var(--ink); }
button.oui:hover { background: var(--violet); border-color: var(--violet); }
[hidden] { display: none !important; }
</style></head><body><main>${corps}</main>${nonce ? `<script nonce="${nonce}">${SCRIPT}</script>` : ""}</body></html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "same-origin",
      "x-frame-options": "DENY",
      "content-security-policy": `default-src 'none'; style-src 'unsafe-inline'; script-src ${nonce ? `'nonce-${nonce}'` : "'none'"}; form-action 'self'${retour ? " " + retour : ""}; frame-ancestors 'none'; base-uri 'none'`,
      ...entetes,
    },
  });
}

/* Dans le navigateur de Julien : la clé du tableau, si ce navigateur l'a ; sinon, son lien collé. */
const SCRIPT = `(function () {
  var f = document.getElementById("f"), cle = document.getElementById("cle"), coller = document.getElementById("coller"), lien = document.getElementById("lien");
  var k = null;
  try { k = localStorage.getItem("tableau.cle"); } catch (e) {}
  if (k) { cle.value = k; document.getElementById("reconnu").hidden = false; } else coller.hidden = false;
  f.addEventListener("submit", function (e) {
    if (e.submitter && e.submitter.value === "refuser") return;
    if (cle.value) return;
    var v = (lien.value || "").trim(), m = v.match(/cle=([^&\\s#]+)/);
    var c = m ? decodeURIComponent(m[1]) : /^[\\w-]{16,200}$/.test(v) ? v : "";
    if (!c) { e.preventDefault(); document.getElementById("err").hidden = false; lien.focus(); return; }
    cle.value = c;
  });
})();`;

function expiree(): Response {
  return page("Demande expirée", `<p class="kicker">Le tableau</p><h1>Demande expirée</h1><p>Relancez la connexion depuis Claude.</p>`, 400);
}

export async function autoriser(request: Request, env: EnvAutorisation): Promise<Response> {
  if (!env.OAUTH_KV || !env.OAUTH_PROVIDER) return new Response("Connecteur non configuré.", { status: 503 });

  if (request.method === "GET") {
    let demande: AuthRequest;
    try {
      demande = await env.OAUTH_PROVIDER.parseAuthRequest(request);
    } catch {
      return page("Demande invalide", `<p class="kicker">Le tableau</p><h1>Demande invalide</h1><p>Le lien d’autorisation est incomplet ou expiré. Relancez la connexion depuis Claude.</p>`, 400);
    }
    const client = await env.OAUTH_PROVIDER.lookupClient(demande.clientId).catch(() => null);
    if (!client) return page("Application inconnue", `<p class="kicker">Le tableau</p><h1>Application inconnue</h1><p>Relancez la connexion depuis Claude.</p>`, 400);
    const retour = retourDeClaude(demande.redirectUri);
    if (!retour) return page("Application refusée", `<p class="kicker">Le tableau</p><h1>Application refusée</h1><p>Seul Claude peut demander l’accès à ce tableau.</p>`, 403);
    const appli = client.clientName || "Une application";
    const jeton = crypto.randomUUID();
    await env.OAUTH_KV.put(`consentement:${jeton}`, JSON.stringify({ demande, appli }), { expirationTtl: DUREE });
    const hote = retour.host, origine = retour.origin;
    const nonce = crypto.randomUUID().replace(/-/g, "");
    return page(
      "Autoriser Claude",
      `<p class="kicker">Le tableau · julientridat.com</p>
<h1>Autoriser ${esc(appli)} à gérer ton tableau ?</h1>
<p><b>${esc(appli)}</b> (${esc(hote)}) demande l’accès à ton tableau, en ton nom. Il pourra :</p>
<ul>
  <li>consulter tes places, tes cartes, tes projets et ta semaine ;</li>
  <li>créer et modifier des cartes, des sous-tâches, des dates et des projets, et coller un plan ;</li>
  <li>écrire à un client (message, commentaire, carte « Chez le client ») — seulement quand tu le lui demandes.</li>
</ul>
<p class="note">Il ne pourra rien supprimer. Ce qu’il fait est marqué « via Claude » dans le journal. Pour lui retirer l’accès : changer ta clé du tableau.</p>
<form id="f" method="post" action="/authorize">
  <input type="hidden" name="jeton" value="${esc(jeton)}">
  <input type="hidden" name="cle" id="cle" value="">
  <p class="ok" id="reconnu" hidden>Ce navigateur a ta clé du tableau : un clic suffit.</p>
  <div id="coller" hidden>
    <label for="lien">Ce navigateur n’a pas ta clé. Colle ton lien du tableau (julientridat.com/tableau#cle=…) :
      <input type="text" id="lien" autocomplete="off" autocapitalize="off" spellcheck="false">
    </label>
    <p class="err" id="err" hidden>Ce n’est pas un lien du tableau.</p>
  </div>
  <div class="actions">
    <button type="submit" name="choix" value="refuser">Refuser</button>
    <button type="submit" name="choix" value="autoriser" class="oui">Autoriser</button>
  </div>
</form>`,
      200,
      { "set-cookie": `${COOKIE}=${jeton}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${DUREE}` },
      origine,
      nonce,
    );
  }

  if (request.method === "POST") {
    // Seule la page ci-dessus, sur cette origine, peut répondre.
    const origine = request.headers.get("Origin");
    let memeOrigine = false;
    try {
      memeOrigine = !!origine && new URL(origine).host === new URL(request.url).host;
    } catch {
      memeOrigine = false;
    }
    if (!memeOrigine) return page("Demande refusée", `<p class="kicker">Le tableau</p><h1>Demande refusée</h1><p>Relancez la connexion depuis Claude.</p>`, 403);
    const form = await request.formData();
    const jeton = String(form.get("jeton") || "");
    if (!jeton || cookie(request, COOKIE) !== jeton) return expiree();
    const brut = await env.OAUTH_KV.get(`consentement:${jeton}`);
    await env.OAUTH_KV.delete(`consentement:${jeton}`);
    if (!brut) return expiree();
    const { demande, appli } = JSON.parse(brut) as { demande: AuthRequest; appli: string };
    const effacer = { "set-cookie": `${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0` };

    if (form.get("choix") !== "autoriser") {
      const retour = new URL(demande.redirectUri);
      retour.searchParams.set("error", "access_denied");
      if (demande.state) retour.searchParams.set("state", demande.state);
      return new Response(null, { status: 302, headers: { location: retour.toString(), ...effacer } });
    }

    const cle = String(form.get("cle") || "");
    const admin = env.TABLEAU_ADMIN_KEY;
    if (!admin || admin.length < 16 || cle.length < 16 || cle.length > 200 || !(await egal(cle, admin))) {
      return page(
        "Clé refusée",
        `<p class="kicker">Le tableau</p><h1>Cette clé n’ouvre pas le tableau de Julien</h1><p>Seul le propriétaire du tableau peut autoriser Claude. Relancez la connexion depuis Claude, depuis le navigateur où le tableau est ouvert.</p>`,
        403,
        effacer,
      );
    }
    const props: PropsClaude = { role: "julien", empreinte: await empreinteCle(admin) };
    const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
      request: demande,
      userId: "julien",
      metadata: { appli },
      scope: demande.scope,
      props,
    });
    return new Response(null, { status: 302, headers: { location: redirectTo, ...effacer } });
  }

  return new Response("Méthode non autorisée.", { status: 405, headers: { allow: "GET, POST" } });
}
