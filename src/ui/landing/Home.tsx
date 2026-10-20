"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import type { Brief } from "@/core/types";
import { useI18n, type MessageKey } from "@/i18n";
import { localToday, postJson } from "@/ui/api";
import { savePrefill } from "@/ui/wizard/prefill";
import styles from "./Home.module.css";

const FEATURES = ["budget", "timeline", "vendors", "ideas", "guests", "assistant"] as const;
const ICONS: Record<(typeof FEATURES)[number], string> = {
  budget: "₹",
  timeline: "◷",
  vendors: "✓",
  ideas: "✦",
  guests: "☺",
  assistant: "❝",
};

export function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hintId = useId();
  const errorId = useId();

  async function describe(e: FormEvent) {
    e.preventDefault();
    if (text.trim().length < 3) {
      setError(t("error.required"));
      return;
    }
    setBusy(true);
    setError("");
    const res = await postJson<{ brief: Partial<Brief> }>("/api/brief", {
      text,
      today: localToday(),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || t(res.status ? "error.generic" : "error.network"));
      return;
    }
    savePrefill(res.data.brief);
    router.push("/plan/new");
  }

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div>
            <p className={styles.eyebrow}>{t("home.eyebrow")}</p>
            <h1>{t("home.title")}</h1>
            <p className={styles.lead}>{t("home.lead")}</p>

            <form className={`card ${styles.describe}`} onSubmit={describe} noValidate>
              <label htmlFor="describe" className="label">
                {t("home.describeLabel")}
              </label>
              <textarea
                id="describe"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("home.describePlaceholder")}
                maxLength={600}
                rows={3}
                aria-describedby={error ? `${hintId} ${errorId}` : hintId}
                aria-invalid={error ? true : undefined}
              />
              <p id={hintId} className="hint">
                {t("home.describeHint")}
              </p>
              {error && (
                <p id={errorId} className="error-text" role="alert">
                  {error}
                </p>
              )}
              <div className={styles.actions}>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? t("home.filling") : t("home.describeSubmit")}
                </button>
                <span className={styles.or}>{t("home.or")}</span>
                <Link href="/plan/new" className="btn btn-secondary">
                  {t("home.stepByStep")}
                </Link>
              </div>
              <p className="sr-only" role="status">
                {busy ? t("home.filling") : ""}
              </p>
            </form>
          </div>

          <div className={styles.preview} aria-hidden="true">
            <div className={styles.previewCard}>
              <p className={styles.previewTitle}>Priya &amp; Arjun · Madurai</p>
              <ol className={styles.previewFns}>
                <li>Haldi</li>
                <li>Mehendi</li>
                <li>Sangeet</li>
                <li>Muhurtham</li>
                <li>Reception</li>
              </ol>
              <div className={styles.previewBar}>
                <span className={styles.barVenue} />
                <span className={styles.barFood} />
                <span className={styles.barDecor} />
                <span className={styles.barOther} />
              </div>
              <ul className={styles.previewList}>
                <li>✓ Book mandapam</li>
                <li>✓ Caterer tasting</li>
                <li>○ Nadaswaram</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container" aria-labelledby="features">
        <h2 id="features" className={styles.sectionTitle}>
          {t("home.featuresTitle")}
        </h2>
        <ul className={styles.features}>
          {FEATURES.map((f) => (
            <li key={f} className="card">
              <span className={styles.icon} aria-hidden="true">
                {ICONS[f]}
              </span>
              <h3>{t(`home.feature.${f}.title` as MessageKey)}</h3>
              <p>{t(`home.feature.${f}.body` as MessageKey)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container" aria-labelledby="how">
        <h2 id="how" className={styles.sectionTitle}>
          {t("home.howTitle")}
        </h2>
        <ol className={styles.steps}>
          {([1, 2, 3] as const).map((n) => (
            <li key={n}>
              <span className={styles.stepNum} aria-hidden="true">
                {n}
              </span>
              <h3>{t(`home.how.${n}.title` as MessageKey)}</h3>
              <p>{t(`home.how.${n}.body` as MessageKey)}</p>
            </li>
          ))}
        </ol>
        <p className={styles.privacy}>{t("home.privacy")}</p>
      </section>
    </>
  );
}
