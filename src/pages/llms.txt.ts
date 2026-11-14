import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "@/lib/site";
import { CAS_EN_LIGNE } from "@/lib/casEnLigne";

/**
 * llms.txt — point d'entrée pour les agents IA (https://llmstxt.org).
 * Refonte de novembre 2026 : l'offre en vigueur est l'intégration IA, avec un
 * diagnostic de 90 minutes comme porte d'entrée, et la formation à l'IA générative.
 * Seuls des faits publiés sur les pages du site figurent ici ; les études de cas
 * viennent de leurs fichiers (src/content/realisations, liste src/lib/casEnLigne.ts).
 */
export const GET: APIRoute = async () => {
  const cas = (await getCollection("realisations", ({ id, data }) => data.published && (CAS_EN_LIGNE as readonly string[]).includes(id)))
    .sort((a, b) => CAS_EN_LIGNE.indexOf(a.id as (typeof CAS_EN_LIGNE)[number]) - CAS_EN_LIGNE.indexOf(b.id as (typeof CAS_EN_LIGNE)[number]));
  const lines = [
    "# Julien Tridat — Intégration IA pour TPE et PME (Bordeaux, France)",
    "",
    "> Je comprends comment une entreprise travaille, puis je transforme ses tâches répétitives",
    "> en processus que l'IA exécute et que son équipe valide.",
    "> Basé à Bordeaux, j'interviens partout en France. Publicité (Publicis, Saatchi & Saatchi),",
    "> production média (France 24, Canal+, France 2), puis conseil ; plus de 300 dirigeants et",
    "> cadres formés et accompagnés à l'IA. Cible : les dirigeants de PME déçus par des promesses de l'IA",
    "> qui ne se concrétisent pas.",
    "",
    "Contenu en français.",
    "",
    "## Porte d'entrée : le diagnostic",
    "",
    "- 90 minutes, en visio ou en présentiel, 390 € HT, satisfait ou remboursé, déductible de l'intégration (offres Dirigeant augmenté, TPE augmentée, PME augmentée, PME augmentée +) si elle est lancée dans les 30 jours.",
    "- En séance : cartographie des 3 à 5 processus les plus chronophages, chiffrage des heures gagnées",
    "  par semaine et par collaborateur, feuille de route en 3 étapes. Sous 48 heures : un kit pour",
    "  lancer ses 3 premiers processus, avec la règle d'usage qui les encadre.",
    "",
    "## Méthode",
    "",
    "- Partir du métier : observer et écouter ceux qui font le travail ; ce sont eux qui définissent ce que l'IA prend en charge.",
    "- Une règle d'usage partagée : quels outils, quelles données, qui valide quoi.",
    "- Chaque processus est testé avant d'être déployé : mesure du temps actuel, test sur une dizaine de cas réels,",
    "  notation selon une grille définie avec le client ; on ne déploie que ce qui tient la mesure.",
    "- Aucun envoi ni aucune décision sans validation humaine ; l'IA n'accède qu'aux outils et données nécessaires.",
    "",
    "## Offres d'intégration (dimensionnées par le nombre d'utilisateurs formés)",
    "",
    "- Dirigeant augmenté : 1 utilisateur, 1 semaine, 2 500 € HT.",
    "- TPE augmentée : jusqu'à 10 utilisateurs, 2 à 4 semaines, 5 000 € HT.",
    "- PME augmentée : jusqu'à 30 utilisateurs, 4 à 8 semaines, 12 000 € HT.",
    "- PME augmentée + : jusqu'à 80 utilisateurs, 8 à 12 semaines, 25 000 € HT.",
    "- Au-delà de 80 utilisateurs : sur devis.",
    "- Inclus : immersion et ateliers avec les équipes, processus IA branchés sur les outils, règle d'usage IA,",
    "  rapport de mesure avant/après, formation des utilisateurs. Délais et prix fixés à la signature ;",
    "  les premiers processus tournent pendant le projet ; en cas de dérapage du planning, le travail continue aux frais de Julien Tridat.",
    "- Pilotage mensuel, en option (retester, mettre à jour, suivre le gain réel) : 300 à 1 200 € HT par mois selon la formule.",
    "",
    "## Formation à l'IA générative",
    "",
    "- En intra pour les entreprises (convention portée par un organisme certifié Qualiopi, financement OPCO possible),",
    "  ou comme intervenant pour les organismes de formation, sous leur certification.",
    "- À partir de 790 € HT. Présentiel, classe virtuelle ou mixte.",
    "",
    "## Pages",
    "",
    `- [Accueil — intégration IA et diagnostic](${SITE.url}/)`,
    `- [Formation à l'IA générative](${SITE.url}/formation-ia)`,
    `- [Intégration de l'IA pour les TPE et PME à Bordeaux](${SITE.url}/integration-ia-bordeaux)`,
    "",
    "## Études de cas",
    "",
    ...cas.map((c) => `- [${c.data.title}](${SITE.url}/realisations/${c.id}) — ${c.data.client}. ${c.data.pitch}`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
