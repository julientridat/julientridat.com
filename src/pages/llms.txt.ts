import type { APIRoute } from "astro";
import { SITE } from "@/lib/site";

/**
 * llms.txt — point d'entrée pour les agents IA (https://llmstxt.org).
 * Refonte de novembre 2026 : l'offre en vigueur est l'intégration IA, avec un
 * diagnostic de 90 minutes comme porte d'entrée, et la formation à l'IA générative.
 * Seuls des faits publiés sur les deux pages du site figurent ici.
 */
export const GET: APIRoute = () => {
  const lines = [
    "# Julien Tridat — Intégration IA pour TPE et PME (Bordeaux, France)",
    "",
    "> J'audite les processus d'une entreprise, je construis des assistants IA dans les outils",
    "> qu'elle utilise déjà (Microsoft 365, Google Workspace, Notion), puis je forme ses équipes",
    "> à les utiliser. Basé à Bordeaux, j'interviens partout en France. Publicité (Publicis,",
    "> Saatchi & Saatchi), production média (France 24, Canal+, France 2), conseil aux entreprises",
    "> depuis dix ans ; plus de 300 dirigeants et cadres formés et accompagnés à l'IA depuis trois ans.",
    "",
    "Contenu en français.",
    "",
    "## Porte d'entrée : le diagnostic",
    "",
    "- 90 minutes, en visio ou en présentiel, 390 € HT, satisfait ou remboursé, déduits si une offre est signée dans les 30 jours.",
    "- Cartographie de 3 à 5 processus, identification des 2 ou 3 assistants IA qui rapportent tout de suite,",
    "  gain indicatif en heures par semaine et par collaborateur, feuille de route en 3 étapes ;",
    "  sous 48 heures, un kit pour construire soi-même ses 3 premiers assistants. Les brancher sur",
    "  les outils de l'entreprise et former l'équipe relèvent des offres d'intégration.",
    "",
    "## Offres d'intégration (dimensionnées par le nombre d'utilisateurs formés)",
    "",
    "- Dirigeant augmenté : 1 utilisateur, 1 semaine, 2 500 €.",
    "- TPE augmentée : jusqu'à 10 utilisateurs, 2 à 4 semaines, 5 000 €.",
    "- PME augmentée : jusqu'à 30 utilisateurs, 4 à 8 semaines, 12 000 €.",
    "- PME augmentée + : jusqu'à 80 utilisateurs, 8 à 12 semaines, 25 000 €.",
    "- Au-delà de 80 utilisateurs : sur devis. Maintenance évolutive : 300 à 1 200 € par mois selon l'offre.",
    "- Les assistants sont déployés par vagues ; le planning est signé avec le devis.",
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
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
