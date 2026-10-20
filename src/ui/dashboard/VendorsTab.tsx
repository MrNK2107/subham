"use client";

import { useState, type FormEvent } from "react";
import { parseAmount } from "@/core/money";
import { VENDOR_STATUSES, type Plan, type Vendor } from "@/core/types";
import { useI18n } from "@/i18n";
import { BulbStrand } from "@/ui/common/BulbStrand";
import type { PlanActions } from "./Dashboard";
import styles from "./Dashboard.module.css";

const STATUS_BADGE: Record<Vendor["status"], string> = {
  todo: "badge",
  contacted: "badge badge-warn",
  booked: "badge badge-good",
};

export function VendorsTab({ plan, actions }: { plan: Plan; actions: PlanActions }) {
  const { t } = useI18n();
  const [category, setCategory] = useState("");
  const lang = plan.brief.language;
  const booked = plan.vendors.filter((v) => v.status === "booked").length;

  function add(e: FormEvent) {
    e.preventDefault();
    if (!category.trim()) return;
    actions.apply({ op: "addVendor", category: category.trim(), questions: [] });
    setCategory("");
  }

  return (
    <div className={styles.stack}>
      <div>
        <p className={styles.lead}>
          {t("vendors.summary", { booked, total: plan.vendors.length })}
        </p>
        <BulbStrand
          value={booked}
          max={plan.vendors.length}
          bulbs={16}
          label={t("overview.vendorsBooked")}
          valueText={t("vendors.summary", { booked, total: plan.vendors.length })}
        />
      </div>
      <ul className={styles.vendorGrid}>
        {plan.vendors.map((v) => (
          <li key={v.id} className="card">
            <div className={styles.vendorHead}>
              <h2 lang={lang}>{v.category}</h2>
              <span className={STATUS_BADGE[v.status]}>{t(`vendors.status.${v.status}`)}</span>
            </div>
            <div className={styles.vendorFields}>
              <div className="field">
                <label htmlFor={`status-${v.id}`}>{t("vendors.status")}</label>
                <select
                  id={`status-${v.id}`}
                  value={v.status}
                  onChange={(e) =>
                    actions.apply({
                      op: "setVendorStatus",
                      id: v.id,
                      status: e.target.value as Vendor["status"],
                    })
                  }
                >
                  {VENDOR_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`vendors.status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`quote-${v.id}`}>{t("vendors.quote")}</label>
                <input
                  id={`quote-${v.id}`}
                  inputMode="decimal"
                  defaultValue={v.quote ?? ""}
                  onBlur={(e) => {
                    const quote = parseAmount(e.target.value);
                    if (quote !== null && quote !== v.quote) {
                      actions.apply({ op: "setVendorStatus", id: v.id, status: v.status, quote });
                    }
                  }}
                />
              </div>
            </div>
            {v.questions.length > 0 && (
              <details>
                <summary>{t("vendors.questions")}</summary>
                <ul lang={lang}>
                  {v.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
      <form className={`card ${styles.inlineForm} no-print`} onSubmit={add}>
        <h2>{t("vendors.add")}</h2>
        <div className="field">
          <label htmlFor="vendor-category">{t("vendors.category")}</label>
          <input
            id="vendor-category"
            value={category}
            maxLength={40}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!category.trim()}>
          {t("vendors.addButton")}
        </button>
      </form>
    </div>
  );
}
