import { describe, expect, it } from "vitest";
import { assessBudget } from "./estimate";
import { PER_GUEST } from "./cities";

const base = { type: "wedding" as const, tier: "metro" as const, guests: 100 };

describe("assessBudget", () => {
  const typical = PER_GUEST.wedding.metro * 100;

  it("reports the typical spend for the city tier", () => {
    expect(assessBudget({ ...base, budget: typical }).typical).toBe(typical);
    expect(assessBudget({ ...base, budget: typical }).perGuest).toBe(PER_GUEST.wedding.metro);
  });

  it("calls a budget under 75% of typical tight", () => {
    expect(assessBudget({ ...base, budget: Math.floor(typical * 0.74) }).verdict).toBe("tight");
  });

  it("calls a budget between 75% and 150% comfortable", () => {
    expect(assessBudget({ ...base, budget: Math.ceil(typical * 0.75) }).verdict).toBe(
      "comfortable",
    );
    expect(assessBudget({ ...base, budget: typical * 1.5 }).verdict).toBe("comfortable");
  });

  it("calls a budget above 150% generous", () => {
    expect(assessBudget({ ...base, budget: typical * 1.5 + 1 }).verdict).toBe("generous");
  });
});
