# Espace client — cadrage v1 (à valider)

L'interface unique entre Julien et **tous ses clients** — ceux de l'offre publiée sur
[julientridat.com/#offres](https://julientridat.com/#offres) (« Une formule. Sans
engagement. » — 2 500 € HT/mois, starter pack compris) comme les accompagnements au long
cours (type Groupe LEH, la bêta). Objectif :
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

- **Mode plan** — l'offre du site : le plan d'action fixe ce qui sort et quand, un
  livrable à date chaque semaine ; les demandes s'intercalent (J+1 à J+3) et si l'une
  d'elles décale le plan, c'est le client qui arbitre.
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

### L'expérience : entrer dans un process

Le tableau de bord ne constate pas, il fait *sentir* que le client est entré dans une
méthode — la mienne :

- **Le tunnel est numéroté** comme les pages de vente (01 À vous de jouer → 04 Une
  demande) : on descend la page comme on suit la méthode, cartes et missions
  apparaissent en cascade.
- **La frise de période en tête** : les semaines écoulées se remplissent à l'arrivée
  sous les yeux du client, « vous êtes ici » pulse, les jalons à venir sont posés sur
  la ligne, et la légende compte (« semaine 4 sur 13 — il en reste 9 avant le bilan »).
  Le temps qui s'écoule se voit avant de se lire.
- **Une grammaire de phases commune à toutes les missions** (cadrage › production ›
  validation › livraison, adaptée à chaque chantier) : la phase en cours pulse dans la
  couleur de la mission. Le même déroulé partout — c'est ce qui fait « process »,
  pas « liste de tâches ».
- **Les progressions s'animent** : barres qui se remplissent à l'apparition, accordéons
  qui s'ouvrent en fluide, tâches qui s'enchaînent à l'ouverture. Tout est débrayé sous
  `prefers-reduced-motion`.

⚠️ La maquette contient des données réelles du client bêta (noms, chantiers). Tant que le
repo n'est pas strictement privé, prévoir une variante anonymisée avant tout partage.

## Un gabarit, tous les clients

Une seule application, une instance par client. **Le contenu est de la donnée, jamais du
code** : chantiers, jalons, couleurs, engagements, cadence viennent de la base. Signer un
client, c'est remplir son plan — pas développer.

### Le mapping avec l'offre du site (état de la home en ligne, septembre 2026)

L'offre : **2 500 € HT/mois, sans engagement, starter pack compris** — un livrable à
date chaque semaine tiré du plan, demandes supplémentaires livrées de J+1 à J+3, point
de 45 minutes hebdomadaire, pause en semaines gardées, quatre places. Ce que l'espace
en fait :

| Moment de l'offre | Ce que l'espace affiche |
|---|---|
| **Mois 1 — le starter pack** | La frise S1 → S4 du site (état des lieux, plan, fondations, outils), avec ce que le client reçoit chaque semaine. La collecte de S1 (contenus, logos, accès) **est** l'onboarding de l'espace. |
| **Ensuite — chaque semaine** | **Le livrable de la semaine, à date**, en tête de page — c'est le plan qui porte la valeur, pas une file ouverte. Les demandes s'intercalent (J+1 à J+3) ; si une demande décale le plan, **l'arbitrage devient une carte « À vous de jouer »** : c'est le client qui tranche, exactement comme la page de vente le promet. |
| **La jauge** | Le point « compteur ou quota » est tranché par l'offre elle-même : **l'unité est la semaine, pas l'heure.** « Octobre : 3 semaines utilisées · 1 gardée. » La promesse de la pause (« les semaines restantes vous attendent, et votre place aussi ») devient un chiffre visible en permanence. |
| **Le plan sur 12 mois** | La colonne vertébrale de l'espace : les chantiers du plan, avec leurs codes couleurs, remplacent les « missions » LEH — même gabarit, mêmes accordéons. |
| **Au-delà de 30 salariés / long cours (type LEH — la bêta)** | Sur devis : même gabarit, périodes de 3 à 5 mois, arbitrage au point mensuel. |

(La page `/installation-ia` — audit + missions TPE/PME Augmentée — est une autre
activité : hors périmètre de cet espace pour l'instant ; le gabarit pourrait la couvrir
plus tard avec un compte à rebours contractuel à la place des semaines.)

### Commun à tous / configuré par client

- **Commun** : la charte (l'espace est toujours à la marque Julien Tridat — c'est le
  produit, pas un livrable client), la règle de rôle (« tout ce qui se clique est pour
  vous »), les cartes de process de l'assistant, le point écrit hebdomadaire.
- **Par client** : nom et personnes, mode et durée de la période, chantiers et leurs
  couleurs, jalons, engagements de fin, jour du point écrit, contenu de l'onboarding.
- **Nuance sur le temps** : aucune heure affichée, nulle part. L'unité visible est la
  **semaine** — utilisée, restante, gardée — pour la formule du site ; le respect des
  périodes pour le long cours. Les heures ne regardent que moi.

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

## La console — l'interface de Julien

Maquette cliquable : [`console.html`](console.html) — trois écrans (En cours, Le point, La place), état simulé au lundi 12 octobre, gestes fonctionnels. Spécification issue d'un panel de trois approches (miroir éditable, bannette, rituel du lundi) jugées par trois lentilles (Julien, le client, l'architecte) — « Le Lundi » retenue à l'unanimité, greffée des meilleures idées des deux autres.

### 1. Le parti pris

La console est l'envers du contrat : un écran par rythme que je vends — la semaine (**En cours**), le point écrit (**Le point**), la période (**La place**) — et rien d'autre. Ce que je coche dans la semaine est chez le client à son prochain chargement ; ce que j'écris — le point de lundi, les phrases « en ce moment », la ligne du mois, l'état des engagements — ne part qu'à la publication, brouillon invisible par RLS, le précédent restant affiché jusque-là. Le client n'a rien de nouveau à cliquer : régler une carte, commenter, demander restent ses trois seuls gestes, et ce qu'il ne clique pas se voit.

**Pourquoi les juges l'ont retenu** (22/25 chez les trois, à l'unanimité) : c'est la seule proposition dont la structure *est* l'offre — livrable à date, point écrit, arbitrage mensuel, signature — plutôt qu'un outil posé à côté. Une règle de visibilité et pas deux ; des lignes de point grises tant qu'elles ne sont pas relues, comptées sur le bouton « Publier » (le point reste écrit, pas généré) ; le relevé de décisions du point de 45 min, que les deux autres oubliaient alors que le cadrage le nomme « mémoire stratégique » ; et la fabrication la plus dé-risquée (pas de temps réel, une fonction pure pour le pré-remplissage, une RPC atomique, LEH seul d'abord). Le Miroir perdait sur le débit (un client à la fois, cinq miroirs le lundi) et livrait le client à l'atelier (chaque blur publié) ; la Bannette perdait sur la fidélité (une file récompense la réactivité, l'offre vend un plan) et reléguait l'état vivant des missions dans une fiche « qu'on ouvre rarement ». Les deux ont laissé leurs meilleures pièces, greffées ci-dessous : la file triée par la promesse qui court, « Voir comme », « Ajouter à la main », « Reprendre », « Classer », la vérification de charge à l'intercalation, le chantier masqué, et le socle d'exploitation.

**Charte.** La console est à la charte du site — encre, lime, Geist + Instrument Serif : tout ce qui est lime n'appartient qu'à moi. Tout ce que le client verra (aperçu d'une carte, la carte 03 avant publication, la page en « Voir comme ») est rendu en papier / violet, avec le composant de l'espace lui-même. La couleur dit qui voit quoi ; la frontière direct / publié n'est pas une règle à retenir, elle se voit.


### 2. Les écrans

#### 2.1 En cours — la semaine, tous clients confondus

**Rôle.** L'écran d'atterrissage et celui de tous les jours : là où je coche entre deux lundis et où j'absorbe ce qui vient des clients, sans changer de client. Le jour du point, son bandeau se retourne en mode « points à publier ».

**Blocs, dans l'ordre.**

1. **Bandeau des places** — cinq pilules : LEH et les quatre places (les libres, grisées « place libre »). Chaque pilule porte : le jour du point écrit, le livrable de la semaine et son échéance (`taches.livrable = vrai`), le nombre de signaux non traités, une case « semaine gardée » (mode plan). Cliquer une pilule filtre l'écran ; « Tout » le rétablit ; touches 1 à 5. Le jour du point : « 3 points à publier — LEH, place 1, place 2 · place 3 en semaine gardée », dans l'ordre du nombre de signaux.
2. **La file** (colonne de droite, tiroir bas sur téléphone) — tout ce qui attend un geste de moi, tous clients confondus, trié par la promesse qui court. Vue Postgres `file` (`security_invoker`, versionnée dans le repo), qui unit : demandes non traitées (`avant = created_at + 24 h`), ajustements demandés (`reglee_le + 48 h`), validations et réponses non classées (`+ 48 h`), commentaires non lus (`+ 48 h`), arbitrages rendus (`+ 24 h`), livrables à échéance sous sept jours (l'échéance). Trois bandes : **En retard / Avant ce soir / Cette semaine**. Chaque ligne : étiquette de nature, client, pastille du chantier (jamais lime), extrait, la promesse (« reprise 48 h — dépassée de 14 h »), deux ou trois gestes en pilules. Une quatrième bande à part, **Chez le client** : les cartes « À vous de jouer » ouvertes au-delà de leur échéance, avec « Relancer » (voir §5). Sous la file, replié : « 3 demandes attendent le point mensuel LEH du 5 novembre · 1 élément reporté à jeudi », et le fond de file « réglé aujourd'hui » avec « Rouvrir ».
3. **Lignes de chantier** — une ligne par chantier, groupées par client : pastille, nom, phases cliquables (cliquer avance `phase_courante`, recliquer la précédente recule), compteur « 2 / 6 », barre calculée. Dessous, repliées : les tâches du mois en cours, marqueur qui cycle ○ → → → ✓. Une tâche « à vous » porte la pastille violette et n'est pas cochable par moi : elle se règle quand le client répond à sa carte (lien `tache_id`). À cinq clients, vingt lignes : un écran. Un chantier masqué (`chantiers.visible = faux`) apparaît hachuré pour moi, pas du tout pour le client.
4. **Ajout rapide** — « + tâche » sous chaque chantier : texte, mois, à moi / à vous, livrable oui/non, échéance. Entrée valide. « À vous » crée en même temps sa carte.
5. **Déposer** (mini-fiche) — quand une tâche marquée livrable passe à ✓ : lien du fichier (Drive, Figma, Brevo — pas de stockage), « à valider par le client » coché par défaut, la phrase du pourquoi (obligatoire — c'est le seul geste qui parle au client en mon nom), aperçu papier de la carte, « Déposer ».
6. **Commenter** — le fil du chantier, ouvert depuis la ligne ou depuis un signal ; signé « Julien ».

**Gestes.** Cocher, avancer une phase, ajouter une tâche, déposer un livrable, répondre, et sur chaque signal de la file : Intercaler / Au point mensuel / Faire arbitrer / Répondre (demande) ; Reprendre — ce soir, +24 h, +48 h (ajustement) ; Classer, avec « Reporter dans le plan » qui transforme une réponse en échéance ou en tâche (validation, réponse, arbitrage rendu) ; Répondre / Vu (commentaire) ; Livrer (échéance) ; Plus tard — jeudi, lundi, date (tout) ; Relancer (chez le client) ; « Voir chez [prénom] » (ouvre l'espace du client en lecture, défilé jusqu'à l'élément). En pied de file : **Ajouter à la main** — saisir une demande ou une réponse reçue par e-mail ou au téléphone au nom du client, avec la même carte de process, pour que la base reste la seule vérité.

**Côté client — en direct** (au prochain chargement de sa page, rafraîchie au retour d'onglet) : ○ → ✓ et compteurs, barres, la phase qui pulse, les tâches nouvelles en ○, les cartes « À vous de jouer » et la phrase d'accueil qui recompte, la note de suite sur une carte réglée (« reprise en cours — v2 mercredi »), mes réponses dans le fil du chantier, et sous chaque demande du fil 04 la décision prise (« Julien — lundi : ajoutée au chantier Site, maquette mercredi » / « gardée pour le point mensuel du 5 novembre » / le motif d'un retrait). Sur un accordéon replié : « mis à jour il y a 2 jours » (max des `updated_at` du chantier et de ses tâches) — la seule ligne ajoutée à la maquette, elle dit que la page vit sans contredire le point.
**Publié le lundi** : rien depuis cet écran.

#### 2.2 Le point — un client, le jour du point

**Rôle.** Pré-remplir le point écrit depuis ce qui a bougé, relire, publier ; un client à la fois, dans l'ordre du bandeau. Deux colonnes sur grand écran (ce qui a bougé | le point), une sur téléphone. Le brouillon vit en base : il peut commencer dimanche soir.

**Blocs, dans l'ordre.**

1. **En-tête de semaine** — client, « semaine 4 sur 13 » ou « mois 3 du plan, semaine 2 », le livrable de la semaine et son état (livré jeudi / en retard / à venir), le point de 45 min (jour, heure), la case « semaine gardée ». Cocher la case remplace le point par une ligne unique proposée (« Semaine gardée à votre demande — on reprend lundi 19 ») et incrémente le compteur sans rien saisir.
2. **Ce qui a bougé depuis le dernier point publié** — une ligne par événement daté, tirée des horodatages postérieurs à `points_hebdo.publie_le` : tâche ✓ ou →, livrable déposé, carte réglée (avec le texte du client), ajustement repris, commentaire, demande reçue et son sort, arbitrage rendu. Interrupteur « dans le point » par ligne (coché sauf les commentaires). « + un événement oublié » coche une tâche depuis ici, elle passe aussi dans En cours.
3. **Le point écrit** — les lignes proposées : tag + pastille + phrase. Trois tags, ceux de la maquette : **Parti** (tâche ✓, livrable déposé), **En validation** (carte ouverte — la ligne porte « chez vous depuis le 9 »), **Engagé** (tâche →, avec son échéance ; une demande intercalée y entre comme tâche). Édition en place, réordonnancement aux flèches, suppression, « + une ligne ». Une ligne non touchée reste grise ; le bouton dit « Publier — 2 lignes non relues ».
4. **En ce moment, par chantier** — une phrase par accordéon, pré-remplie de la semaine passée : « garder » ou réécrire. C'est ma voix : elle ne change qu'à la publication.
5. **À vous de jouer, cette semaine** — les cartes ouvertes avec leur âge et leur échéance, « Relancer » sur celles en retard, et « + une carte » (titre, pourquoi, type valider / répondre / arbitrer, destinataire, échéance) avec aperçu papier. Une carte créée ici part à l'instant : une question qui bloque n'attend pas lundi.
6. **Prochain rendez-vous** — le point de 45 min (ordre du jour = lignes du point + cartes ouvertes) et le point mensuel s'il tombe sous trois semaines. Après le point de 45 min : **Décisions**, trois lignes ajoutées au point déjà publié.
7. **Aperçu et publication** — la carte « 03 — Mon point de lundi » rendue par le composant du client, en papier / violet, date comprise. « Publier » = RPC `publier_point` : point, phrases « en ce moment », ligne du mois et engagements partent ensemble ou pas du tout. Après : « Publié lundi 12 octobre, 8 h 36 » et « Corriger » (republie la même semaine, silencieux).
8. **Voir comme [prénom]** — touche V ou bouton d'en-tête : l'îlot `Espace` monté avec le `client_id` choisi, `editable = false`, sous ma session (la RLS du rôle julien lit tout). Trente secondes de contrôle de sortie avant de passer au client suivant. Échap revient.

**Côté client — en direct** : les cartes posées depuis le bloc 5, les décisions sur demandes. **Publié** : la carte 03 (date, lignes, prochain rendez-vous, puis les décisions), les phrases « en ce moment », la ligne du mois ou le compteur de semaines, l'état des engagements. Jamais : les lignes grises, le brouillon (statut `brouillon`, masqué par RLS), les autres clients.

#### 2.3 La place — un client, sa période

**Rôle.** Ce qui se décide une fois par mois ou une fois par période : le point mensuel, les engagements, les compteurs, la vie de la place (ouvrir, mettre en pause, clore). On y va rarement ; c'est aussi là que naît un client (§6).

**Blocs, dans l'ordre.**

1. **La fiche** — nom, alias public pour le registre, mode (plan / mission), dates de période et statut (`brouillon / en_cours / en_pause / close`), jour du point écrit, point de 45 min, personnes (prénom, e-mail, rôle décideur / équipe, « renvoyer le lien magique » — jamais d'e-mail composé à la main), état des « Premiers pas ».
2. **La file du point mensuel** — les demandes gardées : type, premier jalon accepté, date, chantier suggéré. « On ajoute » (tâche au mois choisi), « On retire » (motif en une ligne, visible dans le fil 04), « Plus tard ». On n'empile pas : la file se vide séance tenante.
3. **Le plan de la période** — chantiers × mois en grille, la même donnée que les accordéons vue en colonnes ; déplacer une tâche d'un mois à l'autre, renommer, recolorer, réordonner les phases, masquer / démasquer un chantier, poser un jalon sur la frise (`clients.jalons`).
4. **Les engagements de fin de période** — table `engagements`, un état ○ / → / ✓ par ligne, mesure du moment facultative. L'état part à la prochaine publication.
5. **Le compteur du mois** — saisie manuelle en V1 : heures (moi seul), livrables ou campagnes. Ce qui part chez le client dépend du mode : « Octobre : 3 semaines utilisées · 1 gardée » (calculé depuis les points publiés) en mode plan ; la ligne libre de la maquette en mode mission. Le dernier lundi du mois, Le point demande la saisie avant de publier.
6. **Relevé de décisions** — toutes les décisions de la période, page imprimable : matière du bilan et de l'étude de cas du registre.
7. **La vie de la place** — « Mettre en pause » (la page du client affiche « Votre place vous attend — reprise le … », la frise se fige, la place reste comptée dans les quatre), « Reprendre », « Clore la période » = RPC `clore_periode` (fige points, décisions, engagements et compteurs ; l'espace passe en lecture seule, lien magique conservé, bloc « Tout ce que vous avez reçu » listant chaque livrable déposé avec son lien — la promesse « vous gardez tout » a un endroit où tenir), « Nouvelle période » (LEH : période suivante en brouillon, le client continue de voir la précédente jusqu'à publication).

**Côté client — en direct** : les tâches déplacées, jalons posés, chantiers démasqués, motifs de retrait. **Publié** : engagements, ligne du mois. **À la clôture** : la page en lecture seule.


### 3. Mon lundi matin, minute par minute

Lundi 12 octobre 2026. Quatre clients : LEH (mission), places 1 à 3 (offre du site), place 4 libre. Objectif : le point écrit publié en moins de dix minutes par client. Sur ordinateur.

- **8 h 30** — J'ouvre `/console`, session déjà ouverte par lien magique. En cours, bandeau en mode lundi : « 3 points à publier — LEH, place 1, place 2 · place 3 en semaine gardée ». La file : 2 en retard, 4 avant ce soir, 3 cette semaine, 1 chez le client.
- **8 h 31** — En retard : *Ajustement · LEH · Culture & Patrimoine* — Sébastien, vendredi 18 h : « le chapitre 3 de la trame ne colle pas au terrain », « reprise 48 h — dépassée de 14 h ». **Reprendre → +48 h** : tâche « Trame v2 — mercredi » créée dans le chantier, la carte de Sébastien dit « reprise en cours — v2 mercredi ». Vingt secondes.
- **8 h 32** — En retard : *Échéance · place 1 · Contenus* — « Gabarit e-mail de relance », attendu vendredi, fini samedi dans le Drive. **Livrer** : lien, « à valider » coché, pourquoi : « Votre feu vert lance la première vague ». Tâche ✓, carte « Valider le gabarit » chez le client. Trente secondes.
- **8 h 33** — Avant ce soir : *Demande · place 1* — « une page pour le salon du 14 novembre », cadrée Site par l'assistant, maquette sous 48 h acceptée samedi. **Intercaler** → Site, semaine 43 : « S43 porte déjà “Page offre”, le livrable à date — ça rentre / faire arbitrer ». Ça rentre. Tâche « Maquette salon — mercredi » créée ; le fil 04 du client trace : « Julien — lundi : ajoutée au chantier Site, maquette mercredi ». Quarante secondes.
- **8 h 34** — *Commentaire · LEH · Mesure des ventes* — « Laurent est en congé jusqu'au 20 ». **Répondre** : « Noté — je décale le point remontée des commandes à la semaine du 21. » Entrée. La console propose « décaler l'échéance liée ? » : +7 jours. Trente secondes.
- **8 h 35** — *Réponse · place 2 · Marketing* — à « Donner la date de mise en ligne », le client a répondu « 3 novembre ». **Classer → Reporter dans le plan** : échéance posée sur « Campagnes de lancement ». Quinze secondes.
- **8 h 36** — *Demande · place 2* — « refaire le logo », Hors cadre. Elle décalerait S3 (fondations, charte comprise). **Faire arbitrer** : les deux issues pré-rédigées depuis le nom du livrable — « Garder le plan : la charte arrive en S3, le logo avec » / « Prendre le logo maintenant : S3 glisse d'une semaine » — je retouche un mot, aperçu papier, Envoyer. La carte est en tête de la page de la cliente. Vingt-cinq secondes.
- **8 h 37** — Chez le client : *LEH · « Choisir l'établissement test »* ouverte depuis huit jours, échéance dépassée. **Relancer** : la carte porte « relancée lundi », la ligne « En validation — chez vous depuis le 5 » entrera dans le point ; en V1 je copie le texte de relance proposé dans un e-mail. Vingt secondes. Reste dans la file : trois échéances de la semaine (mon travail, je les laisse) et un merci — Vu.
- **8 h 39** — Pilule LEH → **Le point**. Ce qui a bougé depuis lundi 5 : sept lignes, dont deux annonces de parution ✓ jeudi, « Trois groupes Brevo » →, la demande DRH rangée au point mensuel par l'assistant, la reprise de 8 h 31. « + un événement oublié » : la séquence e-learning programmée dans Brevo ce matin, ✓. Le point écrit propose six lignes grises ; j'en garde cinq, réécris « Séquence e-learning : toute la base relancée », complète « Remontée des commandes — point avec Laurent le 21 », monte « En validation · Trame v2 — mercredi » en troisième. « En ce moment » : deux phrases réécrites, deux gardées. Cartes ouvertes : deux, une relancée. Prochain rendez-vous : le point mensuel du 5 novembre, « on y arbitre la demande DRH ». Aperçu. « Publier » — aucune ligne non relue. **8 h 45.** Touche V : la page de Sébastien de haut en bas, deux cartes, quatre chantiers à jour, le point daté du jour, la demande tracée. Échap. **8 h 46.**
- **8 h 46** — Place 1 : Parti (gabarit), En validation (gabarit), Engagé (page offre S43, maquette salon mercredi). Trois lignes, une reformulée. « Octobre : 3 semaines utilisées · 1 gardée » calculé. Publier, V, Échap. **8 h 50.**
- **8 h 50** — Place 2, starter pack S2 : Parti (état des lieux validé mardi), Engagé (plan douze mois vendredi), En validation (« Logo — à vous d'arbitrer, la carte est en haut de votre page »). Publier, V, Échap. **8 h 54.**
- **8 h 54** — Place 3, semaine gardée cochée jeudi : le point est une ligne, « Semaine gardée à votre demande — on reprend lundi 19. Octobre : 2 semaines utilisées · 1 gardée. » Confirmer. **8 h 55.**
- **8 h 55** — Retour à En cours, mode semaine. Le bandeau montre par client le livrable de la semaine et son jour ; je décale la fiche Google Business de place 1 à mercredi pour laisser jeudi à la maquette. Ferme. **8 h 57.**

Vingt-sept minutes, trois points publiés, une semaine gardée, sept signaux réglés — entre quatre et sept minutes par client pour le point lui-même. Le reste de la semaine : des gestes de trente secondes depuis En cours, au moment où je livre. Mardi après le point de 45 min avec LEH : trois lignes dans « Décisions », une minute. Le chiffre du temps gagné [À VALIDER] se mesure sur quatre lundis avec LEH avant d'être répété.


### 4. Les gestes fréquents et leur nombre de clics

Compte depuis En cours ouvert, chantier déplié ; « + saisie » = un texte ou un lien à taper.

- **Cocher une tâche** — 1 clic (le marqueur cycle ○ → → → ✓). Chantier replié : 2.
- **Poser une action au client** — 2 clics + saisie : « + carte » sous le chantier (ou dans Le point), titre / pourquoi / type / destinataire, « Poser ». L'aperçu papier est dans le formulaire, pas une étape.
- **Livrer** — 2 clics + un lien : ✓ sur une tâche livrable ouvre la mini-fiche, lien, pourquoi, « Déposer ». La carte « Valider » naît dans le même geste.
- **Accepter une demande dans le plan** — 4 clics : « Intercaler », chantier, semaine, « Confirmer ». Un cinquième si la semaine porte déjà son livrable (« ça rentre »). La décision s'écrit seule dans le fil 04.
- **Envoyer à l'arbitrage** — 2 clics + relecture : « Faire arbitrer », les deux issues pré-rédigées à corriger, « Envoyer ». En mode mission, « Au point mensuel » : 1 clic.
- **Répondre à un commentaire** — 1 clic + texte + Entrée, depuis la file ou la ligne du chantier.
- **Changer de client** — 0 clic dans En cours (tous clients confondus) ; 1 clic sur la pilule ou touche 1 à 5 pour filtrer ou ouvrir Le point.

Chaque geste qui touche plusieurs lignes est une fonction Postgres appelée en RPC — `intercaler`, `livrer`, `reprendre`, `faire_arbitrer`, `classer`, `publier_point`, `clore_periode`, `creer_client` — atomique, sous RLS, sans clé service dans le navigateur. Clavier : flèches dans la file, Entrée ouvre, 1 à 4 déclenchent les gestes dans l'ordre affiché, Échap ferme ; aucun glisser-déposer.


### 5. Le multi-clients

**La vue d'accueil**, c'est En cours : le bandeau des places au-dessus, la file à droite, les lignes de chantier au centre — tous clients confondus, le client d'un élément hérité et jamais choisi (on ne se trompe pas de client, au pire de chantier). Cinq places, un écran.

**Les signaux qui remontent** — la vue `file`, triée par la promesse qui court, telle que l'offre l'écrit : J+1 pour répondre à une demande, 48 h pour une reprise, 48 h pour accuser une validation ou une réponse, l'échéance pour un livrable. Les règles sont dans la vue SQL, versionnées, jamais réglables depuis l'écran. La pilule de chaque client compte ses signaux non traités ; « 2 en retard » s'affiche en tête. Un signal jamais traité ne disparaît pas : il vieillit dans la bande En retard.

**Ce qui arrive hors de l'espace** — un e-mail, un appel : « Ajouter à la main », au nom du client, avec la carte de process. Sans ça la console n'est jamais la seule vérité et le pré-remplissage du lundi ment.

**La relance des actions client en retard.** Chaque carte « À vous de jouer » porte une échéance (défaut : J+5 pour valider ou répondre, J+3 pour arbitrer, modifiable). Passée l'échéance, la carte monte dans la bande « Chez le client » de la file et dans « À vous de jouer, cette semaine » du point, avec son âge. Un geste, **Relancer** : horodate `relancee_le`, pose « relancée lundi » sur la carte côté client (sobre, une fois), propose le texte d'une relance que je copie dans un e-mail en V1, et fait entrer la ligne « En validation — chez vous depuis le 5 » dans le point écrit. En V1.5, la relance part par Brevo transactionnel, une seule fois par carte. La règle de rôle devient réciproque : tout ce qui se clique est pour le client, et ce qu'il ne clique pas se voit — chez lui aussi.

**Le compteur des quatre places** — une place occupée est un `clients` en `en_cours` ou `en_pause` en mode plan ; LEH ne compte pas dedans. Le chiffre de la home reste statique en V1 ; il se lira depuis la base en V2.


### 6. Le provisioning d'un nouveau client

Depuis La place → « Nouvelle place ». Moins d'une heure, zéro code, une transaction `creer_client`.

1. **La fiche** — nom, alias public, mode (plan / mission), dates de période, jour du point écrit, point de 45 min, personnes (prénom, e-mail, rôle). Une personne = une ligne `membres` ; aucun compte à créer : la première connexion par lien magique est rapprochée par e-mail.
2. **Coller le plan** — un grand champ où je colle le plan validé par le client. Un découpage déterministe, sans LLM : un titre = un chantier, « Octobre » = un mois, une ligne de liste = une tâche (« (à vous) » = attendue du client, « (livrable) » = à date), « Au 15 décembre : » = engagements, une ligne datée = jalon. Une ligne non comprise est signalée, jamais devinée. Pour l'offre du site, « Starter pack » pré-remplit S1 état des lieux, S2 plan douze mois, S3 fondations, S4 outils, chacune avec son livrable à date ; les chantiers du plan s'ajoutent après S2.
3. **Structuration** — le tableau de relecture, seule vérité : chantiers détectés avec couleur proposée dans l'ordre (orange, magenta, teal, bleu — le violet reste au client) et grammaire de phases (cadrage › production › validation › livraison, modifiable par chantier), tâches rangées par mois, engagements, jalons. Tout se corrige ici ; le parseur est une commodité, le tableau fait foi. Rien n'est inséré avant « Créer l'espace ». À la création la période est en `brouillon` : je vérifie en « Voir comme », je corrige depuis La place, puis « Publier la période ».
4. **Premiers pas** — créés d'avance comme premières `actions_client` : les huit questions (sautées si le prospect a rempli « Faire le point »), les liens et accès à coller, le choix du créneau hebdo. La collecte de S1 est l'onboarding, pas une étape en plus.
5. **Envoyer le lien** — un bouton : `signInWithOtp` sur l'e-mail de chaque membre, via le SMTP Brevo. Je retombe sur En cours, le nouveau client dans le bandeau.


### 7. Ce qui reste hors V1

- **Temps réel (Supabase Realtime)** — « à l'instant » signifie au prochain chargement, rafraîchi au retour d'onglet ; suffisant pour un rituel hebdomadaire.
- **E-mails sortants (Brevo transactionnel, V1.5)** — « Votre point de lundi est en ligne » à la première publication de la semaine seulement, et la relance d'une carte en retard, une fois ; « Corriger » reste silencieux. En attendant, « Copier le point » donne le texte de l'e-mail.
- **Webhooks vers n8n / ClickUp (V2)** — Database Webhooks Supabase sur `points_hebdo` (statut → publié), `actions_client` et `demandes` (insert), `taches` (update) ; la console devient la source, ClickUp reçoit, jamais l'inverse.
- **Adresse de transfert (V2)** — un e-mail transféré à n8n crée la demande, pour que « Ajouter à la main » disparaisse.
- **Assistant conversationnel (Claude Haiku, V2)** — route `/api/assistant` sur le Worker, cartes de process en prompt système, réutilise le SSE de `/api/experience` ; l'étage scripté suffit à la V1.
- **Structuration du plan par IA (V2)** — un document Word collé tel quel, découpé par Haiku puis relu dans le même tableau ; en V1 le gabarit texte et le tableau font le travail.
- **Compteur du mois automatique (V3)** — time-tracking ClickUp vers `clients.compteurs` ; saisie manuelle en V1, exigée le dernier lundi du mois.
- **Vue « toutes les demandes » d'une place et historique des versions d'un point** — quand cinq places le réclameront.


### 8. Les décisions tranchées et les points laissés à Julien

**Tranché.**

1. **Trois écrans, pas quatre** : En cours (la semaine), Le point (le lundi), La place (la période, provisioning et clôture compris). Le mois n'est pas un écran, c'est un bloc de La place.
2. **Une règle de visibilité** : l'état mécanique part en direct, ma voix part à la publication. Pas de régime « ce que Julien initie attend lundi » (Bannette) : une tâche intercalée mardi existe chez le client mardi.
3. **Trois tags dans la carte 03**, ceux de la maquette : Parti / En validation / Engagé. Pas de quatrième tag « Reçu » : le sort d'une demande se trace dans le fil 04, sous le récapitulatif de l'assistant, et une demande intercalée devient une ligne « Engagé ».
4. **La console est encre / lime** ; tout ce que le client verra est rendu en papier / violet par le composant de l'espace. Un seul composant `Espace` ; « Voir comme » est ce composant en `editable = false`.
5. **La phase courante est stockée** (`chantiers.phase_courante`), pas calculée : la grammaire de phases est propre à chaque chantier et ne colle pas aux mois. La barre, elle, est calculée (✓ / total). Les engagements sont une table, pas un JSON.
6. **Pas de parseur qui se trompe en silence** : gabarit texte léger, lignes non comprises signalées, tableau de relecture qui fait foi.
7. **Le cycle de vie est dans le schéma dès la V1** : `clients.statut_periode` (brouillon / en_cours / en_pause / close) porté par les RLS de lecture, `clore_periode`, bloc « Tout ce que vous avez reçu » en lecture seule. Une colonne et une fonction aujourd'hui, une migration douloureuse demain.
8. **Un destinataire par carte** : `actions_client.membre_id` (défaut : le décideur), phrase d'accueil calculée par membre (« Bonjour Laurent — une chose vous attend »). Pas de permissions fines.
9. **Socle d'exploitation, dès le premier jour** : projet Supabase à recréer (celui du site a été supprimé) ; cron Cloudflare hebdomadaire qui réveille la base (pause après sept jours sans requête au palier gratuit) ; SMTP Brevo pour les liens magiques (le SMTP intégré est plafonné) ; déclencheur sur `auth.users` qui refuse toute adresse absente de `membres` ; un seul compte `julien` (`app_metadata.role`), RLS testée avec un compte client de contrôle avant la première invitation ; export `pg_dump` hebdomadaire par action GitHub vers un dépôt privé (pas de sauvegarde au palier gratuit) ; `/console` et `/espace` en `noindex`, exclues du sitemap et de `llms.txt` ; le dépôt strictement privé tant que des données LEH y vivent, variante anonymisée sinon.
10. **Ordre de fabrication** : schéma + RLS + RPC, puis Le point sur LEH seul (quatre lundis), puis En cours et la file, puis La place et le provisioning, puis le mode plan avec la carte « Arbitrer » maquettée. Compter cinq à sept jours console comprise, plus un à deux jours pour l'îlot de l'espace client, qui n'existe pas encore. Coût récurrent : zéro.

**À toi, Julien.**

1. **Les heures.** Le cadrage dit « aucune heure affichée » ; la maquette LEH dit « 19 h à vos côtés ». La console tient toujours les heures ; ce qui s'affiche dépend du mode — semaines en mode plan, ligne libre en mode mission. Confirmer que la ligne libre peut contenir des heures pour LEH, ou l'interdire partout.
2. **Les échéances par défaut des cartes client** (J+5 valider / répondre, J+3 arbitrer) et le ton de la relance : à écrire toi-même, c'est ta voix qui part.
3. **Le nom** de l'espace côté client (« Votre espace » / « Le fil » / « L'atelier ») : il apparaîtra dans les e-mails de V1.5, et la console le reprend.
4. **La double saisie ClickUp** jusqu'aux webhooks V2 : la règle proposée est « la console est la source pour tout ce que le client voit, ClickUp ne reçoit que ce qu'on lui pousse ». Si tu tiens ClickUp en parallèle pour les mêmes tâches, le gain des premières semaines est nul — à décider avant la V1, pas après.
5. **La clôture d'une période comme matière du registre** : quels éléments (engagements mesurés, décisions datées, livrables tracés) peuvent devenir l'étude de cas anonymisée, et lesquels restent au client. La console fabrique la preuve ; toi seul dis ce qui se publie — règle éditoriale n° 2.
6. **Le temps gagné** [À VALIDER] : aucune des estimations des trois propositions (une heure trente à trois heures par semaine à cinq places) n'est publiable avant quatre lundis mesurés sur LEH.

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
