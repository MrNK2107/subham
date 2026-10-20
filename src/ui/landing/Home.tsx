"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { formatINR } from "@/core/money";
import type { Brief } from "@/core/types";
import { useI18n, type MessageKey } from "@/i18n";
import { localToday, postJson } from "@/ui/api";
import { BulbStrand } from "@/ui/common/BulbStrand";
import { Icon, type IconName } from "@/ui/common/Icon";
import { LitOnView, Reveal } from "@/ui/common/Reveal";
import { presetFunctions } from "@/core/presets";
import { sceneSignal } from "@/ui/scene/signal";
import { savePrefill } from "@/ui/wizard/prefill";
import styles from "./Home.module.css";

// The WebGL street loads after the page is interactive and never on the server.
const StreetLights = dynamic(() => import("@/ui/scene/StreetLights"), { ssr: false });

const FEATURES: IconName[] = ["budget", "timeline", "vendors", "ideas", "guests", "assistant"];
const FEATURE_KEY: Record<string, string> = {
  budget: "budget",
  timeline: "timeline",
  vendors: "vendors",
  ideas: "ideas",
  guests: "guests",
  assistant: "assistant",
};

// Illustrative example, labelled as such on the page.
const DEMO = [
  {
    name: "Haldi",
    budget: 96_000,
    done: 5,
    total: 6,
    tasks: ["Turmeric & flowers ordered", "Dhol booked", "Yellow dress code shared"],
  },
  {
    name: "Mehendi",
    budget: 1_20_000,
    done: 3,
    total: 6,
    tasks: ["Mehendi artist booked", "Seating for 60 planned", "Playlist pending"],
  },
  {
    name: "Sangeet",
    budget: 1_92_000,
    done: 2,
    total: 8,
    tasks: ["Choreographer contacted", "Stage size confirmed", "Family dance list pending"],
  },
  {
    name: "Muhurtham",
    budget: 4_80_000,
    done: 4,
    total: 10,
    tasks: ["Mandapam booked", "Priest & muhurat fixed", "Nadaswaram quote pending"],
  },
  {
    name: "Reception",
    budget: 3_36_000,
    done: 1,
    total: 7,
    tasks: ["Caterer tasting on Saturday", "Return gifts shortlisted", "Photographer pending"],
  },
];

const SCRIPTS = ["शुभ आरंभ", "சுப ஆரம்பம்", "శుభారంభం", "A good beginning"];

export function Home() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const hintId = useId();
  const errorId = useId();

  async function describe(e: FormEvent) {
    e.preventDefault();
    if (text.trim().length < 3) {
      setError(t("error.required"));
      return;
    }
    sceneSignal.burstAt = performance.now();
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
      <section className={styles.hero} aria-labelledby="hero-title">
        <StreetLights />
        <div className={styles.heroShade} aria-hidden="true" />
        {/* Each function hangs as a tag from the nearest strand. */}
        <ul className={styles.tags} aria-hidden="true">
          {presetFunctions("wedding", lang).map((name) => (
            <li key={name}>
              <span>{name}</span>
            </li>
          ))}
        </ul>
        <div className={`container ${styles.heroInner}`}>
          <Reveal immediate>
            <h1 id="hero-title" className={styles.title}>
              {t("home.title")}
            </h1>
          </Reveal>
          <Reveal immediate delay={0.12}>
            <p className={styles.lead}>{t("home.lead")}</p>
          </Reveal>

          <Reveal immediate delay={0.24} className={styles.doorway}>
            <form onSubmit={describe} noValidate>
              <label htmlFor="describe" className={styles.doorLabel}>
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
                  <Icon name="bulb" size={20} />
                  {busy ? t("home.filling") : t("home.cta")}
                </button>
                <Link href="/plan/new" className="btn btn-secondary">
                  {t("home.stepByStep")}
                </Link>
              </div>
              <p className="sr-only" role="status">
                {busy ? t("home.filling") : ""}
              </p>
            </form>
          </Reveal>
        </div>
      </section>

      <section className={styles.demo} aria-labelledby="demo-title">
        <div className={`container ${styles.demoGrid}`}>
          <Reveal className={styles.demoIntro}>
            <h2 id="demo-title">{t("home.demoTitle")}</h2>
            <p>{t("home.demoBody")}</p>
            <p className={styles.demoLabel}>{t("home.demoLabel")}</p>
          </Reveal>
          <ul className={styles.strands}>
            {DEMO.map((fn, i) => {
              const expanded = open === fn.name;
              return (
                <Reveal as="li" key={fn.name} delay={i * 0.07} className={styles.strandRow}>
                  <button
                    type="button"
                    className={styles.strandButton}
                    aria-expanded={expanded}
                    aria-controls={`demo-${fn.name}`}
                    onClick={() => setOpen(expanded ? null : fn.name)}
                  >
                    <span className={styles.strandName}>{fn.name}</span>
                    <span className={styles.strandBudget}>{formatINR(fn.budget)}</span>
                    <BulbStrand
                      value={fn.done}
                      max={fn.total}
                      bulbs={fn.total}
                      label={fn.name}
                      valueText={t("home.demoTasks", { done: fn.done, total: fn.total })}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.ul
                        id={`demo-${fn.name}`}
                        className={styles.strandTasks}
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduce ? undefined : { height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      >
                        {fn.tasks.map((task) => (
                          <li key={task}>{task}</li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      <section className={`container ${styles.features}`} aria-labelledby="features-title">
        <Reveal className={styles.featuresHead}>
          <h2 id="features-title">{t("home.featuresTitle")}</h2>
        </Reveal>
        {[FEATURES.slice(0, 3), FEATURES.slice(3)].map((row, r) => (
          <LitOnView as="ol" key={r} className={styles.featureStrand}>
            {row.map((f) => (
              <li key={f} className={styles.featureTag}>
                <span className={styles.featureBulb} aria-hidden="true" />
                <span className={styles.featureIcon}>
                  <Icon name={f} size={22} />
                </span>
                <h3>{t(`home.feature.${FEATURE_KEY[f]}.title` as MessageKey)}</h3>
                <p>{t(`home.feature.${FEATURE_KEY[f]}.body` as MessageKey)}</p>
              </li>
            ))}
          </LitOnView>
        ))}
      </section>

      <section className={styles.langs} aria-labelledby="langs-title">
        <div className="container">
          <Reveal>
            <h2 id="langs-title">{t("home.langTitle")}</h2>
            <p className={styles.langBody}>{t("home.langBody")}</p>
          </Reveal>
          <ul className={styles.scripts} aria-hidden="true">
            {SCRIPTS.map((s, i) => (
              <li key={s} className={styles[`script${i}`]}>
                {s}
              </li>
            ))}
          </ul>
          <ol className={styles.how}>
            {([1, 2, 3] as const).map((n) => (
              <Reveal as="li" key={n} delay={n * 0.08}>
                <span className={styles.howBulb} aria-hidden="true" />
                <h3>{t(`home.how.${n}.title` as MessageKey)}</h3>
                <p>{t(`home.how.${n}.body` as MessageKey)}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className={`container ${styles.close}`} aria-labelledby="close-title">
        <LitOnView className={styles.reprise}>
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} aria-hidden="true" />
          ))}
        </LitOnView>
        <Reveal>
          <h2 id="close-title">{t("home.closeTitle")}</h2>
          <div className={styles.actions}>
            <a href="#describe" className="btn btn-primary">
              <Icon name="bulb" size={20} />
              {t("home.cta")}
            </a>
            <Link href="/plan/new" className="btn btn-secondary">
              {t("home.stepByStep")}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
