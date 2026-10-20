"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n";
import { AuthButton } from "./AuthButton";
import { LanguageSwitch } from "./LanguageSwitch";
import { Logo } from "./Logo";
import styles from "./Header.module.css";

export function Header() {
  const { t } = useI18n();
  const path = usePathname();
  const current = (href: string) => (path === href ? "page" : undefined);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <Logo />
          <span className={styles.name}>{t("app.name")}</span>
        </Link>
        <nav aria-label={t("nav.home")} className={styles.nav}>
          <Link href="/plans" aria-current={current("/plans")} className={styles.link}>
            {t("nav.myPlans")}
          </Link>
          <Link
            href="/plan/new"
            aria-current={current("/plan/new")}
            className="btn btn-primary btn-small"
          >
            {t("nav.newPlan")}
          </Link>
        </nav>
        <div className={styles.tools}>
          <LanguageSwitch />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
