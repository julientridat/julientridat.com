# Le tableau — mise en service

Le tableau vit sur le site, à `https://julientridat.com/tableau`. Il est servi par le même
Worker Cloudflare que le reste du site ; les données sont dans un Durable Object
(`worker/tableau.ts`) — une petite base SQLite qui pousse chaque changement en direct à
tous les navigateurs ouverts. Rien d'autre à héberger, aucun compte à créer, plan gratuit.

## Mettre en service — trois étapes, une fois

1. **Fusionner la PR.** Le déploiement part tout seul (GitHub Actions → Cloudflare) et crée
   la base du tableau au passage.
2. **Poser ta clé.** Cloudflare → Workers & Pages → `julientridat` → Settings →
   Variables and Secrets → Add → type **Secret**, nom `TABLEAU_ADMIN_KEY`, valeur : une
   quarantaine de caractères au hasard (générés par ton gestionnaire de mots de passe).
   Vérification : `https://julientridat.com/api/tableau/sante` doit répondre
   `{"tableau":true,"cleJulien":true}`.
3. **Ouvrir ton tableau** : `https://julientridat.com/tableau#cle=` suivi de ta clé, une fois
   sur l'ordinateur, une fois sur le téléphone — le navigateur s'en souvient ensuite, et la
   clé disparaît de la barre d'adresse.

## Ouvrir une place (Sébastien, puis chaque nouveau client)

« Nouvelle place » → nom, prénom du contact, dates de période, chantiers, et le plan collé
(format : `# chantier`, `## mois`, `- tâche (fait | en cours | à vous | livrable | échéance)`).
Le tableau affiche alors **le lien de Sébastien** : copie-le, envoie-le par e-mail. C'est sa
clé ; il l'ouvre une fois.

- Ajouter une personne chez le client (Laurent…) : Réglages de la place → « + une personne ».
- Un lien a circulé : Réglages → « Renouveler » — l'ancien cesse de marcher à l'instant.
- Voir ce que voit Sébastien : « Voir comme Sébastien ». Ne pas ouvrir son lien dans ton
  propre navigateur (il remplacerait ta clé) — une fenêtre privée, si tu veux vraiment.

## Ce que fait le temps réel

Chaque geste — une carte déplacée, une réponse, une validation, un commentaire, une demande —
apparaît chez l'autre sans recharger. « Sébastien est en ligne » / « Julien est en ligne »
s'affiche quand l'autre a le tableau ouvert ; l'onglet compte les cartes nouvelles, par
exemple « (2) Le tableau ». Une coupure réseau se rattrape seule à la reconnexion.

## Sécurité, en bref

- Ta clé n'existe que dans les secrets Cloudflare, jamais dans le dépôt.
- Le serveur ne livre à un client que ses propres cartes, et refuse tout geste réservé à
  Julien, même forgé à la main (vérifié).
- `/tableau` n'est ni indexé, ni dans le plan du site, ni dans `llms.txt`.

## Sauvegarde

Réglages de la place → « Exporter tout (JSON) » : clients, cartes, accès, journal. À faire
le lundi, en même temps que le point — un fichier par semaine suffit.

## Plus tard — les automatisations

Deux secrets de plus, et chaque événement (demande, réponse, validation, déplacement…)
part en JSON vers n8n, Make ou ClickUp : `TABLEAU_WEBHOOK_URL` (l'adresse du webhook) et,
facultatif, `TABLEAU_WEBHOOK_SECRET` (renvoyé dans l'en-tête `X-Tableau-Secret` pour que
l'automatisation vérifie l'expéditeur).

## Pas dans cette version

- Pas d'e-mail automatique : le lien et le point de lundi partent de ta messagerie
  (« Point de lundi » prépare le texte à copier).
- Pas de pièces jointes : on colle le lien du fichier (Drive, Figma…) dans la carte.
