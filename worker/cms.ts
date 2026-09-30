/**
 * Connexion GitHub de l'outil d'édition /admin (Sveltia CMS).
 *
 * L'outil tourne dans le navigateur et enregistre les textes directement sur
 * GitHub. Pour cela il lui faut un jeton GitHub au nom de Julien : ce module
 * fait l'aller-retour OAuth avec GitHub et remet le jeton à la fenêtre /admin,
 * sans jamais le stocker côté serveur.
 *
 *   /cms/auth      ouvert dans une fenêtre par /admin → redirige vers GitHub
 *   /cms/callback  retour de GitHub → échange le code contre un jeton, puis le
 *                  transmet à /admin par postMessage (protocole Decap/Sveltia)
 *
 * Secrets Cloudflare à poser une fois (application OAuth GitHub de Julien) :
 * GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET. Sans eux, /cms/auth l'explique.
 * Seul un compte qui a le droit d'écrire dans le dépôt peut enregistrer :
 * n'importe qui peut se connecter, personne d'autre ne peut modifier.
 */

export interface EnvCms {
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

const COOKIE = "cms-etat";

/** Page de retour : attend que /admin se présente, puis lui remet le résultat. */
function reponse(origine: string, resultat: { token: string } | { error: string }, statut: "success" | "error"): Response {
  const message = `authorization:github:${statut}:${JSON.stringify({ provider: "github", ...resultat })}`;
  // Posé dans un <script> : aucun « < » ne doit pouvoir y fermer la balise.
  const js = (v: string) => JSON.stringify(v).replace(/</g, "\\u003c");
  const html = `<!doctype html><meta charset="utf-8"><title>Connexion</title><p>Connexion en cours…</p>
<script>
(() => {
  const origine = ${js(origine)};
  window.addEventListener("message", (e) => {
    if (e.origin === origine && e.data === "authorizing:github") window.opener?.postMessage(${js(message)}, origine);
  });
  window.opener?.postMessage("authorizing:github", origine);
})();
</script>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": `${COOKIE}=; Path=/cms; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

export async function servirCms(request: Request, env: EnvCms): Promise<Response> {
  const url = new URL(request.url);
  const origine = url.origin;

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return reponse(origine, { error: "Connexion GitHub pas encore configurée (secrets GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET)." }, "error");
  }

  if (url.pathname === "/cms/auth") {
    const etat = crypto.randomUUID();
    const github = new URL("https://github.com/login/oauth/authorize");
    github.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    github.searchParams.set("scope", "repo,user");
    github.searchParams.set("state", etat);
    github.searchParams.set("redirect_uri", `${origine}/cms/callback`);
    return new Response(null, {
      status: 302,
      headers: {
        Location: github.href,
        "Set-Cookie": `${COOKIE}=${etat}; Path=/cms; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  // /cms/callback : l'état renvoyé par GitHub doit être celui posé à l'aller.
  const code = url.searchParams.get("code");
  const etat = url.searchParams.get("state");
  const cookie = (request.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1];
  if (!code || !etat || etat !== cookie) {
    return reponse(origine, { error: "Connexion expirée ou refusée. Fermez cette fenêtre et recommencez." }, "error");
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "julientridat-cms" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
  });
  const donnees = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!donnees.access_token) {
    return reponse(origine, { error: donnees.error_description || "GitHub n'a pas délivré de jeton." }, "error");
  }
  return reponse(origine, { token: donnees.access_token }, "success");
}
