# Espace client — cadrage v1 (à valider)

Interface unique entre Julien et chaque client de l'offre « Direction marketing externalisée »
(2 500 €/mois). Objectif : tout ce qui circule entre le client et moi passe par une seule page —
demandes, file d'attente, livrables, point hebdo, temps passé — sans jamais donner l'impression
d'ajouter un outil.

Maquette cliquable : [`maquette.html`](maquette.html) (données fictives, interactions réelles).

---

## Le principe : le contrat rendu visible

Le tableau de bord n'est pas un outil de gestion de projet. C'est **la page de vente qui continue
de tenir ses promesses après signature**. Chaque bloc de l'interface correspond à un engagement
de l'offre :

| Promesse de la page de vente | Bloc du tableau de bord |
|---|---|
| « Une demande à la fois, 48 à 72 h » | **En fabrication** — la demande en cours, son statut, son échéance |
| « Dans l'ordre que vous choisissez » | **À suivre** — la file, réordonnable par le client (flèches, pas de drag complexe) |
| « Autant de demandes que vous voulez » | **Nouvelle demande** — un seul champ texte, trois lignes suffisent |
| « Vous gardez tout » | **Livré** + **Vos fondations** — chaque livrable accessible, pour toujours |
| « 45 minutes chaque semaine » | **Point hebdo** — prochain créneau, ordre du jour, relevé de décisions |
| Transparence sur le temps | **Ce mois-ci** — la jauge d'heures passées, livrables, formations |

Règle d'interface : **une page, zéro menu, zéro notification parasite**. Le client n'apprend
rien : il lit de haut en bas, il clique, il répond à des questions simples, il colle des liens.
Trello est déjà trop : ici il n'y a ni colonnes ni étiquettes ni paramétrage.

## Ce que ça me fait gagner

- **Des demandes propres à la source.** Le champ unique impose le format court ; plus de briefs
  à reconstituer depuis trois e-mails et un vocal.
- **Plus d'arbitrage par e-mail.** L'ordre de la file appartient au client — je prends toujours
  la première ligne, point.
- **Une mémoire stratégique.** Le relevé de décisions du point hebdo s'accumule semaine après
  semaine : c'est la preuve du travail de fond, et la matière des bilans.
- **De la donnée structurée dès le premier jour.** Chaque action (demande postée, file
  réordonnée, livrable validé) est un événement propre en base — le carburant des
  automatisations de la phase 2, sans rien refactorer.

## L'onboarding — première connexion, dix minutes

1. **Lien magique** reçu par e-mail : pas de compte à créer, pas de mot de passe.
2. **Huit questions** sur l'entreprise (reprise du questionnaire « Faire le point » du site —
   le prospect qui l'a déjà rempli ne les revoit pas).
3. **Copier-coller** des éléments existants : liens drive, logo/charte s'il y en a une,
   outils en place, accès à donner.
4. **Choix du créneau hebdo** dans mon agenda (même mécanique que la réservation du site).

Une carte « Premiers pas » reste affichée en haut du tableau de bord jusqu'à complétion,
puis disparaît. Rien d'autre à configurer, jamais.

## À trancher avant fabrication

1. **La jauge : compteur ou quota ?** La page de vente dit « demandes illimitées » ; afficher
   un « temps restant » la contredirait et inviterait le client à compter. Recommandation :
   un **compteur de valeur** (« 23 h à vos côtés ce mois-ci · 6 livrables ») avec une barre
   indicative de rythme, jamais un solde. La maquette montre cette version.
2. **Les échanges : pas de messagerie intégrée en V1.** Les équipes m'écrivent en direct par
   les canaux qu'elles ont déjà (la promesse, c'est « pas d'outil en plus »). Le tableau de
   bord trace les demandes et les décisions, pas les conversations. Un bloc « Un besoin
   direct ? » rappelle simplement comment me joindre.
3. **Le nom.** La maquette dit « Votre espace ». Alternatives possibles : « Le fil »,
   « L'atelier ». À décider avant la V1 — le nom apparaîtra dans les e-mails.

## Architecture et phasage

Cohérent avec l'existant du site (Astro statique + Supabase + Cloudflare) : zéro coût
récurrent, souveraineté totale.

- **V1 — l'essentiel (1 à 2 jours de fabrication).** Page Astro + îlot React, auth Supabase
  par lien magique, RLS par client (chacun ne voit que ses lignes). File, demandes, livrables
  (liens vers les fichiers, pas de stockage lourd), point hebdo, jauge saisie manuellement
  par moi. Aucune brique nouvelle : mêmes patterns que `BookingDialog`.
- **V2 — les automatisations.** Chaque événement du tableau de bord part en webhook
  (n8n/Make) : création de tâche ClickUp dans une liste par client, notification e-mail au
  client à chaque changement de statut, relevé de décisions pré-rempli avant le point hebdo.
- **V3 — le temps réel.** Jauge alimentée automatiquement par le time-tracking ClickUp,
  validation de livrable avec demande d'ajustement tracée, onboarding guidé complet
  (questionnaire + dépôt d'accès).

## Ce que la maquette montre

`docs/espace-client/maquette.html` — un fichier autonome (fontes embarquées), charte
« pages de vente » (papier `#F1F2F4`, violet `#6C4CF1`, Geist + Instrument Serif).
Interactions fonctionnelles : réordonner la file, poster une demande (elle rejoint la file),
ajouter un sujet à l'ordre du jour, valider un livrable ou demander un ajustement, replier
la carte « Premiers pas ». Données 100 % fictives.
