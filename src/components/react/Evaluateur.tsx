import { useMemo, useRef, useState } from "react";
import { SCHEDULER_URL, WEB3FORMS_ACCESS_KEY } from "@/lib/site";
import {
  ABONNEMENT_HT,
  ESSAI_APPRENTI_JOURS,
  ESSAI_EMPLOYE_MOIS,
  GRATIFICATION_STAGE,
  NIVEAUX,
  RECRUTEMENT_SEMAINES,
  TRANCHES_AGE,
  coutApprenti,
  coutEmployeur,
  euros,
} from "@/lib/coutsEmploi";

/**
 * L'évaluateur de /avant-de-recruter. Deux portes d'entrée — la fiche de poste
 * (PDF, Word, texte) analysée par Claude via /api/evaluer-poste, ou un
 * questionnaire sans IA — puis le contrat, l'entreprise, et le résultat :
 * tâches couvertes, coût réel du poste, prix des livrables chez des
 * prestataires, coût d'un recrutement qui échoue, et la réservation.
 *
 * Les familles, leurs verdicts et leurs prix viennent de
 * src/contenu/avant-de-recruter.json (modifiables dans /admin) ; les règles
 * de calcul, de src/lib/coutsEmploi.ts.
 */

export type Famille = {
  id: string;
  nom: string;
  verdict: "inclus" | "partiel" | "option" | "hors";
  livraison: string;
  prixBas: number | null;
  prixHaut: number | null;
  unite: string;
  prixLibelle: string;
  source: string;
  sourceUrl: string;
};
type Tache = { libelle: string; famille: string; presentiel: boolean };
type Contrat = "cdi" | "cdd" | "alternance" | "stage";

const UNITES: Record<string, string> = {
  ponctuel: "",
  mois: " par mois",
  jour: " par jour",
  campagne: " par campagne",
  article: " par article",
};
const VERDICTS: Record<Famille["verdict"] | "sur_place", { libelle: string; classe: string }> = {
  inclus: { libelle: "Inclus", classe: "bg-lime/10 text-lime" },
  partiel: { libelle: "En partie", classe: "bg-violet-soft/25 text-lime" },
  option: { libelle: "En option", classe: "border border-line text-ink-2" },
  hors: { libelle: "Hors périmètre", classe: "border border-line text-ink-3" },
  sur_place: { libelle: "Sur place", classe: "border border-line text-ink-3" },
};
const ERREURS: Record<string, string> = {
  indisponible: "L'analyse automatique n'est pas disponible pour l'instant. Répondez aux questions : c'est aussi rapide.",
  trop: "Trop d'analyses en peu de temps. Réessayez dans quelques minutes, ou répondez aux questions.",
  "trop-court": "Le texte est trop court pour une fiche de poste.",
  "trop-long": "Le fichier est trop lourd. Collez plutôt le texte de la fiche.",
  illisible: "Je n'ai pas pu lire cette fiche. Collez son texte, ou répondez aux questions.",
};

const fourchette = (f: Famille) =>
  f.prixBas == null
    ? ""
    : f.prixHaut && f.prixHaut !== f.prixBas
      ? `${euros(f.prixBas).replace(" €", "")} à ${euros(f.prixHaut)} HT${UNITES[f.unite] ?? ""}`
      : `${euros(f.prixBas)} HT${UNITES[f.unite] ?? ""}`;

const enBase64 = (fichier: File) =>
  new Promise<string>((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => ko(r.error);
    r.readAsDataURL(fichier);
  });

const choix = "flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-background px-4 py-3 text-[15px] text-foreground transition-colors has-[:checked]:border-lime has-[:checked]:bg-lime/[0.06] hover:border-lime/50";
const titreEtape = "text-[11px] uppercase tracking-[0.22em] text-lime";
const champ = "mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-lime";

export default function Evaluateur({ familles, bouton }: { familles: Famille[]; bouton: string }) {
  const [mode, setMode] = useState<"fiche" | "questions">("fiche");
  const [texte, setTexte] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [analyse, setAnalyse] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [erreur, setErreur] = useState("");
  const [intitule, setIntitule] = useState("");
  const [taches, setTaches] = useState<Tache[]>([]);
  const [coches, setCoches] = useState<string[]>([]);
  const [contrat, setContrat] = useState<Contrat>("cdi");
  const [brut, setBrut] = useState("");
  const [periode, setPeriode] = useState<"mois" | "an">("mois");
  const [age, setAge] = useState<(typeof TRANCHES_AGE)[number]["id"]>("21-25");
  const [niveau, setNiveau] = useState<(typeof NIVEAUX)[number]["id"]>("bac3");
  const [effectif, setEffectif] = useState("");
  const [marketing, setMarketing] = useState("");
  const [voir, setVoir] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [envoi, setEnvoi] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const resultatRef = useRef<HTMLDivElement>(null);

  const parId = useMemo(() => Object.fromEntries(familles.map((f) => [f.id, f])), [familles]);

  const analyser = async () => {
    setAnalyse("loading");
    setErreur("");
    try {
      let corps: { texte?: string; pdf?: string } = { texte };
      if (fichier) {
        const nomF = fichier.name.toLowerCase();
        if (nomF.endsWith(".pdf")) corps = { pdf: await enBase64(fichier) };
        else if (nomF.endsWith(".docx")) {
          const mammoth = await import("mammoth/mammoth.browser.min.js");
          const { value } = await mammoth.extractRawText({ arrayBuffer: await fichier.arrayBuffer() });
          corps = { texte: value };
        } else corps = { texte: await fichier.text() };
      }
      const res = await fetch("/api/evaluer-poste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = (await res.json().catch(() => ({}))) as {
        erreur?: string;
        analyse?: {
          intitule: string;
          contrat: string;
          salaireBrutMensuel: number | null;
          taches: Tache[];
          pasUneFicheDePoste: boolean;
        };
      };
      if (!res.ok || !data.analyse) throw new Error(data.erreur || "illisible");
      if (data.analyse.pasUneFicheDePoste || data.analyse.taches.length === 0) throw new Error("illisible");
      const a = data.analyse;
      setIntitule(a.intitule);
      setTaches(a.taches);
      if (a.contrat === "cdi" || a.contrat === "cdd" || a.contrat === "alternance" || a.contrat === "stage") setContrat(a.contrat);
      if (a.salaireBrutMensuel) {
        setBrut(String(Math.round(a.salaireBrutMensuel)));
        setPeriode("mois");
      }
      setAnalyse("done");
    } catch (e) {
      setErreur(ERREURS[(e as Error).message] ?? ERREURS.illisible);
      setAnalyse("error");
    }
  };

  // Les familles retenues : celles des tâches lues, ou celles cochées.
  const famillesRetenues = useMemo(() => {
    const ids = mode === "fiche" ? [...new Set(taches.filter((t) => !t.presentiel).map((t) => t.famille))] : coches;
    return familles.filter((f) => ids.includes(f.id));
  }, [mode, taches, coches, familles]);

  const brutMensuel = (() => {
    const n = Number(brut.replace(/[\s  ]/g, "").replace(",", "."));
    if (!(n > 0)) return 0;
    return periode === "an" ? n / 12 : n;
  })();
  const coutPoste =
    contrat === "alternance"
      ? coutApprenti(age, niveau)
      : contrat === "stage"
        ? GRATIFICATION_STAGE
        : coutEmployeur(brutMensuel);

  const panier = famillesRetenues.filter((f) => f.verdict === "inclus" && f.prixBas != null);
  const premiereAnnee = panier.reduce(
    (s, f) => s + (f.unite === "ponctuel" ? (f.prixBas ?? 0) : f.unite === "mois" ? (f.prixBas ?? 0) * 12 : 0),
    0,
  );

  const eligibilite =
    marketing === "equipe"
      ? { ok: false, texte: "Vous avez déjà une équipe marketing : cette offre n'est pas faite pour vous, et je préfère vous le dire." }
      : effectif === "plus50"
        ? { ok: false, texte: "Au-delà de 50 salariés, la formule est sur devis : parlons-en." }
        : effectif === "moins10"
          ? { ok: true, texte: "La formule est pensée à partir de 10 salariés : parlons-en pour voir si elle vous convient." }
          : { ok: true, texte: "Votre entreprise correspond à la formule." };

  const pret =
    (mode === "fiche" ? analyse === "done" : coches.length > 0) &&
    effectif !== "" &&
    marketing !== "" &&
    (contrat === "alternance" || contrat === "stage" || brutMensuel > 0);

  const afficher = () => {
    setVoir(true);
    window.setTimeout(() => resultatRef.current?.focus(), 50);
  };

  const resume = () => {
    const lignes: string[] = [];
    if (intitule) lignes.push(`Poste : ${intitule}`);
    lignes.push(`Contrat : ${contrat.toUpperCase()}${brutMensuel ? `, ${Math.round(brutMensuel)} € brut/mois` : ""} → coût estimé ${euros(coutPoste)}/mois`);
    lignes.push(`Effectif : ${effectif} · Marketing aujourd'hui : ${marketing}`);
    if (mode === "fiche") taches.forEach((t) => lignes.push(`- ${t.libelle} [${parId[t.famille]?.nom ?? t.famille}${t.presentiel ? ", sur place" : ""}]`));
    else lignes.push(`Attendu : ${famillesRetenues.map((f) => f.nom).join(", ")}`);
    return lignes.join("\n");
  };

  const reserver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    setEnvoi("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Avant de recruter — ${entreprise.trim() || nom.trim()}`,
          from_name: "Évaluateur de poste — julientridat.com",
          replyto: email.trim(),
          Nom: nom.trim(),
          Email: email.trim(),
          Entreprise: entreprise.trim() || "—",
          Evaluation: resume(),
          Fiche: mode === "fiche" && !fichier ? texte.slice(0, 6000) : fichier ? `Fichier : ${fichier.name}` : "—",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      setEnvoi(data.success === true ? "done" : "failed");
    } catch {
      setEnvoi("failed");
    }
  };

  return (
    <div className="grid gap-5">
      {/* 1 — Le poste */}
      <fieldset className="rounded-3xl border border-line bg-card p-6 md:p-8">
        <legend className="sr-only">Le poste</legend>
        <p className={titreEtape}>1 · Le poste</p>
        <div className="mt-5 inline-flex rounded-full border border-line p-1" role="tablist">
          {(["fiche", "questions"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-foreground text-white" : "text-ink-2 hover:text-foreground"}`}
            >
              {m === "fiche" ? "Déposer ma fiche de poste" : "Répondre aux questions"}
            </button>
          ))}
        </div>

        {mode === "fiche" ? (
          <div className="mt-6 grid gap-4">
            <label className="text-sm font-medium text-foreground">
              Votre fiche ou votre annonce (PDF, Word ou texte)
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-sm text-ink-2 file:mr-4 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              />
            </label>
            {!fichier && (
              <label className="text-sm font-medium text-foreground">
                Ou collez son texte
                <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={6} className={champ} placeholder="Missions, profil, salaire…" />
              </label>
            )}
            <div>
              <button
                type="button"
                onClick={analyser}
                disabled={analyse === "loading" || (!fichier && texte.trim().length < 80)}
                className="rounded-full bg-lime px-6 py-3 text-[15px] font-medium text-white transition-opacity disabled:opacity-40"
              >
                {analyse === "loading" ? "Lecture de la fiche…" : "Analyser la fiche"}
              </button>
            </div>
            <div aria-live="polite">
              {analyse === "error" && <p className="text-[15px] text-ink-2">{erreur}</p>}
              {analyse === "done" && (
                <div>
                  <p className="text-[15px] text-ink-2">
                    {intitule ? <strong className="font-medium text-foreground">{intitule} : </strong> : null}
                    {taches.length} tâches lues dans votre fiche.
                  </p>
                  <ul className="mt-3 grid gap-2">
                    {taches.map((t, i) => {
                      const v = t.presentiel ? VERDICTS.sur_place : VERDICTS[parId[t.famille]?.verdict ?? "hors"];
                      return (
                        <li key={i} className="flex items-start justify-between gap-4 border-t border-line pt-2 text-[15px] text-foreground">
                          <span>
                            {t.libelle}
                            <span className="block text-[13px] text-ink-3">{parId[t.famille]?.nom}</span>
                          </span>
                          <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] ${v.classe}`}>{v.libelle}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-[15px] text-ink-2">Qu'attendez-vous de ce poste ? Cochez tout ce qui s'applique.</p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {familles.map((f) => (
                <label key={f.id} className={choix}>
                  <input
                    type="checkbox"
                    className="accent-[var(--lime)]"
                    checked={coches.includes(f.id)}
                    onChange={(e) => setCoches((c) => (e.target.checked ? [...c, f.id] : c.filter((x) => x !== f.id)))}
                  />
                  {f.nom}
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      {/* 2 — Le contrat */}
      <fieldset className="rounded-3xl border border-line bg-card p-6 md:p-8">
        <legend className="sr-only">Le contrat</legend>
        <p className={titreEtape}>2 · Le contrat</p>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-4">
          {([
            ["cdi", "CDI"],
            ["cdd", "CDD"],
            ["alternance", "Alternance"],
            ["stage", "Stage"],
          ] as const).map(([v, l]) => (
            <label key={v} className={choix}>
              <input type="radio" name="contrat" className="accent-[var(--lime)]" checked={contrat === v} onChange={() => setContrat(v)} />
              {l}
            </label>
          ))}
        </div>
        {(contrat === "cdi" || contrat === "cdd") && (
          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="text-sm font-medium text-foreground">
              Salaire brut affiché dans votre annonce
              <input inputMode="decimal" value={brut} onChange={(e) => setBrut(e.target.value)} className={champ} placeholder="Ex. 2 300" />
            </label>
            <div className="inline-flex rounded-full border border-line p-1">
              {(["mois", "an"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPeriode(p)} className={`rounded-full px-4 py-2 text-sm ${periode === p ? "bg-foreground text-white" : "text-ink-2"}`}>
                  {p === "mois" ? "par mois" : "par an"}
                </button>
              ))}
            </div>
          </div>
        )}
        {contrat === "alternance" && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">
              Âge de l'alternant
              <select value={age} onChange={(e) => setAge(e.target.value as typeof age)} className={champ}>
                {TRANCHES_AGE.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Diplôme préparé
              <select value={niveau} onChange={(e) => setNiveau(e.target.value as typeof niveau)} className={champ}>
                {NIVEAUX.map((n) => <option key={n.id} value={n.id}>{n.libelle}</option>)}
              </select>
            </label>
          </div>
        )}
      </fieldset>

      {/* 3 — L'entreprise */}
      <fieldset className="rounded-3xl border border-line bg-card p-6 md:p-8">
        <legend className="sr-only">Votre entreprise</legend>
        <p className={titreEtape}>3 · Votre entreprise</p>
        <p className="mt-5 text-[15px] font-medium text-foreground">Combien de salariés ?</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {([
            ["moins10", "Moins de 10"],
            ["10-50", "De 10 à 50"],
            ["plus50", "Plus de 50"],
          ] as const).map(([v, l]) => (
            <label key={v} className={choix}>
              <input type="radio" name="effectif" className="accent-[var(--lime)]" checked={effectif === v} onChange={() => setEffectif(v)} />
              {l}
            </label>
          ))}
        </div>
        <p className="mt-6 text-[15px] font-medium text-foreground">Qui s'occupe du marketing aujourd'hui ?</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {([
            ["personne", "Personne en particulier"],
            ["moi", "Moi, en plus du reste"],
            ["quelquun", "Quelqu'un, mais ce n'est pas son métier"],
            ["equipe", "Une équipe marketing"],
          ] as const).map(([v, l]) => (
            <label key={v} className={choix}>
              <input type="radio" name="marketing" className="accent-[var(--lime)]" checked={marketing === v} onChange={() => setMarketing(v)} />
              {l}
            </label>
          ))}
        </div>
        <div className="mt-7">
          <button
            type="button"
            onClick={afficher}
            disabled={!pret}
            className="rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-white transition-opacity disabled:opacity-40"
          >
            Voir la comparaison
          </button>
          {!pret && <p className="mt-2 text-[13px] text-ink-3">Complétez les trois étapes pour voir la comparaison.</p>}
        </div>
      </fieldset>

      {/* Résultat */}
      {voir && pret && (
        <div ref={resultatRef} tabIndex={-1} aria-live="polite" className="grid gap-5 outline-none">
          <div className={`rounded-3xl p-6 md:p-8 ${eligibilite.ok ? "bg-lime text-white" : "border border-line bg-card text-foreground"}`}>
            <p className="text-[11px] uppercase tracking-[0.22em] opacity-80">Éligibilité</p>
            <p className="mt-2 text-xl font-medium leading-snug">{eligibilite.texte}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-card p-6 md:p-8">
              <p className={titreEtape}>Ce que coûte le poste</p>
              <p className="mt-4 font-serif text-[clamp(2.6rem,6vw,3.6rem)] italic leading-none text-foreground">{euros(coutPoste)}</p>
              <p className="mt-2 text-[15px] text-ink-2">
                {contrat === "alternance"
                  ? "par mois en 1re année, aides déduites (estimation)."
                  : contrat === "stage"
                    ? "par mois de gratification minimale, à temps plein."
                    : "de coût employeur par mois, cotisations et réduction 2026 comprises (estimation Urssaf)."}
              </p>
              <p className="mt-5 border-t border-line pt-4 text-[15px] leading-relaxed text-ink-2">
                {contrat === "alternance" || contrat === "stage"
                  ? "Moins cher qu'un abonnement, c'est vrai. Mais c'est un junior, présent une partie du temps, qu'il faudra encadrer."
                  : coutPoste > ABONNEMENT_HT
                    ? `C'est ${euros(coutPoste - ABONNEMENT_HT)} de plus par mois que l'abonnement, pour un profil junior.`
                    : `C'est ${euros(ABONNEMENT_HT - coutPoste)} de moins par mois que l'abonnement, pour un profil junior qu'il faudra encadrer.`}
              </p>
            </div>

            <div className="rounded-3xl border border-line bg-card p-6 md:p-8">
              <p className={titreEtape}>Si le recrutement ne marche pas</p>
              {contrat === "alternance" ? (
                <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
                  Vous pouvez rompre librement pendant les {ESSAI_APPRENTI_JOURS} premiers jours en entreprise. <strong className="font-medium text-foreground">Ensuite, plus de retour en arrière</strong> avant la fin du contrat, sauf accord des deux parties, faute grave ou diplôme obtenu.
                </p>
              ) : contrat === "stage" ? (
                <p className="mt-4 text-[15px] leading-relaxed text-ink-2">Un stage s'arrête à sa date de fin : il faudra recruter de nouveau pour la suite.</p>
              ) : (
                <>
                  <p className="mt-4 font-serif text-[clamp(2.2rem,5vw,3rem)] italic leading-none text-foreground">{euros(coutPoste * ESSAI_EMPLOYE_MOIS)}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                    payés pendant les {ESSAI_EMPLOYE_MOIS} mois de période d'essai d'un employé, puis un recrutement à refaire : {RECRUTEMENT_SEMAINES} semaines en moyenne pour un poste de cadre (Apec, 2026). Sans compter votre temps.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-card p-6 md:p-8">
            <p className={titreEtape}>Les livrables de ce poste, chez des prestataires</p>
            <ul className="mt-4 grid gap-0">
              {famillesRetenues.map((f) => (
                <li key={f.id} className="grid gap-1 border-t border-line py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:gap-6">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-foreground">
                      {f.nom}
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] ${VERDICTS[f.verdict].classe}`}>{VERDICTS[f.verdict].libelle}</span>
                    </p>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{f.livraison}</p>
                  </div>
                  <div className="text-[14px] leading-relaxed text-ink-2">
                    {f.prixBas != null ? (
                      <>
                        <span className="font-medium text-foreground">{fourchette(f)}</span> · {f.prixLibelle}
                        <a href={f.sourceUrl} target="_blank" rel="noopener" className="ml-1 text-ink-3 underline decoration-line underline-offset-4 hover:text-lime">
                          {f.source}
                        </a>
                      </>
                    ) : (
                      <span className="text-ink-3">Pas de prix de marché fiable publié.</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {premiereAnnee > 0 && (
              <p className="mt-4 border-t border-line pt-4 text-[15px] leading-relaxed text-ink-2">
                Achetés à des prestataires, les livrables inclus dans l'abonnement coûteraient{" "}
                <strong className="font-medium text-foreground">au moins {euros(premiereAnnee)} HT la première année</strong>, en prenant le bas de chaque fourchette, sans compter ceux facturés à la journée.
              </p>
            )}
          </div>

          <div className="rounded-3xl bg-foreground p-6 text-white md:p-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-violet-soft">Avec moi</p>
            <p className="mt-3 font-serif text-[clamp(2.6rem,6vw,3.6rem)] italic leading-none">{euros(ABONNEMENT_HT)} HT</p>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/80">
              par mois, les livrables marqués « inclus » compris, chaque semaine, à date. Un sénior opérationnel tout de suite, 30 jours d'essai, et après trois mois, vous arrêtez et reprenez quand vous voulez.
            </p>

            {envoi === "done" || envoi === "failed" ? (
              <div className="mt-6">
                {envoi === "failed" && <p className="mb-3 text-sm text-white/75">Votre évaluation n'a pas pu partir : montrez-moi votre fiche pendant le rendez-vous.</p>}
                <div className="overflow-hidden rounded-2xl bg-white">
                  <iframe src={SCHEDULER_URL} title="Choisir un créneau" className="h-[640px] w-full" loading="lazy" />
                </div>
              </div>
            ) : (
              <form onSubmit={reserver} className="mt-6 grid gap-3 sm:grid-cols-3">
                <input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" aria-label="Votre nom" className="rounded-xl border border-white/20 bg-white/[0.06] px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/50 outline-none focus:border-violet-soft" />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre e-mail" aria-label="Votre e-mail" className="rounded-xl border border-white/20 bg-white/[0.06] px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/50 outline-none focus:border-violet-soft" />
                <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder="Votre entreprise" aria-label="Votre entreprise" className="rounded-xl border border-white/20 bg-white/[0.06] px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/50 outline-none focus:border-violet-soft" />
                <div className="sm:col-span-3">
                  <button type="submit" disabled={envoi === "sending"} className="rounded-full bg-white px-6 py-3 text-[15px] font-medium text-foreground transition-opacity disabled:opacity-50">
                    {envoi === "sending" ? "Envoi…" : `${bouton} →`}
                  </button>
                  <p className="mt-2 text-[13px] text-white/60">Votre évaluation m'est transmise avec votre demande, puis vous choisissez votre créneau.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
