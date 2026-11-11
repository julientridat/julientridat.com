/**
 * Études de cas remises en ligne après la refonte de novembre 2026 (SEO local,
 * Julien, 12/11/2026). Elles répondent à /realisations/<slug> ; toutes les autres
 * adresses de l'ancien site restent redirigées vers l'accueil (worker/redirections.ts).
 *
 * Choix : des cas d'intégration ou de formation IA, ancrés en Gironde ou dans le
 * Sud-Ouest, cohérents avec l'offre en vigueur. Pour en remettre un autre en ligne :
 * ajouter son slug (nom du fichier dans src/content/realisations, sans .md).
 *
 * Module sans dépendance : il est lu à la fois par Astro et par le Worker.
 */
export const CAS_EN_LIGNE = [
  "courtier-assurance-btp",
  "formation-club-affaires",
  "offre-formation-ia-qualiopi",
  "association-benevoles-autonome",
] as const;

export const estCasEnLigne = (slug: string) => (CAS_EN_LIGNE as readonly string[]).includes(slug);
