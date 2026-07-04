---
title: "Ce site — un registre de preuves construit pour les humains et les agents"
client: "Julien Tridat (ce site)"
secteur: "Infrastructure personnelle"
annee: 2026
role: "Conception, développement, contenu"
stack: ["Astro", "Cloudflare Pages", "React", "JSON-LD", "llms.txt"]
besoin: "rayonner"
pitch: "Un site statique souverain qui documente chaque mission en étude de cas vérifiable, structuré pour les moteurs, les agents IA et les humains."
resultats:
  - chiffre: "0 €"
    label: "coût d'infrastructure mensuel"
  - chiffre: "100 %"
    label: "HTML pré-rendu"
  - chiffre: "1"
    label: "llms.txt généré au build"
visuel:
  src: "/artefacts/plateforme.webp"
  alt: "La page d'accueil de julientridat.com — le site documenté par cette étude de cas"
published: true
sortOrder: 12
---

## Le contexte

Ce site est né d'un constat que je documente dans [la note fondatrice](/notes/du-declaratif-a-l-auditable) : les plateformes sociales récompensent la déclaration, pas la preuve. Un consultant qui affirme « j'intègre l'IA dans les PME » ressemble à mille autres. Celui qui documente comment il l'a fait, mission par mission, avec les résultats — ne ressemble plus à personne.

La version précédente de ce site était une page de vente construite sur un outil no-code : efficace pour convertir, mais propriétaire, fermée, et muette pour les machines. Ce que ce site critique, il l'était.

## Ce qui a été construit

Exactement ce que je vends — donc le site est lui-même une étude de cas :

- **Souveraineté** : site statique Astro, code versionné dans Git, hébergé sur Cloudflare Pages. Aucune plateforme propriétaire entre le contenu et ses lecteurs : coût d'infrastructure nul, contenu et code intégralement portables chez n'importe quel hébergeur statique.
- **Un registre d'artefacts** : chaque mission est documentée avec la même structure — contexte, ce qui a été construit, ce que ça a produit, ce qu'il faut en retenir. Les clients sont anonymisés ; les faits sont vérifiables. Aucun chiffre invérifiable n'y figure.
- **Lisible par les machines** : chaque page embarque ses microdonnées JSON-LD (`Person`, `Article`, `BreadcrumbList`), le HTML est intégralement pré-rendu, et un fichier `llms.txt` — généré au build depuis le contenu réel — donne aux agents IA un point d'entrée structuré vers tout le registre. Allez voir : [julientridat.com/llms.txt](/llms.txt).
- **La conversion préservée** : les offres, la méthode et la prise de rendez-vous de l'ancien site sont intégralement conservées. La preuve ne remplace pas la vente ; elle la fonde.

## Ce que ça a produit

Un actif qui m'appartient entièrement, qui coûte zéro euro par mois, et qui grandit à chaque mission close : le registre s'enrichit, le `llms.txt` et le sitemap se régénèrent, les agents et les moteurs voient la mise à jour au déploiement suivant.

## Ce qu'il faut en retenir

C'est la méthode que j'applique à mes clients, appliquée à moi-même : partir du besoin réel (être trouvable et vérifiable), choisir l'architecture la plus simple qui tienne dans le temps, et faire de chaque livraison une preuve documentée. Si vous lisez ceci, le système fonctionne.
