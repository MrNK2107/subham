import { describe, expect, it } from "vitest";
import { assemblePlan, cleanBlueprint } from "./assemble";
import { templateBlueprint } from "./templates";
import { PRESETS } from "./presets";
import { birthdayBrief, TODAY, weddingBrief } from "@/test/fixtures";

const ctx = { id: "p1", today: TODAY, now: new Date("2026-10-20T10:00:00Z") };

describe("templateBlueprint", () => {
  it("produces a complete blueprint for every event type", () => {
    for (const type of ["wedding", "birthday", "community", "festival"] as const) {
      const bp = templateBlueprint({ ...weddingBrief, type, functions: PRESETS[type] });
      expect(cleanBlueprint(bp)).not.toBeNull();
      expect(bp.tasks.length).toBeGreaterThanOrEqual(6);
      expect(bp.vendors.length).toBeGreaterThanOrEqual(4);
      expect(bp.ideas.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("assemblePlan", () => {
  const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), ctx);

  it("allocates budget lines that add up exactly to the brief's budget", () => {
    expect(plan.budget.reduce((a, l) => a + l.allocated, 0)).toBe(weddingBrief.budget);
  });

  it("creates one function per requested function, dated around the event", () => {
    expect(plan.functions.map((f) => f.name)).toEqual(weddingBrief.functions);
    for (const fn of plan.functions) {
      expect(fn.date >= TODAY).toBe(true);
      expect(fn.date <= "2027-02-16").toBe(true);
    }
  });

  it("dates every task between today and its function", () => {
    const fnDate = new Map(plan.functions.map((f) => [f.id, f.date]));
    for (const task of plan.tasks) {
      expect(task.due >= TODAY).toBe(true);
      expect(task.due <= (task.fnId ? fnDate.get(task.fnId)! : weddingBrief.date)).toBe(true);
    }
  });

  it("links budget lines only to known functions or the whole event", () => {
    const ids = new Set([...plan.functions.map((f) => f.id), "general"]);
    plan.budget.forEach((l) => expect(ids.has(l.fnId)).toBe(true));
  });

  it("works for a single-function birthday", () => {
    const bday = assemblePlan(birthdayBrief, templateBlueprint(birthdayBrief), ctx);
    expect(bday.functions).toHaveLength(1);
    expect(bday.budget.reduce((a, l) => a + l.allocated, 0)).toBe(60_000);
  });

  it("maps unknown function names in the blueprint to the whole event", () => {
    const bp = templateBlueprint(birthdayBrief);
    bp.budget.push({ fn: "Mystery", category: "Fireworks", percent: 5 });
    const result = assemblePlan(birthdayBrief, bp, ctx);
    expect(result.budget.find((l) => l.category === "Fireworks")?.fnId).toBe("general");
  });

  it("clamps functions planned before today when the event is close", () => {
    const soon = { ...weddingBrief, date: "2026-10-21" };
    const result = assemblePlan(soon, templateBlueprint(soon), ctx);
    result.functions.forEach((f) => expect(f.date >= TODAY).toBe(true));
  });
});

describe("cleanBlueprint", () => {
  it("keeps valid items and drops invalid ones", () => {
    const bp = cleanBlueprint({
      functions: [{ name: "Party", dayOffset: 0, start: "25:00" }],
      budget: [
        { fn: "Party", category: "Food", percent: 60 },
        { fn: "Party", category: "", percent: 10 },
      ],
      tasks: [
        { title: "Book venue", daysBefore: 30 },
        { title: "x", daysBefore: -3 },
      ],
      runSheet: "nope",
      vendors: [{ category: "Caterer", questions: ["Is GST included?", 42] }],
      ideas: [{ kind: "theme", title: "Jungle", description: "Leaves and lights" }],
    });
    expect(bp).not.toBeNull();
    expect(bp!.functions).toHaveLength(0);
    expect(bp!.budget).toHaveLength(1);
    expect(bp!.tasks).toHaveLength(1);
    expect(bp!.runSheet).toEqual([]);
    expect(bp!.vendors[0]!.questions).toEqual(["Is GST included?"]);
  });

  it("returns null without a usable budget", () => {
    expect(cleanBlueprint({ budget: [] })).toBeNull();
    expect(cleanBlueprint("hello")).toBeNull();
    expect(cleanBlueprint(null)).toBeNull();
  });
});
