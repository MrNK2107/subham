import { formatINR } from "./money";
import { todayInIndia } from "./schedule";
import { PlanSchema, type Change, type Plan } from "./types";

/** A change that cannot apply to this plan. The message is safe to show. */
export class ChangeError extends Error {
  override name = "ChangeError";
}

/** Next free id with this prefix, e.g. t15 after t1..t14. */
export function nextId(prefix: string, items: { id: string }[]): string {
  const used = items
    .map((item) => (item.id.startsWith(prefix) ? Number(item.id.slice(prefix.length)) : 0))
    .filter(Number.isFinite);
  return `${prefix}${Math.max(0, ...used) + 1}`;
}

function find<T extends { id: string }>(items: T[], id: string, what: string): T {
  const item = items.find((i) => i.id === id);
  if (!item) throw new ChangeError(`There is no ${what} with id "${id}" in this plan.`);
  return item;
}

const lastDate = (plan: Plan) =>
  plan.functions.reduce((max, f) => (f.date > max ? f.date : max), plan.brief.date);

/**
 * Applies one change and returns a new plan; the original is untouched. Throws ChangeError for
 * anything that doesn't fit the plan, then re-validates the whole result.
 */
export function applyChange(plan: Plan, change: Change, now = new Date()): Plan {
  const next: Plan = structuredClone(plan);

  switch (change.op) {
    case "moveBudget": {
      if (change.from === change.to) throw new ChangeError("Pick two different budget lines.");
      const from = find(next.budget, change.from, "budget line");
      const to = find(next.budget, change.to, "budget line");
      const room = Math.max(0, from.allocated - from.spent);
      if (change.amount > room) {
        throw new ChangeError(`${from.category} has only ${formatINR(room)} unspent to move.`);
      }
      from.allocated -= change.amount;
      to.allocated += change.amount;
      break;
    }
    case "logSpend":
      find(next.budget, change.line, "budget line").spent += change.amount;
      break;
    case "addTask": {
      const today = todayInIndia(now);
      if (change.due < today) throw new ChangeError("A new task can't be due in the past.");
      if (change.due > lastDate(plan)) {
        throw new ChangeError("A new task must be due on or before the last function.");
      }
      if (change.fnId) find(next.functions, change.fnId, "function");
      next.tasks.push({
        id: nextId("t", next.tasks),
        title: change.title,
        due: change.due,
        done: false,
        fnId: change.fnId,
      });
      next.tasks.sort((a, b) => a.due.localeCompare(b.due));
      break;
    }
    case "toggleTask": {
      const task = find(next.tasks, change.id, "task");
      task.done = !task.done;
      break;
    }
    case "setVendorStatus": {
      const vendor = find(next.vendors, change.id, "vendor");
      vendor.status = change.status;
      if (change.quote !== undefined) vendor.quote = change.quote;
      break;
    }
    case "addVendor":
      next.vendors.push({
        id: nextId("v", next.vendors),
        category: change.category,
        status: "todo",
        questions: change.questions,
      });
      break;
    case "addIdea":
      next.ideas.push({
        id: nextId("i", next.ideas),
        kind: change.kind,
        title: change.title,
        description: change.description,
      });
      break;
  }

  next.updatedAt = now.toISOString();
  const checked = PlanSchema.safeParse(next);
  if (!checked.success) throw new ChangeError("That change would make the plan invalid.");
  return checked.data;
}

export interface ChangeDescription {
  /** Message key in the i18n dictionaries. */
  key: `change.${Change["op"]}`;
  vars: Record<string, string>;
}

/** A plain-words description of a proposed change, for the approval card. */
export function describeChange(plan: Plan, change: Change): ChangeDescription {
  const line = (id: string) => plan.budget.find((l) => l.id === id)?.category ?? id;
  switch (change.op) {
    case "moveBudget":
      return {
        key: "change.moveBudget",
        vars: { amount: formatINR(change.amount), from: line(change.from), to: line(change.to) },
      };
    case "logSpend":
      return {
        key: "change.logSpend",
        vars: { amount: formatINR(change.amount), line: line(change.line) },
      };
    case "addTask":
      return { key: "change.addTask", vars: { title: change.title, due: change.due } };
    case "toggleTask":
      return {
        key: "change.toggleTask",
        vars: { title: plan.tasks.find((t) => t.id === change.id)?.title ?? change.id },
      };
    case "setVendorStatus":
      return {
        key: "change.setVendorStatus",
        vars: {
          vendor: plan.vendors.find((v) => v.id === change.id)?.category ?? change.id,
          status: change.status,
          quote: change.quote === undefined ? "" : formatINR(change.quote),
        },
      };
    case "addVendor":
      return { key: "change.addVendor", vars: { category: change.category } };
    case "addIdea":
      return { key: "change.addIdea", vars: { title: change.title } };
  }
}
