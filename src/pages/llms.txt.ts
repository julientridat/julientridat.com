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
    "> Je deviens la direction marketing des PME qui n'en ont pas : un mois de démarrage,",
    "> puis un livrable à date chaque semaine, suivi dans un tableau de bord partagé.",
    "> Stratégie et exécution dans la même main : positionnement, identité, site, contenus,",
    "> campagnes. L'IA est l'outil de production du prestataire : le client garde les livrables, pas les agents.",
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
    "Pour les PME jusqu'à 50 salariés sans équipe marketing interne. Au-delà, c'est sur devis.",
    "",
    "- Abonnement mensuel : 2 500 € HT par mois dès le premier mois, prélevé en début de mois.",
    "  Trois mois d'engagement, puis sans engagement.",
    "- Pour tester avant de s'engager : un projet de 30 jours, 2 500 € HT, sans engagement",
    "  (une campagne, un événement, un projet d'édition, un site à créer).",
    "- Transformation IA : le dirigeant est formé en priorité (compris dans l'abonnement),",
    "  puis les commerciaux et les équipes administratives (en option).",
    "- Mois 1, le mois de démarrage : semaine 1, état des lieux ; semaine 2, plan sur douze mois",
    "  (trois premiers mois détaillés) et actions du mois suivant validées ; semaine 3, positionnement et charte ;",
    "  semaine 4, modèles et premier livrable du plan.",
    "- Ensuite : le plan mis en œuvre chaque semaine, un livrable à date, point hebdomadaire de 45 minutes,",
    "  demandes hors plan livrées entre J+1 et J+3, tableau de bord partagé en direct.",
    "  Après les trois premiers mois, arrêt et reprise à tout moment, pour un mois ou plus.",
    "  Encadrement possible des alternants, community managers et profils juniors du client.",
    "  Le client garde tous les livrables (contenus, charte, modèles, fichiers sources), y compris après résiliation.",
    "  Les agents et skills IA utilisés pour produire restent chez le prestataire.",
    "  Six PME accompagnées à la fois. Bordeaux et à distance.",
    "",
    "## Cas clients (études de cas anonymisées — enjeu, système déployé, transformation)",
    "",
    ...realisations.map(
      (r) =>
        `- [${r.data.title}](${SITE.url}/realisations/${r.id}) : ${r.data.transformation ?? r.data.pitch} (${r.data.client}, ${r.data.periode ?? r.data.annee})`,
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
    `- [Intégration IA](${SITE.url}/integration-ia) : audit des frictions (1 500 € HT) puis installation d'agents dans les outils existants, pôle par pôle — une équipe 6 000 € HT sur 4 à 6 semaines, deux à trois pôles 12 000 € HT sur 6 à 8 semaines, devis au-delà. Écart avant/après relevé sur trois tâches à huit semaines, par ceux qui les font. Volet formation éligible à une prise en charge OPCO.`,
    `- [IA opérationnelle en agence](${SITE.url}/agences) : verticale de l'offre d'intégration, pour les agences de communication, marketing, brand content et media de 5 à 150 personnes — outils connectés, process refondus, trois à dix agents sur mesure en production, en 60 jours.`,
    `- [Formation à l'IA générative](${SITE.url}/formation-ia) : deux entrées — formation intra-entreprise (financement OPCO, convention portée par un organisme partenaire certifié) et intervention en sous-traitance pour organismes de formation (Qualiopi portée par le centre). À partir de 790 € HT la demi-journée.`,
    `- [Notes](${SITE.url}/notes) : les analyses`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
