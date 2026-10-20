"use client";

import { useState } from "react";
import { IDEA_KINDS, type IdeaDraft, type Plan } from "@/core/types";
import { useI18n } from "@/i18n";
import { postJson } from "@/ui/api";
import type { PlanActions } from "./Dashboard";
import styles from "./Dashboard.module.css";

interface IdeasResponse {
  ideas: IdeaDraft[];
  sources: { url: string; title: string }[];
}

export function IdeasTab({ plan, actions }: { plan: Plan; actions: PlanActions }) {
  const { t } = useI18n();
  const [fresh, setFresh] = useState<IdeasResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lang = plan.brief.language;
  const saved = new Set(plan.ideas.map((i) => i.title));

  async function load() {
    setBusy(true);
    setError("");
    const res = await postJson<IdeasResponse>("/api/ideas", { brief: plan.brief });
    setBusy(false);
    if (res.ok) setFresh(res.data);
    else setError(res.error || t(res.status ? "error.generic" : "error.network"));
  }

  return (
    <div className={styles.stack}>
      <div className="no-print">
        <button type="button" className="btn btn-primary" onClick={load} disabled={busy}>
          {busy ? t("ideas.loading") : t("ideas.fresh", { city: plan.brief.city })}
        </button>
        <p className="sr-only" role="status">
          {busy ? t("ideas.loading") : ""}
        </p>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>

      {fresh && (
        <section aria-labelledby="fresh-ideas">
          <h2 id="fresh-ideas">{t("ideas.suggested")}</h2>
          <ul className={styles.ideaGrid}>
            {fresh.ideas.map((idea) => (
              <li key={idea.title} className="card">
                <span className="badge">{t(`kind.${idea.kind}`)}</span>
                <h3 lang={lang}>{idea.title}</h3>
                <p lang={lang}>{idea.description}</p>
                {saved.has(idea.title) ? (
                  <span className="badge badge-good">✓ {t("ideas.saved")}</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => actions.apply({ op: "addIdea", ...idea })}
                  >
                    {t("ideas.save")}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {fresh.sources.length > 0 && (
            <details className={styles.sources}>
              <summary>{t("ideas.sources")}</summary>
              <ul>
                {fresh.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      <section aria-labelledby="your-ideas">
        <h2 id="your-ideas">{t("ideas.yours")}</h2>
        {IDEA_KINDS.map((kind) => {
          const ideas = plan.ideas.filter((i) => i.kind === kind);
          if (!ideas.length) return null;
          return (
            <div key={kind}>
              <h3 className={styles.kind}>{t(`kind.${kind}`)}</h3>
              <ul className={styles.ideaGrid}>
                {ideas.map((idea) => (
                  <li key={idea.id} className="card">
                    <h4 lang={lang}>{idea.title}</h4>
                    <p lang={lang}>{idea.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
