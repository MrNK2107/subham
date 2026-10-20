"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { UI_LANGS, type UiLang } from "@/core/types";
import { en, type MessageKey, type Messages } from "./en";
import { hi } from "./hi";
import { ta } from "./ta";
import { te } from "./te";

export type { MessageKey };
export type Vars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: Vars) => string;

export const DICTIONARIES: Record<UiLang, Messages> = { en, hi, ta, te };

const STORAGE_KEY = "subham.lang";
const listeners = new Set<() => void>();

export function translate(lang: UiLang, key: MessageKey, vars?: Vars): string {
  const text = DICTIONARIES[lang][key] ?? en[key];
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => String(vars[name] ?? m)) : text;
}

function readLang(): UiLang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (UI_LANGS as readonly string[]).includes(saved ?? "") ? (saved as UiLang) : "en";
  } catch {
    return "en";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The interface language (remembered per browser) and a translator for it. */
export function useI18n() {
  const lang = useSyncExternalStore(subscribe, readLang, () => "en" as UiLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: UiLang) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
    document.documentElement.lang = next;
    listeners.forEach((l) => l());
  }, []);

  const t = useCallback<Translate>((key, vars) => translate(lang, key, vars), [lang]);
  return { lang, setLang, t };
}
