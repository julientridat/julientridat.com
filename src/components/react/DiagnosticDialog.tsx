import { useCallback, useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL, WEB3FORMS_ACCESS_KEY } from "@/lib/site";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type ChoiceQuestion = {
  readonly kind: "choice";
  readonly key: string;
  readonly label: string;
  readonly options: readonly string[];
};

type TextQuestion = {
  readonly kind: "text";
  readonly key: string;
  readonly label: string;
  readonly placeholder: string;
  readonly maxLength: number;
};

type Question = ChoiceQuestion | TextQuestion;

/**
 * Les 8 questions du diagnostic.
 * `key` = intitulé de la clé envoyée à Web3Forms : premier niveau, numérotée,
 * lisible telle quelle dans l'email (Web3Forms rend mal les objets imbriqués).
 */
const QUESTIONS: readonly Question[] = [
  {
    kind: "choice",
    key: "1. Chiffre d'affaires",
    label: "Où en est votre chiffre d'affaires ?",
    options: [
      "Moins de 1 M€",
      "Entre 1 et 3 M€",
      "Entre 3 et 10 M€",
      "Plus de 10 M€",
    ],
  },
  {
    kind: "choice",
    key: "2. Marketing et communication",
    label: "Qui s'occupe du marketing et de la communication chez vous ?",
    options: [
      "Personne en particulier, ça se fait au fil de l'eau",
      "Moi, en plus du reste",
      "Quelqu'un en interne, mais ce n'est pas son métier",
      "Une agence ou un freelance externe",
    ],
  },
  {
    kind: "choice",
    key: "3. Accès aux documents et aux données",
    label:
      "Quand un service a besoin d'un document, d'un chiffre ou d'un fichier, ça se passe comment ?",
    options: [
      "On sait où chercher, c'est carré",
      "Ça dépend de qui on demande",
      "Chacun a ses fichiers dans son coin",
      "Honnêtement, c'est le désordre",
    ],
  },
  {
    kind: "choice",
    key: "4. Usage de l'IA aujourd'hui",
    label: "Et l'intelligence artificielle, dans votre entreprise aujourd'hui ?",
    options: [
      "Personne ne s'en sert",
      "Certains bricolent chacun de leur côté",
      "On a testé, ça n'a rien donné de durable",
      "On a des usages installés qui tournent",
    ],
  },
  {
    kind: "choice",
    key: "5. Priorité des six prochains mois",
    label: "Si vous deviez régler une seule chose dans les six prochains mois ?",
    options: [
      "Être visible et crédible quand on nous cherche",
      "Donner de vrais outils aux commerciaux",
      "Remettre de l'ordre dans notre façon de travailler",
      "Faire monter les équipes en compétence",
    ],
  },
  {
    kind: "choice",
    key: "6. Ce qui a retenu jusqu'ici",
    label: "Qu'est-ce qui vous a retenu jusqu'ici ?",
    options: [
      "Le temps",
      "Ne pas savoir par où commencer",
      "Une mauvaise expérience avec un prestataire",
      "Le budget",
    ],
  },
  {
    kind: "choice",
    key: "7. Type d'accompagnement recherché",
    label: "Vous cherchez plutôt quoi ?",
    options: [
      "Quelqu'un qui exécute ce que je demande",
      "Quelqu'un qui décide avec moi et qui exécute",
      "Je ne sais pas encore",
    ],
  },
  {
    kind: "text",
    key: "8. Ce qui agace le plus",
    label:
      "En une phrase : qu'est-ce qui vous agace le plus, aujourd'hui, dans votre façon de vous faire connaître et de vendre ?",
    placeholder: "Dites-le avec vos mots…",
    maxLength: 1200,
  },
];

const TOTAL = QUESTIONS.length;
const emptyAnswers = (): string[] => QUESTIONS.map(() => "");

type Status = "idle" | "sending" | "done" | "error";

/**
 * Questionnaire de diagnostic en 8 questions — îlot unique monté par BaseLayout.
 * S'ouvre au clic sur tout [data-open-diagnostic] (délégation d'événement :
 * les sections de page restent 100 % statiques).
 * Envoi : Web3Forms (email vers CONTACT_EMAIL), 8 clés de premier niveau ;
 * en cas d'échec, repli sur un mailto pré-rempli pour ne jamais être un cul-de-sac.
 */
export default function DiagnosticDialog() {
  const [open, setOpen] = useState(false);
  // 0…TOTAL-1 : les questions. TOTAL : l'écran d'identité.
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(emptyAnswers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [botcheck, setBotcheck] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");

  const triggerRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const stepRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<Status>("idle");
  // Le focus initial revient au bouton Fermer (comme les autres dialogues) :
  // on ne déplace le focus sur l'étape qu'à partir du 1er changement d'étape.
  const skipStepFocusRef = useRef(true);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-open-diagnostic]");
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
    setErrors({});
    // Après un envoi réussi, on repart d'un questionnaire vierge à la réouverture.
    if (statusRef.current === "done") {
      setStepIndex(0);
      setAnswers(emptyAnswers());
      setName("");
      setEmail("");
      setCompany("");
    }
    setStatus("idle");
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

  // À chaque changement d'étape (et à l'écran de confirmation), le focus passe
  // sur le bloc concerné : le lecteur d'écran annonce la nouvelle question.
  const focusKey = status === "done" ? "done" : String(stepIndex);
  useEffect(() => {
    if (!open) {
      skipStepFocusRef.current = true;
      return;
    }
    if (skipStepFocusRef.current) {
      skipStepFocusRef.current = false;
      return;
    }
    stepRef.current?.focus();
  }, [open, focusKey]);

  const answerAt = (index: number) => answers[index] ?? "";

  const setAnswerAt = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const goTo = (index: number) => {
    setErrors({});
    setStatus("idle");
    setStepIndex(Math.max(0, Math.min(TOTAL, index)));
  };

  const subject = () => {
    const who = name.trim() || "sans nom";
    const where = company.trim();
    return where ? `Diagnostic — ${who} (${where})` : `Diagnostic — ${who}`;
  };

  const mailtoHref = () => {
    const lines = QUESTIONS.map((q, i) => `${q.key}\n${answerAt(i).trim() || "—"}`);
    const body = encodeURIComponent(
      `${lines.join("\n\n")}\n\n— ${name.trim()}${company.trim() ? ` (${company.trim()})` : ""}\n${email.trim()}`,
    );
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject())}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Requis";
    if (!EMAIL_RE.test(email.trim())) errs.email = "Email invalide";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("sending");

    // 8 clés de premier niveau, numérotées et lisibles dans l'email reçu.
    const payload: Record<string, string> = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: subject(),
      from_name: "Questionnaire diagnostic — julientridat.com",
      replyto: email.trim(),
      botcheck,
      Nom: name.trim(),
      Email: email.trim(),
      Entreprise: company.trim() || "—",
    };
    QUESTIONS.forEach((q, i) => {
      payload[q.key] = answerAt(i).trim() || "—";
    });

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await res.json();
      // « Envoyé » uniquement si Web3Forms confirme success === true.
      const ok =
        typeof data === "object" &&
        data !== null &&
        (data as { success?: unknown }).success === true;
      setStatus(ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (!open) return null;

  const inputCls =
    "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-lime";
  const labelCls = "text-sm font-medium text-foreground";
  const backCls =
    "w-full cursor-pointer rounded-full px-6 py-3 text-sm text-ink-2 transition-colors hover:text-foreground sm:w-auto";
  const primaryCls =
    "w-full cursor-pointer rounded-full bg-lime px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-lime/90 disabled:opacity-60 sm:w-auto";

  const question = stepIndex < TOTAL ? QUESTIONS[stepIndex] : undefined;
  const progress = Math.round((Math.min(stepIndex, TOTAL) / TOTAL) * 100);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostic-title"
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
          <div
            ref={stepRef}
            tabIndex={-1}
            className="px-6 py-12 text-center outline-none sm:px-12 sm:py-16"
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lime/15 text-2xl text-lime">✓</div>
            <h2 id="diagnostic-title" className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              Réponses envoyées.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              Merci {name.trim().split(" ")[0] ?? ""}. Je lis vos réponses moi-même et je reviens vers
              vous, en général sous 24-48 h.
            </p>
            <button type="button" onClick={close} className="mt-8 cursor-pointer rounded-full bg-lime px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-lime/90">
              Fermer
            </button>
          </div>
        ) : question ? (
          <div ref={stepRef} tabIndex={-1} className="px-6 py-8 outline-none sm:px-10 sm:py-10">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-3">Diagnostic</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-lime transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="shrink-0 text-xs text-ink-3">
                Question {stepIndex + 1} sur {TOTAL}
              </span>
            </div>

            <h2
              id="diagnostic-title"
              className="mt-5 text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl"
            >
              {question.label}
            </h2>

            {question.kind === "choice" ? (
              <>
                <div className="mt-6 flex flex-col gap-2.5">
                  {question.options.map((option) => {
                    const selected = answerAt(stepIndex) === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setAnswerAt(stepIndex, option);
                          goTo(stepIndex + 1);
                        }}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${
                          selected
                            ? "border-lime bg-lime/10 text-foreground"
                            : "border-line bg-transparent text-foreground hover:border-lime/50 hover:bg-secondary"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] ${
                            selected ? "border-lime bg-lime text-white" : "border-line text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {stepIndex > 0 && (
                  <div className="mt-8">
                    <button type="button" onClick={() => goTo(stepIndex - 1)} className={backCls}>
                      ← Retour
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-2">Facultatif — passez si vous préférez.</p>
                <label htmlFor="d-free" className="sr-only">
                  {question.label}
                </label>
                <textarea
                  id="d-free"
                  value={answerAt(stepIndex)}
                  onChange={(e) => setAnswerAt(stepIndex, e.target.value)}
                  placeholder={question.placeholder}
                  rows={5}
                  maxLength={question.maxLength}
                  className={`${inputCls} resize-y`}
                />
                <p className="mt-1 text-right text-xs text-ink-3">
                  {answerAt(stepIndex).length} / {question.maxLength}
                </p>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => goTo(stepIndex - 1)} className={backCls}>
                    ← Retour
                  </button>
                  <button type="button" onClick={() => goTo(stepIndex + 1)} className={primaryCls}>
                    Continuer
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-10 sm:py-10">
            <div ref={stepRef} tabIndex={-1} className="outline-none">
              <p className="text-xs uppercase tracking-[0.18em] text-ink-3">Diagnostic</p>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-full rounded-full bg-lime" />
                </div>
                <span className="shrink-0 text-xs text-ink-3">Dernière étape</span>
              </div>

              <h2
                id="diagnostic-title"
                className="mt-5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                À qui j'envoie ma réponse ?
              </h2>
              <p className="mt-2 text-sm text-ink-2">
                Vos 8 réponses partent directement dans ma boîte mail. Je les lis moi-même.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="d-name" className={labelCls}>Nom</label>
                <input
                  id="d-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  className={inputCls}
                />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="d-email" className={labelCls}>Email</label>
                <input
                  id="d-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={200}
                  autoComplete="email"
                  className={inputCls}
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="d-company" className={labelCls}>
                  Entreprise <span className="font-normal text-ink-3">(facultatif)</span>
                </label>
                <input
                  id="d-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={160}
                  autoComplete="organization"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Honeypot — invisible pour les humains, rempli par les robots. */}
            <input
              type="text"
              name="botcheck"
              value={botcheck}
              onChange={(e) => setBotcheck(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              style={{ display: "none" }}
            />

            {status === "error" && (
              <p className="mt-4 text-sm text-ink-2">
                L'envoi automatique n'a pas fonctionné.{" "}
                <a href={mailtoHref()} className="text-lime underline underline-offset-4">
                  Cliquez ici pour m'écrire directement
                </a>{" "}
                (vos réponses sont déjà pré-remplies).
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => goTo(TOTAL - 1)} className={backCls}>
                ← Retour
              </button>
              <button type="submit" disabled={status === "sending"} className={primaryCls}>
                {status === "sending" ? "Envoi…" : "Envoyer mes réponses"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
