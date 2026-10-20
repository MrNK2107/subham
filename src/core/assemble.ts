import type { z } from "zod";
import { allocate } from "./allocate";
import { functionDefaults, normaliseName } from "./presets";
import { addDays, dueDate } from "./schedule";
import {
  BlueprintBudgetSchema,
  BlueprintFunctionSchema,
  BlueprintRunSchema,
  BlueprintTaskSchema,
  BlueprintVendorSchema,
  IdeaDraftSchema,
  PlanSchema,
  type Blueprint,
  type Brief,
  type Plan,
} from "./types";

/** Budget lines that belong to the whole event use this function id. */
export const GENERAL = "general";

const LIMITS = { functions: 8, budget: 40, tasks: 30, runSheet: 40, vendors: 15, ideas: 10 };

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function keepValid<S extends z.ZodType>(value: unknown, schema: S, max: number): z.infer<S>[] {
  return list(value)
    .flatMap((item) => {
      const parsed = schema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    })
    .slice(0, max);
}

/**
 * Model output is untrusted. Keeps every item that validates on its own and drops the rest.
 * Returns null when no usable budget split is left.
 */
export function cleanBlueprint(raw: unknown): Blueprint | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;

  const vendors = list(src.vendors).map((v) =>
    typeof v === "object" && v !== null
      ? {
          ...v,
          questions: list((v as { questions?: unknown }).questions)
            .filter(
              (q): q is string => typeof q === "string" && q.trim().length > 0 && q.length <= 200,
            )
            .slice(0, 5),
        }
      : v,
  );

  const bp: Blueprint = {
    functions: keepValid(src.functions, BlueprintFunctionSchema, LIMITS.functions),
    budget: keepValid(src.budget, BlueprintBudgetSchema, LIMITS.budget),
    tasks: keepValid(src.tasks, BlueprintTaskSchema, LIMITS.tasks),
    runSheet: keepValid(src.runSheet, BlueprintRunSchema, LIMITS.runSheet),
    vendors: keepValid(vendors, BlueprintVendorSchema, LIMITS.vendors),
    ideas: keepValid(src.ideas, IdeaDraftSchema, LIMITS.ideas),
  };
  return bp.budget.length ? bp : null;
}

interface AssembleContext {
  id: string;
  today: string;
  now: Date;
}

/**
 * Turns a blueprint (percentages, day offsets) into a concrete plan: exact rupee allocations that
 * add up to the budget, and dates that fall between today and the event.
 */
export function assemblePlan(brief: Brief, bp: Blueprint, ctx: AssembleContext): Plan {
  const suggested = new Map(bp.functions.map((f) => [normaliseName(f.name), f]));
  const functions = brief.functions.map((name, i) => {
    const plan = suggested.get(normaliseName(name)) ?? functionDefaults(name);
    const date = addDays(brief.date, plan.dayOffset);
    return {
      id: `f${i + 1}`,
      name,
      date: date < ctx.today ? (ctx.today < brief.date ? ctx.today : brief.date) : date,
      start: plan.start,
    };
  });

  const fnByName = new Map(functions.map((f) => [normaliseName(f.name), f]));
  const fnId = (name?: string) => (name ? fnByName.get(normaliseName(name))?.id : undefined);
  const fnDate = (id?: string) => functions.find((f) => f.id === id)?.date ?? brief.date;

  // Merge lines that share a function and category, then allocate exact rupees.
  const lines = new Map<string, { fnId: string; category: string; percent: number }>();
  for (const item of bp.budget) {
    const owner = fnId(item.fn) ?? GENERAL;
    const key = `${owner}|${normaliseName(item.category)}`;
    const line = lines.get(key);
    if (line) line.percent += item.percent;
    else lines.set(key, { fnId: owner, category: item.category, percent: item.percent });
  }
  const amounts = allocate(
    brief.budget,
    [...lines].map(([key, l]) => ({ key, weight: l.percent })),
  );
  const budget = [...lines].map(([key, l], i) => ({
    id: `b${i + 1}`,
    fnId: l.fnId,
    category: l.category,
    allocated: amounts.get(key) ?? 0,
    spent: 0,
  }));

  const tasks = bp.tasks
    .map((t) => {
      const owner = fnId(t.fn);
      return { title: t.title, due: dueDate(fnDate(owner), ctx.today, t.daysBefore), fnId: owner };
    })
    .sort((a, b) => a.due.localeCompare(b.due))
    .map((t, i) => ({ id: `t${i + 1}`, done: false, ...t }));

  const runSheet = bp.runSheet
    .flatMap((r) => {
      const owner = fnId(r.fn);
      return owner ? [{ fnId: owner, time: r.time, activity: r.activity }] : [];
    })
    .sort((a, b) => fnDate(a.fnId).localeCompare(fnDate(b.fnId)) || a.time.localeCompare(b.time))
    .map((r, i) => ({ id: `r${i + 1}`, ...r }));

  const stamp = ctx.now.toISOString();
  return PlanSchema.parse({
    id: ctx.id,
    brief,
    functions,
    budget,
    tasks,
    runSheet,
    vendors: bp.vendors.map((v, i) => ({
      id: `v${i + 1}`,
      category: v.category,
      fnId: fnId(v.fn),
      status: "todo",
      questions: v.questions,
    })),
    guests: [],
    ideas: bp.ideas.map((idea, i) => ({ id: `i${i + 1}`, ...idea })),
    createdAt: stamp,
    updatedAt: stamp,
  });
}
