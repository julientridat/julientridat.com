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
(format : `# chantier`, `## mois`, `- tâche (fait | en cours | à vous | livrable | échéance)`,
et, en retrait sous une tâche, ses sous-tâches : `  - sous-tâche (à vous | Julien | prénom, 15/10)`).
Le tableau affiche alors **le lien de Sébastien** : copie-le, envoie-le par e-mail. C'est sa
clé ; il l'ouvre une fois.

- Ajouter une personne chez le client (Laurent…) : Réglages de la place → « + une personne ».
- Un lien a circulé : Réglages → « Renouveler » — l'ancien cesse de marcher à l'instant.
- Voir ce que voit Sébastien : « Voir comme Sébastien ». Ne pas ouvrir son lien dans ton
  propre navigateur (il remplacerait ta clé) — une fenêtre privée, si tu veux vraiment.

## Tes vues : vue d'ensemble et « Ma semaine »

En haut, pour Julien seulement : « Vue d'ensemble · Ma semaine · » puis une pastille par place.
- **Vue d'ensemble** : une tuile par client — semaine x sur n, avancement, à traiter, en
  cours, chez le client (cartes + tâches, et depuis combien de temps), prochaine échéance,
  retards, messages non lus, dernière activité. Les clients qui te demandent quelque chose
  passent en premier ; un clic ouvre son tableau.
- **Ma semaine** : tout ce qui est à toi, tous clients confondus — ce que tes clients ont
  fait (à traiter), puis en retard, aujourd'hui, cette semaine, plus tard, et ce qui est en
  cours sans date. La case coche la sous-tâche ou passe la carte en « Fait ».
- À l'ouverture : « Ma semaine » sur le téléphone ; le tableau du client s'il n'y en a
  qu'un ; sinon la vue d'ensemble.
- **Date précise d'une carte** : « Pour le » dans sa fiche (à côté du libellé libre
  « Échéance »), ou `(15/10)` dans un plan collé. C'est elle qui range « Ma semaine ».

## Qui déplace quoi

- **Julien** glisse toutes les cartes, d'une colonne à l'autre ou dans l'ordre d'une colonne —
  à la souris, ou au doigt (appui long, puis glisser).
- **Le client** glisse ce qui lui revient, et seulement ça (le serveur refuse le reste) :
  - une question de « Chez vous » vers « Fait » : c'est réglé, avec un mot s'il veut ;
  - un livrable de « Chez vous » vers « Fait » : validé ; vers « En cours » : à reprendre,
    il dit pourquoi ;
  - ses demandes, qu'il range par priorité.
  Les cartes du plan (Prévu, En cours) ne bougent qu'avec Julien.

## Projets (un chantier = un projet)

Un clic sur la pastille d'un chantier ouvre son sous-tableau :
- l'objectif, en une phrase (Julien l'écrit, le client le lit) ;
- l'avancement : cartes faites et sous-tâches cochées, sur le total, et la prochaine échéance ;
- la frise : la période, les mois, aujourd'hui, les dates clés (Julien les ajoute sous la frise)
  et les sous-tâches datées (violet : chez le client ; rouge : en retard) ;
- les colonnes limitées au projet, sous-tâches dépliées sous chaque carte ; une carte ou une
  demande ajoutée ici reste dans le projet ;
- son fil de discussion (la discussion s'ouvre sur lui).
« ‹ Toute la mission » ramène au tableau entier.

## Filtres

Par mois (lu dans l'échéance : « Octobre », « avant fin octobre »…) et par mot, sur les deux
faces, dans toute la mission ou dans un projet ; « Tout afficher » les efface.

## Sous-tâches

Dans une carte, côté Julien : un nom, un responsable (Julien, le contact, chaque personne qui a
un lien) et une date — ou les étapes type proposées d'après le titre (site : maquette,
validation, V1…). La carte montre « ✓ 2/4 », « 1 au client », « sous-tâche en retard ».
Une sous-tâche confiée au client apparaît dans son « Chez vous » (« Vos tâches ») et compte
dans « … chez vous » ; c'est lui qui la coche, Julien le voit à l'instant. Il ne peut pas
cocher celles de Julien (refusé par le serveur). Les étapes d'avant sont devenues des
sous-tâches, cases comprises.

## La discussion

Bouton « Discussion » en bas à droite : par place, un fil « Général » et un fil par projet
(onglets en haut, non-lus sur chacun), en direct, comme une messagerie.
Pastille des non-lus sur le bouton et dans l'onglet, « écrit… », ✓ envoyé, ✓✓ vu. Les liens
deviennent cliquables. Côté Julien, avec plusieurs places, la liste des discussions d'abord.
Chaque message part aussi vers les automatisations (événement `message`).
Pour une nouvelle mission, le client passe par « Demandes » : le fil le lui rappelle.

## Sur le téléphone — et sur le Mac

Le tableau s'installe comme une app : icône sur l'écran d'accueil, plein écran, aucun store.
Le bouton « Installer l'app » (sur téléphone) explique la marche à suivre.
- **Android** : un bouton « Installer » suffit.
- **iPhone** : l'app installée ne partage pas la mémoire de Safari. D'où l'étape « Copier
  mon lien » : à la première ouverture, l'app demande le lien, on le colle, c'est fini.
- **Mac, dans Chrome** : menu ⋮ → « Caster, enregistrer et partager » → « Installer la page
  en tant qu'application ». Le tableau a alors sa fenêtre et son icône dans le Dock.

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
- Pas de pièces jointes : on colle le lien du fichier (Drive, Figma…) dans la carte ou la
  discussion.
- Pas de notification sur le téléphone quand l'app est fermée : l'étape suivante (Web Push,
  gratuit, deux secrets Cloudflare de plus). En attendant, l'événement `message` peut
  déclencher un e-mail depuis n8n ou Make.
