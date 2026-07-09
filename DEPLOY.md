# Mise en ligne — julientridat.com (Cloudflare Pages)

Site statique Astro. Hébergement Cloudflare Pages (gratuit). Domaine chez **IONOS**.
État de départ : `julientridat.com` → `185.158.133.1` (Lovable, à remplacer).

## Phase 1 — GitHub

1. Créer un repo sur github.com : **`julientridat-com`** (Privé), sans README ni .gitignore.
2. Depuis `julientridat-astro/` :
   ```bash
   git remote add origin git@github.com:julientridat/julientridat-com.git   # ou l'URL https
   git push -u origin main
   ```

## Phase 2 — Cloudflare Pages (build auto depuis GitHub)

3. dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → choisir le repo.
4. Réglages de build : preset **Astro** (ou commande `npm run build`, dossier de sortie `dist`).
5. **Save and Deploy** → une URL `*.pages.dev` est générée. Vérifier qu'elle affiche bien le site.
   → Désormais, chaque `git push` redéploie automatiquement.

## Phase 3 — Mettre le domaine sur Cloudflare ⚠️ SANS CASSER L'EMAIL

Le domaine porte la **messagerie IONOS**. Ces enregistrements DOIVENT être recréés dans
Cloudflare AVANT de basculer les nameservers, sinon les emails `@julientridat.com` tombent.

6. Cloudflare → **Add a site** → `julientridat.com` → plan **Free**. Cloudflare scanne l'existant.
7. **Vérifier / recréer dans Cloudflare DNS ces enregistrements** (à conserver tels quels) :

   | Type | Nom | Valeur | Note |
   |---|---|---|---|
   | MX | `@` | `mx00.ionos.fr` (prio 10) | messagerie |
   | MX | `@` | `mx01.ionos.fr` (prio 10) | messagerie |
   | TXT | `@` | `v=spf1 include:_spf-eu.ionos.com ~all` | SPF (anti-spam) |
   | TXT | `@` | `google-site-verification=QzrUNK4Lg9Xu-35TU90O8dBwsnhMMUiM_NK28KVRMvg` | Search Console |
   | CNAME | `_dmarc` | `dmarc.ionos.fr` | DMARC |

   ⚠️ Vérifier aussi la présence des **DKIM** IONOS (sélecteurs `s1._domainkey`, `s2._domainkey`
   ou `s42582890._domainkey` selon IONOS) — Cloudflare les importe en général, à confirmer.
   Ne PAS recréer l'ancien A `185.158.133.1` (c'est Lovable, on le remplace en Phase 4).

8. Cloudflare affiche **2 nameservers** (ex. `xxx.ns.cloudflare.com`). Chez **IONOS**
   (domaine → paramètres DNS/nameservers), remplacer les 4 NS `ui-dns` par ces 2 NS Cloudflare.
9. Attendre l'activation (souvent < 1 h, jusqu'à 24 h). Cloudflare envoie un mail quand c'est actif.

## Phase 4 — Brancher le domaine sur Pages

10. Cloudflare → Pages → le projet → **Custom domains** → ajouter `julientridat.com` **et**
    `www.julientridat.com`. Cloudflare crée le CNAME (aplati à l'apex) + le certificat HTTPS.
11. S'assurer qu'aucun A résiduel ne pointe vers `185.158.133.1` (Lovable).

## Phase 5 — Vérifier

- [ ] `https://julientridat.com` affiche le nouveau site, cadenas HTTPS OK.
- [ ] `www.julientridat.com` redirige vers l'apex (ou l'inverse, au choix).
- [ ] Envoyer/recevoir un email de test `@julientridat.com` — la messagerie tourne toujours.
- [ ] Google Search Console toujours vérifié (le TXT a été préservé) ; soumettre
      `https://julientridat.com/sitemap.xml`.
- [ ] Lovable peut être débranché/résilié.

## Alternative sans toucher aux nameservers (si tu veux garder le DNS chez IONOS)

Possible mais moins propre pour l'apex : créer chez IONOS un CNAME `www` → `<projet>.pages.dev`,
puis une redirection de l'apex vers `www`. Le canonical du site étant l'apive (`julientridat.com/`),
la bascule des nameservers vers Cloudflare (ci-dessus) reste la voie recommandée.

## Après mise en ligne — à compléter (non bloquant)

- URL LinkedIn exacte dans `sameAs` (`src/lib/site.ts`) pour le Knowledge Graph.
- Point de vigilance : cas « groupe travel retail » sous clause de confidentialité (déjà
  doublement anonymisé — validation par l'organisme prudente avant large diffusion).
