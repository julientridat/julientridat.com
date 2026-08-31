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

/**
 * Supabase — clé « publishable » anonyme : publique par design (elle est déjà
 * exposée dans le bundle JS du site en production). La sécurité repose sur la
 * politique RLS côté Supabase (insert-only, champs bornés).
 */
export const SUPABASE_URL = "https://vizjvyuojwetalctdxer.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpemp2eXVvandldGFsY3RkeGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDM5MjksImV4cCI6MjA5OTE3OTkyOX0.hN-1EexqzaC9sXl1_U9jF53ipQ1_MQeLK3mmUsDnAgY";

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
  sameAs: [
    "https://marketingjoy.fr",
    // LinkedIn : URL exacte à confirmer par Julien avant ajout.
  ],
} as const;
