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
    /** Regroupement orienté visiteur sur les pages de liste. */
    besoin: z.enum(["cadrer", "former", "produire", "rayonner"]).default("former"),
    /** Résumé en 1-2 phrases — utilisé sur les cartes, le llms.txt et la meta description. */
    pitch: z.string(),
    resultats: z
      .array(z.object({ chiffre: z.string(), label: z.string() }))
      .default([]),
    /** Capture d'écran illustrant l'artefact (chemin sous /public). */
    visuel: z.object({ src: z.string(), alt: z.string() }).optional(),
    /** Démo interactive liée (anonymisée ou sur données fictives). */
    demo: z.object({ url: z.string(), label: z.string() }).optional(),
    published: z.boolean().default(true),
    sortOrder: z.number().default(99),
  }),
});

/**
 * Outils — les systèmes construits : skills, projets IA clients, méthodes.
 * Chaque fiche documente ce que le système encode et ce qu'il produit.
 */
const outils = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/outils" }),
  schema: z.object({
    title: z.string(),
    type: z.enum(["Skill", "Projet client", "Méthode", "Infrastructure"]),
    /** Regroupement orienté visiteur. */
    besoin: z.enum(["decider", "marketing", "assistants", "operations"]).default("operations"),
    pitch: z.string(),
    /** Ce que le système encode (règles, charte, process). */
    encode: z.array(z.string()).default([]),
    /** Ce qu'il produit en sortie. */
    sorties: z.array(z.string()).default([]),
    /** Gain avant → après, cité dans les supports de mission. */
    gain: z.object({ avant: z.string(), apres: z.string(), tache: z.string() }).optional(),
    demo: z.object({ url: z.string(), label: z.string() }).optional(),
    caseUrl: z.string().optional(),
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

export const collections = { realisations, outils, notes };
