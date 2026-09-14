/**
 * Adresse unique du site.
 *
 * Le site répondait 200 sur quatre adresses — http et https, avec et sans
 * www —, soit quatre copies de chaque page aux yeux de Google, qui partageait
 * entre elles l'exploration et les signaux au lieu de les concentrer. Tout
 * converge désormais en 301 vers https://julientridat.com, chemin et
 * paramètres conservés.
 *
 * Ne fonctionne que parce que wrangler.jsonc fait passer les pages par le
 * Worker AVANT les assets (run_worker_first) : sans cela, une page statique
 * est servie sans que le Worker la voie jamais.
 *
 * Isolé dans ce module plutôt qu'écrit dans index.ts : un export nommé du
 * module principal serait lu par Cloudflare comme un point d'entrée.
 */
const HOTE = "julientridat.com";

export function redirectionCanonique(request: Request): Response | null {
  // GET et HEAD seulement : une 301 transforme un POST en GET chez la plupart
  // des clients, et l'appel à /api/experience perdrait son corps.
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const url = new URL(request.url);
  // localhost, *.workers.dev, aperçus de déploiement : on ne touche à rien.
  if (url.hostname !== HOTE && url.hostname !== `www.${HOTE}`) return null;
  if (url.protocol === "https:" && url.hostname === HOTE) return null;

  url.protocol = "https:";
  url.hostname = HOTE;
  url.port = "";
  return Response.redirect(url.toString(), 301);
}
