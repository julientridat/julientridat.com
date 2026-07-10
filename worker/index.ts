/**
 * Worker julientridat — sert les assets statiques (dist/) et expose
 * POST /api/experience : inférence IA en direct pour la page /experience.
 *
 * Moteur hybride :
 *   1. Claude (API Anthropic) si ANTHROPIC_API_KEY est configurée (secret Cloudflare)
 *   2. Workers AI (Llama 3.3) en bascule automatique — inclus dans le plan Cloudflare
 *   3. Message honnête d'indisponibilité si aucun moteur ne répond
 *
 * Réponse : flux SSE — events `meta` (moteur, modèle, prompt), `delta` (texte),
 * `done` (latence), `error`. Le front affiche le flux brut dans « sous le capot ».
 */
import Anthropic from "@anthropic-ai/sdk";

interface Env {
  ASSETS: Fetcher;
  AI?: Ai;
  ANTHROPIC_API_KEY?: string;
  /** Modèle Claude (défaut : claude-opus-4-8 ; claude-haiku-4-5 pour réduire le coût ~5×). */
  CLAUDE_MODEL?: string;
  /** MOCK_AI=1 en dev local : flux simulé, aucune clé requise. */
  MOCK_AI?: string;
}

const WORKERS_AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_TOKENS = 700;
const MAX_BODY_BYTES = 8_000;
const MAX_MESSAGES = 14;
const MAX_MESSAGE_CHARS = 1_600;

type ChatMessage = { role: "user" | "assistant"; content: string };

/* ————— Prompts système (côté serveur : le client ne peut pas les altérer) ————— */

const BASE = `Tu es l'assistant de démonstration du site de Julien Tridat, consultant IA à Bordeaux.
Il installe des assistants IA sur mesure dans les TPE/PME : commercial, administratif, contenus, avec formation des équipes.
Sa méthode : Observer (les vraies journées) → Construire (assistants calibrés métier) → Déployer (par vagues dès la semaine 3) → Former (autonomie des équipes).

Règles absolues :
- Français soigné, vouvoiement, ton direct et concret, pas de jargon ni d'anglicismes gratuits.
- N'invente JAMAIS de chiffre précis, de statistique ou de promesse chiffrée. Ordres de grandeur prudents uniquement ("plusieurs heures par semaine"), et seulement quand c'est évident.
- Aucun nom de client, aucune référence inventée.
- Reste sur le sujet : l'IA au service de l'activité du visiteur. Si on t'emmène ailleurs (politique, code, devoirs, etc.), décline poliment en une phrase et reviens au sujet.
- Réponses courtes et denses. Pas de flatterie, pas de remplissage.`;

const SYSTEMS: Record<string, string> = {
  quiz: `${BASE}

Le visiteur vient de répondre à 5 questions sur sa situation. Rédige son diagnostic de maturité IA :
- 2 à 3 phrases qui reformulent SA situation précise (reprends ses réponses, pas de généralités) ;
- le levier n°1 à activer en premier chez lui, et pourquoi celui-là ;
- une mise en garde honnête (ce qui ne marchera PAS tant que X n'est pas réglé), s'il y a lieu ;
- termine par une phrase qui invite à en parler 30 minutes avec Julien, sans être insistant.
Maximum 130 mots. Pas de titres, pas de listes à puces : un texte fluide en 2 paragraphes.`,

  secteur: `${BASE}

Le visiteur t'a donné son métier ou secteur. Décris "sa semaine avec un assistant IA installé par Julien" :
- 3 moments concrets de SA semaine type où l'assistant travaille pour lui (tâches réalistes et spécifiques à ce métier, pas génériques) ;
- pour chacun : ce que l'assistant produit, et ce que la personne fait pendant ce temps.
Format : 3 courts paragraphes commençant chacun par un jour ("Lundi matin —", etc.). Maximum 140 mots au total.
Si l'entrée n'est pas un métier ou secteur identifiable, demande-le en une phrase, avec un exemple.`,

  bot: `${BASE}

Tu mènes une qualification courtoise en direct sur la page. Objectif : comprendre l'activité du visiteur,
la taille de son équipe et là où part son temps — puis produire un pré-diagnostic.
Conduite :
- Une seule question à la fois, jamais deux.
- 2 à 4 questions maximum au total, puis livre le pré-diagnostic : sa situation en 2 phrases, le premier assistant que Julien installerait chez lui, et l'invitation à réserver l'audit de 30 minutes (le bouton est sous cette conversation).
- Chaque réponse : 60 mots maximum.`,
};

/* ————— Moteurs : chacun renvoie un flux de fragments de texte ————— */

async function* streamClaude(env: Env, system: string, messages: ChatMessage[]): AsyncGenerator<string> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const stream = client.messages.stream({
    model: env.CLAUDE_MODEL || "claude-opus-4-8",
    max_tokens: MAX_TOKENS,
    system,
    messages,
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

async function* streamWorkersAI(env: Env, system: string, messages: ChatMessage[]): AsyncGenerator<string> {
  const result = (await env.AI!.run(WORKERS_AI_MODEL as Parameters<Ai["run"]>[0], {
    messages: [{ role: "system", content: system }, ...messages],
    max_tokens: MAX_TOKENS,
    stream: true,
  })) as ReadableStream;
  const reader = result.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const text = JSON.parse(payload).response;
        if (typeof text === "string" && text) yield text;
      } catch {
        /* fragment incomplet — ignoré */
      }
    }
  }
}

const MOCK_TEXTS: Record<string, string> = {
  quiz: "Vous dirigez une petite équipe où le commercial et l'administratif reposent sur vous, avec des informations encore éparpillées entre plusieurs outils. C'est le profil le plus courant — et le plus rentable à équiper.\n\nLe premier levier chez vous : un assistant qui prépare vos propositions et vos relances sur votre trame. En revanche, tant que vos données clients restent dispersées, aucun assistant ne sera fiable sur le suivi : c'est le préalable. Trente minutes avec Julien suffisent pour ordonner tout ça.",
  secteur: "Lundi matin — l'assistant a trié les demandes du week-end et préparé trois réponses à valider ; vous les relisez en dix minutes au lieu d'y passer l'heure du café.\n\nMercredi — il assemble votre devis sur votre trame, à vos prix ; vous partez en rendez-vous pendant qu'il tourne.\n\nVendredi — il rédige les relances de la semaine, personnalisées ; vous fermez le bureau à l'heure.",
  bot: "Bien noté. Pour situer où part votre temps : sur une semaine ordinaire, qu'est-ce qui vous prend le plus d'heures sans faire avancer votre métier — les devis et propositions, les relances clients, ou l'administratif pur ?",
};

async function* streamMock(mode: string): AsyncGenerator<string> {
  const words = (MOCK_TEXTS[mode] ?? MOCK_TEXTS.bot).split(/(?<= )/);
  for (const w of words) {
    await new Promise((r) => setTimeout(r, 24));
    yield w;
  }
}

/* ————— Handler API ————— */

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

function allowedOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // requête same-origin sans header (rare) ou outil direct
  try {
    const host = new URL(origin).hostname;
    return host === "julientridat.com" || host.endsWith(".julientridat.com") ||
      host === "localhost" || host === "127.0.0.1" || host.endsWith(".workers.dev");
  } catch {
    return false;
  }
}

async function handleExperience(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET") {
    // Sonde de disponibilité pour la console du hero — aucune inférence.
    const engine = env.MOCK_AI ? "mock" : env.ANTHROPIC_API_KEY ? "claude" : env.AI ? "workers-ai" : "aucun";
    return Response.json({ ok: engine !== "aucun", engine });
  }
  if (request.method !== "POST") return new Response("Méthode non autorisée", { status: 405 });
  if (!allowedOrigin(request)) return new Response("Origine refusée", { status: 403 });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return new Response("Requête trop volumineuse", { status: 413 });

  let body: { mode?: string; messages?: ChatMessage[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }

  const mode = body.mode ?? "";
  const system = SYSTEMS[mode];
  if (!system) return new Response("Mode inconnu", { status: 400 });

  const messages = (body.messages ?? [])
    .slice(-MAX_MESSAGES)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return new Response("Message utilisateur manquant", { status: 400 });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const write = (event: string, data: unknown) => writer.write(encoder.encode(sse(event, data)));
  const t0 = Date.now();

  const run = async () => {
    // Ordre hybride : mock (dev) → Claude → Workers AI → indisponible.
    const engines: Array<{ name: string; model: string; gen: () => AsyncGenerator<string> }> = [];
    if (env.MOCK_AI) engines.push({ name: "mock", model: "simulation-locale", gen: () => streamMock(mode) });
    if (env.ANTHROPIC_API_KEY)
      engines.push({ name: "claude", model: env.CLAUDE_MODEL || "claude-opus-4-8", gen: () => streamClaude(env, system, messages) });
    if (env.AI) engines.push({ name: "workers-ai", model: WORKERS_AI_MODEL, gen: () => streamWorkersAI(env, system, messages) });

    let served = false;
    for (const engine of engines) {
      try {
        const gen = engine.gen();
        // On n'annonce le moteur qu'une fois le premier fragment reçu :
        // si l'appel échoue avant, on bascule silencieusement sur le suivant.
        const first = await gen.next();
        if (first.done) continue;
        await write("meta", { engine: engine.name, model: engine.model, system: system.slice(0, 800) });
        await write("delta", { text: first.value });
        for await (const text of gen) await write("delta", { text });
        served = true;
        break;
      } catch (err) {
        if (served) {
          // Flux interrompu après démarrage : on termine proprement, pas de re-jeu.
          await write("error", { message: "Le flux s'est interrompu — relancez votre demande." });
          break;
        }
        console.error(`Moteur ${engine.name} indisponible:`, err instanceof Error ? err.message : err);
      }
    }
    if (!served) {
      await write("error", {
        message: "La démonstration IA est momentanément indisponible. Le reste de la page fonctionne — et Julien, lui, répond toujours : réservez l'audit de 30 minutes.",
      });
    }
    await write("done", { ms: Date.now() - t0 });
    await writer.close();
  };

  const response = new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
  // L'inférence continue après le retour de la réponse.
  run().catch(() => writer.close().catch(() => {}));
  return response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/experience") return handleExperience(request, env);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
