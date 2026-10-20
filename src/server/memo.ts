interface MemoOptions {
  ttlMs: number;
  max: number;
  now?: () => number;
}

/** A small in-memory cache with expiry, used to avoid paying twice for identical AI requests. */
export function createMemo<T>({ ttlMs, max, now = Date.now }: MemoOptions) {
  const entries = new Map<string, { value: T; expires: number }>();

  return {
    get(key: string): T | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expires <= now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T): void {
      entries.delete(key);
      entries.set(key, { value, expires: now() + ttlMs });
      while (entries.size > max) entries.delete(entries.keys().next().value as string);
    },
  };
}
