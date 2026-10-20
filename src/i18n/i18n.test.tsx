import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { en } from "./en";
import { DICTIONARIES, translate, useI18n } from "./index";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  for (const [lang, dict] of Object.entries(DICTIONARIES)) {
    it(`${lang} has exactly the English keys, none empty, with the same placeholders`, () => {
      expect(Object.keys(dict).sort()).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), key).not.toBe("");
        expect(placeholders(value), key).toEqual(placeholders(en[key as keyof typeof en]));
      }
    });
  }
});

describe("translate", () => {
  it("fills placeholders", () => {
    expect(translate("en", "plan.countdown", { days: 12 })).toBe("12 days to go");
  });
});

describe("useI18n", () => {
  it("switches language, remembers it and sets the document language", () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.lang).toBe("en");
    act(() => result.current.setLang("ta"));
    expect(result.current.lang).toBe("ta");
    expect(result.current.t("tab.budget")).not.toBe("Budget");
    expect(localStorage.getItem("subham.lang")).toBe("ta");
    expect(document.documentElement.lang).toBe("ta");
    act(() => result.current.setLang("en"));
  });
});
