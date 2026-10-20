import type { z } from "zod";

const NO_STORE = { "cache-control": "no-store" };

export function reply(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

/** An error response whose message is safe to show to the person. */
export function fail(status: number, message: string): Response {
  return reply({ error: message }, status);
}

export function tooMany(retryAfter: number): Response {
  const res = fail(429, "You're going a little fast. Please wait a moment and try again.");
  res.headers.set("retry-after", String(retryAfter));
  return res;
}

export type BodyResult<T> = { ok: true; data: T } | { ok: false; res: Response };

/** Checks content type and size, parses JSON and validates it before any work is done. */
export async function readBody<S extends z.ZodType>(
  req: Request,
  schema: S,
  maxBytes = 64_000,
): Promise<BodyResult<z.infer<S>>> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false, res: fail(415, "Please send JSON.") };
  }
  if (Number(req.headers.get("content-length") ?? 0) > maxBytes) {
    return { ok: false, res: fail(413, "That request is too large.") };
  }
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    return { ok: false, res: fail(413, "That request is too large.") };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, res: fail(400, "The request body isn't valid JSON.") };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      res: fail(400, `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid"}`),
    };
  }
  return { ok: true, data: parsed.data };
}
