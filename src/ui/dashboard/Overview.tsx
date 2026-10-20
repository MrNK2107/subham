"use client";

import { dateRisks } from "@/core/calendar";
import { assessBudget } from "@/core/estimate";
import { guestSummary } from "@/core/guests";
import { formatINR } from "@/core/money";
import type { Plan } from "@/core/types";
import { useI18n, type MessageKey } from "@/i18n";
import { localToday } from "@/ui/api";
import { BulbStrand } from "@/ui/common/BulbStrand";
import styles from "./Dashboard.module.css";

export function Overview({ plan }: { plan: Plan }) {
  const { t } = useI18n();
  const today = localToday();
  const done = plan.tasks.filter((x) => x.done).length;
  const spent = plan.budget.reduce((a, l) => a + l.spent, 0);
  const booked = plan.vendors.filter((v) => v.status === "booked").length;
  const guests = guestSummary(plan.guests);
  const risks = dateRisks(plan.brief.date, { city: plan.brief.city, type: plan.brief.type });
  const check = assessBudget(plan.brief);
  const next = plan.tasks.filter((x) => !x.done).slice(0, 4);
  const lang = plan.brief.language;

  const stats = [
    { label: t("overview.tasks"), value: done, max: plan.tasks.length },
    { label: t("overview.budgetUsed"), value: spent, max: plan.brief.budget, money: true },
    { label: t("overview.vendorsBooked"), value: booked, max: plan.vendors.length },
    { label: t("overview.guestsConfirmed"), value: guests.confirmed, max: plan.brief.guests },
  ];

  return (
    <div className={styles.stack}>
      <ul className={styles.stats}>
        {stats.map((s) => (
          <li key={s.label} className="card">
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>
              {s.money
                ? `${formatINR(s.value)} / ${formatINR(s.max)}`
                : t("overview.ofTotal", { done: s.value, total: s.max })}
            </p>
            <BulbStrand
              value={s.value}
              max={s.max}
              label={s.label}
              valueText={
                s.money
                  ? `${formatINR(s.value)} / ${formatINR(s.max)}`
                  : t("overview.ofTotal", { done: s.value, total: s.max })
              }
            />
          </li>
        ))}
      </ul>

      <div className={styles.twoCol}>
        <section className="card" aria-labelledby="date-check">
          <h2 id="date-check">{t("overview.dateCheck")}</h2>
          {risks.length === 0 ? (
            <p className="badge badge-good">✓ {t("overview.noRisks")}</p>
          ) : (
            <ul className={styles.risks}>
              {risks.map((r) => (
                <li key={`${r.kind}-${r.key}`}>
                  <span className="badge badge-warn">!</span>{" "}
                  {r.kind === "festival"
                    ? t("risk.festival", { festival: t(`festival.${r.key}` as MessageKey) })
                    : t(`risk.${r.kind}.${r.key}` as MessageKey)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="budget-check">
          <h2 id="budget-check">{t("overview.budgetCheck")}</h2>
          <p>
            <span className={`badge ${check.verdict === "tight" ? "badge-bad" : "badge-good"}`}>
              {formatINR(plan.brief.budget)}
            </span>{" "}
            {t(`verdict.${check.verdict}`, {
              tier: t(`tier.${plan.brief.tier}`),
              typical: formatINR(check.typical),
              guests: plan.brief.guests,
            })}
          </p>
        </section>
      </div>

      <div className={styles.twoCol}>
        <section className="card" aria-labelledby="next-up">
          <h2 id="next-up">{t("overview.nextUp")}</h2>
          {next.length === 0 ? (
            <p>{t("overview.allDone")}</p>
          ) : (
            <ul className={styles.nextList}>
              {next.map((task) => (
                <li key={task.id}>
                  <span lang={lang}>{task.title}</span>
                  <span className={`badge ${task.due < today ? "badge-bad" : ""}`}>
                    {task.due < today
                      ? t("timeline.overdue")
                      : t("timeline.due", { date: task.due })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="functions">
          <h2 id="functions">{t("overview.functions")}</h2>
          <ol className={styles.fnList}>
            {plan.functions.map((f) => (
              <li key={f.id}>
                <strong lang={lang}>{f.name}</strong>
                <span className={styles.fnWhen}>
                  {f.date} · {f.start}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
