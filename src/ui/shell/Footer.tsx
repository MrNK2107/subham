"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className={`${styles.footer} no-print`}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.brand}>
          <Logo size={28} />
          <span>
            <strong>{t("app.name")}</strong> · {t("app.tagline")}
          </span>
        </p>
        <nav aria-label={t("app.name")} className={styles.links}>
          <Link href="/plan/new">{t("nav.newPlan")}</Link>
          <Link href="/plans">{t("nav.myPlans")}</Link>
        </nav>
        <p className={styles.note}>{t("home.privacy")}</p>
      </div>
    </footer>
  );
}
