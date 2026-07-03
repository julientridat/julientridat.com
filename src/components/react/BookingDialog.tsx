import { useCallback, useEffect, useRef, useState } from "react";
import {
  SCHEDULER_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/site";

const COMPANY_SIZES = ["1 (solo)", "2-10", "11-50", "51-200", "200+"] as const;
const AI_TOOLS = ["ChatGPT", "Claude", "Gemini", "Copilot", "Autre"] as const;

const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;

type Step = "intro" | "qualify" | "schedule";

/**
 * Dialogue de réservation d'audit — îlot unique monté par BaseLayout.
 * S'ouvre au clic sur n'importe quel élément portant [data-open-booking]
 * (délégation d'événement : les sections restent 100 % statiques).
 */
export default function BookingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [loaded, setLoaded] = useState(false);

  const [company, setCompany] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [aiTools, setAiTools] = useState<string[]>([]);
  const [aiToolsOther, setAiToolsOther] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-open-booking]");
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
    setStep("intro");
    setLoaded(false);
    setErrors({});
    setSubmitError(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Le contenu de page devient inerte : le focus clavier reste dans le dialogue.
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

  const toggleTool = (tool: string) => {
    setAiTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(false);

    const errs: Record<string, string> = {};
    if (!company.trim() || company.trim().length > 200) errs.company = "Requis";
    if (!companySize) errs.company_size = "Requis";
    if (!companyUrl.trim() || !URL_RE.test(companyUrl.trim())) errs.company_url = "URL invalide";
    if (aiTools.length === 0) errs.ai_tools = "Sélectionnez au moins un outil";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/lead_qualifications`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          company: company.trim(),
          company_size: companySize,
          company_url: companyUrl.trim(),
          ai_tools: aiTools,
          ai_tools_other: aiTools.includes("Autre") && aiToolsOther.trim() ? aiToolsOther.trim() : null,
        }),
      });
      if (!res.ok) throw new Error(`Supabase ${res.status}`);
      setStep("schedule");
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const inputCls =
    "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-lime";
  const labelCls = "text-sm font-medium text-foreground";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Réservez votre diagnostic IA"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative max-h-[92vh] w-[calc(100vw-1rem)] max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-card shadow-2xl">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>

        {step === "intro" && (
          <div className="px-6 py-10 sm:px-12 sm:py-14">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Diagnostic IA</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Réservez un échange de 30 minutes
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
              On fait le point sur vos enjeux, je vous partage des pistes concrètes pour
              intégrer l'IA dans vos process. Gratuit, sans engagement.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                "30 minutes",
                "En visio — lien envoyé après réservation",
                "Créneaux disponibles cette semaine",
                "Une rapide qualification, puis le créneau",
              ].map((label) => (
                <li key={label} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lime">✓</span>
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep("qualify")}
                className="w-full cursor-pointer rounded-full bg-lime px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-lime/90 sm:w-auto"
              >
                Commencer
              </button>
              <button
                type="button"
                onClick={close}
                className="w-full cursor-pointer rounded-full px-6 py-3 text-sm text-white/70 transition-colors hover:text-white sm:w-auto"
              >
                Plus tard
              </button>
            </div>
          </div>
        )}

        {step === "qualify" && (
          <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Étape 1 / 2</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Quelques infos pour préparer l'échange
            </h2>
            <p className="mt-2 text-sm text-white/60">Tous les champs sont obligatoires.</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="company" className={labelCls}>Nom de l'entreprise</label>
                <input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={200}
                  className={inputCls}
                />
                {errors.company && <p className="mt-1 text-xs text-destructive">{errors.company}</p>}
              </div>

              <div>
                <label htmlFor="company_size" className={labelCls}>Taille</label>
                <select
                  id="company_size"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className={`${inputCls} appearance-none`}
                >
                  <option value="" disabled>Sélectionner…</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                {errors.company_size && <p className="mt-1 text-xs text-destructive">{errors.company_size}</p>}
              </div>

              <div>
                <label htmlFor="company_url" className={labelCls}>Site web</label>
                <input
                  id="company_url"
                  placeholder="exemple.com"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  maxLength={500}
                  className={inputCls}
                />
                {errors.company_url && <p className="mt-1 text-xs text-destructive">{errors.company_url}</p>}
              </div>

              <div className="sm:col-span-2">
                <span className={labelCls}>Outils IA déjà utilisés</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AI_TOOLS.map((tool) => {
                    const checked = aiTools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleTool(tool)}
                        aria-pressed={checked}
                        className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                          checked
                            ? "border-lime bg-lime text-black"
                            : "border-white/20 bg-transparent text-white hover:bg-white/10"
                        }`}
                      >
                        {checked && "✓"}
                        {tool}
                      </button>
                    );
                  })}
                </div>
                {errors.ai_tools && <p className="mt-1 text-xs text-destructive">{errors.ai_tools}</p>}
                {aiTools.includes("Autre") && (
                  <input
                    placeholder="Précisez…"
                    value={aiToolsOther}
                    onChange={(e) => setAiToolsOther(e.target.value)}
                    maxLength={200}
                    className={`${inputCls} mt-3`}
                  />
                )}
              </div>
            </div>

            {submitError && (
              <p className="mt-4 text-sm text-destructive">Erreur lors de l'envoi. Réessayez.</p>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("intro")}
                className="w-full cursor-pointer rounded-full px-6 py-3 text-sm text-white/70 transition-colors hover:text-white sm:w-auto"
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full cursor-pointer rounded-full bg-lime px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-lime/90 disabled:opacity-60 sm:w-auto"
              >
                {submitting ? "Envoi…" : "Voir les créneaux"}
              </button>
            </div>
          </form>
        )}

        {step === "schedule" && (
          <div className="px-3 py-3 sm:px-5 sm:py-5">
            <div className="relative overflow-hidden rounded-xl border border-white/15 bg-white shadow-inner">
              {!loaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600" />
                    <p className="text-xs text-neutral-500">Chargement du planning…</p>
                  </div>
                </div>
              )}
              <iframe
                src={SCHEDULER_URL}
                title="Réserver un diagnostic IA"
                onLoad={() => setLoaded(true)}
                className="block h-[min(78vh,720px)] w-full"
                style={{ border: 0 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
