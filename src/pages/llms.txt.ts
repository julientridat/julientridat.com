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
    "# Julien Tridat — Direction marketing externalisée pour PME (Bordeaux, France)",
    "",
    "> Je rejoins l'équipe du dirigeant plutôt que sa liste de prestataires : un mois pour installer",
    "> son marketing, puis chaque semaine à ses côtés pour le faire tourner.",
    "> Stratégie et exécution dans la même main : positionnement, identité, site, contenus,",
    "> campagnes, assistants IA installés dans les outils de l'entreprise, équipes formées.",
    "> Vingt ans de marketing. Depuis 2018, accompagnement de dirigeants de PME dans la croissance",
    "> de leur entreprise — c'est le cœur du métier. Par ailleurs, formation à l'intelligence",
    "> artificielle et accompagnement de la transition : plus de 300 dirigeants et cadres formés,",
    "> dans une cinquantaine d'organisations, dont",
    "> Dassault Systèmes et SNCF Fret. Marketing ET technique : e-mailing, gestion de projet,",
    "> espaces de travail partagés, sites, applications métier, automatisations — un seul",
    "> interlocuteur au lieu de trois prestataires.",
    "",
    "Ce site est un registre de preuves : chaque mission est documentée en étude de cas",
    "anonymisée (l'enjeu, le système déployé, la transformation obtenue), chaque analyse est publiée en note.",
    "Contenu en français. Contact : prise de rendez-vous de 20 minutes via le site.",
    "",
    "## Offre",
    "",
    "Pour les PME jusqu'à 30 salariés sans équipe marketing interne. Au-delà, c'est sur devis.",
    "",
    "- Mois 1 — Installation : 4 000 € HT. Positionnement et structure d'offre, identité, charte et",
    "  gabarits, 2 à 3 assistants IA installés dans les outils de l'entreprise, équipes formées.",
    "  Le client conserve l'intégralité des livrables, y compris s'il s'arrête à l'issue du premier mois.",
    "- Ensuite — Abonnement mensuel : 2 500 € HT par mois, sans engagement, résiliable à tout moment.",
    "  Point stratégique hebdomadaire de 45 minutes, accès direct des équipes sans intermédiaire,",
    "  une demande active à la fois livrée en 48 à 72 heures. Suspension possible sans perte de place.",
    "  Le client garde tous les livrables et les outils installés, y compris après résiliation.",
    "  Quatre clients en abonnement au maximum.",
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
    "## Pages",
    "",
    `- [Accueil](${SITE.url}/) : l'offre, son fonctionnement en deux temps, les prix`,
    `- [Cas clients](${SITE.url}/realisations) : le registre des transformations`,
    `- [Intégration IA](${SITE.url}/integration-ia) : audit des frictions (1 500 € HT) puis installation d'agents dans les outils existants, pôle par pôle — une équipe 6 000 € HT sur 4 à 6 semaines, deux à trois pôles 12 000 € HT sur 6 à 8 semaines, devis au-delà. Volet formation éligible à une prise en charge OPCO.`,
    `- [IA opérationnelle en agence](${SITE.url}/agences) : verticale de l'offre d'intégration, pour les agences de communication, marketing, brand content et media de 5 à 150 personnes — outils connectés, process refondus, trois à dix agents sur mesure en production, en 60 jours.`,
    `- [Formation à l'IA générative](${SITE.url}/formation-ia) : deux entrées — formation intra-entreprise (financement OPCO, convention portée par un organisme partenaire certifié) et intervention en sous-traitance pour organismes de formation (Qualiopi portée par le centre)`,
    `- [Notes](${SITE.url}/notes) : les analyses`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
