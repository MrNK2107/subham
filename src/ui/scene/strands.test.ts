import { describe, expect, it } from "vitest";
import { chase, layoutStrands, pointOnStrand, type StrandSpec } from "./strands";

const strand: StrandSpec = { from: [-2, 1, 0], to: [2, 1, 0], sag: 1, bulbs: 10, phase: 0 };

describe("strands", () => {
  it("hangs lowest in the middle and meets its anchors at the ends", () => {
    expect(pointOnStrand(strand, 0)).toEqual([-2, 1, 0]);
    expect(pointOnStrand(strand, 1)).toEqual([2, 1, 0]);
    expect(pointOnStrand(strand, 0.5)[1]).toBeCloseTo(0);
  });

  it("swings in the middle but not at the anchors", () => {
    expect(pointOnStrand(strand, 0, 0.3)[2]).toBeCloseTo(0);
    expect(pointOnStrand(strand, 0.5, 0.3)[2]).toBeCloseTo(0.3);
  });

  it("keeps chase brightness between a dim base and full", () => {
    for (let i = 0; i < 40; i++) {
      const b = chase(i, i * 0.37, 1);
      expect(b).toBeGreaterThanOrEqual(0.18);
      expect(b).toBeLessThanOrEqual(1);
    }
  });

  it("lays out five strands that get wider with distance", () => {
    const strands = layoutStrands(16 / 9);
    expect(strands).toHaveLength(5);
    const width = (s: StrandSpec) => s.to[0] - s.from[0];
    expect(width(strands[4]!)).toBeGreaterThan(width(strands[0]!));
    strands.forEach((s) => expect(s.bulbs).toBeGreaterThan(8));
  });
});
