/**
 * Pages retirées à la refonte de novembre 2026.
 *
 * L'ancien site (direction marketing externalisée, études de cas, notes, pages
 * d'offres) est mis hors ligne. Ses adresses répondent désormais en 301 vers
 * l'accueil plutôt qu'en 404 : les liens déjà partagés et les signaux acquis
 * dans Google aboutissent sur la nouvelle offre.
 *
 * Les contenus restent dans le dépôt (src/content/realisations, src/content/notes,
 * src/contenu/*.json) : une page peut être remise en ligne en recréant sa route
 * et en la retirant de cette liste.
 *
 * Isolé dans ce module plutôt qu'écrit dans index.ts : un export nommé du
 * module principal serait lu par Cloudflare comme un point d'entrée.
 */
const RETIREES = [
  "/integration-ia",
  "/installation-ia",
  "/transformation",
  "/avant-de-recruter",
  "/agences",
  "/experience",
  "/realisations",
  "/notes",
];

export function redirectionAncienSite(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const chemin = url.pathname.replace(/\/+$/, "") || "/";
  const retiree = RETIREES.some((p) => chemin === p || chemin.startsWith(`${p}/`));
  if (!retiree) return null;
  return Response.redirect(new URL("/", url).toString(), 301);
}
