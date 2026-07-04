---
title: "Une agence santé produit ses rétroplannings sans dépendre de la tête de ses chefs de projet"
client: "Agence de communication santé"
secteur: "Communication santé"
annee: 2026
role: "Conception et intégration du moyen de production"
stack: ["Assistants IA", "Gabarit .xlsx", "Standard interne encodé"]
besoin: "produire"
enjeu: "Un standard de planning éprouvé mais oral, refait à la main à chaque mission, avec des phases de validation réglementaire parfois oubliées."
transformation: "L'agence transforme un brief en rétroplanning complet, au standard maison, en minutes — le savoir-faire est dans le système, plus dans une tête."
pitch: "Un moyen de production installé dans l'agence : le standard planning encodé une fois, l'équipe génère un rétroplanning conforme à partir d'un simple brief, dans le format qu'elle utilise déjà."
resultats:
  - chiffre: ".xlsx"
    label: "produit dans le format natif de l'équipe"
  - chiffre: "min"
    label: "d'un brief au planning complet"
visuel:
  src: "/artefacts/retroplanning.webp"
  alt: "Rétroplanning généré — reconstitution sur une mission fictive, standard visuel réel"
published: true
sortOrder: 11
---

## L'enjeu

Dans une agence de communication santé, chaque mission démarre par un rétroplanning : livrables, phases, circuit de validation. Le secteur impose une étape que les autres agences n'ont pas — la validation réglementaire des contenus, ce circuit d'approbation propre aux communications santé/pharma. Et l'agence a son standard maison : un code couleur, une hiérarchie de tâches, un pattern de circuit affinés par des années de missions.

Le vrai problème n'est pas « faire des plannings plus vite ». C'est que ce standard vivait dans la tête des chefs de projet. Chaque planning était refait à la main, avec ses variations, ses oublis de phases de validation, son temps perdu. L'agence n'avait pas de capacité de production de ses plannings : elle avait des personnes qui savaient les faire. Le jour où ces personnes manquent, le savoir-faire manque avec elles.

## Le système déployé

J'ai encodé le standard une fois pour toutes dans un générateur piloté par l'IA — pas un gabarit de plus à remplir, un moyen de produire :

- **Le pattern canonique de l'agence est dans le système** — hiérarchie livrable → phase → tâche, code couleur, circuit de validation réglementaire. Il n'est plus réexpliqué à chaque mission : il est décrit une fois, dans le générateur.
- **L'entrée est un brief en langage naturel** : les livrables, le client, les dates clés. Rien d'autre à saisir.
- **La sortie est le fichier que l'équipe manipule déjà** : un `.xlsx` au standard visuel maison, directement exploitable. Aucun outil à adopter, aucune plateforme à apprendre.
- **Le circuit de validation ne peut plus être oublié** : il fait partie du pattern. Le générateur ne sait pas produire un planning qui l'omet.

L'agence ne reçoit pas des plannings : elle reçoit la machine qui les produit.

## La transformation

Avant, un rétroplanning voulait dire un chef de projet, sa mémoire du standard, et le risque d'un oubli à chaque nouvelle mission. Après, un brief suffit : le planning complet sort en minutes, au bon format, avec le circuit réglementaire intégré par construction.

L'agence a gagné une capacité qu'elle n'avait pas : **produire ses rétroplannings au standard maison sans dépendre de qui est présent ce jour-là.** Le savoir-faire planning, jusque-là oral et fragile, est devenu un actif explicite, systématique et transmissible.

## La méthode

L'automatisation la plus rentable n'est pas la plus spectaculaire : c'est celle qui encode un standard existant. Quand une équipe a déjà une bonne pratique, mon travail n'est pas de l'inventer — c'est de la rendre structurelle, en gardant le format que les humains utilisent déjà. Je n'exécute pas des plannings à la place de l'agence : j'installe le moyen qu'elle les produise seule, à chaque mission, sans re-brief.
