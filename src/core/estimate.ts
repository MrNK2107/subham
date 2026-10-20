import { PER_GUEST } from "./cities";
import type { Brief } from "./types";

export type Verdict = "tight" | "comfortable" | "generous";

export interface BudgetAssessment {
  /** Typical spend per guest for this event type and city tier. */
  perGuest: number;
  /** Typical total for this guest count. */
  typical: number;
  verdict: Verdict;
}

/** Compares a budget with what such an event typically costs in that kind of city. */
export function assessBudget(
  brief: Pick<Brief, "type" | "tier" | "guests" | "budget">,
): BudgetAssessment {
  const perGuest = PER_GUEST[brief.type][brief.tier];
  const typical = perGuest * brief.guests;
  const verdict: Verdict =
    brief.budget < typical * 0.75
      ? "tight"
      : brief.budget > typical * 1.5
        ? "generous"
        : "comfortable";
  return { perGuest, typical, verdict };
}
