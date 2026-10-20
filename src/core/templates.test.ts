import { describe, expect, it } from "vitest";
import { templateBlueprint } from "./templates";
import { birthdayBrief, weddingBrief } from "@/test/fixtures";

describe("templateBlueprint", () => {
  it("splits the whole budget across general and per-function lines", () => {
    const bp = templateBlueprint(weddingBrief);
    const total = bp.budget.reduce((s, l) => s + l.percent, 0);
    expect(total).toBeCloseTo(100, 5);
    for (const fn of weddingBrief.functions) {
      expect(bp.budget.some((l) => l.fn === fn)).toBe(true);
    }
  });

  it("keeps one function entry per requested function, in order", () => {
    const bp = templateBlueprint(weddingBrief);
    expect(bp.functions.map((f) => f.name)).toEqual(weddingBrief.functions);
  });

  it("falls back to a generic run sheet for unknown functions", () => {
    const bp = templateBlueprint({ ...birthdayBrief, functions: ["Kolam workshop"] });
    const steps = bp.runSheet.filter((s) => s.fn === "Kolam workshop");
    expect(steps.map((s) => s.activity)).toEqual([
      "Kolam workshop begins",
      "Main programme",
      "Food and thanks",
    ]);
  });

  it.each([
    ["veg", "vegetarian"],
    ["mixed", "veg and non-veg"],
    ["jain", "Jain"],
  ] as const)("phrases food ideas for a %s menu", (food, phrase) => {
    const bp = templateBlueprint({ ...weddingBrief, food });
    const foodIdeas = bp.ideas.filter((i) => i.kind === "food");
    expect(foodIdeas.length).toBeGreaterThan(0);
    for (const idea of foodIdeas) expect(idea.description).toContain(`Keep it ${phrase}.`);
  });
});
