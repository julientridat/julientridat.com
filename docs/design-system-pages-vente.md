# Design system — Julien Tridat, one-pages de vente

Extrait du site « L'IA opérationnelle en 60 jours » (juillet 2026). Sert de référence pour toute nouvelle page one-page de vente sous la marque perso de Julien Tridat (consultant & formateur IA) — pas pour les livrables marque blanche client (Maikers, Adaliance, LEH…), qui ont leurs propres chartes.

**Fichiers réutilisables**, dans ce dossier :
- [`design-system.css`](design-system.css) — tokens + composants génériques, à importer tel quel dans une nouvelle page.
- [`design-system.js`](design-system.js) — nav au scroll + révélation au scroll, génériques.
- Le scrubber vidéo (`main.js`, section « Stage hero ») est un **pattern signature**, pas un module générique : voir §8, à adapter au cas par cas.

Pour démarrer une nouvelle page : copier `index.html` comme squelette, vider les sections de contenu, garder nav/footer/CTA, brancher `design-system.css` + `design-system.js`.

---

## 1. Principe directeur

Chaque décision visuelle doit être défendable — pas un choix de template, un choix qui sert le message. Deux règles non négociables (retour d'expérience direct de Julien) :

- **Jamais un asset intégré tel quel.** Une vidéo, une image fournie : on la transforme en mécanique qui sert la promesse (ex. la vidéo de transformation du bâtiment → scrubber J1→J60, parce que l'offre EST une transformation en 60 jours). Ne jamais se contenter de poser un `<video>` ou un `<img>`.
- **Un fond « papier », jamais un fond neutre par défaut.** Le blanc pur n'est utilisé que là où un asset détouré doit s'y fondre (ex. hero avec frames PNG/JPEG sur fond blanc). Le reste de la page vit sur un gris très clair chaleureux (`--paper`), pas sur `#FFFFFF`.

Ton éditorial : opérateur, pas évangéliste. Contre-promesse assumée (60 jours vs. 2 ans). Anti-argument traité frontalement, jamais évité. Voir §9 pour les conventions de copy.

---

## 2. Tokens

```css
:root {
  --paper: #F1F2F4;        /* fond de page par défaut */
  --white: #FBFBFC;        /* fond des cartes / nav / sections "alt" */
  --ink: #111216;          /* texte principal, fonds sombres */
  --ink-soft: #43464E;     /* corps de texte secondaire */
  --muted: #7A7E88;        /* légendes, labels, hints */
  --violet: #6C4CF1;       /* accent — CTA, liens, emphase */
  --violet-soft: #B9A6FF;  /* accent sur fond sombre */
  --line: rgba(17, 18, 22, 0.10); /* toutes les bordures fines */
  --radius: 22px;          /* rayon standard des cartes/blocs */
  --font-sans: "Geist", -apple-system, "Helvetica Neue", sans-serif;
  --font-serif: "Instrument Serif", Georgia, serif;
}
```

**Où l'accent violet apparaît** (et nulle part ailleurs — c'est ce qui lui garde sa force) : point pulsant du bandeau eyebrow, mot-clé en `<em class="serif">`, kicker de section, hover des boutons, puce des listes numérotées, timeline, prix, compteur de jours du hero. Jamais en fond de bloc plein (sauf glow radial très dilué du CTA final).

**Fonds sombres** : `--ink` en fond de section (`.section-dark`) réservé à **une seule section par page** — celle qui porte l'anti-argument ou le point le plus tranchant. Trop de sections sombres annule l'effet de rupture.

**Polices** (Google Fonts, à charger en `<head>`) :
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```
- **Geist** : toute la voix courante (titres droits, corps de texte, UI).
- **Instrument Serif italique** (`.serif`) : la voix incarnée — un mot ou une phrase par section maximum, jamais un paragraphe entier. C'est la ponctuation émotionnelle de la page, pas un style de titre alternatif.

---

## 3. Typographie

| Rôle | Classe / élément | Taille | Usage |
|---|---|---|---|
| Titre hero | `h1` (dans `.hero-text`) | `clamp(2.3rem, 3.6vw, 3.4rem)` | Un seul par page, dans le hero |
| Titre de section | `h2` | `clamp(1.9rem, 3.8vw, 3rem)` | Un par section, toujours précédé d'un `.kicker` |
| Sous-titre de bloc | `h3` | `1.25rem` / 600 | Cartes, colonnes, items de FAQ (dans `summary`) |
| Chapô | `.lead` | `clamp(1.1rem, 1.6vw, 1.25rem)`, `--ink-soft` | Un paragraphe par section, sous le `h2` |
| Label de section | `.kicker` | `0.8rem`, uppercase, `letter-spacing: 0.14em`, `--violet` | Format **« 01 — Nom de la section »**, numéroté en continu sur toute la page |
| Badge/eyebrow | `.eyebrow` | `0.85rem` | Pastille pilule en haut de hero, un point violet pulsant à gauche |
| Emphase incarnée | `em.serif` | 1.04–1.06em de l'élément parent | Voir règle ci-dessus |

Règles typographiques françaises à respecter systématiquement : `&nbsp;` avant `:`, `;`, `!`, `?`, `»` et avant les nombres qui ne doivent pas casser en fin de ligne (ex. `deux&nbsp;ans`, `18&nbsp;h`) ; guillemets français `« »` pour les citations et objections ; espaces fines dans les guillemets de citation (`«&nbsp;…&nbsp;»`).

---

## 4. Layout

- **Container** : `max-width: 1160px`, padding horizontal `24px`. Variante `.container.narrow` (`max-width: 880px`) pour les sections texte-seul (constat, opérateur, anti-argument, FAQ, CTA final) — jamais pour les sections à grille (cartes, prix, timeline).
- **Rythme vertical des sections** : `.section { padding: clamp(4.5rem, 9vw, 7.5rem) 0 }`. Alternance `.section` / `.section-alt` (fond `--white`) une section sur deux pour rythmer le scroll sans jamais utiliser de bordures internes lourdes.
- **Numérotation continue** : chaque section a un kicker `NN — Titre`, incrémenté sur toute la page (le hero et le footer ne comptent pas). Si on retire/ajoute une section, renuméroter toutes les suivantes.
- **Un CTA unique** dans tout le funnel : même libellé bouton du nav jusqu'au CTA final (ex. « Réserver un diagnostic »). Ne jamais varier le verbe d'action d'une occurrence à l'autre.

---

## 5. Composants

### 5.1 Nav
Fixe, transparente au repos, fond flouté (`backdrop-filter: blur(14px)`) + ligne basse dès que `scrollY > 24` (classe `.scrolled`, gérée par `design-system.js`). Wordmark à gauche (`Nom <span>rôle</span>`), le `<span>` disparaît sous 640px. CTA `.btn.btn-sm` à droite, localisation optionnelle masquée sous 900px.

### 5.2 Boutons
```html
<a class="btn" href="#contact">Réserver un diagnostic</a>
<a class="btn btn-sm" href="#contact">…</a>   <!-- nav -->
<a class="btn btn-lg" href="#contact">…</a>   <!-- CTA final -->
```
Fond `--ink`, hover → fond `--violet` + `translateY(-2px)` + ombre violette diffuse. Toujours accompagné d'un `.cta-hint` (`--muted`, `0.9rem`) qui désamorce l'objection immédiate (« 30 minutes, en visio. Pas de démo, pas de slides. »).

### 5.3 Kicker + titre de section
```html
<p class="kicker reveal">03 — Ce qu'on installe</p>
<h2 class="reveal">Trois chantiers. <em class="serif">Un système qui tourne.</em></h2>
<p class="lead reveal">…</p>
```

### 5.4 Liste à compteur (le constat / les frictions)
`.pain-list` : compteur CSS natif (`counter-reset`/`counter-increment`), affiché en serif violet (`0N`) devant chaque ligne. Une ligne = une douleur, phrase courte et affirmative, jamais de bullet point classique.

### 5.5 Stats (`dl.stats`)
Grille de 4 (2 sur mobile), chaque chiffre en `--font-serif` italique violet-neutre (`--ink`, pas violet — le violet est réservé aux kickers/emphases), légende `--muted` dessous. Pour des données chiffrées factuelles (années, nombre de clients, jours, etc.), pas pour des labels.

### 5.6 Références + témoignages
`.refs-names` : liste de logos-texte en petites capitales, séparée par une ligne fine au-dessus. `.quotes` : grille de 3 cartes `.quote` (fond `--paper`, coin `--radius`), citation + `figcaption` avec nom en gras + fonction. Jamais de photo de témoignage — que du texte, sobre.

### 5.7 Cartes numérotées (l'offre / les chantiers)
```html
<article class="card reveal">
  <span class="card-num serif">1</span>
  <h3>Titre</h3>
  <p>Description.</p>
</article>
```
Fond `--white`, bordure `--line`, hover = léger soulèvement + ombre portée froide (`rgba(24,20,60,…)`, jamais noire pure). Numéro en serif italique violet.

### 5.8 Bandeau pilules sombre (`.functions`)
Bloc plein `--ink` arrondi contenant une liste de tags en pilules outline blanches — pour lister des capacités/fonctions couvertes sans en faire des cartes (évite la sur-hiérarchisation quand le niveau d'info est plus bas que les cartes au-dessus).

### 5.9 Timeline (méthode / étapes)
`.timeline` : 3 colonnes, chacune bordée en haut d'un trait `--ink` de 2px avec un point violet en overlay au coin gauche (façon jalon). `.days` en serif violet annonce la plage, suivi d'un `h3` + `p`. Se termine toujours par un `.pull` (citation courte centrée, serif, qui résume l'engagement).

### 5.10 Section sombre + split (l'anti-argument)
`.section-dark` sur fond `--ink`, texte blanc/blanc-72%. `.split` : deux colonnes bordées (`rgba(255,255,255,.16)`), listes `−` (gris) vs `+` (violet clair) pour opposer explicitement « ce qu'on retire » / « ce qui reste ». Se termine par un `.pull.accent` (violet clair) qui tranche le débat en une phrase.

### 5.11 Prix
```html
<div class="price-audit reveal">
  <div class="pa-text"><h3>…</h3><p>… <strong>condition</strong>.</p></div>
  <p class="price serif">1 500 €</p>
</div>
<div class="price-grid">
  <article class="price-card reveal">
    <h3>NIVEAU</h3>
    <p class="price serif">X 000 €</p>
    <p class="pc-desc">…</p>
  </article>
  <!-- × N -->
</div>
```
Prix toujours en serif italique (jamais en sans-serif gras — ça les ferait ressembler à un prix barré/promo). Carte d'entrée (audit/diagnostic payant) en fond `--paper` pour la distinguer visuellement des offres principales (fond blanc). Note tarifaire (`.price-note`, HT, conditions) toujours en dessous de la grille, jamais en astérisque caché.

### 5.12 FAQ / objections
`<details>`/`<summary>` natifs — jamais de JS pour l'accordéon. Icône `+` en CSS pur (deux pseudo-éléments, rotation à l'ouverture). Chaque question est reformulée **comme l'objection réelle du prospect**, entre guillemets français, jamais neutralisée (« On a déjà testé ChatGPT. Ça n'a rien changé. » — pas « Efficacité des outils IA génériques »).

### 5.13 CTA final
`.section-cta` : fond `--paper` + glow radial violet très dilué ancré en bas (`radial-gradient(58% 90% at 50% 115%, rgba(108,76,241,.16), transparent 70%)`) — jamais de fond plein violet. Structure : promesse courte en h2 (reprise du titre hero, condensée) → lead → bouton `.btn-lg` → hint qui réaffirme la rareté/l'artisanat (« un opérateur, pas un cabinet »).

### 5.14 Footer
Une ligne, trois blocs (identité / localisation / email), fond `--white`, séparé par une bordure `--line`.

---

## 6. Motion

### 6.1 Révélation au scroll
Toute unité de contenu significative (titre, paragraphe, item de liste, carte…) porte la classe `.reveal` :
```css
.reveal { opacity: 0; transform: translateY(16px); transition: opacity .7s cubic-bezier(.2,.6,.2,1), transform .7s cubic-bezier(.2,.6,.2,1); }
.reveal.in { opacity: 1; transform: none; }
```
Un `IntersectionObserver` (seuil 0.12, `rootMargin: 0px 0px -40px 0px`) ajoute `.in` une fois puis se désabonne (`design-system.js`). **Exception obligatoire** : si la page est chargée sur une ancre (`location.hash`), tout `.reveal` doit démarrer déjà visible — sinon le contenu ciblé par le lien reste invisible à l'arrivée.

### 6.2 Hover
Boutons et cartes : jamais de changement de couleur seul — toujours combiné à un micro-déplacement (`translateY(-2px)` à `-4px`) et une ombre qui apparaît. Les liens de texte simple (footer) changent seulement de couleur vers `--violet`.

### 6.3 Point pulsant
`.eyebrow .dot` : `box-shadow` qui respire (`pulse`, 2.4s). Un seul par page, dans le hero.

### 6.4 Réduction de mouvement
`@media (prefers-reduced-motion: reduce)` : toutes les `.reveal` visibles sans transition, `scroll-behavior: auto`, pulsation coupée. Le pattern scrubber (§8) a sa propre branche `reduced` dans le JS.

---

## 7. Responsive

Deux points de rupture seulement :
- **900px** : grilles à 3/4 colonnes → 1 ou 2 colonnes (`.cards`, `.timeline`, `.stats`, `.quotes`, `.price-grid`) ; le hero passe de 2 colonnes à 1 (texte centré au-dessus, stage en dessous, `max-width: 640px` centré) ; localisation du nav masquée.
- **640px** : `body` repasse à `1rem` ; les `<br class="br-desktop">` disparaissent (gérer les retours à la ligne forcés desktop séparément du texte mobile qui doit pouvoir se casser librement) ; wordmark perd son sous-titre ; paddings internes resserrés.

Ne jamais ajouter de troisième breakpoint sans raison de contenu précise (un tableau, un graphique) — la fluidité vient des `clamp()` sur les tailles de police, pas de breakpoints supplémentaires.

---

## 8. Pattern signature — hero scrubber vidéo → frames

**À ne réutiliser que si la page a un asset vidéo/animation qui EST la démonstration du message** (ici : transformation = promesse des 60 jours). Sinon, hero texte + image fixe classique.

**Pipeline :**
1. Extraire N frames JPEG de la vidéo source (script Swift `AVAssetImageGenerator`, pas de ffmpeg sur la machine) — une frame par unité de la promesse (ici 60 frames = 60 jours).
2. Si le fond de la vidéo n'est pas un vrai blanc (dégradé studio gris) : détourer chaque frame (fit bilinéaire du fond + flood-fill par similarité + matte adouci) et composer sur blanc pur, pour fusionner avec `background:#FFFFFF` du hero. **Ne jamais recadrer/zoomer l'image** — le sujet doit rester visible en entier ; c'est le détourage qui fait le travail de fusion, pas le cadrage.
3. Canvas HTML (`<canvas>` en `aspect-ratio: 16/9`) redimensionné au DPR réel (max 2), qui dessine la frame courante en `drawImage(img, 0, 0, cw, ch)` — pas de `cover`/crop.
4. Chargement progressif par paliers de densité croissante (`[6, 2, 1]` frames sur N) pour afficher un résultat utilisable avant que les 60 images soient chargées.
5. Machine à états simple : `wait → intro → idle ⇄ pointer`. `intro` joue la transformation complète une fois à l'arrivée (easing quadratique in/out, ~4s) ; `idle` oscille en boucle lente (sinusoïde, ~23s/cycle) si la souris est absente depuis >3.5s ; `pointer` mappe directement `x` de la souris/du doigt à l'index de frame + un léger tilt 3D (`rotateX/rotateY` sur un wrapper en `perspective`).
6. Un compteur (« J42 ») et une piste de progression (`.scrub`) redonnent une légende explicite au geste — sans eux, le survol n'est qu'un gadget.
7. `prefers-reduced-motion: reduce` → branche séparée qui affiche uniquement la frame finale, statique, sans jamais démarrer la boucle `requestAnimationFrame`.

Le code de référence complet est dans `main.js` de ce projet (fonction du bloc « Stage hero »). À adapter : nombre de frames, chemin des assets, durée d'intro, texte du compteur/hint — ne pas copier-coller aveuglément si l'asset source n'a pas la même nature (proportions 16/9, fond détourable).

---

## 9. Conventions de copy

- Kicker = `NN — [Nom de la section, 2 à 4 mots]`, toujours en minuscules sauf initiale.
- Chaque section a un titre H2 qui peut se lire seul comme une affirmation (pas une question, pas un label).
- L'anti-argument de l'offre est traité dans **une section dédiée**, jamais glissé en sous-texte ailleurs — le prospect qui a l'objection en tête doit pouvoir la trouver frontalement listée.
- La FAQ reprend des formulations à la première personne du prospect, entre guillemets français — jamais reformulées en questions neutres de FAQ générique.
- Les CTA restent identiques mot pour mot du nav au footer. Le hint sous le bouton peut varier, pas le libellé du bouton.
- Prix : toujours HT explicite si le tarif l'est, condition d'offre (ex. audit offert si suite) en gras dans la description, jamais en astérisque.

---

## 10. Checklist démarrage d'une nouvelle page

1. Copier `index.html`, vider les sections de contenu (garder nav + footer + structure CTA).
2. Lier `design-system.css` puis les overrides spécifiques à la page dans un fichier séparé (`styles.css` de la page) — ne jamais dupliquer les tokens.
3. Lier `design-system.js` pour nav + reveal ; ajouter un script séparé uniquement si la page a un pattern signature (scrubber, calculateur, etc.).
4. Décider : la page a-t-elle un asset qui EST la démonstration du message (→ pattern §8 à adapter) ou un hero texte + image fixe suffit ?
5. Numéroter les kickers en continu, vérifier l'alternance `.section`/`.section-alt`, vérifier qu'il n'y a qu'une seule section sombre.
6. Vérifier : un CTA unique, un hint qui désamorce l'objection immédiate à chaque occurrence du bouton.
7. Tester `prefers-reduced-motion`, l'arrivée sur ancre (`#section`), et le rendu à 1440/1280/500px avant de livrer.
