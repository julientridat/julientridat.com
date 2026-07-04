---
title: "Un consultant IA qui transforme son site en registre de preuves lisible par les agents"
client: "Julien Tridat (ce site)"
secteur: "Infrastructure personnelle"
annee: 2026
role: "Conception, développement, contenu"
stack: ["Astro", "Cloudflare Pages", "React", "JSON-LD", "llms.txt"]
besoin: "rayonner"
enjeu: "Une page de vente propriétaire, efficace mais fermée et muette pour les machines — je critiquais chez moi ce que je corrige chez mes clients."
transformation: "J'ai remplacé la coquille no-code par un actif que je possède, à coût nul, qui documente chaque mission en preuve vérifiable et se donne à lire aux agents IA."
pitch: "Un site statique souverain qui transforme chaque mission en étude de cas vérifiable, lisible par les moteurs, les agents IA et les humains."
resultats:
  - chiffre: "0 €"
    label: "de coût d'infrastructure, chaque mois"
  - chiffre: "100 %"
    label: "HTML pré-rendu, portable chez n'importe quel hébergeur"
  - chiffre: "1"
    label: "llms.txt régénéré à chaque publication de mission"
visuel:
  src: "/artefacts/plateforme.webp"
  alt: "La page d'accueil de julientridat.com — le site documenté par cette étude de cas"
published: true
sortOrder: 12
---

## Le point de départ

Ce site est né d'un constat que je documente dans [la note fondatrice](/notes/du-declaratif-a-l-auditable) : les plateformes sociales récompensent la déclaration, pas la preuve. Un consultant qui affirme « j'intègre l'IA dans les entreprises » ressemble à mille autres. Celui qui documente comment il l'a fait, mission par mission, avec les résultats, ne ressemble plus à personne.

Le déclencheur a été un malaise très concret : mon propre site ne tenait pas la promesse que je vends. La version précédente était une page de vente construite sur un outil no-code — efficace pour convertir, mais propriétaire, fermée, et totalement muette pour les machines. Je ne possédais pas mon canal. J'étais exactement le cas que je corrige chez mes clients : quelqu'un qui loue sa vitrine à une plateforme qui la rend invisible aux moteurs et illisible aux agents IA. Il fallait m'appliquer ma propre méthode.

## La méthode, sur le terrain

J'ai procédé comme sur une mission cliente. D'abord observer le besoin réel : être trouvable et être vérifiable, sur un canal que je contrôle, dans un monde où ce ne sont plus seulement des humains qui liront mes pages, mais aussi des agents IA.

Ensuite choisir l'architecture la plus simple qui tienne dans le temps : un site statique en HTML pré-rendu, du code versionné, un hébergement gratuit. Pas de base de données, pas d'abonnement, pas de dépendance. Puis construire les systèmes qui font vivre le site tout seul — le registre de missions, les microdonnées, le fichier qui parle aux agents — et faire en sorte qu'ils se régénèrent à chaque publication, sans intervention manuelle. Le site est lui-même l'étude de cas : la méthode que je vends, exécutée sur mon propre canal.

## Les assistants installés

Ce que j'ai installé n'est pas une prestation figée mais un ensemble de systèmes qui produisent à chaque mise à jour :

- **Un actif que je possède** : site statique Astro, code versionné dans Git, hébergé sur Cloudflare Pages. Aucune plateforme propriétaire entre le contenu et ses lecteurs. Coût d'infrastructure nul, contenu et code intégralement portables. Si l'hébergeur change, le site part avec moi.
- **Un registre de preuves** : chaque mission est documentée selon la même structure — le point de départ, la méthode, les assistants installés, ce qui a changé. Les clients sont anonymisés, les faits sont vérifiables, aucun chiffre invérifiable n'y figure. Chaque mission close enrichit le registre.
- **Un site lisible par les machines** : chaque page embarque ses microdonnées JSON-LD (`Person`, `Article`, `BreadcrumbList`), le HTML est intégralement pré-rendu, et un fichier `llms.txt` — généré au build depuis le contenu réel — offre aux agents IA un point d'entrée structuré vers tout le registre. Allez voir : [julientridat.com/llms.txt](/llms.txt).
- **La conversion préservée** : les offres, la méthode et la prise de rendez-vous de l'ancien site sont intégralement conservées. La preuve ne remplace pas la vente ; elle la fonde.

## Ce qui a changé

Avant, je louais ma vitrine à un outil qui la rendait muette pour les moteurs et illisible pour les agents. Après, je possède un actif qui m'appartient entièrement, qui coûte zéro euro par mois, et qui grandit à chaque mission close : le registre s'enrichit, le `llms.txt` et le sitemap se régénèrent, les agents et les moteurs voient la mise à jour au déploiement suivant. Je ne commande plus un site : il se met à jour tout seul, à chaque livraison documentée.

J'ai gagné ce que je fais gagner à mes clients : une capacité que je n'avais pas — être trouvable et vérifiable sur un canal que je contrôle, sans dépendre de personne. Si vous lisez ceci, le système fonctionne.
