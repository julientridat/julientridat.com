export const SITE = {
  url: "https://julientridat.com",
  name: "Julien Tridat",
  title: "Julien Tridat — Intégration IA pour TPE et PME, Bordeaux",
  description:
    "Comprendre votre entreprise avant d'installer l'IA : vos tâches répétitives deviennent des processus IA que votre équipe valide. Diagnostic de 90 min.",
  googleSiteVerification: "U0bKj-WLWaStW6ymt9_vMvUeROa-Tcer6g29jCkLSkM",
} as const;

/** Adresse de contact — repli du formulaire de message (mailto). */
export const CONTACT_EMAIL = "julien.tridat@gmail.com";

/**
 * Web3Forms — envoie les messages du formulaire de contact par email
 * (vers CONTACT_EMAIL). Clé publique par design (usage côté client).
 */
export const WEB3FORMS_ACCESS_KEY = "12c7676a-7350-41af-a901-7e276d7ed8c9";

/**
 * Google Calendar — planning de l'ancien site. N'est plus utilisé par les pages vitrine
 * (seulement par les composants de l'ancien site, hors ligne) ; c'est le même planning
 * que SCHEDULER_DIAGNOSTIC_URL.
 */
export const SCHEDULER_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2MIKzVXDt1av8z08mG370W0D-DIlPnpXMNZ991yUXHfKT0aPs2V--BQHQCXhB3EbJGBIJbXhsX?gv=true";

/**
 * Stripe — lien de paiement du diagnostic, payé à la réservation (Julien, 10/11/2026).
 * Prix : 390 € HT, soit 468 € TTC — Julien est assujetti à la TVA (Julien, 11/11/2026).
 * Parcours : qualification → paiement Stripe → redirection vers /diagnostic-confirme,
 * qui affiche le planning de 90 minutes.
 * Lien du compte réel « JT Marketing » (vérifié le 11/11/2026) : 468 € TTC, taxe incluse,
 * adresse de facturation et nom de l'entreprise obligatoires, numéro de TVA facultatif.
 * Stripe n'envoie qu'un reçu : la facture part d'Abby, à la main.
 * Un lien de test existe (https://book.stripe.com/test_eVq8wPbs7c5LejY0D73oA00) : ne jamais
 * le mettre ici, il encaisserait des paiements fictifs. Vide, la fenêtre ouvrirait le
 * planning sans paiement.
 */
export const PAIEMENT_DIAGNOSTIC_URL = "https://book.stripe.com/eVq7sNemd2nkdlGdq3aZi00";

/**
 * Google Calendar — planning « Diagnostic IA » (90 minutes), lien donné par Julien le
 * 11/11/2026 (https://calendar.app.google/DoYc85UPJeqpqfSN7), en version intégrable.
 * C'est le seul planning du site : l'échange gratuit de 20 minutes n'existe plus et
 * « Une question avant ? » est une demande de rappel (RappelDialog, [data-open-rappel]).
 */
export const SCHEDULER_DIAGNOSTIC_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2MIKzVXDt1av8z08mG370W0D-DIlPnpXMNZ991yUXHfKT0aPs2V--BQHQCXhB3EbJGBIJbXhsX?gv=true";

/*
 * Il n'y a plus de base de données. Le projet Supabase qui recevait les traces
 * (`contact_messages`, `lead_qualifications`) a été supprimé — son domaine ne
 * résout plus. Les deux constantes qui pointaient dessus sont retirées avec
 * lui : les garder ferait échouer une requête à chaque envoi de formulaire.
 *
 * Web3Forms est désormais la seule voie, pour le contact comme pour la
 * qualification avant réservation.
 */

/** JSON-LD Person — injecté sur toutes les pages (Knowledge Graph / AEO). */
export const PERSON_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE.url}/#julien-tridat`,
  name: "Julien Tridat",
  jobTitle: "Intégrateur IA pour TPE et PME",
  description:
    "Vingt ans de marketing : la publicité chez Publicis et Saatchi & Saatchi, la production média pour France 24, Canal+ et France 2, puis le conseil aux entreprises. Je forme par ailleurs des organisations à l'intelligence artificielle et je les accompagne dans cette transition — plus de 300 dirigeants et cadres formés dans une cinquantaine d'organisations, dont Dassault Systèmes et SNCF Fret. Je couvre le marketing et la technique : e-mailing, gestion de projet, espaces de travail partagés, sites, applications métier, automatisations.",
  url: SITE.url,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bordeaux",
    postalCode: "33000",
    addressRegion: "Nouvelle-Aquitaine",
    addressCountry: "FR",
  },
  knowsAbout: [
    "Marketing B2B",
    "Stratégie de croissance",
    "Intelligence artificielle générative",
    "Automatisation d'entreprise",
    "Organisation et process d'entreprise",
    "Production de contenus",
  ],
  // Ce qui permet à Google de relier ce site aux profils qu'il connaît déjà
  // sous le même nom — il y a au moins deux homonymes. Seuls des profils
  // vérifiés : le compte X n'y est pas, faute d'avoir pu confirmer qu'il est
  // bien le sien.
  sameAs: [
    "https://www.linkedin.com/in/julien-tridat",
    "https://www.malt.fr/profile/julientridat",
  ],
} as const;
