"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useId, useRef, useState, type FormEvent } from "react";
import type { Brief } from "@/core/types";
import { useI18n } from "@/i18n";
import { localToday, postJson } from "@/ui/api";
import { Icon } from "@/ui/common/Icon";
import { Reveal } from "@/ui/common/Reveal";
import { sceneSignal } from "@/ui/scene/signal";
import { useIdle } from "@/ui/common/useIdle";
import { savePrefill } from "@/ui/wizard/prefill";
import { Evening } from "./Evening";
import styles from "./Home.module.css";

// The WebGL street loads after the page is interactive and idle, and never on the server, so the
// headline paints and hydrates first.
const StreetLights = dynamic(() => import("@/ui/scene/StreetLights"), { ssr: false });

function saveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Celebrations that aren't weddings, written the way people actually type them, each in its own
 * script. Picking one fills the describe box at the close, so the example is also the call to action.
 */
const KINDS = [
  {
    lang: "en",
    text: "Ganesh pandal for our housing society in Pune, ten days, about 600 visitors a day",
  },
  { lang: "hi", text: "बेटे का पाँचवाँ जन्मदिन, लखनऊ में, 40 बच्चे, बजट 60 हज़ार" },
  { lang: "ta", text: "கோயிலில் பொங்கல் சமூக விருந்து, மதுரையில், 300 பேர், சைவம்" },
  { lang: "te", text: "హైదరాబాద్‌లో మా అమ్మాయి నిశ్చితార్థం, 150 మంది అతిథులు, ఆగస్టులో" },
  { lang: "en", text: "Annual day at our school in Coimbatore, 900 parents and students" },
] as const;

interface DescribeProps {
  id: string;
  label: string;
  text: string;
  busy: boolean;
  onText: (value: string) => void;
  /** Resolves to an error message to show, or nothing when the plan is on its way. */
  onSubmit: () => Promise<string | undefined>;
}

/** The one action on the page: describe the celebration. It opens the page and closes it. */
const DescribeForm = forwardRef<HTMLTextAreaElement, DescribeProps>(function DescribeForm(
  { id, label, text, busy, onText, onSubmit },
  ref,
) {
  const { t } = useI18n();
  const [error, setError] = useState("");
  const hintId = useId();
  const errorId = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError((await onSubmit()) ?? "");
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id} className={styles.doorLabel}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={text}
        onChange={(e) => onText(e.target.value)}
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
  );
});

export function Home() {
  const { t } = useI18n();
  const router = useRouter();
  // Idle is only ever true in the browser, so reading navigator here can't cause a hydration
  // mismatch. Data Saver users keep the static backdrop instead of the WebGL scene.
  const sceneReady = useIdle() && !saveData();
  // One description, shared by the form at the top and the one at the close.
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const closeField = useRef<HTMLTextAreaElement>(null);

  async function describe(): Promise<string | undefined> {
    if (text.trim().length < 3) return t("error.required");
    sceneSignal.burstAt = performance.now();
    setBusy(true);
    const res = await postJson<{ brief: Partial<Brief> }>("/api/brief", {
      text,
      today: localToday(),
    });
    setBusy(false);
    if (!res.ok) return res.error || t(res.status ? "error.generic" : "error.network");
    savePrefill(res.data.brief);
    router.push("/plan/new");
  }

  function tryKind(sentence: string) {
    setText(sentence);
    const el = closeField.current;
    if (!el) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView?.({ behavior: still ? "auto" : "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }

  const form = { text, busy, onText: setText, onSubmit: describe };

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        {sceneReady && <StreetLights />}
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
          {/* Not wrapped in Reveal: the headline is the largest paint, and fading it in from
              opacity 0 after hydration would push LCP back by seconds on phones. */}
          <h1 id="hero-title" className={styles.title}>
            {t("home.title")}
          </h1>
          <Reveal immediate delay={0.12}>
            <p className={styles.lead}>{t("home.lead")}</p>
          </Reveal>
          <Reveal immediate delay={0.24} className={styles.doorway}>
            <DescribeForm id="describe" label={t("home.describeLabel")} {...form} />
          </Reveal>
        </div>
      </section>

      <Evening />

      <section className={styles.kinds} aria-labelledby="kinds-title">
        <div className={`container ${styles.kindsGrid}`}>
          <div className={styles.kindsHead}>
            <h2 id="kinds-title">{t("home.kinds.title")}</h2>
            <p>{t("home.kinds.body")}</p>
          </div>
          <ul className={styles.kindList}>
            {KINDS.map((k) => (
              <li key={k.text}>
                <button
                  type="button"
                  className={styles.kind}
                  onClick={() => tryKind(k.text)}
                  aria-describedby="kinds-try"
                >
                  <span className={styles.kindBulb} aria-hidden="true" />
                  <span lang={k.lang} className={styles.kindText}>
                    {k.text}
                  </span>
                  <span className={styles.kindArrow} aria-hidden="true">
                    <Icon name="arrow" size={20} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p id="kinds-try" className="sr-only">
            {t("home.kinds.try")}
          </p>
        </div>
      </section>

      <section className={styles.close} aria-labelledby="close-title">
        <div className={styles.closePlate} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image renders style attributes, which the nonce CSP blocks; these files are pre-sized. */}
          <img
            src="/scene/lane/midnight-1920.webp"
            srcSet="/scene/lane/midnight-1080.webp 1080w, /scene/lane/midnight-1920.webp 1920w"
            sizes="100vw"
            alt=""
            width={1920}
            height={1080}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={`container ${styles.closeInner}`}>
          <div className={styles.closeCopy}>
            <h2 id="close-title">{t("home.closeTitle")}</h2>
            <p>{t("home.closeBody")}</p>
          </div>
          <div className={styles.doorway}>
            <DescribeForm
              ref={closeField}
              id="describe-close"
              label={t("home.closeLabel")}
              {...form}
            />
          </div>
        </div>
      </section>
    </>
  );
}
