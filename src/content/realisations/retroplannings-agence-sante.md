---
title: "Des rétroplannings générés en minutes, au standard maison d'une agence santé"
client: "Agence de communication santé"
secteur: "Communication santé"
annee: 2026
role: "Conception du générateur, encodage du standard interne"
stack: ["Assistants IA", "Gabarit .xlsx", "Process encodé"]
besoin: "produire"
pitch: "Un générateur qui transforme un brief de mission — livrables, client, dates clés — en rétroplanning complet au format et au standard visuel de l'agence."
resultats:
  - chiffre: ".xlsx"
    label: "le format natif de l'équipe"
  - chiffre: "min"
    label: "d'un brief au planning complet"
visuel:
  src: "/artefacts/retroplanning.webp"
  alt: "Rétroplanning généré — reconstitution sur une mission fictive, standard visuel réel"
published: true
sortOrder: 11
---

## Le contexte

Dans une agence de communication santé, chaque mission démarre par un rétroplanning : livrables, phases, circuit de validation. Le secteur impose une étape que les autres agences n'ont pas — la validation réglementaire des contenus (le circuit d'approbation propre aux communications santé/pharma) — et l'agence a son standard maison : un code couleur, une hiérarchie de tâches, un pattern de circuit éprouvés par des années de missions.

Problème classique : ce standard vivait dans la tête des chefs de projet. Chaque planning était refait à la main, avec des variations, des oublis de phases de validation, et du temps perdu à chaque nouvelle mission.

## Ce qui a été construit

Le standard a été **encodé une fois pour toutes** dans un générateur piloté par l'IA :

- **Le pattern canonique de l'agence** — hiérarchie livrable → phase → tâche, système de couleurs, circuit de validation réglementaire — est décrit dans le système, pas réexpliqué à chaque usage.
- **L'entrée est un brief en langage naturel** : les livrables, le client, les dates clés. C'est tout.
- **La sortie est le fichier que l'équipe utilise déjà** : un `.xlsx` au standard visuel maison, directement exploitable — pas un outil de plus à adopter, pas de nouvelle plateforme.
- **Le circuit de validation n'est jamais oublié** : il fait partie du pattern. Le générateur ne sait pas produire un planning qui l'omet.

## Ce que ça a produit

Le passage d'un brief au rétroplanning complet se fait en minutes, dans le format que les équipes manipulent au quotidien. Le savoir-faire planning de l'agence est devenu un actif explicite et transmissible, au lieu d'une pratique orale.

## Ce qu'il faut en retenir

L'automatisation la plus rentable n'est pas la plus spectaculaire : c'est celle qui encode un standard existant. Quand une équipe a déjà une bonne pratique, le travail de l'IA n'est pas de l'inventer — c'est de la rendre systématique, en gardant le format que les humains utilisent déjà.
