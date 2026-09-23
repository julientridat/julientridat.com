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
  livrable: boolean;
  lien: string;
  type: string;
  jalons: string[];
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

interface Chantier {
  id: string;
  nom: string;
  couleur: string;
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

function nouvelleCle(): string {
  const octets = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function egal(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}

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
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
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
      .map((r) => JSON.parse(r.data) as Carte);
  }
  private carte(id: unknown): Carte {
    const r = typeof id === "string" ? this.sql.exec<{ data: string }>("SELECT data FROM cartes WHERE id = ?", id).toArray()[0] : undefined;
    if (!r) throw new Refus("Cette carte n’existe plus.");
    return JSON.parse(r.data) as Carte;
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
      livrable: false,
      lien: "",
      type: "",
      jalons: [],
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
        const c = this.nouvelleCarte(client, "demandes", { t, type: p.type, jalons: p.jalons, nouveau: julien ? null : "julien", desc: texte(op.desc, 2000) });
        this.ecrireCarte(c);
        this.journal(session, "demande", client, c, { type: p.type });
        return null;
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
        const c = carteChezLeClient(op.id, "repondre");
        const txt = texte(op.txt, 2000, true);
        c.com.push({ qui: session.nom, role: "client", txt, ts: Date.now() });
        Object.assign(c, { col: "fait", faitLe: Date.now(), statut: "répondu", note: txt, nouveau: "julien", ordre: this.ordreFin(c.client, "fait") });
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
          action: col === "vous" ? "repondre" : null,
          nouveau: col === "vous" ? "client" : null,
        });
        this.ecrireCarte(c);
        this.journal(session, "carte", client, c);
        return null;
      }
      case "carte.maj": {
        exigerJulien();
        const c = this.carte(op.id);
        const ch = op.champs && typeof op.champs === "object" ? (op.champs as Record<string, unknown>) : {};
        const cl = this.client(c.client);
        if ("t" in ch) c.t = texte(ch.t, 300, true);
        if ("desc" in ch) c.desc = texte(ch.desc, 4000);
        if ("echeance" in ch) c.echeance = texte(ch.echeance, 60);
        if ("livrable" in ch) c.livrable = ch.livrable === true;
        if ("lien" in ch) c.lien = lienSur(ch.lien);
        if ("ch" in ch) c.ch = typeof ch.ch === "string" && cl?.chantiers.some((x) => x.id === ch.ch) ? ch.ch : null;
        if ("jalons" in ch) c.jalons = Array.isArray(ch.jalons) ? ch.jalons.map((j) => texte(j, 200)).filter(Boolean).slice(0, 12) : [];
        if ("action" in ch) c.action = ch.action === "valider" || ch.action === "repondre" || ch.action === "arbitrer" ? ch.action : null;
        if ("a" in ch) c.a = texte(ch.a, 160);
        if ("b" in ch) c.b = texte(ch.b, 160);
        if ("statut" in ch) c.statut = texte(ch.statut, 80);
        this.ecrireCarte(c);
        return null;
      }
      case "carte.deplacer": {
        exigerJulien();
        const c = this.carte(op.id);
        const col = COLS.includes(op.col as Col) ? (op.col as Col) : c.col;
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
          cl.chantiers = (ch.chantiers as unknown[])
            .slice(0, 8)
            .map((x, i) => {
              const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
              return {
                id: texte(o.id, 20) || crypto.randomUUID().slice(0, 8),
                nom: texte(o.nom, 60),
                couleur: COULEURS.includes(o.couleur as string) ? (o.couleur as string) : COULEURS[i % COULEURS.length],
              };
            })
            .filter((x) => x.nom);
        }
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
        return { type: "export", data: { exporteLe: new Date().toISOString(), clients: this.clients(), cartes: this.cartes(), acces: this.acces(), evenements } };
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
   *                              fait, en cours, à vous, livrable, ou une échéance libre
   * Une ligne non comprise est signalée, jamais devinée.
   */
  private importer(cl: Client, plan: string): { cartes: number; ignorees: string[] } {
    let chantier: Chantier | null = cl.chantiers[0] ?? null;
    let mois = "";
    let n = 0;
    const ignorees: string[] = [];
    for (const brute of plan.split(/\r?\n/).slice(0, 400)) {
      const ligne = brute.trim();
      if (!ligne) continue;
      if (/^#\s+/.test(ligne) && !/^##/.test(ligne)) {
        const nom = ligne.replace(/^#\s+/, "").replace(/^chantier\s*:\s*/i, "").slice(0, 60);
        chantier = cl.chantiers.find((c) => c.nom.toLowerCase() === nom.toLowerCase()) ?? null;
        if (!chantier && cl.chantiers.length < 8) {
          chantier = { id: crypto.randomUUID().slice(0, 8), nom, couleur: COULEURS[cl.chantiers.length % COULEURS.length] };
          cl.chantiers.push(chantier);
        }
        mois = "";
        continue;
      }
      if (/^##\s+/.test(ligne)) {
        mois = ligne.replace(/^##\s+/, "").slice(0, 60);
        continue;
      }
      const tache = ligne.match(/^[-*•]\s+(.+?)(?:\s*\(([^)]*)\))?\s*$/);
      if (!tache) {
        if (ignorees.length < 20) ignorees.push(ligne.slice(0, 120));
        continue;
      }
      const drapeaux = (tache[2] ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      let col: Col = "prevu";
      let livrable = false;
      let echeance = mois;
      for (const d of drapeaux) {
        const x = d.toLowerCase();
        if (x === "fait") col = "fait";
        else if (x === "en cours") col = "encours";
        else if (x === "à vous" || x === "a vous") col = "vous";
        else if (x === "livrable") livrable = true;
        else echeance = d.slice(0, 60);
      }
      const c = this.nouvelleCarte(cl.id, col, {
        t: tache[1].slice(0, 300),
        ch: chantier?.id ?? null,
        echeance,
        livrable,
        action: col === "vous" ? (livrable ? "valider" : "repondre") : null,
        nouveau: col === "vous" ? "client" : null,
      });
      this.ecrireCarte(c);
      n++;
    }
    this.ecrireClient(cl);
    return { cartes: n, ignorees };
  }
}
