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

## Déploiement (à faire)

1. Créer un repo GitHub (ex. `julientridat/julientridat-com`), pousser ce dossier.
2. Cloudflare Pages → *Create project* → connecter le repo.
   Build command : `npm run build` · Output : `dist` · rien d'autre.
3. Tester sur l'URL `*.pages.dev`.
4. Bascule DNS : dans Cloudflare Pages, *Custom domains* → `julientridat.com`,
   puis pointer le DNS du domaine (CNAME) — l'ancien déploiement Lovable peut être
   débranché après vérification.
5. Google Search Console : le site est déjà vérifié (meta conservée) ; soumettre
   `https://julientridat.com/sitemap.xml` après bascule.

## [À VALIDER] par Julien

- **LinkedIn** : ajouter l'URL exacte du profil dans `sameAs` (`src/lib/site.ts`).
- **Étude « cartographie IA agence »** : compléter si possible le nombre d'entretiens menés.
- **Étude « formation agence santé »** : confirmer la tenue effective des 2 journées
  (le cadrage documenté les prévoyait) et enrichir avec les retours post-restitution.
- **Étude « agents agence créative »** : confirmer la tenue des 4 ateliers planifiés.
- **Note fondatrice** : relire les chiffres cités (Originality.ai, Schmidt & Hunter) —
  formulés au conditionnel et attribués, mais à assumer avant publication.
- **Anonymisation** : valider que les alias clients (« agence de communication santé »,
  « agence créative indépendante », « franchisé réseau fitness »…) sont assez génériques.
