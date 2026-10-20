import { BriefSchema, type Brief } from "@/core/types";

const KEY = "subham.prefill";

/**
 * Hands what the AI understood from the landing page to the wizard. Uses sessionStorage, so
 * the description never appears in a URL or server log.
 */
export function savePrefill(patch: Partial<Brief>): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(patch));
  } catch {
    // Storage blocked: the wizard simply starts empty.
  }
}

/** Reads and clears the hand-off. Fields that don't validate are dropped. */
export function takePrefill(): Partial<Brief> | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = BriefSchema.partial().safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
