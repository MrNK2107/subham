import { describe, expect, it } from "vitest";
import { emptyDraft, fromPatch, toBrief, validateStep, withType } from "./draft";

const TODAY = "2026-10-20";

const filled = () => ({
  ...withType(emptyDraft("en"), "wedding", "en"),
  title: "Priya weds Arjun",
  city: "Madurai",
  date: "2027-02-14",
  guests: "300",
  budget: "15 lakh",
});

describe("wizard draft", () => {
  it("preselects the functions for the chosen type in the interface language", () => {
    expect(withType(emptyDraft("ta"), "wedding", "ta").functions).toHaveLength(5);
    expect(withType(emptyDraft("en"), "birthday", "en").functions).toEqual(["Birthday Party"]);
  });

  it("requires a type on step 1 and a function on step 2", () => {
    expect(validateStep(emptyDraft("en"), 1, TODAY)).toEqual({ type: "error.required" });
    expect(validateStep({ ...filled(), functions: [] }, 2, TODAY)).toEqual({
      functions: "error.functions",
    });
  });

  it("checks every detail on step 3", () => {
    const errors = validateStep(
      { ...filled(), title: " ", city: "", date: "2020-01-01", guests: "0", budget: "lots" },
      3,
      TODAY,
    );
    expect(errors).toEqual({
      title: "error.required",
      city: "error.required",
      date: "error.date",
      guests: "error.guests",
      budget: "error.budget",
    });
    expect(validateStep(filled(), 3, TODAY)).toEqual({});
  });

  it("builds a valid brief, reading lakh amounts and guessing the city tier", () => {
    const brief = toBrief(filled());
    expect(brief.budget).toBe(1_500_000);
    expect(brief.guests).toBe(300);
    expect(brief.tier).toBe("tier2");
  });

  it("prefills from an AI-extracted patch", () => {
    const draft = fromPatch(
      { type: "birthday", city: "Chennai", budget: 80000, language: "ta" },
      "en",
    );
    expect(draft.type).toBe("birthday");
    expect(draft.functions).toEqual(["Birthday Party"]);
    expect(draft.budget).toBe("80000");
    expect(draft.tier).toBe("metro");
    expect(draft.language).toBe("ta");
  });
});
