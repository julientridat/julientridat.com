---
title: "Du déclaratif à l'auditable : pourquoi j'ai transformé mon site en registre de preuves"
date: 2026-07-04
pitch: "Les plateformes sociales récompensent la déclaration, pas la compétence. Ce que je change dans ma propre infrastructure — et pourquoi ça vous concerne."
published: true
---

## Le signal s'effondre

LinkedIn reste incontournable — 1,2 milliard de comptes, une intégration profonde dans les outils RH, aucun concurrent sérieux. Mais son signal se dégrade à vue d'œil : selon Originality.ai, plus de la moitié du contenu long format publié sur la plateforme serait désormais généré par IA, pendant que la portée organique, d'après les mesures publiées par les observateurs de la plateforme, s'érode d'année en année.

Le mécanisme est structurel. L'algorithme récompense le consensus : ce qui ressemble à ce qui a déjà marché. Les experts s'y normalisent, gomment leurs aspérités, publient la même « soupe tiède » que tout le monde. Ironie du sort : en se rendant conformes, ils deviennent précisément ce que l'IA générative sait le mieux reproduire. **S'aligner sur la norme, c'est faciliter sa propre automatisation.**

## Dire ne prouve rien

Le problème dépasse LinkedIn : tout notre système de signaux professionnels est déclaratif. Le CV dit « 15 ans d'expérience ». Le profil dit « leader visionnaire ». Le diplôme dit « a été là ».

Or la recherche sur le recrutement est brutale avec ces signaux. La méta-analyse de Schmidt et Hunter, référence du domaine, mesure la corrélation entre années d'expérience et performance réelle à 0,18 — l'expérience déclarée explique une part infime de la valeur produite. La même méta-analyse situe le niveau d'études plus bas encore (autour de 0,10). Le CV mesure le temps passé, pas la valeur créée.

Ce qui prouve, c'est l'artefact : le code qu'on peut lire, l'analyse qu'on peut vérifier, le processus documenté qu'on peut auditer. Pas l'adjectif — la trace du faire.

## Les agents ne scrollent pas

Il y a une raison supplémentaire, et elle est devant nous. Une part croissante des décisions — recruter, référencer, recommander, acheter une prestation — passe désormais par des agents IA qui pré-mâchent le travail des humains.

Un agent ne scrolle pas un fil social. Il ne se laisse pas impressionner par un titre de poste. Il cherche de la donnée structurée : qu'avez-vous fait, pour qui, avec quel résultat, où est la preuve. Le référencement change de nature : il ne s'agit plus seulement d'être visible dans une liste de résultats, mais d'être **intégrable dans une décision** — trouvable, vérifiable, recommandable par une machine sans intervention humaine.

Une page de vente en JavaScript propriétaire est muette pour ces agents. Un registre HTML structuré, avec microdonnées et point d'entrée dédié, leur parle nativement.

## Ce que j'ai changé

Ce site n'est plus une plaquette. C'est un registre :

- **Chaque mission close devient une étude de cas** — contexte, ce qui a été construit, ce que ça a produit. Clients anonymisés, faits vérifiables, aucun chiffre invérifiable.
- **Chaque analyse devient une note** — comme celle-ci. Le raisonnement documenté vaut plus que la conclusion assénée.
- **Tout est lisible par les machines** — HTML intégralement pré-rendu, microdonnées JSON-LD sur chaque page, fichier [llms.txt](/llms.txt) généré depuis le contenu réel pour donner aux agents un point d'entrée structuré.
- **Tout m'appartient** — code versionné, hébergement statique à coût nul, aucune plateforme propriétaire entre mon travail et ceux qui le cherchent.

LinkedIn reste un canal de distribution. Il n'est plus le lieu où réside la valeur.

## La question pour votre entreprise

Ce raisonnement ne vaut pas que pour un consultant. Votre entreprise aussi est évaluée par des acheteurs qui délèguent leur présélection à des IA — dès aujourd'hui, et de plus en plus. Que trouvent-elles : des pages de promesses, ou des preuves structurées de ce que vous savez faire ?

C'est exactement le genre de chantier que je mène avec mes clients. La première étape tient en une question : *si un agent IA devait vous recommander demain matin, sur quelles preuves pourrait-il s'appuyer ?*
