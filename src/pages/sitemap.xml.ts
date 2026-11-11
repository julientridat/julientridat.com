import type { APIRoute } from "astro";
import { SITE } from "@/lib/site";

/*
 * Refonte de novembre 2026 : le site vitrine se réduit à l'accueil (intégration IA)
 * et à la formation. Les études de cas et les notes sont hors ligne (redirigées vers
 * l'accueil, worker/redirections.ts) et sortent donc du plan du site.
 */
const ENTREES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/formation-ia", changefreq: "monthly", priority: "0.8" },
];

export const GET: APIRoute = () => {
  const urls = ENTREES.map((e) =>
    [
      "  <url>",
      `    <loc>${SITE.url}${e.path}</loc>`,
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
