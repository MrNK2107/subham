import { describe, expect, it } from "vitest";
import { buildLane, LANE_HALF } from "./lane";

describe("buildLane", () => {
  const lane = buildLane({ depth: 60, curtains: 8 });

  it("lines both sides of the street with houses that never block the lane", () => {
    const left = lane.houses.filter((h) => h.x < 0);
    const right = lane.houses.filter((h) => h.x > 0);
    expect(left.length).toBeGreaterThan(5);
    expect(right.length).toBeGreaterThan(5);
    for (const h of lane.houses)
      expect(Math.abs(h.x) - h.width / 2).toBeGreaterThanOrEqual(LANE_HALF - 0.01);
  });

  it("strings strands across the street at intervals, receding into the distance", () => {
    expect(lane.crossings.length).toBeGreaterThanOrEqual(10);
    const zs = lane.crossings.map((c) => c.from[2]);
    expect([...zs].sort((a, b) => b - a)).toEqual(zs);
    for (const c of lane.crossings) {
      expect(c.from[0]).toBeCloseTo(-LANE_HALF);
      expect(c.to[0]).toBeCloseTo(LANE_HALF);
    }
  });

  it("hangs light curtains down house fronts, above the ground", () => {
    expect(lane.curtains.length).toBe(8);
    for (const c of lane.curtains) {
      expect(c.bottom).toBeGreaterThan(0.5);
      expect(c.top).toBeGreaterThan(c.bottom);
      expect(Math.abs(c.x)).toBeCloseTo(LANE_HALF - 0.05);
    }
  });

  it("is deterministic for the same seed", () => {
    expect(buildLane({ depth: 60, curtains: 8 })).toEqual(lane);
  });
});
