import { describe, expect, it } from "vitest";
import { applyChange, ChangeError, describeChange, nextId } from "./changes";
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

describe("nextId", () => {
  it("starts at 1 and skips past the highest numeric id with the prefix", () => {
    expect(nextId("t", [])).toBe("t1");
    expect(nextId("t", [{ id: "t1" }, { id: "t14" }, { id: "v99" }])).toBe("t15");
  });

  it("ignores ids whose suffix is not a number", () => {
    expect(nextId("i", [{ id: "i2" }, { id: "iabc" }])).toBe("i3");
  });
});

describe("applyChange edge cases", () => {
  it("refuses to move budget onto the same line", () => {
    expect(() =>
      applyChange(plan, { op: "moveBudget", from: a!.id, to: a!.id, amount: 1 }, now),
    ).toThrow(/two different/);
  });

  it("counts only unspent money as movable", () => {
    const spent = applyChange(plan, { op: "logSpend", line: a!.id, amount: a!.allocated }, now);
    expect(() =>
      applyChange(spent, { op: "moveBudget", from: a!.id, to: b!.id, amount: 1 }, now),
    ).toThrow(ChangeError);
  });

  it("links a new task to an existing function and rejects unknown functions", () => {
    const fn = plan.functions[0]!;
    const next = applyChange(
      plan,
      { op: "addTask", title: "Confirm pandit", due: "2026-12-01", fnId: fn.id },
      now,
    );
    expect(next.tasks.find((t) => t.title === "Confirm pandit")!.fnId).toBe(fn.id);
    expect(() =>
      applyChange(plan, { op: "addTask", title: "x", due: "2026-12-01", fnId: "nope" }, now),
    ).toThrow(/no function/);
  });

  it("keeps tasks sorted by due date after adding one", () => {
    const next = applyChange(plan, { op: "addTask", title: "Early", due: "2026-10-21" }, now);
    const dues = next.tasks.map((t) => t.due);
    expect(dues).toEqual([...dues].sort());
  });

  it("leaves the quote alone when a status change has none", () => {
    const v = plan.vendors[0]!;
    const quoted = applyChange(
      plan,
      { op: "setVendorStatus", id: v.id, status: "contacted", quote: 1234 },
      now,
    );
    const booked = applyChange(quoted, { op: "setVendorStatus", id: v.id, status: "booked" }, now);
    expect(booked.vendors[0]).toMatchObject({ status: "booked", quote: 1234 });
  });

  it("stamps updatedAt with the time of the change", () => {
    const later = new Date("2026-10-21T08:30:00Z");
    expect(applyChange(plan, { op: "toggleTask", id: plan.tasks[0]!.id }, later).updatedAt).toBe(
      later.toISOString(),
    );
  });

  it("re-validates and rejects a result that breaks the schema", () => {
    expect(() =>
      applyChange(plan, { op: "addIdea", kind: "food", title: "", description: "" }, now),
    ).toThrow(/invalid/);
  });
});

describe("describeChange for every op", () => {
  it("describes spend, tasks, vendors and ideas", () => {
    const t = plan.tasks[0]!;
    const v = plan.vendors[0]!;
    expect(describeChange(plan, { op: "logSpend", line: a!.id, amount: 500 })).toEqual({
      key: "change.logSpend",
      vars: { amount: "₹500", line: a!.category },
    });
    expect(describeChange(plan, { op: "addTask", title: "Call DJ", due: "2026-11-01" })).toEqual({
      key: "change.addTask",
      vars: { title: "Call DJ", due: "2026-11-01" },
    });
    expect(describeChange(plan, { op: "toggleTask", id: t.id }).vars.title).toBe(t.title);
    expect(
      describeChange(plan, { op: "setVendorStatus", id: v.id, status: "booked", quote: 90000 })
        .vars,
    ).toEqual({ vendor: v.category, status: "booked", quote: "₹90,000" });
    expect(
      describeChange(plan, { op: "setVendorStatus", id: v.id, status: "contacted" }).vars.quote,
    ).toBe("");
    expect(
      describeChange(plan, { op: "addVendor", category: "Florist", questions: [] }).vars,
    ).toEqual({ category: "Florist" });
    expect(
      describeChange(plan, {
        op: "addIdea",
        kind: "decor",
        title: "Marigold arch",
        description: "",
      }).vars,
    ).toEqual({ title: "Marigold arch" });
  });

  it("falls back to raw ids when something is missing from the plan", () => {
    expect(describeChange(plan, { op: "logSpend", line: "zz", amount: 1 }).vars.line).toBe("zz");
    expect(describeChange(plan, { op: "toggleTask", id: "tq" }).vars.title).toBe("tq");
    expect(
      describeChange(plan, { op: "setVendorStatus", id: "vq", status: "booked" }).vars.vendor,
    ).toBe("vq");
  });
});
