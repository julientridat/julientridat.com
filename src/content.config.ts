import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Réalisations — études de cas anonymisées.
 * Règle : aucun chiffre non vérifié. Les données incertaines portent [À VALIDER].
 */
const realisations = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/realisations" }),
  schema: z.object({
    title: z.string(),
    /** Alias anonymisé du client, ex. « Éditeur-formateur, secteur santé ». */
    client: z.string(),
    secteur: z.string(),
    annee: z.number(),
    role: z.string(),
    stack: z.array(z.string()).default([]),
    /** Résumé en 1-2 phrases — utilisé sur les cartes, le llms.txt et la meta description. */
    pitch: z.string(),
    resultats: z
      .array(z.object({ chiffre: z.string(), label: z.string() }))
      .default([]),
    published: z.boolean().default(true),
    sortOrder: z.number().default(99),
  }),
});

/** Notes — écrits d'analyse (essais, méthodes, post-mortems). */
const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** Résumé en 1-2 phrases — cartes, llms.txt, meta description. */
    pitch: z.string(),
    published: z.boolean().default(true),
  }),
});

export const collections = { realisations, notes };
