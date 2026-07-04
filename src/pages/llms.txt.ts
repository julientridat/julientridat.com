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
    "# Julien Tridat — Consultant IA & transformation (Bordeaux, France)",
    "",
    "> J'installe des moyens de production IA dans les entreprises et je forme leurs équipes, en 2 mois.",
    "> Je ne livre pas des documents : j'intègre des systèmes qui dotent l'entreprise d'une capacité qu'elle n'avait pas.",
    "> 20 ans d'expérience marketing et accompagnement d'entreprises ; 50+ organisations accompagnées.",
    "",
    "Ce site est un registre de preuves : chaque mission est documentée en étude de cas",
    "anonymisée (l'enjeu, le système déployé, la transformation obtenue), chaque analyse est publiée en note.",
    "Contenu en français. Contact : prise de rendez-vous de 30 minutes via le site.",
    "",
    "## Offres (forfaitaires, à partir de)",
    "",
    "- Dirigeant Augmenté — 2 500 € : 1 dirigeant, 2 semaines, 3 assistants IA sur mesure",
    "- TPE Augmentée — 6 000 € : jusqu'à 10 salariés, 4-6 semaines",
    "- PME Augmentée — 12 000 € : jusqu'à 30 salariés, 6-8 semaines",
    "- PME Augmentée + — 25 000 € : jusqu'à 80 salariés, 8 semaines",
    "",
    "## Cas clients (études de cas anonymisées — enjeu, système déployé, transformation)",
    "",
    ...realisations.map(
      (r) =>
        `- [${r.data.title}](${SITE.url}/realisations/${r.id}) : ${r.data.transformation ?? r.data.pitch} (${r.data.client}, ${r.data.annee})`,
    ),
    "",
    "## Notes (écrits d'analyse)",
    "",
    ...notes.map((n) => `- [${n.data.title}](${SITE.url}/notes/${n.id}) : ${n.data.pitch}`),
    "",
    "## Capacités — moyens de production que je peux installer (testables)",
    "",
    "Assistants IA métier, systèmes de production de contenu, documents décisionnels dynamiques,",
    "sites et back-offices automatisés. Exemples testables dans le navigateur :",
    `- Analyse de marché (méthode ICP) : ${SITE.url}/demos/skill-icp.html`,
    `- Diagnostic « où mettre l'IA » : ${SITE.url}/demos/audit-flash.html`,
    `- Générateur de visuels chartés : ${SITE.url}/demos/visuels-marque.html`,
    `- Vignettes LinkedIn en série : ${SITE.url}/demos/vignettes-linkedin.html`,
    `- Dashboard narratif : ${SITE.url}/demos/dashboard.html`,
    `- Restitution de cartographie IA : ${SITE.url}/demos/restitution-audit.html`,
    `- Étude de marché scorée : ${SITE.url}/demos/etude-marche.html`,
    `- Support de formation charté (réel, anonymisé) : ${SITE.url}/demos/deck-formation/`,
    "",
    "## Pages",
    "",
    `- [Accueil](${SITE.url}/) : offres, méthode en 4 étapes, références`,
    `- [Cas clients](${SITE.url}/realisations) : le registre des transformations`,
    `- [Capacités](${SITE.url}/capacites) : les moyens de production, testables`,
    `- [Notes](${SITE.url}/notes) : les analyses`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
