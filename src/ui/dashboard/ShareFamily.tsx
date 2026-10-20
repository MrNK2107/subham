"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/i18n";
import { firebaseEnabled } from "@/store/firebase";
import styles from "./Dashboard.module.css";

/** Share a synced plan with family by email, as an editor or a viewer (enforced by Firestore rules). */
export function ShareFamily({ planId }: { planId: string }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [status, setStatus] = useState("");

  if (!firebaseEnabled) return null;

  async function share(e: FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setStatus(t("error.required"));
    try {
      const { sharePlan } = await import("@/store/cloud");
      await sharePlan(planId, email, role);
      setStatus(t("family.done", { email: email.trim() }));
      setEmail("");
    } catch {
      setStatus(t("family.signIn"));
    }
  }

  return (
    <details className={`card no-print ${styles.family}`}>
      <summary>{t("family.title")}</summary>
      <form className={styles.inlineForm} onSubmit={share} noValidate>
        <div className="field">
          <label htmlFor="family-email">{t("family.email")}</label>
          <input
            id="family-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="family-role">{t("family.role")}</label>
          <select
            id="family-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
          >
            <option value="editor">{t("family.editor")}</option>
            <option value="viewer">{t("family.viewer")}</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          {t("family.send")}
        </button>
        <p role="status" className="hint">
          {status}
        </p>
      </form>
    </details>
  );
}
