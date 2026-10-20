interface ThrottleOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

export type ThrottleResult = { ok: true } | { ok: false; retryAfter: number };

/**
 * Fixed-window request limit per client. State is per server instance, which is enough to blunt
 * accidental loops and casual abuse; a shared store (Memorystore/Redis) would make it global.
 */
export function createThrottle({ limit, windowMs, now = Date.now }: ThrottleOptions) {
  const windows = new Map<string, { start: number; count: number }>();

  return {
    hit(key: string): ThrottleResult {
      const t = now();
      if (windows.size > 5_000) {
        for (const [k, w] of windows) if (t - w.start >= windowMs) windows.delete(k);
      }
      const w = windows.get(key);
      if (!w || t - w.start >= windowMs) {
        windows.set(key, { start: t, count: 1 });
        return { ok: true };
      }
      if (w.count < limit) {
        w.count += 1;
        return { ok: true };
      }
      return { ok: false, retryAfter: Math.ceil((w.start + windowMs - t) / 1000) };
    },
  };
}

/** Client address as reported by the hosting proxy (Cloud Run sets x-forwarded-for). */
export function ipOf(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
