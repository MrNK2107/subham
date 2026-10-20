"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { formatINR, parseAmount } from "@/core/money";
import { extraFunctions } from "@/core/presets";
import { AI_LANGS, EVENT_TYPES, FOODS, TIERS, type AiLang, type Plan } from "@/core/types";
import { useI18n, type MessageKey } from "@/i18n";
import { savePlan } from "@/store/local";
import { localToday, postJson } from "@/ui/api";
import { saveNotice } from "@/ui/notice";
import {
  emptyDraft,
  fromPatch,
  toBrief,
  validateStep,
  withCity,
  withType,
  type Draft,
  type DraftErrors,
  type DraftField,
} from "./draft";
import { takePrefill } from "./prefill";
import styles from "./Wizard.module.css";

type Step = 1 | 2 | 3;
const FIELD_ORDER: DraftField[] = [
  "type",
  "functions",
  "title",
  "city",
  "date",
  "guests",
  "budget",
];

export function Wizard() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(lang));
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [prefilled, setPrefilled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState("");
  const [newFunction, setNewFunction] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    const patch = takePrefill();
    if (!patch) return;
    // Restoring a one-off hand-off from sessionStorage after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(fromPatch(patch, lang));
    setStep(patch.type ? 3 : 1);
    setPrefilled(true);
    // Only on first mount: later language switches must not wipe the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const today = localToday();

  function check(s: Step): boolean {
    const found = validateStep(draft, s, today);
    setErrors(found);
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return false;
    }
    return true;
  }

  function go(next: Step) {
    moved.current = true;
    setErrors({});
    setStep(next);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < 3) {
      if (check(step)) go((step + 1) as Step);
      return;
    }
    if (!check(3)) return;
    setBusy(true);
    setApiError("");
    const res = await postJson<{ plan: Plan; source: string; notice?: string }>("/api/plan", {
      brief: toBrief(draft),
      today,
    });
    if (!res.ok) {
      setBusy(false);
      setApiError(res.error || t(res.status ? "error.generic" : "error.network"));
      return;
    }
    savePlan(res.data.plan);
    if (res.data.notice) saveNotice(res.data.plan.id, res.data.notice);
    router.push(`/plan/${res.data.plan.id}`);
  }

  const err = (field: DraftField) => (errors[field] ? t(errors[field]) : undefined);
  const budgetValue = parseAmount(draft.budget);

  return (
    <div className={`container ${styles.wrap}`}>
      <h1 className={styles.title}>{t("wizard.title")}</h1>
      <p className={styles.progress}>
        {t("wizard.step", { n: step, total: 3 })}
        <span className={styles.bar} aria-hidden="true">
          <span className={styles[`fill${step}`]} />
        </span>
      </p>
      {prefilled && <p className="notice">{t("wizard.prefilled")}</p>}

      <form className="card" onSubmit={submit} noValidate>
        {step === 1 && (
          <fieldset className={styles.fieldset}>
            <legend>
              <h2 ref={heading} tabIndex={-1}>
                {t("wizard.step1")}
              </h2>
            </legend>
            <div className={styles.types} id="f-type" tabIndex={-1}>
              {EVENT_TYPES.map((type) => (
                <label key={type} className={styles.typeCard}>
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={draft.type === type}
                    onChange={() => setDraft((d) => withType(d, type, lang))}
                  />
                  <span>
                    <strong>{t(`type.${type}`)}</strong>
                    <span className="hint">{t(`type.${type}.hint` as MessageKey)}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="error-text" role="alert">
                {err("type")}
              </p>
            )}
          </fieldset>
        )}

        {step === 2 && (
          <div>
            <h2 ref={heading} tabIndex={-1}>
              {t("wizard.step2")}
            </h2>
            <p className="hint">{t("wizard.functionsHelp")}</p>
            <ul
              className={styles.chips}
              aria-label={t("wizard.step2")}
              id="f-functions"
              tabIndex={-1}
            >
              {draft.functions.map((fn) => (
                <li key={fn} className={styles.chip}>
                  <span>{fn}</span>
                  <button
                    type="button"
                    className={styles.chipRemove}
                    aria-label={t("wizard.removeFunction", { name: fn })}
                    onClick={() => update({ functions: draft.functions.filter((f) => f !== fn) })}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            {errors.functions && (
              <p className="error-text" role="alert">
                {err("functions")}
              </p>
            )}
            {draft.type && (
              <div className={styles.suggest}>
                <p className="label">{t("wizard.suggested")}</p>
                <div className={styles.suggestRow}>
                  {extraFunctions(draft.type, lang)
                    .filter((f) => !draft.functions.includes(f))
                    .map((fn) => (
                      <button
                        key={fn}
                        type="button"
                        className="btn btn-secondary btn-small"
                        disabled={draft.functions.length >= 8}
                        onClick={() => update({ functions: [...draft.functions, fn] })}
                      >
                        + {fn}
                      </button>
                    ))}
                </div>
              </div>
            )}
            <div className={styles.addRow}>
              <div className="field">
                <label htmlFor="new-function">{t("wizard.addFunction")}</label>
                <input
                  id="new-function"
                  value={newFunction}
                  maxLength={40}
                  placeholder={t("wizard.addFunctionPlaceholder")}
                  onChange={(e) => setNewFunction(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!newFunction.trim() || draft.functions.length >= 8}
                onClick={() => {
                  const name = newFunction.trim();
                  if (name && !draft.functions.includes(name)) {
                    update({ functions: [...draft.functions, name] });
                  }
                  setNewFunction("");
                }}
              >
                {t("wizard.add")}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 ref={heading} tabIndex={-1}>
              {t("wizard.step3")}
            </h2>
            <div className={styles.grid}>
              <Field id="title" label={t("field.title")} error={err("title")}>
                <input
                  value={draft.title}
                  maxLength={80}
                  placeholder={t("field.titlePlaceholder")}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </Field>
              <Field id="city" label={t("field.city")} error={err("city")}>
                <input
                  value={draft.city}
                  maxLength={60}
                  autoComplete="address-level2"
                  placeholder={t("field.cityPlaceholder")}
                  onChange={(e) => setDraft((d) => withCity(d, e.target.value))}
                />
              </Field>
              <Field id="tier" label={t("field.tier")} hint={t("field.tierHint")}>
                <select
                  value={draft.tier}
                  onChange={(e) =>
                    update({ tier: e.target.value as Draft["tier"], tierChosen: true })
                  }
                >
                  {TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {t(`tier.${tier}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="date" label={t("field.date")} error={err("date")}>
                <input
                  type="date"
                  value={draft.date}
                  min={today}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </Field>
              <Field id="guests" label={t("field.guests")} error={err("guests")}>
                <input
                  inputMode="numeric"
                  value={draft.guests}
                  onChange={(e) => update({ guests: e.target.value })}
                />
              </Field>
              <Field
                id="budget"
                label={t("field.budget")}
                hint={
                  budgetValue
                    ? t("field.budgetPreview", { amount: formatINR(budgetValue) })
                    : t("field.budgetHint")
                }
                error={err("budget")}
              >
                <input value={draft.budget} onChange={(e) => update({ budget: e.target.value })} />
              </Field>
              <fieldset className={styles.fieldset}>
                <legend className="label">{t("field.food")}</legend>
                <div className={styles.radios}>
                  {FOODS.map((food) => (
                    <label key={food} className={styles.radio}>
                      <input
                        type="radio"
                        name="food"
                        checked={draft.food === food}
                        onChange={() => update({ food })}
                      />
                      {t(`food.${food}`)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field id="language" label={t("field.language")} hint={t("field.languageHint")}>
                <select
                  value={draft.language}
                  onChange={(e) => update({ language: e.target.value as AiLang })}
                >
                  {Object.entries(AI_LANGS).map(([code, l]) => (
                    <option key={code} value={code} lang={code}>
                      {l.native} {code !== "en" ? `(${l.name})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="vibe" label={t("field.vibe")} wide>
                <input
                  value={draft.vibe}
                  maxLength={80}
                  placeholder={t("field.vibePlaceholder")}
                  onChange={(e) => update({ vibe: e.target.value })}
                />
              </Field>
            </div>
          </div>
        )}

        {apiError && (
          <p className="error-text" role="alert">
            {apiError}
          </p>
        )}

        <div className={styles.nav}>
          {step > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => go((step - 1) as Step)}
            >
              {t("wizard.back")}
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {step < 3 ? t("wizard.next") : t("wizard.create")}
          </button>
        </div>
      </form>

      {busy && (
        <div className={styles.overlay} role="status" aria-live="polite">
          <div className={`card ${styles.overlayCard}`}>
            <span className={styles.spinner} aria-hidden="true" />
            <p className={styles.overlayTitle}>{t("wizard.creating")}</p>
            <p className="hint">{t("wizard.creatingHint")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode & { props?: Record<string, unknown> };
}

/** Label, hint and error wired to the input through id and aria-describedby. */
function Field({ id, label, hint, error, wide, children }: FieldProps) {
  const inputId = `f-${id}`;
  const described = [hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean);
  const child = children as React.ReactElement<Record<string, unknown>>;
  return (
    <div className={`field ${wide ? styles.wide : ""}`}>
      <label htmlFor={inputId}>{label}</label>
      <child.type
        {...child.props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={described.length ? described.join(" ") : undefined}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
