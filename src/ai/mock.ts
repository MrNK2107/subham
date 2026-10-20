import { templateBlueprint } from "@/core/templates";
import type { AiProvider } from "./contracts";

const BUDGET_WORDS = /budget|over|rebalance|money|बजट|பட்ஜெட்|బడ్జెట్/i;

/** Deterministic stand-in for a model, used by end-to-end tests (AI_PROVIDER=mock). */
export const mockProvider: AiProvider = {
  name: "mock",
  async blueprint(brief) {
    return templateBlueprint(brief);
  },
  async extractBrief() {
    return {
      type: "wedding",
      title: "Kavya & Rohan's wedding",
      city: "Hyderabad",
      guests: 250,
      budget: 1_200_000,
      language: "te",
    };
  },
  async converse(plan, history) {
    const last = history.at(-1)?.text ?? "";
    if (BUDGET_WORDS.test(last)) {
      const room = (l: (typeof plan.budget)[number]) => l.allocated - l.spent;
      const over = plan.budget.find((l) => l.spent > l.allocated);
      const to = over ?? plan.budget[0]!;
      const from = plan.budget.filter((l) => l.id !== to.id).sort((a, b) => room(b) - room(a))[0];
      const amount = Math.min(
        over ? over.spent - over.allocated : Math.floor((from?.allocated ?? 0) / 10),
        from ? room(from) : 0,
      );
      if (from && amount > 0) {
        return {
          reply: `I suggest moving money from ${from.category} to ${to.category}.`,
          changes: [{ op: "moveBudget", from: from.id, to: to.id, amount }],
        };
      }
    }
    return {
      reply: "Happy to help. Ask me to rebalance the budget, add a task or suggest ideas.",
      changes: [],
    };
  },
  async ideas(brief) {
    return { ideas: templateBlueprint(brief).ideas, sources: [] };
  },
};
