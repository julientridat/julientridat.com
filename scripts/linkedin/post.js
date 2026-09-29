/**
 * Publie un post texte sur LinkedIn via l'API officielle (Posts API).
 *
 *   node scripts/linkedin/post.js "Mon texte"
 *   node scripts/linkedin/post.js --fichier brouillon.txt
 *   node scripts/linkedin/post.js --visibilite CONNECTIONS "Mon texte"
 *
 * Nécessite un token valide : lance d'abord `node scripts/linkedin/auth.js`.
 */
import { readFileSync, existsSync } from "node:fs";
import { chargerEnv, FICHIER_TOKEN, versionApi } from "./env.js";

const POSTS = "https://api.linkedin.com/rest/posts";

/**
 * Le champ `commentary` utilise le format texte de LinkedIn, dans lequel
 * ces caractères sont réservés et doivent être échappés par un antislash.
 * Sans ça, l'API renvoie une 422 sur un texte contenant par exemple des parenthèses.
 */
function echapper(texte) {
  return texte.replace(/[\\|{}@\[\]()<>#*_~]/g, (c) => `\\${c}`);
}

function lireArguments(argv) {
  const args = [...argv];
  let visibilite = "PUBLIC";
  let texte = null;

  while (args.length) {
    const a = args.shift();
    if (a === "--visibilite") visibilite = args.shift();
    else if (a === "--fichier") {
      const chemin = args.shift();
      if (!existsSync(chemin)) throw new Error(`Fichier introuvable : ${chemin}`);
      texte = readFileSync(chemin, "utf8").trim();
    } else texte = a;
  }

  if (!texte) {
    throw new Error(
      'Texte manquant.\n  node scripts/linkedin/post.js "Mon texte"\n  node scripts/linkedin/post.js --fichier brouillon.txt',
    );
  }
  if (!["PUBLIC", "CONNECTIONS"].includes(visibilite)) {
    throw new Error("--visibilite doit valoir PUBLIC ou CONNECTIONS");
  }
  return { texte, visibilite };
}

function chargerToken() {
  if (!existsSync(FICHIER_TOKEN)) {
    throw new Error("Aucun token. Lance d'abord : node scripts/linkedin/auth.js");
  }
  const token = JSON.parse(readFileSync(FICHIER_TOKEN, "utf8"));
  if (new Date(token.expire_le) <= new Date()) {
    throw new Error("Token expiré. Relance : node scripts/linkedin/auth.js");
  }
  return token;
}

let texte, visibilite, token;
try {
  ({ texte, visibilite } = lireArguments(process.argv.slice(2)));
  chargerEnv();
  token = chargerToken();
} catch (e) {
  console.error(`\n❌ ${e.message}`);
  process.exit(1);
}

const reponse = await fetch(POSTS, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token.access_token}`,
    "Content-Type": "application/json",
    "LinkedIn-Version": versionApi(),
    "X-Restli-Protocol-Version": "2.0.0",
  },
  body: JSON.stringify({
    author: token.person_urn,
    commentary: echapper(texte),
    visibility: visibilite,
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  }),
});

if (!reponse.ok) {
  console.error(`\n❌ Échec (HTTP ${reponse.status})\n${await reponse.text()}`);
  process.exit(1);
}

// L'API répond 201 sans corps : l'URN du post est dans l'en-tête x-restli-id.
const urn = reponse.headers.get("x-restli-id");
console.log(`\n✅ Post publié — ${urn}`);
if (urn) console.log(`   https://www.linkedin.com/feed/update/${urn}/`);
