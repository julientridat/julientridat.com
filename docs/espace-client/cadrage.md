# Espace client — cadrage v1 (à valider)

L'interface unique entre Julien et **tous ses clients** — ceux des offres publiées sur
[julientridat.com/#offres](https://julientridat.com/#offres) (audit, missions TPE/PME
Augmentée) comme les accompagnements au long cours (type Groupe LEH, la bêta). Objectif :
tout ce qui circule entre le client et moi passe par une seule page — actions attendues,
avancement, livrables, point hebdo, demandes — sans jamais donner l'impression d'ajouter
un outil. Né avec la page « Direction marketing externalisée » (2 500 €/mois), le concept
est devenu un gabarit : voir « Un gabarit, tous les clients » plus bas.

Maquette cliquable : [`maquette.html`](maquette.html) (instance bêta LEH, interactions réelles).

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

## Le mode mission — client bêta (Groupe LEH)

Le plan de mission trimestriel (type LEH 2026-2027) se transpose dans le tableau de bord :
le document envoyé au client devient **l'état vivant de la mission**. Deux modes selon le
contrat, même interface :

- **Mode file** — l'offre de la page de vente : demandes illimitées, une à la fois,
  48 à 72 h, ordre choisi par le client.
- **Mode mission** — un plan de mission existe : les demandes s'arbitrent au point
  mensuel (« on ajoute et on retire, on n'empile pas ») et l'interface s'organise
  par chantier. C'est ce que montre la maquette, avec LEH en bêta.

Ce que le mode mission ajoute — dans une page **unique, en une colonne**, pensée pour
être lue en trente secondes :

- **La règle de rôle, énoncée et tenue** : tout ce qui se clique est pour le client.
  Ses actions sont regroupées en tête dans « À vous de jouer » — valider un livrable,
  répondre à une question qui bloque la production — une carte par action, un bouton par
  carte, et la phrase d'accueil compte ce qui reste (« Trois choses vous attendent…
  Rien ne vous attend »). Le reste de la page est en lecture : « c'est mon terrain ».
- **Un accordéon par mission, avec son code couleur** (orange, magenta, teal, bleu —
  le violet reste réservé à la marque et aux actions client) : replié, une ligne d'état
  et une barre d'avancement ; ouvert, l'objectif de fin de période, les tâches par mois
  et le fil de commentaires du chantier. La sensation de simplicité vient de là : rien
  ne s'affiche tant qu'on ne l'a pas demandé.
- **Le point de lundi** — le point écrit hebdomadaire du plan, tel quel :
  parti / en validation / engagé, chaque ligne rattachée à sa mission par sa couleur.
- **La période en bref** — les engagements du 15 décembre repliés en un lien discret,
  et une ligne unique pour le mois (« 19 h à vos côtés · 12 campagnes »).

⚠️ La maquette contient des données réelles du client bêta (noms, chantiers). Tant que le
repo n'est pas strictement privé, prévoir une variante anonymisée avant tout partage.

## Un gabarit, tous les clients

Une seule application, une instance par client. **Le contenu est de la donnée, jamais du
code** : chantiers, jalons, couleurs, engagements, cadence viennent de la base. Signer un
client, c'est remplir son plan — pas développer.

### Le mapping avec les offres du site (état septembre 2026)

| Offre | Ce que l'espace devient |
|---|---|
| **Audit — 1 500 €** | Pas d'espace complet : la restitution et l'outil de pilotage suffisent. Mais si la mission démarre sous 30 jours, l'espace s'ouvre **avec l'audit déjà dedans** — la continuité rend la déduction tangible. |
| **TPE / PME Augmentée — 8 à 32 k€, 4 à 8 semaines** | Mode mission avec **compte à rebours contractuel** (« Semaine 3 sur 8 — le déploiement a commencé, comme promis »). Chantiers regroupés **par service** (commerce, gestion, RH…), pas par assistant — 7 à 10 assistants satureraient les codes couleurs. Chaque assistant suit ses jalons : cadré → construit → testé par l'équipe → en production. Formations tracées. Engagements de fin = les livrables contractuels. |
| **Accompagnement au long cours (type LEH — la bêta)** | Même gabarit, périodes de 3 à 5 mois, arbitrage au point mensuel. |

### Commun à tous / configuré par client

- **Commun** : la charte (l'espace est toujours à la marque Julien Tridat — c'est le
  produit, pas un livrable client), la règle de rôle (« tout ce qui se clique est pour
  vous »), les cartes de process de l'assistant, le point écrit hebdomadaire.
- **Par client** : nom et personnes, mode et durée de la période, chantiers et leurs
  couleurs, jalons, engagements de fin, jour du point écrit, contenu de l'onboarding.
- **Nuance sur le temps** : le compteur d'heures (« 19 h à vos côtés ») n'a de sens que
  pour le long cours. Sur une mission à prix ferme, on affiche **le respect du délai,
  jamais les heures** — le prix est ferme, les heures ne regardent que moi.

### Provisioning d'un nouveau client

Signature → je colle le plan de mission (le document que le client a déjà validé) →
l'espace se génère → le client reçoit son lien magique et fait ses premiers pas
(10 minutes). Objectif : **moins d'une heure de mon temps par nouveau client**, zéro code.

### Modèle de données V1 (Supabase, RLS par `client_id`)

Huit tables portent toutes les vues de la maquette : `clients`, `membres` (accès par
lien magique), `chantiers`, `taches`, `actions_client` (« à vous de jouer »),
`commentaires`, `demandes`, `points_hebdo` (+ les engagements de période, champ JSON du
client ou table dédiée). Chaque ligne porte son `client_id` ; la RLS garantit que chacun
ne voit que les siennes.

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

`docs/espace-client/maquette.html` — un fichier autonome (fontes embarquées), à la
**charte Julien Tridat « pages de vente »** : papier `#F1F2F4`, encre `#111216`, violet
`#6C4CF1` en accent unique (kickers, emphases serif italique, actions), Geist +
Instrument Serif, cartes blanches rayon 22 px, boutons pilule encre → violet au survol.
Les quatre missions portent chacune un code couleur (orange, magenta, teal, bleu),
jamais le violet — il signale ce qui appartient au client.
Interactions fonctionnelles : régler chaque carte « À vous de jouer » (valider,
demander un ajustement, répondre — la phrase d'accueil se met à jour), ouvrir les
missions, commenter chacune, poster une demande via l'assistant (jalons annoncés,
récapitulatif, transmission aux arbitrages du point mensuel). Données du client bêta,
état simulé au 12 octobre 2026.
Pour tester l'assistant : écrire par exemple « il nous faut une landing page », « une
séquence e-mail de relance » ou « former l'équipe ».
