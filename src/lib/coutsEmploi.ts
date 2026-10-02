/**
 * Coûts d'un recrutement en 2026 — règles officielles, pour l'évaluateur de
 * /avant-de-recruter. Chaque constante porte sa source ; à revoir à chaque
 * revalorisation du SMIC et à chaque loi de financement de la Sécurité sociale.
 *
 * Vérifié le 01/10/2026 :
 *  - urssaf.fr, « Réduction générale des cotisations » (mise à jour 13/07/2026) :
 *    RGDU, coefficient 0,0200 + 0,3781 × [½ × (3 × SMIC / salaire − 1)]^1,75
 *    sous 3 SMIC, SMIC de janvier retenu pour toute l'année 2026 ;
 *  - API mon-entreprise.urssaf.fr (calcul au 01/07/2026, 20 salariés, AT 2,08 %,
 *    mutuelle 20 €) : 43,4 % de cotisations patronales hors réduction. La formule
 *    ci-dessous retrouve ses résultats à l'euro près (2 000 € brut → 2 259 €) ;
 *  - service-public.gouv.fr F2918 (apprentissage), F23556 (aide à l'embauche,
 *    décret 2026-168), F39190 (participation de 750 €), F32131 (gratification
 *    de stage) ; Code du travail L1221-19 (période d'essai) ;
 *  - Apec, « Pratiques de recrutement de cadres 2026 » : 12 semaines en moyenne.
 *
 * Non compté, donc coût réel un peu plus élevé : versement mobilité, 13e mois,
 * médecine du travail, poste de travail, temps du dirigeant.
 */

export const ABONNEMENT_HT = 2500;

const SMIC_JANVIER_2026 = 1823.03; // base de la réduction générale en 2026
export const SMIC_MENSUEL = 1867.02; // depuis le 1er juin 2026
const TAUX_PATRONAL = 0.434;
const MUTUELLE = 20;

/** Coût employeur mensuel d'un CDI ou CDD non-cadre à temps plein (estimation Urssaf 2026). */
export function coutEmployeur(brutMensuel: number): number {
  if (!(brutMensuel > 0)) return 0;
  const ratio = (3 * SMIC_JANVIER_2026) / brutMensuel;
  const coef = ratio > 1 ? Math.min(0.3981, 0.02 + 0.3781 * Math.pow(0.5 * (ratio - 1), 1.75)) : 0;
  return Math.round(brutMensuel * (1 + TAUX_PATRONAL) + MUTUELLE - coef * brutMensuel);
}

/** Apprentissage : salaire minimal de 1re année en % du SMIC, par âge. */
export const TRANCHES_AGE = [
  { id: "16-17", libelle: "16 à 17 ans", pct: 0.27 },
  { id: "18-20", libelle: "18 à 20 ans", pct: 0.43 },
  { id: "21-25", libelle: "21 à 25 ans", pct: 0.53 },
  { id: "26+", libelle: "26 ans et plus", pct: 1 },
] as const;

/** Aide à l'embauche d'un apprenti, entreprise de moins de 250 salariés, 1re année. */
export const NIVEAUX = [
  { id: "bac", libelle: "Jusqu'au bac", aide: 5000, participation: 0 },
  { id: "bac2", libelle: "Bac+2", aide: 4500, participation: 0 },
  { id: "bac3", libelle: "Bac+3 à bac+5", aide: 2000, participation: 750 },
] as const;

/**
 * Coût mensuel d'un apprenti en 1re année : salaire minimal, cotisations
 * résiduelles (5,7 % dans le calcul Urssaf de référence), moins l'aide, plus
 * la participation forfaitaire, toutes deux étalées sur 12 mois.
 */
export function coutApprenti(age: (typeof TRANCHES_AGE)[number]["id"], niveau: (typeof NIVEAUX)[number]["id"]) {
  const t = TRANCHES_AGE.find((x) => x.id === age) ?? TRANCHES_AGE[2];
  const n = NIVEAUX.find((x) => x.id === niveau) ?? NIVEAUX[2];
  const salaire = t.pct * SMIC_MENSUEL;
  return Math.round(salaire * 1.057 - n.aide / 12 + n.participation / 12);
}

/** Stage : gratification minimale (4,50 € de l'heure, 35 heures par semaine). */
export const GRATIFICATION_STAGE = Math.round(4.5 * 151.67);

export const ESSAI_EMPLOYE_MOIS = 2; // CDI employé, renouvelable une fois si la branche le prévoit
export const ESSAI_APPRENTI_JOURS = 45; // jours de formation pratique en entreprise
export const RECRUTEMENT_SEMAINES = 12; // Apec 2026, recrutements de cadres

export const euros = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} €`;
