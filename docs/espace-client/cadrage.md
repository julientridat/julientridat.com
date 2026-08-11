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
| « Autant de demandes que vous voulez » | **Nouvelle demande** — un seul champ texte + l'assistant qui cadre (type, jalons, délais réels) |
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

## La commande assistée — tuer le malentendu à la source

Le malentendu type : le client demande « un site », lit « 48 à 72 h » sur la page de vente,
et attend un site fini jeudi. Le problème ne se règle pas à la livraison, il se règle
**au moment de la commande**. D'où le module assisté :

1. Le client décrit son besoin dans le champ unique — rien ne change pour lui.
2. L'assistant **reconnaît le type de demande** et répond avec le process réel :
   « Un site ne se livre pas fini en 72 h — voici comment ça se passe : maquette sous
   48 h → votre validation → V1 en ligne sous 72 h après validation. »
3. **Une seule question de cadrage**, à choix cliquables (jamais un interrogatoire).
4. **Récapitulatif avant ajout** : ce qui entre dans la file, et ce qui arrive en premier.
   Le client confirme — le délai est accepté avant que le travail commence.

La connaissance du bot, ce sont des **cartes de process** — une par type de demande,
versionnées dans le repo (souveraineté : le bot lit les process, il ne les invente pas) :

| Type | Jalons |
|---|---|
| Site / page | Maquette 48 h → validation → V1 en ligne 72 h après validation → ajustements |
| Contenu (e-mail, LinkedIn, blog) | Angle et plan 24 h → validation → version complète 48 h |
| Outil / installation | Cadrage (3 questions) → installation sur les comptes du client → démo équipe 30 min |
| Formation | Programme 48 h → validation + date → session + support remis |
| Hors cadre | Découpage proposé sous 24 h → validation → premier livrable 48 à 72 h |

Chaque demande confirmée entre dans la file avec son **premier jalon affiché**
(« 1ᵉʳ jalon : maquette ») — le malentendu ne peut plus se reformer en cours de route.

Côté fabrication, deux étages :
- **Étage 1 — scripté, sans LLM.** Reconnaissance par mots-clés + parcours à choix.
  Déterministe, zéro coût, zéro dérive, suffisant pour 90 % des demandes. C'est ce que
  montre la maquette.
- **Étage 2 — conversationnel (Claude Haiku).** Petit endpoint sur le Worker Cloudflare
  existant, prompt système = les cartes de process + le contexte client. Le bot répond
  aux questions libres (« c'est compris dans mon forfait ? », « pourquoi une maquette
  d'abord ? ») et sait dire « je transmets à Julien » quand il sort des cartes.

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
4. **Le bot : scripté d'abord, LLM ensuite.** Recommandation : lancer avec l'étage
   scripté (déterministe, zéro coût, zéro risque de promesse inventée) et ne brancher
   Claude qu'en V2, une fois les cartes de process éprouvées sur de vrais clients.
   Un bot qui improvise un délai ferait exactement le malentendu qu'on veut tuer.

## Architecture et phasage

Cohérent avec l'existant du site (Astro statique + Supabase + Cloudflare) : zéro coût
récurrent, souveraineté totale.

- **V1 — l'essentiel (1 à 2 jours de fabrication).** Page Astro + îlot React, auth Supabase
  par lien magique, RLS par client (chacun ne voit que ses lignes). File, demandes avec
  **commande assistée scriptée** (cartes de process en JSON dans le repo), livrables
  (liens vers les fichiers, pas de stockage lourd), point hebdo, jauge saisie manuellement
  par moi. Aucune brique nouvelle : mêmes patterns que `BookingDialog`.
- **V2 — les automatisations et le bot conversationnel.** Chaque événement du tableau de
  bord part en webhook (n8n/Make) : création de tâche ClickUp dans une liste par client,
  notification e-mail au client à chaque changement de statut, relevé de décisions
  pré-rempli avant le point hebdo. Assistant conversationnel (Claude Haiku) via le Worker
  Cloudflare existant, nourri des cartes de process.
- **V3 — le temps réel.** Jauge alimentée automatiquement par le time-tracking ClickUp,
  validation de livrable avec demande d'ajustement tracée, onboarding guidé complet
  (questionnaire + dépôt d'accès).

## Ce que la maquette montre

`docs/espace-client/maquette.html` — un fichier autonome (fontes embarquées), charte
« pages de vente » (papier `#F1F2F4`, violet `#6C4CF1`, Geist + Instrument Serif).
Interactions fonctionnelles : réordonner la file, poster une demande via l'assistant
(reconnaissance du type, jalons annoncés, une question à choix, récapitulatif, ajout à la
file avec son premier jalon), ajouter un sujet à l'ordre du jour, valider un livrable ou
demander un ajustement, replier la carte « Premiers pas ». Données 100 % fictives.
Pour tester l'assistant : écrire par exemple « il nous faut un nouveau site », « une
séquence e-mail de relance » ou « former l'équipe commerciale ».
