# TODO-site — ce qui attend Julien

Refonte de la copy de l'accueil (branche `claude/julientridat-copy-redesign-zsffxd`, 12/11/2026).
Règle : rien de ce qui suit n'est affiché tant que ce n'est pas renseigné et validé.
Les champs vides sont déjà prévus dans `src/pages/index.astro` : il suffit de les remplir.

## Accueil — champs prévus, non affichés

### Résultats mesurés (`cas`, section `#cas`)
Pour chaque cas : `mesure` (affiché « Mesuré sur [volume, période] ») et `temoignage`
(citation, nom, fonction, entreprise — autorisation écrite du client requise).
- [ ] Courtier en assurance BTP, Gironde — mesure
- [ ] Courtier en assurance BTP, Gironde — témoignage
- [ ] Carrossier, Grand Sud-Ouest — mesure
- [ ] Carrossier, Grand Sud-Ouest — témoignage
- [ ] Centre de formation — mesure
- [ ] Centre de formation — témoignage
- [ ] Le titre « Trois métiers, trois résultats mesurés » affirme une mesure : tant que
      les lignes « Mesuré sur… » sont vides, vérifier que chaque chiffre est bien documenté.

### FAQ
- [ ] « Faut-il changer nos outils ? » — réponse à confirmer. Masquée (`confirme: false`).
      La même affirmation figure encore sur `/integration-ia-bordeaux` (étape « L'intégration »
      et FAQ « Faut-il des compétences techniques ? ») : à confirmer ou retirer aussi là.

## Références (section `#references`)
- [ ] Vérifier l'autorisation d'afficher chaque nom, notamment pour les missions réalisées
      en sous-traitance : Dassault Systèmes, SNCF Fret, Lagardère Travel Retail, Le Nouveau
      Bélier, Maison des Vins et des Spiritueux. Affichés en texte (aucun logo sur le site).
      Si des logos sont ajoutés : autorisation de la marque en plus.
- [ ] /formation-ia : même vérification pour Fitness Park, Mouton Noir et Adaliance (ajoutés le 13/11/2026).

## Offres
- [ ] Mention d'un financement OPCO sur les offres d'intégration : uniquement après
      confirmation de la certification Qualiopi ou du passage par un organisme certifié.

## Vos données (section `#donnees`)
- [ ] Outils utilisés
- [ ] Hébergement des données
- [ ] Conformité RGPD

## Qui je suis
- [ ] Trancher entre 10 et 15 ans de conseil (indépendant depuis 2011). En attendant,
      aucune durée de conseil n'est affichée (accueil, `src/lib/site.ts`, `llms.txt`).

## Kit du diagnostic
- [ ] Le kit (« lancer vos 3 premiers processus, avec la règle d'usage qui les encadre »)
      reste à concevoir et à tester avant la mise en ligne, comme l'ancien kit.

## Phase suivante
- Pages par secteur abandonnées (14/11/2026) : la cible est le dirigeant de PME, pas un secteur.
