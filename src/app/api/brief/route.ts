import { AiUnavailable, pickProvider } from "@/ai/provider";
import { trustedToday } from "@/core/schedule";
import { fail, readBody, reply, tooMany } from "@/server/guard";
import { BriefRequest } from "@/server/schemas";
import { createThrottle, ipOf } from "@/server/throttle";

export const maxDuration = 60;

const throttle = createThrottle({ limit: 10, windowMs: 60_000 });

/** Turns a one-line description, in any language, into wizard fields. */
export async function POST(req: Request) {
  const allowed = throttle.hit(ipOf(req));
  if (!allowed.ok) return tooMany(allowed.retryAfter);

  const body = await readBody(req, BriefRequest);
  if (!body.ok) return body.res;

  const ai = pickProvider();
  if (!ai) return fail(503, "Quick-fill needs AI, which isn't set up here. Please use the form.");
  try {
    return reply({ brief: await ai.extractBrief(body.data.text, trustedToday(body.data.today)) });
  } catch (error) {
    if (!(error instanceof AiUnavailable)) throw error;
    return fail(503, error.message);
  }
}
