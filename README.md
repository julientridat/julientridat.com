# julientridat.com — plateforme personnelle (Astro)

Site statique souverain de Julien Tridat : vitrine conseil/formation IA **et** registre
d'artefacts (études de cas anonymisées + notes d'analyse), structuré pour les humains
comme pour les agents IA (JSON-LD, `llms.txt`).

Remplace la version Lovable (`page-replicator-charm`, conservée en lecture seule comme
référence de design).

## Stack

- **Astro 5** (statique, 100 % HTML pré-rendu) + **React 19** (un seul îlot : le dialogue
  de réservation) + **Tailwind 4** (config CSS-first dans `src/styles/global.css`).
- **Aucune base de données** pour le contenu. Supabase est conservé uniquement pour la
  qualification de leads (insert-only, clé publique, RLS côté Supabase).
- Prise de RDV : iframe Google Calendar (URL dans `src/lib/site.ts`).

## Commandes

```bash
npm install
npm run dev        # dev server http://localhost:4321
npm run build      # build statique → dist/
npm run preview    # sert dist/ en local
```

## Page /experience — IA en direct (Worker)

La page `/experience` est un **parcours guidé** (une vue à la fois, pas de scroll
global) : le visiteur donne l'adresse de son site → les skills d'audit le mesurent
en direct (radar, compteurs) → il choisit son étude — concurrence (lecture des sites
concurrents), cibles idéales, nouvel axe marketing, semaine avec assistant — puis
l'assistant de qualification prépare l'audit. Chaque texte est généré par une vraie
inférence servie par le Worker (`worker/index.ts`, `POST /api/experience`, flux SSE) ;
sans site, le quiz de maturité fournit le contexte déclaré.

Moteur **hybride**, dans cet ordre :
1. **Claude** (API Anthropic) si le secret est posé :
   `npx wrangler secret put ANTHROPIC_API_KEY`
   Modèle par défaut : `claude-opus-4-8` (qualité maximale). Pour diviser le coût
   par ~5 : variable `CLAUDE_MODEL=claude-haiku-4-5` dans `wrangler.jsonc` (`vars`).
2. **Workers AI** (Llama 3.3, binding `AI`) en bascule automatique — inclus dans le
   plan Cloudflare, zéro clé, zéro coût récurrent. C'est le mode par défaut si aucune
   clé Anthropic n'est configurée.
3. Message honnête d'indisponibilité si aucun moteur ne répond.

Garde-fous côté serveur : prompts système non modifiables par le client, contrôle
d'origine, taille de requête limitée, 700 tokens max par réponse, conversation
plafonnée. Règle éditoriale encodée dans les prompts : aucun chiffre inventé.

Dev local sans clé : `npx wrangler dev --var MOCK_AI:1` (flux simulé).
Déploiement : `npm run build && npx wrangler deploy`.

## Publier un artefact

**Étude de cas** : créer `src/content/realisations/<slug>.md` — frontmatter :
`title, client (alias anonymisé), secteur, annee, role, stack[], pitch, resultats[{chiffre,label}], published, sortOrder`.
Structure du corps : `## Le contexte` / `## Ce qui a été construit` / `## Ce que ça a produit` / `## Ce qu'il faut en retenir`.

**Note** : créer `src/content/notes/<slug>.md` — frontmatter : `title, date, pitch, published`.

Règles éditoriales (non négociables) :
- **Clients anonymisés** (alias sectoriel générique), aucun détail désanonymisant.
- **Aucun chiffre invérifiable.** Ce qu'on ne peut pas prouver, on ne le publie pas.
- Le sitemap, le `llms.txt` et la section « Registre » de la home se régénèrent
  automatiquement au build — rien d'autre à toucher.

## Déploiement

Le site est un **Cloudflare Worker** (assets statiques + endpoint `/api/experience`,
config dans `wrangler.jsonc`), pas un déploiement Pages classique.

**Automatique** (`.github/workflows/deploy.yml`) : chaque push sur `main` build et
déploie via [`cloudflare/wrangler-action`](https://github.com/cloudflare/wrangler-action).
Nécessite deux secrets du dépôt GitHub (*Settings → Secrets and variables → Actions*) :

- `CLOUDFLARE_API_TOKEN` — jeton créé sur le
  [dashboard Cloudflare](https://dash.cloudflare.com/profile/api-tokens) avec le modèle
  *Edit Cloudflare Workers*.
- `CLOUDFLARE_ACCOUNT_ID` — visible dans la barre latérale du dashboard Cloudflare
  (n'importe quelle page du compte).

Sans ces secrets, le déploiement automatique échoue silencieusement à l'étape wrangler ;
le reste (build, tests) continue de fonctionner. Déclenchement manuel possible depuis
l'onglet *Actions* du dépôt (`workflow_dispatch`) une fois les secrets posés.

**Manuel** (fallback, ou pour le secret Anthropic — étape ponctuelle, hors CI) :

```bash
npm run build && npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY   # optionnel, une seule fois
```

Google Search Console : le site est déjà vérifié (meta conservée dans `BaseLayout.astro`) ;
sitemap à `https://julientridat.com/sitemap.xml`.

## [À VALIDER] par Julien

- **⚠️ Étude « groupe travel retail »** : le contrat de sous-traitance avec l'organisme de
  formation contient une clause de confidentialité explicite couvrant l'organisme ET ses
  clients. L'étude est doublement anonymisée, mais faire valider par l'organisme avant
  bascule DNS serait prudent.
- **Étude « accompagnement organisme de formation »** : petite structure au dirigeant très
  identifiable dans le milieu — valider le niveau d'anonymisation.
- **Cas écartés en attente** : conseiller immobilier réseau de mandataires (lien familial,
  mission non documentée comme facturée — à clarifier) ; centre d'affaires Gironde (phase
  amont sans livrable).

- **LinkedIn** : ajouter l'URL exacte du profil dans `sameAs` (`src/lib/site.ts`).
- **Étude « cartographie IA agence »** : compléter si possible le nombre d'entretiens menés.
- **Étude « formation agence santé »** : confirmer la tenue effective des 2 journées
  (le cadrage documenté les prévoyait) et enrichir avec les retours post-restitution.
- **Étude « agents agence créative »** : confirmer la tenue des 4 ateliers planifiés.
- **Note fondatrice** : relire les chiffres cités (Originality.ai, Schmidt & Hunter) —
  formulés au conditionnel et attribués, mais à assumer avant publication.
- **Anonymisation** : valider que les alias clients (« agence de communication santé »,
  « agence créative indépendante », « franchisé réseau fitness »…) sont assez génériques.
