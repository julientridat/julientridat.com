/**
 * Les textes des pages modifiables depuis /admin (Sveltia CMS).
 *
 * Chaque page a son fichier dans src/contenu/, que le formulaire de /admin
 * réécrit et enregistre sur GitHub (branche main : en ligne une à deux
 * minutes plus tard). Les composants lisent ces fichiers ici, jamais
 * directement : la typographie française y est posée au passage (texte.ts).
 *
 * Ajouter un champ = l'ajouter au JSON, à public/admin/config.yml (même nom,
 * même place) et au composant qui l'affiche.
 */
import accueilJson from "@/contenu/accueil.json";
import { preparer } from "@/lib/texte";

/** Tel qu'enregistré, sans typographie : balisage JSON-LD et meta. */
export const accueilBrut = accueilJson;
export const accueil = preparer(accueilJson);
