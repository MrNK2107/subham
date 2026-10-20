import { PlanSchema, type Plan } from "@/core/types";

const KEY = "subham.plans";
const EMPTY: Plan[] = [];
const listeners = new Set<() => void>();

/** Where saved plans are mirrored when someone is signed in (Firestore). */
export interface SyncTarget {
  save(plan: Plan): void;
  remove(id: string): void;
}
let sync: SyncTarget | null = null;

let cache: { raw: string | null; plans: Plan[] } = { raw: null, plans: EMPTY };

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * All plans on this device, newest first. Stored data is validated: anything tampered with or
 * from an older format is skipped. Returns the same array until storage changes.
 */
export function loadPlans(): Plan[] {
  const raw = read();
  if (raw === cache.raw) return cache.plans;
  let parsed: unknown = [];
  try {
    parsed = JSON.parse(raw ?? "[]");
  } catch {
    parsed = [];
  }
  const plans = (Array.isArray(parsed) ? parsed : [])
    .flatMap((item) => {
      const plan = PlanSchema.safeParse(item);
      return plan.success ? [plan.data] : [];
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  cache = { raw, plans };
  return plans;
}

export const getPlan = (id: string) => loadPlans().find((p) => p.id === id);

function write(plans: Plan[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(plans));
  } catch {
    // Storage full or blocked: the plan still lives in memory for this visit.
    cache = { raw: null, plans };
  }
  listeners.forEach((l) => l());
}

/** Saves locally; `mirror: false` is used when the change came from the cloud already. */
export function savePlan(plan: Plan, { mirror = true } = {}): void {
  write([plan, ...loadPlans().filter((p) => p.id !== plan.id)]);
  if (mirror) sync?.save(plan);
}

export function deletePlan(id: string): void {
  write(loadPlans().filter((p) => p.id !== id));
  sync?.remove(id);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setSyncTarget(target: SyncTarget | null): void {
  sync = target;
}

export const serverSnapshot = () => EMPTY;
