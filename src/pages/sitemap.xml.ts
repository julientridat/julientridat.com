import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "@/lib/site";

interface Entry {
  path: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

export const GET: APIRoute = async () => {
  const realisations = await getCollection("realisations", ({ data }) => data.published);
  const notes = await getCollection("notes", ({ data }) => data.published);

  const entries: Entry[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/realisations", changefreq: "monthly", priority: "0.8" },
    { path: "/demos", changefreq: "monthly", priority: "0.8" },
    { path: "/outils", changefreq: "monthly", priority: "0.8" },
    { path: "/notes", changefreq: "monthly", priority: "0.8" },
    ...realisations.map((r) => ({
      path: `/realisations/${r.id}`,
      changefreq: "yearly",
      priority: "0.7",
    })),
    ...notes.map((n) => ({
      path: `/notes/${n.id}`,
      changefreq: "yearly",
      priority: "0.7",
      lastmod: n.data.date.toISOString().slice(0, 10),
    })),
  ];

  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${SITE.url}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
};
