import { describe, expect, it } from "vitest";
import { guestSummary } from "./guests";
import type { Guest } from "./types";

const g = (over: Partial<Guest>): Guest => ({
  id: "g",
  name: "Guest",
  side: "host",
  rsvp: "pending",
  diet: "veg",
  count: 1,
  ...over,
});

describe("guestSummary", () => {
  it("counts people, not rows, and splits by RSVP and diet", () => {
    const s = guestSummary([
      g({ rsvp: "yes", count: 4, diet: "veg" }),
      g({ rsvp: "yes", count: 2, diet: "jain" }),
      g({ rsvp: "no", count: 3, diet: "nonveg" }),
      g({ rsvp: "pending", count: 5, diet: "nonveg" }),
    ]);
    expect(s).toEqual({
      invited: 14,
      confirmed: 6,
      declined: 3,
      pending: 5,
      expected: 11,
      veg: 4,
      jain: 2,
      nonveg: 5,
    });
  });
});
