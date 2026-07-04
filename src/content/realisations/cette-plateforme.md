---
title: "Ce site — un actif souverain qui documente chaque mission, pour les humains comme pour les agents"
client: "Julien Tridat (ce site)"
secteur: "Infrastructure personnelle"
annee: 2026
role: "Conception, développement, contenu"
stack: ["Astro", "Cloudflare Pages", "React", "JSON-LD", "llms.txt"]
besoin: "rayonner"
enjeu: "Une page de vente propriétaire, efficace mais fermée et muette pour les machines — je critiquais ce que j'étais moi-même."
transformation: "J'ai remplacé la coquille no-code par un actif que je possède, à coût nul, qui documente chaque mission en preuve vérifiable et se donne à lire aux agents IA."
pitch: "Un site statique souverain qui transforme chaque mission en étude de cas vérifiable, structuré pour les moteurs, les agents IA et les humains — la méthode que je vends, appliquée à moi-même."
resultats:
  - chiffre: "0 €"
    label: "coût d'infrastructure mensuel"
  - chiffre: "100 %"
    label: "HTML pré-rendu, portable partout"
  - chiffre: "1"
    label: "llms.txt régénéré à chaque build"
visuel:
  src: "/artefacts/plateforme.webp"
  alt: "La page d'accueil de julientridat.com — le site documenté par cette étude de cas"
published: true
sortOrder: 12
---

## L'enjeu

Ce site est né d'un constat que je documente dans [la note fondatrice](/notes/du-declaratif-a-l-auditable) : les plateformes sociales récompensent la déclaration, pas la preuve. Un consultant qui affirme « j'intègre l'IA dans les PME » ressemble à mille autres. Celui qui documente comment il l'a fait, mission par mission, avec les résultats — ne ressemble plus à personne.

Le vrai problème n'était pas cosmétique. La version précédente de ce site était une page de vente construite sur un outil no-code : efficace pour convertir, mais propriétaire, fermée, et muette pour les machines. Je ne possédais pas mon propre canal. Ce que ce site critique aujourd'hui, il l'était hier.

## Ce que j'ai mis en place

Exactement ce que je vends — donc le site est lui-même une étude de cas :

- **Un actif que je possède** : site statique Astro, code versionné dans Git, hébergé sur Cloudflare Pages. Aucune plateforme propriétaire entre le contenu et ses lecteurs : coût d'infrastructure nul, contenu et code intégralement portables chez n'importe quel hébergeur statique. Si l'hébergeur change, le site part avec moi.
- **Un registre de preuves** : chaque mission est documentée avec la même structure — l'enjeu, ce que j'ai mis en place, la transformation, la méthode. Les clients sont anonymisés ; les faits sont vérifiables. Aucun chiffre invérifiable n'y figure.
- **Un site lisible par les machines** : chaque page embarque ses microdonnées JSON-LD (`Person`, `Article`, `BreadcrumbList`), le HTML est intégralement pré-rendu, et un fichier `llms.txt` — généré au build depuis le contenu réel — donne aux agents IA un point d'entrée structuré vers tout le registre. Allez voir : [julientridat.com/llms.txt](/llms.txt).
- **La conversion préservée** : les offres, la méthode et la prise de rendez-vous de l'ancien site sont intégralement conservées. La preuve ne remplace pas la vente ; elle la fonde.

## La transformation

Avant, je louais ma vitrine à un outil qui la rendait muette pour les moteurs et illisible pour les agents. Après, je possède un actif qui m'appartient entièrement, qui coûte zéro euro par mois, et qui grandit à chaque mission close : le registre s'enrichit, le `llms.txt` et le sitemap se régénèrent, les agents et les moteurs voient la mise à jour au déploiement suivant.

J'ai gagné ce que je fais gagner à mes clients : **une capacité que je n'avais pas — être trouvable et vérifiable sur un canal que je contrôle, sans dépendre de personne.**

## La méthode

C'est la méthode que j'applique à mes clients, appliquée à moi-même : partir du besoin réel — être trouvable et vérifiable —, choisir l'architecture la plus simple qui tienne dans le temps, et faire de chaque livraison une preuve documentée. Je n'ai pas commandé un site : j'ai installé le moyen de le faire grandir seul, à chaque mission. Si vous lisez ceci, le système fonctionne.
