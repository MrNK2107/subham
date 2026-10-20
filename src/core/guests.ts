import { nextId } from "./changes";
import { PlanSchema, type Guest, type Plan } from "./types";

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

const touch = (plan: Plan, guests: Guest[]): Plan =>
  PlanSchema.parse({ ...plan, guests, updatedAt: new Date().toISOString() });

/** Adds a guest or family; throws if the entry is invalid (e.g. empty name). */
export function addGuest(plan: Plan, guest: Omit<Guest, "id">): Plan {
  return touch(plan, [
    ...plan.guests,
    { ...guest, name: guest.name.trim(), id: nextId("g", plan.guests) },
  ]);
}

export function updateGuest(plan: Plan, id: string, patch: Partial<Omit<Guest, "id">>): Plan {
  return touch(
    plan,
    plan.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)),
  );
}

export function removeGuest(plan: Plan, id: string): Plan {
  return touch(
    plan,
    plan.guests.filter((g) => g.id !== id),
  );
}
