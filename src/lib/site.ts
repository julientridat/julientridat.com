export const SITE = {
  url: "https://julientridat.com",
  name: "Julien Tridat",
  title: "Julien Tridat — Consultant & Formateur IA pour Entreprises",
  description:
    "Consultant & formateur IA à Bordeaux. J'installe l'IA dans vos outils et je forme vos équipes en 2 mois.",
  googleSiteVerification: "U0bKj-WLWaStW6ymt9_vMvUeROa-Tcer6g29jCkLSkM",
} as const;

/** Google Calendar — page de prise de rendez-vous (identique au site d'origine). */
export const SCHEDULER_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2MIKzVXDt1av8z08mG370W0D-DIlPnpXMNZ991yUXHfKT0aPs2V--BQHQCXhB3EbJGBIJbXhsX?gv=true";

/**
 * Supabase — clé « publishable » anonyme : publique par design (elle est déjà
 * exposée dans le bundle JS du site en production). La sécurité repose sur la
 * politique RLS côté Supabase (insert-only, champs bornés).
 */
export const SUPABASE_URL = "https://wvxjmafrdrmjmjwbzflg.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2eGptYWZyZHJtam1qd2J6ZmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzA2NjgsImV4cCI6MjA5NDE0NjY2OH0.iY15DD29KAYHwresYH6dAUpWmF5tsJq5DXxltfcQDUU";

/** JSON-LD Person — injecté sur toutes les pages (Knowledge Graph / AEO). */
export const PERSON_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE.url}/#julien-tridat`,
  name: "Julien Tridat",
  jobTitle: "Consultant & formateur IA",
  description:
    "Consultant et formateur IA à Bordeaux. 20 ans d'expérience en marketing et accompagnement des entreprises. J'intègre l'IA dans les outils des PME et je forme leurs équipes.",
  url: SITE.url,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bordeaux",
    postalCode: "33000",
    addressRegion: "Nouvelle-Aquitaine",
    addressCountry: "FR",
  },
  knowsAbout: [
    "Intégration IA en entreprise",
    "Assistants IA sur mesure",
    "Formation IA métier",
    "Marketing B2B",
    "Claude",
    "ChatGPT",
    "Copilot",
    "Gemini",
  ],
  sameAs: [
    "https://marketingjoy.fr",
    // LinkedIn : URL exacte à confirmer par Julien avant ajout.
  ],
} as const;
