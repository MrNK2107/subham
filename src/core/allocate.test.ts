import { describe, expect, it } from "vitest";
import { allocate } from "./allocate";

const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);

describe("allocate", () => {
  it("splits into whole rupees that add up exactly to the total", () => {
    const result = allocate(100_000, [
      { key: "a", weight: 1 },
      { key: "b", weight: 1 },
      { key: "c", weight: 1 },
    ]);
    expect(sum(result)).toBe(100_000);
    const values = [...result.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
    values.forEach((v) => expect(Number.isInteger(v)).toBe(true));
  });

  it("normalises weights that do not sum to 100", () => {
    const result = allocate(1_000, [
      { key: "venue", weight: 70 },
      { key: "food", weight: 70 },
    ]);
    expect(result.get("venue")).toBe(500);
    expect(result.get("food")).toBe(500);
  });

  it("ignores zero, negative and non-finite weights", () => {
    const result = allocate(900, [
      { key: "a", weight: 2 },
      { key: "b", weight: 0 },
      { key: "c", weight: -4 },
      { key: "d", weight: Number.NaN },
      { key: "e", weight: 1 },
    ]);
    expect([...result.keys()]).toEqual(["a", "e"]);
    expect(result.get("a")).toBe(600);
  });

  it("throws when nothing can be allocated", () => {
    expect(() => allocate(1_000, [{ key: "a", weight: 0 }])).toThrow();
    expect(() => allocate(0, [{ key: "a", weight: 1 }])).toThrow();
  });
});
