/**
 * Chargement minimal d'un fichier .env (zéro dépendance).
 * On évite dotenv : ce dossier doit rester autonome et auditable.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const DOSSIER = dirname(fileURLToPath(import.meta.url));
export const FICHIER_ENV = join(DOSSIER, "..", "..", ".env.linkedin");
export const FICHIER_TOKEN = join(DOSSIER, ".token.json");

export function chargerEnv() {
  if (!existsSync(FICHIER_ENV)) {
    throw new Error(
      `Fichier ${FICHIER_ENV} introuvable. Copie .env.linkedin.example en .env.linkedin et remplis-le.`,
    );
  }
  for (const ligne of readFileSync(FICHIER_ENV, "utf8").split("\n")) {
    const nette = ligne.trim();
    if (!nette || nette.startsWith("#")) continue;
    const separateur = nette.indexOf("=");
    if (separateur === -1) continue;
    const cle = nette.slice(0, separateur).trim();
    const valeur = nette.slice(separateur + 1).trim().replace(/^["']|["']$/g, "");
    if (!(cle in process.env)) process.env[cle] = valeur;
  }
}

export function exigerVariable(nom) {
  const valeur = process.env[nom];
  if (!valeur) throw new Error(`Variable ${nom} manquante dans .env.linkedin`);
  return valeur;
}

/** Version de l'API LinkedIn (format YYYYMM). Voir README si LinkedIn refuse la version. */
export function versionApi() {
  return process.env.LINKEDIN_API_VERSION || "202605";
}

export const REDIRECT_URI =
  process.env.LINKEDIN_REDIRECT_URI || "http://localhost:3000/callback";
