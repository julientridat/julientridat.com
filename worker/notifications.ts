/**
 * Les notifications du tableau (Web Push) : sur le téléphone et l'ordinateur, même tableau fermé.
 *
 * Aucun service tiers : le Worker parle directement aux services de notification des
 * navigateurs (Google, Mozilla, Apple, Microsoft), selon les normes du web —
 * chiffrement de bout en bout du contenu (RFC 8291, aes128gcm) et identification du serveur
 * (VAPID, RFC 8292). La paire de clés VAPID est créée par l'objet du tableau au premier
 * besoin et reste dans son stockage : rien à poser chez Cloudflare.
 */

export interface Abonnement {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface Vapid {
  /** Clé publique, octets bruts en base64url : ce que le navigateur reçoit. */
  publique: string;
  privee: CryptoKey;
}

const encodeur = new TextEncoder();

export function versB64u(octets: ArrayBuffer | Uint8Array): string {
  const o = octets instanceof Uint8Array ? octets : new Uint8Array(octets);
  let s = "";
  for (const x of o) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function deB64u(t: string): Uint8Array {
  const b = t.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((t.length + 3) % 4);
  const s = atob(b);
  const o = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) o[i] = s.charCodeAt(i);
  return o;
}

function joindre(...parts: Uint8Array[]): Uint8Array {
  const o = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of parts) {
    o.set(p, i);
    i += p.length;
  }
  return o;
}

async function hkdf(sel: Uint8Array, cle: Uint8Array, info: Uint8Array, longueur: number): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", cle, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: sel, info }, k, longueur * 8));
}

/** Une nouvelle paire VAPID (ECDSA P-256) : la clé privée en JWK, pour la ranger. */
export async function genererVapid(): Promise<{ jwk: JsonWebKey; publique: string }> {
  const paire = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey("jwk", paire.privateKey)) as JsonWebKey;
  const publique = versB64u((await crypto.subtle.exportKey("raw", paire.publicKey)) as ArrayBuffer);
  return { jwk, publique };
}

export async function importerVapid(jwk: JsonWebKey, publique: string): Promise<Vapid> {
  const privee = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  return { publique, privee };
}

/* Les services de notification des navigateurs ; rien d'autre ne reçoit d'envoi. */
const SERVICES = /^(?:fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/;

/** Un abonnement envoyé par un navigateur, vérifié : adresse d'un vrai service, clés bien formées. */
export function lireAbonnement(v: unknown, test = false): Abonnement | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof o.endpoint !== "string" || o.endpoint.length > 1000 || !o.keys) return null;
  let u: URL;
  try {
    u = new URL(o.endpoint);
  } catch {
    return null;
  }
  const local = test && u.protocol === "http:" && (u.hostname === "127.0.0.1" || u.hostname === "localhost");
  if (!local && (u.protocol !== "https:" || !SERVICES.test(u.hostname))) return null;
  const { p256dh, auth } = o.keys;
  if (typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 50) return null;
  try {
    const cle = deB64u(p256dh), secret = deB64u(auth);
    if (cle.length !== 65 || cle[0] !== 4 || secret.length !== 16) return null;
  } catch {
    return null;
  }
  return { endpoint: o.endpoint, p256dh, auth };
}

/** Le contenu chiffré pour un navigateur (RFC 8291, aes128gcm, un seul enregistrement). */
export async function chiffrer(abo: Abonnement, texte: string): Promise<Uint8Array> {
  const cleNavigateur = deB64u(abo.p256dh);
  const secret = deB64u(abo.auth);
  const ephemere = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const publiqueServeur = new Uint8Array((await crypto.subtle.exportKey("raw", ephemere.publicKey)) as ArrayBuffer);
  const navigateur = await crypto.subtle.importKey("raw", cleNavigateur, { name: "ECDH", namedCurve: "P-256" }, false, []);
  // « public » est le nom de la norme (le moteur l'attend) ; les types de Cloudflare l'écrivent « $public ».
  const algo = { name: "ECDH", public: navigateur } as unknown as SubtleCryptoDeriveKeyAlgorithm;
  const partage = new Uint8Array(await crypto.subtle.deriveBits(algo, ephemere.privateKey, 256));
  const ikm = await hkdf(secret, partage, joindre(encodeur.encode("WebPush: info\0"), cleNavigateur, publiqueServeur), 32);
  const sel = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(sel, ikm, encodeur.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(sel, ikm, encodeur.encode("Content-Encoding: nonce\0"), 12);
  const cleContenu = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cleContenu, joindre(encodeur.encode(texte), new Uint8Array([2]))));
  const entete = new Uint8Array(21);
  entete.set(sel, 0);
  new DataView(entete.buffer).setUint32(16, 4096);
  entete[20] = publiqueServeur.length;
  return joindre(entete, publiqueServeur, chiffre);
}

/** L'en-tête VAPID : un jeton signé qui dit au service qui envoie. */
export async function enteteVapid(endpoint: string, vapid: Vapid, contact: string): Promise<string> {
  const tete = versB64u(encodeur.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const corps = versB64u(encodeur.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: contact })));
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, vapid.privee, encodeur.encode(`${tete}.${corps}`));
  return `vapid t=${tete}.${corps}.${versB64u(signature)}, k=${vapid.publique}`;
}

/** Envoie une notification ; renvoie le statut du service (201 : reçue ; 404/410 : abonnement mort). */
export async function envoyerPush(abo: Abonnement, charge: Record<string, unknown>, vapid: Vapid, contact: string): Promise<number> {
  const corps = await chiffrer(abo, JSON.stringify(charge).slice(0, 3000));
  const r = await fetch(abo.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(4 * 24 * 3600),
      Urgency: "normal",
      Authorization: await enteteVapid(abo.endpoint, vapid, contact),
    },
    body: corps,
  });
  return r.status;
}
