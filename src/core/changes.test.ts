import { describe, expect, it } from "vitest";
import { applyChange, ChangeError, describeChange } from "./changes";
import { assemblePlan } from "./assemble";
import { templateBlueprint } from "./templates";
import { TODAY, weddingBrief } from "@/test/fixtures";

const now = new Date("2026-10-20T10:00:00Z");
const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), {
  id: "p1",
  today: TODAY,
  now,
});
const [a, b] = plan.budget;
const total = (p: typeof plan) => p.budget.reduce((s, l) => s + l.allocated, 0);

describe("applyChange", () => {
  it("moves budget without changing the total", () => {
    const next = applyChange(plan, { op: "moveBudget", from: a!.id, to: b!.id, amount: 1000 }, now);
    expect(total(next)).toBe(total(plan));
    expect(next.budget[0]!.allocated).toBe(a!.allocated - 1000);
  });

  it("refuses to move more than a line has left", () => {
    expect(() =>
      applyChange(
        plan,
        { op: "moveBudget", from: a!.id, to: b!.id, amount: a!.allocated + 1 },
        now,
      ),
    ).toThrow(ChangeError);
  });

  it("logs spending", () => {
    const next = applyChange(plan, { op: "logSpend", line: a!.id, amount: 5000 }, now);
    expect(next.budget[0]!.spent).toBe(5000);
  });

  it("rejects unknown ids with a readable error", () => {
    expect(() => applyChange(plan, { op: "toggleTask", id: "nope" }, now)).toThrow(ChangeError);
  });

  it("toggles a task", () => {
    const id = plan.tasks[0]!.id;
    expect(applyChange(plan, { op: "toggleTask", id }, now).tasks[0]!.done).toBe(true);
  });

  it("adds a task with a fresh id but refuses dates in the past or after the event", () => {
    const next = applyChange(
      plan,
      { op: "addTask", title: "Book nadaswaram", due: "2026-12-01" },
      now,
    );
    const added = next.tasks.find((t) => t.title === "Book nadaswaram")!;
    expect(added.due).toBe("2026-12-01");
    expect(plan.tasks.some((t) => t.id === added.id)).toBe(false);
    expect(() => applyChange(plan, { op: "addTask", title: "x", due: "2026-01-01" }, now)).toThrow(
      ChangeError,
    );
    expect(() => applyChange(plan, { op: "addTask", title: "x", due: "2028-01-01" }, now)).toThrow(
      ChangeError,
    );
  });

  it("updates vendor status and quote", () => {
    const v = plan.vendors[0]!;
    const next = applyChange(
      plan,
      { op: "setVendorStatus", id: v.id, status: "booked", quote: 90000 },
      now,
    );
    expect(next.vendors[0]).toMatchObject({ status: "booked", quote: 90000 });
  });

  it("adds vendors and ideas", () => {
    const withVendor = applyChange(
      plan,
      { op: "addVendor", category: "Mehendi artist", questions: [] },
      now,
    );
    expect(withVendor.vendors.at(-1)!.category).toBe("Mehendi artist");
    const withIdea = applyChange(
      plan,
      { op: "addIdea", kind: "food", title: "Filter coffee bar", description: "Brass tumblers" },
      now,
    );
    expect(withIdea.ideas.at(-1)!.title).toBe("Filter coffee bar");
  });

  it("does not mutate the original plan", () => {
    applyChange(plan, { op: "logSpend", line: a!.id, amount: 5000 }, now);
    expect(plan.budget[0]!.spent).toBe(0);
  });
});

describe("describeChange", () => {
  it("names the categories and formats the amount", () => {
    const d = describeChange(plan, { op: "moveBudget", from: a!.id, to: b!.id, amount: 25000 });
    expect(d.key).toBe("change.moveBudget");
    expect(d.vars).toMatchObject({ from: a!.category, to: b!.category, amount: "₹25,000" });
  });
});
