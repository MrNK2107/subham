import type { BudgetLine } from "./types";

export interface BudgetSummary {
  allocated: number;
  spent: number;
  remaining: number;
  overruns: { id: string; category: string; over: number }[];
}

/** Totals across budget lines, and every line where spending has passed the plan. */
export function summarizeBudget(lines: BudgetLine[]): BudgetSummary {
  const allocated = lines.reduce((a, l) => a + l.allocated, 0);
  const spent = lines.reduce((a, l) => a + l.spent, 0);
  const overruns = lines
    .filter((l) => l.spent > l.allocated)
    .map((l) => ({ id: l.id, category: l.category, over: l.spent - l.allocated }));
  return { allocated, spent, remaining: allocated - spent, overruns };
}
