# Design system « planning » — site julientridat.com

Charte du site vitrine depuis la refonte de novembre 2026 : accueil, `/formation-ia`,
`/integration-ia-bordeaux`, études de cas (`/realisations/<slug>`), `/mentions-legales`,
`/diagnostic-confirme`. Rédigé le 23/11/2026 à partir du code en ligne.

- **Source de vérité** : `src/styles/vitrine.css` (tokens et composants) et
  `src/layouts/VitrineLayout.astro` (squelette commun). Si ce document et le code
  divergent, le code gagne : corriger ce document.
- **Origine** : l'artefact Design System « Julien Tridat » (claude.ai).
- **Ne s'applique pas** aux enquêtes (`BaseLayout`), au tableau client (`/tableau`), ni
  aux livrables marque blanche (LEH, Maikers, Adaliance…), qui ont leurs propres chartes.
- **Remplace**, pour le site, `docs/design-system-pages-vente.md` (one-page « 60 jours »,
  juillet 2026 : fond papier, accent chartreuse, Geist).

---

## 1. Principes

1. **Un seul accent : le vert `#0A7350`.** Il est réservé à ce qui est tenu ou livré : la
   seconde phrase des titres (`<span class="v-vert">`), les statuts (« ✓ Paiement reçu »),
   les chiffres « après ». Jamais de deuxième couleur d'accent.
2. **Le surligneur jaune `#FFE45C`** ne sert qu'à une chose : la durée sur le bouton
   principal (`Réserver →` + `<span class="v-surligne">90 min</span>`).
3. **Angles droits partout.** Cadres de 2 px d'encre, filets de 1 px gris-bleu.
   Aucune ombre, aucun dégradé, aucun flou, aucun arrondi.
4. **Titres en capitales Barlow Condensed, texte en Public Sans.** Pas d'italique.
5. **Titre en deux temps** : une première phrase à l'encre, une seconde en vert.
   « Commençons **par 90 minutes.** »
6. **Typographie de Julien** : jamais une fin de phrase seule en début de ligne. Le script
   `Coupures.astro` (chargé par le layout) le gère partout, sauf dans les h1, calés à la main.
   Espaces insécables avant `€`, `h`, `min`, `%`, `?`, `:` (`&nbsp;` dans le HTML).

## 2. Couleurs

| Token | Valeur | Usage |
|---|---|---|
| `--v-encre` | `#101214` | Texte, cadres de 2 px, bandeaux, boutons, bloc sombre |
| `--v-vert` | `#0A7350` | L'accent unique (voir principe 1) |
| `--v-surligneur` | `#FFE45C` | La durée du bouton principal, rien d'autre |
| `--v-fond` | `#F5F7F9` | Fond de page |
| `--v-blanc` | `#FFFFFF` | Surfaces : cartes, hero, en-tête, pied |
| `--v-grille` | `#D5DCE4` | Filets de 1 px entre lignes et colonnes |
| `--v-gris` | `#555D68` | Libellés, petit texte, liens du pied de page |
| `--v-encre-sur-sombre` | `#C9CFD6` | Texte secondaire sur le bloc sombre |
| `--v-vert-sur-sombre` | `#7FD3AE` | Le vert sur fond d'encre (contraste suffisant) ; aussi le favicon |

Sur fond sombre (`.v-sombre`), `.v-vert` passe automatiquement en `#7FD3AE`.

## 3. Typographie

Polices chargées par le layout (Google Fonts) : Barlow Condensed 600/800, Public Sans 400/600/700.

| Classe | Police | Taille | Usage |
|---|---|---|---|
| `.v-h1` | Barlow Condensed 800, capitales | `clamp(44px, 6vw, 80px)`, interligne 0,9 | Un seul par page, dans le hero ou le bloc final |
| `.v-h2` | Barlow Condensed 800, capitales | `clamp(34px, 4vw, 44px)`, max 24 caractères de large | Titre de section |
| `.v-h3` | Barlow Condensed 800, capitales | 26 px | Titre de carte, nom d'offre |
| `.v-surtitre` | Barlow Condensed 800, capitales, interlettrage 0,08 em, encre | `clamp(20px, 2vw, 24px)` | Surtitre qui ouvre chaque grand thème (« Le constat », « Résultats »…) et le hero |
| `.v-label` | Barlow Condensed 600, capitales, interlettrage 0,12 em, gris | 14 px | Libellé dans une carte (« Avant », « En séance »), intitulé de `.v-dl` ; jamais pour ouvrir une section |
| `.v-chiffre` | Barlow Condensed 800, chiffres tabulaires | 30 px | Chiffres « avant / après », numéros d'étape |
| `.v-prix` | Barlow Condensed 800, chiffres tabulaires | 56 px | Le prix mis en avant |
| (corps) | Public Sans 400 | 17 px, interligne 1,55 | Texte courant |
| `.v-chapo` | Public Sans | 19 px, 56 caractères de large | Chapeau sous un titre |
| `.v-texte` | — | 65 caractères de large | Paragraphe long |
| `.v-petit` | Public Sans, gris | 14 px | Mentions, conditions, prix secondaires |
| `.v-fort` | 700 | — | Mise en gras dans le texte |
| `.v-vert` | — | — | Passage en vert (seconde phrase d'un titre) |
| `.v-statut` | Public Sans 700, capitales, vert | 12,5 px | « ✓ Paiement reçu », « ✓ Vous recevez » |

## 4. Mise en page

| Classe | Rôle |
|---|---|
| `.v-section` | Bloc de page : 1 200 px max, marges de 24 px, 64 px au-dessus, empilement de 22 px |
| `.v-section--premiere` | Première section (40 px au-dessus) |
| `.v-section--fin` | Dernière section (64 px en dessous) |
| `.v-conteneur` | Largeur 1 200 px sans espacement vertical (en-tête, pied) |
| `.v-grille` | Grille auto : colonnes de 280 px minimum, écart 16 px |
| `.v-grille--large` | Grille auto : colonnes de 320 px minimum, écart 40 px |
| `.v-pile` / `.v-pile--serree` | Empilement vertical, écart 22 px / 12 px |
| `.v-cols` | Colonnes séparées par un filet (passent en lignes sous 860 px) |

Les marges par défaut sont remises à zéro dans `.vitrine` (`p, h1, h2, h3, ul, ol, dl, dd`) :
l'espacement vient des piles et des grilles, pas des marges.

## 5. Composants

### Surfaces
- **`.v-carte`** : fond blanc, cadre d'encre de 2 px. Avec **`.v-carte--pad`** : 22 px de
  marge intérieure et empilement de 12 px.
- **`.v-hero`** : la carte d'ouverture de page (40 px de marge intérieure, 22 px sur téléphone).
- **`.v-bandeau`** : barre d'encre en tête de carte, texte blanc en capitales
  (ex. « Courtier en assurance BTP · Gironde »).
- **`.v-ligne`** : rangée avec filet de 1 px en dessous (sauf la dernière). Sert aux listes
  dans une carte, aux colonnes « Avant / Après », aux questions de FAQ (`<details class="v-ligne">`).
- **`.v-liste`** : liste dont chaque `li` est séparé par un filet.
- **`.v-sombre`** : bloc d'encre plein, texte blanc ; utilisé pour l'appel final de page.
- **`.v-emplacement`** : zone grise réservée à un média à venir.

### Boutons et liens
- **`.v-bouton`** : bouton d'encre, texte blanc en capitales 22 px, 44 px de haut minimum.
  Variante **`.v-bouton--petit`** (18 px) et **`.v-bouton--inverse`** (blanc sur le bloc sombre).
  Le bouton principal porte toujours la durée surlignée :
  ```html
  <button type="button" class="v-bouton" data-open-booking="diagnostic">
    Réserver le diagnostic →<span class="v-surligne">90&nbsp;min</span>
  </button>
  ```
- **`.v-lien-action`** : action secondaire en capitales soulignées
  (« Une question avant ? → », ouvre la demande de rappel via `data-open-rappel`).

### Données
- **`.v-tableau`** : tableau des offres ; en-tête d'encre, lignes séparées par un filet,
  `.v-droite` pour les prix. Le placer dans une `.v-carte` avec `overflow-x: auto`
  (640 px minimum).
- **`.v-dl`** : liste de définitions intitulé / valeur (mentions légales, carte d'identité
  d'un cas). Sous 480 px, l'intitulé passe au-dessus de la valeur.

### En-tête, pied, bio
- **En-tête** (`Entete.astro`) : nom, mention « Intégration IA · Bordeaux », menu, bouton
  `Réserver → 90 min` (ou `Être rappelé →` sur la page Formation, via `cta="rappel"`).
  Sous 860 px : en-tête compact, bouton à droite du nom, menu sur une ligne qui défile au doigt.
- **Pied** (`PiedDePage.astro`) : liens gris soulignés, filet d'encre de 2 px au-dessus.
- **`.v-bio`** : portrait en colonne de 280 px et texte à côté ; empilés sous 700 px.

### Fenêtres (réservation, contact, rappel)
Composants React stylés en Tailwind (`global.css`) ; ils prennent la charte par les
variables surchargées dans `vitrine.css` (`--lime` = vert, `--card` = blanc…). Angles
droits, cadre d'encre de 2 px, aucune ombre ni flou, imposés par `vitrine.css`.

**Piège connu** : la remise à zéro des marges de `.vitrine` écrase les classes Tailwind
`mt-*` dans ces fenêtres. Donner les marges en `style` directement sur l'élément.

## 6. Motifs de page

- **Hero** : `.v-section--premiere` > `.v-hero` > `.v-surtitre` (public · lieu), `.v-h1` en deux
  temps, `.v-chapo`, bouton principal, puis en `.v-petit` le prix et les conditions
  (« 390 € HT · satisfait ou remboursé · déduits du prix de l'intégration… »).
- **Section** : `.v-surtitre` (surtitre court) + `.v-h2` en deux temps + contenu en `.v-grille`.
  Le surtitre en `.v-label` (14 px gris) était illisible : remplacé le 23/11/2026.
- **Parcours en frise** (accueil, `#parcours`) : `ol.v-frise` > `li.v-frise__etape` (`id` =
  `diagnostic`, `integration`, `pilotage`) > `.v-frise__num` (carré d'encre numéroté, relié au
  suivant par un trait de 2 px) + `.v-frise__corps` (`.v-surtitre` « Étape 1 · 90 minutes »,
  titre, contenu complet de l'étape). `.v-frise__etape--option` : numéro au trait (étape en
  option). Chaque étape n'est décrite qu'une fois, dans sa frise : pas de résumé en cartes
  au-dessus (répétitif, retiré le 23/11/2026). Toute nouvelle offre s'insère dans cette frise.
- **Parcours de réservation** : le bouton du hero et celui de l'en-tête descendent à l'étape 1
  (`href="#diagnostic"`) ; l'agenda (`data-open-booking`) s'ouvre depuis l'encadré prix de
  l'étape 1 et depuis l'appel final. Le prix complet et ses conditions ne figurent que dans
  cet encadré.
- **Carte de cas** : `.v-carte` > `.v-bandeau` (métier · lieu) > `.v-cols` à deux colonnes
  « Avant » / « Après » (`.v-chiffre`, le second en `.v-vert`) > paragraphe.
- **Étapes numérotées** : `.v-carte--pad` avec `.v-chiffre` (le numéro) puis `.v-h3`.
- **FAQ** : une `.v-carte` contenant des `<details class="v-ligne">` ; `summary` en `.v-fort`.
- **Appel final** : `.v-section--fin` > `.v-sombre.v-grille.v-grille--large` : à gauche un
  `.v-h1` ou `.v-h2` en deux temps et un chapeau, à droite `.v-bouton--inverse` et le prix.

Modèles à copier pour une nouvelle page : `src/pages/integration-ia-bordeaux.astro`
(page de contenu) et `src/pages/realisations/[slug].astro` (gabarit alimenté par des données).

## 7. Responsive

Le site doit tenir de 320 px à 1 920 px sans défilement horizontal.
- **860 px** : en-tête compact ; `.v-cols` passe en lignes.
- **700 px** : la bio s'empile.
- **600 px** : hero et bloc sombre passent à 22 px de marge intérieure ; sections à 48 px.
- **480 px** : `.v-dl` empile intitulé et valeur.
- Mouvements réduits : `prefers-reduced-motion` coupe transitions et animations.

## 8. À ne pas faire

- Ajouter une couleur, un dégradé, une ombre, un arrondi, de l'italique.
- Utiliser le vert pour décorer : il signale ce qui est livré ou tenu.
- Mettre le surligneur jaune ailleurs que sur la durée du bouton principal.
- Écrire un titre en minuscules ou en Public Sans.
- Ouvrir une section avec `.v-label` (trop petit) au lieu de `.v-surtitre`.
- Poser une image ou une vidéo telle quelle sans qu'elle serve le propos (règle de Julien).
- Styler une page vitrine avec les classes de l'ancien site (`BaseLayout`, `text-lime`,
  `rounded-*`, `Eyebrow`…).

## 9. Nouvelle page : la liste de contrôle

1. `VitrineLayout` avec `title`, `description`, `canonical` absolu, JSON-LD utile.
2. Une seule `.v-h1`, titres en deux temps, un seul accent.
3. Le bouton principal ouvre le diagnostic (`data-open-booking="diagnostic"`).
4. Aucun chiffre invérifiable (règle du `CLAUDE.md`).
5. Ajouter la page au plan du site (`src/pages/sitemap.xml.ts`) et, si utile, à `llms.txt`.
6. `npm run build` sans erreur, puis vérifier à 320 px (aucun débordement).
