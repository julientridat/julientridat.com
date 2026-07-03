import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "@/lib/site";

/**
 * llms.txt — point d'entrée pour les agents IA (https://llmstxt.org).
 * Généré au build depuis les collections : toujours synchrone avec le site.
 */
export const GET: APIRoute = async () => {
  const realisations = (await getCollection("realisations", ({ data }) => data.published)).sort(
    (a, b) => a.data.sortOrder - b.data.sortOrder,
  );
  const notes = (await getCollection("notes", ({ data }) => data.published)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  const lines = [
    "# Julien Tridat — Consultant & formateur IA (Bordeaux, France)",
    "",
    "> J'intègre l'IA dans les outils des PME et je forme leurs équipes, en 2 mois.",
    "> Audit terrain, assistants IA sur mesure calibrés métier, formation par cas d'usage réels.",
    "> 20 ans d'expérience marketing et accompagnement d'entreprises ; 50+ organisations accompagnées.",
    "",
    "Ce site est un registre de preuves : chaque mission est documentée en étude de cas",
    "anonymisée (contexte, ce qui a été construit, résultats), chaque analyse est publiée en note.",
    "Contenu en français. Contact : prise de rendez-vous de 30 minutes via le site.",
    "",
    "## Offres (forfaitaires, à partir de)",
    "",
    "- Dirigeant Augmenté — 2 500 € : 1 dirigeant, 2 semaines, 3 assistants IA sur mesure",
    "- TPE Augmentée — 6 000 € : jusqu'à 10 salariés, 4-6 semaines",
    "- PME Augmentée — 12 000 € : jusqu'à 30 salariés, 6-8 semaines",
    "- PME Augmentée + — 25 000 € : jusqu'à 80 salariés, 8 semaines",
    "",
    "## Réalisations (études de cas anonymisées)",
    "",
    ...realisations.map(
      (r) =>
        `- [${r.data.title}](${SITE.url}/realisations/${r.id}) : ${r.data.pitch} (${r.data.client}, ${r.data.annee})`,
    ),
    "",
    "## Notes (écrits d'analyse)",
    "",
    ...notes.map((n) => `- [${n.data.title}](${SITE.url}/notes/${n.id}) : ${n.data.pitch}`),
    "",
    "## Pages",
    "",
    `- [Accueil](${SITE.url}/) : offres, méthode en 4 étapes, références`,
    `- [Réalisations](${SITE.url}/realisations) : le registre complet`,
    `- [Notes](${SITE.url}/notes) : les analyses`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
