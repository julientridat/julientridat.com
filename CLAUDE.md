# CLAUDE.md — julientridat.com (plateforme personnelle Astro)

Lis ce fichier en entier avant toute action.

## Le projet

Plateforme personnelle de Julien Tridat, née d'une décision stratégique documentée dans
`src/content/notes/du-declaratif-a-l-auditable.md` : sortir du déclaratif (landing page)
pour un **registre de preuves** — études de cas anonymisées + notes d'analyse — lisible
par les humains ET par les agents IA (AEO).

Contraintes : **site statique, zéro base de données de contenu, zéro coût récurrent,
souveraineté totale (code versionné, aucun outil propriétaire).**

## Architecture (refonte de novembre 2026)

- `/` — accueil : intégration IA pour TPE et PME, diagnostic payant de 90 minutes comme
  porte d'entrée, quatre offres dimensionnées par le nombre d'utilisateurs formés.
- `/formation-ia` — formation à l'IA générative ; textes dans `src/contenu/formation-ia.json` (/admin).
- `/mentions-legales`, `404`.
- Pages retirées (ancien site) : 301 vers l'accueil, liste dans `worker/redirections.ts`.
  Les collections `realisations` et `notes` restent dans `src/content/`, hors ligne.
- Inchangés : `/tableau` (page applicative, hors mise en page vitrine), `/mcp`, enquêtes, `/admin`.
- `sitemap.xml`, `llms.txt` : réduits aux deux pages vitrine (`src/pages/*.ts`).
- Réservation : îlot React `BookingDialog`, ouvert par `[data-open-booking]`.
  `data-open-booking="diagnostic"` → diagnostic 90 min (`SCHEDULER_DIAGNOSTIC_URL`) ;
  `data-open-booking="echange"` → échange gratuit de 20 min (`SCHEDULER_URL`).
  Diagnostic payé à la réservation : qualification → `PAIEMENT_DIAGNOSTIC_URL` (Stripe) →
  `/diagnostic-confirme` (noindex) qui affiche le planning de 90 min.
  Contact : `[data-open-contact]`. « Une question avant ? » : lien vers `QUESTION_URL` (Google Agenda).

## Charte (À RESPECTER FIDÈLEMENT) — « planning »

Référence : l'artefact Design System « Julien Tridat » ; tokens dans `src/styles/vitrine.css`.
- Fond `#F5F7F9`, surfaces blanches, encre `#101214`, **un seul accent : vert `#0A7350`**,
  réservé à ce qui est livré ou tenu (seconde phrase des titres, statuts). Surligneur
  `#FFE45C` uniquement sur la mention de durée du bouton principal.
- **Barlow Condensed** (titres, toujours en capitales) + **Public Sans** (texte). Pas d'italique.
- Angles droits partout, cadres de 2 px d'encre, filets de 1 px. Aucune ombre, aucun dégradé.
- Les fenêtres React (global.css, Tailwind) héritent de la charte par leurs variables,
  surchargées dans `vitrine.css`. `BaseLayout` ne sert plus qu'aux enquêtes.

## Règles éditoriales (NON NÉGOCIABLES)

1. **Anonymisation** : jamais de nom de client dans les études de cas (alias sectoriels).
2. **Aucun chiffre invérifiable** — ni inventé, ni « embelli ». Ce qui n'est pas prouvé
   n'est pas publié. Marquer [À VALIDER] et lister dans le README ce qui attend Julien.
3. Ton : direct, dense, première personne, français soigné, pas d'anglicismes gratuits.
4. Structure des études de cas : Contexte / Ce qui a été construit / Ce que ça a produit /
   Ce qu'il faut en retenir.

## SEO/AEO

- Balises home : title « Intégration IA pour TPE et PME à Bordeaux | Julien Tridat ».
- `google-site-verification` conservée. Canonical absolu partout, `lang="fr"`.
- JSON-LD : `Person` (sitewide, `src/lib/site.ts`), `ProfessionalService` + `WebSite` (home),
  `Article` + `BreadcrumbList` (artefacts), `CollectionPage` (index).
- Après chaque modif : `npm run build` (exit 0, zéro warning attendu).

## Méthode de travail

Cadrer → faire valider → exécuter. Pas de génération en masse sans accord.
Français, ton direct, pair-à-pair.
