import { describe, expect, it } from "vitest";
import { GROUPS, groupLevels, stillLevels } from "./controller";

describe("groupLevels", () => {
  it("returns one weight per baked layer, ambient always fully on", () => {
    for (const t of [0, 3.3, 10, 47.9]) {
      const w = groupLevels(t);
      expect(w).toHaveLength(GROUPS.length);
      expect(w[0]).toBe(1);
      for (const v of w) expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it("chases: during the first mode the lit phase moves along the strand", () => {
    const lit = (t: number) => {
      const chase = groupLevels(t).slice(1, 5);
      return chase.indexOf(Math.max(...chase));
    };
    const seen = new Set([0.05, 0.22, 0.39, 0.56].map(lit));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("never switches a phase fully dark, like a real bulb", () => {
    for (let t = 0; t < 30; t += 0.07) {
      for (const v of groupLevels(t).slice(1)) expect(v).toBeGreaterThan(0.03);
    }
  });

  it("changes smoothly across mode boundaries", () => {
    for (let t = 0.01; t < 30; t += 0.01) {
      const a = groupLevels(t - 0.01);
      const b = groupLevels(t);
      for (let i = 0; i < a.length; i++) expect(Math.abs(a[i]! - b[i]!)).toBeLessThan(0.5);
    }
  });

  it("flares every light group on a burst", () => {
    const calm = groupLevels(2);
    const burst = groupLevels(2, 1);
    for (let i = 1; i < calm.length; i++) expect(burst[i]!).toBeGreaterThan(calm[i]!);
  });
});

describe("stillLevels", () => {
  it("lights everything steadily", () => {
    expect(stillLevels()).toEqual(GROUPS.map(() => 1));
  });
});
