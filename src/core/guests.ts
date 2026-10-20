import type { Guest } from "./types";

export interface GuestSummary {
  invited: number;
  confirmed: number;
  declined: number;
  pending: number;
  /** Confirmed plus pending: the headcount to plan food for. */
  expected: number;
  veg: number;
  jain: number;
  nonveg: number;
}

/** Headcounts in people (each row may be a family of several), excluding declines from diets. */
export function guestSummary(guests: Guest[]): GuestSummary {
  const s: GuestSummary = {
    invited: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    expected: 0,
    veg: 0,
    jain: 0,
    nonveg: 0,
  };
  for (const g of guests) {
    s.invited += g.count;
    if (g.rsvp === "yes") s.confirmed += g.count;
    else if (g.rsvp === "no") s.declined += g.count;
    else s.pending += g.count;
    if (g.rsvp !== "no") s[g.diet] += g.count;
  }
  s.expected = s.confirmed + s.pending;
  return s;
}
