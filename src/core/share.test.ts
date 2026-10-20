import { describe, expect, it } from "vitest";
import { whatsappText, whatsappUrl } from "./share";
import { assemblePlan } from "./assemble";
import { templateBlueprint } from "./templates";
import { TODAY, weddingBrief } from "@/test/fixtures";

const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), {
  id: "p1",
  today: TODAY,
  now: new Date("2026-10-20T10:00:00Z"),
});

const labels = {
  budget: "Budget",
  spent: "Spent",
  next: "Next up",
  vendorsLeft: "Vendors to book",
};

describe("whatsappText", () => {
  it("summarises the plan with the title, budget and next open tasks", () => {
    const text = whatsappText(plan, labels);
    expect(text).toContain(weddingBrief.title);
    expect(text).toContain("₹15,00,000");
    expect(text).toContain(plan.tasks[0]!.title);
    expect(text).toContain("Vendors to book");
  });
});

describe("whatsappUrl", () => {
  it("encodes the text for wa.me", () => {
    expect(whatsappUrl("a b&c")).toBe("https://wa.me/?text=a%20b%26c");
  });
});

describe("whatsappText edge cases", () => {
  it("shows a dash when every vendor is booked and lists at most five open tasks", () => {
    const booked = {
      ...plan,
      vendors: plan.vendors.map((v) => ({ ...v, status: "booked" as const })),
    };
    const text = whatsappText(booked, labels);
    expect(text).toContain("Vendors to book: —");
    expect(text.split("\n").filter((l) => l.startsWith("☐")).length).toBeLessThanOrEqual(5);
  });

  it("totals spending across budget lines and skips finished tasks", () => {
    const spent = {
      ...plan,
      budget: plan.budget.map((l, i) => (i < 2 ? { ...l, spent: 1000 } : l)),
      tasks: plan.tasks.map((t, i) => (i === 0 ? { ...t, done: true } : t)),
    };
    const text = whatsappText(spent, labels);
    expect(text).toContain("Spent: ₹2,000");
    expect(text).not.toContain(`☐ ${plan.tasks[0]!.title} (`);
  });
});
