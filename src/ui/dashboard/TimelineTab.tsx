"use client";

import { useState, type FormEvent } from "react";
import { googleCalendarUrl } from "@/core/ics";
import type { Plan } from "@/core/types";
import { useI18n } from "@/i18n";
import { localToday } from "@/ui/api";
import { BulbStrand } from "@/ui/common/BulbStrand";
import type { PlanActions } from "./Dashboard";
import styles from "./Dashboard.module.css";

export function TimelineTab({ plan, actions }: { plan: Plan; actions: PlanActions }) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState("");
  const today = localToday();
  const lang = plan.brief.language;
  const last = plan.functions.reduce((m, f) => (f.date > m ? f.date : m), plan.brief.date);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError(t("error.required"));
    if (!due) return setError(t("timeline.taskDue"));
    const failed = actions.apply({ op: "addTask", title: title.trim(), due });
    setError(failed ? t("timeline.taskDue") : "");
    if (!failed) {
      setTitle("");
      setDue("");
    }
  }

  return (
    <div className={styles.twoCol}>
      <section className="card" aria-labelledby="todo">
        <h2 id="todo">{t("timeline.tasks")}</h2>
        <div className={styles.sectionStrand}>
          <BulbStrand
            value={plan.tasks.filter((x) => x.done).length}
            max={plan.tasks.length}
            bulbs={16}
            label={t("overview.tasks")}
            valueText={t("overview.ofTotal", {
              done: plan.tasks.filter((x) => x.done).length,
              total: plan.tasks.length,
            })}
          />
        </div>
        {plan.tasks.length === 0 && <p>{t("timeline.empty")}</p>}
        <ul className={styles.tasks}>
          {plan.tasks.map((task) => (
            <li key={task.id} className={task.done ? styles.done : undefined}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => actions.apply({ op: "toggleTask", id: task.id })}
                />
                <span lang={lang}>{task.title}</span>
              </label>
              <span className={styles.taskMeta}>
                {!task.done && task.due < today ? (
                  <span className="badge badge-bad">{t("timeline.overdue")}</span>
                ) : (
                  <span className="badge">{t("timeline.due", { date: task.due })}</span>
                )}
                <a
                  className={`${styles.iconLink} no-print`}
                  href={googleCalendarUrl(task.title, task.due, plan.brief.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("timeline.googleCalendar", { title: task.title })}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="16"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </a>
              </span>
            </li>
          ))}
        </ul>

        <form className={`${styles.inlineForm} no-print`} onSubmit={add} noValidate>
          <h3>{t("timeline.addTask")}</h3>
          <div className="field">
            <label htmlFor="task-title">{t("timeline.taskTitle")}</label>
            <input
              id="task-title"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="task-due">{t("timeline.dueDate")}</label>
            <input
              id="task-due"
              type="date"
              min={today}
              max={last}
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {t("timeline.add")}
          </button>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>

      <section className="card" aria-labelledby="runsheet">
        <h2 id="runsheet">{t("timeline.runSheet")}</h2>
        {plan.functions.map((f) => {
          const items = plan.runSheet.filter((r) => r.fnId === f.id);
          return (
            <div key={f.id} className={styles.runGroup}>
              <h3 lang={lang}>
                {f.name} <span className={styles.fnWhen}>{f.date}</span>
              </h3>
              <ol className={styles.run}>
                {(items.length ? items : [{ id: f.id, time: f.start, activity: f.name }]).map(
                  (r) => (
                    <li key={r.id}>
                      <time>{r.time}</time>
                      <span lang={lang}>{r.activity}</span>
                    </li>
                  ),
                )}
              </ol>
            </div>
          );
        })}
      </section>
    </div>
  );
}
