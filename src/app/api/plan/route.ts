import { AiUnavailable, pickProvider } from "@/ai/provider";
import { assemblePlan } from "@/core/assemble";
import { trustedToday } from "@/core/schedule";
import { templateBlueprint } from "@/core/templates";
import type { Blueprint } from "@/core/types";
import { fail, readBody, reply, tooMany } from "@/server/guard";
import { createMemo } from "@/server/memo";
import { PlanRequest } from "@/server/schemas";
import { createThrottle, ipOf } from "@/server/throttle";

export const maxDuration = 120;

const throttle = createThrottle({ limit: 6, windowMs: 60_000 });
const drafts = createMemo<{ bp: Blueprint; source: string }>({ ttlMs: 30 * 60_000, max: 200 });

/** Drafts a plan with AI; if no model answers, a curated template keeps the person moving. */
export async function POST(req: Request) {
  const allowed = throttle.hit(ipOf(req));
  if (!allowed.ok) return tooMany(allowed.retryAfter);

  const body = await readBody(req, PlanRequest);
  if (!body.ok) return body.res;
  const { brief } = body.data;
  const today = trustedToday(body.data.today);

  const key = `${today}|${JSON.stringify(brief)}`;
  let draft = drafts.get(key);
  let notice: string | undefined;

  if (!draft) {
    const ai = pickProvider();
    if (!ai) {
      draft = { bp: templateBlueprint(brief), source: "template" };
      notice = "AI drafting isn't set up here, so this is a starter plan.";
    } else {
      try {
        draft = { bp: await ai.blueprint(brief, today), source: ai.name };
        drafts.set(key, draft);
      } catch (error) {
        if (!(error instanceof AiUnavailable)) throw error;
        draft = { bp: templateBlueprint(brief), source: "template" };
        notice = `${error.message} Here's a starter plan meanwhile.`;
      }
    }
  }

  try {
    const plan = assemblePlan(brief, draft.bp, { id: crypto.randomUUID(), today, now: new Date() });
    return reply({ plan, source: draft.source, notice });
  } catch {
    return fail(422, "We couldn't build this plan. Please check the date and budget.");
  }
}
