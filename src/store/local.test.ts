import { describe, expect, it, vi } from "vitest";
import { assemblePlan } from "@/core/assemble";
import { templateBlueprint } from "@/core/templates";
import { birthdayBrief, TODAY, weddingBrief } from "@/test/fixtures";
import { deletePlan, getPlan, loadPlans, savePlan, setSyncTarget, subscribe } from "./local";

const make = (id: string, brief = weddingBrief) =>
  assemblePlan(brief, templateBlueprint(brief), { id, today: TODAY, now: new Date() });

describe("local plan store", () => {
  it("round-trips a saved plan", () => {
    const plan = make("a");
    savePlan(plan);
    expect(getPlan("a")).toEqual(plan);
    expect(loadPlans()).toHaveLength(1);
  });

  it("ignores corrupt storage and entries that fail validation", () => {
    localStorage.setItem("subham.plans", "{not json");
    expect(loadPlans()).toEqual([]);
    localStorage.setItem("subham.plans", JSON.stringify([make("ok"), { id: "bad", brief: {} }]));
    expect(loadPlans().map((p) => p.id)).toEqual(["ok"]);
  });

  it("lists the most recently updated plan first", () => {
    savePlan({ ...make("old", birthdayBrief), updatedAt: "2026-01-01T00:00:00.000Z" });
    savePlan({ ...make("new"), updatedAt: "2026-05-01T00:00:00.000Z" });
    expect(loadPlans().map((p) => p.id)).toEqual(["new", "old"]);
  });

  it("returns the same array while nothing changes (stable snapshot)", () => {
    savePlan(make("s"));
    expect(loadPlans()).toBe(loadPlans());
  });

  it("notifies subscribers and the sync target on save and delete", () => {
    const listener = vi.fn();
    const sync = { save: vi.fn(), remove: vi.fn() };
    const stop = subscribe(listener);
    setSyncTarget(sync);
    const plan = make("n");
    savePlan(plan);
    deletePlan("n");
    expect(listener).toHaveBeenCalledTimes(2);
    expect(sync.save).toHaveBeenCalledWith(plan);
    expect(sync.remove).toHaveBeenCalledWith("n");
    expect(getPlan("n")).toBeUndefined();
    stop();
    setSyncTarget(null);
  });
});
