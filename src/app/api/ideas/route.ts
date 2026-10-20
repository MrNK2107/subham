import { AiUnavailable, pickProvider, type Source } from "@/ai/provider";
import { templateBlueprint } from "@/core/templates";
import type { IdeaDraft } from "@/core/types";
import { readBody, reply, tooMany } from "@/server/guard";
import { createMemo } from "@/server/memo";
import { IdeasRequest } from "@/server/schemas";
import { createThrottle, ipOf } from "@/server/throttle";

export const maxDuration = 60;

const throttle = createThrottle({ limit: 6, windowMs: 60_000 });
const cache = createMemo<{ ideas: IdeaDraft[]; sources: Source[]; source: string }>({
  ttlMs: 30 * 60_000,
  max: 200,
});

/** Fresh, local ideas (web-grounded on Gemini). Falls back to curated ideas. */
export async function POST(req: Request) {
  const allowed = throttle.hit(ipOf(req));
  if (!allowed.ok) return tooMany(allowed.retryAfter);

  const body = await readBody(req, IdeasRequest);
  if (!body.ok) return body.res;
  const { brief } = body.data;

  const key = JSON.stringify(brief);
  const hit = cache.get(key);
  if (hit) return reply(hit);

  const ai = pickProvider();
  if (ai) {
    try {
      const result = { ...(await ai.ideas(brief)), source: ai.name };
      cache.set(key, result);
      return reply(result);
    } catch (error) {
      if (!(error instanceof AiUnavailable)) throw error;
    }
  }
  return reply({ ideas: templateBlueprint(brief).ideas, sources: [], source: "template" });
}
