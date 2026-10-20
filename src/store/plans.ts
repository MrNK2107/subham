"use client";

import { useSyncExternalStore } from "react";
import type { Plan } from "@/core/types";
import { loadPlans, serverSnapshot, subscribe } from "./local";

/** All plans on this device, kept in sync across tabs. Empty during server rendering. */
export function usePlans(): Plan[] {
  return useSyncExternalStore(subscribe, loadPlans, serverSnapshot);
}

/** One plan, or undefined while loading or if it isn't on this device. */
export function usePlan(id: string): Plan | undefined {
  return usePlans().find((p) => p.id === id);
}

/** False during server rendering and hydration, true once browser storage can be read. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
