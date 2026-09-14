export const SITE = {
  url: "https://julientridat.com",
  name: "Julien Tridat",
  title: "Julien Tridat — Direction marketing externalisée pour PME",
  description:
    "Je rejoins votre équipe : un mois pour installer votre marketing, puis chaque semaine à vos côtés pour le faire tourner. 2 500 € par mois, sans engagement.",
  googleSiteVerification: "U0bKj-WLWaStW6ymt9_vMvUeROa-Tcer6g29jCkLSkM",
} as const;

/** Adresse de contact — repli du formulaire de message (mailto). */
export const CONTACT_EMAIL = "julien.tridat@gmail.com";

/**
 * Web3Forms — envoie les messages du formulaire de contact par email
 * (vers CONTACT_EMAIL). Clé publique par design (usage côté client).
 */
export const WEB3FORMS_ACCESS_KEY = "12c7676a-7350-41af-a901-7e276d7ed8c9";

/** Google Calendar — page de prise de rendez-vous (identique au site d'origine). */
export const SCHEDULER_URL =
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
  jobTitle: "Consultant marketing et IA indépendant",
  description:
    "Vingt ans de marketing. Depuis 2018, j'accompagne des dirigeants de PME dans la croissance de leur entreprise. Je forme par ailleurs des organisations à l'intelligence artificielle et je les accompagne dans cette transition — plus de 300 dirigeants et cadres formés dans une cinquantaine d'organisations, dont Dassault Systèmes et SNCF Fret. Je couvre le marketing et la technique : e-mailing, gestion de projet, espaces de travail partagés, sites, applications métier, automatisations.",
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
    "https://marketingjoy.fr",
  ],
} as const;
