"use client";

import Link from "next/link";
import { formatINR } from "@/core/money";
import { daysUntil } from "@/core/schedule";
import { useI18n } from "@/i18n";
import { useHydrated, usePlans } from "@/store/plans";
import { localToday } from "@/ui/api";
import styles from "./PlanList.module.css";

export function PlanList() {
  const { t } = useI18n();
  const plans = usePlans();
  const hydrated = useHydrated();
  const today = localToday();

  return (
    <div className={`container ${styles.wrap}`}>
      <h1>{t("plans.title")}</h1>
      {!hydrated ? (
        <p>{t("common.loading")}</p>
      ) : plans.length === 0 ? (
        <div className="card">
          <p>{t("plans.empty")}</p>
          <Link href="/plan/new" className="btn btn-primary">
            {t("plans.create")}
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {plans.map((plan) => {
            const days = daysUntil(plan.brief.date, today);
            const done = plan.tasks.filter((x) => x.done).length;
            return (
              <li key={plan.id} className="card">
                <span className="badge">{t(`type.${plan.brief.type}`)}</span>
                <h2 lang={plan.brief.language}>
                  <Link href={`/plan/${plan.id}`} className={styles.link}>
                    {plan.brief.title}
                  </Link>
                </h2>
                <p className={styles.meta}>
                  {plan.brief.date} ·{" "}
                  {t("plan.guestsCity", { guests: plan.brief.guests, city: plan.brief.city })} ·{" "}
                  {formatINR(plan.brief.budget)}
                </p>
                <p className={styles.meta}>
                  {days >= 0 ? t("plan.countdown", { days }) : t("plan.past")} ·{" "}
                  {t("overview.ofTotal", { done, total: plan.tasks.length })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
