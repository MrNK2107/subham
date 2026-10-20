"use client";

import { useState, type FormEvent } from "react";
import { GENERAL } from "@/core/assemble";
import { summarizeBudget } from "@/core/budget-summary";
import { formatINR, parseAmount } from "@/core/money";
import type { Plan } from "@/core/types";
import { useI18n } from "@/i18n";
import { BulbStrand } from "@/ui/common/BulbStrand";
import type { PlanActions } from "./Dashboard";
import styles from "./Dashboard.module.css";

export function BudgetTab({ plan, actions }: { plan: Plan; actions: PlanActions }) {
  const { t } = useI18n();
  const [line, setLine] = useState(plan.budget[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const summary = summarizeBudget(plan.budget);
  const lang = plan.brief.language;

  const groups = [
    { id: GENERAL, name: t("budget.general") },
    ...plan.functions.map((f) => ({ id: f.id, name: f.name })),
  ]
    .map((g) => ({ ...g, lines: plan.budget.filter((l) => l.fnId === g.id) }))
    .filter((g) => g.lines.length);

  function log(e: FormEvent) {
    e.preventDefault();
    const value = parseAmount(amount);
    if (!value) return setError(t("error.budget"));
    const failed = actions.apply({ op: "logSpend", line, amount: value });
    setError(failed ?? "");
    if (!failed) setAmount("");
  }

  return (
    <div className={styles.stack}>
      <section className={`card ${styles.budgetStrand}`} aria-labelledby="budget-total">
        <h2 id="budget-total" className={styles.budgetFigures}>
          {formatINR(summary.spent)} <span>{t("budget.spent")}</span> ·{" "}
          {formatINR(summary.allocated)} <span>{t("budget.total")}</span> ·{" "}
          {formatINR(summary.remaining)} <span>{t("budget.left")}</span>
        </h2>
        <BulbStrand
          value={summary.spent}
          max={summary.allocated}
          bulbs={24}
          over={summary.spent > summary.allocated}
          label={t("budget.spent")}
          valueText={`${formatINR(summary.spent)} / ${formatINR(summary.allocated)}`}
        />
      </section>

      {summary.overruns.length > 0 && (
        <div className="notice no-print">
          <p>
            {summary.overruns
              .map((o) => `${o.category}: ${t("budget.over", { amount: formatINR(o.over) })}`)
              .join(" · ")}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => actions.ask(t("budget.rebalancePrompt"))}
          >
            {t("budget.askRebalance")}
          </button>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.id} className="card" aria-labelledby={`grp-${g.id}`}>
          <h2 id={`grp-${g.id}`} lang={g.id === GENERAL ? undefined : lang}>
            {g.name}
          </h2>
          <div
            className={styles.tableWrap}
            tabIndex={0}
            role="region"
            aria-labelledby={`grp-${g.id}`}
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t("budget.line")}</th>
                  <th scope="col">{t("budget.allocated")}</th>
                  <th scope="col">{t("budget.spent")}</th>
                  <th scope="col">{t("budget.left")}</th>
                </tr>
              </thead>
              <tbody>
                {g.lines.map((l) => {
                  const left = l.allocated - l.spent;
                  return (
                    <tr key={l.id}>
                      <th scope="row" lang={lang}>
                        {l.category}
                        <BulbStrand
                          value={l.spent}
                          max={Math.max(l.allocated, 1)}
                          bulbs={8}
                          over={l.spent > l.allocated}
                          label={l.category}
                          valueText={`${formatINR(l.spent)} / ${formatINR(l.allocated)}`}
                        />
                      </th>
                      <td>{formatINR(l.allocated)}</td>
                      <td>{formatINR(l.spent)}</td>
                      <td>
                        {left < 0 ? (
                          <span className="badge badge-bad">
                            {t("budget.over", { amount: formatINR(-left) })}
                          </span>
                        ) : (
                          formatINR(left)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <form className={`card ${styles.inlineForm} no-print`} onSubmit={log} noValidate>
        <h2>{t("budget.logSpend")}</h2>
        <div className="field">
          <label htmlFor="spend-line">{t("budget.line")}</label>
          <select id="spend-line" value={line} onChange={(e) => setLine(e.target.value)}>
            {groups.map((g) => (
              <optgroup key={g.id} label={g.name}>
                {g.lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.category}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="spend-amount">{t("budget.amount")}</label>
          <input
            id="spend-amount"
            value={amount}
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "spend-error" : undefined}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {t("budget.add")}
        </button>
        {error && (
          <p id="spend-error" className="error-text" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
