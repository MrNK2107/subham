import { describe, expect, it } from "vitest";
import { addGuest, guestSummary, removeGuest, updateGuest } from "./guests";
import { assemblePlan } from "./assemble";
import { templateBlueprint } from "./templates";
import { TODAY, weddingBrief } from "@/test/fixtures";
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

describe("guest edits", () => {
  const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), {
    id: "p1",
    today: TODAY,
    now: new Date(),
  });

  it("adds, updates and removes guests without touching the original", () => {
    const added = addGuest(plan, {
      name: "Iyer family",
      side: "bride",
      rsvp: "pending",
      diet: "veg",
      count: 4,
    });
    expect(added.guests).toHaveLength(1);
    const id = added.guests[0]!.id;
    const updated = updateGuest(added, id, { rsvp: "yes" });
    expect(updated.guests[0]!.rsvp).toBe("yes");
    expect(removeGuest(updated, id).guests).toHaveLength(0);
    expect(plan.guests).toHaveLength(0);
  });

  it("rejects an invalid guest", () => {
    expect(() =>
      addGuest(plan, { name: " ", side: "host", rsvp: "pending", diet: "veg", count: 1 }),
    ).toThrow();
  });
});
