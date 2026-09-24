/**
 * Le connecteur Claude du tableau : /mcp (Model Context Protocol, HTTP sans état).
 *
 * Claude (claude.ai, l'app, Claude Code) y lit et met à jour le tableau au nom de Julien,
 * depuis n'importe quelle conversation. L'accès est accordé par Julien une fois, sur
 * /authorize (worker/autorisation.ts) ; la bibliothèque OAuth vérifie le jeton avant d'appeler
 * servirMcp, qui revérifie l'empreinte de la clé : si Julien la change, l'accès tombe.
 *
 * Les gestes passent par l'objet du tableau (mcpGeste / mcpMessage) : mêmes règles que depuis
 * la page, journal marqué « via Claude », diffusion en direct aux tableaux ouverts. Rien ne se
 * supprime par ici ; ce qui part chez le client est signalé dans la description des outils.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker";
import { z } from "zod";
import type { EnvAutorisation, PropsClaude } from "./autorisation";
import { empreinteCle, type Carte, type Client, type EnvTableau, type EtatMcp, type SousTache, type Tableau } from "./tableau";

type EnvMcp = EnvTableau & EnvAutorisation;
type Stub = DurableObjectStub<Tableau>;

const COLONNES: Record<string, string> = {
  demandes: "Demandes",
  prevu: "Prévu",
  encours: "En cours",
  vous: "Chez le client",
  fait: "Fait",
  mensuel: "Point mensuel",
};
const ORDRE = ["demandes", "prevu", "encours", "vous", "fait", "mensuel"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const INSTRUCTIONS = `Le tableau de Julien Tridat (julientridat.com/tableau), partagé en direct avec ses clients.
Une « place » par client. Dans une place : des cartes en colonnes — Demandes, Prévu, En cours, Chez le client (« vous » : le client doit répondre ou valider), Fait, Point mensuel — ; des projets (les chantiers) avec objectif, dates clés et fil de discussion ; des sous-tâches sur les cartes, avec un responsable (« Julien » ou un prénom de la place) et une date.
Règles :
- Tout ce qui est dans une place est visible du client.
- Écrire au client — envoyer_message, commenter_carte, deplacer_carte vers « vous », creer_carte en colonne « vous » — seulement si Julien l'a demandé explicitement dans la conversation. Sinon, proposer le texte et attendre son accord.
- Rien ne se supprime par ce connecteur : pour retirer une carte, le dire à Julien.
- Lire la place (lire_place) avant de créer, pour éviter les doublons ; désigner les cartes par leur id.
- Dates au format AAAA-MM-JJ. Français soigné, ton direct, pas de chiffre inventé.`;

class Erreur extends Error {}

/* ————— Outils de lecture ————— */

const norme = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function aujourdhui(): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function plusJours(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function finDeSemaine(auj: string): string {
  return plusJours(auj, (7 - new Date(auj + "T12:00:00Z").getUTCDay()) % 7);
}
function dateFr(iso: string): string {
  return iso ? new Date(iso + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";
}
function heureFr(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
const coteClient = (qui: string) => !!qui && qui !== "Julien";
const duMoment = (c: Carte, x: SousTache, auj: string) => c.col === "encours" || c.col === "vous" || (!!x.date && x.date <= plusJours(auj, 14));

function avancement(cartes: Carte[]): { fait: number; total: number; pct: number } {
  let fait = 0, total = 0;
  for (const c of cartes) {
    if (c.col === "demandes" || c.col === "mensuel") continue;
    if (c.st.length) {
      total += c.st.length;
      fait += c.col === "fait" ? c.st.length : c.st.filter((k) => k.ok).length;
    } else {
      total += 1;
      if (c.col === "fait") fait += 1;
    }
  }
  return { fait, total, pct: total ? Math.round((fait / total) * 100) : 0 };
}

function nonLus(etat: EtatMcp, client: string): number {
  const lu = (fil: string) => etat.lectures.find((l) => l.client === client && l.fil === fil && l.qui === "j")?.ts ?? 0;
  return etat.messages.filter((m) => m.client === client && m.role !== "julien" && m.ts > lu(m.fil || "")).length;
}

function personnes(etat: EtatMcp, cl: Client): string[] {
  const noms = ["Julien"];
  for (const n of [cl.contact, ...etat.personnes.filter((p) => p.client === cl.id).map((p) => p.nom)]) if (n && !noms.includes(n)) noms.push(n);
  return noms;
}

function trouverPlace(etat: EtatMcp, place: string): Client {
  const n = norme(place);
  const cl =
    etat.clients.find((c) => c.id === place) ??
    etat.clients.find((c) => norme(c.nom) === n) ??
    (() => {
      const approchees = etat.clients.filter((c) => norme(c.nom).includes(n));
      return approchees.length === 1 ? approchees[0] : undefined;
    })();
  if (!cl) throw new Erreur(`Place introuvable : « ${place} ». Places : ${etat.clients.map((c) => c.nom).join(", ") || "aucune"}.`);
  return cl;
}
function trouverProjet(cl: Client, projet: string): Client["chantiers"][number] {
  const n = norme(projet);
  const x = cl.chantiers.find((k) => k.id === projet) ?? cl.chantiers.find((k) => norme(k.nom) === n) ?? cl.chantiers.find((k) => norme(k.nom).includes(n));
  if (!x) throw new Erreur(`Projet introuvable dans ${cl.nom} : « ${projet} ». Projets : ${cl.chantiers.map((k) => k.nom).join(", ") || "aucun"}.`);
  return x;
}
function trouverCarte(etat: EtatMcp, id: string): { c: Carte; cl: Client } {
  const t = id.trim();
  const c = etat.cartes.find((k) => k.id === t) ?? (t.length >= 6 ? etat.cartes.filter((k) => k.id.startsWith(t)) : []).find((_, i, a) => a.length === 1);
  if (!c) throw new Erreur(`Carte introuvable : « ${id} ». Utilisez l’id donné par lire_place.`);
  const cl = etat.clients.find((k) => k.id === c.client);
  if (!cl) throw new Erreur("Cette carte n’appartient plus à aucune place.");
  return { c, cl };
}

function ligneCarte(c: Carte, cl: Client, auj: string, avecSousTaches = true): string {
  const ch = cl.chantiers.find((k) => k.id === c.ch);
  const infos = [
    ch ? ch.nom : "",
    c.echeance,
    c.date ? "pour le " + dateFr(c.date) + (c.col !== "fait" && c.date < auj ? " (en retard)" : "") : "",
    c.livrable ? "livrable" : "",
    c.statut,
    c.nouveau === "julien" ? "nouveau pour Julien" : c.nouveau === "client" ? "pas encore vu par le client" : "",
    c.com.length ? `${c.com.length} commentaire${c.com.length > 1 ? "s" : ""}` : "",
  ].filter(Boolean);
  let s = `- [${c.id}] ${c.t}${infos.length ? " — " + infos.join(" · ") : ""}`;
  if (c.desc) s += `\n    ${c.desc.replace(/\s+/g, " ").slice(0, 300)}`;
  if (avecSousTaches)
    for (const k of c.st)
      s += `\n    ${k.ok ? "✓" : "○"} [${k.id}] ${k.t}${k.qui || k.date ? " — " + [k.qui, k.date ? dateFr(k.date) + (!k.ok && k.date < auj && c.col !== "fait" ? " (en retard)" : "") : ""].filter(Boolean).join(" · ") : ""}`;
  return s;
}

function resumePlace(etat: EtatMcp, cl: Client, auj: string): string {
  const cartes = etat.cartes.filter((c) => c.client === cl.id);
  const av = avancement(cartes);
  const chez = cartes.filter((c) => c.col === "vous");
  const taches = cartes.flatMap((c) => (c.col === "fait" || c.col === "demandes" ? [] : c.st.filter((k) => !k.ok && coteClient(k.qui) && duMoment(c, k, auj))));
  let retards = 0;
  let prochaine: { t: string; date: string } | null = null;
  const candidate = (date: string, t: string) => {
    if (date >= auj && (!prochaine || date < prochaine.date)) prochaine = { date, t };
  };
  for (const x of cl.chantiers) for (const d of x.dates ?? []) if (d.date) candidate(d.date, d.t);
  for (const c of cartes) {
    if (c.col === "fait") continue;
    if (c.date) (c.date < auj ? retards++ : candidate(c.date, c.t));
    for (const k of c.st) if (!k.ok && k.date) (k.date < auj ? retards++ : candidate(k.date, k.t));
  }
  const p = prochaine as { t: string; date: string } | null;
  const enLigne = etat.enLigne.filter((x) => x.client === cl.id).map((x) => x.nom);
  return [
    `${cl.nom} [${cl.id}]${cl.archive ? " — close" : ""} · contact : ${cl.contact || "—"}${cl.debut && cl.fin ? ` · du ${dateFr(cl.debut)} au ${dateFr(cl.fin)}` : ""}`,
    `  Avancement ${av.pct} % (${av.fait} sur ${av.total}) · à traiter : ${cartes.filter((c) => c.col === "demandes" || c.nouveau === "julien").length} · en cours : ${cartes.filter((c) => c.col === "encours").length} · chez ${cl.contact || "le client"} : ${chez.length} carte(s) + ${taches.length} tâche(s)`,
    `  ${retards ? retards + " en retard · " : ""}prochaine échéance : ${p ? `${p.t}, ${dateFr(p.date)}` : "—"} · messages non lus : ${nonLus(etat, cl.id)}${enLigne.length ? " · en ligne : " + enLigne.join(", ") : ""}`,
  ].join("\n");
}

/* ————— Le serveur MCP ————— */

type Resultat = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

function creerServeur(stub: Stub): McpServer {
  const server = new McpServer(
    { name: "tableau-julien-tridat", version: "1.0.0" },
    { instructions: INSTRUCTIONS, jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
  );
  const lire = () => stub.mcpEtat() as Promise<EtatMcp>;
  const geste = async (op: Record<string, unknown>) => {
    const r = (await stub.mcpGeste(op)) as { ok: true; reponse: Record<string, unknown> | null } | { ok: false; erreur: string };
    if (!r.ok) throw new Erreur(r.erreur);
    return r.reponse;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outil = (nom: string, config: Record<string, any>, fn: (args: any) => Promise<string>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.registerTool(nom, config as any, (async (args: unknown): Promise<Resultat> => {
      try {
        return { content: [{ type: "text", text: await fn(args ?? {}) }] };
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : "Le geste n’a pas abouti." }] };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
  const lecture = { readOnlyHint: true, openWorldHint: false };
  const ecriture = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
  const versClient = { readOnlyHint: false, destructiveHint: false, openWorldHint: true };
  const dateOpt = z.string().regex(DATE, "Format AAAA-MM-JJ").optional();

  outil(
    "lister_places",
    { title: "Lister les places", description: "La vue d’ensemble : chaque client (place) avec sa période, son avancement, ce qui est à traiter, en cours, chez le client, les retards, la prochaine échéance et les messages non lus.", inputSchema: {}, annotations: lecture },
    async () => {
      const etat = await lire();
      const auj = aujourdhui();
      const places = etat.clients.filter((c) => !c.archive);
      if (!places.length) return "Aucune place pour l’instant.";
      return places.map((cl) => resumePlace(etat, cl, auj)).join("\n\n") + (etat.clients.length > places.length ? `\n\nPlaces closes : ${etat.clients.filter((c) => c.archive).map((c) => c.nom).join(", ")}.` : "");
    },
  );

  outil(
    "lire_place",
    {
      title: "Lire une place",
      description: "Le tableau d’un client : projets (objectif, dates clés), personnes, et toutes les cartes par colonne avec leurs sous-tâches et leurs ids. À lire avant de créer ou modifier.",
      inputSchema: { place: z.string().describe("Nom ou id de la place (ex. « LEH »)"), projet: z.string().optional().describe("Limiter à un projet (nom ou id)") },
      annotations: lecture,
    },
    async ({ place, projet }: { place: string; projet?: string }) => {
      const etat = await lire();
      const cl = trouverPlace(etat, place);
      const auj = aujourdhui();
      const x = projet ? trouverProjet(cl, projet) : null;
      const lignes = [resumePlace(etat, cl, auj), "", `Personnes (responsables possibles) : ${personnes(etat, cl).join(", ")}`];
      lignes.push("", "Projets :");
      for (const k of x ? [x] : cl.chantiers) {
        lignes.push(`- ${k.nom} [${k.id}]${k.objectif ? " — objectif : " + k.objectif : ""}`);
        for (const d of k.dates ?? []) lignes.push(`    date clé : ${d.t}${d.date ? " — " + dateFr(d.date) : ""}`);
      }
      if (!cl.chantiers.length) lignes.push("- aucun");
      const cartes = etat.cartes.filter((c) => c.client === cl.id && (!x || c.ch === x.id));
      for (const col of ORDRE) {
        const liste = cartes.filter((c) => c.col === col).sort((a, b) => (col === "fait" ? (b.faitLe ?? 0) - (a.faitLe ?? 0) : a.ordre - b.ordre));
        if (!liste.length) continue;
        lignes.push("", `${COLONNES[col]} (${liste.length}) :`);
        for (const c of liste) lignes.push(ligneCarte(c, cl, auj, col !== "fait"));
      }
      return lignes.join("\n");
    },
  );

  outil(
    "ma_semaine",
    { title: "Ma semaine", description: "Ce qui est à Julien, tous clients confondus : retours des clients à traiter, puis en retard, aujourd’hui, cette semaine, plus tard, et en cours sans date.", inputSchema: {}, annotations: lecture },
    async () => {
      const etat = await lire();
      const auj = aujourdhui(), dimanche = finDeSemaine(auj);
      const sections: Record<string, string[]> = { "À traiter": [], "En retard": [], "Aujourd’hui": [], "Cette semaine": [], "Plus tard": [], "En cours, sans date": [] };
      for (const c of etat.cartes) {
        const cl = etat.clients.find((k) => k.id === c.client);
        if (!cl || cl.archive) continue;
        const ou = [cl.nom, cl.chantiers.find((k) => k.id === c.ch)?.nom].filter(Boolean).join(" · ");
        const retour = c.nouveau === "julien";
        if (retour) sections["À traiter"].push(`- [${c.id}] ${c.t} — ${c.statut || (c.col === "demandes" ? "nouvelle demande" : "nouveau")} — ${ou}`);
        const items: Array<{ texte: string; date: string }> = [];
        if (!retour && (c.col === "encours" || (c.col === "prevu" && c.date))) items.push({ texte: `- [${c.id}] ${c.t} — ${ou}`, date: c.date ?? "" });
        if (c.col !== "fait")
          for (const k of c.st) if (!k.ok && k.qui === "Julien" && (k.date || c.col === "encours" || c.col === "vous")) items.push({ texte: `- [${c.id} / ${k.id}] ${k.t} (dans « ${c.t} ») — ${ou}`, date: k.date });
        for (const it of items) {
          const d = it.date;
          const cle = !d ? "En cours, sans date" : d < auj ? "En retard" : d === auj ? "Aujourd’hui" : d <= dimanche ? "Cette semaine" : "Plus tard";
          sections[cle].push(it.texte + (d ? ` — ${dateFr(d)}` : ""));
        }
      }
      const out = Object.entries(sections).filter(([, l]) => l.length).map(([t, l]) => `${t} (${l.length}) :\n${l.join("\n")}`);
      return out.length ? out.join("\n\n") : "Rien ne t’attend : ni retour à traiter, ni tâche datée.";
    },
  );

  outil(
    "lire_discussion",
    {
      title: "Lire une discussion",
      description: "Les derniers messages de la discussion d’une place : le fil général, ou le fil d’un projet.",
      inputSchema: { place: z.string(), projet: z.string().optional().describe("Fil d’un projet ; sans lui, le fil général"), nombre: z.number().int().min(1).max(100).optional() },
      annotations: lecture,
    },
    async ({ place, projet, nombre }: { place: string; projet?: string; nombre?: number }) => {
      const etat = await lire();
      const cl = trouverPlace(etat, place);
      const fil = projet ? trouverProjet(cl, projet).id : "";
      const msgs = etat.messages.filter((m) => m.client === cl.id && (m.fil || "") === fil).slice(-(nombre ?? 20));
      if (!msgs.length) return `Aucun message dans le fil ${projet ? "« " + projet + " »" : "général"} de ${cl.nom}.`;
      return msgs.map((m) => `${heureFr(m.ts)} — ${m.qui} : ${m.txt}`).join("\n") + `\n\n(${nonLus(etat, cl.id)} message(s) non lu(s) par Julien dans cette place.)`;
    },
  );

  /* ————— Outils d'action ————— */

  outil(
    "creer_carte",
    {
      title: "Créer une carte",
      description:
        "Ajoute une carte dans une place. Colonnes : prevu (défaut), encours, demandes. La colonne « vous » envoie la carte chez le client avec un bouton Répondre : seulement si Julien l’a demandé. La carte est visible du client.",
      inputSchema: {
        place: z.string(),
        titre: z.string().min(1).max(300),
        colonne: z.enum(["prevu", "encours", "demandes", "vous"]).optional(),
        projet: z.string().optional().describe("Obligatoire si la place a des projets"),
        date: dateOpt.describe("Date précise, AAAA-MM-JJ"),
        echeance: z.string().max(60).optional().describe("Libellé libre : « Octobre », « avant le salon »…"),
        description: z.string().max(2000).optional(),
        livrable: z.boolean().optional(),
      },
      annotations: ecriture,
    },
    async (a: { place: string; titre: string; colonne?: string; projet?: string; date?: string; echeance?: string; description?: string; livrable?: boolean }) => {
      const etat = await lire();
      const cl = trouverPlace(etat, a.place);
      if (cl.chantiers.length && !a.projet) throw new Erreur(`Précisez le projet. Projets de ${cl.nom} : ${cl.chantiers.map((k) => k.nom).join(", ")}.`);
      const ch = a.projet ? trouverProjet(cl, a.projet).id : null;
      const col = a.colonne ?? "prevu";
      const r =
        col === "demandes"
          ? await geste({ type: "demande.creer", client: cl.id, t: a.titre, ch, desc: a.description ?? "" })
          : await geste({ type: "carte.creer", client: cl.id, col, t: a.titre, ch, echeance: a.echeance ?? "", date: a.date ?? "" });
      const id = String(r?.id ?? "");
      const champs: Record<string, unknown> = {};
      if (col !== "demandes" && a.description) champs.desc = a.description;
      if (col === "demandes" && (a.echeance || a.date)) Object.assign(champs, { echeance: a.echeance ?? "", date: a.date ?? "" });
      if (a.livrable !== undefined) champs.livrable = a.livrable;
      if (id && Object.keys(champs).length) await geste({ type: "carte.maj", id, champs });
      return `Carte créée dans ${cl.nom}, colonne ${COLONNES[col]} : [${id}] ${a.titre}${col === "vous" ? " — elle apparaît chez le client." : ""}`;
    },
  );

  outil(
    "modifier_carte",
    {
      title: "Modifier une carte",
      description: "Change le titre, la description, l’échéance, la date, le projet, le lien ou le caractère livrable d’une carte. date: \"\" efface la date.",
      inputSchema: {
        carte: z.string().describe("Id de la carte"),
        titre: z.string().min(1).max(300).optional(),
        description: z.string().max(4000).optional(),
        echeance: z.string().max(60).optional(),
        date: z.union([z.string().regex(DATE), z.literal("")]).optional(),
        projet: z.string().optional(),
        lien: z.string().url().optional().describe("Lien du livrable (Drive, Figma…)"),
        livrable: z.boolean().optional(),
      },
      annotations: ecriture,
    },
    async (a: { carte: string; titre?: string; description?: string; echeance?: string; date?: string; projet?: string; lien?: string; livrable?: boolean }) => {
      const etat = await lire();
      const { c, cl } = trouverCarte(etat, a.carte);
      const champs: Record<string, unknown> = {};
      if (a.titre !== undefined) champs.t = a.titre;
      if (a.description !== undefined) champs.desc = a.description;
      if (a.echeance !== undefined) champs.echeance = a.echeance;
      if (a.date !== undefined) champs.date = a.date;
      if (a.projet !== undefined) champs.ch = trouverProjet(cl, a.projet).id;
      if (a.lien !== undefined) champs.lien = a.lien;
      if (a.livrable !== undefined) champs.livrable = a.livrable;
      if (!Object.keys(champs).length) throw new Erreur("Rien à modifier.");
      await geste({ type: "carte.maj", id: c.id, champs });
      return `Carte [${c.id}] modifiée (${Object.keys(champs).join(", ")}).`;
    },
  );

  outil(
    "deplacer_carte",
    {
      title: "Déplacer une carte",
      description:
        "Change la colonne d’une carte (prevu, encours, fait, mensuel, demandes), ou son rang avec « avant ». Vers « vous » (Chez le client), la carte part chez le client avec un bouton Valider ou Répondre : seulement si Julien l’a demandé.",
      inputSchema: {
        carte: z.string(),
        colonne: z.enum(["prevu", "encours", "vous", "fait", "mensuel", "demandes"]),
        avant: z.string().optional().describe("Id de la carte devant laquelle se placer"),
      },
      annotations: versClient,
    },
    async (a: { carte: string; colonne: string; avant?: string }) => {
      const etat = await lire();
      const { c, cl } = trouverCarte(etat, a.carte);
      const avant = a.avant ? trouverCarte(etat, a.avant).c.id : null;
      await geste({ type: "carte.deplacer", id: c.id, col: a.colonne, avant });
      return `« ${c.t} » (${cl.nom}) : ${COLONNES[c.col]} → ${COLONNES[a.colonne]}.${a.colonne === "vous" ? " Elle apparaît chez le client." : ""}`;
    },
  );

  outil(
    "ajouter_sous_taches",
    {
      title: "Ajouter des sous-tâches",
      description:
        "Ajoute des sous-tâches à une carte, sans doublon (même titre ignoré). Responsable : « Julien », ou un prénom de la place (voir lire_place) ; une sous-tâche confiée au client apparaît dans son « Chez vous » quand elle est du moment.",
      inputSchema: {
        carte: z.string(),
        sous_taches: z
          .array(z.object({ titre: z.string().min(1).max(200), responsable: z.string().optional(), date: dateOpt }))
          .min(1)
          .max(30),
      },
      annotations: ecriture,
    },
    async (a: { carte: string; sous_taches: Array<{ titre: string; responsable?: string; date?: string }> }) => {
      const etat = await lire();
      const { c, cl } = trouverCarte(etat, a.carte);
      const noms = personnes(etat, cl);
      const liste = c.st.map((k) => ({ ...k }));
      let ajoutees = 0;
      for (const s of a.sous_taches) {
        if (liste.some((k) => norme(k.t) === norme(s.titre))) continue;
        let qui = "";
        if (s.responsable) {
          const r = norme(s.responsable);
          qui = noms.find((n) => norme(n) === r) ?? (["client", "a vous", "vous"].includes(r) ? cl.contact : "");
          if (!qui) throw new Erreur(`Responsable inconnu : « ${s.responsable} ». Possibles dans ${cl.nom} : ${noms.join(", ")}.`);
        }
        liste.push({ id: crypto.randomUUID().slice(0, 8), t: s.titre, ok: false, qui, date: s.date ?? "" });
        ajoutees++;
      }
      if (!ajoutees) return `Aucune sous-tâche nouvelle : « ${c.t} » les a déjà.`;
      await geste({ type: "carte.maj", id: c.id, champs: { st: liste } });
      return `${ajoutees} sous-tâche(s) ajoutée(s) à « ${c.t} » (${cl.nom}).`;
    },
  );

  outil(
    "cocher_sous_tache",
    {
      title: "Cocher une sous-tâche",
      description: "Marque une sous-tâche faite (ou la rouvre avec faite: false). La sous-tâche se désigne par son id ou son titre.",
      inputSchema: { carte: z.string(), sous_tache: z.string(), faite: z.boolean().optional() },
      annotations: ecriture,
    },
    async (a: { carte: string; sous_tache: string; faite?: boolean }) => {
      const etat = await lire();
      const { c } = trouverCarte(etat, a.carte);
      const cherche = norme(a.sous_tache);
      const partielles = cherche ? c.st.filter((x) => norme(x.t).includes(cherche)) : [];
      const k = c.st.find((x) => x.id === a.sous_tache) ?? c.st.find((x) => norme(x.t) === cherche) ?? (partielles.length === 1 ? partielles[0] : undefined);
      if (!k && partielles.length > 1) throw new Erreur(`Plusieurs sous-tâches correspondent : ${partielles.map((x) => `[${x.id}] ${x.t}`).join(" ; ")}.`);
      if (!k) throw new Erreur(`Sous-tâche introuvable sur « ${c.t} ». Sous-tâches : ${c.st.map((x) => `[${x.id}] ${x.t}`).join(" ; ") || "aucune"}.`);
      const faite = a.faite ?? true;
      await geste({ type: "carte.cocher", id: c.id, st: k.id, ok: faite });
      return `« ${k.t} » : ${faite ? "faite" : "rouverte"}.`;
    },
  );

  outil(
    "commenter_carte",
    {
      title: "Commenter une carte",
      description: "Ajoute un commentaire signé Julien sur une carte. Le client le voit et la carte lui est signalée : seulement si Julien l’a demandé.",
      inputSchema: { carte: z.string(), texte: z.string().min(1).max(2000) },
      annotations: versClient,
    },
    async (a: { carte: string; texte: string }) => {
      const etat = await lire();
      const { c, cl } = trouverCarte(etat, a.carte);
      await geste({ type: "carte.commenter", id: c.id, txt: a.texte });
      return `Commentaire ajouté sur « ${c.t} » (${cl.nom}) ; le client le voit.`;
    },
  );

  outil(
    "importer_plan",
    {
      title: "Coller un plan",
      description:
        "Le « Coller un plan » du tableau. Format, une ligne par élément : « # Projet », « ## Mois », « - Tâche (fait | en cours | à vous | livrable | 15/10 | échéance libre) », et en retrait sous une tâche « - Sous-tâche (Julien | à vous | prénom, 15/10, fait) ». Une tâche déjà présente (même titre) n’est pas recréée : ses sous-tâches s’y ajoutent, sans doublon. Attention : « (à vous) » sur une tâche nouvelle l’envoie chez le client.",
      inputSchema: { place: z.string(), plan: z.string().min(1).max(20_000) },
      annotations: ecriture,
    },
    async (a: { place: string; plan: string }) => {
      const etat = await lire();
      const cl = trouverPlace(etat, a.place);
      const r = (await geste({ type: "place.importer", id: cl.id, plan: a.plan })) as { rapport?: { cartes: number; completees: number; sousTaches: number; ignorees: string[] } } | null;
      const rap = r?.rapport;
      if (!rap) return "Plan importé.";
      return (
        `${cl.nom} : ${rap.cartes} carte(s) créée(s), ${rap.completees} complétée(s), ${rap.sousTaches} sous-tâche(s) ajoutée(s).` +
        (rap.ignorees.length ? `\nLignes non comprises (${rap.ignorees.length}) :\n${rap.ignorees.map((l) => "- " + l).join("\n")}` : "")
      );
    },
  );

  outil(
    "modifier_projet",
    {
      title: "Modifier un projet",
      description: "L’objectif d’un projet (une phrase, lue par le client) et ses dates clés, affichées sur sa frise. dates_cles remplace la liste ; ajouter_dates_cles la complète.",
      inputSchema: {
        place: z.string(),
        projet: z.string(),
        objectif: z.string().max(400).optional(),
        dates_cles: z.array(z.object({ titre: z.string().min(1).max(120), date: z.string().regex(DATE) })).max(24).optional(),
        ajouter_dates_cles: z.array(z.object({ titre: z.string().min(1).max(120), date: z.string().regex(DATE) })).max(24).optional(),
      },
      annotations: ecriture,
    },
    async (a: { place: string; projet: string; objectif?: string; dates_cles?: Array<{ titre: string; date: string }>; ajouter_dates_cles?: Array<{ titre: string; date: string }> }) => {
      const etat = await lire();
      const cl = trouverPlace(etat, a.place);
      const x = trouverProjet(cl, a.projet);
      const champs: Record<string, unknown> = {};
      if (a.objectif !== undefined) champs.objectif = a.objectif;
      if (a.dates_cles || a.ajouter_dates_cles) {
        const base = a.dates_cles ? [] : (x.dates ?? []).map((d) => ({ id: d.id, t: d.t, date: d.date }));
        const nouvelles = [...(a.dates_cles ?? []), ...(a.ajouter_dates_cles ?? [])].map((d) => ({ id: crypto.randomUUID().slice(0, 8), t: d.titre, date: d.date }));
        champs.dates = [...base, ...nouvelles.filter((n) => !base.some((b) => norme(b.t) === norme(n.t) && b.date === n.date))];
      }
      if (!Object.keys(champs).length) throw new Erreur("Rien à modifier.");
      await geste({ type: "chantier.maj", client: cl.id, ch: x.id, champs });
      return `Projet « ${x.nom} » (${cl.nom}) mis à jour (${Object.keys(champs).join(", ")}).`;
    },
  );

  outil(
    "envoyer_message",
    {
      title: "Envoyer un message au client",
      description:
        "Écrit, au nom de Julien, dans la discussion d’une place (fil général, ou fil d’un projet). Le client le reçoit en direct. Seulement si Julien l’a explicitement demandé dans la conversation ; sinon, proposer le texte et attendre son accord.",
      inputSchema: { place: z.string(), texte: z.string().min(1).max(4000), projet: z.string().optional() },
      annotations: versClient,
    },
    async (a: { place: string; texte: string; projet?: string }) => {
      const etat = await lire();
      const cl = trouverPlace(etat, a.place);
      const fil = a.projet ? trouverProjet(cl, a.projet).id : "";
      const r = (await stub.mcpMessage(cl.id, fil, a.texte)) as { ok: true } | { ok: false; erreur: string };
      if (!r.ok) throw new Erreur(r.erreur);
      return `Message envoyé à ${cl.contact || cl.nom} (${a.projet ? "fil « " + a.projet + " »" : "fil général"}).`;
    },
  );

  return server;
}

/** /mcp : appelé par la bibliothèque OAuth une fois le jeton vérifié (ctx.props). */
export async function servirMcp(request: Request, env: EnvMcp, ctx: ExecutionContext & { props?: PropsClaude }): Promise<Response> {
  const props = ctx.props;
  const valide = !!props && props.role === "julien" && !!env.TABLEAU_ADMIN_KEY && props.empreinte === (await empreinteCle(env.TABLEAU_ADMIN_KEY));
  if (!valide) {
    return Response.json(
      { error: "invalid_token", error_description: "Accès retiré : la clé du tableau a changé. Reconnectez le connecteur." },
      {
        status: 401,
        headers: {
          "cache-control": "no-store",
          // Comme la bibliothèque : Claude y retrouve où redemander l'autorisation.
          "www-authenticate": `Bearer error="invalid_token", error_description="Acces retire", resource_metadata="${new URL(request.url).origin}/.well-known/oauth-protected-resource/mcp"`,
        },
      },
    );
  }
  if (!env.TABLEAU) return new Response("Tableau non configuré.", { status: 503 });
  const server = creerServeur(env.TABLEAU.get(env.TABLEAU.idFromName("atelier")));
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(request);
}
