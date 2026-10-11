import { useState } from "react";

/**
 * Formulaire des enquêtes LinkedIn (/enquete-pme, /enquete-agences).
 * Questions et textes : src/contenu/enquete-*.json (modifiables dans /admin).
 * Envoi : POST /api/enquete (worker/enquetes.ts), avec le paramètre ?src= de
 * l'adresse s'il existe, pour savoir d'où vient la réponse.
 *
 * Les identifiants des questions (q1…q5) sont les colonnes de l'export CSV :
 * on peut reformuler une question, pas changer son identifiant.
 */

export type Question = {
  id: string;
  libelle: string;
  type: "un" | "plusieurs" | "texte";
  options: string[];
  autre: boolean;
};
export type ContenuEnquete = {
  questions: Question[];
  contact: { titre: string; intro: string; libelleEntreprise: string; consentement: string; mention: string };
  bouton: string;
  merci: { titre: string; texte: string; texteContact: string };
};

const AUTRE = "Autre";
const carte = "rounded-3xl border border-line bg-card p-6 md:p-8";
const choix =
  "flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-background px-4 py-3 text-[15px] leading-snug text-foreground transition-colors has-[:checked]:border-lime has-[:checked]:bg-lime/[0.06] hover:border-lime/50";
const champ =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-lime";

export default function Enquete({ enquete, contenu }: { enquete: "pme" | "agences"; contenu: ContenuEnquete }) {
  const [rep, setRep] = useState<Record<string, string | string[]>>({});
  const [autres, setAutres] = useState<Record<string, string>>({});
  const [prenom, setPrenom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [email, setEmail] = useState("");
  const [consentement, setConsentement] = useState(false);
  const [piege, setPiege] = useState("");
  const [etat, setEtat] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [erreur, setErreur] = useState("");

  const basculer = (id: string, option: string, coche: boolean) =>
    setRep((r) => {
      const liste = Array.isArray(r[id]) ? (r[id] as string[]) : [];
      return { ...r, [id]: coche ? [...liste, option] : liste.filter((x) => x !== option) };
    });

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");
    // « Autre » coché : on enregistre la précision à la place du mot seul.
    const reponses: Record<string, string | string[]> = {};
    for (const q of contenu.questions) {
      const v = rep[q.id];
      if (Array.isArray(v)) {
        const liste = v.map((x) => (x === AUTRE && autres[q.id]?.trim() ? `Autre : ${autres[q.id].trim()}` : x));
        if (liste.length) reponses[q.id] = liste;
      } else if (typeof v === "string" && v.trim()) reponses[q.id] = v.trim();
    }
    if (Object.keys(reponses).length === 0) {
      setErreur("Répondez au moins à une question.");
      return;
    }
    if (email.trim() && !consentement) {
      setErreur("Cochez la case pour recevoir la synthèse, ou laissez l'e-mail vide.");
      return;
    }
    setEtat("sending");
    try {
      const res = await fetch("/api/enquete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquete,
          reponses,
          contact: { prenom, entreprise, email, consentement },
          src: new URLSearchParams(window.location.search).get("src") ?? "",
          siteweb: piege,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error();
      setEtat("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setEtat("error");
      setErreur("L'envoi n'a pas abouti. Réessayez dans un instant.");
    }
  };

  if (etat === "done") {
    return (
      <div className={carte} role="status">
        <p className="font-serif text-[clamp(2.4rem,6vw,3.4rem)] italic leading-none text-lime">{contenu.merci.titre}</p>
        <p className="mt-4 text-lg leading-relaxed text-ink-2">
          {contenu.merci.texte} {consentement && email.trim() ? contenu.merci.texteContact : ""}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="grid gap-5" noValidate>
      {contenu.questions.map((q, i) => (
        <fieldset key={q.id} className={carte}>
          <legend className="sr-only">{q.libelle}</legend>
          <p className="text-[11px] uppercase tracking-[0.22em] text-lime">
            {i + 1} / {contenu.questions.length}
            {q.type === "plusieurs" ? " · plusieurs choix possibles" : ""}
          </p>
          <p className="mt-3 text-xl font-medium leading-snug text-foreground md:text-2xl" aria-hidden="true">
            {q.libelle}
          </p>
          {q.type === "texte" ? (
            <textarea
              aria-label={q.libelle}
              rows={4}
              maxLength={2000}
              value={(rep[q.id] as string) ?? ""}
              onChange={(e) => setRep((r) => ({ ...r, [q.id]: e.target.value }))}
              className={`${champ} mt-5`}
              placeholder="Votre réponse, en quelques mots"
            />
          ) : (
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {[...q.options, ...(q.autre ? [AUTRE] : [])].map((o) => (
                <label key={o} className={choix}>
                  <input
                    type={q.type === "un" ? "radio" : "checkbox"}
                    name={q.id}
                    className="mt-0.5 accent-[var(--lime)]"
                    checked={q.type === "un" ? rep[q.id] === o : Array.isArray(rep[q.id]) && (rep[q.id] as string[]).includes(o)}
                    onChange={(e) => (q.type === "un" ? setRep((r) => ({ ...r, [q.id]: o })) : basculer(q.id, o, e.target.checked))}
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          )}
          {q.autre && Array.isArray(rep[q.id]) && (rep[q.id] as string[]).includes(AUTRE) && (
            <label className="mt-4 block text-sm font-medium text-foreground">
              Précisez
              <input value={autres[q.id] ?? ""} onChange={(e) => setAutres((a) => ({ ...a, [q.id]: e.target.value }))} maxLength={300} className={champ} />
            </label>
          )}
        </fieldset>
      ))}

      <fieldset className={carte}>
        <legend className="sr-only">{contenu.contact.titre}</legend>
        <p className="text-xl font-medium text-foreground">
          {contenu.contact.titre} <span className="text-base font-normal text-ink-3">{contenu.contact.intro}</span>
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-foreground">
            Prénom
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={100} autoComplete="given-name" className={champ} />
          </label>
          <label className="text-sm font-medium text-foreground">
            {contenu.contact.libelleEntreprise}
            <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} maxLength={200} autoComplete="organization" className={champ} />
          </label>
          <label className="text-sm font-medium text-foreground">
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" className={champ} />
          </label>
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-ink-2">
          <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="mt-1 accent-[var(--lime)]" />
          <span>{contenu.contact.consentement}</span>
        </label>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-3">{contenu.contact.mention}</p>
        {/* Champ piège : invisible pour un humain, rempli par les robots. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <label>
            Site web
            <input tabIndex={-1} autoComplete="off" value={piege} onChange={(e) => setPiege(e.target.value)} />
          </label>
        </div>
      </fieldset>

      <div>
        <button
          type="submit"
          disabled={etat === "sending"}
          className="rounded-full bg-lime px-7 py-3.5 text-[15px] font-medium text-white transition-opacity disabled:opacity-50"
        >
          {etat === "sending" ? "Envoi…" : contenu.bouton}
        </button>
        <p aria-live="polite" className="mt-3 min-h-[1.25rem] text-[15px] text-ink-2">
          {erreur}
        </p>
      </div>
    </form>
  );
}
