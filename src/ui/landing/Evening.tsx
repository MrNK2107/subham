"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n, type MessageKey } from "@/i18n";
import styles from "./Evening.module.css";

/** One wedding evening, in the order it happens. Each hour is a rendered scene and a plan slice. */
const CHAPTERS = ["haldi", "sangeet", "ceremony", "sendoff"] as const;
type Chapter = (typeof CHAPTERS)[number];

const BASE = "/scene/chapters";

function key(ch: Chapter, part: string) {
  return `home.ch.${ch}.${part}` as MessageKey;
}

/**
 * The page's middle: the evening told as its own run sheet. A sticky clock on the left keeps the
 * hour as the chapters scroll past; the photographs settle into place as each hour arrives (CSS
 * scroll-driven animation, so nothing renders as an inline style and the CSP holds).
 */
export function Evening() {
  const { t } = useI18n();
  const [active, setActive] = useState<Chapter>("haldi");
  const refs = useRef<Partial<Record<Chapter, HTMLElement | null>>>({});

  // The phone clock sticks just under the header, whose height changes with the language and width.
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = document.querySelector("header");
    const el = section.current;
    if (!header || !el) return;
    const sync = () => el.style.setProperty("--header-h", `${header.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.getAttribute("data-hour") as Chapter);
        }
      },
      // The hour changes when a chapter crosses the middle of the screen.
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const el of Object.values(refs.current)) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={section}
      className={styles.evening}
      aria-labelledby="evening-title"
      data-hour={active}
    >
      <div className={`container ${styles.intro}`}>
        <h2 id="evening-title">{t("home.evening.title")}</h2>
        <p>{t("home.evening.body")}</p>
      </div>

      <div className={styles.body}>
        <nav className={styles.railWrap} aria-label={t("home.evening.rail")}>
          <ol className={styles.rail}>
            {CHAPTERS.map((ch) => (
              <li key={ch} data-active={active === ch || undefined}>
                <a href={`#hour-${ch}`} aria-current={active === ch ? "step" : undefined}>
                  <span className={styles.bulb} aria-hidden="true" />
                  <span className={styles.railTime}>{t(key(ch, "time"))}</span>
                  <span className={styles.railName}>{t(key(ch, "name"))}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {CHAPTERS.map((ch) => (
          <article
            key={ch}
            id={`hour-${ch}`}
            data-hour={ch}
            ref={(el) => {
              refs.current[ch] = el;
            }}
            className={styles.chapter}
            aria-labelledby={`hour-${ch}-title`}
          >
            <div className={styles.plateWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element -- next/image renders style attributes, which the nonce CSP blocks; these files are pre-sized. */}
              <img
                className={styles.plate}
                src={`${BASE}/${ch}-1920.webp`}
                srcSet={`${BASE}/${ch}-1080.webp 1080w, ${BASE}/${ch}-1920.webp 1920w`}
                sizes="100vw"
                width={1920}
                height={1080}
                loading="lazy"
                decoding="async"
                alt={t(key(ch, "alt"))}
              />
            </div>
            <div className={`container ${styles.chapterInner}`}>
              <div className={styles.copy}>
                <p className={styles.hour}>
                  <span className={styles.time}>{t(key(ch, "time"))}</span>
                  <span className={styles.fn}>{t(key(ch, "name"))}</span>
                </p>
                <h3 id={`hour-${ch}-title`}>{t(key(ch, "title"))}</h3>
                <p className={styles.lead}>{t(key(ch, "body"))}</p>
              </div>
              <aside
                className={styles.slice}
                aria-label={`${t("home.example")}: ${t(key(ch, "name"))}, ${t(key(ch, "slice"))}`}
              >
                <p className={styles.sliceHead}>
                  <span>{t(key(ch, "slice"))}</span>
                  <span className={styles.sliceTag}>{t("home.example")}</span>
                </p>
                <ul>
                  {(["r1", "r2", "r3"] as const).map((r, i) => {
                    const [lead, text] = t(key(ch, r)).split("|");
                    return (
                      <li key={r} data-kind={ch} data-row={i}>
                        <span className={styles.rowLead}>{lead}</span>
                        <span className={styles.rowText}>{text}</span>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
