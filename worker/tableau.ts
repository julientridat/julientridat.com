/**
 * Le tableau client — état partagé en temps réel.
 *
 * Un seul Durable Object (« atelier ») porte toutes les places : clients, cartes,
 * accès, journal. Chaque navigateur ouvert (Julien, Sébastien…) tient un WebSocket
 * sur cet objet ; après chaque geste, l'objet renvoie à chacun SA vue du tableau —
 * tout pour Julien, ses seules cartes pour un client. Le filtrage se fait ici, côté
 * serveur : un client ne reçoit jamais les cartes d'un autre.
 *
 * Accès par lien personnel : Julien entre avec le secret TABLEAU_ADMIN_KEY, chaque
 * personne côté client avec une clé générée à la création de la place (table acces).
 * Stockage SQLite du Durable Object : disponible sur le plan gratuit de Workers.
 *
 * Hibernation : les sockets inactives ne coûtent rien, l'objet se réveille au
 * premier message. Le « ping » du navigateur reçoit « pong » sans le réveiller.
 *
 * La discussion passe à part : chaque message part seul vers les sockets concernées,
 * sans renvoyer tout le tableau ; l'historique arrive à la connexion. Une place a un fil
 * général et un fil par chantier (« projet »).
 *
 * Schéma versionné (table schema_version) : chaque évolution s'applique une fois, sur
 * l'objet en ligne comme sur un objet neuf.
 */
import { DurableObject } from "cloudflare:workers";

export interface EnvTableau {
  TABLEAU?: DurableObjectNamespace<Tableau>;
  /** Clé de Julien — secret Cloudflare, jamais dans le dépôt. */
  TABLEAU_ADMIN_KEY?: string;
  /** Automatisations (n8n, Make…) : chaque événement y est posté en JSON. */
  TABLEAU_WEBHOOK_URL?: string;
  TABLEAU_WEBHOOK_SECRET?: string;
}

type Role = "julien" | "client";
type Col = "demandes" | "prevu" | "encours" | "vous" | "fait" | "mensuel";
type Action = "valider" | "repondre" | "arbitrer";

interface Session {
  role: Role;
  nom: string;
  client: string | null;
  cle?: string;
  /** « claude » quand le geste vient du connecteur (worker/mcp.ts) : il figure au journal. */
  via?: string;
}

/** Ce que le connecteur lit : tout sauf les clés d'accès des clients. */
export interface EtatMcp {
  clients: Client[];
  cartes: Carte[];
  personnes: Array<{ client: string; nom: string; vuLe: number | null }>;
  enLigne: Array<{ role: Role; nom: string; client: string | null }>;
  messages: Message[];
  lectures: Array<{ client: string; fil: string; qui: string; ts: number }>;
}

interface Commentaire {
  qui: string;
  role: Role;
  txt: string;
  ts: number;
}

interface Carte {
  id: string;
  client: string;
  col: Col;
  ordre: number;
  t: string;
  desc: string;
  ch: string | null;
  echeance: string;
  /** Date précise (AAAA-MM-JJ), à côté du libellé libre `echeance` : elle range « Ma semaine ». */
  date?: string;
  livrable: boolean;
  lien: string;
  type: string;
  /** Sous-tâches : nom, responsable (« Julien », une personne de la place, ou personne), date. */
  st: SousTache[];
  /** Anciennes étapes (avant les sous-tâches) : converties à la lecture, jamais réécrites. */
  jalons?: string[];
  jok?: boolean[];
  action: Action | null;
  a: string;
  b: string;
  statut: string;
  note: string;
  nouveau: Role | null;
  chezClientDepuis: number | null;
  faitLe: number | null;
  com: Commentaire[];
  creeLe: number;
  majLe: number;
}

interface SousTache {
  id: string;
  t: string;
  ok: boolean;
  qui: string;
  /** AAAA-MM-JJ, ou vide. */
  date: string;
}

// Un type (et non une interface) : les lignes SQL typées exigent une signature indexable.
type Message = {
  id: number;
  client: string;
  /** "" pour le fil général, sinon l'id du chantier. */
  fil: string;
  ts: number;
  role: Role;
  qui: string;
  txt: string;
};

interface DateCle {
  id: string;
  t: string;
  date: string;
}

/** Un chantier est un projet : il a son sous-tableau, son objectif, ses dates clés, son fil. */
interface Chantier {
  id: string;
  nom: string;
  couleur: string;
  objectif?: string;
  dates?: DateCle[];
}

interface Client {
  id: string;
  nom: string;
  contact: string;
  debut: string;
  fin: string;
  mensuel: string;
  chantiers: Chantier[];
  archive: boolean;
  creeLe: number;
}

const COLS: Col[] = ["demandes", "prevu", "encours", "vous", "fait", "mensuel"];
const COULEURS = ["c1", "c2", "c3", "c4", "c5", "c6"];
const MAX_CARTES = 3000;
const MAX_MESSAGE = 64_000;
const MAX_EVENEMENTS = 5000;
const MAX_TEXTE_MESSAGE = 4000;
/** Messages envoyés à la connexion, par place ; les plus anciens se chargent à la demande. */
const MESSAGES_PAR_PAGE = 200;
const MAX_MESSAGES_PLACE = 20_000;

/** Les cartes de process de l'assistant : le client voit le vrai déroulé avant d'envoyer. */
const PROCESS: Array<{ type: string; test: RegExp; jalons: string[] }> = [
  { type: "formation", test: /formation|former|atelier|session/i, jalons: ["Programme proposé — sous 48 h", "Votre validation, et le choix de la date", "Session animée + support remis"] },
  { type: "site", test: /site|page|landing|refonte|vitrine|e-?commerce/i, jalons: ["Maquette — sous 48 h", "Votre validation — un aller-retour", "V1 en ligne — sous 72 h après validation"] },
  { type: "contenu", test: /mail|s[ée]quence|article|blog|post|linkedin|newsletter|contenu|campagne|visuel/i, jalons: ["Angle et plan — sous 24 h", "Votre validation", "Version complète — sous 48 h"] },
  { type: "outil", test: /outil|crm|automatis|install|\bia\b|assistant|logiciel|brevo/i, jalons: ["Cadrage — trois questions", "Installation sur vos comptes", "Démonstration à l’équipe — 30 min"] },
];
const HORS_CADRE = { type: "à cadrer", jalons: ["Découpage proposé — sous 24 h", "Votre validation", "Premier livrable — sous 48 à 72 h"] };

class Refus extends Error {}

function texte(v: unknown, max: number, obligatoire = false): string {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  if (obligatoire && !s) throw new Refus("Champ vide.");
  return s;
}

function lienSur(v: unknown): string {
  const s = texte(v, 500);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

const idCourt = () => crypto.randomUUID().slice(0, 8);
/** Un titre comparable : sans accents, apostrophes unifiées, espaces réduits, minuscules. */
const norme = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Une carte d'avant les sous-tâches : ses étapes deviennent des sous-tâches sans responsable. */
function normaliser(c: Carte): Carte {
  if (!Array.isArray(c.st)) c.st = (c.jalons ?? []).map((t, i) => ({ id: "e" + i, t, ok: c.jok?.[i] === true, qui: "", date: "" }));
  delete c.jalons;
  delete c.jok;
  if (typeof c.date !== "string") c.date = "";
  return c;
}

function nouvelleCle(): string {
  const octets = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** L'empreinte de la clé de Julien : portée par les accès accordés à Claude, elle les fait
 *  tomber dès que la clé change. */
export async function empreinteCle(cle: string | undefined): Promise<string> {
  if (!cle) return "";
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(cle)));
  return [...h.slice(0, 8)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function egal(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}

export type { Carte, Client, Message, SousTache };

export class Tableau extends DurableObject<EnvTableau> {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: EnvTableau) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, data TEXT NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS cartes (id TEXT PRIMARY KEY, client TEXT NOT NULL, data TEXT NOT NULL)");
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS acces (cle TEXT PRIMARY KEY, client TEXT NOT NULL, nom TEXT NOT NULL, cree_le INTEGER NOT NULL, vu_le INTEGER)",
    );
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS evenements (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, qui TEXT NOT NULL, client TEXT, type TEXT NOT NULL, carte TEXT, detail TEXT)",
    );
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, client TEXT NOT NULL, ts INTEGER NOT NULL, role TEXT NOT NULL, qui TEXT NOT NULL, txt TEXT NOT NULL)",
    );
    this.sql.exec("CREATE INDEX IF NOT EXISTS messages_client ON messages (client, id)");
    this.migrer();
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  private migrer(): void {
    this.sql.exec("CREATE TABLE IF NOT EXISTS schema_version (v INTEGER NOT NULL)");
    const v = this.sql.exec<{ v: number }>("SELECT COALESCE(MAX(v), 0) AS v FROM schema_version").one().v;
    if (v < 2) {
      // v2 — un fil de discussion par projet ; la lecture se suit par place, fil et personne
      // (« j » pour Julien, « c:Prénom » côté client). Les lectures d'avant vont au fil général.
      this.sql.exec("ALTER TABLE messages ADD COLUMN fil TEXT NOT NULL DEFAULT ''");
      this.sql.exec(
        "CREATE TABLE IF NOT EXISTS lectures (client TEXT NOT NULL, fil TEXT NOT NULL, qui TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (client, fil, qui))",
      );
      this.sql.exec("CREATE TABLE IF NOT EXISTS lus (client TEXT NOT NULL, qui TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (client, qui))");
      this.sql.exec("INSERT OR IGNORE INTO lectures (client, fil, qui, ts) SELECT client, '', qui, ts FROM lus");
      this.sql.exec("DROP TABLE lus");
      this.sql.exec("INSERT INTO schema_version (v) VALUES (2)");
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket attendu.", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [navigateur, serveur] = Object.values(pair);
    this.ctx.acceptWebSocket(serveur);
    return new Response(null, { status: 101, webSocket: navigateur });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string" || message.length > MAX_MESSAGE) return this.erreur(ws, "Message refusé.");
    let msg: { type?: string; cle?: unknown; op?: Record<string, unknown> };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    if (msg.type === "bonjour") return this.bonjour(ws, msg.cle);

    const session = ws.deserializeAttachment() as Session | null;
    if (!session) return this.erreur(ws, "Session inconnue — rechargez la page.", "cle");
    if (msg.type !== "op" || !msg.op || typeof msg.op !== "object") return;

    try {
      if (typeof msg.op.type === "string" && msg.op.type.startsWith("chat.")) return this.discussion(ws, session, msg.op);
      const reponse = this.appliquer(session, msg.op);
      if (reponse) ws.send(JSON.stringify(reponse));
      this.diffuser();
    } catch (e) {
      if (e instanceof Refus) return this.erreur(ws, e.message);
      console.error("tableau :", e instanceof Error ? e.message : e);
      this.erreur(ws, "Le geste n’a pas été enregistré — réessayez.");
    }
  }

  async webSocketClose(ws: WebSocket, code: number, raison: string): Promise<void> {
    try {
      ws.close(code === 1005 ? 1000 : code, raison);
    } catch {
      /* déjà fermée */
    }
    this.diffuser(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.diffuser(ws);
  }

  /* ————— Accès ————— */

  private async bonjour(ws: WebSocket, cle: unknown): Promise<void> {
    let session: Session | null = null;
    if (typeof cle === "string" && cle.length >= 16 && cle.length <= 200) {
      const admin = this.env.TABLEAU_ADMIN_KEY;
      if (admin && admin.length >= 16 && (await egal(cle, admin))) {
        session = { role: "julien", nom: "Julien", client: null };
      } else {
        const ligne = this.sql.exec<{ client: string; nom: string }>("SELECT client, nom FROM acces WHERE cle = ?", cle).toArray()[0];
        if (ligne && this.client(ligne.client)) {
          session = { role: "client", nom: ligne.nom, client: ligne.client, cle };
          this.sql.exec("UPDATE acces SET vu_le = ? WHERE cle = ?", Date.now(), cle);
        }
      }
    }
    if (!session) {
      ws.send(JSON.stringify({ type: "erreur", code: "cle", message: "Ce lien n’ouvre pas de tableau — il a peut-être été renouvelé. Demandez le vôtre à Julien." }));
      ws.close(4001, "cle");
      return;
    }
    ws.serializeAttachment(session);
    ws.send(JSON.stringify({ type: "session", me: { role: session.role, nom: session.nom, client: session.client } }));
    this.diffuser();
    this.envoyerDiscussion(ws, session);
  }

  /* ————— Diffusion : à chacun sa vue ————— */

  private diffuser(sauf?: WebSocket): void {
    const sockets = this.ctx.getWebSockets().filter((s) => s !== sauf && s.readyState === WebSocket.OPEN);
    const sessions = sockets
      .map((s) => ({ s, session: s.deserializeAttachment() as Session | null }))
      .filter((x): x is { s: WebSocket; session: Session } => !!x.session);
    const enLigne = sessions.map(({ session }) => ({ role: session.role, nom: session.nom, client: session.client }));
    const clients = this.clients();
    const cartes = this.cartes();
    const cache = new Map<string, string>();

    for (const { s, session } of sessions) {
      const cleVue = session.role === "julien" ? "*" : (session.client ?? "");
      let charge = cache.get(cleVue);
      if (!charge) {
        charge =
          session.role === "julien"
            ? JSON.stringify({ type: "etat", clients, cartes, acces: this.acces(), enLigne })
            : JSON.stringify({
                type: "etat",
                clients: clients.filter((c) => c.id === session.client),
                cartes: cartes.filter((c) => c.client === session.client),
                enLigne: enLigne.filter((p) => p.role === "julien" || p.client === session.client),
              });
        cache.set(cleVue, charge);
      }
      try {
        s.send(charge);
      } catch {
        /* socket en cours de fermeture */
      }
    }
  }

  private erreur(ws: WebSocket, message: string, code = "refus"): void {
    try {
      ws.send(JSON.stringify({ type: "erreur", code, message }));
    } catch {
      /* rien */
    }
  }

  /* ————— La discussion ————— */

  /** Les sockets qui voient une place : Julien, et les personnes de cette place. */
  private audience(client: string, sauf?: WebSocket): WebSocket[] {
    return this.ctx.getWebSockets().filter((s) => {
      if (s === sauf || s.readyState !== WebSocket.OPEN) return false;
      const sess = s.deserializeAttachment() as Session | null;
      return !!sess && (sess.role === "julien" || sess.client === client);
    });
  }

  private envoyerA(sockets: WebSocket[], charge: Record<string, unknown>): void {
    const texteCharge = JSON.stringify(charge);
    for (const s of sockets) {
      try {
        s.send(texteCharge);
      } catch {
        /* socket en cours de fermeture */
      }
    }
  }

  /** Les derniers messages d'une place, tous fils confondus ; ou, pour l'historique, ceux d'un fil. */
  private messages(client: string, fil?: string, avant?: number): Message[] {
    const lignes =
      fil !== undefined && avant
        ? this.sql.exec<Message>(
            "SELECT id, client, fil, ts, role, qui, txt FROM messages WHERE client = ? AND fil = ? AND id < ? ORDER BY id DESC LIMIT ?",
            client,
            fil,
            avant,
            MESSAGES_PAR_PAGE,
          )
        : this.sql.exec<Message>("SELECT id, client, fil, ts, role, qui, txt FROM messages WHERE client = ? ORDER BY id DESC LIMIT ?", client, MESSAGES_PAR_PAGE);
    return lignes.toArray().reverse();
  }

  /** À la connexion : les derniers messages de chaque place visible, et où chacun en est de sa lecture. */
  private envoyerDiscussion(ws: WebSocket, session: Session): void {
    const places = session.role === "julien" ? this.clients().map((c) => c.id) : [session.client as string];
    const lus = this.sql
      .exec<{ client: string; fil: string; qui: string; ts: number }>("SELECT client, fil, qui, ts FROM lectures")
      .toArray()
      .filter((l) => places.includes(l.client));
    try {
      ws.send(JSON.stringify({ type: "discussion", messages: places.flatMap((id) => this.messages(id)), lus }));
    } catch {
      /* socket en cours de fermeture */
    }
  }

  /** Un message dans un fil : stocké, diffusé aux sockets de la place, journalisé. */
  private ecrireMessage(session: Session, cl: Client, fil: string, txt: string, tmp = ""): Message {
    const ts = Date.now();
    const qui = session.role === "julien" ? "Julien" : session.nom;
    this.sql.exec("INSERT INTO messages (client, fil, ts, role, qui, txt) VALUES (?, ?, ?, ?, ?, ?)", cl.id, fil, ts, session.role, qui, txt);
    const id = this.sql.exec<{ id: number }>("SELECT last_insert_rowid() AS id").one().id;
    this.sql.exec(
      "DELETE FROM messages WHERE client = ? AND id <= (SELECT id FROM messages WHERE client = ? ORDER BY id DESC LIMIT 1 OFFSET ?)",
      cl.id,
      cl.id,
      MAX_MESSAGES_PLACE,
    );
    this.marquerLu(cl.id, fil, session.role === "julien" ? "j" : "c:" + session.nom, ts);
    const m: Message = { id, client: cl.id, fil, ts, role: session.role, qui, txt };
    this.envoyerA(this.audience(cl.id), { type: "message", m, tmp });
    this.journal(session, "message", cl.id, null, { txt, fil, projet: cl.chantiers.find((x) => x.id === fil)?.nom ?? "" });
    return m;
  }

  /* ————— Le connecteur Claude (worker/mcp.ts) : appels RPC, au nom de Julien ————— */

  private sessionClaude(): Session {
    return { role: "julien", nom: "Julien", client: null, via: "claude" };
  }

  /** Tout le tableau, pour les lectures du connecteur — sans les clés d'accès. */
  async mcpEtat(): Promise<EtatMcp> {
    const places = this.clients().map((c) => c.id);
    return {
      clients: this.clients(),
      cartes: this.cartes(),
      personnes: this.acces().map((a) => ({ client: a.client, nom: a.nom, vuLe: a.vuLe })),
      enLigne: this.ctx
        .getWebSockets()
        .map((s) => s.deserializeAttachment() as Session | null)
        .filter((x): x is Session => !!x)
        .map((x) => ({ role: x.role, nom: x.nom, client: x.client })),
      messages: places.flatMap((id) => this.messages(id)),
      lectures: this.sql.exec<{ client: string; fil: string; qui: string; ts: number }>("SELECT client, fil, qui, ts FROM lectures").toArray(),
    };
  }

  /** Un geste de Julien, fait par Claude : mêmes règles que depuis le tableau, puis diffusion. */
  async mcpGeste(op: Record<string, unknown>): Promise<{ ok: true; reponse: Record<string, unknown> | null } | { ok: false; erreur: string }> {
    try {
      const reponse = this.appliquer(this.sessionClaude(), op);
      this.diffuser();
      return { ok: true, reponse };
    } catch (e) {
      if (e instanceof Refus) return { ok: false, erreur: e.message };
      console.error("tableau (connecteur) :", e instanceof Error ? e.message : e);
      return { ok: false, erreur: "Le geste n’a pas été enregistré." };
    }
  }

  /** Un message de Julien dans la discussion d'une place, envoyé par Claude. */
  async mcpMessage(client: string, fil: string, txt: string): Promise<{ ok: true; message: Message } | { ok: false; erreur: string }> {
    const cl = this.client(client);
    if (!cl) return { ok: false, erreur: "Place inconnue." };
    if (fil && !cl.chantiers.some((x) => x.id === fil)) return { ok: false, erreur: "Ce projet n’existe pas dans cette place." };
    const t = typeof txt === "string" ? txt.trim().slice(0, MAX_TEXTE_MESSAGE) : "";
    if (!t) return { ok: false, erreur: "Message vide." };
    return { ok: true, message: this.ecrireMessage(this.sessionClaude(), cl, fil, t) };
  }

  private marquerLu(client: string, fil: string, qui: string, ts: number): boolean {
    const avant = this.sql.exec<{ ts: number }>("SELECT ts FROM lectures WHERE client = ? AND fil = ? AND qui = ?", client, fil, qui).toArray()[0];
    if (avant && avant.ts >= ts) return false;
    this.sql.exec("INSERT OR REPLACE INTO lectures (client, fil, qui, ts) VALUES (?, ?, ?, ?)", client, fil, qui, ts);
    return true;
  }

  private discussion(ws: WebSocket, session: Session, op: Record<string, unknown>): void {
    const julien = session.role === "julien";
    const client = julien ? texte(op.client, 80, true) : (session.client as string);
    const cl = this.client(client);
    if (!cl) throw new Refus("Place inconnue.");
    const fil = texte(op.fil, 20);
    if (fil && !cl.chantiers.some((x) => x.id === fil)) throw new Refus("Ce fil n’existe plus.");
    const moi = julien ? "j" : "c:" + session.nom;
    switch (op.type) {
      case "chat.envoyer": {
        if (!julien) this.placeActive(client);
        this.ecrireMessage(session, cl, fil, texte(op.txt, MAX_TEXTE_MESSAGE, true), texte(op.tmp, 40));
        return;
      }
      case "chat.lu": {
        const ts = Math.min(Date.now(), Number(op.ts) || 0);
        if (ts > 0 && this.marquerLu(client, fil, moi, ts)) this.envoyerA(this.audience(client), { type: "lu", client, fil, qui: moi, ts });
        return;
      }
      case "chat.frappe": {
        // « … écrit » : relayé, jamais stocké.
        this.envoyerA(this.audience(client, ws), { type: "frappe", client, fil, qui: moi, nom: julien ? "Julien" : session.nom });
        return;
      }
      case "chat.historique": {
        const avant = Number(op.avant);
        if (!Number.isFinite(avant) || avant <= 0) return;
        ws.send(JSON.stringify({ type: "historique", client, fil, messages: this.messages(client, fil, avant) }));
        return;
      }
      default:
        throw new Refus("Geste inconnu.");
    }
  }

  /* ————— Lecture / écriture ————— */

  private clients(): Client[] {
    return this.sql
      .exec<{ data: string }>("SELECT data FROM clients")
      .toArray()
      .map((r) => JSON.parse(r.data) as Client)
      .sort((a, b) => a.creeLe - b.creeLe);
  }
  private client(id: string): Client | null {
    const r = this.sql.exec<{ data: string }>("SELECT data FROM clients WHERE id = ?", id).toArray()[0];
    return r ? (JSON.parse(r.data) as Client) : null;
  }
  private ecrireClient(c: Client): void {
    this.sql.exec("INSERT OR REPLACE INTO clients (id, data) VALUES (?, ?)", c.id, JSON.stringify(c));
  }
  private cartes(): Carte[] {
    return this.sql
      .exec<{ data: string }>("SELECT data FROM cartes")
      .toArray()
      .map((r) => normaliser(JSON.parse(r.data) as Carte));
  }
  private carte(id: unknown): Carte {
    const r = typeof id === "string" ? this.sql.exec<{ data: string }>("SELECT data FROM cartes WHERE id = ?", id).toArray()[0] : undefined;
    if (!r) throw new Refus("Cette carte n’existe plus.");
    return normaliser(JSON.parse(r.data) as Carte);
  }
  private ecrireCarte(c: Carte): void {
    c.majLe = Date.now();
    this.sql.exec("INSERT OR REPLACE INTO cartes (id, client, data) VALUES (?, ?, ?)", c.id, c.client, JSON.stringify(c));
  }
  private acces(): Array<{ cle: string; client: string; nom: string; creeLe: number; vuLe: number | null }> {
    return this.sql
      .exec<{ cle: string; client: string; nom: string; cree_le: number; vu_le: number | null }>("SELECT * FROM acces ORDER BY cree_le")
      .toArray()
      .map((r) => ({ cle: r.cle, client: r.client, nom: r.nom, creeLe: r.cree_le, vuLe: r.vu_le }));
  }
  private creerAcces(client: string, nom: string): string {
    const cle = nouvelleCle();
    this.sql.exec("INSERT INTO acces (cle, client, nom, cree_le) VALUES (?, ?, ?, ?)", cle, client, nom, Date.now());
    return cle;
  }

  /** Qui peut porter une sous-tâche : Julien, le contact, et chaque personne qui a un lien. */
  private personnes(cl: Client): string[] {
    const noms = new Set<string>(["Julien"]);
    if (cl.contact) noms.add(cl.contact);
    for (const a of this.acces()) if (a.client === cl.id) noms.add(a.nom);
    return [...noms];
  }

  private sousTaches(v: unknown, cl: Client): SousTache[] {
    const personnes = this.personnes(cl);
    return (Array.isArray(v) ? v : [])
      .slice(0, 30)
      .map((x) => {
        const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
        const qui = texte(o.qui, 60);
        const date = texte(o.date, 10);
        return {
          id: texte(o.id, 20) || idCourt(),
          t: texte(o.t, 200),
          ok: o.ok === true,
          qui: personnes.includes(qui) ? qui : "",
          date: DATE_ISO.test(date) ? date : "",
        };
      })
      .filter((x) => x.t);
  }

  private ordreFin(client: string, col: Col): number {
    const max = this.cartes()
      .filter((c) => c.client === client && c.col === col)
      .reduce((m, c) => Math.max(m, c.ordre), 0);
    return Math.max(max + 1, Date.now());
  }

  private nouvelleCarte(client: string, col: Col, champs: Partial<Carte>): Carte {
    if (this.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM cartes").one().n >= MAX_CARTES) throw new Refus("Le tableau est plein.");
    const maintenant = Date.now();
    return {
      id: crypto.randomUUID(),
      client,
      col,
      ordre: this.ordreFin(client, col),
      t: "",
      desc: "",
      ch: null,
      echeance: "",
      date: "",
      livrable: false,
      lien: "",
      type: "",
      st: [],
      action: null,
      a: "",
      b: "",
      statut: "",
      note: "",
      nouveau: null,
      chezClientDepuis: col === "vous" ? maintenant : null,
      faitLe: col === "fait" ? maintenant : null,
      com: [],
      creeLe: maintenant,
      majLe: maintenant,
      ...champs,
    };
  }

  /** Journal : matière du point de lundi et des automatisations. */
  private journal(session: Session, type: string, client: string | null, carte: Carte | null, detail: Record<string, unknown> = {}): void {
    const ts = Date.now();
    const qui = session.role === "julien" ? "Julien" : session.nom;
    if (session.via) detail = { ...detail, via: session.via };
    this.sql.exec(
      "INSERT INTO evenements (ts, qui, client, type, carte, detail) VALUES (?, ?, ?, ?, ?, ?)",
      ts,
      qui,
      client,
      type,
      carte?.id ?? null,
      JSON.stringify(detail),
    );
    this.sql.exec("DELETE FROM evenements WHERE id <= (SELECT MAX(id) FROM evenements) - ?", MAX_EVENEMENTS);

    const url = this.env.TABLEAU_WEBHOOK_URL;
    if (url) {
      const corps = JSON.stringify({ ts, qui, role: session.role, type, client, carte, detail });
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.env.TABLEAU_WEBHOOK_SECRET) headers["X-Tableau-Secret"] = this.env.TABLEAU_WEBHOOK_SECRET;
      this.ctx.waitUntil(fetch(url, { method: "POST", headers, body: corps }).catch(() => undefined));
    }
  }

  /* ————— Les gestes ————— */

  private appliquer(session: Session, op: Record<string, unknown>): Record<string, unknown> | null {
    const julien = session.role === "julien";
    const exigerJulien = () => {
      if (!julien) throw new Refus("Ce geste est réservé à Julien.");
    };
    /** Une carte que la session a le droit de voir. */
    const carteVisible = (id: unknown): Carte => {
      const c = this.carte(id);
      if (!julien && c.client !== session.client) throw new Refus("Cette carte n’existe plus.");
      return c;
    };
    /** Un geste client : sur SA carte, dans « Chez vous », place active. */
    const carteChezLeClient = (id: unknown, action: Action): Carte => {
      if (julien) throw new Refus("C’est au client de régler cette carte.");
      const c = carteVisible(id);
      if (c.col !== "vous" || c.action !== action) throw new Refus("Cette carte a déjà été réglée.");
      this.placeActive(c.client);
      return c;
    };

    switch (op.type) {
      /* — Les deux — */
      case "carte.vue": {
        const c = carteVisible(op.id);
        if (c.nouveau === session.role) {
          c.nouveau = null;
          this.ecrireCarte(c);
        }
        return null;
      }
      case "carte.commenter": {
        const c = carteVisible(op.id);
        if (!julien) this.placeActive(c.client);
        const txt = texte(op.txt, 2000, true);
        if (c.com.length >= 200) throw new Refus("Fil trop long — ouvrez une nouvelle carte.");
        c.com.push({ qui: julien ? "Julien" : session.nom, role: session.role, txt, ts: Date.now() });
        c.nouveau = julien ? "client" : "julien";
        this.ecrireCarte(c);
        this.journal(session, "commentaire", c.client, c, { txt });
        return null;
      }
      case "demande.creer": {
        const client = julien ? texte(op.client, 80, true) : (session.client as string);
        if (!this.client(client)) throw new Refus("Place inconnue.");
        if (!julien) this.placeActive(client);
        const t = texte(op.t, 300, true);
        const p = PROCESS.find((x) => x.test.test(t)) ?? HORS_CADRE;
        const st = p.jalons.map((x) => ({ id: idCourt(), t: x, ok: false, qui: "", date: "" }));
        // Posée depuis le sous-tableau d'un projet, la demande y reste rattachée.
        const ch = typeof op.ch === "string" && this.client(client)?.chantiers.some((x) => x.id === op.ch) ? op.ch : null;
        const c = this.nouvelleCarte(client, "demandes", { t, type: p.type, st, ch, nouveau: julien ? null : "julien", desc: texte(op.desc, 2000) });
        this.ecrireCarte(c);
        this.journal(session, "demande", client, c, { type: p.type });
        return { type: "carte", id: c.id };
      }

      /* — Le client, dans « Chez vous » — */
      case "carte.valider": {
        const c = carteChezLeClient(op.id, "valider");
        Object.assign(c, { col: "fait", faitLe: Date.now(), statut: "validée", nouveau: "julien", ordre: this.ordreFin(c.client, "fait") });
        this.ecrireCarte(c);
        this.journal(session, "validation", c.client, c);
        return null;
      }
      case "carte.ajuster": {
        const c = carteChezLeClient(op.id, "valider");
        const txt = texte(op.txt, 2000, true);
        c.com.push({ qui: session.nom, role: "client", txt, ts: Date.now() });
        Object.assign(c, { col: "encours", statut: "ajustement demandé", nouveau: "julien", chezClientDepuis: null, ordre: this.ordreFin(c.client, "encours") });
        this.ecrireCarte(c);
        this.journal(session, "ajustement", c.client, c, { txt });
        return null;
      }
      case "carte.repondre": {
        // La réponse est facultative : glisser la carte dans « Fait » suffit à dire « c'est réglé ».
        const c = carteChezLeClient(op.id, "repondre");
        const txt = texte(op.txt, 2000);
        if (txt) c.com.push({ qui: session.nom, role: "client", txt, ts: Date.now() });
        Object.assign(c, { col: "fait", faitLe: Date.now(), statut: txt ? "répondu" : "réglé", note: txt, nouveau: "julien", ordre: this.ordreFin(c.client, "fait") });
        this.ecrireCarte(c);
        this.journal(session, "reponse", c.client, c, { txt });
        return null;
      }
      case "carte.arbitrer": {
        const c = carteChezLeClient(op.id, "arbitrer");
        const choix = op.choix === "b" ? "b" : "a";
        const col: Col = choix === "a" ? "prevu" : "encours";
        Object.assign(c, { col, statut: "arbitré : " + (choix === "a" ? c.a : c.b), nouveau: "julien", chezClientDepuis: null, ordre: this.ordreFin(c.client, col) });
        this.ecrireCarte(c);
        this.journal(session, "arbitrage", c.client, c, { choix, libelle: choix === "a" ? c.a : c.b });
        return null;
      }

      /* — Julien — */
      case "carte.creer": {
        exigerJulien();
        const client = texte(op.client, 80, true);
        const cl = this.client(client);
        if (!cl) throw new Refus("Place inconnue.");
        const col = COLS.includes(op.col as Col) ? (op.col as Col) : "prevu";
        const ch = typeof op.ch === "string" && cl.chantiers.some((x) => x.id === op.ch) ? op.ch : (cl.chantiers[0]?.id ?? null);
        const c = this.nouvelleCarte(client, col, {
          t: texte(op.t, 300, true),
          ch,
          echeance: texte(op.echeance, 60),
          date: DATE_ISO.test(texte(op.date, 10)) ? texte(op.date, 10) : "",
          action: col === "vous" ? "repondre" : null,
          nouveau: col === "vous" ? "client" : null,
        });
        this.ecrireCarte(c);
        this.journal(session, "carte", client, c);
        return { type: "carte", id: c.id };
      }
      case "carte.maj": {
        exigerJulien();
        const c = this.carte(op.id);
        const ch = op.champs && typeof op.champs === "object" ? (op.champs as Record<string, unknown>) : {};
        const cl = this.client(c.client);
        if ("t" in ch) c.t = texte(ch.t, 300, true);
        if ("desc" in ch) c.desc = texte(ch.desc, 4000);
        if ("echeance" in ch) c.echeance = texte(ch.echeance, 60);
        if ("date" in ch) c.date = DATE_ISO.test(texte(ch.date, 10)) ? texte(ch.date, 10) : "";
        if ("livrable" in ch) c.livrable = ch.livrable === true;
        if ("lien" in ch) c.lien = lienSur(ch.lien);
        if ("ch" in ch) c.ch = typeof ch.ch === "string" && cl?.chantiers.some((x) => x.id === ch.ch) ? ch.ch : null;
        if ("st" in ch && cl) c.st = this.sousTaches(ch.st, cl);
        if ("action" in ch) c.action = ch.action === "valider" || ch.action === "repondre" || ch.action === "arbitrer" ? ch.action : null;
        if ("a" in ch) c.a = texte(ch.a, 160);
        if ("b" in ch) c.b = texte(ch.b, 160);
        if ("statut" in ch) c.statut = texte(ch.statut, 80);
        this.ecrireCarte(c);
        return null;
      }
      case "carte.deplacer": {
        const c = carteVisible(op.id);
        const col = COLS.includes(op.col as Col) ? (op.col as Col) : c.col;
        if (!julien) {
          // Le client range ses demandes par priorité ; le reste du plan ne bouge qu'avec Julien.
          this.placeActive(c.client);
          if (c.col !== "demandes" || col !== "demandes") throw new Refus("Seul Julien déplace les cartes du plan.");
        }
        let ordre = this.ordreFin(c.client, col);
        if (typeof op.avant === "string" && op.avant !== c.id) {
          const voisines = this.cartes()
            .filter((x) => x.client === c.client && x.col === col && x.id !== c.id)
            .sort((x, y) => x.ordre - y.ordre);
          const i = voisines.findIndex((x) => x.id === op.avant);
          if (i === 0) ordre = voisines[0].ordre - 1;
          else if (i > 0) ordre = (voisines[i - 1].ordre + voisines[i].ordre) / 2;
        }
        const avant = c.col;
        c.ordre = ordre;
        if (!julien) {
          this.ecrireCarte(c);
          this.journal(session, "priorite", c.client, c);
          return null;
        }
        if (col !== avant) {
          c.col = col;
          c.statut = "";
          c.note = "";
          c.chezClientDepuis = col === "vous" ? Date.now() : null;
          c.faitLe = col === "fait" ? Date.now() : null;
          if (col === "vous") {
            if (!c.action) c.action = c.livrable ? "valider" : "repondre";
            if (c.action === "arbitrer" && (!c.a || !c.b)) c.action = "repondre";
            c.nouveau = "client";
          } else if (c.nouveau === "client") c.nouveau = null;
          this.journal(session, "deplacement", c.client, c, { de: avant, vers: col });
        }
        this.ecrireCarte(c);
        return null;
      }
      case "carte.cocher": {
        // Julien coche tout ; le client, ce qui est confié à quelqu'un de chez lui.
        const c = carteVisible(op.id);
        const x = c.st.find((k) => k.id === op.st);
        if (!x) throw new Refus("Cette sous-tâche n’existe plus.");
        if (!julien) {
          this.placeActive(c.client);
          if (!x.qui || x.qui === "Julien") throw new Refus("Cette sous-tâche est du côté de Julien.");
          c.nouveau = "julien";
        }
        x.ok = op.ok === true;
        this.ecrireCarte(c);
        this.journal(session, "sous-tache", c.client, c, { sousTache: x.t, faite: x.ok, qui: x.qui });
        return null;
      }
      case "carte.supprimer": {
        exigerJulien();
        const c = this.carte(op.id);
        this.sql.exec("DELETE FROM cartes WHERE id = ?", c.id);
        this.journal(session, "suppression", c.client, null, { t: c.t });
        return null;
      }
      case "carte.relancer": {
        exigerJulien();
        const c = this.carte(op.id);
        if (c.col !== "vous") throw new Refus("Seule une carte chez le client se relance.");
        c.note = "relancée le " + new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
        c.nouveau = "client";
        this.ecrireCarte(c);
        this.journal(session, "relance", c.client, c);
        return null;
      }
      case "demande.arbitrer": {
        exigerJulien();
        const c = this.carte(op.id);
        Object.assign(c, {
          col: "vous",
          action: "arbitrer",
          a: texte(op.a, 160, true),
          b: texte(op.b, 160, true),
          chezClientDepuis: Date.now(),
          nouveau: "client",
          ordre: this.ordreFin(c.client, "vous"),
        });
        this.ecrireCarte(c);
        this.journal(session, "arbitrage-demande", c.client, c);
        return null;
      }

      /* — Les places — */
      case "place.creer": {
        exigerJulien();
        const nom = texte(op.nom, 80, true);
        const contact = texte(op.contact, 60, true);
        const id =
          nom
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 40) || "place";
        const idLibre = this.client(id) ? `${id}-${crypto.randomUUID().slice(0, 4)}` : id;
        const chantiers = (Array.isArray(op.chantiers) ? op.chantiers : [])
          .map((n) => texte(n, 60))
          .filter(Boolean)
          .slice(0, 8)
          .map((n, i) => ({ id: crypto.randomUUID().slice(0, 8), nom: n, couleur: COULEURS[i % COULEURS.length] }));
        const client: Client = {
          id: idLibre,
          nom,
          contact,
          debut: texte(op.debut, 10),
          fin: texte(op.fin, 10),
          mensuel: texte(op.mensuel, 80),
          chantiers,
          archive: false,
          creeLe: Date.now(),
        };
        this.ecrireClient(client);
        const cle = this.creerAcces(client.id, contact);
        const rapport = typeof op.plan === "string" && op.plan.trim() ? this.importer(client, op.plan) : null;
        this.journal(session, "place", client.id, null, { nom });
        return { type: "cree", client: client.id, cle, nom: contact, rapport };
      }
      case "place.maj": {
        exigerJulien();
        const cl = this.client(texte(op.id, 80, true));
        if (!cl) throw new Refus("Place inconnue.");
        const ch = op.champs && typeof op.champs === "object" ? (op.champs as Record<string, unknown>) : {};
        if ("nom" in ch) cl.nom = texte(ch.nom, 80, true);
        if ("contact" in ch) cl.contact = texte(ch.contact, 60);
        if ("debut" in ch) cl.debut = texte(ch.debut, 10);
        if ("fin" in ch) cl.fin = texte(ch.fin, 10);
        if ("mensuel" in ch) cl.mensuel = texte(ch.mensuel, 80);
        if ("archive" in ch) cl.archive = ch.archive === true;
        if ("chantiers" in ch && Array.isArray(ch.chantiers)) {
          // Renommer ou recolorer un chantier garde son objectif et ses dates clés.
          const avant = new Map(cl.chantiers.map((x) => [x.id, x]));
          cl.chantiers = (ch.chantiers as unknown[])
            .slice(0, 8)
            .map((x, i) => {
              const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
              const id = texte(o.id, 20) || idCourt();
              return {
                ...avant.get(id),
                id,
                nom: texte(o.nom, 60),
                couleur: COULEURS.includes(o.couleur as string) ? (o.couleur as string) : COULEURS[i % COULEURS.length],
              };
            })
            .filter((x) => x.nom);
        }
        this.ecrireClient(cl);
        return null;
      }
      case "chantier.maj": {
        exigerJulien();
        const cl = this.client(texte(op.client, 80, true));
        const x = cl?.chantiers.find((k) => k.id === op.ch);
        if (!cl || !x) throw new Refus("Ce projet n’existe plus.");
        const ch = op.champs && typeof op.champs === "object" ? (op.champs as Record<string, unknown>) : {};
        if ("objectif" in ch) x.objectif = texte(ch.objectif, 400);
        if ("dates" in ch)
          x.dates = (Array.isArray(ch.dates) ? ch.dates : [])
            .slice(0, 24)
            .map((d) => {
              const o = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
              const date = texte(o.date, 10);
              return { id: texte(o.id, 20) || idCourt(), t: texte(o.t, 120), date: DATE_ISO.test(date) ? date : "" };
            })
            .filter((d) => d.t);
        this.ecrireClient(cl);
        return null;
      }
      case "place.importer": {
        exigerJulien();
        const cl = this.client(texte(op.id, 80, true));
        if (!cl) throw new Refus("Place inconnue.");
        const rapport = this.importer(cl, texte(op.plan, 20_000, true));
        return { type: "import", rapport };
      }
      case "acces.creer": {
        exigerJulien();
        const cl = this.client(texte(op.client, 80, true));
        if (!cl) throw new Refus("Place inconnue.");
        const nom = texte(op.nom, 60, true);
        const cle = this.creerAcces(cl.id, nom);
        return { type: "cree", client: cl.id, cle, nom };
      }
      case "acces.revoquer": {
        exigerJulien();
        const cle = texte(op.cle, 200, true);
        this.sql.exec("DELETE FROM acces WHERE cle = ?", cle);
        for (const s of this.ctx.getWebSockets()) {
          const sess = s.deserializeAttachment() as Session | null;
          if (sess?.cle === cle) {
            this.erreur(s, "Ce lien vient d’être renouvelé — demandez le nouveau à Julien.", "cle");
            s.close(4001, "cle");
          }
        }
        return null;
      }
      case "export": {
        exigerJulien();
        const evenements = this.sql.exec("SELECT * FROM evenements ORDER BY id").toArray();
        const messages = this.sql.exec("SELECT * FROM messages ORDER BY id").toArray();
        return {
          type: "export",
          data: { exporteLe: new Date().toISOString(), clients: this.clients(), cartes: this.cartes(), acces: this.acces(), messages, evenements },
        };
      }
      default:
        throw new Refus("Geste inconnu.");
    }
  }

  private placeActive(id: string): void {
    const cl = this.client(id);
    if (!cl || cl.archive) throw new Refus("Cette place est close : le tableau reste consultable, plus modifiable.");
  }

  /**
   * Coller un plan. Format, une instruction par ligne :
   *   # Nom du chantier        → chantier (créé s'il n'existe pas)
   *   ## Octobre               → échéance des tâches qui suivent
   *   - Tâche (fait)           → une carte ; entre parenthèses, séparés par des virgules :
   *                              fait, en cours, à vous, livrable, une date (15/10),
   *                              ou une échéance libre
   *     - Sous-tâche (à vous, 15/10) → en retrait sous sa carte : fait, à vous, Julien,
   *                              un prénom de la place, une date (15/10, 15/10/2026)
   * Une tâche déjà présente dans la place (même titre) n'est pas recréée : elle est
   * complétée de ses sous-tâches, sans doublon — coller deux fois le même plan n'ajoute rien.
   * Une ligne non comprise est signalée, jamais devinée.
   */
  private importer(cl: Client, plan: string): { cartes: number; completees: number; sousTaches: number; ignorees: string[] } {
    let chantier: Chantier | null = cl.chantiers[0] ?? null;
    let mois = "";
    let n = 0;
    let ajoutees = 0;
    let derniere: Carte | null = null;
    const existantes = this.cartes().filter((c) => c.client === cl.id);
    const completees = new Set<string>();
    const ignorees: string[] = [];
    const signaler = (t: string) => {
      if (ignorees.length < 20) ignorees.push(t.slice(0, 120));
    };
    const personnes = this.personnes(cl);
    const debut = DATE_ISO.test(cl.debut) ? new Date(cl.debut + "T12:00:00Z") : new Date();
    /** « 15/10 » → la prochaine occurrence à partir du début de période ; « 15/10/2026 » tel quel. */
    const dateDe = (d: string): string => {
      const m = d.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
      if (!m) return DATE_ISO.test(d) ? d : "";
      const jour = Number(m[1]), mois = Number(m[2]);
      if (jour < 1 || jour > 31 || mois < 1 || mois > 12) return "";
      let annee = m[3] ? Number(m[3]) : debut.getUTCFullYear();
      if (!m[3] && mois < debut.getUTCMonth() + 1) annee++;
      return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
    };
    for (const brute of plan.split(/\r?\n/).slice(0, 400)) {
      const ligne = brute.trim();
      if (!ligne) continue;
      const sous = /^\s+[-*•]\s+/.test(brute) && derniere;
      if (sous && derniere) {
        const m = ligne.match(/^[-*•]\s+(.+?)(?:\s*\(([^)]*)\))?\s*$/);
        if (!m) {
          signaler(ligne);
          continue;
        }
        const x: SousTache = { id: idCourt(), t: m[1].slice(0, 200), ok: false, qui: "", date: "" };
        for (const d of (m[2] ?? "").split(",").map((k) => k.trim()).filter(Boolean)) {
          const k = d.toLowerCase();
          const nom = personnes.find((p) => p.toLowerCase() === k);
          if (k === "fait") x.ok = true;
          else if (k === "à vous" || k === "a vous") x.qui = cl.contact || "";
          else if (nom) x.qui = nom;
          else if (dateDe(d)) x.date = dateDe(d);
          else signaler(`« ${d} » : ${ligne}`);
        }
        if (derniere.st.some((k) => norme(k.t) === norme(x.t))) continue;
        if (derniere.st.length < 30) {
          derniere.st.push(x);
          ajoutees++;
        }
        this.ecrireCarte(derniere);
        continue;
      }
      if (/^#\s+/.test(ligne) && !/^##/.test(ligne)) {
        const nom = ligne.replace(/^#\s+/, "").replace(/^chantier\s*:\s*/i, "").slice(0, 60);
        chantier = cl.chantiers.find((c) => c.nom.toLowerCase() === nom.toLowerCase()) ?? null;
        if (!chantier && cl.chantiers.length < 8) {
          chantier = { id: idCourt(), nom, couleur: COULEURS[cl.chantiers.length % COULEURS.length] };
          cl.chantiers.push(chantier);
        }
        mois = "";
        derniere = null;
        continue;
      }
      if (/^##\s+/.test(ligne)) {
        mois = ligne.replace(/^##\s+/, "").slice(0, 60);
        derniere = null;
        continue;
      }
      const tache = ligne.match(/^[-*•]\s+(.+?)(?:\s*\(([^)]*)\))?\s*$/);
      if (!tache) {
        signaler(ligne);
        continue;
      }
      // Déjà là : on la complète, sans toucher à sa colonne, son échéance ni sa date.
      const titre = norme(tache[1]);
      const deja =
        existantes.find((c) => norme(c.t) === titre && (!chantier || c.ch === chantier.id)) ?? existantes.find((c) => norme(c.t) === titre);
      if (deja) {
        derniere = deja;
        completees.add(deja.id);
        continue;
      }
      const drapeaux = (tache[2] ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      let col: Col = "prevu";
      let livrable = false;
      let echeance = mois;
      let date = "";
      for (const d of drapeaux) {
        const x = d.toLowerCase();
        if (x === "fait") col = "fait";
        else if (x === "en cours") col = "encours";
        else if (x === "à vous" || x === "a vous") col = "vous";
        else if (x === "livrable") livrable = true;
        else if (dateDe(d)) date = dateDe(d);
        else echeance = d.slice(0, 60);
      }
      const c = this.nouvelleCarte(cl.id, col, {
        t: tache[1].slice(0, 300),
        ch: chantier?.id ?? null,
        echeance,
        date,
        livrable,
        action: col === "vous" ? (livrable ? "valider" : "repondre") : null,
        nouveau: col === "vous" ? "client" : null,
      });
      this.ecrireCarte(c);
      derniere = c;
      n++;
    }
    this.ecrireClient(cl);
    return { cartes: n, completees: completees.size, sousTaches: ajoutees, ignorees };
  }
}
