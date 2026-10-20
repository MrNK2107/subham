import { describe, expect, it } from "vitest";
import { summarizeBudget } from "./budget-summary";

const line = (id: string, allocated: number, spent: number) => ({
  id,
  fnId: "general",
  category: id,
  allocated,
  spent,
});

describe("summarizeBudget", () => {
  it("totals planned and spent money and lists overruns", () => {
    expect(summarizeBudget([line("Venue", 1000, 1200), line("Food", 2000, 500)])).toEqual({
      allocated: 3000,
      spent: 1700,
      remaining: 1300,
      overruns: [{ id: "Venue", category: "Venue", over: 200 }],
    });
  });
});
