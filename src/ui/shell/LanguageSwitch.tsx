"use client";

import { AI_LANGS, UI_LANGS, type UiLang } from "@/core/types";
import { useI18n } from "@/i18n";

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="lang-switch">
      <span className="sr-only">{t("lang.label")}</span>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <select
        value={lang}
        aria-label={t("lang.label")}
        onChange={(e) => setLang(e.target.value as UiLang)}
      >
        {UI_LANGS.map((code) => (
          <option key={code} value={code} lang={code}>
            {AI_LANGS[code].native}
          </option>
        ))}
      </select>
    </label>
  );
}
