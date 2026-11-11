import { useCallback, useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL, WEB3FORMS_ACCESS_KEY } from "@/lib/site";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const MOMENTS = ["Matin", "Midi", "Après-midi"];

/**
 * « Une question avant ? » — demande de rappel (Julien, 11/11/2026).
 * Remplace le lien vers Google Agenda : le visiteur laisse son numéro et ses
 * disponibilités, Julien le rappelle. S'ouvre au clic sur tout [data-open-rappel].
 * Envoi : Web3Forms vers CONTACT_EMAIL ; en cas d'échec, repli sur un e-mail
 * pré-rempli. Aucun délai de rappel n'est affiché : Julien ne l'a pas fixé.
 */
export default function RappelDialog() {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [jours, setJours] = useState<string[]>([]);
  const [moments, setMoments] = useState<string[]>([]);
  const [precision, setPrecision] = useState("");
  const [question, setQuestion] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const triggerRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-open-rappel]");
      if (target) {
        e.preventDefault();
        triggerRef.current = target;
        setOpen(true);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setStatus("idle");
    setErrors({});
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const page = document.querySelector("main");
    page?.setAttribute("inert", "");
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      page?.removeAttribute("inert");
      triggerRef.current?.focus();
    };
  }, [open, close]);

  const basculer = (liste: string[], definir: (v: string[]) => void, valeur: string) =>
    definir(liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur]);

  const disponibilites = () =>
    [jours.join(", "), moments.join(", "), precision.trim()].filter(Boolean).join(" · ");

  const mailtoHref = () => {
    const subject = encodeURIComponent(`Demande de rappel — ${nom.trim() || "site"}`);
    const body = encodeURIComponent(
      [
        `Nom : ${nom.trim()}`,
        `Téléphone : ${telephone.trim()}`,
        `Entreprise : ${entreprise.trim() || "—"}`,
        `Disponibilités : ${disponibilites() || "—"}`,
        `Question : ${question.trim() || "—"}`,
      ].join("\n"),
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!nom.trim()) errs.nom = "Requis";
    const chiffres = telephone.replace(/\D/g, "").length;
    if (chiffres < 9 || chiffres > 15) errs.telephone = "Numéro invalide";
    if (!((jours.length > 0 && moments.length > 0) || precision.trim().length >= 3)) {
      errs.dispos = "Choisissez au moins un jour et un moment, ou précisez vos disponibilités";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("sending");
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `Demande de rappel — ${nom.trim()} — ${telephone.trim()}`,
        from_name: "Formulaire julientridat.com",
        // champs affichés dans l'e-mail
        Nom: nom.trim(),
        Téléphone: telephone.trim(),
        Entreprise: entreprise.trim() || "—",
        Jours: jours.join(", ") || "—",
        Moments: moments.join(", ") || "—",
        Précision: precision.trim() || "—",
        Question: question.trim() || "—",
        Page: typeof window !== "undefined" ? window.location.pathname : "—",
      }),
    }).catch(() => null);
    setStatus(res?.ok ? "done" : "error");
  };

  if (!open) return null;

  const inputCls =
    "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-lime";
  const labelCls = "text-sm font-medium text-foreground";
  const puce = (actif: boolean) =>
    `flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
      actif ? "border-lime bg-lime text-white" : "border-line bg-transparent text-foreground hover:bg-secondary"
    }`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Demandez à être rappelé"
    >
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={close} />
      <div className="relative max-h-[92vh] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto rounded-2xl border border-line bg-card shadow-2xl">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full text-ink-3 transition-colors hover:bg-secondary hover:text-foreground"
        >
          ✕
        </button>

        {status === "done" ? (
          <div className="px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lime/15 text-2xl text-lime">✓</div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">C'est noté.</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              Merci {nom.trim().split(" ")[0]}. Je vous rappelle au {telephone.trim()}, sur l'un des créneaux indiqués.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-8 cursor-pointer rounded-full bg-lime px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-lime/90"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-10 sm:py-10" noValidate>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-3">Une question avant&nbsp;?</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Demandez à être rappelé
            </h2>
            <p className="mt-2 text-sm text-ink-2">
              Laissez votre numéro et vos disponibilités. Je vous rappelle pour répondre à vos questions.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="r-nom" className={labelCls}>Nom</label>
                <input id="r-nom" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={120} className={inputCls} />
                {errors.nom && <p className="mt-1 text-xs text-destructive">{errors.nom}</p>}
              </div>
              <div>
                <label htmlFor="r-tel" className={labelCls}>Téléphone</label>
                <input id="r-tel" type="tel" inputMode="tel" autoComplete="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} maxLength={30} className={inputCls} />
                {errors.telephone && <p className="mt-1 text-xs text-destructive">{errors.telephone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="r-entreprise" className={labelCls}>Entreprise <span className="font-normal text-ink-3">(facultatif)</span></label>
                <input id="r-entreprise" autoComplete="organization" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} maxLength={160} className={inputCls} />
              </div>

              <fieldset className="sm:col-span-2">
                <legend className={labelCls}>Quand vous joindre&nbsp;?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {JOURS.map((j) => (
                    <button key={j} type="button" aria-pressed={jours.includes(j)} onClick={() => basculer(jours, setJours, j)} className={puce(jours.includes(j))}>
                      {jours.includes(j) && "✓"}
                      {j}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MOMENTS.map((m) => (
                    <button key={m} type="button" aria-pressed={moments.includes(m)} onClick={() => basculer(moments, setMoments, m)} className={puce(moments.includes(m))}>
                      {moments.includes(m) && "✓"}
                      {m}
                    </button>
                  ))}
                </div>
                <label htmlFor="r-precision" className="sr-only">Précisez vos disponibilités</label>
                <input
                  id="r-precision"
                  placeholder="Ou précisez : « mardi après 14 h »"
                  value={precision}
                  onChange={(e) => setPrecision(e.target.value)}
                  maxLength={200}
                  className={inputCls}
                />
                {errors.dispos && <p className="mt-1 text-xs text-destructive">{errors.dispos}</p>}
              </fieldset>

              <div className="sm:col-span-2">
                <label htmlFor="r-question" className={labelCls}>Votre question <span className="font-normal text-ink-3">(facultatif)</span></label>
                <textarea id="r-question" value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} maxLength={1500} className={`${inputCls} resize-y`} />
              </div>
            </div>

            {status === "error" && (
              <p className="mt-4 text-sm text-ink-2">
                L'envoi automatique n'a pas fonctionné.{" "}
                <a href={mailtoHref()} className="text-lime underline underline-offset-4">
                  Cliquez ici pour m'écrire directement
                </a>{" "}
                (votre demande est déjà pré-remplie).
              </p>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full cursor-pointer rounded-full bg-lime px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-lime/90 disabled:opacity-60 sm:w-auto"
              >
                {status === "sending" ? "Envoi…" : "Être rappelé"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
