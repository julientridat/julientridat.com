/**
 * OAuth 2.0 LinkedIn — flux « authorization code » (3-legged).
 *
 *   node scripts/linkedin/auth.js
 *
 * Ouvre l'URL d'autorisation, récupère le code sur un serveur local,
 * l'échange contre un access token, lit le `sub` via /v2/userinfo
 * et écrit le tout dans scripts/linkedin/.token.json (ignoré par git).
 */
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import {
  chargerEnv,
  exigerVariable,
  FICHIER_TOKEN,
  REDIRECT_URI,
} from "./env.js";

const AUTORISATION = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO = "https://api.linkedin.com/v2/userinfo";

// openid + profile : identifier le membre (on a besoin du `sub`).
// w_member_social : publier en son nom.
const SCOPES = "openid profile w_member_social";

let clientId, clientSecret;
try {
  chargerEnv();
  clientId = exigerVariable("LINKEDIN_CLIENT_ID");
  clientSecret = exigerVariable("LINKEDIN_CLIENT_SECRET");
} catch (e) {
  console.error(`\n❌ ${e.message}`);
  process.exit(1);
}
const etat = randomBytes(16).toString("hex");

const url = new URL(AUTORISATION);
url.searchParams.set("response_type", "code");
url.searchParams.set("client_id", clientId);
url.searchParams.set("redirect_uri", REDIRECT_URI);
url.searchParams.set("state", etat);
url.searchParams.set("scope", SCOPES);

const port = Number(new URL(REDIRECT_URI).port || 80);

const serveur = createServer(async (req, res) => {
  const recue = new URL(req.url, REDIRECT_URI);
  if (recue.pathname !== new URL(REDIRECT_URI).pathname) {
    res.writeHead(404).end();
    return;
  }

  const repondre = (message) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<meta charset="utf-8"><body style="font-family:system-ui;padding:3rem">
      <p>${message}</p><p>Tu peux fermer cet onglet.</p></body>`);
  };

  const erreur = recue.searchParams.get("error");
  if (erreur) {
    repondre(`❌ Refus LinkedIn : ${erreur} — ${recue.searchParams.get("error_description") ?? ""}`);
    console.error(`\n❌ LinkedIn a refusé : ${erreur}`);
    serveur.close();
    process.exitCode = 1;
    return;
  }

  // Le `state` protège contre le CSRF : il doit revenir identique.
  if (recue.searchParams.get("state") !== etat) {
    repondre("❌ `state` invalide, requête rejetée.");
    console.error("\n❌ `state` invalide — requête ignorée.");
    serveur.close();
    process.exitCode = 1;
    return;
  }

  try {
    const reponseToken = await fetch(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: recue.searchParams.get("code"),
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const jeton = await reponseToken.json();
    if (!reponseToken.ok) throw new Error(`token ${reponseToken.status} — ${JSON.stringify(jeton)}`);

    const reponseInfos = await fetch(USERINFO, {
      headers: { Authorization: `Bearer ${jeton.access_token}` },
    });
    const infos = await reponseInfos.json();
    if (!reponseInfos.ok) throw new Error(`userinfo ${reponseInfos.status} — ${JSON.stringify(infos)}`);

    writeFileSync(
      FICHIER_TOKEN,
      JSON.stringify(
        {
          access_token: jeton.access_token,
          expire_le: new Date(Date.now() + jeton.expires_in * 1000).toISOString(),
          person_urn: `urn:li:person:${infos.sub}`,
          nom: infos.name ?? null,
        },
        null,
        2,
      ) + "\n",
    );

    repondre("✅ Connecté. Token enregistré.");
    console.log(`\n✅ Token enregistré dans ${FICHIER_TOKEN}`);
    console.log(`   Membre : ${infos.name ?? "(nom non fourni)"} — urn:li:person:${infos.sub}`);
    console.log(`   Expire le : ${new Date(Date.now() + jeton.expires_in * 1000).toLocaleString("fr-FR")}`);
    console.log(`\nPublie maintenant : node scripts/linkedin/post.js "Ton texte"`);
  } catch (e) {
    repondre(`❌ Échec : ${e.message}`);
    console.error(`\n❌ ${e.message}`);
    process.exitCode = 1;
  } finally {
    serveur.close();
  }
});

serveur.listen(port, () => {
  console.log("\nOuvre cette URL dans ton navigateur :\n");
  console.log(url.toString());
  console.log(`\nEn attente du retour sur ${REDIRECT_URI} …`);
});
