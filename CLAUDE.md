# CLAUDE.md — julientridat.com (plateforme personnelle Astro)

Lis ce fichier en entier avant toute action.

## Le projet

Plateforme personnelle de Julien Tridat, née d'une décision stratégique documentée dans
`src/content/notes/du-declaratif-a-l-auditable.md` : sortir du déclaratif (landing page)
pour un **registre de preuves** — études de cas anonymisées + notes d'analyse — lisible
par les humains ET par les agents IA (AEO).

Contraintes : **site statique, zéro base de données de contenu, zéro coût récurrent,
souveraineté totale (code versionné, aucun outil propriétaire).**

## Architecture

- `/` — one-page fidèle à l'ancien site Lovable (Hero, Constat, Méthode, Assistants,
  Offres, **Registre** [ajout], Références, À propos, CTA final). NE PAS reformuler les
  textes de vente sans demande explicite.
- `/realisations` + `/realisations/[slug]` — études de cas (collection `realisations`).
- `/notes` + `/notes/[slug]` — écrits d'analyse (collection `notes`).
- `sitemap.xml`, `llms.txt` — générés au build depuis les collections (`src/pages/*.ts`).
- Réservation : îlot React unique `src/components/react/BookingDialog.tsx`, monté par
  `BaseLayout`, ouvert par délégation sur tout `[data-open-booking]`.
  Qualification → insert Supabase (clé publique, RLS insert-only) → iframe Google Calendar.

## Charte (À RESPECTER FIDÈLEMENT)

Référence de design : `../page-replicator-charm/` (Lovable/React — LIRE, jamais modifier).
- Fond noir `oklch(0.145 0 0)`, accent lime `oklch(0.92 0.21 125)` (~#c8ff3d).
- **Geist** (sans) + **Instrument Serif** (les `<em>` passent en serif italique lime).
- Vocabulaire : `rounded-2xl`, bordures `white/10-15`, eyebrows uppercase `tracking-[0.22em]`,
  titres `font-light tracking-[-0.03em]`, boutons pilule.
- Tokens dans `src/styles/global.css` (Tailwind 4, config CSS-first, pas de tailwind.config).

## Règles éditoriales (NON NÉGOCIABLES)

1. **Anonymisation** : jamais de nom de client dans les études de cas (alias sectoriels).
2. **Aucun chiffre invérifiable** — ni inventé, ni « embelli ». Ce qui n'est pas prouvé
   n'est pas publié. Marquer [À VALIDER] et lister dans le README ce qui attend Julien.
3. Ton : direct, dense, première personne, français soigné, pas d'anglicismes gratuits.
4. Structure des études de cas : Contexte / Ce qui a été construit / Ce que ça a produit /
   Ce qu'il faut en retenir.

## SEO/AEO

- Balises home = version repo Lovable la plus récente (title « Consultant IA Bordeaux… »).
- `google-site-verification` conservée. Canonical absolu partout, `lang="fr"`.
- JSON-LD : `Person` (sitewide, `src/lib/site.ts`), `ProfessionalService` + `WebSite` (home),
  `Article` + `BreadcrumbList` (artefacts), `CollectionPage` (index).
- Après chaque modif : `npm run build` (exit 0, zéro warning attendu).

## Méthode de travail

Cadrer → faire valider → exécuter. Pas de génération en masse sans accord.
Français, ton direct, pair-à-pair.
