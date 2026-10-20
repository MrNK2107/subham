"use client";

import { motion, useReducedMotion } from "motion/react";
import { Icon } from "@/ui/common/Icon";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { describeChange } from "@/core/changes";
import { AI_LANGS, type Change, type Plan } from "@/core/types";
import { useI18n } from "@/i18n";
import { postJson } from "@/ui/api";
import type { PlanActions } from "@/ui/dashboard/Dashboard";
import styles from "./Assistant.module.css";

type ProposalState = "pending" | "applied" | "dismissed" | "failed";
interface Proposal {
  change: Change;
  state: ProposalState;
  reason?: string;
}
interface Message {
  role: "user" | "assistant";
  text: string;
  proposals?: Proposal[];
}

interface SpeechResultEvent {
  results: { 0: { transcript: string } }[];
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function speechApi(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Props {
  plan: Plan;
  actions: PlanActions;
  open: boolean;
  onOpenChange(open: boolean): void;
  seed: string | null;
  onSeedUsed(): void;
}

/** Chat that proposes plan changes; each one applies only when the person approves it. */
export function Assistant({ plan, actions, open, onOpenChange, seed, onSeedUsed }: Props) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const recognition = useRef<Recognition | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    // Feature detection has to wait for the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanSpeak(Boolean(speechApi()));
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView?.({ block: "nearest" });
  }, [messages]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    const history: Message[] = [...messages, { role: "user", text: message }];
    setMessages(history);
    setInput("");
    setBusy(true);
    setError("");
    const res = await postJson<{ reply: string; changes: Change[] }>("/api/assistant", {
      plan,
      messages: history.slice(-20).map(({ role, text: body }) => ({ role, text: body })),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || t(res.status ? "error.generic" : "error.network"));
      return;
    }
    setMessages([
      ...history,
      {
        role: "assistant",
        text: res.data.reply,
        proposals: res.data.changes.map((change) => ({ change, state: "pending" })),
      },
    ]);
  }

  useEffect(() => {
    if (open && seed) {
      onSeedUsed();
      // A message handed over by another tab (e.g. "rebalance my budget"); sending is the intent.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void send(seed);
    }
    // send is recreated each render; the seed is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed]);

  function setProposal(mi: number, pi: number, state: ProposalState, reason?: string) {
    setMessages((all) =>
      all.map((m, i) =>
        i === mi
          ? {
              ...m,
              proposals: m.proposals?.map((p, j) => (j === pi ? { ...p, state, reason } : p)),
            }
          : m,
      ),
    );
  }

  function apply(mi: number, pi: number) {
    const proposal = messages[mi]?.proposals?.[pi];
    if (!proposal) return;
    const failed = actions.apply(proposal.change);
    setProposal(mi, pi, failed ? "failed" : "applied", failed ?? undefined);
  }

  function listen() {
    const Api = speechApi();
    if (!Api) return;
    if (listening) return recognition.current?.stop();
    const rec = new Api();
    rec.lang = AI_LANGS[plan.brief.language].bcp47;
    rec.interimResults = false;
    rec.onresult = (e) => setInput((v) => `${v} ${e.results[0]?.[0].transcript ?? ""}`.trim());
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognition.current = rec;
    setListening(true);
    rec.start();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  if (!open) {
    return (
      <button
        type="button"
        className={`btn btn-primary ${styles.fab} no-print`}
        onClick={() => onOpenChange(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 5h16v11H8l-4 4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        {t("assistant.open")}
      </button>
    );
  }

  return (
    <motion.aside
      className={`${styles.panel} no-print`}
      aria-labelledby="assistant-title"
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <div className={styles.head}>
        <h2 id="assistant-title">{t("assistant.title")}</h2>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          aria-label={t("assistant.close")}
          onClick={() => onOpenChange(false)}
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <ol className={styles.log} ref={logRef} aria-live="polite" aria-relevant="additions">
        <li className={styles.bot}>
          <span className="sr-only">{t("assistant.bot")}: </span>
          {t("assistant.welcome")}
        </li>
        {messages.map((m, mi) => (
          <motion.li
            key={mi}
            className={m.role === "user" ? styles.user : styles.bot}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
          >
            <span className="sr-only">
              {m.role === "user" ? t("assistant.you") : t("assistant.bot")}:{" "}
            </span>
            <p className={styles.text}>{m.text}</p>
            {m.proposals && m.proposals.length > 0 && (
              <div role="group" aria-label={t("assistant.proposed")} className={styles.proposals}>
                <p className={styles.proposedTitle}>{t("assistant.proposed")}</p>
                <ul>
                  {m.proposals.map((p, pi) => {
                    const d = describeChange(plan, p.change);
                    const vars =
                      p.change.op === "setVendorStatus"
                        ? { ...d.vars, status: t(`vendors.status.${p.change.status}`) }
                        : d.vars;
                    return (
                      <li key={pi} className={styles.proposal}>
                        <span>{t(d.key, vars)}</span>
                        {p.state === "pending" && (
                          <span className={styles.proposalActions}>
                            <button
                              type="button"
                              className="btn btn-primary btn-small"
                              onClick={() => apply(mi, pi)}
                            >
                              {t("assistant.apply")}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-small"
                              onClick={() => setProposal(mi, pi, "dismissed")}
                            >
                              {t("assistant.dismiss")}
                            </button>
                          </span>
                        )}
                        {p.state === "applied" && (
                          <span className="badge badge-good">✓ {t("assistant.applied")}</span>
                        )}
                        {p.state === "failed" && (
                          <span className="badge badge-bad">
                            {t("assistant.failed", { reason: p.reason ?? "" })}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {m.proposals.filter((p) => p.state === "pending").length > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() =>
                      m.proposals!.forEach((p, pi) => p.state === "pending" && apply(mi, pi))
                    }
                  >
                    {t("assistant.applyAll")}
                  </button>
                )}
              </div>
            )}
          </motion.li>
        ))}
        {busy && <li className={styles.bot}>{t("assistant.thinking")}</li>}
      </ol>

      {messages.length === 0 && (
        <div className={styles.suggestions}>
          {(["assistant.suggest.1", "assistant.suggest.2", "assistant.suggest.3"] as const).map(
            (key) => (
              <button
                key={key}
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => send(t(key))}
              >
                {t(key)}
              </button>
            ),
          )}
        </div>
      )}

      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}

      <form className={styles.form} onSubmit={submit}>
        <label htmlFor="assistant-input" className="sr-only">
          {t("assistant.label")}
        </label>
        <textarea
          id="assistant-input"
          ref={inputRef}
          rows={2}
          maxLength={2000}
          value={input}
          placeholder={listening ? t("assistant.listening") : t("assistant.placeholder")}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        <div className={styles.formActions}>
          {canSpeak && (
            <button
              type="button"
              className="btn btn-secondary btn-small"
              aria-pressed={listening}
              onClick={listen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                <path
                  d="M5 11a7 7 0 0 0 14 0M12 18v3"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              <span className="sr-only">{t("assistant.voice")}</span>
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={busy || !input.trim()}
          >
            {t("assistant.send")}
          </button>
        </div>
      </form>
    </motion.aside>
  );
}
