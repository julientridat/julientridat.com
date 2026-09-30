/**
 * Questions de la page d'accueil. Depuis le 30/09/2026, elles se modifient
 * dans /admin (src/contenu/accueil.json, bloc faq) : ce fichier ne fait que
 * les exposer, sans mise en forme, pour le balisage FAQPage de index.astro.
 * L'accordéon (Faq.astro) lit directement src/lib/contenu.ts.
 */
import { accueilBrut } from "@/lib/contenu";
import { brut } from "@/lib/texte";

export const FAQ_ACCUEIL = accueilBrut.faq.questions.map((item) => ({ q: brut(item.q), r: brut(item.r) }));
