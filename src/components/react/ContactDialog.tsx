import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTACT_EMAIL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  WEB3FORMS_ACCESS_KEY,
} from "@/lib/site";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Formulaire de contact classique (Nom, Email, Message) — îlot unique monté
 * par BaseLayout. S'ouvre au clic sur tout [data-open-contact].
 * Envoi : insert Supabase `contact_messages` (RLS insert-only) ; en cas d'échec,
 * repli sur un lien mailto pré-rempli pour ne jamais être un cul-de-sac.
 */
export default function ContactDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const triggerRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-open-contact]");
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

  const mailtoHref = () => {
    const subject = encodeURIComponent(`Contact site — ${name || "message"}`);
    const body = encodeURIComponent(
      `${message}\n\n— ${name}${company ? ` (${company})` : ""}\n${email}`,
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Requis";
    if (!EMAIL_RE.test(email.trim())) errs.email = "Email invalide";
    if (message.trim().length < 5) errs.message = "Votre message est un peu court";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("sending");

    // Notification par email (Web3Forms → CONTACT_EMAIL).
    const emailReq = fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `Nouveau message via julientridat.com — ${name.trim()}`,
        from_name: "Formulaire julientridat.com",
        replyto: email.trim(),
        // champs affichés dans l'email
        Nom: name.trim(),
        Email: email.trim(),
        Entreprise: company.trim() || "—",
        Message: message.trim(),
      }),
    });

    // Enregistrement (trace) dans Supabase.
    const dbReq = fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || null,
        message: message.trim(),
      }),
    });

    const [emailRes, dbRes] = await Promise.allSettled([emailReq, dbReq]);
    const ok = (r: PromiseSettledResult<Response>) =>
      r.status === "fulfilled" && r.value.ok;
    // Succès si l'email OU l'enregistrement passe ; échec seulement si les deux échouent.
    setStatus(ok(emailRes) || ok(dbRes) ? "done" : "error");
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
      aria-label="Écrivez-moi un message"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative max-h-[92vh] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-card shadow-2xl">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>

        {status === "done" ? (
          <div className="px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lime/15 text-2xl text-lime">✓</div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">Message envoyé.</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Merci {name.split(" ")[0]}. Je vous réponds au plus vite, en général sous 24-48 h.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-8 cursor-pointer rounded-full bg-lime px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-lime/90"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Contact</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Écrivez-moi un message
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Une question, un projet, une intervention ? Dites-moi tout — je réponds vite.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className={labelCls}>Nom</label>
                <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputCls} />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="c-email" className={labelCls}>Email</label>
                <input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} className={inputCls} />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-company" className={labelCls}>Entreprise <span className="font-normal text-white/40">(facultatif)</span></label>
                <input id="c-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-message" className={labelCls}>Message</label>
                <textarea id="c-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={2000} className={`${inputCls} resize-y`} />
                {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
              </div>
            </div>

            {status === "error" && (
              <p className="mt-4 text-sm text-white/70">
                L'envoi automatique n'a pas fonctionné.{" "}
                <a href={mailtoHref()} className="text-lime underline underline-offset-4">
                  Cliquez ici pour m'écrire directement
                </a>{" "}
                (votre message est déjà pré-rempli).
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-center text-[13px] text-white/45 hover:text-lime sm:text-left">
                ou {CONTACT_EMAIL}
              </a>
              <button
                type="submit"
                disabled={status === "sending"}
                className="cursor-pointer rounded-full bg-lime px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-lime/90 disabled:opacity-60"
              >
                {status === "sending" ? "Envoi…" : "Envoyer le message"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
