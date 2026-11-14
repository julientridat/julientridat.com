import type { APIRoute } from "astro";
import { SITE } from "@/lib/site";
import { CAS_EN_LIGNE } from "@/lib/casEnLigne";

/*
 * Refonte de novembre 2026 : le site vitrine se réduit à l'accueil (intégration IA)
 * et à la formation. Les études de cas et les notes sont hors ligne (redirigées vers
 * l'accueil, worker/redirections.ts) et sortent donc du plan du site, sauf celles
 * remises en ligne (src/lib/casEnLigne.ts).
 */
const ENTREES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/formation-ia", changefreq: "monthly", priority: "0.8" },
  // SEO local (12/11/2026) : la page Bordeaux et les études de cas remises en ligne.
  { path: "/integration-ia-bordeaux", changefreq: "monthly", priority: "0.8" },
  ...CAS_EN_LIGNE.map((slug) => ({ path: `/realisations/${slug}`, changefreq: "yearly", priority: "0.6" })),
];

// Date du build, déclarée comme dernière modification : chaque déploiement suit une
// modification du site. Google ignore changefreq et priority, mais lit <lastmod>
// pour décider de revenir explorer une page.
const LASTMOD = new Date().toISOString().slice(0, 10);

export const GET: APIRoute = () => {
  const urls = ENTREES.map((e) =>
    [
      "  <url>",
      `    <loc>${SITE.url}${e.path}</loc>`,
      `    <lastmod>${LASTMOD}</lastmod>`,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ].join("\n"),
  );

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
