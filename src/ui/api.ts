/** Result of calling one of our API routes from the browser. Errors are already human-readable. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

export async function postJson<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    return { ok: false, error: "", status: 0 };
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !data) return { ok: false, error: data?.error ?? "", status: res.status };
  return { ok: true, data };
}

/** Today's date on this device, YYYY-MM-DD (the server checks it is plausible). */
export function localToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
