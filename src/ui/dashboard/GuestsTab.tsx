"use client";

import { useState, type FormEvent } from "react";
import { addGuest, guestSummary, removeGuest, updateGuest } from "@/core/guests";
import type { Guest, Plan } from "@/core/types";
import { useI18n } from "@/i18n";
import { BulbStrand } from "@/ui/common/BulbStrand";
import type { PlanActions } from "./Dashboard";
import styles from "./Dashboard.module.css";

const SIDES: Guest["side"][] = ["bride", "groom", "host"];
const RSVPS: Guest["rsvp"][] = ["pending", "yes", "no"];
const DIETS: Guest["diet"][] = ["veg", "jain", "nonveg"];

const blank = (plan: Plan): Omit<Guest, "id"> => ({
  name: "",
  count: 1,
  side: plan.brief.type === "wedding" ? "bride" : "host",
  rsvp: "pending",
  diet: plan.brief.food === "jain" ? "jain" : "veg",
});

export function GuestsTab({ plan, actions }: { plan: Plan; actions: PlanActions }) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => blank(plan));
  const [count, setCount] = useState("1");
  const [error, setError] = useState("");
  const s = guestSummary(plan.guests);
  const sides = plan.brief.type === "wedding" ? SIDES : (["host"] as Guest["side"][]);

  function add(e: FormEvent) {
    e.preventDefault();
    const n = Number(count);
    if (!form.name.trim()) return setError(t("error.required"));
    if (!Number.isInteger(n) || n < 1 || n > 20) return setError(t("error.guests"));
    actions.replace(addGuest(plan, { ...form, count: n }));
    setForm(blank(plan));
    setCount("1");
    setError("");
  }

  return (
    <div className={styles.stack}>
      <div className="card" role="status">
        <p className={styles.lead}>
          {t("guests.summary", {
            confirmed: s.confirmed,
            pending: s.pending,
            declined: s.declined,
          })}
        </p>
        <p className="hint">
          {t("guests.expected", { count: s.expected, veg: s.veg, jain: s.jain, nonveg: s.nonveg })}{" "}
          {t("guests.planned", { count: plan.brief.guests })}
        </p>
        <BulbStrand
          value={s.confirmed}
          max={Math.max(plan.brief.guests, 1)}
          bulbs={20}
          label={t("overview.guestsConfirmed")}
          valueText={t("overview.ofTotal", { done: s.confirmed, total: plan.brief.guests })}
        />
      </div>

      <form className={`card ${styles.guestForm} no-print`} onSubmit={add} noValidate>
        <h2>{t("guests.add")}</h2>
        <div className="field">
          <label htmlFor="guest-name">{t("guests.name")}</label>
          <input
            id="guest-name"
            value={form.name}
            maxLength={80}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="guest-count">{t("guests.count")}</label>
          <input
            id="guest-count"
            inputMode="numeric"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="guest-side">{t("guests.side")}</label>
          <select
            id="guest-side"
            value={form.side}
            onChange={(e) => setForm({ ...form, side: e.target.value as Guest["side"] })}
          >
            {sides.map((side) => (
              <option key={side} value={side}>
                {t(`side.${side}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="guest-rsvp">{t("guests.rsvp")}</label>
          <select
            id="guest-rsvp"
            value={form.rsvp}
            onChange={(e) => setForm({ ...form, rsvp: e.target.value as Guest["rsvp"] })}
          >
            {RSVPS.map((r) => (
              <option key={r} value={r}>
                {t(`rsvp.${r}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="guest-diet">{t("guests.diet")}</label>
          <select
            id="guest-diet"
            value={form.diet}
            onChange={(e) => setForm({ ...form, diet: e.target.value as Guest["diet"] })}
          >
            {DIETS.map((d) => (
              <option key={d} value={d}>
                {t(`diet.${d}`)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          {t("guests.addButton")}
        </button>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </form>

      {plan.guests.length === 0 ? (
        <p>{t("guests.empty")}</p>
      ) : (
        <div
          className={`card ${styles.tableWrap}`}
          tabIndex={0}
          role="region"
          aria-label={t("tab.guests")}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t("guests.name")}</th>
                <th scope="col">{t("guests.count")}</th>
                <th scope="col">{t("guests.side")}</th>
                <th scope="col">{t("guests.rsvp")}</th>
                <th scope="col">{t("guests.diet")}</th>
                <th scope="col">
                  <span className="sr-only">{t("guests.remove", { name: "" })}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {plan.guests.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>{g.count}</td>
                  <td>{t(`side.${g.side}`)}</td>
                  <td>
                    <select
                      aria-label={`${t("guests.rsvp")}: ${g.name}`}
                      value={g.rsvp}
                      onChange={(e) =>
                        actions.replace(
                          updateGuest(plan, g.id, { rsvp: e.target.value as Guest["rsvp"] }),
                        )
                      }
                    >
                      {RSVPS.map((r) => (
                        <option key={r} value={r}>
                          {t(`rsvp.${r}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{t(`diet.${g.diet}`)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      aria-label={t("guests.remove", { name: g.name })}
                      onClick={() => actions.replace(removeGuest(plan, g.id))}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
