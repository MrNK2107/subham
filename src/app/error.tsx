"use client";

import { useI18n } from "@/i18n";

/** Shown when a page crashes; never reveals the error details. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="container status-page" role="alert">
      <h1>{t("error.pageTitle")}</h1>
      <button type="button" className="btn btn-primary" onClick={reset}>
        {t("error.retry")}
      </button>
    </div>
  );
}
