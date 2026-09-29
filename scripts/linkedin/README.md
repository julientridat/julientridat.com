# Publication LinkedIn via l'API officielle

Publier sur LinkedIn depuis la ligne de commande, avec l'API officielle
(*Posts API*) et OAuth 2.0. Aucune dépendance : Node 18+ suffit.

Contrairement aux MCP communautaires qui pilotent un navigateur, cette voie est
**conforme aux CGU LinkedIn** — c'est l'API publique, avec le consentement
explicite du membre.

## 1. Créer l'app LinkedIn (une fois)

1. Une **page entreprise LinkedIn** est obligatoire pour créer une app. Si tu n'en
   as pas : https://www.linkedin.com/company/setup/new/
2. https://www.linkedin.com/developers/apps → **Create app**, rattachée à cette page.
3. Onglet **Products** → demander :
   - **Sign In with LinkedIn using OpenID Connect** (scopes `openid`, `profile`)
   - **Share on LinkedIn** (scope `w_member_social`)

   Les deux sont en libre-service : l'accès est accordé en quelques minutes,
   sans validation manuelle de LinkedIn.
4. Onglet **Auth** → **Authorized redirect URLs** → ajouter exactement :
   `http://localhost:3000/callback`
5. Toujours dans **Auth**, relever le **Client ID** et le **Client Secret**.

## 2. Configurer

```bash
cp .env.linkedin.example .env.linkedin
```

Remplir `LINKEDIN_CLIENT_ID` et `LINKEDIN_CLIENT_SECRET`.
`.env.linkedin` et le token sont ignorés par git — **aucun secret n'est versionné**.

## 3. S'authentifier

```bash
node scripts/linkedin/auth.js
```

Le script affiche une URL : ouvre-la, autorise l'app. Le token et ton URN
(`urn:li:person:…`) sont écrits dans `scripts/linkedin/.token.json`.

Le token est valable **60 jours**. Passé ce délai, relance la commande.
LinkedIn ne délivre de *refresh token* que sur demande auprès de son support :
sans ça, la ré-autorisation manuelle est le fonctionnement normal.

## 4. Publier

```bash
node scripts/linkedin/post.js "Mon premier post via l'API."
node scripts/linkedin/post.js --fichier brouillon.txt
node scripts/linkedin/post.js --visibilite CONNECTIONS "Visible par mes relations"
```

En cas de succès : `201` et l'URN du post, avec son URL.

## Limites connues

- **Texte seul.** Images, vidéos et documents passent par l'API *Images/Videos*
  (upload en deux temps) — non implémenté ici.
- **Profil personnel uniquement.** Publier sur une page entreprise demande le
  produit *Community Management API*, soumis à validation LinkedIn.
- **Caractères réservés.** Le champ `commentary` échappe automatiquement
  `\ | { } @ [ ] ( ) < > # * _ ~`. Si un texte est refusé en `422`, regarder
  d'abord la fonction `echapper()` dans `post.js`.
- **Version d'API.** `LINKEDIN_API_VERSION` doit désigner un mois encore
  maintenu (~12 mois glissants). Une erreur de version se corrige dans
  `.env.linkedin`.
